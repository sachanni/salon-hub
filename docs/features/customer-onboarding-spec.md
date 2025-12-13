# Customer Onboarding System - Technical Specification

## Overview
A complete system enabling salon admins to bulk import existing customers and send personalized WhatsApp/SMS invitations with welcome offers to drive mobile app downloads and registrations.

---

## 1. Database Schema

### 1.1 Customer Import Batches Table
Tracks each bulk import operation performed by salon admins.

```typescript
export const customerImportBatches = pgTable("customer_import_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  importedBy: varchar("imported_by").notNull().references(() => users.id),
  fileName: varchar("file_name", { length: 255 }),
  totalRecords: integer("total_records").notNull().default(0),
  successfulImports: integer("successful_imports").notNull().default(0),
  failedImports: integer("failed_imports").notNull().default(0),
  duplicateSkipped: integer("duplicate_skipped").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default('processing'), // processing, completed, failed
  errorLog: jsonb("error_log"), // Array of {row, error} for failed imports
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});
```

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| salonId | varchar | Reference to salon |
| importedBy | varchar | User who performed import |
| fileName | varchar | Original file name |
| totalRecords | integer | Total rows in file |
| successfulImports | integer | Successfully imported |
| failedImports | integer | Failed validations |
| duplicateSkipped | integer | Duplicates skipped |
| status | varchar | processing, completed, failed |
| errorLog | jsonb | Array of errors |
| createdAt | timestamp | Import start time |
| completedAt | timestamp | Import end time |

### 1.2 Imported Customers Table
Stores individual imported customer records before they register.

```typescript
export const importedCustomers = pgTable("imported_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  importBatchId: varchar("import_batch_id").references(() => customerImportBatches.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  normalizedPhone: varchar("normalized_phone", { length: 20 }).notNull(), // E.164 format for matching
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, invited, registered, expired
  invitedAt: timestamp("invited_at"),
  registeredAt: timestamp("registered_at"),
  linkedUserId: varchar("linked_user_id").references(() => users.id, { onDelete: "set null" }), // Set when customer registers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("imported_customers_salon_phone_unique").on(table.salonId, table.normalizedPhone),
  index("imported_customers_normalized_phone_idx").on(table.normalizedPhone),
]);
```

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| salonId | varchar | Reference to salon |
| importBatchId | varchar | Reference to import batch |
| customerName | varchar | Customer name |
| phone | varchar | Original phone |
| email | varchar | Optional email |
| normalizedPhone | varchar | E.164 format for matching |
| status | varchar | pending, invited, registered, expired |
| invitedAt | timestamp | When invitation sent |
| registeredAt | timestamp | When customer registered |
| linkedUserId | varchar | User ID after registration |
| createdAt | timestamp | Record created |

**Unique Constraint:** One phone per salon

### 1.3 Invitation Campaigns Table
Stores campaign configurations for sending invitations.

```typescript
export const invitationCampaigns = pgTable("invitation_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull().default('whatsapp'), // whatsapp, sms, both
  messageTemplate: text("message_template").notNull(),
  welcomeOfferId: varchar("welcome_offer_id").references(() => welcomeOffers.id),
  status: varchar("status", { length: 20 }).notNull().default('draft'), // draft, scheduled, sending, completed, paused
  scheduledFor: timestamp("scheduled_for"),
  targetCustomerCount: integer("target_customer_count").notNull().default(0),
  messagesSent: integer("messages_sent").notNull().default(0),
  messagesDelivered: integer("messages_delivered").notNull().default(0),
  messagesFailed: integer("messages_failed").notNull().default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});
```

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| salonId | varchar | Reference to salon |
| name | varchar | Campaign name |
| channel | varchar | whatsapp, sms, both |
| messageTemplate | text | Message with variables |
| welcomeOfferId | varchar | Linked offer |
| status | varchar | draft, scheduled, sending, completed, paused |
| scheduledFor | timestamp | Scheduled send time |
| targetCustomerCount | integer | How many to send |
| messagesSent | integer | Actually sent |
| messagesDelivered | integer | Confirmed delivered |
| messagesFailed | integer | Failed to send |
| createdBy | varchar | User who created |
| startedAt | timestamp | When sending started |
| completedAt | timestamp | When completed |

