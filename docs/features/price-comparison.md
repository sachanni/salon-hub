# Cross-Salon Price Comparison System

## Overview
When viewing a service at one salon, show customers comparable prices at nearby salons. This transparency builds trust and helps customers make informed decisions while encouraging competitive pricing.

## Business Value
- **For Customers**: Informed decision-making; confidence in fair pricing; discover alternatives
- **For Salons**: Competitive intelligence; incentive to offer fair prices
- **For Platform**: Higher trust; increased exploration; data-driven pricing insights

---

## Database Schema

### Table: `service_price_comparisons`

Cache of comparable service prices for fast lookups.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| base_service_id | varchar | FK → services.id, NOT NULL | Service being compared |
| base_salon_id | varchar | FK → salons.id, NOT NULL | Salon of base service |
| comparable_service_id | varchar | FK → services.id, NOT NULL | Similar service at other salon |
| comparable_salon_id | varchar | FK → salons.id, NOT NULL | Other salon |
| price_difference_paisa | integer | NOT NULL | Positive = more expensive |
| price_difference_percent | integer | NOT NULL | Percentage difference |
| distance_km | decimal(5,2) | NOT NULL | Distance between salons |
| similarity_score | integer | NOT NULL | 1-100 how similar services are |
| generated_at | timestamp | DEFAULT NOW() | When comparison generated |
| expires_at | timestamp | NOT NULL | When to refresh |

### Indexes
- `service_price_comparisons_base_idx` on (base_service_id, base_salon_id)
- `service_price_comparisons_expires_idx` on (expires_at)

### Drizzle Schema
```typescript
export const servicePriceComparisons = pgTable("service_price_comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  baseServiceId: varchar("base_service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  baseSalonId: varchar("base_salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  comparableServiceId: varchar("comparable_service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  comparableSalonId: varchar("comparable_salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  priceDifferencePaisa: integer("price_difference_paisa").notNull(),
  priceDifferencePercent: integer("price_difference_percent").notNull(),
  distanceKm: decimal("distance_km", { precision: 5, scale: 2 }).notNull(),
  similarityScore: integer("similarity_score").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  index("service_price_comparisons_base_idx").on(table.baseServiceId, table.baseSalonId),
  index("service_price_comparisons_expires_idx").on(table.expiresAt),
]);
```

### Table: `price_comparison_settings`

Salon settings for price comparison visibility.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| salon_id | varchar | FK → salons.id, NOT NULL, UNIQUE | Salon |
| show_comparisons | integer | NOT NULL, DEFAULT 1 | Allow comparisons to show |
| hide_from_comparisons | integer | NOT NULL, DEFAULT 0 | Hide from others' comparisons |
| show_cheaper_only | integer | NOT NULL, DEFAULT 0 | Only show when we're cheaper |
| updated_at | timestamp | DEFAULT NOW() | Last update |

### Table: `service_category_mappings`

Map services to standardized categories for comparison.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| service_id | varchar | FK → services.id, NOT NULL, UNIQUE | Service |
| standard_category | varchar(100) | NOT NULL | Normalized category |
| standard_subcategory | varchar(100) | NULL | Normalized subcategory |
| keywords | text[] | NULL | Matching keywords |
| created_at | timestamp | DEFAULT NOW() | When mapped |

---

## API Endpoints

### GET /api/services/:serviceId/price-comparison
Get price comparison for a specific service.

**Query Parameters:**
- `radius`: Search radius in km (default: 10)
- `limit`: Max comparisons (default: 5)
- `userLat`, `userLng`: User location (optional, for distance)

