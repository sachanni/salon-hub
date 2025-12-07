export interface GiftCardTemplate {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  occasion: string;
  backgroundColor: string;
  textColor: string;
  minValuePaisa: number;
  maxValuePaisa: number;
  presetAmounts: number[];
  isActive: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCard {
  id: string;
  code: string;
  balancePaisa: number;
  originalValuePaisa: number;
  status: 'pending_payment' | 'active' | 'partially_redeemed' | 'fully_redeemed' | 'expired' | 'cancelled' | 'refunded';
  expiresAt: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  personalMessage: string | null;
  salonId: string;
  salonName: string;
  purchasedAt: string | null;
  deliveredAt: string | null;
  qrCodeUrl: string | null;
}

export interface GiftCardTransaction {
  id: string;
  giftCardId: string;
  salonId: string;
  transactionType: 'purchase' | 'redemption' | 'refund' | 'partial_redemption';
  amountPaisa: number;
  balanceBeforePaisa: number;
  balanceAfterPaisa: number;
  bookingId: string | null;
  razorpayPaymentId: string | null;
  performedBy: string | null;
  performedByType: 'customer' | 'staff' | 'system';
  notes: string | null;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface PurchaseGiftCardData {
  salonId: string;
  valuePaisa: number;
  templateId?: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  personalMessage?: string;
  deliveryMethod?: 'email' | 'sms' | 'whatsapp';
  scheduledDeliveryAt?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  giftCardId: string;
  code: string;
  amount: number;
  keyId: string;
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  giftCardId: string;
  purchasedBy?: string;
}

export interface ValidateGiftCardResponse {
  valid: boolean;
  error?: string;
  card?: {
    id: string;
    code: string;
    balancePaisa: number;
    originalValuePaisa: number;
    status: string;
    expiresAt: string | null;
    salonName: string;
  };
}

export interface MyCardsResponse {
  purchased: GiftCard[];
  received: GiftCard[];
}

export type GiftCardOccasion = 
  | 'birthday'
  | 'thank_you'
  | 'anniversary'
  | 'congratulations'
  | 'just_because'
  | 'holiday'
  | 'mothers_day'
  | 'fathers_day'
  | 'valentines'
  | 'wedding'
  | 'graduation'
  | 'other';

export const OCCASION_OPTIONS: { value: GiftCardOccasion; label: string; emoji: string }[] = [
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'thank_you', label: 'Thank You', emoji: '🙏' },
  { value: 'anniversary', label: 'Anniversary', emoji: '💕' },
  { value: 'congratulations', label: 'Congratulations', emoji: '🎉' },
  { value: 'just_because', label: 'Just Because', emoji: '💝' },
  { value: 'holiday', label: 'Holiday', emoji: '🎄' },
  { value: 'mothers_day', label: "Mother's Day", emoji: '💐' },
  { value: 'fathers_day', label: "Father's Day", emoji: '👔' },
  { value: 'valentines', label: "Valentine's Day", emoji: '❤️' },
  { value: 'wedding', label: 'Wedding', emoji: '💒' },
  { value: 'graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'other', label: 'Other', emoji: '🎁' },
];

export const PRESET_AMOUNTS_PAISA = [50000, 100000, 200000, 300000, 500000];
