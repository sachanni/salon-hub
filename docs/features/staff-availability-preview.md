# Staff Availability Preview System

## Overview
Allow customers to view when their favorite stylist or preferred staff member is available for the upcoming week before selecting a booking date. This helps customers plan their visits around their preferred staff's schedule.

## Business Value
- **For Customers**: See preferred staff availability at a glance; reduce booking attempts
- **For Salons**: Better staff utilization visibility; fewer "preferred staff not available" cancellations
- **For Platform**: Reduced booking abandonment; improved user experience

---

## Database Schema

### Existing Tables Used
This feature primarily queries existing tables:
- `staff` - Staff member information
- `availability_patterns` - Recurring availability rules
- `time_slots` - Generated bookable slots
- `bookings` - Existing bookings

### New Table: `staff_favorites`

Track customer's favorite staff members.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| staff_id | varchar | FK → staff.id, NOT NULL | Favorited staff |
| salon_id | varchar | FK → salons.id, NOT NULL | Staff's salon |
| favorited_at | timestamp | DEFAULT NOW() | When favorited |
| last_booked_at | timestamp | NULL | Last booking with this staff |
| booking_count | integer | NOT NULL, DEFAULT 0 | Total bookings with staff |
| notify_availability | integer | NOT NULL, DEFAULT 0 | 1 to get notifications |

### Indexes
- `staff_favorites_user_id_idx` on (user_id)
- `staff_favorites_staff_id_idx` on (staff_id)
- UNIQUE on (user_id, staff_id)

### Drizzle Schema
```typescript
export const staffFavorites = pgTable("staff_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  favoritedAt: timestamp("favorited_at").defaultNow(),
  lastBookedAt: timestamp("last_booked_at"),
  bookingCount: integer("booking_count").notNull().default(0),
  notifyAvailability: integer("notify_availability").notNull().default(0),
}, (table) => [
  index("staff_favorites_user_id_idx").on(table.userId),
  index("staff_favorites_staff_id_idx").on(table.staffId),
  uniqueIndex("staff_favorites_user_staff_unique").on(table.userId, table.staffId),
]);
```

### New Table: `staff_availability_cache`

Pre-computed weekly availability for fast lookups.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| staff_id | varchar | FK → staff.id, NOT NULL | Staff member |
| salon_id | varchar | FK → salons.id, NOT NULL | Staff's salon |
| week_start_date | text | NOT NULL | Monday of the week (YYYY-MM-DD) |
| availability_json | jsonb | NOT NULL | Day-by-day availability summary |
| total_available_slots | integer | NOT NULL | Total open slots in week |
| next_available_slot | timestamp | NULL | Earliest available slot |
| generated_at | timestamp | DEFAULT NOW() | When cache was built |
| expires_at | timestamp | NOT NULL | When to regenerate |

### Indexes
- `staff_availability_cache_staff_week_idx` on (staff_id, week_start_date) UNIQUE
- `staff_availability_cache_expires_idx` on (expires_at)

---

## API Endpoints

### GET /api/salons/:salonId/staff/:staffId/availability
Get staff member's availability for date range.

**Query Parameters:**
- `startDate`: ISO date (default: today)
- `endDate`: ISO date (default: today + 14 days)
- `serviceId`: Optional - filter by slots that fit this service duration

**Response:**
```json
{
  "staff": {
    "id": "uuid",
    "name": "Sarah",
    "photoUrl": "...",
    "roles": ["Stylist", "Colorist"],
    "rating": 4.9,
    "reviewCount": 127
  },
  "availability": {
    "2025-12-15": {
      "dayOfWeek": "Sunday",
      "isWorkingDay": true,
      "workingHours": { "start": "09:00", "end": "18:00" },
      "slots": [
        { "time": "09:00", "available": true },
        { "time": "09:30", "available": true },
        { "time": "10:00", "available": false, "reason": "booked" },
        { "time": "10:30", "available": false, "reason": "booked" }
      ],
      "availableSlotCount": 12,
      "totalSlotCount": 18
    },
    "2025-12-16": {
      "dayOfWeek": "Monday",
      "isWorkingDay": false,
      "reason": "Day off"
    }
  },
  "summary": {
    "totalAvailableSlots": 45,
    "busiestDay": "Saturday",
    "leastBusyDay": "Tuesday",
    "nextAvailable": "2025-12-15T09:00:00Z"
  }
}
```

