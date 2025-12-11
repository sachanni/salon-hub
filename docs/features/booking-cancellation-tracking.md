# Booking Cancellation Tracking System

## Overview
Track and analyze why customers cancel bookings to help salons improve retention rates and identify service quality issues. This system captures structured cancellation reasons with optional free-text feedback.

## Business Value
- **For Salons**: Identify patterns in cancellations to improve services, scheduling, and customer experience
- **For Platform**: Aggregate insights to help all salons reduce cancellation rates
- **For Customers**: Quick, one-tap cancellation with optional feedback

---

## Database Schema

### Table: `booking_cancellations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| booking_id | varchar | FK → bookings.id, NOT NULL, UNIQUE | The cancelled booking |
| user_id | varchar | FK → users.id, NULL | Customer who cancelled (null if salon cancelled) |
| cancelled_by | varchar(20) | NOT NULL | 'customer', 'salon', 'system' |
| reason_code | varchar(50) | NOT NULL | Standardized reason code |
| reason_category | varchar(30) | NOT NULL | Category grouping |
| additional_comments | text | NULL | Optional free-text feedback |
| was_rescheduled | integer | NOT NULL, DEFAULT 0 | 1 if cancelled and rebooked same day |
| rescheduled_booking_id | varchar | FK → bookings.id, NULL | New booking if rescheduled |
| refund_requested | integer | NOT NULL, DEFAULT 0 | 1 if refund was requested |
| refund_amount_paisa | integer | NULL | Refund amount if applicable |
| cancellation_fee_paisa | integer | NULL | Fee charged for late cancellation |
| hours_before_appointment | integer | NULL | How many hours before the booking was cancelled |
| created_at | timestamp | DEFAULT NOW() | When cancellation occurred |

### Indexes
- `booking_cancellations_booking_id_idx` on (booking_id)
- `booking_cancellations_user_id_idx` on (user_id)
- `booking_cancellations_reason_code_idx` on (reason_code)
- `booking_cancellations_salon_date_idx` on (salon_id, created_at) - via join

### Drizzle Schema
```typescript
export const bookingCancellations = pgTable("booking_cancellations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().unique().references(() => bookings.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  cancelledBy: varchar("cancelled_by", { length: 20 }).notNull(), // 'customer', 'salon', 'system'
  reasonCode: varchar("reason_code", { length: 50 }).notNull(),
  reasonCategory: varchar("reason_category", { length: 30 }).notNull(),
  additionalComments: text("additional_comments"),
  wasRescheduled: integer("was_rescheduled").notNull().default(0),
  rescheduledBookingId: varchar("rescheduled_booking_id").references(() => bookings.id, { onDelete: "set null" }),
  refundRequested: integer("refund_requested").notNull().default(0),
  refundAmountPaisa: integer("refund_amount_paisa"),
  cancellationFeePaisa: integer("cancellation_fee_paisa"),
  hoursBeforeAppointment: integer("hours_before_appointment"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("booking_cancellations_booking_id_idx").on(table.bookingId),
  index("booking_cancellations_user_id_idx").on(table.userId),
  index("booking_cancellations_reason_code_idx").on(table.reasonCode),
  index("booking_cancellations_created_at_idx").on(table.createdAt),
]);
```

---

## Reason Codes

### Customer Cancellation Reasons

| Code | Category | Display Text (EN) | Display Text (HI) |
|------|----------|-------------------|-------------------|
| schedule_conflict | scheduling | I have a schedule conflict | मेरे शेड्यूल में बदलाव हो गया |
| found_better_price | pricing | Found a better price elsewhere | कहीं और बेहतर कीमत मिली |
| service_not_needed | changed_mind | No longer need the service | अब इस सेवा की जरूरत नहीं |
| health_issue | emergency | Feeling unwell / health issue | तबीयत ठीक नहीं है |
| family_emergency | emergency | Family emergency | पारिवारिक आपातकाल |
| travel_plans | scheduling | Travel plans changed | यात्रा की योजना बदल गई |
| staff_unavailable | salon_issue | Preferred staff not available | पसंदीदा स्टाफ उपलब्ध नहीं |
| long_wait_time | salon_issue | Expected long wait time | लंबा इंतजार का अनुमान |
| poor_reviews | trust | Read negative reviews | नकारात्मक समीक्षाएं पढ़ीं |
| booked_by_mistake | user_error | Booked by mistake | गलती से बुक हो गया |
| weather_conditions | external | Bad weather conditions | खराब मौसम की स्थिति |
| transportation_issue | external | Transportation problems | परिवहन की समस्या |
| financial_reason | pricing | Financial constraints | आर्थिक कारण |
| other | other | Other reason | अन्य कारण |

### Salon Cancellation Reasons

| Code | Category | Display Text |
|------|----------|--------------|
| staff_sick | staff | Staff member is sick |
| staff_emergency | staff | Staff emergency |
| equipment_issue | operations | Equipment malfunction |
| double_booking | operations | Scheduling error - double booked |
| salon_closed | operations | Salon closed unexpectedly |
| customer_no_show_history | policy | Customer has no-show history |
| other | other | Other reason |

