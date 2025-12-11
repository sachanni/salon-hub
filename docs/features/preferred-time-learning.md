# Preferred Time Learning System

## Overview
Analyze customer booking history to learn their preferred appointment times and days, then proactively suggest these times first when booking. This creates a personalized experience that reduces booking friction.

## Business Value
- **For Customers**: See preferred times first; faster booking process; feels personalized
- **For Salons**: Better slot utilization; reduced booking abandonment
- **For Platform**: Higher conversion rates; data-driven personalization

---

## Database Schema

### Table: `user_time_preferences`

Aggregated time preferences per user-salon pair.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| salon_id | varchar | FK → salons.id, NULL | NULL for global prefs |
| preferred_day_of_week | integer | NULL | Most common day (0-6) |
| preferred_time_slot | varchar(20) | NULL | 'morning', 'afternoon', 'evening' |
| preferred_time_exact | text | NULL | Most common exact time |
| day_distribution | jsonb | NOT NULL | { "0": 5, "1": 12, ... } bookings per day |
| time_distribution | jsonb | NOT NULL | { "09:00": 3, "10:00": 8, ... } |
| slot_distribution | jsonb | NOT NULL | { "morning": 10, "afternoon": 15, "evening": 5 } |
| total_bookings | integer | NOT NULL, DEFAULT 0 | Data points for confidence |
| confidence_score | integer | NOT NULL, DEFAULT 0 | 1-100 reliability |
| last_booking_at | timestamp | NULL | Most recent booking |
| updated_at | timestamp | DEFAULT NOW() | Last update |
| created_at | timestamp | DEFAULT NOW() | First booking |

### Indexes
- `user_time_preferences_user_id_idx` on (user_id)
- `user_time_preferences_salon_id_idx` on (salon_id)
- UNIQUE on (user_id, salon_id)

### Drizzle Schema
```typescript
export const userTimePreferences = pgTable("user_time_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }),
  preferredDayOfWeek: integer("preferred_day_of_week"),
  preferredTimeSlot: varchar("preferred_time_slot", { length: 20 }),
  preferredTimeExact: text("preferred_time_exact"),
  dayDistribution: jsonb("day_distribution").notNull().default('{}'),
  timeDistribution: jsonb("time_distribution").notNull().default('{}'),
  slotDistribution: jsonb("slot_distribution").notNull().default('{}'),
  totalBookings: integer("total_bookings").notNull().default(0),
  confidenceScore: integer("confidence_score").notNull().default(0),
  lastBookingAt: timestamp("last_booking_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("user_time_preferences_user_id_idx").on(table.userId),
  index("user_time_preferences_salon_id_idx").on(table.salonId),
  uniqueIndex("user_time_preferences_user_salon_unique").on(table.userId, table.salonId),
]);
```

### Table: `booking_time_analytics`

Detailed per-booking time data for analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| booking_id | varchar | FK → bookings.id, NOT NULL, UNIQUE | Booking reference |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| salon_id | varchar | FK → salons.id, NOT NULL | Salon |
| booking_date | text | NOT NULL | YYYY-MM-DD |
| booking_time | text | NOT NULL | HH:MM |
| day_of_week | integer | NOT NULL | 0-6 |
| time_slot | varchar(20) | NOT NULL | 'morning', 'afternoon', 'evening' |
| was_rescheduled | integer | NOT NULL, DEFAULT 0 | If originally different time |
| original_time | text | NULL | Original time if rescheduled |
| lead_time_hours | integer | NULL | Hours between booking and appointment |
| created_at | timestamp | DEFAULT NOW() | When recorded |

### Indexes
- `booking_time_analytics_user_id_idx` on (user_id)
- `booking_time_analytics_salon_id_idx` on (salon_id)

---

## Time Slot Classification

### Time Windows
| Slot | Time Range | Display |
|------|------------|---------|
| early_morning | 06:00 - 09:00 | Early Morning |
| morning | 09:00 - 12:00 | Morning |
| afternoon | 12:00 - 16:00 | Afternoon |
| evening | 16:00 - 19:00 | Evening |
| night | 19:00 - 22:00 | Night |

### Day Classification
- Weekday: Mon-Fri
- Weekend: Sat-Sun

---

## API Endpoints

### GET /api/user/time-preferences
Get current user's learned time preferences.

