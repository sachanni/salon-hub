# SalonHub Value-Added Features Plan

**Document Version:** 1.2  
**Created:** December 2024  
**Last Updated:** December 2024  
**Status:** Partially Implemented

---

## Executive Summary

This document outlines the implementation plan for 4 high-impact value-added features to enhance SalonHub's competitive advantage before production launch. Each feature specification is based on detailed requirements analysis.

---

## Implementation Checklist

### Feature 1: Smart Rebooking Reminders
**Status: WEB COMPLETE, MOBILE COMPLETE**

#### Database
- [x] `service_rebooking_cycles` table
- [x] `customer_rebooking_stats` table (tracks rebooking patterns)
- [x] `rebooking_settings` table (salon-level configuration)
- [x] `rebooking_reminders` table
- [x] `user_push_tokens` table (for push notification delivery)

#### Backend API
- [x] `GET/PUT /api/rebooking/settings/:salonId` - Configure settings
- [x] `GET/POST/PUT/DELETE /api/rebooking/cycles/:salonId` - Manage cycles
- [x] `GET /api/rebooking/suggestions` - Get customer suggestions
- [x] `POST /api/rebooking/dismiss` - Dismiss suggestion
- [x] `GET /api/rebooking/analytics/:salonId` - Analytics data
- [x] `GET /api/rebooking/due-customers/:salonId` - Due customers list
- [x] `POST /api/mobile/notifications/register-token` - Push token registration

#### Scheduled Jobs
- [x] Daily job - Generate rebooking reminders and update statuses
- [ ] Weekly job - Recalculate optimal channels/timing

#### Web - Business Dashboard
- [x] Settings page for rebooking cycles
- [x] Per-service cycle configuration
- [x] Reminder analytics (pie chart, bar chart, gauge)
- [x] Due customers list with contact actions
- [x] Quiet hours configuration
- [x] Max reminders per service setting
- [x] Customer opt-out respect toggle
- [x] Default min/max days settings
- [x] WhatsApp and Push notification channels
- [x] Reminder preview functionality
- [x] Export due customers (Excel/PDF)

#### Web - Customer
- [x] "Recommended for you" section on dashboard (RebookingSuggestions component)
- [x] Email/SMS templates with "Book Now" button

#### Mobile App
- [x] Push notification with quick action (NotificationContext.tsx with deep linking)
- [x] Push notification service with Android channels (notificationService.ts)
- [x] Pre-filled booking flow (quick_book action navigates to salon with preselected service)

---

### Feature 2: No-Show Protection (Deposits)
**Status: WEB COMPLETE, MOBILE COMPLETE**

#### Database
- [x] `deposit_settings` table
- [x] `service_deposit_rules` table
- [x] `cancellation_policies` table
- [x] `trusted_customers` table
- [x] `deposit_transactions` table
- [x] `customer_saved_cards` table

#### Backend API
- [x] `GET/PUT /:salonId/deposit-settings` - Settings CRUD
- [x] `GET/POST/DELETE /:salonId/service-rules` - Service rules
- [x] `GET/PUT /:salonId/cancellation-policy` - Cancellation policy
- [x] `GET/POST/DELETE /:salonId/trusted-customers` - Trusted list
- [x] `POST /deposits/collect` - Collect deposit
- [x] `POST /deposits/refund` - Process refund
- [x] `GET /:salonId/analytics` - Deposit analytics
- [x] `GET /api/mobile/payment-methods` - Get saved cards
- [x] `DELETE /api/mobile/payment-methods/:cardId` - Remove card
- [x] `POST /api/mobile/payment-methods/:cardId/set-default` - Set default card
- [x] `GET /api/mobile/deposits/my-deposits` - Customer deposit history

#### Web - Business Dashboard
- [x] Deposit percentage settings (20%, 25%, 50%, custom)
- [x] Price threshold configuration
- [x] Per-service deposit toggles
- [x] Category-based rules
- [x] Cancellation window settings (12hr/24hr/48hr/72hr)
- [x] Trusted customers management
- [x] Deposit analytics dashboard

#### Web - Customer
- [x] Deposit requirement notice in booking flow
- [x] Deposit amount display
- [x] Cancellation policy display
- [x] Saved cards management
- [x] Deposit history page

#### Mobile App
- [x] Deposit badge on service cards (DepositBadge.tsx component)
- [x] Deposit payment during booking
- [x] Cancellation policy display
- [x] Saved payment methods (SavedCardsScreen.tsx)
- [x] Deposit transaction history (DepositHistoryScreen.tsx)
- [x] Refund/policy notifications (Android notification channel configured)

---

### Feature 3: Client Notes & Preferences
**Status: WEB COMPLETE, MOBILE COMPLETE**

#### Database
- [x] `client_profiles` table
- [x] `client_notes` table
- [x] `client_formulas` table
- [x] `client_photos` table
- [x] `profile_visibility_settings` table

#### Backend API
- [x] `GET /:salonId/clients` - List clients with search
- [x] `GET /:salonId/clients/:customerId` - Get profile
- [x] `POST /:salonId/clients` - Create profile
- [x] `PUT /:salonId/clients/:profileId` - Update profile
- [x] `POST /:salonId/clients/:profileId/notes` - Add note
- [x] `PUT/DELETE notes/:noteId` - Edit/delete note
- [x] `POST /:salonId/clients/:profileId/formulas` - Add formula
- [x] `POST /:salonId/clients/:profileId/photos` - Upload photo
- [x] `GET/PUT /:salonId/visibility-settings` - Visibility config

