# Customer Membership Package System Specification

## Overview

This document outlines the comprehensive membership package feature for StudioHub, enabling salons to offer 6-month and 1-year membership subscriptions to customers with recurring benefits, discounts, and perks.

## Business Value

### For Salon Owners
- **Predictable recurring revenue** - Stable cash flow from monthly/annual fees
- **Higher customer retention** - Members visit 2-3x more frequently
- **Increased lifetime value** - Members spend 40-60% more overall
- **Reduced marketing costs** - Less spend on acquiring new customers
- **Business valuation boost** - Recurring revenue increases business worth

### For Customers
- **Cost savings** - Discounted services during membership period
- **VIP treatment** - Priority booking, exclusive perks
- **Budget-friendly** - Spread costs over time for regular treatments
- **Exclusive access** - Member-only offers and early access

---

## Membership Models

### Model 1: Tiered Discount Membership
Fixed monthly/annual fee unlocks percentage discounts on all services.

**Example:**
- Silver (6 months): ₹2,999 - 10% off all services
- Gold (12 months): ₹4,999 - 15% off all services + priority booking
- Platinum (12 months): ₹9,999 - 20% off + priority + free monthly add-on

### Model 2: Credit/Beauty Bank Membership
Monthly payment builds service credits with bonus value.

**Example:**
- ₹2,000/month → ₹2,400 service credit (20% bonus)
- Credits roll over for membership duration
- Additional 10% off products

### Model 3: Packaged Service Membership
Fixed services included per month/period.

**Example:**
- Hair Care Plan: 1 haircut + 2 blowouts/month
- Spa Wellness: 2 massages + 1 facial/month
- Grooming Club: Unlimited beard trims + 1 haircut/month

---

## Use Cases

### UC-1: Salon Creates Membership Plan
**Actor:** Salon Owner/Admin
**Flow:**
1. Navigate to Business Dashboard → Membership Management
2. Click "Create Membership Plan"
3. Select membership type (Discount/Credit/Packaged)
4. Configure:
   - Plan name and description
   - Duration (6 months / 12 months / custom)
   - Pricing (one-time or monthly billing)
   - Benefits (discount %, credits, included services)
   - Perks (priority booking, free add-ons)
5. Set availability and limits
6. Publish plan

### UC-2: Customer Purchases Membership
**Actor:** Customer
**Flow:**
1. View salon's membership plans on salon page
2. Select desired plan
3. Review benefits and terms
4. Proceed to payment
5. Complete payment (Razorpay)
6. Receive membership confirmation
7. Membership becomes active immediately

### UC-3: Customer Uses Membership Benefits
**Actor:** Customer
**Flow:**
1. Book service at member salon
2. System auto-applies membership discount
3. For credit-based: deducts from credit balance
4. For packaged: marks included service as used
5. Completes booking with reduced/zero payment

### UC-4: Customer Views Membership Status
**Actor:** Customer
**Flow:**
1. Navigate to "My Memberships" in profile
2. View active memberships
3. See remaining credits/services
4. Check expiry date
5. View usage history

### UC-5: Membership Renewal
**Actor:** Customer
**Flow:**
1. System sends renewal reminder (30, 7, 1 days before expiry)
2. Customer receives notification
3. Customer can:
   - Auto-renew (if enabled)
   - Manually renew
   - Let membership expire

### UC-6: Salon Manages Members
**Actor:** Salon Owner/Admin
**Flow:**
1. View all active members
2. Check member usage statistics
3. Pause/cancel memberships
4. Process refunds if needed
5. View revenue from memberships

### UC-7: Walk-in Customer Membership Lookup
**Actor:** Staff
**Flow:**
1. Customer arrives at salon
2. Staff looks up by phone number
3. System shows active membership
4. Staff applies membership benefits
5. Complete service

---

## Database Schema

### New Tables

