# Peak & Off-Peak Pricing Indicators System

## Overview
Show customers which time slots are high-demand (peak) vs low-demand (off-peak), with optional dynamic pricing discounts for off-peak bookings. This helps distribute demand more evenly and offers savings to flexible customers.

## Business Value
- **For Customers**: Save money by booking off-peak; informed decision on time selection
- **For Salons**: Better capacity utilization; fill traditionally slow periods; increase revenue
- **For Platform**: Higher overall booking volume; improved user experience

---

## Database Schema

### Table: `time_slot_demand`

Track demand patterns by day/time.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| salon_id | varchar | FK → salons.id, NOT NULL | Salon |
| day_of_week | integer | NOT NULL | 0-6 (Sunday-Saturday) |
| hour_of_day | integer | NOT NULL | 0-23 |
| demand_level | varchar(20) | NOT NULL | 'low', 'medium', 'high', 'peak' |
| booking_count_30d | integer | NOT NULL, DEFAULT 0 | Bookings in last 30 days |
| avg_utilization_percent | integer | NOT NULL, DEFAULT 0 | Slot fill rate |
| generated_at | timestamp | DEFAULT NOW() | When calculated |

### Indexes
- `time_slot_demand_salon_day_idx` on (salon_id, day_of_week)
- UNIQUE on (salon_id, day_of_week, hour_of_day)

### Drizzle Schema
```typescript
export const timeSlotDemand = pgTable("time_slot_demand", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  hourOfDay: integer("hour_of_day").notNull(),
  demandLevel: varchar("demand_level", { length: 20 }).notNull(),
  bookingCount30d: integer("booking_count_30d").notNull().default(0),
  avgUtilizationPercent: integer("avg_utilization_percent").notNull().default(0),
  generatedAt: timestamp("generated_at").defaultNow(),
}, (table) => [
  index("time_slot_demand_salon_day_idx").on(table.salonId, table.dayOfWeek),
  uniqueIndex("time_slot_demand_unique").on(table.salonId, table.dayOfWeek, table.hourOfDay),
]);
```

### Table: `dynamic_pricing_rules`

Salon-defined pricing adjustments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| salon_id | varchar | FK → salons.id, NOT NULL | Salon |
| name | text | NOT NULL | Rule name |
| rule_type | varchar(30) | NOT NULL | 'off_peak_discount', 'peak_surcharge', 'happy_hour' |
| day_of_week | integer | NULL | Specific day or NULL for all |
| start_hour | integer | NOT NULL | Start time (0-23) |
| end_hour | integer | NOT NULL | End time (0-23) |
| adjustment_type | varchar(20) | NOT NULL | 'percentage', 'fixed' |
| adjustment_value | integer | NOT NULL | Negative = discount, positive = surcharge |
| max_discount_paisa | integer | NULL | Cap on discount |
| min_booking_value_paisa | integer | NULL | Minimum booking for discount |
| applicable_service_ids | text[] | NULL | NULL = all services |
| is_active | integer | NOT NULL, DEFAULT 1 | Active status |
| valid_from | timestamp | NULL | Start date |
| valid_until | timestamp | NULL | End date |
| created_at | timestamp | DEFAULT NOW() | When created |
| updated_at | timestamp | DEFAULT NOW() | Last update |

### Indexes
- `dynamic_pricing_rules_salon_idx` on (salon_id)
- `dynamic_pricing_rules_active_idx` on (is_active)

### Table: `pricing_adjustments_log`

Audit trail of applied pricing adjustments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| booking_id | varchar | FK → bookings.id, NOT NULL | Booking |
| rule_id | varchar | FK → dynamic_pricing_rules.id, NOT NULL | Applied rule |
| original_price_paisa | integer | NOT NULL | Before adjustment |
| adjusted_price_paisa | integer | NOT NULL | After adjustment |
| adjustment_amount_paisa | integer | NOT NULL | Difference |
| created_at | timestamp | DEFAULT NOW() | When applied |

---

## API Endpoints

### GET /api/salons/:salonId/demand-heatmap
Get demand heatmap for booking UI.

