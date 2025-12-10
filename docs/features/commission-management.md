# Commission Management System

## Overview
The Commission Management System allows salon owners to configure, track, and pay staff commissions based on services and product sales. Commissions are automatically calculated when job cards are completed. The system includes tips integration, permanent payout records, manual adjustments, and comprehensive reporting with export capabilities.

## User Roles & Access

| Role | Permissions |
|------|-------------|
| Business Owner | Full access - all features including manual adjustments, rate configuration, payouts, exports |
| Shop Admin | View reports, process payouts (if permitted), view commission history |
| Staff | View own commission history, tips, and payout statements only |

---

## Feature 1: Commission Rate Configuration (Services)

### 1.1 Salon Default Rate
The fallback commission rate applied when no specific rate is configured.

**Fields:**
- Rate Type: `percentage` | `fixed_amount`
- Rate Value: Number (percentage or rupee amount)
- Minimum Cap (optional): Minimum earning per service in paisa
- Maximum Cap (optional): Maximum earning per service in paisa
- Active Status: Boolean
- Effective From: Date when rate becomes active
- Effective To: Date when rate expires (optional)

**Business Rules:**
- Only one default rate can be active at a time
- Default rate is used when no staff-specific or service-specific rate exists
- System fallback is 10% if no default is configured

### 1.2 Staff Default Rates
Commission rate for a specific staff member across all services.

**Fields:**
- Staff ID: Reference to staff member
- Rate Type: `percentage` | `fixed_amount`
- Rate Value: Number
- Min/Max Caps (optional)
- Active Status
- Effective Dates

**Business Rules:**
- One default rate per staff member
- Overrides salon default rate
- Can be overridden by service-specific rates

### 1.3 Staff + Service Specific Rates
Commission rate for a specific staff member doing a specific service.

**Fields:**
- Staff ID: Reference to staff member
- Service ID: Reference to service
- Rate Type: `percentage` | `fixed_amount`
- Rate Value: Number
- Min/Max Caps (optional)
- Active Status
- Effective Dates

**Business Rules:**
- Highest priority in rate hierarchy
- Multiple entries allowed (different staff + service combinations)

### Rate Lookup Hierarchy (Services)
```
1. Staff + Service specific rate (if exists and active)
   ↓ (not found)
2. Staff default rate (if exists and active)
   ↓ (not found)
3. Salon default rate (if exists and active)
   ↓ (not found)
4. System default: 10%
```

---

## Feature 2: Commission Rate Configuration (Products) - NEW

### 2.1 Product Commission Structure
Similar to services, product sales can have commission rates configured.

**Rate Hierarchy (Products):**
```
1. Staff + Product specific rate (if exists and active)
   ↓ (not found)
2. Staff default product rate (if exists and active)
   ↓ (not found)
3. Salon default product rate (if exists and active)
   ↓ (not found)
4. No commission (products default to 0% unless configured)
```

**Fields:**
- Staff ID (optional): Reference to staff member
- Product ID (optional): Reference to product
- Rate Type: `percentage` | `fixed_amount`
- Rate Value: Number
- Min/Max Caps (optional)
- Active Status
- Effective Dates

**Business Rules:**
- Product commissions are opt-in (default is 0%)
- Product commissions calculated when job card products are sold
- Tracks which staff member made the sale

### 2.2 Configuration Options
- Enable/disable product commissions per salon
- Set default product commission rate
- Override per staff or per product

---

## Feature 3: Commission Calculation

### When Commissions Are Calculated
- Triggered automatically when a Job Card status changes to `completed`
- Service commissions: Only for services with status `completed` (not cancelled)
- Product commissions: For all products on the job card marked as sold
- Each item is calculated independently

### Calculation Formula

**Percentage Rate:**
```
Commission = Item Final Price × (Rate Value / 100)
```

**Fixed Amount Rate:**
```
Commission = Rate Value (in paisa)
```

**With Min/Max Caps:**
```
if (commission < minAmount) commission = minAmount
if (commission > maxAmount) commission = maxAmount
```

