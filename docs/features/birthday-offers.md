# Birthday Offers System

## Overview
Automatically send personalized birthday discounts to customers during their birthday month, driving visits during a personally significant time and building emotional connection with the brand.

## Business Value
- **For Customers**: Feel valued with personalized offers; special treatment on their birthday
- **For Salons**: Increased bookings during typically slow periods; customer loyalty boost
- **For Platform**: Higher engagement; emotional brand connection; word-of-mouth marketing

---

## Database Schema

### Table: `birthday_offers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| salon_id | varchar | FK → salons.id, NULL | NULL for platform-wide |
| name | text | NOT NULL | Offer name |
| discount_type | varchar(20) | NOT NULL | 'percentage', 'fixed', 'free_service' |
| discount_value | integer | NOT NULL | Percentage or paisa amount |
| min_booking_value_paisa | integer | NULL | Minimum booking for offer |
| max_discount_paisa | integer | NULL | Cap on discount |
| applicable_service_ids | text[] | NULL | NULL = all services |
| valid_days_before | integer | NOT NULL, DEFAULT 7 | Days before birthday |
| valid_days_after | integer | NOT NULL, DEFAULT 7 | Days after birthday |
| is_combinable | integer | NOT NULL, DEFAULT 0 | Can combine with other offers |
| message_template | text | NULL | Custom birthday message |
| is_active | integer | NOT NULL, DEFAULT 1 | Active status |
| created_at | timestamp | DEFAULT NOW() | When created |
| updated_at | timestamp | DEFAULT NOW() | Last update |

### Indexes
- `birthday_offers_salon_id_idx` on (salon_id)
- `birthday_offers_active_idx` on (is_active)

### Drizzle Schema
```typescript
export const birthdayOffers = pgTable("birthday_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  discountValue: integer("discount_value").notNull(),
  minBookingValuePaisa: integer("min_booking_value_paisa"),
  maxDiscountPaisa: integer("max_discount_paisa"),
  applicableServiceIds: text("applicable_service_ids").array(),
  validDaysBefore: integer("valid_days_before").notNull().default(7),
  validDaysAfter: integer("valid_days_after").notNull().default(7),
  isCombinable: integer("is_combinable").notNull().default(0),
  messageTemplate: text("message_template"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("birthday_offers_salon_id_idx").on(table.salonId),
  index("birthday_offers_active_idx").on(table.isActive),
]);
```

### Table: `user_birthdays`

Store user birthday information (separate from main user table for privacy).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| user_id | varchar | FK → users.id, NOT NULL, UNIQUE | User |
| birth_date | text | NOT NULL | Birthday (YYYY-MM-DD) |
| birth_month | integer | NOT NULL | Month (1-12) for queries |
| birth_day | integer | NOT NULL | Day (1-31) for queries |
| year_optional | integer | NULL | Year if provided |
| verified | integer | NOT NULL, DEFAULT 0 | ID verified |
| reminder_sent_this_year | integer | NOT NULL, DEFAULT 0 | Offer sent this year |
| last_reminder_sent_at | timestamp | NULL | When last sent |
| created_at | timestamp | DEFAULT NOW() | When added |
| updated_at | timestamp | DEFAULT NOW() | Last update |

### Indexes
- `user_birthdays_user_id_idx` on (user_id) UNIQUE
- `user_birthdays_month_day_idx` on (birth_month, birth_day)

### Table: `birthday_offer_claims`

Track birthday offer usage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| offer_id | varchar | FK → birthday_offers.id, NOT NULL | Claimed offer |
| salon_id | varchar | FK → salons.id, NOT NULL | Where claimed |
| year | integer | NOT NULL | Birthday year claimed |
| discount_code | varchar(50) | NOT NULL, UNIQUE | Generated code |
| valid_from | text | NOT NULL | Start of validity |
| valid_until | text | NOT NULL | End of validity |
| booking_id | varchar | FK → bookings.id, NULL | Booking where used |
| discount_applied_paisa | integer | NULL | Actual discount |
| status | varchar(20) | NOT NULL, DEFAULT 'issued' | 'issued', 'used', 'expired' |
| claimed_at | timestamp | DEFAULT NOW() | When issued |
| used_at | timestamp | NULL | When used |

### Indexes
- `birthday_offer_claims_user_year_idx` on (user_id, year)
- `birthday_offer_claims_code_idx` on (discount_code) UNIQUE
- `birthday_offer_claims_status_idx` on (status)

---

## API Endpoints

