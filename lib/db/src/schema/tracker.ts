import { pgTable, serial, text, real, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trackedWalletsTable = pgTable("tracked_wallets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  label: text("label"),
  isActive: boolean("is_active").default(true).notNull(),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletEventsTable = pgTable("wallet_events", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  type: text("type").notNull(), // 'fee_claim' | 'dex_boost' | 'transfer'
  txHash: text("tx_hash").notNull().unique(),
  amount: real("amount").notNull(),
  amountUsd: real("amount_usd"),
  description: text("description").notNull(),
  category: text("category"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrackedWalletSchema = createInsertSchema(trackedWalletsTable).omit({ id: true, createdAt: true });
export const insertWalletEventSchema = createInsertSchema(walletEventsTable).omit({ id: true, createdAt: true });

export type TrackedWallet = typeof trackedWalletsTable.$inferSelect;
export type InsertTrackedWallet = z.infer<typeof insertTrackedWalletSchema>;
export type WalletEvent = typeof walletEventsTable.$inferSelect;
export type InsertWalletEvent = z.infer<typeof insertWalletEventSchema>;
