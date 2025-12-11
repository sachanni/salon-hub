import type { Express, Response } from "express";
import { db } from "../db";
import { platformOffers, salons, savedOffers, services } from "@shared/schema";
import { eq, and, sql, desc, gte, lte, or, inArray } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";

export function registerMobileOffersRoutes(app: Express) {
  app.get("/api/mobile/offers/trending", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const now = new Date();

      const offers = await db.select({
        id: platformOffers.id,
        title: platformOffers.title,
        description: platformOffers.description,
        discountType: platformOffers.discountType,
        discountValue: platformOffers.discountValue,
        minimumPurchase: platformOffers.minimumPurchase,
        validUntil: platformOffers.validUntil,
        usageCount: platformOffers.usageCount,
        isPlatformWide: platformOffers.isPlatformWide,
        imageUrl: platformOffers.imageUrl,
        salonId: platformOffers.salonId,
        salonName: salons.name,
        salonImageUrl: salons.imageUrl,
      })
        .from(platformOffers)
        .leftJoin(salons, eq(platformOffers.salonId, salons.id))
        .where(and(
          eq(platformOffers.isActive, 1),
          eq(platformOffers.approvalStatus, 'approved'),
          lte(platformOffers.validFrom, now),
          gte(platformOffers.validUntil, now),
          or(
            sql`${platformOffers.usageLimit} IS NULL`,
            sql`${platformOffers.usageCount} < ${platformOffers.usageLimit}`
          )
        ))
        .orderBy(desc(platformOffers.usageCount), desc(platformOffers.discountValue))
        .limit(limit);

      const savedOfferIds = await db.select({ offerId: savedOffers.offerId })
        .from(savedOffers)
        .where(eq(savedOffers.userId, userId));
      
      const savedOfferIdSet = new Set(savedOfferIds.map(s => s.offerId));

      res.json({
        success: true,
        offers: offers.map(offer => ({
          ...offer,
          isSaved: savedOfferIdSet.has(offer.id),
          discountText: offer.discountType === 'percentage' 
            ? `${offer.discountValue}% OFF`
            : `₹${(offer.discountValue / 100).toFixed(0)} OFF`,
          daysRemaining: Math.ceil((new Date(offer.validUntil!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        })),
      });
    } catch (error) {
      console.error("Error fetching trending offers:", error);
      res.status(500).json({ error: "Failed to fetch trending offers" });
    }
  });

  app.get("/api/mobile/offers/saved", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const now = new Date();

      const saved = await db.select({
        id: platformOffers.id,
        title: platformOffers.title,
        description: platformOffers.description,
        discountType: platformOffers.discountType,
        discountValue: platformOffers.discountValue,
        minimumPurchase: platformOffers.minimumPurchase,
        validUntil: platformOffers.validUntil,
        isPlatformWide: platformOffers.isPlatformWide,
        imageUrl: platformOffers.imageUrl,
        salonId: platformOffers.salonId,
        salonName: salons.name,
        salonImageUrl: salons.imageUrl,
        savedAt: savedOffers.savedAt,
        isActive: platformOffers.isActive,
        validFrom: platformOffers.validFrom,
      })
        .from(savedOffers)
        .innerJoin(platformOffers, eq(savedOffers.offerId, platformOffers.id))
        .leftJoin(salons, eq(platformOffers.salonId, salons.id))
        .where(eq(savedOffers.userId, userId))
        .orderBy(desc(savedOffers.savedAt))
        .limit(limit)
        .offset(offset);

      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(savedOffers)
        .where(eq(savedOffers.userId, userId));

      res.json({
        success: true,
        offers: saved.map(offer => {
          const isExpired = new Date(offer.validUntil!) < now;
          const isNotYetValid = new Date(offer.validFrom!) > now;
          return {
            ...offer,
            isSaved: true,
            discountText: offer.discountType === 'percentage' 
              ? `${offer.discountValue}% OFF`
              : `₹${(offer.discountValue / 100).toFixed(0)} OFF`,
            daysRemaining: isExpired ? 0 : Math.ceil((new Date(offer.validUntil!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            isValid: offer.isActive === 1 && !isExpired && !isNotYetValid,
            isExpired,
          };
        }),
        pagination: {
          total: parseInt(String(countResult?.count || 0)),
          limit,
          offset,
          hasMore: offset + saved.length < parseInt(String(countResult?.count || 0)),
        },
      });
    } catch (error) {
      console.error("Error fetching saved offers:", error);
      res.status(500).json({ error: "Failed to fetch saved offers" });
    }
  });

  app.get("/api/mobile/offers/count", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const now = new Date();

      const [activeResult] = await db.select({ count: sql<number>`count(*)` })
        .from(platformOffers)
        .where(and(
          eq(platformOffers.isActive, 1),
          eq(platformOffers.approvalStatus, 'approved'),
          lte(platformOffers.validFrom, now),
          gte(platformOffers.validUntil, now),
          or(
            sql`${platformOffers.usageLimit} IS NULL`,
            sql`${platformOffers.usageCount} < ${platformOffers.usageLimit}`
          )
        ));

      const [newThisWeekResult] = await db.select({ count: sql<number>`count(*)` })
        .from(platformOffers)
        .where(and(
          eq(platformOffers.isActive, 1),
          eq(platformOffers.approvalStatus, 'approved'),
          gte(platformOffers.createdAt, sql`NOW() - INTERVAL '7 days'`)
        ));

      res.json({
        success: true,
        counts: {
          activeOffers: parseInt(String(activeResult?.count || 0)),
          newThisWeek: parseInt(String(newThisWeekResult?.count || 0)),
        },
      });
    } catch (error) {
      console.error("Error fetching offer counts:", error);
      res.status(500).json({ error: "Failed to fetch offer counts" });
    }
  });

  app.get("/api/mobile/offers", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const salonId = req.query.salonId as string | undefined;
      const category = req.query.category as string | undefined;
      const sortBy = req.query.sortBy as string || 'newest';

      const now = new Date();

      let whereCondition = and(
        eq(platformOffers.isActive, 1),
        eq(platformOffers.approvalStatus, 'approved'),
        lte(platformOffers.validFrom, now),
        gte(platformOffers.validUntil, now),
        or(
          sql`${platformOffers.usageLimit} IS NULL`,
          sql`${platformOffers.usageCount} < ${platformOffers.usageLimit}`
        )
      );

      if (salonId) {
        whereCondition = and(
          whereCondition,
          or(
            eq(platformOffers.salonId, salonId),
            eq(platformOffers.isPlatformWide, 1)
          )
        ) as any;
      }

      let orderBy;
      switch (sortBy) {
        case 'discount':
          orderBy = desc(platformOffers.discountValue);
          break;
        case 'expiring':
          orderBy = platformOffers.validUntil;
          break;
        case 'popular':
          orderBy = desc(platformOffers.usageCount);
          break;
        default:
          orderBy = desc(platformOffers.createdAt);
      }

      const offers = await db.select({
        id: platformOffers.id,
        title: platformOffers.title,
        description: platformOffers.description,
        discountType: platformOffers.discountType,
        discountValue: platformOffers.discountValue,
        minimumPurchase: platformOffers.minimumPurchase,
        maxDiscount: platformOffers.maxDiscount,
        validFrom: platformOffers.validFrom,
        validUntil: platformOffers.validUntil,
        usageLimit: platformOffers.usageLimit,
        usageCount: platformOffers.usageCount,
        isPlatformWide: platformOffers.isPlatformWide,
        imageUrl: platformOffers.imageUrl,
        salonId: platformOffers.salonId,
        salonName: salons.name,
        salonImageUrl: salons.imageUrl,
      })
        .from(platformOffers)
        .leftJoin(salons, eq(platformOffers.salonId, salons.id))
        .where(whereCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const savedOfferIds = await db.select({ offerId: savedOffers.offerId })
        .from(savedOffers)
        .where(eq(savedOffers.userId, userId));
      
      const savedOfferIdSet = new Set(savedOfferIds.map(s => s.offerId));

      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(platformOffers)
        .where(whereCondition);

      res.json({
        success: true,
        offers: offers.map(offer => ({
          ...offer,
          isSaved: savedOfferIdSet.has(offer.id),
          discountText: offer.discountType === 'percentage' 
            ? `${offer.discountValue}% OFF`
            : `₹${(offer.discountValue / 100).toFixed(0)} OFF`,
          minimumPurchaseText: offer.minimumPurchase 
            ? `Min. ₹${(offer.minimumPurchase / 100).toFixed(0)}`
            : null,
          maxDiscountText: offer.maxDiscount 
            ? `Up to ₹${(offer.maxDiscount / 100).toFixed(0)}`
            : null,
          daysRemaining: Math.ceil((new Date(offer.validUntil!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          usesRemaining: offer.usageLimit ? offer.usageLimit - (offer.usageCount || 0) : null,
        })),
        pagination: {
          total: parseInt(String(countResult?.count || 0)),
          limit,
          offset,
          hasMore: offset + offers.length < parseInt(String(countResult?.count || 0)),
        },
      });
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.get("/api/mobile/offers/:offerId", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { offerId } = req.params;
      const now = new Date();

      const offer = await db.select({
        id: platformOffers.id,
        title: platformOffers.title,
        description: platformOffers.description,
        discountType: platformOffers.discountType,
        discountValue: platformOffers.discountValue,
        minimumPurchase: platformOffers.minimumPurchase,
        maxDiscount: platformOffers.maxDiscount,
        validFrom: platformOffers.validFrom,
        validUntil: platformOffers.validUntil,
        usageLimit: platformOffers.usageLimit,
        usageCount: platformOffers.usageCount,
        isPlatformWide: platformOffers.isPlatformWide,
        imageUrl: platformOffers.imageUrl,
        salonId: platformOffers.salonId,
        salonName: salons.name,
        salonImageUrl: salons.imageUrl,
        salonAddress: salons.address,
        salonPhone: salons.phone,
      })
        .from(platformOffers)
        .leftJoin(salons, eq(platformOffers.salonId, salons.id))
        .where(eq(platformOffers.id, offerId))
        .limit(1);

      if (offer.length === 0) {
        return res.status(404).json({ error: "Offer not found" });
      }

      const o = offer[0];

      const savedOffer = await db.query.savedOffers.findFirst({
        where: and(
          eq(savedOffers.userId, userId),
          eq(savedOffers.offerId, offerId)
        ),
      });

      const isExpired = new Date(o.validUntil!) < now;
      const isNotYetValid = new Date(o.validFrom!) > now;
      const isUsedUp = o.usageLimit !== null && (o.usageCount || 0) >= o.usageLimit;

      res.json({
        success: true,
        offer: {
          ...o,
          isSaved: !!savedOffer,
          discountText: o.discountType === 'percentage' 
            ? `${o.discountValue}% OFF`
            : `₹${(o.discountValue / 100).toFixed(0)} OFF`,
          minimumPurchaseText: o.minimumPurchase 
            ? `Minimum purchase of ₹${(o.minimumPurchase / 100).toFixed(0)} required`
            : null,
          maxDiscountText: o.maxDiscount 
            ? `Maximum discount of ₹${(o.maxDiscount / 100).toFixed(0)}`
            : null,
          daysRemaining: isExpired ? 0 : Math.ceil((new Date(o.validUntil!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          usesRemaining: o.usageLimit ? o.usageLimit - (o.usageCount || 0) : null,
          isValid: !isExpired && !isNotYetValid && !isUsedUp,
          validityMessage: isExpired ? 'This offer has expired'
            : isNotYetValid ? `This offer starts on ${new Date(o.validFrom!).toLocaleDateString()}`
            : isUsedUp ? 'This offer has been fully redeemed'
            : `Valid until ${new Date(o.validUntil!).toLocaleDateString()}`,
        },
      });
    } catch (error) {
      console.error("Error fetching offer details:", error);
      res.status(500).json({ error: "Failed to fetch offer details" });
    }
  });

  app.post("/api/mobile/offers/:offerId/save", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { offerId } = req.params;

      const offer = await db.query.platformOffers.findFirst({
        where: eq(platformOffers.id, offerId),
      });

      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      const existing = await db.query.savedOffers.findFirst({
        where: and(
          eq(savedOffers.userId, userId),
          eq(savedOffers.offerId, offerId)
        ),
      });

      if (existing) {
        return res.json({
          success: true,
          message: "Offer already saved",
          savedOffer: existing,
        });
      }

      const [newSavedOffer] = await db.insert(savedOffers).values({
        userId,
        offerId,
      }).returning();

      res.json({
        success: true,
        message: "Offer saved successfully",
        savedOffer: newSavedOffer,
      });
    } catch (error) {
      console.error("Error saving offer:", error);
      res.status(500).json({ error: "Failed to save offer" });
    }
  });

  app.delete("/api/mobile/offers/:offerId/save", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { offerId } = req.params;

      const existing = await db.query.savedOffers.findFirst({
        where: and(
          eq(savedOffers.userId, userId),
          eq(savedOffers.offerId, offerId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Saved offer not found" });
      }

      await db.delete(savedOffers).where(eq(savedOffers.id, existing.id));

      res.json({
        success: true,
        message: "Offer removed from saved",
      });
    } catch (error) {
      console.error("Error removing saved offer:", error);
      res.status(500).json({ error: "Failed to remove saved offer" });
    }
  });
}
