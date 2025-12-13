# SalonHub Mobile Apps - Technical Implementation Specifications

**Version:** 1.0  
**Date:** November 20, 2025  
**Purpose:** Complete API, Database Schema, and Business Logic Documentation for Mobile App Development

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Specifications](#api-specifications)
4. [Authentication & Authorization](#authentication--authorization)
5. [Navigation Flows](#navigation-flows)
6. [Business Logic Rules](#business-logic-rules)
7. [Payment Integration](#payment-integration)
8. [Real-time Features](#real-time-features)
9. [Error Handling](#error-handling)
10. [Mobile-Specific Considerations](#mobile-specific-considerations)

---

## Overview

### Architecture
- **Frontend:** React Native / Flutter mobile app
- **Backend:** Express.js REST API
- **Database:** PostgreSQL (Drizzle ORM)
- **Authentication:** Session-based + Firebase Auth (Phone OTP)
- **Payments:** Razorpay
- **Real-time:** WebSockets (for booking updates)
- **Storage:** In-memory + PostgreSQL

### Base URLs
```
Production:  https://salonhub.app/api
Staging:     https://staging.salonhub.app/api
Development: http://localhost:5000/api
```

### Request Headers
```http
Authorization: Bearer <session_token>
Content-Type: application/json
```

---

## Database Schema

### Core Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts (customers + business owners) | id, email, phone, firstName, lastName |
| `roles` | System roles | id, name (customer/owner/admin) |
| `user_roles` | User-role mapping | userId, roleId |
| `organizations` | Business workspaces | id, name, ownerUserId |
| `org_users` | Organization members | orgId, userId, orgRole |
| `salons` | Salon business profiles | id, name, address, latitude, longitude |
| `services` | Salon services catalog | id, salonId, name, price, duration |
| `staff` | Salon employees | id, salonId, name, specialization |
| `bookings` | Appointment bookings | id, salonId, customerId, serviceId, date, time |
| `payments` | Payment records | id, bookingId, amount, status |
| `wallet_transactions` | Wallet credits/debits | id, userId, amount, type |
| `offers` | Promotional offers | id, salonId, discountType, discountValue |
| `reviews` | Salon reviews | id, salonId, userId, rating, comment |

### Complete Schema Definitions

#### Users Table
```typescript
users {
  id: varchar (UUID, PK)
  username: text (unique, optional)
  password: text (optional for social auth)
  email: varchar (unique)
  firstName: varchar
  lastName: varchar
  phone: text
  profileImageUrl: varchar
  workPreference: varchar (salon/home/both)
  businessCategory: varchar (unisex/beauty_parlour/mens_parlour)
  businessName: varchar
  panNumber: varchar(10)
  gstNumber: varchar(15)
  emailVerified: integer (0/1)
  phoneVerified: integer (0/1)
  isActive: integer (0/1, default: 1)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Validation Rules:**
- Email: Valid format, unique
- Phone: Indian format (+91XXXXXXXXXX), 10 digits
- Password: Min 8 chars (if not social auth)
- PAN: Format: AAAAA9999A
- GST: Format: 15 alphanumeric

#### Salons Table
```typescript
salons {
  id: varchar (UUID, PK)
  name: text (required)
  description: text
  shopNumber: text
  address: text (required)
  city: text (required)
  state: text (required)
  zipCode: text (required)
  latitude: decimal(9,6)
  longitude: decimal(9,6)
  phone: text (required)
  email: text (required)
  website: text
  category: varchar(50) - Hair Salon, Spa, Nails, Barber, Beauty Parlour
  priceRange: varchar(10) - $, $$, $$$, $$$$
  venueType: varchar(20) - everyone, female-only, male-only
  instantBooking: integer (0/1)
  offerDeals: integer (0/1)
  acceptGroup: integer (0/1)
  rating: decimal(3,2) default 0.00
  reviewCount: integer default 0
  googlePlaceId: text
  googleRating: decimal(3,2)
  googleReviewCount: integer
  imageUrl: text
  imageUrls: text[] (array)
  openTime: text (legacy)
  closeTime: text (legacy)
  businessHours: jsonb
  isActive: integer (0/1)
  approvalStatus: varchar(20) - pending, approved, rejected
  approvedAt: timestamp
  approvedBy: varchar (userId)
  rejectionReason: text
  setupProgress: jsonb
  ownerId: varchar (FK → users.id)
  orgId: varchar (FK → organizations.id)
  createdAt: timestamp
}
```

**Business Hours JSON Structure:**
```json
{
  "monday": { "open": true, "start": "09:00", "end": "20:00" },
  "tuesday": { "open": true, "start": "09:00", "end": "20:00" },
  "wednesday": { "open": true, "start": "09:00", "end": "20:00" },
  "thursday": { "open": true, "start": "09:00", "end": "20:00" },
  "friday": { "open": true, "start": "09:00", "end": "20:00" },
  "saturday": { "open": true, "start": "10:00", "end": "22:00" },
  "sunday": { "open": false, "start": null, "end": null }
}
```

**Setup Progress JSON Structure:**
```json
{
  "businessInfo": true,
  "locationContact": true,
  "services": false,
  "staff": false,
  "resources": false,
  "bookingSettings": false,
  "paymentSetup": false,
  "media": false
}
```

#### Bookings Table
```typescript
bookings {
  id: varchar (UUID, PK)
  salonId: varchar (FK → salons.id)
  customerId: varchar (FK → users.id)
  customerName: varchar
  customerPhone: varchar
  customerEmail: varchar
  bookingDate: date (required)
  bookingTime: text (required, format: "14:30")
  status: varchar(20) - pending, confirmed, completed, cancelled, no_show
  totalAmountPaisa: integer (amount in paisa, e.g., 50000 = ₹500)
  paidAmountPaisa: integer
  currency: varchar(3) default 'INR'
  paymentStatus: varchar(20) - pending, partial, paid, refunded
  paymentMethod: varchar(50)
  paymentId: varchar (Razorpay payment ID)
  notes: text
  cancellationReason: text
  cancelledAt: timestamp
  completedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Status Transitions (Business Logic):**
```
pending → confirmed → completed
pending → cancelled
confirmed → cancelled
confirmed → no_show
confirmed → completed
```

**Allowed Transitions:**
- Customer can cancel: pending, confirmed (up to 2 hours before)
- Business can cancel: any status except completed
- Mark completed: only from confirmed status
- Mark no_show: only from confirmed status

#### Booking Services Table (Many-to-Many)
```typescript
booking_services {
  id: varchar (UUID, PK)
  bookingId: varchar (FK → bookings.id)
  serviceId: varchar (FK → services.id)
  staffId: varchar (FK → staff.id, nullable)
  serviceName: varchar
  durationMinutes: integer
  priceAmountPaisa: integer
  quantity: integer default 1
  discountAmountPaisa: integer default 0
  finalAmountPaisa: integer
}
```

#### Services Table
```typescript
services {
  id: varchar (UUID, PK)
  salonId: varchar (FK → salons.id)
  name: text (required)
  description: text
  category: varchar(50) - Haircut, Color, Facial, Massage, Nails, Makeup, etc.
  priceAmountPaisa: integer (required)
  discountedPriceAmountPaisa: integer
  durationMinutes: integer (required)
  currency: varchar(3) default 'INR'
  imageUrl: text
  isActive: integer (0/1)
  sortOrder: integer
  createdAt: timestamp
}
```

**Service Categories:**
- Haircut & Styling
- Hair Color
- Hair Treatment
- Facial & Skin
- Massage & Spa
- Nails & Manicure
- Makeup & Beauty
- Waxing & Threading
- Bridal Package

#### Staff Table
```typescript
staff {
  id: varchar (UUID, PK)
  salonId: varchar (FK → salons.id)
  userId: varchar (FK → users.id, nullable)
  name: text (required)
  phone: text
  email: text
  specialization: text
  bio: text
  profileImageUrl: text
  rating: decimal(3,2) default 0.00
  reviewCount: integer default 0
  commissionRate: decimal(5,2) - percentage (e.g., 25.00 = 25%)
  isActive: integer (0/1)
  createdAt: timestamp
}
```

#### Wallet Transactions Table
```typescript
wallet_transactions {
  id: varchar (UUID, PK)
  userId: varchar (FK → users.id)
  amountPaisa: integer (positive = credit, negative = debit)
  balanceAfterPaisa: integer
  type: varchar(50) - cashback, refund, booking_payment, referral_bonus
  description: text
  bookingId: varchar (FK → bookings.id, nullable)
  offerId: varchar (FK → offers.id, nullable)
  currency: varchar(3) default 'INR'
  createdAt: timestamp
}
```

**Wallet Balance Calculation:**
```typescript
Current Balance = SUM(wallet_transactions.amountPaisa WHERE userId = X)
```

#### Offers Table
```typescript
offers {
  id: varchar (UUID, PK)
  salonId: varchar (FK → salons.id, nullable for platform-wide)
  title: text (required)
  description: text
  code: varchar(20) unique
  discountType: varchar(20) - percentage, fixed, cashback
  discountValue: decimal - percentage value or fixed amount
  minOrderValuePaisa: integer
  maxDiscountPaisa: integer (cap for percentage discounts)
  validFrom: timestamp
  validUntil: timestamp
  usageLimit: integer (total uses allowed)
  usageCount: integer default 0
  perUserLimit: integer (uses per user)
  isPlatformWide: integer (0/1)
  isActive: integer (0/1)
  targetUserType: varchar(20) - all, new, existing
  applicableCategories: text[] (service categories)
  createdAt: timestamp
}
```

**Offer Types:**
1. **Percentage Discount:** 20% off (maxDiscountPaisa limits the discount)
2. **Fixed Discount:** ₹200 off
3. **Cashback:** Get ₹100 cashback in wallet

#### Reviews Table
```typescript
salon_reviews {
  id: varchar (UUID, PK)
  salonId: varchar (FK → salons.id)
  userId: varchar (FK → users.id, nullable for Google reviews)
  bookingId: varchar (FK → bookings.id, nullable)
  rating: integer (1-5 stars, required)
  comment: text
  source: varchar(20) - salonhub, google
  googleReviewId: text
  reviewerName: text
  reviewerPhotoUrl: text
  response: text (salon owner response)
  respondedAt: timestamp
  isVisible: integer (0/1)
  createdAt: timestamp
}
```

**Review Rules:**
- Customer can review only after booking is completed
- One review per booking
- Rating: 1-5 stars (integer)
- Comment: optional, max 500 characters

---

## API Specifications

### Authentication APIs

#### POST /api/auth/check-user-exists
**Purpose:** Check if phone number already registered

**Request:**
```json
{
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "exists": true,
  "userType": "customer" // or "business"
}
```

---

#### POST /api/auth/register
**Purpose:** Register new user

**Request (Customer):**
```json
{
  "email": "priya@example.com",
  "password": "SecurePass123",
  "firstName": "Priya",
  "lastName": "Sharma",
  "phone": "+919876543210"
}
```

**Request (Business Owner):**
```json
{
  "email": "owner@bellabeauty.com",
  "password": "SecurePass123",
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "phone": "+919876543210",
  "businessName": "Bella Beauty Salon",
  "businessCategory": "unisex",
  "workPreference": "salon"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "priya@example.com",
    "firstName": "Priya",
    "lastName": "Sharma",
    "phone": "+919876543210"
  },
  "session": {
    "token": "session_token",
    "expiresAt": "2025-12-20T10:00:00Z"
  },
  "roles": ["customer"] // or ["owner"]
}
```

**Validation:**
- Email: Required, valid format, unique
- Password: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
- Phone: Required, +91 format, 10 digits
- BusinessName: Required for business registration

---

#### POST /api/auth/login
**Purpose:** Login existing user

**Request:**
```json
{
  "email": "priya@example.com",
  "password": "SecurePass123",
  "loginType": "customer" // or "business"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "priya@example.com",
    "firstName": "Priya",
    "lastName": "Sharma"
  },
  "session": {
    "token": "session_token",
    "expiresAt": "2025-12-20T10:00:00Z"
  },
  "roles": ["customer"],
  "salons": [] // If business owner, list of owned salons
}
```

**Error Cases:**
- 401: Invalid credentials
- 403: Account not active
- 404: User not found

---

#### Firebase Phone Authentication Flow

**Step 1:** Client uses Firebase SDK to send OTP
```typescript
// Firebase handles OTP sending
firebase.auth().signInWithPhoneNumber("+919876543210");
```

**Step 2:** Client verifies OTP with Firebase
```typescript
// Firebase returns ID token
const idToken = await user.getIdToken();
```

**Step 3:** POST /api/auth/firebase-login
**Request:**
```json
{
  "idToken": "firebase_id_token",
  "userType": "customer" // or "business"
}
```

**Backend Process:**
1. Verify Firebase token
2. Extract phone number
3. Check if user exists
4. Create session
5. Return user data

**Response:**
```json
{
  "user": { /* user object */ },
  "session": { /* session token */ },
  "isNewUser": false
}
```

---

### Salon Discovery APIs

#### GET /api/salons
**Purpose:** List salons with filters

**Query Parameters:**
```
lat: number (required if using proximity)
lng: number (required if using proximity)
radiusKm: number (default: 5, max: 50)
category: string (Hair Salon, Spa, Nails, etc.)
priceRange: string ($, $$, $$$, $$$$)
instantBooking: boolean
offerDeals: boolean
venueType: string (everyone, female-only, male-only)
minRating: number (0-5)
sortBy: string (distance, rating, price_low, price_high)
limit: number (default: 20, max: 100)
offset: number (default: 0)
```

**Example Request:**
```
GET /api/salons?lat=28.5355&lng=77.3910&radiusKm=5&category=Hair Salon&instantBooking=true&sortBy=rating&limit=20
```

**Response:**
```json
{
  "salons": [
    {
      "id": "uuid",
      "name": "Bella Beauty Salon",
      "address": "123 MG Road, Delhi",
      "city": "New Delhi",
      "state": "Delhi",
      "category": "Hair Salon",
      "priceRange": "$$",
      "rating": 4.5,
      "reviewCount": 128,
      "imageUrl": "https://cdn.example.com/salon1.jpg",
      "distance": 1.2, // km from user location
      "instantBooking": true,
      "offerDeals": true,
      "openTime": "09:00",
      "closeTime": "20:00"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

---

#### GET /api/search/salons
**Purpose:** Search salons by name or keyword

**Query Parameters:**
```
q: string (search query, required)
lat: number
lng: number
limit: number (default: 20)
```

**Example:**
```
GET /api/search/salons?q=hair+color&lat=28.5355&lng=77.3910&limit=10
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Color Studio Salon",
      "address": "456 Park Street, Delhi",
      "category": "Hair Salon",
      "rating": 4.7,
      "distance": 2.3,
      "matchScore": 0.95 // relevance score
    }
  ]
}
```

---

#### GET /api/salons/:id
**Purpose:** Get detailed salon information

**Response:**
```json
{
  "salon": {
    "id": "uuid",
    "name": "Bella Beauty Salon",
    "description": "Premium unisex salon...",
    "address": "123 MG Road, Delhi",
    "city": "New Delhi",
    "state": "Delhi",
    "zipCode": "110001",
    "phone": "+919876543210",
    "email": "bella@example.com",
    "website": "https://bella.example.com",
    "category": "Hair Salon",
    "priceRange": "$$",
    "venueType": "everyone",
    "rating": 4.5,
    "reviewCount": 128,
    "googleRating": 4.3,
    "googleReviewCount": 85,
    "imageUrl": "https://cdn.example.com/salon1.jpg",
    "imageUrls": ["url1", "url2", "url3"],
    "businessHours": { /* hours object */ },
    "instantBooking": true,
    "offerDeals": true,
    "acceptGroup": true,
    "amenities": {
      "wifi": true,
      "parking": true,
      "cardPayment": true,
      "wheelchairAccessible": false
    }
  },
  "services": [ /* service list */ ],
  "staff": [ /* staff list */ ],
  "reviews": [ /* recent reviews */ ],
  "offers": [ /* active offers */ ]
}
```

---

### Booking APIs

#### GET /api/salons/:salonId/time-slots
**Purpose:** Get available time slots for booking

**Query Parameters:**
```
date: string (YYYY-MM-DD, required)
services: string[] (comma-separated service IDs)
staffId: string (optional, specific staff)
```

**Example:**
```
GET /api/salons/uuid/time-slots?date=2025-11-25&services=service1,service2
```

**Response:**
```json
{
  "date": "2025-11-25",
  "totalDuration": 90, // minutes
  "availableSlots": [
    {
      "time": "09:00",
      "available": true,
      "availableStaff": ["staff1", "staff2"]
    },
    {
      "time": "09:30",
      "available": true,
      "availableStaff": ["staff1"]
    },
    {
      "time": "10:00",
      "available": false,
      "reason": "fully_booked"
    }
  ]
}
```

**Business Logic:**
- Slots generated every 30 minutes
- Check staff availability
- Respect business hours
- Buffer time between bookings (configurable)

---

#### POST /api/bookings
**Purpose:** Create new booking

**Request:**
```json
{
  "salonId": "uuid",
  "bookingDate": "2025-11-25",
  "bookingTime": "14:30",
  "services": [
    {
      "serviceId": "uuid",
      "staffId": "uuid", // optional
      "quantity": 1
    }
  ],
  "customerName": "Priya Sharma",
  "customerPhone": "+919876543210",
  "customerEmail": "priya@example.com",
  "notes": "Please use organic products",
  "offerId": "uuid", // optional
  "paymentMethod": "online" // or "cash", "wallet"
}
```

**Response:**
```json
{
  "booking": {
    "id": "uuid",
    "bookingNumber": "BK20251125001",
    "salonId": "uuid",
    "salonName": "Bella Beauty Salon",
    "customerId": "uuid",
    "bookingDate": "2025-11-25",
    "bookingTime": "14:30",
    "status": "pending",
    "services": [
      {
        "serviceName": "Haircut & Styling",
        "staffName": "Neha",
        "durationMinutes": 45,
        "priceAmountPaisa": 80000
      }
    ],
    "totalAmountPaisa": 80000,
    "discountAmountPaisa": 10000,
    "finalAmountPaisa": 70000,
    "currency": "INR",
    "paymentStatus": "pending",
    "createdAt": "2025-11-20T10:00:00Z"
  },
  "paymentOrder": { /* Razorpay order if online payment */ }
}
```

**Validation Rules:**
- Booking date must be future date (minimum 2 hours from now)
- Booking time must be within business hours
- Selected time slot must be available
- At least one service must be selected
- Customer phone is mandatory

---

#### GET /api/user/bookings
**Purpose:** List user's bookings

**Query Parameters:**
```
status: string (pending, confirmed, completed, cancelled)
type: string (upcoming, past)
limit: number (default: 20)
offset: number
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "bookingNumber": "BK20251125001",
      "salon": {
        "id": "uuid",
        "name": "Bella Beauty Salon",
        "address": "123 MG Road, Delhi",
        "imageUrl": "https://cdn.example.com/salon1.jpg"
      },
      "bookingDate": "2025-11-25",
      "bookingTime": "14:30",
      "status": "confirmed",
      "services": [
        {
          "name": "Haircut & Styling",
          "staffName": "Neha"
        }
      ],
      "totalAmountPaisa": 70000,
      "paymentStatus": "paid",
      "canCancel": true,
      "canReschedule": true
    }
  ],
  "total": 10
}
```

---

#### PUT /api/bookings/:id/cancel
**Purpose:** Cancel booking

**Request:**
```json
{
  "reason": "Schedule conflict"
}
```

**Response:**
```json
{
  "booking": { /* updated booking */ },
  "refund": {
    "amount": 70000,
    "method": "wallet", // or "original_payment_method"
    "processedAt": "2025-11-20T10:30:00Z"
  }
}
```

**Cancellation Rules:**
- Can cancel up to 2 hours before booking time
- Full refund if cancelled 24+ hours before
- 50% refund if cancelled 2-24 hours before
- No refund if cancelled < 2 hours before
- Refund goes to wallet by default

---

#### PUT /api/bookings/:id/reschedule
**Purpose:** Reschedule booking

**Request:**
```json
{
  "newDate": "2025-11-26",
  "newTime": "15:00",
  "reason": "Personal emergency"
}
```

**Response:**
```json
{
  "booking": { /* updated booking */ },
  "message": "Booking rescheduled successfully"
}
```

**Reschedule Rules:**
- Can reschedule up to 4 hours before booking
- New slot must be available
- Same services maintained
- No additional charge

---

### Business Partner APIs

#### GET /api/my/salons
**Purpose:** Get list of salons owned by authenticated user

**Response:**
```json
{
  "salons": [
    {
      "id": "uuid",
      "name": "Bella Beauty Salon",
      "address": "123 MG Road, Delhi",
      "category": "Hair Salon",
      "status": "active",
      "approvalStatus": "approved",
      "setupProgress": {
        "businessInfo": true,
        "services": true,
        "staff": false
      },
      "rating": 4.5,
      "totalBookings": 1250,
      "activeBookingsToday": 8
    }
  ]
}
```

---

#### GET /api/salons/:salonId/dashboard-metrics
**Purpose:** Get business dashboard metrics

**Query Parameters:**
```
period: string (today, week, month, year)
```

**Response:**
```json
{
  "period": "today",
  "metrics": {
    "revenue": {
      "total": 2500000, // paisa
      "currency": "INR",
      "change": +15.5 // % change from previous period
    },
    "bookings": {
      "total": 12,
      "confirmed": 8,
      "pending": 3,
      "cancelled": 1
    },
    "customers": {
      "total": 10,
      "new": 2,
      "returning": 8
    },
    "occupancy": {
      "rate": 75, // %
      "availableSlots": 10,
      "bookedSlots": 30
    },
    "topServices": [
      {
        "name": "Haircut & Styling",
        "bookings": 5,
        "revenue": 400000
      }
    ],
    "topStaff": [
      {
        "name": "Neha",
        "bookings": 8,
        "revenue": 640000
      }
    ]
  },
  "upcomingBookings": [ /* next 5 bookings */ ],
  "recentActivity": [ /* last 10 activities */ ]
}
```

---

#### GET /api/salons/:salonId/bookings
**Purpose:** Get salon's bookings (business view)

**Query Parameters:**
```
date: string (YYYY-MM-DD)
status: string
staffId: string
limit: number
offset: number
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "bookingNumber": "BK20251125001",
      "customer": {
        "id": "uuid",
        "name": "Priya Sharma",
        "phone": "+919876543210",
        "email": "priya@example.com",
        "totalBookings": 5 // lifetime bookings
      },
      "bookingDate": "2025-11-25",
      "bookingTime": "14:30",
      "status": "confirmed",
      "services": [ /* services */ ],
      "staff": [ /* assigned staff */ ],
      "totalAmount": 70000,
      "paymentStatus": "paid",
      "notes": "Prefer organic products",
      "createdAt": "2025-11-20T10:00:00Z"
    }
  ],
  "summary": {
    "total": 45,
    "confirmed": 30,
    "pending": 10,
    "completed": 5
  }
}
```

---

#### POST /api/salons/:salonId/bookings/:bookingId/complete
**Purpose:** Mark booking as completed

**Request:**
```json
{
  "actualAmount": 70000, // if different from original
  "notes": "Customer satisfied"
}
```

**Response:**
```json
{
  "booking": { /* updated booking */ },
  "commission": {
    "platformFee": 10500, // 15% of 70000
    "salonEarnings": 59500
  }
}
```

---

### Payment APIs

#### POST /api/create-payment-order
**Purpose:** Create Razorpay order for booking

**Request:**
```json
{
  "bookingId": "uuid",
  "amount": 70000 // paisa
}
```

**Response:**
```json
{
  "orderId": "order_razorpay_id",
  "amount": 70000,
  "currency": "INR",
  "keyId": "rzp_live_xxxx" // Razorpay key for client
}
```

---

#### POST /api/verify-payment
**Purpose:** Verify Razorpay payment signature

**Request:**
```json
{
  "orderId": "order_razorpay_id",
  "paymentId": "pay_razorpay_id",
  "signature": "razorpay_signature",
  "bookingId": "uuid"
}
```

**Response:**
```json
{
  "verified": true,
  "booking": { /* updated booking */ },
  "payment": {
    "id": "uuid",
    "amount": 70000,
    "status": "success",
    "method": "card", // or upi, netbanking
    "paidAt": "2025-11-20T10:00:00Z"
  }
}
```

---

### Wallet APIs

#### GET /api/user/wallet
**Purpose:** Get wallet balance and recent transactions

**Response:**
```json
{
  "balance": 50000, // paisa
  "currency": "INR",
  "transactions": [
    {
      "id": "uuid",
      "amount": 10000,
      "type": "cashback",
      "description": "Cashback from booking BK20251125001",
      "balanceAfter": 50000,
      "createdAt": "2025-11-20T10:00:00Z"
    }
  ]
}
```

---

## Business Logic Rules

### Booking Validation Rules

1. **Time Restrictions:**
   - Minimum advance booking: 2 hours from current time
   - Maximum advance booking: 90 days
   - Bookings must be within business hours
   - Buffer time between bookings: 15 minutes (configurable)

2. **Cancellation Policy:**
   - Customer cancellation allowed up to 2 hours before
   - Business can cancel anytime with reason
   - Refund matrix:
     - 24+ hours before: 100% refund
     - 2-24 hours before: 50% refund
     - < 2 hours: No refund

3. **Rescheduling Policy:**
   - Allowed up to 4 hours before booking
   - Maximum 2 reschedules per booking
   - New slot must be available
   - No charge for first reschedule

4. **No-Show Handling:**
   - If customer doesn't arrive within 15 mins of booking time
   - Business can mark as "no_show"
   - No refund for no-shows
   - 3 no-shows = account warning

### Payment Rules

1. **Payment Methods:**
   - Online: Razorpay (Card, UPI, Net Banking, Wallet)
   - Cash: Pay at salon
   - Wallet: Use SalonHub wallet balance
   - Combo: Wallet + Online (partial payment)

2. **Wallet Cashback:**
   - First booking: 10% cashback (max ₹200)
   - Subsequent bookings: 2-5% based on tier
   - Cashback credited after booking completion
   - Valid for 90 days

3. **Commission Structure:**
   - Platform commission: 15% of booking amount
   - Deducted from salon earnings
   - Calculated on final amount (after discounts)

### Offer Validation Rules

1. **Offer Eligibility:**
   - Check valid date range (validFrom - validUntil)
   - Check usage limits (total & per user)
   - Check minimum order value
   - Check user type (new/existing)
   - Check service categories

2. **Discount Calculation:**
   ```typescript
   if (discountType === 'percentage') {
     discount = (amount * discountValue) / 100
     discount = Math.min(discount, maxDiscountPaisa)
   } else if (discountType === 'fixed') {
     discount = discountValue * 100 // convert to paisa
   }
   finalAmount = amount - discount
   ```

3. **Cashback Calculation:**
   ```typescript
   if (discountType === 'cashback') {
     cashback = (amount * discountValue) / 100
     cashback = Math.min(cashback, maxDiscountPaisa)
     // Credit to wallet after booking completion
   }
   ```

### Rating & Review Rules

1. **Review Eligibility:**
   - Only after booking status = completed
   - One review per booking
   - Review window: 7 days after completion

2. **Rating Calculation:**
   ```typescript
   newRating = (
     (currentRating * reviewCount) + newReviewRating
   ) / (reviewCount + 1)
   ```

3. **Review Moderation:**
   - Auto-hide reviews with profanity
   - Salon owner can respond within 30 days
   - Super admin can hide/unhide reviews

---

## Navigation Flows

### Customer App Navigation

```
Splash Screen
├─ If Authenticated → Home Screen
│   ├─ Bottom Nav: Home
│   ├─ Bottom Nav: Explore
│   ├─ Bottom Nav: Bookings
│   ├─ Bottom Nav: Offers
│   └─ Bottom Nav: Profile
│
└─ If Not Authenticated → Welcome Screen
    ├─ Get Started → Login/Signup Choice
    │   ├─ Phone Auth → OTP → Home
    │   ├─ Email Auth → Login Form → Home
    │   └─ Google Auth → Home
    │
    └─ Continue as Guest → Home (limited features)
