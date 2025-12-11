# Slot Waitlist System

## Overview
When a customer's preferred time slot or staff member is fully booked, they can join a waitlist and receive notifications when a slot becomes available. This reduces lost bookings due to availability issues.

## Business Value
- **For Customers**: Get notified when preferred slots open up instead of checking repeatedly
- **For Salons**: Capture demand that would otherwise be lost; fill cancelled slots quickly
- **For Platform**: Higher booking conversion rates; better demand data for analytics

---

## Database Schema

### Table: `slot_waitlist`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| user_id | varchar | FK → users.id, NOT NULL | Customer waiting |
| salon_id | varchar | FK → salons.id, NOT NULL | Target salon |
| service_id | varchar | FK → services.id, NOT NULL | Requested service |
| staff_id | varchar | FK → staff.id, NULL | Preferred staff (optional) |
| requested_date | text | NOT NULL | Target date (YYYY-MM-DD) |
| time_window_start | text | NOT NULL | Earliest acceptable time (HH:MM) |
| time_window_end | text | NOT NULL | Latest acceptable time (HH:MM) |
| flexibility_days | integer | NOT NULL, DEFAULT 0 | Accept +/- days from requested |
| priority | integer | NOT NULL, DEFAULT 1 | 1=normal, 2=high (loyalty members) |
| status | varchar(20) | NOT NULL, DEFAULT 'waiting' | 'waiting', 'notified', 'booked', 'expired', 'cancelled' |
| notified_at | timestamp | NULL | When customer was notified of opening |
| notified_slot_id | varchar | FK → time_slots.id, NULL | Slot that became available |
| response_deadline | timestamp | NULL | Deadline to accept offered slot |
| booked_at | timestamp | NULL | When customer accepted and booked |
| expires_at | timestamp | NOT NULL | Auto-expire date for waitlist entry |
| created_at | timestamp | DEFAULT NOW() | When added to waitlist |

### Indexes
- `slot_waitlist_user_id_idx` on (user_id)
- `slot_waitlist_salon_date_idx` on (salon_id, requested_date)
- `slot_waitlist_status_idx` on (status)
- `slot_waitlist_expires_at_idx` on (expires_at)
- UNIQUE on (user_id, salon_id, service_id, requested_date) - prevent duplicate entries

### Drizzle Schema
```typescript
export const slotWaitlist = pgTable("slot_waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "set null" }),
  requestedDate: text("requested_date").notNull(),
  timeWindowStart: text("time_window_start").notNull(),
  timeWindowEnd: text("time_window_end").notNull(),
  flexibilityDays: integer("flexibility_days").notNull().default(0),
  priority: integer("priority").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default('waiting'),
  notifiedAt: timestamp("notified_at"),
  notifiedSlotId: varchar("notified_slot_id").references(() => timeSlots.id, { onDelete: "set null" }),
  responseDeadline: timestamp("response_deadline"),
  bookedAt: timestamp("booked_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("slot_waitlist_user_id_idx").on(table.userId),
  index("slot_waitlist_salon_date_idx").on(table.salonId, table.requestedDate),
  index("slot_waitlist_status_idx").on(table.status),
  index("slot_waitlist_expires_at_idx").on(table.expiresAt),
  uniqueIndex("slot_waitlist_user_salon_service_date_unique")
    .on(table.userId, table.salonId, table.serviceId, table.requestedDate),
]);
```

### Table: `waitlist_notifications`

Track all notifications sent for waitlist entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| waitlist_id | varchar | FK → slot_waitlist.id, NOT NULL | Waitlist entry |
| slot_id | varchar | FK → time_slots.id, NOT NULL | Offered slot |
| notification_type | varchar(20) | NOT NULL | 'push', 'sms', 'email' |
| sent_at | timestamp | NOT NULL | When notification sent |
| opened_at | timestamp | NULL | When user opened notification |
| response | varchar(20) | NULL | 'accepted', 'declined', 'expired' |
| responded_at | timestamp | NULL | When user responded |