### Data Recorded Per Commission
- Salon ID
- Staff ID
- Service ID or Product ID
- Job Card ID (for tracking)
- Booking ID (if from booking)
- Rate ID (which rate was applied)
- Source Type: `service` | `product`
- Base Amount (item price)
- Commission Amount
- Commission Rate (applied percentage)
- Service Date
- Period Year/Month (for reporting)
- Payment Status: `pending` | `paid` | `cancelled` | `reversed`

---

## Feature 4: Tips Integration - NEW

### 4.1 Tips in Commission Views
Tips from job cards are displayed alongside service commissions in all views.

**Display Logic:**
- Tips are tracked separately in `job_card_tips` table
- Staff commission summary shows: Service Commissions + Product Commissions + Tips = Total Earnings
- Tips are NOT included in commission calculations but are part of payout totals

### 4.2 Tips Summary
| Column | Description |
|--------|-------------|
| Staff Name | Staff member who received the tip |
| Tips Count | Number of tips received in period |
| Tips Total | Sum of all tips in paisa |

### 4.3 Combined Earnings View
Staff see their complete earnings breakdown:
- Service Commissions: ₹X,XXX
- Product Commissions: ₹XXX
- Tips Received: ₹XXX
- Manual Adjustments: ±₹XXX
- **Total Earnings**: ₹X,XXX

---

## Feature 5: Commission Dashboard (Enhanced)

### 5.1 Summary Cards
Display key metrics at the top:

| Metric | Description |
|--------|-------------|
| Total Earnings This Month | Service + Product Commissions + Tips |
| Pending Payouts | Unpaid commissions + unpaid tips |
| Paid This Month | Total paid out this month |
| Average Per Staff | Total earnings / number of active staff |
| Adjustments This Month | Net manual bonuses/deductions |

### 5.2 Trend Charts - NEW
Visual analytics for commission trends:

**Monthly Trend Chart:**
- Line/bar chart showing commission totals by month
- Separate lines for: Services, Products, Tips
- 6-month or 12-month view

**Staff Performance Chart:**
- Bar chart comparing staff earnings
- Stacked bars showing commission types

### 5.3 Staff Commission Table (Enhanced)
Tabular view of commission summary per staff member.

**Columns:**
- Staff Name
- Photo/Avatar
- Services Completed (count)
- Products Sold (count)
- Service Commissions
- Product Commissions
- Tips Received
- Adjustments (±)
- Total Earned
- Pending Amount
- Paid Amount
- Actions (Mark Paid, View Details, Statement)

**Filters:**
- Date Range: This Week | This Month | Last Month | Custom Range
- Staff Member: All | Specific staff
- Payment Status: All | Pending | Paid
- Commission Type: All | Services | Products | Tips

**Sorting:**
- By total earned (default, descending)
- By staff name
- By services completed
- By pending amount

---

## Feature 6: Payout Management (Enhanced)

### 6.1 Permanent Payout Records - NEW
Each payout creates a permanent record in `staff_payouts` table.

**Payout Record Fields:**
- Payout ID (UUID)
- Salon ID
- Staff ID
- Payout Amount (paisa)
- Commission Amount Included
- Tips Amount Included
- Adjustments Amount Included
- Payment Method: `cash` | `bank_transfer` | `upi` | `cheque` | `other`
- Payment Reference (transaction ID)
- Payment Date
- Period Start Date
- Period End Date
- Status: `pending` | `completed` | `failed` | `cancelled`
- Processed By (user who processed)
- Notes
- Created At

### 6.2 Payout Processing Flow
1. Select staff member(s) for payout
2. System calculates: Pending Commissions + Pending Tips + Net Adjustments
3. Choose payment method and enter reference
4. Confirm payout
5. System creates payout record and marks included items as paid

### 6.3 Payout History
Complete audit trail of all payouts.

**Columns:**
- Payout ID
- Date
- Staff Name
- Period Covered
- Commission Amount
- Tips Amount
- Adjustments
- Total Paid
- Payment Method
- Reference
- Processed By
- Status