### System Cancellation Reasons

| Code | Category | Description |
|------|----------|-------------|
| payment_failed | payment | Payment authorization failed |
| payment_timeout | payment | Customer didn't complete payment in time |
| slot_no_longer_available | system | Time slot became unavailable |
| service_discontinued | system | Service no longer offered |

---

## API Endpoints

### POST /api/bookings/:bookingId/cancel
Cancel a booking with reason tracking.

**Request Body:**
```json
{
  "reasonCode": "schedule_conflict",
  "additionalComments": "Meeting got rescheduled to the same time",
  "requestRefund": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "cancellation": {
    "id": "uuid",
    "refundStatus": "pending",
    "refundAmountPaisa": 50000,
    "cancellationFeePaisa": 0
  }
}
```

**Error Responses:**
- 400: Invalid reason code, booking already cancelled, booking already completed
- 403: User doesn't own this booking
- 404: Booking not found
- 409: Cancellation window expired (for no-refund cancellations)

### POST /api/mobile/bookings/:bookingId/cancel
Mobile-specific cancellation endpoint (same logic, mobile auth).

### GET /api/salons/:salonId/cancellation-analytics
Salon owner analytics dashboard.

**Query Parameters:**
- `startDate`: ISO date (default: 30 days ago)
- `endDate`: ISO date (default: today)
- `groupBy`: 'reason_code' | 'reason_category' | 'day' | 'week' | 'month'

**Response:**
```json
{
  "summary": {
    "totalCancellations": 45,
    "cancellationRate": 8.5,
    "topReasons": [
      { "code": "schedule_conflict", "count": 15, "percentage": 33.3 },
      { "code": "health_issue", "count": 8, "percentage": 17.8 }
    ],
    "averageHoursBeforeCancellation": 18.5,
    "rescheduledPercentage": 22.2,
    "refundRequestedPercentage": 15.5
  },
  "byCategory": {
    "scheduling": 20,
    "emergency": 12,
    "pricing": 5,
    "salon_issue": 4,
    "other": 4
  },
  "trend": [
    { "date": "2025-12-01", "count": 3 },
    { "date": "2025-12-02", "count": 5 }
  ]
}
```

### GET /api/admin/cancellation-insights
Platform-wide analytics (super admin only).

---

## Business Rules

### Cancellation Fee Policy
```
Hours Before Appointment | Fee
-------------------------|-----
> 24 hours              | No fee
12-24 hours             | 25% of booking value
6-12 hours              | 50% of booking value
< 6 hours               | 100% (no refund)
```

Configurable per salon in `salon_settings.cancellation_policy`.

### Refund Processing
1. Calculate hours before appointment
2. Apply cancellation fee based on policy
3. If deposit was paid, refund (deposit - fee) to wallet
4. If full payment was made, refund (total - fee) via original payment method

### Rescheduling Flow
1. User selects "Reschedule" instead of "Cancel"
2. System creates new booking first
3. Old booking marked as cancelled with `was_rescheduled = 1`
4. No cancellation fee applied for reschedules > 2 hours before
5. Links `rescheduled_booking_id` to new booking

---

## Corner Cases

### Edge Case 1: Simultaneous Cancellation
**Scenario**: Customer and salon both try to cancel at the same time.
**Solution**: Use database transaction with row-level locking. First cancellation wins.

### Edge Case 2: Payment In-Progress
**Scenario**: Customer cancels while payment is processing.
**Solution**: Check payment status before cancellation. If payment pending, wait for completion or timeout.

### Edge Case 3: Partial Refund Disputes
**Scenario**: Customer disputes cancellation fee.
**Solution**: Log all cancellation details. Allow salon owner to override fee manually with reason.

### Edge Case 4: No-Show vs Late Cancellation
**Scenario**: Customer cancels after appointment time passed.
**Solution**: Mark as `no_show` instead of cancellation. Different analytics bucket.

### Edge Case 5: Recurring Booking Cancellation
**Scenario**: Customer cancels one instance of recurring booking.
**Solution**: Cancel only specific instance. Show option to cancel all future instances.

### Edge Case 6: Staff Reassignment After Cancellation
**Scenario**: Customer cancelled because preferred staff unavailable, then staff becomes available.
**Solution**: Send notification asking if they want to rebook with preferred staff.

### Edge Case 7: Cancellation During Salon Holiday
**Scenario**: Salon marks day as holiday after customer booked.
**Solution**: Auto-cancel with `salon_closed` reason, full refund, send apology notification.

---

## Implementation Plan

### Phase 1: Database & Core API (3 days)
1. Create migration for `booking_cancellations` table
2. Implement cancellation reason validation
3. Update existing cancel booking endpoint to require reason
4. Add cancellation fee calculation logic

### Phase 2: Web Integration (2 days)
1. Customer booking detail page - add cancel button with reason modal
2. Salon dashboard - update cancellation confirmation flow
3. Add "Reschedule" option alongside "Cancel"