---

## API Endpoints

### POST /api/waitlist/join
Join the waitlist for a slot.

**Request Body:**
```json
{
  "salonId": "uuid",
  "serviceId": "uuid",
  "staffId": "uuid",
  "requestedDate": "2025-12-15",
  "timeWindowStart": "10:00",
  "timeWindowEnd": "14:00",
  "flexibilityDays": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "waitlistEntry": {
    "id": "uuid",
    "position": 3,
    "estimatedWaitDays": 2,
    "expiresAt": "2025-12-20T23:59:59Z"
  }
}
```

**Error Responses:**
- 400: Invalid time window, past date, missing required fields
- 409: Already on waitlist for this slot
- 422: Slot is actually available (redirect to booking)

### DELETE /api/waitlist/:waitlistId
Remove from waitlist.

### GET /api/waitlist/my-entries
Get current user's waitlist entries.

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "salon": { "id": "uuid", "name": "Glow Salon", "imageUrl": "..." },
      "service": { "id": "uuid", "name": "Haircut", "priceInPaisa": 50000 },
      "requestedDate": "2025-12-15",
      "timeWindow": "10:00 - 14:00",
      "position": 2,
      "status": "waiting",
      "expiresAt": "2025-12-20T23:59:59Z"
    }
  ]
}
```

### POST /api/waitlist/:waitlistId/respond
Respond to waitlist notification.

**Request Body:**
```json
{
  "response": "accepted"
}
```

**Response (200):**
```json
{
  "success": true,
  "bookingId": "uuid",
  "message": "Slot booked successfully!"
}
```

### GET /api/salons/:salonId/waitlist
Salon owner view of their waitlist.

**Response:**
```json
{
  "waitlistCount": 12,
  "byDate": {
    "2025-12-15": 5,
    "2025-12-16": 3,
    "2025-12-17": 4
  },
  "entries": [...]
}
```

---

## Business Rules

### Waitlist Priority
1. **Loyalty Elite members**: Priority 3 (first notified)
2. **Loyalty Gold members**: Priority 2
3. **Regular customers**: Priority 1
4. **Within same priority**: First-come, first-served (by `created_at`)

### Notification Flow
1. Slot becomes available (cancellation, new slot added)
2. System finds matching waitlist entries
3. Notify highest priority user first
4. User has 15 minutes to respond
5. If no response, notify next user in queue
6. Repeat until slot is booked or no more waitlist entries

### Expiration Rules
- Waitlist entries expire 7 days after requested date
- Entries for past dates auto-expire at midnight
- Users can extend expiration manually (max 14 days)

### Matching Logic
A slot matches a waitlist entry if:
1. Same salon
2. Same service (or service duration fits in slot)
3. Same staff (if specified) OR any staff (if not specified)
4. Slot date is within `requestedDate ± flexibilityDays`
5. Slot time is within `timeWindowStart` to `timeWindowEnd`

---

## Corner Cases

### Edge Case 1: Multiple Users Waiting
**Scenario**: 5 users waiting for same slot, slot opens.
**Solution**: Notify by priority then FIFO. Each user gets 15 min exclusive window.

### Edge Case 2: User Joins Waitlist, Slot Opens Immediately
**Scenario**: Between checking availability and joining waitlist, a cancellation happens.
**Solution**: Before adding to waitlist, check availability again. If available, redirect to booking.

### Edge Case 3: Notification Delivery Failure
**Scenario**: Push notification fails to deliver.
**Solution**: Fallback to SMS → Email. If all fail, skip to next user after 5 minutes.

### Edge Case 4: User Books Slot While on Waitlist
**Scenario**: User manually books a different slot at same salon, same day.
**Solution**: Auto-remove from waitlist for that date to avoid double-booking potential.

### Edge Case 5: Partial Slot Match
**Scenario**: 2-hour service, 1.5-hour slot opens.
**Solution**: Don't match. Only match if slot duration >= service duration.

### Edge Case 6: Staff Assignment Changed
**Scenario**: User waiting for specific staff. Slot opens with different staff.
**Solution**: If `staffId` specified, don't match. If null (any staff), match.

### Edge Case 7: Service Price Changed
**Scenario**: Between joining waitlist and slot opening, price increased.
**Solution**: Notify with new price. User can accept or decline.

### Edge Case 8: Rapid Slot Churn
**Scenario**: Slot becomes available and booked multiple times quickly.
**Solution**: Lock slot for 15 minutes when notifying waitlist user. Prevent others from booking.

---

## Implementation Plan

### Phase 1: Database & Core Logic (3 days)
1. Create migration for waitlist tables
2. Implement waitlist matching algorithm
3. Build priority queue logic

### Phase 2: API Endpoints (2 days)
1. Join/leave waitlist endpoints
2. Response handling endpoint
3. Salon owner waitlist view

### Phase 3: Notification Integration (2 days)
1. Push notification for slot availability
2. SMS fallback
3. Email fallback
4. Response deadline timer

### Phase 4: Web Integration (2 days)
1. "Join Waitlist" button on booking page when no slots
2. Waitlist management in customer profile
3. Salon dashboard waitlist tab

### Phase 5: Mobile Integration (2 days)
1. Waitlist join flow in booking screen
2. Quick-action notification for slot offers
3. My Waitlist screen

---

## Mobile UI/UX

### Join Waitlist Flow
1. User selects date/time that's fully booked
2. Show "No slots available. Join waitlist?" prompt
3. Allow time window selection (morning/afternoon/evening or custom)
4. Show estimated wait time based on historical data
5. Confirm with notification preferences

### Waitlist Notification
1. Rich push notification: "A slot opened at Glow Salon! 11:00 AM Dec 15"
2. Quick actions: "Book Now" / "Decline"
3. Tap opens deep link to one-tap booking
4. Countdown timer shows remaining time to respond

### My Waitlist Screen
- List of active waitlist entries
- Position in queue shown
- Swipe to remove
- Pull to refresh

---

## Web UI/UX

### Booking Page
- When no slots: "Join Waitlist" button replaces "Book Now"
- Modal for time preferences
- Success confirmation with position in queue

### Customer Dashboard
- Waitlist section showing active entries
- Edit/remove options
- Notification preferences per entry

### Salon Dashboard
- Waitlist analytics: demand by date/time
- Manual slot-release to waitlist
- View customer preferences for capacity planning

---

## Cron Jobs

### Every 5 Minutes: Process Slot Availability
```
1. Find cancelled/new slots in last 5 minutes
2. For each slot, find matching waitlist entries
3. Send notifications in priority order
```

### Every Hour: Expire Old Entries
```
1. Find entries where expires_at < NOW()
2. Update status to 'expired'
3. Send "waitlist expired" notification
```

### Every Hour: Escalate Unresponded Notifications
```
1. Find entries where notified_at + 15min < NOW() AND status = 'notified'
2. Mark as 'expired' response
3. Move to next user in queue
```

---

---

## Migration & Integration Notes

### Migration Steps
```sql
-- Migration: 002_add_slot_waitlist.sql
-- Depends on: users, salons, services, staff, time_slots tables

