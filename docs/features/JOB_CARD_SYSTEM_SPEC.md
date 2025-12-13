# **SalonHub Job Card System - Technical Specification Document**

**Version:** 1.0  
**Date:** December 7, 2025  
**Status:** ✅ COMPLETED  
**Author:** SalonHub Development Team

---

## Implementation Checklist

### Database Schema
- [x] `job_cards` - Master job card table with all fields
- [x] `job_card_services` - Services on job card with commission tracking
- [x] `job_card_products` - Products sold on job card
- [x] `job_card_payments` - Split payment records
- [x] `job_card_tips` - Staff tip tracking
- [x] `job_card_activity_log` - Activity audit trail

### Check-in Management
- [x] Manual Check-in - Staff checks in customer from booking list
- [x] QR Self Check-in - Customer scans salon QR at `/checkin/:salonId`
- [x] Walk-in Check-in - Quick form to create booking + job card instantly
- [ ] Auto Check-in - Booking auto-converts to job card at appointment time (P2 - Not implemented)
- [x] Booking Verification - Match customer by phone/email/booking ID

### Job Card Operations
- [x] Create Job Card - Auto-create from check-in with booking services
- [x] Add Services - Add extra services during visit
- [x] Remove Services - Remove services before payment
- [x] Add Products - Sell retail products
- [x] Staff Assignment - Assign/change staff per service
- [x] Service Timing - Track start/end times per service
- [x] Notes - Internal and customer-facing notes

### Billing & Discounts
- [x] Auto Bill Calculation - Sum services + products - discounts + tax
- [x] Percentage Discount - Apply % discount on subtotal
- [x] Fixed Discount - Apply fixed amount discount
- [x] Service-Level Discount - Discount on individual services
- [x] Tax Calculation - GST 5% for services, 18% for products
- [x] Bill Preview - Show breakdown before payment

### Payment Processing
- [x] Single Payment - Pay full amount via one method
- [x] Split Payment - Pay via multiple methods (e.g., Cash + UPI)
- [x] Payment Methods - Cash, Card, UPI, Wallet supported
- [x] Partial Payment - Allow partial payment with balance tracking
- [x] Tip Collection - Collect tips for staff separately
- [ ] Refund Processing - Process refunds with reason tracking (P2 - Not implemented)

### Checkout & Receipt
- [x] Complete Checkout - Mark job card as completed after full payment
- [x] Receipt Generation - Generate digital receipt with receipt number
- [ ] Print Receipt - Thermal/A4 print support (P1 - Not implemented)
- [x] Email Receipt - Send receipt to customer email (via feedback email)
- [ ] SMS Receipt - Send receipt link via SMS (P2 - Not implemented)

### Commission & Follow-up
- [x] Auto Commission - Calculate staff commission on close
- [x] Commission per Service - Use configured rates per staff/service
- [x] Hierarchical Rate Lookup - staff+service → staff default → salon default → 10%
- [x] Min/Max Commission Caps - Apply min/max caps from rate config
- [x] Inventory Deduction - Deduct sold products from inventory (when trackStock enabled)
- [x] Feedback Request - Trigger feedback notification after close
- [ ] Rebooking Prompt - Suggest next appointment (P2 - Not implemented)

### Frontend Components
- [x] FrontDeskPanel - Active job cards, check-in console, checkout lane tabs
- [x] JobCardDrawer - Service management, products, notes, payment summary
- [x] WalkInDialog - Quick walk-in customer booking
- [x] CalendarManagement - Enhanced with Front Desk split-view
- [x] Status Badges - Confirmed → Arrived → In-Service → Checkout → Completed
- [x] QR Self Check-in Page - `/checkin/:salonId`

