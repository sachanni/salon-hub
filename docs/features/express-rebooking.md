# Express Rebooking System

## Overview
Enable customers to rebook their previous appointments with a single tap, pre-filling all service, staff, and time preferences from their last visit. This significantly reduces booking friction and increases repeat visits.

## Business Value
- **For Customers**: Book in seconds instead of minutes; no need to remember preferences
- **For Salons**: Higher rebooking rates; reduced time-to-next-visit
- **For Platform**: Increased booking velocity; better customer retention metrics

---

## Database Schema

### Table: `user_booking_preferences`

Stores derived preferences from booking history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| salon_id | varchar | FK → salons.id, NOT NULL | Preferred salon |
| preferred_staff_id | varchar | FK → staff.id, NULL | Most booked staff |
| preferred_service_ids | text[] | NULL | Top 3 services booked |
| preferred_day_of_week | integer | NULL | Most common day (0-6) |
| preferred_time_slot | varchar(20) | NULL | 'morning', 'afternoon', 'evening' |
| preferred_time_exact | text | NULL | Most common exact time (HH:MM) |
| average_booking_interval_days | integer | NULL | Days between bookings |
| last_booking_id | varchar | FK → bookings.id, NULL | Most recent completed booking |
| last_booking_date | text | NULL | Date of last booking |
| total_completed_bookings | integer | NOT NULL, DEFAULT 0 | Count of completed bookings |
| total_spent_paisa | integer | NOT NULL, DEFAULT 0 | Total lifetime spend |
| updated_at | timestamp | DEFAULT NOW() | Last preference update |
| created_at | timestamp | DEFAULT NOW() | First booking at salon |

### Indexes
- `user_booking_preferences_user_id_idx` on (user_id)
- `user_booking_preferences_salon_id_idx` on (salon_id)
- UNIQUE on (user_id, salon_id)

### Drizzle Schema
```typescript
export const userBookingPreferences = pgTable("user_booking_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  preferredStaffId: varchar("preferred_staff_id").references(() => staff.id, { onDelete: "set null" }),
  preferredServiceIds: text("preferred_service_ids").array(),
  preferredDayOfWeek: integer("preferred_day_of_week"),
  preferredTimeSlot: varchar("preferred_time_slot", { length: 20 }),
  preferredTimeExact: text("preferred_time_exact"),
  averageBookingIntervalDays: integer("average_booking_interval_days"),
  lastBookingId: varchar("last_booking_id").references(() => bookings.id, { onDelete: "set null" }),
  lastBookingDate: text("last_booking_date"),
  totalCompletedBookings: integer("total_completed_bookings").notNull().default(0),
  totalSpentPaisa: integer("total_spent_paisa").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("user_booking_preferences_user_id_idx").on(table.userId),
  index("user_booking_preferences_salon_id_idx").on(table.salonId),
  uniqueIndex("user_booking_preferences_user_salon_unique").on(table.userId, table.salonId),
]);
```

### Table: `rebook_suggestions`

Pre-computed rebooking suggestions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| user_id | varchar | FK → users.id, NOT NULL | Target customer |
| salon_id | varchar | FK → salons.id, NOT NULL | Suggested salon |
| suggested_date | text | NOT NULL | Recommended booking date |
| suggested_time | text | NOT NULL | Recommended time |
| suggested_service_ids | text[] | NOT NULL | Services to book |
| suggested_staff_id | varchar | FK → staff.id, NULL | Recommended staff |
| confidence_score | integer | NOT NULL | 1-100 how confident in suggestion |
| reason | varchar(50) | NOT NULL | Why suggested (interval, reminder, etc.) |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 'pending', 'shown', 'accepted', 'dismissed' |
| shown_at | timestamp | NULL | When shown to user |
| responded_at | timestamp | NULL | When user acted |
| expires_at | timestamp | NOT NULL | When suggestion expires |
| created_at | timestamp | DEFAULT NOW() | When generated |

---

## API Endpoints

### GET /api/rebook/suggestions
Get personalized rebooking suggestions for current user.

