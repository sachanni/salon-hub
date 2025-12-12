# Running Late Notification System

## Overview
Provide customers with a quick, one-tap way to notify the salon if they're running late for their appointment. This helps salons manage their schedule and reduces no-shows while maintaining good customer relationships.

## Business Value
- **For Customers**: Reduce anxiety about being late; maintain good standing with salon
- **For Salons**: Better schedule management; reduce no-shows; decide whether to wait or reassign
- **For Platform**: Improved booking completion rates; better operational data

---

## Database Schema

### Table: `late_notifications`

Track customer delay notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| booking_id | varchar | FK → bookings.id, NOT NULL, UNIQUE | Affected booking |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| salon_id | varchar | FK → salons.id, NOT NULL | Salon |
| estimated_delay_minutes | integer | NOT NULL | How late customer will be |
| reason | varchar(50) | NULL | Optional reason code |
| custom_message | text | NULL | Optional free-text message |
| notified_at | timestamp | DEFAULT NOW() | When notification sent |
| salon_acknowledged_at | timestamp | NULL | When salon saw notification |
| salon_response | varchar(20) | NULL | 'wait', 'reschedule', 'cancel' |
| salon_response_message | text | NULL | Response to customer |
| responded_at | timestamp | NULL | When salon responded |
| original_booking_time | text | NOT NULL | Original appointment time |
| new_expected_arrival | text | NULL | Calculated arrival time |

### Indexes
- `late_notifications_booking_id_idx` on (booking_id) UNIQUE
- `late_notifications_salon_id_idx` on (salon_id)
- `late_notifications_notified_at_idx` on (notified_at)

### Drizzle Schema
```typescript
export const lateNotifications = pgTable("late_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().unique().references(() => bookings.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  estimatedDelayMinutes: integer("estimated_delay_minutes").notNull(),
  reason: varchar("reason", { length: 50 }),
  customMessage: text("custom_message"),
  notifiedAt: timestamp("notified_at").defaultNow(),
  salonAcknowledgedAt: timestamp("salon_acknowledged_at"),
  salonResponse: varchar("salon_response", { length: 20 }),
  salonResponseMessage: text("salon_response_message"),
  respondedAt: timestamp("responded_at"),
  originalBookingTime: text("original_booking_time").notNull(),
  newExpectedArrival: text("new_expected_arrival"),
}, (table) => [
  index("late_notifications_booking_id_idx").on(table.bookingId),
  index("late_notifications_salon_id_idx").on(table.salonId),
  index("late_notifications_notified_at_idx").on(table.notifiedAt),
]);
```

### Table: `late_policy_settings`

Salon-specific late arrival policies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| salon_id | varchar | FK → salons.id, NOT NULL, UNIQUE | Salon |
| grace_period_minutes | integer | NOT NULL, DEFAULT 10 | Minutes before marked late |
| auto_cancel_delay_minutes | integer | NULL | Auto-cancel if later than this |
| allow_shortened_service | integer | NOT NULL, DEFAULT 1 | Can offer shortened service |
| max_wait_minutes | integer | NOT NULL, DEFAULT 30 | Maximum salon will wait |
| late_fee_enabled | integer | NOT NULL, DEFAULT 0 | Charge late fee |
| late_fee_paisa | integer | NULL | Fee amount |
| notify_next_customer | integer | NOT NULL, DEFAULT 1 | Notify next customer of potential delay |
| updated_at | timestamp | DEFAULT NOW() | Last update |

---

## API Endpoints

### POST /api/bookings/:bookingId/running-late
Customer notifies they're running late.

**Request Body:**
```json
{
  "estimatedDelayMinutes": 15,
  "reason": "traffic",
  "customMessage": "Stuck in traffic on MG Road"
}
```

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "salonNotified": true,
    "newExpectedArrival": "10:45",
    "salonPolicy": {
      "gracePeriod": 10,
      "maxWait": 30,
      "shortenedServiceAvailable": true
    },
    "message": "Glow Salon has been notified. They'll wait up to 30 minutes."
  }
}
```

**Error Responses:**
- 400: Booking not today, delay too long, already notified
- 404: Booking not found
- 409: Booking already started/completed/cancelled

### GET /api/bookings/:bookingId/late-status
Check late notification status.

**Response:**
```json
{
  "hasNotification": true,
  "notification": {
    "estimatedDelay": 15,
    "notifiedAt": "2025-12-15T10:15:00Z",
    "salonResponse": "wait",
    "salonMessage": "No problem! We'll see you soon. Your stylist Sarah will be ready."
  }
}
```

### POST /api/salons/:salonId/late-notifications/:notificationId/respond
Salon responds to late notification.

**Request Body:**
```json
{
  "response": "wait",
  "message": "No problem, see you soon!"
}
```

### GET /api/salons/:salonId/today-late-notifications
Salon view of today's late notifications.

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "booking": {
        "id": "uuid",
        "customerName": "John Doe",
        "customerPhone": "+91999...",
        "originalTime": "10:30",
        "service": "Haircut"
      },
      "estimatedDelay": 15,
      "newExpectedArrival": "10:45",
      "reason": "traffic",
      "customMessage": "Stuck in traffic",
      "notifiedAt": "2025-12-15T10:15:00Z",
      "status": "pending_response"
    }
  ],
  "summary": {
    "pendingCount": 1,
    "acknowledgedCount": 3,
    "impactedSchedule": false
  }
}
```

