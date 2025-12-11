# Service Bundles & Package Pricing System

## Overview
Allow salons to create discounted service bundles (packages) that combine multiple services at a reduced price. This increases average order value while providing customers with better value for comprehensive treatments.

## Business Value
- **For Customers**: Save 15-25% on combined services; convenient one-booking experience
- **For Salons**: Higher average ticket size; predictable service combinations; efficient scheduling
- **For Platform**: Increased GMV; higher customer satisfaction

---

## Database Schema

### Existing Table: `service_packages`
Already exists with core fields. Enhancements needed:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| salon_id | varchar | FK → salons.id, NOT NULL | Owning salon |
| name | text | NOT NULL | Package name (e.g., "Bridal Package") |
| description | text | NULL | Detailed description |
| total_duration_minutes | integer | NOT NULL | Total time for all services |
| package_price_in_paisa | integer | NOT NULL | Discounted package price |
| regular_price_in_paisa | integer | NOT NULL | Sum of individual prices |
| discount_percentage | integer | NULL | Calculated discount % |
| currency | varchar(3) | NOT NULL, DEFAULT 'INR' | Currency code |
| is_active | integer | NOT NULL, DEFAULT 1 | Active status |
| created_at | timestamp | DEFAULT NOW() | Creation date |
| updated_at | timestamp | DEFAULT NOW() | Last update |

### New Columns to Add to `service_packages`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| category | varchar(50) | NULL | 'bridal', 'spa_day', 'grooming', 'seasonal' |
| image_url | text | NULL | Package promotional image |
| max_bookings_per_day | integer | NULL | Limit daily package bookings |
| valid_from | timestamp | NULL | Start of validity period |
| valid_until | timestamp | NULL | End of validity period |
| min_advance_booking_hours | integer | NULL | Required advance notice |
| available_days | text[] | NULL | Days available (e.g., ['Mon', 'Tue', 'Wed']) |
| available_time_start | text | NULL | Earliest booking time |
| available_time_end | text | NULL | Latest booking time |
| gender | varchar(10) | NULL | 'male', 'female', 'unisex' |
| is_featured | integer | NOT NULL, DEFAULT 0 | Featured on homepage |
| booking_count | integer | NOT NULL, DEFAULT 0 | Times booked |
| sort_order | integer | NOT NULL, DEFAULT 0 | Display order |

### Updated Drizzle Schema
```typescript
export const servicePackages = pgTable("service_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  totalDurationMinutes: integer("total_duration_minutes").notNull(),
  packagePriceInPaisa: integer("package_price_in_paisa").notNull(),
  regularPriceInPaisa: integer("regular_price_in_paisa").notNull(),
  discountPercentage: integer("discount_percentage"),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  category: varchar("category", { length: 50 }),
  imageUrl: text("image_url"),
  maxBookingsPerDay: integer("max_bookings_per_day"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  minAdvanceBookingHours: integer("min_advance_booking_hours"),
  availableDays: text("available_days").array(),
  availableTimeStart: text("available_time_start"),
  availableTimeEnd: text("available_time_end"),
  gender: varchar("gender", { length: 10 }),
  isFeatured: integer("is_featured").notNull().default(0),
  bookingCount: integer("booking_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("service_packages_id_salon_id_unique").on(table.id, table.salonId),
  index("service_packages_category_idx").on(table.category),
  index("service_packages_featured_idx").on(table.isFeatured),
  index("service_packages_valid_dates_idx").on(table.validFrom, table.validUntil),
]);
```

### Existing Table: `package_services`
Junction table linking packages to services. Already implemented correctly.

### New Table: `package_bookings`

Track package-specific booking data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PK, UUID | Unique identifier |
| booking_id | varchar | FK → bookings.id, NOT NULL | Associated booking |
| package_id | varchar | FK → service_packages.id, NOT NULL | Booked package |
| package_price_at_booking | integer | NOT NULL | Price when booked |
| regular_price_at_booking | integer | NOT NULL | Regular price when booked |
| savings_paisa | integer | NOT NULL | Amount saved |
| created_at | timestamp | DEFAULT NOW() | When booked |

---

## API Endpoints

### GET /api/salons/:salonId/packages
Get available packages for a salon.

**Query Parameters:**
- `category`: Filter by category
- `gender`: Filter by gender
- `featured`: Show only featured packages
- `available`: Only show currently bookable packages

