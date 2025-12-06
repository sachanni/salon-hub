import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { eq, and, sql, desc, gte, lte, or, isNull } from "drizzle-orm";
import * as schema from "@shared/schema";
import {
  giftCards,
  giftCardTransactions,
  giftCardDeliveries,
  giftCardTemplates,
  salons,
  users,
  bookings,
  purchaseGiftCardSchema,
  redeemGiftCardSchema,
  validateGiftCardSchema,
  insertGiftCardTemplateSchema,
  updateGiftCardTemplateSchema,
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import Razorpay from "razorpay";
import QRCode from "qrcode";
import { requireSalonAccess, type AuthenticatedRequest } from "../middleware/auth";
import { authenticateMobileUser } from "../middleware/authMobile";

interface MobileAuthRequest extends Request {
  user?: { id: string; email: string; roles: string[]; orgMemberships?: { orgId: string; orgRole: string; organization: { id: string; name: string; type: string; }; }[] };
}

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += "-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateQRCodeDataUrl(code: string): Promise<string> {
  try {
    return await QRCode.toDataURL(code, { width: 200, margin: 2 });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
}

export const publicGiftCardsRouter = Router();

publicGiftCardsRouter.get("/templates/:salonId", async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const templates = await db
      .select()
      .from(giftCardTemplates)
      .where(and(eq(giftCardTemplates.salonId, salonId), eq(giftCardTemplates.isActive, 1)))
      .orderBy(giftCardTemplates.sortOrder);

    res.json({ templates });
  } catch (error) {
    console.error("Error fetching gift card templates:", error);
    res.status(500).json({ error: "Failed to fetch gift card templates" });
  }
});

publicGiftCardsRouter.post("/validate", async (req: Request, res: Response) => {
  try {
    const validation = validateGiftCardSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", details: validation.error.errors });
    }

    const { code, salonId } = validation.data;

    const giftCard = await db
      .select({
        id: giftCards.id,
        code: giftCards.code,
        balancePaisa: giftCards.balancePaisa,
        originalValuePaisa: giftCards.originalValuePaisa,
        status: giftCards.status,
        expiresAt: giftCards.expiresAt,
        salonId: giftCards.salonId,
        salonName: salons.name,
      })
      .from(giftCards)
      .leftJoin(salons, eq(giftCards.salonId, salons.id))
      .where(eq(giftCards.code, code.toUpperCase()))
      .limit(1);

    if (giftCard.length === 0) {
      return res.status(404).json({ valid: false, error: "Gift card not found" });
    }

    const card = giftCard[0];

    if (card.status === "expired" || (card.expiresAt && new Date(card.expiresAt) < new Date())) {
      return res.json({ valid: false, error: "Gift card has expired", card: { ...card, status: "expired" } });
    }

    if (card.status === "cancelled" || card.status === "refunded") {
      return res.json({ valid: false, error: "Gift card is no longer valid", card });
    }

    if (card.status === "fully_redeemed" || card.balancePaisa === 0) {
      return res.json({ valid: false, error: "Gift card has been fully redeemed", card });
    }

    if (salonId && card.salonId !== salonId) {
      return res.json({ valid: false, error: "Gift card is not valid at this salon", card });
    }

    res.json({
      valid: true,
      card: {
        id: card.id,
        code: card.code,
        balancePaisa: card.balancePaisa,
        originalValuePaisa: card.originalValuePaisa,
        status: card.status,
        expiresAt: card.expiresAt,
        salonName: card.salonName,
      },
    });
  } catch (error) {
    console.error("Error validating gift card:", error);
    res.status(500).json({ error: "Failed to validate gift card" });
  }
});

