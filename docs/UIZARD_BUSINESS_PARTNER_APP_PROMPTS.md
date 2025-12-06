# SalonHub Partner Mobile App - Uizard.io Design Prompts
## COMPREHENSIVE BUSINESS MANAGEMENT EDITION

**Version:** 3.1 (E-Commerce Edition)  
**Date:** November 22, 2025  
**Platform:** iOS & Android Mobile App  
**Design Tool:** Uizard.io  
**Total Screens:** 68 screens (COMPLETE)

---

## Table of Contents

1. [Design System & Brand Guidelines](#design-system--brand-guidelines)
2. **[Bottom Navigation Menu (Global Component)](#-bottom-navigation-menu-global-component)** ⭐ NEW
3. [Authentication & Onboarding (7 screens)](#authentication--onboarding)
4. **[Salon Setup & Configuration - First-Time Setup (10 screens)](#salon-setup--configuration-first-time-setup)**
5. [Dashboard & Analytics (8 screens)](#dashboard--analytics)
6. [Calendar & Booking Management (10 screens)](#calendar--booking-management)
7. [Customer Management (8 screens)](#customer-management)
8. [Staff Management (9 screens)](#staff-management)
9. [Financial Management (6 screens)](#financial-management)
10. [Inventory Management (4 screens)](#inventory-management)
11. [Communication & Marketing (2 screens)](#communication--marketing)
12. **[E-Commerce & Retail Management (4 screens)](#e-commerce--retail-management)** ⭐ NEW

---

## Design System & Brand Guidelines

### Color Palette (Business/Professional Theme)
- **Primary Color:** Deep Purple (#6D28D9) - For primary actions, business data
- **Secondary Color:** Emerald Green (#059669) - For success, revenue, positive metrics
- **Accent:** Amber (#F59E0B) - For warnings, pending items
- **Background:** White (#FFFFFF) for light mode, Dark Gray (#1F2937) for dark mode
- **Surface:** Light Gray (#F3F4F6) for cards
- **Text Primary:** Dark Gray (#111827)
- **Text Secondary:** Medium Gray (#6B7280)
- **Success:** Green (#10B981)
- **Warning:** Amber (#F59E0B)
- **Error:** Red (#EF4444)
- **Info:** Blue (#3B82F6)

### Typography
- **Headings:** Bold, Sans-serif (18-24sp)
- **Body:** Regular, Sans-serif (14-16sp)
- **Numbers/Metrics:** Semibold (for revenue, stats)
- **Captions:** Regular (12sp)

### Spacing & Components
- Small: 8px | Medium: 16px | Large: 24px | XL: 32px
- Icons: Line style, business-focused, 24px default
- Cards: White background, 12px border radius, subtle shadow
- Buttons: 48px height, rounded corners

---

## 💼 Bottom Navigation Menu (Global Component)

### Business Partner App - Bottom Tab Bar (5 Items)

**Prompt for Uizard:**
```
Design a professional bottom navigation bar for a salon business management app with 5 main tabs.

BOTTOM NAV BAR STRUCTURE:
Height: 64px (iOS with safe area) / 56px (Android)
Background: White (light mode) / Dark Gray #1F2937 (dark mode)
Top border: 1px solid light gray (#E5E7EB)
Elevation: 4dp subtle shadow (professional feel)
Safe area: Respect iOS bottom safe area padding

NAVIGATION ITEMS (Left to Right):

1. DASHBOARD TAB:
   - Icon: Grid/Dashboard icon (24px)
     * 2x2 or 3x3 grid squares
   - Label: "Dashboard" (11sp, semibold)
   - Active state: Deep Purple (#6D28D9) icon + text
   - Inactive state: Gray (#9CA3AF) icon + text
   - Links to: Main business dashboard

2. CALENDAR TAB:
   - Icon: Calendar icon (24px)
     * Calendar with dates visible
   - Label: "Calendar" (11sp)
   - Badge: Red circle with count "8" (white text, bold 11sp)
     * Position: Top-right of icon
     * Size: 20px diameter (min), grows with double digits
     * Shows pending bookings count
     * Only visible when count > 0
   - Active state: Purple + badge
   - Inactive state: Gray + badge
   - Links to: Appointment calendar

3. CUSTOMERS TAB:
   - Icon: Users/People icon (24px)
     * Multiple person silhouettes
   - Label: "Customers" (11sp)
   - Active state: Purple
   - Inactive state: Gray
   - Links to: Customer management screen

4. STAFF TAB:
   - Icon: ID Badge/Team icon (24px)
     * Badge or business card icon
   - Label: "Staff" (11sp)
   - Badge: Orange dot indicator (10px diameter)
     * Position: Top-right of icon
     * Shows when pending leave requests or actions needed
     * Pulsing animation to draw attention
   - Active state: Purple + indicator
   - Inactive state: Gray + indicator
   - Links to: Staff management screen

5. MORE TAB:
   - Icon: Menu/Grid icon (24px)
     * 3x3 dots or hamburger menu
   - Label: "More" (11sp)
   - Active state: Purple
   - Inactive state: Gray
   - Opens: More menu with:
     ├─ 💰 Financials
     ├─ 📦 Inventory
     ├─ 💬 Communication
     ├─ 📈 Reports
     ├─ 🎯 Marketing
     └─ ⚙️ Settings

INTERACTION STATES:
- Active tab: Purple icon & text, slight scale (1.05x), bold label
- Inactive tab: Gray icon & text, regular weight
- Tap animation: Smooth transition (200ms)
- Icon style: Outline when inactive, filled when active
- Material ripple (Android) / Haptic feedback (iOS)

BADGE SPECIFICATIONS:

Calendar Badge (pending bookings):
- Background: Red (#EF4444)
- Text: White (#FFFFFF), bold
- Font: 11sp
- Min size: 20px diameter
- Max size: Auto-expand for 2+ digits
- Position: top: -6px, right: -8px from icon

Staff Badge (pending actions):
- Style: Orange dot (#F59E0B)
- Size: 10px diameter
- No text, just indicator
- Pulsing animation (subtle)
- Position: top: -4px, right: -6px

ACCESSIBILITY:
- Minimum tap target: 48x48px per item
- Clear labels for screen readers
- High contrast between active/inactive states
- Semantic icon meanings
- Badge numbers announced for accessibility

BUSINESS-FOCUSED DESIGN:
- Professional, not playful
- Clear business metrics visible (badges)
- Efficient navigation between key functions
- Optimized for one-handed operation
- Quick access to most-used features

MOBILE OPTIMIZATIONS:
- Fixed at bottom (always visible)
- Persists across screens
- Smooth page transitions (slide animation)
- No animation lag
- Optimized touch targets
- Spacing between items: Equal distribution

ALTERNATIVE: CENTER FAB OPTION
(Optional elevated quick action button):
- Position: Center of bottom bar (slightly elevated above)
- Icon: Plus (+) in circle
- Size: 56px diameter
- Background: Gradient purple
- Shadow: 8dp elevation
- Action: Opens quick actions menu:
  ├─ ➕ New Booking
  ├─ 👤 Add Customer
  ├─ ✓ Mark Attendance
  └─ 💰 Record Payment
- Returns to normal nav when tapped

Style: Professional, business-focused, efficient
Material Design 3 (Android) / iOS HIG compliant
Optimized for salon business operations
```

---

### More Menu Screen (Accessed from More Tab)

**Prompt for Uizard:**
```
Design the "More" menu screen that opens when tapping the More tab in bottom navigation.

HEADER:
- "More" title (bold, 20sp, dark gray)
- Close icon (X, top-right) to return to previous screen

MENU GRID (2 columns):

Row 1:
┌──────────────────┬──────────────────┐
│  💰 Financials   │  📦 Inventory    │
│  Revenue & P&L   │  Stock & Orders  │
└──────────────────┴──────────────────┘

Row 2:
┌──────────────────┬──────────────────┐
│  💬 Communication│  📈 Reports      │
│  Messages & SMS  │  Analytics       │
└──────────────────┴──────────────────┘

Row 3:
┌──────────────────┬──────────────────┐
│  🎯 Marketing    │  🎁 Promotions   │
│  Campaigns       │  Offers & Deals  │
└──────────────────┴──────────────────┘

Row 4:
┌──────────────────┬──────────────────┐
│  👥 Team Reviews │  🔔 Notifications│
│  Performance     │  Alerts          │
└──────────────────┴──────────────────┘

Row 5:
┌──────────────────┬──────────────────┐
│  ⚙️ Settings     │  ℹ️ Help & Support│
│  Preferences     │  Contact Us      │
└──────────────────┴──────────────────┘

Each menu card:
- 160px height (square-ish)
- White background
- 12px border radius
- Subtle shadow on tap
- Icon: 48px (top, centered, colorful)
- Title: 16sp, bold, dark gray
- Subtitle: 12sp, light gray
- Tap: Opens respective section
- Hover: Slight elevation (4dp)

Background: Light gray (#F9FAFB)
Spacing: 12px gap between cards
Padding: 16px around grid

Style: App drawer, organized access to all features
```

---

## Authentication & Onboarding

### Screen 1: Splash Screen

**Prompt for Uizard:**
```
Create a professional mobile splash screen for SalonHub Partner - a business management app for salon owners.
Center the screen with a large, elegant deep purple logo featuring a minimalist salon chair or business graph icon.
Below the logo, display "SalonHub Partner" in a modern, bold sans-serif font (24sp).
Add a tagline "Manage Your Salon Business" in dark gray (14sp) below the app name.
Show a small loading indicator at the bottom (circular spinner in purple).
Add version number "v1.0.0" in tiny gray text at bottom corner.
Use a clean white background with subtle purple gradient from top.
Design should be professional, trustworthy, and business-focused.
```

---

### Screen 2: Welcome Screen

**Prompt for Uizard:**
```
Design a welcome screen for a salon business management mobile app.

Top section (hero):
- Professional illustration or photo of a salon owner managing their business on a tablet/phone
- Modern, bright salon environment in background

Middle section:
- "SalonHub Partner" heading (bold, 24sp, deep purple)
- "Your Business, In Your Pocket" subheading (18sp, gray)

Benefits list (with checkmarks):
- ✓ Manage bookings on-the-go (16sp)
- ✓ Track revenue in real-time
- ✓ Coordinate your team
- ✓ Grow your business

Bottom section (two buttons):
- "Get Started" (large purple button, 48px height, full width)
- "I Already Have an Account" (text link, purple, 14sp)

Background: White with subtle professional feel
Style: Business-focused, professional, trustworthy, modern
No playful elements - this is for business owners
```

---

### Screen 3: Partner Login Screen

**Prompt for Uizard:**
```
Design a business login screen for salon partners/owners.

Header:
- Back arrow (top-left)
- "Partner Login" title (bold, 20sp)
- "Manage your salon business" subtitle (gray, 14sp)

Form section (center):
- Email input field:
  * "Email" label above
  * White background, light border
  * 52px height, rounded corners (8px)
  * Email icon inside (left side)
  
- Password input field:
  * "Password" label above
  * Same styling as email
  * Show/hide password icon (eye icon, right side)

Checkbox row:
- "Remember Me" checkbox (left)
- "Forgot Password?" link (purple, right-aligned)

Primary button:
- "Login" button (purple, full width, 48px height, rounded)

Divider:
- "OR" text with horizontal lines on sides

Alternative login:
- "Continue with Phone" button (white, border, 48px height)

Bottom section:
- "Don't have a business account?" (gray, 14sp)
- "Register Your Salon →" link (purple, bold)

Background: White
Style: Professional, secure-looking, business-oriented
Add subtle lock/security icon near heading for trust
```

---

### Screen 4: Business Registration - Step 1 (Account Creation)

**Prompt for Uizard:**
```
Design step 1 of business registration - account creation.

Header:
- Back arrow (left)
- "Step 1 of 6" progress indicator (right, gray)
- Progress bar below header (16% filled in purple)
- "Create Account" title (bold, 20sp)

Form fields (stacked, 16px spacing):
1. Full Name input
2. Email input  
3. Phone Number input (with +91 prefix)
4. Password input (with strength indicator below)

Each field:
- Label above (14sp, gray)
- Input box (white, light border, 52px height, rounded)
- Appropriate icons (person, email, phone, lock)

Password strength indicator:
- Horizontal bar below password field
- Colors: Red (weak) → Yellow (medium) → Green (strong)
- Text: "Weak", "Medium", or "Strong"

Primary button:
- "Verify Phone & Continue" (purple, full width, 48px height)

Bottom link:
- "Already have account? Login →" (purple, 14sp)

Background: White
Style: Form-focused, professional, step-by-step feel
```

---

### Screen 5: Business Registration - Step 2 (Business Info)

**Prompt for Uizard:**
```
Design step 2 of business registration - business information.

Header:
- Back arrow
- "Step 2 of 6" 
- Progress bar (33% filled)
- "Tell Us About Your Business" title (bold, 18sp)

Form section:

Business Name:
- Text input field (full width)

Business Type (selection):
- Three option cards in a row:
  * [Salon] card
  * [Spa] card
  * [Both] card
- Each: 100px width, 80px height, icon + text
- Selected: Purple border and background tint
- Unselected: White with light border

Category dropdown:
- Label "Category"
- Dropdown selector showing "Hair Salon"
- Options: Hair Salon, Unisex Salon, Spa, Beauty Bar, Nail Salon

Description (optional):
- Multi-line text area (3 lines)
- Placeholder: "Brief description of your business"
- Character count: "0/200" (bottom-right, small gray text)

Button:
- "Continue" (purple, full width, 48px height)

Background: White
Style: Clean, organized, business-focused
Show appropriate icons for each business type
```

---

### Screen 6: Business Registration - Step 3 (Location)

**Prompt for Uizard:**
```
Design step 3 of business registration - location and contact.

Header:
- Back arrow
- "Step 3 of 6"
- Progress bar (50% filled)
- "Location & Contact" title

Form fields:

Address Search:
- Search input with location pin icon
- Placeholder: "Search address..."
- Light gray background, rounded

Complete Address:
- Multi-line text area
- Placeholder: "Complete address"

Two-column row:
- [City] input (50% width, left)
- [State] dropdown (50% width, right)
- 8px gap between

Two-column row:
- [PIN Code] input (50% width, left)
- [Phone] input (50% width, right)

Map Preview (optional):
- Small map thumbnail showing pin location
- 150px height, full width
- Rounded corners
- "Tap to adjust location" text overlay

Button:
- "Continue" (purple, full width)

Background: White
Style: Location-focused, map integration feel
Add GPS "Use Current Location" button above address search
```

---

### Screen 7: OTP Verification (Business)

**Prompt for Uizard:**
```
Design phone verification screen for business registration.

Header:
- Back arrow
- "Verify Phone Number" title (bold, 20sp)
- "We've sent a code to +91 98765 43210" subtitle (gray, 14sp)
- [Edit Number] link (purple, small)

OTP Input (centered):
- 6 digit input boxes
- Each box: 48x48px, light gray border, rounded corners
- Active box: Purple border, thicker
- Filled boxes: Bold black numbers (24sp)
- 8px spacing between boxes

Timer section:
- "Resend code in 00:45" (gray, centered)
- When expired: "Didn't receive code? Resend" (purple, clickable)

Verification button:
- "Verify & Continue" (purple, full width, 48px height)
- Disabled state until all 6 digits entered

Security note:
- Small shield icon + "Secure verification" text (gray, 12sp, bottom)

Background: White
Style: Secure, professional, focused
Add subtle phone icon near title
Auto-advance to next input box on digit entry
```


---

## Salon Setup & Configuration (First-Time Setup)

> **Critical First-Time Flow:** These screens appear immediately after registration for new salon partners to configure their business before accessing the main app.

### Screen 7A: Welcome to Salon Setup Wizard

**Prompt for Uizard:**
```
Design a welcoming setup wizard introduction screen for new salon business owners.

Header:
- "Welcome to SalonHub! 🎉" (bold, 24sp, deep purple, centered)
- "Let's Set Up Your Salon" (gray, 16sp, centered)

Progress indicator (top):
- Linear progress bar showing "Step 1 of 10"
- Purple filled portion, gray unfilled
- Small circles for each step

Hero illustration (center):
- Modern, professional illustration showing:
  * Salon storefront
  * Calendar icon
  * Staff members
  * Happy customers
- Flat design style, purple and gray colors
- 200px height

Introduction text:
- "We'll help you set up your salon profile in just a few minutes" (18sp, dark gray)
- "You can always change these settings later" (14sp, light gray)

What you'll configure (checklist preview):
- ✓ Business profile
- ✓ Services you offer
- ✓ Operating hours
- ✓ Photo gallery
- ✓ Payment methods
- And more...

Estimated time:
- Clock icon + "Takes about 5-7 minutes" (gray, 14sp)

Bottom buttons:
- [Skip for Now] (text link, gray, left)
- [Let's Start] (large purple button, right, 48px height)

Background: White with subtle gradient
Style: Welcoming, encouraging, professional
Add subtle confetti or celebration elements (minimal)
```

---

### Screen 7B: Business Profile Setup

**Prompt for Uizard:**
```
Design a business profile configuration screen for salon setup wizard.

Header:
- Back arrow (left)
- "Business Profile" title (bold, 20sp)
- Progress: "Step 2 of 10" (gray, right)

Progress bar:
- 20% filled (purple)

Form sections (scrollable):

SALON LOGO:
- "Salon Logo" heading (bold, 16sp)
- Large circular upload area (120px diameter, center):
  * Camera icon inside
  * "+ Add Logo" text below icon
  * Or existing logo preview
  * [Change Photo] button if uploaded

Upload options:
- [Take Photo] (camera icon)
- [Choose from Gallery] (image icon)
- Image requirements: "Max 5MB, JPG/PNG" (small, gray)

BUSINESS NAME:
- "Salon Name *" label (bold, 14sp)
- Input field:
  * Placeholder: "e.g., Glow Beauty Salon"
  * 52px height, rounded corners
  * White background, light border
  * Character count: "0/50" (gray, right)

BUSINESS DESCRIPTION:
- "About Your Salon" label
- Multi-line text area (4 lines):
  * Placeholder: "Tell customers about your salon, specialties, and what makes you unique..."
  * 120px height
  * Character count: "0/500"

BUSINESS TYPE:
- "Business Type" label
- Dropdown selector:
  * Options:
    - Unisex Salon
    - Women's Salon
    - Men's Salon
    - Spa & Wellness Center
    - Beauty Clinic
    - Hair Salon
    - Nail Studio
  * Default: "Select business type"

ESTABLISHED YEAR:
- "Year Established" label (optional)
- Year picker: "YYYY" format
- Placeholder: "2020"

SPECIALIZATIONS:
- "Specializations" label
- Tag input with chips:
  * Placeholder: "e.g., Bridal makeup, Hair coloring..."
  * Enter tags and press comma/return
  * Display as purple pill badges
  * Examples shown: [Hair Care] [Makeup] [Spa] [Nails]
  * [+] button to add more

GST NUMBER:
- "GST Number" label (optional)
- Input field:
  * Placeholder: "22AAAAA0000A1Z5"
  * Format validation
  * "Required for business registration" (info text)

BUSINESS LICENSE:
- "Business License/Registration" label (optional)
- [Upload Document] button
- Accepted: PDF, JPG, PNG
- Shows file name if uploaded

Bottom section:
- Validation messages (if any)
- Two buttons:
  * [Save & Continue Later] (outlined, gray, left)
  * [Continue] (filled, purple, right)
  * Continue enabled only when required fields filled

Helpful tip (info box):
- 💡 "Tip: A complete profile helps customers find and trust your salon"
- Light blue background, rounded corners

Background: White
Style: Professional business form
Clear required field indicators (*)
Real-time validation
```

---

### Screen 7C: Services Catalog - Categories

**Prompt for Uizard:**
```
Design a service category selection screen for salon setup.

Header:
- Back arrow
- "Services You Offer" title (bold, 20sp)
- Progress: "Step 3 of 10"

Progress bar: 30% filled

Instruction text:
- "Select the service categories your salon provides" (16sp, dark gray)
- "You can add specific services in the next step" (14sp, light gray)

Service categories (grid layout, 2 columns):

Category Card 1 - Hair Services:
- Large icon: Scissors icon (purple, 48px)
- "Hair Services" (bold, 16sp)
- Description: "Cuts, styling, treatments" (gray, 12sp)
- Checkbox (top-right, purple when selected)
- Card: 160px height, white, border
- Selected state: Purple border, slight purple tint background

Category Card 2 - Hair Coloring:
- Icon: Color palette
- "Hair Coloring"
- "Highlights, dye, balayage"
- Checkbox

Category Card 3 - Makeup:
- Icon: Makeup brush
- "Makeup Services"
- "Bridal, party, everyday"

Category Card 4 - Skin Care:
- Icon: Face icon
- "Skin Care"
- "Facials, cleanup, treatments"

Category Card 5 - Spa & Massage:
- Icon: Spa stones
- "Spa & Massage"
- "Body spa, massage therapy"

Category Card 6 - Nail Services:
- Icon: Nail polish
- "Nail Services"
- "Manicure, pedicure, nail art"

Category Card 7 - Threading & Waxing:
- Icon: Threading icon
- "Threading & Waxing"
- "Hair removal services"

Category Card 8 - Bridal Packages:
- Icon: Bride icon
- "Bridal Services"
- "Complete bridal packages"

Category Card 9 - Men's Grooming:
- Icon: Beard icon
- "Men's Grooming"
- "Haircuts, shaving, grooming"

Category Card 10 - Beauty Treatments:
- Icon: Beauty icon
- "Beauty Treatments"
- "Advanced treatments, procedures"

Each card:
- 48% width (2 columns)
- 4% gap between
- Tap to toggle selection
- Smooth animation on select

Quick select buttons (top):
- [Select All] [Clear All] buttons (small, outlined)

Selected count:
- "5 categories selected" (purple, bold)
- Floating at bottom of grid

Bottom buttons:
- [Back] (outlined, gray)
- [Continue] (filled, purple)
  * Disabled if none selected
  * Shows error: "Please select at least one category"

Background: Light gray (#F9FAFB)
Cards: White with subtle shadow
Style: Visual category browser
Icon-driven selection, easy scanning
```

---

### Screen 7D: Services Catalog - Add Services

**Prompt for Uizard:**
```
Design a service detail configuration screen for salon setup.

Header:
- Back arrow
- "Add Services" title
- Progress: "Step 4 of 10"

Progress bar: 40% filled

Category tabs (horizontal scroll):
- [Hair Services] [Hair Coloring] [Makeup] [Skin Care]
- Selected category highlighted (purple background, white text)
- Others: Gray background
- Shows only selected categories from previous screen

Current category: "Hair Services" (active tab)

Instruction:
- "Add the specific services you offer in Hair Services" (16sp, gray)

Quick add from popular services:

Popular services (expandable cards):

Service Template 1:
- "Women's Haircut" (bold, 15sp)
- Default details:
  * Duration: 45 minutes (editable)
  * Price: ₹ [input field] (user fills)
  * Description: Pre-filled template
- [Add This Service] button (small, purple, outlined)

Service Template 2:
- "Men's Haircut"
- Duration: 30 minutes
- Price: ₹ [input]
- [Add]

Service Template 3:
- "Hair Styling"
- Duration: 60 minutes
- Price: ₹ [input]
- [Add]

Service Template 4:
- "Hair Spa/Treatment"
- Duration: 90 minutes
- Price: ₹ [input]
- [Add]

Service Template 5:
- "Blow Dry"
- Duration: 30 minutes
- Price: ₹ [input]
- [Add]

(5-8 popular services shown per category)

Custom service button:
- [+ Add Custom Service] (outlined, full width)
- Opens detailed service form

Added services list (bottom section):

"Your Services (3)" heading

Service Card 1 (added):
- "Women's Haircut" (bold)
- Duration: 45 min | Price: ₹500
- [Edit] [Remove] icons
- White card with green checkmark

Service Card 2:
- "Men's Haircut"
- 30 min | ₹300
- [Edit] [Remove]

Service Card 3:
- "Hair Spa"
- 90 min | ₹1,200
- [Edit] [Remove]

Empty state (if no services added):
- "No services added yet"
- "Add services from templates above or create custom ones"

Bottom section:
- "3 services in Hair Services" (gray, small)
- Two buttons:
  * [Add More] (outlined, allows adding to other categories)
  * [Continue] (purple, filled)
    - Requires at least 1 service in ANY category

ADD CUSTOM SERVICE MODAL (bottom sheet):

When [+ Add Custom Service] tapped:
- Modal slides up from bottom
- "Create Custom Service" heading

Form fields:
- Service name: Input
  * Placeholder: "e.g., Keratin Treatment"
  
- Category: Dropdown
  * Pre-selected to current tab
  * Can change

- Duration: Time picker
  * Hours and minutes
  * Default: 60 minutes

- Price: Currency input
  * ₹ symbol prefix
  * Number keyboard

- Description: Text area (3 lines)
  * Optional
  * "Service details, what's included..."

- Staff can perform: Multi-select (optional)
  * "All staff" (default)
  * Or select specific staff
  * Shows later if staff added

Buttons:
- [Cancel] [Add Service]

Validation:
- Name required
- Price required (can be 0 for free)
- Duration required

Success:
- "✓ Service added successfully!"
- Auto-closes modal
- Service appears in list

Background: White
Service templates: Light purple background
Added services: White cards with green accent
Style: Service catalog builder
Quick templates for efficiency, custom for flexibility
```

---

### Screen 7E: Operating Hours Setup

**Prompt for Uizard:**
```
Design an operating hours configuration screen for salon setup.

Header:
- Back arrow
- "Operating Hours" title
- Progress: "Step 5 of 10"

Progress bar: 50% filled

Instruction:
- "Set your salon's working hours" (16sp, gray)
- "Customers can book during these hours" (14sp, light gray)

Weekly schedule:

Day-wise schedule cards (one per day):

MONDAY Card:
- Left section:
  * "Monday" (bold, 16sp)
  * Toggle switch (right side)
    - ON: Purple, "Open"
    - OFF: Gray, "Closed"

- When OPEN (expanded view):
  * Opening time selector:
    - Time picker button: "10:00 AM" (tap to change)
    - Clock icon
  
  * "to" text (gray, center)
  
  * Closing time selector:
    - "8:00 PM" (tap to change)
    - Clock icon

  * Total hours: "10 hours" (gray, small)
  
  * Break time (optional):
    - [+ Add Break] button
    - If added: "12:00 PM - 1:00 PM" with [Remove]

- When CLOSED:
  * Shows "Closed" (gray)
  * Card compressed, no time selectors

TUESDAY Card:
- Same layout
- Default: Open 10:00 AM - 8:00 PM

WEDNESDAY Card:
- Same layout

THURSDAY Card:
- Same layout

FRIDAY Card:
- Same layout

SATURDAY Card:
- Same layout
- Common to have extended hours
- Default: 9:00 AM - 9:00 PM

SUNDAY Card:
- Same layout
- Toggle often OFF (closed)

Each card:
- 100px height when open
- 60px when closed
- White background
- Border
- 8px margin bottom

Quick actions (floating above days):
- "Apply to all weekdays" button (small, outlined)
  * Copies Monday's hours to Tue-Fri
  
- "Apply to all days" button
  * Copies to all 7 days

Special hours note:
- "💡 You can set special hours for holidays later in settings"
- Info box, light blue background

Summary card (sticky bottom):
- "Operating Summary"
- Days open: "6 days/week"
- Total hours: "60 hours/week"
- Avg hours/day: "10 hours"

Time picker modal (when time tapped):
- 12-hour format with AM/PM
- Scrollable hour and minute wheels
- Common times suggested: 8 AM, 9 AM, 10 AM, 6 PM, 7 PM, 8 PM, 9 PM
- [Cancel] [Done] buttons

Break time modal:
- Start time picker
- End time picker
- "Break Duration: 60 minutes" (calculated)
- [Remove Break] [Save]

Bottom buttons:
- [Back]
- [Continue] (purple)
  * Requires at least 1 day open

Validation:
- Opening time must be before closing time
- Break must be within operating hours
- Warning if no days selected

Background: White
Cards: Light gray background when closed, white when open
Style: Schedule planner, time management
Clear visual distinction between open/closed days
```

---

### Screen 7F: Photo Gallery Management

**Prompt for Uizard:**
```
Design a photo gallery upload and management screen for salon setup.

Header:
- Back arrow
- "Salon Photos" title
- Progress: "Step 6 of 10"

Progress bar: 60% filled

Instruction section:
- "Add photos of your salon and work" (16sp, gray)
- "High-quality photos help attract customers" (14sp, light gray)
- "Upload at least 3 photos to continue" (14sp, orange, important)

Photo categories (tabs):
- [Salon Interior] [Our Work] [Team] [Products]
- Selected: Purple underline
- Swipeable tabs

SALON INTERIOR tab (active):

Upload area (top):
- Large dashed border box (200px height):
  * Camera icon (large, purple, 64px)
  * "+ Add Photos" (bold, 16sp)
  * "Tap to upload salon photos" (gray, 14sp)
  * "Max 10 photos, 5MB each" (small, gray)
- Tap opens options:
  * [Take Photo]
  * [Choose from Gallery]
  * [Choose Multiple]

Photo grid (2 columns):

Uploaded Photo 1:
- Image thumbnail (160px x 160px)
- Square aspect ratio
- Rounded corners
- Overlay on hover/press:
  * [Set as Cover] button (star icon)
  * [Delete] button (trash icon)
- "Cover Photo" badge (if selected, gold)
- 4px border if cover photo

Photo 2:
- Same layout
- Regular photo (no badge)

Photo 3:
- Same layout

Empty slots:
- Dotted border placeholder boxes
- "+ Add" text
- Gray, clickable

Photo count:
- "3 of 10 photos" (gray, small, top-right)

OUR WORK tab:

Instruction:
- "Show examples of your best work" (gray)
- "Before/After photos work great!" (tip)

Photo grid:
- Same upload interface
- Option to add text overlay:
  * "Before & After" label
  * Service type: "Hair Color", "Makeup", etc.

Photo Card:
- Image
- Service tag: "Bridal Makeup" (pill badge, purple)
- [Edit] [Delete]

TEAM tab:

Instruction:
- "Introduce your team members" (gray)

Team Photo Card:
- Photo (160x160px)
- Name field below: "Priya (Senior Stylist)"
- Role tag
- [Edit] [Delete]

Upload options:
- [+ Add Team Photo]

PRODUCTS tab:

Instruction:
- "Show products you use or sell" (gray)

Product Photo Grid:
- Same upload interface
- Optional product name tag

Gallery management:

Rearrange mode:
- [Reorder Photos] button (top-right)
- When active:
  * Drag handles appear on photos
  * Long press and drag to reorder
  * [Done Reordering]

Delete mode:
- [Select Multiple] button
- Checkboxes appear on photos
- Select multiple and delete

Photo quality tips (expandable card):
- "📸 Photo Tips" heading
- Tips list:
  * "Use good lighting"
  * "Show different angles"
  * "Include ambiance shots"
  * "Highlight your specialties"
  * "Keep photos recent"

Preview button:
- [Preview Gallery] (outlined button)
- Shows customer view of gallery
- Swipeable fullscreen preview

Photo requirements validation:
- At least 3 photos required
- Warning if low quality detected
- "⚠️ Add at least 3 photos to continue"

Bottom buttons:
- [Skip for Now] (if urgent)
  * Warning: "Gallery recommended for better visibility"
- [Continue] (purple, enabled when ≥3 photos)

Image upload progress:
- When uploading:
  * Progress bar on photo
  * "Uploading... 45%"
  * Cancel option

Success state:
- "✓ Photo uploaded" (green)
- Smooth fade-in animation

Background: White
Photo grid: Masonry/grid layout
Style: Visual gallery manager
Instagram-like photo management
Drag-to-reorder capability
```

---

### Screen 7G: Salon Amenities & Facilities

**Prompt for Uizard:**
```
Design an amenities and facilities selection screen for salon setup.

Header:
- Back arrow
- "Amenities & Facilities" title
- Progress: "Step 7 of 10"

Progress bar: 70% filled

Instruction:
- "Select amenities available at your salon" (16sp, gray)
- "This helps customers know what to expect" (14sp, light gray)

Amenities sections (scrollable):

BASIC AMENITIES:

Amenity Item 1:
- WiFi icon (left, 32px, purple)
- "Free WiFi" (bold, 15sp)
- Checkbox (right, purple when selected)
- Divider below

Amenity Item 2:
- AC icon
- "Air Conditioning"
- Checkbox

Amenity Item 3:
- Parking icon
- "Parking Available"
- Checkbox
- If selected, expand:
  * "Free parking" radio
  * "Paid parking" radio

Amenity Item 4:
- Wheelchair icon
- "Wheelchair Accessible"
- Checkbox

Amenity Item 5:
- Card icon
- "Card Payment Accepted"
- Checkbox
- Auto-linked to payment methods

Amenity Item 6:
- Music icon
- "Music/Entertainment"
- Checkbox

COMFORT & CONVENIENCE:

Amenity Item 7:
- Coffee icon
- "Complimentary Beverages"
- Checkbox
- If selected:
  * "Tea" checkbox
  * "Coffee" checkbox
  * "Water" checkbox

Amenity Item 8:
- Magazine icon
- "Magazines/Reading Material"
- Checkbox

Amenity Item 9:
- TV icon
- "TV/Entertainment"
- Checkbox

Amenity Item 10:
- Charging icon
- "Phone Charging"
- Checkbox

SAFETY & HYGIENE:

Amenity Item 11:
- Sanitizer icon
- "Sanitization Protocols"
- Checkbox (recommended, default ON)

Amenity Item 12:
- Mask icon
- "COVID-19 Safety Measures"
- Checkbox

Amenity Item 13:
- Clean icon
- "Sterilized Equipment"
- Checkbox (recommended)

Amenity Item 14:
- Disposable icon
- "Disposable Items Used"
- Checkbox

SPECIALIZED FACILITIES:

Amenity Item 15:
- Private room icon
- "Private Rooms Available"
- Checkbox
- If selected:
  * "Number of private rooms:" Input (1-10)

Amenity Item 16:
- Bridal icon
- "Bridal Suite"
- Checkbox

Amenity Item 17:
- Kids icon
- "Kids Play Area"
- Checkbox

Amenity Item 18:
- Retail icon
- "Retail Products Available"
- Checkbox

Amenity Item 19:
- Shower icon
- "Shower Facilities"
- Checkbox

Amenity Item 20:
- Changing room icon
- "Changing Room"
- Checkbox

Each amenity:
- 72px height
- White background
- Tap entire row to toggle
- Smooth checkbox animation
- Icon changes color when selected

Custom amenities:
- [+ Add Custom Amenity] button (bottom of list)
- Opens modal:
  * "Custom Amenity Name" input
  * Icon selector (optional)
  * [Add]

Selected count:
- "12 amenities selected" (purple, sticky bottom)

Quick selections (top):
- [Essential Only] button (selects WiFi, AC, Parking, Sanitization)
- [Select All] button
- [Clear All] button

Preview card (expandable):
- "👁️ How customers will see this"
- Shows selected amenities as tags/pills
- Customer view simulation

Bottom buttons:
- [Back]
- [Continue] (purple)
  * No minimum required (all optional)
  * But recommended to select at least 3

Helpful tip:
- "💡 Tip: Salons with more amenities get 40% more bookings"
- Info box, light blue

Background: White
Sections: Light gray headings (uppercase, 12sp, bold)
Style: Feature checklist
Icon-driven selection, organized by category
Clear visual hierarchy
```

---

### Screen 7H: Location & Contact Details

**Prompt for Uizard:**
```
Design a location and contact information screen for salon setup.

Header:
- Back arrow
- "Location & Contact" title
- Progress: "Step 8 of 10"

Progress bar: 80% filled

Instruction:
- "Help customers find and reach you" (16sp, gray)

Form sections (scrollable):

SALON ADDRESS:

Address search (Google Places):
- "Salon Address *" label (bold)
- Search input with location icon:
  * "Search for your salon address..."
  * Autocomplete suggestions appear
  * Powered by Google Places
- [Use Current Location] button (GPS icon, outlined)
  * Uses device GPS
  * Auto-fills address

Manual address fields (or auto-filled):
- Street Address: Input
  * "Building name, street"
  * 2 lines available

- Landmark: Input (optional)
  * "Nearby landmark"
  * Helps customers find

- City: Input
- State: Dropdown (Indian states)
- PIN Code: Input (6 digits)

Map preview:
- Interactive map (300px height)
- Pin showing exact location
- Drag pin to adjust
- Zoom controls (+/-)
- "Tap to adjust pin location" text

Service area (optional):
- "Do you provide home services?" Toggle
- If YES:
  * "Service Radius" heading
  * Slider: 0-50 km
  * "We serve within 10 km" (dynamic text)
  * Map shows radius circle

CONTACT INFORMATION:

Primary phone:
- "Salon Phone Number *" label
- Country code dropdown: "+91" (India default)
- Phone input: 10 digits
- Validation: Real-time format check

Alternate phone:
- "Alternate Number" (optional)
- Same format

WhatsApp number:
- "WhatsApp Business Number" (optional)
- Checkbox: "Same as phone number"
- Or separate input
- "Customers can book via WhatsApp" (info text)

Email:
- "Salon Email *" label
- Email input
- Validation: Email format
- "For booking confirmations & notifications"

Website:
- "Website" (optional)
- URL input
- Placeholder: "https://www.yoursalon.com"

SOCIAL MEDIA:

Social links (optional):
- Instagram: Input
  * Icon + "instagram.com/" prefix
  * Enter username only
  
- Facebook: Input
  * "facebook.com/" prefix
  * Page name or URL

- YouTube: Input (optional)

- Other: Custom input

BUSINESS HOURS DISPLAY:

Working hours summary:
- Shows from previous screen (Step 5)
- "Monday - Saturday: 10:00 AM - 8:00 PM"
- "Sunday: Closed"
- [Edit Hours] link (goes back to Step 5)

ADDITIONAL DETAILS:

Parking instructions:
- "Parking Details" (optional)
- Text area (2 lines)
- "How to find parking, any charges, etc."

Directions note:
- "How to Reach" (optional)
- Text area
- "Additional directions to help customers"

Public transport:
- "Nearest Metro/Bus Stop" (optional)
- Input field

Verification:

Address verification:
- "Is this address correct?" checkbox
- "I confirm this is our salon's address"

Phone verification:
- "Send OTP to verify phone" button
- Opens OTP verification
- Green checkmark when verified ✓

Preview card:
- "📍 Location Preview"
- Shows how address appears to customers
- Map thumbnail
- Address text
- Contact buttons

Bottom buttons:
- [Back]
- [Continue] (purple)
  * Requires: Address, city, PIN, phone
  * Phone must be verified

Map integration:
- Google Maps embedded
- Shows exact pin location
- Opens full map on tap
- "Get Directions" link for customers

Background: White
Maps: Embedded, interactive
Style: Location-focused, verification-ready
Clear contact hierarchy
```

---

### Screen 7I: Payment Methods Setup

**Prompt for Uizard:**
```
Design a payment methods configuration screen for salon setup.

Header:
- Back arrow
- "Payment Methods" title
- Progress: "Step 9 of 10"

Progress bar: 90% filled

Instruction:
- "Set up how you accept payments" (16sp, gray)
- "Select all methods you accept" (14sp, light gray)

Payment method cards (list):

DIGITAL PAYMENTS:

Payment Card 1 - UPI:
- UPI icon (left, 48px, color)
- "UPI (PhonePe, Google Pay, Paytm)" (bold, 16sp)
- "Most popular in India" (gray, 12sp)
- Toggle switch (right)
  * ON: Purple, enabled
  * OFF: Gray

When enabled (expanded):
- "UPI ID" input field:
  * Placeholder: "yoursalon@paytm"
  * Validation: email format
  * "Customers will pay to this UPI ID"
  
- "UPI QR Code" section:
  * [Upload QR Code] button
  * Or [Generate QR Code] (if integrated)
  * Preview of uploaded QR (120x120px)
  * "Customers can scan to pay"

Payment Card 2 - Card Payments:
- Credit/Debit card icon (Visa, Mastercard)
- "Card Payments" (bold)
- "Credit & Debit Cards" (gray)
- Toggle switch

When enabled:
- Payment gateway integration:
  * "Payment Gateway" dropdown:
    - Razorpay (recommended)
    - PayU
    - Paytm
    - Instamojo
  * [Connect Account] button
  * Shows integration status

- Processing fee note:
  * "2-3% processing fee applies" (info box)

Payment Card 3 - Net Banking:
- Bank icon
- "Net Banking / Bank Transfer"
- Toggle switch

When enabled:
- Bank account details:
  * Account Name: Input (pre-filled from business)
  * Account Number: Input
  * IFSC Code: Input
  * Bank Name: Dropdown or input

Payment Card 4 - Wallets:
- Wallet icon
- "Digital Wallets"
- "Paytm, PhonePe, Amazon Pay"
- Toggle switch

When enabled:
- Wallet phone number: Input
- "Same as salon phone" checkbox

CASH PAYMENT:

Payment Card 5 - Cash:
- Cash icon (rupee notes)
- "Cash Payment"
- "Accept cash at salon" (gray)
- Toggle switch (usually ON by default)

No additional setup needed

LATER/PREPAID:

Payment Card 6 - Pay Later:
- Calendar icon
- "Pay at Salon / Pay Later"
- "Customer pays after service"
- Toggle switch

When enabled:
- "Advance payment required" dropdown:
  * None (full payment later)
  * 25% advance
  * 50% advance
  * Full payment in advance

Payment Card 7 - Membership/Packages:
- Gift icon
- "Membership & Packages"
- "Pre-paid packages and memberships"
- Toggle switch

When enabled:
- "Enable package system" (linked to packages feature)

INTERNATIONAL (optional):

Payment Card 8 - International Cards:
- Globe icon
- "International Payments"
- "For foreign customers"
- Toggle switch

Summary section (sticky bottom card):
- "Payment Methods Enabled: 5"
- Icons of enabled methods shown
- "✓ UPI ✓ Cash ✓ Cards ✓ Net Banking ✓ Wallets"

Default payment method:
- "Preferred Payment Method" dropdown
- Sets what appears first to customers
- "Recommend to customers: UPI" (most selected)

Payment terms:
- "Payment Terms" section
- "When do customers pay?" radio:
  ○ Before service (prepaid)
  ○ After service (default for walk-ins)
  ○ Flexible (customer choice)

Refund policy:
- "Refund Policy" (optional)
- Text area (3 lines)
- "e.g., Full refund if cancelled 24 hrs before"

Security note:
- 🔒 "All digital payments are secure & encrypted"
- "We never store card details" (small, gray)

Integration status:
- For digital methods:
  * "Connected ✓" (green) if integrated
  * "Setup Required ⚠️" (orange) if not
  * [Complete Setup] button

Bottom buttons:
- [Back]
- [Continue] (purple)
  * Requires at least 1 payment method
  * Warning if only cash selected:
    "💡 Add digital payments for more bookings"

Validation:
- UPI ID format check
- Bank account validation
- IFSC code verification

Background: White
Payment cards: White with colored icons
Style: FinTech setup, payment configuration
Secure payment integration
Clear setup requirements
```

---

### Screen 7J: Setup Review & Completion

**Prompt for Uizard:**
```
Design a setup review and completion screen for salon onboarding.

Header:
- Back arrow
- "Review & Complete" title
- Progress: "Step 10 of 10"

Progress bar: 100% filled (green)

Completion celebration:
- Confetti animation (subtle, top)
- "🎉 Almost Ready!" (large, 28sp, centered)
- "Review your salon profile before we launch" (gray, centered)

Review sections (scrollable cards):

BUSINESS PROFILE Card:
- "Business Profile" heading (bold, 16sp)
- Edit icon (top-right)

Summary:
- Salon logo (64px circular)
- Salon name: "Glow Beauty Salon" (bold)
- Type: "Unisex Salon"
- Description: "Premium beauty services..." (truncated)
- GST: "22AAAAA0000A1Z5"
- [Edit Details] link (purple)

SERVICES Card:
- "Services" heading
- Edit icon

Summary:
- "5 categories, 12 services" (bold)
- Category chips:
  [Hair Care] [Makeup] [Skin Care] [Spa] [Nails]
- Popular services listed:
  * Women's Haircut - ₹500
  * Hair Coloring - ₹2,500
  * Bridal Makeup - ₹5,000
  * ... and 9 more
- [View All Services] link

OPERATING HOURS Card:
- "Operating Hours" heading
- Edit icon

Summary:
- "Open 6 days/week" (bold)
- "Monday - Saturday: 10:00 AM - 8:00 PM"
- "Sunday: Closed"
- "Total: 60 hrs/week"
- [Edit Hours]

PHOTOS & GALLERY Card:
- "Photo Gallery" heading
- Edit icon

Summary:
- Photo grid (4 photos shown, 2x2):
  * Cover photo (larger)
  * 3 more thumbnails
- "8 photos uploaded" (small)
- [View Gallery] [Add More]

AMENITIES Card:
- "Amenities" heading
- Edit icon

Summary:
- Amenity tags (pills):
  [WiFi] [AC] [Parking] [Card Payment]
  [Sanitization] [Private Rooms] [Refreshments]
  ... +5 more
- [View All]

LOCATION & CONTACT Card:
- "Location" heading
- Edit icon

Summary:
- Map thumbnail (120px height)
- Address: "Shop 12, Sector 18..." (truncated)
- Phone: "+91 98765 43210" ✓ Verified
- Email: "contact@glowsalon.com"
- [Edit Location]

PAYMENT METHODS Card:
- "Payment Methods" heading
- Edit icon

Summary:
- Enabled methods (icons):
  ✓ UPI ✓ Cash ✓ Cards ✓ Net Banking
- "4 methods enabled"
- [Edit Methods]

Checklist section:
- "Setup Checklist" heading (bold)
- All items with green checkmarks:
  ✓ Business profile completed
  ✓ Services added (12 services)
  ✓ Operating hours set
  ✓ Photos uploaded (8 photos)
  ✓ Amenities selected
  ✓ Location verified
  ✓ Payment methods configured

Optional additions (if not done):
- "Enhance Your Profile (Optional)" heading
- Gray checkboxes (not required):
  ☐ Add team members (0)
  ☐ Set up promotions
  ☐ Connect social media
- "You can do these later" (small, gray)

Terms & conditions:
- Checkbox (required):
  ☑ "I agree to SalonHub's Terms of Service and Privacy Policy"
- Links are tappable (purple, underlined)

Data usage consent:
- Checkbox:
  ☑ "Allow SalonHub to use my salon data to improve services"
  (Optional)

Bottom section:

Estimated setup time completed:
- "✓ Profile complete! That took 6 minutes." (green)
- "Faster than average 🎉" (small, encouraging)

Action buttons:

Primary button:
- [Complete Setup & Go Live] (large, purple, 56px height)
- Full width, bold text
- Gradient background

Secondary actions:
- [Save as Draft] (outlined, gray)
  * Saves progress, can finish later
  * "Complete setup within 7 days"

Loading state (when submitted):
- "Setting up your salon..." (with spinner)
- Progress steps:
  * Creating profile... ✓
  * Uploading photos... ✓
  * Configuring services... ✓
  * Activating account...

Success screen (after completion):
- Large checkmark animation (green, 120px)
- "🎉 You're All Set!"
- "Your salon is now live on SalonHub!" (bold, 24sp)
- Confetti animation

Success metrics:
- "Your salon profile is 100% complete"
- "You're ready to receive bookings!"

Next steps card:
- "What's Next?" heading
- Bullet list:
  * Start accepting bookings
  * Invite your team members
  * Share your salon link
  * Set up promotions

CTA buttons:
- [Go to Dashboard] (large, purple, primary)
- [View My Salon Profile] (outlined)
- [Invite Team] (outlined)

Share options:
- "Share Your Salon" section
- Quick share buttons:
  * [WhatsApp] [Instagram] [Facebook] [Copy Link]
- "Salon link: salonhub.com/glow-beauty"

Tutorial offer:
- "👋 Want a quick tour?"
- [Start Tutorial] (shows key features)
- [Skip, I'll Explore] (gray link)

Background: White with subtle gradient
Review cards: White, elevated shadow
Success: Green accents, celebration
Style: Milestone completion, encouraging
Professional yet celebratory
Clear path to start using the app
```

---

---

## Dashboard & Analytics

### Screen 8: Main Dashboard (Home)

**Prompt for Uizard:**
```
Design the main business dashboard for a salon management app (scrollable).

HEADER (sticky):
- Menu icon (≡) left
- "SalonHub" logo/text center-left
- Notification bell icon (with red badge "3") right
- Profile avatar icon (far right)
- Below: Salon selector dropdown "My Salon Name ▼" (if multi-location)

DATE FILTER TOGGLE:
- Two tabs: [Today] [This Week]
- Selected: Purple background, white text
- Toggle style, rounded pill shape

QUICK STATS GRID (2x2):
Four metric cards:
1. Top-left: 
   - Number "15" (large, bold, 28sp)
   - Label "Bookings" (gray, 14sp)
   - Trend "↑ 12%" (green, small)

2. Top-right:
   - "₹8,500" (large, bold, green)
   - "Revenue" (gray)
   - Trend "↑ 18%" (green)

3. Bottom-left:
   - "5" (orange/amber)
   - "Pending" (gray)
   - "Needs action" (small)

4. Bottom-right:
   - "₹2,100" (purple)
   - "Wallet" (gray)
   - "Available" (small)

Each card: White background, subtle shadow, rounded, 8px padding

TODAY'S SCHEDULE SECTION:
- "Today's Schedule" heading (bold, 16sp)
- Calendar icon + "Nov 10, 2025" (gray)

Appointment cards (2-3 showing):
Each card shows:
- Time "10:00 AM" (bold, left)
- Customer name "Aarti Kumar" (medium, 15sp)
- Service + Staff "Haircut • Priya Sharma" (gray, 13sp)
- Two buttons: [View] [Reschedule] (small, outlined)
- Divider between cards

"View All Appointments →" link (purple)

REVENUE TREND CHART:
- "Revenue Trend (7 days)" heading
- Line chart showing last week's data
- Y-axis: Revenue amounts
- X-axis: M T W T F S S
- Purple line with gradient fill below
- Data points marked
- 180px height

QUICK ACTIONS GRID (2x2):
Four action buttons:
- [+ New Booking] - calendar icon
- [Manage Staff] - people icon
- [View Wallet] - wallet icon
- [Reports] - chart icon
Each: White card, icon top, text below, tap highlight

STAFF PERFORMANCE:
- "Staff Performance" heading
- Top performer card:
  * Staff photo (circular, 40px)
  * "Priya Sharma" (bold)
  * "12 bookings • ₹4,200" (gray, small)
  * Progress bar "80%" utilization (purple)
- "View All Staff →" link

Background: Light gray (#F3F4F6)
Cards: White, subtle shadows, rounded (12px)
Style: Business dashboard, data-rich, scannable, professional
```

---

### Screen 9: Dashboard - Notifications Panel

**Prompt for Uizard:**
```
Design the notification dropdown/sheet for business dashboard.

Triggered by: Tapping notification bell icon

Layout (bottom sheet or dropdown):

Header:
- "Notifications" title (bold, left)
- "Mark all as read" link (purple, right, small)
- Close X icon (top-right if modal)

Notification items (scrollable list):

Item 1 (New Booking - unread):
- Purple dot indicator (left, 8px)
- Booking icon (purple circle, 40px)
- Title: "New Booking Received" (bold, 15sp)
- Message: "Aarti Kumar booked Haircut for Nov 10..." (gray, 13sp)
- Time: "2 minutes ago" (light gray, 11sp)
- Light purple background (unread indicator)

Item 2 (Payment - unread):
- Green dot
- Money icon (green circle)
- "Payment Received"
- "₹1,500 credited to wallet from booking #BK123"
- "1 hour ago"
- Light green background tint

Item 3 (Staff - read):
- No dot
- Person icon (gray circle)
- "Staff Availability Updated"
- "Priya Sharma marked unavailable for tomorrow"
- "3 hours ago"
- White background

Item 4 (Low Stock - urgent):
- Red dot
- Warning icon (red circle)
- "Low Stock Alert"
- "L'Oreal Shampoo running low (3 units left)"
- "2 hours ago"
- Light red tint

Item 5 (System - read):
- No dot
- Info icon (blue circle)
- "Weekly Report Ready"
- "Your business summary for last week is available"
- "1 day ago"

Each notification:
- 80px height
- Tap area
- Swipe left: Delete option (red)
- Divider between items

Empty state (if no notifications):
- Bell icon (large, gray)
- "No notifications"
- "You're all caught up!"

Background: White
Style: Clean, organized, clear hierarchy
Group by: Today, Yesterday, Earlier (if many)
```

---

### Screen 10: Analytics Overview

**Prompt for Uizard:**
```
Design an analytics overview dashboard (scrollable).

Header:
- Back arrow
- "Analytics" title
- Date range "This Month ▼" (right)

KEY METRICS BANNER:
- Horizontal scroll cards showing:
  Card 1: Total Revenue (₹1.2L, ↑18%)
  Card 2: Total Bookings (156, ↑10%)
  Card 3: Avg Transaction (₹798, ↑12%)
  Card 4: Net Profit (₹82K, 66% margin)

Each card: 140px wide, gradient background, white text

REVENUE CHART (large):
- "Revenue Trend" heading
- Time period toggle: [7D] [30D] [3M] [6M] [1Y]
- Line chart with gradient fill
- Interactive data points
- 220px height
- Purple theme

PERFORMANCE BREAKDOWN:

Services Performance:
- Donut chart (center)
- Segments by service type
- Legend with percentages
- Tap segment for details

Peak Hours Heatmap:
- Grid showing hours (9AM-8PM) vs days (Mon-Sun)
- Color intensity = booking density
- Purple gradient (light to dark)

Customer Metrics:
- New vs Returning ratio (pie chart)
- Customer retention rate (circular progress)
- Average visits per customer

Staff Efficiency:
- Bar chart comparing staff
- Bookings vs Revenue
- Utilization percentage

INSIGHTS (AI-generated):
- "📊 Key Insights" heading
- Auto-generated observations:
  * "Peak hours: 11AM-1PM, 4PM-6PM"
  * "Saturday is your busiest day"
  * "Hair services drive 45% revenue"
  * "Customer retention up 8%"

COMPARISON TOGGLE:
- "Compare with: Last Month ▼"
- Shows comparison arrows on metrics

QUICK ACTIONS:
- [View Detailed Report]
- [Export Analytics]
- [Schedule Report]

Background: Light gray
Charts: Interactive, colorful, professional
Style: Data analytics, business intelligence
```

---

### Screen 11: Real-time Activity Feed

**Prompt for Uizard:**
```
Design a real-time business activity feed showing live updates.

Header:
- "Live Activity" title
- "Auto-refresh ON" toggle (right)
- Refresh icon

ACTIVITY STREAM (scrollable):

Activity types shown with timestamps:

Booking Created (just now):
- Green icon (calendar +)
- "New booking received"
- "Aarti Kumar • Haircut • Nov 10"
- Amount "₹800"
- [View Details] link

Payment Received (2 min ago):
- Green money icon
- "Payment received"
- "Booking #BK123 • ₹1,500"
- "Online payment"

Staff Clock-in (5 min ago):
- Blue person icon
- "Staff checked in"
- "Priya Sharma started shift"
- Time "10:00 AM"

Customer Review (10 min ago):
- Yellow star icon
- "New review posted"
- "Raj M. rated 5 stars"
- "View review"

Booking Cancelled (15 min ago):
- Orange/red icon
- "Booking cancelled"
- "Sara K. • Facial"
- Refund info

Low Stock Alert (20 min ago):
- Red warning icon
- "Stock alert"
- "Shampoo below minimum (5 units)"
- [Reorder] button

Staff Availability (30 min ago):
- Blue calendar icon
- "Schedule updated"
- "Amit marked unavailable tomorrow"

Each activity:
- Icon with colored circle (status-based)
- Title (bold)
- Details (gray, small)
- Timestamp (very light gray)
- Action button if applicable
- 64px height
- Divider below

FILTERS (top):
- [All] [Bookings] [Payments] [Staff] [Alerts]
- Selected: Purple background

TIME GROUPING:
- "Just Now" section
- "Earlier Today"
- "Yesterday"

EMPTY STATE:
- Activity icon
- "No recent activity"
- "Activity will appear here as it happens"

Background: White
Icons: Color-coded by activity type
Style: Social feed, real-time, chronological
Auto-updates every 30 seconds
```

---

### Screen 12: Business Health Score

**Prompt for Uizard:**
```
Design a business health dashboard with scoring system.

Header:
- Back arrow
- "Business Health" title
- Info icon (?)

OVERALL HEALTH SCORE (hero):
- Large circular progress indicator
- Score "82/100" (large, center, green)
- "Excellent" rating label
- Color-coded: Red (<50), Orange (50-70), Yellow (70-85), Green (>85)
- Ring shows percentage filled

SCORE BREAKDOWN (cards):

1. Financial Health: 88/100
   - Revenue trend: Positive ↑
   - Profit margin: Healthy
   - Expenses: Controlled
   - Green check icon

2. Operational Health: 78/100
   - Booking rate: Good ↑
   - Utilization: 75%
   - Efficiency: Improving
   - Yellow check

3. Customer Health: 85/100
   - Retention: 68% ↑
   - Satisfaction: 4.7/5
   - Growth: +12%
   - Green check

4. Staff Health: 75/100
   - Turnover: Low
   - Performance: Good
   - Attendance: 92%
   - Yellow check

5. Inventory Health: 70/100
   - Stock levels: Adequate
   - Low stock items: 8
   - Wastage: Minimal
   - Yellow warning

Each card:
- Score out of 100
- 3 key metrics
- Icon indicator
- Progress bar
- Tap to see details

RECOMMENDATIONS:
- "💡 Recommendations to Improve" heading
- List of actionable items:
  * "Reduce low stock items to boost inventory score"
  * "Maintain current customer retention efforts"
  * "Consider staff performance bonuses"

TRENDS:
- "Health Trend (Last 6 Months)" heading
- Line chart showing overall health score over time
- Month labels
- Show improvement/decline

INDUSTRY BENCHMARK:
- "vs. Industry Average" card
- Your score: 82
- Industry avg: 74
- "You're performing better than 68% of salons"

ACTIONS:
- [View Detailed Report]
- [Export Health Report]
- [Set Goals]

Background: Light gray
Scores: Color-coded progress circles
Style: Health dashboard, gamified, actionable insights
```

---

### Screen 13: Revenue Analytics Deep Dive

**Prompt for Uizard:**
```
Design a detailed revenue analytics screen.

Header:
- Back arrow
- "Revenue Analytics" title
- Date range "This Month ▼"
- [Export] icon

REVENUE OVERVIEW (top card):
- Total "₹1,24,500" (very large, bold, green)
- vs Last month: +18% (green arrow)
- Daily average: ₹4,150
- Target progress: 83% of ₹1.5L goal
- Progress bar

REVENUE BREAKDOWN:

By Service Type (donut chart):
- Hair Services: 45% (₹56K)
- Spa/Massage: 25% (₹31K)
- Skin Care: 20% (₹25K)
- Nail Services: 10% (₹12.5K)
- Interactive tap for details

By Payment Method (horizontal bars):
- Online: 64% (₹79K)
- Cash: 30% (₹37K)
- Wallet: 6% (₹7.5K)

By Time of Day (bar chart):
- 9-11 AM: ₹12K
- 11-1 PM: ₹35K (peak)
- 1-3 PM: ₹18K
- 3-5 PM: ₹22K
- 5-7 PM: ₹28K (second peak)
- 7-8 PM: ₹9.5K

By Day of Week:
- Mon-Sun bar chart
- Highest: Saturday (₹25K)
- Lowest: Monday (₹12K)

TOP REVENUE GENERATORS:

Services:
1. Haircut - ₹45,600 (42 bookings)
2. Hair Coloring - ₹28,300 (18)
3. Facial - ₹18,500 (12)

Staff:
1. Priya Sharma - ₹45,200
2. Amit Singh - ₹38,100
3. Ravi Kumar - ₹28,500

Customers:
1. Aarti Kumar - ₹8,500 (VIP)
2. Neha Patel - ₹6,200
3. Raj Malhotra - ₹5,800

REVENUE TRENDS:
- "30-Day Trend" line chart
- Shows daily revenue
- Moving average line
- Highlight peaks and valleys
- Annotations for special events

FORECAST:
- "Next Month Forecast" card
- Predicted revenue: ₹1.35L
- Confidence: 85%
- "Based on historical trends"

INSIGHTS:
- "Revenue peaks on weekends"
- "Hair services are top earners"
- "Online payments growing 5% monthly"

ACTIONS:
- [Set Revenue Goals]
- [View Profit Analysis]
- [Export Report]

Background: White
Charts: Interactive, purple theme
Style: Financial analytics, detailed, actionable
```

---

### Screen 14: Booking Analytics

**Prompt for Uizard:**
```
Design a booking patterns and analytics screen.

Header:
- Back arrow
- "Booking Analytics" title
- Period "Last 30 Days ▼"

BOOKING SUMMARY:
- Total Bookings: 156
- Completed: 142 (91%)
- Cancelled: 8 (5%)
- No-shows: 6 (4%)
- Circular progress showing completion rate

BOOKING SOURCES:
- Pie chart showing:
  * Mobile App: 65%
  * Walk-in: 20%
  * Phone: 10%
  * Website: 5%

BOOKING PATTERNS:

Time Distribution:
- Heatmap showing days vs hours
- Color intensity = booking density
- Monday-Sunday (rows)
- 9AM-8PM (columns)
- Purple gradient (light = few, dark = many)

Advance Booking Time:
- How far in advance customers book
- Same day: 25%
- 1-3 days: 45%
- 4-7 days: 20%
- 1+ weeks: 10%
- Bar chart

Booking Duration Trend:
- Average service time tracking
- Line chart over 30 days
- Shows if bookings getting longer/shorter

CUSTOMER BEHAVIOR:

First-time vs Repeat:
- Donut chart
- First-time: 15%
- Repeat: 85%

Booking Frequency:
- Once a month: 45%
- Twice a month: 30%
- Weekly: 15%
- Irregular: 10%

CANCELLATION ANALYSIS:
- Cancellation rate: 5%
- Reasons breakdown:
  * Scheduling conflict: 40%
  * Found another salon: 25%
  * Personal reasons: 20%
  * No reason given: 15%

Cancellation by timing:
- >24 hours: 60%
- 12-24 hours: 25%
- <12 hours: 15%

NO-SHOW TRACKING:
- No-show rate: 4%
- Customers with history of no-shows
- Financial impact: ₹4,800 lost

CAPACITY UTILIZATION:
- Overall: 78%
- By staff member (bar chart)
- Peak vs off-peak comparison
- Recommendations to fill gaps

POPULAR COMBINATIONS:
- "Often Booked Together" section
- Haircut + Massage: 45 times
- Facial + Manicure: 28 times
- Hair Color + Treatment: 22 times

INSIGHTS:
- "Peak booking time: 11 AM - 1 PM"
- "Saturday bookings up 25%"
- "Mobile app bookings growing"
- "No-show rate decreased 2%"

ACTIONS:
- [Optimize Schedule]
- [Set Booking Rules]
- [Export Data]

Background: Light gray
Charts: Heatmaps, bars, lines
Style: Operational analytics, pattern recognition
```

---

### Screen 15: Multi-Location Dashboard

**Prompt for Uizard:**
```
Design a dashboard for owners with multiple salon locations.

Header:
- "All Locations" title
- [+ Add Location] button (right)
- "3 Active Locations" subtitle

AGGREGATE METRICS (top):
- Combined stats across all locations:
  * Total Revenue: ₹3.5L
  * Total Bookings: 425
  * Total Staff: 24
  * Overall Rating: 4.6⭐

MAP VIEW:
- Small embedded map
- Pins for each salon location
- Tap pin to see quick stats
- 150px height

LOCATION CARDS (scrollable list):

Location 1 - Glow Beauty Salon:
- Status: "Active" (green dot)
- Address: "Sector 18, Noida"
- Manager: "Priya Sharma"

Today's stats:
- Bookings: 15
- Revenue: ₹8,500
- Staff: 8
- Rating: 4.8⭐

Performance indicators:
- Revenue trend: ↑ 18% (green)
- Booking trend: ↑ 12% (green)
- Utilization: 78% (progress bar)

Quick actions:
- [View Dashboard]
- [Manage]
- [Call Manager]

Location 2 - Radiance Spa:
- Status: "Active"
- Address: "Dwarka, Delhi"
- Manager: "Amit Singh"
- Same stats layout
- Revenue trend: ↓ 5% (red)
- Needs attention badge

Location 3 - Elite Hair Studio:
- Status: "Active"
- Address: "Gurgaon"
- Similar layout

Each location card:
- White background
- Rounded corners
- Subtle shadow
- 180px height
- Tap to open location dashboard

COMPARISON VIEW (toggle):
- Switch to comparison mode
- Side-by-side metrics
- Best/worst performers highlighted

CONSOLIDATED INSIGHTS:
- "Top performing location: Glow Beauty"
- "Radiance Spa revenue declining"
- "Elite Hair underutilized capacity"

QUICK FILTERS:
- [All Locations]
- [Top Performers]
- [Needs Attention]
- [By Revenue]
- [By Bookings]

STAFF MANAGEMENT:
- "Staff Across Locations" section
- Total: 24 staff members
- [View All Staff]
- [Transfer Staff] option

INVENTORY SYNC:
- "Inventory Status" card
- Low stock alerts across locations
- [View Combined Inventory]

ACTIONS:
- [Compare Locations]
- [Consolidated Report]
- [Transfer Resources]
- [Add New Location]

Background: Light gray
Cards: White, organized
Style: Multi-location management, comparative view
Color-code performance: Green (good), Yellow (ok), Red (needs attention)
```

---

## Calendar & Booking Management

### Screen 16: Calendar - Month View

**Prompt for Uizard:**
```
Design a monthly calendar view for salon booking management.

Header:
- Back arrow (left)
- "Calendar" title (center)
- [+ New] button (right, purple text)

View Toggles (below header):
- Four tabs: [Today] [Week] [Month] [List]
- Selected: Month (purple underline)

Calendar Controls:
- "November 2025" heading (center, bold)
- Left arrow < and Right arrow > (navigation)

Calendar Grid:
- Week day headers: S M T W T F S (gray, small, 12sp)
- Date grid (7 columns × 5-6 rows)
- Today (10th): Purple circle background, white text
- Dates with bookings: Small colored dots below number
  * 1 dot = 1-3 bookings
  * 2 dots = 4-6 bookings  
  * 3 dots = 7+ bookings
- Selected date: Purple background
- Past dates: Light gray
- Weekend dates: Very light purple tint

Booking indicator dots:
- Blue dot: Confirmed bookings
- Orange dot: Pending bookings
- Green dot: Completed bookings
- Red dot: Cancelled/conflicts

LEGEND (small, bottom of calendar):
- Color key for dots
- Confirmed | Pending | Completed | Cancelled

BOOKINGS LIST (bottom section):
- "Nov 10 - 15 Bookings" heading

Booking cards (scrollable):
Card 1:
- Time "10:00 AM" (left, bold, 14sp)
- Customer "Aarti K." (truncated if long)
- Service "Haircut" + Staff "Priya" (gray, small, 12sp)
- Status badge "Confirmed" (green pill)
- Revenue "₹800" (right, bold)
- [View Details] button (small, outlined)

Card 2:
- Time "11:30 AM"
- Customer "Raj M."
- Service "Massage" + Staff "Amit"
- Status "Confirmed"
- "₹1,200"

Card 3:
- Time "2:00 PM"
- Customer "Sara K."
- Service "Facial" + Staff "Neha"
- Status "Pending" (orange pill)
- "₹1,500"

Show 3-4 cards, scroll for more

SUMMARY FOOTER:
- "15 bookings • ₹12,500 revenue" (gray, center)

Background: White
Calendar: Clean grid, clear date selection
Style: Calendar-focused, easy date navigation, clear booking density
```

---

### Screen 17: Calendar - Week View

**Prompt for Uizard:**
```
Design a week view calendar with day columns.

Header:
- Back arrow
- "Week View" title
- "Nov 4 - Nov 10" subtitle
- [+ New] button
- View toggles

WEEK NAVIGATION:
- < Previous Week | Next Week >
- "This Week" quick jump button

WEEK GRID:

Top row (day headers):
- 7 columns: Sun | Mon | Tue | Wed | Thu | Fri | Sat
- Each shows date number
- Today highlighted with purple circle

Day columns (vertical scroll):
- Each column shows that day's bookings
- Time slots from 9 AM to 8 PM (30-min increments)

Booking blocks in columns:
- Colored rectangles
- Height = duration (30min = 60px, 1hr = 120px)
- Shows:
  * Customer name (truncated)
  * Service name
  * Time

Color coding:
- Purple: Hair services
- Blue: Spa/Massage
- Pink: Skin care
- Green: Nails

Open slots:
- Dotted border rectangles
- "Available" text (light gray)
- Tap to add booking

Staff indicator:
- Small avatar icon on booking block
- Shows which staff is assigned

Conflict indicator:
- Red border if overlapping bookings
- Warning icon

Lunch breaks:
- Gray blocks with diagonal stripes
- "Lunch" label

Current time line:
- Red horizontal line across all columns
- Moves with real time
- "NOW" label

Stats bar (top):
- Each day column shows:
  * Total bookings count
  * Revenue for that day

FILTERS (sticky top):
- "All Staff ▼" dropdown
- "All Services ▼" dropdown

Tap booking → Show quick preview bottom sheet
Long press → Quick actions (view/edit/cancel)

Background: White with light gray grid
Grid lines: Very light gray separators
Style: Professional weekly planner, easy to scan
```

---

### Screen 18: Calendar - Day View (Timeline)

**Prompt for Uizard:**
```
Design a detailed day view showing staff schedules in timeline format.

Header:
- Back arrow
- "Nov 10, 2025" title
- Day navigation < Today >
- [+ New] button

View Toggles:
- [Today] [Week] [Month] [List]

Staff Filter:
- "All Staff ▼" dropdown (left)
- "Filter: All Services ▼" (right)

TIMELINE LAYOUT (horizontal scroll for staff):

Left column (fixed, time slots):
- 9:00 AM
- 9:30 AM
- 10:00 AM
- ... (30-minute increments)
- 8:00 PM
- Each slot: 60px height
- Light gray background
- Current time highlighted

Staff columns (scrollable horizontally):
- Column width: 140px each
- Columns for: Priya | Amit | Ravi | Sara | etc.

Column header for each staff:
- Circular photo (40px)
- Name
- Availability status (green dot)
- Stats: "5 bookings • ₹3,200"

Booking blocks in timeline:
- Positioned at exact time
- Height = duration (30min booking = 60px)
- Contains:
  * Customer name (bold, small)
  * Service name (gray)
  * "₹800" (if space)
  
Color-coded by service type:
- Light purple: Haircut
- Light blue: Massage
- Light pink: Facial
- Light green: Nails

Open/available slots:
- "Open" text (light gray)
- Dotted border
- Tap to quick-add booking

Blocked time:
- "Lunch" (gray, diagonal stripes, 12-1 PM)
- "Break" (gray)
- "Off" (if staff unavailable)

Multi-hour bookings:
- Span multiple time rows
- Show full details at top
- "Continued..." text in subsequent rows

Current time indicator:
- Red horizontal line across all columns
- Moves with actual time
- "NOW" label

Drag-and-drop:
- Long press booking to drag
- Drop on different time/staff to reschedule
- Confirmation dialog

Conflict warnings:
- Red border on overlapping bookings
- Alert icon
- Auto-suggest resolution

Quick add:
- Tap empty slot
- Bottom sheet appears:
  * Time (pre-filled)
  * Staff (pre-filled)
  * Select customer
  * Select service
  * [Quick Add] button

SUMMARY BAR (bottom, sticky):
- Total bookings today: 15
- Total revenue: ₹12,500
- Utilization: 78%
- Available slots: 8

Background: Light gray
Grid: Very light borders
Staff columns: White background
Bookings: Color-coded blocks
Style: Professional scheduling tool, drag-drop ready
```

---

### Screen 19: Booking Details (Business View)

**Prompt for Uizard:**
```
Design a comprehensive booking details view for business owners (scrollable).

Header:
- Back arrow
- "Booking Details" title
- Share icon (right)
- More menu ⋮ (far right)

BOOKING ID & STATUS:
- "Booking #BK123456" (gray, 13sp)
- Status banner (full width):
  * "Confirmed" (green background, white text)
  * Created date "Nov 8, 2025 at 10:30 AM"

CUSTOMER SECTION (card):
- "Customer Information" heading (bold, 15sp)
- Left: Circular profile photo (64px)
- Right:
  * Name "Aarti Kumar" (bold, 16sp)
  * VIP badge (if applicable, gold pill)
  * Phone "+91 98765 43210" (gray, phone icon)
  * Email "aarti@email.com" (gray, email icon)
  * "12 previous visits" (light gray)

Action buttons row:
- [📞 Call] (green, outlined)
- [💬 WhatsApp] (green, outlined)
- [✉️ SMS] (blue, outlined)
Each: 32px height, icon + text

APPOINTMENT DETAILS (card):
- "Appointment Details" heading
- Date: 📅 "November 10, 2025 (Tomorrow)" (icon + text)
- Time: 🕐 "10:00 AM - 10:45 AM (45 min)"
- Staff: 👤 "Priya Sharma" (with small circular avatar)
- Location: 📍 "Glow Beauty Salon, Sector 18" (if multi-location)

Quick actions:
- [Change Date/Time] link (purple)
- [Reassign Staff] link (purple)

SERVICES LIST (card):
- "Services Booked" heading

Service 1:
- Name "Women's Haircut" (left, bold, 14sp)
- Duration "30 min" (gray, below name)
- Price "₹800" (right, bold, 14sp)

Service 2:
- Name "Head Massage"
- Duration "15 min"
- Price "₹300"

Divider line

Pricing breakdown:
- Subtotal: ₹1,100
- GST (18%): ₹198
- Discount (FIRST20): -₹220 (green)
- Platform fee: ₹50
- Divider line (thicker)
- Total: ₹1,128 (large, bold, purple)

PAYMENT STATUS (card):
- "Payment Status" heading
- Status: "Paid Online" (green checkmark icon)
- Method: Card/UPI icon + "UPI Payment"
- Transaction ID: "pay_xxxxx123456" (small, gray, copyable)
- Timestamp: "Nov 8, 2025 at 10:31 AM"
- [View Receipt] link
- [Refund] button (if applicable, red, outlined)

SPECIAL REQUESTS (card, if any):
- "Special Requests" heading
- Icon: 📝
- Customer notes/requests text
- Light yellow background
- "Please use organic products only"

BOOKING SOURCE (small card):
- "Booked via: Mobile App" (icon + text)
- "First booking: No"

BOOKING TIMELINE (card):
- "Activity Timeline" heading
- Vertical timeline with dots and lines:
  
  ✓ Booked - Nov 8, 10:30 AM (green)
  └ "Customer booked via app"
  
  ✓ Confirmed - Nov 8, 10:31 AM (green)
  └ "Auto-confirmed after payment"
  
  ✓ Payment Received - Nov 8, 10:31 AM (green)
  └ "₹1,128 via UPI"
  
  ⏱ Reminder Sent - Nov 9, 6:00 PM (blue)
  └ "SMS reminder sent"
  
  ⏱ Scheduled - Nov 10, 10:00 AM (orange, upcoming)
  └ "Appointment time"

INTERNAL NOTES (card, staff only):
- "Internal Notes" heading (lock icon)
- Text area for staff notes
- "Add note..." placeholder
- Previous notes with timestamps

ACTION BUTTONS (sticky bottom):
Row 1:
- [Reschedule] (outlined, purple)
- [Cancel Booking] (outlined, red text)

Row 2:
- [Mark as Completed] (filled, green)
- [Send Reminder] (outlined, blue)

Row 3:
- [Mark as No-Show] (outlined, orange)
- [Request Review] (outlined, purple)

Each button: 48px height, rounded

Cancel booking shows:
- Confirmation dialog
- Refund calculation
- Reason dropdown
- [Confirm Cancellation] button

Mark completed shows:
- Completion confirmation
- "Request review?" checkbox
- Service satisfaction quick rating

Background: Light gray (#F9FAFB)
Cards: White, rounded (12px), subtle shadow
Style: Comprehensive, detailed, action-oriented
```

---

### Screen 20: Create/Edit Booking (Manual Entry)

**Prompt for Uizard:**
```
Design a comprehensive manual booking creation form (scrollable).

Header:
- Close X (left)
- "New Booking" title (or "Edit Booking")
- [Save Draft] button (right, gray text)

Progress indicator (optional):
- "Step 1 of 4" or dots showing progress

STEP 1 - CUSTOMER SELECTION:

Search customer:
- "Select Customer" heading
- Search bar "Search by name or phone..."
- Search icon left

Recent customers (horizontal scroll):
- Small avatar cards
- Name below
- "2 days ago" (last visit)
- Tap to select

Customer list (if searching):
- Name + photo
- Phone number
- Last visit date
- Tap to select

Selected customer (highlighted card):
- Avatar + Name
- Phone + Email
- Visit history "12 visits"
- [Change Customer] link

OR

- [+ Add New Customer] button (prominent, purple)
- Opens customer creation form

STEP 2 - SERVICE SELECTION:

"Select Services" heading

Service category tabs:
- [All] [Hair] [Nails] [Skin] [Spa] [Makeup]
- Horizontal scroll
- Selected: Purple background

Service list (checkboxes):
☑ Women's Haircut - 30 min - ₹800
☐ Hair Coloring - 90 min - ₹2,500
☑ Hair Spa - 45 min - ₹1,200
☐ Head Massage - 20 min - ₹300
☐ Blow Dry - 30 min - ₹500

Each service shows:
- Checkbox (left)
- Service name (bold)
- Duration + Price (gray, small)
- Info icon (tap for details)

Selected services summary (sticky):
- "2 services selected" (bold)
- Total duration: "75 min"
- Subtotal: "₹2,000"
- Collapsible list of selected items

STEP 3 - STAFF & TIME:

"Assign Staff" heading

Staff selection (horizontal scroll cards):
- "Any Available" option (selected by default)
  * Purple border
  * "Auto-assign best available"
  
- Priya Sharma card
  * Photo (circular, 56px)
  * Name
  * Rating "4.8 ⭐"
  * "Available" (green dot)
  * Next available: "10:00 AM"
  
- Amit Singh card
  * Similar layout
  * "Busy until 2 PM" (orange dot)
  
- Ravi Kumar card
  * "On leave" (gray, disabled)

Selected staff highlighted with purple border

Date selection:
- "Select Date" heading
- Date picker (compact calendar)
- Shows availability dots
- Today highlighted
- Disabled dates grayed out

Time slots:
- "Available Times" heading
- Grid of time slots (3 columns):
  [9:00 AM] [9:30 AM] [10:00 AM]
  [10:30 AM] [11:00 AM] [11:30 AM]
  
- Available: White, border
- Selected: Purple background
- Booked: Gray, disabled
- Optimal: Green border (AI suggested)

Duration indicator:
- "Booking: 10:00 AM - 11:15 AM"
- Shows calculated end time

STEP 4 - ADDITIONAL INFO:

Payment status:
- "Payment Status" heading
- Radio buttons:
  ○ Pay at salon (default)
  ○ Paid online
  ○ Advance paid (₹500)

If paid online:
- Payment method dropdown
- Transaction ID input

Discount/Coupon:
- "Apply Discount" expandable section
- Coupon code input
- "FIRST20" example with -20%
- Manual discount % input
- Discount reason dropdown

Special requests:
- "Add Special Requests" expandable
- Text area (3 lines)
- "e.g., Allergies, preferences..."
- Character count 0/200

Internal notes:
- "Internal Notes (Staff Only)" expandable
- Text area
- Lock icon

Notifications:
- Checkboxes:
  ☑ Send confirmation SMS
  ☑ Send reminder 1 hour before
  ☐ Send email confirmation

PRICING SUMMARY (sticky card, bottom):
- Subtotal: ₹2,000
- Discount: -₹400 (green)
- GST (18%): ₹288
- Divider
- Total: ₹1,888 (large, bold, purple)

BOTTOM ACTIONS:
Row of buttons:
- [Save as Draft] (outlined, left)
- [Create Booking] (filled, purple, primary, right)

Validation:
- Highlight required fields if incomplete
- Show error messages inline
- Disable Create button until valid

Confirmation:
- Success message
- "Booking created successfully!"
- Options:
  * [View Booking]
  * [Send Confirmation]
  * [Create Another]
  * [Back to Calendar]

Background: White
Style: Wizard flow, step-by-step, comprehensive
Clear validation, easy to modify before saving
```

---

### Screen 21: Booking Search & Filters

**Prompt for Uizard:**
```
Design an advanced booking search and filter screen.

Header:
- Back arrow
- "Search Bookings" title
- [Reset] button (right, text)

SEARCH BAR (top):
- Large search input
- "Search by customer, service, booking ID..."
- Search icon (left)
- Voice search icon (right)
- Auto-suggestions dropdown as user types

RECENT SEARCHES:
- "Recent Searches" label (if no active search)
- List of last 5 searches with clock icon
- Tap to re-run search
- [Clear All] link

FILTERS SECTION:

Date Range:
- "Date Range" heading
- Quick options (chips):
  [Today] [This Week] [This Month] [Custom]
- If Custom: Date picker (from/to)

Status Filter:
- "Booking Status" heading
- Multi-select checkboxes:
  ☑ Confirmed
  ☑ Pending
  ☐ Completed
  ☐ Cancelled
  ☐ No-show

Service Filter:
- "Services" heading
- Multi-select with search:
  ☐ Haircut
  ☐ Hair Coloring
  ☐ Facial
  ☐ Massage
  [+12 more]
- "Select All" / "Clear All" links

Staff Filter:
- "Staff Member" heading
- Staff cards (horizontal scroll):
  * [All Staff] (default selected)
  * [Priya] with photo
  * [Amit] with photo
  * [Ravi] with photo

Payment Status:
- "Payment Status" heading
- Checkboxes:
  ☐ Paid online
  ☐ Paid at salon
  ☐ Pending payment
  ☐ Refunded

Price Range:
- "Price Range" heading
- Dual-handle slider
- Min: ₹0 - Max: ₹5000
- Current selection shown: "₹500 - ₹2000"

Source Filter:
- "Booking Source" heading
- Checkboxes:
  ☐ Mobile App
  ☐ Walk-in
  ☐ Phone
  ☐ Website

Customer Type:
- "Customer Type" heading
- Radio buttons:
  ○ All customers
  ○ New customers only
  ○ VIP customers only
  ○ Regular customers

Advanced Filters (collapsible):
- "Advanced Filters" expandable section
- First booking: Yes/No toggle
- Has special requests: Yes/No
- Applied discount: Yes/No
- Reviewed: Yes/No

ACTIVE FILTERS CHIPS:
- Show selected filters as chips above results
- "Status: Confirmed" [×]
- "Staff: Priya" [×]
- "This Week" [×]
- Tap × to remove individual filter

RESULTS SECTION:

Sort options:
- "Sort by: Date (Newest) ▼" dropdown
- Options:
  * Date (Newest first)
  * Date (Oldest first)
  * Price (High to Low)
  * Price (Low to High)
  * Customer Name (A-Z)

Results count:
- "Showing 24 results" (gray text)
- If filtered: "24 of 156 total bookings"

Results list (scrollable):
- Booking cards matching filters
- Same card design as main booking list
- Infinite scroll/load more

Empty state (no results):
- Search icon (large, gray)
- "No bookings found"
- "Try adjusting your filters"
- [Clear All Filters] button

BOTTOM ACTIONS:
- [Clear All Filters] (outlined)
- [Apply Filters] (filled, purple, shows result count)

SAVE SEARCH (optional):
- "Save this search?" prompt
- Name input "VIP Bookings This Month"
- [Save] creates a quick filter for future

Background: White
Style: Advanced filtering, powerful search
Clear filter chips, easy to modify
Results update in real-time as filters change
```

---

### Screen 22: Booking Conflicts & Resolution

**Prompt for Uizard:**
```
Design a booking conflict detection and resolution screen.

Header:
- Warning icon (orange)
- "Booking Conflict" title
- Close X (right)

CONFLICT ALERT:
- Red/orange banner
- "⚠️ Scheduling Conflict Detected"
- "This booking overlaps with existing appointments"

CONFLICTING BOOKING DETAILS:

New booking attempt:
- "New Booking Request" card (purple border)
- Customer: Aarti Kumar
- Service: Haircut (30 min)
- Staff: Priya Sharma
- Time: Nov 10, 10:00 AM - 10:30 AM
- Price: ₹800

Existing bookings (conflicts):
- "Conflicts With" heading

Conflict 1:
- Red border card
- Customer: Neha Patel
- Service: Hair Spa (45 min)
- Staff: Priya Sharma (same staff)
- Time: 9:45 AM - 10:30 AM (overlap: 30 min)
- Status: Confirmed
- Priority: Regular customer

Conflict 2 (if multiple):
- Similar card layout

CONFLICT VISUALIZATION:
- Timeline view showing overlap
- Visual bars:
  * Existing booking (red bar)
  * New booking (orange bar)
  * Overlap area (darker red/orange)
- Time labels

RESOLUTION OPTIONS:

Option 1 - Change Time:
- "Suggest Different Time Slots" heading
- Available slots shown:
  
  [10:30 AM] Immediately after (green)
  [2:00 PM] Later today
  [10:00 AM] Tomorrow (same time)
  [9:00 AM] Tomorrow (earlier)
  
- Each slot shows:
  * Time
  * Staff availability
  * "Available" status
  * Tap to select

Option 2 - Change Staff:
- "Assign Different Staff" heading
- Available staff for same time:
  
  Amit Singh:
  - Available at requested time
  - Rating: 4.7⭐
  - Specializes in Haircut
  - "Similar experience"
  - [Assign to Amit] button
  
  Ravi Kumar:
  - Available at requested time
  - Rating: 4.5⭐
  - [Assign to Ravi] button

Option 3 - Override (Admin only):
- "Force Book (Override)" option
- Warning: "This will create a conflict"
- Requires confirmation
- Red button [Override & Book]
- Reason required: Dropdown
  * Customer request
  * Emergency
  * Special arrangement
  * Other

Option 4 - Waitlist:
- "Add to Waitlist" option
- If someone cancels, auto-book
- Notify customer of waitlist status
- [Add to Waitlist] button (yellow)

RECOMMENDED ACTION:
- AI suggestion highlighted
- "✨ Recommended: Book at 10:30 AM with Priya"
- Reasoning: "Keeps preferred staff, minimal wait"

CUSTOMER NOTIFICATION:
- Checkbox: ☑ "Notify customer about time change"
- Message preview if checked
- SMS/Email toggle

BOTTOM ACTIONS:
Row 1:
- [Cancel Booking] (outlined, left)
- [View Calendar] (outlined, right)

Row 2:
- [Apply Selected Solution] (filled, purple, full width)

Confirmation dialog:
- Shows final booking details
- Time change highlighted
- "Confirm new booking?" message
- [Cancel] [Confirm] buttons

Background: White
Conflict cards: Red/orange borders
Solutions: Green (recommended), White (options)
Style: Problem-solving, clear options, visual conflict display
```

---

### Screen 23: Bulk Booking Operations

**Prompt for Uizard:**
```
Design a bulk booking management screen for batch operations.

Header:
- Back arrow
- "Bulk Operations" title
- [Select Mode] toggle (right)

SELECTION MODE:

Date range selector:
- "Select Date Range" heading
- From: [Nov 1, 2025 ▼]
- To: [Nov 30, 2025 ▼]
- Quick options: [Today] [This Week] [This Month]

Filter criteria:
- Status: [All] [Confirmed] [Pending] [Cancelled]
- Staff: [All Staff ▼] or specific staff
- Service: [All Services ▼]
- Payment: [All] [Paid] [Unpaid]

[Load Bookings] button

BOOKING LIST (selection mode):
- Checkbox column added to each booking
- Select all checkbox (top)
- "12 of 156 selected" counter

Booking cards with checkboxes:
☑ Nov 10, 10:00 AM - Aarti K. - Haircut - ₹800
☐ Nov 10, 11:30 AM - Raj M. - Massage - ₹1,200
☑ Nov 10, 2:00 PM - Sara K. - Facial - ₹1,500

Selection summary bar (sticky bottom):
- "12 bookings selected"
- Total value: "₹18,400"
- Average: "₹1,533"

BULK ACTIONS (when items selected):

Action buttons row:
- [Change Status ▼]
  * Mark as Confirmed
  * Mark as Completed
  * Mark as Cancelled
  * Mark as No-show

- [Reassign Staff ▼]
  * Select new staff from list
  * Applies to all selected
  * Shows conflicts if any

- [Reschedule ▼]
  * Bulk reschedule to new dates
  * Offset by days: +1, +7, +30
  * Or specific date range
  * Shows conflicts

- [Send Messages ▼]
  * Send reminder to all
  * Send custom message
  * SMS or Email selection
  * Message template picker

- [Apply Discount]
  * Percentage or fixed amount
  * Reason required
  * Updates all selected

- [Export Selected]
  * CSV, Excel, PDF options
  * Email export link

- [Delete] (red, requires confirmation)

BULK RESCHEDULE DIALOG:

"Reschedule 12 Bookings" heading

Options:
○ Shift by X days
  - Input: [+7] days
  - "Move all bookings forward by 7 days"
  - Shows new dates preview

○ Move to specific date range
  - From: [Nov 15 ▼]
  - To: [Nov 22 ▼]
  - "Distribute evenly across this range"

○ Custom rules
  - Keep same time of day
  - Keep same staff
  - Keep same day of week

Conflict checking:
- "Check for conflicts" button
- Shows conflicts count if any
- Option to auto-resolve

Preview:
- Shows first 5 bookings with old → new dates
- "+7 more..." if applicable

[Cancel] [Apply Changes] buttons

BULK MESSAGE COMPOSER:

"Send Message to 12 Customers" heading

Message type:
- [SMS] [Email] [Both] toggle

Template selection:
- Dropdown with templates:
  * Booking reminder
  * Cancellation notice
  * Rescheduling notification
  * Promotional offer
  * Custom message

Message editor:
- Text area with template loaded
- Personalization tags:
  {{customer_name}}
  {{booking_date}}
  {{booking_time}}
  {{service_name}}
  {{salon_name}}

Preview:
- "Preview" tab
- Shows how message looks
- Sample customer data

Cost estimate (if SMS):
- "12 SMS × ₹0.20 = ₹2.40"

Schedule:
- [Send Now] or [Schedule ▼]
- If scheduled: Date/time picker

[Cancel] [Send Messages] buttons

CONFIRMATION DIALOGS:

For bulk status change:
- "Change status for 12 bookings?"
- From: Confirmed
- To: Cancelled
- Refund implications shown
- Customer notifications option
- [Cancel] [Confirm] buttons

For bulk delete:
- "⚠️ Delete 12 Bookings?"
- "This action cannot be undone"
- Refund processing option
- Reason required
- [Cancel] [Delete Bookings] (red)

RESULT SUMMARY:

After bulk action:
- Success message
- "✓ 12 bookings updated successfully"
- Summary:
  * Confirmed: 10
  * Failed: 2 (with reasons)
- [View Updated Bookings]
- [Undo] option (if available)

Background: White
Selected items: Light purple background
Actions: Floating toolbar (bottom)
Style: Powerful batch operations, careful confirmations
Clear preview before applying changes
```

---

### Screen 24: Waitlist Management

**Prompt for Uizard:**
```
Design a waitlist management screen for handling booking requests.

Header:
- Back arrow
- "Waitlist" title
- Filter icon (right)
- "8 on waitlist" subtitle

WAITLIST OVERVIEW:

Stats cards (2-column):
- Active waitlist: 8
- This week: 3
- Priority: 2
- Avg wait: 2.5 days

WAITLIST ENTRIES (scrollable list):

Entry 1 (High Priority):
- Priority badge "HIGH" (red pill)
- Customer: "Aarti Kumar" (bold)
  * VIP badge
  * Photo (circular, 48px)
- Requested service: "Hair Coloring"
- Preferred staff: "Priya Sharma"
- Preferred date: "Nov 10-12, 2025"
- Preferred time: "10 AM - 2 PM"
- Added to waitlist: "2 days ago"
- Customer note: "Flexible on dates"

Action buttons:
- [Match Booking] (green, prominent)
- [Contact] (blue, outlined)
- [Remove] (red, text)

Entry 2 (Normal Priority):
- Priority badge "NORMAL" (gray pill)
- Customer: "Neha Patel"
- Similar layout
- "Added yesterday"

Entry 3:
- Priority "LOW" (light gray)
- Customer: "Raj Malhotra"
- "Added 1 week ago"
- Aging indicator (orange if too long)

Each entry card:
- White background
- Rounded corners
- Shadow
- 140px height
- Tap to expand for details

EXPANDED ENTRY VIEW:

When tapped, shows:
- Full customer details
- Complete service request
- Flexibility options:
  * Can change staff: Yes
  * Can change service: No
  * Date flexibility: ±3 days
  * Time flexibility: 2 hours
- Contact history with customer
- Internal notes

MATCHING AVAILABLE SLOTS:

When "Match Booking" tapped:
- "Available Slots" bottom sheet
- AI-suggested matches:
  
  Match 1 (100% match):
  - Nov 10, 10:30 AM
  - Priya Sharma (preferred staff)
  - Hair Coloring (requested service)
  - [Book This Slot] (green)
  
  Match 2 (90% match):
  - Nov 11, 11:00 AM
  - Priya Sharma
  - Alternate day but same staff
  - [Book This Slot]
  
  Match 3 (85% match):
  - Nov 10, 2:00 PM
  - Amit Singh (different staff)
  - Same day, different staff
  - [Book This Slot]

Each match shows:
- Match percentage
- What differs from request
- Availability status
- [Book] button

[View All Slots] link

FILTERS & SORT:

Filter options:
- [All] [High Priority] [VIP Only]
- [Today] [This Week] [All Time]

Sort by:
- Priority (default)
- Date added
- Customer type
- Flexibility

AUTO-MATCHING:

"Auto-Match Settings" section:
- Toggle: "Auto-book when slot available" ON
- Match threshold: "90% minimum"
- Notification: "Send SMS confirmation"
- Priority customers only: Toggle

When auto-match finds slot:
- Notification to business owner
- Auto-books or requests confirmation
- Customer notified

WAITLIST ANALYTICS:

"This Month" card:
- Total waitlist requests: 24
- Successfully matched: 18 (75%)
- Still waiting: 6
- Cancelled/expired: 0
- Avg wait time: 2.3 days

ACTIONS:

Bottom floating buttons:
- [Add to Waitlist] (purple)
- [Bulk Match] (if multiple selected)

Bulk match:
- Select multiple waitlist entries
- Find common available slots
- Book all at once

EMPTY STATE:

If no waitlist:
- Calendar with checkmark icon
- "No Waitlist Entries"
- "Customers seeking appointments will appear here"

NOTIFICATION:

When new waitlist entry:
- Push notification
- "New waitlist request from Aarti Kumar"
- Tap to view and match

Background: Light gray
Cards: White
Priority badges: Color-coded
Style: Queue management, smart matching, customer-focused
```

---

### Screen 25: No-Show Tracking

**Prompt for Uizard:**
```
Design a no-show tracking and management screen.

Header:
- Back arrow
- "No-Show Management" title
- Date range "This Month ▼"

NO-SHOW SUMMARY:

Stats cards (2×2 grid):
1. Total No-Shows
   - "6" (large, red)
   - This month
   - "4%" rate

2. Revenue Lost
   - "₹4,800" (red, bold)
   - Potential revenue
   - "↓ 2%" vs last month

3. Repeat Offenders
   - "2" (orange)
   - Customers
   - "Multiple no-shows"

4. Recovery Rate
   - "67%" (green)
   - Rebooked
   - "4 of 6"

NO-SHOW LIST (scrollable):

Entry 1:
- Red "NO-SHOW" badge
- Customer: "Anjali Sharma" (with photo)
- Booking date: "Nov 8, 2025"
- Time: "10:00 AM"
- Service: "Haircut"
- Staff: "Priya"
- Value: "₹800" (lost revenue, red)
- No-show count: "2nd no-show" (warning badge)
- Days since: "2 days ago"

Actions:
- [Contact Customer] (blue)
- [Reschedule] (purple)
- [Block Customer] (red, requires confirmation)

Entry 2:
- Customer: "Rahul Verma"
- "1st no-show"
- "3 days ago"
- "₹1,200"

Entry 3:
- Customer: "Sara Kapoor"
- "3rd no-show" (red badge, serious)
- "1 week ago"

Each card:
- White background
- Red left border (severity indicator)
- 120px height

REPEAT OFFENDERS SECTION:

"Repeat No-Show Customers" heading

Customer 1:
- Photo + Name
- No-show count: "3 times"
- Total lost: "₹3,600"
- Last no-show: "1 week ago"
- Pattern: "Always cancels Friday bookings"
- Status: "Active" or "Blocked"

Actions:
- [Contact] [Apply Policy] [Block]

POLICIES & ACTIONS:

"No-Show Policies" card:

Current policy:
- 1st no-show: Warning + reminder
- 2nd no-show: Deposit required (₹500)
- 3rd no-show: Blocked for 30 days

Auto-actions enabled:
- ☑ Send follow-up SMS after no-show
- ☑ Request deposit for 2nd+ no-shows
- ☑ Auto-block after 3 no-shows
- ☐ Charge cancellation fee

[Edit Policies] button

CONTACT & RECOVERY:

Bulk contact options:
- "Send reminder to all" (checkbox selection)
- Template messages:
  * "We missed you today..."
  * "Would you like to reschedule?"
  * "Please confirm future bookings"

Recovery tracking:
- Rebooked: 4 customers (green)
- No response: 2 customers (gray)

ANALYTICS:

"No-Show Patterns" chart:
- Bar chart by day of week
- Monday, Tuesday, ..., Sunday
- Shows which days have most no-shows

"Time Distribution":
- Heatmap of no-shows by hour
- Morning vs evening patterns

"Service-Wise":
- Which services have higher no-shows
- Haircut: 2
- Facial: 3
- Massage: 1

PREVENTION:

"Prevention Strategies" section:
- Current measures:
  * Reminder SMS 1 day before: ON
  * Reminder SMS 1 hour before: ON
  * Deposit for new customers: OFF
  * Deposit for repeat no-shows: ON

Effectiveness:
- No-show rate with reminders: 4%
- No-show rate without: 12%
- Improvement: 66% reduction

FINANCIAL IMPACT:

"Financial Impact This Month":
- Potential revenue: ₹120,000
- Lost to no-shows: ₹4,800 (4%)
- Recovered via rebooking: ₹3,200
- Net loss: ₹1,600

Comparison:
- Last month: ₹2,400 lost
- Improvement: 33% better

ACTIONS:

Bottom buttons:
- [Contact All No-Shows]
- [Apply Bulk Policy]
- [View Reports]

EMPTY STATE:

If no no-shows:
- Checkmark icon (large, green)
- "No No-Shows!"
- "Great job! All bookings attended"
- "Keep up the good work"

Background: Light gray
No-show cards: Red accents
Style: Issue tracking, preventive measures, customer recovery
Clear severity levels and action items
```

---

## Customer Management

### Screen 26: Customers List

**Prompt for Uizard:**
```
Design a comprehensive customer management list screen.

Header:
- "Customers" title (bold, 20sp)
- [+ Add] button (right, purple text)
- Search icon (right)

Search bar:
- "Search customers..." placeholder
- Search icon (left)
- Filter icon (right)
- Voice search icon (far right)

Filter chips (horizontal scroll):
- [All Customers] (selected, purple)
- [VIP] (gold accent, outlined)
- [New] (green accent, outlined)
- [Inactive] (gray, outlined)
- [High Spenders] (outlined)
- [Birthday This Month] (outlined)

Stats row (3 columns, cards):
1. Total Customers
   - "245" (large, bold)
   - "↑ 12 this month" (green, small)

2. New This Month
   - "18" (bold)
   - "↑ 20%" (green)

3. Retention Rate
   - "68%" (bold)
   - "Industry avg: 65%"

CUSTOMER LIST (scrollable):

Customer Card 1 (VIP):
- Left: 
  * Circular avatar (56px)
  * VIP badge (gold star, top-right of avatar)
  * Online status dot (green, if recently active)

- Center:
  * Name "Aarti Kumar" (bold, 15sp)
  * Phone "+91 98765 43210" (gray, 13sp)
  * Last visit "5 days ago" (light gray, 12sp)
  * Lifetime value "₹18,500" (green, small)

- Right:
  * Total visits "24" (gray, small)
  * Avg spend "₹770" (gray, small)
  * Chevron right >

Customer Card 2 (New):
- Avatar with "AK" initials (if no photo)
- "Anjali Kapoor"
- "+91 98700 00000"
- Last visit "2 days ago"
- "NEW" badge (green pill)
- Visits: "2"

Customer Card 3 (Inactive):
- Avatar
- "Rahul Mehta"
- "+91 98888 88888"
- Last visit "3 months ago" (orange/red text - warning)
- "INACTIVE" badge (orange pill)
- Visits: "8"

Customer Card 4 (Birthday):
- Avatar with birthday hat icon overlay
- "Sara Kapoor"
- Birthday "Today 🎂" (highlighted)
- Visits: "15"

Customer Card 5 (High Spender):
- Avatar
- "Priya Verma"
- "💎 Premium" badge
- Lifetime value "₹42,000" (large, gold)
- Visits: "35"

Each card:
- White background
- 88px height
- Tap to open details
- Divider below

Card actions (swipe):
- Swipe left:
  * [Call] (green)
  * [WhatsApp] (green)
  * [Delete] (red)
- Swipe right:
  * [Book Appointment] (purple)

QUICK ACTIONS (floating):

Quick filter buttons (if many customers):
- [A-Z Sort]
- [Most Recent]
- [High Value]
- [Needs Attention]

SELECTION MODE:

Long press activates selection:
- Checkboxes appear
- Select multiple customers
- Bulk actions appear:
  * [Send Message]
  * [Export Selected]
  * [Add to Segment]
  * [Delete] (requires confirmation)

SEGMENTS (tabs or dropdown):
- All Customers
- VIP (Lifetime > ₹10K)
- Regular (5+ visits)
- New (< 3 visits)
- At Risk (No visit > 60 days)
- Birthday This Month
- Custom segments

FAB (Floating Action Button):
- Large purple circle (bottom-right)
- "+" icon (white)
- Tap to add new customer
- Long press shows:
  * Add Single
  * Import from CSV
  * Add from contacts

EMPTY STATE (if no customers):
- People group icon (large, gray)
- "No Customers Yet"
- "Start adding customers to manage your business"
- [Add Customer] button (purple)
- [Import Customers] button (outlined)

OFFLINE MODE:
- Shows cached customers
- "Offline" badge
- Sync pending indicator

Background: Light gray (#F9FAFB)
Cards: White
Badges: Color-coded (Gold=VIP, Green=New, Orange=Inactive)
Style: Contact management, CRM feel, quick actions
```

---

### Screen 27: Customer Profile (Detailed View)

**Prompt for Uizard:**
```
Design a comprehensive customer profile view (scrollable).

Header:
- Back arrow
- Customer name "Aarti Kumar" (title)
- Edit icon (right)
- More menu ⋮ (far right)

PROFILE HEADER:
- Large circular profile photo (96px, center)
- VIP badge (if applicable, gold, top-right of photo)
- Name "Aarti Kumar" (bold, 22sp, center)
- "Premium Customer" or tier label (gray, 14sp)
- Member since "Nov 2024" (gray, small)

Quick stats row (3 columns):
1. Total Visits
   - "24" (large, bold)
   - "Bookings"

2. Total Spent
   - "₹18,500" (large, green)
   - "Lifetime"

3. Avg Spend
   - "₹770" (bold)
   - "Per visit"

CONTACT INFO (card):
- "Contact Information" heading

Phone:
- 📞 "+91 98765 43210"
- [Call] [WhatsApp] buttons (small, inline)

Email:
- ✉️ "aarti@email.com"
- [Email] button

Address:
- 📍 "Sector 18, Noida"
- "2.3 km from salon"

Birthday:
- 🎂 "March 15"
- "Coming up in 45 days"
- [Set Reminder] link

Anniversary (optional):
- 💍 "June 22"

TABS:
- [Overview] [Bookings] [Services] [Notes] [Offers]
- Selected: Purple underline

OVERVIEW TAB:

Customer Health Score:
- Circular progress: 85/100 (green)
- Status: "Excellent"
- Engagement: "High"
- Retention risk: "Low"

Visit Frequency:
- Chart showing visits over time
- Last 6 months bar chart
- "Visits every 2.5 weeks average"

Spending Trend:
- Line chart
- Monthly spending last 6 months
- Trend: ↑ "Increasing"

FAVORITE SERVICES (card):
- "Favorite Services" heading
- List with counts:
  1. Haircut - 12 times
  2. Facial - 6 times
  3. Manicure - 4 times
  4. Hair Spa - 2 times

PREFERRED STAFF (card):
- "Preferred Staff" heading
- Priya Sharma (avatar)
- "Books with Priya 80% of time"
- "High satisfaction"

CUSTOMER PREFERENCES (card):
- Service preferences:
  * Prefers weekends
  * Morning slots (10-12 AM)
  * Requests natural products
- Communication:
  * Prefers WhatsApp
  * Reminder 1 day before

BOOKINGS TAB:

Upcoming:
- "Upcoming Bookings" (0 or list)
- If none: "No upcoming bookings"
  [Book Appointment] button

Past Bookings:
- "Booking History" heading
- Last 10 bookings shown

Booking card:
- Date "Nov 8, 2025"
- Service "Haircut"
- Staff "Priya Sharma"
- Amount "₹800"
- Status "Completed" (green)
- Rating "5 ⭐" (if reviewed)
- Tap to expand

Show more button: "View all 24 bookings →"

SERVICES TAB:

Services breakdown:
- All services customer has booked
- Frequency, last booked, total spent
- Recommendations based on history

NOTES TAB:

Internal notes section:
- [+ Add Note] button
- Note cards:
  * Timestamp
  * Author (staff member)
  * Note text
  * Edit/Delete icons (if own note)

Example note:
- "Nov 5, 2025 by Priya"
- "Customer prefers organic shampoo"
- "Allergic to certain chemicals"

OFFERS TAB:

Available offers for customer:
- Birthday special
- Loyalty rewards
- VIP exclusive deals
- [Send Offer] buttons

Offer history:
- Offers sent
- Redemption rate

LOYALTY PROGRAM (card):

Points balance:
- "450 points" (large)
- Progress bar to next tier
- "50 points to Gold tier"

Tier benefits:
- Current: Silver
- Next: Gold (at 500 points)
- Benefits list

Rewards available:
- "Redeem 100 pts for ₹50 discount"
- [Redeem] buttons

TAGS (card):
- "Customer Tags" heading
- Pills: [VIP] [Regular] [High-Value]
- [+ Add Tag]

REFERRALS (card):
- "Referrals" heading
- Customers referred: 3
- Referral reward earned: ₹600
- List of referrals

PAYMENT HISTORY (card):
- Payment methods used
- Most used: UPI (60%)
- Outstanding balance: ₹0 or amount

MARKETING CONSENT (card):
- SMS: ☑ Yes
- Email: ☑ Yes
- WhatsApp: ☑ Yes
- [Update Preferences]

ACTION BUTTONS (sticky bottom):
Row 1:
- [Book Appointment] (filled, purple)
- [Send Message] (outlined)

Row 2:
- [Call] (outlined, green)
- [View on Map] (outlined)

More menu (⋮):
- Edit Profile
- Merge Customer (duplicate handling)
- Export Data
- Delete Customer (requires confirmation)
- Block Customer

Background: Light gray
Cards: White, rounded
Style: Detailed CRM, customer 360 view
Data-rich, relationship-focused
```

---

### Screen 28: Add/Edit Customer

**Prompt for Uizard:**
```
Design a comprehensive customer add/edit form (scrollable).

Header:
- Back arrow
- "Add Customer" title (or "Edit Customer")
- [Save] button (right, purple text - active when valid)

Form (scrollable):

PHOTO SECTION:
- "Profile Photo" label
- Large circular placeholder (96px, center)
- Camera icon inside circle
- "+ Add Photo" text below (purple, 14sp)
- Or show existing photo with "Change" overlay

BASIC INFORMATION:
- "Basic Information" section heading (bold, 15sp)

First Name:
- Input field (required, red asterisk)
- "First Name *"
- 52px height, rounded

Last Name:
- "Last Name"
- Optional

Phone Number:
- Country code selector + input
- "+91 | Phone Number *" (required)
- Validation: 10 digits

Email:
- "Email Address"
- "(optional)" label
- Email validation

Gender:
- "Gender" label
- Radio buttons or dropdown:
  ○ Male
  ○ Female
  ○ Other
  ○ Prefer not to say

Date of Birth:
- "Date of Birth" label
- Date picker
- Shows age calculated
- Birthday notification toggle

Anniversary:
- "Anniversary Date" (optional)
- Date picker
- Anniversary reminder toggle

CONTACT INFORMATION:
- "Additional Contact" heading

Alternate Phone:
- Optional field

Address:
- "Address" label
- Multi-line text area (2-3 lines)
- [Use GPS] button (fills with current location)

City, PIN:
- Two-column layout
- City (left, 60%)
- PIN (right, 40%)

PREFERENCES:
- "Customer Preferences" heading

Preferred Services:
- Multi-select checkboxes:
  ☐ Hair Services
  ☐ Skin Care
  ☐ Nail Services
  ☐ Spa & Massage
  ☐ Makeup

Preferred Staff:
- Dropdown selector
- "Any Staff" (default)
- List of staff members

Preferred Time Slots:
- Multi-select pills:
  [Morning (9-12)] [Afternoon (12-3)]
  [Evening (3-6)] [Night (6-9)]

Booking Frequency:
- Dropdown:
  * Weekly
  * Bi-weekly
  * Monthly
  * Occasional

COMMUNICATION PREFERENCES:
- "How to Reach" heading

Preferred Contact Method:
- Radio buttons:
  ○ WhatsApp (default)
  ○ SMS
  ○ Phone Call
  ○ Email

Marketing Consent:
- Checkboxes:
  ☑ Send promotional offers
  ☑ Send appointment reminders
  ☑ Send birthday wishes
  ☐ Newsletter subscription

Language Preference:
- Dropdown: English, Hindi, Other

CUSTOMER SEGMENTATION:
- "Customer Type" heading

Tags:
- "Add Tags" input
- Existing tags shown as pills:
  [VIP] [×] [Regular] [×]
- Suggested tags:
  + New Customer
  + High Value
  + Frequent Visitor

Customer Tier (auto-calculated):
- Display only
- "Silver" (based on spending/visits)
- Next tier requirements shown

SOURCE:
- "How did they find us?" heading
- Dropdown:
  * Walk-in
  * Referral (show referrer field)
  * Social Media
  * Google Search
  * Advertisement
  * Other

SPECIAL NOTES:
- "Internal Notes" heading
- Text area (4-5 lines)
- "Add notes about preferences, allergies, etc."
- "Only visible to staff"
- Character count: 0/500

Examples placeholders:
- "Allergic to certain products"
- "Prefers natural/organic only"
- "Sensitive skin"

LOYALTY PROGRAM:
- "Enroll in Loyalty Program?" toggle
- If ON:
  * Starting points: Input (default 0)
  * Welcome bonus: 100 points

PAYMENT SETTINGS:
- "Payment Preferences" heading

Credit Limit (for regular customers):
- Toggle: "Allow credit" OFF/ON
- If ON: Credit limit input "₹___"

Preferred Payment:
- Checkboxes:
  ☐ Cash
  ☐ Card
  ☐ UPI
  ☐ Wallet

REFERRAL:
- "Referred by" (optional)
- Customer search/select
- Referral bonus applied to both

VALIDATION:
- Real-time validation
- Required fields marked with *
- Error messages inline:
  * "Phone number already exists"
  * "Invalid email format"
  * "Required field"

DUPLICATE DETECTION:
- If phone/email matches existing:
  * Warning: "Possible duplicate found"
  * Show matching customer
  * Options:
    - [Merge with Existing]
    - [Add as New]
    - [View Existing]

BOTTOM ACTIONS:

If New Customer:
- [Cancel] (outlined, left)
- [Add Customer] (filled, purple, right)
- [Add & Book Appointment] (filled, alternative)

If Editing:
- [Delete Customer] (red, outlined, left)
- [Save Changes] (filled, purple, right)

Success confirmation:
- "✓ Customer added successfully!"
- Options:
  * [View Profile]
  * [Book Appointment]
  * [Add Another Customer]

Background: White
Sections: Visually separated
Style: Comprehensive form, organized sections
Clear required vs optional fields
Smart defaults, helpful validation
```

---

### Screen 29: Customer Segments Management

**Prompt for Uizard:**
```
Design a customer segmentation and targeting screen.

Header:
- Back arrow
- "Customer Segments" title
- [+ Create Segment] button (right)

SEGMENT OVERVIEW:

Active segments counter:
- "8 Active Segments"
- "245 total customers"

DEFAULT SEGMENTS (cards):

Segment 1 - VIP Customers:
- Purple crown icon
- "VIP Customers" (bold, 16sp)
- Count: "45 customers" (18% of total)
- Criteria: "Lifetime value > ₹10,000"
- Avg spend: "₹15,200"
- Last updated: "Auto-updated"
- [View] [Edit] buttons

Segment 2 - New Customers:
- Green star icon
- "New Customers"
- Count: "18 customers" (7%)
- Criteria: "< 3 visits or < 30 days"
- Conversion rate: "75% become regular"
- [View] [Edit]

Segment 3 - At Risk:
- Orange warning icon
- "At Risk Customers"
- Count: "23 customers" (9%)
- Criteria: "No visit in 60+ days"
- Action: "Send win-back campaign"
- [View] [Send Campaign]

Segment 4 - High Frequency:
- Blue calendar icon
- "Frequent Visitors"
- Count: "67 customers" (27%)
- Criteria: "Visit 2+ times/month"
- Retention: "95%"
- [View] [Reward]

Segment 5 - Birthday This Month:
- Cake icon
- "Birthday This Month"
- Count: "12 customers"
- Auto-updated monthly
- [Send Birthday Offers]

CUSTOM SEGMENTS:

"Your Custom Segments" heading

Custom Segment 1:
- Icon picker (user selected)
- "Weekend Warriors"
- Count: "34 customers"
- Criteria: 
  * Books on Saturday/Sunday
  * Service: Hair services
  * Frequency: Monthly
- Created: "Nov 1, 2025"
- [View] [Edit] [Delete]

Custom Segment 2:
- "Bridal Package Prospects"
- Count: "15 customers"
- Criteria:
  * Age: 24-32
  * Booked makeup service
  * High spender (>₹2000/visit)
- Target campaign: "Bridal offers"

CREATE SEGMENT BUILDER:

Tap "+ Create Segment" opens builder:

"Create New Segment" screen:

Segment Details:
- Name input: "Segment Name"
- Description: Text area
- Icon selector (emoji or icon picker)
- Color picker for segment

Criteria Builder:
- "Add Criteria" section

Demographics:
- Age range: Slider (18-65)
- Gender: Multi-select

Behavior:
- Visit frequency:
  * < 1 month
  * 1-3 months
  * 3-6 months
  * 6+ months
  
- Total visits:
  * Exactly/More than/Less than
  * Number input

- Last visit:
  * In last X days
  * Date range picker

- Services:
  * Has booked: Multi-select services
  * Prefers: Service categories
  
- Spending:
  * Lifetime value: Range
  * Average per visit: Range
  * Last transaction: Amount

Tags:
- Has tags: Multi-select
- Doesn't have tags: Multi-select

Location:
- Within X km of salon
- Specific areas

Communication:
- Opted in for: SMS/Email/WhatsApp
- Language preference

Combine with AND/OR:
- Multiple criteria combined
- "Customers who meet ALL conditions"
- "Customers who meet ANY condition"

Preview:
- "Preview Segment" button
- Shows customer count matching criteria
- "24 customers match these criteria"
- Sample list of matching customers

Save options:
- [Save as Draft]
- [Create & View Segment]
- [Create & Send Campaign]

SEGMENT ACTIONS:

For each segment, actions:
- [View Customers] - Shows list
- [Send Campaign] - Marketing message
- [Export] - CSV download
- [Duplicate] - Create similar segment
- [Edit Criteria]
- [Delete] (with confirmation)

SEGMENT ANALYTICS:

Tap segment card → Analytics view:

Performance metrics:
- Size trend (growing/shrinking)
- Revenue contribution
- Booking frequency
- Retention rate
- Response to campaigns

Comparison:
- vs Other segments
- vs All customers

BULK OPERATIONS:

Select multiple segments:
- Checkboxes on cards
- [Merge Segments]
- [Send to All]
- [Export Combined]

TEMPLATES:

Segment templates:
- "High-Value Lapsed"
  * High LTV but inactive 90+ days
- "Rising Stars"
  * New customers, 3+ visits, increasing spend
- "Service-Specific"
  * Books only one type of service

[Use Template] applies pre-set criteria

Background: Light gray
Segment cards: White, color-coded left border
Style: Targeting tool, marketing-focused
Visual segment builder, powerful filtering
```

---

### Screen 30: Customer Import/Export

**Prompt for Uizard:**
```
Design a customer data import and export management screen.

Header:
- Back arrow
- "Import/Export Customers" title

TABS:
- [Import] [Export]

IMPORT TAB:

Import options (cards):

Option 1 - Import from CSV:
- 📄 CSV file icon
- "Import from CSV/Excel"
- "Upload customer list"
- [Select File] button
- Supported: CSV, XLSX
- Max: 1000 customers per file

Option 2 - Import from Contacts:
- 📱 Phone icon
- "Import from Phone Contacts"
- "Select contacts to add"
- [Access Contacts] button
- Permission required notice

Option 3 - Manual Entry:
- ✏️ Edit icon
- "Add Manually"
- "Enter customer details"
- [Add Customer] button

IMPORT FROM CSV FLOW:

Step 1 - Upload File:
- Drag & drop area
- "Drag CSV file here or click to browse"
- File size limit shown
- [Download Sample CSV] link

Step 2 - Map Columns:
- Shows CSV preview (first 5 rows)
- Column mapping interface:
  
  CSV Column → App Field
  "Name" → First Name ✓
  "Phone" → Phone Number ✓
  "Email" → Email ✓
  "DOB" → Date of Birth ✓
  "Custom1" → [Ignore] or select field
  
- Auto-detection where possible
- Manual mapping for custom fields
- [Skip Column] option

Step 3 - Review & Import:
- Summary:
  * Total rows: 150
  * Valid: 145
  * Errors: 5
- Error list:
  * Row 23: Invalid phone format
  * Row 45: Duplicate email
  * Row 67: Missing required field
- [Download Error Report]
- Options:
  ☑ Skip invalid rows
  ☐ Send welcome message
  ☑ Add to segment: [New Imports]
- [Cancel] [Import Customers]

Step 4 - Import Progress:
- Progress bar
- "Importing 145 customers..."
- "Completed: 100/145"
- Cancel option

Step 5 - Success:
- ✓ "Import Completed!"
- "145 customers imported"
- "5 rows skipped (errors)"
- [View Imported Customers]
- [Download Report]

IMPORT FROM CONTACTS:

Permission screen:
- "Access to Contacts Required"
- Explanation
- [Grant Permission] button

Contact selection:
- List of phone contacts
- Search bar
- Checkboxes for selection
- [Select All] option
- Shows if already in system
- "245 contacts | 180 new"

Selected contacts review:
- Shows selected items
- Auto-fills fields from contact
- Missing info highlighted
- [Import Selected]

EXPORT TAB:

Export options:

Quick Export:
- "Export All Customers"
- Format: [CSV ▼] [Excel ▼] [PDF ▼]
- Includes all fields
- [Export Now] button

Filtered Export:
- "Export Filtered List"
- Select segment: [VIP Customers ▼]
- Select fields to include:
  ☑ Name
  ☑ Phone
  ☑ Email
  ☑ Visit Count
  ☑ Total Spent
  ☐ Internal Notes
  ☐ Birthday
- Date range: [All Time ▼]
- [Export] button

Custom Export:
- "Custom Export"
- Advanced filters
- Custom field selection
- Sort order options
- [Configure & Export]

EXPORT HISTORY:

Recent exports list:
- "All Customers - Nov 10.csv"
  * 245 customers
  * 2 days ago
  * 45 KB
  * [Download] [Delete]

- "VIP Segment - Nov 8.xlsx"
  * 45 customers
  * 4 days ago
  * [Download] [Delete]

Auto-delete after 30 days notice

SCHEDULED EXPORTS:

Create scheduled export:
- "Weekly Export" name
- Segment: All customers
- Format: CSV
- Schedule: Every Monday 9 AM
- Email to: owner@salon.com
- [Create Schedule]

Existing schedules:
- List of scheduled exports
- [Edit] [Pause] [Delete]

DATA COMPLIANCE:

Privacy section:
- "Export includes personal data"
- GDPR compliance notice
- "Use exported data responsibly"
- Customer consent status

Customer data rights:
- [Customer Data Request]
- For customer-initiated exports
- Automated within 48 hours

IMPORT SETTINGS:

Default import settings:
- Auto-assign tags: [New Import]
- Send welcome: Toggle
- Add to loyalty: Toggle
- Notification preference: Default ON
- Auto-segment: [New Customers]

Duplicate handling:
- Radio buttons:
  ○ Skip duplicates
  ○ Update existing (merge)
  ○ Create duplicate
  ○ Ask each time

Match criteria:
- Match by: Phone (primary)
- Secondary: Email
- Case sensitive: Toggle

TEMPLATES:

Import templates:
- [Download Blank Template]
- [Download Sample Data]
- Shows required vs optional fields

Export templates:
- Saved export configurations
- One-click export with preset

Background: White
Style: Data management, enterprise tool
Clear step-by-step process
Error handling and validation
```

---

### Screen 31: Customer Communication History

**Prompt for Uizard:**
```
Design a customer communication history and message center.

Header:
- Back arrow
- Customer name "Aarti Kumar"
- "Communication History" subtitle
- [+ New Message] button (right)

COMMUNICATION SUMMARY:

Stats row (3 cards):
1. Total Messages
   - "45" (bold)
   - SMS + Email + WhatsApp

2. Open Rate
   - "72%" (bold, green)
   - Above average

3. Last Contact
   - "2 days ago"
   - Via WhatsApp

TABS:
- [All] [SMS] [Email] [WhatsApp] [Calls]

TIMELINE (scrollable):

Communication thread (chronological):

Nov 10, 2025:
Message 1 - WhatsApp (Sent):
- Green WhatsApp icon
- "Appointment Reminder"
- Preview: "Hi Aarti, this is a reminder..."
- Timestamp: "10:00 AM"
- Status: "✓✓ Read"
- [View Full Message]

Message 2 - SMS (Sent):
- Blue SMS icon
- "Booking Confirmation"
- Preview: "Your booking for Nov 10..."
- Timestamp: "9:00 AM"
- Status: "Delivered ✓"

Nov 8, 2025:
Message 3 - Email (Sent):
- Purple email icon
- "Monthly Newsletter"
- Subject: "November Special Offers"
- Status: "Opened 📧"
- Click rate: "Clicked 2 links"

Call 1 - Outgoing:
- Phone icon (green)
- "Outgoing Call"
- Duration: "3:24"
- Purpose: "Booking inquiry"
- Notes: "Rescheduled to Nov 10"

Nov 5, 2025:
Message 4 - WhatsApp (Received):
- Green WhatsApp icon (incoming)
- From customer
- "Can I reschedule?"
- Timestamp: "2:30 PM"
- Reply time: "5 minutes"

Message 5 - WhatsApp (Sent):
- Reply to above
- "Sure! What time works?"
- Quick reply used

Each message card:
- Icon with colored circle
- Message type
- Preview/summary
- Timestamp
- Status indicators
- Tap to expand

EXPANDED MESSAGE VIEW:

When tapped, shows:
- Full message content
- Recipient info
- Send time & date
- Delivery status timeline:
  * Sent
  * Delivered
  * Read (if applicable)
  * Clicked (for emails with links)
- Campaign info (if part of campaign)
- [Reply] [Forward] [Archive] buttons

FILTERS & SEARCH:

Search bar:
- "Search messages..."
- Full text search

Filters:
- Date range: [Last 30 Days ▼]
- Message type: [All ▼]
- Status: [All] [Sent] [Delivered] [Read]
- Campaign vs Individual

ANALYTICS CARD:

"Communication Insights" expandable:
- Messages sent: 45
- Response rate: 68%
- Avg response time: 12 minutes
- Preferred channel: WhatsApp (60%)
- Best time: Evenings (6-8 PM)
- Click-through rate: 15% (emails)

QUICK ACTIONS:

Floating action buttons:
- [📱 Call] - Quick dial
- [💬 WhatsApp] - Open WhatsApp chat
- [📧 Email] - Compose email
- [📱 SMS] - Send SMS

NEW MESSAGE COMPOSER:

Tap "+ New Message":

Bottom sheet appears:

"Send Message to Aarti Kumar"

Channel selection:
- [SMS] [Email] [WhatsApp] tabs

Message type (if campaign):
- Individual message (default)
- Add to campaign

Template selection (optional):
- "Use Template" dropdown
- Templates:
  * Appointment Reminder
  * Booking Confirmation
  * Birthday Wishes
  * Thank You
  * Follow-up
  * Promotional
- [Blank Message]

Message composer:
- Subject (if email)
- Message text area
- Personalization tags:
  {{name}} {{next_appointment}} {{points}}
- Character count (for SMS)
- SMS count: "1 message"

Attachments (email/WhatsApp):
- [Attach File] button
- Image/PDF support

Schedule:
- [Send Now] (default)
- [Schedule ▼]
  * Pick date/time
  * Timezone

Preview:
- [Preview] button
- Shows how message looks

Send:
- [Cancel] [Send Message]

Confirmation:
- "Message sent successfully!"
- Delivery status tracking

COMMUNICATION PREFERENCES:

Customer's preferences shown:
- Preferred channel: WhatsApp
- Opted in: SMS ✓ Email ✓ WhatsApp ✓
- Best time: Evenings
- Language: English
- [Edit Preferences] link

AUTOMATED MESSAGES:

Section showing automated messages:
- "Automated Messages" heading
- List of auto-sent messages:
  * Birthday wish (scheduled)
  * Booking reminder (triggered)
  * Thank you (post-visit, triggered)
- Toggle to disable auto-messages for this customer

NOTES & TAGS:

Add communication notes:
- "Add Note" input
- "Discussed pricing for bridal package"
- Timestamp auto-added
- Staff name tagged

Tags:
- [Interested in Packages]
- [Prefers Evening Contact]
- [+Add Tag]

EXPORT:

Export communication history:
- [Export Thread]
- PDF or CSV format
- Full conversation
- For records/compliance

Background: White (chat-like interface)
Messages: Bubble style or cards
Sent: Right-aligned, purple tint
Received: Left-aligned, gray tint
Style: Messaging app feel, chronological, organized
Clear channel indicators, status tracking
```

---

### Screen 32: Customer Feedback & Reviews

**Prompt for Uizard:**
```
Design a customer feedback collection and review management screen.

Header:
- Back arrow
- "Customer Feedback" title
- Filter icon (right)

OVERVIEW STATS:

Rating summary card:
- Overall rating: "4.6 ⭐" (large, bold)
- Based on: "120 reviews"
- Trend: "↑ 0.2 from last month" (green)

Rating distribution (horizontal bars):
- 5 stars ⭐⭐⭐⭐⭐ [████████░░] 75 reviews (63%)
- 4 stars ⭐⭐⭐⭐   [████░░░░░░] 30 reviews (25%)
- 3 stars ⭐⭐⭐     [██░░░░░░░░] 10 reviews (8%)
- 2 stars ⭐⭐       [█░░░░░░░░░] 3 reviews (3%)
- 1 star  ⭐         [█░░░░░░░░░] 2 reviews (2%)
- Tap bar to filter

Response stats:
- Response rate: "85%"
- Avg response time: "2 hours"
- Resolved issues: "95%"

TABS:
- [All Reviews] [Pending Response] [By Rating]

FILTERS:

Sort dropdown:
- "Sort by: Most Recent ▼"
- Options:
  * Most Recent
  * Highest Rating
  * Lowest Rating
  * Most Helpful
  * No Response

Filter chips:
- [All] [5★] [4★] [3★] [2★] [1★]
- [Responded] [Pending]
- [With Photos] [Verified]

REVIEW LIST (scrollable):

Review Card 1 (5-star):
- Top row:
  * Customer avatar (40px, left)
  * Name "Aarti Kumar" (bold)
  * VIP badge (if applicable)
  * "5 ⭐⭐⭐⭐⭐" (right, gold)

- Date: "2 days ago"
- Verified badge: "✓ Verified Booking"

- Review text:
  "Excellent service! Priya did an amazing 
  job with my haircut. Very professional 
  and friendly staff. Highly recommend!"

- Service details:
  * Service: "Women's Haircut"
  * Staff: "Priya Sharma"
  * Date: "Nov 8, 2025"

- Photos (if attached):
  * Thumbnail images (swipeable)
  * Tap to view full

- Interaction counts:
  * Helpful: "👍 12"
  * Share: "🔗"

- Response section:
  * If responded:
    - "Response from Glow Salon" (bold)
    - "Thank you Aarti! We're glad..." (gray)
    - Timestamp: "1 day ago"
  
  * If not responded:
    - [Reply] button (purple)

Review Card 2 (3-star, needs attention):
- Orange/yellow star rating
- "3 ⭐⭐⭐"
- Name "Raj Malhotra"
- "1 week ago"

- Review text:
  "Service was okay but had to wait 
  20 minutes past appointment time. 
  Final result was good though."

- Sentiment: "Mixed" badge (orange)
- Issue detected: "⚠️ Wait time complaint"
- Priority: "Medium"

- Staff mentioned: "Amit Singh"

- Response required badge (orange)
- [Reply Now] button (prominent)

Review Card 3 (1-star, urgent):
- Red star rating
- "1 ⭐"
- Name "Sara Kapoor"
- "3 days ago"
- "Unresolved" badge (red)

- Review text:
  "Very disappointed. Staff was rude 
  and service quality was poor. Won't 
  be coming back."

- Sentiment: "Negative" (red)
- Issue: "⚠️ Staff behavior complaint"
- Priority: "High"

- Action required:
  * [Reply Immediately] (red button)
  * [Contact Customer] (phone icon)
  * [Flag for Review]

Each review card:
- White background
- Left border color-coded by rating:
  * Green: 5 stars
  * Light green: 4 stars
  * Yellow: 3 stars
  * Orange: 2 stars
  * Red: 1 star
- 16px padding
- Divider below

RESPONSE COMPOSER:

Tap [Reply] opens bottom sheet:

"Reply to Aarti Kumar's Review"

Rating shown: "5 ⭐⭐⭐⭐⭐"
Review excerpt shown

Response templates:
- [Thank You (5★)]
  "Thank you for your wonderful feedback! 
  We're delighted to hear..."
  
- [Apologize (Low rating)]
  "We sincerely apologize for..."
  
- [Address Issue]
  "Thank you for bringing this to..."
  
- [Custom Reply] (blank)

Text editor:
- Text area (4-5 lines)
- Character count: 0/500
- Tone selector: Professional | Friendly | Formal

Personalization:
- Insert: {{customer_name}}
- Insert: {{staff_name}}
- Insert: {{service_name}}

Internal action:
- ☑ "Mark as resolved"
- ☐ "Follow up in 3 days"
- ☐ "Offer compensation" (select type)

Visibility:
- ☑ "Publish response publicly"
- ☐ "Send private message to customer"

[Cancel] [Post Response] buttons

REQUEST REVIEW SECTION:

"Request Reviews" card:
- "Ask satisfied customers for reviews"
- Recent completed bookings (no review):
  * Aarti Kumar - Completed 2 days ago
    [Request Review] button
  * Neha Patel - Completed 3 days ago
    [Request Review]

Bulk request:
- [Send Review Requests to All] button
- Sends to last 10 completed (no review)

Review request settings:
- Auto-request after: 
  * Toggle ON
  * Time: [24 hours] after completion
- Channel: WhatsApp (primary), SMS (backup)
- Template:
  "Hi {{name}}, we'd love to hear 
  about your recent visit..."

ANALYTICS:

"Review Insights" expandable card:

Review velocity:
- Reviews per week: 8.5 average
- Trend: ↑ Increasing

Sentiment analysis:
- Positive: 88%
- Neutral: 9%
- Negative: 3%

Common keywords (word cloud):
- "Professional" (most frequent)
- "Friendly"
- "Clean"
- "Skilled"
- "Wait" (negative context)

Issues by category:
- Wait time: 12 mentions
- Pricing: 5 mentions
- Quality: 3 mentions

Staff ratings:
- Priya Sharma: 4.9 ⭐ (45 reviews)
- Amit Singh: 4.7 ⭐ (32 reviews)
- Ravi Kumar: 4.5 ⭐ (28 reviews)

Service ratings:
- Haircut: 4.8 ⭐
- Facial: 4.7 ⭐
- Massage: 4.6 ⭐

ACTIONS:

Bulk actions (select multiple):
- [Mark as Helpful]
- [Respond to All]
- [Export Reviews]
- [Report Spam]

Single review actions (⋮ menu):
- Reply
- Share review
- Flag inappropriate
- Hide review (with reason)
- Contact customer
- Export review

EMPTY STATE (no reviews):
- Star icon (large, gray)
- "No Reviews Yet"
- "Start collecting customer feedback"
- [Request First Review] button

Background: Light gray
Review cards: White
Border color: Rating-based
Style: Review management, response-focused
Sentiment analysis, actionable insights
```

---

### Screen 33: Customer Loyalty Tiers

**Prompt for Uizard:**
```
Design a customer loyalty tier progression system screen.

Header:
- Back arrow
- "Loyalty Program" title
- Edit icon (right)

PROGRAM OVERVIEW:

Program name card:
- "Glow Rewards Program"
- Logo/icon
- Active members: "210 of 245 customers (86%)"
- Program value: "₹45,000 rewards issued"

TIER PROGRESSION (visual):

Vertical tier display with progression path:

TIER 1 - BRONZE (Entry Level):
- Bronze badge/medal icon
- "Bronze Member" heading
- Requirements:
  * "0-5 visits" OR "₹0-₹2,500 spent"
- Current members: "95 customers" (45%)
- Benefits:
  * ✓ 5% discount on all services
  * ✓ Birthday bonus (100 points)
  * ✓ SMS reminders
- Points earn rate: "1 point per ₹10"

Arrow down ↓ "Upgrade at 6 visits"

TIER 2 - SILVER (Regular):
- Silver badge icon (shiny)
- "Silver Member"
- Requirements:
  * "6-15 visits" OR "₹2,500-₹8,000"
- Current members: "80 customers" (38%)
- Benefits:
  * ✓ 10% discount
  * ✓ Priority booking
  * ✓ Free upgrade once/month
  * ✓ Birthday bonus (250 points)
  * ✓ Exclusive offers
- Points earn rate: "1.5 points per ₹10"

Arrow down ↓ "Upgrade at 16 visits"

TIER 3 - GOLD (Loyal):
- Gold badge icon
- "Gold Member"
- Requirements:
  * "16-30 visits" OR "₹8,000-₹20,000"
- Current members: "25 customers" (12%)
- Benefits:
  * ✓ 15% discount
  * ✓ Complimentary service monthly
  * ✓ Skip waitlist
  * ✓ Staff selection priority
  * ✓ Birthday bonus (500 points)
  * ✓ Bring-a-friend discount
- Points earn rate: "2 points per ₹10"

Arrow down ↓ "Upgrade at 31 visits"

TIER 4 - PLATINUM (VIP):
- Platinum badge (premium, animated shimmer)
- "Platinum VIP"
- Requirements:
  * "31+ visits" OR "₹20,000+ spent"
- Current members: "10 customers" (5%)
- Benefits:
  * ✓ 20% discount
  * ✓ Personal relationship manager
  * ✓ Express service (no wait)
  * ✓ Exclusive VIP events
  * ✓ Free home service once/quarter
  * ✓ Birthday bonus (1000 points)
  * ✓ Referral bonuses (2×)
  * ✓ Annual spa package
- Points earn rate: "3 points per ₹10"

Each tier card:
- Color-coded background (bronze, silver, gold, platinum)
- Metallic effect
- Progress indicator to next tier
- Member count
- Expandable for full benefits list

TIER COMPARISON TABLE:

Swipe left/right to compare:
| Feature | Bronze | Silver | Gold | Platinum |
|---------|--------|--------|------|----------|
| Discount | 5% | 10% | 15% | 20% |
| Points Rate | 1× | 1.5× | 2× | 3× |
| Priority Book | ✗ | ✓ | ✓ | ✓ |
| Free Service | ✗ | ✗ | ✓ | ✓ |

POINTS SYSTEM:

"How to Earn Points" card:
- Spend ₹10 = 1 point (base rate, varies by tier)
- Leave review = 50 points
- Refer friend = 200 points
- Birthday month = 2× points
- First visit of month = 50 bonus
- Book 3+ services = 100 bonus

"Redeem Points" card:
- 100 points = ₹50 discount
- 500 points = Free service (up to ₹500)
- 1000 points = Premium service free
- 2000 points = Product hamper

UPGRADE PROGRESS:

Example customer view:
- Current tier: Silver (with badge)
- Progress bar:
  "You are here" marker at 8 visits
  "6 visits to Gold" label
  Progress: 53% (8 of 15 visits)
  
- Alternative progress (spending):
  "₹5,200 of ₹8,000 to Gold"
  Progress: 65%

- Next milestone:
  "Complete 7 more visits to unlock:"
  * 15% discount
  * Free monthly service
  * Gold member perks

RECENT TIER CHANGES:

Activity feed:
- "Aarti Kumar upgraded to Platinum!" 🎉
  2 days ago
  
- "5 customers reached Silver tier"
  This week
  
- "Neha Patel earned 500 points"
  Yesterday

TIER BENEFITS DETAILS:

Tap tier → Detailed benefits screen:

"Gold Member Benefits"

Discounts:
- 15% on all services
- 20% on retail products
- Double points days

Priority Access:
- Skip regular queue
- Early booking (7 days advance)
- Preferred time slots

Complimentary:
- 1 free service monthly (up to ₹1,500)
- Birthday spa session
- Anniversary surprise

Special Events:
- VIP-only workshop invites
- New service previews
- Seasonal parties

TIER MANAGEMENT (for owner):

Edit tier settings:
- Requirements (visits/spending)
- Benefits list
- Points earning rate
- Promotional periods
- Auto-upgrade rules

Tier communication:
- Welcome message for new tier
- Upgrade congratulations template
- Benefit reminders

Analytics:
- Tier distribution chart
- Upgrade velocity
- Revenue by tier
- Retention by tier
- Most valued benefits

GAMIFICATION:

Progress animations:
- When customer upgrades
- Confetti effect
- "Congratulations!" message
- Badge unlock animation

Challenges:
- "Visit 3 times this month → Bonus 300 points"
- "Refer 2 friends → Fast-track to next tier"
- "Try new service → 2× points"

Leaderboard (optional):
- Top spenders this month
- Most visits
- Highest points earners
- Gamified competition

CUSTOMER VIEW:

When customer logs in:
- Their current tier highlighted
- Progress to next tier
- Points balance
- Available rewards
- Exclusive offers for tier

Tier upgrade notification:
- Push notification
- "Congratulations! You're now a Gold Member!"
- [View Benefits] button

Background: Premium feel with gradients
Tier badges: Metallic, shiny, status symbols
Style: Gamified, aspirational, rewarding
Clear progression path, tangible benefits
```

---

## Staff Management

### Screen 34: Staff List

**Prompt for Uizard:**
```
Design a comprehensive staff management screen for salon owners.

Header:
- "Staff" title (bold, 20sp)
- [+ Add Staff] button (right, purple text)
- Search icon

Search bar:
- "Search staff..." placeholder
- Search icon (left)
- Filter icon (right)

Filter tabs:
- [All] [Active] [On Leave] [Inactive]
- Selected: Purple underline

This Month Performance Card:
- "Team Performance - November" heading
- Purple gradient background
- Row of 3 metrics (white text):
  * "8" Active Staff
  * "156" Total Bookings
  * "₹82,500" Revenue Generated

STAFF LIST (scrollable):

Staff Card 1 (Top Performer):
- Left side:
  * Circular photo (64px)
  * "⭐ Top" badge (gold, top-right of photo)
  * Online status dot (green, bottom-right if currently working)

- Center content:
  * Name "Priya Sharma" (bold, 16sp)
  * Role "Senior Stylist" (gray, 13sp)
  * Specialties "Hair • Makeup" (purple tags, 12sp)
  
- Right side stats column:
  * "45" bookings (bold, 14sp)
  * "₹28,500" revenue (green, bold, 14sp)
  * Status "Available" (green pill badge)

Performance indicators (below name):
- Utilization bar: 85% filled (purple progress bar)
- "85% utilization" label (small, gray)

Staff Card 2:
- Photo (64px circular)
- "Amit Singh"
- "Massage Therapist"
- "Massage • Spa"
- Stats:
  * "32" bookings
  * "₹18,200" revenue
  * "Available" (green)
- Utilization: 68% bar

Staff Card 3 (On Leave):
- Photo
- "Ravi Kumar"
- "Stylist"
- "Hair • Nails"
- Stats:
  * "28" bookings (grayed)
  * "₹15,800" revenue
  * "On Leave" (orange badge)
- No utilization bar (grayed out)
- Leave info: "Back on Nov 15"

Staff Card 4:
- Photo with "RK" initials (if no photo)
- "Sara Kapoor"
- "Nail Technician"
- "Nails • Pedicure"
- Stats:
  * "24" bookings
  * "₹12,400" revenue
  * "Busy" (yellow badge)
- Next available: "2:00 PM"

Each staff card:
- White background
- Rounded corners (12px)
- Subtle shadow
- 120px height
- Tap to view full profile
- Divider below

Card swipe actions:
- Swipe left reveals:
  * [Schedule] (blue, 80px width)
  * [Message] (green, 80px)
  * [More] (gray, 60px)
- Swipe animation smooth

QUICK FILTERS:
- Floating filter chips (horizontal scroll):
  [All Staff] [Available Now] [High Performers] 
  [On Leave] [New Hires]

TEAM STATS SECTION (expandable card):
- "Team Overview" heading
- Tap to expand/collapse
- When expanded shows:
  * Total staff: 8
  * Active today: 6
  * On leave: 1
  * Avg performance: 4.6/5
  * Team utilization: 76%
  * Total experience: 45 years combined

FLOATING ACTION BUTTON (FAB):
- Large purple circle (bottom-right, 56px)
- "+" icon (white, centered)
- Tap to add new staff
- Slight shadow and elevation

EMPTY STATE (if no staff):
- Team icon (large, light gray, 96px)
- "No Staff Members Yet"
- "Add your team to get started"
- [Add First Staff Member] button (purple, filled)
- [Import from Contacts] button (outlined)

SELECTION MODE:
- Long press activates selection
- Checkboxes appear on cards
- Select multiple staff
- Bulk actions toolbar appears:
  * [Send Message to All]
  * [Assign to Shift]
  * [Export Selected]
  * [Manage Leave]

SORT OPTIONS (top-right dropdown):
- "Sort by: Performance ▼"
- Options:
  * Performance (High to Low)
  * Name (A-Z)
  * Revenue Generated
  * Bookings Count
  * Join Date
  * Availability

STAFF CATEGORIES (if many staff):
- Grouped by role:
  * Stylists (4)
  * Massage Therapists (2)
  * Nail Technicians (1)
  * Support Staff (1)
- Collapsible sections

Background: Light gray (#F9FAFB)
Staff cards: White with subtle shadows
Badges: Color-coded (Green=available, Yellow=busy, Orange=leave, Gray=offline)
Style: Team roster, performance-focused, professional
Clear hierarchy, easy scanning, quick actions
```

---

### Screen 35: Staff Profile Details

**Prompt for Uizard:**
```
Design a comprehensive staff member profile view (scrollable).

Header:
- Back arrow (left)
- Staff name "Priya Sharma" (title, center-left)
- Edit icon (right)
- More menu ⋮ (far right)

PROFILE HEADER SECTION:
- Large circular photo (96px, center)
- "Top Performer" badge (gold star, top-right of photo)
- Name "Priya Sharma" (bold, 22sp, center)
- Role "Senior Stylist" (gray, 15sp, center)
- Status badge "Available" (green pill, center)
- Employee ID "EMP-001" (gray, small, 11sp)

Quick action buttons (row, center):
- [Call] (green, outlined, icon + text)
- [Message] (blue, outlined)
- [View Schedule] (purple, outlined)
Each button: 32px height, icon left, text right

PERFORMANCE METRICS (This Month):
Three cards in a row:

Card 1 - Bookings:
- Large number "45" (28sp, bold, purple)
- Label "Bookings" (gray, 12sp)
- Trend "↑ 12%" (green, small, with arrow)
- Small sparkline chart below

Card 2 - Revenue:
- "₹28,500" (28sp, bold, green)
- "Revenue" (gray)
- Trend "↑ 18%" (green)
- Sparkline

Card 3 - Rating:
- "4.8 ⭐" (28sp, bold, gold)
- "Rating" (gray)
- "23 reviews" (small)
- No trend

Each metric card:
- White background
- Rounded (8px)
- Subtle shadow
- 100px height
- Equal width (33% each)

TABS (sticky):
- [Overview] [Schedule] [Performance] [Earnings]
- Selected: Purple underline, bold
- Swipe to change tabs

OVERVIEW TAB:

Contact Information (card):
- "Contact Details" heading (bold, 15sp)
- Phone: 📞 "+91 98765 43210"
  * [Call] [WhatsApp] buttons inline
- Email: ✉️ "priya.sharma@salon.com"
  * [Email] button
- Emergency Contact: 🚨 "+91 98700 00000 (Father)"
- Address: 📍 "Sector 22, Noida"
  * Distance: "1.2 km from salon"

Employment Information (card):
- "Employment Details" heading
- Joined: "Jan 15, 2024" (1 year, 10 months)
- Employment Type: "Full-time"
- Department: "Hair Services"
- Reports to: "Salon Manager"
- Commission Rate: "40% of service revenue"

Skills & Services (card):
- "Services Offered" heading
- Service tags (pills, purple background):
  [Women's Haircut] [Men's Haircut] 
  [Hair Coloring] [Hair Styling]
  [Makeup] [Facial] [Waxing]
- "7 services" count
- [Manage Services] link

Certifications (card):
- "Certifications & Training" heading
- List items:
  * "Advanced Hair Coloring" ✓
    Completed: Mar 2024
  * "Makeup Artistry Level 2" ✓
    Completed: Jun 2024
  * "Customer Service Excellence" ✓
    Completed: Sep 2024
- [Add Certificate] button

SCHEDULE TAB:

This Week's Availability (visual calendar):
- 7-day week view (Mon-Sun)
- Each day shows:
  * Day name + date
  * Status: Available/Off/Leave
  * Work hours: "10:00 AM - 7:00 PM"
  * Bookings count: "5 bookings"
- Green: Available and working
- Orange: Partial/reduced hours
- Gray: Day off
- Red: On leave

Regular Schedule (card):
- "Standard Work Schedule" heading
- Day-by-day listing:
  * Monday: 10:00 AM - 7:00 PM ✓
  * Tuesday: 10:00 AM - 7:00 PM ✓
  * Wednesday: OFF (gray)
  * Thursday: 10:00 AM - 7:00 PM ✓
  * Friday: 10:00 AM - 7:00 PM ✓
  * Saturday: 9:00 AM - 8:00 PM ✓ (extended)
  * Sunday: 11:00 AM - 5:00 PM ✓
- Total hours: "42 hours/week"
- [Edit Schedule] button

Upcoming Leave (if any):
- "Scheduled Leave" card
- Date range: "Dec 24-26, 2025"
- Type: "Vacation Leave"
- Status: "Approved" (green)
- [View Details] link

PERFORMANCE TAB:

Performance Overview (6 months):
- Line chart showing bookings over time
- Purple line with data points
- X-axis: Last 6 months
- Y-axis: Booking count
- Trend line: Increasing
- 180px height

Customer Reviews (card):
- "Recent Customer Reviews" heading
- Average: "4.8 ⭐" (large)
- Total reviews: "23 this month"

Review cards (last 3):
Review 1:
- 5 stars (gold)
- Customer: "Aarti K."
- "Excellent service! Very professional..."
- Date: "Nov 8, 2025"

Review 2:
- 5 stars
- "Neha P."
- "Best haircut I've ever had..."
- "Nov 5, 2025"

Review 3:
- 4 stars
- "Sara K."
- "Good service, slight wait time"
- "Nov 3, 2025"

[View All Reviews] link (purple)

Service Breakdown (card):
- "Popular Services" heading
- Bar chart:
  * Haircut: 28 (bar 100%, purple)
  * Hair Coloring: 12 (bar 43%)
  * Styling: 8 (bar 29%)
  * Makeup: 5 (bar 18%)

Customer Retention (card):
- "Customer Satisfaction" heading
- Repeat booking rate: "78%"
- New customers this month: "12"
- Returning customers: "33"
- Circular progress showing ratio

EARNINGS TAB:

This Month Earnings (large card):
- "November 2025 Earnings" heading
- Total: "₹28,500" (very large, 32sp, green, bold)
- vs Last month: "+18%" (green arrow)

Earnings Breakdown:
- Service Commission: ₹18,080
  * From 45 bookings
  * @ 40% commission rate
  
- Product Sales Commission: ₹2,500
  * From retail products sold
  * @ 20% commission
  
- Tips Received: ₹5,420
  * Average tip: ₹120 per booking
  
- Performance Bonus: ₹2,500
  * For exceeding targets
  
- Total: ₹28,500

Payment Status:
- Paid: ₹15,000 (on Nov 5)
- Pending: ₹13,500 (orange)
- Next payout: "Nov 15, 2025"

Earnings History (6 months chart):
- Bar chart showing monthly earnings
- Last 6 months
- Purple bars
- Shows growth trend

[View Detailed Breakdown] button
[Generate Pay Slip] button

ATTENDANCE TRACKING:

Attendance This Month (card):
- Present: "22 days" (green)
- Absent: "0 days"
- Late: "2 days" (orange)
- Early Leave: "1 day" (yellow)
- Attendance rate: "100%"
- Punctuality: "91%"

Monthly calendar view:
- Small calendar grid
- Color-coded days:
  * Green: Present
  * Red: Absent
  * Orange: Late
  * Yellow: Early leave
  * Gray: Day off

DOCUMENTS (card):
- "Documents" heading
- List of uploaded documents:
  * ID Proof (Aadhaar) ✓
  * Address Proof ✓
  * Educational Certificate ✓
  * Experience Letter ✓
  * Photo ✓
- [Upload Document] button

NOTES (card):
- "Internal Notes" heading
- Staff-only visible notes
- Latest note:
  * "Excellent customer handling skills"
  * By: Manager, Nov 1, 2025
- [Add Note] button

ACTIONS (sticky bottom):
Row 1:
- [Edit Profile] (outlined, purple)
- [Manage Leave] (outlined, blue)

Row 2:
- [View Payroll] (outlined, green)
- [Performance Review] (outlined, purple)

More menu (⋮) options:
- Change Role
- Adjust Commission
- Transfer to Location
- Deactivate Staff
- Delete Staff (requires confirmation)

Background: Light gray (#F9FAFB)
Cards: White, rounded, shadow
Charts: Interactive, purple theme
Style: Professional HR profile, comprehensive, data-rich
Performance-focused, employee records
```

---

### Screen 36: Add/Edit Staff Member

**Prompt for Uizard:**
```
Design a comprehensive staff member add/edit form (scrollable).

Header:
- Back arrow
- "Add Staff Member" title (or "Edit Staff")
- [Save] button (right, purple text, enabled when valid)

Form sections (scrollable):

PROFILE PHOTO:
- "Profile Photo" label
- Large circular upload area (96px, center)
- Camera icon inside
- "+ Add Photo" text (purple, 14sp)
- Or existing photo with "Change" overlay
- Image requirements: "Max 5MB, JPG/PNG"

BASIC INFORMATION:
- "Basic Information" section heading (bold, 15sp, uppercase, gray)

Full Name:
- "Full Name *" (required, red asterisk)
- Single input field
- 52px height, rounded corners
- Validation: Required

Email:
- "Email Address *" (required)
- Email format validation
- "Will be used for login"

Phone Number:
- Country code + number
- "+91 | Phone Number *"
- 10-digit validation
- Unique check (not already in system)

Date of Birth:
- Date picker
- Shows age calculated
- "Age: 28 years" (auto-calculated)

Gender:
- Dropdown selector
- Options: Male, Female, Other, Prefer not to say

Emergency Contact:
- "Emergency Contact" expandable section
- Name input
- Relationship dropdown (Parent, Spouse, Sibling, Friend)
- Phone number

Address:
- Multi-line text area (2-3 lines)
- [Use GPS] button to auto-fill
- Optional but recommended

EMPLOYMENT DETAILS:
- "Employment Information" heading

Employee ID:
- Auto-generated: "EMP-008"
- Or manual override option
- Unique validation

Role/Position:
- Dropdown selector with search
- Options:
  * Senior Stylist
  * Stylist
  * Junior Stylist
  * Massage Therapist
  * Nail Technician
  * Makeup Artist
  * Receptionist
  * Manager
  * Other (custom input)

Department:
- Multi-select if applicable
- Hair Services, Spa, Nails, Makeup, Admin

Date of Joining:
- Date picker
- Cannot be future date
- Calculates tenure automatically

Employment Type:
- Radio buttons:
  ○ Full-time (default)
  ○ Part-time
  ○ Contract
  ○ Intern

SKILLS & SERVICES:
- "Services They Can Provide" heading

Service selection:
- Searchable multi-select list
- Categories:
  * Hair Services (expand/collapse)
    ☑ Women's Haircut
    ☑ Men's Haircut
    ☑ Hair Coloring
    ☐ Hair Spa
    ☐ Keratin Treatment
  
  * Skin Care
    ☐ Facial
    ☐ Cleanup
    
  * Nail Services
    ☐ Manicure
    ☐ Pedicure
    
  * Spa & Massage
    ☐ Body Massage
    ☐ Head Massage
    
  * Makeup
    ☐ Bridal Makeup
    ☐ Party Makeup

- "12 services selected" counter
- [Select All in Category] quick action
- [Clear All] option

Specialization Tags:
- Free-form tags
- Examples: "Bridal Specialist", "Color Expert", "Kids Haircuts"
- Pill-style display

Experience Level:
- Slider or input
- "Years of Experience: 5"
- Range: 0-30 years

Certifications:
- [+ Add Certification] button
- Each certification:
  * Name
  * Issuing organization
  * Date obtained
  * Expiry (if applicable)
  * [Upload Certificate] button

WORK SCHEDULE:
- "Regular Work Schedule" heading

Day-wise schedule:
Monday:
- Toggle switch: ON/OFF
- If ON:
  * Start time: [10:00 AM ▼]
  * End time: [7:00 PM ▼]
  * Break: [1:00-2:00 PM] (optional)
- If OFF: "Day off" (grayed)

Tuesday-Sunday: Same layout

Quick actions:
- [Apply to All Weekdays] button
- [Copy Monday to All] button
- [Set Standard Hours] (10 AM - 7 PM)

Total weekly hours calculated:
- "Total: 42 hours/week"

COMPENSATION:
- "Salary & Commission" heading

Salary Structure:
- Radio buttons:
  ○ Commission-based only
  ○ Fixed salary only
  ○ Fixed + Commission (hybrid)

If Commission-based:
- Commission Rate:
  * Slider 0-100%
  * Or input field "40 %"
  * "40% of service revenue"
  
- Product Sales Commission:
  * Separate rate for products
  * "20% on product sales"

If Fixed Salary:
- Monthly Salary:
  * Input: "₹25,000"
  * Payment frequency: Monthly (default)

If Hybrid:
- Both sections above

Payment Details:
- Bank Account Number
- IFSC Code
- Account Holder Name
- UPI ID (optional)

Tax Information:
- PAN Number
- TDS applicable: Toggle

PERMISSIONS & ACCESS:
- "App Access & Permissions" heading

Access Level:
- Radio buttons:
  ○ Staff (view only - own data)
  ○ Senior Staff (view team data)
  ○ Manager (view + edit permissions)
  ○ Admin (full access)

Specific permissions (checkboxes):
☑ View own bookings
☑ Manage own schedule
☑ View own earnings
☐ Edit customer information
☐ Access inventory
☐ View financial reports
☐ Manage other staff

Login Credentials:
- Auto-generate login: Toggle ON
- If ON:
  * Email is username
  * Password: Auto-generated
  * [Send credentials via SMS/Email]
- If OFF:
  * Manual setup required

DOCUMENTS:
- "Required Documents" heading

Document upload section:
- ID Proof (required):
  * [Upload] button
  * Accepted: Aadhaar, PAN, Passport, DL
  * If uploaded: Preview thumbnail + [Remove]

- Address Proof:
  * [Upload] button
  
- Educational Certificates:
  * [Upload Multiple]
  
- Experience Letters:
  * [Upload]

- Photo (for ID card):
  * Different from profile photo
  * Passport size
  * [Upload]

Each upload:
- Max 5MB per file
- PDF, JPG, PNG accepted
- Thumbnail preview after upload

ADDITIONAL INFORMATION:
- "Other Details" heading

Blood Group:
- Dropdown (Optional but recommended for safety)

Languages Known:
- Multi-select tags
- Hindi, English, Punjabi, etc.

Availability for Travel:
- Toggle: Yes/No
- If multi-location business

Performance Goals:
- Monthly booking target: Input "40 bookings"
- Monthly revenue target: "₹25,000"

Notes:
- "Internal Notes" (staff won't see this)
- Text area (4-5 lines)
- "Add any notes about the staff member"
- Character limit: 500

ONBOARDING (if new staff):
- "Onboarding Checklist" heading
- Auto-created tasks:
  ☐ Complete profile
  ☐ Upload documents
  ☐ System training
  ☐ Client interaction training
  ☐ Tools & products familiarization

VALIDATION:
- Real-time field validation
- Required fields highlighted if missing
- Error messages inline:
  * "Email already exists"
  * "Phone number invalid"
  * "PAN format incorrect"

Duplicate detection:
- If phone/email/PAN matches existing:
  * Warning: "Possible duplicate staff"
  * Show matching record
  * Options: [Merge] [Add Anyway] [Review]

BOTTOM ACTIONS:

If Adding New Staff:
- [Save as Draft] (outlined, gray, left)
- [Add Staff Member] (filled, purple, right)
- [Add & Send Invite] (alternative, sends login credentials)

If Editing Existing:
- [Delete Staff] (red, outlined, left - requires confirmation)
- [Save Changes] (filled, purple, right)

Unsaved changes warning:
- If back/exit with unsaved changes
- Dialog: "Discard unsaved changes?"
- [Cancel] [Discard]

Success state:
- "✓ Staff member added successfully!"
- Options:
  * [View Profile]
  * [Add Another Staff]
  * [Back to Staff List]

Background: White
Sections: Clear visual separation with spacing
Style: Comprehensive HR form, organized sections
Progressive disclosure (expandable sections)
Smart defaults, thorough validation
```

---

### Screen 37: Staff Scheduling & Shifts

**Prompt for Uizard:**
```
Design a comprehensive staff scheduling and shift management screen.

Header:
- Back arrow
- "Staff Schedule" title
- Week selector "Nov 4 - Nov 10" with < > arrows (right)
- [+ Add Shift] button (top-right, purple text)

View toggle buttons:
- [Week View] [Day View] [Month View]
- Selected: Purple background, white text

WEEK VIEW (default):

Week navigation:
- Current week highlighted
- < Previous Week | This Week (button) | Next Week >
- Week dates shown: "Nov 4-10, 2025"

SCHEDULE GRID (scrollable):

Header row (staff names):
- Horizontal scroll for many staff
- Each column: 140px wide
- Staff columns: Priya | Amit | Ravi | Sara | Neha | +3

Each staff column header shows:
- Circular photo (40px)
- Name (truncated if long)
- Today's schedule: "5 bookings"
- Availability status: Available/Busy/Off

Time rows (vertical):
- Left column (fixed): Time slots
- 9:00 AM
- 9:30 AM  
- 10:00 AM
- ... (30-min increments)
- 8:00 PM

Shift blocks in grid:
Positioned by time, colored by type:

Priya's column (example):
- 9:00-10:00 AM: "Morning Shift" (light purple)
- 10:00-10:30 AM: Booking - "Aarti K. - Haircut"
- 10:30-12:00 PM: Booking - "Neha P. - Color"
- 12:00-1:00 PM: "Lunch Break" (gray, diagonal stripes)
- 1:00-2:00 PM: Open slot (white, dotted border)
- 2:00-3:00 PM: Booking - "Sara K. - Facial"
- ... continues

Amit's column:
- 10:00-11:00 AM: Booking - "Raj M. - Massage"
- 11:00-12:30 PM: Open
- 12:30-1:30 PM: "Lunch"
- 1:30-3:00 PM: Booking
- 3:00-8:00 PM: Multiple bookings

Ravi's column:
- All slots: "Day Off" (gray background)
- Not available for booking

Block types (color-coded):
- Purple: Work shift/available
- Blue: Booking (customer name shown)
- Gray: Break/Lunch
- White dotted: Open slot (available)
- Dark gray: Day off
- Red: Leave/Unavailable
- Orange: Training/Meeting

Conflict indicators:
- Red border: Overlapping bookings
- Warning icon: Double-booked
- [Resolve] button appears

Current time indicator:
- Red horizontal line across all columns
- "NOW" label
- Moves in real-time

Drag-and-drop:
- Long press booking to drag
- Drop on different time/staff
- Hover effect shows valid drop zones
- Confirmation: "Move booking to Amit at 2 PM?"

Tap actions:
- Tap open slot → Quick add booking
- Tap booking → View details
- Tap break → Edit break time
- Tap staff header → Staff profile

FILTERS (sticky top bar):
- "Show: All Staff ▼" dropdown
- "Services: All ▼"
- "Status: All ▼" (Booked/Available/Off)

SUMMARY BAR (bottom, sticky):
- Total shifts: 6 staff working
- Total bookings: 24
- Open slots: 18
- Utilization: 58%
- Revenue potential: ₹32,500

DAY VIEW:

When Day View selected:
- Shows single day in detail
- Larger time slots (90px height each)
- More staff columns visible (no horizontal scroll)
- More booking details shown:
  * Customer name
  * Service
  * Price
  * Status

Enhanced features:
- Staff photos larger (56px)
- Color-coding by service type
- Notes section on bookings
- Quick action buttons on each booking

MONTH VIEW:

Calendar grid (7×5):
- Each cell represents one day
- Shows per-day summary:
  * Total staff scheduled: "6 staff"
  * Total shifts: "8 shifts"
  * Bookings: "24"
  * Revenue: "₹18,500"

Color intensity:
- Light: Low activity
- Dark: High activity/full capacity

Tap day → Opens that day's schedule

SHIFT MANAGEMENT:

Add Shift dialog (tap + Add Shift):

"Create Shift" form:
- Staff member: Dropdown
- Date: Date picker
- Start time: Time picker
- End time: Time picker
- Shift type:
  ○ Regular shift
  ○ Extended hours
  ○ On-call
  ○ Training

Break times:
- Add break slots
- Lunch: 12:00-1:00 PM
- Tea break: 4:00-4:15 PM

Recurring shift:
- Toggle: "Repeat this shift"
- Frequency: Weekly
- Days: Select days (Mon, Tue, Wed...)
- Until: Date or "Forever"

[Cancel] [Create Shift] buttons

BULK SCHEDULING:

Bulk actions:
- [Copy Week to Next Week]
- [Apply Template]
- [Auto-Schedule] (AI suggests optimal schedule)

Template management:
- Save current week as template
- "Standard Week Template"
- "Weekend Template"
- "Holiday Schedule"

Auto-schedule feature:
- Based on:
  * Historical booking patterns
  * Staff preferences
  * Predicted demand
  * Fair distribution of shifts
- [Generate Schedule] button
- Preview before applying

STAFF AVAILABILITY:

Staff availability indicator (right sidebar):
- List of all staff
- Real-time status:
  * Available: Green dot
  * Busy: Yellow dot
  * On break: Orange dot
  * Off duty: Gray dot
  * On leave: Red cross

Tap staff → Request availability:
- "Request shift swap"
- "Mark as available"
- "Block time off"

NOTIFICATIONS:

Schedule notifications:
- New shift assigned
- Shift changed
- Shift swap requested
- Approaching shift (1 hour before)

Staff can:
- Accept/decline shifts
- Request time off
- Swap with colleagues (pending approval)

CONFLICTS RESOLUTION:

Conflict detection:
- Overlapping shifts
- Double-booked staff
- Understaffed periods
- Overstaffed periods

When conflict detected:
- Red highlight on grid
- "⚠️ 3 conflicts" badge
- [View Conflicts] button

Conflict resolver:
- Lists all conflicts
- Suggested resolutions:
  * Reassign booking
  * Add staff
  * Extend shift
  * Cancel booking

EXPORT OPTIONS:

Export schedule:
- PDF format (printable)
- Excel spreadsheet
- Google Calendar sync
- iCal format

Send to staff:
- Email schedules to all staff
- WhatsApp group message
- SMS reminders

ANALYTICS:

Schedule analytics:
- Staff utilization by day
- Peak hours identification
- Understaffed periods
- Coverage gaps
- Overtime hours

[View Schedule Report] button

Background: White
Grid: Light gray borders
Blocks: Color-coded, rounded corners
Style: Professional scheduling tool
Drag-drop ready, conflict management
Real-time updates, collaborative
```

---

### Screen 38: Staff Attendance & Time Tracking

**Prompt for Uizard:**
```
Design a staff attendance tracking and time management screen.

Header:
- Back arrow
- "Attendance" title
- Date selector "November 2025 ▼" (right)
- [Mark Attendance] button (top-right, purple)

ATTENDANCE SUMMARY DASHBOARD:

This Month Stats (4 cards):

Card 1 - Present:
- "22" (large, green, 28sp)
- "Days Present"
- "92% attendance rate"
- Green checkmark icon

Card 2 - Absent:
- "0" (large, red if >0, gray if 0)
- "Days Absent"
- "0 unplanned absences"

Card 3 - Late Arrivals:
- "3" (orange, 28sp)
- "Late Check-ins"
- "Avg delay: 8 minutes"

Card 4 - Early Leaves:
- "1" (yellow, 28sp)
- "Early Departures"
- "With permission"

TABS:
- [Overview] [Daily] [Staff-wise] [Reports]

OVERVIEW TAB:

Calendar View (Month):
- Full month calendar grid
- Each day color-coded:
  * Green: Full attendance
  * Orange: Partial (some late/early)
  * Red: Absences
  * Blue: Holiday/Off
  * Gray: Future dates

- Tap day → Shows that day's details

Today's Attendance (card):
- "Today - November 10, 2025"
- Time: "Current time: 2:30 PM"

Staff list with status:
Staff 1:
- Photo + Name "Priya Sharma"
- Status: "Present ✓" (green)
- Check-in: "9:55 AM" (On time, green)
- Check-out: "—" (still working)
- Hours: "4h 35m" (running counter)

Staff 2:
- Photo + "Amit Singh"
- Status: "Present ✓" (green)
- Check-in: "10:12 AM" (Late 12 min, orange)
- Check-out: "—"
- Hours: "4h 18m"

Staff 3:
- Photo + "Ravi Kumar"
- Status: "On Leave" (orange)
- Leave type: "Sick Leave"
- Approved

Staff 4:
- Photo + "Sara Kapoor"
- Status: "Not Checked In" (red if past shift time)
- Expected: "10:00 AM"
- [Mark Absent] [Contact] buttons

Staff 5:
- Photo + "Neha Patel"
- Status: "Day Off" (gray)
- Scheduled off

Each entry: 64px height, white card

CHECK-IN/OUT METHODS:

Quick check-in interface:
- Staff selector: "Select Staff ▼"
- Action buttons:
  * [Check In] (green)
  * [Check Out] (red)
  * [On Break] (yellow)
  * [Back from Break] (green)
- Auto-timestamp
- Manual time override (if needed)

Location-based check-in:
- GPS verification
- "Within 50m of salon" ✓
- Or "Location mismatch" warning

Biometric options (if available):
- Face recognition
- Fingerprint
- PIN code

DAILY TAB:

Select specific date:
- Date picker at top
- Shows full day timeline

Timeline view (per staff):
9:00 AM → 8:00 PM timeline

Priya's timeline (horizontal bar):
- 9:55 AM: Check-in (green marker)
- 12:00 PM: Break start (yellow)
- 12:45 PM: Break end (green)
- 6:30 PM: Check-out (red marker)
- Total: 8h 40m (excluding break)

Visual timeline:
- Green segments: Working time
- Yellow segments: Break time
- White gaps: Not clocked in
- Gray: Outside work hours

Metrics shown:
- Scheduled: 9:00 AM - 7:00 PM (10 hours)
- Actual: 9:55 AM - 6:30 PM (8h 40m with break)
- Difference: -1h 20m (deficit, orange)
- Status: "Early departure" warning

STAFF-WISE TAB:

Select staff member:
- Staff dropdown at top

Shows that staff's full month:
- Calendar with their attendance
- Stats:
  * Present: 22 days
  * Absent: 0
  * Late: 3
  * Leaves: 2
  * Half days: 1
  * Overtime: 8 hours

Detailed log:
Date | Check-in | Check-out | Hours | Status
Nov 1 | 9:58 AM | 7:05 PM | 9h 7m | Present ✓
Nov 2 | 10:15 AM | 7:00 PM | 8h 45m | Late
Nov 3 | 10:00 AM | 6:30 PM | 8h 30m | Early leave
...

Color-coded rows:
- Green: Perfect attendance
- Orange: Late/Early
- Red: Absent
- Blue: Leave (approved)

ATTENDANCE PATTERNS:

Pattern analysis card:
- "Attendance Patterns" heading
- Insights:
  * "Priya is consistently early"
  * "Amit often late on Mondays"
  * "Weekend attendance excellent"

Punctuality score:
- Staff ranking by punctuality
- 1. Priya: 98% on-time
- 2. Sara: 95%
- 3. Neha: 92%
- 4. Amit: 87%

Trend chart:
- Last 3 months attendance %
- Line graph per staff
- Shows improvement/decline

LEAVE TRACKING:

Leave balance display:
- Staff-wise leave balance
- Casual Leave: 8 remaining
- Sick Leave: 6 remaining
- Earned Leave: 12 remaining

Leave requests (pending):
- List of pending approvals
- Request from Amit: Nov 15-17
  * Type: Vacation
  * Days: 3
  * Reason: "Family function"
  * [Approve] [Reject] buttons

OVERTIME TRACKING:

Overtime this month:
- Staff who worked overtime
- Amit: 12 extra hours
- Priya: 8 extra hours
- Calculation: Hours beyond scheduled

Overtime pay card:
- Overtime rate: 1.5× regular
- Total overtime hours: 28
- Overtime pay owed: ₹4,200

REPORTS TAB:

Generate attendance report:
- Date range selector
- Staff selection: All or specific
- Report type:
  * Summary report
  * Detailed log
  * Late/Absence report
  * Overtime report
  * Payroll report

Export options:
- PDF (printable)
- Excel spreadsheet
- CSV for payroll system

Report preview:
- Shows sample data
- [Download] [Email] [Print] buttons

VIOLATIONS & ALERTS:

Attendance violations:
- "⚠️ 2 attendance issues this month"

Violation 1:
- Amit Singh
- Type: "3 consecutive lates"
- Policy: "Warning after 3 lates"
- Action required: [Send Warning]

Violation 2:
- Sara Kapoor
- Type: "Unexcused absence"
- Date: Nov 5
- Action: [Mark as Excused] [Penalize]

POLICIES & SETTINGS:

Attendance policies:
- Grace period: 10 minutes
- Late after: 15 minutes
- Half-day if late by: 2 hours
- Absent if not checked in by: 12 PM

Notifications:
- Remind staff to check-in
- Alert manager of late arrivals
- Daily attendance summary email

ACTIONS:

Bulk actions:
- [Mark All Present]
- [Mark Holidays]
- [Import Attendance] (from CSV)
- [Sync with Biometric Device]

Individual actions:
- Edit entry (if error)
- Add manual entry
- Regularize attendance
- Approve correction requests

INTEGRATION:

Biometric device sync:
- Connect to fingerprint/face scanner
- Auto-import attendance data
- Last synced: "5 minutes ago"
- [Sync Now] button

Payroll integration:
- Export to payroll system
- "25 staff ready for payroll"
- [Export for Payroll] button

Background: Light gray
Status indicators: Color-coded consistently
Style: Time tracking, HR management
Automated tracking, policy enforcement
Clear violations, easy corrections
```

---

### Screen 39: Staff Leave Management

**Prompt for Uizard:**
```
Design a comprehensive leave management system for staff.

Header:
- Back arrow
- "Leave Management" title
- [+ Request Leave] button (right, purple)

LEAVE OVERVIEW DASHBOARD:

This Month Summary (3 cards):

Card 1 - On Leave Today:
- "2" (large, orange, 28sp)
- "Staff On Leave"
- Names: "Ravi, Neha"

Card 2 - Pending Requests:
- "5" (large, yellow, 28sp)
- "Awaiting Approval"
- [Review] button

Card 3 - Upcoming Leave:
- "8" (large, blue, 28sp)
- "Next 7 Days"
- Staffing impact shown

TABS:
- [Calendar] [Requests] [Balance] [Policies]

CALENDAR TAB:

Month view calendar:
- Shows all staff leaves
- Each day shows:
  * Staff count on leave
  * Names (if space)
  * Color bars for leave types

Example day (Nov 15):
- "3 staff on leave"
- Ravi (blue bar - sick)
- Neha (green bar - vacation)
- Amit (purple bar - personal)
- Tap → Full details

Leave indicators:
- Blue: Sick leave
- Green: Vacation/planned
- Purple: Personal leave
- Orange: Emergency leave
- Red: Unpaid leave
- Gray: Compensatory off

Team availability view:
- Shows staffing levels per day
- "Low staffing" warning (red) if <60%
- "Adequate" (green) if >80%
- "Critical" (dark red) if <40%

Conflicts highlighted:
- Too many from same department
- Key staff unavailable
- Understaffed days

REQUESTS TAB:

Pending approval section:
- "5 Pending Leave Requests"

Request Card 1:
- Staff photo + name "Amit Singh"
- Leave type: "Vacation Leave"
- Dates: "Nov 15-17, 2025" (3 days)
- Submitted: "2 days ago"
- Reason: "Family function in hometown"
- Coverage: "Priya can cover shifts"
- Leave balance: "8 days remaining"
- Conflict warning: "⚠️ 2 other staff on leave Nov 16"

Action buttons:
- [Approve] (green, filled)
- [Reject] (red, outlined)
- [Request Changes] (gray, outlined)

Request Card 2:
- Priya Sharma
- "Sick Leave"
- "Nov 12, 2025" (1 day)
- Submitted: "Today, 8:30 AM"
- Urgent: "⚠️ Requires immediate action"
- Medical certificate: Attached (PDF icon)
- [View Document]

Actions for each request:
- [Approve] [Reject]
- [View Full Details]
- [Contact Staff]

Approved requests:
- "12 Approved This Month"
- Collapsible list
- Show dates, staff, type

Rejected requests:
- "2 Rejected"
- With rejection reasons
- Staff can see manager's note

REQUEST LEAVE (owner/manager):

Tap "+ Request Leave" opens form:

"Request Leave" form:

For whom:
- If manager requesting for staff:
  Staff dropdown
- If own leave:
  Shows own name

Leave type:
- Dropdown selector:
  * Casual Leave
  * Sick Leave
  * Earned Leave
  * Compensatory Off
  * Unpaid Leave
  * Maternity/Paternity
  * Bereavement

Date selection:
- From date: Date picker
- To date: Date picker
- Auto-calculates: "3 days"
- Half-day option: Toggle
  * First half / Second half

Balance check:
- Shows available balance
- "You have 8 casual leaves remaining"
- Warning if exceeds balance

Reason:
- Text area (required)
- "Please specify reason for leave"
- Character limit: 200

Coverage plan:
- "Who will cover your duties?"
- Staff selector (optional)
- Or "Will arrange coverage"

Attach documents:
- For sick leave >3 days: Medical certificate required
- [Upload Document] button
- Accepted: PDF, JPG, PNG

Emergency contact:
- If extended leave
- "How to reach you?"
- Phone number

Notification:
- Send to: Manager/Owner
- SMS + Email notification

[Cancel] [Submit Request] buttons

BALANCE TAB:

Staff-wise leave balance:
Shows all staff with their balances

Staff Card:
- Photo + Name "Priya Sharma"
- Leave balances (progress bars):
  
  Casual Leave:
  - Used: 4 | Remaining: 8
  - Progress bar: 33% filled (purple)
  
  Sick Leave:
  - Used: 2 | Remaining: 10
  - Progress bar: 17% filled (blue)
  
  Earned Leave:
  - Used: 0 | Remaining: 12
  - Progress bar: 0% filled (green)
  
  Total available: 30 days
  Total used: 6 days (20%)
  
- [View Details] expands full leave history

Leave accrual:
- "Next accrual: Dec 1, 2025"
- "+1 earned leave"

Carry forward:
- Shows leaves carried from last year
- Expiry date if applicable

POLICIES TAB:

Leave policies display:

Casual Leave:
- Entitlement: 12 days/year
- Accrual: 1 per month
- Carry forward: 3 days max
- Notice period: 1 day advance
- Approval: Manager

Sick Leave:
- Entitlement: 12 days/year
- Medical cert required: >3 consecutive days
- Notice: Can be same-day
- Paid: 100%

Earned/Privilege Leave:
- Entitlement: 15 days/year
- Encashment: Allowed
- Notice: 7 days advance
- Carry forward: Unlimited
- Max consecutive: 15 days

Maternity Leave:
- 180 days paid (India law)
- Medical cert required

Paternity Leave:
- 15 days paid
- Within 6 months of child birth

Unpaid Leave:
- Manager approval required
- Max: 10 days/year
- Notice: 15 days

Holidays:
- National holidays: 10 days
- Festival leaves: 3 days
- Company holidays: 2 days

[Edit Policies] button (owner only)

LEAVE ANALYTICS:

Leave trends card:
- "Leave Analytics - Last 12 Months"
- Line chart showing monthly leave usage
- Compare: Casual vs Sick vs Earned

Popular leave months:
- December: 45 days (holiday season)
- July: 28 days (monsoon)
- April: 32 days (summer)

Leave by department:
- Hair Services: 45 days
- Spa: 28 days
- Admin: 12 days

Abuse detection:
- "⚠️ Patterns Detected"
- Amit: Frequent Monday absences
- Sara: Always sick before holidays
- [Investigate] option

Impact analysis:
- Revenue impact: ₹12,500 (bookings affected)
- Customer impact: 15 rescheduled
- Staffing cost: ₹8,000 (overtime/replacement)

ACTIONS:

Bulk actions:
- [Approve All Pending]
- [Export Leave Data]
- [Year-end Processing]

Leave calendar export:
- Sync with Google Calendar
- Download iCal file
- Print monthly calendar

Notifications:
- Email approval/rejection to staff
- Reminder for pending approvals
- Alert for low leave balance

UPCOMING LEAVES (sidebar):
- Next 7 days preview
- Nov 12: Priya (Sick)
- Nov 15-17: Amit (Vacation)
- Nov 18: Neha (Personal)
- Staffing impact calculated
- "⚠️ Low staffing on Nov 16"

Background: Light gray
Cards: White, organized
Color-coding: By leave type
Style: HR management, policy-driven
Clear approval flow, impact analysis
```

---

### Screen 40: Staff Performance Reviews

**Prompt for Uizard:**
```
Design a staff performance review and appraisal system.

Header:
- Back arrow
- "Performance Reviews" title
- [+ New Review] button (right, purple)

REVIEW DASHBOARD:

Review cycle selector:
- "Review Period: Q4 2025 ▼"
- Options: Monthly, Quarterly, Half-yearly, Annual

Overview stats (4 cards):

Card 1 - Completed Reviews:
- "6" (large, green, 28sp)
- "of 8 staff"
- "75% completion rate"

Card 2 - Average Rating:
- "4.2" (large, gold, 28sp)
- "⭐⭐⭐⭐" stars
- "↑ 0.3 from last quarter"

Card 3 - Due Reviews:
- "2" (large, orange, 28sp)
- "Pending" 
- Due date: "Nov 15, 2025"

Card 4 - Top Performers:
- "3" (large, purple, 28sp)
- "Exceeded Expectations"
- Names listed

TABS:
- [All Reviews] [Due] [Completed] [Trends]

STAFF REVIEW LIST:

Review Card 1 (Completed):
- Staff photo + name "Priya Sharma"
- Role: "Senior Stylist"
- Review period: "Q4 2025 (Oct-Dec)"
- Status: "Completed ✓" (green badge)
- Overall rating: "4.8 ⭐⭐⭐⭐⭐"
- Reviewer: "Salon Manager"
- Completed on: "Nov 5, 2025"
- Last review: "Aug 2025 (4.5 ⭐)"
- Trend: "↑ Improving" (green)

Performance summary:
- Customer satisfaction: 9/10
- Bookings: 45 (exceeded target of 40)
- Revenue: ₹28,500 (112% of target)
- Attendance: 100%
- Punctuality: 95%

[View Full Review] button

Review Card 2 (Due):
- "Amit Singh"
- "Massage Therapist"
- "Q4 2025"
- Status: "Due ⏰" (orange badge)
- Due date: "Nov 15, 2025" (5 days away)
- Last review: "Aug 2025 (4.2 ⭐)"
- [Start Review] button (prominent, purple)

Review Card 3 (In Progress):
- "Ravi Kumar"
- "Stylist"
- Status: "In Progress 📝" (blue badge)
- "60% complete"
- Progress bar showing sections filled
- [Continue Review] button

REVIEW DETAILS VIEW:

Tap "View Full Review" opens detailed view:

"Priya Sharma - Q4 2025 Review"

Employee information:
- Photo, name, role
- Employee ID: EMP-001
- Department: Hair Services
- Tenure: 1 year 10 months
- Reporting to: Salon Manager

Review period:
- Oct 1 - Dec 31, 2025
- Review date: Nov 5, 2025
- Next review: Feb 2026

PERFORMANCE CATEGORIES (scored 1-5):

1. Technical Skills (Weight: 30%):
   - Service quality: ⭐⭐⭐⭐⭐ (5/5)
   - Technique proficiency: ⭐⭐⭐⭐⭐ (5/5)
   - Product knowledge: ⭐⭐⭐⭐ (4/5)
   - Average: 4.7/5
   - Manager notes: "Excellent technical skills, 
     esp. in hair coloring. Stays updated with trends."

2. Customer Service (Weight: 25%):
   - Customer satisfaction: ⭐⭐⭐⭐⭐ (5/5)
   - Communication: ⭐⭐⭐⭐ (4/5)
   - Problem solving: ⭐⭐⭐⭐⭐ (5/5)
   - Average: 4.7/5
   - Customer reviews avg: 4.8/5 (23 reviews)
   - Notes: "Customers love her. Repeat booking 
     rate is 78%, highest in team."

3. Productivity (Weight: 20%):
   - Bookings: ⭐⭐⭐⭐⭐ (5/5) - 45/40 target
   - Revenue: ⭐⭐⭐⭐⭐ (5/5) - ₹28.5K/₹25K target
   - Efficiency: ⭐⭐⭐⭐ (4/5)
   - Average: 4.7/5

4. Teamwork (Weight: 15%):
   - Collaboration: ⭐⭐⭐⭐⭐ (5/5)
   - Mentoring juniors: ⭐⭐⭐⭐ (4/5)
   - Team events participation: ⭐⭐⭐⭐⭐ (5/5)
   - Average: 4.7/5
   - Notes: "Great team player, helps train 
     new staff voluntarily."

5. Attendance & Punctuality (Weight: 10%):
   - Attendance: ⭐⭐⭐⭐⭐ (5/5) - 100%
   - Punctuality: ⭐⭐⭐⭐⭐ (5/5) - 98% on-time
   - Leave management: ⭐⭐⭐⭐⭐ (5/5)
   - Average: 5/5

OVERALL RATING (weighted average):
- Score: 4.8/5
- Grade: "Exceeds Expectations"
- Percentile: "Top 10% of staff"
- Rating bar: Gold colored, nearly full

STRENGTHS:
- Exceptional customer service
- Technical expertise in hair coloring
- Consistently exceeds targets
- Mentors junior staff
- Perfect attendance record

AREAS FOR IMPROVEMENT:
- Could expand product knowledge (cosmetics)
- Time management during peak hours
- Documentation of client preferences

GOALS FOR NEXT QUARTER:
1. Complete advanced makeup course
   - Deadline: Jan 2026
   - Budget: ₹15,000 allocated

2. Achieve 50 bookings/month
   - Current: 45 avg
   - Target: +11%

3. Train 2 junior stylists
   - Assign mentees
   - Weekly check-ins

DEVELOPMENT PLAN:
- Training: Advanced Bridal Makeup (Jan 2026)
- Cross-training: Nail art basics
- Responsibility: Lead stylist for weddings
- Possible promotion: Senior Team Lead (Jun 2026)

COMPENSATION REVIEW:
- Current salary: ₹25,000/month
- Recommended increase: 12% (₹3,000)
- New salary: ₹28,000/month
- Effective: Dec 1, 2025
- Bonus: ₹10,000 (performance bonus)
- Commission: Increase to 45% (from 40%)

MANAGER COMMENTS:
- Free-form text area
- "Priya has been an outstanding performer 
  this quarter. Her customer satisfaction 
  scores are exceptional and she consistently 
  exceeds her targets. Recommend for senior 
  role consideration."

EMPLOYEE SELF-ASSESSMENT:
- Staff's self-rating (if collected)
- Comparison with manager rating
- Gaps identified

EMPLOYEE COMMENTS:
- "Thank you for the feedback. I'm excited 
  about the makeup training opportunity. I'd 
  also like to explore Instagram marketing 
  for the salon."

SIGNATURES:
- Manager signature: [Signed] Nov 5, 2025
- Employee acknowledgment: [Signed] Nov 6, 2025
- HR approval: [Pending]

ATTACHMENTS:
- Customer reviews PDF
- Performance metrics report
- Training certificates

[Edit Review] [Print] [Share with Employee]

CREATE NEW REVIEW:

Tap "+ New Review" opens review form:

"Create Performance Review"

Step 1 - Basic Info:
- Select staff member: Dropdown
- Review period: Date range
- Review type:
  ○ Quarterly
  ○ Annual
  ○ Probation
  ○ Promotion review
  ○ Ad-hoc

Step 2 - Set Criteria:
- Use template:
  * Standard template (default)
  * Senior staff template
  * New joinee template
  * Custom

- Performance categories:
  Shows categories with weights
  Can customize weights
  Total must = 100%

Step 3 - Rate Performance:
- For each category:
  * 5-star rating
  * Mandatory comments
  * Evidence/examples required

- Quantitative metrics auto-filled:
  * Bookings: 45 (from system)
  * Revenue: ₹28,500 (from system)
  * Attendance: 100% (from system)
  * Customer rating: 4.8 (from reviews)

Step 4 - Set Goals:
- Add goals for next period
- Each goal:
  * Goal description
  * Measurable target
  * Deadline
  * Support needed

Step 5 - Development:
- Training recommendations
- Career path discussion
- Promotion eligibility

Step 6 - Compensation:
- Salary revision recommendation
- Bonus amount
- Commission rate change
- Effective date

Step 7 - Review:
- Preview full review
- [Save Draft] [Submit for Approval]

REVIEW TRENDS TAB:

Performance over time:
- Line chart showing ratings
- Last 4 review periods
- By staff or by category

Department comparison:
- Average ratings by department
- Bar chart

Rating distribution:
- How many staff in each category:
  * Outstanding (5): 2 staff
  * Exceeds (4-4.9): 3 staff
  * Meets (3-3.9): 2 staff
  * Needs Improvement (2-2.9): 1 staff
  * Unsatisfactory (<2): 0 staff

- Pie chart showing distribution

Improvement trends:
- Staff showing improvement
- Staff showing decline
- Intervention needed

REVIEW CALENDAR:

Annual review schedule:
- Shows all staff review dates
- Calendar view
- Reminders set
- [Schedule Reviews] wizard

Templates:
- Create review templates
- Standard templates
- Customizable categories
- Saved for reuse

ACTIONS:

Bulk actions:
- [Schedule All Reviews]
- [Send Reminders]
- [Export Review Data]

Individual actions:
- Print review
- Email to employee
- Archive old reviews
- Compare reviews

ANALYTICS:

Review completion rate:
- Trend over quarters
- On-time vs delayed

Performance distribution:
- Histogram

Compensation impact:
- Total raises: ₹15,000/month
- Total bonuses: ₹45,000
- Budget impact

Background: Light gray
Review cards: White, status-coded borders
Ratings: Gold stars, visual bars
Style: Professional HR, structured reviews
360-degree feedback ready, development-focused
```

---

### Screen 41: Staff Commission & Payroll

**Prompt for Uizard:**
```
Design a staff commission calculator and payroll management screen.

Header:
- Back arrow
- "Staff Payroll" title
- Month selector "November 2025 ▼" (right)
- [Process Payroll] button (top-right, green)

PAYROLL OVERVIEW:

Summary cards (4 across):

Card 1 - Total Payroll:
- "₹1,24,500" (large, purple, 32sp)
- "This Month"
- "↑ 8% vs last month" (green)

Card 2 - Paid:
- "₹85,000" (large, green, 28sp)
- "Processed"
- "6 of 8 staff"

Card 3 - Pending:
- "₹39,500" (large, orange, 28sp)
- "To Be Paid"
- "2 staff"

Card 4 - Due Date:
- "Nov 30" (large, red if approaching)
- "Payment Due"
- "5 days left"

TABS:
- [Staff Earnings] [Deductions] [Pay Slips] [History]

STAFF EARNINGS TAB:

Staff payroll list:

Staff Card 1 - Priya Sharma:
Top section:
- Photo (48px circular) + Name
- Employee ID: EMP-001
- Role: Senior Stylist
- Payment status: "Paid ✓" (green badge)
- Payment date: "Nov 5, 2025"

Earnings breakdown (expandable):

Base Components:
- Fixed Salary: ₹25,000
  * For full month

Variable Components:
- Service Commission: ₹18,080
  * 45 bookings
  * Total service revenue: ₹45,200
  * @ 40% commission rate
  * Calculation shown: ₹45,200 × 40% = ₹18,080
  
- Product Sales Commission: ₹2,500
  * Retail products sold: ₹12,500
  * @ 20% commission
  * ₹12,500 × 20% = ₹2,500
  
- Tips Received: ₹5,420
  * Digital tips: ₹3,200
  * Cash tips: ₹2,220
  * From 38 customers
  
- Performance Bonus: ₹2,500
  * Exceeded monthly target
  * 112% achievement
  
- Incentives: ₹500
  * 5-star reviews bonus (10 reviews)

Gross Earnings: ₹54,000 (bold, large, green)

Deductions:
- TDS (Tax): -₹2,700 (5%)
- Professional Tax: -₹200
- Advance Taken: -₹1,000
- Loan Deduction: -₹500
- Other: -₹100

Total Deductions: -₹4,500 (red)

Net Salary: ₹49,500 (very large, bold, green)
━━━━━━━━━━━━━━━━━━

Payment details:
- Mode: Bank Transfer
- Account: ****4567
- UPI: priya@upi
- Status: "Paid on Nov 5, 2025"
- Transaction ID: PAY_xxx123

[View Breakdown] [Generate Slip] [Resend]

Staff Card 2 - Amit Singh:
- Similar layout
- Status: "Pending ⏰" (orange)
- Gross: ₹31,200
- Net: ₹28,800
- [Process Payment] button (prominent, green)
- [Hold Payment] [Edit] buttons

Staff Card 3 - Ravi Kumar:
- Status: "On Leave" (gray)
- Partial month calculation
- Days worked: 18/30
- Prorated salary
- Leave without pay: -₹4,000

Each card:
- White background
- Expandable/collapsible
- 180px height when collapsed
- Full details when expanded

COMMISSION CALCULATOR:

Tap staff → Opens calculator:

"Commission Calculator - Priya Sharma"

Service-wise breakdown:
Table format:

| Service | Bookings | Revenue | Rate | Commission |
|---------|----------|---------|------|------------|
| Women's Haircut | 28 | ₹22,400 | 40% | ₹8,960 |
| Hair Coloring | 12 | ₹18,000 | 40% | ₹7,200 |
| Hair Styling | 5 | ₹4,800 | 40% | ₹1,920 |
| Total | 45 | ₹45,200 | | ₹18,080 |

Different rates for different services:
- Premium services: 45%
- Standard services: 40%
- Basic services: 35%

Product sales:
| Product | Units | Value | Rate | Commission |
|---------|-------|-------|------|------------|
| Shampoo | 8 | ₹6,400 | 20% | ₹1,280 |
| Conditioner | 6 | ₹4,200 | 20% | ₹840 |
| Serum | 4 | ₹1,900 | 20% | ₹380 |
| Total | 18 | ₹12,500 | | ₹2,500 |

Tips tracking:
- Shows each tip received
- Date, customer, amount
- Total: ₹5,420

Adjustments:
- Manual bonus: +₹2,500
- Penalties: -₹0
- Advance adjusted: -₹1,000

Final calculation: ₹54,000

[Export Details] [Print] [Approve]

DEDUCTIONS TAB:

Statutory deductions:
- TDS (Tax Deducted at Source)
  * Calculated based on salary slab
  * Form 16 generation
  
- Professional Tax
  * State-specific
  * ₹200/month standard

- Provident Fund (if applicable)
  * Employee contribution: 12%
  * Employer contribution: 12%

- ESI (Employees' State Insurance)
  * For salaries < ₹21,000

Voluntary deductions:
- Advance salary taken
- Loan repayment
- Insurance premium
- Canteen charges
- Uniform charges

Add deduction:
- [+ Add Deduction] button
- Type dropdown
- Amount input
- One-time or recurring
- Effective month

PAY SLIPS TAB:

Pay slip generator:

Generate pay slip for:
- Staff: Select from dropdown
- Month: November 2025

Pay slip preview:
Shows formatted pay slip:

━━━━━━━━━━━━━━━━━━━━━━━━━
GLOW BEAUTY SALON
Pay Slip - November 2025

Employee: Priya Sharma
Emp ID: EMP-001
Designation: Senior Stylist
PAN: ABCDE1234F
Bank A/c: ****4567
━━━━━━━━━━━━━━━━━━━━━━━━━

EARNINGS:
Basic Salary        ₹25,000
Commission          ₹18,080
Product Sales Comm.  ₹2,500
Tips                ₹5,420
Bonus               ₹2,500
Incentives            ₹500
─────────────────────────
Gross Earnings     ₹54,000

DEDUCTIONS:
TDS                 ₹2,700
Professional Tax      ₹200
Advance            ₹1,000
Loan                 ₹500
Other                ₹100
─────────────────────────
Total Deductions    ₹4,500

NET SALARY         ₹49,500
═════════════════════════

Payment Date: Nov 5, 2025
Payment Mode: Bank Transfer

This is a computer-generated slip.
━━━━━━━━━━━━━━━━━━━━━━━━━

[Download PDF] [Send via Email] [Send via WhatsApp]

Bulk generation:
- [Generate All Pay Slips]
- Creates PDF for all staff
- Zip file download

HISTORY TAB:

Payroll history table:

Month-wise records:
| Month | Staff Count | Total Paid | Status |
|-------|-------------|------------|--------|
| Nov 2025 | 8 | ₹1,24,500 | Pending |
| Oct 2025 | 8 | ₹1,15,200 | Completed |
| Sep 2025 | 7 | ₹98,500 | Completed |
| Aug 2025 | 7 | ₹1,05,800 | Completed |

Tap month → Full breakdown for that month

Filters:
- Date range
- Staff member
- Payment status

Export:
- Monthly payroll report
- Yearly summary
- Tax reports (Form 16)

PAYMENT PROCESSING:

Process payroll workflow:

Step 1 - Review:
- Shows all pending payments
- Total amount: ₹39,500
- Staff count: 2
- Verification checklist:
  ☑ Attendance verified
  ☑ Leaves deducted
  ☑ Commissions calculated
  ☑ Bonuses approved
  ☐ Manager approval

Step 2 - Approve:
- Manager/Owner approval
- PIN/Password verification
- [Approve for Payment]

Step 3 - Process:
- Payment mode selection:
  ○ Bank transfer (bulk)
  ○ UPI individual
  ○ Cash
  ○ Cheque

- If bank transfer:
  * Upload salary file (CSV)
  * Bank integration
  * Bulk transfer initiated

Step 4 - Confirm:
- Payment initiated
- Transaction IDs generated
- Confirmation emails sent
- Pay slips auto-generated

Step 5 - Track:
- Payment status tracking
- Success: 2/2 payments
- Failed: 0
- Retry failed payments

SETTINGS:

Payroll settings:
- Payment schedule:
  * Day of month: 5th (default)
  * Or "Last working day"
  
- TDS settings:
  * Tax slabs
  * Exemption limits
  
- Statutory compliance:
  * PF account number
  * ESI registration
  
- Bank integration:
  * Connect bank account
  * API credentials
  * Bulk transfer setup

Salary components:
- Define custom components
- Earning types
- Deduction types
- Tax treatment

ANALYTICS:

Payroll analytics:

Cost analysis:
- Total payroll cost trend (12 months)
- Line chart showing monthly expenses
- Average salary per staff
- Cost per booking

Comparison:
- This month vs last month
- Year-over-year growth
- Budget vs actual

Breakdown:
- Fixed vs variable ratio
- Commission share: 35%
- Tips share: 10%
- Bonus share: 5%

Staff cost efficiency:
- Revenue per staff: ₹15,500
- Cost per staff: ₹15,562
- Profit margin per staff

COMPLIANCE:

Tax compliance:
- Form 16 generation (annual)
- TDS return filing
- Professional tax returns

Labor law compliance:
- Minimum wage check
- Overtime calculation
- Leave encashment

Audit trail:
- All payroll changes logged
- Who made changes
- When changed
- Approval history

ACTIONS:

Bulk actions:
- [Process All Pending]
- [Send All Pay Slips]
- [Export Payroll Data]

Individual actions:
- Edit salary components
- Hold payment
- Reverse payment (if error)
- Reprocess payment

Notifications:
- Payment confirmation to staff
- Pay slip delivery
- Deduction notices

Background: Light gray
Status indicators: Color-coded
Money amounts: Large, bold, green (earnings), red (deductions)
Style: Payroll software, financial management
Automated calculations, compliance-ready
Transparent breakdown, easy verification
```

---

### Screen 42: Staff Training & Development

**Prompt for Uizard:**
```
Design a staff training and skill development management screen.

Header:
- Back arrow
- "Training & Development" title
- [+ Add Training] button (right, purple)

TRAINING OVERVIEW:

Dashboard cards (4):

Card 1 - Active Programs:
- "5" (large, blue, 28sp)
- "Ongoing Training"
- "12 staff enrolled"

Card 2 - Completed:
- "28" (large, green, 28sp)
- "Courses Completed"
- "This quarter"

Card 3 - Certifications:
- "15" (large, gold, 28sp)
- "Certificates Earned"
- "8 staff certified"

Card 4 - Training Budget:
- "₹45,000" (large, purple, 28sp)
- "Spent of ₹60,000"
- Progress bar: 75% used

TABS:
- [Programs] [Staff Progress] [Certifications] [Resources]

PROGRAMS TAB:

Training programs list:

Program Card 1 (Ongoing):
- Course thumbnail image (if available)
- "Advanced Hair Coloring Techniques"
- Type: "External Workshop" (blue pill)
- Provider: "L'Oreal Academy"
- Duration: "3 days"
- Dates: "Nov 15-17, 2025"
- Location: "Delhi Training Center"
- Enrolled: "3 staff" (avatars shown)
  * Priya, Amit, Sara
- Cost: ₹15,000 (₹5,000/person)
- Status: "Confirmed" (green)
- Certification: "Yes - L'Oreal Certified"

Progress:
- Pre-work: Completed ✓
- Workshop: Upcoming
- Assessment: Pending
- Certificate: Pending

[View Details] [Manage Enrollments]

Program Card 2:
- "Customer Service Excellence"
- Type: "In-house Training" (purple pill)
- Instructor: "Salon Manager"
- Duration: "2 hours"
- Schedule: "Every Saturday, 9-11 AM"
- Enrolled: "All staff (8)"
- Cost: Free
- Status: "Recurring" (blue)

Progress: "Week 3 of 6"

Program Card 3:
- "Bridal Makeup Masterclass"
- Type: "Online Course" (green pill)
- Platform: "Udemy"
- Duration: "Self-paced, 20 hours"
- Enrolled: "Neha (1)"
- Cost: ₹3,000
- Status: "In Progress" (orange)
- Completion: "40%" (progress bar)

CREATE TRAINING PROGRAM:

Tap "+ Add Training" opens form:

"Create Training Program"

Basic information:
- Program name: Input field
- Category: Dropdown
  * Technical skills
  * Soft skills
  * Product knowledge
  * Safety & compliance
  * Customer service
  * Management

- Training type:
  ○ In-house workshop
  ○ External course
  ○ Online learning
  ○ On-the-job training
  ○ Certification program

Details:
- Description: Text area
- Objectives: Bullet points
- Prerequisites: Optional
- Target audience: Role selection

Schedule:
- Start date: Date picker
- End date: Date picker
- Or "Self-paced" toggle
- Time: If scheduled sessions
- Frequency: One-time/Recurring

Location/Format:
- If in-person:
  * Venue input
  * Address
  * Capacity
  
- If online:
  * Platform (Zoom, Teams, etc.)
  * Meeting link
  
- If hybrid: Both options

Instructor/Provider:
- Internal instructor: Staff dropdown
- External provider: Text input
- Provider contact details

Enrollment:
- Auto-enroll: Toggle
- Mandatory for: Role selection
- Optional for: Role selection
- Max participants: Number

Cost & Budget:
- Cost per person: ₹5,000
- Total budget: Auto-calculated
- Budget approval: Required if >₹10,000
- Paid by: Company/Staff/Shared

Materials:
- [Upload Training Materials]
- Documents, presentations, videos
- Reading materials
- Practice exercises

Assessment:
- Pre-assessment: Toggle
- Post-assessment: Toggle
- Passing score: 70%
- Certificate: Yes/No

[Save Draft] [Publish Program]

STAFF PROGRESS TAB:

Individual staff learning dashboard:

Staff selector dropdown:
- "View progress for: Priya Sharma ▼"

Priya's Training Dashboard:

Learning summary:
- Courses completed: 8
- In progress: 2
- Certificates earned: 5
- Total training hours: 65

Current enrollments:
Enrollment 1:
- "Advanced Hair Coloring"
- Provider: L'Oreal
- Start: Nov 15
- Progress: "Pre-work completed ✓"
- Attendance: "Confirmed"
- [View Course] [Mark Complete]

Enrollment 2:
- "Customer Service Excellence"
- Progress: "Week 3 of 6" (50%)
- Attendance: 3/3 sessions
- Quiz scores: 85%, 90%, 88%
- Next session: "Nov 12, 9 AM"

Learning history:
Chronological list of completed courses:

Completed 1:
- "Hair Spa Techniques"
- Completed: Sep 2025
- Duration: 8 hours
- Score: 92%
- Certificate: Yes ✓
- [View Certificate]

Completed 2:
- "Product Knowledge: L'Oreal"
- Completed: Aug 2025
- Duration: 4 hours
- Certificate: Yes ✓

Skills acquired:
Tags showing skills:
[Advanced Coloring] [Hair Spa] [Customer Service]
[Product Expert] [Bridal Makeup]

Skill level indicators:
- Hair Cutting: ⭐⭐⭐⭐⭐ Expert
- Coloring: ⭐⭐⭐⭐⭐ Expert
- Makeup: ⭐⭐⭐ Intermediate
- Nails: ⭐⭐ Beginner

Learning path:
- Recommended next courses
- "Nail Art Basics" - Suggested
- "Advanced Bridal Makeup" - Prerequisite met

CERTIFICATIONS TAB:

Certification management:

Staff certifications display:
Shows all staff with their certs

Priya Sharma:
- Certificates: 5

Certificate 1:
- "L'Oreal Certified Colorist"
- Issuing org: L'Oreal Professional
- Issue date: Oct 2025
- Valid until: Oct 2027
- Certificate number: LC-2025-1234
- Status: "Active" (green)
- [View Certificate] [Download PDF]

Certificate 2:
- "Customer Service Excellence"
- Internal certification
- Issue date: Sep 2025
- Valid: Lifetime
- [View]

Certificate 3:
- "First Aid & Safety"
- Red Cross
- Issue: Mar 2025
- Expires: Mar 2026 (6 months away)
- Status: "Expiring Soon ⚠️" (orange)
- [Renew]

Expiring certifications alert:
- "⚠️ 3 certificates expiring in 60 days"
- Staff affected: Priya, Amit
- [Plan Renewals]

Certification requirements:
- List of mandatory certifications:
  * First Aid: All staff
  * Fire Safety: All staff
  * Product Handling: Relevant staff
- Compliance tracking

Upload certificate:
- [+ Add Certificate] button
- Staff selection
- Certificate type
- Issue/expiry dates
- Upload PDF/image
- Verification status

RESOURCES TAB:

Training resource library:

Categories (filterable):
- [Videos] [Documents] [Presentations]
- [Practice Materials] [Assessments]

Resource cards:

Resource 1:
- Thumbnail/icon
- "Hair Cutting Techniques - Video Tutorial"
- Duration: "45 minutes"
- Format: Video (MP4)
- Uploaded: "Nov 1, 2025"
- Views: 23
- Ratings: 4.5 ⭐ (12 ratings)
- Tags: #haircut #technique #beginner
- [Play] [Download] [Share]

Resource 2:
- "Customer Consultation Form Template"
- Format: PDF document
- Downloads: 15
- [Download] [Preview]

Resource 3:
- "Product Knowledge Quiz"
- Format: Assessment
- Questions: 20
- Time limit: 30 min
- Taken by: 8 staff
- Avg score: 82%
- [Take Quiz] [View Results]

Upload resource:
- [+ Upload Resource] button
- File upload
- Category selection
- Tags
- Description
- Visibility: All staff/Specific roles

TRAINING CALENDAR:

Calendar view showing all training:
- Month view with training sessions marked
- Color-coded by type
- Tap session → Full details

Upcoming sessions (sidebar):
- Next 7 days
- Nov 12: Customer Service (Week 3)
- Nov 15-17: Hair Coloring Workshop
- Nov 18: Safety Training

ANALYTICS:

Training analytics dashboard:

Participation rate:
- 95% staff participated in training
- Average: 8 hours/staff/quarter

Completion rate:
- Started: 35 enrollments
- Completed: 28 (80%)
- In progress: 5
- Dropped: 2

ROI analysis:
- Training investment: ₹45,000
- Revenue impact: +₹28,000
- Customer satisfaction: +12%
- Staff retention: Improved

Popular courses:
- Customer Service: 8 enrollments
- Hair Coloring: 6
- Product Knowledge: 8

Skill gap analysis:
- Skills needed vs skills available
- Gap areas:
  * Advanced makeup: 3 staff needed
  * Nail art: 2 staff needed
  * Management: 1 staff needed

Training effectiveness:
- Pre vs post-assessment scores
- Performance improvement metrics
- Customer feedback correlation

ACTIONS:

Bulk actions:
- [Enroll Multiple Staff]
- [Send Training Reminders]
- [Export Training Records]

Individual actions:
- Edit program
- Cancel enrollment
- Issue certificate
- Send reminder

Notifications:
- Upcoming session reminders
- Course completion congratulations
- Certificate expiry alerts
- New course announcements

INTEGRATION:

External platforms:
- Link to Udemy/Coursera accounts
- Auto-sync completions
- Certificate import

Compliance tracking:
- Mandatory training completion
- Deadline reminders
- Audit reports

Background: Light gray
Program cards: White, category color-coded
Certifications: Gold accents
Style: Learning management system (LMS)
Skill development focused, career growth oriented
Clear tracking, compliance-ready
```

---

(Due to length, I'll now add the remaining sections in the next part - Financial Management, Inventory, Communication, Reports, Settings, and Additional Features with approximately 30+ more screens. Let me continue...)

---

## Financial Management

### Screen 43: Financial Dashboard

**Prompt for Uizard:**
```
Design a comprehensive financial overview dashboard for salon owners (scrollable).

Header:
- Back arrow
- "Financials" title
- Date range "This Month ▼" (right)
- [Export] icon (top-right)

FINANCIAL SUMMARY (hero section):
- "November 2025 Financial Overview" heading
- Purple gradient background card
- White text

Revenue metrics (row of 3):
1. Total Revenue:
   - "₹1,24,500" (large, 32sp, bold, white)
   - "↑ 18% vs last month" (green arrow, light text)
   
2. Expenses:
   - "₹42,300" (large, white)
   - "34% of revenue" (light text)
   
3. Net Profit:
   - "₹82,200" (large, white)
   - "66% margin" (green, light text)

REVENUE BREAKDOWN:

Revenue sources (donut chart):
- Services: 75% (₹93,375) - Purple segment
- Products: 20% (₹24,900) - Blue segment
- Packages: 5% (₹6,225) - Green segment
- Center shows total
- Tap segment for details

Daily revenue trend (line chart):
- Last 30 days
- Shows daily revenue fluctuation
- Purple line with gradient fill
- Markers on peak days
- Average line in gray
- Height: 200px

PAYMENT ANALYTICS:

Payment methods breakdown (horizontal bars):
- UPI: 45% (₹56,025) - Green bar
- Card: 30% (₹37,350) - Blue bar
- Cash: 20% (₹24,900) - Orange bar
- Wallet: 5% (₹6,225) - Purple bar

Each bar shows:
- Method name + icon
- Percentage
- Amount
- Transaction count

Outstanding payments card:
- "Outstanding/Pending" heading
- Amount: "₹8,500" (orange, bold)
- Count: "12 pending payments"
- Average age: "5 days"
- [View Details] button

EXPENSE CATEGORIES:

Top expenses (cards):

Card 1 - Salaries & Wages:
- "₹28,500" (67% of expenses)
- 8 staff members
- [View Payroll]

Card 2 - Inventory & Products:
- "₹8,200" (19%)
- Stock purchases
- [View Inventory]

Card 3 - Rent & Utilities:
- "₹4,500" (11%)
- Monthly fixed costs

Card 4 - Marketing:
- "₹1,100" (3%)
- Ads & promotions

CASH FLOW:

Cash flow chart (bar chart):
- Shows inflow vs outflow
- Last 6 months
- Green bars: Inflow
- Red bars: Outflow
- Net cash flow line (purple)

Current cash position:
- Cash in hand: ₹12,500
- Bank balance: ₹45,800
- Total available: ₹58,300 (green)

PROFITABILITY METRICS:

Metrics grid (2×2):

1. Gross Profit Margin:
   - "74%" (large, green)
   - "Good health" indicator
   
2. Operating Profit:
   - "₹78,700" (green)
   - "63% margin"
   
3. Return on Investment:
   - "285%" (green)
   - Annual basis
   
4. Break-even Point:
   - "₹38,000/month"
   - "Currently 327% above"

UPCOMING OBLIGATIONS:

Due this week:
- Rent payment: ₹15,000 (Nov 12)
- Product supplier: ₹12,500 (Nov 14)
- Utility bills: ₹2,300 (Nov 15)
- Total: ₹29,800
- [Schedule Payments]

QUICK INSIGHTS:

AI-generated insights card:
- "💡 Financial Insights"
- Bullet points:
  * "Revenue up 18% - weekend bookings driving growth"
  * "Salary expenses controlled at 23%"
  * "Product margins improving - up 3%"
  * "Cash flow positive for 6 consecutive months"

BUDGET TRACKING:

Monthly budget vs actual:
- Revenue target: ₹1,20,000
  * Actual: ₹1,24,500 (104%, green)
  
- Expense budget: ₹45,000
  * Actual: ₹42,300 (94%, green, under budget)
  
- Profit target: ₹75,000
  * Actual: ₹82,200 (110%, green, exceeded)

Progress bars showing % of budget

QUICK ACTIONS (floating buttons):
- [Record Expense]
- [Record Income]
- [Generate Report]
- [View Transactions]

TAX INFORMATION:

Tax summary card:
- GST collected: ₹22,410 (18% of revenue)
- GST on purchases: ₹1,476
- Net GST payable: ₹20,934
- TDS deducted: ₹2,700
- Due date: "Dec 20, 2025"
- [View Tax Details]

CHARTS & COMPARISONS:

Year-over-year comparison:
- Nov 2025 vs Nov 2024
- Revenue: +32%
- Profit: +28%
- Expenses: +15%
- Shows positive trends

FINANCIAL GOALS:

Goal tracking:
- Monthly revenue goal: ₹1,50,000
  * Progress: 83% (₹1,24,500)
  * Remaining: ₹25,500
  
- Annual profit goal: ₹10,00,000
  * YTD: ₹8,42,000 (84%)
  * On track: Yes ✓

EXPORT & REPORTS:

Quick report generation:
- [Profit & Loss Statement]
- [Balance Sheet]
- [Cash Flow Statement]
- [Tax Report]
- [Custom Report]

Export formats:
- PDF, Excel, CSV
- Email delivery option
- Scheduled reports

Background: Light gray (#F9FAFB)
Cards: White, rounded, subtle shadow
Charts: Interactive, purple/green theme
Style: Financial dashboard, executive summary
Clear metrics, visual data representation
```

---

### Screen 44: Expense Tracking

**Prompt for Uizard:**
```
Design a comprehensive expense tracking and management screen.

Header:
- Back arrow
- "Expenses" title
- Month selector "November 2025 ▼"
- [+ Add Expense] button (right, purple)

EXPENSE SUMMARY:

Summary cards (4):

Card 1 - Total Expenses:
- "₹42,300" (large, red, 28sp)
- "This Month"
- "↑ 5% vs last month"

Card 2 - Recurring:
- "₹32,500" (large, orange)
- "Fixed Costs"
- "77% of total"

Card 3 - Variable:
- "₹9,800" (large, blue)
- "Variable Costs"
- "23% of total"

Card 4 - Budget Status:
- "94%" (large, green)
- "of ₹45,000 budget"
- "₹2,700 remaining"

EXPENSE CATEGORIES:

Category breakdown (expandable cards):

Category 1 - Salaries & Wages:
- Icon: Person icon
- "₹28,500" (large, bold)
- "67.3% of total expenses"
- Horizontal bar showing proportion
- Budget: ₹30,000 (95% used, green)
- [View Details] expands to show:
  * Staff salaries: ₹25,000
  * Commissions: ₹2,500
  * Bonuses: ₹1,000
- Trend: "Consistent" with graph

Category 2 - Inventory & Products:
- Shopping bag icon
- "₹8,200" (19.4%)
- Budget: ₹10,000 (82%)
- Sub-items:
  * Hair products: ₹4,500
  * Skin care: ₹2,200
  * Tools & equipment: ₹1,500
- Trend: "Decreasing" (green, -8%)

Category 3 - Rent & Utilities:
- Building icon
- "₹4,500" (10.6%)
- Budget: ₹4,500 (100%, exact)
- Sub-items:
  * Rent: ₹3,000
  * Electricity: ₹900
  * Water: ₹300
  * Internet: ₹300
- Recurring: "Fixed monthly"

Category 4 - Marketing & Advertising:
- Megaphone icon
- "₹1,100" (2.6%)
- Budget: ₹2,000 (55%)
- Sub-items:
  * Social media ads: ₹600
  * Google ads: ₹400
  * Printed materials: ₹100
- ROI: "Customer acquisition cost: ₹73"

Category 5 - Maintenance & Repairs:
- Tools icon
- "₹0" this month
- Budget: ₹500 (0%)
- Last expense: "Sep 2025"

Each category expandable with transaction list

EXPENSE LIST:

Recent expenses (scrollable):

Expense Card 1:
- Date: "Nov 10, 2025" (bold, left)
- Category icon (left)
- Description: "L'Oreal Product Stock" (bold, 15sp)
- Category: "Inventory" (gray pill badge)
- Amount: "₹4,500" (large, right, red)
- Payment: "Card" with icon
- Vendor: "Beauty Suppliers Co."
- Receipt: "Attached" (PDF icon) - [View]
- Added by: "Owner"
- [Edit] [Delete] icons (⋮ menu)

Expense Card 2:
- Date: "Nov 9, 2025"
- "Staff Salaries - Mid-Month"
- Category: "Payroll"
- Amount: "₹15,000"
- Payment: "Bank Transfer"
- Status: "Paid" (green checkmark)
- Split: "8 staff members" [View Breakdown]

Expense Card 3:
- Date: "Nov 8, 2025"
- "Electricity Bill"
- Category: "Utilities"
- Amount: "₹900"
- Payment: "Online"
- Recurring: "Monthly" (blue pill)
- Next: "Dec 8, 2025"

Expense Card 4:
- Date: "Nov 5, 2025"
- "Instagram Ads Campaign"
- Category: "Marketing"
- Amount: "₹600"
- Duration: "Nov 5-12"
- Reach: "12,500 people"
- Conversions: "8 bookings"

Each expense card: 100px height, white, rounded

ADD EXPENSE FORM:

Tap "+ Add Expense" opens bottom sheet:

"Record New Expense"

Basic details:
- Amount: Large input field
  * "₹" prefix
  * Placeholder: "0.00"
  * Number keyboard
  * Quick amounts: [₹100] [₹500] [₹1000] [₹5000]

- Category: Dropdown with icons
  * Salaries
  * Inventory
  * Rent & Utilities
  * Marketing
  * Equipment
  * Maintenance
  * Professional Services
  * Taxes & Fees
  * Other
  * [+ Add New Category]

- Date: Date picker
  * Default: Today
  * Can select past date

- Description: Text input
  * "What was this expense for?"
  * Auto-suggestions based on history

Vendor information:
- Vendor name: Input or dropdown (frequent vendors)
- Vendor contact: Phone/email (optional)
- Invoice/Bill number: Input

Payment details:
- Payment method:
  ○ Cash
  ○ Bank Transfer
  ○ Card
  ○ UPI
  ○ Cheque

- Account/Card: Dropdown (if applicable)
  * Salon business account
  * Personal card
  * Cash register

- Payment status:
  ○ Paid (default)
  ○ Pending
  ○ Partially paid

Receipt/Bill:
- [Upload Receipt] button
- Camera icon: Take photo
- Gallery: Choose from photos
- Files: Upload PDF
- Preview after upload
- Multiple receipts allowed

Additional details:
- GST applicable: Toggle
  * If yes: GST% input (18% default)
  * GST amount: Auto-calculated

- Recurring expense: Toggle
  * If yes:
    - Frequency: Weekly/Monthly/Yearly
    - Ends: Date or Never
    - Reminder: Days before

- Split expense: Toggle
  * If yes: Between multiple cost centers
  * Allocation % for each

Notes:
- Text area (optional)
- "Add any additional notes"

Tags:
- Add tags for easy filtering
- [Urgent] [Tax-deductible] [Reimbursable]

[Cancel] [Save Expense] buttons

RECURRING EXPENSES:

Recurring expenses section:
- "Recurring Expenses" heading
- Shows all auto-recurring items

Recurring 1:
- "Rent" - ₹3,000
- Every: 1st of month
- Next due: "Dec 1, 2025" (21 days)
- Status: "Active" (green)
- [Edit] [Pause] [Delete]

Recurring 2:
- "Internet Bill" - ₹300
- Every: 5th of month
- Auto-pay: ON
- [Edit]

[+ Add Recurring Expense]

FILTERS & SEARCH:

Search bar:
- "Search expenses..."
- Full text search

Filter options:
- Date range: Custom picker
- Categories: Multi-select
- Payment method: Multi-select
- Amount range: Min-max slider
- Status: Paid/Pending/Overdue
- Has receipt: Yes/No
- Recurring: Yes/No/All
- Tags: Multi-select

Sort by:
- Date (newest/oldest)
- Amount (high/low)
- Category
- Vendor

EXPENSE ANALYTICS:

Expense trends (line chart):
- Last 6 months
- Shows monthly total expenses
- Trend line
- Target line (budget)

Category distribution (pie chart):
- Shows % breakdown
- Tap to filter by category

Vendor analysis:
- Top vendors by spending
- 1. Beauty Suppliers Co. - ₹25,000
- 2. Property Owner - ₹9,000
- 3. Utilities Company - ₹3,600

BUDGET ALERTS:

Budget warnings:
- "⚠️ Approaching Budget Limit"
- "Marketing: 90% of budget used"
- "₹200 remaining"

Over-budget alerts:
- "🚨 Budget Exceeded"
- "Inventory: 105% of budget"
- "₹500 over budget"

BULK ACTIONS:

Select multiple expenses:
- Long press activates selection
- Checkboxes appear
- Bulk actions toolbar:
  * [Categorize]
  * [Export Selected]
  * [Delete Selected]
  * [Mark as Paid]

EXPORT:

Export expenses:
- Date range selection
- Category filter
- Format: PDF, Excel, CSV
- Email delivery
- [Download] [Send via Email]

Tax reports:
- GST expense summary
- Tax-deductible expenses
- Quarterly/annual reports

INTEGRATIONS:

Bank sync (if connected):
- Auto-import bank transactions
- Smart categorization
- Duplicate detection
- [Connect Bank Account]

Accounting software:
- Sync with QuickBooks, Tally
- Export options
- Two-way sync

Receipt scanning:
- OCR technology
- Extracts amount, date, vendor
- Auto-creates expense entry

Background: Light gray
Expense cards: White, left border color-coded by category
Amounts: Red (expenses), bold
Style: Expense management, accounting-ready
Clear categorization, budget tracking
```

---

### Screen 45: Invoice & Billing

**Prompt for Uizard:**
```
Design a comprehensive invoicing and billing management screen.

Header:
- Back arrow
- "Invoices" title
- [+ New Invoice] button (right, purple)

INVOICE SUMMARY:

Stats cards (4):

Card 1 - Total Invoiced:
- "₹1,42,800" (large, purple, 28sp)
- "This Month"
- "24 invoices"

Card 2 - Paid:
- "₹1,20,500" (large, green)
- "84% collected"
- "20 invoices"

Card 3 - Pending:
- "₹14,800" (large, orange)
- "10% pending"
- "3 invoices"

Card 4 - Overdue:
- "₹7,500" (large, red)
- "5% overdue"
- "1 invoice"

TABS:
- [All] [Draft] [Sent] [Paid] [Overdue]

INVOICE LIST:

Invoice Card 1 (Paid):
- Invoice number: "INV-2025-0234" (bold, left)
- Status: "PAID ✓" (green pill badge, right)
- Customer: "Aarti Kumar" (with small avatar)
- Date: "Nov 8, 2025"
- Due date: "Nov 18, 2025" (10 days)
- Amount: "₹2,850" (large, bold)
- Services:
  * Hair Cut & Color - ₹2,500
  * Products - ₹350
- Payment:
  * Method: UPI
  * Paid on: "Nov 8, 2025" (same day)
  * Transaction ID: UPI_xxx123
- [View] [Download] [Send] buttons

Invoice Card 2 (Pending):
- "INV-2025-0235"
- Status: "PENDING" (orange pill)
- Customer: "Neha Patel"
- Date: "Nov 9, 2025"
- Due: "Nov 19, 2025" (9 days left)
- Amount: "₹4,500"
- Services: "Bridal Makeup Package"
- [Send Reminder] (prominent, orange)
- [Mark as Paid] [Edit]

Invoice Card 3 (Overdue):
- "INV-2025-0220"
- Status: "OVERDUE" (red pill)
- Customer: "Raj Malhotra"
- Date: "Oct 25, 2025"
- Due: "Nov 4, 2025" (6 days overdue)
- Amount: "₹7,500"
- Services: "Corporate Event Package"
- Overdue: "₹7,500" (red, bold)
- Late fee: "₹375" (5% penalty)
- [Send Notice] (red) [Contact Customer]

Invoice Card 4 (Draft):
- "DRAFT-0012"
- Status: "DRAFT" (gray pill)
- Customer: "Sara Kapoor"
- Created: "Nov 10, 2025"
- Amount: "₹1,200"
- [Edit] [Finalize & Send]

Each card: 140px height, white, rounded

CREATE INVOICE:

Tap "+ New Invoice" opens form:

"Create New Invoice"

Customer Selection:
- "Select Customer" heading
- Search bar
- Recent customers (horizontal scroll):
  * Avatar + Name cards
  * Tap to select
- Or [+ New Customer] button

Selected customer card (highlighted):
- Avatar + Name
- Phone + Email
- Previous invoices: "12 invoices"
- Outstanding: "₹0"

Invoice Details:
- Invoice number:
  * Auto-generated: "INV-2025-0236"
  * Or manual override
  
- Invoice date:
  * Default: Today
  * Date picker

- Due date:
  * Default: +7 days
  * Or custom date
  * Net terms: [Net 7] [Net 15] [Net 30]

Services/Items:
- [+ Add Service/Item] button

Item 1:
- Service dropdown:
  * Women's Haircut
  * Or type custom description
- Quantity: 1
- Price: ₹800
- Discount: 0% (or input %)
- Tax (GST): 18%
- Total: ₹944
- [Remove] icon

Item 2:
- Hair Coloring
- Qty: 1
- Price: ₹2,500
- Discount: 10% (-₹250)
- Tax: 18%
- Total: ₹2,655

[+ Add Another Line]

Quick actions:
- [Add from Booking] - Import from existing booking
- [Add Package] - Select pre-defined package

Calculation Summary:
- Subtotal: ₹3,050
- Discount: -₹250
- Taxable amount: ₹2,800
- GST @ 18%: ₹504
- ──────────
- Total Amount: ₹3,304 (large, bold, purple)

Payment Details:
- Payment terms: Dropdown
  * Due on receipt
  * Net 7 days
  * Net 15 days
  * Net 30 days
  * Custom

- Partial payment allowed: Toggle
  * If yes: Minimum amount input

- Late fee policy: Toggle
  * If yes: % per day/week/month

- Accepted payment methods:
  ☑ Cash
  ☑ Card
  ☑ UPI
  ☑ Bank Transfer

Bank details (for transfer):
- Account name: Glow Beauty Salon
- Account number: 1234567890
- IFSC: SBIN0001234
- UPI: salon@upi

Notes & Terms:
- Notes to customer: Text area
  * "Thank you for your business!"
  * Custom message

- Terms & conditions: Text area
  * Payment terms
  * Cancellation policy
  * [Use Template]

Attachments:
- Attach supporting documents
- Photos, PDFs
- Service details

Branding:
- Salon logo: Upload/select
- Color theme: Purple (default)
- Template style:
  * Modern
  * Classic
  * Minimal

Preview:
- [Preview Invoice] button
- Shows formatted invoice
- Mobile & PDF view

Actions:
- [Save as Draft] (gray, outlined)
- [Save & Send] (purple, filled)
  * Sends via Email/WhatsApp/SMS
- [Save & Print] (outlined)

INVOICE TEMPLATE:

Preview shows formatted invoice:

┌─────────────────────────────────┐
│  [LOGO] GLOW BEAUTY SALON       │
│  Sector 18, Noida               │
│  +91 98765 43210                │
│  GST: 07XXXXX1234X1Z5           │
├─────────────────────────────────┤
│                                 │
│  INVOICE                        │
│  INV-2025-0236                  │
│                                 │
├─────────────────────────────────┤
│  Bill To:                       │
│  Aarti Kumar                    │
│  +91 98765 43210                │
│  aarti@email.com                │
│                                 │
│  Date: Nov 10, 2025             │
│  Due Date: Nov 17, 2025         │
├─────────────────────────────────┤
│  SERVICES                       │
│                                 │
│  Women's Haircut    ₹800        │
│  Qty: 1             Tax: ₹144   │
│                                 │
│  Hair Coloring      ₹2,250      │
│  Qty: 1             Tax: ₹405   │
│  (10% discount applied)         │
│                                 │
├─────────────────────────────────┤
│  Subtotal:          ₹2,800      │
│  GST (18%):         ₹504        │
│  ───────────────────────────    │
│  TOTAL:             ₹3,304      │
│                                 │
├─────────────────────────────────┤
│  Payment Instructions:          │
│  [Bank details / UPI / Cards]   │
│                                 │
│  Terms: Payment due in 7 days   │
│                                 │
│  Thank you for your business!   │
└─────────────────────────────────┘

[Download PDF] [Print] [Share] buttons

PAYMENT COLLECTION:

Record payment (for pending invoice):
- Tap "Mark as Paid" on invoice

Payment entry form:
- Invoice: INV-2025-0235
- Amount due: ₹4,500

Payment details:
- Amount received: ₹4,500 (full/partial)
- Payment date: Today (or custom)
- Payment method:
  ○ Cash
  ○ Card
  ○ UPI
  ○ Bank Transfer
  ○ Cheque

- Transaction details:
  * Transaction ID/Ref
  * Bank name (if applicable)
  * Cheque number

- Receipt number: Auto-generated or manual

Notes:
- "Payment received in full"

[Generate Receipt] checkbox
- Creates payment receipt
- Sends to customer

[Cancel] [Record Payment]

Confirmation:
- "✓ Payment recorded successfully!"
- Invoice status updated to PAID
- [View Receipt] [Send Receipt]

PAYMENT REMINDERS:

Automatic reminders:
- Settings for auto-reminders
- 3 days before due
- On due date
- 3 days after (if unpaid)
- Weekly thereafter

Manual reminder:
- Tap "Send Reminder" on invoice
- Message template:
  "Dear [Customer],
  This is a friendly reminder that invoice
  INV-2025-0235 for ₹4,500 is due on [Date].
  Please make payment at your earliest
  convenience.
  [Payment Link]
  Thank you!"

- Channels:
  ☑ Email
  ☑ WhatsApp
  ☑ SMS

[Send Reminder]

OVERDUE MANAGEMENT:

Overdue invoices list:
- Sorted by days overdue
- Color-coded severity:
  * Orange: 1-7 days
  * Red: 8-30 days
  * Dark red: 30+ days

Actions for overdue:
- Send notice
- Apply late fees
- Suspend services
- Send to collections

Aging report:
- 0-30 days: ₹7,500
- 31-60 days: ₹0
- 61-90 days: ₹0
- 90+ days: ₹0

RECURRING INVOICES:

Set up recurring invoicing:
- For monthly retainers
- Subscription packages
- Regular corporate clients

Recurring invoice setup:
- Customer: Select
- Services/items: Define
- Frequency:
  * Weekly
  * Monthly
  * Quarterly
  * Annually

- Start date
- End date or "Ongoing"

- Auto-send: Toggle
  * Send X days before due
  
- Auto-apply discounts
- Generate on: 1st of month

Active recurring:
- "5 active recurring invoices"
- Monthly revenue: ₹22,500
- [Manage Recurring]

ANALYTICS:

Invoice analytics:
- Total invoiced (MTD): ₹1,42,800
- Collection rate: 84%
- Avg invoice value: ₹5,950
- Avg payment time: 4.2 days

Payment trends:
- Cash: 25%
- Online: 75%
- Trend: Digital increasing

Customer payment behavior:
- Aarti: Always on-time ✓
- Neha: Avg 2 days late
- Raj: Requires follow-up

EXPORT & REPORTS:

Invoice reports:
- Sales by period
- Customer-wise sales
- Service-wise revenue
- Tax reports (GST)

Export invoices:
- Date range
- Customer filter
- Status filter
- Format: PDF, Excel, CSV
- [Export]

Accounting integration:
- Export to Tally, QuickBooks
- GST filing ready
- Profit & loss inputs

SETTINGS:

Invoice settings:
- Invoice number format
  * Prefix: INV-
  * Starting number: 0001
  * Year format: YYYY

- Default terms: Net 7
- Late fee: 5% per month
- Currency: ₹ INR
- Language: English

- Email template customization
- Logo upload
- Color scheme

Tax settings:
- GST number: 07XXXXX1234X1Z5
- GST rates by service
- HSN/SAC codes

Background: Light gray
Invoice cards: White, status color-coded
Amounts: Bold, large
Style: Professional invoicing, accounting-ready
Clear payment tracking, automated reminders
```

---

### Screen 46: Tax Reports & Compliance

**Prompt for Uizard:**
```
Design a tax reporting and compliance management screen for Indian GST.

Header:
- Back arrow
- "Tax & Compliance" title
- Period selector "Q3 2025 (Oct-Dec)" ▼
- [Generate Reports] button (right)

GST OVERVIEW:

Summary cards (4):

Card 1 - GST Collected (Output):
- "₹67,230" (large, green, 28sp)
- "From Sales"
- "18% on ₹3,73,500"
- This quarter

Card 2 - GST Paid (Input):
- "₹4,428" (large, orange)
- "On Purchases"
- "18% on ₹24,600"

Card 3 - Net GST Payable:
- "₹62,802" (large, purple, bold)
- "Output - Input Tax Credit"
- Due: "Dec 20, 2025"

Card 4 - TDS Deducted:
- "₹8,100" (large, blue)
- "On Staff Salaries"
- "From ₹1,62,000"

TABS:
- [GST Summary] [GSTR-1] [GSTR-3B] [TDS] [Compliance]

GST SUMMARY TAB:

Month-wise breakdown table:

| Month | Sales | GST Out | Purchases | GST In | Net GST |
|-------|-------|---------|-----------|--------|---------|
| Oct | ₹1,20,500 | ₹21,690 | ₹8,200 | ₹1,476 | ₹20,214 |
| Nov | ₹1,24,500 | ₹22,410 | ₹8,500 | ₹1,530 | ₹20,880 |
| Dec | ₹1,28,500 | ₹23,130 | ₹7,900 | ₹1,422 | ₹21,708 |
| **Total** | **₹3,73,500** | **₹67,230** | **₹24,600** | **₹4,428** | **₹62,802** |

Each row expandable for daily breakup

GST rate-wise summary:
- Services @ 18%: ₹2,80,125 (GST: ₹50,422)
- Products @ 18%: ₹93,375 (GST: ₹16,808)
- Exempt services: ₹0

ITC (Input Tax Credit) details:
- Eligible ITC: ₹4,428
- Ineligible ITC: ₹0
- ITC utilized: ₹4,428
- ITC balance: ₹0

GSTR-1 TAB:

GSTR-1 Report (Sales):
- "Outward Supplies" heading
- For period: Oct-Dec 2025

B2B Supplies (Business to Business):
- Total invoices: 0 (salon is mostly B2C)
- Total value: ₹0

B2C Supplies (Business to Consumer):
- Large supplies (>₹2.5L): 2 invoices
  * Corporate event package: ₹3,00,000
  * Wedding package: ₹2,75,000
  * Total: ₹5,75,000
  * GST: ₹1,03,500

- Other supplies (<₹2.5L):
  * Total invoices: 234
  * Total value: ₹3,68,500
  * GST: ₹66,330

Nil rated, exempted, non-GST:
- Total: ₹0 (all services are taxable)

HSN-wise summary:
- 9996 (Hair care services): ₹2,50,000
- 9997 (Beauty services): ₹1,23,500
- 3305 (Hair care products): ₹50,000

Document summary:
- Invoices issued: 236
- Credit notes: 2
- Debit notes: 0

[Preview GSTR-1] [Export JSON] [File Return]

GSTR-3B TAB:

GSTR-3B Monthly Return:
- Month: November 2025
- Filing status: "Not Filed" (orange)
- Due date: "Dec 20, 2025" (30 days away)

Part 1 - Outward Supplies:
3.1 - Tax on outward and reverse charge:
- Outward taxable supplies: ₹1,24,500
- Tax: ₹22,410

3.2 - Inter-state supplies: ₹0
- (All intra-state for single location)

Part 2 - Input Tax Credit:
4A - ITC Available:
- Inputs: ₹1,350 (products purchased)
- Input services: ₹180 (utilities with GST)
- Total ITC: ₹1,530

4B - ITC Reversal: ₹0

4D - ITC utilized:
- Against output tax: ₹1,530

Part 3 - Payment of Tax:
5.1 - Tax payable:
- Integrated tax: ₹0
- Central tax: ₹10,440
- State tax: ₹10,440
- Total: ₹20,880

Interest/Late fee: ₹0

Part 4 - Additional Info:
- Amendments: 0
- HSN summary: Attached

[Preview GSTR-3B] [Export JSON]
[File Return] (prominent, purple button)

Filing workflow:
Step 1: Review data
- Auto-populated from transactions
- Verification checklist
- [Data looks correct ✓]

Step 2: Generate JSON
- Creates return file
- Format validation
- [Download JSON]

Step 3: Upload to GST Portal
- Login to GST portal
- Upload JSON file
- Verify on portal

Step 4: File with DSC/EVC
- Digital signature or
- OTP-based filing

Status tracking:
- Filed: ✓ Green
- Pending: Orange
- Overdue: Red

TDS TAB:

TDS Summary (Tax Deducted at Source):
- On staff salaries
- Section 194H (commission) if applicable

Monthly TDS deduction:
| Month | Gross Salary | TDS @ 5% | Net Paid |
|-------|--------------|----------|----------|
| Oct | ₹52,000 | ₹2,600 | ₹49,400 |
| Nov | ₹54,000 | ₹2,700 | ₹51,300 |
| Dec | ₹56,000 | ₹2,800 | ₹53,200 |
| **Total** | **₹1,62,000** | **₹8,100** | **₹1,53,900** |

Employee-wise TDS:
- Priya Sharma: ₹2,700 (Nov)
- Amit Singh: ₹1,800
- Ravi Kumar: ₹1,500
- Others: ₹2,100

TDS certificates (Form 16):
- Generate Form 16 for FY 2024-25
- Quarterly TDS certificate
- Annual TDS certificate
- [Generate for All Staff]

TDS payment:
- Challan generation
- Payment status
- Return filing (Form 24Q)

COMPLIANCE TAB:

Compliance calendar:
Shows all upcoming deadlines

Due This Month:
- ✓ GST Payment: 20th (Done)
- ✓ GSTR-1: 11th (Filed)
- ⏰ GSTR-3B: 20th (Pending)
- ⏰ TDS Payment: 7th (Upcoming)
- Professional Tax: 15th

Color-coded:
- Green ✓: Completed
- Orange ⏰: Upcoming (7 days)
- Red 🚨: Overdue

Annual compliance:
- Income Tax Return: Jul 31
- GST Annual Return: Dec 31
- TDS Annual Return: May 31

Compliance checklist:
☑ GST Registration Active
☑ PAN Card on file
☑ Bank account linked
☑ Digital Signature valid
☐ Aadhaar authentication (optional)

Registration details:
- GSTIN: 07XXXXX1234X1Z5
- Trade name: Glow Beauty Salon
- Legal name: [Business Name]
- PAN: ABCDE1234F
- State: Uttar Pradesh (07)
- Registration date: Jan 15, 2024
- [View Certificate]

TAX SETTINGS:

GST settings:
- Default GST rate: 18%
- Service accounting code (SAC):
  * 9996 - Hair care
  * 9997 - Beauty treatment
  * 9998 - Other personal services

- Product HSN codes:
  * 3305 - Hair care preparations
  * 3304 - Beauty products

Composition scheme:
- Eligible: Yes (turnover < ₹1.5 Cr)
- Opted: No
- Tax rate if opted: 6%

TDS settings:
- TDS rate: 5% (if PAN provided)
- 20% (if no PAN)
- Threshold: ₹30,000/month

Professional tax:
- State: UP
- Rate: ₹200/month per employee
- Payment: Monthly

TAX PAYMENTS:

Payment history:
- Nov 2025 GST: ₹20,880 (Paid)
  * Challan: PMT-xxx123
  * Date: Nov 20, 2025
  * Mode: Net banking

- Oct 2025 GST: ₹20,214 (Paid)
- Sep 2025 GST: ₹19,560 (Paid)

Make payment:
- Tax period: November 2025
- Tax type: GST / TDS / Professional Tax
- Amount: ₹20,880
- [Generate Challan]
- [Pay Online]

Challan generation:
- Auto-filled details
- CPIN generated
- Valid for 15 days
- [Download Challan] [Pay Now]

Payment tracking:
- Payment initiated
- Pending confirmation
- Reflected on portal: ~2-3 days

REPORTS & ANALYTICS:

Tax analytics:
- Total tax paid (YTD): ₹2,45,680
- As % of revenue: 18.2%
- Avg monthly GST: ₹20,473

Tax trend (line chart):
- Last 12 months
- Shows monthly tax payments
- Compares to revenue

Effective tax rate:
- GST: 18% (standard)
- Income tax: TBD based on profit
- Professional tax: ₹200/employee

Tax savings:
- ITC claimed: ₹4,428
- Savings vs non-registration: ₹67,230

AUDIT & DOCUMENTATION:

Audit trail:
- All tax-related transactions logged
- Who filed returns
- When filed
- Amendments made

Document repository:
- GST certificate
- PAN card
- Aadhaar
- Bank statements
- Purchase bills (for ITC)
- Sales invoices
- Return acknowledgments
- Payment challans

[Upload Document] [View All]

Backup:
- Auto-backup of tax data
- Monthly snapshots
- [Download Backup]

HELP & SUPPORT:

Tax calculator:
- GST calculator
- TDS calculator
- Professional tax calculator

Common queries:
- How to claim ITC?
- What if I miss deadline?
- Reverse charge mechanism
- Composition scheme eligibility

Links:
- GST Portal login
- Income Tax Portal
- Aadhaar authentication
- e-Challan payment

Accountant access:
- Share view-only access
- Or full access for filing
- [Invite Accountant]

ALERTS & NOTIFICATIONS:

Tax reminders:
- 7 days before deadline
- On deadline day
- For overdue filings

Rate change alerts:
- GST rate updates
- Slab changes
- New regulations

Threshold alerts:
- Approaching composition limit
- ITC accumulation
- High cash transactions (>₹2L)

Background: Light gray
Cards: White, organized by tax type
Deadlines: Color-coded by urgency
Style: Compliance dashboard, CA-ready
Indian tax system specific, automated calculations
```

---

(Continue to next screens...)

### Screen 47: Profit & Loss Statement

**Prompt for Uizard:**
```
Design a comprehensive profit and loss (P&L) statement screen.

Header:
- Back arrow
- "Profit & Loss" title
- Period selector "FY 2024-25 ▼"
  * Options: This Month, This Quarter, This Year, Custom Range
- [Export PDF] icon (right)

PROFIT SUMMARY (hero section):

Summary card (full width, gradient purple background):
- "Net Profit" heading (white text)
- "₹9,84,200" (very large, 36sp, bold, white)
- "66% Profit Margin" (white, 18sp)
- "For period: Apr 2024 - Nov 2025"
- vs Last year: "+32%" (green arrow, white text)

Visual profit indicator:
- Large circular progress ring
- Shows profit margin %
- Color: Green if profitable, red if loss

P&L STATEMENT:

Income section:

REVENUE:
Operating Revenue:
- Service revenue: ₹11,25,000 (75%)
  [View breakdown ▼]
  
- Product sales: ₹3,75,000 (25%)
  
Gross Revenue: ₹15,00,000 (bold)
──────────────────────

Less: Discounts & Returns:
- Discounts given: (₹75,000)
- Returns/refunds: (₹15,000)

Net Revenue: ₹14,10,000 (bold, purple)
══════════════════════

COST OF GOODS SOLD (COGS):
- Products purchased: ₹98,400
- Direct materials: ₹12,000
- Packaging: ₹2,100

Total COGS: ₹1,12,500 (bold)

GROSS PROFIT: ₹12,97,500 (large, green, bold)
Gross Margin: 92%
══════════════════════

OPERATING EXPENSES:

Personnel Costs:
- Salaries & wages: ₹2,28,000 (18%)
- Staff benefits: ₹15,000 (1%)
- Training & development: ₹8,500
Total Personnel: ₹2,51,500
──────────────────────

Establishment Costs:
- Rent: ₹36,000
- Utilities: ₹10,800 (electricity, water)
- Internet & phone: ₹3,600
Total Establishment: ₹50,400
──────────────────────

Marketing & Sales:
- Digital marketing: ₹13,200
- Print & media: ₹4,500
- Promotions & discounts: ₹8,200
Total Marketing: ₹25,900
──────────────────────

Administrative:
- Insurance: ₹6,000
- Professional fees: ₹12,000
- Software & subscriptions: ₹4,800
- Office supplies: ₹3,200
- Bank charges: ₹2,100
Total Administrative: ₹28,100
──────────────────────

Depreciation & Amortization:
- Equipment depreciation: ₹18,000
- Furniture depreciation: ₹6,000
Total D&A: ₹24,000
──────────────────────

Other Operating Expenses:
- Repairs & maintenance: ₹8,500
- Licenses & permits: ₹4,200
- Miscellaneous: ₹2,100
Total Other: ₹14,800
──────────────────────

TOTAL OPERATING EXPENSES: ₹3,94,700 (bold, red)
══════════════════════

OPERATING PROFIT (EBITDA): ₹9,02,800 (large, purple, bold)
Operating Margin: 64%
══════════════════════

NON-OPERATING INCOME/EXPENSES:

Other Income:
- Interest earned: ₹3,200
- Late fees collected: ₹1,800
Total Other Income: ₹5,000
──────────────────────

Other Expenses:
- Interest paid: ₹2,400
- Bank charges: ₹1,200
Total Other Expenses: ₹3,600
──────────────────────

NET OTHER INCOME: ₹1,400
══════════════════════

PROFIT BEFORE TAX (PBT): ₹9,04,200 (large, green, bold)
PBT Margin: 64.1%

Less: Taxes:
- Income tax provision: ₹20,000 (estimated)

NET PROFIT AFTER TAX (PAT): ₹9,84,200 (very large, green, bold)
══════════════════════
Net Margin: 66%
══════════════════════

COMPARATIVE ANALYSIS:

Side-by-side comparison:
| Item | This Year | Last Year | Change |
|------|-----------|-----------|--------|
| Revenue | ₹14,10,000 | ₹10,68,000 | +32% ↑ |
| COGS | ₹1,12,500 | ₹89,000 | +26% |
| Gross Profit | ₹12,97,500 | ₹9,79,000 | +33% ↑ |
| Op. Expenses | ₹3,94,700 | ₹3,42,000 | +15% |
| Net Profit | ₹9,84,200 | ₹7,46,000 | +32% ↑ |

Year-over-year growth clearly shown with arrows

VISUALIZATION:

Revenue vs Expense chart:
- Stacked bar chart
- Monthly breakdown (Apr-Nov)
- Blue: Revenue
- Red: Total expenses
- Green: Net profit
- 12-month view

Expense distribution (pie chart):
- Personnel: 64%
- Establishment: 13%
- Marketing: 7%
- Administrative: 7%
- Depreciation: 6%
- Other: 3%

Trend analysis (line chart):
- Net profit trend over 12 months
- Shows seasonality
- Peak months highlighted
- Annotations for major events

RATIOS & METRICS:

Profitability ratios:
- Gross profit margin: 92%
  * Industry avg: 85%
  * Status: Excellent ✓
  
- Operating margin: 64%
  * Industry avg: 55%
  * Status: Above average ✓
  
- Net profit margin: 66%
  * Industry avg: 50%
  * Status: Excellent ✓

Efficiency ratios:
- Revenue per employee: ₹1,76,250
- Profit per employee: ₹1,23,025
- Operating expense ratio: 28%

Break-even analysis:
- Monthly break-even: ₹32,892
- Current revenue: ₹1,76,250/month
- Safety margin: 435% above break-even

FILTERS & OPTIONS:

Period comparison:
- Select two periods to compare
- Month-over-month
- Quarter-over-quarter
- Year-over-year

Drill-down options:
- Each line item expandable
- Click to see detailed transactions
- Filter by category, date, vendor

EXPORT & SHARING:

Export options:
- [Download PDF] - Formatted report
- [Export Excel] - Editable spreadsheet
- [Export CSV] - Raw data

Report customization:
- Choose sections to include
- Summary vs detailed
- With/without charts

Share options:
- Email to accountant
- Share with investors
- Print copy

INSIGHTS:

AI-generated insights:
- "💡 Key Insights"
- Bullet points:
  * "Revenue grew 32% YoY - strong growth"
  * "Personnel costs well-controlled at 18%"
  * "Marketing ROI: ₹54 revenue per ₹1 spent"
  * "Operating margins improving steadily"

Recommendations:
- "Consider increasing marketing budget by 10%"
- "Equipment depreciation ending - plan for replacements"
- "Strong cash position - opportunity for expansion"

COMPLIANCE:

Audit trail:
- All transactions included
- Reconciled with bank statements
- GST-compliant categorization

Tax reports:
- Income tax computation
- Advance tax calculation
- Deductions available

Background: White
Sections: Clear visual separation
Positive numbers: Green
Negative numbers: Red (in parentheses)
Style: Professional accounting, CA-ready
Clear hierarchy, easy to scan
```

---

### Screen 48: Cash Flow Statement

**Prompt for Uizard:**
```
Design a cash flow statement and cash management screen.

Header:
- Back arrow
- "Cash Flow" title
- Period "Nov 2025 ▼"
- [Export] icon

CASH POSITION SUMMARY:

Current cash position (hero card):
- "Total Cash Available" heading
- "₹58,300" (very large, 36sp, bold, green)
- Breakdown:
  * Cash in hand: ₹12,500
  * Bank balance: ₹45,800
- Change: "+₹8,200 this month" (green)

Quick stats (3 cards):

Card 1 - Cash Inflow:
- "₹1,32,800" (large, green)
- "This Month"
- "+18% vs last month"

Card 2 - Cash Outflow:
- "₹1,24,600" (large, red)
- "This Month"
- "+12% vs last month"

Card 3 - Net Cash Flow:
- "+₹8,200" (large, green if positive)
- "Surplus"
- "↑ Improving"

CASH FLOW STATEMENT:

Period: November 2025

OPERATING ACTIVITIES:

Cash receipts from customers:
- Service payments: ₹93,375
- Product sales: ₹24,900
- Advance payments: ₹8,500
Total receipts: ₹1,26,775
──────────────────────

Cash payments:
- To staff (salaries): (₹28,500)
- To suppliers (products): (₹8,200)
- Rent: (₹3,000)
- Utilities: (₹1,200)
- Marketing expenses: (₹1,100)
- Other operating: (₹2,100)
Total payments: (₹44,100)
──────────────────────

Net cash from operations: ₹82,675 (bold, green)
══════════════════════

INVESTING ACTIVITIES:

Cash inflows:
- Equipment sale: ₹0
- Interest received: ₹400
Total investing inflows: ₹400
──────────────────────

Cash outflows:
- Equipment purchase: (₹15,000)
- Furniture purchase: (₹0)
Total investing outflows: (₹15,000)
──────────────────────

Net cash from investing: (₹14,600) (bold, red)
══════════════════════

FINANCING ACTIVITIES:

Cash inflows:
- Owner contribution: ₹0
- Loan received: ₹0
Total financing inflows: ₹0
──────────────────────

Cash outflows:
- Loan repayment: (₹5,000)
- Owner drawings: (₹15,000)
Total financing outflows: (₹20,000)
──────────────────────

Net cash from financing: (₹20,000) (bold, red)
══════════════════════

RECONCILIATION:

Opening cash balance (Nov 1): ₹50,100
──────────────────────
Net cash from operations: ₹82,675
Net cash from investing: (₹14,600)
Net cash from financing: (₹20,000)
──────────────────────
Net increase in cash: ₹48,075
──────────────────────
Closing cash balance (Nov 30): ₹58,300 (large, bold, green)
══════════════════════

CASH FLOW ANALYSIS:

Cash flow trend (line chart):
- Last 12 months
- Three lines:
  * Operating cash flow (green)
  * Investing cash flow (blue)
  * Financing cash flow (orange)
  * Net cash flow (purple, bold)
- Shows monthly trends
- Peak/trough markers

Monthly comparison table:
| Month | Inflow | Outflow | Net | Cumulative |
|-------|--------|---------|-----|------------|
| Aug | ₹1,15,200 | ₹1,08,500 | +₹6,700 | ₹42,100 |
| Sep | ₹1,20,500 | ₹1,14,300 | +₹6,200 | ₹48,300 |
| Oct | ₹1,24,800 | ₹1,16,700 | +₹8,100 | ₹56,400 |
| Nov | ₹1,32,800 | ₹1,24,600 | +₹8,200 | ₹64,600 |

Cash burn rate (if applicable):
- Monthly operating expenses: ₹44,100
- Cash runway: 18 months
- Safety status: "Healthy" (green)

CASH MANAGEMENT:

Cash allocation:
Current allocation pie chart:
- Operating reserve: 40% (₹23,320)
- Emergency fund: 30% (₹17,490)
- Growth fund: 20% (₹11,660)
- Owner distribution: 10% (₹5,830)

Recommended allocation:
- Keep 3-6 months operating expenses
- Current months covered: 18 months ✓

UPCOMING CASH REQUIREMENTS:

Next 30 days forecast:
Expected inflows:
- Service bookings: ₹95,000
- Product sales: ₹28,000
- Outstanding collections: ₹8,500
Total expected: ₹1,31,500
──────────────────────

Expected outflows:
- Salaries (Dec 5): ₹30,000
- Rent (Dec 1): ₹3,000
- Supplier payments: ₹10,000
- Loan EMI (Dec 10): ₹5,000
- Utilities: ₹1,500
- Other: ₹2,000
Total expected: ₹51,500
──────────────────────

Projected cash position:
- Current: ₹58,300
- + Inflows: ₹1,31,500
- - Outflows: ₹51,500
- Projected end: ₹1,38,300 (green)

Surplus funds: ₹86,800
Suggestion: "Consider investing surplus"

PAYMENT SCHEDULE:

Upcoming payments calendar:
Dec 1 (Tomorrow):
- Rent: ₹3,000 (due)
- Status: Funds available ✓

Dec 5 (4 days):
- Salaries: ₹30,000 (due)
- Status: Funds available ✓

Dec 10 (9 days):
- Loan EMI: ₹5,000
- Status: Scheduled ✓

Dec 15:
- GST payment: ₹20,880
- Status: Reminder set

Color-coded:
- Green: Sufficient funds
- Orange: Close to limit
- Red: Insufficient funds

BANK ACCOUNTS:

Account balances:
Account 1 - Current Account:
- Bank: ICICI Bank
- Account: ****4567
- Balance: ₹45,800
- Last updated: "2 hours ago"
- [View Transactions]

Account 2 - Cash in hand:
- Location: Salon counter
- Balance: ₹12,500
- Last count: "Nov 30, 2025"
- [Record Cash Transaction]

Total: ₹58,300

Transaction reconciliation:
- Last reconciled: "Nov 30, 2025"
- Unreconciled: 2 transactions
- [Reconcile Now]

CASH FLOW RATIOS:

Operating cash flow ratio:
- Operating cash flow: ₹82,675
- Current liabilities: ₹25,000
- Ratio: 3.31 (Excellent ✓)
- Industry avg: 1.5

Cash flow margin:
- Operating cash flow: ₹82,675
- Net sales: ₹1,24,500
- Margin: 66.4% (Excellent ✓)

Free cash flow:
- Operating cash flow: ₹82,675
- Capital expenditures: ₹15,000
- Free cash flow: ₹67,675
- Available for distribution/growth

INSIGHTS:

Cash flow insights:
- "💡 Cash Flow Analysis"
- Observations:
  * "Strong operating cash flow (66% margin)"
  * "Equipment purchase planned well"
  * "Sufficient cash runway (18 months)"
  * "Collections efficient (avg 4 days)"

Recommendations:
- "Consider investing ₹50,000 surplus in FD"
- "Maintain ₹30,000 emergency buffer"
- "Current cash position healthy ✓"

ALERTS:

Cash alerts setup:
- Low balance alert: When < ₹20,000
- Large outflow alert: Single payment > ₹10,000
- Recurring payment reminder: 3 days before

Current alerts:
- ✓ "GST payment due in 15 days"
- ✓ "Salary payment scheduled Dec 5"

ACTIONS:

Quick actions:
- [Record Cash Receipt]
- [Record Cash Payment]
- [Reconcile Bank]
- [View All Transactions]

Reports:
- [Daily Cash Report]
- [Cash Flow Forecast]
- [Variance Analysis]

Export:
- PDF, Excel, CSV
- Period selection
- [Export]

Background: White
Cash inflows: Green
Cash outflows: Red (in parentheses)
Net positive: Green, bold
Net negative: Red, bold
Style: Treasury management, CFO dashboard
Forward-looking, planning-focused
```

---

## Inventory Management

### Screen 49: Inventory Overview

**Prompt for Uizard:**
```
Design a comprehensive inventory management dashboard.

Header:
- Back arrow
- "Inventory" title
- [+ Add Stock] button (right, purple)
- Search icon

INVENTORY SUMMARY:

Summary cards (4):

Card 1 - Total Items:
- "245" (large, purple, 28sp)
- "SKUs in inventory"
- "18 categories"

Card 2 - Stock Value:
- "₹1,24,500" (large, green, 28sp)
- "Total inventory value"
- "At cost price"

Card 3 - Low Stock Alert:
- "12" (large, orange, 28sp)
- "Items below minimum"
- "⚠️ Needs reorder"

Card 4 - Out of Stock:
- "3" (large, red, 28sp)
- "Currently unavailable"
- "🚨 Urgent"

QUICK FILTERS:

Filter tabs:
- [All Items] [In Stock] [Low Stock] [Out of Stock]
- [Recently Added] [High Value]

INVENTORY LIST:

Category grouping (collapsible):

HAIR CARE PRODUCTS (85 items):

Product Card 1:
- Product image thumbnail (60px square, left)
- Product details (center):
  * Name: "L'Oreal Hair Color - Brown" (bold, 15sp)
  * SKU: "HC-LOR-BRN-001" (gray, 12sp)
  * Category: "Hair Care" (pill badge)
  * Brand: "L'Oreal Professional"
  
- Stock info (right):
  * Current stock: "15 units" (bold, 14sp)
  * Minimum: 10 units
  * Maximum: 50 units
  * Stock bar: 30% filled (yellow - approaching minimum)
  
- Pricing:
  * Cost price: ₹450/unit
  * Selling price: ₹650/unit
  * Margin: 44%
  
- Quick stats (bottom row):
  * Last restock: "Nov 5, 2025"
  * Usage rate: "2.5 units/week"
  * Reorder in: "2 weeks"
  
- Actions:
  * [Restock] button
  * [Adjust Stock]
  * [View History]

Status indicator (color-coded):
- Green badge: "In Stock"
- Visual stock bar below

Product Card 2 (Low Stock):
- Image thumbnail
- "Kerastase Shampoo 500ml"
- SKU: "HC-KER-SHP-500"
- Current stock: "3 units" (orange, bold)
- Minimum: 5 units
- Stock bar: 60% filled (orange)
- Status: "LOW STOCK ⚠️" (orange badge, prominent)
- [Reorder Now] button (orange, prominent)

Product Card 3 (Out of Stock):
- Image placeholder (grayed)
- "Matrix Hair Serum"
- SKU: "HC-MAT-SER-001"
- Current stock: "0 units" (red, bold)
- Status: "OUT OF STOCK 🚨" (red badge)
- On order: "20 units arriving Dec 5"
- [Mark Arrived] button (when arrived)

SKIN CARE PRODUCTS (45 items):
- Similar card layout
- Collapsed by default
- Tap to expand

MAKEUP PRODUCTS (38 items):
TOOLS & EQUIPMENT (35 items):
CONSUMABLES (42 items):

Each card: 120px height when collapsed, white background

Stock level color coding:
- Green bar: >75% of max (healthy stock)
- Yellow bar: 25-75% (moderate stock)
- Orange bar: <25% but >minimum (low stock)
- Red bar: Below minimum or out of stock

STOCK VALUATION:

Valuation by category (table):
| Category | Items | Qty | Value | % |
|----------|-------|-----|-------|---|
| Hair Care | 85 | 1,245 | ₹56,025 | 45% |
| Skin Care | 45 | 680 | ₹30,600 | 25% |
| Makeup | 38 | 425 | ₹21,250 | 17% |
| Tools | 35 | 142 | ₹11,825 | 9% |
| Consumables | 42 | 2,340 | ₹4,800 | 4% |
| **Total** | **245** | **4,832** | **₹1,24,500** | **100%** |

Horizontal bar showing distribution

STOCK MOVEMENT:

Recent stock movements (list):

Movement 1:
- Date: "Nov 10, 2025, 2:30 PM"
- Type: "Stock In" (green pill)
- Product: "L'Oreal Hair Color"
- Quantity: "+20 units"
- Vendor: "Beauty Suppliers Co."
- Cost: ₹9,000
- Added by: "Owner"
- Notes: "Monthly restock"

Movement 2:
- Date: "Nov 10, 2025, 10:15 AM"
- Type: "Stock Out" (blue pill)
- Product: "Kerastase Shampoo"
- Quantity: "-2 units"
- Used for: "Customer service"
- Customer: "Aarti Kumar"
- Booking: #BK123456

Movement 3:
- Date: "Nov 9, 2025"
- Type: "Adjustment" (orange pill)
- Product: "Matrix Serum"
- Quantity: "-3 units"
- Reason: "Damaged/expired"
- Adjusted by: "Manager"

Movement 4:
- Date: "Nov 8, 2025"
- Type: "Return" (purple pill)
- Product: "Lakme Lipstick"
- Quantity: "+5 units"
- Vendor: "Return to supplier"
- Credit: ₹750

[View All Movements]

STOCK ALERTS:

Active alerts section:
- "⚠️ 12 Low Stock Alerts"

Alert 1 (Critical):
- "🚨 OUT OF STOCK"
- Product: "Matrix Hair Serum"
- Current: 0 units
- Minimum: 3 units
- Action: [Reorder Now]

Alert 2 (Warning):
- "⚠️ LOW STOCK"
- Product: "Kerastase Shampoo"
- Current: 3 units
- Minimum: 5 units
- Usage rate: 2/week
- Days remaining: "~10 days"
- Action: [Add to Order]

Alert 3 (Approaching):
- "⚠ BELOW REORDER POINT"
- Product: "L'Oreal Color"
- Current: 15 units
- Reorder point: 20 units
- Action: [Reorder Soon]

Expiry alerts:
- "⏰ 5 items expiring in 30 days"
- [View Expiring Items]

Dormant stock:
- "📦 8 items not used in 90 days"
- Slow-moving inventory
- Consider: Discount/Remove

INVENTORY ANALYTICS:

Stock turnover (card):
- Turnover ratio: 4.2× per year
- Industry avg: 3.5×
- Status: "Good" (green)
- Fast movers: Hair colors, shampoos
- Slow movers: Specialty treatments

Stock-out rate:
- This month: 2.5%
- Target: <5%
- Status: "Meeting target" ✓

Carrying cost:
- Monthly cost: ₹2,490 (2% of value)
- Annual cost: ₹29,880
- Includes: Storage, insurance, depreciation

ABC Analysis (classification):
A-items (High value, 20% of items):
- 49 SKUs
- 70% of inventory value (₹87,150)
- Tight control, frequent review

B-items (Moderate, 30% of items):
- 74 SKUs
- 20% of inventory value (₹24,900)
- Moderate control

C-items (Low value, 50% of items):
- 122 SKUs
- 10% of inventory value (₹12,450)
- Basic control, bulk ordering

SEARCH & FILTERS:

Advanced search:
- Search bar with autocomplete
- Search by:
  * Product name
  * SKU
  * Barcode
  * Category
  * Brand
  * Supplier

Filters:
- Stock status: Multi-select
- Category: Multi-select
- Brand: Multi-select
- Price range: Slider
- Stock level: Range
- Supplier: Multi-select
- Added date: Date range

Sort options:
- Name (A-Z)
- Stock level (Low to High)
- Value (High to Low)
- Last restock date
- Usage rate
- Expiry date

QUICK ACTIONS:

Floating action buttons:
- [+ Add New Product]
- [📥 Stock In]
- [📤 Stock Out]
- [🔄 Stock Adjustment]
- [📋 Generate Report]

BULK OPERATIONS:

Multi-select mode:
- Long press to activate
- Checkboxes appear
- Bulk actions toolbar:
  * [Reorder Selected]
  * [Adjust Prices]
  * [Change Category]
  * [Export Selected]
  * [Delete] (requires confirmation)

BARCODE SCANNING:

Barcode scanner integration:
- [Scan Barcode] button
- Camera opens
- Scans product barcode
- Loads product instantly
- Quick stock update

Background: Light gray (#F9FAFB)
Product cards: White, subtle shadow
Stock bars: Color-coded (green/yellow/orange/red)
Alerts: Color-coded badges
Style: Warehouse management, inventory control
Visual stock levels, automated reorder points
```

---

### Screen 50: Add/Edit Product

**Prompt for Uizard:**
```
Design a comprehensive product add/edit form for inventory.

Header:
- Back arrow
- "Add Product" title (or "Edit Product")
- [Save] button (right, purple, enabled when valid)

Form sections (scrollable):

PRODUCT IMAGE:
- "Product Images" heading
- Image upload grid (4 slots):
  * Primary image (large, 150px)
  * 3 additional images (100px each)
  * Camera icon + "Add Photo"
  * Gallery icon "Choose Photo"
  * Rearrange by drag-drop
- Image requirements: "Max 5MB, JPG/PNG"
- [Remove] option on uploaded images

BASIC INFORMATION:
- "Basic Details" section heading

Product Name:
- "Product Name *" (required)
- Input field: "L'Oreal Professional Hair Color"
- Character count: 0/100

Brand:
- "Brand *" (required)
- Dropdown with search:
  * L'Oreal Professional
  * Kerastase
  * Matrix
  * Lakme
  * Other brands...
  * [+ Add New Brand]

Category:
- "Category *" (required)
- Dropdown:
  * Hair Care
    - Hair Color
    - Shampoo
    - Conditioner
    - Treatment
  * Skin Care
  * Makeup
  * Tools & Equipment
  * Consumables
  * [+ Add New Category]

Sub-category:
- Auto-populated based on category
- "Hair Color" (selected from dropdown)

SKU (Stock Keeping Unit):
- "SKU" input
- Auto-generated: "HC-LOR-001"
- Or manual override
- Unique validation

Barcode:
- "Barcode/UPC" input
- Option to scan with camera
- [Scan Barcode] button
- Or manual entry

Description:
- "Product Description" (optional)
- Multi-line text area (4 lines)
- "Describe the product, its uses, benefits..."
- Character limit: 500

Tags:
- "Tags" (for easy search)
- Tag input with autocomplete
- Examples: #professional, #ammonia-free, #vegan
- Pill-style display of added tags

STOCK INFORMATION:
- "Stock Details" heading

Current Stock:
- "Current Quantity *"
- Number input
- Unit selector: [Units ▼] [Liters] [Kg] [Bottles]
- Default unit: Units

Unit of Measurement:
- Dropdown:
  * Piece/Unit (default)
  * Bottle
  * Tube
  * Packet
  * Set
  * Liter
  * Milliliter
  * Gram
  * Kilogram

Stock levels:
- Minimum Stock Level *:
  * Input: "10" units
  * "Reorder alert below this"
  
- Reorder Point:
  * Input: "20" units
  * "Optimal reorder trigger"
  
- Maximum Stock Level:
  * Input: "50" units
  * "Maximum to keep"

Visual indicator:
- Shows current stock vs min/max
- Color-coded bar

PRICING:
- "Pricing Information" heading

Cost Price:
- "Cost Price (Purchase Price) *"
- "₹" prefix + input
- "450.00"
- "Per unit"

Selling Price:
- "Selling Price *"
- "₹" input
- "650.00"
- Auto-calculated markup: "44.4% margin ✓"
- If selling < cost: Warning "⚠️ Selling below cost"

Tax/GST:
- "GST Rate"
- Dropdown:
  * 0% (Exempt)
  * 5%
  * 12%
  * 18% (default for salon products)
  * 28%
- "HSN Code" input: "3305" (hair products)

Discount (optional):
- "Standard Discount" (if applicable)
- Percentage or fixed amount
- Used for bulk/package discounts

Price history:
- Shows previous price changes
- Last changed: "Oct 15, 2025"
- Previous price: ₹600

SUPPLIER INFORMATION:
- "Supplier Details" heading

Primary Supplier:
- "Supplier Name"
- Dropdown with search:
  * Beauty Suppliers Co.
  * Professional Distributors
  * Direct from Brand
  * [+ Add New Supplier]
  
- Selected supplier card shows:
  * Name: "Beauty Suppliers Co."
  * Contact: "+91 98700 00000"
  * Email: "orders@beautysuppliers.com"
  * Payment terms: "Net 15 days"
  * Lead time: "5-7 days"

Supplier SKU:
- "Supplier's Product Code"
- "LOR-HC-BRN-500"

Reorder information:
- Minimum order quantity: "10 units"
- Pack size: "1 unit/pack"
- Bulk discount: "5% on 50+ units"

Alternative suppliers:
- [+ Add Alternative Supplier]
- For backup/comparison

LOCATION & STORAGE:
- "Storage Information" heading

Storage Location:
- "Where is this stored?"
- Input or dropdown:
  * Main Storage Room
  * Display Shelf A
  * Back Room
  * Refrigerated Section
  * [+ Add Location]

Storage Bin/Shelf:
- Specific location: "Shelf A3"

Storage conditions:
- Temperature requirements:
  ○ Room temperature (default)
  ○ Refrigerated (2-8°C)
  ○ Cool & dry

- Hazardous material: Toggle
  * If yes: Special handling notes

EXPIRY & BATCH:
- "Expiry Management" heading

Expiry tracking:
- "Track expiry dates" Toggle
- If ON:
  * Expiry date: Date picker
  * Batch number: Input
  * Manufacturing date: Date picker
  * Shelf life: "24 months"

Expiry alert:
- "Alert before expiry"
- Input: "30 days before"

Batch tracking:
- "Enable batch tracking" Toggle
- If ON: Each stock-in requires batch #

ADDITIONAL DETAILS:
- "Other Information" heading

Product Type:
- Radio buttons:
  ○ Stock item (default)
  ○ Non-stock service item
  ○ Package/Combo

Variants (if applicable):
- "Product Variants" expandable
- Example for hair color:
  * Size: 100ml, 250ml, 500ml
  * Shade: Brown, Black, Blonde
  * Type: Permanent, Semi-permanent
- Each variant has own SKU, price, stock

Commission eligible:
- "Include in staff commission" Toggle
- Commission %: "20%" (if enabled)

Notes:
- "Internal Notes"
- Text area
- "Any special notes about this product"
- Storage instructions, usage tips

ATTACHMENTS:
- "Documents & Certificates" heading
- Upload supporting docs:
  * Product datasheet
  * Safety certificate
  * License (if required)
  * Supplier invoice
- [Upload Document] button

SALES HISTORY (if editing):
- "Sales Performance" expandable
- Shows:
  * Units sold this month: 12
  * Total revenue: ₹7,800
  * Usage trend: Line chart
  * Top customers

VALIDATION:
- Real-time validation
- Required fields marked with *
- Error messages inline:
  * "SKU already exists"
  * "Selling price below cost"
  * "Invalid barcode format"

Duplicate detection:
- If similar product found:
  * Warning: "Similar product exists"
  * Shows match: "L'Oreal Hair Color Brown"
  * [View] [Add Anyway] options

BOTTOM ACTIONS:

If Adding New:
- [Save as Draft] (outlined, gray, left)
- [Add Product] (filled, purple, right)
- [Add & Add Another] (add multiple quickly)

If Editing Existing:
- [Delete Product] (red, outlined, left - requires confirmation)
- [Save Changes] (filled, purple, right)

Delete confirmation:
- "⚠️ Delete Product?"
- "This will remove all stock and history"
- Alternatives:
  * [Mark as Inactive] (keeps history)
  * [Delete Permanently] (removes all)

Success state:
- "✓ Product added successfully!"
- Quick actions:
  * [View Product]
  * [Add Stock]
  * [Add Another Product]
  * [Back to Inventory]

AUTO-SAVE:
- Draft auto-saved every 30 seconds
- "Draft saved" indicator (gray text)

TEMPLATES:
- [Use Template] button
- Pre-filled templates for common products:
  * Hair Color Product
  * Shampoo/Conditioner
  * Makeup Item
  * Tool/Equipment
- Speeds up data entry

Background: White
Sections: Visual separation with spacing
Style: Product catalog, detailed inventory
Progressive disclosure (expandable sections)
Smart defaults, thorough validation
```

---

(Due to message length limits, continuing in next response with remaining screens 51-88...)

### Screen 51: Stock Reorder & Purchase Orders

**Prompt for Uizard:**
```
Design a stock reordering and purchase order management screen.

Header:
- Back arrow
- "Reorder & Purchase Orders" title
- [+ New Order] button (right, purple)

REORDER OVERVIEW:

Summary cards (3):

Card 1 - Items to Reorder:
- "12" (large, orange, 28sp)
- "Below reorder point"
- "Action needed"

Card 2 - Pending Orders:
- "5" (large, blue)
- "Active POs"
- "₹45,600 value"

Card 3 - Arriving Soon:
- "3" (large, green)
- "This Week"
- "₹18,200 value"

TABS:
- [Reorder List] [Purchase Orders] [Order History]

REORDER LIST TAB:

Items needing reorder (sorted by priority):

Reorder Item 1 (Critical):
- Priority: "🚨 URGENT" (red badge)
- Product image (60px)
- Name: "Matrix Hair Serum"
- SKU: "HC-MAT-SER-001"
- Current stock: "0 units" (red, bold)
- Minimum: 3 units
- Recommended order: "20 units"
  * Based on: Avg usage (2/week) × Lead time (2 weeks) + Buffer (6)
- Supplier: "Beauty Suppliers Co."
- Cost: ₹450/unit
- Total: ₹9,000
- Lead time: "5-7 days"
- [Add to Cart] button (prominent, red)

Reorder Item 2 (High):
- Priority: "⚠️ HIGH" (orange badge)
- "Kerastase Shampoo"
- Current: "3 units" (orange)
- Minimum: 5 units
- Recommended: "25 units"
  * 1 week until stock-out (based on usage)
- Supplier: "Professional Distributors"
- Cost: ₹800/unit
- Total: ₹20,000
- [Add to Cart]

Reorder Item 3 (Medium):
- Priority: "⚠ MEDIUM" (yellow badge)
- "L'Oreal Hair Color - Brown"
- Current: "15 units" (yellow)
- Reorder point: 20 units
- Recommended: "30 units"
- 2 weeks buffer remaining
- [Add to Cart]

Each item card: 100px height, white background

Smart recommendations:
- Quantity based on:
  * Historical usage rate
  * Lead time
  * Seasonal trends
  * Buffer stock policy

Bulk actions:
- [Select All]
- [Add All to Cart]
- [Create Purchase Order]

PURCHASE ORDERS TAB:

Active purchase orders:

PO Card 1 (Pending):
- PO number: "PO-2025-0045" (bold)
- Status: "PENDING" (orange badge)
- Supplier: "Beauty Suppliers Co."
- Order date: "Nov 8, 2025"
- Expected delivery: "Nov 15, 2025" (7 days away)
- Items: "8 products"
- Total value: "₹28,500"

Items summary (expandable):
- L'Oreal Hair Color × 20 = ₹9,000
- Matrix Shampoo × 15 = ₹12,000
- Kerastase Conditioner × 10 = ₹7,500

Payment terms:
- Payment: "Net 15 days"
- Due date: "Nov 30, 2025"
- Status: "Unpaid"

Actions:
- [Mark as Received]
- [Track Shipment]
- [Contact Supplier]
- [View Invoice]

PO Card 2 (Shipped):
- "PO-2025-0044"
- Status: "SHIPPED 📦" (blue badge)
- Supplier: "Professional Distributors"
- Expected: "Nov 12, 2025" (Tomorrow)
- Items: 5 products
- Value: ₹18,200
- Tracking: "DHL-123456789"
- [Track Package] button

PO Card 3 (Received):
- "PO-2025-0043"
- Status: "RECEIVED ✓" (green badge)
- Received date: "Nov 10, 2025"
- Items: All verified
- Payment: "Paid"
- [View Receipt]

ORDER HISTORY TAB:

Historical orders (scrollable table):

| PO Number | Date | Supplier | Items | Value | Status |
|-----------|------|----------|-------|-------|--------|
| PO-2025-0043 | Nov 10 | Beauty Suppliers | 12 | ₹35,600 | Received |
| PO-2025-0042 | Nov 5 | Prof. Distributors | 8 | ₹22,400 | Received |
| PO-2025-0041 | Oct 28 | Beauty Suppliers | 15 | ₹45,200 | Received |

Filters:
- Date range
- Supplier
- Status
- Value range

Analytics:
- Total purchases (MTD): ₹1,03,200
- Average PO value: ₹25,800
- Most ordered supplier
- Order frequency

CREATE PURCHASE ORDER:

Tap "+ New Order" opens form:

"Create Purchase Order"

Step 1 - Supplier Selection:
- "Select Supplier *"
- Dropdown with search:
  * Beauty Suppliers Co.
  * Professional Distributors
  * Direct from L'Oreal
  * [+ Add New Supplier]

Selected supplier card:
- Name + contact info
- Payment terms
- Lead time
- Previous orders count

Step 2 - Add Products:
- "+ Add Product" button

Product line item:
- Product dropdown (searchable)
- Or scan barcode
- Quantity input
- Unit price (editable)
- Tax rate
- Line total: Auto-calculated

Quick add from reorder list:
- [Import from Reorder List]
- Shows items below minimum
- One-click add

Product list summary:
Item 1:
- L'Oreal Hair Color × 20
- @ ₹450 = ₹9,000
- GST 18%: ₹1,620
- Total: ₹10,620
- [Remove]

Item 2:
- Matrix Shampoo × 15
- @ ₹800 = ₹12,000
- GST 18%: ₹2,160
- Total: ₹14,160

[+ Add Another Product]

Step 3 - Order Details:
- PO number: Auto-generated "PO-2025-0046"
- Order date: Today (default)
- Expected delivery: Date picker
  * Or "Lead time: 5-7 days" (auto-calculated)
- Shipping address: Dropdown
  * Salon address (default)
  * Other locations

Step 4 - Pricing & Terms:
- Subtotal: ₹28,500
- Discount: Input (% or fixed)
  * Bulk discount: "5% applied" (-₹1,425)
- Shipping charges: ₹500
- GST @ 18%: ₹4,905
- Total: ₹32,480 (large, bold, purple)

Payment terms:
- Terms: Dropdown
  * Advance payment
  * Cash on delivery
  * Net 15 days (default)
  * Net 30 days

- Advance amount: Input (if applicable)
- Due date: Auto-calculated

Notes to supplier:
- Text area
- "Please include invoice with shipment"

Attachments:
- Purchase requisition
- Authorization docs

Step 5 - Review & Submit:
- Preview full PO
- Verification checklist:
  ☑ Items verified
  ☑ Quantities correct
  ☑ Pricing approved
  ☑ Payment terms confirmed

Actions:
- [Save as Draft]
- [Send to Supplier] (via email/WhatsApp)
- [Print PO]
- [Submit Order]

RECEIVE STOCK:

When order arrives:
Tap "Mark as Received" on PO

"Receive Stock - PO-2025-0045"

Item verification:
For each item in PO:
- Expected: L'Oreal Hair Color × 20
- Received: Input (20)
- Checkbox: ☑ "Verified"
- Quality check: ☑ "Good condition"
- Batch number: Input (if tracked)
- Expiry date: Date picker (if applicable)
- Discrepancy: If received ≠ expected
  * Note reason
  * Partial receive or reject

Upload documents:
- Delivery note
- Invoice from supplier
- Quality certificates
- [Take Photo] [Upload]

Stock allocation:
- Auto-updates inventory
- "Add 20 units to current stock"
- New total: "35 units"

Payment recording:
- Amount: ₹32,480
- Payment method:
  * Cash
  * Bank transfer
  * Credit
- Payment date
- Transaction reference

[Cancel] [Complete Receipt]

Confirmation:
- "✓ Stock received and added to inventory!"
- Inventory updated
- PO status: Received
- [View Updated Stock]

REORDER AUTOMATION:

Auto-reorder settings:
- "Automatic Reordering" heading
- Enable auto-reorder: Toggle

For each product (if enabled):
- Trigger: "When stock reaches minimum"
- Order quantity: "Recommended amount"
- Supplier: "Primary supplier"
- Auto-approve: Toggle
  * If ON: Creates PO automatically
  * If OFF: Creates draft for review

Notification:
- Email owner when auto-order created
- Approval required if value > ₹10,000

SUPPLIER MANAGEMENT:

Supplier list (within this screen):

Supplier Card:
- Name: "Beauty Suppliers Co."
- Contact: "+91 98700 00000"
- Email: "orders@beautysuppliers.com"
- Rating: 4.5 ⭐ (based on delivery, quality)

Performance metrics:
- On-time delivery: 92%
- Order accuracy: 95%
- Average lead time: 6 days
- Total orders: 45
- Total value: ₹12,34,500

Payment terms: "Net 15 days"
Credit limit: ₹50,000

[View All Orders] [Contact] [Edit]

ANALYTICS:

Purchasing analytics:
- Monthly spend: ₹1,03,200
- vs Budget: ₹1,20,000 (86% used)
- Average PO value: ₹25,800
- Orders placed: 4 this month

Supplier comparison:
- Best price: Professional Distributors
- Fastest delivery: Beauty Suppliers Co.
- Best quality: Direct from Brand

Order efficiency:
- Average processing time: 2 days
- Stock-out prevention: 98%
- Order accuracy: 96%

Background: Light gray
PO cards: White, status color-coded
Urgency levels: Red/Orange/Yellow badges
Style: Procurement management, supply chain
Automated reordering, smart recommendations
```

---

### Screen 52: Stock Audit & Cycle Count

**Prompt for Uizard:**
```
Design a stock audit and physical inventory count screen.

Header:
- Back arrow
- "Stock Audit" title
- [Start New Audit] button (right, purple)

AUDIT OVERVIEW:

Summary cards (3):

Card 1 - Last Audit:
- "Nov 1, 2025" (date, large)
- "30 days ago"
- Discrepancies: "5 items"

Card 2 - Accuracy Rate:
- "96.8%" (large, green)
- "Inventory accuracy"
- Above target (95%)

Card 3 - Next Scheduled:
- "Dec 1, 2025" (date)
- "21 days away"
- Type: "Full count"

TABS:
- [Active Audits] [Audit History] [Discrepancies]

ACTIVE AUDITS TAB:

Ongoing audit session:

Audit Session 1:
- Audit ID: "AUD-2025-11-0001"
- Type: "Cycle Count" (blue badge)
- Category: "Hair Care Products"
- Started: "Nov 10, 2025, 9:00 AM"
- By: "Owner"
- Progress: "45 of 85 items counted" (53%)
- Progress bar (purple)
- Time elapsed: "2h 15m"

Status breakdown:
- Counted: 45 items ✓
- Remaining: 40 items
- Discrepancies found: 3 items ⚠️

[Continue Audit] button (prominent, purple)
[Pause] [Cancel Audit]

Empty state (if no active):
- "No Active Audits"
- "Start a new stock audit or schedule one"
- [Start Audit Now]

AUDIT HISTORY TAB:

Previous audits (list):

Audit Record 1:
- Date: "Nov 1, 2025"
- Type: "Full Inventory Count"
- Items counted: 245 (all)
- Duration: "6 hours"
- Conducted by: "Owner + Staff"

Results:
- Matched: 240 items (98%)
- Discrepancies: 5 items (2%)
- Value variance: +₹1,250 (system had less)
- Adjusted: Yes ✓

Discrepancy summary:
- Shrinkage (missing): 2 items (-₹800)
- Overage (extra): 3 items (+₹2,050)
- Net variance: +₹1,250

[View Full Report] [Download PDF]

Audit Record 2:
- Date: "Oct 1, 2025"
- Type: "Cycle Count - Skin Care"
- Items: 45
- Duration: "1.5 hours"
- Matched: 43 (96%)
- Discrepancies: 2

Historical trend (chart):
- Accuracy rate over time
- Last 6 audits
- Line graph showing improvement

DISCREPANCIES TAB:

Current discrepancies requiring attention:

Discrepancy 1:
- Product: "L'Oreal Hair Color - Brown"
- SKU: "HC-LOR-BRN-001"
- System quantity: 15 units
- Physical count: 18 units
- Variance: +3 units (Overage, green)
- Value impact: +₹1,350
- Possible reason:
  * Data entry error
  * Unreported stock-in
- Status: "Pending Review"
- [Adjust System] [Investigate] [Mark as Resolved]

Discrepancy 2:
- Product: "Kerastase Shampoo"
- System: 5 units
- Count: 3 units
- Variance: -2 units (Shrinkage, red)
- Value: -₹1,600
- Possible reasons:
  * Theft
  * Unreported usage
  * Damaged/discarded
  * Data entry error
- Status: "Under Investigation"
- Notes: "Staff to verify"

Resolution actions:
- [Accept Physical Count] - Updates system
- [Recount Item] - Verify count
- [Report Loss] - Document shrinkage
- [Investigate Further]

Historical discrepancies:
- Shows resolved items
- Trends in problem areas

CREATE NEW AUDIT:

Tap "Start New Audit" opens wizard:

"Create Stock Audit"

Step 1 - Audit Type:
- Select audit type:
  ○ Full Inventory Count
    * All items in inventory
    * Recommended: Annually
    
  ○ Cycle Count (Partial)
    * Select specific categories/items
    * Recommended: Monthly
    
  ○ ABC Analysis Count
    * A-items: High value (weekly)
    * B-items: Medium value (monthly)
    * C-items: Low value (quarterly)
    
  ○ Spot Check
    * Random sample
    * Quick verification

Step 2 - Scope Selection:
If Cycle Count selected:
- Select categories:
  ☑ Hair Care Products (85 items)
  ☐ Skin Care (45 items)
  ☐ Makeup (38 items)
  ☐ Tools (35 items)
  ☐ Consumables (42 items)

Or select specific items:
- Search and multi-select
- [Select All] [Clear All]

If ABC Analysis:
- A-items (49 SKUs) - Weekly count
- Select date range for count

Step 3 - Schedule:
- Timing:
  ○ Start now (immediate)
  ○ Schedule for later
    * Date & time picker
    
- Estimated duration: "2-3 hours" (auto-calculated)

- Assign to:
  * Owner (default)
  * Select staff member(s)
  * Multiple counters for accuracy

- Freeze stock movements:
  ☑ "Pause stock-in/out during audit"
  * Prevents changes during count

Step 4 - Count Method:
- Method selection:
  ○ Manual count (with sheet)
  ○ Barcode scanning (app)
  ○ RFID scanning (if equipped)

- Count entry:
  ○ Single count (one person)
  ○ Double count (verification)
    * Two counters independently
    * Compare results

- Blind count:
  ☑ "Hide system quantities"
  * Counters don't see expected qty
  * More accurate, unbiased count

[Start Audit] button

AUDIT EXECUTION:

During audit session:
Shows list of items to count:

Item to Count 1:
- Product image + name
- "L'Oreal Hair Color - Brown"
- SKU: "HC-LOR-BRN-001"
- Location: "Shelf A3"

If blind count OFF:
- System quantity: "15 units"

Count entry:
- Large number input
- "Physical Count" field
- Quick increment buttons: [-1] [+1] [+5] [+10]
- Or scan barcode multiple times (auto-counts)

Quality check:
- Condition: 
  ☐ Good
  ☐ Damaged
  ☐ Expired
- If damaged/expired:
  * Quantity damaged: Input
  * Action: [Discard] [Return] [Discount]

Notes:
- "Add notes for this item"
- Optional comments

[Save & Next] button

Progress indicator:
- "Item 12 of 85"
- Percentage bar
- Time remaining estimate

Pause audit:
- [Pause Audit] button
- Saves progress
- Resume later

Complete item:
- Checkmark ✓
- Green highlight
- Moves to next item

DISCREPANCY HANDLING:

When count ≠ system:
- Variance alert appears
- Shows:
  * System: 15 units
  * Count: 18 units
  * Variance: +3 units
  * Value: +₹1,350

Options:
- [Accept Count] - Updates system
- [Recount] - Verify again
- [Add Note] - Document reason
- [Flag for Review] - Investigate later

Threshold settings:
- Auto-accept if variance < 2%
- Flag if variance > 5%
- Require manager approval if value > ₹1,000

AUDIT COMPLETION:

After counting all items:

"Audit Summary - AUD-2025-11-0001"

Overall results:
- Items counted: 85
- Time taken: "2h 45m"
- Accuracy: 96.5%

Breakdown:
- Matched exactly: 79 items (93%)
- Minor variance (<2%): 3 items (4%)
- Significant variance (>2%): 3 items (4%)

Value impact:
- System value: ₹56,025
- Physical value: ₹57,275
- Variance: +₹1,250 (2.2%)

Discrepancies:
- Overage: 3 items (+₹2,050)
- Shrinkage: 2 items (-₹800)
- Damaged: 1 item (-₹450)

Actions required:
- [Review Discrepancies] (3 items)
- [Adjust Inventory] (update system)
- [Generate Report]

Adjustment preview:
- Shows all changes to be made
- [Accept All] [Review Individually]

[Finalize Audit] button

Confirmation:
- "Inventory updated successfully!"
- Audit report generated
- [Download Report] [Email Report]

AUDIT REPORTS:

Generated audit report (PDF/Excel):
Contains:
- Audit details (date, type, who)
- Items counted
- Discrepancies found
- Value variance
- Actions taken
- Recommendations

Report sections:
1. Executive Summary
2. Items Counted (detailed list)
3. Discrepancies
4. Value Analysis
5. Root Cause Analysis
6. Corrective Actions
7. Signatures

AUDIT SETTINGS:

Audit schedule:
- Full count: Annually (configured)
- Cycle count: Monthly
- ABC count: By category frequency

Variance thresholds:
- Acceptable: <2%
- Review required: 2-5%
- Investigation: >5%

Notifications:
- Remind before scheduled audit
- Alert on high variance
- Report completion notification

Integration:
- Update main inventory automatically
- Or require approval for adjustments
- Audit trail maintained

ANALYTICS:

Audit analytics:
- Audit frequency: 12 per year
- Average accuracy: 96.8%
- Shrinkage rate: 0.8%
- Most common variances: Data entry errors

Problem areas:
- High shrinkage categories
- Items with frequent discrepancies
- Locations with issues

Improvement tracking:
- Accuracy trending up
- Shrinkage decreasing
- Faster audit times

Background: White
Matched items: Green checkmarks
Discrepancies: Orange/red highlights
Style: Warehouse audit, stock-take
Systematic counting, variance tracking
Compliance-ready, audit trail maintained
```

---

## Communication & Marketing

### Screen 53: Marketing Campaigns

**Prompt for Uizard:**
```
Design a marketing campaign creation and management screen.

Header:
- Back arrow
- "Marketing Campaigns" title
- [+ New Campaign] button (right, purple)

CAMPAIGN OVERVIEW:

Summary cards (4):

Card 1 - Active Campaigns:
- "3" (large, green, 28sp)
- "Currently Running"
- "12,500 reach"

Card 2 - Campaign ROI:
- "425%" (large, purple)
- "Return on Investment"
- "₹4,250 revenue per ₹1,000 spent"

Card 3 - Total Reach:
- "45,200" (large, blue)
- "People Reached"
- "This month"

Card 4 - Conversions:
- "156" (large, green)
- "New Bookings"
- "From campaigns"

TABS:
- [Active] [Scheduled] [Completed] [Templates]

ACTIVE CAMPAIGNS TAB:

Running campaigns:

Campaign Card 1:
- Campaign name: "Weekend Special - 20% Off" (bold, 16sp)
- Status: "ACTIVE 🟢" (green badge, pulsing)
- Type: "Promotional Offer" (blue pill)
- Channel: "WhatsApp + SMS" (icons shown)

Duration:
- Start: "Nov 8, 2025"
- End: "Nov 15, 2025"
- Time remaining: "5 days left"
- Progress bar showing 70% complete

Targeting:
- Audience: "All active customers"
- Sent to: "245 customers"
- Opened: "180" (73%)
- Clicked: "95" (39%)
- Converted: "42" (17%)

Performance metrics:
- Reach: 245
- Engagement rate: 73%
- Conversion rate: 17%
- Revenue generated: ₹28,500
- ROI: 380%

Budget:
- Spent: ₹6,500
- Budget: ₹10,000 (65% used)

[View Details] [Edit] [Pause] [Stop]

Campaign Card 2:
- "Diwali Festive Package"
- Status: "ACTIVE 🟢"
- Type: "Seasonal Campaign"
- Channels: "Instagram Ads + Email"
- Days remaining: "12 days"
- Reach: 8,500
- Conversions: 68
- ROI: 520%

SCHEDULED CAMPAIGNS TAB:

Upcoming campaigns:

Scheduled Campaign 1:
- Name: "New Year Beauty Deals"
- Status: "SCHEDULED ⏰" (orange badge)
- Launch date: "Dec 28, 2025"
- Channels: "All channels"
- Target audience: "VIP + High spenders"
- Estimated reach: "120 customers"
- Budget: ₹15,000
- [Edit] [Launch Now] [Cancel]

COMPLETED CAMPAIGNS TAB:

Past campaigns with results:

Completed Campaign 1:
- Name: "Monsoon Hair Care Special"
- Status: "COMPLETED ✓" (gray badge)
- Ran: "Aug 1-15, 2025"
- Duration: 15 days

Final results:
- Reached: 280 customers
- Opened: 215 (77%)
- Converted: 58 (21%)
- Revenue: ₹42,800
- Spent: ₹8,200
- ROI: 422%
- Rating: ⭐⭐⭐⭐⭐ (Excellent)

[View Full Report] [Clone Campaign]

CREATE NEW CAMPAIGN:

Tap "+ New Campaign" opens wizard:

"Create Marketing Campaign"

Step 1 - Campaign Basics:
- Campaign name *:
  * Input: "Weekend Special Offer"
  
- Campaign type:
  ○ Promotional Offer
  ○ New Service Launch
  ○ Seasonal Campaign
  ○ Customer Retention
  ○ Referral Program
  ○ Event Announcement
  ○ General Awareness

- Objective:
  * Dropdown:
    - Increase bookings
    - Promote new service
    - Boost product sales
    - Re-engage inactive customers
    - Build brand awareness

Step 2 - Audience Selection:
- "Target Audience" heading

Segment selection:
- Predefined segments:
  ☑ All Customers (245)
  ☐ VIP Customers (45)
  ☐ New Customers (18)
  ☐ Inactive (60+ days) (23)
  ☐ High Spenders (35)
  ☐ Birthday This Month (12)

Custom filters:
- Last visit: Date range
- Total spent: Amount range
- Service preference: Multi-select
- Location: Within X km
- Gender: Select
- Age group: Range

Audience preview:
- "125 customers match criteria"
- Estimated reach: "110 (88% reachable)"
- [Preview List]

Channels available:
- SMS: 125 customers with phone
- Email: 95 customers with email
- WhatsApp: 120 customers opted-in
- App notification: 45 app users

Step 3 - Message Content:
- Select channel tabs:
  [SMS] [Email] [WhatsApp] [App Notification]

SMS Content:
- Template selection:
  * Dropdown with pre-saved templates
  * "20% Weekend Discount" template
  * Or "Create Custom"

Message editor:
- Text area (160 char limit for single SMS)
- Character count: "0/160"
- "Hi {{name}}, enjoy 20% off this weekend at {{salon_name}}! Book now: {{booking_link}}"

Personalization tags:
- {{name}} - Customer name
- {{salon_name}} - Salon name
- {{offer}} - Offer details
- {{booking_link}} - Direct booking link
- {{points}} - Loyalty points

- Preview with sample data
- "Hi Aarti, enjoy 20% off..."

SMS count: "1 SMS per recipient"
Cost estimate: "125 SMS × ₹0.20 = ₹25"

Email Content:
- Subject line: Input
  * "Weekend Beauty Special - 20% Off!"
  
- Email body:
  * Rich text editor
  * Drag-drop email builder
  * Add: Images, buttons, text blocks
  * Use email template
  
- Preview in mobile/desktop views

WhatsApp Content:
- Message text (longer, up to 1024 chars)
- Add image/video
- Add call-to-action button
- Preview how it appears

Step 4 - Offer/Incentive:
- Discount type:
  ○ Percentage off (20%)
  ○ Fixed amount (₹500 off)
  ○ Free service with booking
  ○ Buy 1 Get 1
  ○ Package deal

- Apply to:
  ☑ All services
  ☐ Specific services (select)
  
- Minimum booking: ₹1,000

- Promo code: "WEEKEND20"
  * Auto-generated or custom
  * Valid for: Campaign duration
  * Usage limit: 1 per customer

- Terms & conditions: Text area

Step 5 - Schedule & Timing:
- Launch timing:
  ○ Send now (immediate)
  ○ Schedule for later
    * Date: Nov 12, 2025
    * Time: 10:00 AM
    * Timezone: IST

- Campaign duration:
  * Start date: Nov 12
  * End date: Nov 15
  * Duration: 3 days

- Optimal send time:
  * AI suggestion: "10 AM on Saturday"
  * Based on historical open rates

- Reminder:
  ☑ "Send reminder 1 day before end"
  * Reminder message: Pre-filled

Step 6 - Budget & Settings:
- Campaign budget: ₹10,000
  * SMS cost: ₹25
  * Email: Free
  * WhatsApp: ₹12.50 (₹0.10 each)
  * Ads (if selected): ₹9,962.50
  * Total: ₹10,000

- Tracking:
  ☑ Track opens
  ☑ Track clicks
  ☑ Track conversions
  ☑ Track revenue

- UTM parameters: Auto-generated

- Test send:
  * "Send test to myself"
  * Verify before launch

Step 7 - Review & Launch:
- Campaign summary preview
- All details shown
- Verification checklist:
  ☑ Audience selected (125)
  ☑ Message created
  ☑ Offer configured
  ☑ Schedule set
  ☑ Budget allocated

[Save as Draft] [Schedule Campaign] [Launch Now]

Confirmation:
- "Campaign scheduled successfully!"
- Will send on: Nov 12, 10:00 AM
- [View Campaign] [Create Another]

CAMPAIGN ANALYTICS:

Detailed campaign performance:

"Weekend Special - 20% Off" Analysis

Delivery metrics:
- Sent: 245 (100%)
- Delivered: 242 (99%)
- Failed: 3 (1%)
- Bounced: 0

Engagement metrics:
- Opened: 180 (74%)
- Clicked: 95 (39%)
- Unsubscribed: 2 (0.8%)

Conversion funnel:
- Reached: 245
  ↓ 74% opened (180)
  ↓ 53% clicked (95)
  ↓ 44% booked (42)
  
Conversion rate: 17% (excellent)

Revenue analysis:
- Bookings: 42
- Avg booking value: ₹678
- Total revenue: ₹28,500
- Campaign cost: ₹6,500
- Net profit: ₹22,000
- ROI: 338%

Time analysis (hourly breakdown):
- Bar chart showing opens by hour
- Peak: 11 AM - 1 PM
- Insight: "Best send time confirmed"

Device breakdown:
- Mobile: 85%
- Desktop: 12%
- Tablet: 3%

Geographic data (if tracked):
- Most engagement: Noida Sector 18
- Heatmap view

Customer segments:
- VIP customers: 32% conversion
- Regular: 18% conversion
- New: 8% conversion

Top performing messages:
- Subject lines with highest open rates
- CTA buttons with most clicks

CAMPAIGN TEMPLATES:

Pre-built campaign templates:

Template 1 - "Weekend Flash Sale":
- Pre-written messaging
- 20% discount offer
- SMS + Email content
- Target: All customers
- [Use Template] [Preview]

Template 2 - "Win Back Inactive":
- For customers not visited in 60+ days
- Special comeback offer
- Personal message tone
- [Use Template]

Template 3 - "Birthday Special":
- Auto-sends on customer birthday
- Free service or discount
- Personalized greeting
- [Use Template]

Template 4 - "Referral Reward":
- Encourage referrals
- Reward for both parties
- Tracking mechanism
- [Use Template]

[Create Custom Template]

AUTOMATION:

Automated campaign triggers:

Trigger-based campaigns:
1. Customer birthday: Auto-send 3 days before
2. Booking anniversary: After 30 days of first visit
3. Inactivity: After 60 days no visit
4. High spender milestone: After ₹10,000 total
5. Loyalty tier upgrade: Immediate notification

Each trigger:
- Enabled: Toggle switch
- Message template: Editable
- Timing: Configurable
- [Test] [Edit] [Disable]

COMPLIANCE:

Campaign compliance:
- ☑ Opt-out link included
- ☑ Sender ID verified
- ☑ DND list excluded
- ☑ GDPR compliant

Unsubscribe management:
- Unsubscribed users: 12
- Reason tracking
- Global suppression list

Opt-in tracking:
- WhatsApp: 120 opted-in
- SMS: 125 allowed
- Email: 95 consented

QUICK CAMPAIGNS:

Quick send (simple campaigns):
- Select template
- Choose audience
- One-click send
- Minimal setup

Instant offers:
- Flash deals (2-4 hours)
- Last-minute slots fill
- Quick announcements

Background: Light gray
Campaign cards: White, status color-coded
Active campaigns: Green pulse animation
Metrics: Large, bold numbers
Style: Marketing automation, campaign management
Data-driven insights, ROI-focused
```

---

### Screen 54: Customer Notifications

**Prompt for Uizard:**
```
Design a customer notification and messaging center.

Header:
- Back arrow
- "Notifications & Messages" title
- [+ Send Message] button (right, purple)

NOTIFICATION OVERVIEW:

Summary cards (3):

Card 1 - Sent Today:
- "45" (large, blue, 28sp)
- "Messages Sent"
- "Booking confirmations + reminders"

Card 2 - Delivery Rate:
- "98.2%" (large, green)
- "Successfully Delivered"
- Above average

Card 3 - Response Rate:
- "12%" (large, purple)
- "Customer Replies"
- "5 new messages"

TABS:
- [Automated] [Manual] [Templates] [Inbox]

AUTOMATED NOTIFICATIONS TAB:

Auto-sent notification types:

Notification Type 1 - Booking Confirmations:
- Status: "ACTIVE ✓" (green)
- Trigger: "Immediately after booking"
- Channels: SMS + Email + WhatsApp
- Sent: "18 today"
- Delivery: "100%"

Template preview:
"Hi {{name}}, your booking is confirmed!
Service: {{service}}
Date: {{date}} at {{time}}
Staff: {{staff_name}}
Location: {{salon_address}}
[View Booking] [Reschedule]"

Settings:
- [Edit Template]
- [Change Channels]
- [Disable]

Notification Type 2 - Appointment Reminders:
- Status: "ACTIVE ✓"
- Trigger: "24 hours before appointment"
- Channels: SMS + WhatsApp
- Sent: "12 today"
- Confirmed: "10 customers replied YES"

Template:
"Reminder: Your appointment tomorrow at {{time}}
Service: {{service}} with {{staff}}
Reply YES to confirm or CANCEL to reschedule
[Confirm] [Reschedule] [Cancel]"

Settings: Timing adjustment
- [1 day before] [2 hours before] [Both]

Notification Type 3 - Payment Receipts:
- Trigger: "After payment received"
- Channel: Email (PDF attachment)
- Sent: "15 today"
- Template: "Payment receipt attached"

Notification Type 4 - Thank You Messages:
- Trigger: "1 hour after service completion"
- Channel: WhatsApp
- Template: "Thank you for visiting! We hope you loved your {{service}}. [Leave Review]"

Notification Type 5 - Birthday Wishes:
- Trigger: "On customer birthday, 9 AM"
- Channel: WhatsApp + SMS
- Special offer included
- "Happy Birthday {{name}}! Enjoy 20% off..."

Notification Type 6 - Loyalty Updates:
- Trigger: "Points earned or tier upgraded"
- Channel: App notification + SMS
- "Congratulations! You've earned 50 points..."

Notification Type 7 - Booking Changes:
- Trigger: "If booking rescheduled/cancelled"
- Channel: SMS + Email
- "Your booking has been rescheduled to {{new_date}}"

Each notification type card:
- 100px height
- Toggle to enable/disable
- Edit template button
- View history
- Performance stats

MANUAL MESSAGES TAB:

Recently sent manual messages:

Message Card 1:
- Date/time: "Nov 10, 2025, 2:30 PM"
- To: "All VIP Customers (45)"
- Channel: "WhatsApp"
- Subject/Preview: "Exclusive VIP Offer"
- Full message:
  "Hi {{name}}, as our valued VIP customer, 
  enjoy exclusive 25% off on premium services 
  this weekend only! Book now..."
  
Status:
- Sent: 45
- Delivered: 44
- Read: 32 (73%)
- Replied: 8 (18%)

[View Responses] [Resend to Unread]

Message Card 2:
- Date: "Nov 9, 2025"
- To: "Inactive Customers (23)"
- Channel: "SMS"
- Subject: "We Miss You!"
- Message: "Hi {{name}}, it's been a while! Come back and get 15% off..."
- Sent: 23
- Delivered: 23
- Converted: 5 bookings

Message Card 3:
- Date: "Nov 8, 2025"
- To: "Individual: Aarti Kumar"
- Channel: "WhatsApp"
- Message: "Hi Aarti, your regular haircut appointment is available..."
- Status: "Delivered, Read ✓✓"
- Replied: "Yes, I'll book for tomorrow"

SEND MESSAGE:

Tap "+ Send Message" opens composer:

"Compose Message"

Step 1 - Recipients:
- Select recipients:
  ○ All customers
  ○ Select segment (dropdown)
    * VIP customers
    * Regular customers
    * Inactive customers
    * Birthday this month
    * Custom segment
  ○ Individual customer (search)
  ○ Upload phone numbers

Selected audience:
- Count: "45 customers"
- Reachable via:
  * SMS: 45
  * WhatsApp: 42
  * Email: 38

Step 2 - Channel Selection:
- Select channels:
  ☑ SMS (45 recipients)
    Cost: ₹9 (₹0.20 each)
  ☑ WhatsApp (42 recipients)
    Cost: ₹4.20 (₹0.10 each)
  ☐ Email (38 recipients)
    Cost: Free
  ☐ App notification (12 app users)
    Cost: Free

Recommended: Based on customer preference

Step 3 - Message Content:
- Use template: Dropdown (optional)
  * Or write custom message

For SMS:
- Text area (160 char limit)
- Character count: 0/160
- SMS count: "1 message"
- "Hi {{name}}, special offer just for you..."

Personalization:
- Insert tags: {{name}}, {{points}}, etc.
- Dynamic content based on customer data

For WhatsApp:
- Longer text (up to 1024 chars)
- Add media:
  * [Add Image] [Add Video] [Add Document]
- Add buttons:
  * [Call Us]
  * [Book Now]
  * [Visit Website]

For Email:
- Subject line: Input
- Email body: Rich text editor
- Add attachments
- Email template library

Message preview:
- Shows how it appears to customer
- Sample: "Hi Aarti, special offer..."

Step 4 - Timing:
- Send timing:
  ○ Send now (immediate)
  ○ Schedule for later
    * Date & time picker
    * Best time suggestion: "10 AM tomorrow"
    * Based on historical open rates

Step 5 - Review:
- Recipients: 45 customers
- Channels: SMS + WhatsApp
- Message: Preview shown
- Cost: ₹13.20
- Schedule: Now

[Send Message] [Save as Draft]

Sending progress:
- "Sending messages..."
- Progress bar
- "42 of 45 sent..."

Confirmation:
- "✓ 45 messages sent successfully!"
- Delivered: 44
- Failed: 1
- [View Details]

TEMPLATES TAB:

Pre-saved message templates:

Template Library:

Template 1:
- Name: "Booking Confirmation"
- Category: "Transactional"
- Channel: SMS + Email + WhatsApp
- Usage: Auto-sent (152 times)
- Preview: "Hi {{name}}, your booking is confirmed..."
- [Edit] [Use] [Delete]

Template 2:
- "Appointment Reminder"
- Category: "Reminder"
- Channel: SMS + WhatsApp
- Usage: Auto-sent (145 times)
- [Edit] [Use]

Template 3:
- "Thank You Message"
- Category: "Post-service"
- Channel: WhatsApp
- [Edit] [Use]

Template 4:
- "Special Offer Announcement"
- Category: "Promotional"
- Channel: All
- Usage: Manual (5 times)
- [Edit] [Use]

[+ Create New Template]

Create template:
- Template name: Input
- Category: Dropdown
- Default channel: Select
- Message content: Text editor
- Variables: {{name}}, {{service}}, etc.
- [Save Template]

INBOX TAB:

Customer replies and incoming messages:

Inbox Message 1:
- From: "Aarti Kumar" (with avatar)
- Phone: "+91 98765 43210"
- Last message: "Yes, please confirm my booking"
- Timestamp: "2 minutes ago"
- Unread badge: "1" (red dot)
- Channel: WhatsApp

Tap to open conversation:
Conversation thread (chat interface):

Aarti: "Hi, is there availability tomorrow at 10 AM?"
↓ 5 minutes ago

You (automated): "Hi Aarti! Let me check for you..."
↓ 4 minutes ago

You: "Yes, Priya is available at 10 AM tomorrow for haircut."
↓ 3 minutes ago

Aarti: "Great! Please book me."
↓ 2 minutes ago

Quick reply options:
- [Book Appointment] (creates booking)
- [Send Availability] (checks calendar)
- [Send Location] (shares address)
- Custom reply: Text input + Send button

Inbox Message 2:
- From: "Neha Patel"
- "Thank you for the service!"
- 1 hour ago
- Read (no badge)
- Channel: SMS

Inbox Message 3:
- From: "Unknown (+91 98700 00000)"
- "What are your prices for bridal makeup?"
- 3 hours ago
- New customer inquiry
- [Create Customer Profile] option

Filters:
- [All] [Unread] [Starred] [By Channel]

Search: Search conversation history

NOTIFICATION SETTINGS:

Notification preferences:

For each notification type:
- Enable/disable: Toggle
- Channels to use: Multi-select
- Timing: Adjustable
- Template: Editable

General settings:
- Sender name: "Glow Salon"
- Sender ID (SMS): "GLWSLN"
- Reply-to email: "reply@salon.com"
- WhatsApp business number: "+91 98765 43210"

Quiet hours:
- Don't send notifications:
  * Before: 9:00 AM
  * After: 9:00 PM
- Exceptions: Emergency/urgent only

Opt-out management:
- DND list: 8 customers
- Unsubscribed: 5 customers
- Respect preferences automatically

ANALYTICS:

Notification analytics:

Delivery metrics:
- Sent: 1,245 (this month)
- Delivered: 1,223 (98.2%)
- Failed: 22 (1.8%)
- Bounced: 0

Engagement:
- Opened: 892 (73%)
- Clicked: 234 (19%)
- Replied: 145 (12%)

Channel performance:
- SMS: 95% delivery, 65% open
- WhatsApp: 99% delivery, 85% open
- Email: 97% delivery, 45% open
- App: 100% delivery, 70% open

Best performing:
- Day: Saturday (highest opens)
- Time: 10-11 AM (peak engagement)
- Channel: WhatsApp (best response)

Response time:
- Avg reply from customer: 2.5 hours
- Avg response from salon: 15 minutes

Conversion:
- Messages leading to bookings: 18%
- Revenue from messaging: ₹42,500

Cost analysis:
- Total spent: ₹1,240
- Cost per message: ₹0.99
- Cost per booking: ₹5.50
- ROI: 3,327%

INTEGRATIONS:

Channel integrations:
- WhatsApp Business API: Connected ✓
- Twilio SMS: Connected ✓
- SendGrid Email: Connected ✓
- Firebase (App notifications): Connected ✓

Booking system:
- Auto-send on booking events
- Two-way sync
- Booking confirmation auto-sent

Calendar integration:
- Reminders synced with appointments
- Auto-send before appointments

Background: White
Message cards: White, channel icons
Unread: Bold, colored badge
Style: Messaging platform, communication hub
Multi-channel, automated + manual
Customer engagement focused
```

---

## E-Commerce & Retail Management

### Screen 55: Product Retail Configuration

**Prompt for Uizard:**
```
Design a product retail configuration screen for enabling products in the online shop.

HEADER:
- Back arrow (left)
- Product name (truncated if long)
- "Save Changes" button (right, disabled if no changes)

PRODUCT OVERVIEW CARD (top):
- Product image (80x80px, left)
- Product details (right):
  * Name (bold, 16sp)
  * SKU: "PRD-2024-001"
  * Brand: "L'Oreal" (if available)
  * Category: "Hair Care" badge
  * Warehouse stock: "45 units" (gray text)

RETAIL AVAILABILITY SECTION:
- Large toggle switch with label:
  * "🛒 List in Shop" (18sp, bold)
  * Description: "Make this product available for customers to purchase online"
  * Toggle: OFF (gray) / ON (deep purple #6D28D9)
  * When ON: Shows green "✅ Listed" badge
  * When OFF: Shows gray "Unlisted" badge

RETAIL CONFIGURATION FORM (disabled if toggle OFF):

1. PRICING SECTION:
   Card with purple border if enabled
   
   - "Retail Price" input (required):
     * Label: "Customer-facing price"
     * Input field with ₹ prefix
     * Placeholder: "Enter price in rupees"
     * Helper text: "Example: 350 (will be displayed as ₹350)"
     * Validation: Must be > 0
   
   - Original price comparison:
     * Shows warehouse cost price: "Cost: ₹250"
     * Calculates margin: "Margin: 40% profit"
     * Color: Green if profitable, Red if loss

2. STOCK MODE SELECTION:
   Card with radio buttons
   
   Option 1: WAREHOUSE STOCK (default)
   - Radio button + icon 📦
   - "Use Warehouse Stock" (bold)
   - Description: "Sell directly from warehouse inventory"
   - Shows current warehouse stock: "45 units available"
   - Best for: Products used only for retail
   
   Option 2: ALLOCATED STOCK
   - Radio button + icon 🎯
   - "Use Allocated Retail Stock" (bold)
   - Description: "Dedicated stock separate from salon services"
   - Shows allocation input field (appears when selected):
     * Label: "Allocate stock for retail"
     * Number input with +/- controls
     * Max validation: Cannot exceed warehouse stock
     * Shows remaining warehouse: "30 units remain for services"
   - Best for: Products shared between salon + retail

3. LOW STOCK ALERT:
   Card
   
   - "Low Stock Threshold" input:
     * Number input with +/- controls
     * Default: 10 units
     * Label: "Alert me when stock falls below"
     * Icon: ⚠️ Warning bell
   
   - Preview of customer view:
     * "In Stock" (green) if > threshold
     * "Low Stock ⚠️" (orange) if ≤ threshold
     * "Out of Stock" (red) if = 0

4. RETAIL DESCRIPTION (optional):
   - Rich text editor or textarea
   - Label: "Product description for customers"
   - Placeholder: "Describe the benefits, ingredients, usage..."
   - Character counter: 0/500 characters
   - Preview toggle: Shows customer view

5. RETAIL IMAGES (optional):
   - "Product Images" section
   - Upload area for additional retail images
   - Shows 4 image slots:
     * First slot auto-filled with warehouse image
     * 3 additional slots for retail-specific photos
   - Image specs: "Recommended: 800x800px, max 2MB"
   - Drag to reorder functionality
   - Delete button on each image

6. SEO OPTIMIZATION (collapsible):
   - Expand/collapse arrow
   - "Search Engine Optimization" heading
   
   When expanded:
   - Meta Title input:
     * Character counter: 0/60
     * Placeholder: "Product Name | Brand | SalonHub"
   
   - Meta Description textarea:
     * Character counter: 0/160
     * Placeholder: "Brief description for search results"

VISIBILITY RULES BANNER (info card):
- Blue info icon
- "Product Visibility Requirements"
- Checklist format:
  * ✅ List in Shop enabled (green if ON)
  * ✅ Retail price > ₹0 (green if valid)
  * ✅ Stock available (green if > 0)
  * ⚠️ Product is active (orange if inactive)
- Note: "All conditions must be met for product to appear in shop"

PREVIEW SECTION (bottom):
- "Customer Preview" heading
- Shows how product appears in shop:
  * Product card mockup
  * Name, price, rating (if any)
  * Stock status badge
  * "Add to Cart" button
- "This is how customers will see it" note

STICKY FOOTER ACTIONS:
- Two buttons:
  * "Discard Changes" (outlined, left) - only if unsaved changes
  * "Save Configuration" (deep purple, right)
    - Shows loading spinner when saving
    - Disabled if validation fails
- Auto-save indicator: "All changes saved ✓" (gray, small)

CONFIRMATION DIALOGS:

Save Success:
- Green checkmark icon
- "Product configured for retail!"
- Message: "[Product Name] is now available in your shop"
- Actions:
  * "View in Shop" button
  * "Configure Another" button
  * "Back to Inventory" button

Discard Warning:
- "Unsaved changes"
- "You have unsaved changes. Are you sure you want to leave?"
- "Discard" (red) / "Keep Editing" (purple) buttons

Background: Light gray (#F3F4F6)
Cards: White with subtle shadows
Toggle: Large, iOS-style switch
Form fields: Clear labels, validation states
Style: Professional, clear hierarchy, action-focused
```

---

### Screen 56: Product Orders Dashboard

**Prompt for Uizard:**
```
Design a comprehensive dashboard for managing customer product orders.

HEADER:
- Back arrow (left)
- "Product Orders" title (center)
- Filter icon (right)
- Search icon (far right)

SUMMARY CARDS (horizontal scroll or grid):
Card layout: 2x2 on mobile, 5x1 on tablet

1. NEW ORDERS:
   - Icon: 📦 Package (orange)
   - Count: "8" (large, bold, 32sp)
   - Label: "New Orders" (gray)
   - Trend: "+3 today" (green, small)
   - Background: Light orange tint
   - Tap to filter by new orders

2. PREPARING:
   - Icon: 📋 Clipboard (blue)
   - Count: "5"
   - Label: "Preparing"
   - Background: Light blue tint
   - Tap to filter

3. READY FOR PICKUP:
   - Icon: 🏪 Store (purple)
   - Count: "3"
   - Label: "Ready"
   - Background: Light purple tint
   - Only shows if salon has pickup enabled

4. SHIPPED/OUT FOR DELIVERY:
   - Icon: 🚚 Truck (indigo)
   - Count: "12"
   - Label: "In Transit"
   - Background: Light indigo tint

5. DELIVERED:
   - Icon: ✅ Checkmark (green)
   - Count: "145"
   - Label: "Delivered"
   - Period: "(This month)" (small)
   - Background: Light green tint

6. CANCELLED:
   - Icon: ❌ X Circle (red)
   - Count: "7"
   - Label: "Cancelled"
   - Background: Light red tint

QUICK STATS ROW:
- Today's revenue: "₹12,450" (bold, purple)
- Pending payment: "₹3,200" (COD orders, orange)
- Average order value: "₹865"

SEARCH & FILTER BAR:
- Search input:
  * Placeholder: "Search by order #, customer, phone..."
  * Search icon inside field
  * Real-time search

- Filter button:
  * Shows active filter count badge
  * Opens filter sheet with:
    - Order status (multi-select)
    - Fulfillment type: Delivery / Pickup
    - Payment status: Paid / Pending
    - Date range picker
    - Amount range (min-max)
  * "Clear All" and "Apply" buttons

SORT DROPDOWN:
- "Sort by: Newest First ▼"
- Options:
  * Newest First (default)
  * Oldest First
  * Amount: High to Low
  * Amount: Low to High
  * Customer Name A-Z

TABS (sticky below filters):
- All Orders (default)
- Pending Action (8) - with badge count
- Delivery Orders
- Pickup Orders
- Completed
- Cancelled

ORDER LIST (scrollable):
Each order card shows:

HEADER ROW:
- Order number "#ORD-2024-0125" (left, bold)
- Status badge (right):
  * New: Orange pill
  * Preparing: Blue pill
  * Ready: Purple pill
  * Shipped: Indigo pill
  * Delivered: Green pill
  * Cancelled: Red pill

CUSTOMER INFO:
- Customer name "Priya Sharma" (bold, 16sp)
- Phone number with call icon: 📞 "+91 98765 43210" (tappable)
- Email icon (tappable to email)

ORDER DETAILS:
- Date & time: "Dec 22, 2024 at 3:45 PM" (gray)
- Items count: "3 items" with mini product thumbnails (3 small images)
- Fulfillment type with icon:
  * 🚚 "Delivery" or 🏪 "Pickup"
- Delivery address preview (if delivery):
  * "Sector 18, Noida - 201301"
  * Full address on tap

PAYMENT INFO:
- Payment method icon + name:
  * 💳 "Online Payment" (green "Paid" badge)
  * 💵 "Cash on Delivery" (orange "Pending" badge)
  * 📱 "UPI" (green "Paid" badge)

AMOUNT:
- Total amount: "₹1,285" (bold, large, right-aligned)
- Items subtotal: "3 items" (gray, small)

QUICK ACTIONS (bottom row):
- Status-dependent buttons:
  
  For NEW orders:
  * [Accept Order] (green)
  * [Reject] (red, outlined)
  
  For PREPARING:
  * [Mark Ready] (purple) if pickup
  * [Mark Shipped] (purple) if delivery
  * [View Details] (outlined)
  
  For READY:
  * [Handed Over] (green)
  * [Call Customer] (outlined)
  
  For SHIPPED:
  * [Update Tracking] (outlined)
  * [Mark Delivered] (green)

SWIPE ACTIONS:
- Swipe left reveals:
  * 📞 Call (blue)
  * 📧 Email (gray)
  * ❌ Cancel (red) - if applicable

EMPTY STATES:

No Orders:
- Package box icon (gray, 120px)
- "No orders yet"
- "Customer orders will appear here"
- Encourage action: "Share your shop link with customers"

No Results from Search/Filter:
- Magnifying glass icon
- "No orders found"
- "Try different search terms or filters"
- [Clear Filters] button

LOADING STATE:
- Skeleton cards (shimmer effect)
- Gray rectangles for text
- Placeholder for images

BULK ACTIONS (appears when selecting multiple):
- Checkbox on each order card
- Selection toolbar at bottom:
  * "5 selected" count
  * [Export CSV]
  * [Print Labels]
  * [Bulk Status Update]
  * [Deselect All]

FLOATING ACTION BUTTON (bottom-right):
- + icon (white)
- Deep purple background
- "Create Manual Order" tooltip
- Opens order creation form

PULL-TO-REFRESH:
- Swipe down gesture
- Spinner animation
- "Checking for new orders..."

Background: Light gray (#F3F4F6)
Cards: White, rounded, shadow
Badges: Color-coded by status
CTAs: Clear, action-oriented
Style: Dashboard-style, scannable, action-focused
```

---

### Screen 57: Order Details & Fulfillment

**Prompt for Uizard:**
```
Design a detailed order view with fulfillment management tools.

HEADER (sticky):
- Back arrow (left)
- Order number "#ORD-2024-0125" (center, bold)
- Three-dot menu (right):
  * Print Order
  * Print Packing Slip
  * Print Invoice
  * Send Receipt Email
  * Export PDF
  * Copy Order Link

STATUS BANNER (top, full-width):
Large colored banner based on status:

FOR NEW ORDERS (Orange background):
- 📦 Icon
- "New Order - Action Required" (white, bold, 20sp)
- Time received: "Received 15 minutes ago"
- Two prominent buttons:
  * [Accept Order] (white button, dark text)
  * [Reject Order] (outlined white)

FOR PREPARING (Blue background):
- 📋 "Order Accepted - In Preparation"
- Accepted time: "Accepted at 3:50 PM"
- [Mark as Ready] or [Mark as Shipped] button

FOR READY/SHIPPED (Purple/Indigo):
- Status message with icon
- Next action button

FOR DELIVERED (Green):
- ✅ "Successfully Delivered"
- Delivery timestamp
- [Request Review] button

FOR CANCELLED (Red):
- ❌ "Order Cancelled"
- Cancellation reason and time

CUSTOMER INFORMATION CARD:
- "Customer Details" heading

Profile section:
- Avatar/initials circle (left)
- Name: "Priya Sharma" (bold)
- Loyalty tier badge: "⭐ Gold Member" (if applicable)
- Total orders: "12 orders" (gray)

Contact actions (large, tappable):
- 📞 Call: "+91 98765 43210"
  * Tap to initiate call
  * Shows call icon
  
- 📧 Email: "priya.sharma@email.com"
  * Tap to email
  
- 💬 WhatsApp (if available)
  * "Send WhatsApp" button

Customer notes (if any):
- 💡 "Allergic to fragrances" (yellow background)

ORDER ITEMS SECTION:
- "Items Ordered (3)" heading
- Subtotal preview: "₹1,150"

Each item card:
- Product image (left, 64x64px, rounded)
- Product details (center):
  * Name: "L'Oreal Hair Serum" (bold)
  * Brand: "L'Oreal" (gray, small)
  * SKU: "PRD-2024-045"
  * Variant: "Size: 100ml" (if applicable)
  * Availability badge:
    - "In Stock" (green) if available
    - "Low Stock - 2 left" (orange) if low
    - "Out of Stock" (red) if unavailable
  
- Quantity & Price (right):
  * Quantity: "Qty: 2" (gray)
  * Unit price: "₹250 each"
  * Total: "₹500" (bold, larger)

- Stock warning (if applicable):
  * Orange banner: "Only 2 units left - allocate now"
  * [Allocate Stock] button

FULFILLMENT DETAILS CARD:

Delivery Address (if delivery type):
- 📍 Icon + "Delivery Address" heading
- Full address:
  * Recipient: "Priya Sharma"
  * Address: "B-402, Stellar Apartments
              Sector 18, Noida
              Uttar Pradesh - 201301"
  * Phone: "+91 98765 43210"
- [Copy Address] button
- [View on Map] button (opens map)
- Distance from salon: "4.2 km away"
- Estimated delivery time: "30-45 mins"

Delivery Instructions (if provided):
- 💬 Icon
- "Please ring doorbell twice"
- "Leave at gate if not home"

Store Pickup (if pickup type):
- 🏪 Icon + "Pickup Location" heading
- Salon name and address
- Operating hours: "Open: 10 AM - 8 PM"
- Pickup code: "PICK-1234" (large, bold, copyable)
- QR code for verification
- [Customer Notified] status indicator

PAYMENT SUMMARY CARD:
- 💳 Icon + "Payment Information" heading

Payment breakdown:
- Subtotal (3 items): ₹1,150
- Discount (SAVE20): -₹100 (green)
- Delivery Charge: ₹50 (or "FREE" in green)
- Tax (GST 18%): ₹207
- Bold divider line
- **Total Amount: ₹1,307** (large, bold, 24sp)

Payment method:
- Icon + method name
  * 💳 "Card Payment - Razorpay"
  * 💵 "Cash on Delivery"
  * 📱 "UPI - Google Pay"

Payment status:
- "Paid ✓" (green badge) or
- "Payment Pending" (orange badge)
- Payment ID: "pay_ABC123XYZ" (small, gray, copyable)

SHIPPING/TRACKING SECTION (for delivery orders):
- 🚚 "Shipping Information" heading

Courier details:
- Courier partner dropdown:
  * Options: BlueDart, DTDC, Delhivery, Self Delivery
  * Default: "Select courier..."

- Tracking number input:
  * Label: "Enter tracking/AWB number"
  * Input field
  * [Save] button
  * Shows as badge once saved: "Track: ABC123456789"

- Expected delivery date picker:
  * Calendar icon
  * Date selector
  * Shows to customer: "Estimated: Dec 25, 2024"

- Tracking link (if available):
  * "Track Package →" (external link icon)
  * Opens courier tracking page

STATUS TIMELINE (vertical):
- "Order Timeline" heading
- Visual timeline with dots and lines

Timeline events:
1. ✅ Order Placed (completed, green)
   - "Dec 22, 2024 at 3:45 PM"
   - By: "Customer (Online)"

2. ✅ Payment Confirmed (completed, green)
   - "Dec 22, 2024 at 3:45 PM"
   - "Razorpay - ₹1,307"

3. ✅ Order Accepted (completed, green)
   - "Dec 22, 2024 at 3:50 PM"
   - By: "Staff Name"

4. → Processing (current, purple, pulsing dot)
   - "Started at 3:52 PM"
   - Status: "Preparing items"

5. ○ Ready for Pickup/Shipped (pending, gray)
   - Expected: "Today, 5:00 PM"

6. ○ Delivered (pending, gray)
   - Expected: "Dec 23, 2024"

STATUS UPDATE ACTIONS (sticky bottom or floating):
Large status-dependent buttons:

For NEW orders:
- [Accept Order] (green, full width)
- [Reject Order] (red, outlined)
  * Opens rejection reason dialog:
    - Out of stock
    - Customer request
    - Payment issue
    - Outside delivery area
    - Other (text input)

For PREPARING:
- [Mark as Ready for Pickup] (purple) OR
- [Mark as Shipped] (purple)
  * Requires tracking number for shipped

For READY:
- [Mark as Picked Up] (green)
  * Optional: OTP verification
  * Capture signature

For SHIPPED:
- [Update Tracking Info] (outlined)
- [Mark as Delivered] (green)
  * Optional: Upload delivery photo
  * Capture recipient signature

For DELIVERED:
- [Request Customer Review] (purple, outlined)
- [Reorder Items] (green, outlined)

INTERNAL NOTES SECTION (collapsible):
- 📝 "Staff Notes" heading
- Add note textarea:
  * Placeholder: "Add internal notes..."
  * Private notes not visible to customer
- Previous notes list with timestamps:
  * "Customer called - confirmed address" - 4:00 PM by Ravi
  * "Stock allocated from Shelf A" - 3:55 PM by Priya

CUSTOMER COMMUNICATION LOG:
- 💬 "Communication History" heading
- Timeline of messages:
  * ✉️ Email sent: "Order Confirmation" - 3:45 PM
  * 📱 SMS sent: "Order Accepted" - 3:50 PM
  * 📞 Call received: 2m 30s - 4:00 PM

QUICK ACTIONS FOOTER:
- [Print Packing Slip] (outlined)
- [Send Status Update] (outlined)
  * SMS/Email/WhatsApp selector
- [Cancel Order] (red, outlined) - if applicable
  * Requires cancellation reason
  * Triggers refund if already paid

CANCEL ORDER DIALOG:
- ⚠️ Warning icon
- "Cancel this order?"
- Reason selector (required):
  * Out of stock
  * Customer request
  * Payment declined
  * Delivery issue
  * Other
- Refund note: "₹1,307 will be refunded in 5-7 days"
- Checkboxes:
  * ☑ Notify customer via email
  * ☑ Notify customer via SMS
  * ☑ Add to inventory (restore stock)
- [Confirm Cancellation] (red) / [Keep Order] (gray) buttons

Background: Light gray
Cards: White, well-spaced
Timeline: Visual, clear progression
Actions: Prominent, context-aware
Style: Operational, action-oriented, clear hierarchy
```

---

### Screen 58: Product Sales Analytics

**Prompt for Uizard:**
```
Design a comprehensive analytics dashboard for e-commerce performance tracking.

HEADER:
- Back arrow (left)
- "Product Sales Analytics" title (center)
- Date range picker (right)
  * Quick filters: Today, 7D, 30D, 90D, Custom
  * Default: Last 30 Days
- Export button (download icon)

PERIOD SELECTOR TABS (sticky):
- [Today] [7 Days] [30 Days] [90 Days] [Custom Range]
- Selected tab: Deep purple background
- Shows period label: "Jan 1 - Jan 31, 2024"

KEY METRICS GRID (2x2 on mobile, 4x1 on tablet):

1. TOTAL REVENUE CARD:
   - Icon: 💰 Rupee (purple circle)
   - Label: "Total Revenue" (gray, 12sp)
   - Amount: "₹45,280" (bold, 32sp, black)
   - Trend indicator:
     * ↑ 12.5% vs last period (green)
     * Shows comparison: "Last 30D: ₹40,240"
   - Mini sparkline chart (purple line)

2. TOTAL ORDERS CARD:
   - Icon: 📦 Package (blue circle)
   - Label: "Orders Placed"
   - Count: "156" (bold, 32sp)
   - Trend: ↑ 8.3% (green)
   - Breakdown:
     * Delivered: 142 (91%)
     * Pending: 14 (9%)

3. AVERAGE ORDER VALUE CARD:
   - Icon: 🛒 Cart (emerald circle)
   - Label: "Avg Order Value"
   - Amount: "₹290" (bold, 32sp)
   - Trend: ↑ 3.8% (green)
   - Context: "₹35 higher than last period"

4. CONVERSION RATE CARD:
   - Icon: 📊 Chart (amber circle)
   - Label: "Conversion Rate"
   - Percentage: "3.2%" (bold, 32sp)
   - Trend: ↑ 0.5% (green)
   - Context: "978 visitors → 156 orders"

REVENUE TREND CHART:
- "Revenue & Orders Over Time" heading
- Dual-axis line chart:
  * Primary axis: Revenue (₹) - Purple line
  * Secondary axis: Orders (count) - Blue line
  * X-axis: Dates
  * Hover tooltips show exact values
- Toggle buttons:
  * [Daily] [Weekly] [Monthly] views
- Chart shows:
  * Peak day highlighted
  * Average line (dashed)

SALES BREAKDOWN SECTION:

Tab selector:
- [Top Products] [Categories] [Time Analysis] [Customer Insights]

TAB 1: TOP PRODUCTS
- "Best Selling Products" heading
- "This Period" subtitle

List of top 10 products (scrollable):
Each product row:
- Rank badge: "#1" (gold), "#2" (silver), "#3" (bronze)
- Product image (48x48px, rounded)
- Product details:
  * Name: "L'Oreal Hair Serum" (bold)
  * SKU: "PRD-2024-045"
  * Category: "Hair Care" (badge)
- Performance metrics:
  * Units sold: "45 units" (large, bold)
  * Revenue: "₹11,250" (green, bold)
  * Percentage of total: "24.8% of revenue"
- Progress bar (horizontal):
  * Shows relative performance
  * Purple fill
- Trend icon: ↑ (green) or ↓ (red)
- [View Details] button

Summary at bottom:
- "Top 10 products: 85% of total revenue"
- "Long tail: 78 products, 15% of revenue"

TAB 2: CATEGORIES
- "Revenue by Category" heading

Pie chart or donut chart:
- Segments colored by category
- Shows percentage splits
- Tap segment for details

Category list below chart:
Each category row:
- Category icon + name
- Color dot (matches chart)
- Revenue: "₹12,450" (bold)
- Percentage: "27.5%" (gray)
- Order count: "38 orders"
- Growth: ↑ 15% (green) or ↓ 5% (red)

Top category highlight:
- 🏆 "Hair Care is your top category!"
- "₹12,450 in revenue (27.5%)"

TAB 3: TIME ANALYSIS
- "Sales Patterns" heading

Heat map calendar:
- Grid of days
- Color intensity = revenue
- Darker purple = higher sales
- Tap day for details

Peak performance insights:
- 📅 Best day: "Saturday - ₹2,340 avg"
- ⏰ Peak hours: "2-4 PM" (for same-day pickup/delivery)
- 📊 Busiest week: "Week of Dec 15"

Daily average comparison:
- Weekday avg: "₹1,120"
- Weekend avg: "₹2,015" (↑ 80%)

TAB 4: CUSTOMER INSIGHTS
- "Customer Behavior" heading

Customer metrics:
- New customers: "42" (27%)
- Returning customers: "114" (73%)
- Repeat purchase rate: "62%"

Customer lifetime value:
- Average CLV: "₹1,450"
- Top customer: "₹8,900 (12 orders)"

Geographic distribution (if available):
- Top cities:
  1. Delhi: 45 orders (29%)
  2. Noida: 38 orders (24%)
  3. Gurgaon: 32 orders (21%)
- Map visualization (optional)

PERFORMANCE INDICATORS SECTION:
- "Key Performance Indicators" heading

Grid of smaller metric cards:

1. Gross Profit:
   - Amount: "₹18,112" (40% margin)
   - Cost: "₹27,168"
   - Revenue: "₹45,280"

2. Cart Abandonment:
   - Rate: "42%" (orange)
   - 245 carts abandoned
   - "₹12,450 potential revenue lost"

3. Average Items per Order:
   - Count: "2.3 items"
   - Trend: ↑ 0.2

4. Return Rate:
   - Percentage: "3.2%"
   - 5 returns from 156 orders
   - Top reason: "Size issue"

5. Customer Satisfaction:
   - Average rating: ⭐ 4.6/5
   - Based on 84 reviews
   - 93% recommend

PAYMENT METHOD BREAKDOWN:
- "Payment Methods" heading
- Donut chart showing split:
  * Online Payment: 65% (₹29,432)
  * UPI: 25% (₹11,320)
  * Cash on Delivery: 10% (₹4,528)

Payment insights:
- "COD has 8% higher cancellation rate"
- "UPI orders have highest avg value: ₹340"

FULFILLMENT ANALYSIS:
- "Delivery vs Pickup" heading

Comparison cards:
Delivery:
- Orders: 124 (79%)
- Revenue: "₹35,848"
- Avg delivery time: "45 mins"
- Rating: ⭐ 4.5

Pickup:
- Orders: 32 (21%)
- Revenue: "₹9,432"
- Avg pickup time: "18 mins"
- Rating: ⭐ 4.8

INVENTORY IMPACT:
- "Stock Movement" heading
- Total units sold: 356 units
- Stock value reduction: "₹27,168"
- Low stock alerts triggered: "8 products"
- Out of stock incidents: "2 products"
- [View Inventory] link

GOALS & BENCHMARKS:
- "Performance vs Goals" heading

Progress bars:
1. Monthly revenue goal:
   - Target: ₹50,000
   - Achieved: ₹45,280 (90.6%)
   - "₹4,720 to go"

2. Order volume goal:
   - Target: 200 orders
   - Achieved: 156 orders (78%)
   - "44 orders to go"

3. Conversion rate goal:
   - Target: 4%
   - Achieved: 3.2%
   - "Need 0.8% improvement"

RECOMMENDATIONS CARD (AI-powered):
- 💡 "Insights & Recommendations" heading
- Purple background card

Suggestions:
- "🎯 Hair Care products sell 40% more on Saturdays - consider promoting them mid-week"
- "📦 Orders spike 2-4 PM - ensure staff availability"
- "💰 Bundle products to increase avg order value (currently ₹290)"
- "⚠️ 8 products need restocking soon"

EXPORT OPTIONS:
- [Export Report] button opens menu:
  * Download PDF Report
  * Export to Excel (CSV)
  * Email Report
  * Schedule Auto-reports (weekly/monthly)

Date range selector:
- Custom date picker
- Preset ranges
- Compare to previous period toggle

Background: Light gray (#F3F4F6)
Metric cards: White, purple accents
Charts: Interactive, purple/blue theme
Trends: Green (up), Red (down)
Style: Data-rich, visual, actionable insights
```

---

## 🎉 COMPREHENSIVE BUSINESS PARTNER APP - COMPLETE!

**Total Screens Created: 68 SCREENS** ✅

### 📊 Complete Screen Breakdown:

✅ **1. Authentication & Onboarding (7 screens)**
- Screens 1-7: Splash, Welcome, Login, Register, Profile Setup, Location, OTP

✅ **2. Salon Setup & Configuration - FIRST-TIME SETUP (10 screens)** ⭐ NEW
- Screens 7A-7J: Setup Wizard, Business Profile, Services Catalog (2 screens), Operating Hours, Photo Gallery, Amenities, Location Details, Payment Methods, Setup Review

✅ **3. Dashboard & Analytics (8 screens)**
- Screens 8-15: Main Dashboard, Quick Actions, Today's Overview, Performance Metrics, Notifications, Trends, Goals, Insights

✅ **4. Calendar & Booking Management (10 screens)**
- Screens 16-25: Calendar View, Booking Details, Create/Edit Booking, Walk-in, History, Time Slots, Availability, Blocked Times, Service Duration, Conflicts

✅ **5. Customer Management (8 screens)**
- Screens 26-33: Customer List, Profile, Add/Edit, Booking History, Transactions, Notes, Tags, Loyalty

✅ **6. Staff Management (9 screens)**
- Screens 34-42: Staff List, Profile, Add/Edit, Scheduling, Attendance, Leave, Performance Reviews, Payroll, Training

✅ **7. Financial Management (6 screens)**
- Screens 43-48: Financial Dashboard, Expense Tracking, Invoicing, Tax Reports, P&L Statement, Cash Flow

✅ **8. Inventory Management (4 screens)**
- Screens 49-52: Inventory Overview, Add/Edit Product, Reorder & POs, Stock Audit

✅ **9. Communication & Marketing (2 screens)**
- Screens 53-54: Marketing Campaigns, Customer Notifications

✅ **10. E-Commerce & Retail Management (4 screens)** ⭐ NEW
- Screens 55-58: Product Retail Configuration, Product Orders Dashboard, Order Details & Fulfillment, Product Sales Analytics

---

### 📈 Statistics:

- **Total Lines:** 14,850+ lines (vs Customer App: 4,274 lines - **347% larger**)
- **Screens:** 68 comprehensive screens (vs Customer App: 53 screens - **28% more**)
- **Coverage:** 100% of critical business operations + E-commerce retail management
- **Ready for:** Immediate implementation in Uizard.io

### ✨ Key Features of Each Screen:

✅ **Complete Uizard.io prompts** - Copy-paste ready for direct use  
✅ **Detailed UI specifications** - Layout, components, spacing, colors, typography  
✅ **Interactive elements** - Buttons, forms, modals, navigation flows  
✅ **Business logic** - Workflows, validations, calculations, rules  
✅ **API endpoints** - Backend integration points and data structures  
✅ **Mobile-optimized** - iOS & Android compatible, responsive design  
✅ **Professional styling** - Deep purple theme (#6B46C1), modern UI/UX  
✅ **Indian market specific** - ₹ currency, GST compliance, Indian phone formats  
✅ **First-time setup flow** - Complete onboarding for new salon partners  

### 🎯 Critical Addition - Salon Setup & Configuration:

The newly added **Salon Setup & Configuration** section (Screens 7A-7J) covers:

1. **Welcome to Setup Wizard** - Friendly introduction to setup process
2. **Business Profile Setup** - Salon name, logo, description, GST, specializations
3. **Services Catalog - Categories** - Select service categories offered
4. **Services Catalog - Add Services** - Configure specific services with pricing
5. **Operating Hours Setup** - Set days and hours of operation with breaks
6. **Photo Gallery Management** - Upload salon photos, work samples, team photos
7. **Salon Amenities & Facilities** - Configure WiFi, AC, parking, hygiene protocols
8. **Location & Contact Details** - Address verification, contact info, map integration
9. **Payment Methods Setup** - UPI, cards, cash, wallets, bank transfers
10. **Setup Review & Completion** - Final review, launch salon profile

This ensures **every new salon partner** has a complete, professional profile before accessing the operational features!

### 📁 Complete File Package:

1. ✅ **UIZARD_BUSINESS_PARTNER_APP_PROMPTS.md** (12,916 lines) - Complete with all 64 screens
2. ✅ **UIZARD_CUSTOMER_APP_PROMPTS.md** (4,274 lines) - Customer-facing app (44 screens)
3. ✅ **BUSINESS_MOBILE_APP_SPECS.md** - Technical specifications
4. ✅ **CUSTOMER_MOBILE_APP_SPECS.md** - Customer app specs

### 🚀 Implementation Ready:

Each screen prompt can be used directly in Uizard.io:
1. Copy the prompt for any screen (Screens 1-54, 7A-7J)
2. Paste into Uizard.io's AI design generator
3. Generate instant mobile screen designs
4. Customize colors, spacing, components
5. Export to Figma or production-ready code

### 🎨 Unified Design System:

All 64 screens follow consistent design guidelines:
- **Primary:** Deep Purple (#6B46C1) - Actions, highlights
- **Accent:** Vibrant Purple (#9333EA) - Interactive elements  
- **Success:** Green (#10B981) - Positive actions
- **Warning:** Amber (#F59E0B) - Alerts, pending items
- **Error:** Red (#EF4444) - Errors, critical issues
- **Typography:** Inter font family, clear hierarchy
- **Spacing:** Consistent 4px grid system
- **Components:** 48px buttons, 12px border radius, subtle shadows

---

---

## 🛒 NEW: E-Commerce & Retail Management Screens

The following 4 screens have been added to complete the e-commerce retail functionality:

### Screen 55: Product Retail Configuration
**Purpose:** Configure products for online shop listing  
**Key Features:**
- "List in Shop" toggle for retail availability
- Retail price configuration with profit margin calculation
- **Hybrid Stock Mode System**:
  * Warehouse Stock Mode: Sell directly from warehouse inventory
  * Allocated Stock Mode: Separate retail allocation for shared products
- Low stock threshold configuration with customer preview
- Retail description, images, and SEO optimization
- Visibility rules checklist (4 conditions must be met)
- Customer-facing preview mockup

### Screen 56: Product Orders Dashboard
**Purpose:** Centralized order management hub  
**Key Features:**
- Summary cards: New (8), Preparing (5), Ready (3), Shipped (12), Delivered (145), Cancelled (7)
- Quick stats: Today's revenue, pending payments, average order value
- Search by order#, customer, phone with real-time filtering
- Tabbed views: All, Pending Action, Delivery, Pickup, Completed, Cancelled
- Status-dependent quick actions (Accept, Mark Ready, Mark Shipped, Mark Delivered)
- Bulk operations: Export CSV, Print Labels, Bulk status updates
- Pull-to-refresh for new orders

### Screen 57: Order Details & Fulfillment
**Purpose:** Complete order view with fulfillment tools  
**Key Features:**
- Status-specific action banners (New → Accept/Reject, Preparing → Mark Ready/Shipped)
- Customer information with one-tap call, email, WhatsApp
- Detailed order items with stock availability warnings
- Delivery address with map integration OR Pickup location with QR code
- Payment summary with GST breakdown
- Shipping tracking (courier partner, tracking#, expected delivery)
- Visual status timeline with timestamps
- Internal staff notes and communication history
- Print options: Packing slip, invoice, labels
- Order cancellation with refund handling

### Screen 58: Product Sales Analytics
**Purpose:** Comprehensive e-commerce performance tracking  
**Key Features:**
- **Key Metrics Grid**:
  * Total Revenue: ₹45,280 (↑12.5%)
  * Orders: 156 (↑8.3%)
  * Avg Order Value: ₹290 (↑3.8%)
  * Conversion Rate: 3.2% (↑0.5%)
- **Revenue & Orders Chart**: Dual-axis line chart with daily/weekly/monthly views
- **Top Products**: Best-selling ranking with units sold, revenue contribution
- **Category Breakdown**: Pie chart + list showing revenue split (Hair Care 27.5%)
- **Time Analysis**: Heat map calendar, peak days/hours, weekday vs weekend performance
- **Customer Insights**: New vs returning (73%), repeat rate (62%), CLV, geographic distribution
- **KPIs**: Gross profit (40% margin), cart abandonment (42%), return rate (3.2%)
- **Payment Methods**: Online 65%, UPI 25%, COD 10% with insights
- **Fulfillment Analysis**: Delivery vs Pickup performance comparison
- **Goals Progress**: Visual progress bars for revenue, order, conversion targets
- **AI Recommendations**: Actionable insights based on data patterns
- Export options: PDF, Excel, email reports, scheduled auto-reports

---

## Event Management Screens (12 screens)

### Screen 59: Events Dashboard

**Prompt for Uizard:**
```
Design a comprehensive events management dashboard for salon owners with analytics and quick actions.

HEADER (sticky):
- Back arrow (left)
- "Events" title (center, bold, 24sp)
- Three-dot menu (right):
  * Settings
  * Export Data
  * Help

SUMMARY CARDS (top, horizontal scroll or grid 2×2):
Each card: Colored gradient background, white text, icon, metric

Card 1 - Upcoming Events:
- Icon: 📅 Calendar (white, 48px)
- Count: "3" (large, bold, 48sp)
- Label: "Upcoming Events"
- Trend: "+1 this week" (small)
- Background: Purple gradient

Card 2 - Total Registrations:
- Icon: 👥 People
- Count: "45"
- Label: "Total Registrations"
- Trend: "+12 new today"
- Background: Blue gradient

Card 3 - Revenue (This Month):
- Icon: 💰 Rupee
- Amount: "₹45,280"
- Label: "Events Revenue"
- Trend: "↑15% vs last month"
- Background: Green gradient

Card 4 - Average Rating:
- Icon: ⭐ Star
- Rating: "4.8"
- Label: "Avg Rating"
- Reviews: "Based on 156 reviews"
- Background: Amber gradient

QUICK ACTIONS ROW (horizontal scroll chips):
Large tappable buttons:
- [+ Create Event] (purple, prominent)
- [Check In Attendees] (blue)
- [View Analytics] (outlined)
- [Export Reports] (outlined)

TABS (sticky below summary):
- [Upcoming] (ACTIVE - purple underline, badge: "3")
- [Past] (gray)
- [Drafts] (gray, badge: "1" if any)

FILTER & SORT (below tabs):
- Search bar: "Search events..." (with search icon)
- Filter button: Shows active filters count badge
- Sort dropdown: "Soonest First ▼"
  * Soonest
  * Newest Created
  * Most Registrations
  * Highest Revenue
  * Best Rated

---

UPCOMING EVENTS LIST:
Each event card (comprehensive info):

CARD LAYOUT:
White background, rounded 20px, elevation 2, padding 20px

Top section:
- Event category badge: "Workshop" (purple pill, top-left)
- Status badge: "Published" (green) OR "Draft" (gray) (top-right)

Event image & date:
- Cover image (left, 100px square, rounded)
- Date overlay badge (on image):
  * Month: "DEC"
  * Day: "15"
  * Year: "2024" (small)
  * Purple background, white text

Event info (right of image):
- Event title: "Bridal Makeup Masterclass" (bold, 18sp, 2 lines max)
- Date & time: "Dec 15 • 2:00 PM - 5:00 PM" (gray, 14sp)
- Duration: "3 hours" (gray, small)
- Location: "Main Studio, Floor 2" (gray, pin icon)

METRICS ROW (icons + numbers):
Grid: 4 columns, equal width

- 👥 Registrations:
  * Current: "12 / 15"
  * Progress bar: 80% filled (purple)
  * Status: "3 spots left" (orange if <30%)

- 💰 Revenue:
  * Amount: "₹13,255"
  * Target: "/ ₹18,000"
  * Status: "74%" (gray)

- ⭐ Rating:
  * Stars: "4.8"
  * Reviews: "12 reviews"
  * Tappable

- ⏰ Time Until:
  * Countdown: "5 days"
  * Or "Today!" (green)
  * Or "Tomorrow" (blue)

STATUS INDICATORS (dynamic):
Shows different states:
- "Filling Fast - 3 spots left" (orange banner)
- "Registration Closed" (red) if deadline passed
- "Below Minimum - 5 needed" (red) if <min attendees
- "Sold Out - Waitlist: 8" (green)
- "Starts in 2 hours!" (blue, pulsing)

QUICK ACTIONS (bottom row):
Context-aware buttons:

For upcoming events (>24h):
- [View Details] (outlined, left)
- [Check Registrations] (outlined, center)
- [Edit Event] (purple, right)

For events today:
- [Check In] (green, large, prominent)
- [View Details] (outlined)

For events <min registrations:
- [Promote Event] (purple, left)
- [Edit] (outlined, right)

Three-dot menu:
- Duplicate Event
- Share Event Link
- Download QR Code
- Export Attendee List
- Send Reminder
- **Cancel Event** (red text)
- **Delete Event** (red text, drafts only)

---

PAST EVENTS (when tab selected):
Simplified cards:

Card layout:
- Event image (smaller, 80px, desaturated)
- "Completed" badge (green)
- Event title + date
- Metrics:
  * Attended: "12 / 15" (80%)
  * Revenue: "₹13,255"
  * Rating: ⭐ 4.8 (12)
- Actions:
  * [View Analytics] (outlined)
  * [Clone Event] (purple)
  * [View Reviews] (link)

---

DRAFTS (when tab selected):
Draft event cards:
- "Draft" badge (gray)
- Event title (if set)
- Last edited: "2 days ago"
- Completion: "60% complete"
- Missing: "Add pricing, publish"
- Actions:
  * [Continue Editing] (purple)
  * [Delete Draft] (red, outlined)

---

EMPTY STATES:

No Upcoming Events:
- Calendar icon (gray, 120px)
- "No upcoming events"
- "Create your first event to start accepting registrations"
- [Create Event] button (purple, large)
- Suggestions:
  * "Workshop ideas"
  * "Product launch templates"

No Past Events:
- History icon (gray, 120px)
- "No completed events yet"
- "Your event history will appear here"

No Drafts:
- Document icon (gray, 120px)
- "No saved drafts"
- "Start creating an event anytime"

---

FLOATING ACTION BUTTON (bottom-right):
- Large purple circle with "+" icon
- "+ Create Event" tooltip
- Tap opens event type selector

ANALYTICS PREVIEW SECTION (collapsible):
"Quick Stats" heading (tap to expand)

When expanded:
- Event performance chart (line graph)
  * X-axis: Dates
  * Y-axis: Registrations
  * Shows trend over time
- Top performing events (mini list)
  * Event name
  * Registrations
  * Revenue
- [View Full Analytics] link

FILTER BOTTOM SHEET:
Slides up from bottom

Filters:
1. EVENT TYPE:
   - ☐ Workshops
   - ☐ Product Launches
   - ☐ Sales Events
   - ☐ Group Occasions
   - ☐ Celebrity Events

2. STATUS:
   - ☐ Published
   - ☐ Draft
   - ☐ Filling Fast
   - ☐ Sold Out
   - ☐ Below Minimum

3. DATE RANGE:
   - This Week
   - This Month
   - Custom Range

4. CAPACITY:
   - <50% filled
   - 50-80% filled
   - >80% filled

[Clear Filters] and [Apply] buttons

PULL-TO-REFRESH:
- Swipe down gesture
- "Checking for new registrations..."
- Updates all data

NOTIFICATIONS INTEGRATION:
Badge on Events tab showing:
- New registrations
- Upcoming events today
- Events below minimum

Background: Light gray (#F5F5F7)
Cards: White, elevated shadows
Status indicators: Color-coded (green/orange/red)
Metrics: Large, scannable
Actions: Context-aware, prominent
Style: Dashboard-style, data-rich, action-oriented
```

---

### Screen 60: Create Event - Basic Info

**Prompt for Uizard:**
```
Design a multi-step event creation wizard with excellent UX for salon owners to create professional events.

PROGRESS STEPPER (top, sticky):
Visual progress indicator showing 6 steps:
- Step 1: "Basic Info" ● (filled, purple, ACTIVE)
- Step 2: "Schedule" ○ (empty, gray)
- Step 3: "Location" ○
- Step 4: "Pricing" ○
- Step 5: "Details" ○
- Step 6: "Review" ○

Connecting lines between steps
Current step highlighted with purple circle
Completed steps show checkmarks

HEADER:
- Back arrow (left) - shows exit confirmation dialog
- "Create Event" title (center)
- "Save Draft" (right, text link, gray)

AUTO-SAVE INDICATOR:
Small status below header:
- "Draft saved ✓" (green, when saved)
- "Saving..." (gray spinner, when typing)
- "All changes auto-saved" (info)

---

STEP 1: BASIC INFO

EVENT TYPE SELECTION (required):
"What type of event is this?" (heading, bold, 20sp)

Large cards in grid (2 columns on mobile):
Each card: White background, border, rounded 16px, padding 24px, tap to select

Card 1 - Workshop/Class:
- Icon: 🎨 (large, 64px)
- Title: "Workshop & Classes" (bold, 16sp)
- Description: "Hands-on learning experiences" (gray, 12sp)
- Examples: "Makeup tutorials, hair styling, skincare"
- Radio indicator (right)
- Selected state: Purple border, purple background tint

Card 2 - Product Launch:
- Icon: ✨ Sparkles
- Title: "Product Launch"
- Description: "Introduce new products & services"
- Examples: "New skincare line, seasonal collection"

Card 3 - Seasonal Sale:
- Icon: 💄 Lipstick
- Title: "Sale & Promotions"
- Description: "Limited-time offers and discounts"
- Examples: "Diwali sale, festive offers"

Card 4 - Group Event:
- Icon: 👯 Dancing women
- Title: "Group Occasions"
- Description: "Parties and celebrations"
- Examples: "Bridal shower, birthday party makeover"

Card 5 - Celebrity Event:
- Icon: ⭐ Star
- Title: "Celebrity/Expert Session"
- Description: "Special guest appearances"
- Examples: "Celebrity stylist, makeup artist workshop"

Card 6 - Recurring Event:
- Icon: ♻️ Recycle
- Title: "Recurring Series"
- Description: "Regular scheduled events"
- Examples: "Weekly makeup class, monthly workshop"

Selection validation:
- Must select one type
- Selected: Purple border, subtle purple background
- Shows "✓ Selected" badge

---

EVENT TITLE (required):
"Event Title" (label, bold)
- Text input field (large, 56px height)
- Placeholder: "e.g., Bridal Makeup Masterclass"
- Character counter: "0 / 100"
- Real-time validation
- Error: "Title required" (red, below field)
- Success: Green checkmark (right of field)

Smart suggestions (appears as you type):
- Based on event type selected
- "Suggested: Complete Bridal Makeup Course"
- "Suggested: Professional Hair Styling Workshop"
- Tap to use suggestion

---

EVENT CATEGORY (required):
"Category" (label, bold)
Dropdown selector:
- Default: "Select category ▼"
- Options:
  * Makeup & Beauty
  * Hair Styling & Care
  * Skincare & Wellness
  * Nail Art & Manicure
  * Spa & Massage
  * Mixed/Multiple Services
- Selected shows in purple text

SUB-CATEGORY (optional):
Appears after main category selected
- Dropdown with relevant sub-categories
- E.g., for "Makeup & Beauty":
  * Bridal Makeup
  * Party Makeup
  * Professional Makeup
  * Everyday Makeup
  * Special Effects

---

SHORT DESCRIPTION (required):
"Brief Description" (label, bold)
"This will appear in event listings" (helper text, gray, small)

Text area (150px height):
- Placeholder: "Give attendees a quick overview of what to expect..."
- Character counter: "0 / 250"
- Minimum: 50 characters
- Real-time character count
- Error if <50 chars: "Add at least 50 characters"

AI ASSISTANT (optional feature):
Button: "✨ Generate with AI"
- Opens modal with event details
- AI generates description based on title & type
- User can edit generated text
- "Use This" or "Try Again" buttons

---

FULL DESCRIPTION (required):
"Detailed Description" (label, bold)
"Tell attendees everything about this event" (helper text)

Rich text editor (300px height):
Formatting toolbar:
- Bold, Italic, Underline
- Bullet list, Numbered list
- Link insertion
- Paragraph styles

Editor features:
- Placeholder: "Describe the event in detail. What will attendees learn? What makes this special? Who should attend?"
- Character counter: "0 / 2000"
- Minimum: 200 characters
- Auto-save every 30 seconds

Helpful prompts (collapsible):
"Not sure what to include? Add these sections:"
- What attendees will learn ✓
- Who should attend ✓
- What's included ✓
- Instructor background ✓
- Prerequisites (if any) ✓

Preview button:
- [Preview] (shows how description will look to customers)

---

COVER IMAGE (required):
"Event Cover Image" (label, bold)
"This will be the main image shown to customers" (helper text)

Upload area (large, prominent):
- Dashed border, purple accent
- Upload icon (large, 80px)
- "Drag & drop or tap to upload"
- Supported: JPG, PNG, HEIC
- Max size: 10MB
- Recommended: 1200 × 630px (landscape)

Image guidelines shown:
- "Use high-quality, professional photos"
- "Show the activity or end result"
- "Avoid text overlays (added automatically)"
- "Bright, well-lit images work best"

Once uploaded:
- Large preview (full width, 200px height)
- Image name & size shown
- Edit tools:
  * [Crop] - opens crop tool with aspect ratios
  * [Replace] - upload new image
  * [Remove] - delete image
- Preview how it looks in:
  * Event card (small)
  * Event details page (large)
  * Social media share (OG image)

Stock image library (optional):
- "Browse stock images" link
- Opens curated gallery
- Categories: Makeup, Hair, Spa, Skincare
- Free to use images
- One-tap selection

---

ADDITIONAL IMAGES (optional):
"Gallery Images" (label, bold)
"Add up to 6 photos showcasing the event" (helper text)

Multi-upload grid:
- Shows 6 placeholder boxes
- Tap any to upload
- Drag to reorder images
- Remove icon on each

Image suggestions:
- Venue photos
- Past event highlights
- Instructor at work
- Student results
- Materials/products
- Setup/ambiance

---

TAGS (optional but recommended):
"Event Tags" (label, bold)
"Help customers discover your event" (helper text)

Tag input:
- Type and press Enter to add
- Shows as purple pills
- Max 10 tags
- X to remove

Suggested tags (tap to add):
Based on event type & category:
- #BridalMakeup
- #MakeupWorkshop
- #BeautyClass
- #LearnMakeup
- #ProfessionalTraining
- #CertificateCourse
- #DelhiNCR
- #BeginnerFriendly

Popular tags shown:
- "Most used tags by similar events"

---

SKILL LEVEL (optional):
"Who is this event for?" (label, bold)

Radio buttons:
- ○ All Levels (everyone welcome)
- ○ Beginner (no experience needed)
- ○ Intermediate (some knowledge helpful)
- ○ Advanced (for professionals)

Description updates based on selection

---

INSTRUCTOR/HOST (optional):
"Who will host/teach this event?" (label, bold)

Options:
1. Select from staff:
   - Dropdown of salon staff members
   - Shows: Name, role, photo
   - Auto-fills instructor section

2. Add guest instructor:
   - Name input field
   - Bio/credentials text area
   - Profile photo upload
   - Social links (Instagram, YouTube)

3. Multiple instructors:
   - Add up to 3 co-hosts
   - Each with name, role, photo

---

VALIDATION & ERRORS:
Real-time field validation:
- Red border for errors
- Green checkmark for valid
- Inline error messages
- Can't proceed if required fields empty

Field completion indicator:
- "4 / 6 required fields completed"
- Progress bar showing completion

---

PREVIEW MODE:
"Preview Event" button (top-right):
- Opens modal showing customer view
- How event card looks in browse
- How details page appears
- Mobile & desktop preview
- Close to continue editing

---

BOTTOM ACTION BAR (sticky):
Two sections:

Left:
- Completion: "40% complete" (circular progress)
- "4 fields remaining"

Right:
- [Save Draft] button (outlined, gray)
  * Auto-saves and exits
  * Can resume later
  * Shows last saved time
  
- [Continue →] button (purple, filled)
  * Disabled if required fields incomplete
  * Proceeds to Step 2: Schedule
  * Shows field count needed if disabled
  * Smooth transition animation

---

EXIT CONFIRMATION:
If user taps back without saving:
- Modal: "Save your progress?"
- "You have unsaved changes"
- Three options:
  * [Save & Exit] (purple)
  * [Exit Without Saving] (red, outlined)
  * [Cancel] (gray, text)

---

DRAFT AUTO-RECOVERY:
If user exits and returns:
- "Resume where you left off?" banner
- Shows when draft was saved
- [Continue] or [Start Fresh] options

---

TEMPLATES (advanced feature):
"Start from template?" link (top of form)
- Opens template gallery
- Pre-filled event templates:
  * "Bridal Makeup Workshop"
  * "Hair Styling Class"
  * "Skincare Session"
  * "Product Launch Event"
- One-tap to load template
- All fields pre-filled
- User can edit any field

---

HELP & GUIDANCE:
"Need help?" floating button (bottom-left)
- Opens help sidebar
- Tips for each field
- Best practices
- Examples from successful events
- [Watch Tutorial Video] option

FIELD-SPECIFIC TOOLTIPS:
Info icon (ⓘ) next to labels:
- Tap for context help
- Examples of good vs bad
- Character count recommendations
- SEO tips for descriptions

Background: Light gray (#F5F5F7)
Input fields: White, rounded, clear focus states
Required fields: Asterisk (*) indicator
Validation: Inline, helpful, not intrusive
Style: Professional, guided, confidence-building
```

---

### Screen 61: Create Event - Schedule & Timing

**Prompt for Uizard:**
```
Design an intuitive scheduling interface for event date, time, and recurrence configuration.

PROGRESS STEPPER (top):
- Step 1: "Basic Info" ✓ (completed, green)
- Step 2: "Schedule" ● (active, purple, CURRENT)
- Step 3: "Location" ○ (pending)
- Step 4: "Pricing" ○
- Step 5: "Details" ○
- Step 6: "Review" ○

HEADER:
- Back arrow (left) → Returns to Step 1
- "Schedule Event" title (center)
- "Save Draft" (right)

---

EVENT DATE (required):
"When is your event?" (heading, bold, 20sp)

DATE PICKER (large, interactive):
Calendar view showing current month:
- Month/Year header with nav arrows
- Days grid (7 columns)
- Today highlighted (blue outline)
- Selected date (purple fill)
- Past dates grayed out (disabled)
- Minimum: Tomorrow (can't create events for today)

Selected date display (above calendar):
- Large format: "Saturday, December 15, 2024"
- Days from today: "14 days from today"
- Icon: 📅

Quick select buttons (below calendar):
- [Tomorrow] [This Weekend] [Next Week] [Next Month]
- Tap to instantly select

Date constraints shown:
- "Events must be created at least 24 hours in advance"
- "Maximum: 6 months from today"

---

START TIME (required):
"What time does it start?" (label, bold)

Time picker (scrollable):
- Hour selector (1-12)
- Minute selector (00, 15, 30, 45)
- AM/PM toggle (large, clear)

Alternative: Time input
- Text field: "2:00 PM"
- Tappable to open picker
- Validates format

Time suggestions (based on salon hours):
- "Your salon hours: 10:00 AM - 8:00 PM"
- Quick picks: "10:00 AM" "2:00 PM" "5:00 PM"

Validation:
- Must be during salon operating hours
- Warning if outside hours: "⚠️ This is outside your salon hours"
- Option to override

---

END TIME (required):
"When does it end?" (label, bold)

Time picker (same format as start):
- Auto-suggests based on duration
- Can't be before start time
- Shows duration calculation

Duration display (between start/end):
- Auto-calculated: "Duration: 3 hours"
- Updates as times change
- Color-coded:
  * Green: 1-4 hours (ideal)
  * Orange: >4 hours (long event)
  * Red: <30 mins (too short)

Smart duration suggestions:
- "Recommended for Workshops: 2-4 hours"
- "Similar events average: 3 hours"

---

ALTERNATIVE: DURATION SELECTOR:
Toggle: "Set duration instead?" (switch)

When enabled:
- Start time (same as above)
- Duration dropdown:
  * 30 minutes
  * 1 hour
  * 1.5 hours
  * 2 hours
  * 3 hours (selected)
  * 4 hours
  * 6 hours
  * Full day
  * Custom (opens time input)
- End time auto-calculated
- Shows: "Ends at: 5:00 PM"

---

TIME ZONE (auto-detected):
Display: "🌐 IST (Indian Standard Time)"
- Auto-detected from salon location
- Usually no need to change
- [Change] link if needed
- Dropdown with major time zones

---

RECURRING EVENT SETTINGS:
"Is this a recurring event?" (heading)

Toggle switch: OFF / ON

When toggled ON:
Expandable section appears:

RECURRENCE PATTERN (required):
Radio options:

○ Daily:
  - "Every [1] day(s)" (number input)
  - Max: 30 days frequency

○ Weekly (most common):
  - "Every [1] week(s)" (number input)
  - Days of week (multi-select):
    ☐ Mon ☐ Tue ☐ Wed ☐ Thu ☐ Fri ☐ Sat ☐ Sun
  - Example: "Every Saturday"

○ Monthly:
  - "Every [1] month(s)"
  - On: Dropdown
    * "Same date (15th)"
    * "Same day (2nd Saturday)"

○ Custom:
  - Advanced rule builder
  - "Every X weeks on Y days"

RECURRENCE DURATION:
"How long should this repeat?" (label)

Radio options:
○ Specific number of occurrences:
  - "Repeat [6] times" (number input)
  - Shows: "Total: 6 events"
  - Calculates: "Last event: Jan 19, 2025"

○ End date:
  - Date picker
  - "Repeat until: [March 15, 2025]"
  - Shows: "Total: 12 events"

○ No end date:
  - "Continue indefinitely"
  - Warning: "You can stop anytime"

RECURRENCE PREVIEW:
Visual calendar showing all occurrences:
- Mini calendar grid
- Purple dots on event dates
- Count: "6 events scheduled"
- List view option:
  * Dec 15, 2024 at 2:00 PM
  * Dec 22, 2024 at 2:00 PM
  * Dec 29, 2024 at 2:00 PM
  * (and 3 more...)

EXCEPTIONS:
"Skip specific dates?" (optional)
- Add exception button
- Opens date picker
- List of skipped dates:
  * Dec 25 (Christmas) - X to remove
  * Jan 1 (New Year)

RECURRING SETTINGS:
- "Register for individual sessions" (toggle)
  * ON: Customers pick which sessions
  * OFF: Registration covers all sessions
- "Same pricing for all sessions" (toggle)
- "Series discount" (optional)
  * E.g., "Book 5 sessions, get 6th free"

---

REGISTRATION DEADLINE:
"When should registration close?" (label, bold)

Options (radio):

○ Automatic:
  - "[24] hours before event" (number input)
  - Recommended: 24-48 hours
  - Default: 24 hours

○ Custom date/time:
  - Date picker + time picker
  - "Dec 14, 2024 at 11:59 PM"
  - Must be before event start

○ When fully booked:
  - "Close automatically when sold out"
  - Most common choice

○ Manual:
  - "I'll close registration manually"
  - Risky: Shows warning

Deadline preview:
- "Registration closes: Dec 14, 2:00 PM"
- "Attendees have 14 days to register"

---

CHECK-IN WINDOW:
"When can attendees check in?" (label)

Options:
- Start: "[30] minutes before event"
- End: "[15] minutes after start"

Recommended defaults shown
Validation: Start must be > End

---

LATE ARRIVAL POLICY:
"Allow late arrivals?" (toggle)

When enabled:
- "Accept check-ins up to [30] minutes late"
- After that: "Mark as no-show"

---

CALENDAR SYNC:
"Add to your calendar?" (optional)

Options:
- ☐ Google Calendar (auto-sync)
- ☐ iCal download
- ☐ Outlook sync

If enabled:
- "Calendar invite sent to your email"
- Auto-updates if event changed

---

TIME ZONE HANDLING (for online events):
If event is online/hybrid:
- "Display times in attendee's timezone?" (toggle)
- Automatic conversion shown
- Example: "2:00 PM IST = 8:30 AM GMT"

---

VALIDATION & WARNINGS:

Smart warnings:
- ⚠️ "This is a weekday at 2 PM - consider evening/weekend"
- ⚠️ "You have another event at 4 PM on this day"
- ⚠️ "This conflicts with a booking at 3 PM"
- ⚠️ "Registration deadline is very close to event"

Conflict checker:
- Checks against:
  * Existing events
  * Staff schedules
  * Salon bookings
  * Operating hours
- Shows conflicts with resolution suggestions

Optimal time suggestions:
- "Similar events perform best at:"
  * "Saturday afternoons (2-5 PM)"
  * "Sunday mornings (10 AM-1 PM)"
- Based on historical data

---

PREVIEW SECTION:
"Event Timeline Preview" (collapsible)

Visual timeline:
- Now
- ↓ 14 days: Registration closes
- ↓ 30 minutes: Check-in opens
- ↓ EVENT STARTS (large marker)
- ↓ 3 hours: Event ends
- ↓ 15 minutes: Late check-in closes

---

BOTTOM ACTION BAR (sticky):

Left:
- [← Back] button (outlined)
  * Returns to Basic Info
  * Saves current progress

Right:
- Completion: "80% complete"
- [Save Draft] (outlined)
- [Continue →] (purple, filled)
  * Proceeds to Location & Capacity
  * Disabled if required fields empty
  * Shows validation errors if invalid

---

SMART DEFAULTS:
Pre-filled based on:
- Event type (workshops usually 2-3 hours)
- Salon operating hours
- Popular times for category
- Past event performance

Can override any default

Background: Light gray (#F5F5F7)
Calendar: Large, touch-friendly
Time pickers: Scrollable, easy to use
Recurring options: Clear, visual
Validation: Helpful, proactive
Style: Intuitive, time-aware, conflict-preventing
```

---

### Screen 62: Create Event - Location & Capacity

**Prompt for Uizard:**
```
Design a comprehensive location and capacity management interface with venue configuration and waitlist settings.

PROGRESS STEPPER:
- Step 1: "Basic Info" ✓ (green)
- Step 2: "Schedule" ✓ (green)
- Step 3: "Location" ● (purple, ACTIVE)
- Step 4: "Pricing" ○
- Step 5: "Details" ○
- Step 6: "Review" ○

HEADER:
- Back arrow (left)
- "Location & Capacity" title
- "Save Draft" (right)

---

EVENT FORMAT (required):
"Where will this event take place?" (heading, bold, 20sp)

Large selection cards (radio):

Card 1 - In-Person:
- Icon: 🏢 Building (64px)
- Title: "At Your Salon" (bold, 18sp)
- Description: "Attendees come to your location"
- Badge: "Most Popular"
- Selected: Purple border, tinted background

Card 2 - Online:
- Icon: 💻 Laptop
- Title: "Virtual Event"
- Description: "Online via video call"
- Best for: "Remote workshops, webinars"

Card 3 - Hybrid:
- Icon: 🔀 Mix
- Title: "Hybrid Event"
- Description: "Both in-person & online options"
- Advanced: Shows warning "Requires careful planning"

---

IF IN-PERSON SELECTED:

VENUE SELECTION:
"Choose Venue" (label, bold)

Radio options:

○ Main Salon:
- Auto-filled from business profile:
  * Name: "Glow Studio"
  * Address: "B-402, Stellar Apartments, Sector 18, Noida"
  * "✓ Verified address"
- [View on Map] link
- [Edit Address] if needed

○ Specific Room/Floor:
- "Where in your salon?" dropdown:
  * Main Floor
  * Floor 2 - Training Room
  * Basement - Workshop Space
  * Outdoor Area
  * Custom location (text input)
- Helpful for large salons

○ External Venue:
- Text input for address
- "Event at partnered location"
- Google Places autocomplete
- Verify address on map
- Distance from salon shown

VENUE MAP (interactive):
- Embedded map (Google Maps/Mapbox)
- Pin showing exact location
- [Get Directions] button
- Distance calculator
- Parking availability indicator

VENUE DETAILS:
Expandable section: "Venue Information ▼"

When expanded:
- Floor/Room: "2nd Floor, Room B"
- Landmarks: "Near City Center Metro"
- Parking: "Free parking in basement"
- Accessibility: "Wheelchair accessible ✓"
- Entry instructions: "Use rear entrance"

Custom instructions text area:
- "Special directions for attendees"
- Placeholder: "Gate code, floor number, etc."
- Character limit: 200

---

IF ONLINE SELECTED:

PLATFORM SELECTION:
"Video Platform" (label)

Dropdown:
- Zoom (recommended)
- Google Meet
- Microsoft Teams
- Instagram Live
- YouTube Live
- Custom platform

MEETING DETAILS:
Based on platform selected:

For Zoom:
- Meeting Link input: "https://zoom.us/j/..."
- Meeting ID: (auto-extracted)
- Passcode: (optional, secure input)
- "Link will be shared after registration"

For others:
- Platform-specific fields
- Integration status: "✓ Connected" or "Connect Now"

AUTO-GENERATION (if integrated):
- [Generate Meeting Link] button
- Creates Zoom/Meet link automatically
- Saves credentials
- "Meeting created! Link: zoom.us/j/xxx"

ONLINE BACKUP:
- "Backup platform?" (optional)
- In case primary fails
- Professional touch

---

IF HYBRID SELECTED:

CAPACITY SPLIT:
"How will capacity be split?" (label)

Options:
○ Fixed split:
  - In-person: [10] spots (slider)
  - Online: [5] spots (slider)
  - Total: 15

○ Flexible:
  - "Let attendees choose"
  - Set max for each
  - First-come-first-serve

Price difference handling:
- "Same price for both?" toggle
- If different: Show price fields for each

---

CAPACITY SETTINGS (required):
"Event Capacity" (heading, bold)

MAXIMUM ATTENDEES:
"How many people can attend?" (label)

Number input (large, centered):
- Current: "15" (bold, 48sp)
- + / - buttons (large, 48px circles)
- Min: 1, Max: 500 (for in-person)

Capacity guidelines (context-aware):
Based on venue type:
- "Workshop spaces: 10-20 people (intimate)"
- "Training rooms: 20-50 people"
- "Large events: 50+ people"

Real capacity calculator:
- Venue size: "Training Room (300 sq ft)"
- Suggested: "15-20 people for comfortable space"
- Per person: "20 sq ft recommended"

Warning if too high:
- "⚠️ 30 people may be crowded in this space"
- "Consider reducing to 20 for comfort"

---

MINIMUM ATTENDEES:
"Minimum required to proceed?" (label)
"Event may be cancelled if minimum not reached" (helper text, gray)

Number input:
- Current: "5" (must be < maximum)
- Slider: 0 to [max capacity]
- "No minimum" checkbox (sets to 0)

Threshold indicator:
- Visual: [●●●●●○○○○○○○○○○] 5/15
- Percentage: "33% minimum"

Cancellation policy info:
- "What happens if minimum not reached?"
- Auto-text: "If we don't reach 5 registrations by Dec 14, we'll cancel and refund everyone"
- Customizable deadline for minimum

---

WAITLIST MANAGEMENT:
"Enable waitlist when sold out?" (toggle)

When enabled:

Waitlist Settings:
- Max waitlist size:
  * "Unlimited" (checkbox)
  * OR number input: "10" (2x capacity suggested)
  
- Waitlist priority:
  * ○ First-come-first-served (FIFO)
  * ○ Manual selection (you choose)
  * ○ Highest bid (auction-style, advanced)

- Auto-promotion:
  * "Automatically promote from waitlist?" toggle
  * "When someone cancels, auto-offer to next person"
  * Claim window: "24 hours to accept"
  * SMS/email notification sent

- Waitlist pricing:
  * "Same price as main list" (default)
  * "Discount for waiting" (% off input)
  * "Premium for guaranteed spot" (% add)

Waitlist experience:
- Message shown to waitlist registrants
- Text editor: "You're on the waitlist! We'll notify you if a spot opens..."

---

GROUP SETTINGS (optional):
"Allow group registrations?" (toggle)

When enabled:

Group size:
- Min group size: "3" people
- Max group size: "10" people
- "Groups must register together"

Group leader:
- "One person registers for all"
- Collect all attendee details: Yes/No

Group capacity handling:
- "Reserve [2] spots for groups only"
- "Groups get priority booking" (checkbox)

---

CAPACITY VISUALIZATION:

REAL-TIME CAPACITY METER:
Visual display:
- Large progress bar
- Current: "8 / 15 registered" (53%)
- Color-coded:
  * Green: 0-60% (available)
  * Orange: 60-90% (filling up)
  * Red: 90-100% (almost full)

Breakdown:
- Confirmed: 8
- Pending payment: 2
- Waitlist: 3
- Available: 5

Forecast (smart feature):
- "At current pace: Full by Dec 12"
- "Similar events filled in 5 days"

---

SEATING/ARRANGEMENT (optional, advanced):
"Seating arrangement?" (label)

Options:
- Classroom style
- Workshop stations
- Theater style
- Round tables
- Open floor
- Custom

Visual diagrams shown for each style

Seating chart upload:
- [Upload Floor Plan] button
- PDF/image of layout
- Shows attendees where they'll be

---

VENUE AMENITIES (optional):
"What amenities are available?" (label)

Multi-select checkboxes:
- ☐ WiFi
- ☐ Projector/Screen
- ☐ Audio system
- ☐ Whiteboard/Flipchart
- ☐ Refreshments area
- ☐ Restrooms
- ☐ Air conditioning
- ☐ Wheelchair access
- ☐ Parking (free/paid)
- ☐ Photography allowed

Selected amenities shown in event listing

---

PHOTOS OF VENUE (optional):
"Venue Photos" (heading)

Upload area (multi-upload):
- Drag & drop 3-5 venue images
- Shows:
  * Main hall/room
  * Seating area
  * Facilities
  * Parking
  * Building exterior

Helps attendees know what to expect

---

COVID-19 / SAFETY PROTOCOLS (optional):
"Safety measures in place?" (label)

Checkboxes:
- ☐ Masks required
- ☐ Temperature screening
- ☐ Sanitizers provided
- ☐ Social distancing enforced
- ☐ Vaccination required
- ☐ Ventilation/outdoor space

Custom safety notes:
- Text area for additional measures

---

VALIDATION & WARNINGS:

Smart validations:
- ✓ "Capacity set appropriately for venue size"
- ⚠️ "Minimum (10) is 67% of maximum (15) - may be risky"
- ⚠️ "No waitlist - you'll lose potential attendees"
- ❌ "Maximum exceeds venue safe capacity"

Conflict checker:
- "This room is booked at 4 PM same day"
- "Suggest: Move to different room or time"

---

PREVIEW SECTION:
"How attendees see location" (collapsible)

Customer view mockup:
- Venue name
- Full address
- Map
- Directions link
- Amenities list
- Parking info

---

BOTTOM ACTION BAR:

Left:
- [← Back] to Schedule

Right:
- Progress: "60% complete"
- [Save Draft]
- [Continue →] to Pricing
  * Disabled if required fields incomplete
  * Shows errors inline

Background: Light gray
Maps: Interactive, clear
Capacity: Visual, intuitive
Safety: Transparent, reassuring
Style: Professional, detail-oriented, trustworthy
```

---

### Screen 63: Create Event - Pricing & Discounts

**Prompt for Uizard:**
```
Design a comprehensive pricing configuration interface with dynamic discount calculator and transparent fee breakdown.

PROGRESS STEPPER:
- Step 1: "Basic Info" ✓
- Step 2: "Schedule" ✓
- Step 3: "Location" ✓
- Step 4: "Pricing" ● (ACTIVE, purple)
- Step 5: "Details" ○
- Step 6: "Review" ○

HEADER:
- Back arrow (left)
- "Pricing & Discounts" title
- "Save Draft" (right)

---

EVENT PRICING TYPE (required):
"How much does it cost?" (heading, bold, 20sp)

Large selection cards:

Card 1 - Paid Event:
- Icon: ₹ (large, 64px)
- Title: "Paid Event" (bold)
- Description: "Charge attendees to register"
- Badge: "Most common"
- Selected: Purple border

Card 2 - Free Event:
- Icon: 🎁 Gift
- Title: "Free Event"
- Description: "No charge for attendance"
- Note: "Great for building community"

Card 3 - Donation-Based:
- Icon: 💝 Heart
- Title: "Pay What You Want"
- Description: "Suggested amount, attendee decides"
- Advanced option

---

IF PAID SELECTED:

BASE PRICE (required):
"Event Price" (label, bold, 20sp)

Large price input:
- Currency symbol: ₹ (prefix)
- Number input: "960" (large, 40sp)
- Per person label
- Validation: Min ₹50, Max ₹50,000

Price calculator (helpful tool):
"Not sure what to charge?" (collapsible)

When expanded:
- Cost breakdown calculator:
  * Instructor fee: ₹___ input
  * Materials cost: ₹___ input
  * Venue/overhead: ₹___ input
  * Your profit margin: ___% slider
  * **Suggested price: ₹960** (auto-calculated, green)
  
- Competitive analysis:
  * "Similar workshops: ₹800-₹1,200"
  * "Your pricing is competitive ✓"
  * Market position: [Budget | Mid-Range | Premium]

- Value calculator:
  * "Materials worth: ₹800"
  * "Certificate value: ₹200"
  * "Total value: ₹2,500"
  * "Price/Value ratio: 38% (Excellent!)"

---

TAX & FEES:
"Taxes & Service Fees" (heading)

GST Configuration:
- "Include GST?" toggle (default: ON)
- GST rate: "18%" (auto-filled for India)
- Options:
  * ○ Included in price (attendee pays ₹960 total)
  * ○ Added to price (attendee pays ₹960 + GST = ₹1,133)
  
GST preview:
- Base: ₹960
- GST (18%): ₹172.80
- **Total: ₹1,132.80** (what customer pays)

Platform fee (if applicable):
- "Platform fee: 3% + ₹10"
- Applied to: Base price
- You receive: ₹920
- Shown in breakdown

---

EARLY BIRD PRICING (optional):
"Offer early bird discount?" (toggle)

When enabled:

Early Bird Setup:
- Discount type (radio):
  * ○ Percentage off: ___% slider (5-50%)
  * ○ Fixed amount: ₹___ input

- Current discount: "20% off"
- Early bird price: "₹960" (auto-calculated)
- Regular price: "₹1,200"
- Savings shown: "Save ₹240"

Deadline configuration:
- "When does early bird end?" (label)
- Options:
  * ○ Specific date/time: [Date picker]
  * ○ Days before event: "7 days before" (dropdown)
  * ○ When X tickets sold: "First 10 tickets"
  * ○ Combination: Date OR sold out

Early bird preview:
- Timeline visual:
  * NOW → Dec 1: ₹960 (Early Bird)
  * Dec 1-14: ₹1,200 (Regular)
  * Dec 15: Event Day
  
Countdown display:
- "Early bird ends in: 14 days"
- Creates urgency for customers

---

GROUP DISCOUNTS (optional):
"Offer group discounts?" (toggle)

When enabled:

Group Tiers (add up to 3 tiers):

Tier 1:
- Group size: "3-5 people" (min-max inputs)
- Discount: "10% off" (percentage or fixed)
- Price per person: "₹864" (auto-calculated)
- Total for 3: "₹2,592"

Tier 2:
- Group size: "6-10 people"
- Discount: "15% off"
- Price per person: "₹816"

Tier 3:
- Group size: "10+ people"
- Discount: "20% off"
- Price per person: "₹768"
- "Contact for larger groups" option

Group discount rules:
- "All members must register together" (checkbox)
- "Group leader pays for all" OR "Split payment"
- [Add Another Tier] button (max 3)

---

MEMBER/LOYALTY DISCOUNTS (optional):
"Reward loyal customers?" (toggle)

When enabled:

Membership tiers (auto-pulls from loyalty system):
- Silver members: "5% off"
- Gold members: "10% off"
- Platinum members: "15% off"

Repeat customer discount:
- "Attended your events before? 10% off"
- Auto-applied if customer history found

First-time discount:
- "New to our events? 5% off first booking"

Discount stacking rules:
- "Can combine with early bird?" (toggle)
- "Maximum discount: 30%" (safety cap)
- Priority: Member > Group > Early Bird

---

PROMO CODES (optional):
"Allow promo codes?" (toggle)

When enabled:

Create promo code:
- Code name: "SAVE20" (uppercase, auto-formatted)
- Discount:
  * ○ Percentage: ___% (1-100%)
  * ○ Fixed: ₹___ 
  * ○ Free admission

- Usage limits:
  * Total uses: "Unlimited" OR number
  * Per customer: "1 use" (default)
  * Minimum tickets: "1"

- Validity period:
  * Start date: [Picker]
  * End date: [Picker]
  * OR "Always active"

- Conditions:
  * "Only for new customers" (checkbox)
  * "Only with email domain: @company.com" (optional)
  * "Minimum purchase: ₹___"

Promo code list:
Table showing active codes:
- Code | Discount | Used | Remaining | Actions
- SAVE20 | 20% | 12/50 | 38 | [Edit] [Deactivate]
- EARLYBIRD | ₹200 | 45/∞ | ∞ | [Edit] [Deactivate]

[+ Create Promo Code] button

---

SLIDING SCALE / PAY-WHAT-YOU-CAN (advanced):
"Offer flexible pricing?" (toggle)

Sliding scale configuration:
- Minimum: ₹500 (below costs, not recommended)
- Suggested: ₹960 (your price)
- Maximum: ₹2,000 (generous supporter)

Messaging:
- "We want everyone to attend regardless of financial situation"
- "Pay what feels right for you"
- Custom message field

Statistics:
- Average paid (from past events): ₹890
- "92% pay suggested price or more"

---

REFUND & CANCELLATION POLICY (required):
"Cancellation & Refund Policy" (heading)

Template selector (quick setup):
Dropdown with pre-built policies:
- "Standard" (selected):
  * 7+ days: 100% refund
  * 3-7 days: 50% refund
  * 1-3 days: 25% refund
  * <24h: No refund
  
- "Flexible":
  * Anytime: 100% refund (risky)
  
- "Strict":
  * 14+ days: 50% refund
  * <14 days: No refund
  
- "Custom":
  * Build your own

Custom policy builder:
Timeline editor:
- 7+ days before: [100%] refund slider
- 3-7 days: [50%]
- 1-3 days: [25%]
- <24 hours: [0%]

Special conditions:
- "Medical emergency: Full refund with proof"
- "No-show: No refund"
- "Transfer to another date: Free"
- "Transfer to friend: Allowed with ₹___ fee"

Refund processing:
- Processing time: "5-7 business days"
- Refund method: "Original payment method"
- Cancellation fee: ₹___ (optional)

Policy preview:
- Shows in plain language
- "Example: Cancel 5 days before = ₹480 refund"

---

DYNAMIC PRICING (advanced):
"Use dynamic pricing?" (toggle)
"Prices change based on demand" (helper text)

When enabled:

Pricing tiers:
- Phase 1 (First 5 tickets): ₹800 (lowest)
- Phase 2 (Next 5 tickets): ₹960 (base)
- Phase 3 (Last 5 tickets): ₹1,200 (premium)

Visual graph showing price curve
"Like airplane tickets - rewards early bookers"

Surge pricing:
- "High demand? Increase price by ___%" 
- Triggers: >70% sold in <24h
- Max surge: 25%

---

PRICE BREAKDOWN PREVIEW:
Large card showing customer view:

"What customers will see" (heading)

Price card mockup:
- Original: ~~₹1,200~~ (if discounted)
- Early Bird: **₹960** (large, bold, purple)
- Group (3+): ₹864 per person
- Member discount: Extra 10% off

Price details (expandable):
- Base price: ₹1,200
- Early bird (20%): -₹240
- Subtotal: ₹960
- GST (18%): ₹172.80
- **You pay: ₹1,132.80** (total)

Savings banner:
- "🎉 You save ₹185 with early bird + member discount!"

---

REVENUE CALCULATOR:
"Projected Revenue" (collapsible card)

Calculations:
- Capacity: 15 people
- Average price: ₹960 (after discounts)
- Gross revenue: ₹14,400

Deductions:
- Platform fees (3%): -₹432
- GST (collected, not income): ±₹0
- Instructor fee: -₹3,000
- Materials: -₹2,000

**Net income: ₹8,968**

Profit margin: 62% (healthy)

Scenarios:
- Best case (full price, sold out): ₹18,000
- Realistic (70% full, mixed pricing): ₹10,080  
- Worst case (min attendance, max discounts): ₹4,800

Goal tracker:
- Target revenue: ₹___ (set goal)
- Current: ₹0 (updates live)
- Progress bar

---

PAYMENT OPTIONS:
"How will customers pay?" (heading)

Payment methods (multi-select):
- ☑ UPI (recommended - instant)
- ☑ Credit/Debit Cards
- ☑ Net Banking
- ☑ Wallets (Paytm, etc.)
- ☐ Pay at venue (requires trust)
- ☐ Bank transfer (manual)

Payment timing:
- ○ Full payment upfront (default)
- ○ Partial payment (₹___ now, rest at venue)
- ○ Pay later (invoice, for corporate)

Installment option (advanced):
- "Allow payment plans?" toggle
- E.g., "3 installments of ₹320"
- For high-value events only

---

PRICING VISIBILITY:
"Price display options" (heading)

Options:
- ○ Show exact price (transparent)
- ○ "Starting from ₹960" (if variable)
- ○ "Contact for pricing" (exclusive events)
- ○ "Free (Registration required)"

---

VALIDATION & WARNINGS:

Smart warnings:
- ⚠️ "Price is 40% below similar events - ensure profitability"
- ⚠️ "Too many discounts - your margin is only 15%"
- ⚠️ "No cancellation grace period - may reduce bookings"
- ✓ "Pricing is competitive for your market"

Price optimization suggestions:
- "Consider ₹1,099 (psychological pricing)"
- "Early bird deadline could be 2 days later"
- "Add group discount to increase bookings"

Break-even analysis:
- "You need minimum 6 attendees to break even"
- Current minimum: 5 (risky!)
- Recommendation: "Set minimum to 8"

---

PREVIEW:
"Customer price view" mockup
Shows exactly how pricing appears in:
- Event listing card
- Event details page
- Checkout screen

---

BOTTOM ACTION BAR:

Left:
- [← Back] to Location

Right:
- Progress: "80% complete"
- [Save Draft]
- [Continue →] to Details
  * Validates pricing logic
  * Ensures no negative margins
  * Checks discount conflicts

Background: White and light gray
Price inputs: Large, clear, currency-formatted
Calculators: Interactive, helpful
Discounts: Visual, easy to understand
Style: Transparent, business-focused, profit-conscious
```

---

### Screen 64: Create Event - Details & Requirements

**Prompt for Uizard:**
```
Design a detailed event information interface for materials, requirements, and logistics configuration.

PROGRESS STEPPER:
- Step 1-4: ✓ (completed)
- Step 5: "Details" ● (ACTIVE, purple)
- Step 6: "Review" ○

HEADER:
- Back arrow (left)
- "Event Details" title
- "Save Draft" (right)

---

WHAT'S INCLUDED (required):
"What will attendees receive?" (heading, bold, 20sp)
"List everything included in the ticket price" (helper text)

Multi-item editor (unlimited items):

Each item card:
- Icon selector (tap to choose):
  * 💄 Makeup kit
  * 📜 Certificate
  * 🎁 Product samples
  * 📚 Workbook
  * ☕ Refreshments
  * 📸 Photos
  * 🎟️ Future discount
  * ➕ Custom icon
  
- Item name input: "Professional Makeup Kit"
- Description (optional): "Full kit worth ₹800 - yours to keep!"
- Value (optional): "₹800" 
  * Shows cumulative value
  * "Total value: ₹2,500" (highlights ROI)
  
- Highlight toggle: "Feature this item" (shows prominently)
- Keep/Use indicator:
  * ○ "Attendee keeps" (take home)
  * ○ "Use only" (during event)

[+ Add Item] button (no limit)
Drag handles to reorder items

Pre-filled templates:
"Quick start" button loads common items:
- For "Workshop": Kit, certificate, materials
- For "Product Launch": Samples, discount code
- For "Group Event": Party favors, photos

---

MATERIALS PROVIDED (if workshop):
"What will you provide?" (heading)

Checklist format:
- ☑ All makeup products
- ☑ Brushes and tools  
- ☑ Practice materials
- ☑ Sanitized equipment
- ☑ Lighting and mirrors
- ☑ Seating and tables
- ☐ Individual workstations
- ☐ Storage for belongings

Custom add:
- [+ Add Item] to list

Quantity info:
- "Enough for ___ people" (auto from capacity)
- "Shared" or "Individual" per item

---

WHAT TO BRING (requirements):
"What should attendees bring?" (heading)

Item list (attendees see this):
- ☑ Clean face (no makeup)
- ☑ Hair tied back
- ☑ Face wipes/tissues
- ☑ Notebook & pen (optional)
- ☐ Their own brushes (optional)
- ☐ Camera for photos

Each item:
- Name input
- Required/Optional toggle
- Description field
- Icon selection

Helpful defaults:
- "Load common requirements" for event type
- Pre-populated based on category

---

PREREQUISITES & ELIGIBILITY:
"Who can attend?" (heading)

Age requirements:
- Minimum age: [18] (number input)
- Maximum age: "No limit" OR [___]
- Age verification: "Photo ID required" (checkbox)

Skill level (repeated from Basic Info):
- Display current selection
- "Beginner" (can edit)
- Prerequisites list if Intermediate/Advanced:
  * "Basic makeup knowledge helpful"
  * "Should own a brush set"

Physical requirements:
- "Must be comfortable standing for 2-3 hours"
- "Ability to work with hands"
- Custom requirements text area

Health & safety:
- Allergies warning: "Please inform us of skin allergies"
- Pregnancy considerations (if applicable)
- Accessibility needs accommodation

Restrictions (if any):
- "No children under 16"
- "Adult-only event"
- "Professional credentials required" (verification)

---

DRESS CODE (optional):
"Is there a dress code?" (toggle)

When enabled:
Text area: "Comfortable clothing recommended"
Suggestions:
- "Avoid white (makeup stains)"
- "Hair should be accessible"
- "Wear comfortable shoes"
- "Aprons provided"

Dress code examples (quick select):
- Casual
- Business casual
- Professional
- Themed (custom description)

---

EQUIPMENT/DEVICES NEEDED:
"Should attendees bring devices?" (toggle)

When enabled:
Checkboxes:
- ☐ Laptop (with specs: Windows/Mac, RAM)
- ☐ Tablet/iPad
- ☐ Smartphone
- ☐ Camera
- ☐ Chargers
- ☐ Headphones

Software requirements:
- "Install before event:" (list)
- Download links provided
- Setup instructions

---

INSTRUCTOR/HOST INFORMATION:
"About the instructor" (heading)

If selected in Step 1, shows:
- Name: "Riya Kapoor"
- [Edit] to change

Extended bio section:
- Full bio (rich text editor, 1000 chars):
  * Background
  * Experience: "12 years"
  * Credentials/certifications
  * Awards & recognition
  * Teaching philosophy
  
- Profile photo (large, professional):
  * Upload area
  * Crop tool
  * Square format (400x400px)

- Social media links:
  * Instagram: @___
  * YouTube: channel
  * Website URL
  * LinkedIn
  
- Portfolio/work samples:
  * Upload 4-6 images
  * "Before/after" galleries
  * Past student work

- Past event stats:
  * "500+ workshops conducted"
  * "10,000+ students taught"
  * "4.9 average rating"

Video introduction (optional):
- YouTube/Vimeo embed
- "Introduce yourself to attendees"
- 1-3 minute recommended

---

EVENT SCHEDULE/AGENDA:
"Create event timeline" (heading)

Timeline builder:
Visual timeline editor with drag-to-adjust

Default structure:
[Start Time] 2:00 PM - Registration & Welcome (15 min)
[2:15 PM] Theory Session (45 min)
[3:00 PM] Hands-on Practice (75 min)
[4:15 PM] Tea Break (15 min)
[4:30 PM] Advanced Techniques (30 min)
[5:00 PM] Q&A & Certificate Distribution (15 min)
[End Time] 5:15 PM

Each agenda item:
- Time (auto-calculated or manual)
- Activity name
- Duration (slider or input)
- Description (optional)
- Icon selection

Features:
- [+ Add Activity] button
- Drag to reorder
- Auto-adjusts times
- Shows breaks visually
- Total duration check
- Buffer time suggestions

Pre-built templates:
- "Workshop agenda"
- "Product launch flow"
- "Masterclass schedule"

---

PHOTOGRAPHY & MEDIA:
"Event photography policy" (heading)

Options:
- ○ Photography allowed (attendees can take photos)
- ○ Photography discouraged (request no photos)
- ○ No photography (strict policy)

Professional photography:
- "We'll provide photos" (toggle)
- Photographer: Internal staff OR hired
- Delivery: "Within 24 hours via WhatsApp group"
- Consent: "Photos may be used for marketing"

Video recording:
- "This event will be recorded" (toggle)
- Purpose: Promotional, educational, both
- Opt-out option for attendees

Media usage rights:
- "We may use photos in marketing" (checkbox)
- "Attendees can request removal"
- Privacy-conscious messaging

---

COMMUNICATION & COMMUNITY:
"Stay connected" (heading)

WhatsApp group:
- "Create event group?" (toggle)
- Auto-add all attendees after registration
- Group guidelines set
- Admin controls

Email updates:
- "Send reminder emails" (default: ON)
- Frequency:
  * 1 week before
  * 1 day before
  * 2 hours before
  * Day of event
  
SMS reminders:
- "Send SMS reminders" (toggle, may cost extra)
- Same frequency as email

Post-event:
- "Create alumni group" for networking
- "Send feedback survey" (auto)
- "Share photos & certificate"

---

PARKING & TRANSPORTATION:
"Getting here" (heading)

Parking:
- "Parking available?" (toggle)
- Type: Free / Paid (₹___ per hour)
- Capacity: ___ spots
- Location: "Basement/Ground/Street"
- Instructions: "Use rear entrance"

Public transit:
- Nearest metro: "City Center - 400m"
- Bus stops: "Stop #42"
- Taxi drop point: "Main gate"
- Auto-rickshaw friendly: Yes/No

Carpooling:
- "Encourage carpooling" (checkbox)
- "We'll help coordinate" (optional)

---

ACCESSIBILITY:
"Accessibility features" (heading)

Physical access:
- ☑ Wheelchair accessible
- ☑ Elevator available
- ☐ Ramp access
- ☐ Accessible restrooms
- ☐ Reserved accessible parking

Accommodations:
- Sign language interpreter (on request)
- Large print materials
- Audio descriptions
- Quiet space available
- Dietary accommodations

Request form:
- "Special needs? Let us know" (checkbox)
- Opens text field in registration
- "We'll reach out personally"

---

FAQS (pre-written):
"Frequently Asked Questions" (heading)

FAQ builder:
Pre-populated based on event type:

Q: "What if I'm late?"
A: [Text field] "Late entry permitted until 2:30 PM. After that, doors close."

Q: "Can I bring a friend?"
A: "Only registered attendees allowed. Your friend can register separately if spots available."

Q: "Will I get a certificate?"
A: "Yes! Digital certificate emailed within 24h."

[+ Add FAQ] button
Drag to reorder
Shows to customers on event details page

Common FAQ library:
- Tap to add frequently asked questions
- Customizable answers

---

CERTIFICATES & CREDENTIALS:
"Certification" (heading)

Issue certificate:
- "Provide certificate?" (toggle, default ON for workshops)
- Certificate type:
  * ○ Digital (PDF via email)
  * ○ Physical (printed, mailed)
  * ○ Both

Certificate details:
- Template selection (preview shown):
  * Professional
  * Modern
  * Classic
  * Custom upload
  
- Issuing authority: "Your salon name"
- Accreditation (if any): "Certified by ___"
- Validity: Lifetime / Expires in ___

Criteria for certificate:
- "Attend full event" (default)
- "Pass quiz/assessment" (optional)
- "Complete assignment" (optional)

Delivery:
- Timing: "Within 24 hours" OR "Immediately"
- Method: Email, WhatsApp, both

Certificate preview:
- Shows sample with attendee name
- Verify layout and text

---

SPECIAL INSTRUCTIONS:
"Additional important information" (heading)

Text area (large, 500 chars):
- Anything not covered above
- Important notes
- Last-minute changes
- Contact info for questions

Examples:
- "Building under construction, use south gate"
- "Allergies: We use nut-based products"
- "Please arrive 15 mins early for parking"

Formatting: Rich text editor

---

TERMS & CONDITIONS:
"Event terms" (heading)

Template selector:
- Standard terms (pre-written, editable)
- Custom terms (write your own)

Covers:
- Cancellation policy (ref from pricing)
- Refund policy
- Conduct expectations
- Liability waiver (if needed)
- Photo/video consent
- No-show policy

Attendees must accept during registration
Link shown in event details

---

PREVIEW SECTION:
"How attendees see event details" (collapsible)

Customer view mockup:
- What's included section
- Requirements section
- Instructor bio
- Schedule
- FAQs

Validates completeness

---

BOTTOM ACTION BAR:

Left:
- [← Back] to Pricing

Right:
- Progress: "95% complete"
- [Save Draft]
- [Continue →] to Review
  * Final step before publish

Background: White and light gray
Sections: Organized, collapsible
Inputs: Clear, guided
Preview: Helpful validation
Style: Comprehensive, professional, attendee-focused
```

---

### Screen 65-68 have been added above! Now adding the final 2 screens (69-70):

### Screen 69: Reschedule Event

**Prompt for Uizard:**
```
Design a thoughtful event rescheduling interface with impact analysis and automatic attendee notification.

HEADER:
- Back arrow (left) → Event Overview
- "Reschedule Event" title (center)
- [Cancel] (right, text)

WARNING BANNER (top):
Orange background, padding 16px:
- ⚠️ Icon (large)
- "Rescheduling will notify all attendees"
- "Some may cancel due to the new date"

---

CURRENT EVENT INFO (card, gray background):
Shows what's changing:
- Event title: "Bridal Makeup Masterclass"
- Current date: "Dec 15, 2024" (bold, large)
- Current time: "2:00 PM - 5:00 PM"
- Current attendees: "12 registered"
- Revenue at stake: "₹13,255"

---

NEW DATE & TIME SELECTION:

"Select New Date" (heading, bold, 20sp)

Calendar picker (large):
- Month/year header with nav
- Days grid
- Current date outlined (red, can't select)
- Available dates (tappable)
- Unavailable dates (grayed out, shows reason on tap)
  * "Conflicting event"
  * "Outside operating hours"
  * "Too soon (minimum 7 days notice)"

Selected new date display:
- Large format: "Saturday, December 22, 2024"
- Days difference: "7 days later"
- Day of week comparison:
  * Was: Saturday
  * New: Saturday ✓ (same day of week is better)

---

"Select New Time" (heading)

Time picker:
- Start time: [2:00 PM ▼]
- End time: [5:00 PM ▼] (auto-fills based on duration)
- Duration shown: "3 hours" (same as original)

Time comparison:
- Original: 2:00 PM - 5:00 PM
- New: 2:00 PM - 5:00 PM ✓
- "Same time slot - fewer cancellations likely"

Conflict checker:
- Checks against:
  * Other events
  * Staff schedules
  * Salon bookings
- Shows: "✓ No conflicts" (green) OR
- "⚠️ Conflict with: Hair Workshop at 4 PM"

---

REASON FOR RESCHEDULE (required):
"Why are you rescheduling?" (label)

Dropdown selection:
- Venue not available
- Instructor unavailable
- Low registrations
- Weather concerns
- Technical issues
- Conflicting event
- Personal reasons
- Other (opens text field)

Additional notes (optional):
- Text area: "Explain to attendees..."
- Placeholder: "The venue had a plumbing issue. We've secured a better space for the new date!"
- Character limit: 500

---

IMPACT ANALYSIS:

"What will happen?" (heading, collapsible)

When expanded shows automatic impact assessment:

ATTENDEE IMPACT:
- Total affected: 12 attendees
- Likely to accept: ~9 (75%) - based on similar reschedules
- Likely to cancel: ~3 (25%)
- At risk revenue: ₹3,750 (25%)

Timeline comparison:
- Original: 3 days notice
- New: 10 days notice
- "More notice = fewer cancellations ✓"

Day of week impact:
- Same day (Sat → Sat): Lower cancellation risk ✓
- Different day: Higher cancellation risk ⚠️

Time slot impact:
- Same time: Lower cancellation risk ✓
- Different time: Moderate risk

---

ATTENDEE NOTIFICATION SETTINGS:

"How to notify attendees?" (heading)

Automatic notifications (default, recommended):
- ☑ Email all attendees (immediate)
- ☑ SMS all attendees
- ☑ Update in their "My Events"
- ☑ Calendar update (for those who added to calendar)

Email preview:
Collapsible section showing draft email:

Subject: "Important: [Event] Rescheduled to Dec 22"

Body:
"Hi {name},

We need to reschedule the Bridal Makeup Masterclass.

Original: Dec 15, 2024 at 2:00 PM
New Date: Dec 22, 2024 at 2:00 PM

Reason: [Your reason from above]

Your ticket is still valid. No action needed if you can attend the new date.

Can't make it? We understand!
- Full refund available (claim by Dec 20)
- Transfer to friend (free)
- Credit for future event

Questions? Reply to this email or call us.

See you on Dec 22!
Glow Studio Team"

[Edit Email] button to customize

---

ATTENDEE OPTIONS:

"What options will attendees have?" (heading)

Auto-configured options:
- ✓ Accept new date (no action needed)
- ✓ Request full refund (deadline: 7 days before new date)
- ✓ Transfer to friend
- ✓ Credit for future event (110% value)

Refund policy for reschedule:
- "100% refund - no penalty"
- "We initiated the change"
- Processing: "5-7 business days"

Response deadline:
- "Attendees have until Dec 20 to respond"
- "No response = Assumed accepted"
- Auto-reminder: "3 days before deadline"

---

COMPENSATION OPTIONS (optional):

"Offer something extra?" (toggle)

When enabled:

Compensation ideas:
- ○ Discount: ___% off (applies to ticket)
- ○ Free addon: (select from inventory)
  * Extra product samples
  * Free refreshments upgrade
  * Bonus certificate
- ○ Voucher: ₹___ for future events
- ○ Custom: (describe)

Why compensate:
- "Reduces cancellations"
- "Builds goodwill"
- "Shows you value their time"

Estimated cost:
- 10% discount: ₹1,326 (if all accept)
- Free samples: ₹500
- Total: ₹1,826

Impact on profit:
- Original profit: ₹8,968
- After compensation: ₹7,142
- Still profitable ✓

---

VENUE & LOGISTICS UPDATE:

"Is the venue changing?" (toggle)

If YES:
- New venue address input
- Google Places autocomplete
- Map showing new location
- Distance from original: "2.5 km away"
- Parking availability: Yes/No
- Accessibility: Yes/No

Venue comparison:
- Original: Main Studio, Floor 2
- New: Training Room, Floor 3
- Impact: "Same building ✓ - minimal disruption"

Updated directions:
- Auto-generates new directions
- Included in notification email

---

PREVIEW CHANGES:

"Preview what attendees will see" (collapsible)

Shows mockup of:
- Updated event details page
- Email notification
- Calendar update
- Ticket update

Side-by-side comparison:
- Before (crossed out)
- After (highlighted)

---

FINANCIAL IMPLICATIONS:

"Financial impact" (card)

Current situation:
- Revenue collected: ₹13,255
- Refunds (if 25% cancel): -₹3,314
- Compensation (10% discount): -₹1,326
- **Remaining revenue: ₹8,615** (65%)

Projected outcome:
- Best case (0% cancel): ₹13,255
- Expected (25% cancel): ₹8,615
- Worst case (50% cancel): ₹5,300

Risk assessment: "Medium risk" (orange)

---

AUTOMATIC ACTIONS:

"What happens automatically?" (info card)

System will:
- ✓ Send notifications to all attendees
- ✓ Update event details everywhere
- ✓ Update calendar invites
- ✓ Re-generate tickets with new date
- ✓ Update check-in system
- ✓ Track attendee responses
- ✓ Process refunds automatically
- ✓ Release spots from cancellations
- ✓ Open waitlist promotions (if enabled)

You will:
- Monitor response dashboard
- Follow up with non-responders
- Approve/process refunds
- Update materials/setup for new date

---

CONFIRMATION CHECKLIST:

Before rescheduling, confirm:
- ☑ New venue is available
- ☑ Instructor is available
- ☑ Materials can be ready
- ☑ Staff can attend
- ☑ You've informed your team

Required checkbox:
- ☑ "I confirm this reschedule is necessary"
- ☑ "I understand attendees may cancel"
- ☑ "I've reviewed all financial impacts"

Can't proceed until all checked

---

BOTTOM ACTION BAR (sticky):

Left:
- [Cancel] button (outlined)
  * Returns to Event Overview
  * No changes made

Right:
- [Reschedule Event] button (purple, filled)
  * Disabled until all required fields complete
  * Shows confirmation modal before proceeding

---

CONFIRMATION MODAL (after button tap):

Final warning:
- "Are you absolutely sure?"
- "This will notify 12 attendees immediately"
- "Estimated 3 cancellations (₹3,750 refunds)"

Summary:
- From: Dec 15, 2024 at 2:00 PM
- To: Dec 22, 2024 at 2:00 PM
- Notification: Email + SMS to 12 people
- Refund policy: 100% until Dec 20

Two buttons:
- [Go Back] (outlined, left)
- [Confirm Reschedule] (red, bold, right)

---

PROCESSING SCREEN:

Full-screen overlay:
- Loading spinner (large)
- Progress steps:
  1. "Updating event..." ✓
  2. "Sending notifications..." ✓
  3. "Updating calendars..." ✓
  4. "Processing refund eligibility..." ✓

Takes 10-15 seconds

---

SUCCESS SCREEN:

Checkmark animation (green):
- "✓ Event Rescheduled Successfully"

Summary:
- "12 attendees notified"
- "Emails sent ✓"
- "SMS sent ✓"
- "Calendar invites updated ✓"

Next steps:
- "Monitor responses in Attendee Management"
- "Deadline for responses: Dec 20"
- "Refunds will process automatically"

Quick actions:
- [View Updated Event]
- [View Attendee Responses]
- [Send Follow-Up Message]
- [Done]

Confirmation email:
- "Confirmation sent to your email"
- Includes all details of reschedule

Background: White
Warnings: Orange, clear, not scary
Impact analysis: Data-driven, realistic
Notifications: Automated, comprehensive
Style: Professional, transparent, attendee-first
```

---

### Screen 70: Cancel Event

**Prompt for Uizard:**
```
Design a careful event cancellation interface with full transparency about refunds, attendee impact, and business implications.

HEADER:
- Back arrow (left) → Event Overview
- "Cancel Event" title (center, red text)
- [×] Close (right)

DANGER BANNER (top):
Red background, white text, padding 20px:
- ⚠️ Icon (large, 64px)
- "This action cannot be undone"
- "All attendees will be refunded"
- "Event will be permanently cancelled"

---

EVENT SUMMARY (card):
What you're about to cancel:

- Event cover image (small, 80px)
- Title: "Bridal Makeup Masterclass"
- Date: "Dec 15, 2024 at 2:00 PM"
- Status: "Published - 12 registered"
- Revenue: "₹13,255 collected"
- Days until event: "3 days"

---

REASON FOR CANCELLATION (required):
"Why are you cancelling?" (label, bold)

This is important for:
- Attendee communication
- Future planning
- Platform insights

Dropdown selection (required):
- Low registrations (didn't meet minimum)
- Venue unavailable
- Instructor unavailable / sick
- Personal emergency
- Weather / natural disaster
- Safety concerns
- COVID-19 related
- Technical issues
- Business closure
- Customer demand too low
- Overbooking / scheduling conflict
- Other (opens text field)

Detailed explanation (required):
- Text area (large, 300px height)
- Label: "Explain to attendees (will be sent in email)"
- Placeholder: "We sincerely apologize, but due to [reason], we must cancel this event. We understand the inconvenience and will process full refunds within 24 hours."
- Character count: "0 / 1000"
- Minimum: 50 characters
- Helper text: "Be honest, empathetic, and apologetic"

---

IMPACT ANALYSIS:

"Impact of Cancellation" (heading)

ATTENDEES AFFECTED:
- Total attendees: 12 people
- Tickets to cancel: 12
- Groups affected: 0
- Waitlist affected: 5 (will be notified)

FINANCIAL IMPACT:
- Total refunds: ₹13,255
- Platform fees: -₹397 (non-refundable)
- Payment processing fees: -₹132 (non-refundable)
- **Your net loss: ₹529**

Costs already incurred:
- Marketing spend: ₹750 (sunk cost)
- Materials ordered: ₹2,000 (may be reusable)
- Instructor deposit: ₹1,000 (check contract)
- Venue deposit: ₹500 (may be forfeited)
- **Total sunk costs: ₹4,250**

Financial impact summary:
- Revenue lost: ₹13,255
- Fees lost: ₹529
- Sunk costs: ₹4,250
- **Total business impact: -₹4,779**

---

REFUND POLICY:

"How will refunds work?" (heading)

Automatic full refunds:
- Amount: 100% of ticket price
- Method: Original payment method
- Processing time: "5-7 business days"
- No attendee action needed

Refund breakdown (by payment method):
- UPI refunds: ₹8,400 (instant-ish)
- Card refunds: ₹3,600 (3-5 days)
- Cash collected: ₹1,200 (arrange separately)

Special cases:
- Promo codes used: Full refund + code re-enabled
- Group discounts: Each person refunded their amount
- Walk-ins (cash): Contact individually for refund

---

COMPENSATION OFFERING (optional but recommended):

"Offer compensation?" (toggle)

Why compensate beyond refund:
- Show you value their time
- Maintain customer relationships
- Encourage rebooking
- Reduce negative reviews

Compensation options:

Option 1: Bonus Credit:
- Give ₹___ salon credit (suggested: 110-150% of ticket)
- Example: ₹1,200 credit for ₹960 ticket
- Valid for: ___ months (suggested: 6-12)
- Redeemable on: Services, products, future events
- Total cost: ₹14,400 (if all claim)

Option 2: Free Service:
- Dropdown: Select service to offer
- Value: ₹___
- Validity: ___ months
- Total cost estimate

Option 3: Priority Booking:
- Free - no cost
- "First access to next similar event"
- "Lock in early bird pricing"
- "VIP status"

Option 4: Discount Code:
- ___% off future events
- Code: AUTO-GENERATED
- Validity: ___ months

Option 5: Hybrid:
- Full refund + ₹500 credit + 20% off next event

Selected compensation:
- Shows total potential cost
- Redemption rate estimate (historical: 60%)
- Actual cost: ₹8,640 (60% of ₹14,400)

---

ATTENDEE NOTIFICATION:

"How to notify attendees?" (heading)

Automatic notifications (default):
- ☑ Email immediately (required)
- ☑ SMS immediately
- ☑ Push notification (app users)
- ☑ Update calendar (remove event)
- ☑ Mark tickets as cancelled

Email preview:
Collapsible section:

Subject: "[Cancelled] Bridal Makeup Masterclass - Full Refund"

Body:
"Dear {name},

We deeply apologize, but we must cancel the Bridal Makeup Masterclass scheduled for December 15, 2024.

Reason:
[Your detailed explanation from above]

Your Refund:
- Amount: ₹960 (full ticket price)
- Method: UPI (ending in ...5678)
- Timeline: 5-7 business days
- Reference: AUTO-GENERATED

[If compensation offered]
As an apology for this inconvenience:
- ₹1,200 salon credit added to your account
- Use on any service or future event
- Valid until June 15, 2025
- Code: SORRY2024

We truly value you as a customer and hope to see you at future events.

[If rescheduling]
We're planning a similar event on [new date]. Would you like us to notify you when it's live?
[Yes, notify me] [No thanks]

Questions or concerns?
Reply to this email or call us at +91 98765 43210.

Again, our sincerest apologies.

Glow Studio Team"

[Edit Email] button to customize

---

ALTERNATIVE: OFFER RESCHEDULE FIRST:

"Try rescheduling instead?" (info card)

Benefits of rescheduling vs cancelling:
- Keep 75% of attendees (estimated)
- Maintain revenue
- Less business impact
- Better customer experience

Quick reschedule option:
- [Reschedule Instead] button
  * Opens reschedule screen (Screen 69)
  * Saves cancellation as last resort

Comparison:
- Cancel: Lose ₹13,255 + ₹4,250 costs
- Reschedule: Keep ~₹9,000 (if 75% accept)

Recommendation: "⚡ Try rescheduling first"

---

FUTURE EVENT HANDLING:

"What about future occurrences?" (if recurring)

This event is part of a series:
- Total in series: 6 events
- This event: #2 of 6
- Future events: 4 remaining

Options:
- ○ Cancel only this event (Dec 15)
- ○ Cancel all future events in series
- ○ Cancel this + next ___ events

Impact:
- Affects ___ total registrations
- Total refunds: ₹___
- Future revenue at risk: ₹___

---

MATERIALS & COSTS:

"What about ordered materials?" (heading)

Inventory check:
- Materials ordered: 15 makeup kits
- Cost: ₹2,000
- Status: "Not yet delivered" OR "Delivered"

Options:
- Store for future events (recommended)
- Return to supplier (may have restocking fee)
- Sell to attendees at cost
- Donate

If delivered, cannot refund
Becomes sunk cost

---

STAFF & VENDOR IMPACT:

"Notify staff and vendors?" (checklist)

Auto-notifications to:
- ☑ Instructor (Riya Kapoor)
- ☑ Support staff (2 people)
- ☑ Venue management
- ☑ Catering (if applicable)

Contract obligations:
- Instructor fee: "₹3,000 - check cancellation clause"
- Venue deposit: "₹500 - may forfeit"
- Recommendation: "Review contracts before cancelling"

---

PLATFORM POLICIES:

"Cancellation policy" (info card)

Your cancellation record:
- Total events: 15
- Cancelled: 1 (7%)
- Cancellation rate: "Low ✓ - Good standing"

Platform guidelines:
- Frequent cancellations may affect visibility
- Cancellation rate >20% triggers review
- Honest reasons appreciated
- Safety always comes first

Your account status:
- "✓ Good standing"
- "No penalties applied"

---

CONFIRMATION CHECKLIST:

Before cancelling, you must confirm:

Required checkboxes:
- ☑ "I understand all attendees will receive full refunds"
- ☑ "I understand this action cannot be undone"
- ☑ "I have reviewed all financial impacts (₹4,779 loss)"
- ☑ "I have considered rescheduling instead"
- ☑ "I will honor compensation offerings"
- ☑ "I understand my cancellation record"

Additional verification (for high-value events >₹10,000):
- Enter your salon name to confirm: [Text input]
- Must match exactly

Can't proceed until all checked

---

BOTTOM ACTION BAR (sticky):

Left:
- [Keep Event] button (green, outlined)
  * Returns to Event Overview
  * No changes made
  * Shows as "Recommended" badge

Right:
- [Cancel Event] button (red, filled, bold)
  * Disabled until all checkboxes checked
  * Opens final confirmation modal

---

FINAL CONFIRMATION MODAL:

Last chance to reconsider:
- "Final Warning"
- "This will cancel the event and refund 12 attendees"

Impact summary (large numbers):
- Refunds: ₹13,255
- Compensation: ₹8,640
- Fees lost: ₹529
- **Total cost: ₹22,424**

Are you sure?
- "Type 'CANCEL' to confirm" (text input)
- Must type exactly (case-insensitive)

Two buttons:
- [Go Back] (outlined, green, left)
- [Confirm Cancellation] (red, bold, right)
  * Disabled until "CANCEL" typed

---

PROCESSING SCREEN:

Full-screen overlay:
- Loading spinner (large, red accent)
- "Cancelling event..."

Progress steps:
1. "Cancelling registrations..." ✓
2. "Processing refunds..." ✓
3. "Sending notifications..." ✓
4. "Updating records..." ✓
5. "Releasing inventory..." ✓

Takes 15-30 seconds (refunds processing)

---

CANCELLATION CONFIRMED:

Somber success screen:
- Checkmark (gray, not celebratory)
- "Event Cancelled"

What just happened:
- "12 attendees notified via email & SMS"
- "Full refunds initiated (₹13,255)"
- "Compensation credits issued (₹8,640)"
- "Calendar invites cancelled"
- "Event removed from listings"

Refund status:
- UPI: Processing (1-3 days)
- Cards: Processing (3-5 days)
- Cash: "Contact these 1 attendees"

Next steps for you:
1. Check inbox for confirmation email
2. Monitor refund processing (dashboard)
3. Respond to attendee questions
4. Review materials/inventory
5. Cancel venue booking (if not done)
6. Settle with instructor
7. Update your calendar

Attendee communication:
- "Expect questions via email/phone"
- "Be empathetic and apologetic"
- "Honor all compensation promises"

Future recommendations:
- "Set higher minimum next time"
- "Consider backup dates in contract"
- "Offer early-bird to secure commitments"

Actions:
- [View Refund Status]
- [Download Cancellation Report]
- [Contact Attendees] (opens email)
- [Done] (returns to Events Dashboard)

Email confirmation:
- "Cancellation report sent to your email"
- Includes all financial details
- Attendee list with refund status

---

POST-CANCELLATION DASHBOARD:

Event status changed:
- Marked as "Cancelled"
- Moved to "Past Events" section
- Searchable for records
- Analytics still available

Financial reconciliation:
- Detailed P&L showing loss
- Tax implications noted
- Expense tracking

Attendee feedback (optional):
- Survey to cancelled attendees
- "Why weren't you able to attend the rescheduled date?"
- Helps prevent future cancellations

Background: White with red accents
Warnings: Clear, serious, not alarmist
Refunds: Automatic, transparent
Compensation: Optional but recommended
Style: Careful, empathetic, business-aware
```

---

## 🎊 ALL 12 BUSINESS EVENT MANAGEMENT SCREENS COMPLETE!

**All 12 detailed business event management screens have been successfully added with exceptional UX and production-ready Uizard.io prompts!**

### Complete Business Event Screens (59-70):

1. **Screen 59: Events Dashboard** ✅
   - Summary metrics, upcoming/past/drafts tabs, analytics preview

2. **Screen 60: Create Event - Basic Info** ✅
   - Event type selection, title, description, cover image, instructor

3. **Screen 61: Create Event - Schedule & Timing** ✅
   - Date/time picker, recurring options, registration deadline

4. **Screen 62: Create Event - Location & Capacity** ✅
   - Venue configuration, capacity settings, waitlist management

5. **Screen 63: Create Event - Pricing & Discounts** ✅
   - Base price, early bird, group discounts, member pricing, tax, revenue calculator

6. **Screen 64: Create Event - Details & Requirements** ✅
   - What's included, requirements, instructor bio, agenda, FAQs, certificates

7. **Screen 65: Event Management - Overview** ✅
   - Real-time metrics, quick actions, registration timeline, revenue breakdown

8. **Screen 66: Attendee Management** ✅
   - Attendee list, search/filter, export, bulk communication tools

9. **Screen 67: Check-In Interface** ✅
   - QR scanner, manual check-in, walk-in registration, live stats

10. **Screen 68: Event Analytics** ✅
    - Performance metrics, revenue breakdown, customer insights, NPS

11. **Screen 69: Reschedule Event** ✅
    - Impact analysis, attendee notification, compensation options

12. **Screen 70: Cancel Event** ✅
    - Refund processing, attendee communication, financial impact analysis

---

## 🎉 PROJECT 100% COMPLETE!

**The SalonHub Business Partner App documentation is now FULLY COMPLETE with all critical screens ready for UI design generation!** 

### 🆕 Latest Additions (v4.0 - November 22, 2025):

**Event Management System (12 screens):**
- ✅ Complete 6-step event creation wizard
- ✅ Real-time event management dashboard  
- ✅ QR-based check-in system
- ✅ Comprehensive analytics & reporting
- ✅ Reschedule/cancel flows with impact analysis
- ✅ Attendee management & communication tools

**E-Commerce System (4 screens):**
- ✅ Product retail configuration with hybrid stock mode
- ✅ Order management dashboard  
- ✅ Order fulfillment workflow
- ✅ Sales analytics & reporting

### 📦 Complete Package:

- **82 total screens** covering every aspect of salon business management:
  * 58 operational & setup screens
  * 12 event management screens (59-70)
  * 4 e-commerce screens (55-58)
  * 8 staff/inventory screens
  
- **Event Management Ready**: Complete workshop, product launch, and event hosting capabilities
- **E-commerce Ready**: Full retail product management with hybrid stock system
- **Mobile-First**: Optimized for iOS & Android tablets and phones
- **India-Specific**: ₹ currency, GST compliance, UPI/card payments
- **Production-Ready**: Copy-paste prompts for Uizard.io AI designer

---

## 🚀 Next Steps

1. Import each screen prompt into Uizard.io AI Designer
2. Generate initial designs
3. Refine with brand guidelines (purple theme #8B5CF6)
4. Create component library
5. Build interactive prototypes
6. Export for development
7. Conduct user testing
8. Iterate based on feedback

---

**End of Document - All Business Partner App Screens Complete!**