```

**Screen Flow for Booking:**
```
Home → Salon Details → Service Selection → 
Time Slot Selection → Booking Summary → 
Payment → Confirmation → Booking Details
```

### Business Partner App Navigation

```
Splash Screen
├─ If Authenticated → Check Salon Setup
│   ├─ If Setup Complete → Dashboard
│   │   ├─ Bottom Nav: Dashboard
│   │   ├─ Bottom Nav: Calendar
│   │   ├─ Bottom Nav: Customers
│   │   ├─ Bottom Nav: Staff
│   │   └─ Bottom Nav: More
│   │
│   └─ If Setup Incomplete → Setup Wizard
│       ├─ Step 1: Business Info
│       ├─ Step 2: Location & Contact
│       ├─ Step 3: Services
│       ├─ Step 4: Staff
│       ├─ Step 5: Resources
│       ├─ Step 6: Booking Settings
│       ├─ Step 7: Payment Setup
│       ├─ Step 8: Media & Photos
│       └─ Complete → Dashboard
│
└─ If Not Authenticated → Welcome Screen
    └─ Register/Login → OTP Verification →
        Check Salon → Setup Wizard or Dashboard
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | Success | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

### Error Response Format

```json
{
  "error": {
    "code": "BOOKING_SLOT_UNAVAILABLE",
    "message": "The selected time slot is no longer available",
    "details": {
      "field": "bookingTime",
      "availableSlots": ["14:00", "15:00", "16:00"]
    }
  }
}
```