CREATE TABLE IF NOT EXISTS slot_waitlist (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_id VARCHAR(255) NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  service_id VARCHAR(255) NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id VARCHAR(255) REFERENCES staff(id) ON DELETE SET NULL,
  requested_date TEXT NOT NULL,
  time_window_start TEXT NOT NULL,
  time_window_end TEXT NOT NULL,
  flexibility_days INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMP,
  notified_slot_id VARCHAR(255) REFERENCES time_slots(id) ON DELETE SET NULL,
  response_deadline TIMESTAMP,
  booked_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Composite unique to prevent duplicate waitlist entries
CREATE UNIQUE INDEX slot_waitlist_user_salon_service_date_unique 
  ON slot_waitlist(user_id, salon_id, service_id, requested_date);

-- Composite FK to enforce same-salon service membership
ALTER TABLE slot_waitlist ADD CONSTRAINT slot_waitlist_service_salon_fk
  FOREIGN KEY (service_id, salon_id) 
  REFERENCES services(id, salon_id);

-- Composite FK for staff-salon membership (when staff specified)
-- Note: Only enforced when staff_id is NOT NULL
CREATE INDEX slot_waitlist_user_id_idx ON slot_waitlist(user_id);
CREATE INDEX slot_waitlist_salon_date_idx ON slot_waitlist(salon_id, requested_date);
CREATE INDEX slot_waitlist_status_idx ON slot_waitlist(status);
CREATE INDEX slot_waitlist_expires_at_idx ON slot_waitlist(expires_at);
```

### Existing Schema Integration
- Uses composite FK pattern from existing `booking_services` table
- Service-salon relationship enforced via composite FK
- Same priority pattern as loyalty tiers in existing `loyalty_rewards`

### Service Integration Points
- **Booking Cancellation Hook**: When booking cancelled, check waitlist for matches
- **Time Slot Generation**: When new slots generated, notify waitlist
- **Notification Service**: Use `server/routes/notification.routes.ts` for push/SMS/email
- **Loyalty Service**: Priority based on loyalty tier from `loyalty_memberships`

### Simultaneous Fulfillment Handling
When a slot opens and multiple users are waiting:
```typescript
// Atomic slot reservation with waitlist priority
await db.transaction(async (tx) => {
  // Lock the time slot
  const [slot] = await tx.select()
    .from(timeSlots)
    .where(and(eq(timeSlots.id, slotId), eq(timeSlots.isBooked, 0)))
    .for('update');
  
  if (!slot) throw new Error('Slot no longer available');
  
  // Mark slot as reserved (not booked yet)
  await tx.update(timeSlots)
    .set({ isBooked: 1, reservedUntil: addMinutes(now, 15) })
    .where(eq(timeSlots.id, slotId));
  
  // Get highest priority waitlist entry
  const [entry] = await tx.select()
    .from(slotWaitlist)
    .where(matchingCriteria)
    .orderBy(desc(slotWaitlist.priority), asc(slotWaitlist.createdAt))
    .limit(1)
    .for('update');
  
  // Update entry status
  await tx.update(slotWaitlist)
    .set({ status: 'notified', notifiedAt: now, notifiedSlotId: slotId })
    .where(eq(slotWaitlist.id, entry.id));
});
```

### Auth Requirements
| Endpoint | Role | Description |
|----------|------|-------------|
| POST /api/waitlist/join | customer | Authenticated customer only |
| DELETE /api/waitlist/:id | customer | Own entries only |
| GET /api/waitlist/my-entries | customer | Own entries only |
| POST /api/waitlist/:id/respond | customer | Own entries only |
| GET /api/salons/:id/waitlist | salon_owner | Salon owner only |

### Background Jobs
- **Process Slot Availability**: Every 5 min via `node-cron`
- **Expire Old Entries**: Hourly cleanup
- **Escalate Unresponded**: Hourly check for 15-min timeout

---

## Testing Checklist

- [ ] User can join waitlist for unavailable slot
- [ ] Duplicate waitlist entry prevented
- [ ] Notification sent when slot opens
- [ ] Priority ordering works correctly
- [ ] 15-minute response window enforced
- [ ] Slot locked during response window
- [ ] Fallback notifications (SMS, email) work
- [ ] Expired entries cleaned up
- [ ] User can leave waitlist
- [ ] Salon can view waitlist demand
- [ ] Price change notification included
- [ ] Staff preference matching works
- [ ] Flexibility days matching works
- [ ] Composite FK constraints enforced
- [ ] Concurrent slot claims handled safely
