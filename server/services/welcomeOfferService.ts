import { db } from '../db';
import { 
  welcomeOffers, 
  welcomeOfferRedemptions,
  importedCustomers,
  type WelcomeOffer,
  type InsertWelcomeOffer,
  type WelcomeOfferRedemption,
} from '@shared/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { generateOfferCode, normalizePhoneNumber } from './twilioService';

export interface CreateWelcomeOfferInput {
  salonId: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountInPaisa?: number;
  minimumPurchaseInPaisa?: number;
  validityDays?: number;
  usageLimit?: number;
}

export interface UpdateWelcomeOfferInput {
  name?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  maxDiscountInPaisa?: number | null;
  minimumPurchaseInPaisa?: number | null;
  validityDays?: number;
  usageLimit?: number;
  isActive?: number;
}

export interface OfferValidationResult {
  valid: boolean;
  discount: number;
  reason?: string;
  offer?: WelcomeOffer;
}

export interface OfferRedemptionResult {
  success: boolean;
  redemption?: WelcomeOfferRedemption;
  error?: string;
}

export async function createWelcomeOffer(input: CreateWelcomeOfferInput): Promise<WelcomeOffer> {
  const [offer] = await db.insert(welcomeOffers).values({
    salonId: input.salonId,
    name: input.name,
    discountType: input.discountType,
    discountValue: input.discountValue,
    maxDiscountInPaisa: input.maxDiscountInPaisa ?? null,
    minimumPurchaseInPaisa: input.minimumPurchaseInPaisa ?? null,
    validityDays: input.validityDays ?? 30,
    usageLimit: input.usageLimit ?? 1,
    isActive: 1,
    totalRedemptions: 0,
  }).returning();

  return offer;
}

export async function getWelcomeOffer(offerId: string): Promise<WelcomeOffer | null> {
  const [offer] = await db
    .select()
    .from(welcomeOffers)
    .where(eq(welcomeOffers.id, offerId))
    .limit(1);

  return offer || null;
}

export async function getWelcomeOffersBySalon(salonId: string): Promise<WelcomeOffer[]> {
  const offers = await db
    .select()
    .from(welcomeOffers)
    .where(eq(welcomeOffers.salonId, salonId))
    .orderBy(desc(welcomeOffers.createdAt));

  return offers;
}

export async function getActiveWelcomeOffersBySalon(salonId: string): Promise<WelcomeOffer[]> {
  const offers = await db
    .select()
    .from(welcomeOffers)
    .where(
      and(
        eq(welcomeOffers.salonId, salonId),
        eq(welcomeOffers.isActive, 1)
      )
    )
    .orderBy(desc(welcomeOffers.createdAt));

  return offers;
}

export async function updateWelcomeOffer(
  offerId: string,
  updates: UpdateWelcomeOfferInput
): Promise<WelcomeOffer | null> {
  const [offer] = await db
    .update(welcomeOffers)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(welcomeOffers.id, offerId))
    .returning();

  return offer || null;
}

export async function deleteWelcomeOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
  const offer = await getWelcomeOffer(offerId);
  if (!offer) {
    return { success: false, error: 'Offer not found' };
  }

  if (offer.totalRedemptions > 0) {
    return { 
      success: false, 
      error: 'Cannot delete offer that has been redeemed. Deactivate it instead.' 
    };
  }

  await db.delete(welcomeOffers).where(eq(welcomeOffers.id, offerId));
  return { success: true };
}

export async function toggleWelcomeOfferActive(offerId: string): Promise<WelcomeOffer | null> {
  const offer = await getWelcomeOffer(offerId);
  if (!offer) {
    return null;
  }

  return updateWelcomeOffer(offerId, { isActive: offer.isActive === 1 ? 0 : 1 });
}

export async function getUserOfferRedemption(
  userId: string,
  offerId: string
): Promise<WelcomeOfferRedemption | null> {
  const [redemption] = await db
    .select()
    .from(welcomeOfferRedemptions)
    .where(
      and(
        eq(welcomeOfferRedemptions.userId, userId),
        eq(welcomeOfferRedemptions.welcomeOfferId, offerId)
      )
    )
    .limit(1);

  return redemption || null;
}

