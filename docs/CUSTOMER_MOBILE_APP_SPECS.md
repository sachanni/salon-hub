# SalonHub Customer Mobile App - Screen Specifications

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

The SalonHub Customer Mobile App is a beauty and wellness booking platform that enables users to discover salons, book appointments, manage their profiles, and access exclusive offers. The app targets urban customers in India (primarily Delhi NCR) seeking convenient beauty service bookings with real-time availability, secure payments, and personalized experiences.

**Key Objectives:**
- Streamline salon discovery with location-based search
- Enable quick, hassle-free booking (3 taps or less)
- Provide transparent pricing with dynamic offers
- Build customer loyalty through wallet rewards and personalized recommendations
- Support both authenticated and guest booking flows

---

## User Personas

### Primary Persona: Urban Professional (25-40 years)
- **Goal:** Quick, convenient booking of trusted beauty services
- **Pain Points:** Limited time, inconsistent service quality, unclear pricing
- **Behavior:** Mobile-first, expects instant booking confirmation, values reviews

### Secondary Persona: Beauty Enthusiast (18-35 years)
- **Goal:** Discover new salons, try trending services, get personalized recommendations
- **Pain Points:** Decision paralysis, lack of inspiration
- **Behavior:** Social media influenced, enjoys AR try-on features, shares experiences

### Tertiary Persona: Occasional User (35-60 years)
- **Goal:** Reliable service for special occasions
- **Pain Points:** Overwhelmed by options, prefers familiar providers
- **Behavior:** Needs simple interface, values phone support

---

## App Architecture

### Technology Stack Recommendations

**Frontend:**
- React Native (for code sharing with web) OR Flutter (for performance)
- State Management: Redux Toolkit / MobX
- Navigation: React Navigation (RN) / Go Router (Flutter)
- UI Components: NativeBase / React Native Paper (RN) / Material 3 (Flutter)

**Backend Integration:**
- RESTful API (existing Express.js backend)
- Real-time: WebSockets for booking status updates
- Image Optimization: CloudFlare CDN for media assets

**Local Storage:**
- Async Storage (RN) / SharedPreferences (Flutter)
- Secure token storage: Keychain (iOS) / Keystore (Android)
- Cache: React Query / Dio Cache (Flutter)

**Third-Party SDKs:**
- Maps: Google Maps SDK (iOS/Android)
- Payments: Razorpay SDK
- Authentication: Firebase Auth SDK
- Analytics: Firebase Analytics + Mixpanel
- AR Features: Banuba SDK integration

---

## Authentication Flow

### 1. Onboarding Screens

#### 1.1 Splash Screen
**Duration:** 2-3 seconds  
**Elements:**
- SalonHub logo with animation
- Loading indicator
- Version number (footer)

**Logic:**
- Check authentication status
- Load cached user data
- Check for app updates

**Transitions:**
- If authenticated → Home Screen
- If not authenticated → Welcome Screen

---

#### 1.2 Welcome/Introduction Screen
**Type:** Swipeable carousel (3-4 screens)

**Screen 1: Discover**
- Hero image: Customer browsing salons on phone
- Headline: "Find Your Perfect Salon"
- Subtext: "Discover trusted beauty professionals near you"

**Screen 2: Book**
- Hero image: Calendar with confirmed booking
- Headline: "Book in Seconds"
- Subtext: "Choose services, select time, and confirm instantly"

**Screen 3: Rewards**
- Hero image: Wallet with cashback
- Headline: "Earn While You Glow"
- Subtext: "Get cashback, offers, and exclusive deals"

**Screen 4: AI Features (Optional)**
- Hero image: AR makeup try-on
- Headline: "Try Before You Book"
- Subtext: "Visualize your look with AI-powered recommendations"

**Actions:**
- "Skip" (top right)
- "Next" button (bottom)
- "Get Started" on final screen

---

### 2. Authentication Screens

#### 2.1 Login/Signup Choice Screen
**Layout:**
```
┌─────────────────────────────────┐
│    [SalonHub Logo]              │
│                                 │
│  "Welcome to SalonHub"          │
│  Your beauty journey starts     │
│         here                    │
│                                 │
│  ┌─────────────────────────┐   │
│  │  [Phone Icon]           │   │
│  │  Continue with Phone    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  [Google Icon]          │   │
│  │  Continue with Google   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  [Email Icon]           │   │
│  │  Continue with Email    │   │
│  └─────────────────────────┘   │
│                                 │
│  Continue as Guest →            │
│                                 │
│  By continuing, you agree to   │
│  Terms & Privacy Policy         │
└─────────────────────────────────┘
```

**API:** None (navigation only)

---