**Response:**
```json
{
  "global": {
    "preferredDayOfWeek": 6,
    "preferredDayName": "Saturday",
    "preferredTimeSlot": "morning",
    "preferredTimeExact": "10:30",
    "confidenceScore": 78,
    "basedOn": 15
  },
  "bySalon": [
    {
      "salonId": "uuid",
      "salonName": "Glow Salon",
      "preferredDayOfWeek": 6,
      "preferredTimeSlot": "morning",
      "preferredTimeExact": "10:00",
      "confidenceScore": 92,
      "basedOn": 8
    }
  ],
  "insights": {
    "mostActiveDay": "Saturday",
    "typicalBookingTime": "Morning (9am-12pm)",
    "averageLeadTime": "3 days in advance",
    "weekdayVsWeekend": "85% weekend"
  }
}
```

### GET /api/salons/:salonId/slots/personalized
Get available slots with personalized ordering.

**Query Parameters:**
- `date`: Target date
- `serviceId`: Service for duration

**Response:**
```json
{
  "date": "2025-12-20",
  "preferredSlots": [
    { "time": "10:00", "reason": "Your usual time", "available": true },
    { "time": "10:30", "reason": "Similar to usual", "available": true }
  ],
  "allSlots": [
    { "time": "09:00", "available": true },
    { "time": "09:30", "available": true },
    { "time": "10:00", "available": true, "preferred": true },
    { "time": "10:30", "available": true, "preferred": true }
  ],
  "suggestedDates": [
    { "date": "2025-12-21", "day": "Saturday", "preferredTimeAvailable": true },
    { "date": "2025-12-22", "day": "Sunday", "preferredTimeAvailable": false }
  ]
}
```

### GET /api/booking/smart-suggestions
Get smart booking suggestions based on preferences.

**Response:**
```json
{
  "suggestions": [
    {
      "salon": { "id": "uuid", "name": "Glow Salon" },
      "date": "2025-12-21",
      "time": "10:00",
      "reason": "Your preferred Saturday morning slot is available",
      "matchScore": 95
    }
  ]
}
```

### PUT /api/user/time-preferences/manual
Manually set time preferences.

**Request Body:**
```json
{
  "preferredDays": [5, 6],
  "preferredTimeSlot": "morning",
  "preferredTimeRange": { "start": "09:00", "end": "12:00" }
}
```

---

## Learning Algorithm

### Data Collection
```typescript
async function recordBookingTime(booking: Booking) {
  const dayOfWeek = getDayOfWeek(booking.bookingDate);
  const timeSlot = classifyTimeSlot(booking.bookingTime);
  
  await db.insert(bookingTimeAnalytics).values({
    bookingId: booking.id,
    userId: booking.userId,
    salonId: booking.salonId,
    bookingDate: booking.bookingDate,
    bookingTime: booking.bookingTime,
    dayOfWeek,
    timeSlot,
    leadTimeHours: calculateLeadTime(booking),
  });
  
  await updatePreferences(booking.userId, booking.salonId);
}
```

### Preference Calculation
```typescript
async function updatePreferences(userId: string, salonId: string) {
  const bookings = await getCompletedBookings(userId, salonId);
  
  // Day distribution
  const dayDistribution = {};
  for (const b of bookings) {
    const day = getDayOfWeek(b.bookingDate);
    dayDistribution[day] = (dayDistribution[day] || 0) + 1;
  }
  
  // Time distribution
  const timeDistribution = {};
  for (const b of bookings) {
    timeDistribution[b.bookingTime] = (timeDistribution[b.bookingTime] || 0) + 1;
  }
  
  // Slot distribution
  const slotDistribution = { morning: 0, afternoon: 0, evening: 0 };
  for (const b of bookings) {
    const slot = classifyTimeSlot(b.bookingTime);
    slotDistribution[slot]++;
  }
  
  // Find preferences
  const preferredDay = maxKey(dayDistribution);
  const preferredSlot = maxKey(slotDistribution);
  const preferredTime = maxKey(timeDistribution);
  
  // Calculate confidence (0-100)
  const confidence = calculateConfidence(bookings.length, dayDistribution, timeDistribution);
  
  await upsertPreferences({
    userId,
    salonId,
    preferredDayOfWeek: preferredDay,
    preferredTimeSlot: preferredSlot,
    preferredTimeExact: preferredTime,
    dayDistribution,
    timeDistribution,
    slotDistribution,
    totalBookings: bookings.length,
    confidenceScore: confidence,
  });
}
```