#### Web - Business Dashboard
- [x] Client search and listing
- [x] Full profile view with tabs (Notes, Formulas, Photos, Preferences)
- [x] Hair profile fields (type, condition, length, density)
- [x] Skin profile fields (type, concerns)
- [x] Allergies and sensitivities tracking
- [x] VIP customer flagging
- [x] Note management (add, edit, pin, delete)
- [x] Formula tracking (color, developer, timing)
- [x] Photo gallery with upload
- [x] Visit history tracking
- [x] Visibility settings configuration
- [ ] Auto-popup on new booking (partial)

#### Web - Customer
- [x] View own profile/preferences (MyBeautyProfile page)
- [x] Update personal preferences (inline editing in MyBeautyProfile)
- [x] View before/after photos (PhotoGallery component with lightbox)
- [x] Preferences displayed on booking confirmation (BookingPreferenceSummary component)

#### Mobile App
- [x] "My Beauty Profile" section (BeautyProfileScreen.tsx)
- [x] View/update preferences (inline editing in modal)
- [x] Photo gallery of past transformations (PhotoGallery with lightbox viewer)
- [x] Notes feed timeline (NotesFeed component integrated in screen)
- [x] BeautyPreferencesCard component for booking checkout
- [x] "Add special notes" in booking flow (BookingNotesInput.tsx component)
- [x] "Stylist knows your preferences" badge (StylistPreferencesBadge.tsx component)

---

### Feature 4: Gift Cards
**Status: WEB COMPLETE, MOBILE COMPLETE**

#### Database
- [x] `gift_cards` table
- [x] `gift_card_transactions` table
- [x] `gift_card_deliveries` table
- [x] `gift_card_templates` table

#### Backend API
- [x] `GET /templates/:salonId` - Get templates
- [x] `POST /purchase` - Purchase gift card
- [x] `POST /validate` - Validate code
- [x] `POST /redeem` - Redeem gift card
- [x] `GET /my-cards` - Customer's cards
- [x] `GET /received` - Received cards
- [x] QR code generation

#### Web - Business Dashboard
- [x] Gift card templates management
- [x] Redemption interface
- [x] Gift card analytics

#### Web - Customer
- [x] Gift card purchase page
- [x] Template selection
- [x] Amount selection (fixed + custom)
- [x] Recipient details form
- [x] Personal message input
- [x] Razorpay payment integration
- [x] Gift card balance in wallet
- [x] Scheduled delivery date picker
- [x] "Apply gift card" in booking checkout

#### Mobile App
- [x] Gift card purchase flow
- [x] Card carousel for amount selection
- [x] Recipient entry form
- [x] Occasion selector
- [x] Schedule delivery
- [x] WhatsApp/SMS sharing
- [x] Wallet section with QR display
- [x] Balance and expiry countdown
- [x] "Apply Gift Card" at checkout
- [x] QR scanner for redemption (QRScannerScreen.tsx with camera + manual entry)
- [x] Push notifications (received, expiry reminders) - Android channel configured

---

### Feature 5: Customer Membership Packages
**Status: WEB COMPLETE, MOBILE PENDING**

#### Database
- [x] `membership_plans` table (plan definitions)
- [x] `membership_plan_services` table (packaged services)
- [x] `customer_memberships` table (customer subscriptions)
- [x] `membership_service_usage` table (packaged usage tracking)
- [x] `membership_credit_transactions` table (credit history)
- [x] `membership_payments` table (payment records)

#### Backend API
- [x] `POST /api/salons/:salonId/membership-plans` - Create plan
- [x] `GET /api/salons/:salonId/membership-plans` - List plans
- [x] `GET /api/salons/:salonId/membership-plans/manage` - Manage plans (all)
- [x] `PUT /api/membership-plans/:planId` - Update plan
- [x] `DELETE /api/membership-plans/:planId` - Delete plan
- [x] `GET /api/salons/:salonId/members` - List members
- [x] `GET /api/salons/:salonId/membership-analytics` - Analytics
- [x] `GET /api/salons/:salonId/memberships/available` - Available plans
- [x] `POST /api/memberships/purchase` - Purchase membership
- [x] `GET /api/my/memberships` - Customer's memberships
- [x] `GET /api/my/memberships/:id` - Membership details
- [x] `POST /api/my/memberships/:id/pause` - Pause membership
- [x] `POST /api/my/memberships/:id/resume` - Resume membership
- [x] `POST /api/my/memberships/:id/cancel` - Cancel membership
- [x] `POST /api/salons/:salonId/calculate-membership-benefits` - Booking preview

#### Booking Integration
- [x] `getActiveMembershipForBooking()` - Check active membership
- [x] `calculateMembershipBenefits()` - Calculate discounts/credits
- [x] `applyMembershipToBooking()` - Apply benefits on booking
- [x] Quota tracking for packaged plans (handles duplicate services)

#### Web - Business Dashboard
- [x] Membership Management tab in dashboard
- [x] Create/Edit plan form (3 plan types)
- [x] Plan list with toggle active/inactive
- [x] Members list view with search
- [x] Membership analytics cards (revenue, churn, growth)