export async function getUserOfferUsageCount(userId: string, offerId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(welcomeOfferRedemptions)
    .where(
      and(
        eq(welcomeOfferRedemptions.userId, userId),
        eq(welcomeOfferRedemptions.welcomeOfferId, offerId),
        eq(welcomeOfferRedemptions.status, 'redeemed')
      )
    );

  return result?.count || 0;
}

export async function validateWelcomeOffer(
  offerId: string,
  userId: string,
  bookingAmountInPaisa: number
): Promise<OfferValidationResult> {
  const offer = await getWelcomeOffer(offerId);

  if (!offer) {
    return { valid: false, discount: 0, reason: 'Offer not found' };
  }

  if (!offer.isActive) {
    return { valid: false, discount: 0, reason: 'Offer is not active' };
  }

  const redemption = await getUserOfferRedemption(userId, offerId);
  if (redemption) {
    if (redemption.status === 'expired') {
      return { valid: false, discount: 0, reason: 'Offer has expired' };
    }
    if (new Date() > redemption.expiresAt) {
      await db
        .update(welcomeOfferRedemptions)
        .set({ status: 'expired' })
        .where(eq(welcomeOfferRedemptions.id, redemption.id));
      return { valid: false, discount: 0, reason: 'Offer has expired' };
    }
  }

  const usageCount = await getUserOfferUsageCount(userId, offerId);
  if (usageCount >= offer.usageLimit) {
    return { valid: false, discount: 0, reason: 'Offer usage limit exceeded' };
  }

  if (offer.minimumPurchaseInPaisa && bookingAmountInPaisa < offer.minimumPurchaseInPaisa) {
    const minAmount = offer.minimumPurchaseInPaisa / 100;
    return { 
      valid: false, 
      discount: 0, 
      reason: `Minimum purchase of ₹${minAmount} required` 
    };
  }

  let discount = 0;
  if (offer.discountType === 'percentage') {
    discount = Math.floor(bookingAmountInPaisa * offer.discountValue / 100);
    if (offer.maxDiscountInPaisa && discount > offer.maxDiscountInPaisa) {
      discount = offer.maxDiscountInPaisa;
    }
  } else {
    discount = offer.discountValue;
  }

  discount = Math.min(discount, bookingAmountInPaisa);

  return { valid: true, discount, offer };
}

export async function createOfferRedemption(
  offerId: string,
  userId: string,
  importedCustomerId?: string
): Promise<WelcomeOfferRedemption> {
  const offer = await getWelcomeOffer(offerId);
  if (!offer) {
    throw new Error('Offer not found');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + offer.validityDays);

  const [redemption] = await db
    .insert(welcomeOfferRedemptions)
    .values({
      welcomeOfferId: offerId,
      userId,
      importedCustomerId: importedCustomerId ?? null,
      discountAppliedInPaisa: 0,
      expiresAt,
      status: 'active',
    })
    .returning();

  return redemption;
}

