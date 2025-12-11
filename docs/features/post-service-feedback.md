# Post-Service Feedback Prompts System

## Overview
Send timed push notifications to customers 2 hours after their appointment completion, prompting them to leave a review. This timing captures fresh impressions and significantly increases review submission rates.

## Business Value
- **For Customers**: Easy, timely way to share feedback; feel heard
- **For Salons**: More reviews; actionable feedback; improved online reputation
- **For Platform**: Rich review data; higher engagement; better salon quality signals

---

## Database Schema

### Table: `feedback_prompts`

Track sent feedback prompts and responses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| booking_id | varchar | FK → bookings.id, NOT NULL, UNIQUE | Completed booking |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| salon_id | varchar | FK → salons.id, NOT NULL | Salon |
| staff_id | varchar | FK → staff.id, NULL | Staff who served |
| scheduled_at | timestamp | NOT NULL | When prompt should be sent |
| sent_at | timestamp | NULL | When prompt was actually sent |
| channel | varchar(20) | NOT NULL | 'push', 'email', 'sms' |
| status | varchar(20) | NOT NULL, DEFAULT 'scheduled' | 'scheduled', 'sent', 'opened', 'completed', 'expired', 'skipped' |
| opened_at | timestamp | NULL | When notification opened |
| completed_at | timestamp | NULL | When review submitted |
| review_id | varchar | FK → salon_reviews.id, NULL | Submitted review |
| expires_at | timestamp | NOT NULL | When prompt expires |
| reminder_sent | integer | NOT NULL, DEFAULT 0 | 1 if reminder was sent |
| reminder_sent_at | timestamp | NULL | When reminder sent |
| skip_reason | varchar(50) | NULL | Why prompt was skipped |
| created_at | timestamp | DEFAULT NOW() | When scheduled |

### Indexes
- `feedback_prompts_booking_id_idx` on (booking_id) UNIQUE
- `feedback_prompts_user_id_idx` on (user_id)
- `feedback_prompts_scheduled_at_idx` on (scheduled_at)
- `feedback_prompts_status_idx` on (status)

### Drizzle Schema
```typescript
export const feedbackPrompts = pgTable("feedback_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().unique().references(() => bookings.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  channel: varchar("channel", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('scheduled'),
  openedAt: timestamp("opened_at"),
  completedAt: timestamp("completed_at"),
  reviewId: varchar("review_id").references(() => salonReviews.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at").notNull(),
  reminderSent: integer("reminder_sent").notNull().default(0),
  reminderSentAt: timestamp("reminder_sent_at"),
  skipReason: varchar("skip_reason", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("feedback_prompts_booking_id_idx").on(table.bookingId),
  index("feedback_prompts_user_id_idx").on(table.userId),
  index("feedback_prompts_scheduled_at_idx").on(table.scheduledAt),
  index("feedback_prompts_status_idx").on(table.status),
]);
```

### Table: `feedback_settings`

Salon-specific feedback prompt configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| salon_id | varchar | FK → salons.id, NOT NULL, UNIQUE | Salon |
| prompt_enabled | integer | NOT NULL, DEFAULT 1 | Send prompts |
| delay_minutes | integer | NOT NULL, DEFAULT 120 | Minutes after service |
| reminder_enabled | integer | NOT NULL, DEFAULT 1 | Send reminder |
| reminder_delay_hours | integer | NOT NULL, DEFAULT 24 | Hours after first prompt |
| prompt_expiry_days | integer | NOT NULL, DEFAULT 7 | Days until prompt expires |
| incentive_enabled | integer | NOT NULL, DEFAULT 0 | Offer incentive for review |
| incentive_points | integer | NULL | Loyalty points for review |
| custom_message | text | NULL | Custom prompt message |
| channels | text[] | NOT NULL, DEFAULT ['push'] | Enabled channels |
| updated_at | timestamp | DEFAULT NOW() | Last update |

### Table: `feedback_incentives`

Track incentive rewards for reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| prompt_id | varchar | FK → feedback_prompts.id, NOT NULL | Feedback prompt |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| review_id | varchar | FK → salon_reviews.id, NOT NULL | Submitted review |
| incentive_type | varchar(30) | NOT NULL | 'points', 'discount', 'free_service' |
| incentive_value | integer | NOT NULL | Points or paisa |
| awarded_at | timestamp | DEFAULT NOW() | When incentive given |
| redeemed_at | timestamp | NULL | When incentive used |

---

## API Endpoints

### POST /api/bookings/:bookingId/complete
Mark booking as complete (triggers feedback scheduling).

**Response includes:**
```json
{
  "success": true,
  "booking": { ... },
  "feedbackPrompt": {
    "scheduled": true,
    "scheduledAt": "2025-12-15T14:30:00Z",
    "channel": "push"
  }
}
```

