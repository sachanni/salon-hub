# Event Management System - Complete Flow & Use Cases
## SalonHub Platform

**Version:** 1.0  
**Date:** November 22, 2025  
**Purpose:** Define complete event management flow covering all use cases before UI design

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Event Types & Categories](#event-types--categories)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Complete User Flows](#complete-user-flows)
5. [Use Cases Matrix](#use-cases-matrix)
6. [Data Model & Relationships](#data-model--relationships)
7. [Business Rules & Logic](#business-rules--logic)
8. [Integration Points](#integration-points)
9. [Screen Requirements](#screen-requirements)

---

## System Overview

### Purpose
Enable salons to create, manage, and monetize events (workshops, classes, special occasions, promotional events) while providing customers with easy event discovery, registration, and attendance.

### Core Capabilities
- **Event Creation**: Salons create various event types with custom configurations
- **Discovery**: Customers find relevant events through search, filters, calendar
- **Registration**: Seamless booking with payment integration
- **Management**: Salon staff manage attendees, check-ins, communications
- **Analytics**: Track event performance, revenue, attendance

### Success Metrics
- Event registration conversion rate
- Average revenue per event
- Customer acquisition through events
- Repeat event attendance rate
- No-show rate reduction

---

## Event Types & Categories

### 1. **Workshops & Classes**
**Description:** Educational sessions teaching beauty/wellness skills

**Examples:**
- Makeup masterclass
- Hair styling basics
- Skincare routine workshop
- Nail art techniques
- Spa therapy introduction

**Characteristics:**
- Fixed capacity (5-20 attendees)
- Duration: 1-4 hours
- Instructor-led
- Materials included or extra cost
- Certificate of completion (optional)
- Skill level: Beginner/Intermediate/Advanced

**Pricing Models:**
- Per-person ticket price
- Early bird discount
- Group discount (bring 3+ friends)
- Member discount

---

### 2. **Product Launch Events**
**Description:** Introduce new products/services to customers

**Examples:**
- New skincare line reveal
- Seasonal collection launch
- Brand collaboration event
- Equipment demonstration

**Characteristics:**
- Open or invitation-only
- Duration: 2-3 hours
- Free or ticketed entry
- Exclusive first-purchase discounts
- Product samples/gifts
- Limited capacity

**Pricing Models:**
- Free (RSVP required)
- Refundable deposit (₹100-500)
- VIP ticket with goodie bag
- General admission ticket

---

### 3. **Seasonal Sales & Promotions**
**Description:** Time-bound promotional events

**Examples:**
- Diwali mega sale
- Valentine's Day spa packages
- Summer skincare event
- Bridal season specials
- New Year grooming offers

**Characteristics:**
- Duration: 1 day to 1 week
- Limited-time offers
- Flash sales (hourly deals)
- Bundle packages
- First-come-first-served slots
- No capacity limit (virtual) or venue-limited

**Pricing Models:**
- Percentage discounts (20-50% off)
- Buy-one-get-one offers
- Package deals
- Loyalty member exclusive pricing

---

### 4. **Group/Special Occasions**
**Description:** Private or semi-private events for groups

**Examples:**
- Bridal party packages
- Birthday spa day
- Bachelorette party
- Corporate team building
- Mother-daughter spa day
- Girls' night out

**Characteristics:**
- Minimum group size (4-10 people)
- Private or semi-private booking
- Customizable services
- Duration: 3-6 hours
- Catering options
- Photography allowed
- Dedicated staff

**Pricing Models:**
- Per-person package price
- Flat group rate
- Add-on services (champagne, cake, photographer)
- Deposit required (50% upfront)

---

### 5. **Guest Artist/Celebrity Events**
**Description:** Special sessions with industry experts

**Examples:**
- Celebrity makeup artist session
- Renowned hair stylist demonstration
- Wellness guru talk
- Beauty influencer meet & greet

**Characteristics:**
- High demand, limited capacity
- Premium pricing
- Exclusive experience
- Photo opportunities
- Q&A sessions
- Autograph signing

**Pricing Models:**
- Tiered tickets (VIP, Premium, General)
- VIP includes private session
- Limited early bird tickets
- Member pre-access

---

### 6. **Recurring Events**
**Description:** Regular scheduled events

**Examples:**
- Weekly makeup Mondays
- Monthly skincare Sunday
- Bi-weekly wellness workshops
- Quarterly product showcases

**Characteristics:**
- Repeating schedule (weekly/monthly)
- Consistent pricing
- Series packages (buy 4 sessions, get 1 free)
- Loyalty program integration
- Waitlist for popular sessions

**Pricing Models:**
- Single session ticket
- Multi-session pass (discounted)
- Subscription model (monthly membership)
- Drop-in pricing vs pre-registration

---

## User Roles & Permissions

### 1. **Super Admin**
**Permissions:**
- View all salons' events
- Moderate/remove inappropriate events
- Access platform-wide analytics
- Configure event features

**Use Cases:**
- Platform oversight
- Fraud detection
- Feature management

---

### 2. **Salon Owner**
**Permissions:**
- Create/edit/delete events for their salon(s)
- Configure event settings
- View event analytics
- Manage attendee lists
- Process refunds
- Export event data
- Communicate with attendees

**Use Cases:**
- Create workshop event
- Set early bird pricing
- Cancel/reschedule event
- Check-in attendees on event day
- View revenue by event

---

### 3. **Salon Staff/Manager**
**Permissions:**
- View event calendar
- Check-in attendees
- View attendee list
- Send event reminders
- Mark attendance
- Add manual registrations

**Use Cases:**
- Verify tickets at door
- Manage walk-ins
- Update attendance records
- Answer customer questions

---

### 4. **Customer (Registered User)**
**Permissions:**
- Browse all public events
- Register for events
- View their registered events
- Cancel registrations (with conditions)
- Add to calendar
- Share events
- Leave reviews/feedback
- Join waitlist

**Use Cases:**
- Discover workshops near me
- Book bridal party event
- Get event reminder
- Request refund
- Refer friend

---

### 5. **Guest (Non-registered)**
**Permissions:**
- Browse public events
- View event details
- Must register/login to book

**Use Cases:**
- Browse upcoming events
- Share event link
- Create account to register

---

## Complete User Flows

### Flow 1: **Salon Owner Creates Workshop Event**

**Trigger:** Salon wants to host a "Bridal Makeup Masterclass"

**Steps:**

1. **Navigate to Events**
   - From business dashboard → Events menu
   - Click "Create New Event"

2. **Choose Event Type**
   - Select: Workshop/Class
   - System loads workshop-specific fields

3. **Basic Information**
   - Event title: "Bridal Makeup Masterclass"
   - Category: Makeup Workshop
   - Skill level: Intermediate
   - Short description (160 chars for preview)
   - Full description (rich text, 2000 chars)
   - Upload cover image (1200x600px)
   - Add photo gallery (up to 10 images)

4. **Date & Time Configuration**
   - Event date: December 15, 2024
   - Start time: 2:00 PM
   - End time: 5:00 PM
   - Time zone: Asia/Kolkata
   - Option: Make this recurring
     - If yes: Frequency (weekly/monthly), end date
   - Registration deadline: December 14, 2024 at 11:59 PM
   - Option: Auto-close when full

5. **Location & Venue**
   - Venue type: In-person / Virtual / Hybrid
   - If in-person:
     - Use salon address OR custom venue
     - Room/floor details
     - Parking instructions
   - If virtual:
     - Platform: Zoom/Google Meet/Teams
     - Meeting link (sent after registration)
   - If hybrid: Both options

6. **Capacity & Attendance**
   - Maximum attendees: 15
   - Minimum required (to proceed): 5
   - Waitlist enabled: Yes
   - Waitlist capacity: 10
   - Group booking allowed: No

7. **Pricing Configuration**
   - Base price: ₹1,200 per person
   - Early bird discount:
     - Enabled: Yes
     - Discount: 20% (₹960)
     - Valid until: December 1, 2024
   - Group discount:
     - Enabled: Yes
     - 3+ people: 15% off each
     - 5+ people: 25% off each
   - Member discount: 10% additional
   - Promo codes allowed: Yes
   - Taxes: GST 18% (auto-calculated)

8. **What's Included**
   - Materials provided: Professional makeup kit (keep)
   - Refreshments: Tea, coffee, snacks
   - Certificate: Yes, digital certificate
   - Recorded session: No
   - Take-home: Product samples worth ₹500

9. **Requirements & Prerequisites**
   - Age requirement: 18+
   - What to bring: Face wipes, hair tie
   - Prerequisites: Basic makeup knowledge helpful
   - Special instructions: Arrive with clean face

10. **Instructor/Host Information**
    - Primary instructor: Riya Kapoor
    - Bio & credentials
    - Profile photo
    - Social media handles

11. **Media & Visuals**
    - Event banner (for promotions)
    - Teaser video (optional)
    - Sample work photos
    - Venue photos

12. **Communication Settings**
    - Automated confirmation email: Yes
    - Reminder timing:
      - 1 week before
      - 3 days before
      - 1 day before
      - 2 hours before
    - SMS reminders: Yes (optional)
    - WhatsApp reminders: Yes
    - Event updates channel: Email + App

13. **Cancellation & Refund Policy**
    - Customer cancellation allowed: Yes
    - Full refund if cancelled: 7+ days before
    - 50% refund if cancelled: 3-7 days before
    - No refund if cancelled: <3 days before
    - Salon cancellation: Full refund + ₹200 credit

14. **Additional Settings**
    - Allow reviews: Yes (after event completion)
    - Visible to public: Yes
    - Featured event: Yes (extra visibility)
    - Age restriction: 18+
    - Recording consent required: No
    - Photo/video allowed: Yes

15. **Preview & Publish**
    - Preview customer view
    - Check all details
    - Save as draft OR Publish immediately
    - Publish triggers:
      - Event goes live on platform
      - Confirmation email to salon
      - SEO indexing starts
      - Social media auto-post (if enabled)

**Post-Creation:**
- Event ID generated: EVT-2024-0125
- Event page URL: salonhub.com/events/evt-2024-0125
- QR code generated (for sharing)
- Calendar file (.ics) created
- Dashboard shows in "Upcoming Events"

---

### Flow 2: **Customer Discovers & Registers for Event**

**Trigger:** Customer wants to learn bridal makeup

**Steps:**

1. **Discovery**
   
   **Path A: Browse Events**
   - Navigate to "Events" tab
   - See featured events carousel
   - See "Upcoming Events" list
   - See "Events Near You" (location-based)
   
   **Path B: Search**
   - Search bar: "bridal makeup"
   - Filters applied:
     - Category: Workshops
     - Date: This month
     - Price: ₹500-₹2000
     - Location: Within 10km
     - Skill level: Intermediate
   - Sort by: Date (soonest first)
   
   **Path C: Salon Profile**
   - Viewing salon profile
   - See "Upcoming Events" tab
   - Click event card

2. **Event Details Page**
   - Event banner image
   - Title: "Bridal Makeup Masterclass"
   - Salon name with verified badge
   - Rating: ⭐ 4.8 (based on past events)
   - Date, time, duration
   - Location with map
   - **Pricing card (sticky):**
     - Original price: ₹1,200
     - Early bird: ₹960 (20% OFF) - Ends in 5 days
     - Your price: ₹864 (10% member discount applied)
     - Spots left: 8/15
     - Status: "Filling Fast 🔥"
   - What's included (icons + text)
   - About the event (full description)
   - Instructor bio with photo
   - Requirements & prerequisites
   - Cancellation policy
   - FAQs section
   - Reviews from past attendees (if recurring)
   - "Similar Events" suggestions

3. **Add to Cart / Register**
   - Click "Register Now" button
   - Options appear:
     - Number of tickets: 1 (default)
     - Apply promo code (if any)
     - Add to cart OR Proceed to checkout
   
   **If not logged in:**
   - Prompt: "Sign in to continue"
   - Quick login/register options
   - Save event to wishlist for later

4. **Checkout Flow**
   
   **Step 1: Attendee Details**
   - For self:
     - Name (pre-filled)
     - Email (pre-filled)
     - Phone (pre-filled)
   - If registering for others:
     - Add attendee button
     - Collect: Name, Email, Phone for each
     - Specify primary contact
   
   **Step 2: Additional Information**
   - Dietary restrictions (if food included)
   - Special requirements
   - Emergency contact
   - T-shirt size (if merchandise)
   - Agree to terms & conditions
   - Consent for photos/videos
   
   **Step 3: Payment Summary**
   - Ticket price: ₹960 × 1 = ₹960
   - Member discount: -₹96
   - Subtotal: ₹864
   - GST (18%): ₹155.52
   - **Total: ₹1,019.52**
   - Promo code field
   - "What you'll get" recap
   
   **Step 4: Payment Method**
   - Options:
     - Card (Credit/Debit)
     - UPI (GPay, PhonePe, Paytm)
     - Net Banking
     - Wallet (Paytm, MobiKwik)
     - Pay Later (if eligible)
   - Secure payment badge
   - Razorpay integration

5. **Payment Processing**
   - Loading spinner
   - "Processing payment..."
   - Payment gateway redirect
   - Complete transaction
   - Return to platform

6. **Confirmation**
   
   **Success Screen:**
   - ✅ "Registration Confirmed!"
   - Booking reference: REG-EVT-2024-0125-001
   - QR code for check-in
   - Event summary card
   - Actions:
     - [Add to Calendar] (.ics download)
     - [View Ticket]
     - [Share Event]
     - [Get Directions]
   
   **Email Confirmation:**
   - Subject: "You're registered! Bridal Makeup Masterclass"
   - Event details
   - Ticket/QR code (PDF attached)
   - What to bring
   - Venue directions
   - Contact information
   - Add to calendar link
   
   **SMS Confirmation:**
   - "Confirmed! Bridal Makeup Masterclass on Dec 15 at 2PM. Ref: REG-EVT-2024-0125-001. Venue: [Salon Name]. See you there!"

7. **Pre-Event Experience**
   
   **1 Week Before:**
   - Email: "Bridal Makeup Masterclass is coming up!"
   - Reminder of date, time, location
   - What to bring checklist
   - Parking instructions
   - Instructor introduction video
   
   **3 Days Before:**
   - Push notification: "3 days to go!"
   - Weather forecast for event day
   - Suggested outfit
   
   **1 Day Before:**
   - Email + SMS: "See you tomorrow!"
   - Final reminders
   - Contact number for queries
   - Last-minute instructions
   
   **2 Hours Before:**
   - Push notification: "Event starts in 2 hours"
   - Directions to venue
   - Live traffic update
   - "Running late? Call us" option

8. **Event Day - Check-In**
   
   **At Venue:**
   - Staff scans QR code OR
   - Customer shows booking reference
   - System verifies registration
   - Check-in successful
   - Welcome kit handed over
   - Attend event

9. **Post-Event**
   
   **Immediately After:**
   - Push notification: "How was your experience?"
   - Quick rating (1-5 stars)
   - Optional: Write review
   
   **1 Day After:**
   - Email: "Thank you for attending!"
   - Digital certificate (if applicable)
   - Event photos/video (if recorded)
   - Product recommendations
   - Exclusive discount code for services
   - "Share your experience" CTA
   
   **3 Days After:**
   - "Did you love it?" Review request
   - Star rating + written review
   - Upload photos from event
   - Testimonial request (with incentive)
   
   **Event History:**
   - Event appears in "Past Events"
   - Can rebook if recurring
   - Access materials/recordings
   - Certificate download

---

### Flow 3: **Customer Cancels Registration**

**Trigger:** Customer can't attend, wants refund

**Steps:**

1. **Navigate to Booking**
   - My Events → Upcoming
   - Find event: "Bridal Makeup Masterclass"
   - Click to view details

2. **View Cancellation Policy**
   - See policy:
     - 7+ days: Full refund
     - 3-7 days: 50% refund
     - <3 days: No refund
   - Current timing: 5 days before (50% refund eligible)

3. **Initiate Cancellation**
   - Click "Cancel Registration"
   - Warning dialog appears:
     - "Are you sure?"
     - Refund amount: ₹509.76 (50% of ₹1,019.52)
     - Processing time: 5-7 business days
   - Reason for cancellation (dropdown):
     - Can't make it
     - Found another event
     - Personal emergency
     - Not what I expected
     - Other (text field)

4. **Confirm Cancellation**
   - Click "Confirm Cancellation"
   - Processing spinner
   - Cancellation successful

5. **Confirmation & Refund**
   
   **Success Message:**
   - ✅ "Registration Cancelled"
   - Refund amount: ₹509.76
   - Refund mode: Original payment method
   - Expected in: 5-7 business days
   - Refund reference: REF-2024-0125
   
   **Email Confirmation:**
   - "Your registration has been cancelled"
   - Booking reference
   - Refund details
   - "Sorry to see you go"
   - "Rebook anytime" with link
   
   **SMS:**
   - "Registration cancelled. Refund ₹509.76 in 5-7 days."

6. **Waitlist Notification**
   - System checks waitlist
   - If waitlist exists:
     - Next person notified
     - "A spot opened up!" email/SMS
     - 24-hour window to claim
   - If claimed: Registration auto-processed

7. **Booking Status Update**
   - Moved to "Cancelled Events"
   - Can view cancellation details
   - Option to rebook (if seats available)

---

### Flow 4: **Salon Manages Event on Event Day**

**Trigger:** Event day arrives, salon needs to manage attendees

**Steps:**

1. **Pre-Event Preparation (Morning)**
   
   **Dashboard Check:**
   - Navigate to Events → Today's Events
   - See "Bridal Makeup Masterclass" card
   - Status: Confirmed (13/15 registered, 2 no-shows expected)
   
   **Attendee List Review:**
   - Click event → Attendee Management
   - See full list:
     - ✅ Checked-in: 0/13
     - ⏳ Registered: 13
     - ❌ No-show: 0
     - 🚫 Cancelled: 2
   - Filter by: All / Checked-in / Pending / No-show
   - Search by name, phone, email
   - Sort by: Registration date, Name A-Z
   
   **Export Options:**
   - Download attendee list (PDF/Excel)
   - Print name badges
   - Print sign-in sheet
   
   **Materials Check:**
   - Materials needed: 15 makeup kits
   - Actually attending: 13
   - Extra prepared: 2 (for walk-ins)
   
   **Communication:**
   - Send final reminder (manual)
   - Custom message: "Looking forward to seeing you at 2PM! Parking available at rear entrance."
   - Select channel: Email + SMS
   - Send to: All registered attendees

2. **Check-In Process (Event Time)**
   
   **Setup Check-In Station:**
   - Open event → Check-In Mode
   - Tablet/phone with QR scanner ready
   - Backup: Manual check-in by name/phone
   
   **Attendee Arrival (Multiple Options):**
   
   **Option A: QR Code Scan**
   - Attendee shows QR code (email/app)
   - Staff scans with device camera
   - System validates:
     - ✅ Valid ticket
     - Name: Priya Sharma
     - Ticket #: REG-EVT-2024-0125-001
   - Instant check-in
   - Confirmation sound/vibration
   - Welcome message shown
   - Counter updates: 1/13 checked in
   
   **Option B: Manual Search**
   - Staff searches by name
   - Results show matching attendees
   - Select correct person
   - Click "Check In"
   - Confirmation
   
   **Option C: Phone Number**
   - Enter phone: +91 98765 43210
   - System finds registration
   - Confirm and check-in
   
   **Walk-In Handling:**
   - Someone arrives without registration
   - Check if seats available: 2/15 (yes)
   - Options:
     - Quick registration (on-spot):
       - Collect: Name, Email, Phone
       - Collect payment (cash/UPI)
       - Manual check-in
       - Send confirmation email later
     - Ask to register via app/website

3. **During Event**
   
   **Live Dashboard:**
   - Real-time attendee count
   - Expected: 13, Checked-in: 11, No-show: 2
   - Start event anyway (met minimum 5)
   
   **Attendance Tracking:**
   - Mark who actually attended (even if checked in)
   - Note no-shows for future analytics
   - Track participation level
   
   **Issue Handling:**
   
   **Scenario A: Late Arrival**
   - Attendee arrives 30 mins late
   - Check them in
   - Staff escorts to event quietly
   
   **Scenario B: Invalid Ticket**
   - QR code doesn't scan
   - Manual verification by booking reference
   - If valid: Override and check-in
   - If invalid: Politely decline, offer to purchase
   
   **Scenario C: Double Booking**
   - Same person tries to check in twice
   - System shows: Already checked in at 2:15 PM
   - Staff verifies, resolves confusion

4. **Post-Event Wrap-Up**
   
   **Attendance Summary:**
   - Registered: 13
   - Attended: 11
   - No-show: 2
   - Walk-in: 1
   - Total attendees: 12
   - Attendance rate: 84.6%
   
   **Mark Event Complete:**
   - Click "Complete Event"
   - System triggers:
     - Thank you emails to attendees
     - Feedback request sent
     - Certificates generated (if applicable)
     - No-show records updated
     - Revenue calculated
     - Inventory updated (materials used)
   
   **Feedback Collection:**
   - Auto-email: "How was the event?"
   - In-app notification
   - QR code for quick feedback
   
   **Internal Notes:**
   - Add notes for improvement:
     - "2 no-shows, consider overbooking by 10%"
     - "Parking was tight, mention in future"
     - "Attendees loved the take-home kit"
   - Save for future reference

5. **Analytics & Reporting**
   
   **Immediate Stats:**
   - Revenue: ₹13,255.20 (13 paid registrations)
   - Costs: ₹4,500 (materials, instructor, venue)
   - Profit: ₹8,755.20
   - ROI: 194%
   
   **Attendee Insights:**
   - New customers: 7 (54%)
   - Returning customers: 6 (46%)
   - Average age: 28 years
   - Top source: Instagram ad (6), Organic search (4), Referral (3)
   
   **Feedback Summary:**
   - Overall rating: 4.7/5 (11 responses)
   - Would recommend: 91%
   - Repeat attendance interest: 73%
   
   **Export Report:**
   - Download PDF report
   - Share with team
   - Use for future planning

---

### Flow 5: **Salon Cancels/Reschedules Event**

**Trigger:** Instructor sick, need to reschedule

**Steps:**

1. **Decision to Cancel/Reschedule**
   - Navigate to Events → Upcoming
   - Select event: "Bridal Makeup Masterclass"
   - Click three-dot menu → Cancel or Reschedule

2. **Choose Action**
   
   **Option A: Reschedule**
   - Click "Reschedule Event"
   - Select new date & time
   - System checks:
     - Venue availability
     - Instructor availability
     - Customer impact (13 registered)
   
   **Option B: Cancel**
   - Click "Cancel Event"
   - Warning: 13 people registered
   - Refund impact: ₹13,255.20

3. **Reschedule Flow**
   
   **Select New Date:**
   - Calendar picker
   - Choose: December 22, 2024 (1 week later)
   - Same time: 2:00 PM - 5:00 PM
   
   **Impact Analysis:**
   - System shows:
     - 13 current registrations
     - Estimated availability: 85% (11/13 likely available)
     - Estimated cancellations: 15% (2/13)
   
   **Communication Plan:**
   - Notify all attendees: Yes
   - Message preview:
     - Subject: "Event Rescheduled - Bridal Makeup Masterclass"
     - Body: "Due to unforeseen circumstances, we've rescheduled to Dec 22. Your registration is automatically moved. Can't make it? Get full refund."
   - Channels: Email + SMS + App notification
   
   **Attendee Options:**
   - Auto-message includes:
     - New date/time
     - [I can attend] button → Confirmed
     - [I can't make it] button → Full refund offered
     - [View details] → Event page
   
   **Compensation:**
   - Offer apology discount: 10% off
   - Free add-on: Extra product sample
   - Goodwill gesture: ₹100 salon credit

4. **Cancel Flow**
   
   **Cancellation Reason (Required):**
   - Dropdown:
     - Instructor unavailable
     - Insufficient registrations
     - Venue issue
     - Force majeure
     - Other
   - Text explanation
   
   **Refund Configuration:**
   - Full refund: ₹13,255.20 (13 attendees)
   - Additional compensation:
     - ☑ ₹200 salon service credit per person
     - ☑ Priority booking for future events
     - ☑ 20% discount code valid 30 days
   
   **Communication:**
   - Message preview:
     - Subject: "Event Cancelled - Bridal Makeup Masterclass"
     - Body: "We sincerely apologize. Due to [reason], we must cancel. Full refund + ₹200 credit issued."
   - Send to: All registered attendees
   
   **Confirm Cancellation:**
   - Review impact
   - Confirm cancellation
   - Processing:
     - All refunds initiated
     - Credits added to customer accounts
     - Booking records updated
     - Calendar slots freed
     - SEO delisting
     - Social posts removed

5. **Post-Cancellation**
   
   **For Reschedule:**
   - Attendee responses tracked:
     - 11 confirmed new date
     - 2 requested refund
   - New event page updated
   - Old date greyed out
   - Automatic refunds processed for 2
   
   **For Cancellation:**
   - Event status: Cancelled
   - Refunds: 13 processed
   - Credits: ₹2,600 distributed
   - Customer satisfaction survey sent
   - Internal review scheduled
   - Data retained for analytics

---

## Use Cases Matrix

### Customer Use Cases

| # | Use Case | Priority | Complexity | Flow Reference |
|---|----------|----------|------------|----------------|
| UC-C1 | Browse upcoming events | High | Low | Flow 2, Step 1 |
| UC-C2 | Search events by keyword/filter | High | Medium | Flow 2, Step 1 |
| UC-C3 | View event details | High | Low | Flow 2, Step 2 |
| UC-C4 | Register for single event | High | Medium | Flow 2, Steps 3-6 |
| UC-C5 | Register for multiple attendees | Medium | High | Flow 2, Step 4 |
| UC-C6 | Apply promo code | Medium | Low | Flow 2, Step 4 |
| UC-C7 | Add event to calendar | Medium | Low | Flow 2, Step 6 |
| UC-C8 | Share event with friends | Low | Low | Flow 2, Step 6 |
| UC-C9 | Cancel registration | High | Medium | Flow 3 |
| UC-C10 | Request refund | High | Medium | Flow 3, Steps 5-7 |
| UC-C11 | Join waitlist | Medium | Medium | New flow needed |
| UC-C12 | Receive event reminders | High | Low | Flow 2, Step 7 |
| UC-C13 | Check-in at event | High | Low | Flow 2, Step 8 |
| UC-C14 | Rate/review event | Medium | Low | Flow 2, Step 9 |
| UC-C15 | View event history | Low | Low | Flow 2, Step 9 |
| UC-C16 | Download event certificate | Low | Low | Flow 2, Step 9 |
| UC-C17 | Reschedule to different date | Medium | High | Edge case |
| UC-C18 | Gift event ticket | Low | High | Edge case |
| UC-C19 | Get event recommendations | Low | Medium | AI-powered |

### Salon/Business Use Cases

| # | Use Case | Priority | Complexity | Flow Reference |
|---|----------|----------|------------|----------------|
| UC-B1 | Create new event | High | High | Flow 1 |
| UC-B2 | Edit event details | High | Medium | Flow 1 variant |
| UC-B3 | Duplicate past event | Medium | Low | Flow 1 shortcut |
| UC-B4 | Create recurring event series | Medium | High | Flow 1, Step 4 |
| UC-B5 | Set early bird pricing | Medium | Medium | Flow 1, Step 7 |
| UC-B6 | Configure refund policy | High | Medium | Flow 1, Step 13 |
| UC-B7 | Publish/unpublish event | High | Low | Flow 1, Step 15 |
| UC-B8 | View event registrations | High | Low | Flow 4, Step 1 |
| UC-B9 | Export attendee list | Medium | Low | Flow 4, Step 1 |
| UC-B10 | Check-in attendees (QR scan) | High | Medium | Flow 4, Step 2 |
| UC-B11 | Manual check-in | High | Low | Flow 4, Step 2 |
| UC-B12 | Handle walk-in registrations | Medium | Medium | Flow 4, Step 2 |
| UC-B13 | Send event reminders | Medium | Low | Flow 4, Step 1 |
| UC-B14 | Mark event complete | High | Low | Flow 4, Step 4 |
| UC-B15 | View event analytics | High | Medium | Flow 4, Step 5 |
| UC-B16 | Reschedule event | High | High | Flow 5, Option A |
| UC-B17 | Cancel event | High | High | Flow 5, Option B |
| UC-B18 | Process refunds | High | Medium | Flow 5, Step 4 |
| UC-B19 | Manage waitlist | Medium | Medium | Flow 3, Step 6 |
| UC-B20 | Export event report | Medium | Low | Flow 4, Step 5 |
| UC-B21 | Create discount codes | Medium | Medium | Flow 1, Step 7 |
| UC-B22 | View revenue by event | High | Low | Flow 4, Step 5 |
| UC-B23 | Compare event performance | Low | Medium | Analytics feature |
| UC-B24 | Clone successful event | Medium | Low | Template feature |

---

## Data Model & Relationships

### Core Tables

#### 1. `events`
```sql
id (UUID, PK)
salon_id (UUID, FK → salons)
event_type (ENUM: workshop, product_launch, sale, group_occasion, celebrity, recurring)
title (VARCHAR 200)
slug (VARCHAR 250, unique, SEO-friendly)
short_description (VARCHAR 160)
full_description (TEXT)
cover_image_url (VARCHAR)
status (ENUM: draft, published, completed, cancelled)
visibility (ENUM: public, members_only, private, invitation_only)

-- Date & Time
event_date (DATE)
start_time (TIME)
end_time (TIME)
timezone (VARCHAR, default: Asia/Kolkata)
duration_minutes (INTEGER, calculated)

-- Recurring
is_recurring (BOOLEAN, default: false)
recurrence_pattern (JSON: {frequency, interval, end_date})
parent_event_id (UUID, nullable, FK → events)

-- Location
venue_type (ENUM: in_person, virtual, hybrid)
venue_address (TEXT, nullable)
venue_room (VARCHAR, nullable)
venue_instructions (TEXT, nullable)
virtual_link (VARCHAR, nullable)
virtual_platform (VARCHAR, nullable)

-- Capacity
max_attendees (INTEGER)
min_attendees (INTEGER)
current_registrations (INTEGER, default: 0)
waitlist_enabled (BOOLEAN, default: false)
waitlist_capacity (INTEGER, nullable)
auto_close_when_full (BOOLEAN, default: true)

-- Pricing
base_price_in_paisa (INTEGER)
has_early_bird (BOOLEAN, default: false)
early_bird_price_in_paisa (INTEGER, nullable)
early_bird_ends_at (TIMESTAMP, nullable)
group_discount_enabled (BOOLEAN, default: false)
group_discount_config (JSON, nullable)
member_discount_percent (INTEGER, nullable)
tax_percent (DECIMAL, default: 18.00)

-- Content
included_items (JSON ARRAY)
requirements (TEXT, nullable)
prerequisites (TEXT, nullable)
skill_level (ENUM: beginner, intermediate, advanced, all)
age_restriction (INTEGER, nullable)
instructor_name (VARCHAR, nullable)
instructor_bio (TEXT, nullable)
instructor_image_url (VARCHAR, nullable)

-- Policy
cancellation_policy (JSON)
registration_deadline (TIMESTAMP)
allow_customer_cancel (BOOLEAN, default: true)
refund_policy (JSON)

-- Media
image_gallery (JSON ARRAY)
video_url (VARCHAR, nullable)

-- SEO
meta_title (VARCHAR 60, nullable)
meta_description (VARCHAR 160, nullable)
keywords (VARCHAR, nullable)

-- Tracking
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
created_by (UUID, FK → users)
published_at (TIMESTAMP, nullable)
completed_at (TIMESTAMP, nullable)
cancelled_at (TIMESTAMP, nullable)
cancellation_reason (TEXT, nullable)
```

#### 2. `event_registrations`
```sql
id (UUID, PK)
event_id (UUID, FK → events)
customer_id (UUID, FK → users)
booking_reference (VARCHAR, unique, indexed)
registration_type (ENUM: standard, early_bird, group, member, walk_in)

-- Attendee Details
number_of_attendees (INTEGER, default: 1)
attendee_details (JSON ARRAY: [{name, email, phone}])
primary_contact_name (VARCHAR)
primary_contact_email (VARCHAR)
primary_contact_phone (VARCHAR)

-- Additional Info
special_requirements (TEXT, nullable)
dietary_restrictions (TEXT, nullable)
emergency_contact (VARCHAR, nullable)
tshirt_size (VARCHAR, nullable)
consents (JSON: {photos, recording, terms})

-- Payment
payment_status (ENUM: pending, paid, partially_paid, refunded, failed)
payment_method (VARCHAR)
amount_paid_in_paisa (INTEGER)
discount_applied_in_paisa (INTEGER, default: 0)
promo_code (VARCHAR, nullable)
tax_in_paisa (INTEGER)
total_in_paisa (INTEGER)
razorpay_order_id (VARCHAR, nullable)
razorpay_payment_id (VARCHAR, nullable)

-- Attendance
attendance_status (ENUM: registered, checked_in, attended, no_show, cancelled)
checked_in_at (TIMESTAMP, nullable)
checked_in_by (UUID, nullable, FK → users)
qr_code (VARCHAR, unique)

-- Cancellation & Refund
cancelled_at (TIMESTAMP, nullable)
cancellation_reason (TEXT, nullable)
refund_status (ENUM: none, pending, processed, failed)
refund_amount_in_paisa (INTEGER, default: 0)
refund_processed_at (TIMESTAMP, nullable)

-- Timestamps
registered_at (TIMESTAMP, default: NOW())
updated_at (TIMESTAMP)
```

#### 3. `event_waitlist`
```sql
id (UUID, PK)
event_id (UUID, FK → events)
customer_id (UUID, FK → users)
position (INTEGER)
status (ENUM: waiting, notified, claimed, expired, cancelled)
notified_at (TIMESTAMP, nullable)
claim_expires_at (TIMESTAMP, nullable)
joined_at (TIMESTAMP, default: NOW())
```

#### 4. `event_reviews`
```sql
id (UUID, PK)
event_id (UUID, FK → events)
registration_id (UUID, FK → event_registrations)
customer_id (UUID, FK → users)
rating (INTEGER, 1-5)
review_text (TEXT, nullable)
review_images (JSON ARRAY, nullable)
would_recommend (BOOLEAN)
is_verified_attendee (BOOLEAN, default: true)
helpful_count (INTEGER, default: 0)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### 5. `event_analytics`
```sql
id (UUID, PK)
event_id (UUID, FK → events)
date (DATE)

-- Registrations
total_registrations (INTEGER)
new_customers (INTEGER)
returning_customers (INTEGER)
registrations_from_source (JSON: {organic, social, ads, referral})

-- Attendance
total_checked_in (INTEGER)
total_attended (INTEGER)
no_shows (INTEGER)
attendance_rate (DECIMAL)

-- Financial
revenue_in_paisa (INTEGER)
costs_in_paisa (INTEGER, nullable)
profit_in_paisa (INTEGER, nullable)
average_ticket_price_in_paisa (INTEGER)

-- Engagement
feedback_count (INTEGER)
average_rating (DECIMAL)
review_count (INTEGER)
would_recommend_percent (DECIMAL)

-- Computed at end of event
computed_at (TIMESTAMP)
```

### Relationships

```
salons
  ↓ (1:N)
events
  ↓ (1:N)
event_registrations
  ↓ (1:1)
payment_transactions

events
  ↓ (1:N)
event_waitlist

events
  ↓ (1:N)
event_reviews

events
  ↓ (1:1)
event_analytics
```

---

## Business Rules & Logic

### Registration Rules

1. **Capacity Management**
   - Cannot register if `current_registrations >= max_attendees`
   - If full and waitlist enabled: Offer waitlist
   - If full and no waitlist: Show "Sold Out"
   - Auto-close registration when full (if enabled)

2. **Minimum Attendees**
   - Event proceeds if `current_registrations >= min_attendees`
   - If below minimum by deadline:
     - Option A: Cancel event, full refund
     - Option B: Proceed anyway (salon decision)
     - Option C: Extend deadline

3. **Registration Deadline**
   - No new registrations after `registration_deadline`
   - Exception: Walk-in allowed if capacity available

4. **Pricing Tiers**
   ```
   Price Calculation Order:
   1. Base price: ₹1,200
   2. Check early bird: If before deadline → ₹960
   3. Check group discount: If 3+ attendees → Apply %
   4. Check member discount: If member → Apply %
   5. Apply promo code: If valid → Deduct
   6. Calculate tax: 18% GST
   7. Final total
   ```

5. **Promo Code Rules**
   - One promo per registration
   - Cannot combine multiple promo codes
   - Can combine promo + member discount
   - Promo codes have usage limits
   - Expiry date enforced

### Cancellation & Refund Rules

1. **Customer-Initiated Cancellation**
   ```
   Time Before Event | Refund Amount
   ------------------|---------------
   7+ days           | 100% refund
   3-7 days          | 50% refund
   1-3 days          | 25% refund
   <24 hours         | No refund
   ```
   - Configurable per event
   - Processing fee may apply (₹50)
   - Refund to original payment method
   - Processing time: 5-7 business days

2. **Salon-Initiated Cancellation**
   - Always 100% refund
   - Additional compensation:
     - ₹200 salon credit
     - Priority booking future events
     - Discount code
   - Reputation impact tracked

3. **No-Show Policy**
   - No refund for no-shows
   - Exception: Medical emergency (proof required)
   - 3 no-shows = Account warning
   - 5 no-shows = Registration restrictions

### Waitlist Management

1. **Joining Waitlist**
   - Free to join
   - Position assigned: FIFO (first-in-first-out)
   - Max waitlist capacity enforced

2. **Waitlist Promotion**
   - When spot opens (cancellation):
     - Next person on waitlist notified
     - 24-hour claim window
     - If not claimed: Next person notified
   - Notification channels: Email + SMS + Push

3. **Automatic Conversion**
   - If claimed: Registration auto-created
   - Payment link sent
   - Must complete payment in 2 hours
   - If payment fails: Spot released

### Event Completion & Analytics

1. **Auto-Complete Trigger**
   - Event end time + 2 hours passed
   - OR manual completion by salon

2. **Post-Completion Actions**
   - Mark all registered as "attended" or "no-show"
   - Send thank-you emails
   - Request feedback/reviews
   - Issue certificates (if applicable)
   - Calculate analytics
   - Update salon performance metrics

3. **Review Eligibility**
   - Only "attended" status can review
   - 30-day window to submit review
   - One review per registration
   - Verified attendee badge

---

## Integration Points

### 1. **Payment Gateway (Razorpay)**
- Create order for event registration
- Capture payment
- Process refunds
- Webhook handling for payment status

### 2. **Calendar Integration**
- Generate .ics files
- Sync with Google Calendar
- Sync with Apple Calendar
- Sync with Outlook

### 3. **Communication Services**
- **SendGrid (Email)**:
  - Registration confirmation
  - Event reminders
  - Cancellation notices
  - Thank you emails
  - Certificates
  
- **Twilio (SMS)**:
  - Booking confirmation
  - Day-before reminder
  - Check-in instructions
  
- **Push Notifications**:
  - Event starting soon
  - Spot opened from waitlist
  - Review request

### 4. **QR Code Generation**
- Unique QR per registration
- Contains: booking_reference, event_id, customer_id
- Scannable at check-in
- Printed on tickets

### 5. **Maps & Location**
- Google Maps integration for venue
- Directions from customer location
- Traffic updates on event day
- Parking availability

### 6. **Social Media**
- Auto-post new events (optional)
- Share event functionality
- Social login for registration
- Instagram/Facebook event sync

### 7. **Analytics & Reporting**
- Event performance tracking
- Revenue analytics
- Customer acquisition source
- Attendance patterns
- Export to PDF/Excel

### 8. **Inventory Management**
- Deduct materials used
- Track costs per event
- Low stock alerts
- Material assignment

---

## Screen Requirements

### Customer-Facing Screens (9 screens)

1. **Events Browse/Discover**
   - Featured events carousel
   - Upcoming events grid/list
   - Search bar
   - Filters sidebar
   - Sort options
   - Category tabs

2. **Event Details Page**
   - Hero image/banner
   - Event information
   - Pricing card (sticky)
   - Instructor bio
   - What's included
   - Requirements
   - Location map
   - Reviews section
   - Similar events
   - Register CTA

3. **Event Registration/Checkout**
   - Attendee details form
   - Number of tickets
   - Additional information
   - Payment summary
   - Payment method selection
   - Terms & conditions
   - Place order button

4. **Registration Confirmation**
   - Success message
   - Booking reference
   - QR code
   - Event summary
   - Add to calendar
   - Get directions
   - Share event

5. **My Events - Upcoming**
   - List of registered events
   - Event cards with quick info
   - Actions: View details, Cancel, Get directions
   - Filter: All, This week, This month

6. **My Events - Past**
   - Completed events
   - Rate & review CTA
   - Download certificate
   - Rebook option
   - View photos/materials

7. **Event Ticket/Pass**
   - Large QR code
   - Booking reference
   - Event details
   - Venue address
   - Check-in instructions
   - Contact info

8. **Cancellation Flow**
   - Cancellation reason
   - Refund policy display
   - Refund calculation
   - Confirm cancellation
   - Cancellation success

9. **Event Review/Rating**
   - Star rating (1-5)
   - Review text area
   - Upload photos
   - Would recommend toggle
   - Submit review

### Business/Salon Screens (12 screens)

1. **Events Dashboard**
   - Summary cards (upcoming, past, revenue)
   - Today's events
   - Upcoming events list
   - Quick actions
   - Analytics preview

2. **Create Event - Basic Info**
   - Event type selection
   - Title, description
   - Cover image upload
   - Category selection
   - Skill level

3. **Create Event - Schedule**
   - Date & time picker
   - Duration
   - Recurring options
   - Registration deadline
   - Time zone

4. **Create Event - Location & Capacity**
   - Venue type
   - Address/virtual link
   - Max/min attendees
   - Waitlist settings
   - Group booking

5. **Create Event - Pricing**
   - Base price
   - Early bird configuration
   - Group discounts
   - Member discount
   - Tax settings

6. **Create Event - Details**
   - What's included
   - Requirements
   - Instructor info
   - Cancellation policy
   - Media gallery

7. **Event Management - Overview**
   - Event details summary
   - Edit options
   - Registration stats
   - Revenue preview
   - Actions menu

8. **Attendee Management**
   - Attendee list/table
   - Search & filter
   - Check-in status
   - Export options
   - Send messages

9. **Check-In Interface**
   - QR scanner
   - Manual search
   - Check-in confirmation
   - Live counter
   - Walk-in registration

10. **Event Analytics**
    - Key metrics cards
    - Registration trends chart
    - Revenue breakdown
    - Attendance stats
    - Customer insights
    - Export report

11. **Reschedule Event**
    - New date/time selection
    - Impact preview
    - Communication message
    - Attendee options
    - Confirm reschedule

12. **Cancel Event**
    - Cancellation reason
    - Refund configuration
    - Compensation options
    - Communication preview
    - Confirm cancellation

---

## Edge Cases & Scenarios

### 1. **Event Overbooking**
**Scenario:** Salon allows 15 spots, but 16 people register due to simultaneous clicks

**Solution:**
- Database constraint on `current_registrations`
- Atomic increment with lock
- Last person gets error: "Sorry, just filled up!"
- Auto-add to waitlist with apology discount

### 2. **Payment Failure After Registration**
**Scenario:** Registration created, payment fails

**Solution:**
- Registration marked "payment_pending"
- Payment retry link sent
- 2-hour window to complete
- Auto-cancel if not paid
- Spot released back to pool

### 3. **Duplicate Registration**
**Scenario:** Customer tries to register twice for same event

**Solution:**
- Check existing registration before allowing
- Show message: "Already registered!"
- Offer to modify existing registration
- Link to view existing ticket

### 4. **Waitlist Spot Claim Expiry**
**Scenario:** Waitlist person doesn't claim in 24 hours

**Solution:**
- Auto-expire claim
- Move to next person
- Send "You missed it" email with future events

### 5. **Last-Minute Venue Change**
**Scenario:** Venue unavailable 1 day before event

**Solution:**
- Update venue address
- Send urgent notification to all
- Offer full refund for inconvenience
- Provide transportation if far

### 6. **Instructor No-Show**
**Scenario:** Instructor can't make it on event day

**Solution:**
- Immediate notification to attendees
- Options:
  - Substitute instructor (if qualified)
  - Reschedule
  - Cancel with full refund + credit
- Reputation protection for salon

### 7. **Mass Cancellation**
**Scenario:** 50% attendees cancel 2 days before

**Solution:**
- Falls below minimum attendees
- Salon decides:
  - Proceed with smaller group
  - Cancel and refund all
  - Heavily discount last-minute registrations

### 8. **Technical QR Failure**
**Scenario:** QR scanner not working at check-in

**Solution:**
- Fallback: Manual name search
- Fallback: Phone number lookup
- Fallback: Printed attendee list
- Post-event: Manual check-in correction

### 9. **Group Registration Split**
**Scenario:** 5 friends register together, 2 want to cancel

**Solution:**
- Allow partial cancellation
- Recalculate group discount
- Options:
  - Pay difference for remaining 3
  - Find 2 replacements (keep discount)
  - All cancel (per policy)

### 10. **Review Bombing**
**Scenario:** Competitor leaves fake bad reviews

**Solution:**
- Verify attendee status (only attended can review)
- Flag suspicious patterns
- Manual moderation
- Report mechanism
- Salon response option

---

## Technical Considerations

### Performance
- Pagination for event lists (20 per page)
- Image optimization (cover images max 500KB)
- Caching event details (15-minute cache)
- Database indexing on:
  - `event_date`, `salon_id`, `status`
  - `registration.customer_id`, `registration.event_id`

### Scalability
- Handle 1000+ simultaneous registrations
- Queue-based email/SMS sending
- Load balancer for check-in traffic
- CDN for event images

### Security
- Rate limiting on registration API (10/min per user)
- CAPTCHA for suspicious activity
- SQL injection prevention
- XSS protection in descriptions
- Secure payment handling (PCI compliance)

### Accessibility
- Screen reader compatible
- Keyboard navigation
- High contrast mode
- Text size adjustment
- Alt text for all images

---

## Success Metrics & KPIs

### Customer Metrics
- Event discovery rate (% who find events)
- Registration conversion (% who register after viewing)
- Attendance rate (% who attend after registering)
- Repeat event attendance (% who attend 2+ events)
- Customer satisfaction (average rating)

### Business Metrics
- Revenue per event
- Profit margin per event
- Average attendees per event
- Cancellation rate
- No-show rate
- Waitlist conversion rate

### Platform Metrics
- Total events created
- Active events
- Total revenue generated
- Customer acquisition cost via events
- Salon retention (% still hosting events)

---

## Future Enhancements

### Phase 2 Features
- Live streaming for virtual events
- Breakout rooms for hybrid events
- Gamification (event badges, loyalty points)
- Event merchandise sales
- Post-event community (alumni groups)

### Phase 3 Features
- Multi-venue events
- Multi-day events/conferences
- Event sponsorships
- Affiliate marketing for events
- White-label event pages

---

## Conclusion

This comprehensive flow document covers:
- ✅ 6 event types with detailed characteristics
- ✅ 4 user roles with permissions
- ✅ 5 complete end-to-end flows
- ✅ 43 use cases (19 customer + 24 business)
- ✅ Complete data model (5 core tables)
- ✅ Business rules & logic
- ✅ 8 integration points
- ✅ 21 screen requirements (9 customer + 12 business)
- ✅ 10 edge cases with solutions
- ✅ Technical considerations
- ✅ Success metrics

**Next Step:** Create Uizard.io screen prompts for all 21 screens based on this flow.

---

**Document Status:** Complete ✅  
**Ready for:** UI Design Phase
