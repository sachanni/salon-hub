# Booking Streak Rewards System

## Overview
Reward customers who maintain consistent booking patterns with bonus loyalty points. Streaks encourage regular visits and increase customer lifetime value through gamification.

## Business Value
- **For Customers**: Earn bonus points for regular visits; gamification drives engagement
- **For Salons**: Predictable recurring revenue; improved customer retention
- **For Platform**: Higher booking frequency; increased customer LTV

---

## Database Schema

### Table: `booking_streaks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| salon_id | varchar | FK → salons.id, NOT NULL | Streak at this salon |
| current_streak | integer | NOT NULL, DEFAULT 0 | Current consecutive months |
| longest_streak | integer | NOT NULL, DEFAULT 0 | Lifetime best streak |
| streak_start_date | text | NULL | When current streak began |
| last_qualifying_booking_id | varchar | FK → bookings.id, NULL | Most recent streak booking |
| last_qualifying_date | text | NULL | Date of last qualifying booking |
| next_deadline | text | NULL | Book by this date to maintain streak |
| streak_broken_count | integer | NOT NULL, DEFAULT 0 | Times streak was broken |
| total_streak_points_earned | integer | NOT NULL, DEFAULT 0 | Lifetime streak bonus points |
| status | varchar(20) | NOT NULL, DEFAULT 'active' | 'active', 'at_risk', 'broken' |
| updated_at | timestamp | DEFAULT NOW() | Last update |
| created_at | timestamp | DEFAULT NOW() | First booking at salon |

### Indexes
- `booking_streaks_user_id_idx` on (user_id)
- `booking_streaks_salon_id_idx` on (salon_id)
- `booking_streaks_status_idx` on (status)
- `booking_streaks_deadline_idx` on (next_deadline)
- UNIQUE on (user_id, salon_id)

### Drizzle Schema
```typescript
export const bookingStreaks = pgTable("booking_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  streakStartDate: text("streak_start_date"),
  lastQualifyingBookingId: varchar("last_qualifying_booking_id").references(() => bookings.id, { onDelete: "set null" }),
  lastQualifyingDate: text("last_qualifying_date"),
  nextDeadline: text("next_deadline"),
  streakBrokenCount: integer("streak_broken_count").notNull().default(0),
  totalStreakPointsEarned: integer("total_streak_points_earned").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("booking_streaks_user_id_idx").on(table.userId),
  index("booking_streaks_salon_id_idx").on(table.salonId),
  index("booking_streaks_status_idx").on(table.status),
  index("booking_streaks_deadline_idx").on(table.nextDeadline),
  uniqueIndex("booking_streaks_user_salon_unique").on(table.userId, table.salonId),
]);
```

### Table: `streak_rewards`

Define reward tiers for streaks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| salon_id | varchar | FK → salons.id, NULL | NULL for platform-wide |
| streak_length | integer | NOT NULL | Required consecutive months |
| reward_type | varchar(30) | NOT NULL | 'bonus_points', 'discount', 'free_service' |
| reward_value | integer | NOT NULL | Points or percentage |
| reward_name | text | NOT NULL | Display name |
| description | text | NULL | Description of reward |
| badge_icon | text | NULL | Icon for achievement badge |
| is_active | integer | NOT NULL, DEFAULT 1 | Active status |
| created_at | timestamp | DEFAULT NOW() | When created |

### Indexes
- `streak_rewards_salon_streak_idx` on (salon_id, streak_length)

### Table: `streak_reward_claims`

Track claimed streak rewards.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| streak_id | varchar | FK → booking_streaks.id, NOT NULL | Streak record |
| reward_id | varchar | FK → streak_rewards.id, NOT NULL | Claimed reward |
| user_id | varchar | FK → users.id, NOT NULL | Customer |
| streak_length_at_claim | integer | NOT NULL | Streak when claimed |
| points_awarded | integer | NULL | Points given |
| discount_code | varchar(50) | NULL | Generated discount code |
| claimed_at | timestamp | DEFAULT NOW() | When claimed |
| expires_at | timestamp | NULL | Reward expiry |
| redeemed_at | timestamp | NULL | When used |

---

## Streak Rules

### Qualifying Booking
A booking qualifies for streak if:
1. Status = 'completed'
2. Total amount >= minimum threshold (configurable, default ₹200)
3. At least one service was performed (not just product purchase)
4. Booking date is after last qualifying date