**Response:**
```json
{
  "currentService": {
    "id": "uuid",
    "name": "Men's Haircut",
    "salon": { "id": "uuid", "name": "Glow Salon", "rating": 4.8 },
    "priceInPaisa": 50000,
    "durationMinutes": 30
  },
  "priceRanking": {
    "position": 3,
    "total": 8,
    "percentile": 62,
    "label": "Mid-range"
  },
  "areaAverage": {
    "priceInPaisa": 45000,
    "difference": "+11%"
  },
  "comparisons": [
    {
      "service": {
        "id": "uuid",
        "name": "Gents Haircut",
        "salon": { "id": "uuid", "name": "Style Studio", "rating": 4.5, "imageUrl": "..." },
        "priceInPaisa": 35000,
        "durationMinutes": 25
      },
      "distance": "1.2 km",
      "priceDifference": "-₹150 (30% less)",
      "similarityScore": 92,
      "availability": "Available today"
    },
    {
      "service": {
        "id": "uuid",
        "name": "Premium Men's Cut",
        "salon": { "id": "uuid", "name": "Luxe Salon", "rating": 4.9, "imageUrl": "..." },
        "priceInPaisa": 80000,
        "durationMinutes": 45
      },
      "distance": "2.5 km",
      "priceDifference": "+₹300 (60% more)",
      "similarityScore": 85,
      "availability": "Next available: Tomorrow"
    }
  ],
  "insights": {
    "cheapestInArea": { "salonName": "Quick Cuts", "price": 25000 },
    "bestValue": { "salonName": "Style Studio", "reason": "Lowest price with 4.5+ rating" }
  }
}
```

### GET /api/salons/:salonId/competitive-analysis
Salon owner view of their competitive position.

**Response:**
```json
{
  "summary": {
    "averagePricePosition": "15% above area average",
    "servicesAboveAverage": 8,
    "servicesBelowAverage": 4,
    "competitivenessScore": 65
  },
  "byService": [
    {
      "service": { "id": "uuid", "name": "Men's Haircut" },
      "yourPrice": 50000,
      "areaAverage": 45000,
      "areaLow": 25000,
      "areaHigh": 80000,
      "position": "Above average",
      "recommendation": "Consider reducing by ₹50 to match average"
    }
  ],
  "competitors": [
    {
      "salon": { "id": "uuid", "name": "Style Studio" },
      "distance": "1.2 km",
      "averagePriceComparison": "20% cheaper",
      "rating": 4.5
    }
  ]
}
```

### PUT /api/salons/:salonId/comparison-settings
Update comparison visibility settings.

**Request Body:**
```json
{
  "showComparisons": true,
  "hideFromComparisons": false,
  "showCheaperOnly": false
}
```

---

## Service Similarity Algorithm

### Matching Criteria
1. **Category Match**: Same service category (Hair, Nails, etc.)
2. **Subcategory Match**: Same subcategory (Haircut, Color, etc.)
3. **Gender Match**: Same gender applicability
4. **Duration Similarity**: Within ±50% duration
5. **Name Similarity**: Fuzzy string matching

### Similarity Score Calculation
```
Score = 0

Category match: +30
Subcategory match: +25
Gender match: +15
Duration within 10%: +15 (within 25%: +10, within 50%: +5)
Name similarity (Levenshtein): +15 * (1 - distance/maxLength)

Max score: 100
Minimum threshold for comparison: 70
```

### Standard Categories
```
Hair Services:
- haircut_mens
- haircut_womens
- haircut_kids
- hair_color_full
- hair_color_highlights
- hair_treatment
- hair_styling
- hair_extensions

Nail Services:
- manicure_basic
- manicure_gel
- pedicure_basic
- pedicure_spa
- nail_art

Skin Services:
- facial_basic
- facial_premium
- facial_anti_aging
- cleanup
- bleach
- waxing_full_body
- waxing_partial

Spa Services:
- massage_swedish
- massage_deep_tissue
- massage_aromatherapy
- body_wrap
- body_scrub
```

---

## Business Rules

### Comparison Eligibility
- Only compare services from active salons
- Only compare within same city/metro area
- Respect salon's `hide_from_comparisons` setting
- Minimum 3 comparable services needed to show comparison

### Distance Weighting
- Closer salons shown first
- Max comparison radius: 15 km
- Default radius: 5 km

### Price Freshness
- Re-fetch comparisons if > 24 hours old
- Immediate refresh on service price update
- Background job refreshes popular comparisons

