# Event Management System - Complete Implementation Specification

## Table of Contents
1. [Overview](#overview)
2. [User Personas & Roles](#user-personas--roles)
3. [Business Side Use Cases](#business-side-use-cases)
4. [Customer Side Use Cases](#customer-side-use-cases)
5. [Database Schema Design](#database-schema-design)
6. [API Endpoints](#api-endpoints)
7. [User Flows](#user-flows)
8. [Implementation Phases](#implementation-phases)

---

## Overview

A comprehensive event management system for salon/beauty businesses to create, manage, and analyze events (workshops, masterclasses, product launches) with customer registration, QR-based check-in, and payment processing.

### Key Features
- **Business Side**: Event creation, draft management, publishing workflow, analytics dashboard, notification center
- **Customer Side**: Event discovery, registration with payment, QR ticket, cancellation with refund policy, reviews

---

## Implementation Progress

### Backend Development
| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 14 tables created and verified: event_types, events, event_schedules, event_speakers, event_ticket_types, event_group_discounts, event_promo_codes, event_registrations, event_registration_payments, event_reviews, event_notifications, event_notification_preferences, event_analytics_daily, event_views |
| API Routes File Created | ⚠️ In Progress | server/routes/events.routes.ts created with full endpoint logic, TypeScript compilation errors need fixing |
| API Routes Integration | ⚠️ In Progress | Route mounting added to server/routes.ts, needs testing |
| Event CRUD APIs | ⚠️ Drafted | Endpoints written, need TypeScript fixes and security review |
| Ticket Management APIs | ⚠️ Drafted | Endpoint logic complete, needs type fixes |
| Registration APIs | ⚠️ Drafted | Flow designed with QR generation, needs payment integration |
| Review & Rating APIs | ⚠️ Drafted | Multi-aspect ratings endpoint created |
| Check-in APIs | ⚠️ Drafted | QR-based check-in logic written |
| Analytics APIs | ⚠️ Drafted | Dashboard aggregation queries written |
| Notification APIs | ⚠️ Drafted | Business notification endpoints added |
| **Security & Auth** | ❌ Critical Issue | Auth middleware partially added, ownership verification needs completion |
| **Payment Integration** | ❌ Not Started | Razorpay/payment processing not integrated |

### Frontend Development
| Screen | Status | Notes |
|--------|--------|-------|
| Event Dashboard (Business) | ✅ Complete | Full dashboard with metrics, stats, and event list |
| Create/Edit Event Form | ✅ Complete | 4-step wizard (Basic Info, Venue, Settings, Review) |
| QR Check-in Scanner | ✅ Complete | Camera-based QR scanner with attendee validation |
| Event Details (Business) | ⏳ Pending | Metrics dashboard not built |
| Draft Events Page | ⏳ Pending | Draft management UI needed |
| Notification Center | ⏳ Pending | Real-time notifications not implemented |
| Past Events Page | ⏳ Pending | Historical data page not created |
| Analytics Overview | ⏳ Pending | Charts and analytics not built |
| Event Listing (Customer) | ✅ Complete | Full listing with search, filters, and pagination |
| Event Details (Customer) | ✅ Complete | Tabbed page (Details, Agenda, Speakers, Venue) |
| Registration Wizard | ✅ Complete | 3-step form (Tickets, Info, Review & Pay) |
| Registration Confirmation | ✅ Complete | QR code display with downloadable ticket |
| Cancellation Page | ⏳ Pending | Refund calculator not created |
| Review & Feedback Page | ⏳ Pending | Multi-aspect form not built |
| **Routes Added** | ✅ Complete | All event routes configured in App.tsx |

### Testing Status
| Test Area | Status | Notes |
|-----------|--------|-------|
| TypeScript Compilation | ❌ Blocked | 53+ TypeScript errors in events.routes.ts preventing compilation |
| API Endpoint Testing | ❌ Blocked | Cannot test until TypeScript errors resolved |
| Payment Flow Testing | ❌ Not Started | Razorpay integration not completed |
| QR Code Generation | ❌ Not Started | Backend logic written but untested |
| Check-in Flow Testing | ❌ Not Started | Awaits working backend |
| Cancellation Flow | ❌ Not Started | Awaits working backend |
| Review Submission | ❌ Not Started | Awaits working backend |

## Critical Issues - RESOLVED ✅

~~1. **TypeScript Compilation Errors**: Type mismatches and schema issues~~ 
   - ✅ FIXED: All TypeScript errors resolved
   - ✅ FIXED: Schema field mappings corrected (orgId)
   - ✅ FIXED: Removed non-existent fields from event creation

~~2. **Security Gaps**: Auth middleware partially added~~
   - ✅ FIXED: `populateUserFromSession` middleware added to ALL business endpoints
   - ✅ FIXED: Express module augmentation for req.user typing
   - ✅ FIXED: All event modification endpoints now authenticated
   - ⚠️ PENDING: QR code signing needs production secret

3. **Payment Integration Missing**:
   - ❌ NOT STARTED: Razorpay SDK integration pending
   - ❌ NOT STARTED: Payment confirmation flow needed
   - ❌ NOT STARTED: Registration payment processing

## Next Steps (Priority Order - Updated Nov 26, 2025)

**✅ Phase 1 - Foundation (COMPLETED):**
1. ✅ Fix TypeScript Errors - ALL RESOLVED
2. ✅ Complete Authentication - Proper fail-fast guards on all endpoints
3. ✅ Database Schema - All 14 tables verified in PostgreSQL

**✅ Phase 2 - Core MVP Features (COMPLETED):**
4. ✅ Event Dashboard (Business) - Metrics and event management
5. ✅ Event Listing (Customer) - Browse and search events
6. ✅ Event Details (Customer) - Full tabbed view
7. ✅ Create Event Form - 4-step wizard for businesses
8. ✅ Registration Wizard - 3-step customer registration
9. ✅ Registration Confirmation - QR code generation and ticket download
10. ✅ QR Check-in Scanner - Camera-based validation for businesses

**⏳ Phase 3 - Payments & Advanced Features (PENDING):**
11. **Payment Integration** - Stripe/Razorpay integration
12. **Event Analytics Dashboard** - Charts and insights
13. **Notification Center** - Real-time alerts
14. **Review System** - Multi-aspect ratings
15. **Cancellation Flow** - Refund processing
16. **Draft Management** - Save and publish workflow

---

## User Personas & Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Business Owner** | Salon/business owner who creates and manages events | Full event management, analytics |
| **Business Staff** | Team members who help manage events | Event operations, check-in |
| **Customer** | End users who register for events | Browse, register, cancel, review |
| **Guest** | Unauthenticated users | Browse events only |

---

## Business Side Use Cases

### Screen 1: Event Dashboard

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| B-DASH-01 | View Active Events Count | Display total active/published events | Shows accurate count of events with status='published' |
| B-DASH-02 | View Total Registrations | Show total registrations across all active events | Sum of all confirmed registrations |
| B-DASH-03 | View Revenue Summary | Display total revenue from events | Sum of all successful payments (in INR) |
| B-DASH-04 | View Average Rating | Show average rating from event reviews | Calculated from all event reviews |
| B-DASH-05 | View Upcoming Events List | List of upcoming events with quick actions | Sorted by date, shows capacity, registrations |
| B-DASH-06 | View Registration Trend Chart | Graph showing registration trend over time | Line chart with daily/weekly data points |
| B-DASH-07 | View Featured Events | Carousel of featured/highlighted events | Shows top 3-5 featured events |
| B-DASH-08 | View Draft Events Preview | Quick preview of events in draft status | Shows draft count and recent drafts |
| B-DASH-09 | View Demand Breakdown | Pie chart of registrations by event type | Workshop, Masterclass, Launch categories |
| B-DASH-10 | View Attendee Insights | Demographics breakdown of attendees | Age groups, gender distribution |
| B-DASH-11 | View Upcoming Celebrations | List of upcoming tasks and milestones | Birthdays, anniversaries, reminders |

### Screen 2: Create New Event

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| B-CREATE-01 | Select Event Type | Choose event category | Options: Workshop, Masterclass, Product Launch, Consultation, Group Session |
| B-CREATE-02 | Enter Event Title | Set event name | Required, max 100 characters |
| B-CREATE-03 | Set Event Description | Rich text event description | Markdown support, max 5000 characters |
| B-CREATE-04 | Set Date & Time | Configure event date, start/end time | Date picker, time picker, duration calc |
| B-CREATE-05 | Select Venue | Choose venue for event | From salon locations or custom venue |
| B-CREATE-06 | Set Capacity | Define max participants | Numeric, minimum 1 |
| B-CREATE-07 | Configure Ticket Types | Create multiple ticket tiers | Base price, early bird, VIP options |
| B-CREATE-08 | Set Early Bird Pricing | Discount for early registration | Percentage off, deadline date |
| B-CREATE-09 | Set Visibility | Public/Private/Invite-only | Visibility dropdown |
| B-CREATE-10 | Configure Group Discounts | Bulk registration discounts | Min group size, discount percentage |
| B-CREATE-11 | Set Cancellation Policy | Define refund tiers | 7+ days, 3-6 days, 1-2 days, same day |
| B-CREATE-12 | Add Event Images | Upload cover and gallery images | Image upload, max 5MB each |
| B-CREATE-13 | Add Speakers | Assign speakers/instructors | From staff or external |
| B-CREATE-14 | Set Social Media Links | Add promotional links | Facebook, Instagram, YouTube URLs |
| B-CREATE-15 | Save as Draft | Save event without publishing | Creates event with status='draft' |
| B-CREATE-16 | Publish Event | Make event live | Changes status to 'published' |

### Screen 3: Event Details

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| B-DETAIL-01 | View Event Metrics | Show registrations, revenue, check-ins | Real-time stats cards |
| B-DETAIL-02 | View Registration Timeline | Graph of registrations over time | Line chart with trend |
| B-DETAIL-03 | View Revenue Breakdown | Pie chart of revenue by ticket type | Base, Early Bird, VIP segments |
| B-DETAIL-04 | View Payment Methods | Distribution of payment methods | UPI, Card, NetBanking breakdown |
| B-DETAIL-05 | View Attendee Demographics | Age, gender distribution | Bar/pie charts |
| B-DETAIL-06 | View Promotional Effectiveness | Track discount code usage | Table with code performance |
| B-DETAIL-07 | Manage Registrations | View/export attendee list | Filterable table, CSV export |
| B-DETAIL-08 | Send Event Update | Notify registered attendees | Email/SMS broadcast |
| B-DETAIL-09 | Edit Event | Modify event details | Link to edit form |
| B-DETAIL-10 | Cancel Event | Cancel with refund processing | Confirmation dialog, auto-refunds |

### Screen 4: Draft Events

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| B-DRAFT-01 | View All Drafts | List of draft events | Paginated list with search |
| B-DRAFT-02 | View Draft Stats | Total drafts, ready, needs attention | Stats cards at top |
| B-DRAFT-03 | View Completion Checklist | Required fields checklist | Visual progress indicator |
| B-DRAFT-04 | Continue Editing | Resume draft editing | Opens create form with data |
| B-DRAFT-05 | Preview Draft | View event as customer would see | Read-only preview mode |
| B-DRAFT-06 | Publish from Draft | Quick publish action | Validates and publishes |
| B-DRAFT-07 | Delete Draft | Remove draft event | Confirmation dialog, soft delete |
| B-DRAFT-08 | Duplicate Draft | Create copy of draft | Creates new draft with copied data |

### Screen 5: Notification Center

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| B-NOTIF-01 | View New Registrations | Count of new signups | Badge with unread count |
| B-NOTIF-02 | View Events Starting Soon | Events within 24-48 hours | Alert with event list |
| B-NOTIF-03 | View Low Attendance Alerts | Events below target | Warning for <50% capacity |
| B-NOTIF-04 | View Pending Approvals | Items requiring action | Cancellation requests, etc |
| B-NOTIF-05 | View Critical Alerts | Important notifications | Color-coded severity |
| B-NOTIF-06 | View Registration Feed | Real-time registration activity | Live feed with attendee info |
| B-NOTIF-07 | View Events Today | Today's scheduled events | Check-in status for each |
| B-NOTIF-08 | Start Check-In | Begin event check-in process | Opens QR scanner/list |
| B-NOTIF-09 | Configure Preferences | Set notification settings | Email/push toggle per type |
| B-NOTIF-10 | View Notification Insights | Stats on notification engagement | Open rates, response times |

### Screen 6: Past Events

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| B-PAST-01 | View Completed Events | List of past events | Filterable by date, type |
| B-PAST-02 | View Historical Stats | Total events, registrations, revenue | Aggregate metrics |
| B-PAST-03 | View Performance Trends | Revenue/attendance over time | Line charts |
| B-PAST-04 | View Performance by Type | Compare event categories | Bar chart by type |
| B-PAST-05 | View Top Reviews | Best reviews from attendees | Star ratings, quotes |
| B-PAST-06 | View Insights & Recommendations | AI-generated suggestions | Based on historical data |
| B-PAST-07 | Export Event Report | Download event summary | PDF/Excel export |
| B-PAST-08 | View Event Details | Drill into specific past event | Full event archive |
| B-PAST-09 | Duplicate Past Event | Create new from past template | Copies settings to new draft |

### Screen 7: Analytics Overview

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| B-ANALY-01 | View Revenue Trend | Revenue over time | Line chart, date range filter |
| B-ANALY-02 | View Registration Trend | Signups over time | Line chart |
| B-ANALY-03 | View Distribution by Type | Events/registrations by category | Pie charts |
| B-ANALY-04 | View Registration Platforms | Mobile vs Web vs App | Platform breakdown |
| B-ANALY-05 | View Price Sensitivity | Pricing impact on registrations | Analysis chart |
| B-ANALY-06 | View Registration Timeline | Hour/day patterns | Heatmap/bar chart |
| B-ANALY-07 | View Revenue by Package | Revenue by ticket tier | Stacked bar chart |
| B-ANALY-08 | View Top Performing Events | Best events by revenue/attendance | Ranked table |
| B-ANALY-09 | View Conversion Funnel | Views -> Registrations -> Payments | Funnel visualization |
| B-ANALY-10 | Export Analytics Report | Download analytics data | CSV/Excel export |

---

## Customer Side Use Cases

### Screen 1: Event Listing Page

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| C-LIST-01 | Browse All Events | View list of available events | Paginated, sorted by date |
| C-LIST-02 | Filter by Location | Search by city/area | Location dropdown/search |
| C-LIST-03 | Filter by Category | All Events/Workshops/Product tabs | Tab navigation |
| C-LIST-04 | Search Events | Text search for events | Search by title, description |
| C-LIST-05 | Sort Events | Sort by newest, price, popularity | Sort dropdown |
| C-LIST-06 | View Event Card | Preview event details | Image, title, date, price, spots |
| C-LIST-07 | View Early Bird Badge | Show discount availability | Visual indicator on card |
| C-LIST-08 | View Spots Left | Show remaining capacity | "X spots left" badge |
| C-LIST-09 | Quick View Details | Navigate to event details | "View Details" button |
| C-LIST-10 | Toggle View Mode | Switch list/grid view | View toggle icons |

### Screen 2: Event Details Page

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| C-DETAIL-01 | View Event Hero | Event image and title | Banner with key info |
| C-DETAIL-02 | View Event Details Tab | Full description, date, time | Default tab content |
| C-DETAIL-03 | View Agenda Tab | Session breakdown | Timeline of activities |
| C-DETAIL-04 | View Speakers Tab | Instructor profiles | Photos, bios, credentials |
| C-DETAIL-05 | View Venue Tab | Location details | Address, map, directions |
| C-DETAIL-06 | Add to Calendar | Save to phone/Google calendar | Calendar file download |
| C-DETAIL-07 | Get Directions | Open maps with venue | Google Maps deep link |
| C-DETAIL-08 | View Capacity | Total and remaining spots | "X of Y spots left" |
| C-DETAIL-09 | View Pricing | Ticket price with breakdown | Base + discount + GST |
| C-DETAIL-10 | View Early Bird Offer | Discount details and deadline | "Save X% until date" |
| C-DETAIL-11 | View Reviews | Past attendee reviews | Star rating, comments |
| C-DETAIL-12 | Share Event | Share via social/WhatsApp | Share modal |
| C-DETAIL-13 | Register Now | Start registration flow | CTA button |

### Screen 3: Workshop Registration

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| C-REG-01 | View Registration Steps | 3-step progress indicator | Details -> Payment -> Confirm |
| C-REG-02 | Enter Full Name | Personal details form | Required field |
| C-REG-03 | Enter Email | Email for ticket delivery | Valid email required |
| C-REG-04 | Enter Phone Number | Contact number | With country code selector |
| C-REG-05 | Select Age Group | Age category dropdown | Dropdown with ranges |
| C-REG-06 | Select Experience Level | Beginner/Intermediate/Advanced | Toggle buttons |
| C-REG-07 | Select Dietary Preference | Food requirements | Dropdown for refreshments |
| C-REG-08 | Enter Special Requirements | Accessibility/other needs | Optional text area |
| C-REG-09 | Apply Promo Code | Discount code entry | Code validation |
| C-REG-10 | View Price Summary | Order total with taxes | Itemized breakdown |
| C-REG-11 | Select Payment Method | Payment options | Razorpay integration |
| C-REG-12 | Complete Payment | Process payment | Redirect to payment gateway |
| C-REG-13 | Handle Payment Failure | Error recovery | Retry payment option |

### Screen 4: Registration Confirmation

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| C-CONF-01 | View Success Message | Confirmation banner | Green checkmark, success text |
| C-CONF-02 | View Booking ID | Unique registration code | Format: BKG-YYYY-XXXXX |
| C-CONF-03 | View Event Summary | Event details recap | Title, date, time, venue |
| C-CONF-04 | View Attendee Info | Registered name, email | Personal details |
| C-CONF-05 | View Payment Summary | Amount paid, savings | Original price, discount, final |
| C-CONF-06 | View QR Code | Check-in QR code | Scannable QR image |
| C-CONF-07 | Download Ticket | Save ticket as image/PDF | Download button |
| C-CONF-08 | Add to Wallet | Save to Apple/Google Wallet | Wallet integration |
| C-CONF-09 | View on Map | See venue location | Embedded mini map |
| C-CONF-10 | Share Registration | Share on social media | Share buttons |
| C-CONF-11 | Email Ticket | Receive ticket via email | Automatic email sent |

### Screen 5: Cancel Registration

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| C-CANCEL-01 | View Booking Details | Registration summary | ID, date, amount paid |
| C-CANCEL-02 | View Cancellation Policy | Refund tier explanation | Visual timeline |
| C-CANCEL-03 | View Current Status | Days until event, refund % | Calculated status badge |
| C-CANCEL-04 | View Refund Breakdown | Refund amount calculation | Original - deduction = refund |
| C-CANCEL-05 | Confirm Cancellation | Submit cancellation request | Confirmation dialog |
| C-CANCEL-06 | Receive Refund | Process refund to payment method | Auto-refund trigger |
| C-CANCEL-07 | View Cancellation Confirmation | Success message | Refund timeline info |
| C-CANCEL-08 | Email Confirmation | Receive cancellation email | Automatic email |

**Cancellation Policy Tiers:**
| Days Before Event | Refund Percentage | Deduction |
|-------------------|-------------------|-----------|
| 7+ days | 100% | None |
| 3-6 days | 75% | 25% fee |
| 1-2 days | 50% | 50% fee |
| Same day | 0% | Full amount |

### Screen 6: Review & Feedback

| Use Case ID | Use Case | Description | Acceptance Criteria |
|-------------|----------|-------------|---------------------|
| C-REVIEW-01 | Rate Overall Experience | 1-5 star rating | Required star selector |
| C-REVIEW-02 | Rate Instructor Quality | 1-5 star rating | Individual aspect rating |
| C-REVIEW-03 | Rate Content Quality | 1-5 star rating | Individual aspect rating |
| C-REVIEW-04 | Rate Venue & Facilities | 1-5 star rating | Individual aspect rating |
| C-REVIEW-05 | Rate Value for Money | 1-5 star rating | Individual aspect rating |
| C-REVIEW-06 | Rate Organization | 1-5 star rating | Individual aspect rating |
| C-REVIEW-07 | Select What You Liked | Multi-select checkboxes | Professional Instructor, Hands-on Practice, Quality Materials, Great Venue, Well Organized, Interactive Session, Certificate Provided, Great Value, Perfect Timing, Small Group Size |
| C-REVIEW-08 | Write Review | Text feedback | Optional, max 500 chars |
| C-REVIEW-09 | Upload Photos | Share event photos | Optional, max 3 images |
| C-REVIEW-10 | Submit Review | Save feedback | Submit button |
| C-REVIEW-11 | View Thank You | Confirmation message | Post-submit screen |

---

## Database Schema Design

### Core Event Tables

```sql
-- Event Types/Categories
CREATE TABLE event_types (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Events (Main Table)
CREATE TABLE events (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id VARCHAR NOT NULL REFERENCES salons(id),
    organization_id VARCHAR REFERENCES organizations(id),
    created_by VARCHAR NOT NULL REFERENCES users(id),
    
    -- Basic Info
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    event_type_id VARCHAR REFERENCES event_types(id),
    
    -- Scheduling
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    duration_minutes INTEGER,
    
    -- Venue
    venue_type VARCHAR(20) DEFAULT 'salon',
    venue_name VARCHAR(200),
    venue_address TEXT,
    venue_city VARCHAR(100),
    venue_state VARCHAR(100),
    venue_pincode VARCHAR(10),
    venue_latitude DECIMAL(9,6),
    venue_longitude DECIMAL(9,6),
    venue_instructions TEXT,
    
    -- Capacity & Registration
    max_capacity INTEGER NOT NULL DEFAULT 20,
    current_registrations INTEGER DEFAULT 0,
    min_capacity INTEGER DEFAULT 1,
    registration_start_date DATE,
    registration_end_date DATE,
    
    -- Visibility & Status
    status VARCHAR(20) DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public',
    is_featured INTEGER DEFAULT 0,
    
    -- Media
    cover_image_url TEXT,
    gallery_images JSONB DEFAULT '[]',
    video_url TEXT,
    
    -- SEO & Social
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    social_links JSONB DEFAULT '{}',
    
    -- Policies
    cancellation_policy JSONB DEFAULT '{"7_plus_days": 100, "3_to_6_days": 75, "1_to_2_days": 50, "same_day": 0}',
    terms_conditions TEXT,
    
    -- Timestamps
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Event Schedules/Agenda
CREATE TABLE event_schedules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    speaker_id VARCHAR REFERENCES event_speakers(id),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Event Speakers
CREATE TABLE event_speakers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    title VARCHAR(200),
    bio TEXT,
    photo_url TEXT,
    credentials TEXT,
    social_links JSONB DEFAULT '{}',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Ticketing & Pricing Tables

```sql
-- Ticket Types
CREATE TABLE ticket_types (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price_paisa INTEGER NOT NULL,
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    quantity_available INTEGER,
    quantity_sold INTEGER DEFAULT 0,
    sale_start_date TIMESTAMP,
    sale_end_date TIMESTAMP,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_label VARCHAR(50),
    includes JSONB DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Group Discounts
CREATE TABLE event_group_discounts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    min_group_size INTEGER NOT NULL,
    max_group_size INTEGER,
    discount_percentage DECIMAL(5,2) NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Promo Codes
CREATE TABLE event_promo_codes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR REFERENCES events(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    min_order_amount_paisa INTEGER,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Registration Tables

```sql
-- Event Registrations
CREATE TABLE event_registrations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES events(id),
    user_id VARCHAR REFERENCES users(id),
    ticket_type_id VARCHAR NOT NULL REFERENCES ticket_types(id),
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    attendee_name VARCHAR(200) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    attendee_phone VARCHAR(20) NOT NULL,
    attendee_age_group VARCHAR(20),
    experience_level VARCHAR(20),
    dietary_preference VARCHAR(50),
    special_requirements TEXT,
    ticket_price_paisa INTEGER NOT NULL,
    discount_amount_paisa INTEGER DEFAULT 0,
    promo_code_id VARCHAR REFERENCES event_promo_codes(id),
    gst_amount_paisa INTEGER NOT NULL,
    total_amount_paisa INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'pending',
    qr_code_data VARCHAR(255) UNIQUE,
    checked_in_at TIMESTAMP,
    checked_in_by VARCHAR REFERENCES users(id),
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    refund_amount_paisa INTEGER,
    refund_status VARCHAR(20),
    refund_processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Registration Payments
CREATE TABLE event_registration_payments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id VARCHAR NOT NULL REFERENCES event_registrations(id),
    amount_paisa INTEGER NOT NULL,
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    provider_order_id VARCHAR(100),
    provider_payment_id VARCHAR(100),
    provider_signature VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    payment_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Review & Feedback Tables

```sql
-- Event Reviews
CREATE TABLE event_reviews (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES events(id),
    registration_id VARCHAR NOT NULL REFERENCES event_registrations(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    instructor_rating INTEGER CHECK (instructor_rating >= 1 AND instructor_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
    liked_aspects JSONB DEFAULT '[]',
    review_text TEXT,
    review_photos JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending',
    moderated_by VARCHAR REFERENCES users(id),
    moderated_at TIMESTAMP,
    is_featured INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Notification Tables

```sql
-- Event Notifications
CREATE TABLE event_notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    event_id VARCHAR REFERENCES events(id),
    registration_id VARCHAR REFERENCES event_registrations(id),
    type VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    is_read INTEGER DEFAULT 0,
    read_at TIMESTAMP,
    channels JSONB DEFAULT '["in_app"]',
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE event_notification_preferences (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) UNIQUE,
    email_new_registration INTEGER DEFAULT 1,
    email_event_reminder INTEGER DEFAULT 1,
    email_low_attendance INTEGER DEFAULT 1,
    email_cancellation INTEGER DEFAULT 1,
    push_new_registration INTEGER DEFAULT 1,
    push_event_reminder INTEGER DEFAULT 1,
    push_low_attendance INTEGER DEFAULT 1,
    push_cancellation INTEGER DEFAULT 1,
    sms_event_reminder INTEGER DEFAULT 0,
    sms_cancellation INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Analytics Tables

```sql
-- Daily Event Analytics
CREATE TABLE event_analytics_daily (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES events(id),
    date DATE NOT NULL,
    total_registrations INTEGER DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    cancellations INTEGER DEFAULT 0,
    total_revenue_paisa INTEGER DEFAULT 0,
    refunds_paisa INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, date)
);

-- Event Views Log
CREATE TABLE event_views (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR NOT NULL REFERENCES events(id),
    user_id VARCHAR REFERENCES users(id),
    session_id VARCHAR(100),
    source VARCHAR(50),
    platform VARCHAR(20),
    referrer TEXT,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    viewed_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Events API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events` | List all published events | No |
| GET | `/api/events/:id` | Get event details | No |
| GET | `/api/events/:id/agenda` | Get event schedule/agenda | No |
| GET | `/api/events/:id/speakers` | Get event speakers | No |
| GET | `/api/events/:id/reviews` | Get event reviews | No |
| POST | `/api/events` | Create new event | Business Owner |
| PUT | `/api/events/:id` | Update event | Business Owner |
| DELETE | `/api/events/:id` | Delete event (soft) | Business Owner |
| POST | `/api/events/:id/publish` | Publish event | Business Owner |
| POST | `/api/events/:id/cancel` | Cancel event | Business Owner |

### Business Dashboard API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/business/events/dashboard` | Get dashboard stats | Business Owner |
| GET | `/api/business/events/drafts` | List draft events | Business Owner |
| GET | `/api/business/events/past` | List past events | Business Owner |
| GET | `/api/business/events/:id/metrics` | Get event metrics | Business Owner |
| GET | `/api/business/events/:id/registrations` | List registrations | Business Owner |
| GET | `/api/business/events/analytics` | Get analytics overview | Business Owner |
| GET | `/api/business/notifications` | Get notifications | Business Owner |
| PUT | `/api/business/notifications/preferences` | Update prefs | Business Owner |

### Registration API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/events/:id/register` | Create registration | Customer |
| GET | `/api/registrations/:id` | Get registration details | Customer |
| POST | `/api/registrations/:id/cancel` | Cancel registration | Customer |
| GET | `/api/registrations/:id/qr` | Get QR code | Customer |
| POST | `/api/events/:id/check-in` | Check-in attendee | Business Staff |

### Payments API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/events/create-order` | Create Razorpay order | Customer |
| POST | `/api/payments/events/verify` | Verify payment | Customer |
| POST | `/api/payments/events/refund` | Process refund | Business Owner |

### Reviews API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/events/:id/reviews` | Submit review | Customer |
| GET | `/api/events/:id/reviews` | Get event reviews | No |
| PUT | `/api/reviews/:id/moderate` | Moderate review | Business Owner |

---

## Implementation Phases

### Phase 0: Foundation (Week 1)
- [ ] Create database schema migrations
- [ ] Set up event_types seed data
- [ ] Create base API routes structure
- [ ] Set up feature flags for gradual rollout

### Phase 1: Business Core (Weeks 2-3)
- [ ] Event CRUD operations
- [ ] Draft management workflow
- [ ] Event publishing flow
- [ ] Basic dashboard with stats
- [ ] Event listing and details pages

### Phase 2: Customer Experience (Weeks 4-5)
- [ ] Public event catalog with filters
- [ ] Event details page with all tabs
- [ ] Registration wizard (3-step)
- [ ] Razorpay payment integration
- [ ] QR code generation
- [ ] Confirmation page and email

### Phase 3: Advanced Features (Weeks 6-7)
- [ ] Cancellation with refund calculation
- [ ] Notification center
- [ ] Check-in system with QR scanner
- [ ] Review and feedback system
- [ ] Past events archive

### Phase 4: Analytics & Optimization (Week 8)
- [ ] Analytics dashboard
- [ ] Performance charts
- [ ] Conversion funnel
- [ ] Report exports
- [ ] Insights and recommendations

---

## Integration Points

### With Existing Salon System
- Users/Auth: Reuse existing users table and JWT authentication
- Organizations: Link events to organizations for multi-salon businesses
- Salons: Use salon locations as default venues
- Payments: Extend Razorpay integration for event payments
- Notifications: Leverage existing email/SMS services

### External Services
- Razorpay: Payment processing, refunds
- SendGrid: Transactional emails (tickets, confirmations)
- Twilio: SMS notifications, reminders
- Google Calendar: Add to calendar integration
- QR Code: Generate check-in QR codes
