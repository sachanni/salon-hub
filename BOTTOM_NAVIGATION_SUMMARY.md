**Note:** This screen includes a bottom navigation bar with 5 tabs 
(Home, Explore, Bookings, Offers, Profile) at the bottom. 
The Home tab should be highlighted/active.

💡 What I Recommend:
Best Approach:
Generate bottom nav ONCE using the dedicated prompt

For each screen prompt, just mention which tab is active:

**Active Tab:** Home

Or:

**Active Tab:** Dashboard (with red badge showing "8")

In implementation, we'll create ONE bottom nav component and just change the active state
---------------------------------------------------



# 📱 Bottom Navigation Menus - SalonHub Apps

**Date:** November 20, 2025  
**Status:** ✅ Complete & Added to Uizard Prompts  

---

## 🎯 Overview

Bottom navigation menus have been designed and added to both SalonHub mobile apps with comprehensive Uizard.io-ready specifications.

---

## 📱 CUSTOMER APP - Bottom Navigation

**⚠️ UPDATED for Product E-commerce Feature (Nov 2025)**

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     APP CONTENT AREA                          │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  🏠      🛍️       📅        🎁        👤                      │
│ Home    Shop   Bookings  Offers   Profile                    │
│         (2)      (3)      NEW                                 │
└─────────────────────────────────────────────────────────────┘
```

### Tab Details

| Tab | Icon | Label | Badge | Purpose | Screens |
|-----|------|-------|-------|---------|---------|
| **1. Home** | 🏠 House | Home | - | Personalized feed, nearby salons, salon discovery, featured products | Home feed, salon search, explore salons, map |
| **2. Shop** | 🛍️ Shopping Bag | Shop | **Red count (2)** | Browse & buy salon products, shopping cart, orders | Product catalog, cart, checkout, order tracking |
| **3. Bookings** | 📅 Calendar | Bookings | **Red count (3)** | View upcoming/past service appointments | Bookings list, details, reschedule |
| **4. Offers** | 🎁 Tag/Gift | Offers | **"NEW" badge** | Deals & discounts for both services and products | Active offers, rewards, referral |
| **5. Profile** | 👤 User | Profile | - | User account, settings, payment methods, wishlist | Profile, favorites, wallet, settings, wishlist |

### What Changed?

**BEFORE (Services Only):**
- 🏠 Home | 🔍 Explore | 📅 Bookings | 🎁 Offers | 👤 Profile

**AFTER (Services + Products):**
- 🏠 Home | 🛍️ Shop | 📅 Bookings | 🎁 Offers | 👤 Profile

**Key Changes:**
1. **NEW: Shop Tab** - Dedicated space for product e-commerce
2. **Explore → Home** - Salon discovery integrated into Home tab
3. **Shop Badge** - Red count shows cart items (real-time)
4. **Offers** - Now includes both service AND product offers

### Why This Structure?

**🏠 Home Tab Expansion:**
- **Previously:** Just personalized feed
- **Now:** Feed + Salon Discovery + Featured Products
- **Sections in Home:**
  1. Search bar (salons and products)
  2. Nearby salons carousel
  3. Categories (Haircut, Facial, Spa...)
  4. Featured products preview
  5. Popular salons
  6. Map view option
- **Benefit:** Single destination for all discovery

**🛍️ Shop Tab (NEW):**
- **Why dedicated tab?** Product sales = 15-25% revenue increase
- **Industry standard:** Amazon, Nykaa, Flipkart have dedicated Shop
- **Customer journey:**
  1. Browse products from favorite salon
  2. Search across all salons
  3. Add to cart (badge updates)
  4. Checkout
  5. Track orders
- **Badge:** Critical for cart abandonment reduction

**📅 Bookings Tab:**
- **Unchanged:** Service bookings only
- **Why separate?** Different workflows:
  - Services: Time-based, appointment scheduling
  - Products: Instant purchase, delivery/pickup
- **Future:** May show "Recommended products for your booking"

**🎁 Offers Tab:**
- **Now unified:** Service offers + Product offers
- **Examples:**
  - "20% off all haircuts this week"
  - "Buy 2 shampoos, get 1 free"
  - "Book service + buy product = Extra 10% off"
- **Cross-sell opportunity:** Encourage bundling

**👤 Profile Tab:**
- **Enhanced with:**
  - Product order history (separate from service bookings)
  - Wishlist (products saved for later)
  - Wallet (usable for services AND products)
  - Reviews (service reviews + product reviews)

### Navigation Flow Comparison

```
┌──────────────────────────────────────────────────────────────────┐
│                     BEFORE vs AFTER                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  BEFORE (Services Only):                                           │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ 🏠 Home                                                   │     │
│  │ - Personalized feed                                       │     │
│  │ - Featured salons only                                    │     │
│  │                                                           │     │
│  │ 🔍 Explore                                                │     │
│  │ - Browse ALL salons                                       │     │
│  │ - Categories, map, search                                 │     │
│  │                                                           │     │
│  │ 📅 Bookings - Service appointments                        │     │
│  │ 🎁 Offers - Service discounts                             │     │
│  │ 👤 Profile - Account settings                             │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                    │
│  ──────────────────────────────────────────────────────────       │
│                                                                    │
│  AFTER (Services + Products):                                      │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ 🏠 Home (EXPANDED)                                        │     │
│  │ - Personalized feed                                       │     │
│  │ - Nearby salons                                           │     │
│  │ - Categories & search (moved from Explore)                │     │
│  │ - Featured products preview                               │     │
│  │ - Map view                                                │     │
│  │                                                           │     │
│  │ 🛍️ Shop (NEW - MAJOR FEATURE)                             │     │
│  │ - Browse products                                         │     │
│  │ - Shopping cart (2) ← badge                               │     │
│  │ - Product search & filters                                │     │
│  │ - Checkout & orders                                       │     │
│  │ - Product tracking                                        │     │
│  │                                                           │     │
│  │ 📅 Bookings - Service appointments                        │     │
│  │ 🎁 Offers - Services AND Products                         │     │
│  │ 👤 Profile - Account + Wishlist + Product orders          │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### User Journey Examples