### POST /api/user/birthday
Set or update user birthday.

**Request Body:**
```json
{
  "birthDate": "1990-05-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Birthday saved",
  "birthdayOffers": {
    "eligibleForOffers": true,
    "nextBirthdayDate": "2026-05-15",
    "daysUntilBirthday": 157
  }
}
```

### GET /api/user/birthday-offers
Get available birthday offers for current user.

**Response:**
```json
{
  "isWithinBirthdayWindow": true,
  "birthdayDate": "2025-12-10",
  "windowStart": "2025-12-03",
  "windowEnd": "2025-12-17",
  "offers": [
    {
      "id": "uuid",
      "salon": { "id": "uuid", "name": "Glow Salon", "imageUrl": "..." },
      "name": "Birthday Special - 20% Off",
      "discountType": "percentage",
      "discountValue": 20,
      "maxDiscount": "₹500",
      "validUntil": "2025-12-17",
      "code": "BDAY-JOHN-2025",
      "status": "available",
      "message": "Happy Birthday, John! 🎂 Enjoy 20% off your next visit!"
    }
  ],
  "claimedOffers": [
    {
      "id": "uuid",
      "salonName": "Style Studio",
      "code": "BDAY-JOHN-2025-SS",
      "status": "used",
      "usedAt": "2025-12-08T14:30:00Z",
      "discountApplied": 30000
    }
  ]
}
```

### POST /api/birthday-offers/claim
Claim a birthday offer (generates code).

**Request Body:**
```json
{
  "offerId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "claim": {
    "id": "uuid",
    "code": "BDAY-JOHN-2025-GS",
    "validFrom": "2025-12-03",
    "validUntil": "2025-12-17",
    "discount": "20% off up to ₹500"
  }
}
```

### POST /api/bookings/:bookingId/apply-birthday-offer
Apply birthday offer to booking.

**Request Body:**
```json
{
  "code": "BDAY-JOHN-2025-GS"
}
```

### GET /api/salons/:salonId/birthday-offer
Get salon's birthday offer configuration (owner).

### PUT /api/salons/:salonId/birthday-offer
Configure salon's birthday offer (owner).

**Request Body:**
```json
{
  "enabled": true,
  "discountType": "percentage",
  "discountValue": 20,
  "maxDiscountPaisa": 50000,
  "validDaysBefore": 7,
  "validDaysAfter": 7,
  "messageTemplate": "Happy Birthday, {{name}}! 🎂 Celebrate with {{discount}} off at {{salon}}!"
}
```

---

## Business Rules

### Birthday Window
- Default: 7 days before to 7 days after birthday
- Configurable per salon (1-30 days each direction)
- User can book anytime in window and apply offer

### Offer Limits
- One birthday offer per salon per year
- Multiple salons can each offer birthday discounts
- Platform-wide offer applies if no salon-specific offer

### Code Generation
Format: `BDAY-{FIRST_NAME}-{YEAR}-{SALON_CODE}`
Example: `BDAY-JOHN-2025-GS`

### Discount Calculation
```
if discountType == 'percentage':
  discount = bookingAmount * (discountValue / 100)
  discount = min(discount, maxDiscountPaisa)
elif discountType == 'fixed':
  discount = discountValue
elif discountType == 'free_service':
  discount = selectedServicePrice (up to discountValue limit)
```

### Notification Schedule
- 7 days before: "Your birthday is coming! Here are your special offers"
- On birthday: "Happy Birthday! Don't forget to use your discount"
- 3 days before expiry: "Your birthday offer expires soon!"

---

## Corner Cases

### Edge Case 1: February 29 Birthday
**Scenario**: User born on leap day.
**Solution**: On non-leap years, birthday window centers on Feb 28.

### Edge Case 2: Birthday Not Set
**Scenario**: User hasn't added birthday.
**Solution**: Prompt to add birthday when viewing offers. Show "Add birthday to unlock special offers".

### Edge Case 3: Same-Day Birthday Entry
**Scenario**: User adds birthday on their actual birthday.
**Solution**: Immediately eligible for offers. Window extends from today to +7 days.

### Edge Case 4: Birthday Offer + Other Offer
**Scenario**: User has birthday offer and another valid offer.
**Solution**: If `is_combinable = 0`, apply only birthday offer (typically higher value). If 1, stack discounts.

### Edge Case 5: Booking Cancelled After Offer Used
**Scenario**: User books with birthday offer, then cancels.
**Solution**: Restore offer to "issued" status. User can reuse within validity window.