### 1.4 Invitation Messages Table
Tracks individual message delivery status.

```typescript
export const invitationMessages = pgTable("invitation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => invitationCampaigns.id, { onDelete: "cascade" }),
  importedCustomerId: varchar("imported_customer_id").notNull().references(() => importedCustomers.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 20 }).notNull(), // whatsapp, sms
  twilioMessageSid: varchar("twilio_message_sid", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, sent, delivered, failed, read
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| campaignId | varchar | Reference to campaign |
| importedCustomerId | varchar | Reference to customer |
| channel | varchar | whatsapp or sms |
| twilioMessageSid | varchar | Twilio tracking ID |
| status | varchar | pending, sent, delivered, failed, read |
| errorMessage | text | Error if failed |
| sentAt | timestamp | When sent |
| deliveredAt | timestamp | When delivered |
| readAt | timestamp | When read (WhatsApp) |

### 1.5 Welcome Offers Table
Stores welcome offer configurations for new app registrants.

```typescript
export const welcomeOffers = pgTable("welcome_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // percentage, fixed
  discountValue: integer("discount_value").notNull(), // Percentage (0-100) or amount in paisa
  maxDiscountInPaisa: integer("max_discount_in_paisa"), // Cap for percentage discounts
  minimumPurchaseInPaisa: integer("minimum_purchase_in_paisa"),
  validityDays: integer("validity_days").notNull().default(30), // Days from registration
  usageLimit: integer("usage_limit").notNull().default(1), // Per customer
  isActive: integer("is_active").notNull().default(1),
  totalRedemptions: integer("total_redemptions").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

| Column | Type | Description |
|--------|------|-------------|
| id | varchar (UUID) | Primary key |
| salonId | varchar | Reference to salon |
| name | varchar | Offer name |
| discountType | varchar | percentage or fixed |
| discountValue | integer | % or amount in paisa |
| maxDiscountInPaisa | integer | Cap for % discounts |
| minimumPurchaseInPaisa | integer | Minimum order value |
| validityDays | integer | Days from registration |
| usageLimit | integer | Times per customer |
| isActive | integer | 0 or 1 |
| totalRedemptions | integer | Count of uses |

### 1.6 Welcome Offer Redemptions Table
Tracks individual offer redemptions.

```typescript
export const welcomeOfferRedemptions = pgTable("welcome_offer_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  welcomeOfferId: varchar("welcome_offer_id").notNull().references(() => welcomeOffers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  importedCustomerId: varchar("imported_customer_id").references(() => importedCustomers.id, { onDelete: "set null" }),
  bookingId: varchar("booking_id"),
  discountAppliedInPaisa: integer("discount_applied_in_paisa").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  redeemedAt: timestamp("redeemed_at"),
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, redeemed, expired
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 2. Phone Number Normalization

### 2.1 Normalization Rules
All phone numbers are stored in E.164 format for consistent matching.

```typescript
function normalizePhoneNumber(phone: string, defaultCountryCode: string = '+91'): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Indian numbers
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+91' + cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  
  // Already has country code
  if (cleaned.length > 10) {
    return '+' + cleaned;
  }
  
  throw new Error(`Invalid phone number: ${phone}`);
}
```

### 2.2 Corner Cases

| Input | Output | Notes |
|-------|--------|-------|
| `9876543210` | `+919876543210` | Standard 10-digit |
| `09876543210` | `+919876543210` | Leading zero |
| `919876543210` | `+919876543210` | With country code |
| `+919876543210` | `+919876543210` | Already normalized |
| `98765 43210` | `+919876543210` | With spaces |
| `98765-432-10` | `+919876543210` | With dashes |
| `12345` | Error | Too short |
| `abcdefghij` | Error | Non-numeric |

---

## 3. CSV Import Process

### 3.1 Supported File Formats
- CSV (comma-separated)
- Excel (.xlsx, .xls)

### 3.2 Required Columns

| Column | Required | Validation |
|--------|----------|------------|
| Name | Yes | Non-empty string, max 255 chars |
| Phone | Yes | Valid phone number |
| Email | No | Valid email format if provided |

### 3.3 Import Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Upload File    │────▶│  Parse & Map    │────▶│  Validate Rows  │
│  (CSV/Excel)    │     │  Columns        │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
         ┌───────────────────────────────────────────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Check          │────▶│  Insert Valid   │────▶│  Return Summary │
│  Duplicates     │     │  Records        │     │  & Errors       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 3.4 Validation Rules

```typescript
const importRowSchema = z.object({
  name: z.string().min(1).max(255).transform(s => s.trim()),
  phone: z.string().min(10).max(20).transform(normalizePhoneNumber),
  email: z.string().email().optional().or(z.literal('')).transform(s => s || null),
});
```

### 3.5 Duplicate Handling
1. Check if normalized phone already exists for this salon
2. If duplicate found:
   - Skip the row
   - Increment `duplicateSkipped` counter
   - Log in error report: "Duplicate phone number"
3. If unique: Insert record

### 3.6 Error Handling

```typescript
interface ImportError {
  rowNumber: number;
  originalData: Record<string, string>;
  errors: string[];
}