**Scenario 1: Customer wants haircut + products**
1. 🏠 Home → Search "hair salon near me"
2. Tap salon → View services
3. Book haircut appointment → 📅 Bookings (shows appointment)
4. Return to salon page → Tap "Shop Products"
5. 🛍️ Shop → Browse shampoos → Add 2 to cart (badge shows "2")
6. Tap cart → Checkout → Complete purchase
7. 📅 Bookings: See service appointment
8. 👤 Profile → My Orders → Track product delivery

**Scenario 2: Customer just wants products**
1. 🛍️ Shop → "L'Oreal shampoo"
2. Add to cart → Badge shows "1"
3. Continue shopping → Add conditioner
4. Tap cart (badge "2") → Checkout
5. Select salon pickup → Pay online
6. 👤 Profile → My Orders → Track order
7. Get pickup notification → Visit salon to collect

**Scenario 3: Salon discovery**
1. 🏠 Home → Browse nearby salons
2. Tap category "Facial & Spa"
3. See filtered salons (used to be in Explore)
4. Tap salon → View details
5. See "Featured Products" section
6. Tap product → 🛍️ Shop tab opens with product details

### Design Specifications

```css
Height: 64px (iOS) / 56px (Android)
Background: White (light) / Dark Gray #1F2937 (dark)
Border-top: 1px solid #E5E7EB
Shadow: 4dp elevation

Active Color: Purple #8B5CF6
Inactive Color: Gray #9CA3AF
Badge BG: Red #EF4444
Icon Size: 24px
Label Size: 11sp
```

### Badge System

**Shop Badge (NEW):**
- Red circle with white number
- Shows count of items in shopping cart
- Example: "2" means 2 products in cart
- Updates in real-time as items added/removed
- Empty when cart is empty (no badge shown)

**Bookings Badge:**
- Red circle with white number
- Shows count of upcoming bookings
- Example: "3" means 3 upcoming appointments
- Auto-updates in real-time

**Offers Badge:**
- "NEW" text in red
- Appears when new offers available (services OR products)
- Dismisses after user views offers

---

## 💼 BUSINESS PARTNER APP - Bottom Navigation

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     APP CONTENT AREA                          │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│  📊        📅         👥        👔        ≡                   │
│Dashboard  Calendar  Customers  Staff    More                 │
│            (8)                   •                            │
└─────────────────────────────────────────────────────────────┘
```

### Tab Details

| Tab | Icon | Label | Badge | Purpose | Screens |
|-----|------|-------|-------|---------|---------|
| **1. Dashboard** | 📊 Grid | Dashboard | - | Business overview, today's stats, metrics | Main dashboard, analytics |
| **2. Calendar** | 📅 Calendar | Calendar | **Red count (8)** | Appointment management, schedule | Calendar view, booking details |
| **3. Customers** | 👥 Users | Customers | - | Customer database, search, profiles | Customer list, profiles, add |
| **4. Staff** | 👔 ID Badge | Staff | **Orange dot •** | Staff management, schedules, attendance | Staff list, attendance, leave |
| **5. More** | ≡ Menu | More | - | Access all other features | More menu grid |

### Design Specifications

```css
Height: 64px (iOS) / 56px (Android)
Background: White (light) / Dark Gray #1F2937 (dark)
Border-top: 1px solid #E5E7EB
Shadow: 4dp elevation (professional)