**Response:**
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "salon": {
        "id": "uuid",
        "name": "Glow Salon",
        "imageUrl": "...",
        "rating": 4.8
      },
      "suggestedDate": "2025-12-20",
      "suggestedTime": "10:30",
      "services": [
        { "id": "uuid", "name": "Haircut", "priceInPaisa": 50000, "durationMinutes": 45 }
      ],
      "staff": { "id": "uuid", "name": "Sarah", "photoUrl": "..." },
      "estimatedTotal": 50000,
      "reason": "It's been 4 weeks since your last haircut",
      "confidenceScore": 85,
      "slotAvailable": true
    }
  ],
  "lastVisits": [
    {
      "salonId": "uuid",
      "salonName": "Glow Salon",
      "lastVisitDate": "2025-11-22",
      "daysSince": 28,
      "services": ["Haircut", "Beard Trim"]
    }
  ]
}
```

### POST /api/rebook/quick
One-tap rebooking - book exact same services/staff at suggested time.

**Request Body:**
```json
{
  "suggestionId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "salonName": "Glow Salon",
    "date": "2025-12-20",
    "time": "10:30",
    "services": ["Haircut"],
    "staffName": "Sarah",
    "totalAmountPaisa": 50000
  }
}
```

### POST /api/rebook/customize
Accept suggestion but modify details.

**Request Body:**
```json
{
  "suggestionId": "uuid",
  "modifications": {
    "date": "2025-12-21",
    "time": "14:00",
    "addServiceIds": ["uuid"],
    "removeServiceIds": [],
    "staffId": "different-staff-uuid"
  }
}
```

### POST /api/rebook/dismiss
Dismiss a suggestion.

**Request Body:**
```json
{
  "suggestionId": "uuid",
  "reason": "not_now"
}
```

### GET /api/rebook/last-booking/:salonId
Get last booking details for a specific salon.

**Response:**
```json
{
  "lastBooking": {
    "id": "uuid",
    "date": "2025-11-22",
    "time": "10:30",
    "services": [...],
    "staff": {...},
    "totalPaid": 50000
  },
  "nextAvailableSlot": {
    "date": "2025-12-15",
    "time": "10:30",
    "available": true
  },
  "suggestedRebookDate": "2025-12-20"
}
```

---

## Preference Learning Algorithm

### Data Collection (On Each Completed Booking)
```typescript
async function updatePreferences(booking: Booking) {
  const existingPref = await getPreferences(booking.userId, booking.salonId);
  
  // Update staff preference (most booked)
  const staffCounts = await getStaffBookingCounts(booking.userId, booking.salonId);
  const topStaff = staffCounts[0];
  
  // Update service preferences (top 3)
  const serviceCounts = await getServiceBookingCounts(booking.userId, booking.salonId);
  const topServices = serviceCounts.slice(0, 3).map(s => s.serviceId);
  
  // Calculate preferred time slot
  const timeSlot = classifyTimeSlot(booking.bookingTime);
  const dayCounts = await getDayOfWeekCounts(booking.userId, booking.salonId);
  const preferredDay = dayCounts[0].dayOfWeek;
  
  // Calculate average interval
  const bookings = await getCompletedBookings(booking.userId, booking.salonId);
  const intervals = calculateIntervals(bookings);
  const avgInterval = Math.round(average(intervals));
  
  await upsertPreferences({
    userId: booking.userId,
    salonId: booking.salonId,
    preferredStaffId: topStaff?.staffId,
    preferredServiceIds: topServices,
    preferredDayOfWeek: preferredDay,
    preferredTimeSlot: timeSlot,
    preferredTimeExact: booking.bookingTime,
    averageBookingIntervalDays: avgInterval,
    lastBookingId: booking.id,
    lastBookingDate: booking.bookingDate,
    totalCompletedBookings: existingPref.totalCompletedBookings + 1,
    totalSpentPaisa: existingPref.totalSpentPaisa + booking.finalAmountPaisa,
  });
}
```

### Suggestion Generation (Daily Cron)
```typescript
async function generateRebookSuggestions() {
  const preferences = await getAllPreferencesWithDueRebooking();
  
  for (const pref of preferences) {
    const dueDate = addDays(pref.lastBookingDate, pref.averageBookingIntervalDays);
    
    // Find next available slot matching preferences
    const slot = await findMatchingSlot({
      salonId: pref.salonId,
      staffId: pref.preferredStaffId,
      dayOfWeek: pref.preferredDayOfWeek,
      timeSlot: pref.preferredTimeSlot,
      startDate: dueDate,
      lookAheadDays: 14,
    });
    
    if (slot) {
      await createSuggestion({
        userId: pref.userId,
        salonId: pref.salonId,
        suggestedDate: slot.date,
        suggestedTime: slot.time,
        suggestedServiceIds: pref.preferredServiceIds,
        suggestedStaffId: pref.preferredStaffId,
        confidenceScore: calculateConfidence(pref),
        reason: `It's been ${pref.averageBookingIntervalDays} days since your last visit`,
        expiresAt: addDays(dueDate, 7),
      });
    }
  }
}
```

### Confidence Score Calculation
```
Base Score: 50