#### Web - Customer
- [x] Membership Plans Card on salon profile page
- [x] Purchase confirmation dialog
- [x] My Memberships page in customer dashboard
- [x] Credit balance display for credit plans
- [x] Service usage tracking for packaged plans
- [x] Pause/Resume/Cancel actions with confirmation

#### Mobile App
- [ ] Membership plans display on salon screen
- [ ] Purchase flow integration
- [ ] My memberships screen
- [ ] Booking integration with benefits display

---

## Summary

| Feature | Implemented | Pending |
|---------|-------------|---------|
| **Smart Rebooking Reminders** | 26 items | 1 item |
| **No-Show Protection** | 27 items | 0 items |
| **Client Notes & Preferences** | 33 items | 0 items |
| **Gift Cards** | 31 items | 0 items |
| **Customer Membership Packages** | 31 items | 4 items |
| **TOTAL** | **148 items** | **5 items** |

---

## Implementation Status Summary

| Feature | Backend | Database | Web (Business) | Web (Customer) | Mobile | Overall Status |
|---------|---------|----------|----------------|----------------|--------|----------------|
| **Smart Rebooking Reminders** | Complete | Complete | Complete | Complete | Complete | **COMPLETE** |
| **No-Show Protection (Deposits)** | Complete | Complete | Complete | Complete | Complete | **COMPLETE** |
| **Client Notes & Preferences** | Complete | Complete | Complete | Complete | Complete | **COMPLETE** |
| **Gift Cards** | Complete | Complete | Complete | Complete | Complete | **COMPLETE** |
| **Customer Membership Packages** | Complete | Complete | Complete | Complete | Pending | **WEB COMPLETE** |

### Detailed Implementation Status

#### Feature 1: Smart Rebooking Reminders - WEB COMPLETE
- **Backend Routes:** `server/routes/rebooking.routes.ts` - COMPLETE
  - Settings CRUD
  - Service cycle management
  - Customer suggestions
  - Due customers list
  - Analytics endpoints
- **Database Tables:** COMPLETE
  - `rebooking_settings` - Salon-level configuration
  - `service_rebooking_cycles` - Per-service cycle rules
  - `customer_rebooking_stats` - Customer rebooking patterns
  - `rebooking_reminders` - Reminder history
- **Scheduled Jobs:** `server/services/rebooking.service.ts` - COMPLETE
  - Daily job for reminder generation and status updates
- **Web Business UI:** `client/src/pages/BusinessSettings.tsx` - COMPLETE
  - Full settings management with quiet hours, channels, analytics charts
  - Due customers list with contact actions (Call, WhatsApp, Email)
  - Reminder preview, export functionality (Excel/PDF)
- **Web Customer UI:** COMPLETE
  - `RebookingSuggestions` component on dashboard
  - Email/SMS templates with "Book Now" button (rebooking.service.ts)
- **Mobile UI:** NOT STARTED
- **Priority for Next Sprint:** Mobile app integration

#### Feature 2: No-Show Protection (Deposits) - WEB COMPLETE, MOBILE PARTIAL
- **Backend Routes:** `server/routes/deposits.routes.ts` (1511 lines) - COMPLETE
  - Deposit settings CRUD
  - Service deposit rules management
  - Trusted customers management
  - Deposit collection via Razorpay
  - Refund and forfeiture processing
  - Cancellation policy management
  - Analytics endpoints
- **Database Tables:** COMPLETE
  - `deposit_settings` - Salon-level configuration
  - `service_deposit_rules` - Per-service rules
  - `cancellation_policies` - Salon policies
  - `trusted_customers` - Bypass list
  - `deposit_transactions` - Transaction history
- **Web Business UI:** `client/src/pages/BusinessSettings.tsx` - COMPLETE
  - DepositsSettings component with full settings management
  - Service-level deposit toggles
  - Trusted customers management
  - Analytics dashboard (deposits collected, refunded, forfeited)
- **Web Customer UI:** COMPLETE
  - Deposit display in booking flow
  - Customer deposit history page (DepositHistory.tsx)
  - Saved cards management page (SavedCards.tsx)
- **Mobile UI:** PARTIAL
  - DepositInfoCard component (mobile/src/components/DepositInfoCard.tsx)
  - CancellationPolicyModal component (mobile/src/components/CancellationPolicyModal.tsx)
  - Deposit payment during booking (PaymentScreen.tsx)
  - Deposit check API integration (mobile/src/services/api.ts)
  - BookingConfirmationScreen deposit status display
  - **Remaining:** Deposit badge on service cards, saved payment methods, transaction history, refund notifications

#### Feature 3: Client Notes & Preferences - WEB BUSINESS COMPLETE
- **Backend Routes:** `server/routes/client-profiles.routes.ts` (1057 lines) - COMPLETE
  - Client profile CRUD with search and pagination
  - Client notes management (add, edit, delete, pin)
  - Formula tracking (hair color, treatments, etc.)
  - Photo uploads with before/after functionality
  - Visibility settings per salon
  - Staff permission enforcement
- **Database Tables:** COMPLETE
  - `client_profiles` - Extended customer profiles
  - `client_notes` - Free-text notes with timestamps
  - `client_formulas` - Structured formula data
  - `client_photos` - Before/after photos
  - `profile_visibility_settings` - Customer visibility control
- **Web Business UI:** `client/src/components/business-dashboard/ClientProfilesManagement.tsx` (1867 lines) - COMPLETE
  - Full client profile management
  - Tabbed interface (Notes, Formulas, Photos, Preferences)
  - VIP customer flagging
  - Allergy/sensitivity alerts
  - Photo gallery with upload
  - Visit history tracking
