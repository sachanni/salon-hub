import type { Express, Response } from "express";
import { db } from "../db";
import { userWallets, walletTransactions, users, customerSavedCards } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export function registerWalletRoutes(app: Express) {
  app.get("/api/mobile/wallet", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      let wallet = await db.query.userWallets.findFirst({
        where: eq(userWallets.userId, userId),
      });

      if (!wallet) {
        const [newWallet] = await db.insert(userWallets).values({
          userId,
          balanceInPaisa: 0,
          lifetimeEarnedInPaisa: 0,
          lifetimeSpentInPaisa: 0,
        }).returning();
        wallet = newWallet;
      }

      res.json({
        success: true,
        wallet: {
          id: wallet.id,
          balance: wallet.balanceInPaisa,
          lifetimeEarned: wallet.lifetimeEarnedInPaisa,
          lifetimeSpent: wallet.lifetimeSpentInPaisa,
        },
      });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  app.get("/api/mobile/wallet/transactions", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await db.query.walletTransactions.findMany({
        where: eq(walletTransactions.userId, userId),
        orderBy: [desc(walletTransactions.createdAt)],
        limit,
        offset,
      });

      res.json({
        success: true,
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amountInPaisa,
          reason: t.reason,
          bookingId: t.bookingId,
          offerId: t.offerId,
          createdAt: t.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/mobile/wallet/add-money/create-order", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      if (!razorpay) {
        return res.status(503).json({ error: "Payment service unavailable" });
      }

      const userId = req.user.id;
      const { amountInPaisa } = req.body;

      if (!amountInPaisa || amountInPaisa < 100) {
        return res.status(400).json({ error: "Minimum amount is ₹1" });
      }

      if (amountInPaisa > 1000000) {
        return res.status(400).json({ error: "Maximum amount is ₹10,000" });
      }

      const order = await razorpay.orders.create({
        amount: amountInPaisa,
        currency: "INR",
        receipt: `wallet_${userId}_${Date.now()}`,
        notes: {
          userId,
          type: "wallet_topup",
        },
      });

      res.json({
        success: true,
        orderId: order.id,
        amount: amountInPaisa,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Error creating wallet order:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  app.post("/api/mobile/wallet/add-money/verify", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amountInPaisa } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment details" });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      let wallet = await db.query.userWallets.findFirst({
        where: eq(userWallets.userId, userId),
      });

      if (!wallet) {
        const [newWallet] = await db.insert(userWallets).values({
          userId,
          balanceInPaisa: 0,
          lifetimeEarnedInPaisa: 0,
          lifetimeSpentInPaisa: 0,
        }).returning();
        wallet = newWallet;
      }

      await db.update(userWallets)
        .set({
          balanceInPaisa: wallet.balanceInPaisa + amountInPaisa,
          lifetimeEarnedInPaisa: wallet.lifetimeEarnedInPaisa + amountInPaisa,
          updatedAt: new Date(),
        })
        .where(eq(userWallets.id, wallet.id));

      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        userId,
        type: "credit",
        amountInPaisa,
        reason: "wallet_topup",
      });

      const updatedWallet = await db.query.userWallets.findFirst({
        where: eq(userWallets.userId, userId),
      });

      res.json({
        success: true,
        message: "Money added successfully",
        wallet: {
          balance: updatedWallet?.balanceInPaisa || 0,
          lifetimeEarned: updatedWallet?.lifetimeEarnedInPaisa || 0,
        },
      });
    } catch (error) {
      console.error("Error verifying wallet payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.post("/api/mobile/wallet/use", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { amountInPaisa, bookingId, reason } = req.body;

      if (!amountInPaisa || amountInPaisa < 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const wallet = await db.query.userWallets.findFirst({
        where: eq(userWallets.userId, userId),
      });

      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      if (wallet.balanceInPaisa < amountInPaisa) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }

      await db.update(userWallets)
        .set({
          balanceInPaisa: wallet.balanceInPaisa - amountInPaisa,
          lifetimeSpentInPaisa: wallet.lifetimeSpentInPaisa + amountInPaisa,
          updatedAt: new Date(),
        })
        .where(eq(userWallets.id, wallet.id));

      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        userId,
        type: "debit",
        amountInPaisa,
        reason: reason || "payment",
        bookingId,
      });

      const updatedWallet = await db.query.userWallets.findFirst({
        where: eq(userWallets.userId, userId),
      });

      res.json({
        success: true,
        message: "Wallet payment successful",
        wallet: {
          balance: updatedWallet?.balanceInPaisa || 0,
        },
      });
    } catch (error) {
      console.error("Error using wallet:", error);
      res.status(500).json({ error: "Failed to process wallet payment" });
    }
  });

  // ============ Payment Methods (Saved Cards) ============

  // Get user's saved payment methods
  app.get("/api/mobile/payment-methods", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const cards = await db.query.customerSavedCards.findMany({
        where: and(
          eq(customerSavedCards.customerId, userId),
          eq(customerSavedCards.isActive, 1)
        ),
        orderBy: [desc(customerSavedCards.createdAt)],
      });

      res.json({
        success: true,
        cards: cards.map(card => ({
          id: card.id,
          last4: card.cardLast4,
          cardType: card.cardNetwork || card.cardType || 'card',
          expiryMonth: String(card.expiryMonth || '').padStart(2, '0'),
          expiryYear: String(card.expiryYear || '').slice(-2),
          cardholderName: card.nickname || '',
          isDefault: card.isDefault === 1,
          createdAt: card.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching saved cards:", error);
      res.status(500).json({ error: "Failed to fetch saved cards" });
    }
  });

  // Delete a saved payment method
  app.delete("/api/mobile/payment-methods/:cardId", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { cardId } = req.params;

      const card = await db.query.customerSavedCards.findFirst({
        where: and(
          eq(customerSavedCards.id, cardId),
          eq(customerSavedCards.customerId, userId)
        ),
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      // Soft delete by setting isActive to 0
      await db.update(customerSavedCards)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(customerSavedCards.id, cardId));

      res.json({
        success: true,
        message: "Card removed successfully",
      });
    } catch (error) {
      console.error("Error deleting saved card:", error);
      res.status(500).json({ error: "Failed to remove card" });
    }
  });

  // Set a card as default
  app.post("/api/mobile/payment-methods/:cardId/set-default", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { cardId } = req.params;

      const card = await db.query.customerSavedCards.findFirst({
        where: and(
          eq(customerSavedCards.id, cardId),
          eq(customerSavedCards.customerId, userId),
          eq(customerSavedCards.isActive, 1)
        ),
      });

      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      // Remove default from all other cards
      await db.update(customerSavedCards)
        .set({ isDefault: 0, updatedAt: new Date() })
        .where(and(
          eq(customerSavedCards.customerId, userId),
          eq(customerSavedCards.isActive, 1)
        ));

      // Set this card as default
      await db.update(customerSavedCards)
        .set({ isDefault: 1, updatedAt: new Date() })
        .where(eq(customerSavedCards.id, cardId));

      res.json({
        success: true,
        message: "Default card updated",
      });
    } catch (error) {
      console.error("Error setting default card:", error);
      res.status(500).json({ error: "Failed to set default card" });
    }
  });

  console.log("✅ Mobile wallet routes registered");
}