### GET /api/salons/:salonId/staff-availability-overview
Get availability overview for all staff at a salon.

**Query Parameters:**
- `date`: Specific date to check (default: today)
- `serviceId`: Optional - filter by service

**Response:**
```json
{
  "date": "2025-12-15",
  "staff": [
    {
      "id": "uuid",
      "name": "Sarah",
      "photoUrl": "...",
      "availableSlots": 8,
      "nextAvailable": "09:00",
      "status": "available"
    },
    {
      "id": "uuid",
      "name": "Mike",
      "photoUrl": "...",
      "availableSlots": 0,
      "nextAvailable": null,
      "status": "fully_booked"
    },
    {
      "id": "uuid",
      "name": "Lisa",
      "photoUrl": "...",
      "availableSlots": 0,
      "nextAvailable": null,
      "status": "day_off"
    }
  ]
}
```

### GET /api/staff/:staffId/weekly-schedule
Get staff weekly schedule pattern.

**Response:**
```json
{
  "staff": { "id": "uuid", "name": "Sarah" },
  "schedule": {
    "sunday": { "working": true, "hours": "09:00 - 18:00" },
    "monday": { "working": false, "reason": "Day off" },
    "tuesday": { "working": true, "hours": "10:00 - 19:00" },
    "wednesday": { "working": true, "hours": "10:00 - 19:00" },
    "thursday": { "working": true, "hours": "10:00 - 19:00" },
    "friday": { "working": true, "hours": "09:00 - 20:00" },
    "saturday": { "working": true, "hours": "09:00 - 20:00" }
  },
  "upcomingTimeOff": [
    { "date": "2025-12-25", "reason": "Holiday" },
    { "date": "2025-12-26", "reason": "Holiday" }
  ]
}
```

### POST /api/staff/:staffId/favorite
Add staff to favorites.

**Request Body:**
```json
{
  "notifyAvailability": true
}
```

### DELETE /api/staff/:staffId/favorite
Remove staff from favorites.

### GET /api/user/favorite-staff
Get current user's favorite staff with their availability.

**Response:**
```json
{
  "favorites": [
    {
      "staff": { "id": "uuid", "name": "Sarah", "salon": "Glow Salon" },
      "lastBookedAt": "2025-11-22T10:30:00Z",
      "bookingCount": 5,
      "nextAvailable": {
        "date": "2025-12-15",
        "time": "09:00",
        "slotCount": 12
      }
    }
  ]
}
```

---

## Business Rules

### Availability Calculation
1. Start with staff's `availability_patterns` for the day
2. Subtract already booked `time_slots`
3. Subtract blocked periods (breaks, meetings)
4. Account for service duration when filtering slots

### Cache Strategy
- Cache weekly availability per staff
- Invalidate on: new booking, cancellation, pattern change
- TTL: 15 minutes for current week, 1 hour for future weeks
- Regenerate expired caches via background job

### Slot Visibility
- Show slots up to 30 days in advance
- Hide exact times for fully booked days (just show "Fully Booked")
- For "day off" show reason if public (holiday) or generic if personal

### Favorite Staff Features
- Max 10 favorite staff per user
- Auto-add to favorites after 3+ bookings with same staff
- Notify when favorite staff has new availability (if opted in)

---

## Corner Cases

### Edge Case 1: Staff Schedule Changes Mid-Week
**Scenario**: Staff normally works Monday, but calls in sick.
**Solution**: Admin marks day as blocked. Cache invalidated. UI shows "Unavailable" instead of slots.

### Edge Case 2: Different Duration Services
**Scenario**: User wants 2-hour service but only 30-min slots shown.
**Solution**: Only show slots where consecutive slots are available for full duration.

### Edge Case 3: Staff Works at Multiple Locations
**Scenario**: Staff member works at Salon A on Mon/Wed, Salon B on Tue/Thu.
**Solution**: Filter availability by salon context. Show which location in response.