- **Web Customer UI:** COMPLETE
  - MyBeautyProfile page with full profile viewing
  - PhotoGallery component with lightbox and before/after comparison
  - NotesFeed component for customer-visible notes timeline
  - BookingPreferenceSummary component in booking checkout sidebar
- **Mobile UI:** COMPLETE
  - BeautyProfileScreen.tsx with salon list, photo gallery, notes feed
  - Inline profile editing with option chips
  - Photo viewer with lightbox modal
  - BeautyPreferencesCard component for booking checkout
  - Route and navigation integration

#### Feature 4: Gift Cards - WEB COMPLETE
- **Backend Routes:** `server/routes/gift-cards.routes.ts` (755 lines) - COMPLETE
  - Gift card templates management
  - Purchase flow with Razorpay
  - QR code generation
  - Validation and redemption
  - Transaction history
  - Scheduled delivery support
- **Database Tables:** COMPLETE
  - `gift_cards` - Main gift card records
  - `gift_card_transactions` - Purchase/redemption history
  - `gift_card_deliveries` - Scheduled delivery queue
  - `gift_card_templates` - Design templates
- **Web Business UI:** BusinessSettings.tsx - Gift card settings
- **Web Customer UI:** `client/src/pages/GiftCardsPage.tsx` (629 lines) - COMPLETE
  - Template selection
  - Amount customization
  - Recipient details form
  - Payment flow integration
  - Scheduled delivery date picker
- **Web Customer Wallet:** CustomerWallet.tsx has gift card balance display
- **Web Booking Checkout:** BookingPage.tsx has "Apply Gift Card" feature
- **Mobile UI:** NOT STARTED

---

## Remaining Work (Priority Order)

### CRITICAL: Missing Backend API Endpoints for Mobile App

The following backend endpoints are called by the mobile app but **NOT YET IMPLEMENTED** on the server:

#### User Profile APIs (Priority: HIGH)
| Endpoint | Method | Mobile Usage | Status |
|----------|--------|--------------|--------|
| `/api/mobile/users/profile` | GET | ProfileScreen.tsx - Load user profile | **MISSING** |
| `/api/bookings/my-bookings` | GET | AppointmentsScreen.tsx - Load user bookings | **MISSING** |
| `/api/bookings/:bookingId` | GET | BookingDetailScreen.tsx - View booking details | **MISSING** |
| `/api/bookings/:bookingId/cancel` | POST | AppointmentsScreen.tsx - Cancel booking | **MISSING** |
| `/api/bookings/:bookingId/reschedule` | PATCH | appointmentsAPI.reschedule | **MISSING** |
| `/api/bookings/:bookingId/review` | POST | appointmentsAPI.submitReview | **MISSING** |

#### Offers APIs (Priority: HIGH)
| Endpoint | Method | Mobile Usage | Status |
|----------|--------|--------------|--------|
| `/api/mobile/offers` | GET | OffersScreen.tsx - Browse offers | **MISSING** |
| `/api/mobile/offers/:offerId` | GET | Offer detail view | **MISSING** |
| `/api/mobile/offers/trending` | GET | HomeScreen.tsx - Trending offers | **MISSING** |
| `/api/mobile/offers/saved` | GET | Saved offers list | **MISSING** |
| `/api/mobile/offers/:offerId/save` | POST | Save an offer | **MISSING** |
| `/api/mobile/offers/:offerId/save` | DELETE | Unsave an offer | **MISSING** |
| `/api/mobile/offers/count` | GET | Badge count | **MISSING** |

#### Deposit Payment APIs (Priority: HIGH)
| Endpoint | Method | Mobile Usage | Status |
|----------|--------|--------------|--------|
| `/api/deposits/check-booking-deposit` | POST | Check if deposit required | **MISSING** (use `/api/mobile/deposits/check-booking-deposit`) |
| `/api/deposits/create-deposit-order` | POST | Create Razorpay order for deposit | **MISSING** |
| `/api/deposits/verify-deposit-payment` | POST | Verify deposit payment | **MISSING** |
| `/api/deposits/cancellation-policy/:salonId` | GET | Get cancellation policy | **MISSING** (use `/api/mobile/deposits/cancellation-policy/:salonId`) |

#### Notification APIs (Priority: MEDIUM)
| Endpoint | Method | Mobile Usage | Status |
|----------|--------|--------------|--------|
| `/api/mobile/notifications/unregister-token` | POST | Logout - remove push token | **MISSING** |

### Implemented Mobile Backend Endpoints (Reference)

#### Notifications ✅
- `GET /api/mobile/notifications` - List notifications
- `GET /api/mobile/notifications/count` - Unread count
- `POST /api/mobile/notifications/:id/read` - Mark as read
- `POST /api/mobile/notifications/read-all` - Mark all read
- `DELETE /api/mobile/notifications/:id` - Delete notification
- `POST /api/mobile/notifications/register-token` - Register push token

#### Wallet ✅
- `GET /api/mobile/wallet` - Get wallet balance
- `GET /api/mobile/wallet/transactions` - Transaction history
- `POST /api/mobile/wallet/add-money/create-order` - Create order
- `POST /api/mobile/wallet/add-money/verify` - Verify payment
- `POST /api/mobile/wallet/use` - Use wallet balance