### API Endpoints (All Implemented)
- [x] `POST /api/job-cards/:salonId/check-in` - Create job card from booking or walk-in
- [x] `GET /api/job-cards/:salonId/job-cards` - List job cards with filters
- [x] `GET /api/job-cards/:salonId/job-cards/:jobCardId` - Get full job card details
- [x] `POST /api/job-cards/:salonId/job-cards/:jobCardId/services` - Add service
- [x] `DELETE /api/job-cards/:salonId/job-cards/:jobCardId/services/:id` - Remove service
- [x] `POST /api/job-cards/:salonId/job-cards/:jobCardId/products` - Add product
- [x] `POST /api/job-cards/:salonId/job-cards/:jobCardId/payments` - Process split payment
- [x] `POST /api/job-cards/:salonId/job-cards/:jobCardId/tips` - Add staff tip
- [x] `PUT /api/job-cards/:salonId/job-cards/:jobCardId/status` - Update status
- [x] `POST /api/job-cards/:salonId/job-cards/:jobCardId/complete` - Complete job card
- [x] `GET /api/job-cards/:salonId/job-cards/:jobCardId/bill` - Get itemized bill
- [x] `POST /api/job-cards/:salonId/job-cards/:jobCardId/discount` - Apply discount

### Security & Quality
- [x] All routes protected by `requireSalonAccess()` middleware
- [x] Activity logging for all job card changes
- [x] Payment re-validation before completing job card
- [x] Error handling for failed feedback emails