#### 2.2 Phone Number Entry Screen
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back]                       │
│                                 │
│  Enter Your Phone Number        │
│  We'll send you a verification  │
│  code                           │
│                                 │
│  ┌─────────────────────────┐   │
│  │ +91 [Phone Input]       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Send OTP               │   │
│  └─────────────────────────┘   │
│                                 │
│  Use Email Instead →            │
└─────────────────────────────────┘
```

**Validation:**
- Indian mobile number format (+91)
- 10-digit validation
- Real-time formatting (adds spaces)

**API:** `POST /api/auth/check-user-exists`
- Request: `{ phone: "+919876543210" }`
- Response: `{ exists: boolean }`

**Behavior:**
- If exists → Send OTP for login
- If not exists → Send OTP for registration

**API:** Firebase Authentication (SMS OTP)
- Use Firebase SDK for OTP generation
- Auto-read OTP on Android (SMS Retriever API)

---

#### 2.3 OTP Verification Screen
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back]                       │
│                                 │
│  Verify Your Number              │
│  Code sent to +91 98765 43210   │
│  [Edit]                         │
│                                 │
│  ┌───┬───┬───┬───┬───┬───┐     │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │     │
│  └───┴───┴───┴───┴───┴───┘     │
│                                 │
│  Resend code in 00:45           │
│                                 │
│  [Verify Button]                │
│                                 │
│  Didn't receive? Send Again     │
└─────────────────────────────────┘
```

**Features:**
- Auto-focus next input box
- Auto-submit on 6th digit entry
- Countdown timer (60s)
- Resend OTP functionality

**API:** Firebase Auth + `POST /api/auth/register` or `POST /api/auth/login`
- Request: `{ phone, firebaseToken }`
- Response: `{ user, session }`

---

#### 2.4 Profile Completion (New Users Only)
**Layout:**
```
┌─────────────────────────────────┐
│  Complete Your Profile          │
│  Just a few quick details       │
│                                 │
│  ┌─────────────────────────┐   │
│  │ First Name              │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Last Name               │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Email (optional)        │   │
│  └─────────────────────────┘   │
│                                 │
│  [Profile Photo]                │
│  [+ Add Photo]                  │
│                                 │
│  [Continue Button]              │
│                                 │
│  Skip for now →                 │
└─────────────────────────────────┘
```

**API:** `PUT /api/auth/user/profile`
- Request: `{ firstName, lastName, email?, photoUrl? }`

---

