# **SalonHub Billing System - Technical Specification Document**

**Version:** 1.0  
**Date:** November 6, 2025  
**Status:** Design Proposal  
**Author:** SalonHub Development Team

---

## 📋 **Table of Contents**

1. [Executive Summary](#executive-summary)
2. [Business Requirements](#business-requirements)
3. [System Architecture](#system-architecture)
4. [GST Compliance Requirements](#gst-compliance-requirements)
5. [Database Schema Design](#database-schema-design)
6. [API Specification](#api-specification)
7. [User Interface Design](#user-interface-design)
8. [Integration Strategy](#integration-strategy)
9. [Security & Compliance](#security-compliance)
10. [Reports & Analytics](#reports-analytics)
11. [Technology Stack](#technology-stack)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Future Scalability](#future-scalability)
14. [Cost Analysis](#cost-analysis)
15. [Success Metrics](#success-metrics)
16. [Risk Analysis & Mitigation](#risk-analysis-mitigation)

---

## 1. Executive Summary

### 1.1 Overview
The SalonHub Billing System is a **modular, GST-compliant invoicing and payment solution** designed specifically for the Indian beauty and wellness industry. It will be developed as a **separate integrated module** that seamlessly connects with the existing SalonHub platform while maintaining independence for future expansion to other systems.

### 1.2 Key Objectives
- ✅ **Full GST Compliance** - Automatic tax calculations, HSN/SAC codes, GSTR filing support
- ✅ **Salon-Specific Features** - Service + product billing, staff tracking, commission management
- ✅ **Multi-System Integration** - API-first design allows integration with any platform
- ✅ **Mobile-First Experience** - 80%+ operations manageable from smartphones
- ✅ **Razorpay Integration** - Seamless payment processing with auto-reconciliation
- ✅ **Zero Learning Curve** - Intuitive UI consistent with SalonHub design system

### 1.3 Competitive Advantage
Unlike generic solutions (TallyPrime, Zoho Books), this system:
- **Understands salon workflows** - Booking-to-billing automation
- **Free for SalonHub users** - No additional subscription costs
- **Natively integrated** - Real-time data sync with appointments, services, staff
- **Future-proof architecture** - Can be licensed to other businesses

### 1.4 Market Research Findings

**Top Billing Platforms in India (2025):**
1. **TallyPrime** - Enterprise-grade, ₹18k+/year, desktop-focused
2. **Zoho Books** - Cloud-native, ₹2k+/month, general purpose
3. **ClearTax** - Bulk filing, pay-per-use, for tax professionals
4. **Marg ERP** - Industry-specific (pharma, retail), mid-range pricing
5. **ProfitBooks** - SME-focused, mobile-first, budget-friendly

**Gap in Market:**
- ❌ No salon-specific billing solution
- ❌ Generic platforms don't understand service + product combinations
- ❌ No native integration with booking systems
- ❌ Staff commission tracking missing

**Our Differentiator:**
- ✅ Built for beauty & wellness industry
- ✅ Booking-to-billing automation
- ✅ Staff commission management
- ✅ Free for SalonHub users
- ✅ Mobile-first (80% operations via phone)

---

## 2. Business Requirements

### 2.1 Functional Requirements

#### 2.1.1 Invoice Management
- Generate GST-compliant invoices for services and products
- Support mixed invoices (services + products on same bill)
- Sequential invoice numbering with financial year reset
- Draft invoices for later completion
- Invoice templates (thermal, A4, digital)
- Bulk invoice generation for multiple customers
- Invoice cancellation with proper audit trail

#### 2.1.2 GST Tax Engine
- Automatic tax calculation based on item type:
  - **5% GST** for salon services (haircut, facial, spa, massage, etc.)
  - **18% GST** for beauty products (shampoo, makeup, styling tools)
  - **12% GST** for Ayurvedic/herbal medicinal products
- CGST/SGST for intra-state transactions
- IGST for inter-state transactions
- HSN/SAC code auto-assignment
- Tax rate updates via configuration (no code changes needed)

#### 2.1.3 Payment Processing
- **Razorpay integration** for online payments
- Support for Cash, UPI, Cards, Net Banking, Wallets
- Payment link generation and sharing
- Partial payment support
- Payment reminders for outstanding invoices
- Auto-reconciliation of payments with invoices
- Refund processing with GST adjustment

#### 2.1.4 Customer Management
- B2C customers (name, phone, email)
- B2B customers with GSTIN for tax invoices
- Purchase history tracking
- Outstanding balance management
- Customer loyalty points integration
- Customer segmentation for targeted offers

#### 2.1.5 Product Catalog
- Product inventory management
- Stock tracking with low-stock alerts
- Category-based organization
- HSN code mapping
- GST rate assignment
- Bulk product import/export
- Product images and descriptions

#### 2.1.6 GST Compliance & Returns
- **GSTR-1** auto-generation (outward supplies)
- **GSTR-3B** summary preparation
- **GSTR-9** annual return support
- Export data in GST Portal compatible format
- Filing deadline reminders
- Input Tax Credit (ITC) tracking
- GST reconciliation reports

#### 2.1.7 Reports & Analytics
- Sales reports (daily, weekly, monthly, yearly)
- GST summary reports
- Tax liability reports
- Customer purchase reports
- Product sales analysis
- Payment method breakdown
- Outstanding receivables report
- Profit & loss statements

### 2.2 Non-Functional Requirements

#### 2.2.1 Performance
- Invoice generation: < 2 seconds
- API response time: < 500ms (95th percentile)
- Support 1000+ concurrent users
- Handle 10,000+ invoices per day per salon

#### 2.2.2 Availability
- 99.5% uptime SLA
- Scheduled maintenance windows (non-business hours)
- Automated backups every 6 hours
- Disaster recovery plan with < 1 hour RTO

#### 2.2.3 Scalability
- Horizontal scaling for API servers
- Database connection pooling
- Caching for frequent queries
- CDN for static assets (invoice PDFs)

#### 2.2.4 Security
- HTTPS/TLS encryption for all communications
- API key authentication for integrations
- Role-based access control (RBAC)
- Payment gateway PCI-DSS compliance
- Data encryption at rest
- Audit logging for all transactions
- GDPR compliance for customer data

---

## 3. System Architecture

### 3.1 High-Level Architecture

**Phase 1 Architecture (Weeks 1-6): Monolithic with Modular Design** ⭐ **RECOMMENDED FOR INITIAL IMPLEMENTATION**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                          │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │  SalonHub    │  │   Mobile     │                           │
│  │   Web App    │  │    Browser   │                           │
│  └──────────────┘  └──────────────┘                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              BILLING MODULE (Express.js Backend)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes (Modular)                                     │  │
│  │  • /api/v1/billing/invoices (Invoice Controller)         │  │
│  │  • /api/v1/billing/payments (Payment Controller)         │  │
│  │  • /api/v1/billing/products (Product Controller)         │  │
│  │  • /api/v1/billing/gst (GST Controller)                  │  │
│  │  • /api/v1/billing/reports (Reports Controller)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Business Logic Layer (Services)                          │  │
│  │  • invoiceService.ts                                      │  │
│  │  • paymentService.ts                                      │  │
│  │  • gstCalculationService.ts                              │  │
│  │  • pdfGenerationService.ts                               │  │
│  │  • notificationService.ts                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────────────┐                   │
│  │  PostgreSQL  │  │    File Storage      │                   │
│  │  (Neon DB)   │  │   (Cloudinary)       │                   │
│  │ billing.*    │  │   (Invoice PDFs)     │                   │
│  └──────────────┘  └──────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Razorpay    │  │   Twilio     │  │     SendGrid         │ │
│  │   Payment    │  │     SMS      │  │      Email           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Why Monolithic First:**
- ✅ Faster development (12-16 week timeline achievable)
- ✅ Simpler deployment and testing
- ✅ Lower infrastructure costs
- ✅ Easier debugging and maintenance
- ✅ Can refactor to microservices later if needed

**Phase 2 Architecture (Future): Microservices** (If/when scaling to 100+ salons or standalone product)

```
[Full microservices architecture as originally described]
```

**Architecture Decision:** Start with **modular monolith**, evolve to microservices only when traffic/business demands it.

### 3.2 Deployment Architecture

**Option A: Shared Database with Separate Schema** (Recommended)
```sql
-- Existing SalonHub: public schema
-- Billing System: billing schema

Database: neondb (shared)
├── public (SalonHub core tables)
│   ├── users
│   ├── salons
│   ├── services
│   ├── bookings
│   └── ...
└── billing (Billing system tables)
    ├── invoices
    ├── invoice_items
    ├── payments
    ├── gst_returns
    └── ...
```

**Benefits:**
- Single database connection
- Real-time data consistency
- No API latency for data access
- Simplified deployment and maintenance
- Cost-effective (one database instance)

**Option B: Separate Database** (Future Consideration)
- Complete isolation
- Independent scaling
- Can be sold as standalone product
- More complex deployment
- Higher infrastructure costs

**Recommendation:** Start with Option A (shared database), migrate to Option B if/when billing system is licensed to external platforms.

### 3.3 Module Communication

```javascript
// Event-Driven Communication Pattern
SalonHub → Billing System:
  - booking.completed → generate_invoice
  - service.created → sync_product_catalog
  - customer.updated → update_customer_record

Billing System → SalonHub:
  - invoice.paid → update_booking_payment_status
  - payment.failed → notify_payment_failure
  - gst.filed → update_compliance_status
```

---

## 4. GST Compliance Requirements

### 4.1 Current GST Rates (Nov 2025)

| Category | Items | GST Rate | ITC Available |
|----------|-------|----------|---------------|
| **Salon Services** | Haircut, Styling, Facial, Massage, Spa, Waxing, Threading, Manicure, Pedicure, Makeup | **5%** | ❌ No |
| **Beauty Products** | Shampoo, Conditioner, Hair Oil, Makeup, Skincare, Perfume, Styling Products | **18%** | ✅ Yes |
| **Equipment** | Hair Dryers, Straighteners, Trimmers, Chairs, Mirrors | **18%** | ✅ Yes |
| **Ayurvedic Products** | Herbal/Medicinal Beauty Products | **12%** | ✅ Yes |

**IMPORTANT:** GST rate for salon/beauty/wellness services was **reduced from 18% to 5%** effective **September 22, 2025** as per GST Council notification.

**Authoritative Sources:**
- GST Council 54th Meeting Decision (September 2025)
- References: dingg.app/blogs, invoay.com/Blog, blog.miosalon.com (industry publications)
- No Input Tax Credit (ITC) available at 5% rate
- Products sold in salons continue to attract 18% GST with ITC eligibility

**Note:** This is a recent change. If implementing before September 2025 or if regulations change, consult a Chartered Accountant for current rates.

### 4.2 Tax Calculation Logic

```javascript
// Pseudo-code for tax calculation
function calculateGST(item) {
  const rate = getGSTRate(item.type, item.category);
  const taxableAmount = item.quantity * item.unitPrice;
  
  if (item.type === 'service') {
    // Services: 5% (no ITC)
    gstAmount = taxableAmount * 0.05;
  } else if (item.category === 'ayurvedic') {
    // Ayurvedic products: 12%
    gstAmount = taxableAmount * 0.12;
  } else {
    // Beauty products & equipment: 18%
    gstAmount = taxableAmount * 0.18;
  }
  
  // Check if intra-state or inter-state
  if (customerState === salonState) {
    // Intra-state: CGST + SGST
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
    igst = 0;
  } else {
    // Inter-state: IGST
    cgst = 0;
    sgst = 0;
    igst = gstAmount;
  }
  
  return {
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalGST: gstAmount,
    totalAmount: taxableAmount + gstAmount
  };
}
```

### 4.3 HSN/SAC Codes

**Services:**
- **999713** - Beauty treatment services
- **999714** - Hairdressing and barber services
- **999715** - Massage and spa services

**Products:**
- **3305** - Hair care preparations
- **3304** - Beauty/makeup preparations
- **8516** - Hair dryers, straighteners
- **9403** - Salon furniture

### 4.4 Invoice Mandatory Fields

As per GST regulations, every tax invoice must include:

1. ✅ Invoice Number (sequential, unique per financial year)
2. ✅ Invoice Date
3. ✅ Customer Name
4. ✅ Customer GSTIN (for B2B, if registered)
5. ✅ Customer Address
6. ✅ Place of Supply (state code)
7. ✅ Supplier Name (Salon Name)
8. ✅ Supplier GSTIN
9. ✅ Supplier Address
10. ✅ Description of Goods/Services
11. ✅ HSN/SAC Code
12. ✅ Quantity
13. ✅ Unit Price
14. ✅ Taxable Value
15. ✅ GST Rate
16. ✅ CGST Amount / SGST Amount OR IGST Amount
17. ✅ Total Invoice Value
18. ✅ Signature/Digital Signature

### 4.5 GST Return Filing

**Monthly Filing (Turnover > ₹5 crore):**
- **GSTR-1** (Outward Supplies) - Due: 11th of next month
- **GSTR-3B** (Summary Return) - Due: 20th of next month

**Quarterly Filing (Turnover ₹1.5 crore - ₹5 crore):**
- **GSTR-1** - Quarterly
- **GSTR-3B** - Monthly (small tax payers)

**Annual Filing:**
- **GSTR-9** (Annual Return) - Due: December 31st of next year
- **GSTR-9C** (Reconciliation Statement) - If turnover > ₹5 crore

### 4.6 Input Tax Credit (ITC) Tracking

**ITC Eligible Items:**
- Salon equipment purchases (chairs, mirrors, tools)
- Beauty products for retail sale
- Commercial rent (if landlord is GST registered)
- Utilities (electricity, water) with GST
- Professional services (CA, lawyer fees)

**ITC Not Available:**
- Service-related inputs (post Sept 2025, 5% rate)
- Food and beverages
- Personal use items
- Motor vehicles (unless for commercial transport)

**ITC Reconciliation:**
- Match purchase invoices with GSTR-2A/2B
- Claim only valid, eligible ITC
- Reverse ineligible ITC if claimed incorrectly

---

## 5. Database Schema Design

### 5.1 Schema Overview

```
billing schema:
├── invoices (master invoice table)
├── invoice_items (line items - services/products)
├── payments (payment records)
├── gst_returns (GSTR filing records)
├── product_catalog (salon product inventory)
├── tax_rates (configurable GST rates)
└── audit_logs (change tracking)
```

### 5.2 Detailed Schema Definition

```typescript
// billing.invoices
export const invoices = pgTable('invoices', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  financialYear: varchar('financial_year', { length: 10 }).notNull(), // '2024-25'
  
  // Relations
  salonId: varchar('salon_id', { length: 36 }).references(() => salons.id).notNull(),
  customerId: varchar('customer_id', { length: 36 }).references(() => users.id),
  bookingId: varchar('booking_id', { length: 36 }).references(() => bookings.id),
  
  // Customer Details (for non-registered customers)
  customerName: varchar('customer_name', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerGstin: varchar('customer_gstin', { length: 15 }), // For B2B customers
  customerAddress: text('customer_address'),
  customerState: varchar('customer_state', { length: 50 }),
  customerStateCode: varchar('customer_state_code', { length: 2 }), // '07' for Delhi
  
  // Invoice Details
  invoiceDate: timestamp('invoice_date').notNull().defaultNow(),
  dueDate: timestamp('due_date'),
  placeOfSupply: varchar('place_of_supply', { length: 50 }).notNull(),
  
  // Amounts
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(), // Before tax
  cgstAmount: decimal('cgst_amount', { precision: 10, scale: 2 }).default('0.00'),
  sgstAmount: decimal('sgst_amount', { precision: 10, scale: 2 }).default('0.00'),
  igstAmount: decimal('igst_amount', { precision: 10, scale: 2 }).default('0.00'),
  totalGst: decimal('total_gst', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(), // After tax
  
  // Discounts
  discountType: varchar('discount_type', { length: 20 }), // 'percentage' | 'fixed'
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }),
  
  // Payment
  paymentStatus: varchar('payment_status', { length: 20 }).default('unpaid'), // unpaid | partial | paid
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0.00'),
  balanceAmount: decimal('balance_amount', { precision: 10, scale: 2 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'), // draft | sent | paid | cancelled
  isCancelled: boolean('is_cancelled').default(false),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: timestamp('cancelled_at'),
  
  // Metadata
  notes: text('notes'),
  termsAndConditions: text('terms_and_conditions'),
  pdfUrl: varchar('pdf_url', { length: 500 }), // S3/Cloudinary URL
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  salonIdIdx: index('idx_invoices_salon_id').on(table.salonId),
  customerIdIdx: index('idx_invoices_customer_id').on(table.customerId),
  invoiceNumberIdx: index('idx_invoices_invoice_number').on(table.invoiceNumber),
  invoiceDateIdx: index('idx_invoices_invoice_date').on(table.invoiceDate),
  paymentStatusIdx: index('idx_invoices_payment_status').on(table.paymentStatus),
}));

// billing.invoice_items
export const invoiceItems = pgTable('invoice_items', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar('invoice_id', { length: 36 }).references(() => invoices.id).notNull(),
  
  // Item Details
  itemType: varchar('item_type', { length: 20 }).notNull(), // 'service' | 'product'
  serviceId: varchar('service_id', { length: 36 }).references(() => services.id),
  productId: varchar('product_id', { length: 36 }).references(() => productCatalog.id),
  
  description: varchar('description', { length: 500 }).notNull(),
  hsnSacCode: varchar('hsn_sac_code', { length: 10 }).notNull(),
  
  // Pricing
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1.00'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  taxableAmount: decimal('taxable_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Tax
  gstRate: decimal('gst_rate', { precision: 5, scale: 2 }).notNull(), // 5.00, 12.00, 18.00
  cgstRate: decimal('cgst_rate', { precision: 5, scale: 2 }),
  sgstRate: decimal('sgst_rate', { precision: 5, scale: 2 }),
  igstRate: decimal('igst_rate', { precision: 5, scale: 2 }),
  
  cgstAmount: decimal('cgst_amount', { precision: 10, scale: 2 }).default('0.00'),
  sgstAmount: decimal('sgst_amount', { precision: 10, scale: 2 }).default('0.00'),
  igstAmount: decimal('igst_amount', { precision: 10, scale: 2 }).default('0.00'),
  totalGst: decimal('total_gst', { precision: 10, scale: 2 }).notNull(),
  
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Staff (for commission tracking)
  staffId: varchar('staff_id', { length: 36 }).references(() => staff.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  invoiceIdIdx: index('idx_invoice_items_invoice_id').on(table.invoiceId),
}));

// billing.payments
export const payments = pgTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar('invoice_id', { length: 36 }).references(() => invoices.id).notNull(),
  
  // Payment Details
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // cash | upi | card | netbanking | wallet
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date').notNull().defaultNow(),
  
  // Razorpay Integration
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
  razorpayOrderId: varchar('razorpay_order_id', { length: 100 }),
  razorpaySignature: varchar('razorpay_signature', { length: 255 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending | success | failed | refunded
  failureReason: text('failure_reason'),
  
  // Refund
  isRefund: boolean('is_refund').default(false),
  refundedAmount: decimal('refunded_amount', { precision: 10, scale: 2 }),
  refundReason: text('refund_reason'),
  refundedAt: timestamp('refunded_at'),
  
  // Metadata
  transactionReference: varchar('transaction_reference', { length: 255 }),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  invoiceIdIdx: index('idx_payments_invoice_id').on(table.invoiceId),
  razorpayPaymentIdIdx: index('idx_payments_razorpay_payment_id').on(table.razorpayPaymentId),
}));

// billing.product_catalog
export const productCatalog = pgTable('product_catalog', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar('salon_id', { length: 36 }).references(() => salons.id).notNull(),
  
  // Product Details
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // shampoo | conditioner | makeup | tools
  brand: varchar('brand', { length: 100 }),
  imageUrl: varchar('image_url', { length: 500 }),
  
  // Tax & Pricing
  hsnCode: varchar('hsn_code', { length: 10 }).notNull(),
  gstRate: decimal('gst_rate', { precision: 5, scale: 2 }).notNull(),
  
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  mrp: decimal('mrp', { precision: 10, scale: 2 }),
  
  // Inventory
  stockQuantity: integer('stock_quantity').default(0),
  minStockLevel: integer('min_stock_level').default(5),
  unit: varchar('unit', { length: 20 }).default('piece'), // piece | ml | gm | kg
  
  // Status
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  salonIdIdx: index('idx_product_catalog_salon_id').on(table.salonId),
  categoryIdx: index('idx_product_catalog_category').on(table.category),
}));

// billing.gst_returns
export const gstReturns = pgTable('gst_returns', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar('salon_id', { length: 36 }).references(() => salons.id).notNull(),
  
  // Return Details
  returnType: varchar('return_type', { length: 20 }).notNull(), // GSTR1 | GSTR3B | GSTR9
  periodMonth: integer('period_month').notNull(), // 1-12
  periodYear: integer('period_year').notNull(), // 2025
  financialYear: varchar('financial_year', { length: 10 }).notNull(), // '2024-25'
  
  // Summary Amounts
  totalInvoices: integer('total_invoices').default(0),
  totalSales: decimal('total_sales', { precision: 12, scale: 2 }).default('0.00'),
  totalTaxableValue: decimal('total_taxable_value', { precision: 12, scale: 2 }).default('0.00'),
  totalCgst: decimal('total_cgst', { precision: 12, scale: 2 }).default('0.00'),
  totalSgst: decimal('total_sgst', { precision: 12, scale: 2 }).default('0.00'),
  totalIgst: decimal('total_igst', { precision: 12, scale: 2 }).default('0.00'),
  totalGst: decimal('total_gst', { precision: 12, scale: 2 }).default('0.00'),
  
  // ITC
  totalItcClaimed: decimal('total_itc_claimed', { precision: 12, scale: 2 }).default('0.00'),
  
  // Net Tax Payable
  netTaxPayable: decimal('net_tax_payable', { precision: 12, scale: 2 }).default('0.00'),
  
  // Filing Status
  status: varchar('status', { length: 20 }).default('draft'), // draft | filed | acknowledged
  filedDate: timestamp('filed_date'),
  acknowledgmentNumber: varchar('acknowledgment_number', { length: 50 }),
  
  // Export Data
  jsonData: jsonb('json_data'), // Complete GSTR JSON
  pdfUrl: varchar('pdf_url', { length: 500 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  salonIdIdx: index('idx_gst_returns_salon_id').on(table.salonId),
  periodIdx: index('idx_gst_returns_period').on(table.periodYear, table.periodMonth),
}));

// billing.tax_rates (Configuration table)
export const taxRates = pgTable('tax_rates', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  
  itemType: varchar('item_type', { length: 50 }).notNull(), // service | product
  category: varchar('category', { length: 100 }), // haircare | makeup | ayurvedic | equipment
  hsnSacCode: varchar('hsn_sac_code', { length: 10 }),
  
  gstRate: decimal('gst_rate', { precision: 5, scale: 2 }).notNull(),
  
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// billing.audit_logs
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  
  entityType: varchar('entity_type', { length: 50 }).notNull(), // invoice | payment | product
  entityId: varchar('entity_id', { length: 36 }).notNull(),
  
  action: varchar('action', { length: 50 }).notNull(), // created | updated | deleted | cancelled
  changedBy: varchar('changed_by', { length: 36 }).references(() => users.id).notNull(),
  
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  entityIdx: index('idx_audit_logs_entity').on(table.entityType, table.entityId),
  changedByIdx: index('idx_audit_logs_changed_by').on(table.changedBy),
}));
```

### 5.3 Schema Migration Strategy

**Drizzle ORM Setup:**
```bash
# Schema location
db/billing-schema.ts

# Migration commands
npm run db:push         # Sync schema to database
npm run db:studio       # Visual database editor
```

**Important Notes:**
- Use `billing` schema to keep separate from SalonHub core tables
- All foreign keys reference `public.salons`, `public.users`, etc.
- Invoice numbers reset per financial year
- Soft delete pattern for invoices (is_cancelled flag)

---

## 6. API Specification

### 6.1 Base URL & Authentication

```
Base URL: https://api.salonhub.com/v1/billing
Authentication: Session-based (shared with SalonHub)
Content-Type: application/json
```

**Authentication Details:**
- Uses existing SalonHub session authentication
- Session cookie: `connect.sid`
- User must be logged in as salon owner/manager
- RBAC: Owner (full access), Manager (create invoices, view reports), Staff (view own commissions)

**Request Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Cookie": "connect.sid=<session-cookie>"
}
```

**Error Responses:**
```typescript
// 401 Unauthorized
{
  "success": false,
  "error": "Unauthorized",
  "message": "Please log in to access this resource"
}

// 403 Forbidden
{
  "success": false,
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}

// 400 Bad Request
{
  "success": false,
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": [
    {
      "field": "items",
      "message": "At least one item is required"
    }
  ]
}

// 500 Internal Server Error
{
  "success": false,
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

### 6.2 Invoice Endpoints

#### 6.2.1 Create Invoice
```typescript
POST /api/v1/billing/invoices
Request Body:
{
  "salonId": "uuid",
  "customerId": "uuid", // optional
  "customerDetails": {
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "gstin": "07AABCU9603R1ZX", // optional for B2B
    "address": "123 Main St, Sector 10",
    "state": "Delhi",
    "stateCode": "07"
  },
  "bookingId": "uuid", // optional, if generated from booking
  "items": [
    {
      "itemType": "service",
      "serviceId": "uuid",
      "description": "Haircut - Men",
      "quantity": 1,
      "unitPrice": 500,
      "staffId": "uuid" // optional
    },
    {
      "itemType": "product",
      "productId": "uuid",
      "description": "Hair Gel - 100ml",
      "quantity": 2,
      "unitPrice": 250
    }
  ],
  "discount": {
    "type": "percentage", // or "fixed"
    "value": 10
  },
  "notes": "Thank you for visiting!",
  "dueDate": "2025-11-15"
}

Response:
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "INV-2425-00001",
    "invoiceDate": "2025-11-06",
    "subtotal": 1000,
    "cgst": 27.50,
    "sgst": 27.50,
    "igst": 0,
    "totalGst": 55,
    "totalAmount": 955, // after 10% discount
    "pdfUrl": "https://cdn.salonhub.com/invoices/INV-2425-00001.pdf"
  }
}
```

#### 6.2.2 Get Invoice by ID
```typescript
GET /api/v1/billing/invoices/:id

Response:
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "INV-2425-00001",
    "invoiceDate": "2025-11-06",
    "customer": { /* customer details */ },
    "items": [ /* invoice items */ ],
    "subtotal": 1000,
    "totalAmount": 955,
    "paymentStatus": "paid",
    "pdfUrl": "https://..."
  }
}
```

#### 6.2.3 List Invoices
```typescript
GET /api/v1/billing/invoices?salonId=uuid&status=paid&page=1&limit=20

Response:
{
  "success": true,
  "invoices": [ /* array of invoices */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

#### 6.2.4 Update Invoice Status
```typescript
PATCH /api/v1/billing/invoices/:id/status
Request Body:
{
  "status": "sent" // draft | sent | paid | cancelled
}
```

#### 6.2.5 Cancel Invoice
```typescript
POST /api/v1/billing/invoices/:id/cancel
Request Body:
{
  "reason": "Customer requested cancellation"
}
```

#### 6.2.6 Send Invoice
```typescript
POST /api/v1/billing/invoices/:id/send
Request Body:
{
  "method": "whatsapp", // whatsapp | email | sms
  "recipient": "+919876543210" // or email
}
```

### 6.3 Payment Endpoints

#### 6.3.1 Record Payment
```typescript
POST /api/v1/billing/payments
Request Body:
{
  "invoiceId": "uuid",
  "amount": 955,
  "paymentMethod": "upi", // cash | upi | card | netbanking | wallet
  "paymentDate": "2025-11-06",
  "razorpayPaymentId": "pay_xxx", // if online payment
  "transactionReference": "UPI Ref: 123456789",
  "notes": "Paid via Google Pay"
}

Response:
{
  "success": true,
  "payment": {
    "id": "uuid",
    "invoiceId": "uuid",
    "amount": 955,
    "status": "success",
    "paymentDate": "2025-11-06"
  },
  "invoice": {
    "paymentStatus": "paid",
    "paidAmount": 955,
    "balanceAmount": 0
  }
}
```

#### 6.3.2 Create Payment Link (Razorpay)
```typescript
POST /api/v1/billing/payments/create-link
Request Body:
{
  "invoiceId": "uuid"
}

Response:
{
  "success": true,
  "paymentLink": "https://rzp.io/i/abc123",
  "shortUrl": "https://rzp.io/l/xyz",
  "expiresAt": "2025-11-13"
}
```

### 6.4 Product Catalog Endpoints

```typescript
// Create Product
POST /api/v1/billing/products

// Update Stock
PATCH /api/v1/billing/products/:id/stock

// Get Low Stock Products
GET /api/v1/billing/products/low-stock?salonId=uuid

// List Products
GET /api/v1/billing/products?salonId=uuid&category=shampoo
```

### 6.5 GST Report Endpoints

```typescript
// Generate GSTR-1
POST /api/v1/billing/gst/gstr1
Request Body:
{
  "salonId": "uuid",
  "month": 10,
  "year": 2025
}

// Get GST Summary
GET /api/v1/billing/gst/summary?salonId=uuid&startDate=2025-10-01&endDate=2025-10-31

// Get ITC Report
GET /api/v1/billing/gst/itc?salonId=uuid&month=10&year=2025
```

### 6.6 Webhook Events

```typescript
// Billing system will emit webhooks for these events:
invoice.created
invoice.updated
invoice.paid
invoice.cancelled
payment.success
payment.failed
payment.refunded
product.low_stock
gst_return.filed

// Webhook Payload Example:
{
  "event": "invoice.paid",
  "timestamp": "2025-11-06T10:30:00Z",
  "data": {
    "invoiceId": "uuid",
    "invoiceNumber": "INV-2425-00001",
    "salonId": "uuid",
    "amount": 955,
    "paymentMethod": "upi"
  }
}
```

---

## 7. User Interface Design

### 7.1 Navigation Structure

```
Business Dashboard (SalonHub)
└── Billing & Invoices (New Section)
    ├── Dashboard (Overview & Quick Stats)
    ├── Invoices
    │   ├── All Invoices (List View)
    │   ├── Create Invoice
    │   ├── Drafts
    │   └── Cancelled
    ├── Payments
    │   ├── Payment History
    │   └── Outstanding
    ├── Products
    │   ├── Product Catalog
    │   ├── Add Product
    │   └── Low Stock Alerts
    ├── GST & Compliance
    │   ├── GST Summary
    │   ├── GSTR-1 Generation
    │   ├── GSTR-3B Generation
    │   └── ITC Report
    └── Reports
        ├── Sales Report
        ├── Tax Report
        ├── Customer Report
        └── Payment Methods
```

### 7.2 Key Screens Mockups

#### 7.2.1 Billing Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  Billing Dashboard - October 2025                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Total    │  │ Invoices │  │ GST      │  │ Pending  ││
│  │ Sales    │  │ Generated│  │ Collected│  │ Payments ││
│  │ ₹1,25,000│  │   145    │  │  ₹7,500  │  │  ₹15,000 ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                          │
│  Recent Invoices                    [+ Create Invoice]  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ INV-00145  John Doe     ₹955   Paid    06 Nov    │  │
│  │ INV-00144  Jane Smith   ₹1,200 Pending 05 Nov    │  │
│  │ INV-00143  Bob Johnson  ₹750   Paid    05 Nov    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Sales Trend (Last 30 Days)        Payment Methods      │
│  ┌────────────────────┐            ┌─────────────────┐  │
│  │  [Line Chart]      │            │ UPI:    45%     │  │
│  │                    │            │ Cash:   30%     │  │
│  │                    │            │ Card:   20%     │  │
│  │                    │            │ Others:  5%     │  │
│  └────────────────────┘            └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 7.2.2 Create Invoice Screen
```
┌─────────────────────────────────────────────────────────┐
│  Create New Invoice                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Customer Details                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Search Customer: [_________________] [+ Add New]│   │
│  │                                                  │   │
│  │ Name:     John Doe                              │   │
│  │ Phone:    +91 98765 43210                       │   │
│  │ GSTIN:    [Optional for B2B]                    │   │
│  │ Address:  [Auto-filled or manual]               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Invoice Items                     [+ Add Service/Product]│
│  ┌─────────────────────────────────────────────────┐   │
│  │ Item          Qty  Price   GST%   Amount        │   │
│  │ Haircut - Men  1   ₹500    5%     ₹525    [×]  │   │
│  │ Hair Gel 100ml 2   ₹250    18%    ₹590    [×]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Discount                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Type: [Percentage ▼]  Value: [10] %             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Invoice Summary                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Subtotal:             ₹1,000.00                 │   │
│  │ Discount (10%):       -₹100.00                  │   │
│  │ Taxable Amount:       ₹900.00                   │   │
│  │ CGST:                 ₹27.50                    │   │
│  │ SGST:                 ₹27.50                    │   │
│  │ ────────────────────────────────                │   │
│  │ Total Amount:         ₹955.00                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [Save as Draft]  [Preview]  [Generate & Send Invoice]  │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Mobile-First Design Principles

**Key Features:**
- ✅ **Touch-friendly:** 48px+ tap targets
- ✅ **Scrollable tabs:** Horizontal navigation for categories
- ✅ **Fixed bottom actions:** "Create Invoice", "Record Payment" always visible
- ✅ **Quick actions:** Swipe to send invoice, mark as paid
- ✅ **Voice input:** For customer phone numbers
- ✅ **Camera:** Scan products barcode (future)
- ✅ **Offline mode:** Save drafts locally, sync when online

---

## 8. Integration Strategy

### 8.1 SalonHub Integration Points

```typescript
// 1. Booking Completion → Auto-generate Invoice
// When booking is marked complete
SalonHub Event: booking.completed
↓
Billing Action: Create draft invoice with services from booking
↓
Notification: "Invoice ready for Customer XYZ - ₹955"

// 2. Service Catalog Sync
// When new service is created in SalonHub
SalonHub Event: service.created
↓
Billing Action: Add service to billable items catalog with HSN code

// 3. Customer Data Sync
// Real-time customer data sharing
Shared Table: users (in public schema)
Billing reads: name, phone, email for invoice generation

// 4. Staff Commission Tracking
// Link invoice items to staff who performed service
Invoice Item → Staff ID → Calculate commission
Report: Staff earnings by period

// 5. Payment Status Update
// When payment recorded in billing system
Billing Event: payment.success
↓
SalonHub Action: Update booking payment_status = 'paid'
```

### 8.2 External Integration Points

```typescript
// 1. Razorpay Payment Gateway
Purpose: Online payment processing
Integration:
- Create Razorpay order on invoice generation
- Payment link sharing via WhatsApp/Email
- Webhook for payment confirmation
- Automatic reconciliation with invoice

// 2. Twilio (SMS)
Purpose: SMS invoice delivery
Integration:
- Send invoice summary via SMS
- Payment reminder SMS for overdue invoices
- OTP for payment confirmation (optional)

// 3. SendGrid (Email)
Purpose: Email invoice delivery
Integration:
- Professional invoice email templates
- PDF invoice attachment
- Payment link in email
- Receipt email on payment

// 4. WhatsApp Business API
Purpose: Invoice delivery via WhatsApp
Integration:
- Send invoice PDF via WhatsApp
- Payment link sharing
- Payment confirmation messages
- GST filing reminders
```

---

## 9. Security & Compliance

### 9.1 Data Security

**Encryption:**
- ✅ **In Transit:** TLS 1.3 for all API communications
- ✅ **At Rest:** AES-256 encryption for database
- ✅ **Backups:** Encrypted backups with separate encryption keys

**Access Control:**
- ✅ **Role-Based Access Control (RBAC):**
  - Owner: Full access to billing module
  - Manager: View reports, create invoices
  - Staff: View own commission reports only
- ✅ **IP Whitelisting:** For API access (optional)
- ✅ **2FA:** For sensitive operations (refunds, cancellations)

**Audit Logging:**
- ✅ All invoice creation/modification logged
- ✅ Payment transactions logged
- ✅ GST return filing logged
- ✅ Logs retained for 7 years (GST compliance)

### 9.2 Compliance Requirements

**GST Compliance:**
- ✅ Invoices stored for **6 years** minimum
- ✅ Sequential invoice numbering
- ✅ No invoice deletion (only cancellation with reason)
- ✅ All mandatory fields as per GST Act
- ✅ Digital signature for e-invoices (if applicable)

**Data Privacy (GDPR/DPDPA):**
- ✅ Customer consent for data storage
- ✅ Right to data deletion (with GST exemption)
- ✅ Data portability (export customer data)
- ✅ Privacy policy acceptance

---

## 10. Reports & Analytics

### 10.1 Standard Reports

#### Sales Reports
- Daily Sales Summary
- Weekly Sales Trend
- Monthly Revenue Report
- Service vs Product Sales Breakdown
- Staff-wise Sales Performance

#### GST Reports
- GST Summary Report (CGST, SGST, IGST breakup)
- GSTR-1 Data (Outward supplies)
- GSTR-3B Summary
- ITC Claimed Report
- Tax Liability Statement

#### Customer Reports
- Top 10 Customers by Revenue
- Customer Purchase Frequency
- Outstanding Balance Report
- New vs Repeat Customers

#### Payment Reports
- Payment Method Distribution
- Cash vs Online Payment Ratio
- Payment Collection Efficiency
- Overdue Invoices Report

---

## 11. Technology Stack

### 11.1 Frontend
```json
{
  "framework": "React 18 + TypeScript",
  "routing": "Wouter (consistent with SalonHub)",
  "state_management": "TanStack Query",
  "ui_library": "Radix UI + Tailwind CSS",
  "forms": "React Hook Form + Zod",
  "charts": "Recharts",
  "pdf_generation": "React-PDF or Puppeteer",
  "icons": "Lucide React",
  "date_handling": "date-fns"
}
```

### 11.2 Backend
```json
{
  "runtime": "Node.js 20+",
  "framework": "Express.js",
  "language": "TypeScript",
  "orm": "Drizzle ORM",
  "database": "PostgreSQL (Neon)",
  "cache": "Redis (optional for performance)",
  "validation": "Zod",
  "pdf_generation": "PDFKit or Puppeteer"
}
```

### 11.3 Third-Party Services
```json
{
  "payment_gateway": "Razorpay",
  "sms": "Twilio",
  "email": "SendGrid or Nodemailer",
  "whatsapp": "WhatsApp Business API (via Twilio)",
  "file_storage": "Cloudinary or S3 (invoice PDFs)"
}
```

---

## 12. Implementation Roadmap

### Phase 1: Core Billing (4-6 weeks)

**Week 1-2: Foundation**
- ✅ Database schema creation (billing schema)
- ✅ Basic API structure setup
- ✅ Invoice generation endpoint
- ✅ GST calculation engine
- ✅ Invoice PDF generation

**Week 3-4: Payment & Integration**
- ✅ Razorpay integration
- ✅ Payment recording & reconciliation
- ✅ SalonHub booking integration
- ✅ Customer data sync
- ✅ Basic UI (create invoice, list invoices)

**Week 5-6: Testing & Launch**
- ✅ End-to-end testing with sample salons
- ✅ GST compliance validation
- ✅ Mobile responsiveness
- ✅ Documentation
- ✅ Beta launch with 5 salons

### Phase 2: GST Compliance & Reports (3-4 weeks)

**Week 7-8: GST Features**
- ✅ GSTR-1 generation
- ✅ GSTR-3B summary
- ✅ ITC tracking
- ✅ Tax rate configuration table
- ✅ Audit logging

**Week 9-10: Reports & Analytics**
- ✅ Sales reports
- ✅ GST summary reports
- ✅ Customer reports
- ✅ Dashboard analytics
- ✅ Export to Excel/PDF

### Phase 3: Product Catalog & Inventory (2-3 weeks)

**Week 11-12: Product Management**
- ✅ Product catalog CRUD
- ✅ Stock management
- ✅ Low stock alerts
- ✅ Barcode scanning (mobile)
- ✅ Product-wise reports

### Phase 4: Advanced Features (3-4 weeks)

**Week 13-14: Automation**
- ✅ Automated invoice generation from bookings
- ✅ Payment reminders (SMS/Email/WhatsApp)
- ✅ Recurring invoices (for packages)
- ✅ Staff commission calculation

**Week 15-16: Multi-channel Communication**
- ✅ WhatsApp invoice delivery
- ✅ Email templates
- ✅ SMS notifications
- ✅ Payment link sharing

**Total Timeline:** 12-16 weeks for full-featured system

---

## 13. Future Scalability

### 13.1 Multi-Tenant Architecture

```typescript
// Current: Billing tied to SalonHub
// Future: Standalone SaaS offering

// Database structure
tenant_organizations (master tenant table)
├── organization_id
├── subdomain (e.g., salon1.billing.salonhub.com)
├── plan (free | pro | enterprise)
└── settings (JSON)

billing.invoices
├── organization_id (tenant isolation)
├── ...other fields
```

### 13.2 Licensing Model

**Option A: Free for SalonHub Users**
- Included in SalonHub subscription
- No separate billing

**Option B: Standalone SaaS**
- **Free Plan:** Up to 100 invoices/month
- **Pro Plan:** ₹999/month - Unlimited invoices
- **Enterprise Plan:** ₹2,999/month - Multi-location + API access

**Option C: White-label Solution**
- License billing system to other salon platforms
- ₹50,000 one-time + ₹5,000/month support

---

## 14. Cost Analysis

### 14.1 Development Costs

| Phase | Duration | Effort | Notes |
|-------|----------|--------|-------|
| Phase 1: Core Billing | 6 weeks | 240 hours | Foundation |
| Phase 2: GST & Reports | 4 weeks | 160 hours | Compliance |
| Phase 3: Product Catalog | 3 weeks | 120 hours | Inventory |
| Phase 4: Advanced Features | 4 weeks | 160 hours | Automation |
| **Total Development** | **17 weeks** | **680 hours** | |

**Estimated Development Cost:** ₹5,00,000 - ₹8,00,000  
(Based on ₹800-1,200/hour developer rate)

### 14.2 Infrastructure Costs (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Neon PostgreSQL | Shared instance | ₹0 (existing) |
| File Storage (S3/Cloudinary) | 10 GB PDFs | ₹200 |
| Razorpay Transaction Fees | 2% per transaction | Variable |
| Twilio SMS | 1,000 SMS/month | ₹500 |
| SendGrid Email | 5,000 emails/month | ₹0 (free tier) |
| **Total Monthly** | | **₹700 + transaction fees** |

### 14.3 Revenue Potential

**Scenario 1: Free for SalonHub users**
- **Value add:** Increased retention, higher subscription conversions
- **Estimated impact:** 20% increase in Pro subscription upgrades
- **Annual value:** ₹10,00,000+ (indirect revenue)

**Scenario 2: Standalone SaaS (100 paying customers)**
- **Average plan:** ₹999/month
- **Monthly revenue:** ₹99,900
- **Annual revenue:** ₹11,98,800
- **Profit margin:** 70% (after infrastructure costs)

**Scenario 3: White-label licensing (5 clients)**
- **Setup fee:** ₹50,000 × 5 = ₹2,50,000
- **Monthly support:** ₹5,000 × 5 = ₹25,000/month
- **Annual revenue:** ₹5,50,000

---

## 15. Success Metrics

### 15.1 Technical KPIs
- ✅ **API Response Time:** < 500ms (95th percentile)
- ✅ **System Uptime:** 99.5%
- ✅ **Invoice Generation Time:** < 2 seconds
- ✅ **PDF Generation Time:** < 3 seconds
- ✅ **Zero data loss:** 100% transaction integrity

### 15.2 Business KPIs
- ✅ **User Adoption:** 80% of salons using billing within 3 months
- ✅ **Invoice Volume:** 10,000+ invoices/month across platform
- ✅ **Payment Collection Rate:** 95% invoices paid within 7 days
- ✅ **Customer Satisfaction:** 4.5+ star rating
- ✅ **GST Filing Accuracy:** 100% compliance

---

## 16. Risk Analysis & Mitigation

### 16.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **GST rate changes** | High | Configurable tax rate table, admin panel for updates |
| **Razorpay downtime** | Medium | Fallback to manual payment recording |
| **Database corruption** | Critical | Automated backups every 6 hours, point-in-time recovery |
| **API breaking changes** | High | Versioned APIs (/v1, /v2), 6-month deprecation notice |

### 16.2 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Low user adoption** | High | Beta testing with 5 salons, gather feedback, iterate |
| **Regulatory changes** | Medium | Legal compliance review quarterly |
| **Competition** | Medium | Unique salon-specific features, tight SalonHub integration |

---

## 17. Conclusion

### 17.1 Key Highlights

✅ **Comprehensive GST Compliance** - Built for Indian market with automatic tax calculations  
✅ **Salon-Specific Design** - Understands beauty & wellness business workflows  
✅ **Future-Proof Architecture** - Modular, API-first, scalable to other platforms  
✅ **Mobile-First Experience** - 80%+ operations manageable from smartphones  
✅ **Cost-Effective** - Free for SalonHub users vs. ₹20k+/year for competitors  
✅ **Revenue Potential** - Can be licensed as standalone SaaS or white-label solution

### 17.2 Next Steps

1. **Team Review & Feedback** (1 week)
   - Review this document with stakeholders
   - Gather technical feasibility feedback
   - Finalize feature prioritization

2. **Prototype Development** (2 weeks)
   - Build basic invoice generation UI
   - Implement GST calculation engine
   - Create sample invoices for review

3. **Beta Testing** (2 weeks)
   - Onboard 5 existing SalonHub salons
   - Generate real invoices
   - Collect feedback and iterate

4. **Full Implementation** (12-14 weeks)
   - Follow phased roadmap (Section 12)
   - Weekly progress reviews
   - Continuous testing and refinement

---

**Document Version:** 1.0  
**Last Updated:** November 6, 2025  
**Prepared By:** SalonHub Development Team  
**Status:** Awaiting Team Review

---

**For questions or feedback, please contact:**  
Technical Team: dev@salonhub.com  
Business Team: business@salonhub.com

---

This document provides a complete technical specification for implementing a world-class GST-compliant billing system tailored for the Indian salon industry. The modular architecture ensures it can serve SalonHub users while maintaining independence for future licensing opportunities.