// Error types:
// - "Invalid phone number format"
// - "Name is required"
// - "Invalid email format"
// - "Duplicate phone number"
// - "Row exceeds maximum length"
```

### 3.7 File Size Limits
- Maximum file size: 5MB
- Maximum rows per import: 10,000
- Processing: Batch of 100 rows at a time

---

## 4. WhatsApp/SMS Campaign System

### 4.1 Twilio Integration

```typescript
// Environment variables required:
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_NUMBER=+1xxxxxxxxxx
```

### 4.2 Message Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{customer_name}}` | Customer's first name | "Priya" |
| `{{salon_name}}` | Salon business name | "Glamour Studio" |
| `{{offer_amount}}` | Discount amount | "₹100" or "15%" |
| `{{offer_code}}` | Unique offer code | "WELCOME-A1B2C3" |
| `{{download_link}}` | App store link | "https://app.salonhub.com/s/abc123" |
| `{{expiry_days}}` | Offer validity | "30 days" |

### 4.3 Default Message Template

```
Hi {{customer_name}}! 👋

{{salon_name}} is now on SalonHub app. Book appointments, earn rewards, and get exclusive offers!

🎁 Special for you: Get {{offer_amount}} OFF your next visit!
Your code: {{offer_code}}

Download now: {{download_link}}

Valid for {{expiry_days}} days.
```

### 4.4 Rate Limiting
- WhatsApp: 80 messages per second (Twilio limit)
- SMS: 100 messages per second
- Implementation: Queue with 50ms delay between messages
- Batch size: 100 messages per batch
- Retry logic: 3 attempts with exponential backoff

### 4.5 Delivery Status Handling

```typescript
// Twilio webhook callback
app.post('/api/webhooks/twilio/status', async (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode } = req.body;
  
  // Status values: queued, sent, delivered, undelivered, failed, read
  await storage.updateInvitationMessageStatus(MessageSid, {
    status: MessageStatus,
    errorMessage: ErrorCode ? `Twilio error: ${ErrorCode}` : null,
    deliveredAt: MessageStatus === 'delivered' ? new Date() : null,
    readAt: MessageStatus === 'read' ? new Date() : null,
  });
  
  res.sendStatus(200);
});
```

### 4.6 Corner Cases

| Scenario | Handling |
|----------|----------|
| Invalid phone number | Skip, log error, continue |
| WhatsApp not active | Fallback to SMS (if enabled) |
| Rate limit exceeded | Pause 60 seconds, resume |
| Customer opted out | Skip, mark as "opted_out" |
| Duplicate message attempt | Skip if sent within 24 hours |
| Campaign paused mid-send | Save progress, resume from last |

---

## 5. Welcome Offer System

### 5.1 Offer Code Generation

