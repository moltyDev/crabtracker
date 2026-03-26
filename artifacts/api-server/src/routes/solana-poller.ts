import { db } from "@workspace/db";
import { trackedWalletsTable, walletEventsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "./logger-singleton.js";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const POLL_INTERVAL_MS = 15_000;

// Known DexScreener boost wallet addresses on Solana
const DEX_BOOST_ADDRESSES = new Set([
  "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM",
  "CebN5WGQ4jvEPvsVU4EoHEpgznyzmiqBNwHFVMjSm3xR",
  "7o5ypNM65NJe7jAcKjvQMQyPRkYxMtVzpidnr5PxLRe",
  "G2YxRa6wt1qePMwfJzdXZG62ej4qaTC7YURzuh2Lwd3t",
]);

// Known PumpFun addresses (fee vault, bonding curve manager)
const PUMPFUN_ADDRESSES = new Set([
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1",
  "CebN5WGQ4jvEPvsVU4EoHEpgznyzmiqBNwHFVMjSm3xR",
  "4wTV81vy1pcP7GmYbJy4Tj79gUFHE2dJx8m6Dewy5jZu",
]);

async function solanaRpc(method: string, params: unknown[]) {
  const resp = await fetch(SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = (await resp.json()) as { result?: unknown; error?: unknown };
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result;
}

interface SolanaSignature {
  signature: string;
  blockTime?: number;
}

interface SolanaTransaction {
  transaction?: {
    message?: {
      accountKeys?: string[];
    };
  };
  meta?: {
    preBalances?: number[];
    postBalances?: number[];
    err?: unknown;
    logMessages?: string[];
  };
  blockTime?: number;
}

function classifyTransaction(
  tx: SolanaTransaction,
  walletAddress: string
): { type: "fee_claim" | "dex_boost" | "transfer" | null; description: string; category: string | null; amount: number } {
  const accounts = tx.transaction?.message?.accountKeys ?? [];
  const preBalances = tx.meta?.preBalances ?? [];
  const postBalances = tx.meta?.postBalances ?? [];
  const logs = tx.meta?.logMessages ?? [];

  const walletIdx = accounts.indexOf(walletAddress);
  if (walletIdx === -1) return { type: null, description: "", category: null, amount: 0 };

  const preBalance = preBalances[walletIdx] ?? 0;
  const postBalance = postBalances[walletIdx] ?? 0;
  const netChange = (postBalance - preBalance) / 1e9;

  // Check if any account is a PumpFun address and wallet received SOL (fee claim)
  const involvesPumpFun = accounts.some((a) => PUMPFUN_ADDRESSES.has(a));
  const involvesLogs = logs.some((l) =>
    l.toLowerCase().includes("withdraw") || l.toLowerCase().includes("collect") || l.toLowerCase().includes("claim")
  );

  if ((involvesPumpFun || involvesLogs) && netChange > 0) {
    return {
      type: "fee_claim",
      description: `Dev claimed ${netChange.toFixed(4)} SOL in PumpFun creator fees — being used for marketing/operations`,
      category: "marketing",
      amount: netChange,
    };
  }

  // Check if any output account is a DexScreener boost address
  const isDexBoost = accounts.some((a, idx) => {
    if (!DEX_BOOST_ADDRESSES.has(a)) return false;
    const sent = (preBalances[idx] ?? 0) - (postBalances[idx] ?? 0);
    return sent > 0;
  });

  if (isDexBoost && netChange < 0) {
    const spent = Math.abs(netChange);
    return {
      type: "dex_boost",
      description: `Dev bought DexScreener boost for ${spent.toFixed(4)} SOL`,
      category: "marketing",
      amount: spent,
    };
  }

  // Generic transfer
  if (Math.abs(netChange) > 0.0001) {
    const isOut = netChange < 0;
    return {
      type: "transfer",
      description: `${isOut ? "Sent" : "Received"} ${Math.abs(netChange).toFixed(4)} SOL`,
      category: null,
      amount: Math.abs(netChange),
    };
  }

  return { type: null, description: "", category: null, amount: 0 };
}

export async function pollWallet(walletAddress: string) {
  try {
    // Get recent signatures
    const sigs = (await solanaRpc("getSignaturesForAddress", [
      walletAddress,
      { limit: 20 },
    ])) as SolanaSignature[];

    if (!sigs || sigs.length === 0) return;

    // Get existing tx hashes to avoid duplicates
    const existingEvents = await db
      .select({ txHash: walletEventsTable.txHash })
      .from(walletEventsTable)
      .where(eq(walletEventsTable.walletAddress, walletAddress));
    const existingHashes = new Set(existingEvents.map((e) => e.txHash));

    for (const sig of sigs) {
      if (existingHashes.has(sig.signature)) continue;

      try {
        const tx = (await solanaRpc("getTransaction", [
          sig.signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
        ])) as SolanaTransaction | null;

        if (!tx || tx.meta?.err) continue;

        const classification = classifyTransaction(tx, walletAddress);
        if (!classification.type || classification.amount <= 0) continue;

        const timestamp = sig.blockTime
          ? new Date(sig.blockTime * 1000)
          : new Date();

        await db.insert(walletEventsTable).values({
          walletAddress,
          type: classification.type,
          txHash: sig.signature,
          amount: classification.amount,
          amountUsd: null,
          description: classification.description,
          category: classification.category,
          timestamp,
        }).onConflictDoNothing();

        logger.info({ type: classification.type, txHash: sig.signature }, "New event detected");
      } catch (txErr) {
        logger.warn({ err: txErr, sig: sig.signature }, "Failed to process transaction");
      }

      // Rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }

    // Update last checked
    await db
      .update(trackedWalletsTable)
      .set({ lastChecked: new Date() })
      .where(eq(trackedWalletsTable.address, walletAddress));
  } catch (err) {
    logger.error({ err, walletAddress }, "Failed to poll wallet");
  }
}

let pollerInterval: ReturnType<typeof setInterval> | null = null;

export function startPoller() {
  if (pollerInterval) return;

  const poll = async () => {
    try {
      const activeWallets = await db
        .select()
        .from(trackedWalletsTable)
        .where(eq(trackedWalletsTable.isActive, true));

      for (const wallet of activeWallets) {
        await pollWallet(wallet.address);
      }
    } catch (err) {
      logger.error({ err }, "Poller iteration failed");
    }
  };

  // Initial poll
  poll();
  pollerInterval = setInterval(poll, POLL_INTERVAL_MS);
  logger.info({ interval: POLL_INTERVAL_MS }, "Solana wallet poller started");
}

export function stopPoller() {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
}