### GET /api/user/pending-reviews
Get user's pending feedback prompts.

**Response:**
```json
{
  "pendingReviews": [
    {
      "id": "uuid",
      "booking": {
        "id": "uuid",
        "date": "2025-12-15",
        "time": "12:30",
        "service": "Haircut",
        "staff": "Sarah"
      },
      "salon": { "id": "uuid", "name": "Glow Salon", "imageUrl": "..." },
      "promptedAt": "2025-12-15T14:30:00Z",
      "expiresAt": "2025-12-22T14:30:00Z",
      "incentive": { "type": "points", "value": 50 }
    }
  ],
  "totalPending": 1
}
```

### POST /api/feedback-prompts/:promptId/submit
Submit review from feedback prompt.

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Sarah was amazing! Perfect haircut.",
  "wouldRecommend": true
}
```

**Response:**
```json
{
  "success": true,
  "review": { "id": "uuid", "rating": 5 },
  "incentive": {
    "awarded": true,
    "type": "points",
    "value": 50,
    "message": "50 loyalty points added to your account!"
  }
}
```

### POST /api/feedback-prompts/:promptId/dismiss
Dismiss/skip a feedback prompt.

**Request Body:**
```json
{
  "reason": "already_reviewed_elsewhere"
}
```

### GET /api/salons/:salonId/feedback-analytics
Salon feedback prompt analytics.

**Response:**
```json
{
  "summary": {
    "totalPromptsSent": 450,
    "totalReviewsReceived": 180,
    "conversionRate": 40,
    "averageRating": 4.6,
    "averageResponseTime": "4.2 hours"
  },
  "byChannel": {
    "push": { "sent": 400, "opened": 300, "completed": 160 },
    "email": { "sent": 50, "opened": 20, "completed": 20 }
  },
  "byTimeOfDay": {
    "morning": { "sent": 100, "completed": 45 },
    "afternoon": { "sent": 200, "completed": 85 },
    "evening": { "sent": 150, "completed": 50 }
  },
  "incentiveImpact": {
    "withIncentive": { "sent": 200, "completed": 100, "rate": 50 },
    "withoutIncentive": { "sent": 250, "completed": 80, "rate": 32 }
  }
}
```

### PUT /api/salons/:salonId/feedback-settings
Update feedback prompt settings.

**Request Body:**
```json
{
  "promptEnabled": true,
  "delayMinutes": 120,
  "reminderEnabled": true,
  "reminderDelayHours": 24,
  "incentiveEnabled": true,
  "incentivePoints": 50,
  "customMessage": "We'd love to hear about your visit today!",
  "channels": ["push", "email"]
}
```

---

## Prompt Timing Logic

### Initial Prompt
- Default: 2 hours after booking marked complete
- If booking completed after 8 PM: Next day at 10 AM
- Configurable per salon (1-24 hours)

### Reminder Prompt
- Default: 24 hours after initial prompt if no response
- Only if reminder_enabled = 1
- Maximum 1 reminder

### Expiry
- Default: 7 days after initial prompt
- After expiry: Status = 'expired', no more prompts

### Smart Timing
- Don't send between 9 PM and 9 AM
- Account for user timezone
- Avoid sending during booking (check active bookings)

---

## Business Rules

### Prompt Eligibility
- Only for completed bookings
- User has push notifications enabled OR email verified
- User hasn't disabled marketing communications
- No existing review for this booking

### Skip Conditions
- User already reviewed this salon today
- User has 3+ pending prompts (avoid fatigue)
- Booking was heavily discounted/free (optional salon setting)
- Customer complained or requested refund

### Incentive Rules
- One incentive per review
- Incentive only for reviews with comment (minimum 20 characters)
- Incentive awarded immediately upon submission
- Can be points, discount code, or future free service

### Review Quality
- Minimum rating: 1 star (no neutral)
- Optional: Photo upload encouraged
- Optional: Specific aspect ratings (service, staff, ambience)

---

## Corner Cases

### Edge Case 1: Booking Completed Late at Night
**Scenario**: Booking marked complete at 10 PM.
**Solution**: Schedule prompt for next morning (10 AM). Respect quiet hours.

### Edge Case 2: User Disables Notifications
**Scenario**: User had notifications enabled, disabled after prompt scheduled.
**Solution**: Check notification status before sending. Fall back to email.

### Edge Case 3: User Already Reviewed
**Scenario**: User submits review via another path before prompt.
**Solution**: Link review to prompt, mark prompt as 'completed'. Skip sending.

### Edge Case 4: Multiple Bookings Same Day
**Scenario**: Customer has 3 appointments at different salons.
**Solution**: Stagger prompts by 1 hour each. Prioritize by recency.

### Edge Case 5: Review Deleted
**Scenario**: Review submitted via prompt, then deleted by user.
**Solution**: Incentive stays (no clawback). Prompt status remains 'completed'.

### Edge Case 6: Salon Disabled
**Scenario**: Salon deactivated after prompt scheduled.
**Solution**: Skip sending. Mark prompt as 'skipped' with reason.

### Edge Case 7: Staff No Longer at Salon
**Scenario**: Staff member who served customer has left.
**Solution**: Still allow review. Don't show "Rate [Staff Name]" if staff inactive.

### Edge Case 8: Fraudulent Reviews
**Scenario**: User submits many 5-star reviews quickly for points.
**Solution**: Rate limit: Max 3 reviews per day. Analyze patterns for fraud.

---

## Implementation Plan

### Phase 1: Database & Scheduling (2 days)
1. Create feedback tables
2. Hook into booking completion
3. Build scheduling logic

### Phase 2: Notification Engine (2 days)
1. Push notification sending
2. Email fallback
3. Reminder logic
4. Quiet hours handling

### Phase 3: Review Submission Flow (2 days)
1. Quick review from notification
2. Link to existing review system
3. Incentive awarding

### Phase 4: API Layer (1 day)
1. Pending reviews endpoint
2. Submit from prompt endpoint
3. Dismiss endpoint

### Phase 5: Web/Mobile Integration (2 days)
1. Deep link from notification to review form
2. Pending reviews section in profile
3. Incentive display

### Phase 6: Salon Dashboard (1 day)
1. Feedback analytics
2. Settings configuration
3. Incentive program setup

---

## Notifications

### Initial Prompt (Push)
```
⭐ How was your visit to Glow Salon?
Sarah would love to hear your feedback!
Earn 50 points for your review.