**Response:**
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "Bridal Glow Package",
      "description": "Complete bridal preparation with facial, makeup, and hair styling",
      "category": "bridal",
      "imageUrl": "...",
      "services": [
        { "id": "uuid", "name": "Bridal Makeup", "durationMinutes": 90, "priceInPaisa": 500000 },
        { "id": "uuid", "name": "Hair Styling", "durationMinutes": 60, "priceInPaisa": 300000 },
        { "id": "uuid", "name": "Gold Facial", "durationMinutes": 45, "priceInPaisa": 200000 }
      ],
      "totalDurationMinutes": 195,
      "regularPriceInPaisa": 1000000,
      "packagePriceInPaisa": 800000,
      "discountPercentage": 20,
      "savings": "₹2,000",
      "availability": {
        "availableDays": ["Fri", "Sat", "Sun"],
        "timeWindow": "09:00 - 14:00",
        "requiresAdvanceBooking": 48
      },
      "isFeatured": true,
      "bookingCount": 127
    }
  ],
  "categories": ["bridal", "spa_day", "grooming", "seasonal"]
}
```

### GET /api/packages/:packageId
Get package details.

### POST /api/salons/:salonId/packages
Create a new package (salon owner).

**Request Body:**
```json
{
  "name": "Men's Grooming Essentials",
  "description": "Complete grooming package for the modern man",
  "serviceIds": ["uuid1", "uuid2", "uuid3"],
  "packagePriceInPaisa": 150000,
  "category": "grooming",
  "gender": "male",
  "availableDays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "maxBookingsPerDay": 5
}
```

### PUT /api/packages/:packageId
Update package details.

### DELETE /api/packages/:packageId
Deactivate a package.

### POST /api/bookings/package
Book a package.

**Request Body:**
```json
{
  "packageId": "uuid",
  "salonId": "uuid",
  "date": "2025-12-20",
  "time": "10:00",
  "staffId": "uuid",
  "notes": "Bride arriving at 9:30 AM for prep"
}
```

### GET /api/salons/:salonId/packages/analytics
Package performance analytics (salon owner).

**Response:**
```json
{
  "summary": {
    "totalPackageRevenue": 5000000,
    "totalPackageBookings": 45,
    "averagePackageValue": 111111,
    "topPackage": { "name": "Bridal Glow", "bookings": 20 }
  },
  "byPackage": [
    {
      "id": "uuid",
      "name": "Bridal Glow",
      "bookings": 20,
      "revenue": 1600000,
      "conversionRate": 15.2
    }
  ],
  "savingsProvided": 200000
}
```

---

## Business Rules

### Package Creation Rules
1. Minimum 2 services required per package
2. Package price must be less than sum of individual prices
3. Discount cannot exceed 50%
4. All services must belong to same salon
5. Deactivated services auto-deactivate from packages

### Booking Rules
1. Package must be booked as whole (no partial booking)
2. Single staff assignment for entire package (optional)
3. Services performed in sequence defined by `sequence_order`
4. Payment for full package at time of booking

### Availability Rules
- Check `valid_from` and `valid_until` dates
- Check if current day is in `available_days`
- Check if requested time is within `available_time_start` and `available_time_end`
- Check if `max_bookings_per_day` limit not reached
- Verify staff availability for full duration

### Price Updates
- Changing individual service prices doesn't auto-update package
- Salon must manually update package price
- Show warning when service prices change significantly

---

## Corner Cases

### Edge Case 1: Service Removed from Salon
**Scenario**: A service in a package is deactivated.
**Solution**: Mark package as inactive. Notify salon owner to update or remove package.

### Edge Case 2: Price Increase After Package Created
**Scenario**: Individual service price increases but package price stays same.
**Solution**: Allow. Package acts as locked-in discount. Show increased savings to customers.

### Edge Case 3: Service Duration Changed
**Scenario**: A service in package changes from 30 to 45 minutes.
**Solution**: Auto-update `total_duration_minutes`. Notify salon owner.

### Edge Case 4: Package Time Conflict
**Scenario**: 3-hour package booked, but staff has 30-min booking in middle.
**Solution**: Block package booking for that slot. Require contiguous availability.

### Edge Case 5: Partial Cancellation Request
**Scenario**: Customer wants to cancel one service from package.
**Solution**: Not allowed. Cancel entire package or reschedule. No cherry-picking.

### Edge Case 6: Staff Change Mid-Package
**Scenario**: Original staff sick on appointment day.
**Solution**: Salon can reassign entire package to different staff. Notify customer.

### Edge Case 7: Seasonal Package Expiry
**Scenario**: "Summer Special" package booked but salon forgot to extend validity.
**Solution**: Existing bookings honored. New bookings blocked. Auto-deactivate expired packages.

### Edge Case 8: Same Service Twice in Package
**Scenario**: "Mani-Pedi" package has Manicure and Pedicure (different services), but "Double Facial" has same facial twice.
**Solution**: Allow same service_id multiple times. Track quantity in junction table.

---

## Implementation Plan

### Phase 1: Schema Enhancement (2 days)
1. Add new columns to service_packages
2. Create package_bookings table
3. Update package_services if needed

### Phase 2: Package Management APIs (2 days)
1. CRUD endpoints for packages
2. Validation logic
3. Auto-calculate discount percentage

### Phase 3: Booking Integration (2 days)
1. Package booking endpoint
2. Availability checking for full duration
3. Create booking with linked services

### Phase 4: Web Integration (2 days)
1. Package listing on salon page
2. Package detail modal
3. Package booking flow
4. Salon package management

### Phase 5: Mobile Integration (2 days)
1. Package cards on salon screen
2. Package detail screen
3. Package booking flow

### Phase 6: Analytics & Reporting (1 day)
1. Package performance dashboard
2. Savings tracking
3. Popular packages report

---

## Mobile UI/UX

### Salon Page
- "Packages" tab alongside Services
- Package cards with savings badge
- "Most Popular" indicator

### Package Card
- Image banner
- Package name and brief description
- Services included (expandable)
- Duration and price with strikethrough regular price
- "Save ₹X" badge in green
- "Book Package" CTA

### Package Detail Screen
- Full description
- All included services with individual prices
- Total value vs package price comparison
- Available days/times
- Staff who can perform
- Reviews specific to package
- "Book Now" button

### Booking Flow
- Date picker (filtered by available_days)
- Time picker (filtered by available_time_start/end)
- Staff selection (optional)
- Confirm with package breakdown
- Payment

---

## Web UI/UX

### Salon Page
- Packages section with horizontal scroll
- Featured packages highlighted
- Filter by category
- Hover shows quick details

### Package Management (Salon Owner)
- Create package wizard
- Service selector with drag-drop ordering
- Price calculator with suggested margins
- Availability configuration
- Preview before publish

### Analytics Dashboard
- Package revenue chart
- Comparison: package vs à la carte
- Customer savings provided
- Optimization suggestions

---

## Package Templates

Pre-defined templates salons can customize:

### Bridal Package Template
- Bridal Makeup
- Hair Styling
- Facial
- Manicure
- Pedicure
- Suggested discount: 20%

### Spa Day Template
- Full Body Massage
- Facial
- Head Massage
- Pedicure
- Suggested discount: 15%

### Men's Grooming Template
- Haircut
- Beard Trim
- Facial
- Suggested discount: 10%

---

## Implementation Status

### Backend Implementation ✅ COMPLETE

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema - servicePackages table | ✅ Done | 13 columns including category, imageUrl, availability settings, gender, featured |
| Database Schema - packageServices table | ✅ Done | Includes `quantity` field for same-service-twice scenario |
| Database Schema - packageBookings table | ✅ Done | Tracks package booking with price snapshot |
| Zod Validation Schemas | ✅ Done | Supports both `serviceIds[]` and `services: [{serviceId, quantity}]` formats |
| ServiceBundleService | ✅ Done | Full CRUD, availability checking, analytics, quantity normalization |
| Web API Routes (/api/service-bundles/) | ✅ Done | All CRUD + analytics endpoints with RBAC |
| Mobile API Routes (/api/mobile/service-bundles/) | ✅ Done | GET packages, package details, availability |

### Web Frontend Implementation ✅ COMPLETE

| Component | Status | Notes |
|-----------|--------|-------|
| ServicePackageCard (Customer) | ✅ Done | Displays packages with quantity badges (e.g., "Hair Wash ×2") |
| ServicePackageDetailModal (Customer) | ✅ Done | Full details with quantity display, duration/price multiplied by quantity |
| PackageCreator (Salon Owner) | ✅ Done | Service selection with quantity increment/decrement controls |
| PackageManager (Salon Owner) | ✅ Done | List packages with quantity badges, toggle active, delete |
| PackageAnalytics (Salon Owner) | ✅ Done | Revenue, bookings, conversion metrics |

### Mobile Frontend Implementation ❌ NOT STARTED

| Component | Status | Notes |
|-----------|--------|-------|
| Packages tab in SalonDetailScreen | ❌ Pending | Need to add tab alongside Services, Team, etc. |
| ServicePackageCard (Mobile) | ❌ Pending | React Native version with quantity display |
| Package Detail Screen | ❌ Pending | Full package details with booking CTA |
| Package Booking Flow Integration | ❌ Pending | Date/time selection, payment |

### Key Features Implemented

| Feature | Status | Description |
|---------|--------|-------------|
| Quantity-per-service support | ✅ Done | Same service can be added multiple times (e.g., "2x Hair Wash") |
| Minimum 2 service instances | ✅ Done | Validation requires at least 2 total service instances |
| Max 50% discount rule | ✅ Done | Backend enforces discount cap |
| Price < regular price rule | ✅ Done | Package price must be less than sum of services |
| Time-based availability | ✅ Done | validFrom, validUntil, availableDays, time windows |
| Category filtering | ✅ Done | bridal, spa_day, grooming, seasonal, combo, party, wellness |
| Gender filtering | ✅ Done | male, female, unisex |
| Featured packages | ✅ Done | isFeatured flag with sorting |
| Backward compatibility | ✅ Done | Supports legacy `serviceIds[]` array format |

---

## Testing Checklist

- [x] Package created with correct service links
- [x] Discount percentage calculated correctly
- [x] Package price validation (< regular price)
- [x] Availability filters work correctly
- [x] Max bookings per day enforced
- [ ] Booking creates all linked services
- [ ] Contiguous time slot verified
- [ ] Inactive service deactivates package
- [ ] Package booking payment works
- [x] Analytics aggregate correctly
- [ ] Seasonal packages auto-expire
- [x] Same service multiple times in package works
- [ ] Staff availability checked for full duration
- [ ] Mobile UI displays packages with quantities
- [ ] Mobile booking flow works end-to-end