### Edge Case 4: Real-Time Booking Collision
**Scenario**: Two users viewing same slot, one books while other is viewing.
**Solution**: Re-verify availability on booking attempt. Show "Slot just booked" error.

### Edge Case 5: Time Zone Handling
**Scenario**: User in different timezone viewing availability.
**Solution**: Store all times in UTC. Convert to salon's timezone for display.

### Edge Case 6: Very Popular Staff
**Scenario**: Star stylist booked weeks in advance.
**Solution**: Show "Next available: Dec 25" with option to join waitlist.

### Edge Case 7: Staff on Extended Leave
**Scenario**: Staff on maternity leave for 3 months.
**Solution**: Show status "On Leave until March 2026". Hide from active booking flow.

### Edge Case 8: Walk-In Buffer Slots
**Scenario**: Salon reserves some slots for walk-ins.
**Solution**: These slots show as "unavailable" for online booking but not marked as "booked".

---

## Implementation Plan

### Phase 1: Database & Core Logic (2 days)
1. Create `staff_favorites` table
2. Create `staff_availability_cache` table
3. Build availability calculation logic

### Phase 2: Caching System (2 days)
1. Implement cache generation job
2. Build cache invalidation triggers
3. Set up background refresh schedule

### Phase 3: API Layer (2 days)
1. Staff availability endpoint
2. Salon staff overview endpoint
3. Favorite staff endpoints

### Phase 4: Web Integration (2 days)
1. Staff availability calendar on booking page
2. Favorite staff section in profile
3. Staff card hover shows next available

### Phase 5: Mobile Integration (2 days)
1. Staff availability preview in booking flow
2. Favorite staff screen
3. Push notifications for favorite staff availability

---

## Mobile UI/UX

### Booking Flow Integration
1. After selecting salon, show "Staff Availability This Week" section
2. Horizontal scroll of staff cards with availability indicator
3. Tap staff card to see full week calendar
4. Green dot = many slots, yellow = few, red = none

### Calendar View
- Week view with staff photo at top
- Tap date to see available times
- "Book This Slot" button on each time slot
- Swipe between weeks

### Favorite Staff Screen
- List of favorited staff with salons
- Each card shows: next available, booking count
- Toggle for availability notifications
- "Book with [Name]" quick action

---

## Web UI/UX

### Booking Page
- Staff selection step shows availability calendar
- Hover on staff shows mini availability calendar
- Click to expand full weekly view
- Filter: "Show only available today"

### Staff Profile Card
- Working hours
- Weekly schedule pattern
- "Next Available" badge
- Favorite button (heart icon)

### Customer Dashboard
- "Your Stylists" section
- Quick availability check
- One-click to book with favorite

---

## Performance Considerations

### Caching Strategy
```
Request Flow:
1. Check staff_availability_cache
2. If fresh (<15 min), return cached
3. If stale, return cached + trigger async refresh
4. If missing, compute on-demand + cache

Cache Key: staff_id:week_start_date
TTL: 15 minutes for current week
     1 hour for future weeks
     24 hours for past weeks (rarely queried)
```

### Query Optimization
```sql
-- Efficient slot availability query
SELECT ts.start_date_time, ts.is_booked
FROM time_slots ts
WHERE ts.staff_id = $1
  AND ts.start_date_time >= $2
  AND ts.start_date_time < $3
  AND ts.is_blocked = 0
ORDER BY ts.start_date_time;

-- With index on (staff_id, start_date_time)
```

---

## Testing Checklist

- [ ] Availability calculated correctly from patterns
- [ ] Booked slots excluded from availability
- [ ] Blocked periods excluded
- [ ] Service duration filtering works
- [ ] Cache generated correctly
- [ ] Cache invalidated on booking/cancellation
- [ ] Favorite staff CRUD works
- [ ] Notification preference saved
- [ ] Multi-location staff handled correctly
- [ ] Time zone conversion correct
- [ ] Real-time availability verification works
- [ ] Performance acceptable for 14-day range
- [ ] Staff on leave excluded from availability