### Edge Case 6: Year of Birth Unknown
**Scenario**: User only provides month/day.
**Solution**: Allow. Store year_optional as NULL. Still enable offers.

### Edge Case 7: Mid-Year Offer Configuration Change
**Scenario**: Salon changes offer from 20% to 15% after some users claimed.
**Solution**: Existing claims honor original terms. New claims get updated offer.

### Edge Case 8: New Salon After Birthday Window Started
**Scenario**: User's birthday window started, then they visit new salon.
**Solution**: New salon's offer available immediately. Fresh claim.

### Edge Case 9: User Changes Birthday
**Scenario**: User tries to change birthday to trigger new offers.
**Solution**: Allow one birthday change per year. Log changes. Second change requires verification.

### Edge Case 10: Service-Specific Offers
**Scenario**: Birthday offer only valid for certain services.
**Solution**: Check `applicable_service_ids` array. Show applicable services in UI.

---

## Implementation Plan

### Phase 1: Database Setup (1 day)
1. Create birthday_offers table
2. Create user_birthdays table
3. Create birthday_offer_claims table

### Phase 2: User Birthday Flow (1 day)
1. Birthday entry endpoint
2. Birthday validation
3. Privacy controls

### Phase 3: Offer Engine (2 days)
1. Window calculation logic
2. Code generation
3. Claim and redemption

### Phase 4: Notification System (2 days)
1. Birthday detection cron job
2. Push notification templates
3. Email templates

### Phase 5: Web Integration (1 day)
1. Birthday entry in profile
2. Birthday offers section
3. Code application at checkout

### Phase 6: Mobile Integration (1 day)
1. Birthday entry screen
2. Birthday offers list
3. Special birthday UI treatment

### Phase 7: Salon Configuration (1 day)
1. Birthday offer settings page
2. Message template editor
3. Analytics dashboard

---

## Notifications

### Pre-Birthday (7 days before)
```
🎂 Your birthday is coming up, {{name}}!
Special offers are waiting for you at your favorite salons.
[View Birthday Offers]
```

### On Birthday
```
🎉 HAPPY BIRTHDAY, {{name}}! 🎉
Celebrate with 20% off at Glow Salon!
Your special code: BDAY-JOHN-2025-GS
Valid until Dec 17.
[Book Now]
```

### Expiry Reminder (3 days before)
```
⏰ Your birthday offer expires in 3 days!
Don't miss out on 20% off at Glow Salon.
[Use Before It's Gone]
```

---

## Mobile UI/UX

### Birthday Entry
- Calendar picker for date
- Optional year toggle
- "Why we ask" explanation
- Privacy assurance

### Birthday Offers Screen
- Festive confetti animation on birthday
- Countdown to birthday
- Offer cards with salon info
- Code display with copy button
- "Book with this offer" CTA

### Booking Checkout
- Auto-detect available birthday offer
- "Use Birthday Discount" toggle
- Show savings preview

---

## Web UI/UX

### Profile Settings
- Birthday field with datepicker
- Change limit warning

### Offers Page
- Birthday section when in window
- Claimed vs available offers
- Usage history

### Salon Owner Dashboard
- Birthday offer configuration
- Preview of customer message
- Analytics: redemption rate, revenue impact

---

## Email Template

```html
Subject: 🎂 Happy Birthday, {{firstName}}! Your special gift awaits

<header>
  🎉 Happy Birthday, {{firstName}}!
</header>

<body>
  It's your special day, and we want to celebrate with you!
  
  Here's a gift from us:
  
  <gift-card>
    {{discountValue}}% OFF
    at {{salonName}}
    
    Code: {{offerCode}}
    Valid: {{validFrom}} - {{validUntil}}
  </gift-card>
  
  <cta>Book Your Birthday Treat</cta>
</body>
```

---

---

## Migration & Integration Notes