[Rate Now] [Later]
```

### Initial Prompt (Email)
```
Subject: How was your haircut at Glow Salon? ⭐

Hi {{firstName}},

We hope you're loving your new look! Sarah at Glow Salon would appreciate your feedback.

[Write a Review - Earn 50 Points]

Your review helps other customers and helps Glow Salon serve you better.
```

### Reminder (Push)
```
⏰ Don't forget to review Glow Salon
Share your experience and earn 50 points!
Expires in 6 days.

[Review Now]
```

### After Submission
```
🎉 Thanks for your review!
You've earned 50 loyalty points.
Your feedback helps Glow Salon serve you better!
```

---

## Mobile UI/UX

### Push Notification
- Rich notification with salon logo
- Quick rating buttons (1-5 stars) inline if supported
- Tap opens review screen

### Review Screen (from notification deep link)
- Pre-filled booking context
- Star rating selector (large, tappable)
- Optional text comment
- Optional photo upload
- "Skip" option
- Show incentive value

### Profile - Pending Reviews Section
- Card for each pending review
- "Review Now" button
- Expiry countdown
- Dismiss option

---

## Web UI/UX

### Email Click → Review Page
- Standalone review submission page
- No login required (secure token in link)
- Mobile-responsive
- Simple, focused UI

### Customer Dashboard
- "Pending Reviews" widget
- Quick access to submit

### Salon Dashboard
- Feedback campaign analytics
- Conversion funnel visualization
- Settings page for prompt configuration
- Incentive program management

---

## Cron Jobs

### Every 5 Minutes: Send Scheduled Prompts
```
1. Find prompts where scheduled_at <= NOW() AND status = 'scheduled'
2. Check user notification preferences
3. Send via appropriate channel
4. Update status to 'sent'
5. Log any failures for retry
```

### Every Hour: Send Reminders
```
1. Find prompts where:
   - status = 'sent' OR status = 'opened'
   - reminder_sent = 0
   - sent_at + reminder_delay_hours <= NOW()
2. Send reminder notification
3. Update reminder_sent = 1
```

### Daily: Expire Old Prompts
```
1. Find prompts where expires_at < NOW() AND status IN ('scheduled', 'sent', 'opened')
2. Update status = 'expired'
```

---

## Testing Checklist

- [ ] Prompt scheduled on booking completion
- [ ] Quiet hours respected
- [ ] Push notification sent at scheduled time
- [ ] Email fallback works
- [ ] Reminder sent after delay
- [ ] Review submission updates prompt status
- [ ] Incentive awarded correctly
- [ ] Expired prompts handled
- [ ] Skip reason recorded
- [ ] Multiple bookings staggered correctly
- [ ] Deep links work from notification
- [ ] Analytics tracking accurate
- [ ] Settings changes take effect
