# StudioHub Customer Test Cases Document

**Version:** 1.1  
**Date:** December 14, 2025  
**Last Updated:** December 14, 2025  
**Scope:** Customer-facing functionality (Mobile App & Web)  
**Total Test Cases:** 169

---

## Table of Contents

1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [Salon Discovery & Search](#2-salon-discovery--search)
3. [Salon Profile & Details](#3-salon-profile--details)
4. [Service Booking Flow](#4-service-booking-flow)
5. [Package Booking](#5-package-booking)
6. [Membership System](#6-membership-system)
7. [Payment & Checkout](#7-payment--checkout)
8. [Gift Cards](#8-gift-cards)
9. [Booking Management](#9-booking-management)
10. [Running Late Notification](#10-running-late-notification)
11. [Smart Departure Alerts](#11-smart-departure-alerts)
12. [Slot Waitlist](#12-slot-waitlist)
13. [Express Rebooking](#13-express-rebooking)
14. [Rewards & Loyalty](#14-rewards--loyalty)
15. [Booking Streaks](#15-booking-streaks)
16. [Wallet System](#16-wallet-system)
17. [Referral Program](#17-referral-program)
18. [Offers & Promotions](#18-offers--promotions)
19. [E-Commerce Shop](#19-e-commerce-shop)
20. [Events System](#20-events-system)
21. [Chat System](#21-chat-system)
22. [Notifications](#22-notifications)
23. [Profile Management](#23-profile-management)
24. [Favorites & Wishlist](#24-favorites--wishlist)
25. [AI Features](#25-ai-features)
26. [Deposits](#26-deposits)
27. [Cancellation & Refunds](#27-cancellation--refunds)
28. [Reviews & Ratings](#28-reviews--ratings)
29. [QR Scanner](#29-qr-scanner)
30. [At-Home Services](#30-at-home-services)
31. [Dynamic Pricing](#31-dynamic-pricing)
32. [Service Bundles](#32-service-bundles)

---

## 1. Authentication & Onboarding

### TC-AUTH-001: Phone Number Registration
**Priority:** Critical  
**Precondition:** User has not registered before

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app for first time | Splash screen appears, then welcome carousel |
| 2 | Swipe through onboarding screens | 3-4 screens explaining app features |
| 3 | Tap "Get Started" | Login/signup choice screen appears |
| 4 | Tap "Continue with Phone" | Phone number entry screen appears |
| 5 | Enter valid 10-digit Indian mobile number | Number is formatted with +91 prefix |
| 6 | Tap "Send OTP" | OTP is sent, user navigates to OTP verification screen |
| 7 | Enter 6-digit OTP | OTP is validated |
| 8 | Complete profile (name, email optional) | Account is created, user lands on Home screen |

### TC-AUTH-002: Phone Number Login (Existing User)
**Priority:** Critical  
**Precondition:** User has registered account

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app | Splash screen, then login screen |
| 2 | Enter registered phone number | System recognizes existing user |
| 3 | Receive and enter OTP | User is logged in |
| 4 | View Home screen | Previously saved data (favorites, bookings) is visible |

### TC-AUTH-003: OTP Resend
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request OTP | OTP sent, 30-second timer starts |
| 2 | Wait for timer to expire | "Resend OTP" button becomes active |
| 3 | Tap "Resend OTP" | New OTP is sent, timer resets |
| 4 | Enter new OTP | Verification succeeds |

### TC-AUTH-004: Invalid OTP Entry
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Request OTP | OTP is sent |
| 2 | Enter incorrect OTP 3 times | Error message shown, option to resend |
| 3 | Enter correct OTP | Verification succeeds |

### TC-AUTH-005: Google Sign-In
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap "Continue with Google" | Google sign-in sheet appears |
| 2 | Select Google account | Account is linked/created |
| 3 | Complete phone verification (if new) | Account is activated |

### TC-AUTH-006: Guest Browsing
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap "Continue as Guest" | User can browse salons and services |
| 2 | Attempt to book service | Login prompt appears |
| 3 | Login/signup from prompt | Booking flow continues |

### TC-AUTH-007: Location Permission
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete authentication | Location permission prompt appears |
| 2 | Grant location permission | Nearby salons are shown on home screen |
| 3 | Deny location permission | Manual location search is available |

### TC-AUTH-008: Notification Permission
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Grant location permission | Notification permission prompt appears |
| 2 | Allow notifications | Push notifications are enabled |
| 3 | Deny notifications | App continues, notifications can be enabled later in settings |

### TC-AUTH-009: Logout
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Profile | Profile screen appears |
| 2 | Tap "Logout" | Confirmation dialog appears |
| 3 | Confirm logout | User is logged out, returns to login screen |
| 4 | Cached data is cleared | User data is removed from local storage |

---

## 2. Salon Discovery & Search

### TC-SEARCH-001: Location-Based Salon List
**Priority:** Critical  
**Precondition:** Location permission granted

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Home screen | Nearby salons are loaded based on current location |
| 2 | Scroll through salon list | Salons show name, rating, distance, image, services |
| 3 | View "Trending" section | Top-rated salons (4.0+ rating) are displayed |

### TC-SEARCH-002: Search by Salon Name
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap search bar | Search screen opens |
| 2 | Type salon name | Real-time results appear |
| 3 | Tap on salon result | Navigates to salon detail page |

### TC-SEARCH-003: Search by Service
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap search bar | Search screen opens |
| 2 | Type service name (e.g., "haircut") | Salons offering that service appear |
| 3 | Results show service availability | Service name and price visible on cards |

### TC-SEARCH-004: Filter by Category
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View filter options | Categories: Hair, Spa, Nails, Skin, etc. |
| 2 | Select "Hair" category | Only hair salons/services shown |
| 3 | Clear filter | All results shown again |

### TC-SEARCH-005: Filter by Rating
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open filters | Rating filter available (3+, 4+, 4.5+) |
| 2 | Select "4+ stars" | Only salons with 4+ rating shown |
| 3 | Sort by rating (high to low) | Results ordered by rating |

### TC-SEARCH-006: Filter by Price Range
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open filters | Price range slider available |
| 2 | Set range ₹500 - ₹2000 | Salons with services in range shown |

### TC-SEARCH-007: Filter by Distance
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open filters | Distance options: 1km, 3km, 5km, 10km+ |
| 2 | Select "3km" | Only salons within 3km shown |

### TC-SEARCH-008: Map View
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle to map view | Map displays with salon markers |
| 2 | Tap on marker | Salon preview card appears |
| 3 | Tap preview card | Navigates to salon detail |
| 4 | Scroll salon list | Map remains fixed, list scrolls independently |

### TC-SEARCH-009: Time Slot Display on Cards
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View salon cards | Available time slots shown as pill buttons |
| 2 | Tap time slot button | Navigate to salon with time pre-selected |
| 3 | View "..." button for more slots | More slots modal opens |

---

## 3. Salon Profile & Details

### TC-SALON-001: View Salon Profile
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap on salon card | Salon detail page loads |
| 2 | View header | Salon name, rating, images carousel, address |
| 3 | View tabs | Services, About, Reviews, Photos, Memberships tabs available |

### TC-SALON-002: View Services Tab
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Services tab | Services listed by category |
| 2 | View service details | Name, duration, price, description visible |
| 3 | Tap "Add" on service | Service added to cart |

### TC-SALON-003: View About Tab
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open About tab | Salon description, amenities, hours visible |
| 2 | View operating hours | Hours for each day shown |
| 3 | View address with map | Map preview with "Get Directions" button |

### TC-SALON-004: View Reviews Tab
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Reviews tab | Customer reviews listed with ratings |
| 2 | View rating breakdown | Star distribution chart shown |
| 3 | Filter reviews by rating | Reviews filtered accordingly |
| 4 | Sort by date | Most recent reviews first |

### TC-SALON-005: View Photos Tab
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Photos tab | Gallery of salon photos |
| 2 | Tap on photo | Full-screen image viewer opens |
| 3 | Swipe through photos | Can navigate between images |

### TC-SALON-006: View Memberships Tab
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Memberships tab | Available membership plans displayed |
| 2 | View plan types | Discount, Credit, Packaged plans shown |
| 3 | View plan benefits | Discount %, credits, included services listed |
| 4 | Tap "Join Now" | Purchase modal opens |

### TC-SALON-007: Add Salon to Favorites
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View salon detail | Heart icon visible |
| 2 | Tap heart icon | Icon fills, salon added to favorites |
| 3 | Tap again | Salon removed from favorites |
| 4 | View Favorites screen | Favorited salon appears |

### TC-SALON-008: Share Salon
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap share icon | Share sheet opens |
| 2 | Select sharing method | Link is shared via selected app |

---

## 4. Service Booking Flow

### TC-BOOK-001: Single Service Booking
**Priority:** Critical  
**Precondition:** User is logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to salon | Salon detail page opens |
| 2 | Select a service | Service added to cart, "Continue" button appears |
| 3 | Tap "Continue" | Date/time selection screen opens |
| 4 | Select date | Available time slots for that date shown |
| 5 | Select time slot | Proceed to booking details screen |
| 6 | Review booking details | Service, date, time, price summary shown |
| 7 | Tap "Proceed to Payment" | Payment screen opens |

### TC-BOOK-002: Multiple Services Booking
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add first service | Cart shows 1 item |
| 2 | Add second service | Cart shows 2 items, total updated |
| 3 | View cart summary | All selected services listed |
| 4 | Remove a service | Cart updated, total recalculated |
| 5 | Proceed to booking | Combined duration calculated |

### TC-BOOK-003: Staff Selection (Optional)
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select service | Staff selection option appears |
| 2 | View available staff | Staff names with photos and ratings |
| 3 | Select specific staff | Time slots filtered for that staff |
| 4 | Select "Any available" | All available slots shown |

### TC-BOOK-004: Date Selection
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View date picker | Calendar or horizontal date scroll |
| 2 | View today | Today's date highlighted if slots available |
| 3 | Select future date | Available slots for that date shown |
| 4 | Try selecting past date | Past dates are disabled |

### TC-BOOK-005: Time Slot Selection
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View time slots | Available slots shown in grid |
| 2 | Unavailable slots | Grayed out or marked "Booked" |
| 3 | Select slot | Slot highlighted, "Continue" enabled |
| 4 | Peak/off-peak pricing | Different prices shown if enabled |

### TC-BOOK-006: Add Booking Notes
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking details screen | Notes input field available |
| 2 | Enter special instructions | Text saved (max 500 characters) |
| 3 | Complete booking | Notes appear on booking confirmation |

---

## 5. Package Booking

### TC-PKG-001: View Service Packages
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to salon | Packages tab visible |
| 2 | Open Packages tab | Available packages listed |
| 3 | View package details | Included services, total duration, savings shown |

### TC-PKG-002: Book Package
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select package | Package detail modal opens |
| 2 | View included services | All services in package listed |
| 3 | View savings | Original price vs package price shown |
| 4 | Tap "Book Package" | Date/time selection screen opens |
| 5 | Complete booking | Package booked at discounted price |

### TC-PKG-003: Package Price Validation
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Book package | Server validates package price |
| 2 | Proceed to payment | Correct package price charged (not manipulated) |

---

## 6. Membership System

### TC-MEM-001: View Available Memberships
**Priority:** High  
**Precondition:** Salon has active membership plans

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to salon | Memberships tab visible |
| 2 | Open Memberships tab | Available plans displayed |
| 3 | View Discount Plan | Discount percentage, price, duration shown |
| 4 | View Credit Plan (Beauty Bank) | Monthly credits, bonus %, price shown |
| 5 | View Packaged Plan | Included services with quantities shown |

### TC-MEM-002: Purchase Membership (Discount Plan)
**Priority:** High  
**Precondition:** User is logged in

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select discount plan | Confirmation modal opens |
| 2 | Review plan details | Plan name, duration, price, benefits shown |
| 3 | Tap "Confirm Purchase" | Payment processed |
| 4 | View confirmation | "Membership Activated" message shown |
| 5 | Check My Memberships | New membership appears as "Active" |

### TC-MEM-003: Purchase Membership (Credit Plan)
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select credit plan | Confirmation modal opens |
| 2 | View credit amount + bonus | Credits shown (e.g., ₹2000 + 20% bonus = ₹2400) |
| 3 | Complete purchase | Credits added to account |
| 4 | View My Memberships | Remaining credits balance shown |

### TC-MEM-004: Purchase Membership (Packaged Plan)
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select packaged plan | Confirmation modal opens |
| 2 | View included services | Service names with monthly quantities shown |
| 3 | Complete purchase | Services quota initialized |
| 4 | View My Memberships | Usage tracking shown (e.g., "0/2 used this month") |

### TC-MEM-005: View My Memberships
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Profile > My Memberships | All memberships listed |
| 2 | View active membership | Status "Active", salon name, benefits shown |
| 3 | View remaining credits (credit plan) | Current balance displayed |
| 4 | View service usage (packaged plan) | Used/remaining quantities shown |
| 5 | View validity | Start and end dates shown |

### TC-MEM-006: Membership Benefits at Checkout
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Book service at member salon | System detects active membership |
| 2 | View price breakdown | Membership discount automatically applied |
| 3 | Discount displayed | "Membership (X% off): -₹XXX" line shown |
| 4 | Final price | Reflects discounted amount |

### TC-MEM-007: Pause Membership
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to My Memberships | Active membership shown |
| 2 | Tap "Pause" button | Confirmation dialog appears |
| 3 | Confirm pause | Status changes to "Paused" |
| 4 | Benefits suspended | Discount not applied during pause |

### TC-MEM-008: Resume Membership
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View paused membership | "Resume" button visible |
| 2 | Tap "Resume" | Membership reactivated |
| 3 | Status changes to "Active" | Benefits restored |

### TC-MEM-009: Cancel Membership
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View active membership | "Cancel" button visible |
| 2 | Tap "Cancel" | Confirmation with warning appears |
| 3 | Confirm cancellation | Status changes to "Cancelled" |
| 4 | Refund (if applicable) | Prorated refund processed |

### TC-MEM-010: Membership Expiry Warning
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Membership nearing expiry (30 days) | Warning indicator shown |
| 2 | View warning | "X days remaining" displayed |
| 3 | Receive reminder notification | Renewal reminder sent |

### TC-MEM-011: Membership Not Available (Guest User)
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Browse as guest | Membership plans visible |
| 2 | Tap "Join Now" | Login prompt appears |
| 3 | Login/signup | Can proceed with purchase |

---

## 7. Payment & Checkout

### TC-PAY-001: Pay Now (Online Payment)
**Priority:** Critical  
**Precondition:** Booking created, on payment screen

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Pay Now" option | 5% online discount shown |
| 2 | View price breakdown | Subtotal, discount, GST, total displayed |
| 3 | Tap "Confirm Booking" | Razorpay payment sheet opens |
| 4 | Complete payment | Booking confirmed, confirmation screen shown |

### TC-PAY-002: Pay at Salon
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Pay at Salon" | No online discount applied |
| 2 | View total | Full amount shown |
| 3 | Tap "Confirm Booking" | Booking created with status "Pending" |
| 4 | View confirmation | Instructions for payment at salon shown |

### TC-PAY-003: Pay Deposit
**Priority:** High  
**Precondition:** Salon requires deposit for booking

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View payment options | "Pay Deposit" option available |
| 2 | View deposit amount | Deposit amount and remaining balance shown |
| 3 | Select deposit option | Deposit payment processed |
| 4 | View confirmation | Deposit paid indicator, remaining balance noted |

### TC-PAY-004: Apply Gift Card
**Priority:** High  
**Precondition:** User has valid gift card

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On payment screen | "Apply Gift Card" section visible |
| 2 | Enter gift card code | Code validated |
| 3 | View applied amount | Gift card balance applied to total |
| 4 | Remaining balance | Deducted from gift card |

### TC-PAY-005: Invalid Gift Card
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter invalid gift card code | Error message "Invalid gift card code" |
| 2 | Enter expired card | Error message "Gift card has expired" |
| 3 | Enter card for different salon | Error message "Gift card not valid at this salon" |

### TC-PAY-006: Membership Discount Applied
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Book at salon with active membership | Membership detected automatically |
| 2 | View price breakdown | Membership discount line shown |
| 3 | Complete payment | Discounted price charged |

### TC-PAY-007: Payment Failure
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt payment | Payment fails (insufficient funds, declined) |
| 2 | Error displayed | "Payment failed" message with reason |
| 3 | Retry option | "Try Again" button available |
| 4 | Retry payment | Payment sheet reopens |

### TC-PAY-008: GST Calculation
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View price breakdown | GST (18%) calculated correctly |
| 2 | GST on discounted amount | GST applied after discounts |

---

## 8. Gift Cards

### TC-GC-001: View Gift Cards Section
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Gift Cards | Gift cards section loads |
| 2 | View available gift cards | Design options displayed |
| 3 | View denominations | ₹500, ₹1000, ₹2000, etc. available |

### TC-GC-002: Purchase Gift Card
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select gift card design | Design selected |
| 2 | Select amount | Amount selected (or custom amount) |
| 3 | Enter recipient details | Name, email, message entered |
| 4 | Complete payment | Gift card purchased |
| 5 | View confirmation | Gift card code displayed |

### TC-GC-003: Send Gift Card
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete gift card purchase | Send options appear |
| 2 | Send via email | Recipient receives gift card email |
| 3 | Send via WhatsApp | Share sheet opens with gift card link |

### TC-GC-004: View My Gift Cards (Wallet)
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Gift Card Wallet | Purchased/received gift cards listed |
| 2 | View gift card details | Balance, expiry date, code shown |
| 3 | View transaction history | Usage history displayed |

### TC-GC-005: Redeem Gift Card at Checkout
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | At payment screen | Enter gift card code |
| 2 | Valid code entered | Balance applied to booking |
| 3 | Partial redemption | Remaining balance stays on card |
| 4 | Full redemption | Card marked as used |

### TC-GC-006: Check Gift Card Balance
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Gift Cards | "Check Balance" option available |
| 2 | Enter gift card code | Balance displayed |

---

## 9. Booking Management

### TC-BK-001: View Upcoming Bookings
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Appointments | Upcoming tab shows future bookings |
| 2 | View booking card | Date, time, salon, services, status shown |
| 3 | Multiple bookings | Sorted by date (soonest first) |

### TC-BK-002: View Past Bookings
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Past tab | Completed bookings listed |
| 2 | View booking details | Services, price paid, date visible |
| 3 | "Rebook" option | Quick rebooking available |

### TC-BK-003: View Booking Details
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap on booking | Booking detail screen opens |
| 2 | View all details | Salon, services, date, time, price, status |
| 3 | View staff assigned (if any) | Staff name shown |
| 4 | View payment details | Payment method, amount paid |

### TC-BK-004: Cancel Booking
**Priority:** High  
**Precondition:** Booking is in future, cancellation allowed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking details | "Cancel Booking" button visible |
| 2 | Tap Cancel | Cancellation policy shown |
| 3 | View refund estimate | Refund amount displayed based on policy |
| 4 | Confirm cancellation | Booking cancelled, refund initiated |

### TC-BK-005: Reschedule Booking
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking details | "Reschedule" button visible |
| 2 | Tap Reschedule | Date/time picker opens |
| 3 | Select new date/time | New slot confirmed |
| 4 | Confirm reschedule | Booking updated, confirmation shown |

### TC-BK-006: Get Directions to Salon
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking details | "Get Directions" button visible |
| 2 | Tap button | Maps app opens with navigation |

### TC-BK-007: Contact Salon
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking details | "Call" or "Chat" options available |
| 2 | Tap Call | Phone dialer opens |
| 3 | Tap Chat | In-app chat opens |

### TC-BK-008: Add Booking to Calendar
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking confirmation | "Add to Calendar" option |
| 2 | Tap option | Calendar app opens with event details |

---

## 10. Running Late Notification

### TC-LATE-001: Send Running Late Alert
**Priority:** High  
**Precondition:** Have upcoming booking for today

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View today's booking | "Running Late?" button visible |
| 2 | Tap button | Late arrival modal opens |
| 3 | Select delay time | Options: 5, 10, 15, 20, 30 minutes |
| 4 | Add optional message | Text field for explanation |
| 5 | Send notification | Salon receives alert |
| 6 | View confirmation | "Salon has been notified" message |

### TC-LATE-002: View Salon Response
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send late notification | Waiting for response |
| 2 | Salon responds | Push notification received |
| 3 | View response | "Please take your time" or rescheduling offer |

### TC-LATE-003: Running Late Button Availability
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View past booking | No "Running Late" button |
| 2 | View future booking (not today) | No "Running Late" button |
| 3 | View today's upcoming booking | Button is visible and active |

---

## 11. Smart Departure Alerts

### TC-DEPART-001: View Departure Status
**Priority:** High  
**Precondition:** Have upcoming booking

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Departure Status | Current departure recommendation shown |
| 2 | View recommended leave time | "Leave by 2:30 PM" displayed |
| 3 | View queue status | "2 customers ahead" or similar |

### TC-DEPART-002: Receive Departure Alert
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Queue clears at salon | Push notification received |
| 2 | View notification | "Time to leave for your appointment" |
| 3 | Tap notification | Opens booking details |

### TC-DEPART-003: Configure Departure Preferences
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Departure Preferences | Settings screen opens |
| 2 | Set buffer time | Extra time before appointment (5, 10, 15 min) |
| 3 | Enable/disable alerts | Toggle for SMS, push, WhatsApp |
| 4 | Save preferences | Settings saved |

### TC-DEPART-004: View Real-Time Queue Updates
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View departure status | Real-time updates shown |
| 2 | Queue changes | ETA updated automatically |
| 3 | Staff delay notification | Adjusted departure time shown |

---

## 12. Slot Waitlist

### TC-WAIT-001: Join Waitlist
**Priority:** High  
**Precondition:** Preferred slot is unavailable

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Try to book unavailable slot | "Join Waitlist" option appears |
| 2 | Tap Join Waitlist | Waitlist form opens |
| 3 | Specify time window | Start and end time preferences |
| 4 | Add flexibility (optional) | +/- days flexibility |
| 5 | Confirm | Added to waitlist |

### TC-WAIT-002: Receive Slot Available Notification
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On waitlist | Slot becomes available |
| 2 | Receive notification | "Your slot is now available!" |
| 3 | View offer | Time limit to accept (e.g., 15 minutes) |

### TC-WAIT-003: Accept Waitlist Offer
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Receive waitlist notification | View slot details |
| 2 | Tap "Book Now" | Slot reserved |
| 3 | Complete booking | Removed from waitlist |

### TC-WAIT-004: Decline/Expire Waitlist Offer
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Receive offer | Timer starts |
| 2 | Don't respond in time | Offer expires, next person notified |
| 3 | Still on waitlist | Remains for future openings |

### TC-WAIT-005: Cancel Waitlist Entry
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View active waitlist entries | Entry shown with details |
| 2 | Tap "Cancel" | Removed from waitlist |

---

## 13. Express Rebooking

### TC-REBOOK-001: Quick Rebook from Past Booking
**Priority:** High  
**Precondition:** Have completed bookings

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View past booking | "Rebook" button visible |
| 2 | Tap Rebook | Services pre-selected |
| 3 | Select date/time | Available slots shown |
| 4 | Confirm booking | Booking created with same services |

### TC-REBOOK-002: Rebook Suggestion Notification
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Regular booking pattern | System learns preferences |
| 2 | Appropriate time passes | "Time to rebook?" notification |
| 3 | Tap notification | Pre-filled booking based on history |

### TC-REBOOK-003: View Rebooking Suggestions
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Home | "Suggested Rebookings" section |
| 2 | View suggestions | Based on past visits and intervals |
| 3 | Tap suggestion | Pre-filled booking flow |

---

## 14. Rewards & Loyalty

### TC-REWARD-001: View Loyalty Points
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Rewards | Points balance displayed |
| 2 | View current points | Total points shown |
| 3 | View points history | Earned and redeemed transactions |

### TC-REWARD-002: Earn Points from Booking
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete booking | Points earned notification |
| 2 | View points | Balance increased |
| 3 | Points rate | Based on amount spent (e.g., ₹100 = 10 points) |

### TC-REWARD-003: View Available Rewards
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Rewards | Available rewards listed |
| 2 | View reward details | Points cost, description, validity |
| 3 | Filter by category | Discounts, free services, products |

### TC-REWARD-004: Redeem Reward
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select reward | Redemption confirmation |
| 2 | Confirm redemption | Points deducted |
| 3 | View coupon/voucher | Redeemed reward in "My Rewards" |

### TC-REWARD-005: Apply Reward at Checkout
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Have redeemed reward | At checkout |
| 2 | Apply reward | Discount/benefit applied |
| 3 | View discount | Reflected in price breakdown |

---

## 15. Booking Streaks

### TC-STREAK-001: View Current Streak
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Rewards | Streak section visible |
| 2 | View streak count | "X months streak" displayed |
| 3 | View next deadline | "Book by [date] to maintain streak" |

### TC-STREAK-002: Earn Streak Bonus
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Maintain monthly booking | Streak increments |
| 2 | Reach milestone (3, 6, 12 months) | Bonus points awarded |
| 3 | View bonus | Extra points notification |

### TC-STREAK-003: Streak At-Risk Warning
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Approaching deadline | Warning notification |
| 2 | View warning | "Book in 3 days to keep your streak" |
| 3 | Book in time | Streak maintained |

### TC-STREAK-004: Streak Broken
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Miss booking deadline | Streak resets to 0 |
| 2 | Notification | "Your streak has been broken" |
| 3 | Start new streak | First booking starts new streak |

---

## 16. Wallet System

### TC-WALLET-001: View Wallet Balance
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Wallet | Current balance displayed |
| 2 | View cashback | Available cashback amount |
| 3 | View transaction history | All credits and debits listed |

### TC-WALLET-002: Earn Cashback
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete booking with cashback offer | Cashback earned |
| 2 | View wallet | Balance increased |
| 3 | Cashback details | Source and amount shown in history |

### TC-WALLET-003: Use Wallet at Checkout
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | At payment screen | "Use Wallet" toggle available |
| 2 | Enable wallet payment | Wallet balance applied |
| 3 | Partial wallet payment | Remaining charged to card |
| 4 | Full wallet payment | No additional payment needed |

### TC-WALLET-004: Referral Credit in Wallet
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Friend uses referral | Credit earned |
| 2 | View wallet | Referral credit added |
| 3 | Transaction history | "Referral bonus" entry shown |

---

## 17. Referral Program

### TC-REF-001: View Referral Code
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Referral | Personal referral code displayed |
| 2 | View benefits | "Invite friends, get ₹X" shown |
| 3 | Terms visible | Referral terms and conditions |

### TC-REF-002: Share Referral Code
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Share | Share sheet opens |
| 2 | Select sharing method | Code/link shared via WhatsApp, SMS, etc. |
| 3 | Custom message | Pre-written invite message |

### TC-REF-003: Track Referrals
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View referral dashboard | Referral stats shown |
| 2 | See pending referrals | Invites not yet completed |
| 3 | See successful referrals | Friends who signed up |
| 4 | View earnings | Total referral rewards earned |

### TC-REF-004: Earn Referral Reward
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Friend uses referral code | Both users get reward |
| 2 | Notification received | "You earned ₹X!" |
| 3 | Credit in wallet | Referral bonus added |

---

## 18. Offers & Promotions

### TC-OFFER-001: View Available Offers
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Offers | All offers listed |
| 2 | Filter by salon | Offers from specific salon |
| 3 | Filter by category | Service-specific offers |
| 4 | View offer details | Discount, validity, terms shown |

### TC-OFFER-002: Apply Offer at Checkout
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | At payment screen | "Apply Offer" section visible |
| 2 | Select offer | Discount applied |
| 3 | View updated total | Price reduced |

### TC-OFFER-003: Birthday Offer
**Priority:** Medium  
**Precondition:** Birthday month set in profile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Birthday month arrives | Birthday offer notification |
| 2 | View offer | Special birthday discount |
| 3 | Apply offer | Discount valid for birthday window |

### TC-OFFER-004: First-Time Booking Offer
**Priority:** High  
**Precondition:** New user, never booked

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View offers | "New User" offer visible |
| 2 | Book first service | Welcome discount applied |

### TC-OFFER-005: Flash Sale Offer
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Flash sale active | Offer shown with countdown |
| 2 | Book before expiry | Discount applied |
| 3 | Offer expires | No longer applicable |

---

## 19. E-Commerce Shop

### TC-SHOP-001: Browse Products
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Shop | Product catalog displayed |
| 2 | Filter by category | Hair, Skin, Makeup, etc. |
| 3 | Filter by price | Price range filter works |
| 4 | Sort products | By price, rating, newest |

### TC-SHOP-002: View Product Details
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap product | Product detail page opens |
| 2 | View images | Multiple product images |
| 3 | View description | Product details shown |
| 4 | View variants | Size, color options if available |
| 5 | View reviews | Product ratings and reviews |

### TC-SHOP-003: Add to Cart
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On product page | "Add to Cart" button visible |
| 2 | Select variant (if any) | Variant selected |
| 3 | Tap Add to Cart | Item added, cart icon updated |
| 4 | Continue shopping | Can add more items |

### TC-SHOP-004: View Shopping Cart
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap cart icon | Cart screen opens |
| 2 | View items | All added items listed |
| 3 | View quantities | Qty shown with +/- controls |
| 4 | View totals | Subtotal, delivery, total calculated |

### TC-SHOP-005: Update Cart Quantity
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In cart | Quantity controls visible |
| 2 | Tap + | Quantity increased |
| 3 | Tap - | Quantity decreased |
| 4 | Total updated | Price recalculated |

### TC-SHOP-006: Remove from Cart
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In cart | Remove button/swipe available |
| 2 | Remove item | Item removed from cart |
| 3 | Empty cart | "Cart is empty" message |

### TC-SHOP-007: Product Checkout
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Checkout | Checkout screen opens |
| 2 | Enter delivery address | Address form displayed |
| 3 | Select delivery option | Delivery/pickup options |
| 4 | Complete payment | Order placed |
| 5 | Order confirmation | Order ID and details shown |

### TC-SHOP-008: View Order History
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Orders | Order list displayed |
| 2 | View order details | Items, total, status shown |
| 3 | Track order | Delivery status updates |

### TC-SHOP-009: Cancel Order
**Priority:** Medium  
**Precondition:** Order in "Processing" status

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View order details | "Cancel Order" button visible |
| 2 | Tap Cancel | Confirmation dialog |
| 3 | Confirm | Order cancelled, refund initiated |

### TC-SHOP-010: Add to Wishlist
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On product page | Heart icon visible |
| 2 | Tap heart | Product added to wishlist |
| 3 | View wishlist | Product appears in list |

### TC-SHOP-011: Submit Product Review
**Priority:** Medium  
**Precondition:** Have purchased product

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View purchased product | "Write Review" option |
| 2 | Rate product (1-5 stars) | Rating selected |
| 3 | Write review text | Review entered |
| 4 | Submit | Review published |

---

## 20. Events System

### TC-EVENT-001: Browse Events
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Events | Event list displayed |
| 2 | View event cards | Name, date, venue, image shown |
| 3 | Filter by date | Upcoming/past events |
| 4 | Filter by type | Workshops, masterclasses, etc. |

### TC-EVENT-002: View Event Details
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap event | Event detail page opens |
| 2 | View Details tab | Description, highlights |
| 3 | View Agenda tab | Schedule breakdown |
| 4 | View Speakers tab | Speaker bios and photos |
| 5 | View Venue tab | Location with map |

### TC-EVENT-003: Register for Event
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On event page | "Register" button visible |
| 2 | Tap Register | Ticket selection screen |
| 3 | Select ticket type | Options with pricing shown |
| 4 | Enter attendee details | Name, email, phone |
| 5 | Review and pay | Payment processed |
| 6 | Confirmation | Ticket with QR code displayed |

### TC-EVENT-004: View My Tickets
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to My Tickets | Registered events listed |
| 2 | View ticket | Event details and QR code |
| 3 | Download ticket | PDF ticket saved |

### TC-EVENT-005: Cancel Event Registration
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View ticket | "Cancel Registration" option |
| 2 | View refund policy | Refund amount based on timing |
| 3 | Confirm cancellation | Refund processed |

### TC-EVENT-006: Submit Event Feedback
**Priority:** Medium  
**Precondition:** Event attended

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Post-event | "Leave Feedback" notification |
| 2 | Rate aspects | Speakers, content, venue rated |
| 3 | Submit feedback | Thank you message |

---

## 21. Chat System

### TC-CHAT-001: Start Chat with Salon
**Priority:** High  
**Precondition:** Have booking with salon

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking details | "Chat" button visible |
| 2 | Tap Chat | Conversation opens |
| 3 | Send message | Message delivered |
| 4 | Receive response | Real-time message received |

### TC-CHAT-002: View Conversations List
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Messages | All conversations listed |
| 2 | View unread count | Unread badge on conversations |
| 3 | Tap conversation | Chat opens |

### TC-CHAT-003: Receive Message Notification
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Salon sends message | Push notification received |
| 2 | Tap notification | Opens chat directly |

### TC-CHAT-004: Send Image in Chat
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In chat | Attachment button visible |
| 2 | Select image | Image preview shown |
| 3 | Send | Image sent and visible |

---

## 22. Notifications

### TC-NOTIF-001: Receive Booking Confirmation
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete booking | Push notification received |
| 2 | View notification | Booking details shown |
| 3 | Tap notification | Opens booking details |

### TC-NOTIF-002: Receive Reminder Notifications
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Booking tomorrow | Reminder notification (24 hours before) |
| 2 | Booking today | Reminder notification (1-2 hours before) |

### TC-NOTIF-003: View Notification Center
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap notification icon | Notification center opens |
| 2 | View all notifications | Listed by date |
| 3 | Mark as read | Unread indicator cleared |
| 4 | Delete notification | Notification removed |

### TC-NOTIF-004: Manage Notification Preferences
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings | Notification settings available |
| 2 | Toggle categories | Bookings, offers, messages toggles |
| 3 | Save preferences | Settings applied |

### TC-NOTIF-005: Promotional Notifications
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | New offer available | Promo notification received |
| 2 | Disable promo notifications | No more promo notifications |

---

## 23. Profile Management

### TC-PROF-001: View Profile
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Profile | Profile screen opens |
| 2 | View user info | Name, phone, email displayed |
| 3 | View stats | Bookings count, total spent shown |

### TC-PROF-002: Edit Profile
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Edit Profile | Edit screen opens |
| 2 | Update name | Name field editable |
| 3 | Update email | Email field editable |
| 4 | Update birthday | Date picker for birthday |
| 5 | Save changes | Profile updated |

### TC-PROF-003: Change Profile Photo
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap profile photo | Options: camera, gallery |
| 2 | Select new photo | Photo cropped/uploaded |
| 3 | View updated photo | New photo displayed |

### TC-PROF-004: Manage Saved Cards
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Saved Cards | Saved payment methods listed |
| 2 | Add new card | Card details entered |
| 3 | Remove card | Card deleted |
| 4 | Set default card | Default payment method set |

### TC-PROF-005: Change Language
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Language | Language options shown |
| 2 | Select Hindi | App language changes |
| 3 | All text updated | UI in selected language |

### TC-PROF-006: View Booking History
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Booking History | All past bookings listed |
| 2 | Filter by date | Date range filter works |
| 3 | Filter by salon | Salon-specific history |

### TC-PROF-007: View Payment History
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Payment History | All transactions listed |
| 2 | View transaction details | Amount, date, method shown |
| 3 | Download receipt | PDF receipt generated |

### TC-PROF-008: Help & Support
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap Help & Support | Support options shown |
| 2 | View FAQs | Common questions answered |
| 3 | Contact support | Chat/email options |

### TC-PROF-009: Beauty Profile
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Beauty Profile | Profile questions |
| 2 | Answer hair type | Hair texture, concerns saved |
| 3 | Answer skin type | Skin type, concerns saved |
| 4 | Get recommendations | Personalized service suggestions |

---

## 24. Favorites & Wishlist

### TC-FAV-001: View Favorites
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Favorites | Favorited salons listed |
| 2 | Tap salon | Opens salon detail |
| 3 | Remove from favorites | Salon removed from list |

### TC-FAV-002: Add Service to Favorites
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View service | Heart icon visible |
| 2 | Tap heart | Service added to favorites |
| 3 | View favorites | Service appears in list |

### TC-FAV-003: View Wishlist (Products)
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Wishlist | Saved products listed |
| 2 | View product | Product details accessible |
| 3 | Move to cart | Product added to cart |
| 4 | Remove from wishlist | Product removed |

---

## 25. AI Features

### TC-AI-001: AI Look Advisor
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to AI Look Advisor | Feature screen opens |
| 2 | Take/upload photo | Face captured |
| 3 | Get recommendations | Hairstyle/makeup suggestions |
| 4 | Book suggested service | Navigate to booking |

### TC-AI-002: Virtual Try-On
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View service with try-on | "Try On" button visible |
| 2 | Enable camera | AR overlay active |
| 3 | View different styles | Styles applied to face in real-time |
| 4 | Save look | Screenshot saved |

---

## 26. Deposits

### TC-DEP-001: View Deposit Requirements
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Book high-value service | Deposit info displayed |
| 2 | View deposit amount | Percentage or fixed amount shown |
| 3 | View refund policy | Deposit refund terms visible |

### TC-DEP-002: Pay Deposit
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Pay Deposit" | Deposit amount shown |
| 2 | Complete payment | Deposit charged |
| 3 | View booking | Deposit paid indicator |
| 4 | Remaining balance | Amount to pay at salon shown |

### TC-DEP-003: View Deposit History
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Deposit History | All deposits listed |
| 2 | View deposit details | Amount, booking, status shown |
| 3 | View applied deposits | Deposits used against bookings |

### TC-DEP-004: Deposit Refund
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Cancel eligible booking | Refund calculated |
| 2 | Deposit refund processed | Refund to original payment method |

---

## 27. Cancellation & Refunds

### TC-CANCEL-001: Cancel with Full Refund
**Priority:** High  
**Precondition:** Cancel within full refund window

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking | "Cancel" button visible |
| 2 | View cancellation policy | Full refund eligible |
| 3 | Confirm cancellation | Booking cancelled |
| 4 | Refund initiated | 100% refund processed |

### TC-CANCEL-002: Cancel with Partial Refund
**Priority:** High  
**Precondition:** Cancel after partial refund window

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking | "Cancel" button visible |
| 2 | View cancellation policy | Partial refund shown (e.g., 50%) |
| 3 | Confirm cancellation | Booking cancelled |
| 4 | Refund initiated | Prorated refund processed |

### TC-CANCEL-003: Cancel with No Refund
**Priority:** High  
**Precondition:** Cancel too close to appointment

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View booking | "Cancel" button visible |
| 2 | View cancellation policy | "No refund" warning |
| 3 | Confirm anyway | Booking cancelled, no refund |

### TC-CANCEL-004: View Refund Status
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Cancel booking with refund | Refund initiated |
| 2 | View booking details | Refund status shown |
| 3 | Refund completed | Status updated, funds returned |

---

## 28. Reviews & Ratings

### TC-REV-001: Submit Booking Review
**Priority:** High  
**Precondition:** Have completed booking

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View completed booking | "Write Review" option |
| 2 | Rate overall experience (1-5 stars) | Rating selected |
| 3 | Rate specific aspects | Staff, service, ambiance |
| 4 | Write review text | Review entered |
| 5 | Submit | Review published |

### TC-REV-002: Edit Review
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View submitted review | Edit option visible |
| 2 | Modify rating/text | Changes made |
| 3 | Save | Review updated |

### TC-REV-003: View My Reviews
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to My Reviews | All submitted reviews listed |
| 2 | View review details | Salon, rating, date shown |

### TC-REV-004: Review Prompts
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete booking | Review reminder after 24 hours |
| 2 | Tap notification | Review form opens |

---

## 29. QR Scanner

### TC-QR-001: Scan Gift Card QR Code
**Priority:** High  
**Precondition:** Have valid gift card with QR code

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to QR Scanner | Camera permission requested |
| 2 | Grant camera permission | Scanner view opens |
| 3 | Point at valid gift card QR | QR code detected and scanned |
| 4 | Validation in progress | Loading indicator shown |
| 5 | Valid code | Redirects to gift card details |

### TC-QR-002: Scan Invalid QR Code
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scan non-gift card QR | Error "Invalid QR Code" displayed |
| 2 | Scan expired gift card | Error "Gift card expired" displayed |
| 3 | Tap "Try Again" | Scanner resets for new scan |

### TC-QR-003: Manual Gift Card Entry
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On scanner screen | "Enter Code Manually" option visible |
| 2 | Tap manual entry | Text input field appears |
| 3 | Enter gift card code | Code validated |
| 4 | Valid code | Redirects to gift card details |
| 5 | Invalid code | Error message displayed |

### TC-QR-004: Camera Permission Denied
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open QR Scanner | Permission prompt appears |
| 2 | Deny camera permission | Permission denied message |
| 3 | Manual entry option | Can still enter code manually |
| 4 | "Open Settings" option | Can navigate to enable camera |

---

## 30. At-Home Services

### TC-HOME-001: Browse At-Home Services
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to "At Home" tab | Home service providers displayed |
| 2 | View service categories | Haircut, Facial, Massage, etc. shown |
| 3 | Filter by category | Only selected category shown |
| 4 | View provider details | Rating, distance, services listed |

### TC-HOME-002: Book At-Home Service
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select service provider | Provider detail page opens |
| 2 | Select at-home service | Service added with "Home Visit" tag |
| 3 | Enter service address | Address form with autocomplete |
| 4 | Select date/time | Available slots shown |
| 5 | Confirm booking | Home visit booking created |
| 6 | View confirmation | Address and arrival time shown |

### TC-HOME-003: Address for Home Service
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Booking at-home service | Address required prompt |
| 2 | Enter new address | Full address with landmark |
| 3 | Use saved address | Previous addresses available |
| 4 | Add special instructions | "Gate code: 1234", etc. |

### TC-HOME-004: At-Home Service Pricing
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View at-home service | Service price displayed |
| 2 | View additional fee | "Home visit fee: ₹X" shown |
| 3 | View total | Service + home visit fee |
| 4 | Distance-based fee | Fee varies by distance |

### TC-HOME-005: Track Technician Arrival
**Priority:** Medium  
**Precondition:** At-home booking confirmed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View upcoming booking | "Track Arrival" option (if supported) |
| 2 | Technician en route | ETA displayed |
| 3 | Technician arrives | "Arrived" notification |

---

## 31. Dynamic Pricing

### TC-DYNAMIC-001: View Peak/Off-Peak Indicators
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select service | Time slot selection screen |
| 2 | View time slots | Peak slots marked with icon/color |
| 3 | View off-peak slots | Lower price or "Save X%" shown |
| 4 | Legend/info | Explanation of pricing tiers |

### TC-DYNAMIC-002: Book Off-Peak Slot with Discount
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View available slots | Off-peak slots show discount |
| 2 | Select off-peak slot | Discount applied to price |
| 3 | View price breakdown | "Off-Peak Discount: -₹X" shown |
| 4 | Complete booking | Discounted price charged |

### TC-DYNAMIC-003: Book Peak Hour Slot
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select peak time slot | Full price displayed |
| 2 | Peak indicator | "High Demand" or surge icon |
| 3 | Optional surcharge | Surcharge disclosed if applicable |
| 4 | Confirm booking | Peak pricing applied |

### TC-DYNAMIC-004: Happy Hour Pricing
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View slots during happy hour | "Happy Hour" badge visible |
| 2 | View discount | Special discount shown |
| 3 | Book during happy hour | Discount applied automatically |

---

## 32. Service Bundles

### TC-BUNDLE-001: View Service Bundles
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to salon | "Bundles" or "Combos" tab visible |
| 2 | View bundle list | Bundle cards with savings shown |
| 3 | View bundle details | Included services listed |
| 4 | View savings | "Save ₹X" or "X% Off" displayed |

### TC-BUNDLE-002: Book Service Bundle
**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select bundle | Bundle detail modal opens |
| 2 | View all included services | Services with individual prices |
| 3 | View total savings | Regular vs bundle price |
| 4 | Tap "Book Bundle" | Date/time selection |
| 5 | Complete booking | Bundle booked at discounted price |

### TC-BUNDLE-003: Bundle Availability
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View limited-time bundle | Validity dates shown |
| 2 | Expired bundle | "Offer Expired" indicator |
| 3 | Day-specific bundle | Only available on valid days |

### TC-BUNDLE-004: Compare Bundle vs Individual
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View bundle | "Compare" or breakdown visible |
| 2 | Individual services | Sum of individual prices shown |
| 3 | Bundle price | Discounted total shown |
| 4 | Savings highlighted | Clear savings amount |

---

## Test Execution Summary Template

| Module | Total Cases | Passed | Failed | Blocked | Not Tested |
|--------|-------------|--------|--------|---------|------------|
| Authentication | 9 | | | | |
| Salon Discovery | 9 | | | | |
| Salon Profile | 8 | | | | |
| Service Booking | 6 | | | | |
| Package Booking | 3 | | | | |
| Membership | 11 | | | | |
| Payment | 8 | | | | |
| Gift Cards | 6 | | | | |
| Booking Management | 8 | | | | |
| Running Late | 3 | | | | |
| Departure Alerts | 4 | | | | |
| Waitlist | 5 | | | | |
| Express Rebooking | 3 | | | | |
| Rewards | 5 | | | | |
| Booking Streaks | 4 | | | | |
| Wallet | 4 | | | | |
| Referral | 4 | | | | |
| Offers | 5 | | | | |
| E-Commerce | 11 | | | | |
| Events | 6 | | | | |
| Chat | 4 | | | | |
| Notifications | 5 | | | | |
| Profile | 9 | | | | |
| Favorites | 3 | | | | |
| AI Features | 2 | | | | |
| Deposits | 4 | | | | |
| Cancellation | 4 | | | | |
| Reviews | 4 | | | | |
| QR Scanner | 4 | | | | |
| At-Home Services | 5 | | | | |
| Dynamic Pricing | 4 | | | | |
| Service Bundles | 4 | | | | |
| **TOTAL** | **169** | | | | |

---

## Notes

1. **Priority Levels:**
   - Critical: Core functionality, must pass for release
   - High: Important features, should pass for good UX
   - Medium: Nice-to-have functionality
   - Low: Edge cases or optional features

2. **Test Data Requirements:**
   - Test phone numbers for OTP testing
   - Test salons with various configurations
   - Test gift cards with different balances
   - Test memberships of all types

3. **Environment Requirements:**
   - Development environment with test database
   - Razorpay test mode for payment testing
   - Push notification testing (Firebase)