#### 2.5 Email/Password Login (Alternative)
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back]                       │
│                                 │
│  Login with Email               │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Email Address           │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Password [👁]           │   │
│  └─────────────────────────┘   │
│                                 │
│         Forgot Password? →      │
│                                 │
│  [Login Button]                 │
│                                 │
│  Don't have an account?         │
│  Sign Up →                      │
└─────────────────────────────────┘
```

**API:** `POST /api/auth/login`
- Request: `{ email, password, loginType: 'customer' }`

---

## Core Features & Screens

### Feature Matrix

| Feature | Priority | Complexity | MVP |
|---------|----------|------------|-----|
| Salon Search & Discovery | P0 | Medium | ✅ |
| Service Booking | P0 | High | ✅ |
| User Profile | P0 | Low | ✅ |
| Payment Integration | P0 | High | ✅ |
| Booking Management | P1 | Medium | ✅ |
| Wallet & Rewards | P1 | Medium | ✅ |
| Offers & Promotions | P1 | Low | ✅ |
| Reviews & Ratings | P2 | Medium | ⏳ |
| AI Look Advisor | P2 | High | ⏳ |
| Saved Favorites | P2 | Low | ⏳ |

---

## Screen Specifications

### 3. Home Screen (Primary)

#### 3.1 Home Screen - Main View
**Navigation:** Bottom Tab (Home Icon - Selected)

**Layout:**
```
┌─────────────────────────────────┐
│  [Logo] [Location ▼] [Profile] │ ← Header (Sticky)
├─────────────────────────────────┤
│  [Search: Services, Salons...]  │ ← Search Bar
│  [Filter Icon] [Map View Icon]  │
├─────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐       │ ← Category Pills
│  │Hair │ │Nails│ │Spa  │ →     │
│  └─────┘ └─────┘ └─────┘       │
├─────────────────────────────────┤
│  🎁 Exclusive Offers             │ ← Offer Banner
│  [Swipeable Banner Carousel]    │
├─────────────────────────────────┤
│  Recently Viewed                │
│  ┌───────────┐ ┌───────────┐   │
│  │[Salon Img]│ │[Salon Img]│→  │
│  │Salon Name │ │Salon Name │   │
│  │⭐ 4.5 | 2km│ │⭐ 4.8 | 3km│   │
│  └───────────┘ └───────────┘   │
├─────────────────────────────────┤
│  Recommended for You            │
│  [Card Grid - 2 columns]        │
│  ┌──────┐ ┌──────┐             │
│  │Salon1│ │Salon2│             │
│  └──────┘ └──────┘             │
│  ┌──────┐ ┌──────┐             │
│  │Salon3│ │Salon4│             │
│  └──────┘ └──────┘             │
├─────────────────────────────────┤
│  New & Trending                 │
│  [Horizontal Scroll Cards]      │
└─────────────────────────────────┘
```

**Components:**

1. **Header Bar (Sticky)**
   - SalonHub logo (left)
   - Location dropdown (center) - Shows current/selected location
   - Profile icon (right) - Access to profile menu

2. **Search Bar**
   - Placeholder: "Search services, salons, or locations"
   - Voice search icon (optional)
   - Tap → Navigate to Search Screen

3. **Category Pills (Horizontal Scroll)**
   - Pre-defined categories: Hair, Nails, Spa, Makeup, Facial, Waxing, etc.
   - Active state highlighting
   - Tap → Filter results by category

4. **Offer Banner Carousel**
   - Auto-scroll (5s interval)
   - Pagination dots
   - Tap → Navigate to Offer Details

5. **Recently Viewed Section**
   - Shows last 5-10 viewed salons
   - Horizontal scroll
   - Each card shows: Image, Name, Rating, Distance

6. **Recommended Section**
   - 2-column grid layout
   - Based on user preferences and location
   - Infinite scroll / Load more

7. **New & Trending**
   - Horizontal scroll cards
   - Badge: "NEW" or "TRENDING"

**Salon Card Design:**
```
┌──────────────────────────┐
│  [Salon Image]           │ ← 16:9 ratio
│  [❤ Favorite Icon]       │ ← Top right overlay
├──────────────────────────┤
│  Salon Name              │ ← Bold, 16sp
│  ⭐ 4.5 (120) | 2.3 km   │ ← Rating, reviews, distance
│  Open Now • $$           │ ← Status, price range
│  Hair, Nails, Spa        │ ← Categories (truncate)
│                          │
│  [View Services →]       │ ← CTA button
└──────────────────────────┘
```

**API Endpoints:**
- `GET /api/salons?lat={lat}&lng={lng}&radiusKm=5` - Get nearby salons
- `GET /api/offers` - Get active offers
- `GET /api/user/recently-viewed` - Get recently viewed salons (cached)

**User Interactions:**
- Pull-to-refresh → Refresh salon list
- Tap salon card → Navigate to Salon Profile
- Tap search bar → Navigate to Search Screen
- Tap location → Open Location Picker
- Tap filter → Open Filter Bottom Sheet
- Tap map view → Switch to Map View

**Performance:**
- Lazy load images
- Virtual scroll for salon list
- Cache API responses (5 min TTL)

---

#### 3.2 Search Screen
**Navigation:** Tap on search bar from Home

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] [Search Input...]     │
│  [Filter] [Map View]            │
├─────────────────────────────────┤
│  Recent Searches                │
│  • Haircut near me         [×]  │
│  • Best nail salon         [×]  │
│  • Spa in Noida            [×]  │
│  Clear All                      │
├─────────────────────────────────┤
│  Popular Searches               │
│  • Bridal makeup                │
│  • Men's grooming               │
│  • Hair coloring                │
│  • Deep tissue massage          │
└─────────────────────────────────┘
```

**Search Results View:**
```
┌─────────────────────────────────┐
│  [← Back] [Search: "haircut"]   │
│  [Filter: Applied (2)] [Map]    │
├─────────────────────────────────┤
│  Showing 24 results             │
│  Sort by: Distance ▼            │
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ [Salon Card]             │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ [Salon Card]             │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**API:** `GET /api/search/salons?q={query}&lat={lat}&lng={lng}`

**Features:**
- Real-time search suggestions
- Voice search
- Auto-complete
- Search history (local storage)
- Filters: Price range, Rating, Distance, Availability

---

#### 3.3 Map View
**Toggle:** Icon button on Home/Search screens

**Layout:**
```
┌─────────────────────────────────┐
│  [← List View] [Location ▼]     │
├─────────────────────────────────┤
│                                 │
│         [MAP AREA]              │
│     • Pins for salons           │
│     • User location marker      │
│     • Cluster groups            │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [Selected Salon Card]   │←──┤ Bottom Sheet
│  │ Draggable               │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

**Features:**
- Google Maps integration
- Custom markers with salon logos
- Tap marker → Show salon card (bottom sheet)
- Drag map → Update salon list
- Current location button
- Search radius indicator (circle overlay)

**API:** Same as Home, but returns salons with coordinates

---

### 4. Salon Profile Screen

#### 4.1 Salon Profile - Overview
**Navigation:** Tap salon card from anywhere

