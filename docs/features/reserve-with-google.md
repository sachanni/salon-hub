# Reserve with Google Integration

## Overview

Reserve with Google (RwG) allows SalonHub customers to book appointments directly from Google Search and Google Maps. This is a **premium feature** for salon owners that increases their visibility and booking conversions.

**Status**: Planning Phase  
**Priority**: High  
**Estimated Timeline**: 12-16 weeks  
**Google API Cost**: Free (no subscription or commission fees)

---

## Feature Summary

| Aspect | Details |
|--------|---------|
| **What it does** | Customers book salon appointments directly from Google Search/Maps |
| **Target users** | Premium salon owners |
| **Revenue model** | Premium feature add-on |
| **Google fees** | None |

---

## Implementation Progress

### Phase 1: Foundation & Partner Application (Weeks 1-2)
- [ ] Create Google Cloud Platform project
- [ ] Fill Partner Interest Form at https://developers.google.com/actions-center
- [ ] Prepare business documentation
- [ ] Apply for Sandbox access
- [ ] Design database schema for RwG tables
- [ ] Implement premium feature gating

### Phase 2: Feed System Implementation (Weeks 3-5)
- [ ] Implement Merchants Feed generator
- [ ] Implement Services Feed generator
- [ ] Implement Availability Feed generator
- [ ] Set up SFTP upload to Google's dropbox
- [ ] Create cron job for daily feed sync
- [ ] Implement incremental availability updates (every 15 mins)

### Phase 3: Booking Server API (Weeks 6-9)
- [ ] Implement HealthCheck endpoint
- [ ] Implement BatchAvailabilityLookup endpoint
- [ ] Implement CreateBooking endpoint
- [ ] Implement UpdateBooking endpoint
- [ ] Implement GetBookingStatus endpoint
- [ ] Implement ListBookings endpoint
- [ ] Configure HTTPS with valid TLS certificate
- [ ] Implement HTTP Basic Authentication
- [ ] Add idempotency token validation

### Phase 4: Real-Time Updates (RTUs) (Weeks 10-11)
- [ ] Implement RTU sender service
- [ ] Hook into booking creation events
- [ ] Hook into booking cancellation events
- [ ] Hook into staff schedule changes
- [ ] Hook into service/price updates
- [ ] Hook into salon hours changes

### Phase 5: Admin Dashboard & Controls (Week 12)
- [ ] Create GoogleRwGSettings component for salon owners
- [ ] Add Google Integration tab to Business Dashboard
- [ ] Implement sync status indicator
- [ ] Add booking statistics from Google
- [ ] Add feed health status display
- [ ] Create Super Admin RwG management section

### Phase 6: Testing & Launch (Weeks 13-16)
- [ ] Complete Sandbox testing
- [ ] Pass Google approval process
- [ ] Enable for 5 pilot salons
- [ ] Monitor for 1 week
- [ ] Fix any issues
- [ ] Gradual rollout to all premium salons

---

## Technical Architecture

### Database Schema

```sql
-- Salon-level RwG settings
CREATE TABLE google_rwg_settings (
  id VARCHAR PRIMARY KEY,
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  is_enabled INTEGER DEFAULT 0,
  google_merchant_id VARCHAR,
  google_place_id VARCHAR,
  sync_status VARCHAR DEFAULT 'pending',
  last_sync_at TIMESTAMP,
  feed_upload_status JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(salon_id)
);

-- Track Google-originated bookings
CREATE TABLE google_rwg_bookings (
  id VARCHAR PRIMARY KEY,
  google_booking_id VARCHAR NOT NULL,
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  local_booking_id VARCHAR REFERENCES bookings(id),
  status VARCHAR NOT NULL,
  idempotency_token VARCHAR,
  user_info JSONB,
  created_via_google INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(google_booking_id)
);

-- Sync audit trail
CREATE TABLE google_rwg_sync_logs (
  id VARCHAR PRIMARY KEY,
  salon_id VARCHAR REFERENCES salons(id),
  sync_type VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  records_synced INTEGER,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### File Structure

```
server/
├── routes/
│   ├── google-rwg.routes.ts              # Main RwG API routes
│   ├── google-rwg-admin.routes.ts        # Admin management routes
│   └── google-rwg-webhooks.routes.ts     # Callback handlers
│
├── services/
│   ├── google-rwg/
│   │   ├── index.ts                      # Service exports
│   │   ├── booking-server.ts             # Booking API handlers
│   │   ├── feed-generator.ts             # Feed generation logic
│   │   ├── availability-sync.ts          # Real-time sync
│   │   ├── sftp-uploader.ts              # SFTP feed upload
│   │   ├── rtu-sender.ts                 # Real-time updates
│   │   └── mappers/
│   │       ├── merchant-mapper.ts        # Salon → Merchant
│   │       ├── service-mapper.ts         # Service mapping
│   │       ├── availability-mapper.ts    # Slot mapping
│   │       └── booking-mapper.ts         # Booking mapping
│   │
│   └── google-rwg-auth.ts                # Authentication handler
│
├── cron/
│   ├── google-feed-sync.ts               # Daily feed upload
│   └── google-availability-sync.ts       # 15-min availability sync
│
└── middleware/
    └── google-rwg-auth.middleware.ts     # Request authentication