### Confidence Score
```
Base calculation:
- 5+ bookings: +30
- 10+ bookings: +50
- 20+ bookings: +70

Consistency bonus:
- Top day has 50%+ of bookings: +15
- Top time slot has 60%+ of bookings: +15
- Same exact time 3+ times: +10

Recency factor:
- Last booking < 30 days: +5
- Last booking > 90 days: -10

Max score: 100
```

---

## Business Rules

### Minimum Data
- Need 3+ completed bookings to start showing preferences
- Need 5+ bookings for "confident" recommendations
- Global preferences aggregate across all salons

### Preference Priority
1. Salon-specific preference (if 3+ bookings at that salon)
2. Global preference (aggregated across all salons)
3. Popular times (if user has no history)

### Slot Ordering
When showing available slots:
1. Preferred exact time (if available)
2. ±30 min from preferred time
3. Same time slot (morning/afternoon/evening)
4. Other available slots

### Date Suggestions
When suggesting dates:
1. Preferred day of week
2. Next occurrence of preferred day with preferred time available
3. Alternative days with preferred time available

---

## Corner Cases

### Edge Case 1: Inconsistent Pattern
**Scenario**: User books randomly with no clear preference.
**Solution**: Low confidence score. Don't highlight "preferred" times. Show popular times instead.

### Edge Case 2: Pattern Change
**Scenario**: User used to book Saturdays, now books Wednesdays.
**Solution**: Weight recent bookings higher. Decay old data with exponential falloff.

### Edge Case 3: New Salon Visit
**Scenario**: User visits new salon with no history there.
**Solution**: Use global preferences. Mark as "Based on your usual preferences".

### Edge Case 4: Rescheduled Bookings
**Scenario**: User books 10am but always reschedules to 2pm.
**Solution**: Track both original and final times. Final time is "true" preference.

### Edge Case 5: Seasonal Variation
**Scenario**: User books different times in summer vs winter.
**Solution**: Track month/season in analytics. Show seasonal preferences if pattern detected.

### Edge Case 6: Work Schedule Change
**Scenario**: User changes jobs, new availability.
**Solution**: Recent bookings weighted 3x. Old pattern decays within 3 months.

### Edge Case 7: Multiple Time Preferences
**Scenario**: User equally books 10am and 3pm.
**Solution**: Show both as preferred options. Don't force single preference.

### Edge Case 8: No Bookings Yet
**Scenario**: Brand new user.
**Solution**: Ask for preferences during onboarding. "When do you usually like to visit salons?"

---

## Implementation Plan

### Phase 1: Data Collection (2 days)
1. Create analytics tables
2. Hook into booking completion
3. Build time classification helpers

### Phase 2: Preference Engine (2 days)
1. Preference calculation logic
2. Confidence scoring
3. Decay/weighting system

### Phase 3: API Layer (1 day)
1. Preferences retrieval
2. Personalized slot ordering
3. Smart suggestions

### Phase 4: Web Integration (1 day)
1. Highlight preferred slots
2. "Your usual time" badge
3. Preference display in profile

### Phase 5: Mobile Integration (1 day)
1. Preferred time quick-select
2. Calendar view with preference indicators
3. Onboarding preference capture

---

## Mobile UI/UX

### Booking Date Selection
- Calendar with preferred day highlighted
- "Your usual day" badge on preferred day
- Days with preferred time available marked with dot

### Time Selection
- Preferred times at top with "⭐ Your usual time" label
- Similar times grouped next
- Other times below divider

### Onboarding
- Optional preference capture screen
- "When do you usually visit salons?"
- Morning / Afternoon / Evening chips
- Weekday / Weekend selection

---

## Web UI/UX

### Booking Flow
- Preferred slots highlighted with star icon
- Hover shows "Based on your booking history"
- Quick-select for "Book at usual time"

### Profile Settings
- View learned preferences
- Manual override option
- Reset preferences button

---

## Privacy Considerations

### Data Usage
- Preferences only visible to user
- Salons see aggregate data, not individual patterns
- User can delete preference history

### Transparency
- Show "Why this suggestion?" link
- Explain learning algorithm in simple terms
- Opt-out option for personalization

---

---

## Migration & Integration Notes