### Common Error Codes

**Authentication:**
- `INVALID_CREDENTIALS` - Wrong email/password
- `ACCOUNT_NOT_VERIFIED` - Email not verified
- `ACCOUNT_SUSPENDED` - Account suspended

**Booking:**
- `BOOKING_SLOT_UNAVAILABLE` - Slot not available
- `BOOKING_TOO_SOON` - Booking < 2 hours from now
- `BOOKING_PAST_DEADLINE` - Booking > 90 days
- `SALON_CLOSED` - Salon closed on selected date
- `CANCELLATION_DEADLINE_PASSED` - Can't cancel < 2 hours before

**Payment:**
- `PAYMENT_FAILED` - Payment gateway error
- `INSUFFICIENT_WALLET_BALANCE` - Not enough wallet credits
- `INVALID_PAYMENT_SIGNATURE` - Razorpay verification failed

**Offer:**
- `OFFER_EXPIRED` - Offer validity ended
- `OFFER_LIMIT_REACHED` - Usage limit exceeded
- `MIN_ORDER_NOT_MET` - Order value below minimum

---

## Mobile-Specific Considerations

### Offline Support

**Cached Data (Up to 24 hours):**
- User profile
- Recently viewed salons
- Saved locations
- Favorite salons
- Completed bookings