**Layout (Scrollable):**
```
┌─────────────────────────────────┐
│  [← Back]         [❤] [Share]   │ ← Overlay on image
├─────────────────────────────────┤
│  [Hero Image Gallery]           │ ← Swipeable, 3-5 photos
│  ○ ● ○ ○                        │ ← Pagination dots
├─────────────────────────────────┤
│  Salon Name                     │
│  ⭐ 4.5 (120 reviews)           │
│  Open Now • 10:00 AM - 8:00 PM  │
│  [Call] [Direction] [Website]   │
├─────────────────────────────────┤
│  📍 Address                      │
│  123 Main St, Sector 18, Noida  │
│  2.3 km away                    │
│                                 │
│  [View on Map →]                │
├─────────────────────────────────┤
│  🎁 Active Offers (2)           │
│  • 20% off on first booking     │
│  • Free head massage with...   │
│  [View All Offers →]            │
├─────────────────────────────────┤
│  [Tab Bar: Services | Staff |  │
│           About | Reviews]      │
├─────────────────────────────────┤
│  [Tab Content - Scrollable]     │
│                                 │
└─────────────────────────────────┘
│  [Sticky Footer]                │
│  [Book Appointment Button]      │ ← Always visible
└─────────────────────────────────┘
```

**Tabs:**

**Services Tab:**
```
Search services...
[Filter by: All ▼]

Hair Services
┌────────────────────────────┐
│ Haircut (Men)              │
│ 30 min • ₹300              │
│ [+ Add]                    │
└────────────────────────────┘
┌────────────────────────────┐
│ Hair Coloring              │
│ 90 min • ₹1,200            │
│ [+ Add]                    │
└────────────────────────────┘

Skin Care
[More services...]
```

**Staff Tab:**
```
┌────────────────────────────┐
│ [Photo] Priya Sharma       │
│ Senior Stylist             │
│ ⭐ 4.8 | 8 years exp       │
│ Specialties: Hair, Makeup  │
│ [View Profile]             │
└────────────────────────────┘
[More staff...]
```

**About Tab:**
```
About This Salon
[Description text...]

Amenities
✓ Wi-Fi
✓ Parking
✓ AC
✓ Card Payment

Operating Hours
Mon-Sat: 10:00 AM - 8:00 PM
Sunday: 11:00 AM - 6:00 PM
```

**Reviews Tab:**
```
Overall Rating
⭐ 4.5 out of 5
Based on 120 reviews

Rating Distribution
5 ⭐ ████████████ 80
4 ⭐ ████ 25
3 ⭐ ██ 10
2 ⭐ █ 3
1 ⭐ ▌ 2

Recent Reviews
┌────────────────────────────┐
│ [User Photo] Aarti K.      │
│ ⭐⭐⭐⭐⭐ 2 days ago        │
│ "Excellent service! Priya  │
│ did an amazing job..."     │
│ [3 photos]                 │
│ [Helpful? 👍 12]           │
└────────────────────────────┘
```

**API Endpoints:**
- `GET /api/salons/{salonId}` - Salon details
- `GET /api/salons/{salonId}/services` - Services list
- `GET /api/salons/{salonId}/staff` - Staff members
- `GET /api/salons/{salonId}/media-assets` - Gallery images
- `GET /api/salons/{salonId}/reviews` - Customer reviews

---

### 5. Booking Flow

#### 5.1 Service Selection Screen
**Navigation:** Tap "Book Appointment" from Salon Profile

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Step 1 of 3           │
│  Select Services                │
├─────────────────────────────────┤
│  [Search services...]           │
│  [All Categories ▼]             │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ ☑ Haircut (Men)         │   │
│  │   30 min • ₹300         │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ ☐ Hair Coloring         │   │
│  │   90 min • ₹1,200       │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ ☑ Head Massage          │   │
│  │   20 min • ₹200         │   │
│  └─────────────────────────┘   │
│  ...                            │
└─────────────────────────────────┘
│  [Sticky Footer]                │
│  ┌───────────┬─────────────┐   │
│  │ 2 services│             │   │
│  │ 50 min    │ [Next ₹500] │   │
│  └───────────┴─────────────┘   │
└─────────────────────────────────┘
```

**Features:**
- Multi-select
- Real-time total calculation
- Service bundles/packages suggestion
- Add-on recommendations

---

#### 5.2 Date & Time Selection
**Navigation:** After service selection

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Step 2 of 3           │
│  Select Date & Time             │
├─────────────────────────────────┤
│  [Calendar View]                │
│  November 2025                  │
│  S  M  T  W  T  F  S            │
│           1  2  3  4  5         │
│  6  7  8  9 [10] 11 12          │ ← Today highlighted
│  13 14 15 16 17 18 19           │
│  ...                            │
├─────────────────────────────────┤
│  Available Time Slots           │
│  Morning                        │
│  ┌────┐ ┌────┐ ┌────┐          │
│  │10AM│ │11AM│ │12PM│          │
│  └────┘ └────┘ └────┘          │
│                                 │
│  Afternoon                      │
│  ┌────┐ ┌────┐ ┌────┐          │
│  │1PM │ │2PM │ │3PM │          │
│  └────┘ └────┘ └────┘          │
│  ...                            │
├─────────────────────────────────┤
│  Select Professional (Optional) │
│  ┌──────────────────────────┐  │
│  │ ⚪ Any Available         │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ ○ [Photo] Priya Sharma  │  │
│  │   ⭐ 4.8 • Available     │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
│  [Next Button]                  │
└─────────────────────────────────┘
```