### Migration Steps
```sql
-- Migration: 007_add_birthday_offers.sql
-- Depends on: users, salons, bookings tables

CREATE TABLE IF NOT EXISTS birthday_offers (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id VARCHAR(255) REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_service')),
  discount_value INTEGER NOT NULL,
  min_booking_value_paisa INTEGER,
  max_discount_paisa INTEGER,
  applicable_service_ids TEXT[],
  valid_days_before INTEGER NOT NULL DEFAULT 7,
  valid_days_after INTEGER NOT NULL DEFAULT 7,
  is_combinable INTEGER NOT NULL DEFAULT 0,
  message_template TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_birthdays (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  birth_date TEXT NOT NULL,
  birth_month INTEGER NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
  birth_day INTEGER NOT NULL CHECK (birth_day BETWEEN 1 AND 31),
  year_optional INTEGER,
  verified INTEGER NOT NULL DEFAULT 0,
  reminder_sent_this_year INTEGER NOT NULL DEFAULT 0,
  last_reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS birthday_offer_claims (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id VARCHAR(255) NOT NULL REFERENCES birthday_offers(id) ON DELETE CASCADE,
  salon_id VARCHAR(255) NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  discount_code VARCHAR(50) NOT NULL UNIQUE,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  booking_id VARCHAR(255) REFERENCES bookings(id) ON DELETE SET NULL,
  discount_applied_paisa INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'used', 'expired')),
  claimed_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);

CREATE INDEX birthday_offers_salon_id_idx ON birthday_offers(salon_id);
CREATE INDEX user_birthdays_month_day_idx ON user_birthdays(birth_month, birth_day);
CREATE INDEX birthday_offer_claims_user_year_idx ON birthday_offer_claims(user_id, year);
CREATE INDEX birthday_offer_claims_status_idx ON birthday_offer_claims(status);
```

### Timezone Handling
```typescript
// User timezone stored in user preferences or inferred from salon location
function calculateBirthdayWindow(birthDate: string, userTimezone: string): { start: Date, end: Date } {
  const userNow = utcToZonedTime(new Date(), userTimezone);
  const thisYearBirthday = parse(
    `${getYear(userNow)}-${format(parseISO(birthDate), 'MM-dd')}`,
    'yyyy-MM-dd',
    new Date()
  );
  
  return {
    start: subDays(thisYearBirthday, 7),
    end: addDays(thisYearBirthday, 7),
  };
}
```

### Users Without Verified Birthday
- Prompt to add birthday when viewing offers
- Birthday verification optional but shown as "Verified" badge
- Non-verified birthdays can only be changed once per year
- Admin can verify birthday via ID check

### Integration with Existing Offers
```typescript
// Offer stacking logic in server/utils/offerCalculator.ts
function calculateBestOffer(booking: Booking, availableOffers: Offer[]): AppliedOffer {
  const birthdayOffer = availableOffers.find(o => o.type === 'birthday');
  const platformOffer = availableOffers.find(o => o.type === 'platform');
  
  // Birthday offers take precedence unless combinable
  if (birthdayOffer && !birthdayOffer.isCombinable) {
    return birthdayOffer;
  }
  
  // Stack if combinable
  if (birthdayOffer?.isCombinable && platformOffer) {
    return combineOffers(birthdayOffer, platformOffer);
  }
  
  return getBestValueOffer([birthdayOffer, platformOffer]);
}
```

### Service Integration Points
- **Offer Service**: Integrate with existing `platform_offers` table logic
- **Booking Service**: Apply birthday discount in booking creation flow
- **Notification Service**: Daily cron checks for upcoming birthdays
- **Loyalty Service**: Birthday offers can stack with loyalty points (configurable)

### Auth Requirements
| Endpoint | Role | Description |
|----------|------|-------------|
| POST /api/user/birthday | customer | Own birthday only |
| GET /api/user/birthday-offers | customer | Own offers only |
| POST /api/birthday-offers/claim | customer | Own offers only |
| GET /api/salons/:id/birthday-offer | salon_owner | Own salon config |
| PUT /api/salons/:id/birthday-offer | salon_owner | Own salon config |

### Background Jobs
- **Daily Birthday Check**: 6 AM - find users with upcoming birthdays, send offers
- **Expiry Cleanup**: Daily - mark expired claims as 'expired'
- **Year Reset**: Jan 1 - reset `reminder_sent_this_year` for all users

---

## Testing Checklist

- [ ] Birthday saved correctly
- [ ] Leap year handling works
- [ ] Window calculation correct
- [ ] Offer code generated uniquely
- [ ] Discount applied correctly
- [ ] One offer per salon per year enforced
- [ ] Cancelled booking restores offer
- [ ] Notifications sent at right times
- [ ] Birthday change limit enforced
- [ ] Service-specific offers filter correctly
- [ ] Expired offers marked correctly
- [ ] Platform-wide offer fallback works
- [ ] Combinability rules work
- [ ] Mobile and web flows identical
- [ ] Timezone handling correct
- [ ] Non-verified birthday restrictions work