Active Color: Deep Purple #6D28D9
Inactive Color: Gray #9CA3AF
Badge BG: Red #EF4444 (calendar) / Orange #F59E0B (staff)
Icon Size: 24px
Label Size: 11sp (semibold when active)
```

### Badge System

**Calendar Badge:**
- Red circle with white number
- Shows pending/today's bookings count
- Example: "8" means 8 pending appointments
- Updates real-time

**Staff Badge:**
- Orange pulsing dot (no text)
- Indicates pending actions:
  - Leave requests
  - Attendance not marked
  - Performance reviews due
- Subtle pulse animation

---

## 🎨 "More" Menu Screen (Partner App)

When business users tap the "More" tab, they see a full-screen grid menu:

### Menu Grid Layout (2 columns × 5 rows)

```
┌──────────────────────────────────────────────────────┐
│                    More Menu                          │
│                                                   ✕   │
├──────────────────────────────────────────────────────┤
│                                                       │
│   ┌────────────────┐  ┌────────────────┐            │
│   │  💰            │  │  📦            │            │
│   │ Financials     │  │ Inventory      │            │
│   │ Revenue & P&L  │  │ Stock & Orders │            │
│   └────────────────┘  └────────────────┘            │
│                                                       │
│   ┌────────────────┐  ┌────────────────┐            │
│   │  💬            │  │  📈            │            │
│   │ Communication  │  │ Reports        │            │
│   │ Messages & SMS │  │ Analytics      │            │
│   └────────────────┘  └────────────────┘            │
│                                                       │
│   ┌────────────────┐  ┌────────────────┐            │
│   │  🎯            │  │  🎁            │            │
│   │ Marketing      │  │ Promotions     │            │
│   │ Campaigns      │  │ Offers & Deals │            │
│   └────────────────┘  └────────────────┘            │
│                                                       │
│   ┌────────────────┐  ┌────────────────┐            │
│   │  👥            │  │  🔔            │            │
│   │ Team Reviews   │  │ Notifications  │            │
│   │ Performance    │  │ Alerts         │            │
│   └────────────────┘  └────────────────┘            │
│                                                       │
│   ┌────────────────┐  ┌────────────────┐            │
│   │  ⚙️             │  │  ℹ️             │            │
│   │ Settings       │  │ Help & Support │            │
│   │ Preferences    │  │ Contact Us     │            │
│   └────────────────┘  └────────────────┘            │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Features:**
- 10 menu items organized in 2-column grid
- Each card: 160px height, white background, 12px radius
- Large colorful icons (48px) at top
- Title (16sp, bold) + subtitle (12sp, gray)
- Tap opens respective section
- Light gray background (#F9FAFB)

---

## 🎯 Alternative Option: FAB (Floating Action Button)

For the Partner App, an optional centered FAB can replace standard "More" tab:

### Visual

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                     APP CONTENT AREA                          │
│                                                               │
│                           ╭───╮                               │
│                           │ + │  ← Elevated FAB               │
├───────────────────────────╰───╯───────────────────────────────┤
│  📊        📅                      👥        ≡                │
│Dashboard  Calendar              Customers  More              │
└─────────────────────────────────────────────────────────────┘
```

**FAB Specifications:**
- Size: 56px diameter
- Position: Center, elevated 8px above bottom nav
- Background: Gradient purple
- Icon: Plus (+) symbol, white
- Shadow: 8dp elevation
- Tap opens quick actions menu:
  - ➕ New Booking
  - 👤 Add Customer
  - ✓ Mark Attendance
  - 💰 Record Payment

---

## 📊 Comparison Table

| Feature | Customer App | Partner App |
|---------|-------------|-------------|
| **Total Tabs** | 5 | 5 |
| **Primary Color** | Purple #8B5CF6 | Deep Purple #6D28D9 |
| **Badge Types** | Count + "NEW" | Count + Pulsing Dot |
| **More Menu** | No | Yes (10 items grid) |
| **FAB Option** | No | Yes (optional) |
| **Focus** | Discovery & Booking | Business Management |
| **Style** | Consumer-friendly | Professional |

---

## ✅ Implementation Status

### Customer App (UIZARD_CUSTOMER_APP_PROMPTS.md)
- ✅ Bottom navigation section added
- ✅ Complete Uizard.io prompt included
- ✅ All 5 tabs specified with badges
- ✅ Design specs, colors, interactions
- ✅ Accessibility requirements
- ✅ Table of Contents updated

### Business Partner App (UIZARD_BUSINESS_PARTNER_APP_PROMPTS.md)
- ✅ Bottom navigation section added
- ✅ Complete Uizard.io prompt included
- ✅ All 5 tabs with business-focused badges
- ✅ "More" menu screen design
- ✅ Optional FAB specification
- ✅ Professional styling
- ✅ Table of Contents updated

---

## 🚀 How to Use in Uizard.io

### Step 1: Copy the Prompt
Navigate to the "Bottom Navigation Menu" section in either:
- `UIZARD_CUSTOMER_APP_PROMPTS.md` (for customer app)
- `UIZARD_BUSINESS_PARTNER_APP_PROMPTS.md` (for partner app)

### Step 2: Paste in Uizard
1. Open Uizard.io
2. Create new mobile app project
3. Find the bottom navigation component
4. Paste the complete prompt from the markdown file

### Step 3: Generate & Customize
- Uizard will generate the bottom nav bar
- Adjust colors to match your exact brand
- Modify icons if needed
- Add/remove badges as required

### Step 4: Apply to All Screens
- Bottom nav should appear on all main screens
- Exclude from: Login, splash, onboarding, modals
- Include on: Home, main feature screens

---

## 🎨 Design Principles Applied

### Customer App Navigation:
✅ **Discovery-First:** Home consolidates salon discovery  
✅ **E-commerce:** Dedicated Shop tab for products (NEW)  
✅ **Quick Access:** Bookings always visible  
✅ **Engagement:** Offers tab encourages return visits (services + products)  
✅ **Personal:** Profile easily accessible (includes wishlist)  

### Partner App Navigation:
✅ **Business Overview:** Dashboard first  
✅ **Core Operations:** Calendar central position  
✅ **People Management:** Customers & Staff primary tabs  
✅ **Extended Features:** More menu for advanced functions  
✅ **Quick Actions:** Optional FAB for common tasks  

---

## 📱 Platform Guidelines Compliance

### iOS (Human Interface Guidelines)
- ✅ Tab bar height: 49-83px (with safe area)
- ✅ Icons: 25-30px recommended
- ✅ Clear active state
- ✅ Haptic feedback on tab switch
- ✅ Safe area respect

### Android (Material Design 3)
- ✅ Bottom nav height: 56-64px
- ✅ Icons: 24px
- ✅ Ripple effect on tap
- ✅ Minimum touch target: 48x48px
- ✅ Elevation: 4dp

---

## 🔍 Accessibility Features

### Visual Accessibility:
- High contrast (4.5:1 minimum)
- Clear active/inactive distinction
- Icon + text labels
- Color not sole indicator

### Screen Reader Support:
- Semantic role="navigation"
- Clear ARIA labels
- Badge counts announced
- Current tab indicated

### Motor Accessibility:
- Large touch targets (48x48px min)
- No double-tap required
- Simple gestures only
- Spaced items (no mis-taps)

---

## 📊 Key Metrics & Rationale

### Customer App:
- **5 tabs:** Optimal for mobile (3-5 recommended)
- **Home first:** Most frequent use case (salon discovery + feed)
- **Shop second:** Major revenue stream, prominent position
- **Bookings center:** Easy thumb access
- **Offers & Profile:** Supporting features

### Partner App:
- **5 tabs:** Balances features vs. simplicity
- **Dashboard first:** Morning check-in flow
- **Calendar second:** Primary daily tool
- **More menu:** Prevents tab overflow (10+ features)

---

## 🎉 Summary

Both SalonHub mobile apps now have:
- ✅ **Fully designed bottom navigation menus**
- ✅ **Complete Uizard.io implementation prompts**
- ✅ **Badge notification systems**
- ✅ **Professional styling specifications**
- ✅ **Accessibility compliance**
- ✅ **Platform-specific optimizations**
- ✅ **Ready for immediate UI generation**

**Total additions:**
- Customer App: 95 lines of bottom nav specs
- Partner App: 204 lines (includes More menu)
- Both files updated with new table of contents

All bottom navigation designs are production-ready and can be directly used in Uizard.io to generate pixel-perfect mobile app bottom bars! 🚀