### Phase 3: Mobile Integration (2 days)
1. Booking detail screen - cancellation flow with reason picker
2. Add swipe-to-cancel with quick reason selection
3. Show cancellation fee preview before confirming

### Phase 4: Analytics Dashboard (2 days)
1. Salon owner cancellation analytics page
2. Charts: trend, by category, by time of day
3. Export to CSV functionality

### Phase 5: Notifications & Automation (1 day)
1. Send cancellation confirmation to customer
2. Notify salon of customer cancellation
3. Automated refund processing

---

## Mobile UI/UX

### Cancel Booking Flow
1. User taps "Cancel Booking" on booking detail
2. Show cancellation fee preview (if applicable)
3. Display reason picker (chips for common, "Other" opens text input)
4. Show "Reschedule Instead?" CTA before final cancel
5. Confirm cancellation with slide-to-confirm gesture
6. Show success animation with refund status

### Quick Cancel Gestures
- Long-press on booking card → quick cancel menu
- Swipe left on upcoming booking → cancel option

---

## Web UI/UX

### Customer Portal
- Booking detail page shows "Cancel" and "Reschedule" buttons
- Modal with reason selection and fee preview
- Confirmation step with clear refund amount display

### Salon Dashboard
- Cancellation tab in bookings section
- Filter by reason, date range, staff
- Bulk actions for pattern analysis

---

---

## Migration & Integration Notes

### Migration Steps
```sql
-- Migration: 001_add_booking_cancellations.sql
-- Depends on: bookings table exists

CREATE TABLE IF NOT EXISTS booking_cancellations (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(255) NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  cancelled_by VARCHAR(20) NOT NULL CHECK (cancelled_by IN ('customer', 'salon', 'system')),
  reason_code VARCHAR(50) NOT NULL,
  reason_category VARCHAR(30) NOT NULL,
  additional_comments TEXT,
  was_rescheduled INTEGER NOT NULL DEFAULT 0,
  rescheduled_booking_id VARCHAR(255) REFERENCES bookings(id) ON DELETE SET NULL,
  refund_requested INTEGER NOT NULL DEFAULT 0,
  refund_amount_paisa INTEGER,
  cancellation_fee_paisa INTEGER,
  hours_before_appointment INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX booking_cancellations_booking_id_idx ON booking_cancellations(booking_id);
CREATE INDEX booking_cancellations_user_id_idx ON booking_cancellations(user_id);
CREATE INDEX booking_cancellations_reason_code_idx ON booking_cancellations(reason_code);
CREATE INDEX booking_cancellations_created_at_idx ON booking_cancellations(created_at);
```

### Existing Schema Integration
- References `bookings.id` (varchar, UUID) - FK with CASCADE delete
- References `users.id` (varchar, UUID) - FK with SET NULL on delete
- Uses same ID pattern as existing tables: `varchar` with `gen_random_uuid()`
- All column names follow existing snake_case convention

### Service Integration Points
- **Booking Service**: Modify `server/routes.ts` cancel booking endpoint to require reason
- **Refund Service**: Integrate with existing Razorpay refund logic in `server/routes/payment.routes.ts`
- **Notification Service**: Use existing notification system in `server/routes/notification.routes.ts`
- **Mobile API**: Add to `server/routes/mobile-bookings.routes.ts` cancel endpoint

### Multi-Service Booking Handling
When a booking has multiple services via `booking_services` table:
- Cancel entire booking (all services) as a unit
- Refund calculation considers total of all services
- Fee calculation based on total booking value
- Cannot cancel individual services within a booking

### Auth Requirements
| Endpoint | Role | Description |
|----------|------|-------------|
| POST /api/bookings/:id/cancel | customer, salon_owner | Customer cancels own booking, owner cancels any |
| POST /api/mobile/bookings/:id/cancel | customer | Mobile customer cancellation |
| GET /api/salons/:id/cancellation-analytics | salon_owner | Salon owner only |
| GET /api/admin/cancellation-insights | super_admin | Platform admin only |

### Concurrency Handling
```typescript
// Use transaction with row-level lock
await db.transaction(async (tx) => {
  // Lock the booking row
  const [booking] = await tx.select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .for('update');
  
  if (booking.status === 'cancelled') {
    throw new Error('Booking already cancelled');
  }
  
  // Proceed with cancellation
  await tx.update(bookings).set({ status: 'cancelled' });
  await tx.insert(bookingCancellations).values({...});
});
```

---

## Testing Checklist

- [ ] Customer can cancel with valid reason code
- [ ] Invalid reason code returns 400
- [ ] Cancellation fee calculated correctly based on timing
- [ ] Refund amount correct after fee deduction
- [ ] Rescheduled bookings link correctly
- [ ] Analytics aggregate correctly by reason/category
- [ ] Concurrent cancellation attempts handled safely
- [ ] Salon cannot cancel completed bookings
- [ ] System cancellations trigger appropriate notifications
- [ ] Mobile and web cancellation flows work identically
- [ ] Multi-service bookings cancelled as unit
- [ ] Auth roles enforced correctly