export async function redeemWelcomeOffer(
  offerId: string,
  userId: string,
  bookingId: string,
  bookingAmountInPaisa: number
): Promise<OfferRedemptionResult> {
  const validation = await validateWelcomeOffer(offerId, userId, bookingAmountInPaisa);
  
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const existingRedemption = await getUserOfferRedemption(userId, offerId);

  let redemption: WelcomeOfferRedemption;
  
  if (existingRedemption && existingRedemption.status === 'active') {
    [redemption] = await db
      .update(welcomeOfferRedemptions)
      .set({
        bookingId,
        discountAppliedInPaisa: validation.discount,
        redeemedAt: new Date(),
        status: 'redeemed',
      })
      .where(eq(welcomeOfferRedemptions.id, existingRedemption.id))
      .returning();
  } else {
    const offer = validation.offer!;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + offer.validityDays);

    [redemption] = await db
      .insert(welcomeOfferRedemptions)
      .values({
        welcomeOfferId: offerId,
        userId,
        bookingId,
        discountAppliedInPaisa: validation.discount,
        expiresAt,
        redeemedAt: new Date(),
        status: 'redeemed',
      })
      .returning();
  }

  await db
    .update(welcomeOffers)
    .set({
      totalRedemptions: sql`${welcomeOffers.totalRedemptions} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(welcomeOffers.id, offerId));

  return { success: true, redemption };
}

export async function getOfferRedemptions(
  offerId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ redemptions: WelcomeOfferRedemption[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const [countResult] = await db
    .select({ total: count() })
    .from(welcomeOfferRedemptions)
    .where(eq(welcomeOfferRedemptions.welcomeOfferId, offerId));

  const redemptions = await db
    .select()
    .from(welcomeOfferRedemptions)
    .where(eq(welcomeOfferRedemptions.welcomeOfferId, offerId))
    .orderBy(desc(welcomeOfferRedemptions.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    redemptions,
    total: countResult?.total || 0,
  };
}

export async function checkImportedCustomerByPhone(
  phone: string
): Promise<{ 
  found: boolean; 
  importedCustomers: Array<{
    id: string;
    salonId: string;
    customerName: string;
    status: string;
  }>;
}> {
  let normalizedPhone: string;
  try {
    normalizedPhone = normalizePhoneNumber(phone);
  } catch {
    return { found: false, importedCustomers: [] };
  }

  const customers = await db
    .select({
      id: importedCustomers.id,
      salonId: importedCustomers.salonId,
      customerName: importedCustomers.customerName,
      status: importedCustomers.status,
    })
    .from(importedCustomers)
    .where(eq(importedCustomers.normalizedPhone, normalizedPhone));

  return {
    found: customers.length > 0,
    importedCustomers: customers,
  };
}

export async function linkImportedCustomerToUser(
  importedCustomerId: string,
  userId: string
): Promise<void> {
  await db
    .update(importedCustomers)
    .set({
      linkedUserId: userId,
      status: 'registered',
      registeredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(importedCustomers.id, importedCustomerId));
}

export async function autoApplyWelcomeOfferOnRegistration(
  userId: string,
  phone: string
): Promise<{
  offersApplied: Array<{
    offerId: string;
    offerName: string;
    salonId: string;
    expiresAt: Date;
  }>;
}> {
  const { found, importedCustomers: customers } = await checkImportedCustomerByPhone(phone);
  
  if (!found) {
    return { offersApplied: [] };
  }

  const offersApplied: Array<{
    offerId: string;
    offerName: string;
    salonId: string;
    expiresAt: Date;
  }> = [];

  for (const customer of customers) {
    await linkImportedCustomerToUser(customer.id, userId);

    const activeOffers = await getActiveWelcomeOffersBySalon(customer.salonId);
    
    for (const offer of activeOffers) {
      try {
        const redemption = await createOfferRedemption(offer.id, userId, customer.id);
        offersApplied.push({
          offerId: offer.id,
          offerName: offer.name,
          salonId: customer.salonId,
          expiresAt: redemption.expiresAt,
        });
      } catch (error) {
        console.error(`Failed to apply welcome offer ${offer.id} for user ${userId}:`, error);
      }
    }
  }

  return { offersApplied };
}

export async function getUserActiveOffers(userId: string): Promise<Array<{
  redemption: WelcomeOfferRedemption;
  offer: WelcomeOffer;
}>> {
  const redemptions = await db
    .select()
    .from(welcomeOfferRedemptions)
    .where(
      and(
        eq(welcomeOfferRedemptions.userId, userId),
        eq(welcomeOfferRedemptions.status, 'active')
      )
    );

  const result: Array<{ redemption: WelcomeOfferRedemption; offer: WelcomeOffer }> = [];

  for (const redemption of redemptions) {
    if (new Date() > redemption.expiresAt) {
      await db
        .update(welcomeOfferRedemptions)
        .set({ status: 'expired' })
        .where(eq(welcomeOfferRedemptions.id, redemption.id));
      continue;
    }

    const offer = await getWelcomeOffer(redemption.welcomeOfferId);
    if (offer && offer.isActive) {
      result.push({ redemption, offer });
    }
  }

  return result;
}

export function formatOfferAmount(offer: WelcomeOffer): string {
  if (offer.discountType === 'percentage') {
    return `${offer.discountValue}%`;
  }
  return `₹${offer.discountValue / 100}`;
}

export { generateOfferCode };