```typescript
function generateOfferCode(prefix: string = 'WELCOME'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}
// Example: WELCOME-A7K9M2
```

### 5.2 Auto-Apply on Registration Flow

```
┌──────────────────┐
│ User Downloads   │
│ App & Registers  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Normalize Phone  │────▶│ Search imported_ │
│ Number           │     │ customers table  │
└──────────────────┘     └────────┬─────────┘
                                  │
         ┌────────────────────────┴───────────────────────┐
         │                                                │
         ▼                                                ▼
┌──────────────────┐                           ┌──────────────────┐
│ Match Found      │                           │ No Match         │
│                  │                           │ (New Customer)   │
└────────┬─────────┘                           └────────┬─────────┘
         │                                              │
         ▼                                              ▼
┌──────────────────┐                           ┌──────────────────┐
│ Link User ID     │                           │ Standard         │
│ Create Redemption│                           │ Registration     │
│ Show Welcome Msg │                           │ Flow             │
└──────────────────┘                           └──────────────────┘
```

### 5.3 Redemption Validation

```typescript
async function validateWelcomeOffer(
  offerId: string,
  userId: string,
  bookingAmountInPaisa: number
): Promise<{valid: boolean; discount: number; reason?: string}> {
  
  const offer = await storage.getWelcomeOffer(offerId);
  
  // Check 1: Offer exists and active
  if (!offer || !offer.isActive) {
    return { valid: false, discount: 0, reason: 'Offer not found or inactive' };
  }
  
  // Check 2: Not expired
  const redemption = await storage.getUserWelcomeOfferRedemption(userId, offerId);
  if (redemption && new Date() > redemption.expiresAt) {
    return { valid: false, discount: 0, reason: 'Offer has expired' };
  }
  
  // Check 3: Usage limit not exceeded
  const usageCount = await storage.getOfferUsageCount(userId, offerId);
  if (usageCount >= offer.usageLimit) {
    return { valid: false, discount: 0, reason: 'Offer already used' };
  }
  
  // Check 4: Minimum purchase met
  if (offer.minimumPurchaseInPaisa && bookingAmountInPaisa < offer.minimumPurchaseInPaisa) {
    return { 
      valid: false, 
      discount: 0, 
      reason: `Minimum purchase of ₹${offer.minimumPurchaseInPaisa/100} required` 
    };
  }
  
  // Calculate discount
  let discount = 0;
  if (offer.discountType === 'percentage') {
    discount = Math.floor(bookingAmountInPaisa * offer.discountValue / 100);
    if (offer.maxDiscountInPaisa && discount > offer.maxDiscountInPaisa) {
      discount = offer.maxDiscountInPaisa;
    }
  } else {
    discount = offer.discountValue;
  }
  
  return { valid: true, discount };
}
```

---

## 6. Analytics Dashboard

### 6.1 Key Metrics

```typescript
interface OnboardingAnalytics {
  // Import metrics
  totalImported: number;
  importedThisWeek: number;
  importedThisMonth: number;
  
  // Campaign metrics
  totalInvitesSent: number;
  invitesDelivered: number;
  deliveryRate: number; // delivered / sent
  
  // Conversion metrics
  registeredFromImport: number;
  conversionRate: number; // registered / imported
  
  // Offer metrics
  offersRedeemed: number;
  redemptionRate: number; // redeemed / registered
  totalDiscountGiven: number; // in paisa
  
  // Time-based
  avgDaysToRegister: number;
  avgDaysToFirstBooking: number;
}
```

### 6.2 Conversion Funnel

```
Imported ──▶ Invited ──▶ Delivered ──▶ Registered ──▶ First Booking
  1000        800         720           180            90
              80%         90%           25%           50%
```

---

## 7. API Endpoints

### 7.1 Import APIs

```
POST /api/salons/:salonId/customers/import
  - Upload CSV/Excel file
  - Returns: { batchId, preview: [...], totalRows }

POST /api/salons/:salonId/customers/import/:batchId/confirm
  - Confirm import after preview
  - Returns: { imported, failed, duplicates }

GET /api/salons/:salonId/customers/import/:batchId/status
  - Check import progress
  - Returns: { status, progress, errors }

GET /api/salons/:salonId/customers/imported
  - List imported customers
  - Query params: status, search, page, limit
```