### PUT /api/salons/:salonId/late-policy
Update salon late policy.

**Request Body:**
```json
{
  "gracePeriodMinutes": 10,
  "maxWaitMinutes": 30,
  "autoCancelDelayMinutes": 45,
  "allowShortenedService": true,
  "lateFeeEnabled": false,
  "notifyNextCustomer": true
}
```

---

## Reason Codes

| Code | Display Text | Icon |
|------|--------------|------|
| traffic | Stuck in traffic | 🚗 |
| transport_delay | Public transport delay | 🚌 |
| parking | Finding parking | 🅿️ |
| work_meeting | Work meeting running over | 💼 |
| child_care | Childcare issue | 👶 |
| emergency_minor | Minor emergency | ⚠️ |
| weather | Bad weather | 🌧️ |
| other | Other reason | ❓ |

---

## Business Rules

### Notification Window
- Can notify from 2 hours before to 30 minutes after appointment time
- Before appointment: "Heads up" notification
- After appointment: "Running late" with urgency

### Delay Limits
- Minimum delay to report: 5 minutes
- Maximum delay for notification: 60 minutes
- Beyond max: Suggest reschedule instead

### Salon Response Options
| Response | Description | Customer Impact |
|----------|-------------|-----------------|
| wait | Will wait for customer | Appointment proceeds |
| shortened | Offer shortened service | Modified service at reduced time |
| reschedule | Ask to reschedule | Find new slot |
| cancel | Cancel appointment | Refund per policy |

### Auto-Actions
- If delay > `auto_cancel_delay_minutes`: Auto-suggest reschedule
- If delay > `max_wait_minutes`: Warn customer appointment may be cancelled
- If salon doesn't respond in 10 min: Send reminder to salon

### Impact on Next Customer
- If late arrival impacts next booking
- Option to notify next customer of potential delay
- Calculate cascade effect

---

## Corner Cases

### Edge Case 1: Multiple Late Notifications
**Scenario**: Customer updates delay from 10 to 20 minutes.
**Solution**: Update existing notification. Track history of updates.

### Edge Case 2: Late Notification After Arrival
**Scenario**: Customer notifies running late, but they've already arrived.
**Solution**: Check if booking status changed to "checked_in". Ignore if already there.

### Edge Case 3: Salon Closed/No Staff
**Scenario**: Late notification sent but salon is closed or staff not on duty.
**Solution**: Auto-respond with "Unable to accommodate changes at this time. Please call salon directly."

### Edge Case 4: Very Late + No Response
**Scenario**: Customer notifies 45 minutes late, salon doesn't respond.
**Solution**: After 10 min, auto-escalate. After 20 min, suggest customer call directly.

### Edge Case 5: Group Booking
**Scenario**: One person in group of 4 is running late.
**Solution**: Notify for entire booking. Salon decides whether to start with available members.

### Edge Case 6: Back-to-Back Appointments
**Scenario**: Customer has 2 consecutive appointments.
**Solution**: Late notification applies to first. Calculate cascade impact on second.

### Edge Case 7: Staff Break Conflict
**Scenario**: Waiting for late customer would push into staff's break.
**Solution**: Show conflict in salon dashboard. Let salon decide priority.

### Edge Case 8: No-Show After Notification
**Scenario**: Customer notified late, then never shows up.
**Solution**: Still mark as no-show for analytics. Notification shows good faith but doesn't prevent no-show policy.

---

## Implementation Plan

### Phase 1: Database & Core Logic (2 days)
1. Create notification tables
2. Build notification flow
3. Implement salon response logic

### Phase 2: API Layer (2 days)
1. Customer notification endpoint
2. Status checking endpoint
3. Salon response endpoints
4. Policy management