**Response:**
```json
{
  "heatmap": {
    "sunday": [
      { "hour": 9, "demand": "medium", "discount": null },
      { "hour": 10, "demand": "high", "discount": null },
      { "hour": 11, "demand": "peak", "discount": null },
      { "hour": 12, "demand": "high", "discount": null },
      { "hour": 13, "demand": "medium", "discount": null },
      { "hour": 14, "demand": "low", "discount": { "type": "percentage", "value": 15 } },
      { "hour": 15, "demand": "low", "discount": { "type": "percentage", "value": 15 } }
    ],
    "monday": [
      { "hour": 9, "demand": "low", "discount": { "type": "percentage", "value": 20 } },
      { "hour": 10, "demand": "low", "discount": { "type": "percentage", "value": 20 } }
    ]
  },
  "legend": {
    "peak": { "label": "Very Busy", "color": "#ef4444" },
    "high": { "label": "Busy", "color": "#f97316" },
    "medium": { "label": "Moderate", "color": "#eab308" },
    "low": { "label": "Quiet - Discounts Available", "color": "#22c55e" }
  },
  "bestTimes": [
    { "day": "Tuesday", "time": "2:00 PM", "discount": "20% off" },
    { "day": "Wednesday", "time": "10:00 AM", "discount": "15% off" }
  ]
}
```

### GET /api/salons/:salonId/slots/:date/pricing
Get slots with pricing for specific date.

**Response:**
```json
{
  "date": "2025-12-16",
  "dayOfWeek": "Tuesday",
  "overallDemand": "low",
  "slots": [
    {
      "time": "09:00",
      "available": true,
      "demand": "low",
      "pricing": {
        "originalPriceInPaisa": 50000,
        "adjustedPriceInPaisa": 40000,
        "discountPercent": 20,
        "discountLabel": "Off-Peak Discount",
        "savings": "₹100"
      }
    },
    {
      "time": "11:00",
      "available": true,
      "demand": "peak",
      "pricing": {
        "originalPriceInPaisa": 50000,
        "adjustedPriceInPaisa": 50000,
        "discountPercent": 0,
        "discountLabel": null
      }
    }
  ]
}
```

### POST /api/salons/:salonId/pricing-rules
Create a dynamic pricing rule (salon owner).

**Request Body:**
```json
{
  "name": "Weekday Morning Discount",
  "ruleType": "off_peak_discount",
  "dayOfWeek": null,
  "startHour": 9,
  "endHour": 12,
  "adjustmentType": "percentage",
  "adjustmentValue": -15,
  "validFrom": "2025-12-01",
  "validUntil": "2026-02-28"
}
```

### PUT /api/salons/:salonId/pricing-rules/:ruleId
Update pricing rule.

### DELETE /api/salons/:salonId/pricing-rules/:ruleId
Delete pricing rule.

### GET /api/salons/:salonId/pricing-analytics
Get pricing rule performance (owner).

**Response:**
```json
{
  "summary": {
    "totalDiscountedBookings": 127,
    "totalDiscountGiven": 15400000,
    "incrementalBookings": 45,
    "estimatedRevenueGain": 180000
  },
  "byRule": [
    {
      "rule": { "id": "uuid", "name": "Weekday Morning Discount" },
      "bookings": 85,
      "totalDiscount": 12000000,
      "averageDiscount": 141176,
      "utilizationChange": "+35%"
    }
  ],
  "demandImpact": {
    "beforePricing": { "offPeakUtilization": 35, "peakUtilization": 95 },
    "afterPricing": { "offPeakUtilization": 58, "peakUtilization": 90 }
  }
}
```

---

## Demand Calculation Algorithm

### Data Collection
```typescript
async function updateDemandPatterns(salonId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  const bookings = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.salonId, salonId),
      gte(bookings.createdAt, thirtyDaysAgo),
      eq(bookings.status, 'completed')
    ));
  
  const demandBySlot = {};
  
  for (const booking of bookings) {
    const day = getDayOfWeek(booking.bookingDate);
    const hour = parseInt(booking.bookingTime.split(':')[0]);
    const key = `${day}-${hour}`;
    demandBySlot[key] = (demandBySlot[key] || 0) + 1;
  }
  
  // Calculate percentiles
  const counts = Object.values(demandBySlot);
  const p25 = percentile(counts, 25);
  const p50 = percentile(counts, 50);
  const p75 = percentile(counts, 75);
  
  // Classify demand
  for (const [key, count] of Object.entries(demandBySlot)) {
    const [day, hour] = key.split('-').map(Number);
    let demandLevel;
    
    if (count <= p25) demandLevel = 'low';
    else if (count <= p50) demandLevel = 'medium';
    else if (count <= p75) demandLevel = 'high';
    else demandLevel = 'peak';
    
    await upsertDemand(salonId, day, hour, demandLevel, count);
  }
}
```

### Demand Levels
| Level | Percentile | Color | Recommendation |
|-------|------------|-------|----------------|
| Low | 0-25% | Green | Offer discounts |
| Medium | 25-50% | Yellow | Standard pricing |
| High | 50-75% | Orange | Standard pricing |
| Peak | 75-100% | Red | Consider surcharge |