### 7.2 Campaign APIs

```
POST /api/salons/:salonId/invitation-campaigns
  - Create new campaign
  - Body: { name, channel, messageTemplate, welcomeOfferId }

GET /api/salons/:salonId/invitation-campaigns
  - List campaigns

POST /api/salons/:salonId/invitation-campaigns/:id/send
  - Start sending campaign

POST /api/salons/:salonId/invitation-campaigns/:id/pause
  - Pause ongoing campaign

GET /api/salons/:salonId/invitation-campaigns/:id/stats
  - Get campaign statistics
```

### 7.3 Welcome Offer APIs

```
POST /api/salons/:salonId/welcome-offers
  - Create welcome offer

GET /api/salons/:salonId/welcome-offers
  - List offers

PUT /api/salons/:salonId/welcome-offers/:id
  - Update offer

GET /api/salons/:salonId/welcome-offers/:id/redemptions
  - List redemptions
```

### 7.4 Mobile App APIs

```
GET /api/mobile/check-imported-customer
  - Query: phone
  - Called during registration
  - Returns: { isImported, salonName, welcomeOffer }

POST /api/mobile/claim-welcome-offer
  - Body: { offerId }
  - Called after registration
  - Creates redemption record
```

---

## 8. Admin UI Components

### 8.1 Customer Import Page
- File upload dropzone (drag & drop)
- Column mapping interface
- Preview table with first 10 rows
- Import progress bar
- Error report download

### 8.2 Campaign Builder
- Template editor with variable insertion
- Channel selector (WhatsApp/SMS/Both)
- Welcome offer selector
- Target audience filter
- Schedule picker (now or later)
- Preview message button

### 8.3 Analytics Dashboard
- Conversion funnel visualization
- Time-series charts
- Campaign comparison table
- Export to Excel button

---

## 9. Security Considerations

### 9.1 Data Privacy
- Phone numbers encrypted at rest
- PII access logged
- GDPR-compliant deletion on request

### 9.2 Rate Limiting
- Import: 5 imports per hour per salon
- Campaign send: 1 campaign at a time per salon
- API calls: Standard rate limiting

### 9.3 Input Validation
- File type whitelist (csv, xlsx, xls only)
- File size limit enforced
- Phone/email format validation
- SQL injection prevention via parameterized queries

---

## 10. Implementation Phases

### Phase 1: Database & Core (Week 1)
- Create all database tables
- Phone normalization utility
- CSV parsing service

### Phase 2: Import System (Week 1)
- File upload endpoint
- Column mapping logic
- Duplicate detection
- Import preview & confirm flow

### Phase 3: Twilio Integration (Week 2)
- Twilio client setup
- Message sending service
- Webhook for delivery status
- Rate limiting queue

### Phase 4: Campaign System (Week 2)
- Campaign CRUD APIs
- Template variable substitution
- Batch sending logic
- Campaign status tracking

### Phase 5: Welcome Offers (Week 3)
- Offer CRUD APIs
- Registration hook for auto-matching
- Offer redemption flow
- Expiry handling

### Phase 6: Analytics & UI (Week 3)
- Analytics calculation queries
- Admin dashboard components
- Export functionality

---

## 11. Testing Checklist

### Import Tests
- [ ] Valid CSV imports correctly
- [ ] Invalid phone numbers are rejected
- [ ] Duplicates are skipped
- [ ] Large file (10k rows) processes correctly
- [ ] Excel files parse correctly

### Campaign Tests
- [ ] Messages send successfully
- [ ] Rate limiting works
- [ ] Delivery status updates correctly
- [ ] Failed messages retry
- [ ] Campaign pause/resume works

### Offer Tests
- [ ] Auto-matching on registration works
- [ ] Discount calculates correctly
- [ ] Expiry is enforced
- [ ] Usage limit is enforced
- [ ] Minimum purchase is enforced