**Actions:**
- View Details
- Download Statement
- Cancel (if status = pending)

### 6.4 Staff Payout Statements - NEW
Downloadable statement for each payout showing:
- Payout Period
- Staff Details
- Itemized list of commissions
- Itemized list of tips
- Itemized list of adjustments
- Summary totals
- Payment details

---

## Feature 7: Manual Adjustments - NEW

### 7.1 Adjustment Types
**Bonuses:**
- Performance bonus
- Festival bonus
- Referral bonus
- Custom bonus

**Deductions:**
- Salary advance recovery
- Damage recovery
- Uniform deduction
- Custom deduction

### 7.2 Adjustment Record Fields
- Adjustment ID (UUID)
- Salon ID
- Staff ID
- Type: `bonus` | `deduction`
- Category: predefined or custom
- Amount (paisa)
- Reason (text description)
- Effective Date
- Status: `pending` | `applied` | `cancelled`
- Created By (user)
- Approved By (user, if approval required)
- Created At

### 7.3 Access Control
**Owner Only:**
- Create adjustments
- Edit adjustments
- Cancel adjustments
- View all adjustments

**Shop Admin:**
- View adjustments (if permitted)

**Staff:**
- View own adjustments only

### 7.4 Business Rules
- Adjustments with `pending` status are included in payout calculations
- When payout is processed, linked adjustments are marked as `applied`
- Cancelled adjustments are excluded from calculations
- Adjustments can be linked to specific pay periods

---

## Feature 8: Commission Reversals - NEW

### 8.1 When Reversals Are Triggered
Automatic reversal occurs when:
1. **Job Card Cancelled**: All commissions for that job card are reversed
2. **Service Cancelled/Refunded**: Commission for specific service is reversed
3. **Product Returned/Refunded**: Commission for specific product is reversed
4. **Full Refund**: All commissions for the job card are reversed

### 8.2 Reversal Record Fields
- Original Commission ID
- Reversal Commission ID (negative entry)
- Reversal Reason: `job_card_cancelled` | `service_refunded` | `product_returned` | `manual_reversal`
- Reversed By (user or system)
- Reversed At

### 8.3 Corner Cases Handling

**Case 1: Reversal before payout**
- Commission status changed to `reversed`
- Removed from pending payout calculation
- No impact on paid amounts

**Case 2: Reversal after payout (already paid)**
- Create negative adjustment entry
- Deduct from next payout
- Track as "reversal recovery"
- Staff payout history shows reversal

**Case 3: Partial refund**
- Calculate proportional reversal
- Only reverse commission for refunded portion
- Keep commission for non-refunded services

**Case 4: Staff no longer active**
- Still record the reversal
- Track as outstanding balance
- Flag for owner review

**Case 5: Rate changed since original**
- Use original commission amount for reversal
- Don't recalculate with new rate

### 8.4 Audit Trail
All reversals logged with:
- Reason
- Amount reversed
- Who initiated (system or user)
- Timestamp
- Related job card/service/product

---

## Feature 9: Export Functionality - NEW

### 9.1 Export Formats
- **PDF**: Formatted statements and reports
- **Excel (.xlsx)**: Data tables for accounting

### 9.2 Available Exports

**Commission Report:**
- Date range filter
- Staff filter
- Includes all commission records
- Summary totals
- Columns: Date, Staff, Service/Product, Amount, Rate, Commission, Status

**Payout Statement (Per Staff):**
- Single staff member
- Single payout or date range
- Itemized breakdown
- Professional layout for staff records

**Payout Summary (All Staff):**
- Date range
- Summary per staff
- Grand totals
- For accounting/audit

**Adjustment Report:**
- Date range
- Type filter (bonus/deduction)
- Staff filter
- Approval status

### 9.3 Export Access
- Owner: All exports
- Shop Admin: Commission reports (if permitted)
- Staff: Own statements only

---

## Feature 10: Enhanced Analytics & Reporting - NEW

