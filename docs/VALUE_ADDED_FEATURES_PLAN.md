# SalonHub Value-Added Features Plan

**Document Version:** 1.1  
**Created:** December 2024  
**Status:** Pre-Production Planning

---

## Executive Summary

This document outlines the implementation plan for 4 high-impact value-added features to enhance SalonHub's competitive advantage before production launch. Each feature specification is based on detailed requirements analysis.

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