**Features:**
- Calendar with availability indicators
- Grayed out unavailable dates
- Time slot availability check
- Staff preference selection

**API:** `GET /api/salons/{salonId}/time-slots?date={date}&services={ids}`

---

#### 5.3 Booking Confirmation Screen
**Navigation:** After date/time selection

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Step 3 of 3           │
│  Review & Confirm               │
├─────────────────────────────────┤
│  Booking Summary                │
│  ┌──────────────────────────┐  │
│  │ Salon Name               │  │
│  │ 📍 Address               │  │
│  └──────────────────────────┘  │
│                                 │
│  Date & Time                    │
│  📅 November 10, 2025           │
│  🕐 10:00 AM - 10:50 AM         │
│                                 │
│  Services                       │
│  • Haircut (Men)        ₹300    │
│  • Head Massage         ₹200    │
│  Staff: Priya Sharma            │
│                                 │
│  [Change] →                     │
├─────────────────────────────────┤
│  Contact Details                │
│  Name: [Pre-filled]             │
│  Phone: [Pre-filled]            │
│  Email: [Pre-filled]            │
│                                 │
│  Special Requests (Optional)    │
│  [Text area]                    │
├─────────────────────────────────┤
│  Apply Promo Code               │
│  [Enter code...] [Apply]        │
├─────────────────────────────────┤
│  Payment Summary                │
│  Subtotal           ₹500        │
│  GST (18%)          ₹90         │
│  Discount           -₹50        │
│  ─────────────────────          │
│  Total              ₹540        │
│                                 │
│  💰 Use Wallet Balance (₹200)   │
│  [Toggle Switch]                │
├─────────────────────────────────┤
│  Payment Method                 │
│  ○ Pay Online (₹25 cashback)   │
│  ○ Pay at Salon                 │
├─────────────────────────────────┤
│  Cancellation Policy            │
│  Free cancellation before       │
│  6 hours of booking time        │
│  [View Full Policy →]           │
└─────────────────────────────────┘
│  [Confirm Booking Button]       │
└─────────────────────────────────┘
```

**API:** `POST /api/bookings`
- Request body: Full booking details
- Response: Booking ID, payment order (if online)

**Payment Integration:**
- If "Pay Online" → Initialize Razorpay SDK
- Show Razorpay checkout modal
- On success → Confirm booking
- On failure → Show retry option

---

#### 5.4 Booking Success Screen
**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│       [Success Animation]       │
│          ✅                      │
│                                 │
│  Booking Confirmed!             │
│  Booking ID: #BK123456          │
│                                 │
│  We've sent confirmation to     │
│  your email & SMS               │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Salon Name               │  │
│  │ 📅 Nov 10, 2025          │  │
│  │ 🕐 10:00 AM              │  │
│  │ 👤 Priya Sharma          │  │
│  │ 💰 ₹540 (Paid Online)    │  │
│  └──────────────────────────┘  │
│                                 │
│  [Add to Calendar]              │
│  [Get Directions]               │
│  [View Booking Details]         │
│                                 │
│  [Done - Go to Home]            │
└─────────────────────────────────┘
```

**Actions:**
- Add to device calendar
- Open Maps for directions
- View detailed booking

---

### 6. My Bookings Screen

**Navigation:** Bottom Tab (Bookings Icon)

**Layout:**
```
┌─────────────────────────────────┐
│  My Bookings        [Calendar]  │
├─────────────────────────────────┤
│  [Upcoming] [Past] [Cancelled]  │ ← Tabs
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ Salon Name               │  │
│  │ 📅 Nov 10 • 10:00 AM     │  │
│  │ Services: Haircut, ...   │  │
│  │ Status: Confirmed        │  │
│  │ [View Details] [Cancel]  │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ [Booking Card 2]         │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**Features:**
- Filter by status
- Search bookings
- Quick actions: Cancel, Reschedule, Review
- Empty state: "No bookings yet"

**API:** `GET /api/user/bookings`

---

#### 6.1 Booking Details Screen
**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] Booking Details       │
├─────────────────────────────────┤
│  Status: Confirmed              │
│  Booking ID: #BK123456          │
│                                 │
│  ┌──────────────────────────┐  │
│  │ [Salon Image]            │  │
│  │ Salon Name               │  │
│  │ ⭐ 4.5 (120)             │  │
│  │ 📍 Address               │  │
│  └──────────────────────────┘  │
│                                 │
│  Appointment Details            │
│  📅 November 10, 2025           │
│  🕐 10:00 AM - 10:50 AM         │
│  👤 Professional: Priya Sharma  │
│                                 │
│  Services Booked                │
│  • Haircut (Men) - ₹300         │
│  • Head Massage - ₹200          │
│                                 │
│  Payment Details                │
│  Total: ₹540                    │
│  Payment Method: Online         │
│  Status: Paid                   │
│                                 │
│  Special Instructions           │
│  [Text if provided]             │
│                                 │
│  [Get Directions]               │
│  [Call Salon]                   │
│  [Reschedule]                   │
│  [Cancel Booking]               │
│                                 │
│  Cancellation Policy            │
│  Free cancellation up to...     │
└─────────────────────────────────┘
```