client/src/
├── components/business-dashboard/
│   └── GoogleRwGSettings.tsx             # Salon owner controls
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/google/health` | POST | Health check for Google monitoring |
| `/api/google/availability/batch` | POST | Real-time slot lookup |
| `/api/google/bookings` | POST | Create booking from Google |
| `/api/google/bookings/:id` | PUT | Update/cancel booking |
| `/api/google/bookings/:id` | GET | Get booking status |
| `/api/google/bookings` | GET | List bookings for a user |

---

## Feed Specifications

### Merchants Feed Format

```json
{
  "merchant_id": "salon_abc123",
  "name": "Glamour Salon",
  "telephone": "+919876543210",
  "url": "https://salonhub.com/salon/glamour",
  "geo": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "address": {
    "country": "IN",
    "locality": "Bangalore",
    "postal_code": "560001",
    "region": "Karnataka",
    "street_address": "123 MG Road"
  },
  "category": "beauty_salon"
}
```

### Services Feed Format

```json
{
  "service_id": "service_haircut_001",
  "merchant_id": "salon_abc123",
  "name": "Premium Haircut",
  "description": "Professional haircut with styling",
  "price": {
    "currency_code": "INR",
    "units": 500,
    "nanos": 0
  },
  "duration_sec": 2700,
  "category": "haircut"
}
```

### Availability Feed Format

```json
{
  "availability": [
    {
      "merchant_id": "salon_abc123",
      "service_id": "service_haircut_001",
      "start_time": "2024-12-15T10:00:00+05:30",
      "duration_sec": 2700,
      "spots_total": 1,
      "spots_open": 1,
      "resources": {
        "staff_id": "staff_john_001",
        "staff_name": "John"
      }
    }
  ]
}
```

---

## Security Requirements

- HTTPS with valid TLS certificate
- HTTP Basic Authentication (credentials rotate every 6 months)
- Idempotency token validation for all booking requests
- Request signature verification
- Rate limiting
- IP whitelisting for Google IPs

---

## Google Partner Requirements

### Eligibility Criteria

1. Direct contractual relationship with all merchants
2. Merchant list must match Google Maps locations
3. GDPR-compliant data handling
4. Real-time availability through merchant online systems
5. 30+ days of availability required
6. Online cancellation support mandatory

### Technical Requirements

1. v3 REST API implementation
2. All communication over HTTPS
3. Valid TLS certificate matching DNS name
4. Credentials updated every six months
5. Sub-1-second API response time
6. 99.9% uptime

---

## Premium Feature Pricing

| Plan | Reserve with Google |
|------|---------------------|
| Basic Plan | Not included |
| Premium Plan (₹999-1999/month) | Included |
| Enterprise (Custom) | Included + Priority Support |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Feed sync success rate | > 99.5% |
| Booking API response time | < 1 second |
| Google-originated bookings | 20-30% of total |
| Uptime | 99.9% |
| Customer satisfaction | 4.5+ stars on Google |

---

## Resources

- [Google Actions Center Documentation](https://developers.google.com/actions-center)
- [Reserve with Google Overview](https://developers.google.com/actions-center/verticals/reservations/e2e/overview)
- [Integration Policies](https://developers.google.com/actions-center/verticals/reservations/e2e/policies/integration-policies)
- [Booking Server Setup](https://developers.google.com/actions-center/verticals/reservations/e2e/integration-steps/booking-server-ready)
- [Node.js Skeleton Code](https://maps-booking.googlesource.com/js-maps-booking-rest-server-v3-skeleton)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-12-08 | Initial document created | Agent |

---

## Notes

- Google Partner application can take 2-4 weeks for approval
- Sandbox testing is required before production deployment
- Daily feed uploads are mandatory even after launch
- Real-time availability updates should be sent within 15 minutes of any booking change