### Files Created/Modified
- `shared/schema.ts` - Database schema definitions
- `server/routes/job-cards.routes.ts` - ~1850 lines of API routes
- `client/src/components/FrontDeskPanel.tsx` - Front desk panel component
- `client/src/components/JobCardDrawer.tsx` - Job card drawer component
- `client/src/components/WalkInDialog.tsx` - Walk-in dialog component
- `client/src/pages/business/CalendarManagement.tsx` - Enhanced with split-view
- `client/src/pages/CheckInPage.tsx` - QR self check-in page

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Requirements](#2-business-requirements)
3. [System Architecture](#3-system-architecture)
4. [Database Schema Design](#4-database-schema-design)
5. [API Specification](#5-api-specification)
6. [User Interface Design](#6-user-interface-design)
7. [Edge Cases & Error Handling](#7-edge-cases--error-handling)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Executive Summary

### 1.1 Overview
The Job Card System is an industry-standard salon visit workflow management module that tracks the complete customer journey from check-in to checkout. It integrates seamlessly with the existing booking system while enabling real-time service tracking, add-on sales, split payments, and automated staff commission calculations.

### 1.2 Core Workflow
```
Booking Confirmed → Customer Check-in → Job Card Created → Service In-Progress 
→ Add-ons/Products → Pre-Checkout Review → Payment → Close & Receipt 
→ Staff Commission → Customer Feedback
```

### 1.3 Key Objectives
- **Unified Front Desk Operations** - Single interface for check-in, service management, and checkout
- **Real-time Service Tracking** - Live status updates on calendar and job cards
- **Flexible Billing** - Support for add-on services, product sales, discounts, and split payments
- **Automated Commissions** - Auto-calculate staff earnings on job card close
- **Multi-Channel Check-in** - Manual, QR code self-check-in, and auto from booking
- **Walk-in Support** - Instant booking + job card creation for walk-in customers

### 1.4 Integration Points
| System | Integration Type | Description |
|--------|-----------------|-------------|
| **Bookings** | Direct Link | Job cards created from confirmed bookings |
| **Calendar** | Real-time Status | Status badges reflect job card progress |
| **Services** | Reference | Services pulled from salon catalog with pricing |
| **Products** | Reference + Inventory | Products sold with inventory deduction |
| **Commissions** | Auto-Calculation | Staff commissions auto-created on close |
| **Payments** | Multi-Method | Cash, Card, UPI, Wallet, Razorpay |

---

## 2. Business Requirements

### 2.1 Functional Requirements

#### 2.1.1 Check-in Management
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Manual Check-in | Staff checks in customer from booking list | P0 |
| QR Self Check-in | Customer scans salon QR at `/checkin/:salonId` | P1 |
| Walk-in Check-in | Quick form to create booking + job card instantly | P0 |
| Auto Check-in | Booking auto-converts to job card at appointment time | P2 |
| Booking Verification | Match customer by phone/email/booking ID | P0 |

#### 2.1.2 Job Card Operations
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Create Job Card | Auto-create from check-in with booking services | P0 |
| Add Services | Add extra services during visit | P0 |
| Remove Services | Remove services before payment | P0 |
| Add Products | Sell retail products | P0 |
| Staff Assignment | Assign/change staff per service | P0 |
| Service Timing | Track start/end times per service | P1 |
| Notes | Internal and customer-facing notes | P1 |

#### 2.1.3 Billing & Discounts
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Auto Bill Calculation | Sum services + products - discounts + tax | P0 |
| Percentage Discount | Apply % discount on subtotal | P0 |
| Fixed Discount | Apply fixed amount discount | P0 |
| Service-Level Discount | Discount on individual services | P1 |
| Tax Calculation | GST 5% for services, 18% for products | P1 |
| Bill Preview | Show breakdown before payment | P0 |

#### 2.1.4 Payment Processing
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Single Payment | Pay full amount via one method | P0 |
| Split Payment | Pay via multiple methods (e.g., Cash + UPI) | P0 |
| Payment Methods | Cash, Card, UPI, Wallet, Razorpay, Bank Transfer | P0 |
| Partial Payment | Allow partial payment with balance tracking | P1 |
| Tip Collection | Collect tips for staff separately | P1 |
| Refund Processing | Process refunds with reason tracking | P2 |

#### 2.1.5 Checkout & Receipt
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Complete Checkout | Mark job card as completed after full payment | P0 |
| Receipt Generation | Generate digital receipt with QR | P0 |
| Print Receipt | Thermal/A4 print support | P1 |
| Email Receipt | Send receipt to customer email | P1 |
| SMS Receipt | Send receipt link via SMS | P2 |

#### 2.1.6 Commission & Follow-up
| Requirement | Description | Priority |
|-------------|-------------|----------|
| Auto Commission | Calculate staff commission on close | P0 |
| Commission per Service | Use configured rates per staff/service | P0 |
| Inventory Deduction | Deduct sold products from inventory | P1 |
| Feedback Request | Trigger feedback notification after close | P1 |
| Rebooking Prompt | Suggest next appointment | P2 |

### 2.2 Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Job card operations < 500ms response time |
| **Availability** | 99.5% uptime, works offline-first for critical ops |
| **Scalability** | Handle 100+ concurrent job cards per salon |
| **Security** | Role-based access (owner, manager, staff) |
| **Audit** | Full activity log for all job card changes |

---

## 3. System Architecture

### 3.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CALENDAR MANAGEMENT PAGE                        │
│  ┌──────────────────────────┬──────────────────────────────────────┐│
│  │                          │                                      ││
│  │   BOOKING CALENDAR       │        FRONT DESK PANEL              ││
│  │   (Existing)             │        (New Component)               ││
│  │                          │                                      ││
│  │   • Day/Week/Month View  │   ┌────────────────────────────────┐ ││
│  │   • Status Badges        │   │  TABS:                         │ ││
│  │     - Confirmed (Blue)   │   │  • Active Job Cards            │ ││
│  │     - Arrived (Yellow)   │   │  • Check-in Console            │ ││
│  │     - In-Service (Green) │   │  • Checkout Lane               │ ││
│  │     - Checkout (Orange)  │   └────────────────────────────────┘ ││
│  │     - Completed (Gray)   │                                      ││
│  │                          │   [Job Card Drawer Opens on Click]   ││
│  │   • Click → Open Drawer  │                                      ││
│  │                          │                                      ││
│  └──────────────────────────┴──────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Front Desk Panel Tabs

#### Tab 1: Active Job Cards
- List of all open/in-service job cards for today
- Quick status indicators (timer, staff, services)
- Click to open Job Card Drawer

#### Tab 2: Check-in Console
- List of confirmed bookings awaiting check-in
- "Check In" button per booking
- "Walk-in" button to create instant booking + job card
- Search by customer name/phone

#### Tab 3: Checkout Lane
- List of job cards pending checkout
- Bill summary preview
- Quick payment buttons

### 3.3 Job Card Drawer

```
┌─────────────────────────────────────────────────────────────────┐
│  JOB CARD #JC-20251207-001                    [X] Close        │
├─────────────────────────────────────────────────────────────────┤
│  Customer: John Doe                   Status: [IN SERVICE ▾]    │
│  Phone: +91 98765 43210              Assigned: Ravi Kumar       │
│  Check-in: 10:30 AM                  Duration: 45m / 60m est    │
├─────────────────────────────────────────────────────────────────┤
│  SERVICES                                          [+ Add]      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✓ Haircut (Men)           Ravi      ₹500    [In Progress] │  │
│  │ ○ Hair Wash               Ravi      ₹200    [Pending]     │  │
│  │ + Beard Trim (Add-on)     Ravi      ₹150    [Pending]     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  PRODUCTS                                          [+ Add]      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1x Hair Gel (100ml)       —         ₹250                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  NOTES                                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Customer prefers less oil. Previous visit: 2 weeks ago.  │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  BILLING SUMMARY                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Services (3)                              ₹850            │  │
│  │ Products (1)                              ₹250            │  │
│  │ Subtotal                                ₹1,100            │  │
│  │ Discount (10%)                           -₹110            │  │
│  │ Tax (GST 5%)                              ₹50            │  │
│  │ ─────────────────────────────────────────────            │  │
│  │ TOTAL                                   ₹1,040            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Apply Discount ]        [ Ready for Checkout ]              │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  PAYMENT (When in Checkout mode)                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Amount Due: ₹1,040                                        │  │
│  │                                                           │  │
│  │ [Cash] [Card] [UPI] [Wallet] [Razorpay]                  │  │
│  │                                                           │  │
│  │ ┌─────────────────────────────────────────────────────┐  │  │
│  │ │ Payment 1: Cash           ₹500      [Remove]        │  │  │
│  │ │ Payment 2: UPI            ₹540      [Remove]        │  │  │
│  │ └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │ Balance: ₹0.00                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Add Tip ]               [ Complete & Generate Receipt ]     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 QR Self Check-in Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER SELF CHECK-IN                        │
│                    (/checkin/:salonId)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    [SALON LOGO & NAME]                          │
│                                                                  │
│           Welcome! Please check in for your appointment         │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Phone Number: [+91 ___________]                          │  │
│  │                                                           │  │
│  │  OR                                                       │  │
│  │                                                           │  │
│  │  Booking ID: [__________]                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│                    [ CHECK IN ]                                 │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│                    Walk-in? No appointment?                     │
│                    [ Register as Walk-in ]                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Schema Design

### 4.1 Schema Overview

```
Job Card System Tables:
├── job_cards                 (Master record for each visit)
├── job_card_services        (Services performed)
├── job_card_products        (Products sold)
├── job_card_payments        (Payment records - split payment support)
├── job_card_tips            (Staff tips)
└── job_card_activity_log    (Audit trail)
```

### 4.2 Table: job_cards

| Column | Type | Description |
|--------|------|-------------|
| id | varchar(36) PK | UUID primary key |
| salon_id | varchar FK | Reference to salons |
| booking_id | varchar FK | Reference to bookings (null for walk-ins) |
| customer_id | varchar FK | Reference to users (null for guests) |
| job_card_number | varchar(30) | Sequential: JC-YYYYMMDD-NNN |
| customer_name | text | Customer name (snapshot) |
| customer_email | text | Customer email |
| customer_phone | text | Customer phone |
| check_in_method | varchar(20) | manual, qr_code, self_checkin, booking_auto |
| check_in_at | timestamp | Check-in timestamp |
| check_in_by | varchar FK | Staff who checked in customer |
| assigned_staff_id | varchar FK | Primary assigned staff |
| service_start_at | timestamp | When first service started |
| service_end_at | timestamp | When last service completed |
| estimated_duration_minutes | integer | Total estimated duration |
| actual_duration_minutes | integer | Actual time spent |
| status | varchar(20) | open, in_service, pending_checkout, completed, cancelled, no_show |
| subtotal_paisa | integer | Sum of services + products |
| discount_amount_paisa | integer | Discount applied |
| discount_type | varchar(20) | percentage, fixed |
| discount_value | decimal | Discount value (% or amount) |
| discount_reason | text | Reason for discount |
| tax_amount_paisa | integer | GST amount |
| tip_amount_paisa | integer | Total tips |
| total_amount_paisa | integer | Final amount |
| paid_amount_paisa | integer | Amount paid |
| balance_paisa | integer | Remaining balance |
| payment_status | varchar(20) | unpaid, partial, paid, refunded |
| checkout_at | timestamp | Checkout timestamp |
| checkout_by | varchar FK | Staff who completed checkout |
| receipt_number | varchar(50) | Receipt number |
| receipt_url | text | URL to digital receipt |
| internal_notes | text | Staff notes |
| customer_notes | text | Customer-visible notes |
| is_walk_in | integer | 0 or 1 |
| feedback_requested | integer | 0 or 1 |
| metadata | jsonb | Additional data |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last update |

### 4.3 Table: job_card_services

| Column | Type | Description |
|--------|------|-------------|
| id | varchar(36) PK | UUID primary key |
| job_card_id | varchar FK | Reference to job_cards |
| salon_id | varchar FK | Reference to salons |
| service_id | varchar FK | Reference to services |
| staff_id | varchar FK | Staff performing service |
| service_name | text | Service name (snapshot) |
| service_category | varchar(100) | Category (snapshot) |
| original_price_paisa | integer | Original price |
| discount_paisa | integer | Service-level discount |
| final_price_paisa | integer | Final price |
| estimated_duration_minutes | integer | Estimated duration |
| actual_duration_minutes | integer | Actual duration |
| status | varchar(20) | pending, in_progress, completed, cancelled |
| started_at | timestamp | When started |
| completed_at | timestamp | When completed |
| sequence | integer | Order of services |
| notes | text | Service notes |
| commission_calculated | integer | 0 or 1 |
| commission_id | varchar FK | Link to commissions table |
| source | varchar(20) | booking, addon, walk_in |
| created_at | timestamp | Record creation |

### 4.4 Table: job_card_products

| Column | Type | Description |
|--------|------|-------------|
| id | varchar(36) PK | UUID primary key |
| job_card_id | varchar FK | Reference to job_cards |
| salon_id | varchar FK | Reference to salons |
| product_id | varchar FK | Reference to products |
| staff_id | varchar FK | Staff who sold product |
| product_name | text | Product name (snapshot) |
| product_sku | varchar(100) | SKU (snapshot) |
| product_category | varchar(100) | Category (snapshot) |
| quantity | integer | Quantity sold |
| unit_price_paisa | integer | Unit price |
| discount_paisa | integer | Discount applied |
| total_price_paisa | integer | Total price |
| tax_rate_percent | decimal | GST rate (18%) |
| tax_amount_paisa | integer | Tax amount |
| inventory_deducted | integer | 0 or 1 |
| inventory_transaction_id | varchar | Link to inventory transaction |
| notes | text | Notes |
| created_at | timestamp | Record creation |

### 4.5 Table: job_card_payments

| Column | Type | Description |
|--------|------|-------------|
| id | varchar(36) PK | UUID primary key |
| job_card_id | varchar FK | Reference to job_cards |
| salon_id | varchar FK | Reference to salons |
| payment_method | varchar(30) | cash, card, upi, wallet, razorpay, bank_transfer |
| amount_paisa | integer | Payment amount |
| status | varchar(20) | pending, completed, failed, refunded |
| razorpay_order_id | text | Razorpay order ID |
| razorpay_payment_id | text | Razorpay payment ID |
| transaction_id | varchar(100) | Transaction reference |
| card_last_4 | varchar(4) | Last 4 digits of card |
| card_network | varchar(20) | Visa, Mastercard, etc. |
| upi_id | varchar(100) | UPI ID used |
| is_refund | integer | 0 or 1 |
| refund_reason | text | Reason if refund |
| collected_by | varchar FK | Staff who collected |
| created_at | timestamp | Record creation |
| completed_at | timestamp | Completion time |

### 4.6 Table: job_card_tips

| Column | Type | Description |
|--------|------|-------------|
| id | varchar(36) PK | UUID primary key |
| job_card_id | varchar FK | Reference to job_cards |
| salon_id | varchar FK | Reference to salons |
| staff_id | varchar FK | Staff receiving tip |
| amount_paisa | integer | Tip amount |
| payment_method | varchar(30) | cash, card, upi, wallet |
| notes | text | Notes |
| created_at | timestamp | Record creation |

### 4.7 Table: job_card_activity_log

| Column | Type | Description |
|--------|------|-------------|
| id | varchar(36) PK | UUID primary key |
| job_card_id | varchar FK | Reference to job_cards |
| salon_id | varchar FK | Reference to salons |
| activity_type | varchar(50) | Type of activity |
| description | text | Activity description |
| previous_value | jsonb | Before state |
| new_value | jsonb | After state |
| performed_by | varchar FK | Who performed |
| performed_by_name | text | Name (snapshot) |
| created_at | timestamp | When occurred |

---

## 5. API Specification

### 5.1 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/salons/:salonId/job-cards/check-in` | Check in customer (from booking or walk-in) |
| GET | `/api/salons/:salonId/job-cards` | List job cards (with filters) |
| GET | `/api/salons/:salonId/job-cards/:id` | Get job card details |
| PATCH | `/api/salons/:salonId/job-cards/:id/status` | Update job card status |
| POST | `/api/salons/:salonId/job-cards/:id/services` | Add service to job card |
| DELETE | `/api/salons/:salonId/job-cards/:id/services/:serviceId` | Remove service |
| POST | `/api/salons/:salonId/job-cards/:id/products` | Add product to job card |
| DELETE | `/api/salons/:salonId/job-cards/:id/products/:productId` | Remove product |
| POST | `/api/salons/:salonId/job-cards/:id/discount` | Apply discount |
| GET | `/api/salons/:salonId/job-cards/:id/bill` | Get bill summary |
| POST | `/api/salons/:salonId/job-cards/:id/payments` | Process payment |
| POST | `/api/salons/:salonId/job-cards/:id/tips` | Add tip |
| POST | `/api/salons/:salonId/job-cards/:id/checkout` | Complete checkout |
| GET | `/api/salons/:salonId/job-cards/:id/receipt` | Get receipt |
| GET | `/api/checkin/:salonId` | QR self check-in page (public) |
| POST | `/api/checkin/:salonId/verify` | Verify booking for self check-in |
| POST | `/api/checkin/:salonId/complete` | Complete self check-in |

### 5.2 Request/Response Examples

#### POST /api/salons/:salonId/job-cards/check-in

**Request:**
```json
{
  "bookingId": "uuid-booking-123",
  "checkInMethod": "manual",
  "assignedStaffId": "uuid-staff-456",
  "notes": "Regular customer, prefers minimal talking"
}
```

**Response:**
```json
{
  "success": true,
  "jobCard": {
    "id": "uuid-jobcard-789",
    "jobCardNumber": "JC-20251207-001",
    "status": "open",
    "customerName": "John Doe",
    "checkInAt": "2025-12-07T10:30:00Z",
    "services": [...],
    "totalAmountPaisa": 85000
  }
}
```

#### POST /api/salons/:salonId/job-cards/:id/payments

**Request (Split Payment):**
```json
{
  "payments": [
    {
      "paymentMethod": "cash",
      "amountPaisa": 50000
    },
    {
      "paymentMethod": "upi",
      "amountPaisa": 54000,
      "transactionId": "UPI123456789"
    }
  ]
}
```

---

## 6. User Interface Design

### 6.1 Calendar Management Enhancement

The existing CalendarManagement page will be enhanced with a split-view layout:

| Component | Position | Width |
|-----------|----------|-------|
| Booking Calendar | Left | 60% |
| Front Desk Panel | Right | 40% |

### 6.2 Status Badge Colors

| Status | Color | Badge Text |
|--------|-------|------------|
| Confirmed | Blue | Confirmed |
| Arrived | Yellow | Arrived |
| In-Service | Green | In Service |
| Pending Checkout | Orange | Checkout |
| Completed | Gray | Completed |
| No-Show | Red | No Show |
| Cancelled | Dark Gray | Cancelled |

### 6.3 New Components

| Component | File Path | Purpose |
|-----------|-----------|---------|
| FrontDeskPanel | `client/src/components/FrontDeskPanel.tsx` | Right panel with tabs |
| JobCardDrawer | `client/src/components/JobCardDrawer.tsx` | Slide-out drawer for job card management |
| ActiveJobCardsList | `client/src/components/ActiveJobCardsList.tsx` | List of active job cards |
| CheckInConsole | `client/src/components/CheckInConsole.tsx` | Check-in operations |
| CheckoutLane | `client/src/components/CheckoutLane.tsx` | Checkout operations |
| WalkInForm | `client/src/components/WalkInForm.tsx` | Quick walk-in booking form |
| PaymentSplitForm | `client/src/components/PaymentSplitForm.tsx` | Split payment interface |
| SelfCheckInPage | `client/src/pages/SelfCheckIn.tsx` | Public QR check-in page |

---

## 7. Edge Cases & Error Handling

### 7.1 Edge Cases

| Scenario | Handling |
|----------|----------|
| Customer checks in but booking not found | Show error, offer walk-in option |
| Customer checks in twice | Prevent duplicate, show existing job card |
| Service removed after partial completion | Allow removal, adjust billing |
| Payment fails mid-transaction | Rollback, maintain unpaid status |
| Staff unavailable during service | Allow reassignment |
| Product out of stock | Show warning, prevent addition |
| Job card abandoned (no checkout) | Auto-close after 24 hours with admin alert |
| Split payment exceeds total | Prevent overpayment, show balance |
| Discount exceeds subtotal | Cap discount at subtotal |

### 7.2 Error Messages

| Error Code | Message |
|------------|---------|
| JC001 | Booking not found for check-in |
| JC002 | Customer already checked in today |
| JC003 | Job card not found |
| JC004 | Cannot modify completed job card |
| JC005 | Service not available |
| JC006 | Product out of stock |
| JC007 | Payment amount exceeds balance |
| JC008 | Invalid payment method |
| JC009 | Insufficient permissions |
| JC010 | Job card already completed |

---

## 8. Implementation Roadmap

### Phase 1: Database & API Foundation (Tasks 1-2)

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Create job_cards table schema | Done |
| 1.2 | Create job_card_services table | Done |
| 1.3 | Create job_card_products table | Done |
| 1.4 | Create job_card_payments table | Done |
| 1.5 | Create job_card_tips table | Done |
| 1.6 | Create job_card_activity_log table | Done |
| 1.7 | Run database migration | Pending |
| 2.1 | Create job-cards.routes.ts | Pending |
| 2.2 | Implement check-in endpoint | Pending |
| 2.3 | Implement CRUD endpoints | Pending |
| 2.4 | Implement payment endpoints | Pending |
| 2.5 | Implement checkout endpoint | Pending |

### Phase 2: Front Desk UI (Tasks 3-5)

| Task | Description | Status |
|------|-------------|--------|
| 3.1 | Add split-view to CalendarManagement | Pending |
| 3.2 | Create FrontDeskPanel component | Pending |
| 3.3 | Implement tabs (Active, Check-in, Checkout) | Pending |
| 4.1 | Add status badges to calendar | Pending |
| 4.2 | Implement real-time status updates | Pending |
| 5.1 | Create JobCardDrawer component | Pending |
| 5.2 | Build services management UI | Pending |
| 5.3 | Build products management UI | Pending |
| 5.4 | Build payment section UI | Pending |

### Phase 3: Advanced Features (Tasks 6-9)

| Task | Description | Status |
|------|-------------|--------|
| 6.1 | Create WalkInForm component | Pending |
| 6.2 | Implement instant booking flow | Pending |
| 7.1 | Create SelfCheckIn page | Pending |
| 7.2 | Generate QR codes per salon | Pending |
| 8.1 | Implement split payment UI | Pending |
| 8.2 | Receipt generation | Pending |
| 9.1 | Auto commission calculation | Pending |
| 9.2 | Inventory deduction | Pending |
| 9.3 | Feedback notification trigger | Pending |

### Phase 4: Testing & Polish (Task 10)

| Task | Description | Status |
|------|-------------|--------|
| 10.1 | End-to-end flow testing | Pending |
| 10.2 | Edge case testing | Pending |
| 10.3 | Performance optimization | Pending |
| 10.4 | UI polish and accessibility | Pending |

---

## Appendix A: Constants & Enums

### Job Card Statuses
```typescript
const JOB_CARD_STATUSES = {
  OPEN: 'open',
  IN_SERVICE: 'in_service',
  PENDING_CHECKOUT: 'pending_checkout',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};
```

### Payment Methods
```typescript
const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  WALLET: 'wallet',
  RAZORPAY: 'razorpay',
  BANK_TRANSFER: 'bank_transfer',
  OTHER: 'other',
};
```

### Check-in Methods
```typescript
const CHECK_IN_METHODS = {
  MANUAL: 'manual',
  QR_CODE: 'qr_code',
  SELF_CHECKIN: 'self_checkin',
  BOOKING_AUTO: 'booking_auto',
};
```

---

**Document End**