### 10.1 Advanced Filtering
**Available Filters:**
- Date Range: Presets + Custom
- Staff Member: Multi-select
- Payment Status: Pending, Paid, Reversed
- Commission Type: Service, Product
- Service Category
- Product Category
- Amount Range: Min/Max

### 10.2 Trend Analysis
**Commission Trends:**
- Monthly comparison chart
- Year-over-year comparison
- Staff performance ranking
- Service/Product performance

**Payout Trends:**
- Total payouts by month
- Average payout per staff
- Payment method distribution

### 10.3 Staff Commission Statements
Individual staff view showing:
- Current period earnings
- Historical earnings (last 6 months)
- Pending vs paid breakdown
- Upcoming payout estimate
- Personal trend chart

---

## New Database Tables

### Table: staff_payouts
```sql
CREATE TABLE staff_payouts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  staff_id VARCHAR NOT NULL REFERENCES staff(id),
  
  -- Amounts
  total_amount_paisa INTEGER NOT NULL,
  commission_amount_paisa INTEGER NOT NULL DEFAULT 0,
  tips_amount_paisa INTEGER NOT NULL DEFAULT 0,
  adjustments_amount_paisa INTEGER NOT NULL DEFAULT 0,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Payment Details
  payment_method VARCHAR(30) NOT NULL,
  payment_reference VARCHAR(100),
  payment_date TIMESTAMP NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  
  -- Audit
  processed_by VARCHAR REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_payout_salon ON (salon_id),
  INDEX idx_payout_staff ON (staff_id),
  INDEX idx_payout_date ON (payment_date),
  INDEX idx_payout_period ON (period_start, period_end)
);
```

### Table: staff_adjustments
```sql
CREATE TABLE staff_adjustments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  staff_id VARCHAR NOT NULL REFERENCES staff(id),
  
  -- Adjustment Details
  adjustment_type VARCHAR(20) NOT NULL, -- 'bonus' or 'deduction'
  category VARCHAR(50) NOT NULL, -- 'performance_bonus', 'advance_recovery', etc.
  amount_paisa INTEGER NOT NULL,
  reason TEXT NOT NULL,
  
  -- Timing
  effective_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, applied, cancelled
  
  -- Linking
  payout_id VARCHAR REFERENCES staff_payouts(id), -- Linked when applied
  
  -- Audit
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_adj_salon ON (salon_id),
  INDEX idx_adj_staff ON (staff_id),
  INDEX idx_adj_status ON (status),
  INDEX idx_adj_date ON (effective_date)
);
```

### Table: commission_reversals
```sql
CREATE TABLE commission_reversals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  
  -- Original Commission
  original_commission_id VARCHAR NOT NULL REFERENCES commissions(id),
  
  -- Reversal Details
  reversal_amount_paisa INTEGER NOT NULL,
  reversal_reason VARCHAR(50) NOT NULL, -- 'job_card_cancelled', 'service_refunded', 'product_returned', 'manual'
  
  -- Recovery (if already paid)
  already_paid BOOLEAN NOT NULL DEFAULT FALSE,
  recovery_adjustment_id VARCHAR REFERENCES staff_adjustments(id),
  
  -- Audit
  reversed_by VARCHAR REFERENCES users(id), -- NULL if system-triggered
  reversed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  
  -- Indexes
  INDEX idx_rev_salon ON (salon_id),
  INDEX idx_rev_commission ON (original_commission_id)
);
```

### Extensions to Existing Tables

**commissions table - Add fields:**
```sql
ALTER TABLE commissions ADD COLUMN source_type VARCHAR(20) DEFAULT 'service'; -- 'service' or 'product'
ALTER TABLE commissions ADD COLUMN product_id VARCHAR REFERENCES products(id);
ALTER TABLE commissions ADD COLUMN job_card_id VARCHAR REFERENCES job_cards(id);
ALTER TABLE commissions ADD COLUMN is_reversed INTEGER DEFAULT 0;
ALTER TABLE commissions ADD COLUMN reversal_id VARCHAR REFERENCES commission_reversals(id);
ALTER TABLE commissions ADD COLUMN payout_id VARCHAR REFERENCES staff_payouts(id);
```