#### Payment Methods ✅
- `GET /api/mobile/payment-methods` - List saved cards
- `DELETE /api/mobile/payment-methods/:cardId` - Remove card
- `POST /api/mobile/payment-methods/:cardId/set-default` - Set default

#### Deposits ✅
- `GET /api/mobile/deposits/my-deposits` - Deposit history
- `POST /api/mobile/deposits/check-booking-deposit` - Check deposit requirement
- `GET /api/mobile/deposits/cancellation-policy/:salonId` - Get policy

#### Rebooking ✅
- `GET /api/mobile/rebooking/suggestions` - Get suggestions
- `POST /api/mobile/rebooking/dismiss` - Dismiss suggestion

#### Loyalty (via router) ✅
- `GET /api/mobile/loyalty/tiers` - Loyalty tiers
- `GET /api/mobile/loyalty/points` - User points
- `GET /api/mobile/loyalty/transactions` - Point transactions
- `POST /api/mobile/loyalty/earn` - Earn points
- `GET /api/mobile/loyalty/rewards` - Available rewards
- `POST /api/mobile/loyalty/rewards/:id/redeem` - Redeem reward
- `GET /api/mobile/loyalty/my-rewards` - User's redeemed rewards

#### Favorites (via router) ✅
- `GET /api/mobile/favorites/salons` - Favorite salons
- `POST /api/mobile/favorites/salons/:id` - Add favorite
- `DELETE /api/mobile/favorites/salons/:id` - Remove favorite
- `GET /api/mobile/favorites/salons/:id/check` - Check if favorited
- `GET /api/mobile/favorites/salons/ids` - Get all IDs
- Same endpoints for stylists

#### Referrals (via router) ✅
- `GET /api/mobile/referrals/my-code` - Get referral code
- `GET /api/mobile/referrals/stats` - Referral stats
- `GET /api/mobile/referrals/history` - Referral history
- `POST /api/mobile/referrals/validate` - Validate code
- `POST /api/mobile/referrals/apply` - Apply code
- `POST /api/mobile/referrals/complete/:id` - Complete referral

---

### Priority 1: Implement Missing Backend Endpoints
Estimated effort: 3-5 days
- User profile GET endpoint
- Bookings/appointments CRUD for mobile
- Offers API suite (full implementation)
- Deposit payment flow endpoints
- Push token unregister endpoint

### Priority 2: Additional Enhancements
Estimated effort: 3-5 days
- Weekly job to recalculate optimal rebooking channels/timing
- Gift card push notifications (received, expiry reminders)

---

## Platform Overview

| Platform | Users | Purpose |
|----------|-------|---------|
| **Web** | Customers + Business Owners/Staff | Full platform access for both customer booking and salon management |
| **Mobile App** | Customers Only | Customer-facing features for booking, payments, and engagement |

### Feature Availability by Platform

| Feature | Web (Customer) | Web (Business) | Mobile (Customer) |
|---------|----------------|----------------|-------------------|
| Smart Rebooking Reminders | Receive reminders | Configure settings | Receive reminders + Quick book |
| No-Show Protection | Pay deposits | Configure policies | Pay deposits |
| Client Notes & Preferences | View own preferences (if enabled) | Full management | View own preferences (if enabled) |
| Gift Cards | Purchase + Redeem | Accept redemption | Purchase + Send + View balance |

---

## Feature 1: Smart Rebooking Reminders

### Overview
Automated reminder system that encourages customers to rebook services based on their service history and optimal rebooking cycles.

### Specifications

| Aspect | Decision |
|--------|----------|
| **Notification Channel** | Smart Selection - System learns and uses the channel customer responds to most (SMS, Email, or Push) |
| **Timing Logic** | Dual option for salon owners: AI-based prediction (learns from customer patterns) OR Custom cycle per service |
| **Reminder Content** | Full package: Personalized message + Quick-book button with suggested slots + Optional discount/offer |

### Technical Requirements

#### Database Schema Additions
- `service_rebooking_cycles` - Store default rebooking period per service
- `customer_rebooking_patterns` - Track actual rebooking behavior for AI learning
- `customer_channel_preferences` - Track response rates per notification channel
- `rebooking_reminders` - Log of sent reminders and their outcomes

#### Business Logic
1. **AI-Based Prediction:**
   - Analyze customer's historical booking patterns
   - Calculate average days between same-service bookings
   - Adjust reminder timing based on individual behavior

2. **Custom Cycle (Salon Owner Setting):**
   - Allow owner to set days for each service (e.g., Haircut = 28 days, Facial = 30 days)
   - Override AI prediction if custom cycle is set

3. **Smart Channel Selection:**
   - Track open rates for emails, click-through for SMS, engagement for push
   - Default to highest-performing channel per customer
   - Fall back to all channels if no history exists

#### API Endpoints
- `POST /api/rebooking/settings` - Salon owner configures cycles
- `GET /api/rebooking/suggestions/:customerId` - Get rebooking suggestions
- `POST /api/rebooking/send-reminder` - Trigger reminder (manual or scheduled)
- `POST /api/rebooking/track-response` - Track customer response for AI learning

#### Scheduled Jobs
- Daily job to identify customers due for rebooking reminders
- Weekly job to recalculate optimal channels and timing

### Platform-Specific UI/UX

