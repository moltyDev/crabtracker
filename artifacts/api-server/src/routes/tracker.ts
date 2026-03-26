import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { trackedWalletsTable, walletEventsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

// Known DexScreener boost wallet addresses (approximate - these are known destination addresses)
const DEX_BOOST_ADDRESSES = new Set([
  "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM",
  "CebN5WGQ4jvEPvsVU4EoHEpgznyzmiqBNwHFVMjSm3xR",
  "7o5ypNM65NJe7jAcKjvQMQyPRkYxMtVzpidnr5PxLRe",
]);

// Known PumpFun fee collection addresses
const PUMPFUN_FEE_ADDRESSES = new Set([
  "CebN5WGQ4jvEPvsVU4EoHEpgznyzmiqBNwHFVMjSm3xR",
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
]);

// GET /api/tracker/wallet
router.get("/wallet", async (req, res) => {
  try {
    const wallet = await db
      .select()
      .from(trackedWalletsTable)
      .where(eq(trackedWalletsTable.isActive, true))
      .orderBy(desc(trackedWalletsTable.createdAt))
      .limit(1);

    if (!wallet.length) {
      res.json({ address: null, label: null, isTracking: false, lastChecked: null });
      return;
    }

    const w = wallet[0];
    res.json({
      address: w.address,
      label: w.label,
      isTracking: w.isActive,
      lastChecked: w.lastChecked?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get tracked wallet");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tracker/wallet
router.post("/wallet", async (req, res) => {
  try {
    const { address, label } = req.body as { address: string; label?: string };

    if (!address || typeof address !== "string" || address.length < 32) {
      res.status(400).json({ error: "Invalid wallet address" });
      return;
    }

    // Deactivate all previous wallets
    await db
      .update(trackedWalletsTable)
      .set({ isActive: false })
      .where(eq(trackedWalletsTable.isActive, true));

    // Upsert new wallet
    const existing = await db
      .select()
      .from(trackedWalletsTable)
      .where(eq(trackedWalletsTable.address, address))
      .limit(1);

    let wallet;
    if (existing.length > 0) {
      const updated = await db
        .update(trackedWalletsTable)
        .set({ isActive: true, label: label ?? existing[0].label, lastChecked: new Date() })
        .where(eq(trackedWalletsTable.address, address))
        .returning();
      wallet = updated[0];
    } else {
      const inserted = await db
        .insert(trackedWalletsTable)
        .values({ address, label: label ?? null, isActive: true, lastChecked: new Date() })
        .returning();
      wallet = inserted[0];
    }

    res.json({
      address: wallet.address,
      label: wallet.label,
      isTracking: wallet.isActive,
      lastChecked: wallet.lastChecked?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to set tracked wallet");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tracker/events
router.get("/events", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const typeFilter = req.query.type as string | undefined;

    const wallet = await db
      .select()
      .from(trackedWalletsTable)
      .where(eq(trackedWalletsTable.isActive, true))
      .limit(1);

    if (!wallet.length) {
      res.json({ events: [], total: 0 });
      return;
    }

    const walletAddr = wallet[0].address;

    const whereConditions = typeFilter && typeFilter !== "all"
      ? and(
          eq(walletEventsTable.walletAddress, walletAddr),
          eq(walletEventsTable.type, typeFilter)
        )
      : eq(walletEventsTable.walletAddress, walletAddr);

    const events = await db
      .select()
      .from(walletEventsTable)
      .where(whereConditions)
      .orderBy(desc(walletEventsTable.timestamp))
      .limit(limit);

    const allEvents = await db
      .select()
      .from(walletEventsTable)
      .where(eq(walletEventsTable.walletAddress, walletAddr));

    res.json({
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        txHash: e.txHash,
        amount: e.amount,
        amountUsd: e.amountUsd,
        description: e.description,
        category: e.category,
        timestamp: e.timestamp.toISOString(),
        walletAddress: e.walletAddress,
      })),
      total: allEvents.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get events");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tracker/stats
router.get("/stats", async (req, res) => {
  try {
    const wallet = await db
      .select()
      .from(trackedWalletsTable)
      .where(eq(trackedWalletsTable.isActive, true))
      .limit(1);

    if (!wallet.length) {
      res.json({
        totalFeesClaimed: 0,
        totalDexBoosts: 0,
        totalBoostSpend: 0,
        totalTransfers: 0,
        lastActivity: null,
        walletBalance: null,
      });
      return;
    }

    const walletAddr = wallet[0].address;
    const events = await db
      .select()
      .from(walletEventsTable)
      .where(eq(walletEventsTable.walletAddress, walletAddr));

    const feeClaims = events.filter((e) => e.type === "fee_claim");
    const dexBoosts = events.filter((e) => e.type === "dex_boost");
    const transfers = events.filter((e) => e.type === "transfer");

    const totalFeesClaimed = feeClaims.reduce((sum, e) => sum + e.amount, 0);
    const totalBoostSpend = dexBoosts.reduce((sum, e) => sum + e.amount, 0);

    const allSorted = [...events].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    res.json({
      totalFeesClaimed: Math.round(totalFeesClaimed * 1000) / 1000,
      totalDexBoosts: dexBoosts.length,
      totalBoostSpend: Math.round(totalBoostSpend * 1000) / 1000,
      totalTransfers: transfers.length,
      lastActivity: allSorted[0]?.timestamp.toISOString() ?? null,
      walletBalance: null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