**commission_rates table - Add for products:**
```sql
ALTER TABLE commission_rates ADD COLUMN product_id VARCHAR REFERENCES products(id);
ALTER TABLE commission_rates ADD COLUMN applies_to VARCHAR(20) DEFAULT 'service'; -- 'service' or 'product'
```

---

## New API Endpoints

### Staff Payouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/payouts` | List all payout records |
| GET | `/api/salons/:salonId/payouts/:payoutId` | Get payout details |
| POST | `/api/salons/:salonId/payouts` | Create new payout |
| POST | `/api/salons/:salonId/payouts/:payoutId/cancel` | Cancel pending payout |
| GET | `/api/salons/:salonId/payouts/staff/:staffId` | Get staff payout history |

### Staff Adjustments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/adjustments` | List all adjustments |
| GET | `/api/salons/:salonId/adjustments/:adjustmentId` | Get adjustment details |
| POST | `/api/salons/:salonId/adjustments` | Create adjustment (Owner only) |
| PUT | `/api/salons/:salonId/adjustments/:adjustmentId` | Update adjustment (Owner only) |
| POST | `/api/salons/:salonId/adjustments/:adjustmentId/cancel` | Cancel adjustment (Owner only) |

### Commission Reversals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/commissions/reversals` | List reversals |
| POST | `/api/salons/:salonId/commissions/:commissionId/reverse` | Manual reversal (Owner only) |

### Product Commissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/commission-rates/products` | List product commission rates |
| POST | `/api/salons/:salonId/commission-rates/products` | Create product rate |
| PUT | `/api/salons/:salonId/commission-rates/products/:rateId` | Update product rate |

### Tips Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/tips/summary` | Get tips summary by staff |
| GET | `/api/salons/:salonId/staff/:staffId/earnings` | Get combined earnings |

### Exports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/commissions/export` | Export commissions (PDF/Excel) |
| GET | `/api/salons/:salonId/payouts/:payoutId/statement` | Download payout statement (PDF) |
| GET | `/api/salons/:salonId/payouts/export` | Export payout summary (Excel) |
| GET | `/api/salons/:salonId/adjustments/export` | Export adjustments (Excel) |

---

## UI Components

### New Page: Commission & Payout Management
Location: Business Dashboard → Staff & Payroll → Commissions & Payouts

**Tabs:**
1. **Overview** - Summary cards, trend charts, quick stats
2. **Commissions** - Detailed commission table with filters
3. **Payouts** - Process payouts, payout history
4. **Rate Config** - Service and product rate configuration
5. **Adjustments** - Manual bonuses/deductions (Owner only)
6. **Reports** - Advanced filtering and exports

### Components Structure
```
CommissionPayoutPage/
├── Overview/
│   ├── SummaryCards.tsx
│   ├── EarningsTrendChart.tsx
│   ├── StaffPerformanceChart.tsx
│   └── QuickStatsPanel.tsx
├── Commissions/
│   ├── CommissionTable.tsx
│   ├── CommissionFilters.tsx
│   └── CommissionDetailModal.tsx
├── Payouts/
│   ├── PayoutProcessingPanel.tsx
│   ├── PayoutHistoryTable.tsx
│   ├── PayoutDetailModal.tsx
│   └── StaffPayoutStatement.tsx
├── RateConfig/
│   ├── ServiceRatesPanel.tsx
│   ├── ProductRatesPanel.tsx
│   ├── RateFormDialog.tsx
│   └── RateHierarchyVisualizer.tsx
├── Adjustments/
│   ├── AdjustmentTable.tsx
│   ├── AdjustmentFormDialog.tsx
│   └── AdjustmentCategories.tsx
└── Reports/
    ├── AdvancedFilters.tsx
    ├── ExportPanel.tsx
    └── StaffStatementGenerator.tsx
```