---

### 7. Profile & Account

**Navigation:** Bottom Tab (Profile Icon)

**Layout:**
```
┌─────────────────────────────────┐
│  [Profile Photo]                │
│  Aarti Kumar                    │
│  aarti@email.com                │
│  +91 98765 43210                │
│  [Edit Profile]                 │
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ 💰 Wallet Balance        │  │
│  │ ₹200.00 [+ Add Money]    │  │
│  └──────────────────────────┘  │
├─────────────────────────────────┤
│  My Account                     │
│  • Personal Information     →   │
│  • Saved Addresses         →   │
│  • Payment Methods         →   │
│  • Notification Settings   →   │
│                                 │
│  My Activity                    │
│  • My Bookings             →   │
│  • Reviews & Ratings       →   │
│  • Favorite Salons         →   │
│                                 │
│  Rewards & Offers               │
│  • My Offers               →   │
│  • Referral Program        →   │
│                                 │
│  Help & Support                 │
│  • Help Center             →   │
│  • Contact Us              →   │
│  • Report an Issue         →   │
│                                 │
│  Legal                          │
│  • Terms of Service        →   │
│  • Privacy Policy          →   │
│  • About SalonHub          →   │
│                                 │
│  [Logout]                       │
└─────────────────────────────────┘
```

---

### 8. Wallet Screen

**Layout:**
```
┌─────────────────────────────────┐
│  [← Back] My Wallet             │
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ Available Balance        │  │
│  │ ₹200.00                  │  │
│  │ [+ Add Money]            │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ 💰 Total Savings         │  │
│  │ ₹1,250                   │  │
│  └──────────────────────────┘  │
├─────────────────────────────────┤
│  [Transactions] [Offers]        │ ← Tabs
├─────────────────────────────────┤
│  Recent Transactions            │
│  ┌──────────────────────────┐  │
│  │ + Cashback Received      │  │
│  │ Nov 8 • ₹50              │  │
│  │ From: Booking #BK12345   │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ - Used for Booking       │  │
│  │ Nov 5 • ₹100             │  │
│  │ Booking #BK12340         │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**API:** `GET /api/user/wallet`

---

### 9. Offers Screen

**Navigation:** Bottom Tab (Offers Icon)

**Layout:**
```
┌─────────────────────────────────┐
│  Offers & Deals      [Filter]   │
├─────────────────────────────────┤
│  [For You] [New] [Ending Soon]  │
├─────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │ [Offer Banner Image]     │  │
│  │ 🎁 20% OFF               │  │
│  │ First Booking Discount   │  │
│  │ Valid till Dec 31        │  │
│  │ [Apply Now]              │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ [Offer Card 2]           │  │
│  └──────────────────────────┘  │
│  ...                            │
└─────────────────────────────────┘
```

**API:** `GET /api/offers`

---

### 10. AI Look Advisor (Premium Feature)

**Navigation:** From Home or Profile

**Layout - Intake Screen:**
```
┌─────────────────────────────────┐
│  [← Back] AI Look Advisor       │
├─────────────────────────────────┤
│  Get Personalized               │
│  Beauty Recommendations         │
│                                 │
│  Upload Your Photo              │
│  ┌──────────────────────────┐  │
│  │ [+ Upload / Take Photo]  │  │
│  └──────────────────────────┘  │
│                                 │
│  Tell us about the occasion     │
│  ○ Wedding / Party              │
│  ○ Office / Professional        │
│  ○ Casual Day Out               │
│  ○ Date Night                   │
│                                 │
│  Your Style Preference          │
│  ○ Natural Look                 │
│  ○ Bold & Glamorous             │
│  ○ Trendy & Edgy                │
│                                 │
│  [Analyze with AI]              │
└─────────────────────────────────┘
```

**Result Screen:**
```
┌─────────────────────────────────┐
│  [← Back] Your Look             │
├─────────────────────────────────┤
│  [Before] [After]               │ ← Swipeable comparison
│  [Your Photo] [AI Generated]    │
├─────────────────────────────────┤
│  Recommended Look               │
│  Natural Glam for Wedding       │
│                                 │
│  Products Used:                 │
│  • Foundation - Shade #42       │
│  • Lipstick - Rose Pink         │
│  • Eyeshadow - Brown Palette    │
│  [View All Products →]          │
│                                 │
│  Book This Look                 │
│  ┌──────────────────────────┐  │
│  │ Available at 5 salons    │  │
│  │ [View Salons →]          │  │
│  └──────────────────────────┘  │
│                                 │
│  [Save Look] [Share] [Try New]  │
└─────────────────────────────────┘
```

**API:** 
- `POST /api/ai-look-advisor/analyze` - Upload and analyze
- `GET /api/ai-look-advisor/sessions/{id}` - Get results

---

## Navigation Structure

### Bottom Navigation Bar (5 tabs)

```
┌─────────────────────────────────────────┐
│  Home  Explore  Book  Bookings  Profile │
│   🏠      🔍     📅      📋       👤    │
└─────────────────────────────────────────┘
```

**Tab 1: Home** (🏠)
- Home screen with salon discovery
- Recent, Recommended, Trending sections

**Tab 2: Explore** (🔍)
- Search & Filter interface
- Category browsing
- Map view

**Tab 3: Book** (+)
- Quick access to last viewed salon
- OR floating action button for new booking

**Tab 4: Bookings** (📋)
- Upcoming bookings
- Past bookings
- Booking history

**Tab 5: Profile** (👤)
- User profile
- Wallet
- Settings
- Help

---

## Technical Requirements

### Minimum OS Versions
- iOS: 13.0+
- Android: 8.0 (API level 26)+

### Permissions Required

**Essential:**
- Location (Fine + Coarse) - For salon discovery
- Camera - For profile photo, AI look advisor
- Internet - For API calls

**Optional:**
- Notifications - For booking reminders
- Calendar - For adding appointments
- Contacts - For phone number auto-fill

### Device Features
- GPS for location services
- Camera for photo upload
- Minimum 2GB RAM
- 100MB storage for app + cache

### Network Requirements
- Minimum 3G connection
- Offline mode: View cached salons, bookings
- Background sync when connection restored

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
```

