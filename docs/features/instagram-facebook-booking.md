# Instagram/Facebook Booking Buttons - Feature Specification

## Executive Summary

This document outlines the implementation plan for adding "Book Now" buttons to Instagram and Facebook profiles for salons on SalonHub. This feature enables customers to book appointments directly from social media, leveraging Meta's Appointments API to sync services, staff availability, and bookings in real-time.

**Target Completion:** 14 weeks  
**Premium Feature:** Yes (Growth tier: ₹999/month, Elite tier: ₹1999/month)

---

## Table of Contents

1. [Business Context](#1-business-context)
2. [User Journeys](#2-user-journeys)
3. [Feature Requirements](#3-feature-requirements)
4. [Technical Architecture](#4-technical-architecture)
5. [Security & Compliance](#5-security--compliance)
6. [Competitive Analysis](#6-competitive-analysis)
7. [Pricing Tiers](#7-pricing-tiers)
8. [Implementation Phases](#8-implementation-phases)
9. [Testing Strategy](#9-testing-strategy)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
11. [Success Metrics](#11-success-metrics)
12. [Appendix](#appendix)

---

## 1. Business Context

### 1.1 Problem Statement

Salon owners invest heavily in Instagram and Facebook marketing but lose potential customers during the transition from social media to booking. Key pain points:

- **Friction in booking flow**: Customers see a salon post, then must search for their website/app
- **Lost conversions**: Up to 60% of interested customers drop off during platform switching
- **Manual coordination**: Salon staff manually respond to DM booking requests
- **No real-time availability**: Customers don't know if slots are available

### 1.2 Solution

Integrate Meta's Appointments API to add native "Book Now" buttons on:
- Instagram Business profile action buttons
- Facebook Business Page action buttons
- Instagram Stories swipe-up/link stickers
- Facebook Messenger automated booking

### 1.3 Business Goals

| Goal | Target |
|------|--------|
| Increase booking conversion from social | 40% improvement |
| Reduce DM booking inquiries | 70% reduction |
| Premium tier adoption | 500 salons in 6 months |
| Monthly recurring revenue | ₹5-10 lakhs from this feature |

---

## 2. User Journeys

### 2.1 Customer Journey: Book via Instagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ Customer discovers salon on Instagram                               │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Views salon profile → Sees "Book Now" button                     │
│ 2. Taps "Book Now" → Opens booking widget (in-app browser)         │
│ 3. Selects service(s) → Views real-time availability               │
│ 4. Picks date/time → Selects preferred staff (optional)            │
│ 5. Enters contact details → Phone verification (if new customer)   │
│ 6. Confirms booking → Receives confirmation via Instagram DM       │
│ 7. Gets reminder → 24h and 2h before appointment                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Customer Journey: Book via Facebook

```
┌─────────────────────────────────────────────────────────────────────┐
│ Customer discovers salon on Facebook                                │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Views Page → Sees "Book Now" CTA button                         │
│ 2. Clicks button → Opens SalonHub booking page                     │
│ 3. OR messages Page → Messenger bot offers booking link            │
│ 4. Completes booking → Receives Messenger confirmation             │
│ 5. Can manage booking via Messenger (reschedule/cancel)            │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Salon Owner Journey: Setup & Activation

```
┌─────────────────────────────────────────────────────────────────────┐
│ Salon owner enables Instagram/Facebook booking                      │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Upgrades to Growth/Elite tier in SalonHub                       │
│ 2. Goes to Settings → Social Media Integration                     │
│ 3. Clicks "Connect Instagram/Facebook"                             │
│ 4. Facebook Login popup → Grants required permissions              │
│ 5. Selects which Page/Profile to connect                           │
│ 6. Reviews synced services and staff                               │
│ 7. Configures booking preferences (lead time, cancellation policy) │
│ 8. Activates integration → "Book Now" button appears on social     │
│ 9. Dashboard shows social booking analytics                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Salon Staff Journey: Managing Social Bookings

```
┌─────────────────────────────────────────────────────────────────────┐
│ Staff handles bookings from social media                            │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Receives notification: "New booking from Instagram"             │
│ 2. Booking appears in calendar with Instagram icon badge           │
│ 3. Can view customer's social profile (if linked)                  │
│ 4. Customer messages via Instagram → Integrated in SalonHub chat   │
│ 5. Reschedule/cancel syncs back to customer via DM                 │
│ 6. Post-visit: Prompts customer for review on Google/Facebook      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Requirements

### 3.1 Functional Requirements

#### For Customers (Booking Experience)

| ID | Requirement | Priority |
|----|-------------|----------|
| C1 | Book appointments via Instagram profile button | P0 |
| C2 | Book appointments via Facebook Page button | P0 |
| C3 | View real-time service availability | P0 |
| C4 | Select preferred staff member | P1 |
| C5 | Receive booking confirmation via DM | P0 |
| C6 | Receive appointment reminders via DM | P1 |
| C7 | Reschedule/cancel via Messenger | P1 |
| C8 | Book via Instagram Stories link sticker | P2 |
| C9 | Book via Facebook Messenger chatbot | P2 |

#### For Salon Owners (Setup & Management)

| ID | Requirement | Priority |
|----|-------------|----------|
| S1 | Connect Instagram Business account | P0 |
| S2 | Connect Facebook Business Page | P0 |
| S3 | Auto-sync services to Meta | P0 |
| S4 | Auto-sync staff availability | P0 |
| S5 | Configure booking lead time | P1 |
| S6 | Configure cancellation policy | P1 |
| S7 | Disconnect/reconnect integration | P0 |
| S8 | View social booking analytics | P1 |
| S9 | Customize booking page branding | P2 |
| S10 | Multi-location support | P2 |

#### For SalonHub Platform (Backend)

| ID | Requirement | Priority |
|----|-------------|----------|
| P1 | Meta OAuth 2.0 integration | P0 |
| P2 | Webhook receiver for Meta events | P0 |
| P3 | Real-time availability sync (<5 min) | P0 |
| P4 | Booking conflict resolution | P0 |
| P5 | Token refresh management | P0 |
| P6 | Rate limiting and abuse prevention | P1 |
| P7 | Audit logging for compliance | P1 |
| P8 | Graceful degradation on API outages | P1 |

### 3.2 Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Booking widget loads in <2 seconds |
| **Availability** | 99.9% uptime for webhook receiver |
| **Scalability** | Support 10,000 concurrent booking sessions |
| **Sync Latency** | Availability updates within 5 minutes |
| **Security** | OAuth tokens encrypted at rest |
| **Compliance** | GDPR-ready data handling |

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Meta Platform                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  Instagram   │  │   Facebook   │  │  Messenger   │                   │
│  │   Profile    │  │    Page      │  │    Bot       │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                 │                 │                            │
│         └────────────┬────┴────────────────┘                            │
│                      ▼                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Meta Appointments API / Graph API                     │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │
              ┌────────────────────────┴────────────────────────┐
              │                                                  │
              ▼                                                  ▼
┌─────────────────────────┐                      ┌──────────────────────────┐
│  OAuth Flow & Webhooks  │                      │   Booking Widget (Web)   │
│  ─────────────────────  │                      │  ──────────────────────  │
│  • Token exchange       │                      │  • SalonHub branded      │
│  • Permission scopes    │                      │  • Mobile-optimized      │
│  • Webhook verification │                      │  • Real-time availability│
└───────────┬─────────────┘                      └────────────┬─────────────┘
            │                                                  │
            ▼                                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SalonHub Backend                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Meta Service   │  │ Booking Service │  │  Sync Service   │          │
│  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │          │
│  │  • OAuth mgmt   │  │  • Create/edit  │  │  • Push avail.  │          │
│  │  • Webhook proc │  │  • Conflict res │  │  • Pull updates │          │
│  │  • Token refresh│  │  • Notifications│  │  • Reconcile    │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      PostgreSQL Database                           │  │
│  │  • meta_integrations  • bookings  • services  • availability       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Meta API Integration

#### Required APIs

| API | Purpose |
|-----|---------|
| **Facebook Login (OAuth 2.0)** | User authentication and permission grants |
| **Graph API (Pages)** | Manage Page CTA buttons, send Messenger messages |
| **Graph API (Instagram)** | Manage Instagram profile action buttons |
| **Appointments API** | Sync services, availability, handle bookings |
| **Webhooks API** | Receive real-time booking notifications |

#### Required Permissions

```
pages_manage_cta           - Set "Book Now" button on Facebook Pages
instagram_manage_profile   - Set action button on Instagram
pages_messaging            - Send booking confirmations via Messenger
pages_read_engagement      - Read appointment requests
business_management        - Manage business assets
```

#### OAuth Flow

```
1. Salon clicks "Connect Facebook/Instagram"
2. Redirect to Facebook Login with scopes
3. User grants permissions
4. Facebook redirects with authorization code
5. Exchange code for access token + refresh token
6. Store encrypted tokens in meta_integrations table
7. Fetch connected Pages/Instagram accounts
8. Salon selects which to connect
9. Configure CTA buttons via Graph API
```

### 4.3 Database Schema Additions

```sql
-- Store Meta OAuth connections
CREATE TABLE meta_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id),
  
  -- Facebook connection
  fb_page_id VARCHAR(50),
  fb_page_name VARCHAR(255),
  fb_page_access_token TEXT,  -- Encrypted
  fb_page_token_expires_at TIMESTAMP,
  
  -- Instagram connection
  ig_account_id VARCHAR(50),
  ig_username VARCHAR(100),
  ig_access_token TEXT,  -- Encrypted
  ig_token_expires_at TIMESTAMP,
  
  -- Integration status
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, error, disconnected
  last_sync_at TIMESTAMP,
  sync_error TEXT,
  
  -- Settings
  booking_lead_time_hours INTEGER DEFAULT 2,
  cancellation_policy TEXT,
  auto_confirm_bookings BOOLEAN DEFAULT true,
  send_dm_reminders BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track bookings originating from Meta
CREATE TABLE meta_booking_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  meta_integration_id UUID NOT NULL REFERENCES meta_integrations(id),
  
  source VARCHAR(20) NOT NULL, -- 'instagram', 'facebook', 'messenger'
  meta_appointment_id VARCHAR(100), -- Meta's appointment ID
  meta_user_id VARCHAR(50), -- Customer's Meta user ID
  
  -- DM tracking
  confirmation_dm_sent BOOLEAN DEFAULT false,
  confirmation_dm_id VARCHAR(100),
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook event log for debugging and replay
CREATE TABLE meta_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  signature VARCHAR(255),
  
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error TEXT,
  
  received_at TIMESTAMP DEFAULT NOW()
);
```

### 4.4 Key API Endpoints

```
POST /api/meta/connect          - Initiate OAuth flow
GET  /api/meta/callback         - OAuth callback handler
GET  /api/meta/status/:salonId  - Get integration status
POST /api/meta/disconnect       - Disconnect integration
POST /api/meta/sync             - Force sync services/availability
GET  /api/meta/analytics        - Social booking analytics

POST /api/webhooks/meta         - Receive Meta webhook events

GET  /api/book/social/:salonId  - Public booking widget for social
POST /api/book/social/create    - Create booking from social
```

### 4.5 Webhook Events to Handle

| Event | Action |
|-------|--------|
| `appointment.created` | Create booking in SalonHub |
| `appointment.updated` | Update booking (reschedule) |
| `appointment.cancelled` | Cancel booking |
| `page.action_button.clicked` | Log analytics event |
| `messaging.postback` | Handle Messenger booking flow |
| `permissions.revoked` | Mark integration as disconnected |

---

## 5. Security & Compliance

### 5.1 OAuth Token Security

| Measure | Implementation |
|---------|----------------|
| **Encryption at rest** | AES-256 encryption for access tokens |
| **Token rotation** | Auto-refresh before expiry (60-day tokens) |
| **Scoped permissions** | Request minimum required permissions |
| **Secure storage** | Tokens stored in encrypted DB columns |
| **Audit logging** | Log all token operations |

### 5.2 Webhook Security

```javascript
// Verify webhook signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, appSecret) {
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}
```

### 5.3 Data Privacy

| Requirement | Implementation |
|-------------|----------------|
| **GDPR compliance** | Data processing addendum with Meta |
| **Data minimization** | Only store necessary user data |
| **Right to deletion** | Remove Meta data on user request |
| **Consent tracking** | Log user consent for DM communications |
| **Data retention** | Auto-delete webhook logs after 90 days |

### 5.4 Fraud Prevention

| Risk | Mitigation |
|------|------------|
| **Fake bookings** | Phone verification for new customers |
| **Spam** | Rate limiting per IP and user |
| **Token theft** | Encrypted storage, short-lived tokens |
| **Webhook replay** | Idempotency keys, deduplication |

---

## 6. Competitive Analysis

### 6.1 How Competitors Handle This

| Feature | Fresha | Booksy | Vagaro | SalonHub (Proposed) |
|---------|--------|--------|--------|---------------------|
| Instagram Book Button | ✅ | ✅ | ✅ | ✅ |
| Facebook Book Button | ✅ | ✅ | ✅ | ✅ |
| Messenger Booking | ✅ | ❌ | ✅ | ✅ (P2) |
| Real-time Sync | <5 min | <10 min | <5 min | <5 min |
| DM Confirmations | ✅ | ✅ | ✅ | ✅ |
| Multi-location | ✅ | ✅ | ✅ | ✅ (P2) |
| Pricing | Included | Premium | Premium | ₹999-1999/mo |

### 6.2 Differentiators

1. **Identity Verification**: Prevent fake bookings by matching customer identity
2. **Unified Analytics**: See social bookings alongside other channels
3. **Flexible Pricing**: More affordable than western competitors
4. **Local Payment**: Razorpay integration for Indian market
5. **WhatsApp Integration**: Combine with existing Twilio/WhatsApp for reminders

---

## 7. Pricing Tiers

### 7.1 Tier Structure

| Tier | Price | Social Features |
|------|-------|-----------------|
| **Free** | ₹0 | Basic SalonHub listing only |
| **Growth** | ₹999/month | Instagram + Facebook Book Buttons |
| **Elite** | ₹1999/month | All Growth features + Reserve with Google |

### 7.2 Growth Tier Includes

- ✅ Instagram "Book Now" button
- ✅ Facebook "Book Now" button
- ✅ Real-time availability sync
- ✅ DM booking confirmations
- ✅ Social booking analytics dashboard
- ✅ Priority support

### 7.3 Elite Tier Adds

- ✅ Reserve with Google
- ✅ Messenger chatbot booking
- ✅ Instagram Stories integration
- ✅ Custom branding on booking widget
- ✅ API access for custom integrations
- ✅ Dedicated account manager

---

## 8. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

| Task | Duration | Dependencies |
|------|----------|--------------|
| Meta Developer account setup | 1 day | Business verification |
| Appointments API access request | 3-5 days | App review |
| Database schema design | 2 days | - |
| OAuth flow implementation | 4 days | API access |
| Token encryption/storage | 2 days | OAuth flow |
| Webhook receiver setup | 3 days | OAuth flow |

**Deliverables:**
- Meta app approved for Appointments API
- OAuth flow working in sandbox
- Webhook receiver verified by Meta

### Phase 2: Core Integration (Weeks 4-7)

| Task | Duration | Dependencies |
|------|----------|--------------|
| Service sync to Meta | 3 days | Phase 1 |
| Staff availability sync | 3 days | Service sync |
| Booking creation from Meta | 4 days | Availability sync |
| Booking update/cancel sync | 3 days | Booking creation |
| DM notification sending | 3 days | Booking flow |
| Conflict resolution logic | 3 days | Booking flow |

**Deliverables:**
- Full booking flow working end-to-end
- Bidirectional sync operational
- DM confirmations sending

### Phase 3: Salon Admin UI (Weeks 8-10)

| Task | Duration | Dependencies |
|------|----------|--------------|
| Settings page design | 2 days | - |
| Connect/disconnect UI | 3 days | Phase 2 |
| Sync status display | 2 days | Connect UI |
| Booking preferences config | 2 days | Connect UI |
| Analytics dashboard | 4 days | Phase 2 |
| Error handling UI | 2 days | All above |

**Deliverables:**
- Complete salon admin experience
- Self-service connection/disconnection
- Analytics visible in dashboard

### Phase 4: Polish & Launch (Weeks 11-14)

| Task | Duration | Dependencies |
|------|----------|--------------|
| Public booking widget | 4 days | Phase 2 |
| Mobile optimization | 3 days | Widget |
| Error edge case handling | 3 days | All phases |
| Load testing | 2 days | All phases |
| Beta testing with 10 salons | 5 days | All phases |
| Documentation & training | 3 days | Beta feedback |
| Production launch | 2 days | All above |

**Deliverables:**
- Production-ready feature
- Documentation complete
- Support team trained

---

## 9. Testing Strategy

### 9.1 Test Categories

| Category | Scope |
|----------|-------|
| **Unit Tests** | OAuth token handling, webhook signature verification |
| **Integration Tests** | Meta API calls, booking sync flow |
| **Contract Tests** | API response schema validation |
| **E2E Tests** | Full booking journey via Meta sandbox |
| **Load Tests** | 1000 concurrent booking sessions |
| **Chaos Tests** | Webhook outages, token expiry scenarios |

### 9.2 Test Environments

| Environment | Purpose |
|-------------|---------|
| **Meta Sandbox** | Development and integration testing |
| **Staging** | Pre-production testing with test Pages |
| **Production** | Live with canary rollout (10% → 50% → 100%) |

### 9.3 Monitoring & Alerts

| Metric | Alert Threshold |
|--------|-----------------|
| Webhook processing latency | >5 seconds |
| Webhook error rate | >1% |
| Token refresh failures | Any |
| Sync lag | >10 minutes |
| Booking conversion rate | <20% (investigate) |

---

## 10. Edge Cases & Error Handling

### 10.1 Booking Conflicts

| Scenario | Handling |
|----------|----------|
| **Double booking** | Last-write-wins with notification to both |
| **Slot becomes unavailable** | Offer next available slot |
| **Staff unavailable** | Reassign or offer different staff |
| **Service discontinued** | Hide from Meta, show error if booked |

### 10.2 Integration Failures

| Scenario | Handling |
|----------|----------|
| **Token expired** | Auto-refresh, alert salon if fails |
| **Permissions revoked** | Mark disconnected, notify salon |
| **Webhook delivery failure** | Retry with exponential backoff |
| **API rate limiting** | Queue and retry, alert if persistent |

### 10.3 User Experience Errors

| Scenario | User Message |
|----------|--------------|
| **Connection failed** | "Unable to connect. Please try again." |
| **Booking failed** | "Booking couldn't be completed. [Call salon]" |
| **Sync delayed** | "Availability may be up to 10 minutes delayed" |
| **Feature unavailable** | "Instagram booking is temporarily unavailable" |

---

## 11. Success Metrics

### 11.1 Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| **Social booking volume** | 1000 bookings/month by Month 3 | Database count |
| **Conversion rate** | 25% click-to-book | Analytics |
| **Sync latency** | <5 minutes average | Monitoring |
| **Error rate** | <0.5% of bookings | Error logs |
| **Salon activation** | 200 salons in Month 1 | Feature flags |
| **Revenue** | ₹2 lakhs MRR by Month 3 | Billing system |

### 11.2 Dashboard Metrics (for Salon Owners)

- Total bookings from Instagram this month
- Total bookings from Facebook this month
- Booking conversion rate
- Most popular services booked via social
- Peak booking times from social
- Customer demographics from social

---

## Appendix

### A. Meta API Documentation Links

- [Facebook Login](https://developers.facebook.com/docs/facebook-login/)
- [Appointments API](https://developers.facebook.com/docs/messenger-platform/appointments/)
- [Graph API - Pages](https://developers.facebook.com/docs/pages/)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)
- [Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/)

### B. Required Meta App Permissions

```
pages_manage_cta
pages_read_engagement
pages_messaging
instagram_manage_profile
instagram_basic
business_management
```

### C. Glossary

| Term | Definition |
|------|------------|
| **CTA** | Call-to-Action button on Facebook/Instagram profile |
| **Graph API** | Meta's primary API for data access |
| **Webhook** | HTTP callback for real-time event notifications |
| **OAuth 2.0** | Authentication protocol used by Meta |
| **Long-lived token** | Access token valid for 60 days |

---

## Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Business Owner | | | |

---

*Document Version: 1.0*  
*Last Updated: December 9, 2024*  
*Author: SalonHub Development Team*
