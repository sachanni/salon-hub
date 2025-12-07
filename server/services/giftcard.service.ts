import { db } from "../db";
import { eq, and, or, lt, sql, isNotNull } from "drizzle-orm";
import { giftCards, giftCardTransactions, giftCardDeliveries } from "@shared/schema";

class GiftCardService {
  async processExpiredGiftCards(): Promise<{ processed: number; expired: number }> {
    const now = new Date();
    let processed = 0;
    let expired = 0;

    try {
      const expiredCards = await db
        .select({
          id: giftCards.id,
          salonId: giftCards.salonId,
          balancePaisa: giftCards.balancePaisa,
          status: giftCards.status,
        })
        .from(giftCards)
        .where(
          and(
            or(eq(giftCards.status, "active"), eq(giftCards.status, "partially_used")),
            isNotNull(giftCards.expiresAt),
            lt(giftCards.expiresAt, now)
          )
        )
        .limit(500);

      processed = expiredCards.length;

      for (const card of expiredCards) {
        try {
          await db
            .update(giftCards)
            .set({
              status: "expired",
              balancePaisa: 0,
              updatedAt: now,
            })
            .where(eq(giftCards.id, card.id));

          if (card.balancePaisa > 0) {
            await db.insert(giftCardTransactions).values({
              giftCardId: card.id,
              salonId: card.salonId,
              transactionType: "expiry",
              amountPaisa: -card.balancePaisa,
              balanceBeforePaisa: card.balancePaisa,
              balanceAfterPaisa: 0,
              performedByType: "system",
              notes: "Gift card expired automatically",
              status: "completed",
            });
          }

          expired++;
        } catch (error) {
          console.error(`Error expiring gift card ${card.id}:`, error);
        }
      }

      console.log(`Gift card expiry job: processed=${processed}, expired=${expired}`);
      return { processed, expired };
    } catch (error) {
      console.error("Error in processExpiredGiftCards:", error);
      return { processed: 0, expired: 0 };
    }
  }

  async processScheduledDeliveries(): Promise<{ processed: number; sent: number }> {
    const now = new Date();
    let processed = 0;
    let sent = 0;

    try {
      const pendingDeliveries = await db
        .select({
          id: giftCardDeliveries.id,
          giftCardId: giftCardDeliveries.giftCardId,
        })
        .from(giftCardDeliveries)
        .innerJoin(giftCards, eq(giftCardDeliveries.giftCardId, giftCards.id))
        .where(
          and(
            eq(giftCardDeliveries.status, "pending"),
            eq(giftCards.status, "active"),
            or(
              sql`${giftCardDeliveries.scheduledAt} IS NULL`,
              lt(giftCardDeliveries.scheduledAt, now)
            )
          )
        )
        .limit(100);

      processed = pendingDeliveries.length;

      for (const delivery of pendingDeliveries) {
        try {
          await db
            .update(giftCardDeliveries)
            .set({
              status: "sent",
              sentAt: now,
              updatedAt: now,
            })
            .where(eq(giftCardDeliveries.id, delivery.id));

          await db
            .update(giftCards)
            .set({
              deliveredAt: now,
              updatedAt: now,
            })
            .where(eq(giftCards.id, delivery.giftCardId));

          sent++;
        } catch (error) {
          console.error(`Error processing delivery ${delivery.id}:`, error);
        }
      }

      console.log(`Scheduled delivery job: processed=${processed}, sent=${sent}`);
      return { processed, sent };
    } catch (error) {
      console.error("Error in processScheduledDeliveries:", error);
      return { processed: 0, sent: 0 };
    }
  }

  async cleanupPendingPayments(): Promise<{ cleaned: number }> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    try {
      const result = await db
        .update(giftCards)
        .set({
          status: "cancelled",
          cancellationReason: "Payment timeout - order expired after 24 hours",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(giftCards.status, "pending_payment"),
            lt(giftCards.createdAt, cutoffTime)
          )
        );

      const cleaned = result.rowCount || 0;
      console.log(`Pending payment cleanup: cleaned=${cleaned}`);
      return { cleaned };
    } catch (error) {
      console.error("Error in cleanupPendingPayments:", error);
      return { cleaned: 0 };
    }
  }
}

export const giftCardService = new GiftCardService();