### Key Endpoints

**Auth:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/check-user-exists` - Check if user exists
- `GET /api/auth/user` - Get current user

**Salons:**
- `GET /api/salons` - List salons (with filters)
- `GET /api/search/salons` - Search salons
- `GET /api/salons/{id}` - Get salon details
- `GET /api/salons/{id}/services` - Get services
- `GET /api/salons/{id}/staff` - Get staff
- `GET /api/salons/{id}/time-slots` - Get availability

**Bookings:**
- `POST /api/bookings` - Create booking
- `GET /api/user/bookings` - List user bookings
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}/cancel` - Cancel booking
- `PUT /api/bookings/{id}/reschedule` - Reschedule

**Payments:**
- `POST /api/create-payment-order` - Create Razorpay order
- `POST /api/verify-payment` - Verify payment

**Wallet:**
- `GET /api/user/wallet` - Get wallet balance
- `GET /api/user/wallet/transactions` - Get transactions

**Offers:**
- `GET /api/offers` - List active offers
- `POST /api/offers/{id}/apply` - Apply offer to booking

**Location:**
- `GET /api/locations/search` - Search locations
- `GET /api/locations/reverse` - Reverse geocode
- `POST /api/user/saved-locations` - Save location

---

## Offline Functionality

### Cached Data (15min - 24hr TTL)
- Recently viewed salons
- User profile data
- Saved locations
- Favorite salons list

### Sync Queue
- Pending bookings (retry on reconnect)
- Profile updates
- Favorite toggles

### Offline UI Behavior
- Show cached content with indicator
- Disable booking creation
- Queue actions for sync

---

## Push Notifications

### Notification Types

**Transactional:**
1. Booking Confirmed (Immediate)
2. Booking Reminder (2 hours before)
3. Payment Successful (Immediate)
4. Booking Cancelled (Immediate)
5. Booking Rescheduled (Immediate)

**Promotional:**
1. New Offer Available (Daily digest)
2. Nearby Salon Recommendations (Weekly)
3. Wallet Cashback Offers (Weekly)

**Engagement:**
1. Review Reminder (24 hours post-booking)
2. Inactive User Re-engagement (30 days)

### Implementation
- Firebase Cloud Messaging (FCM)
- Deep links to specific screens
- Rich notifications with images
- Action buttons (e.g., "View Booking")

---

## Analytics & Tracking

### Events to Track

**User Acquisition:**
- App Install
- First Open
- Registration Started
- Registration Completed

**Engagement:**
- Session Start/End
- Screen Views
- Search Performed
- Filter Applied
- Salon Viewed
- Service Selected

**Conversion:**
- Booking Started
- Booking Completed
- Payment Initiated
- Payment Completed
- Booking Cancelled

**Retention:**
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Repeat Booking Rate
- Churn Rate

### Tools
- Firebase Analytics (Standard events)
- Mixpanel / Amplitude (Custom funnels)
- Crashlytics (Crash reporting)

---

## Design System

### Color Palette
```
Primary: #9333EA (Purple)
Secondary: #F43F5E (Rose)
Accent: #14B8A6 (Teal)
Success: #10B981 (Green)
Warning: #F59E0B (Amber)
Error: #EF4444 (Red)
Background: #FFFFFF (White)
Surface: #F9FAFB (Light Gray)
Text Primary: #111827 (Dark Gray)
Text Secondary: #6B7280 (Medium Gray)
```

