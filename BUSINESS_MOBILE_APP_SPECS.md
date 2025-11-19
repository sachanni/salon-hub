# SalonHub Partner Mobile App - Screen Specifications

**Version:** 1.0  
**Date:** November 19, 2025  
**Platform:** iOS & Android (React Native / Flutter recommended)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [User Personas](#user-personas)
3. [App Architecture](#app-architecture)
4. [Authentication Flow](#authentication-flow)
5. [Core Features & Screens](#core-features--screens)
6. [Screen Specifications](#screen-specifications)
7. [Navigation Structure](#navigation-structure)
8. [Technical Requirements](#technical-requirements)
9. [API Integration Points](#api-integration-points)
10. [Offline Functionality](#offline-functionality)
11. [Push Notifications](#push-notifications)
12. [Analytics & Tracking](#analytics--tracking)

---

## Executive Summary

The SalonHub Partner Mobile App empowers salon and spa owners to manage their business operations on-the-go. From appointment management and staff scheduling to inventory tracking and financial reporting, this app provides comprehensive business management tools optimized for mobile use.

**Key Objectives:**
- Enable real-time booking management from anywhere
- Provide instant business insights and analytics
- Streamline staff and resource scheduling
- Track inventory and purchase orders
- Manage customer relationships and communications
- Monitor financial performance and expenses

**Target Users:**
- Salon Owners (Primary)
- Salon Managers (Secondary)
- Multi-location Business Owners (Advanced)

---

## User Personas

### Primary Persona: Solo Salon Owner (25-45 years)
- **Goal:** Manage bookings, track revenue, respond to customers quickly
- **Pain Points:** Time-consuming admin tasks, no visibility outside salon
- **Behavior:** Checks app 10-15 times/day, values quick actions

### Secondary Persona: Multi-Location Owner (35-55 years)
- **Goal:** Monitor multiple salons, compare performance, delegate effectively
- **Pain Points:** Inconsistent data, difficulty tracking staff across locations
- **Behavior:** Needs aggregated dashboards, reports on-the-go

### Tertiary Persona: Salon Manager (22-40 years)
- **Goal:** Handle day-to-day operations, manage staff schedules
- **Pain Points:** Limited access to financial data, needs quick booking updates
- **Behavior:** Mobile-first, needs notifications for new bookings

---

## App Architecture

### Technology Stack Recommendations

**Frontend:**
- React Native (code sharing with web) OR Flutter (native performance)
- State Management: Redux Toolkit / Bloc Pattern
- Charts: Recharts (RN) / fl_chart (Flutter)
- Forms: React Hook Form / Flutter Form Builder

**Backend Integration:**
- Existing Express.js REST API
- WebSocket for real-time booking updates
- GraphQL (optional for complex queries)

**Local Storage:**
- Offline-first architecture for critical data
- SQLite for local database
- Secure storage for credentials

**Third-Party SDKs:**
- Calendar: react-native-calendars / table_calendar
- Charts: Victory Native / Syncfusion Charts
- Camera: For inventory barcode scanning
- PDF Generation: For reports and invoices

---

## Authentication Flow

### 1. Onboarding Screens

#### 1.1 Splash Screen
**Duration:** 2-3 seconds

**Elements:**
- SalonHub Partner logo
- Tagline: "Manage Your Salon Business"
- Loading indicator

**Logic:**
- Check authentication token
- Verify salon ownership
- Check for pending notifications

**Transitions:**
- If authenticated → Dashboard
- If not authenticated → Welcome Screen

---

#### 1.2 Welcome Screen
**Type:** Single screen with hero image

**Layout:**
```
┌─────────────────────────────────┐
│    [Hero Image]                 │
│    Salon owner managing app     │
│                                 │
│  SalonHub Partner               │
│  Your Business, In Your Pocket  │
│                                 │
│  ✓ Manage bookings on-the-go   │
│  ✓ Track revenue in real-time  │
│  ✓ Coordinate your team         │
│  ✓ Grow your business           │
│                                 │
│  [Get Started]                  │
│  [I Already Have an Account]    │
└─────────────────────────────────┘
```

---

### 2. Authentication Screens

#### 2.1 Business Login Screen
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back]                       │
│                                 │
│  Partner Login                  │
│  Manage your salon business     │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Email                   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password [👁]           │   │
│  └─────────────────────────┘   │
│                                 │
│  [Remember Me] [Forgot?]        │
│                                 │
│  [Login]                        │
│                                 │
│  ──────── OR ────────           │
│                                 │
│  [Continue with Phone]          │
│                                 │
│  Don't have a business account? │
│  Register Your Salon →          │
└─────────────────────────────────┘
```

**API:** `POST /api/auth/login`
- Request: `{ email, password, loginType: 'business' }`
- Response: `{ user, session, orgMemberships, salons }`

**Security:**
- Password strength requirements
- Rate limiting (5 attempts per 15 minutes)
- Biometric login option (after first successful login)

---

#### 2.2 Phone Authentication (Alternative)
**Same as Customer app, but validates business account**

**API:** Firebase Auth + `POST /api/auth/login`
- Validates user has 'owner' role
- Returns associated salons

---

#### 2.3 Business Registration Screen
**Flow:** Multi-step wizard (Mobile-optimized version of web onboarding)

**Step 1: Account Creation**
```
┌─────────────────────────────────┐
│  [← Back] Step 1 of 6           │
│  Create Account                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Full Name               │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Email                   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Phone Number            │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password [👁]           │   │
│  └─────────────────────────┘   │
│                                 │
│  [Verify Phone & Continue]      │
│                                 │
│  Already have account? Login →  │
└─────────────────────────────────┘
```

**Step 2: Business Information**
```
┌─────────────────────────────────┐
│  [← Back] Step 2 of 6           │
│  Tell Us About Your Business    │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Salon/Spa Name          │   │
│  └─────────────────────────┘   │
│                                 │
│  Business Type                  │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │Salon│ │ Spa │ │Both │       │
│  └─────┘ └─────┘ └─────┘       │
│                                 │
│  Category                       │
│  [Dropdown: Hair Salon,         │
│   Unisex, Spa, Beauty Bar...]   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Brief Description       │   │
│  │ (optional)              │   │
│  └─────────────────────────┘   │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘
```

**Step 3: Location & Contact**
```
┌─────────────────────────────────┐
│  [← Back] Step 3 of 6           │
│  Location & Contact             │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [📍] Search Address...  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Complete Address        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌────────┐ ┌──────────────┐   │
│  │City    │ │State         │   │
│  └────────┘ └──────────────┘   │
│                                 │
│  ┌────────┐ ┌──────────────┐   │
│  │PIN Code│ │Phone         │   │
│  └────────┘ └──────────────┘   │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘
```

**Step 4-6:** Services, Staff, Gallery (Simplified for mobile)
- Services: Quick add from templates
- Staff: Add 1-2 key staff members
- Gallery: Upload 3-5 photos

**Note:** Full setup can be completed later from Dashboard or web app.

---

## Core Features & Screens

### Feature Priority Matrix

| Feature | Priority | Complexity | MVP |
|---------|----------|------------|-----|
| Dashboard & Analytics | P0 | High | ✅ |
| Booking Management | P0 | High | ✅ |
| Calendar View | P0 | Very High | ✅ |
| Customer Management | P1 | Medium | ✅ |
| Staff Management | P1 | Medium | ✅ |
| Financial Overview | P1 | High | ✅ |
| Inventory Management | P1 | High | ✅ |
| Communication Tools | P2 | Medium | ⏳ |
| Reports & Analytics | P2 | High | ⏳ |
| Multi-Location Support | P2 | High | ⏳ |

---

## Screen Specifications

### 3. Dashboard (Home Screen)

#### 3.1 Main Dashboard
**Navigation:** Bottom Tab (Home Icon - Selected)

**Layout:**
```
┌─────────────────────────────────┐
│  [≡ Menu] SalonHub  [🔔] [👤]  │ ← Header
│  My Salon Name ▼                │ ← Salon Selector (if multi-location)
├─────────────────────────────────┤
│  ┌────────────┬─────────────┐  │
│  │ Today's    │ This Week   │  │ ← Date Filter Toggle
│  └────────────┴─────────────┘  │
├─────────────────────────────────┤
│  Quick Stats                    │
│  ┌────────┐ ┌────────┐         │
│  │   15   │ │  ₹8.5K │         │
│  │Bookings│ │Revenue │         │
│  └────────┘ └────────┘         │
│  ┌────────┐ ┌────────┐         │
│  │   5    │ │  ₹2.1K │         │
│  │Pending │ │ Wallet │         │
│  └────────┘ └────────┘         │
├─────────────────────────────────┤
│  Today's Schedule               │
│  [Calendar Icon] Nov 10, 2025   │
│                                 │
│  ┌──────────────────────────┐  │
│  │ 10:00 AM                 │  │
│  │ Aarti Kumar              │  │
│  │ Haircut • Priya Sharma   │  │
│  │ [View] [Reschedule]      │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 11:30 AM                 │  │
│  │ Raj Malhotra             │  │
│  │ Massage • Amit Singh     │  │
│  │ [View] [Reschedule]      │  │
│  └──────────────────────────┘  │
│  [View All Appointments →]      │
├─────────────────────────────────┤
│  Revenue Trend (7 days)         │
│  [Line Chart]                   │
│  ┌──────────────────────────┐  │
│  │        ╱╲                │  │
│  │       ╱  ╲               │  │
│  │    ╱─╯    ╲─╮            │  │
│  │  ╱─         ─╲           │  │
│  └──────────────────────────┘  │
│  M  T  W  T  F  S  S            │
├─────────────────────────────────┤
│  Quick Actions                  │
│  ┌────────┐ ┌────────┐         │
│  │New     │ │Manage  │         │
│  │Booking │ │Staff   │         │
│  └────────┘ └────────┘         │
│  ┌────────┐ ┌────────┐         │
│  │View    │ │Reports │         │
│  │Wallet  │ │        │         │
│  └────────┘ └────────┘         │
├─────────────────────────────────┤
│  Staff Performance              │
│  ┌──────────────────────────┐  │
│  │ Priya Sharma             │  │
│  │ 12 bookings • ₹4,200     │  │
│  │ ████████░░ 80%           │  │
│  └──────────────────────────┘  │
│  [View All Staff →]             │
└─────────────────────────────────┘
```

**Components:**

1. **Header Bar**
   - Menu drawer toggle
   - Salon name/logo
   - Notification bell (badge count)
   - Profile icon

2. **Date Filter**
   - Toggle: Today / This Week / This Month
   - Updates all metrics below

3. **Quick Stats Cards (4 tiles)**
   - Total Bookings (with trend ↑/↓)
   - Revenue (with trend)
   - Pending Approvals
   - Wallet Balance

4. **Today's Schedule**
   - Next 3-5 upcoming bookings
   - Each card shows: Time, Customer, Service, Staff
   - Quick actions: View details, Reschedule, Cancel

5. **Revenue Trend Chart**
   - Last 7 days line chart
   - Tap to see detailed breakdown

6. **Quick Actions (4 buttons)**
   - New Booking (Manual entry)
   - Manage Staff
   - View Wallet/Payments
   - View Reports

7. **Staff Performance**
   - Top 3 performers
   - Bookings count + revenue
   - Utilization percentage

**API Endpoints:**
- `GET /api/salons/{salonId}/dashboard-metrics?period=today`
- `GET /api/salons/{salonId}/bookings?date={today}&limit=5`
- `GET /api/salons/{salonId}/staff-performance?period=week`

**Real-Time Updates:**
- WebSocket connection for new bookings
- Pull-to-refresh for manual sync
- Auto-refresh every 5 minutes

---

### 4. Calendar & Booking Management

#### 4.1 Calendar View
**Navigation:** Bottom Tab (Calendar Icon)

**Layout - Month View:**
```
┌─────────────────────────────────┐
│  [← Back] Calendar    [+ New]   │
│  [Today] [Week] [Month] [List]  │ ← View toggles
├─────────────────────────────────┤
│  November 2025     [< >]        │
│  S  M  T  W  T  F  S            │
│  1  2  3  4  5  6  7            │
│  8  9 [10] 11 12 13 14          │ ← Today
│  • • •  • •                     │ ← Booking dots
│  15 16 17 18 19 20 21           │
│  22 23 24 25 26 27 28           │
│  29 30                          │
├─────────────────────────────────┤
│  Nov 10 - 15 Bookings           │
│  ┌──────────────────────────┐  │
│  │ 10:00 AM - Aarti K.      │  │
│  │ Haircut • Priya          │  │
│  │ [View Details]           │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 11:30 AM - Raj M.        │  │
│  │ Massage • Amit           │  │
│  │ [View Details]           │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**Layout - Day View:**
```
┌─────────────────────────────────┐
│  [← Back] Nov 10, 2025          │
│  [Today] [Week] [Month] [List]  │
├─────────────────────────────────┤
│  All Staff ▼    Filter: All ▼   │
├─────────────────────────────────┤
│  Time   Priya    Amit    Ravi   │ ← Staff columns
│  ────────────────────────────   │
│  9 AM   [Open]   [Open]  [Open] │
│  10 AM  [Aarti]  [Open]  [Open] │
│         Haircut                  │
│  11 AM  [Cont.]  [Raj]   [Open] │
│                  Massage         │
│  12 PM  [Lunch]  [Cont.] [Open] │
│  1 PM   [Open]   [Open]  [Sara] │
│                           Facial │
│  ...                            │
└─────────────────────────────────┘
```

**Features:**
- Swipe between days/weeks
- Tap time slot → Create booking
- Tap booking → View/Edit details
- Long press → Quick actions menu
- Color coding by service type
- Staff availability indicators

**API:**
- `GET /api/salons/{salonId}/bookings?date={date}`
- `GET /api/salons/{salonId}/staff`
- `GET /api/salons/{salonId}/availability-patterns`

---

#### 4.2 Booking Details Screen
**Navigation:** Tap on any booking card

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Booking Details       │
│  Booking #BK123456              │
├─────────────────────────────────┤
│  Status: Confirmed              │
│  Created: Nov 8, 2025           │
│                                 │
│  Customer Information           │
│  ┌──────────────────────────┐  │
│  │ [Photo] Aarti Kumar      │  │
│  │ +91 98765 43210          │  │
│  │ aarti@email.com          │  │
│  │ [Call] [WhatsApp] [SMS]  │  │
│  └──────────────────────────┘  │
│                                 │
│  Appointment Details            │
│  📅 November 10, 2025           │
│  🕐 10:00 AM - 10:30 AM         │
│  👤 Staff: Priya Sharma         │
│                                 │
│  Services                       │
│  • Haircut (Men)      ₹300      │
│  • Head Massage       ₹200      │
│  ──────────────────             │
│  Subtotal             ₹500      │
│  GST (18%)            ₹90       │
│  Discount             -₹50      │
│  ──────────────────             │
│  Total                ₹540      │
│                                 │
│  Payment Status: Paid Online    │
│  Payment ID: pay_xxxxx          │
│                                 │
│  Special Requests               │
│  [Customer notes if any]        │
│                                 │
│  Booking Timeline               │
│  ✓ Booked - Nov 8, 10:30 AM     │
│  ✓ Confirmed - Nov 8, 10:31 AM  │
│  ⏱ Scheduled - Nov 10, 10:00 AM│
│                                 │
│  [Reschedule]  [Cancel]         │
│  [Mark as Completed]            │
│  [Send Reminder]                │
└─────────────────────────────────┘
```

**Actions:**
- Call/WhatsApp/SMS customer (deep link to native apps)
- Reschedule → Open time slot picker
- Cancel → Confirmation dialog + refund handling
- Mark Completed → Update status + prompt for review request
- Send Reminder → Push/SMS notification

**API:**
- `GET /api/bookings/{bookingId}`
- `PUT /api/bookings/{bookingId}/status`
- `POST /api/bookings/{bookingId}/reschedule`
- `DELETE /api/bookings/{bookingId}` (cancel)

---

#### 4.3 Create Manual Booking
**Navigation:** Tap "+ New" from Calendar or Dashboard

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] New Booking           │
│  Step 1 of 4                    │
├─────────────────────────────────┤
│  Search Customer                │
│  ┌─────────────────────────┐   │
│  │ [🔍] Name or Phone...   │   │
│  └─────────────────────────┘   │
│                                 │
│  Recent Customers               │
│  ┌──────────────────────────┐  │
│  │ Aarti Kumar              │  │
│  │ Last visit: Nov 5        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Raj Malhotra             │  │
│  │ Last visit: Nov 3        │  │
│  └──────────────────────────┘  │
│                                 │
│  New Customer? [Add New]        │
│                                 │
│  [Next]                         │
└─────────────────────────────────┘
```

**Step 2: Select Services**
- Same UI as customer app service selection
- Multi-select with real-time total

**Step 3: Date & Time + Staff**
- Calendar picker
- Available time slots
- Staff assignment

**Step 4: Confirm & Payment**
- Summary
- Payment method: Online / Pay at Salon / Complimentary
- Discount/Coupon application

**API:**
- `GET /api/salons/{salonId}/customers?q={query}`
- `POST /api/bookings` (same as customer booking)

---

### 5. Customer Management

#### 5.1 Customers List
**Navigation:** Side Menu → Customers

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Customers             │
│  [🔍 Search...] [Filter] [+]    │
├─────────────────────────────────┤
│  [All] [VIP] [New] [Inactive]   │ ← Segments
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ [A] Aarti Kumar          │  │
│  │ +91 98765 43210          │  │
│  │ 12 visits • ₹8,400       │  │
│  │ Last: Nov 5              │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ [R] Raj Malhotra         │  │
│  │ +91 98888 12345          │  │
│  │ 5 visits • ₹3,200        │  │
│  │ Last: Nov 3              │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**Features:**
- Search by name/phone
- Filter: VIP, New (< 3 visits), Inactive (>3 months)
- Sort by: Last visit, Total spent, Visit count
- Tap → View customer profile

**API:** `GET /api/salons/{salonId}/customers`

---

#### 5.2 Customer Profile
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Customer Profile      │
│  [Edit] [More ⋮]                │
├─────────────────────────────────┤
│  [Photo] Aarti Kumar            │
│  VIP Customer 👑                │
│  +91 98765 43210                │
│  aarti@email.com                │
│                                 │
│  [Call] [WhatsApp] [Email]      │
├─────────────────────────────────┤
│  Quick Stats                    │
│  ┌────────┐ ┌────────┐         │
│  │   12   │ │ ₹8.4K  │         │
│  │ Visits │ │  Spent │         │
│  └────────┘ └────────┘         │
│  ┌────────┐ ┌────────┐         │
│  │  Nov 5 │ │  Hair  │         │
│  │Last Vist│ │Favorite│         │
│  └────────┘ └────────┘         │
├─────────────────────────────────┤
│  [Bookings] [Notes] [Offers]    │ ← Tabs
├─────────────────────────────────┤
│  Booking History                │
│  ┌──────────────────────────┐  │
│  │ Nov 5, 2025              │  │
│  │ Haircut • Priya          │  │
│  │ ₹540 • Completed         │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Oct 15, 2025             │  │
│  │ Hair Color • Amit        │  │
│  │ ₹1,200 • Completed       │  │
│  └──────────────────────────┘  │
│  ...                            │
├─────────────────────────────────┤
│  [Book Appointment]             │
│  [Send Message]                 │
└─────────────────────────────────┘
```

**Notes Tab:**
- Add private notes about customer
- Preferences (e.g., "Prefers window seat")
- Allergies/special requests

**Offers Tab:**
- Customer-specific offers
- Loyalty rewards
- Send personalized offer

**API:**
- `GET /api/customers/{customerId}`
- `GET /api/customers/{customerId}/bookings`
- `POST /api/customers/{customerId}/notes`

---

### 6. Staff Management

#### 6.1 Staff List
**Navigation:** Dashboard → Manage Staff OR Bottom Tab

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Staff                 │
│  [+ Add Staff] [Filter]         │
├─────────────────────────────────┤
│  [All] [Active] [On Leave]      │
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ [Photo] Priya Sharma     │  │
│  │ Senior Stylist           │  │
│  │ ⭐ 4.8 • 8 yrs exp       │  │
│  │ Today: 8 bookings        │  │
│  │ [View Schedule]          │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ [Photo] Amit Singh       │  │
│  │ Massage Therapist        │  │
│  │ ⭐ 4.6 • 5 yrs exp       │  │
│  │ Today: On Leave          │  │
│  │ [View Schedule]          │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**API:** `GET /api/salons/{salonId}/staff/manage`

---

#### 6.2 Staff Profile & Schedule
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Staff Profile [Edit]  │
├─────────────────────────────────┤
│  [Photo] Priya Sharma           │
│  Senior Hair Stylist            │
│  ⭐ 4.8 (67 reviews)            │
│  +91 98765 00000                │
│  priya@salon.com                │
│                                 │
│  Specialties                    │
│  Hair Styling • Coloring •      │
│  Bridal Makeup                  │
├─────────────────────────────────┤
│  [Schedule] [Performance]       │ ← Tabs
├─────────────────────────────────┤
│  This Week's Schedule           │
│  Mon Nov 10 - Working           │
│  9:00 AM - 6:00 PM              │
│  8 bookings scheduled           │
│  [View Details]                 │
│                                 │
│  Tue Nov 11 - Working           │
│  9:00 AM - 6:00 PM              │
│  6 bookings scheduled           │
│  [View Details]                 │
│                                 │
│  Wed Nov 12 - Day Off           │
│  [Mark Available]               │
│  ...                            │
├─────────────────────────────────┤
│  [Mark Leave]                   │
│  [Update Working Hours]         │
│  [View Earnings]                │
└─────────────────────────────────┘
```

**Performance Tab:**
```
This Month (November)
┌──────────────────────────┐
│ Total Bookings: 45       │
│ Revenue: ₹18,500         │
│ Avg Rating: 4.8/5        │
│ No-Shows: 2              │
│ Utilization: 85%         │
└──────────────────────────┘

Top Services
• Haircut - 25 bookings
• Hair Coloring - 12
• Bridal Makeup - 8

[View Detailed Report →]
```

**API:**
- `GET /api/salons/{salonId}/staff/{staffId}`
- `GET /api/salons/{salonId}/staff/{staffId}/schedule`
- `GET /api/salons/{salonId}/staff/{staffId}/performance`

---

### 7. Financial Management

#### 7.1 Financial Overview
**Navigation:** Side Menu → Financials

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Financials            │
│  [This Month ▼] [Export]        │
├─────────────────────────────────┤
│  November 2025 Summary          │
│  ┌──────────────────────────┐  │
│  │ 💰 Total Revenue         │  │
│  │    ₹1,24,500             │  │
│  │    +18% from Oct         │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌─────────┬─────────┐         │
│  │Bookings │ Expenses│         │
│  │  85     │ ₹42,000 │         │
│  └─────────┴─────────┘         │
│                                 │
│  ┌─────────┬─────────┐         │
│  │Net Profit│Avg Bill│         │
│  │ ₹82,500 │ ₹1,465  │         │
│  └─────────┴─────────┘         │
├─────────────────────────────────┤
│  Revenue Breakdown              │
│  [Pie Chart]                    │
│  • Hair Services - 45%          │
│  • Spa Services - 30%           │
│  • Nail Services - 15%          │
│  • Products - 10%               │
├─────────────────────────────────┤
│  Recent Transactions            │
│  ┌──────────────────────────┐  │
│  │ Nov 10 • Aarti K.        │  │
│  │ Haircut                  │  │
│  │ + ₹540 • Paid Online     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Nov 10 • Raj M.          │  │
│  │ Massage                  │  │
│  │ + ₹800 • Pay at Salon    │  │
│  └──────────────────────────┘  │
│  [View All Transactions →]      │
├─────────────────────────────────┤
│  Quick Actions                  │
│  [Record Expense]               │
│  [View P&L Report]              │
│  [Manage Commissions]           │
└─────────────────────────────────┘
```

**API:**
- `GET /api/salons/{salonId}/financial-analytics/kpis?period=month`
- `GET /api/salons/{salonId}/profit-loss/{startDate}/{endDate}`
- `GET /api/salons/{salonId}/payments?period=month`

---

#### 7.2 Expense Tracking
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Expenses              │
│  [+ Add Expense]                │
├─────────────────────────────────┤
│  [All] [Pending] [Approved]     │
├─────────────────────────────────┤
│  This Month: ₹42,000            │
│                                 │
│  By Category                    │
│  • Rent - ₹20,000 (48%)         │
│  • Salaries - ₹15,000 (36%)     │
│  • Products - ₹5,000 (12%)      │
│  • Utilities - ₹2,000 (5%)      │
├─────────────────────────────────┤
│  Recent Expenses                │
│  ┌──────────────────────────┐  │
│  │ Nov 1 • Rent Payment     │  │
│  │ ₹20,000 • Approved       │  │
│  │ Category: Rent           │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Nov 5 • Product Stock    │  │
│  │ ₹3,500 • Pending         │  │
│  │ Category: Inventory      │  │
│  │ [Approve] [Reject]       │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**Add Expense Form:**
```
┌─────────────────────────────────┐
│  [← Back] Add Expense           │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ Amount (₹)              │   │
│  └─────────────────────────┘   │
│                                 │
│  Category                       │
│  [Dropdown: Rent, Salary,...]   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Description             │   │
│  │ (optional)              │   │
│  └─────────────────────────┘   │
│                                 │
│  Date                           │
│  [Date Picker]                  │
│                                 │
│  Attach Receipt (optional)      │
│  [📷 Take Photo] [📁 Upload]   │
│                                 │
│  [Save Expense]                 │
└─────────────────────────────────┘
```

**API:**
- `GET /api/salons/{salonId}/expenses`
- `POST /api/salons/{salonId}/expenses`
- `PUT /api/salons/{salonId}/expenses/{id}/approve`

---

### 8. Inventory Management

#### 8.1 Inventory Dashboard
**Navigation:** Side Menu → Inventory

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Inventory             │
│  [+ Add Product] [Scan Barcode] │
├─────────────────────────────────┤
│  Quick Overview                 │
│  ┌────────┐ ┌────────┐         │
│  │  156   │ │   12   │         │
│  │Products│ │Low Stock│         │
│  └────────┘ └────────┘         │
│  ┌────────┐ ┌────────┐         │
│  │   5    │ │ ₹2.1L  │         │
│  │Vendors │ │ Value  │         │
│  └────────┘ └────────┘         │
├─────────────────────────────────┤
│  [Products] [Categories]        │
│  [Vendors] [Purchase Orders]    │ ← Tabs
├─────────────────────────────────┤
│  Products                       │
│  [🔍 Search...] [Filter]        │
│                                 │
│  ⚠️ Low Stock Items (12)        │
│  ┌──────────────────────────┐  │
│  │ L'Oreal Shampoo          │  │
│  │ SKU: SHA-001             │  │
│  │ Stock: 3 • Min: 10       │  │
│  │ [Reorder]                │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ OPI Nail Polish #12      │  │
│  │ SKU: NP-012              │  │
│  │ Stock: 5 • Min: 15       │  │
│  │ [Reorder]                │  │
│  └──────────────────────────┘  │
│  [View All Products →]          │
├─────────────────────────────────┤
│  Recent Stock Movements         │
│  ┌──────────────────────────┐  │
│  │ Nov 10 • Purchase        │  │
│  │ +50 units • SHA-001      │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**API:**
- `GET /api/salons/{salonId}/inventory/products`
- `GET /api/salons/{salonId}/inventory/low-stock`
- `GET /api/salons/{salonId}/inventory/stock-movements`

---

#### 8.2 Product Details
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Product Details       │
│  [Edit] [More ⋮]                │
├─────────────────────────────────┤
│  [Product Image]                │
│  L'Oreal Professional Shampoo   │
│  SKU: SHA-001                   │
│  Barcode: 1234567890            │
├─────────────────────────────────┤
│  Stock Information              │
│  Current Stock: 3 units         │
│  Minimum Level: 10 units        │
│  Maximum Level: 50 units        │
│  Reorder Point: 15 units        │
│  ⚠️ Below minimum level         │
│                                 │
│  [+ Record Stock Movement]      │
│  [Create Purchase Order]        │
├─────────────────────────────────┤
│  Details                        │
│  Category: Hair Care            │
│  Brand: L'Oreal                 │
│  Unit Price: ₹450               │
│  Vendor: ABC Suppliers          │
│  For Retail: Yes (₹650)         │
├─────────────────────────────────┤
│  Stock Movement History         │
│  ┌──────────────────────────┐  │
│  │ Nov 5 • Usage            │  │
│  │ -2 units • Booking #123  │  │
│  │ Previous: 5 → New: 3     │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Oct 28 • Purchase        │  │
│  │ +50 units • PO #PO-045   │  │
│  │ Previous: 0 → New: 50    │  │
│  └──────────────────────────┘  │
│  [View All History →]           │
└─────────────────────────────────┘
```

**API:**
- `GET /api/salons/{salonId}/inventory/products/{productId}`
- `GET /api/salons/{salonId}/inventory/products/{productId}/movements`

---

#### 8.3 Barcode Scanner
**Navigation:** Tap "Scan Barcode" button

**Layout:**
```
┌─────────────────────────────────┐
│  [✕ Close]                      │
│                                 │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  │    [Camera View]          │ │
│  │                           │ │
│  │    [Scan Frame Overlay]   │ │
│  │                           │ │
│  │    Align barcode here     │ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  [💡 Flash]  [📁 Upload Image] │
│                                 │
│  Scanning...                    │
└─────────────────────────────────┘
```

**On Successful Scan:**
- Fetch product by barcode
- Display product card with stock info
- Quick actions: View Details, Record Movement, Reorder

**API:** `GET /api/salons/{salonId}/inventory/products?barcode={code}`

---

#### 8.4 Purchase Orders
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Purchase Orders       │
│  [+ Create PO]                  │
├─────────────────────────────────┤
│  [Draft] [Approved] [Received]  │
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ PO #PO-046               │  │
│  │ ABC Suppliers            │  │
│  │ Draft • Nov 10           │  │
│  │ 3 items • ₹12,500        │  │
│  │ [View] [Approve]         │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ PO #PO-045               │  │
│  │ XYZ Distributors         │  │
│  │ Approved • Nov 8         │  │
│  │ 5 items • ₹18,000        │  │
│  │ [View] [Mark Received]   │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**Create PO Flow:**
1. Select vendor
2. Add products (search or scan)
3. Enter quantities and prices
4. Review totals (subtotal, tax, shipping, discount)
5. Save as draft OR Submit for approval

**API:**
- `GET /api/salons/{salonId}/inventory/purchase-orders`
- `POST /api/salons/{salonId}/inventory/purchase-orders`
- `PUT /api/salons/{salonId}/inventory/purchase-orders/{id}/approve`
- `POST /api/salons/{salonId}/inventory/purchase-orders/{id}/receive`

---

### 9. Communication & Marketing

#### 9.1 Communication Dashboard
**Navigation:** Side Menu → Communications

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Communications        │
│  [+ New Campaign]               │
├─────────────────────────────────┤
│  This Month's Performance       │
│  ┌────────┐ ┌────────┐         │
│  │  1,250 │ │  65%   │         │
│  │Messages│ │Open Rate│         │
│  └────────┘ └────────┘         │
├─────────────────────────────────┤
│  [Campaigns] [Templates]        │
│  [Segments] [Analytics]         │ ← Tabs
├─────────────────────────────────┤
│  Active Campaigns               │
│  ┌──────────────────────────┐  │
│  │ Weekend Special Offer    │  │
│  │ Email • 500 sent         │  │
│  │ 320 opened (64%)         │  │
│  │ Status: Active           │  │
│  │ [View Details]           │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ Birthday Wishes          │  │
│  │ SMS • Automated          │  │
│  │ 45 sent this month       │  │
│  │ Status: Running          │  │
│  │ [Pause] [Edit]           │  │
│  └──────────────────────────┘  │
│  ...                            │
├─────────────────────────────────┤
│  Quick Send                     │
│  [Send to All Customers]        │
│  [Send to Segment]              │
│  [Schedule Message]             │
└─────────────────────────────────┘
```

**API:**
- `GET /api/salons/{salonId}/communication-campaigns`
- `GET /api/salons/{salonId}/communication-dashboard/metrics`

---

#### 9.2 Create Campaign
**Layout (Simplified for mobile):**
```
┌─────────────────────────────────┐
│  [← Back] New Campaign          │
│  Step 1 of 4                    │
├─────────────────────────────────┤
│  Campaign Type                  │
│  ┌─────────┐ ┌─────────┐       │
│  │  Email  │ │   SMS   │       │
│  └─────────┘ └─────────┘       │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Campaign Name           │   │
│  └─────────────────────────┘   │
│                                 │
│  Audience                       │
│  ○ All Customers                │
│  ○ Segment: VIP Customers       │
│  ○ Segment: Inactive (>3mo)     │
│  ○ Custom Selection             │
│                                 │
│  [Next: Compose Message]        │
└─────────────────────────────────┘
```

**Step 2: Compose**
- Use template OR write custom
- Preview on device
- Add personalization (name, last service)

**Step 3: Schedule**
- Send now OR schedule
- Date/time picker
- Timezone selection

**Step 4: Review & Send**
- Audience size
- Cost estimate (for SMS)
- Preview
- Confirm & send

**API:**
- `POST /api/salons/{salonId}/communication-campaigns`

---

### 10. Reports & Analytics

#### 10.1 Reports Hub
**Navigation:** Dashboard → View Reports OR Side Menu → Reports

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Reports               │
│  [This Month ▼] [Export All]    │
├─────────────────────────────────┤
│  Quick Reports                  │
│  ┌──────────────────────────┐  │
│  │ 📊 Business Summary      │  │
│  │ Revenue, bookings, growth│  │
│  │ [View Report]            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 👥 Staff Performance     │  │
│  │ Bookings & revenue/staff │  │
│  │ [View Report]            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 💰 Financial Report      │  │
│  │ P&L, expenses, profit    │  │
│  │ [View Report]            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🛍️ Service Performance   │  │
│  │ Top services, revenue    │  │
│  │ [View Report]            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 👤 Customer Insights     │  │
│  │ Retention, segments      │  │
│  │ [View Report]            │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 📦 Inventory Report      │  │
│  │ Stock levels, usage      │  │
│  │ [View Report]            │  │
│  └──────────────────────────┘  │
├─────────────────────────────────┤
│  Custom Report Builder          │
│  [Create Custom Report]         │
└─────────────────────────────────┘
```

---

#### 10.2 Business Summary Report (Example)
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Business Summary      │
│  November 2025 [Export PDF]     │
├─────────────────────────────────┤
│  Revenue                        │
│  ₹1,24,500                      │
│  ▲ 18% from last month          │
│  [Line Chart - 30 days]         │
├─────────────────────────────────┤
│  Bookings                       │
│  Total: 85 | Avg/day: 2.8       │
│  [Bar Chart - by day of week]   │
│                                 │
│  Peak Hours                     │
│  • 11:00 AM - 1:00 PM (35%)     │
│  • 4:00 PM - 6:00 PM (28%)      │
├─────────────────────────────────┤
│  Top Services                   │
│  1. Haircut - 42 bookings       │
│  2. Hair Coloring - 18          │
│  3. Facial - 12                 │
│  4. Massage - 10                │
│  5. Manicure - 8                │
├─────────────────────────────────┤
│  Top Staff                      │
│  1. Priya Sharma - ₹45,200      │
│  2. Amit Singh - ₹38,100        │
│  3. Ravi Kumar - ₹28,500        │
├─────────────────────────────────┤
│  Customer Metrics               │
│  New Customers: 12              │
│  Repeat Rate: 68%               │
│  Avg Spend: ₹1,465              │
├─────────────────────────────────┤
│  [Share Report] [Schedule]      │
└─────────────────────────────────┘
```

**API:**
- `GET /api/salons/{salonId}/reports/business-summary?period=month`

---

### 11. Settings & Configuration

#### 11.1 Settings Menu
**Navigation:** Profile Icon → Settings OR Side Menu → Settings

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Settings              │
├─────────────────────────────────┤
│  Business Profile               │
│  • Business Information     →   │
│  • Location & Contact       →   │
│  • Operating Hours          →   │
│  • Gallery                  →   │
│                                 │
│  Services & Pricing             │
│  • Manage Services          →   │
│  • Service Categories       →   │
│  • Packages & Combos        →   │
│                                 │
│  Booking Settings               │
│  • Online Booking           →   │
│  • Cancellation Policy      →   │
│  • Deposit Settings         →   │
│  • Buffer Times             →   │
│                                 │
│  Payment Settings               │
│  • Payment Methods          →   │
│  • Razorpay Integration     →   │
│  • Payout Account           →   │
│                                 │
│  Notifications                  │
│  • Push Notifications       →   │
│  • Email Alerts             →   │
│  • SMS Alerts               →   │
│                                 │
│  Staff & Permissions            │
│  • Manage Staff Access      →   │
│  • Roles & Permissions      →   │
│                                 │
│  Account Settings               │
│  • Change Password          →   │
│  • Security                 →   │
│  • Linked Accounts          →   │
│                                 │
│  Help & Support                 │
│  • Help Center              →   │
│  • Contact Support          →   │
│  • Submit Feedback          →   │
│                                 │
│  Legal                          │
│  • Terms of Service         →   │
│  • Privacy Policy           →   │
│  • About                    →   │
│                                 │
│  [Logout]                       │
└─────────────────────────────────┘
```

---

#### 11.2 Business Information Edit
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Business Info [Save]  │
├─────────────────────────────────┤
│  [Upload Logo/Photo]            │
│  Tap to change                  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Business Name           │   │
│  └─────────────────────────┘   │
│                                 │
│  Business Type                  │
│  [Dropdown: Hair Salon, Spa...] │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Description             │   │
│  │ (200 characters)        │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Website URL             │   │
│  └─────────────────────────┘   │
│                                 │
│  Social Media                   │
│  ┌─────────────────────────┐   │
│  │ Instagram Handle        │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Facebook Page           │   │
│  └─────────────────────────┘   │
│                                 │
│  [Save Changes]                 │
└─────────────────────────────────┘
```

**API:** `PUT /api/salons/{salonId}`

---

## Navigation Structure

### Bottom Navigation (4-5 tabs)

```
┌───────────────────────────────────────────┐
│  Home  Calendar  Customers  Reports  More │
│   🏠      📅        👥        📊      ⋮   │
└───────────────────────────────────────────┘
```

**Tab 1: Home** (🏠)
- Dashboard with quick stats
- Today's schedule preview
- Quick actions

**Tab 2: Calendar** (📅)
- Full calendar view (month/week/day)
- Booking management
- Staff schedules

**Tab 3: Customers** (👥)
- Customer list
- Search & filter
- Customer profiles

**Tab 4: Reports** (📊)
- Business analytics
- Performance metrics
- Financial reports

**Tab 5: More** (⋮)
- Settings
- Staff management
- Inventory
- Communications
- Help & Support

---

### Side Menu (Hamburger - Alternative)

If using drawer navigation instead of 5 tabs:

```
┌─────────────────────────┐
│ [Photo] Salon Name      │
│ owner@email.com         │
├─────────────────────────┤
│ 🏠 Dashboard            │
│ 📅 Calendar             │
│ 📋 Bookings             │
│ 👥 Customers            │
│ 🧑‍💼 Staff               │
│ 💰 Financials           │
│ 📦 Inventory            │
│ 💌 Communications       │
│ 📊 Reports              │
│ ⚙️  Settings            │
├─────────────────────────┤
│ 🏢 Switch Location      │
│ ❓ Help & Support       │
│ 🚪 Logout               │
└─────────────────────────┘
```

---

## Technical Requirements

### Minimum OS Versions
- iOS: 13.0+
- Android: 8.0 (API level 26)+

### Permissions Required

**Essential:**
- Internet - API calls
- Camera - Profile photos, barcode scanning, receipts
- Storage - Cache reports, media

**Optional:**
- Notifications - Booking alerts, reminders
- Calendar - Sync with device calendar
- Phone - Quick dial customers

---

## API Integration Points

### Base URL
```
Production: https://salonhub.app/api
Staging: https://staging.salonhub.app/api
```

### Authentication
```
Authorization: Bearer <session_token>
Content-Type: application/json
```

### Key Endpoints Summary

**Business Auth:**
- `POST /api/auth/login` (loginType: 'business')
- `POST /api/auth/register` (userType: 'business')
- `GET /api/auth/user` - Get profile with salons

**Salon Management:**
- `GET /api/my/salons` - List owned salons
- `GET /api/salons/{id}` - Salon details
- `PUT /api/salons/{id}` - Update salon
- `GET /api/salons/{id}/dashboard-metrics`

**Bookings:**
- `GET /api/salons/{salonId}/bookings`
- `GET /api/salons/{salonId}/bookings/{id}`
- `POST /api/bookings` - Create manual booking
- `PUT /api/salons/{salonId}/bookings/{id}`
- `DELETE /api/salons/{salonId}/bookings/{id}` - Cancel

**Customers:**
- `GET /api/salons/{salonId}/customers`
- `GET /api/customers/{customerId}`
- `POST /api/customers/{customerId}/notes`

**Staff:**
- `GET /api/salons/{salonId}/staff/manage`
- `POST /api/salons/{salonId}/staff`
- `PUT /api/salons/{salonId}/staff/{staffId}`
- `GET /api/salons/{salonId}/staff/{staffId}/performance`

**Services:**
- `GET /api/salons/{salonId}/services/manage`
- `POST /api/salons/{salonId}/services`
- `PUT /api/salons/{salonId}/services/{serviceId}`
- `DELETE /api/salons/{salonId}/services/{serviceId}`

**Financial:**
- `GET /api/salons/{salonId}/financial-analytics/kpis`
- `GET /api/salons/{salonId}/profit-loss/{start}/{end}`
- `GET /api/salons/{salonId}/expenses`
- `POST /api/salons/{salonId}/expenses`
- `GET /api/salons/{salonId}/commissions`
- `POST /api/salons/{salonId}/commissions/pay-bulk`

**Inventory:**
- `GET /api/salons/{salonId}/inventory/products`
- `GET /api/salons/{salonId}/inventory/low-stock`
- `GET /api/salons/{salonId}/inventory/vendors`
- `GET /api/salons/{salonId}/inventory/purchase-orders`
- `POST /api/salons/{salonId}/inventory/products`
- `POST /api/salons/{salonId}/inventory/stock-movements`

**Communications:**
- `GET /api/salons/{salonId}/communication-campaigns`
- `POST /api/salons/{salonId}/communication-campaigns`
- `GET /api/salons/{salonId}/message-templates`
- `POST /api/salons/{salonId}/message-templates`

**Reports:**
- `GET /api/salons/{salonId}/reports/business-summary`
- `GET /api/salons/{salonId}/reports/staff-performance`

---

## Offline Functionality

### Critical Data to Cache (SQLite)
- Today's schedule (bookings)
- Customer contact list
- Staff list
- Service catalog
- Recent transactions
- Pending expense approvals

### Sync Strategy
- Queue offline actions (booking updates, expense entries)
- Auto-sync when connection restored
- Conflict resolution: Server wins for bookings
- Show "Offline Mode" indicator

---

## Push Notifications

### Notification Types

**Real-Time:**
1. New Booking Received (Immediate)
2. Booking Cancelled by Customer (Immediate)
3. Payment Received (Immediate)

**Reminders:**
1. Upcoming Appointment (30 min before)
2. Staff Absence Alert (Day before)
3. Low Stock Alert (Daily digest)

**Business Insights:**
1. Daily Summary (9:00 AM)
2. Weekly Performance Report (Monday 10:00 AM)
3. Monthly Financial Summary (1st of month)

**Engagement:**
1. Incomplete Profile Setup (3 days after registration)
2. No Bookings Today (11:00 AM if empty)
3. New Feature Announcement

### Implementation
- Firebase Cloud Messaging
- Deep links to relevant screens
- Rich notifications with action buttons
- Notification preferences in settings

---

## Analytics & Tracking

### Business Metrics to Track

**User Behavior:**
- Session frequency
- Screen time per feature
- Feature adoption rate
- Quick action usage

**Business Operations:**
- Bookings created (manual vs customer)
- Booking modifications
- Response time to new bookings
- Cancellation rate

**Financial:**
- Revenue per day/week/month
- Payment method preferences
- Expense entries
- Commission payments

**Engagement:**
- Communication campaign sends
- Report exports
- Staff profile updates
- Customer profile views

### Tools
- Firebase Analytics
- Mixpanel (custom funnels)
- Crashlytics

---

## Security Requirements

### Data Protection
- Encrypt sensitive data at rest
- Secure session tokens in Keychain/Keystore
- HTTPS only for API calls
- Certificate pinning

### Role-Based Access
- Owner: Full access
- Manager: Limited financial access
- Staff: View own schedule only (future)

### Payment Security
- PCI DSS compliance via Razorpay
- No storage of card details
- Secure webhook verification

---

## Performance Targets

- App Launch: < 2s
- Dashboard Load: < 1.5s
- Booking Creation: < 5s
- Chart Rendering: < 1s
- API Response (p95): < 500ms
- Crash-Free Rate: > 99.5%

---

## Accessibility

- VoiceOver / TalkBack support
- Minimum touch targets: 44x44 pts (iOS) / 48x48 dp (Android)
- Color contrast: 4.5:1 (WCAG AA)
- Text scaling support
- Screen reader labels

---

## Localization

**Languages (Phase 1):**
- English (Default)
- Hindi

**Currency:** INR (₹)
**Date Format:** DD/MM/YYYY
**Time Format:** 12-hour with AM/PM

---

## Testing Strategy

### Unit Tests
- Business logic calculations
- Revenue computations
- Commission calculations

### Integration Tests
- API integration
- Booking flow
- Payment processing

### UI Tests
- Critical workflows
- Dashboard loading
- Booking management

### Manual Testing
- Device compatibility
- Network conditions
- Accessibility audit

---

## Release Strategy

### Beta Testing
- Internal alpha: 2 weeks (salon owners team)
- Closed beta: 20 salons (6 weeks)
- Open beta: 100 salons (4 weeks)

### Phased Rollout
- Week 1: 10% of partner salons
- Week 2: 30%
- Week 3: 60%
- Week 4: 100%

---

## Appendix

### Screen Priority Matrix

| Screen | Priority | Complexity | Estimated Dev Time |
|--------|----------|------------|-------------------|
| Splash & Auth | P0 | Medium | 5 days |
| Dashboard | P0 | Very High | 12 days |
| Calendar View | P0 | Very High | 15 days |
| Booking Details | P0 | High | 5 days |
| Booking Creation | P0 | High | 8 days |
| Customer List | P1 | Medium | 4 days |
| Customer Profile | P1 | Medium | 5 days |
| Staff List | P1 | Low | 3 days |
| Staff Profile | P1 | Medium | 5 days |
| Financial Overview | P1 | High | 8 days |
| Expense Tracking | P1 | Medium | 5 days |
| Inventory Dashboard | P1 | High | 10 days |
| Product Management | P1 | High | 8 days |
| Barcode Scanner | P2 | Medium | 4 days |
| Purchase Orders | P2 | High | 8 days |
| Communication Hub | P2 | High | 10 days |
| Reports | P2 | Very High | 12 days |
| Settings | P1 | Medium | 5 days |

**Total Estimated Development: 16-18 weeks (with 2-person team)**

---

### Third-Party Dependencies

```json
{
  "core": [
    "react-native / flutter",
    "react-navigation / go_router",
    "redux-toolkit / bloc",
    "axios / dio"
  ],
  "ui": [
    "react-native-paper / material3",
    "victory-native / fl_chart",
    "lottie-react-native / lottie-flutter"
  ],
  "business": [
    "react-native-calendars / table_calendar",
    "react-native-chart-kit / syncfusion_flutter_charts"
  ],
  "barcode": [
    "react-native-camera / mobile_scanner",
    "react-native-vision-camera"
  ],
  "pdf": [
    "react-native-pdf / pdf_flutter",
    "react-native-share / share_plus"
  ],
  "payments": [
    "razorpay-react-native-sdk / razorpay_flutter"
  ],
  "auth": [
    "firebase-auth / firebase_auth",
    "react-native-keychain / flutter_secure_storage"
  ],
  "analytics": [
    "firebase-analytics",
    "mixpanel-react-native"
  ],
  "notifications": [
    "firebase-messaging / firebase_messaging",
    "react-native-push-notification"
  ]
}
```

---

## Conclusion

The SalonHub Partner Mobile App provides salon owners with a comprehensive, mobile-first business management solution. The specifications prioritize real-time operations, quick access to critical information, and streamlined workflows for on-the-go management.

**Key Differentiators:**
1. Real-time booking notifications and management
2. Complete financial tracking and reporting
3. Integrated inventory management with barcode scanning
4. Staff performance analytics
5. Customer communication tools
6. Offline-first architecture for reliability

**Next Steps:**
1. Design mockups for all core screens
2. Create detailed API documentation
3. Set up development environment
4. Sprint planning (2-week sprints)
5. Develop MVP (P0 + P1 features)
6. Beta testing with partner salons
7. Iterate based on feedback
8. Launch

---

**Document Owner:** Product & Engineering Team  
**Last Updated:** November 19, 2025  
**Version:** 1.0