### Phase 3: Push Notifications (1 day)
1. Notify salon on late notification
2. Notify customer of salon response
3. Reminder to salon if no response

### Phase 4: Web Integration (2 days)
1. "Running Late" button on booking detail
2. Salon dashboard late notifications panel
3. Policy configuration page

### Phase 5: Mobile Integration (1 day)
1. Quick-action late notification button
2. Pre-appointment reminder with late option
3. Status tracking

---

## Notifications

### To Salon (Customer Late)
```
⏰ RUNNING LATE: John Doe
Appointment: 10:30 AM - Haircut with Sarah
Estimated delay: 15 minutes
Reason: Traffic
New ETA: 10:45 AM

[Wait] [Offer Shortened] [Reschedule]
```

### To Customer (Salon Response: Wait)
```
✅ Glow Salon will wait for you
New arrival time: 10:45 AM
Your stylist Sarah is ready

Drive safely! 🚗
```

### To Customer (Salon Response: Shortened)
```
⚠️ Glow Salon offers shortened service
Due to schedule constraints, your appointment will be shortened by 15 minutes.
Service: Express Haircut (15 min instead of 30 min)
Adjusted price: ₹350 (was ₹500)

[Accept] [Reschedule Instead]
```

### To Customer (Salon Response: Reschedule)
```
📅 Glow Salon requests reschedule
They're unable to accommodate the delay today.

Next available slots:
• Today 4:00 PM
• Tomorrow 10:30 AM

[Reschedule] [Cancel]
```

---

## Mobile UI/UX

### Pre-Appointment Reminder (1 hour before)
- Standard reminder + "Running Late?" link
- Tap opens quick notification screen

### Quick Late Notification
- Large delay selector: +5, +10, +15, +20, +30 min
- Optional reason chips
- Optional message field
- Send button
- Shows salon policy (grace period, max wait)

### Status Tracking
- Real-time status: "Waiting for salon response"
- Notification when salon responds
- Clear action items based on response

### Booking Detail
- "Running Late?" button prominently displayed
- Only show for upcoming same-day bookings
- Disabled after appointment time + grace period

---

## Web UI/UX

### Customer Booking Detail
- "Notify Salon I'm Late" button
- Modal with delay selector and message

### Salon Dashboard - Today's View
- Prominent "Late Arrivals" section
- Color-coded urgency
- Quick response buttons
- Show impact on schedule

### Salon Late Policy Settings
- Grace period slider
- Max wait slider
- Shortened service toggle
- Late fee configuration
- Next customer notification toggle

---

## Analytics

### Customer Metrics
- Frequency of late notifications
- Average delay time
- No-show rate after late notification

### Salon Metrics
- Late notification response time
- Most common response (wait/reschedule/cancel)
- Impact on schedule adherence

---

## Implementation Status Checklist

*Last updated: 2025-12-11*

### Phase 1: Database & Core Logic
| Item | Status | Notes |
|------|--------|-------|
| `late_arrival_notifications` table | ✅ Implemented | Full schema in shared/schema.ts |
| `late_policy_settings` table | ❌ Not Implemented | Salon-specific policy settings not created |
| Notification creation logic | ✅ Implemented | lateArrival.service.ts |
| Delay calculation/ETA | ✅ Implemented | calculateEstimatedArrivalTime() |
| Prevent duplicate notifications | ✅ Implemented | Checks existing for same booking |