---

## Implementation Status

> **Last Updated:** December 8, 2025
> **Status:** ✅ All 10 Features Implemented

---

## Implementation Priority

### Phase 1: Database & Core Backend (Tasks 2-6) ✅ COMPLETED
1. ✅ Add new database tables (staff_payouts, staff_adjustments, commission_reversals)
2. ✅ Create payout record routes (GET/POST with history)
3. ✅ Create adjustment routes (Owner only - requireBusinessOwner middleware)
4. ✅ Add product commission rates (extends commission_rates with appliesTo field)
5. ✅ Implement commission reversal logic (with corner case handling)

### Phase 2: Export & Integration (Task 7) ✅ COMPLETED
1. ✅ PDF export with PDFKit (professional statements)
2. ✅ Excel export with ExcelJS (summary and detailed sheets)
3. ✅ Payout statement generation (per-staff itemized breakdown)

### Phase 3: Frontend - New Page (Tasks 8-13) ✅ COMPLETED
1. ✅ Create new Commission & Payout page (CommissionManagement.tsx)
2. ✅ Build Overview tab with summary cards and staff earnings table
3. ✅ Build Payouts tab with history and processing
4. ✅ Build Rates tab (service + product configuration)
5. ✅ Build Adjustments tab (Owner-only bonuses/deductions)
6. ✅ Build Reports tab with export downloads

### Phase 4: Product Commissions & Testing (Tasks 14-15) ✅ COMPLETED
1. ✅ Add product commission to job card completion flow
2. ✅ Middleware security fixes (requireSalonAccess() invocation)
3. ✅ End-to-end testing and verification

---

## Files Implemented

| File | Description |
|------|-------------|
| `server/routes/commission-payout.routes.ts` | All 15 API endpoints for commission/payout management |
| `client/src/components/business-dashboard/CommissionManagement.tsx` | Frontend component with 5 tabs |
| `shared/schema.ts` | Database tables: staffPayouts, staffAdjustments, commissionReversals |
| `server/routes/job-cards.routes.ts` | Product commission calculation on job card completion |

---

## Corner Cases Checklist

### Rate Configuration
- [x] Duplicate staff+service or staff+product combinations - Handled with unique constraint logic
- [x] Rate effective dates overlap - Lookup uses most specific active rate
- [x] Deactivating a rate with pending calculations - Uses fallback hierarchy
- [x] Changing rate type (% to fixed) mid-period - New rate takes effect from change date

### Commission Calculation
- [x] Service with no assigned staff - Skips commission creation (logged)
- [x] Product sale with no sales staff specified - Uses job card assignee or skips
- [x] Rate changed between job creation and completion - Uses rate at completion time
- [x] Multiple services by different staff on same job card - Each staff gets their own commission

### Payouts
- [x] Payout amount = 0 (all commissions already paid) - Validation prevents empty payout
- [x] Negative payout (more deductions than earnings) - Allowed, creates negative balance
- [x] Staff with only tips (no commissions) - Tips included in payout totals
- [x] Payout while there are pending reversals - Reversals processed before payout

### Reversals
- [x] Reversing already reversed commission - Check isReversed flag, prevent double reversal
- [x] Partial refund calculation - Proportional reversal based on refund amount
- [x] Reversal after staff deactivated - Still recorded, flagged for owner review
- [x] Reversal of commission from closed period - Creates recovery adjustment for next payout

### Adjustments
- [x] Deduction larger than pending earnings - Allowed, carries to next period
- [x] Adjustment effective date in past/future - Supported with date filtering
- [x] Cancelling already applied adjustment - Not allowed (status check)
- [x] Multiple adjustments on same effective date - All included in calculations

### Exports
- [x] Large date range (performance) - Pagination and limit parameters
- [x] Empty data sets - Graceful handling with empty response
- [x] Special characters in staff names - Proper encoding in PDF/Excel
- [x] Currency formatting consistency - formatCurrency helper function (₹X,XXX.XX)
