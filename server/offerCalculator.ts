/**
 * Offer Calculation Engine - Production-Ready
 * 
 * Smart auto-apply logic for offers with comprehensive validation
 * Handles platform-wide and salon-specific offers
 */

interface OfferDetails {
  id: string;
  title: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase: number | null;
  maxDiscount: number | null;
  isPlatformWide: number;
  salonId: string | null;
  ownedBySalonId: string | null;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usageCount: number;
  imageUrl: string | null;
}

interface CalculatedOffer extends OfferDetails {
  discountAmountPaisa: number;
  finalAmountPaisa: number;
  savingsPercentage: number;
  isApplicable: boolean;
  ineligibilityReason?: string;
}

export class OfferCalculator {
  /**
   * Calculate discount amount from an offer
   * Handles percentage and fixed discounts with max caps
   */
  static calculateDiscount(
    offer: OfferDetails,
    totalAmountPaisa: number
  ): number {
    if (!offer) return 0;

    // Check minimum purchase requirement
    if (offer.minimumPurchase && totalAmountPaisa < offer.minimumPurchase) {
      return 0;
    }

    let discount = 0;

    // Calculate based on discount type
    if (offer.discountType === 'percentage') {
      // Percentage discount
      discount = Math.floor((totalAmountPaisa * offer.discountValue) / 100);
    } else if (offer.discountType === 'fixed') {
      // Fixed amount discount (already in paisa)
      discount = offer.discountValue;
    }

    // Apply max discount cap if specified
    if (offer.maxDiscount && discount > offer.maxDiscount) {
      discount = offer.maxDiscount;
    }

    // Ensure discount never exceeds total amount (prevent negative final price)
    if (discount > totalAmountPaisa) {
      discount = totalAmountPaisa;
    }

    return Math.floor(discount); // Ensure integer
  }

  /**
   * Check if offer is currently valid (date-wise)
   */
  static isOfferValid(offer: OfferDetails): boolean {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validUntil = new Date(offer.validUntil);

    return now >= validFrom && now <= validUntil;
  }

  /**
   * Check if offer has usage limit reached
   */
  static hasUsageRemaining(offer: OfferDetails): boolean {
    if (!offer.usageLimit) return true; // Unlimited
    return offer.usageCount < offer.usageLimit;
  }

  /**
   * Calculate all applicable offers with their discount amounts
   */
  static calculateAllOffers(
    offers: OfferDetails[],
    totalAmountPaisa: number,
    salonId?: string
  ): CalculatedOffer[] {
    return offers.map(offer => {
      let isApplicable = true;
      let ineligibilityReason: string | undefined;

      // Check date validity
      if (!this.isOfferValid(offer)) {
        isApplicable = false;
        ineligibilityReason = 'Offer expired or not yet active';
      }

      // Check usage limit
      if (isApplicable && !this.hasUsageRemaining(offer)) {
        isApplicable = false;
        ineligibilityReason = 'Usage limit reached';
      }

      // Check minimum purchase
      if (isApplicable && offer.minimumPurchase && totalAmountPaisa < offer.minimumPurchase) {
        isApplicable = false;
        ineligibilityReason = `Minimum purchase ₹${offer.minimumPurchase / 100} required`;
      }

      // Check salon applicability
      if (isApplicable && salonId && offer.salonId && offer.salonId !== salonId) {
        isApplicable = false;
        ineligibilityReason = 'Offer not valid for this salon';
      }

      const discountAmountPaisa = isApplicable 
        ? this.calculateDiscount(offer, totalAmountPaisa) 
        : 0;

      const finalAmountPaisa = totalAmountPaisa - discountAmountPaisa;
      const savingsPercentage = totalAmountPaisa > 0 
        ? Math.floor((discountAmountPaisa / totalAmountPaisa) * 100) 
        : 0;

      return {
        ...offer,
        discountAmountPaisa,
        finalAmountPaisa,
        savingsPercentage,
        isApplicable,
        ineligibilityReason,
      };
    });
  }

  /**
   * Get the best applicable offer (highest discount)
   * Priority: User promo code > Highest discount value
   */
  static getBestOffer(
    offers: OfferDetails[],
    totalAmountPaisa: number,
    salonId?: string,
    userPromoCode?: string
  ): CalculatedOffer | null {
    // Calculate all offers
    const calculatedOffers = this.calculateAllOffers(offers, totalAmountPaisa, salonId);

    // Filter only applicable offers
    const applicableOffers = calculatedOffers.filter(offer => offer.isApplicable);

    if (applicableOffers.length === 0) {
      return null;
    }

    // If user has promo code, find and apply that offer first
    if (userPromoCode) {
      const promoOffer = applicableOffers.find(
        offer => offer.title.toLowerCase().includes(userPromoCode.toLowerCase())
      );
      if (promoOffer) {
        return promoOffer;
      }
    }

    // Otherwise, return offer with highest discount
    const bestOffer = applicableOffers.reduce((best, current) => {
      if (current.discountAmountPaisa > best.discountAmountPaisa) {
        return current;
      }
      // If same discount, prefer platform-wide offers
      if (current.discountAmountPaisa === best.discountAmountPaisa) {
        return current.isPlatformWide > best.isPlatformWide ? current : best;
      }
      return best;
    });

    return bestOffer;
  }

  /**
   * Format offer display text for UI
   */
  static formatOfferSummary(offer: CalculatedOffer): string {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    } else {
      return `₹${offer.discountValue / 100} OFF`;
    }
  }

  /**
   * Format savings display
   */
  static formatSavings(offer: CalculatedOffer): string {
    return `Save ₹${offer.discountAmountPaisa / 100}`;
  }

  /**
   * Get offer badge color based on type
   */
  static getOfferBadgeColor(offer: OfferDetails): string {
    if (offer.isPlatformWide === 1) {
      return 'purple'; // Platform offers
    }
    return 'orange'; // Salon offers
  }

  /**
   * Calculate price breakdown for checkout display
   */
  static getPriceBreakdown(
    totalAmountPaisa: number,
    offer: CalculatedOffer | null
  ): {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    savingsPercentage: number;
    formattedOriginal: string;
    formattedDiscount: string;
    formattedFinal: string;
  } {
    const discountAmount = offer?.discountAmountPaisa || 0;
    const finalAmount = totalAmountPaisa - discountAmount;
    const savingsPercentage = totalAmountPaisa > 0 
      ? Math.floor((discountAmount / totalAmountPaisa) * 100) 
      : 0;

    return {
      originalAmount: totalAmountPaisa,
      discountAmount,
      finalAmount,
      savingsPercentage,
      formattedOriginal: `₹${totalAmountPaisa / 100}`,
      formattedDiscount: `₹${discountAmount / 100}`,
      formattedFinal: `₹${finalAmount / 100}`,
    };
  }

  /**
   * Validate promo code (basic string matching)
   * In production, this could be enhanced with actual promo code database
   */
  static validatePromoCode(
    promoCode: string,
    offers: OfferDetails[]
  ): OfferDetails | null {
    const normalized = promoCode.trim().toUpperCase();
    
    const matchedOffer = offers.find(offer => 
      offer.title.toUpperCase().includes(normalized) ||
      offer.description?.toUpperCase().includes(normalized)
    );

    return matchedOffer || null;
  }
}