+ 10 if preferred staff available at suggested time
+ 10 if suggested time matches exact preferred time
+ 5 if suggested day matches preferred day of week
+ 15 if user has 5+ completed bookings at salon
+ 10 if user accepted last 2 suggestions
- 20 if user dismissed last suggestion
- 10 if booking interval varies significantly
```

---

## Business Rules

### Suggestion Timing
- Generate suggestions 3 days before "due date" (avgInterval from lastBooking)
- Show reminder push notification on due date
- Allow booking up to 14 days ahead

### Slot Availability
- Always verify slot availability before showing suggestion
- If exact slot unavailable, suggest nearest alternative
- Update `slotAvailable` field in real-time on API call

### Quick Book Flow
- Bypass service/staff selection
- Go directly to confirmation screen
- Pre-fill payment method from last booking
- One tap to confirm

---

## Corner Cases

### Edge Case 1: Staff No Longer at Salon
**Scenario**: User's preferred staff left the salon.
**Solution**: Remove staffId from preferences. Suggest "Any available staff" or most-rated staff.

### Edge Case 2: Service Discontinued
**Scenario**: User's preferred service no longer offered.
**Solution**: Find similar service (same category). If none, show alternative services.

### Edge Case 3: Price Increased Since Last Visit
**Scenario**: Service price is now higher than before.
**Solution**: Show price comparison. "Haircut: ₹500 (was ₹450)". User acknowledges before booking.

### Edge Case 4: User Has Multiple Salons
**Scenario**: User books at 3 different salons regularly.
**Solution**: Show suggestions for each salon separately. Rank by recency and frequency.

### Edge Case 5: First-Time Visitor
**Scenario**: User only has 1 completed booking.
**Solution**: Wait for 2+ bookings before generating suggestions. Use industry-standard intervals (haircut: 4 weeks).

### Edge Case 6: Irregular Booking Pattern
**Scenario**: User books every 2 weeks, then 2 months gap.
**Solution**: Use median instead of mean for interval. Ignore outliers > 2 standard deviations.

### Edge Case 7: Conflicting Preferences
**Scenario**: User prefers Monday 10am, but staff only works Tuesday-Saturday.
**Solution**: Prioritize staff over time. Suggest closest available time with preferred staff.

### Edge Case 8: Suggestion Already Booked
**Scenario**: User manually books before seeing suggestion.
**Solution**: Auto-dismiss suggestion. Show "Already booked!" if they view it.

### Edge Case 9: Salon Temporarily Closed
**Scenario**: Salon on vacation during suggested period.
**Solution**: Find next available date after reopening. Update suggestion.

---

## Implementation Plan

### Phase 1: Preference Tracking (2 days)
1. Create `user_booking_preferences` table
2. Build preference update logic on booking completion
3. Backfill preferences from existing booking history

### Phase 2: Suggestion Engine (3 days)
1. Create `rebook_suggestions` table
2. Implement suggestion generation algorithm
3. Build confidence scoring system
4. Set up daily cron job

### Phase 3: API Layer (2 days)
1. Suggestions list endpoint
2. Quick book endpoint
3. Customize booking endpoint
4. Dismiss suggestion endpoint

### Phase 4: Web Integration (2 days)
1. Rebook banner on customer dashboard
2. "Book Again" button on past bookings
3. Suggestion cards with one-tap booking

### Phase 5: Mobile Integration (2 days)
1. Rebook suggestions on home screen
2. Push notifications for due rebooking
3. Quick-book deep link handling

### Phase 6: Analytics (1 day)
1. Track suggestion acceptance rate
2. Track average time-to-rebook
3. A/B test suggestion timing

---

## Mobile UI/UX

### Home Screen Widget
- "Book Again" card for each salon with pending rebook
- Shows: Salon name, days since last visit, suggested date
- One-tap "Book Now" button
- "Customize" link for modifications

### Push Notifications
- 3 days before due: "Time for your next haircut at Glow Salon?"
- On due date: "Your 4-week haircut appointment is due today!"
- Deep link opens quick-book confirmation

### Booking History Screen
- "Rebook" button on each past booking
- Shows staff photo and "Book same again" option

---

## Web UI/UX

### Customer Dashboard
- Rebook suggestions section
- Calendar view of suggested dates
- One-click booking with confirmation modal

### Past Bookings Page
- "Book Again" button on each completed booking
- Hover shows quick preview of what would be booked

---

## Testing Checklist

- [x] Preferences updated correctly on booking completion
  - Implemented in `expressRebooking.service.ts` → `updatePreferencesAfterBooking()`
- [x] Suggestions generated for users with 2+ bookings
  - Implemented in `expressRebooking.service.ts` → `generateSuggestionsForAllUsers()` with `MIN_BOOKINGS_FOR_SUGGESTIONS = 2`
- [x] Confidence score calculated correctly
  - Implemented in `expressRebooking.service.ts` → `calculateConfidence()`
- [x] Quick book creates booking with correct details
  - Implemented in `expressRebooking.service.ts` → `quickBook()` with transaction locking
- [x] Customize flow allows modifications
  - Implemented in `expressRebooking.service.ts` → `customizeBook()` with date/time/staff/service modifications
- [x] Dismissed suggestions not shown again
  - Implemented: suggestions filtered by status in `getSuggestionsForUser()`
- [x] Staff change handled gracefully
  - Partial: Staff info included in suggestions; `preferredStaffId` set to null if staff deleted (cascade)
- [ ] Price change shown in suggestion
  - NOT IMPLEMENTED: Suggestions don't compare current vs. historical prices
- [ ] Push notifications sent at correct times
  - NOT IMPLEMENTED: No push notification integration for rebooking reminders
- [x] Suggestions expire correctly
  - Implemented in `expressRebookingJobs.ts` → hourly cron job runs `expireOldSuggestions()`
- [x] Slot availability verified in real-time
  - Implemented in `getSuggestionsForUser()` → `checkSlotAvailable()` with batched conflict check
- [x] Analytics tracking works
  - Partial: Basic analytics via `storage.getRebookingDashboardAnalytics()`. A/B testing NOT implemented.

## Implementation Status

### Phase 1: Preference Tracking ✅ COMPLETE
- [x] `user_booking_preferences` table created (schema.ts)
- [x] Preference update logic on booking completion
- [ ] Backfill preferences from existing booking history (manual trigger only)

### Phase 2: Suggestion Engine ✅ COMPLETE
- [x] `rebook_suggestions` table created (schema.ts)
- [x] Suggestion generation algorithm
- [x] Confidence scoring system
- [x] Daily cron job (6 AM) + hourly expiration

### Phase 3: API Layer ✅ COMPLETE
- [x] GET /api/express-rebook/suggestions
- [x] POST /api/express-rebook/quick
- [x] POST /api/express-rebook/customize
- [x] POST /api/express-rebook/dismiss
- [x] GET /api/express-rebook/last-booking/:salonId

### Phase 4: Web Integration ✅ COMPLETE
- [x] ExpressRebookCard component on customer dashboard
- [x] RebookConfirmationModal for one-click booking
- [x] Last visits display

### Phase 5: Mobile Integration ✅ MOSTLY COMPLETE
- [x] Mobile API routes registered
- [x] RebookingSuggestionsCard component
- [x] "Book Again" flow integration
- [ ] Push notifications for due rebooking (NOT IMPLEMENTED)
- [ ] Quick-book deep link handling (NOT IMPLEMENTED)

### Phase 6: Analytics ⚠️ PARTIAL
- [x] Basic dashboard analytics (acceptance count, reminders sent)
- [ ] Suggestion acceptance rate tracking
- [ ] Average time-to-rebook metrics
- [ ] A/B test suggestion timing