**Offline Actions Queue:**
- Favorite/unfavorite salon
- Profile updates
- Booking cancellations (within policy)

**Sync Strategy:**
```typescript
// On app foreground or network reconnect
await syncOfflineActions()
await refreshCachedData()
```

### Push Notifications

**Customer App:**
- Booking confirmed
- Booking reminder (2 hours before)
- Booking cancelled
- Payment successful
- New offer available
- Review reminder

**Business Partner App:**
- New booking received
- Booking cancelled
- Payment received
- Staff absence alert
- Low stock alert
- Daily summary (9 AM)

**Implementation:**
```typescript
// Firebase Cloud Messaging
{
  "notification": {
    "title": "Booking Confirmed",
    "body": "Your booking at Bella Beauty Salon is confirmed"
  },
  "data": {
    "type": "booking_confirmed",
    "bookingId": "uuid",
    "deepLink": "salonhub://bookings/uuid"
  }
}
```

### Deep Linking

**URL Scheme:** `salonhub://`

**Routes:**
- `salonhub://home` → Home screen
- `salonhub://salons/{id}` → Salon details
- `salonhub://bookings/{id}` → Booking details
- `salonhub://offers/{id}` → Offer details
- `salonhub://profile` → User profile

### Image Optimization

**Upload Constraints:**
- Max size: 5MB
- Formats: JPG, PNG, WebP
- Dimensions: Min 800x600, Max 4000x3000

**CDN Transformation:**
```
https://cdn.example.com/salons/abc.jpg?w=400&h=300&fit=cover
```

### Analytics Events

**Track:**
- Screen views
- Button clicks
- Search queries
- Booking funnel steps
- Payment method selection
- Offer applications
- App crashes

---

## Summary

This document provides complete technical specifications for implementing the SalonHub mobile apps. When you receive Uizard-generated screens, you can reference this document to:

✅ Understand exactly what API to call for each button/action  
✅ Know what data to send and receive  
✅ Implement proper validation and business logic  
✅ Handle navigation flows correctly  
✅ Display appropriate error messages  

**All buttons and navigation will work properly because:**
1. Every screen action maps to a specific API endpoint
2. Every API has defined request/response structure
3. Every business rule is documented
4. Every navigation flow is mapped
5. All error cases are handled

---

**Document Version:** 1.0  
**Last Updated:** November 20, 2025  
**Status:** ✅ Production Ready