### Typography
```
Headings: Poppins (Bold, 600)
Body: Inter (Regular, 400)
Accent: Playfair Display (Italic, for elegance)
```

### Spacing Scale
```
4dp, 8dp, 12dp, 16dp, 24dp, 32dp, 48dp
```

### Border Radius
```
Small: 8dp
Medium: 12dp
Large: 16dp
Full: 9999dp (pill shape)
```

---

## Performance Metrics

### Target KPIs
- App Launch Time: < 2s
- Time to Interactive: < 3s
- API Response Time: < 500ms (p95)
- Image Load Time: < 1s
- Booking Flow Completion: < 90s
- Crash-Free Rate: > 99.5%

---

## Accessibility Requirements

- VoiceOver / TalkBack support
- Minimum touch target: 44x44 pts (iOS) / 48x48 dp (Android)
- Color contrast ratio: 4.5:1 (WCAG AA)
- Text scaling support (up to 200%)
- Screen reader labels for all interactive elements
- Haptic feedback for key actions

---

## Localization

**Languages (Phase 1):**
- English (Default)
- Hindi

**Currencies:**
- Indian Rupee (INR) - ₹

**Date/Time:**
- 12-hour format (Indian preference)
- DD/MM/YYYY date format

---

## Security Requirements

### Data Protection
- Encrypt sensitive data at rest (Keychain/Keystore)
- Use HTTPS for all API calls
- Certificate pinning for API endpoints
- Biometric authentication option

### PCI Compliance
- No storage of card details
- Razorpay SDK handles payment data
- Tokenization for saved cards

### User Privacy
- Request permissions with context
- Allow users to delete account & data
- Comply with GDPR (for international users)
- Cookie consent (if using webviews)

---

## Testing Strategy

### Unit Tests
- Business logic
- Utility functions
- Data models

### Integration Tests
- API integration
- Payment flow
- Authentication flow

### UI Tests
- Critical user journeys
- Booking flow (end-to-end)
- Login/Registration

### Manual Testing
- Device matrix (iOS/Android, various screen sizes)
- Network conditions (3G, flaky, offline)
- Accessibility audit

---

## Release Strategy

### Beta Testing
- Internal alpha: 2 weeks
- Closed beta: 50 users (4 weeks)
- Open beta: 500 users (2 weeks)

### Phased Rollout
- Week 1: 10% of users
- Week 2: 25% of users
- Week 3: 50% of users
- Week 4: 100% rollout

### App Store Optimization (ASO)
- Keywords: beauty booking, salon near me, spa appointment
- Screenshots showcasing key features
- Video preview (15-30s)

---

## Appendix

### Screen Priority Matrix

| Screen | Priority | Complexity | Estimated Dev Time |
|--------|----------|------------|-------------------|
| Splash | P0 | Low | 1 day |
| Login/Signup | P0 | Medium | 5 days |
| Home | P0 | High | 10 days |
| Search | P0 | High | 8 days |
| Salon Profile | P0 | High | 8 days |
| Booking Flow (3 steps) | P0 | Very High | 15 days |
| Booking Success | P0 | Low | 2 days |
| My Bookings | P0 | Medium | 5 days |
| Booking Details | P1 | Medium | 3 days |
| Profile | P1 | Medium | 5 days |
| Wallet | P1 | Medium | 5 days |
| Offers | P1 | Low | 3 days |
| AI Look Advisor | P2 | Very High | 20 days |
| Map View | P2 | High | 8 days |

**Total Estimated Development: 12-14 weeks (with 2-person team)**

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
    "lottie-react-native / lottie-flutter",
    "react-native-vector-icons / flutter_icons"
  ],
  "maps": [
    "react-native-maps / google_maps_flutter",
    "@react-native-community/geolocation"
  ],
  "payments": [
    "razorpay-react-native-sdk / razorpay_flutter"
  ],
  "auth": [
    "firebase-auth / firebase_auth",
    "react-native-keychain / flutter_secure_storage"
  ],
  "media": [
    "react-native-image-picker / image_picker",
    "react-native-fast-image / cached_network_image"
  ],
  "analytics": [
    "firebase-analytics",
    "mixpanel-react-native / mixpanel_flutter"
  ],
  "other": [
    "react-native-push-notification / firebase_messaging",
    "react-native-share / share_plus",
    "react-native-calendars / table_calendar"
  ]
}
```

---

## Conclusion

This document provides a comprehensive blueprint for developing the SalonHub Customer Mobile App. The specifications are designed to create a delightful, conversion-optimized experience while maintaining technical feasibility and scalability.

**Next Steps:**
1. Design mockups/prototypes for all screens
2. Create API contract documentation
3. Set up development environment
4. Sprint planning (2-week sprints)
5. Develop MVP (Phases P0 + P1 features)
6. Conduct user testing
7. Iterate and launch

---

**Document Owner:** Product & Engineering Team  
**Last Updated:** November 19, 2025  
**Version:** 1.0