#### 1. `membership_plans` - Salon's Membership Offerings
```sql
CREATE TABLE membership_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id VARCHAR NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Plan Type
  plan_type VARCHAR(20) NOT NULL, -- 'discount', 'credit', 'packaged'
  
  -- Duration
  duration_months INTEGER NOT NULL, -- 6, 12, etc.
  
  -- Pricing
  price_in_paisa INTEGER NOT NULL, -- Total membership price
  billing_type VARCHAR(20) NOT NULL DEFAULT 'one_time', -- 'one_time', 'monthly'
  monthly_price_in_paisa INTEGER, -- If monthly billing
  
  -- Discount Benefits (for 'discount' type)
  discount_percentage INTEGER, -- e.g., 15 for 15%
  discount_applies_to VARCHAR(20) DEFAULT 'all', -- 'all', 'services', 'products'
  
  -- Credit Benefits (for 'credit' type)
  credit_amount_in_paisa INTEGER, -- Monthly credit value
  bonus_percentage INTEGER, -- e.g., 20 for 20% bonus credits
  credits_rollover INTEGER DEFAULT 1, -- Can unused credits roll over?
  
  -- Perks
  priority_booking INTEGER DEFAULT 0,
  free_cancellation INTEGER DEFAULT 0,
  birthday_bonus_in_paisa INTEGER,
  referral_bonus_in_paisa INTEGER,
  additional_perks TEXT, -- JSON array of custom perks
  
  -- Limits
  max_members INTEGER, -- NULL = unlimited
  max_uses_per_month INTEGER, -- For packaged plans
  
  -- Availability
  is_active INTEGER NOT NULL DEFAULT 1,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `membership_plan_services` - Services Included in Packaged Plans
```sql
CREATE TABLE membership_plan_services (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  service_id VARCHAR NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  salon_id VARCHAR NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  
  quantity_per_month INTEGER NOT NULL DEFAULT 1, -- How many times per month
  is_unlimited INTEGER DEFAULT 0, -- Unlimited usage
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `customer_memberships` - Customer's Active Memberships
```sql
CREATE TABLE customer_memberships (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_id VARCHAR NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  plan_id VARCHAR NOT NULL REFERENCES membership_plans(id),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', 
  -- 'active', 'paused', 'cancelled', 'expired', 'pending_payment'
  
  -- Dates
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  next_billing_date TIMESTAMP, -- For monthly billing
  paused_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Credit Balance (for credit-based plans)
  credit_balance_in_paisa INTEGER DEFAULT 0,
  total_credits_earned_in_paisa INTEGER DEFAULT 0,
  total_credits_used_in_paisa INTEGER DEFAULT 0,
  
  -- Payment
  total_paid_in_paisa INTEGER NOT NULL,
  razorpay_subscription_id VARCHAR, -- For recurring billing
  
  -- Renewal
  auto_renew INTEGER DEFAULT 0,
  renewal_reminder_sent INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `membership_service_usage` - Track Packaged Service Usage
```sql
CREATE TABLE membership_service_usage (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id VARCHAR NOT NULL REFERENCES customer_memberships(id) ON DELETE CASCADE,
  service_id VARCHAR NOT NULL REFERENCES services(id),
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  booking_id VARCHAR REFERENCES bookings(id),
  
  -- Usage tracking
  usage_month DATE NOT NULL, -- First day of the month
  quantity_used INTEGER NOT NULL DEFAULT 1,
  
  used_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. `membership_credit_transactions` - Credit Transaction History
```sql
CREATE TABLE membership_credit_transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id VARCHAR NOT NULL REFERENCES customer_memberships(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type VARCHAR(20) NOT NULL, 
  -- 'credit_added', 'credit_used', 'credit_expired', 'bonus_added', 'refund'
  
  amount_in_paisa INTEGER NOT NULL,
  balance_after_in_paisa INTEGER NOT NULL,
  
  -- Reference
  booking_id VARCHAR REFERENCES bookings(id),
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. `membership_payments` - Payment History
```sql
CREATE TABLE membership_payments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id VARCHAR NOT NULL REFERENCES customer_memberships(id) ON DELETE CASCADE,
  customer_id VARCHAR NOT NULL REFERENCES users(id),
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  
  -- Payment details
  amount_in_paisa INTEGER NOT NULL,
  payment_type VARCHAR(20) NOT NULL, -- 'initial', 'renewal', 'monthly'
  
  -- Payment gateway
  razorpay_payment_id VARCHAR,
  razorpay_order_id VARCHAR,
  payment_status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  
  -- Dates
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Integration with Existing Tables

### 1. `bookings` Table
**New Fields:**
```sql
ALTER TABLE bookings ADD COLUMN membership_id VARCHAR REFERENCES customer_memberships(id);
ALTER TABLE bookings ADD COLUMN membership_discount_in_paisa INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN membership_credits_used_in_paisa INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN is_membership_service INTEGER DEFAULT 0; -- Included in package
```

**Integration Logic:**
- When booking created, check if customer has active membership
- Apply discount percentage or deduct credits
- For packaged plans, mark as included service if within quota

### 2. `payments` Table
**Integration:**
- Membership payments link to `membership_payments` table
- `booking_id` can reference bookings with membership discounts
- Revenue tracking includes membership revenue category

### 3. `users` Table
**New Fields:**
```sql
ALTER TABLE users ADD COLUMN has_active_membership INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN membership_tier VARCHAR(20); -- 'silver', 'gold', 'platinum'
```

### 4. `salons` Table
**New Fields:**
```sql
ALTER TABLE salons ADD COLUMN membership_enabled INTEGER DEFAULT 0;
ALTER TABLE salons ADD COLUMN active_members_count INTEGER DEFAULT 0;
```

### 5. `analytics_events` Table
**New Event Types:**
- `membership_purchased`
- `membership_renewed`
- `membership_cancelled`
- `membership_credit_used`
- `membership_service_redeemed`

---

## API Endpoints

### Salon Management
```
POST   /api/salons/:salonId/membership-plans          # Create plan
GET    /api/salons/:salonId/membership-plans          # List plans
GET    /api/salons/:salonId/membership-plans/:planId  # Get plan details
PUT    /api/salons/:salonId/membership-plans/:planId  # Update plan
DELETE /api/salons/:salonId/membership-plans/:planId  # Delete plan
GET    /api/salons/:salonId/members                   # List all members
GET    /api/salons/:salonId/membership-analytics      # Revenue, usage stats
```

### Customer APIs
```
GET    /api/salons/:salonId/memberships/available     # View available plans
POST   /api/memberships/purchase                      # Purchase membership
GET    /api/my/memberships                            # My active memberships
GET    /api/my/memberships/:id                        # Membership details
GET    /api/my/memberships/:id/usage                  # Usage history
POST   /api/my/memberships/:id/pause                  # Pause membership
POST   /api/my/memberships/:id/resume                 # Resume membership
POST   /api/my/memberships/:id/cancel                 # Cancel membership
POST   /api/my/memberships/:id/renew                  # Renew membership
```

### Mobile APIs
```
GET    /api/mobile/salons/:salonId/memberships        # View plans (mobile)
POST   /api/mobile/memberships/purchase               # Purchase (mobile)
GET    /api/mobile/my/memberships                     # My memberships (mobile)
```

---

## UI Components

### Customer Side
1. **Membership Plans Card** - Display on salon page
2. **Membership Purchase Modal** - Plan selection & payment
3. **My Memberships Page** - View active memberships
4. **Membership Details Card** - Credits, usage, expiry
5. **Membership Badge** - Show on profile/booking

### Business Dashboard
1. **Membership Management Tab** - Under Business Setup
2. **Create/Edit Plan Form** - Plan configuration
3. **Members List View** - All active members
4. **Membership Analytics Cards** - Revenue, growth, churn
5. **Member Profile Section** - In client profiles

---

## Notifications

### Customer Notifications
| Event | Channel | Timing |
|-------|---------|--------|
| Membership Activated | Email, Push, SMS | Immediate |
| Credits Added (monthly) | Push | On billing date |
| Low Credit Balance | Push | When < 20% remaining |
| Renewal Reminder | Email, Push | 30, 7, 1 days before |
| Membership Expired | Email, Push | On expiry |
| Payment Failed | Email, Push, SMS | Immediate |

### Salon Notifications
| Event | Channel | Timing |
|-------|---------|--------|
| New Member Joined | Push, Dashboard | Immediate |
| Member Cancelled | Email, Dashboard | Immediate |
| Monthly MRR Report | Email | 1st of month |

---

## Reporting & Analytics

### Salon Dashboard Metrics
- **Total Active Members** - Count by plan type
- **Monthly Recurring Revenue (MRR)** - From memberships
- **Churn Rate** - Cancellations / Total members
- **Average Revenue Per Member** - Total revenue / members
- **Usage Rate** - % of credits/services used
- **Retention Rate** - Renewals / Expiring memberships

### Financial Reports
- Membership revenue vs regular revenue
- Revenue by plan type
- Refunds and cancellations
- Outstanding credits liability

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2) ✅ COMPLETE
- [x] Create database tables (6 new tables)
- [x] Implement membership plan CRUD APIs
- [x] Build plan management UI in dashboard

### Phase 2: Purchase Flow (Week 2-3) ✅ COMPLETE
- [x] Customer-facing plan display (MembershipPlansCard on salon profile)
- [x] Razorpay integration for membership payments
- [x] Purchase confirmation & activation

### Phase 3: Benefits Application (Week 3-4) ✅ COMPLETE
- [x] Discount application during booking (calculateMembershipBenefits API)
- [x] Credit deduction system (applyMembershipToBooking)
- [x] Service quota tracking (with duplicate service handling in same booking)

### Phase 4: Management & Analytics (Week 4-5) ✅ COMPLETE
- [x] Member management dashboard (MembershipManagement component)
- [x] Usage tracking & reports (CustomerMemberships component)
- [x] Pause/Resume/Cancel functionality with confirmation dialogs

### Phase 5: Mobile & Polish (Week 5-6) - PENDING
- [ ] Mobile app integration
- [ ] Testing & optimization
- [ ] Launch & monitoring

---

## Security Considerations

1. **Payment Security** - Use Razorpay's subscription APIs for recurring billing
2. **Access Control** - Only salon owner/admin can manage plans
3. **Credit Integrity** - All credit transactions are logged and auditable
4. **Rate Limiting** - Prevent abuse of membership benefits
5. **Refund Policy** - Clear terms, prorated refunds based on usage

---

## Future Enhancements

1. **Family/Group Memberships** - Share benefits with family
2. **Corporate Memberships** - B2B plans for companies
3. **Referral Rewards** - Bonus credits for member referrals
4. **Loyalty Integration** - Earn loyalty points on membership purchases
5. **Multi-Salon Memberships** - Chain-wide membership access
6. **AI Recommendations** - Suggest optimal plan based on visit history