### Streak Period
- Default: Monthly (one completed booking per calendar month)
- Configurable: Weekly, Bi-weekly, Monthly, Quarterly
- Grace period: 7 days into next period before streak breaks

### Reward Tiers (Platform Default)

| Streak | Reward | Description |
|--------|--------|-------------|
| 2 months | 50 bonus points | Just getting started |
| 3 months | 100 bonus points | Building a habit |
| 6 months | 200 bonus points + 5% discount | Half-year hero |
| 12 months | 500 bonus points + 10% discount | Annual champion |
| 24 months | 1000 bonus points + Free service up to ₹500 | Two-year legend |

### Streak Multiplier
- Base points from booking + (Streak × Multiplier)
- Default multiplier: 10 points per streak month
- Example: 6-month streak = 60 bonus points per booking

---

## API Endpoints

### GET /api/streaks/my-streaks
Get current user's streaks across all salons.

**Response:**
```json
{
  "streaks": [
    {
      "id": "uuid",
      "salon": { "id": "uuid", "name": "Glow Salon", "imageUrl": "..." },
      "currentStreak": 4,
      "longestStreak": 7,
      "status": "active",
      "nextDeadline": "2025-12-31",
      "daysRemaining": 21,
      "nextReward": {
        "streakRequired": 6,
        "monthsAway": 2,
        "reward": "200 bonus points + 5% discount"
      },
      "totalPointsEarned": 350
    }
  ],
  "atRiskCount": 1,
  "totalActiveStreaks": 2
}
```

### GET /api/streaks/salon/:salonId
Get user's streak at specific salon.

**Response:**
```json
{
  "streak": {
    "currentStreak": 4,
    "longestStreak": 7,
    "streakStartDate": "2025-08-15",
    "lastBookingDate": "2025-11-22",
    "nextDeadline": "2025-12-31",
    "status": "active"
  },
  "rewards": {
    "currentTier": { "name": "3-Month Streak", "bonusPoints": 100 },
    "nextTier": { "name": "6-Month Streak", "monthsAway": 2, "bonusPoints": 200 }
  },
  "history": [
    { "month": "Nov 2025", "booked": true, "bookingDate": "2025-11-22" },
    { "month": "Oct 2025", "booked": true, "bookingDate": "2025-10-18" }
  ]
}
```

### POST /api/streaks/claim-reward
Claim an earned streak reward.

**Request Body:**
```json
{
  "streakId": "uuid",
  "rewardId": "uuid"
}
```

### GET /api/salons/:salonId/streak-rewards
Get available streak rewards for a salon.

**Response:**
```json
{
  "rewards": [
    { "streakLength": 3, "reward": "100 bonus points", "badge": "bronze" },
    { "streakLength": 6, "reward": "200 points + 5% off", "badge": "silver" },
    { "streakLength": 12, "reward": "500 points + 10% off", "badge": "gold" }
  ]
}
```

### GET /api/admin/salons/:salonId/streaks
Salon owner view of customer streaks.

**Response:**
```json
{
  "summary": {
    "totalActiveStreaks": 45,
    "averageStreakLength": 3.2,
    "longestActiveStreak": 14,
    "atRiskCustomers": 8
  },
  "customers": [
    {
      "user": { "id": "uuid", "name": "John Doe" },
      "currentStreak": 7,
      "lastVisit": "2025-11-22",
      "status": "active"
    }
  ]
}
```

---

## Business Rules

### Streak Start
- First completed booking at salon starts streak at 1
- Subsequent month's booking increases to 2, etc.

### Streak Maintenance
- One qualifying booking per period maintains streak
- Multiple bookings in same period don't advance streak faster
- Booking must complete before deadline

### Streak Break
- If no qualifying booking by `nextDeadline`:
  - Status → 'broken'
  - currentStreak → 0
  - streakBrokenCount += 1
  - longestStreak preserved

### At-Risk Status
- 5 days before deadline with no booking → status = 'at_risk'
- Send reminder notification
- Show warning in app

### Streak Freeze (Premium Feature)
- Allow one "freeze" per year
- Extends deadline by one period
- Preserves streak during vacation/illness

---

## Corner Cases