### Privacy Controls
- Salons can opt-out of appearing in comparisons
- Salons can hide comparison widget on their pages
- Platform can force-show for transparency (configurable)

---

## Corner Cases

### Edge Case 1: No Comparable Services
**Scenario**: Unique service with no matches nearby.
**Solution**: Show "This service is unique in your area" message. No comparison widget.

### Edge Case 2: Only More Expensive Options
**Scenario**: Current service is cheapest in area.
**Solution**: Highlight "Lowest price in area!" badge. Still show comparisons with "premium alternatives" framing.

### Edge Case 3: Significantly Different Durations
**Scenario**: 15-min express haircut vs 45-min premium haircut.
**Solution**: Low similarity score. Show duration difference prominently. "Shorter service" / "Includes wash & style" context.

### Edge Case 4: Dynamic Pricing
**Scenario**: Salon uses peak/off-peak pricing.
**Solution**: Compare base prices. Note "prices may vary by time" disclaimer.

### Edge Case 5: Package vs Individual
**Scenario**: Comparing standalone service to part of package.
**Solution**: Only compare standalone services. Don't break down package component prices.

### Edge Case 6: Currency/Location Mismatch
**Scenario**: Salon in different pricing zone (e.g., metro vs suburb).
**Solution**: Show location context. "Prices in [City Name] typically range..."

### Edge Case 7: Stale Competitor Prices
**Scenario**: Compared salon hasn't updated prices in months.
**Solution**: Show "Price as of [date]" for older data. Flag potentially stale prices.

### Edge Case 8: New Salon
**Scenario**: Newly registered salon with no booking history.
**Solution**: Include in comparisons but note "New salon" badge. No rating data available.

---

## Implementation Plan

### Phase 1: Category Mapping (2 days)
1. Create standard category taxonomy
2. Build auto-categorization logic
3. Map existing services to categories

### Phase 2: Comparison Engine (3 days)
1. Similarity scoring algorithm
2. Geographic filtering
3. Price difference calculations

### Phase 3: Caching Layer (1 day)
1. Comparison cache table
2. Cache invalidation on price change
3. Background refresh job

### Phase 4: API Layer (2 days)
1. Consumer comparison endpoint
2. Salon competitive analysis
3. Settings management

### Phase 5: Web Integration (2 days)
1. Comparison widget on service page
2. Salon competitive dashboard
3. Settings page

### Phase 6: Mobile Integration (1 day)
1. Comparison view on service detail
2. "Compare prices" action

---

## Mobile UI/UX

### Service Detail Screen
- "Compare Prices" expandable section
- Price ranking badge ("3rd lowest of 8 nearby")
- Horizontal scroll of alternatives
- Each card: Salon name, price, distance, rating
- Tap to view that salon's service

### Comparison Card
- Salon image/logo
- Price with difference indicator (green if cheaper, red if more)
- Distance
- Mini rating stars
- "Book" quick action

---

## Web UI/UX

### Service Page Widget
- "Price comparison" collapsible panel
- Bar chart showing price range with current position
- Table of alternatives with all details
- Click to navigate to alternative

### Salon Dashboard
- "Competitive Pricing" analytics tab
- Service-by-service comparison table
- Recommendations for price adjustments
- Market positioning score

---

## Privacy & Ethics

### Transparency
- Clearly label price comparison source
- Show update timestamps
- Allow salon feedback on incorrect data

### Fairness
- Don't manipulate rankings for commercial reasons
- Equal treatment of all salons in algorithm
- Clear opt-out process

### Data Accuracy
- Regular price verification
- User reporting for incorrect prices
- Salon self-update capability

---

## Testing Checklist

- [ ] Similarity algorithm matches correctly
- [ ] Geographic filtering works
- [ ] Price differences calculated correctly
- [ ] Cache updates on price change
- [ ] Opt-out settings respected
- [ ] Minimum comparison threshold enforced
- [ ] Distance shown correctly
- [ ] Rating data included
- [ ] Stale data flagged
- [ ] New salons handled correctly
- [ ] Edge cases for unique services work
- [ ] Mobile and web UIs match