#### Web - Business Owner Dashboard
- **Settings Page:** Configure rebooking cycles per service
- **Toggle:** Enable AI-based prediction vs manual cycles
- **Analytics:** View reminder performance (sent, opened, booked)
- **Manual Trigger:** Send reminder to specific customer

#### Web - Customer View
- **Email/SMS:** Receive styled reminder with "Book Now" button
- **Booking Page:** See "Recommended for you" section based on history

#### Mobile App - Customer View
- **Push Notification:** Rich notification with service name + quick action
- **Home Screen:** "Time to rebook" card with one-tap booking
- **Booking Flow:** Pre-filled with last service details
- **Offers:** Display any attached discount code

---

## Feature 2: No-Show Protection (Deposits & Card-on-File)

### Overview
Protect salons from revenue loss due to no-shows by requiring deposits or saved cards for high-value services.

### Specifications

| Aspect | Decision |
|--------|----------|
| **Trigger Method** | Combination: Price threshold + Manual toggle per service + Category-based (salon owner chooses method) |
| **Deposit Amount** | Percentage of service cost (salon owner sets: 20%, 25%, 50%, etc.) |
| **Cancellation Policy** | Salon owner sets their own cancellation window (12hr, 24hr, 48hr, 72hr) |
| **Trusted Customers** | Card-on-file option available - trusted/repeat customers can skip deposit if card is saved |

### Technical Requirements

#### Database Schema Additions
- `deposit_settings` - Salon-level deposit configuration
- `service_deposit_rules` - Per-service deposit requirements
- `customer_saved_cards` - Tokenized card references (via Razorpay)
- `trusted_customers` - Salon-specific trusted customer list
- `deposit_transactions` - Track deposits, refunds, forfeitures
- `cancellation_policies` - Salon-specific cancellation windows

#### Business Logic
1. **Deposit Trigger Rules (checked in order):**
   - Is service manually marked as "require deposit"? → Require
   - Is service in a protected category (Bridal, Premium)? → Require
   - Is service price above salon's threshold? → Require
   - Is customer in trusted list with saved card? → Waive deposit