### Edge Case 1: Booking Completed After Deadline
**Scenario**: Booking date before deadline but marked complete after.
**Solution**: Use `bookingDate`, not `completedAt`. If booking was ON or BEFORE deadline, it counts.

### Edge Case 2: Multiple Salons Same Chain
**Scenario**: User books at Glow Salon Location A and Location B.
**Solution**: Track per salon_id. Chain-wide streak is a separate feature.

### Edge Case 3: Refunded Booking
**Scenario**: Booking that maintained streak gets refunded.
**Solution**: On full refund, re-evaluate streak. If no other qualifying booking that period, break streak.

### Edge Case 4: Salon Deactivated
**Scenario**: Salon closes while customer has active streak.
**Solution**: Freeze streak. If salon reactivates, streak continues. If permanently closed, award final streak points.

### Edge Case 5: Timezone Edge
**Scenario**: Customer books at 11:55 PM on deadline day in different timezone.
**Solution**: Use salon's timezone for deadline calculation.

### Edge Case 6: Backdated Booking
**Scenario**: Salon owner creates backdated booking.
**Solution**: Backdated bookings within current period count. Backdating into previous periods not allowed.

### Edge Case 7: Streak Recovery
**Scenario**: Customer wants streak back after 1-day miss.
**Solution**: No automatic recovery. Salon owner can manually grant "streak restore" as gesture.

### Edge Case 8: Free Service Booking
**Scenario**: Customer books free service (loyalty redemption).
**Solution**: Only count if final amount >= minimum threshold. Free redemptions don't count.

---

## Implementation Plan

### Phase 1: Database & Core Logic (2 days)
1. Create streak tables
2. Implement streak calculation logic
3. Build deadline calculation

### Phase 2: Streak Updates (2 days)
1. Hook into booking completion flow
2. Update streak on each qualifying booking
3. Implement streak break logic

### Phase 3: Rewards Engine (2 days)
1. Create default reward tiers
2. Implement reward claiming
3. Build points awarding system

### Phase 4: Cron Jobs (1 day)
1. Daily job to check at-risk streaks
2. Daily job to break expired streaks
3. Notification sending for at-risk

### Phase 5: Web/Mobile Integration (2 days)
1. Streak display in customer profile
2. Streak badge on booking confirmation
3. Reward claim UI

### Phase 6: Salon Dashboard (1 day)
1. Customer streak analytics
2. At-risk customer alerts
3. Streak reward configuration

---

## Notifications

### At-Risk Reminder (5 days before deadline)
```
🔥 Your 4-month streak at Glow Salon is at risk!
Book by Dec 31 to keep it going.
[Book Now]
```

### Streak Maintained
```
🎉 Streak Extended! You're now on a 5-month streak at Glow Salon.
You earned 50 bonus points!
```

### Streak Broken
```
😢 Your streak at Glow Salon has ended at 4 months.
No worries - start a new streak with your next visit!
```

### Milestone Achieved
```
🏆 AMAZING! 12-month streak achieved at Glow Salon!
You've unlocked: 500 bonus points + 10% discount
[Claim Reward]
```

---

## Mobile UI/UX

### Profile Screen
- Streak cards for each salon
- Flame icon 🔥 with streak count
- Progress bar to next milestone
- "At Risk" badge in red when applicable

### Booking Confirmation
- "Streak Extended!" celebration animation
- Points earned breakdown
- Next deadline displayed

### Streak Detail Screen
- Calendar view of booking history
- Milestone badges earned
- Next reward preview

---

## Web UI/UX

### Customer Dashboard
- Streak summary widget
- Quick link to at-risk salons
- Reward claim section

### Salon Dashboard
- Customer streak leaderboard
- At-risk customer alerts
- Streak-based marketing suggestions

---

## Testing Checklist

- [ ] Streak starts at 1 on first booking
- [ ] Streak increments correctly each period
- [ ] Multiple bookings same period don't double-count
- [ ] Streak breaks correctly after deadline
- [ ] At-risk status triggers at 5 days
- [ ] Notifications sent at correct times
- [ ] Rewards claimed correctly
- [ ] Points awarded correctly
- [ ] Refund handling works
- [ ] Timezone handling correct
- [ ] Longest streak preserved after break
- [ ] Salon-level streak configuration works