### Phase 2: API Layer
| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/late-arrival/delay-options | ✅ Implemented | Returns predefined delay options |
| GET /api/late-arrival/bookings/:id/can-notify | ✅ Implemented | Eligibility check |
| POST /api/late-arrival/notify | ✅ Implemented | Create notification |
| GET /api/late-arrival/bookings/:id/history | ✅ Implemented | Booking's late history |
| GET /api/late-arrival/customer/history | ✅ Implemented | Customer's history |
| GET /api/late-arrival/salons/:id/pending | ✅ Implemented | Pending for salon |
| GET /api/late-arrival/salons/:id/history | ✅ Implemented | Salon's history |
| POST /api/late-arrival/:id/acknowledge | ✅ Implemented | Salon response |
| GET /api/bookings/:id/late-status | ❌ Not Implemented | Check late status endpoint |
| PUT /api/salons/:id/late-policy | ❌ Not Implemented | Policy management |
| Mobile API endpoints | ✅ Implemented | /api/mobile/late-arrival/* mirrored |

### Phase 3: Notifications
| Item | Status | Notes |
|------|--------|-------|
| SMS notification to salon | ✅ Implemented | Uses Twilio |
| In-app notification to salon owner | ✅ Implemented | userNotifications table |
| Push notification to salon (FCM) | ❌ Not Implemented | No Firebase push for salon |
| Customer notification on salon response | ✅ Implemented | In-app notification |
| Push notification to customer (FCM) | ❌ Not Implemented | No Firebase push |
| Reminder to salon if no response | ❌ Not Implemented | No auto-reminder logic |

### Phase 4: Web Integration
| Item | Status | Notes |
|------|--------|-------|
| "Running Late?" button on booking | ✅ Implemented | LateArrivalButton.tsx |
| Late notification modal | ✅ Implemented | LateArrivalModal.tsx |
| Delay selector (5-30 min options) | ✅ Implemented | RadioGroup in modal |
| Optional message field | ✅ Implemented | Textarea in modal |
| Salon dashboard - Late Arrivals panel | ✅ Implemented | LateArrivalDashboard.tsx |
| Pending notifications with quick response | ✅ Implemented | Tabs: Pending/History |
| Salon response dialog | ✅ Implemented | Acknowledge/Reschedule/Cancel |
| Policy configuration page | ❌ Not Implemented | No late policy settings UI |

### Phase 5: Mobile Integration
| Item | Status | Notes |
|------|--------|-------|
| "Running Late?" button on booking | ❌ Not Implemented | No mobile UI component |
| Late notification modal/screen | ❌ Not Implemented | No mobile UI |
| Delay selector | ❌ Not Implemented | No mobile UI |
| Pre-appointment reminder with late option | ❌ Not Implemented | No mobile UI |
| Status tracking screen | ❌ Not Implemented | No mobile UI |
| Mobile API integration | ✅ Implemented | Backend routes exist |

### Business Rules & Edge Cases
| Item | Status | Notes |
|------|--------|-------|
| Notification window (2hr before to 30min after) | ✅ Implemented | In canSendLateNotification() |
| Delay limits (5-60 min) | ✅ Implemented | LATE_ARRIVAL_DELAY_OPTIONS |
| Salon response options (wait/reschedule/cancel) | ✅ Implemented | acknowledgeLateArrival() |
| Auto-cancel if delay > threshold | ❌ Not Implemented | No late_policy_settings |
| Notify next customer of delay | ❌ Not Implemented | No cascade logic |
| Grace period logic | ❌ Not Implemented | No late_policy_settings |
| Shortened service option | ❌ Not Implemented | Response options limited |
| Late fee handling | ❌ Not Implemented | No late_policy_settings |
| Group booking handling | ❌ Not Implemented | No special logic |
| Multiple delay updates | ⚠️ Partial | Creates new notification, no update logic |

### Analytics
| Item | Status | Notes |
|------|--------|-------|
| Customer late notification frequency | ❌ Not Implemented | No analytics |
| Average delay time | ❌ Not Implemented | No analytics |
| No-show rate after late notification | ❌ Not Implemented | No analytics |
| Salon response time tracking | ❌ Not Implemented | No analytics |
| Most common salon responses | ❌ Not Implemented | No analytics |

---

## Summary

### What's Working
1. **Core Flow**: Customers can notify salon they're late via web app
2. **Salon Notifications**: SMS + in-app notifications work
3. **Salon Dashboard**: Full UI for viewing and responding to late arrivals
4. **Web Customer UI**: Complete with button, modal, delay options
5. **Mobile Backend**: API endpoints are ready

### What's Missing
1. **Mobile UI**: No customer-facing mobile components
2. **Late Policy Settings**: No configurable policies per salon
3. **Push Notifications**: Only SMS + in-app (no FCM)
4. **Auto-Actions**: No auto-cancel, reminders, or escalation
5. **Analytics**: No tracking or reporting
6. **Advanced Features**: Next customer notification, shortened service, late fees

---

## Testing Checklist

- [x] Late notification created successfully
- [x] Salon receives SMS notification
- [x] Salon receives in-app notification
- [ ] Salon receives push notification (FCM)
- [x] Salon can respond with all options
- [x] Customer receives response notification (in-app)
- [ ] Customer receives push notification (FCM)
- [ ] Delay updates work correctly (update vs new record)
- [ ] Grace period logic works
- [ ] Auto-cancel threshold enforced
- [x] Notification window enforced
- [x] Multiple notifications prevented (per booking)
- [ ] Group booking handling works
- [ ] Policy configuration saves correctly
- [ ] Analytics tracking works
- [ ] Mobile UI components work