### Migration Steps
```sql
-- Migration: 008_add_preferred_time_learning.sql
-- Depends on: users, salons, bookings tables

CREATE TABLE IF NOT EXISTS user_time_preferences (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_id VARCHAR(255) REFERENCES salons(id) ON DELETE CASCADE,
  preferred_day_of_week INTEGER CHECK (preferred_day_of_week BETWEEN 0 AND 6),
  preferred_time_slot VARCHAR(20) CHECK (preferred_time_slot IN ('early_morning', 'morning', 'afternoon', 'evening', 'night')),
  preferred_time_exact TEXT,
  day_distribution JSONB NOT NULL DEFAULT '{}',
  time_distribution JSONB NOT NULL DEFAULT '{}',
  slot_distribution JSONB NOT NULL DEFAULT '{}',
  total_bookings INTEGER NOT NULL DEFAULT 0,
  confidence_score INTEGER NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  last_booking_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_time_analytics (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(255) NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_id VARCHAR(255) NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_slot VARCHAR(20) NOT NULL,
  was_rescheduled INTEGER NOT NULL DEFAULT 0,
  original_time TEXT,
  lead_time_hours INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX user_time_preferences_user_salon_unique 
  ON user_time_preferences(user_id, salon_id);
CREATE INDEX user_time_preferences_user_id_idx ON user_time_preferences(user_id);
CREATE INDEX booking_time_analytics_user_id_idx ON booking_time_analytics(user_id);
CREATE INDEX booking_time_analytics_salon_id_idx ON booking_time_analytics(salon_id);
```

### JSONB Distribution Schema
```typescript
// Aligned with existing booking time_slots
type DayDistribution = Record<'0' | '1' | '2' | '3' | '4' | '5' | '6', number>;
type TimeDistribution = Record<string, number>; // e.g., "10:00": 5, "10:30": 3
type SlotDistribution = {
  early_morning: number; // 06:00-09:00
  morning: number;       // 09:00-12:00
  afternoon: number;     // 12:00-16:00
  evening: number;       // 16:00-19:00
  night: number;         // 19:00-22:00
};
```

### Data Infrastructure Requirements
- **No ML infrastructure needed**: Uses simple frequency-based analysis
- **Existing booking data**: Backfill from `bookings` table
- **Incremental updates**: Update on each booking completion
- **Storage**: ~200 bytes per user-salon preference row

### Backfill Script
```typescript
// Run once to populate from existing bookings
async function backfillTimePreferences() {
  const users = await db.selectDistinct({ userId: bookings.userId })
    .from(bookings)
    .where(eq(bookings.status, 'completed'));
  
  for (const { userId } of users) {
    const salons = await db.selectDistinct({ salonId: bookings.salonId })
      .from(bookings)
      .where(and(eq(bookings.userId, userId), eq(bookings.status, 'completed')));
    
    for (const { salonId } of salons) {
      await updatePreferences(userId, salonId);
    }
  }
}
```

### Integration with Existing Services
- **Booking Completion Hook**: Add to existing `markBookingComplete` in booking routes
- **Rebooking Service**: Use preferences in `server/routes/rebooking.routes.ts` suggestion logic
- **Slot Display**: Modify slot listing in `server/routes.ts` to order by preference

### Auth Requirements
| Endpoint | Role | Description |
|----------|------|-------------|
| GET /api/user/time-preferences | customer | Own preferences only |
| GET /api/salons/:id/slots/personalized | customer | Personalized for current user |
| PUT /api/user/time-preferences/manual | customer | Override own preferences |

### Performance Considerations
- Preference lookup: Single row per user-salon, indexed
- No background job needed: Update inline on booking completion
- Cache consideration: Can cache in Redis for high-traffic salons

---

## Testing Checklist

- [ ] Preferences updated on booking completion
- [ ] Confidence score calculated correctly
- [ ] Slots ordered by preference
- [ ] New users get popular time suggestions
- [ ] Salon-specific vs global preferences work
- [ ] Rescheduled bookings tracked correctly
- [ ] Recent bookings weighted higher
- [ ] Manual preferences override learned
- [ ] Privacy controls work
- [ ] Onboarding preference capture works
- [ ] Low-data scenarios handled gracefully
- [ ] Multiple preferences shown when equal
- [ ] Backfill script runs correctly
- [ ] JSONB distributions validated