2. **Deposit Flow:**
   - Calculate deposit amount (service price × salon's percentage)
   - Collect via Razorpay during booking
   - Hold in platform escrow until appointment

3. **Cancellation/Refund Flow:**
   - Check time until appointment vs salon's cancellation window
   - If within window → Process refund
   - If outside window → Forfeit deposit to salon
   - No-show → Forfeit deposit to salon

4. **Card-on-File Flow:**
   - Customer saves card via Razorpay tokenization
   - Salon marks customer as "trusted"
   - Future bookings skip deposit collection
   - No-show → Charge cancellation fee to saved card

#### API Endpoints
- `POST /api/deposits/settings` - Configure salon deposit rules
- `GET /api/deposits/check/:serviceId/:customerId` - Check if deposit required
- `POST /api/deposits/collect` - Process deposit payment
- `POST /api/deposits/refund` - Process cancellation refund
- `POST /api/cards/save` - Save customer card token
- `POST /api/customers/trust` - Mark customer as trusted

#### Razorpay Integration
- Use Razorpay Tokenization API for card-on-file
- Use Razorpay Transfers for deposit to salon after appointment

### Platform-Specific UI/UX

#### Web - Business Owner Dashboard
- **Settings Page:** 
  - Set deposit percentage (20%, 25%, 50%, custom)
  - Set price threshold for auto-deposit
  - Toggle deposit requirement per service
  - Set category-based rules (e.g., all "Bridal" services)
  - Configure cancellation window (12hr/24hr/48hr/72hr)
- **Customer Management:**
  - View/manage trusted customers list
  - See customers with saved cards
  - Manual override to waive deposit for specific booking
- **Deposit Analytics:**
  - Total deposits collected
  - Refunds processed
  - No-show forfeitures

#### Web - Customer View
- **Booking Flow:**
  - Clear deposit requirement notice before payment
  - Deposit amount displayed prominently
  - Cancellation policy shown
  - Option to save card for future bookings
- **My Account:**
  - View saved cards
  - Manage card-on-file
  - View deposit history (paid, refunded, forfeited)

#### Mobile App - Customer View
- **Booking Flow:**
  - Deposit requirement badge on service card
  - Inline deposit payment via Razorpay
  - Clear cancellation policy display
  - "Save card for faster checkout" prompt
- **Profile Section:**
  - Saved payment methods management
  - Deposit transaction history
- **Notifications:**
  - Deposit confirmation
  - Refund processed alerts
  - Reminder of cancellation policy before appointment

---

## Feature 3: Client Notes & Preferences (Formula Tracking)

### Overview
Comprehensive client profile system allowing stylists to record preferences, formulas, and notes for personalized service.

### Specifications

| Aspect | Decision |
|--------|----------|
| **Access Control** | All staff can view, only assigned stylist + manager can edit |
| **Data Types** | Structured fields + Free text notes + Photo attachments (before/after) |
| **Customer Visibility** | Salon owner chooses what's visible to customer |
| **Display Timing** | Auto-popup when customer books showing their history/notes |

### Technical Requirements

#### Database Schema Additions
- `client_profiles` - Extended customer profiles per salon
- `client_notes` - Free-text notes with timestamps and author
- `client_formulas` - Structured formula data (hair color, treatments)
- `client_preferences` - Structured preferences (allergies, likes, dislikes)
- `client_photos` - Before/after photo storage
- `profile_visibility_settings` - What customers can see

#### Structured Fields to Capture

**Hair Services:**
- Hair type (straight, wavy, curly, coily)
- Hair condition (healthy, damaged, color-treated)
- Color formula (base, developer, timing, additives)
- Previous colors/treatments history

**Skin Services:**
- Skin type (oily, dry, combination, sensitive)
- Known allergies/sensitivities
- Preferred products
- Contraindications

**General Preferences:**
- Preferred stylist
- Communication style (chatty, quiet)
- Beverage preferences
- Special requirements

#### Business Logic
1. **Permission System:**
   - View: All authenticated staff at salon
   - Edit: Assigned stylist (from booking) OR salon manager/owner
   - Delete: Salon manager/owner only

2. **Auto-Display Logic:**
   - When booking created → Check for existing client profile
   - If exists → Show popup with key notes + photo history
   - Highlight: allergies, special requirements, last service notes

3. **Customer Visibility Control:**
   - Salon settings: Show all / Show preferences only / Hide all
   - Per-field toggle for sensitive notes

4. **Photo Management:**
   - Compress and store before/after photos
   - Link to specific appointment/service
   - Allow comparison view (before vs after)

#### API Endpoints
- `GET /api/clients/:id/profile` - Get full client profile
- `POST /api/clients/:id/notes` - Add note
- `PUT /api/clients/:id/formulas` - Update formula
- `POST /api/clients/:id/photos` - Upload before/after photo
- `GET /api/clients/:id/history` - Get service history with notes
- `PUT /api/salons/:id/visibility-settings` - Configure customer visibility

#### Storage
- Use cloud storage for photos (with CDN)
- Implement image compression before upload
- Set retention policy for photos

### Platform-Specific UI/UX

#### Web - Business Owner/Staff Dashboard
- **Client Profile Panel (in Appointment View):**
  - Sidebar showing full client history
  - Tabbed sections: Notes, Formulas, Photos, Preferences
  - Quick-add buttons for common entries
  - Edit permissions based on role (stylist vs manager)
- **Photo Gallery:**
  - Before/after comparison slider
  - Upload photos directly from appointment
  - Date-stamped photo timeline
- **Settings:**
  - Configure customer visibility (show all / preferences only / hide all)
  - Per-field visibility toggles
- **Auto-Popup on Booking:**
  - When new booking arrives, show client notes popup
  - Highlight allergies and special requirements in red
  - Show last 3 service notes

#### Web - Customer View
- **My Profile Section:**
  - View preferences the salon has recorded (if visibility enabled)
  - Update personal preferences (allergies, special requirements)
  - View before/after photos from past visits
- **Booking Confirmation:**
  - Reminder of saved preferences displayed

#### Mobile App - Customer View
- **Profile Tab:**
  - "My Beauty Profile" section
  - View saved preferences and allergies
  - Update personal preferences
  - View photo gallery of past transformations
- **Booking Flow:**
  - "Add special notes for this visit" text field
  - See "Stylist knows your preferences" badge if profile exists
- **Post-Appointment:**
  - Option to view and save before/after photos

---

## Feature 4: Gift Cards / Digital Vouchers

### Overview
Platform-wide digital gift card system allowing customers to purchase and gift salon experiences.

### Specifications

| Aspect | Decision |
|--------|----------|
| **Denominations** | Both fixed (₹500, ₹1000, ₹2000, ₹5000) + Custom amount option |
| **Redemption Scope** | Platform-wide - redeemable at any SalonHub salon |
| **Delivery Method** | Email + SMS + Scheduled delivery for future dates (birthdays, anniversaries) |
| **Expiry** | Fixed 1 year from purchase date |
| **Partial Redemption** | No - must use full value in single transaction |

### Technical Requirements

#### Database Schema Additions
- `gift_cards` - Main gift card records
- `gift_card_transactions` - Purchase and redemption history
- `gift_card_deliveries` - Scheduled delivery queue
- `gift_card_templates` - Design templates for occasions

#### Gift Card Data Model
```
gift_cards:
- id (UUID)
- code (unique redemption code)
- amount (in paisa)
- purchaser_id (customer who bought)
- recipient_email
- recipient_phone
- recipient_name
- message (personal message)
- occasion (birthday, anniversary, thank you, etc.)
- purchase_date
- expiry_date (purchase_date + 1 year)
- scheduled_delivery_date (optional)
- delivery_status (pending, sent, delivered)
- redemption_status (unused, redeemed, expired)
- redeemed_at_salon_id (when used)
- redeemed_date
```

#### Business Logic
1. **Purchase Flow:**
   - Customer selects amount (fixed or custom)
   - Enters recipient details
   - Optionally schedules future delivery
   - Pays via Razorpay
   - Gift card created with unique code

2. **Delivery Flow:**
   - Immediate: Send email + SMS with QR code immediately
   - Scheduled: Queue for delivery on specified date
   - Daily job processes scheduled deliveries

3. **Redemption Flow:**
   - Customer presents code/QR at any salon
   - Staff enters code in system
   - System validates: not expired, not used, amount sufficient
   - Apply full amount to booking
   - If service < gift card value → Balance forfeited (no partial use)
   - Mark as redeemed

4. **Revenue Distribution:**
   - Platform holds gift card funds
   - On redemption: Transfer amount to redeeming salon
   - Platform fee deducted at transfer

5. **Expiry Handling:**
   - Send reminder 30 days before expiry
   - Send final reminder 7 days before expiry
   - Auto-expire after 1 year (funds retained by platform)

#### API Endpoints
- `GET /api/gift-cards/denominations` - Get available denominations
- `POST /api/gift-cards/purchase` - Buy a gift card
- `POST /api/gift-cards/validate/:code` - Validate gift card
- `POST /api/gift-cards/redeem` - Redeem gift card
- `GET /api/gift-cards/my-cards` - Customer's purchased cards
- `GET /api/gift-cards/received` - Gift cards received by customer

#### Email/SMS Templates
- Purchase confirmation (to buyer)
- Gift card delivery (to recipient)
- Expiry reminder (30 days)
- Final expiry warning (7 days)
- Redemption confirmation (to buyer + recipient)

#### QR Code Generation
- Generate unique QR code containing gift card code
- Include in email as image
- Scannable at salon for quick redemption

### Platform-Specific UI/UX

#### Web - Business Owner/Staff Dashboard
- **Redemption Interface:**
  - Enter gift card code manually OR scan QR
  - Display card details (amount, expiry, buyer info)
  - Apply to current booking with one click
  - Show if amount covers full service or partial (forfeit notice)
- **Reports:**
  - Gift cards redeemed at salon
  - Revenue from gift card redemptions
  - Monthly gift card analytics

#### Web - Customer View
- **Gift Cards Page (in Shop/Profile):**
  - "Buy a Gift Card" prominent CTA
  - Amount selection (₹500, ₹1000, ₹2000, ₹5000, Custom)
  - Recipient form (name, email, phone, message)
  - Occasion selector (Birthday, Anniversary, Thank You, Just Because)
  - Schedule delivery date picker (optional)
  - Card design preview
- **My Gift Cards Section:**
  - Cards I've purchased (with status: delivered, pending)
  - Cards I've received (with balance and expiry)
  - Track redemption status
- **Booking Flow:**
  - "Have a gift card?" option at payment
  - Enter code to apply

#### Mobile App - Customer View
- **Gift Cards Tab (in Profile or Shop):**
  - Beautiful card carousel for amount selection
  - Quick recipient entry form
  - Occasion emoji picker
  - Date scheduler with calendar
  - Share via WhatsApp/SMS option
- **My Wallet Section:**
  - Received gift cards with QR code display
  - Balance and expiry countdown
  - "Use Now" button linking to salon search
- **Booking Flow:**
  - "Apply Gift Card" button at checkout
  - QR scanner to scan from printed/forwarded card
- **Notifications:**
  - "You received a gift card!" push notification
  - Expiry reminders (30 days, 7 days)
  - Redemption confirmation

---

## Implementation Priority & Timeline

### Recommended Order

| Priority | Feature | Complexity | Est. Time | Dependencies |
|----------|---------|------------|-----------|--------------|
| 1 | Client Notes & Preferences | Medium | 1-2 weeks | Photo storage setup |
| 2 | No-Show Protection | High | 2-3 weeks | Razorpay tokenization |
| 3 | Gift Cards | High | 2-3 weeks | Payment escrow system |
| 4 | Smart Rebooking Reminders | Medium | 1-2 weeks | Notification system ready |

### Rationale
1. **Client Notes** - Quick win, improves salon operations immediately
2. **No-Show Protection** - Critical for salon revenue protection
3. **Gift Cards** - Revenue generator, good for festive season launch
4. **Rebooking Reminders** - Needs historical data, can learn over time

---

## Integration Requirements

### External Services
- **Razorpay** - Payments, tokenization, transfers (already integrated)
- **SendGrid** - Email notifications (already integrated)
- **Twilio** - SMS notifications (already integrated)
- **Cloud Storage** - Photo uploads for client profiles

### Internal Dependencies
- Notification system must support scheduled delivery
- Background job system for reminders and expiry handling
- Staff permission system for client notes access control

---

## Success Metrics

### Feature 1: Smart Rebooking Reminders
- Rebooking rate increase (target: +20%)
- Reminder open rate (target: >40%)
- Reminder-to-booking conversion (target: >15%)

### Feature 2: No-Show Protection
- No-show rate reduction (target: -50%)
- Deposit collection rate (target: >90% for protected services)
- Customer satisfaction (no negative impact)

### Feature 3: Client Notes
- Staff adoption rate (target: >80% of appointments have notes)
- Customer satisfaction improvement
- Repeat booking rate increase

### Feature 4: Gift Cards
- Gift card sales volume
- Redemption rate (target: >70%)
- New customer acquisition via gift cards

---

## Appendix: User Interface Mockup Descriptions

### Rebooking Reminder (Customer View)
- Personalized message with service name and last visit date
- Prominent "Book Now" button
- Suggested time slots based on availability
- Optional offer/discount badge

### Deposit Flow (Customer View)
- Clear explanation of deposit requirement
- Amount shown before payment
- Cancellation policy displayed
- Option to save card for future

### Client Notes (Staff View)
- Sidebar in appointment view
- Tabbed sections: Notes, Formulas, Photos, Preferences
- Quick-add buttons for common entries
- Photo gallery with date stamps

### Gift Card Purchase (Customer View)
- Beautiful card design preview
- Amount selector (fixed + custom)
- Recipient details form
- Personal message input
- Schedule delivery date picker
- Payment flow

---

*Document approved by: [Pending]*  
*Implementation start date: [TBD]*
