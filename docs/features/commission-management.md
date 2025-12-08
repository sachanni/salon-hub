# Commission Management System

## Overview
The Commission Management System allows salon owners to configure, track, and pay staff commissions based on services performed. Commissions are automatically calculated when job cards are completed.

## User Roles & Access

| Role | Permissions |
|------|-------------|
| Business Owner | Full access - create, edit, delete rates, view all reports, process payouts |
| Shop Admin | View reports, process payouts (if permitted) |
| Staff | View own commission history only |

---

## Feature 1: Commission Rate Configuration

### 1.1 Salon Default Rate
The fallback commission rate applied when no specific rate is configured.

**Fields:**
- Rate Type: `percentage` | `fixed_amount`
- Rate Value: Number (percentage or rupee amount)
- Minimum Cap (optional): Minimum earning per service in paisa
- Maximum Cap (optional): Maximum earning per service in paisa
- Active Status: Boolean

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

**Business Rules:**
- Highest priority in rate hierarchy
- Multiple entries allowed (different staff + service combinations)

### Rate Lookup Hierarchy
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

## Feature 2: Commission Calculation

### When Commissions Are Calculated
- Triggered automatically when a Job Card status changes to `completed`
- Only calculates for services with status `completed` (not cancelled)
- Each service is calculated independently

### Calculation Formula

**Percentage Rate:**
```
Commission = Service Final Price × (Rate Value / 100)
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
- Service ID
- Booking ID (if from booking)
- Rate ID (which rate was applied)
- Base Amount (service price)
- Commission Amount
- Commission Rate (applied percentage)
- Service Date
- Period Year/Month (for reporting)
- Payment Status: `pending` | `paid` | `cancelled`

---

## Feature 3: Commission Dashboard

### 3.1 Summary Cards
Display key metrics at the top:

| Metric | Description |
|--------|-------------|
| Total This Month | Sum of all commissions for current month |
| Pending Payouts | Sum of unpaid commissions |
| Paid This Month | Sum of paid commissions this month |
| Average Per Staff | Total commissions / number of active staff |

### 3.2 Staff Commission Table
Tabular view of commission summary per staff member.

**Columns:**
- Staff Name
- Photo/Avatar
- Services Completed (count)
- Total Service Value
- Commission Earned
- Pending Amount
- Paid Amount
- Actions (Mark Paid, View Details)

**Filters:**
- Date Range: This Week | This Month | Last Month | Custom
- Staff Member: All | Specific staff
- Payment Status: All | Pending | Paid

**Sorting:**
- By commission earned (default, descending)
- By staff name
- By services completed

### 3.3 Detailed Transaction Log
Drill-down view showing individual commission records.

**Columns:**
- Date
- Staff Name
- Service Name
- Customer Name
- Service Amount
- Commission Rate
- Commission Amount
- Payment Status
- Paid Date (if paid)

**Export Options:**
- Excel (.xlsx)
- PDF

---

## Feature 4: Payout Management

### 4.1 Individual Payout
Mark a single staff member's pending commissions as paid.

**Fields:**
- Payment Method: Cash | Bank Transfer | UPI | Other
- Payment Reference (optional): Transaction ID or reference number
- Notes (optional)

**Actions:**
- Marks all pending commissions for that staff as `paid`
- Records payment date, method, and who processed it

### 4.2 Bulk Payout
Mark multiple staff members' commissions as paid at once.

**Process:**
1. Select staff members (checkbox)
2. Click "Mark as Paid"
3. Enter payment details
4. Confirm

### 4.3 Payout History
View past payouts with filters.

**Columns:**
- Payout Date
- Staff Name
- Amount Paid
- Payment Method
- Processed By
- Notes

---

## Feature 5: Rate Management UI

### 5.1 Rate Configuration Panel
Interface for managing all commission rates.

**Sections:**
1. **Salon Default** - Card showing current default rate with edit button
2. **Staff Rates** - Table of staff-specific rates
3. **Service-Specific Rates** - Table of staff+service combinations

### 5.2 Add/Edit Rate Dialog
Modal form for creating or editing rates.

**Fields:**
- Staff (dropdown, optional for salon default)
- Service (dropdown, optional for staff default)
- Rate Type (radio: Percentage | Fixed Amount)
- Rate Value (number input)
- Minimum Cap (optional number)
- Maximum Cap (optional number)
- Active (toggle)

**Validation:**
- Rate value must be positive
- Percentage must be ≤ 100
- Max cap must be ≥ min cap if both set
- Cannot have duplicate staff+service combinations

---

## UI Components

### Page: Commission Management
Location: Business Dashboard → Setup & Management → Commissions

**Tabs:**
1. **Dashboard** - Summary and staff commission table
2. **Rate Configuration** - Manage commission rates
3. **Payout History** - View past payouts

### Components to Build
1. `CommissionDashboard.tsx` - Main container with tabs
2. `CommissionSummaryCards.tsx` - Metric cards
3. `StaffCommissionTable.tsx` - Staff-wise commission summary
4. `CommissionTransactionLog.tsx` - Detailed transaction list
5. `RateConfigurationPanel.tsx` - Rate management UI
6. `RateFormDialog.tsx` - Add/Edit rate modal
7. `PayoutDialog.tsx` - Process payout modal
8. `CommissionExport.tsx` - Export functionality

---

## API Endpoints

### Commission Rates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/commission-rates` | List all rates |
| POST | `/api/salons/:salonId/commission-rates` | Create rate |
| PUT | `/api/salons/:salonId/commission-rates/:rateId` | Update rate |
| POST | `/api/salons/:salonId/commission-rates/:rateId/deactivate` | Deactivate rate |

### Commissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/commissions` | List commissions with filters |
| GET | `/api/salons/:salonId/commissions/summary` | Get summary metrics |
| GET | `/api/salons/:salonId/commissions/by-staff` | Get staff-wise summary |
| POST | `/api/salons/:salonId/commissions/payout` | Process payout |
| GET | `/api/salons/:salonId/commissions/export` | Export to Excel/PDF |

---

## Database Tables

### Existing Tables Used
- `commission_rates` - Rate configurations
- `commissions` - Individual commission records

### No New Tables Required
The existing schema supports all features.

---

## Implementation Priority

### Phase 1: Core UI (MVP)
1. Commission Dashboard with summary cards
2. Staff commission table with basic filters
3. Rate configuration panel
4. Add/Edit rate dialog

### Phase 2: Payouts
1. Individual payout processing
2. Bulk payout feature
3. Payout history

### Phase 3: Advanced
1. Export functionality (Excel/PDF)
2. Detailed transaction log
3. Advanced filtering and date ranges