publicGiftCardsRouter.post("/create-order", async (req: Request, res: Response) => {
  try {
    const validation = purchaseGiftCardSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", details: validation.error.errors });
    }

    const { salonId, valuePaisa, templateId, recipientName, recipientEmail, recipientPhone, personalMessage, deliveryMethod, scheduledDeliveryAt } = validation.data;

    const salon = await db.select().from(salons).where(eq(salons.id, salonId)).limit(1);
    if (salon.length === 0) {
      return res.status(404).json({ error: "Salon not found" });
    }

    if (templateId) {
      const template = await db.select().from(giftCardTemplates).where(eq(giftCardTemplates.id, templateId)).limit(1);
      if (template.length === 0) {
        return res.status(404).json({ error: "Template not found" });
      }
      const t = template[0];
      if (valuePaisa < t.minValuePaisa || valuePaisa > t.maxValuePaisa) {
        return res.status(400).json({ error: `Gift card value must be between ₹${t.minValuePaisa / 100} and ₹${t.maxValuePaisa / 100}` });
      }
    }

    const order = await razorpay.orders.create({
      amount: valuePaisa,
      currency: "INR",
      receipt: `gc_${Date.now()}`,
      notes: {
        type: "gift_card_purchase",
        salonId,
        valuePaisa: valuePaisa.toString(),
        templateId: templateId || "",
        recipientEmail: recipientEmail || "",
        recipientPhone: recipientPhone || "",
      },
    });

    let code = generateGiftCardCode();
    let existingCard = await db.select().from(giftCards).where(eq(giftCards.code, code)).limit(1);
    while (existingCard.length > 0) {
      code = generateGiftCardCode();
      existingCard = await db.select().from(giftCards).where(eq(giftCards.code, code)).limit(1);
    }

    const qrCodeUrl = await generateQRCodeDataUrl(code);

    const [newGiftCard] = await db
      .insert(giftCards)
      .values({
        salonId,
        code,
        originalValuePaisa: valuePaisa,
        balancePaisa: valuePaisa,
        status: "pending_payment",
        recipientName,
        recipientEmail,
        recipientPhone,
        personalMessage,
        templateId,
        scheduledDeliveryAt: scheduledDeliveryAt ? new Date(scheduledDeliveryAt) : null,
        razorpayOrderId: order.id,
        qrCodeUrl,
      })
      .returning();

    if (deliveryMethod && (recipientEmail || recipientPhone)) {
      await db.insert(giftCardDeliveries).values({
        giftCardId: newGiftCard.id,
        deliveryMethod,
        recipientEmail,
        recipientPhone,
        status: "pending",
        scheduledAt: scheduledDeliveryAt ? new Date(scheduledDeliveryAt) : null,
      });
    }

    res.json({
      orderId: order.id,
      giftCardId: newGiftCard.id,
      code: newGiftCard.code,
      amount: valuePaisa,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating gift card order:", error);
    res.status(500).json({ error: "Failed to create gift card order" });
  }
});

publicGiftCardsRouter.post("/verify-payment", async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, giftCardId, purchasedBy } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !giftCardId) {
      return res.status(400).json({ error: "Missing required payment verification fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const giftCard = await db.select().from(giftCards).where(eq(giftCards.id, giftCardId)).limit(1);
    if (giftCard.length === 0) {
      return res.status(404).json({ error: "Gift card not found" });
    }

    const card = giftCard[0];

    if (card.status !== "pending_payment") {
      return res.status(400).json({ error: "Gift card is not awaiting payment" });
    }

    await db
      .update(giftCards)
      .set({
        status: "active",
        purchasedBy,
        purchasedAt: new Date(),
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, giftCardId));

    await db.insert(giftCardTransactions).values({
      giftCardId,
      salonId: card.salonId,
      transactionType: "purchase",
      amountPaisa: card.originalValuePaisa,
      balanceBeforePaisa: 0,
      balanceAfterPaisa: card.originalValuePaisa,
      razorpayPaymentId: razorpay_payment_id,
      performedBy: purchasedBy || null,
      performedByType: purchasedBy ? "customer" : "system",
      status: "completed",
    });

    const deliveries = await db.select().from(giftCardDeliveries).where(eq(giftCardDeliveries.giftCardId, giftCardId));
    if (deliveries.length > 0) {
      const delivery = deliveries[0];
      if (!delivery.scheduledAt || delivery.scheduledAt <= new Date()) {
        await db
          .update(giftCardDeliveries)
          .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
          .where(eq(giftCardDeliveries.id, delivery.id));

        await db.update(giftCards).set({ deliveredAt: new Date(), updatedAt: new Date() }).where(eq(giftCards.id, giftCardId));
      }
    }

    const updatedCard = await db.select().from(giftCards).where(eq(giftCards.id, giftCardId)).limit(1);

    res.json({ success: true, giftCard: updatedCard[0] });
  } catch (error) {
    console.error("Error verifying gift card payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

router.get("/my-cards", authenticateMobileUser, async (req: MobileAuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const purchased = await db
      .select({
        id: giftCards.id,
        code: giftCards.code,
        balancePaisa: giftCards.balancePaisa,
        originalValuePaisa: giftCards.originalValuePaisa,
        status: giftCards.status,
        expiresAt: giftCards.expiresAt,
        recipientName: giftCards.recipientName,
        recipientEmail: giftCards.recipientEmail,
        salonId: giftCards.salonId,
        salonName: salons.name,
        purchasedAt: giftCards.purchasedAt,
        qrCodeUrl: giftCards.qrCodeUrl,
      })
      .from(giftCards)
      .leftJoin(salons, eq(giftCards.salonId, salons.id))
      .where(eq(giftCards.purchasedBy, userId))
      .orderBy(desc(giftCards.createdAt));

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userEmail = user[0]?.email;
    const userPhone = user[0]?.phone;

    let received: any[] = [];
    if (userEmail || userPhone) {
      const conditions = [];
      if (userEmail) conditions.push(eq(giftCards.recipientEmail, userEmail));
      if (userPhone) conditions.push(eq(giftCards.recipientPhone, userPhone));

      received = await db
        .select({
          id: giftCards.id,
          code: giftCards.code,
          balancePaisa: giftCards.balancePaisa,
          originalValuePaisa: giftCards.originalValuePaisa,
          status: giftCards.status,
          expiresAt: giftCards.expiresAt,
          personalMessage: giftCards.personalMessage,
          salonId: giftCards.salonId,
          salonName: salons.name,
          deliveredAt: giftCards.deliveredAt,
          qrCodeUrl: giftCards.qrCodeUrl,
        })
        .from(giftCards)
        .leftJoin(salons, eq(giftCards.salonId, salons.id))
        .where(and(or(...conditions), eq(giftCards.status, "active")))
        .orderBy(desc(giftCards.deliveredAt));
    }

    res.json({ purchased, received });
  } catch (error) {
    console.error("Error fetching user gift cards:", error);
    res.status(500).json({ error: "Failed to fetch gift cards" });
  }
});

router.get("/:id/transactions", authenticateMobileUser, async (req: MobileAuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const giftCard = await db.select().from(giftCards).where(eq(giftCards.id, id)).limit(1);
    if (giftCard.length === 0) {
      return res.status(404).json({ error: "Gift card not found" });
    }

    const card = giftCard[0];
    if (card.purchasedBy !== userId) {
      const user = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
      if (!user[0] || (user[0].email !== card.recipientEmail && user[0].phone !== card.recipientPhone)) {
        return res.status(403).json({ error: "Unauthorized to view this gift card" });
      }
    }

    const transactions = await db
      .select()
      .from(giftCardTransactions)
      .where(eq(giftCardTransactions.giftCardId, id))
      .orderBy(desc(giftCardTransactions.createdAt));

    res.json({ transactions });
  } catch (error) {
    console.error("Error fetching gift card transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/:salonId/redeem", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    const validation = redeemGiftCardSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", details: validation.error.errors });
    }

    const { code, bookingId, amountPaisa } = validation.data;

    const giftCard = await db.select().from(giftCards).where(eq(giftCards.code, code.toUpperCase())).limit(1);
    if (giftCard.length === 0) {
      return res.status(404).json({ error: "Gift card not found" });
    }

    const card = giftCard[0];

    if (card.salonId !== salonId) {
      return res.status(400).json({ error: "Gift card is not valid at this salon" });
    }

    if (card.status !== "active" && card.status !== "partially_used") {
      return res.status(400).json({ error: `Gift card cannot be redeemed (status: ${card.status})` });
    }

    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      await db.update(giftCards).set({ status: "expired", updatedAt: new Date() }).where(eq(giftCards.id, card.id));
      return res.status(400).json({ error: "Gift card has expired" });
    }

    const booking = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (booking.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const redeemAmount = amountPaisa || card.balancePaisa;
    if (redeemAmount > card.balancePaisa) {
      return res.status(400).json({ error: `Insufficient balance. Available: ₹${card.balancePaisa / 100}` });
    }

    const newBalance = card.balancePaisa - redeemAmount;
    const newStatus = newBalance === 0 ? "fully_redeemed" : "partially_used";

    await db
      .update(giftCards)
      .set({
        balancePaisa: newBalance,
        status: newStatus,
        lastUsedAt: new Date(),
        lastUsedBookingId: bookingId,
        totalRedemptionsPaisa: card.totalRedemptionsPaisa + redeemAmount,
        redemptionCount: card.redemptionCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, card.id));

    await db.insert(giftCardTransactions).values({
      giftCardId: card.id,
      salonId: salonId!,
      transactionType: newBalance === 0 ? "redemption" : "partial_redemption",
      amountPaisa: -redeemAmount,
      balanceBeforePaisa: card.balancePaisa,
      balanceAfterPaisa: newBalance,
      bookingId,
      performedBy: userId,
      performedByType: "staff",
      status: "completed",
    });

    res.json({
      success: true,
      redeemedAmount: redeemAmount,
      remainingBalance: newBalance,
      giftCardStatus: newStatus,
    });
  } catch (error) {
    console.error("Error redeeming gift card:", error);
    res.status(500).json({ error: "Failed to redeem gift card" });
  }
});

router.get("/:salonId/templates", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const templates = await db
      .select()
      .from(giftCardTemplates)
      .where(eq(giftCardTemplates.salonId, salonId!))
      .orderBy(giftCardTemplates.sortOrder);

    res.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

router.post("/:salonId/templates", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    const validation = insertGiftCardTemplateSchema.safeParse({ ...req.body, salonId, createdBy: userId });
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", details: validation.error.errors });
    }

    const [template] = await db.insert(giftCardTemplates).values(validation.data).returning();

    res.json({ template });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

router.put("/:salonId/templates/:templateId", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, templateId } = req.params;

    const existing = await db.select().from(giftCardTemplates).where(eq(giftCardTemplates.id, templateId)).limit(1);
    if (existing.length === 0 || existing[0].salonId !== salonId) {
      return res.status(404).json({ error: "Template not found" });
    }

    const validation = updateGiftCardTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid input", details: validation.error.errors });
    }

    const [updated] = await db
      .update(giftCardTemplates)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(giftCardTemplates.id, templateId))
      .returning();

    res.json({ template: updated });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

router.delete("/:salonId/templates/:templateId", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, templateId } = req.params;

    const existing = await db.select().from(giftCardTemplates).where(eq(giftCardTemplates.id, templateId)).limit(1);
    if (existing.length === 0 || existing[0].salonId !== salonId) {
      return res.status(404).json({ error: "Template not found" });
    }

    await db.delete(giftCardTemplates).where(eq(giftCardTemplates.id, templateId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

router.get("/:salonId/cards", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { status, startDate, endDate, search } = req.query;

    let query = db
      .select({
        id: giftCards.id,
        code: giftCards.code,
        balancePaisa: giftCards.balancePaisa,
        originalValuePaisa: giftCards.originalValuePaisa,
        status: giftCards.status,
        expiresAt: giftCards.expiresAt,
        recipientName: giftCards.recipientName,
        recipientEmail: giftCards.recipientEmail,
        purchasedAt: giftCards.purchasedAt,
        lastUsedAt: giftCards.lastUsedAt,
        redemptionCount: giftCards.redemptionCount,
        totalRedemptionsPaisa: giftCards.totalRedemptionsPaisa,
        purchaserEmail: users.email,
        purchaserName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(giftCards)
      .leftJoin(users, eq(giftCards.purchasedBy, users.id))
      .where(eq(giftCards.salonId, salonId!));

    const cards = await query.orderBy(desc(giftCards.createdAt));

    res.json({ cards });
  } catch (error) {
    console.error("Error fetching salon gift cards:", error);
    res.status(500).json({ error: "Failed to fetch gift cards" });
  }
});

router.get("/:salonId/analytics", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const totalSold = await db
      .select({
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`COALESCE(SUM(${giftCards.originalValuePaisa}), 0)`,
      })
      .from(giftCards)
      .where(and(eq(giftCards.salonId, salonId!), eq(giftCards.status, "active")));

    const totalRedeemed = await db
      .select({
        count: sql<number>`COUNT(*)`,
        totalValue: sql<number>`COALESCE(SUM(${giftCards.totalRedemptionsPaisa}), 0)`,
      })
      .from(giftCards)
      .where(and(eq(giftCards.salonId, salonId!), sql`${giftCards.redemptionCount} > 0`));

    const fullyRedeemed = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(giftCards)
      .where(and(eq(giftCards.salonId, salonId!), eq(giftCards.status, "fully_redeemed")));

    const outstandingBalance = await db
      .select({
        total: sql<number>`COALESCE(SUM(${giftCards.balancePaisa}), 0)`,
      })
      .from(giftCards)
      .where(
        and(
          eq(giftCards.salonId, salonId!),
          or(eq(giftCards.status, "active"), eq(giftCards.status, "partially_used"))
        )
      );

    const expired = await db
      .select({
        count: sql<number>`COUNT(*)`,
        lostValue: sql<number>`COALESCE(SUM(${giftCards.balancePaisa}), 0)`,
      })
      .from(giftCards)
      .where(and(eq(giftCards.salonId, salonId!), eq(giftCards.status, "expired")));

    res.json({
      totalSold: {
        count: Number(totalSold[0]?.count || 0),
        valuePaisa: Number(totalSold[0]?.totalValue || 0),
      },
      totalRedeemed: {
        count: Number(totalRedeemed[0]?.count || 0),
        valuePaisa: Number(totalRedeemed[0]?.totalValue || 0),
      },
      fullyRedeemedCount: Number(fullyRedeemed[0]?.count || 0),
      outstandingBalancePaisa: Number(outstandingBalance[0]?.total || 0),
      expired: {
        count: Number(expired[0]?.count || 0),
        lostValuePaisa: Number(expired[0]?.lostValue || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching gift card analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/:salonId/cards/:id", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, id } = req.params;

    const card = await db
      .select()
      .from(giftCards)
      .where(and(eq(giftCards.id, id), eq(giftCards.salonId, salonId!)))
      .limit(1);

    if (card.length === 0) {
      return res.status(404).json({ error: "Gift card not found" });
    }

    const transactions = await db
      .select()
      .from(giftCardTransactions)
      .where(eq(giftCardTransactions.giftCardId, id))
      .orderBy(desc(giftCardTransactions.createdAt));

    const deliveries = await db.select().from(giftCardDeliveries).where(eq(giftCardDeliveries.giftCardId, id));

    res.json({ giftCard: card[0], transactions, deliveries });
  } catch (error) {
    console.error("Error fetching gift card details:", error);
    res.status(500).json({ error: "Failed to fetch gift card" });
  }
});

router.post("/:salonId/cards/:id/cancel", requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, id } = req.params;
    const userId = req.user?.id;
    const { reason } = req.body;

    const card = await db
      .select()
      .from(giftCards)
      .where(and(eq(giftCards.id, id), eq(giftCards.salonId, salonId!)))
      .limit(1);

    if (card.length === 0) {
      return res.status(404).json({ error: "Gift card not found" });
    }

    if (card[0].status === "fully_redeemed") {
      return res.status(400).json({ error: "Cannot cancel a fully redeemed gift card" });
    }

    const previousBalance = card[0].balancePaisa;

    await db
      .update(giftCards)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: reason,
        balancePaisa: 0,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, id));

    await db.insert(giftCardTransactions).values({
      giftCardId: id,
      salonId: salonId!,
      transactionType: "cancellation",
      amountPaisa: -previousBalance,
      balanceBeforePaisa: previousBalance,
      balanceAfterPaisa: 0,
      performedBy: userId,
      performedByType: "staff",
      notes: reason,
      status: "completed",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error cancelling gift card:", error);
    res.status(500).json({ error: "Failed to cancel gift card" });
  }
});

export default router;