---

## Business Rules

### Discount Limits
- Maximum discount: 50%
- Minimum booking value may apply
- Discounts can be service-specific

### Surcharge Rules
- Optional - salons can enable/disable
- Maximum surcharge: 25%
- Clear disclosure required

### Price Display
- Always show original price with strikethrough
- Show savings prominently
- "Off-Peak Discount" label for transparency

### Stacking Rules
- Off-peak discount + birthday offer: Apply highest only
- Off-peak discount + loyalty points: Can stack
- Configurable by salon

### Time Windows
- Minimum rule duration: 1 hour
- Rules can span across midnight
- Different rules for different days

---

## Corner Cases

### Edge Case 1: Last-Minute Booking
**Scenario**: Customer books 1 hour before appointment time.
**Solution**: Apply pricing based on slot time, not booking time.

### Edge Case 2: Rescheduled Booking
**Scenario**: Customer booked peak time at full price, reschedules to off-peak.
**Solution**: Recalculate price. Refund difference or issue credit.

### Edge Case 3: Overlapping Rules
**Scenario**: Two rules apply to same slot.
**Solution**: Apply rule with higher discount (most favorable to customer).

### Edge Case 4: Holiday on Weekday
**Scenario**: Tuesday is a national holiday (typically off-peak but actually peak).
**Solution**: Support "override dates" to mark specific dates as peak/off-peak.

### Edge Case 5: New Salon
**Scenario**: Salon just joined, no booking history.
**Solution**: Use industry defaults until 30+ bookings accumulated.

### Edge Case 6: Seasonal Variation
**Scenario**: December is peak season overall.
**Solution**: Allow seasonal rules. Recalculate demand monthly.

### Edge Case 7: Staff-Specific Demand
**Scenario**: Star stylist always busy, others have availability.
**Solution**: Future enhancement: Staff-level demand tracking.

### Edge Case 8: Service Duration Spans Demand Zones
**Scenario**: 2-hour service starts at 11:30 AM, spans peak to off-peak.
**Solution**: Price based on start time of service.

---

## Implementation Plan

### Phase 1: Demand Tracking (2 days)
1. Create demand tables
2. Build demand calculation job
3. Historical backfill

### Phase 2: Pricing Rules Engine (2 days)
1. Rule creation/management
2. Rule matching algorithm
3. Price adjustment calculation

### Phase 3: API Layer (2 days)
1. Heatmap endpoint
2. Pricing-aware slots endpoint
3. Rule management endpoints
4. Analytics endpoint

### Phase 4: Web Integration (2 days)
1. Heatmap calendar view
2. Slot selection with pricing
3. Salon pricing rule management

### Phase 5: Mobile Integration (1 day)
1. Demand indicators on slots
2. Savings badge display

### Phase 6: Analytics & Reporting (1 day)
1. Rule performance dashboard
2. Demand shift tracking
3. Revenue impact analysis

---

## Mobile UI/UX

### Date Selection
- Calendar with color-coded days
- Green badge on low-demand days
- "Best prices" label on discounted days

### Time Selection
- Slots colored by demand level
- Discount badge on off-peak slots
- "Save ₹100" inline with price
- Strikethrough original price

### Booking Confirmation
- Clear breakdown: Original price, Discount, Final price
- "Off-Peak Savings: ₹100" highlight

---

## Web UI/UX

### Booking Page
- Weekly heatmap grid
- Hover shows expected busyness
- Click filters to that time range
- "Show best deals" toggle

### Salon Dashboard
- Demand heatmap with booking overlay
- Rule creation wizard
- Performance metrics per rule
- Recommendations engine

### Price Rule Editor
- Time range slider
- Day checkboxes
- Discount percentage input
- Preview of affected slots
- Impact forecast

---

## Demand Indicators

### Visual Legend
```
🟢 Quiet (15-20% off available)
🟡 Moderate (standard pricing)
🟠 Busy (book early)
🔴 Peak (limited availability)
```

### Badge Examples
- "Save 15%" on off-peak slot
- "Popular time" on peak slot
- "Best deal today" on maximum discount slot

---

## Testing Checklist

- [ ] Demand calculation runs correctly
- [ ] Demand levels classified by percentile
- [ ] Pricing rules created successfully
- [ ] Discounts applied correctly
- [ ] Surcharges applied correctly
- [ ] Overlapping rules handled
- [ ] Rescheduled bookings repriced
- [ ] Heatmap displays correctly
- [ ] Mobile discount badges show
- [ ] Analytics track accurately
- [ ] Holiday overrides work
- [ ] New salons get defaults
- [ ] Rule expiry handled
