# SalonHub Customer Mobile App - Uizard.io Design Prompts

**Version:** 1.0  
**Date:** November 19, 2025  
**Platform:** iOS & Android Mobile App  
**Design Tool:** Uizard.io

---

## Table of Contents

1. [Design System & Brand Guidelines](#design-system--brand-guidelines)
2. **[Bottom Navigation Menu (Global Component)](#-bottom-navigation-menu-global-component)** ⭐ NEW
3. [Onboarding & Authentication Screens](#onboarding--authentication-screens)
4. [Home & Discovery Screens](#home--discovery-screens)
5. [Salon Profile & Booking Screens](#salon-profile--booking-screens)
6. [Profile & Account Screens](#profile--account-screens)
7. [Booking Management Screens](#booking-management-screens)
8. [Payment & Wallet Screens](#payment--wallet-screens)
9. [Additional Screens](#additional-screens)
10. **[E-Commerce & Shop Screens](#e-commerce--shop-screens)** ⭐ NEW (8 screens)
11. **[AI-Powered Feature Screens](#ai-powered-feature-screens)** ⭐ NEW (1 screen)

---

## Design System & Brand Guidelines

### Color Palette
- **Primary Color:** Purple/Violet (#8B5CF6) - Used for primary actions, active states
- **Secondary Color:** Pink (#EC4899) - Used for accents, highlights
- **Background:** White (#FFFFFF) for light mode, Dark Gray (#1F2937) for dark mode
- **Surface:** Light Gray (#F9FAFB) for cards and containers
- **Text Primary:** Dark Gray (#111827)
- **Text Secondary:** Medium Gray (#6B7280)
- **Success:** Green (#10B981)
- **Warning:** Amber (#F59E0B)
- **Error:** Red (#EF4444)

### Typography
- **Headings:** Bold, Sans-serif (18-24sp)
- **Body:** Regular, Sans-serif (14-16sp)
- **Captions:** Regular, Sans-serif (12sp)

### Spacing
- Small: 8px
- Medium: 16px
- Large: 24px
- XL: 32px

### Border Radius
- Small: 8px (buttons, inputs)
- Medium: 12px (cards)
- Large: 16px (modals, bottom sheets)

### Icons
- Line style icons (Lucide or Feather icons recommended)
- 24px size for most icons
- 20px for inline icons in text

---

## 📱 Bottom Navigation Menu (Global Component)

### Customer App - Bottom Tab Bar (5 Items)

**Prompt for Uizard:**
```
Design a bottom navigation bar for a salon booking mobile app with 5 main tabs.

BOTTOM NAV BAR STRUCTURE:
Height: 64px (iOS with safe area) / 56px (Android)
Background: White (light mode) / Dark Gray #1F2937 (dark mode)
Top border: 1px solid light gray (#E5E7EB)
Elevation: 4dp subtle shadow above content
Safe area: Respect iOS bottom safe area padding

NAVIGATION ITEMS (Left to Right):

1. HOME TAB:
   - Icon: House/Home icon (24px)
   - Label: "Home" (11sp, optional)
   - Active state: Purple (#8B5CF6) icon + text
   - Inactive state: Gray (#9CA3AF) icon + text
   - Links to: Home feed screen

2. EXPLORE TAB:
   - Icon: Compass/Search icon (24px)
   - Label: "Explore" (11sp)
   - Active state: Purple icon + text
   - Inactive state: Gray
   - Links to: Salon discovery/browse screen

3. BOOKINGS TAB:
   - Icon: Calendar icon (24px)
   - Label: "Bookings" (11sp)
   - Badge: Red circle with count "3" (white text, 12sp)
     * Position: Top-right of icon
     * Size: 18px diameter (grows with number)
     * Shows upcoming bookings count
   - Active state: Purple + badge
   - Inactive state: Gray + badge
   - Links to: My bookings screen

4. OFFERS TAB:
   - Icon: Tag/Gift/Percent icon (24px)
   - Label: "Offers" (11sp)
   - Badge: "NEW" text badge (red, 10sp, uppercase)
     * Position: Top-right of icon
     * Shows when new offers available
   - Active state: Purple
   - Inactive state: Gray
   - Links to: Deals & offers screen

5. PROFILE TAB:
   - Icon: User/Person icon (24px)
   - Label: "Profile" (11sp)
   - Active state: Purple
   - Inactive state: Gray
   - Links to: User profile screen

INTERACTION STATES:
- Active tab: Purple icon & text, slight scale (1.05x)
- Inactive tab: Gray icon & text
- Tap animation: Smooth fade transition (150ms)
- Icon change: Filled icon when active, outline when inactive
- Ripple effect on Android, bounce on iOS

BADGE SPECIFICATIONS:
- Background: Red (#EF4444)
- Text: White (#FFFFFF)
- Font: Bold, 10-12sp
- Min width: 18px, max width: auto (grows with content)
- Position: Absolute, top: -4px, right: -6px from icon center

ACCESSIBILITY:
- Each tab has clear hit target (minimum 48x48px)
- Labels help with accessibility
- Icons have semantic meaning
- Active state clearly distinguishable

MOBILE OPTIMIZATIONS:
- Fixed position at bottom
- Stays visible while scrolling (sticky)
- Smooth transitions between tabs
- No horizontal scroll (all 5 items fit on screen)
- Adapts to screen width (equally distributed)

Style: Modern, clean, intuitive
Material Design (Android) / iOS Human Interface Guidelines compliant
```

---

## Onboarding & Authentication Screens

### Screen 1: Splash Screen

**Prompt for Uizard:**
```
Create a mobile splash screen for a beauty salon booking app called "SalonHub". 
Center the screen with a large, elegant purple and pink gradient logo featuring a minimalist salon chair icon or abstract beauty symbol. 
Below the logo, display "SalonHub" in a modern, bold sans-serif font (24sp).
Add a subtle tagline "Your Beauty & Wellness Journey" in light gray (14sp) below the app name.
Show a small loading indicator at the bottom (circular spinner in purple).
Add version number "v1.0.0" in tiny gray text at the very bottom corner.
Use a clean white background with subtle purple gradient overlay from top.
Design should be minimalist and premium-looking.
```

---

### Screen 2: Welcome Screen (Carousel - Slide 1)

**Prompt for Uizard:**
```
Design the first onboarding slide for a salon booking mobile app.
At the top third of screen, show an illustration or photo of a happy woman browsing salons on her phone in a modern salon environment.
Below the image, display the headline "Find Your Perfect Salon" in bold, dark text (22sp).
Under the headline, add descriptive text: "Discover trusted beauty professionals near you" in medium gray (16sp).
At the bottom, include:
- Pagination dots (first dot filled in purple, others outlined)
- "Skip" text button in top-right corner
- Large purple "Next" button with rounded corners (48px height)
Use plenty of white space. Background should be white or very light purple gradient.
Style: Modern, clean, feminine but not overly decorative.
```

---

### Screen 3: Welcome Screen (Carousel - Slide 2)

**Prompt for Uizard:**
```
Design the second onboarding slide for a salon booking mobile app.
Top third: Illustration of a calendar or booking confirmation with checkmark, showing a booked appointment.
Headline: "Book in Seconds" (bold, 22sp, dark text)
Subtext: "Choose services, select time, and confirm instantly" (16sp, gray)
Bottom section:
- Pagination dots (second dot filled purple, others outlined)
- "Skip" button top-right
- Purple "Next" button (rounded, 48px height)
Use white background with subtle decorative elements.
Keep design consistent with previous slide.
```

---

### Screen 4: Welcome Screen (Carousel - Slide 3)

**Prompt for Uizard:**
```
Design the third onboarding slide for a salon booking mobile app.
Top: Illustration of a mobile wallet with cashback coins or reward stars.
Headline: "Earn While You Glow" (bold, 22sp)
Subtext: "Get cashback, offers, and exclusive deals" (16sp, gray)
Bottom:
- Pagination dots (third dot filled purple, others outlined)
- "Skip" button top-right
- Large purple "Get Started" button (rounded, 48px height, bold text)
Background: White with subtle sparkle or star decorations
Style: Inviting, rewarding, premium feel
```

---

### Screen 5: Login/Signup Choice Screen

**Prompt for Uizard:**
```
Design a mobile app login/signup screen for SalonHub.

Header section (top third):
- Small SalonHub logo centered
- "Welcome to SalonHub" heading (bold, 20sp)
- "Your beauty journey starts here" subtext (gray, 14sp)

Middle section - Three authentication buttons stacked vertically with 16px spacing:
1. Phone button: White background, dark border, phone icon left, "Continue with Phone" text
2. Google button: White background, dark border, Google 'G' logo left, "Continue with Google" text
3. Email button: White background, dark border, email icon left, "Continue with Email" text

Each button should be:
- Full width with 16px margin on sides
- 52px height
- Rounded corners (12px)
- Icon on left, text centered
- Subtle shadow

Bottom section:
- "Continue as Guest →" text link (purple, 14sp)
- Small legal text: "By continuing, you agree to Terms & Privacy Policy" (gray, 11sp)

Background: White with subtle purple gradient from top
Style: Clean, modern, trustworthy
```

---

### Screen 6: Phone Number Entry

**Prompt for Uizard:**
```
Create a phone number input screen for mobile app authentication.

Top:
- Back arrow button (top-left)
- "Enter Your Phone Number" heading (bold, 20sp)
- "We'll send you a verification code" subtext (gray, 14sp)

Middle:
- Phone input field with:
  - "+91" country code prefix (fixed)
  - Placeholder "Phone number" in light gray
  - White background, light border
  - Rounded (8px)
  - Large touch target (52px height)

Bottom section:
- Large purple "Send OTP" button (full width, rounded, 48px height)
- "Use Email Instead →" text link below (purple, 14sp)

Add phone icon next to the heading for visual context.
Background: White
Style: Simple, focused, minimal distractions
```

---

### Screen 7: OTP Verification

**Prompt for Uizard:**
```
Design an OTP verification screen for mobile app.

Header:
- Back arrow (top-left)
- "Verify Your Number" heading (bold, 20sp)
- "Code sent to +91 98765 43210" with [Edit] link in purple

OTP Input Section (centered):
- 6 individual boxes for OTP digits
- Each box: 48x48px, light gray border, rounded corners
- Active box has purple border
- Numbers displayed in large, bold font (24sp)
- Boxes arranged horizontally with 8px spacing

Timer section:
- "Resend code in 00:45" text with countdown (gray, 14sp)
- When timer ends, show "Didn't receive? Send Again" (purple, clickable)

Bottom:
- Large purple "Verify" button (full width, rounded, 48px height)

Background: White
Add a subtle checkmark shield icon near the heading
Style: Clean, secure-looking, focused
```

---

### Screen 8: Profile Completion (New Users)

**Prompt for Uizard:**
```
Design a profile completion form for new users in a salon booking app.

Header:
- "Complete Your Profile" title (bold, 20sp)
- "Just a few quick details" subtitle (gray, 14sp)

Form fields (stacked vertically with 16px spacing):
1. First Name input field (white, light border, rounded)
2. Last Name input field
3. Email input field with "(optional)" label in gray

Profile Photo Section:
- Circular placeholder (96x96px, light gray background)
- Camera icon in center
- "+ Add Photo" text below (purple, 14sp)

Bottom:
- Large purple "Continue" button (full width, rounded)
- "Skip for now →" text link below (gray, 14sp)

All input fields:
- 52px height
- Light gray border
- Rounded corners (8px)
- Placeholder text in light gray

Background: White
Style: Friendly, quick-to-complete, non-intimidating
```

---

## Home & Discovery Screens

### Screen 9: Home Screen (Main View)

**Prompt for Uizard:**
```
Design the main home screen for a salon booking mobile app with these sections from top to bottom:

HEADER (sticky):
- SalonHub logo (left, small)
- Location with dropdown "Delhi NCR ▼" (center)
- Profile avatar icon (right)
Background: White with subtle shadow

SEARCH BAR:
- White rounded rectangle (16px radius)
- Search icon left
- "Search services, salons..." placeholder gray text
- Filter icon (right side)
- Map view toggle icon (far right)

CATEGORY PILLS (horizontal scroll):
- Pills: "Hair", "Nails", "Spa", "Makeup", "Facial", "Waxing"
- Purple background for selected, white with border for unselected
- Rounded pill shape, 32px height

OFFER BANNER:
- Swipeable carousel card
- Purple gradient background
- "🎁 Exclusive Offers" heading
- "20% off first booking" promotional text
- Pagination dots below

SECTIONS (vertical scroll):

"Recently Viewed" - horizontal scroll cards:
- 2-3 salon cards showing:
  - Salon image (16:9 ratio)
  - Heart icon (top-right overlay)
  - Salon name (bold)
  - Rating stars ⭐ 4.5 (120)
  - Distance: 2.3 km
  - "Open Now • $$"

"Recommended for You" - 2-column grid:
- Same salon card design
- Infinite scroll

"New & Trending" - horizontal scroll:
- Cards with "NEW" badge overlay

BOTTOM: Navigation bar with icons for: Home, Search, Bookings, Offers, Profile

Each salon card: White background, rounded corners (12px), subtle shadow, 16px padding
Overall: Clean, modern, easy to scan, premium feel
```

---

### Screen 10: Search Screen (Active)

**Prompt for Uizard:**
```
Design an active search screen for salon booking app.

HEADER:
- Back arrow (left)
- Search input field (auto-focused, with text "haircut")
- Active cursor in input
- [Filter] button showing "(2)" badge in purple
- Map view toggle icon

RESULTS HEADER:
- "Showing 24 results" text (gray, left)
- "Sort by: Distance ▼" dropdown (right)

SEARCH RESULTS (vertical list):
Create 3-4 salon result cards, each showing:
- Salon photo (left side, square, 100x100px, rounded corners)
- Salon details (right side):
  * Name (bold, 16sp)
  * ⭐ 4.5 rating (120 reviews)
  * "Hair, Nails, Spa" categories (gray, small)
  * "2.3 km • Open Now" (gray, small)
  * Price range "$$" (gray)
- Heart icon (top-right of card)
- Thin divider between cards

Cards: White background, no border, 16px padding, 8px margin between

LOADING STATE (bottom):
- Show loading spinner if more results

Background: Light gray (#F9FAFB)
Style: List-focused, easy to scan, clear hierarchy
```

---

### Screen 11: Search Screen (Empty State)

**Prompt for Uizard:**
```
Design the search screen before user types, showing search suggestions.

HEADER:
- Back arrow
- Empty search input "Search services, salons..."
- Filter and Map icons

RECENT SEARCHES section:
- "Recent Searches" heading (bold, 14sp)
- List of 3 recent items:
  * Clock icon + "Haircut near me" + [×] delete icon
  * Clock icon + "Best nail salon" + [×]
  * Clock icon + "Spa in Noida" + [×]
- "Clear All" link (purple, right-aligned)

POPULAR SEARCHES section:
- "Popular Searches" heading (bold, 14sp)
- List of 4 trending items:
  * Trending icon + "Bridal makeup"
  * Trending icon + "Men's grooming"
  * Trending icon + "Hair coloring"
  * Trending icon + "Deep tissue massage"

Each list item:
- 48px height
- Light gray background on tap
- 16px padding
- Divider lines

Background: White
Style: Helpful, organized, easy to navigate
```

---

### Screen 12: Map View

**Prompt for Uizard:**
```
Design a map view screen for discovering salons.

HEADER (overlay on map):
- [← List View] button (top-left, white rounded background)
- Location dropdown "Delhi NCR ▼" (top-center, white pill shape)

MAP AREA (full screen):
- Google Maps style interface
- Multiple purple pin markers scattered
- Blue dot for user's current location
- Purple circle showing search radius
- Some pins clustered with number badges (e.g., "5")

BOTTOM SHEET (draggable, partially visible):
- Drag handle bar (gray, centered, top)
- Selected salon card showing:
  * Salon image (horizontal, 16:9 ratio)
  * Salon name (bold)
  * ⭐ 4.5 rating • 2.3 km
  * "View Services" button (purple, rounded)
  * Heart icon (top-right of image)

FLOATING BUTTONS (on map):
- Current location button (bottom-right, white circle, crosshair icon)
- Filter button (top-right, white rounded square)

Style: Modern mapping interface, clear markers, easy interaction
Ensure map has good contrast with white UI elements
```

---

## Salon Profile & Booking Screens

### Screen 13: Salon Profile - Overview

**Prompt for Uizard:**
```
Design a salon profile screen with these sections scrolling vertically:

HERO SECTION (top):
- Full-width image gallery (swipeable, 16:9 ratio)
- Pagination dots (white, bottom-center of image)
- Back arrow (top-left, white on semi-transparent black circle)
- Heart and Share icons (top-right, white circles)

HEADER INFO:
- Salon name (bold, 20sp)
- ⭐ 4.5 (120 reviews) in gold/yellow
- Status badge: "Open Now • 10:00 AM - 8:00 PM" (green dot, gray text)
- Three action buttons in a row:
  * [📞 Call] 
  * [🧭 Directions]
  * [🌐 Website]
  Each: White background, border, icon + text, 32px height

ADDRESS SECTION:
- 📍 icon + "123 Main St, Sector 18, Noida"
- "2.3 km away" in gray
- "View on Map →" link in purple

OFFERS SECTION (if available):
- "🎁 Active Offers (2)" heading
- Purple gradient card showing:
  * "20% off on first booking"
  * "Free head massage with..."
- "View All Offers →" link

TAB BAR (sticky):
- Four tabs: [Services] [Staff] [About] [Reviews]
- Selected tab: Purple underline, bold text
- Unselected: Gray text

TAB CONTENT AREA:
- Show "Services" tab content with service categories and list
(This will be shown in detail in next screen)

STICKY FOOTER:
- Large purple button "Book Appointment" (full width, 56px height)
- Elevated shadow, always visible

Background: White
Card backgrounds: Light gray (#F9FAFB)
Style: Professional, trustworthy, detailed
```

---

### Screen 14: Salon Profile - Services Tab

**Prompt for Uizard:**
```
Design the Services tab content for salon profile.

SEARCH BAR (top):
- "Search services..." input with search icon
- Filter dropdown "All Categories ▼"

SERVICE CATEGORIES (scrollable):

Category 1: "Hair Services" (collapsible, expanded)
- Service cards (each):
  * Service name "Women's Haircut" (bold, 16sp)
  * Description "Wash, cut and blow dry" (gray, 13sp)
  * Duration & Price "45 min • ₹800" (bold, 14sp)
  * Purple "+ Add" button (right side, pill shape)
  * Thin divider below

Category 2: "Skin Care" (collapsed)
- Show collapsed state with right arrow icon

Category 3: "Nail Services" (collapsed)

Each category:
- Category name (bold, 15sp, left)
- Item count badge (gray circle, right)
- Expand/collapse arrow

Selected services (if any) show:
- Checkmark icon
- "Added" text in purple instead of "+ Add" button

Background: White
Dividers: Light gray between services
Style: Organized, scannable, easy selection
```

---

### Screen 15: Salon Profile - Staff Tab

**Prompt for Uizard:**
```
Design the Staff tab showing salon team members.

HEADER TEXT:
- "Our Team" (bold, 16sp)
- "Choose your preferred stylist" (gray, 13sp)

STAFF CARDS (vertical list):
Each card contains:
- LEFT: Circular profile photo (64x64px)
- RIGHT (stacked):
  * Name "Priya Sharma" (bold, 16sp)
  * Role "Senior Stylist" (gray, 13sp)
  * Specialties "Hair, Makeup, Nails" (purple text, 12sp)
  * Rating "⭐ 4.8 (45 reviews)" (small)
  * Experience "5 years experience" (gray, small)
  * "View Profile →" link (purple, 12sp)

Card styling:
- White background
- Light border or subtle shadow
- Rounded corners (12px)
- 16px padding
- 12px spacing between cards

Include 3-4 staff members
Some staff can have "Top Rated" or "Most Booked" badge (purple pill, top-right)

Background: Light gray (#F9FAFB)
Style: Professional, trustworthy, personable
```

---

### Screen 16: Salon Profile - Reviews Tab

**Prompt for Uizard:**
```
Design the Reviews tab for salon profile.

RATING SUMMARY (top card):
- Large rating "4.5" (bold, 32sp)
- Star icons (5 stars, 4.5 filled)
- "Based on 120 reviews" (gray, 14sp)
- Rating breakdown:
  * 5 stars ⭐⭐⭐⭐⭐ [████████░░] 75 reviews
  * 4 stars ⭐⭐⭐⭐   [████░░░░░░] 30 reviews
  * 3 stars ⭐⭐⭐     [██░░░░░░░░] 10 reviews
  * 2 stars ⭐⭐       [█░░░░░░░░░] 5 reviews
  * 1 star  ⭐         [░░░░░░░░░░] 0 reviews

FILTER/SORT:
- "Most Recent ▼" dropdown (right side)
- "All Ratings ▼" filter (left side)

REVIEWS LIST (scrollable):
Each review card shows:
- TOP ROW: Circular user avatar (40px) + Name "Aarti Kumar" (bold)
- Star rating ⭐⭐⭐⭐⭐ + Date "2 days ago" (gray, right)
- Review text (2-3 lines, expandable)
- If review has images: Small thumbnail gallery (3-4 images, rounded)
- Services: "Haircut, Massage" (gray, small text)
- "Helpful? 👍 12" interaction (bottom)
- Thin divider

Show 3-4 review cards

White background for cards
Light gray background overall
Style: Authentic, readable, social proof focused
```

---

### Screen 17: Service Selection (Booking Flow Step 1)

**Prompt for Uizard:**
```
Design the first step of booking flow - service selection.

HEADER:
- Back arrow (left)
- "Select Services" title (center, bold)
- "1/4" step indicator (right, gray)

PROGRESS BAR:
- Thin purple bar showing 25% complete
- Four dots below: filled, empty, empty, empty

SELECTED SALON INFO (compact card):
- Salon thumbnail image (left, 48x48px, rounded)
- Salon name + rating (right)

SEARCH SERVICES:
- Search input "Search for services..."
- Filter icon (right)

SERVICE CATEGORIES (tabs):
- Horizontal scroll: [All] [Hair] [Nails] [Skin] [Spa]
- Selected tab: Purple background, white text

SERVICE LIST (scrollable):
Show 5-6 services, each card containing:
- LEFT: Small service icon or image (48x48px, rounded square)
- MIDDLE:
  * Service name (bold, 15sp)
  * Duration + Price "45 min • ₹800" (gray, 13sp)
- RIGHT: 
  * Checkbox (empty or checked with purple fill)
  * If checked, show quantity selector [- 1 +]

SELECTED SERVICES SUMMARY (sticky bottom):
- White card above footer
- "2 services selected • ₹1,600" (left)
- "Continue →" link (purple, right)

FOOTER BUTTON:
- Purple "Continue" button (full width, disabled if no selection)

Background: Light gray
Style: Clear selection state, easy to browse
```

---

### Screen 18: Date & Time Selection (Booking Flow Step 2)

**Prompt for Uizard:**
```
Design step 2 of booking - date and time selection.

HEADER:
- Back arrow
- "Select Date & Time" title
- "2/4" step indicator

PROGRESS BAR:
- 50% complete (two dots filled)

CALENDAR (monthly view):
- Month/Year header with < > navigation
- Week day labels (S M T W T F S)
- Date grid:
  * Available dates: White background
  * Selected date: Purple background, white text
  * Today: Purple outline
  * Past dates: Light gray, disabled
  * Dates with availability dots underneath

STAFF SELECTION (optional):
- "Select Staff Member" section
- Horizontal scroll of staff cards:
  * Small circular photo (48px)
  * Name below
  * Selected: Purple border
- "Any Available" option (default, selected)

TIME SLOTS (grid layout):
- "Available Times" heading
- Grid of time slots (3 columns):
  * Each slot: "10:00 AM", "10:30 AM", etc.
  * Available: White with border
  * Selected: Purple background
  * Booked: Light gray, disabled
  * Show 9-12 time slots

SELECTED SUMMARY (sticky bottom card):
- "📅 Nov 10, 2025 | 🕐 10:30 AM"
- Staff name if selected
- "Change" link (purple)

FOOTER:
- Purple "Continue" button

Background: White
Style: Calendar-focused, clear availability
```

---

### Screen 19: Review Booking (Booking Flow Step 3)

**Prompt for Uizard:**
```
Design step 3 of booking - review before confirmation.

HEADER:
- Back arrow
- "Review Booking" title
- "3/4" step indicator

PROGRESS BAR:
- 75% complete

SALON SECTION:
- Salon thumbnail + name + address
- "📞 Call" and "🧭 Directions" links

APPOINTMENT DETAILS CARD:
- 📅 Date: November 10, 2025
- 🕐 Time: 10:30 AM - 11:15 AM
- 👤 Staff: Priya Sharma (with small avatar)
- "Change" link for each (purple, right-aligned)

SERVICES CARD:
- "Your Services" heading
- List each service:
  * Service name
  * Duration • Price
  * [- 1 +] quantity selector (if applicable)
  * Remove icon (×)
- "+ Add More Services" link (purple)

SPECIAL REQUESTS (optional):
- Collapsible section
- "Add special requests or notes" placeholder
- Text area (3 lines)

PRICING BREAKDOWN CARD:
- Subtotal: ₹1,600
- GST (18%): ₹288
- Discount (if any): -₹200 (green)
- Divider line
- Total: ₹1,688 (bold, large)

OFFER/COUPON SECTION:
- "🎁 Apply Coupon" button (border, not filled)

FOOTER:
- Large purple "Proceed to Payment" button

Background: Light gray
Cards: White with subtle shadow
Style: Clear summary, reviewable, trustworthy
```

---

### Screen 20: Payment Selection (Booking Flow Step 4)

**Prompt for Uizard:**
```
Design the payment method selection screen.

HEADER:
- Back arrow
- "Payment" title
- "4/4" step indicator

PROGRESS BAR:
- 100% complete (all dots filled)

ORDER SUMMARY (collapsed card):
- "Order Summary ▼" (expandable)
- Shows: "2 services • ₹1,688"
- When expanded: Shows service list and pricing breakdown

PAYMENT METHODS:
Section 1: "Quick Payment"
- Card option 1: "💳 Pay with Wallet" 
  * Shows wallet balance "₹500 available"
  * Radio button (right)
- Card option 2: "Pay on Arrival"
  * "Pay at salon after service"
  * Radio button

Section 2: "Other Payment Methods"
- "Credit/Debit Card" option (+ icon)
- "UPI" option (+ icon)
- "Net Banking" option (+ icon)

Each payment option:
- White card
- Left: Payment icon/logo
- Center: Method name + description
- Right: Radio button or + icon
- 12px spacing between cards

WALLET/OFFER SECTION:
- "Use ₹200 from wallet" toggle switch
- Updated amount shown below

TERMS CHECKBOX:
- Small checkbox + "I agree to cancellation policy"

FOOTER:
- Total amount "₹1,688" (large, left)
- Purple "Pay & Confirm" button (right, wide)

Background: Light gray
Style: Secure-looking, clear options, trustworthy
```

---

### Screen 21: Booking Confirmation

**Prompt for Uizard:**
```
Design a booking confirmation success screen.

CENTER CONTENT (vertically centered):
- Large success icon (✓ in purple circle, 96px)
- "Booking Confirmed!" heading (bold, 24sp, center)
- "Your appointment has been scheduled" subtext (gray, 16sp)

BOOKING DETAILS CARD:
- Booking ID: #BK123456 (gray, top-right)
- Salon name (bold)
- Date & Time (with calendar and clock icons)
- Staff name (with small avatar)
- Services list (brief)
- Total amount paid (bold)

ACTION BUTTONS (stacked):
1. "View Booking Details" (purple filled, primary)
2. "Add to Calendar" (white with border, secondary)
3. "Get Directions" (white with border, secondary)

BOTTOM SECTION:
- "What's Next?" heading
- Timeline:
  ✓ Booking confirmed
  ⏱️ Reminder 1 hour before
  📍 Directions to salon
- "You'll receive SMS and app notification"

FOOTER:
- "Back to Home" text link (purple)

Add confetti or celebratory animation elements
Background: White with subtle purple gradient
Style: Celebratory, reassuring, clear next steps
```

---

## Profile & Account Screens

### Screen 22: Profile Screen (Main)

**Prompt for Uizard:**
```
Design a user profile screen.

HEADER SECTION:
- Large profile photo (96px circle, center)
- "+ Edit" button (small, bottom-right of photo)
- User name "Aarti Kumar" (bold, 20sp, center)
- Email "aarti@email.com" (gray, 14sp, center)
- Phone "+91 98765 43210" (gray, 14sp)

STATS ROW (3 columns):
- Column 1: "12" (bold) + "Bookings" (gray)
- Column 2: "₹2,500" (bold) + "Wallet" (gray)  
- Column 3: "8" (bold) + "Favorites" (gray)
Each centered, equal width

MENU SECTIONS:

"Account" section:
- Edit Profile (person icon + chevron right)
- Saved Addresses (location icon + chevron)
- Payment Methods (card icon + chevron)

"Preferences" section:
- Notifications (bell icon + toggle switch)
- Language (globe icon + "English" + chevron)
- Dark Mode (moon icon + toggle switch)

"Support" section:
- Help Center (question icon + chevron)
- Terms & Privacy (document icon + chevron)
- Rate App (star icon + chevron)

Each menu item:
- 56px height
- Icon (left, 24px, purple)
- Text (center-left, 15sp)
- Chevron or switch (right)
- Divider below

FOOTER:
- App version "v1.0.0" (center, gray, small)
- "Logout" button (red text, center)

Background: White
Style: Clean, organized, easy navigation
```

---

### Screen 23: Edit Profile Screen

**Prompt for Uizard:**
```
Design an edit profile form screen.

HEADER:
- Back arrow (left)
- "Edit Profile" title (center)
- "Save" button (right, purple text)

PROFILE PHOTO SECTION:
- Large circular photo (120px, center)
- Camera icon overlay (bottom-right, purple circle)
- "Tap to change photo" text below (gray, small)

FORM FIELDS (scrollable):
Each field with label above, input below:
1. First Name (pre-filled: "Aarti")
2. Last Name (pre-filled: "Kumar")
3. Email (pre-filled: "aarti@email.com")
4. Phone (pre-filled: "+91 98765 43210", disabled with lock icon)
5. Gender dropdown (Male/Female/Other)
6. Date of Birth (date picker)

Input fields:
- White background
- Light border
- Rounded (8px)
- 52px height
- Focus state: Purple border

DANGER ZONE:
- "Delete Account" button (red text, outlined in red)

FOOTER:
- Large purple "Save Changes" button

Background: White
Style: Form-focused, clear labels, accessible
```

---

### Screen 24: Wallet Screen

**Prompt for Uizard:**
```
Design a digital wallet screen for a salon booking app.

HEADER:
- Back arrow
- "My Wallet" title
- Reload icon (right)

BALANCE CARD (prominent):
- Purple gradient background
- "Available Balance" label (white, 14sp)
- "₹2,500" (large, white, 32sp, bold)
- Small wallet icon
- "Last updated: 2 min ago" (white, 12sp)

ACTION BUTTONS ROW:
- [+ Add Money] (purple filled)
- [↓ Withdraw] (white with border)

TRANSACTIONS SECTION:
- "Recent Transactions" heading
- Filter tabs: [All] [Credit] [Debit]

TRANSACTION LIST (scrollable):
Each transaction item:
- LEFT: 
  * Icon (credit: green ↓, debit: red ↑, 40px circle)
- CENTER:
  * Transaction title (bold, 15sp)
  * Date & time (gray, 12sp)
  * Transaction ID (very light gray, 11sp)
- RIGHT:
  * Amount "+ ₹500" (green for credit)
  * Or "- ₹300" (red for debit)
  * Status badge if pending (yellow pill)

Transaction types to show:
- Cashback received
- Refund credited
- Booking payment
- Money added
- Offer credit

Each item:
- White background
- 16px padding
- Divider below
- 72px height

EMPTY STATE (if no transactions):
- Wallet illustration
- "No transactions yet"
- "Your transaction history will appear here"

Background: Light gray (#F9FAFB)
Style: Financial, trustworthy, clear hierarchy
```

---

### Screen 25: Add Money to Wallet

**Prompt for Uizard:**
```
Design the "Add Money" screen for wallet top-up.

HEADER:
- Back arrow
- "Add Money" title

CURRENT BALANCE (small card):
- "Current Balance: ₹2,500" (gray background, center)

AMOUNT INPUT (large, centered):
- "₹" symbol prefix (large, gray)
- Amount input field (very large font, 36sp)
- Centered, minimal border
- Placeholder "0"

QUICK AMOUNTS (grid, 3x2):
- Buttons: ₹500, ₹1000, ₹2000
  ₹3000, ₹5000, ₹10000
- White background, purple border
- Selected: Purple filled
- 48px height each

BONUS/CASHBACK SECTION:
- "💰 Get extra 10% on ₹5000+" (green highlight card)

PAYMENT METHOD:
- "Payment Method" label
- Selected method card showing:
  * Payment icon
  * Method name "UPI"
  * "Change" link (purple)

FOOTER:
- Total "₹5,500" (large, left)
- Purple "Proceed to Pay" button (right)

Background: White
Style: Number-focused, clear, simple
```

---

### Screen 26: Saved Addresses

**Prompt for Uizard:**
```
Design a saved addresses management screen.

HEADER:
- Back arrow
- "Saved Addresses" title
- "+ Add New" button (right, purple text)

ADDRESS CARDS (vertical list):
Each card shows:
- TOP ROW:
  * Address type badge (Home/Work/Other - purple pill)
  * Edit icon (right)
  * Delete icon (right)
- Address line 1 (bold, 15sp)
- Address line 2 (gray, 13sp)
- City, PIN (gray, 13sp)
- "Set as Default" checkbox (if not default)
- "DEFAULT" badge (green, if default)

Show 2-3 address cards

Each card:
- White background
- Border (light gray)
- Rounded corners (12px)
- 16px padding
- 12px margin between

FLOATING ACTION BUTTON:
- Large purple circle (bottom-right)
- "+" icon (white)
- Adds new address

EMPTY STATE (if no addresses):
- Location pin illustration
- "No saved addresses"
- "Add your addresses for quick booking"
- "+ Add Address" button

Background: Light gray
Style: Organized, manageable, clear actions
```

---

## Booking Management Screens

### Screen 27: My Bookings (Tabs View)

**Prompt for Uizard:**
```
Design a bookings management screen with tabs.

HEADER:
- "My Bookings" title (bold, 20sp)
- Filter icon (right)

TAB BAR:
- Three tabs: [Upcoming] [Past] [Cancelled]
- Selected tab: Purple underline, bold
- Badge count on Upcoming tab (e.g., "3")

UPCOMING TAB CONTENT:

Show 2-3 booking cards, each containing:
- Status badge top-right (Confirmed - green pill)
- Date badge "Tomorrow" or "Nov 10" (gray pill)
- Salon thumbnail image (left, 80x80px, rounded)
- Booking details (right):
  * Salon name (bold, 16sp)
  * Services "Haircut, Massage" (gray, 13sp)
  * Time "10:30 AM - 11:15 AM" (with clock icon)
  * Staff "with Priya Sharma" (with person icon)
  * Price "₹1,688" (bold, purple)

Action buttons row (bottom of card):
- "View Details" (outlined)
- "Get Directions" (filled purple)

Card styling:
- White background
- Subtle shadow
- 16px padding
- 12px spacing between cards

SORT/FILTER BAR (top):
- "Sort by: Date ▼" (left)
- "This Month ▼" (right)

EMPTY STATE (if no bookings):
- Calendar illustration
- "No upcoming bookings"
- "Find salons near you"
- "Explore Salons" button (purple)

Background: Light gray
Style: Organized, scannable, action-oriented
```

---

### Screen 28: Booking Details (Upcoming)

**Prompt for Uizard:**
```
Design a detailed view of an upcoming booking.

HEADER:
- Back arrow
- "Booking Details" title
- Share icon (right)

STATUS BANNER:
- "Confirmed" with green background
- "Booking #BK123456" ID below

SALON SECTION (card):
- Salon photo (full width, 16:9)
- Salon name + rating
- Address with "Get Directions →" link
- Action buttons: [Call] [Website]

APPOINTMENT CARD:
- 📅 Date: November 10, 2025 (Tomorrow)
- 🕐 Time: 10:30 AM - 11:15 AM (45 min)
- 👤 Staff: Priya Sharma (with avatar)
- "Reschedule" button (outlined, purple)

SERVICES CARD:
- "Your Services" heading
- List of services:
  * Service name • Duration • Price
  * Service 2...
- Subtotal, GST, Discount breakdown
- Total (large, bold)

PAYMENT CARD:
- "Payment Status: Paid Online" (green checkmark)
- Payment method icon
- Transaction ID

SPECIAL REQUESTS (if any):
- Collapsible section
- Customer notes displayed

TIMELINE:
- ✓ Booking created - Nov 8, 10:30 AM
- ✓ Payment confirmed - Nov 8, 10:31 AM  
- ⏱️ Scheduled - Nov 10, 10:30 AM

ACTION BUTTONS:
- "Reschedule Appointment" (outlined)
- "Cancel Booking" (outlined, red text)

BOTTOM SHEET OPTIONS (on "⋮" menu):
- Add to Calendar
- Share booking
- Contact support

Background: Light gray
Cards: White, subtle shadow
Style: Detailed, informative, actionable
```

---

### Screen 29: Cancel Booking Confirmation

**Prompt for Uizard:**
```
Design a cancellation confirmation dialog/bottom sheet.

HEADER:
- Drag handle (if bottom sheet)
- Warning icon (⚠️ orange, large, center)
- "Cancel Booking?" heading (bold, 20sp)

MESSAGE:
- "Are you sure you want to cancel this booking?"
- Booking brief summary:
  * Salon name
  * Date & time
  * Total amount

CANCELLATION POLICY CARD:
- "Refund Policy" heading
- Icon-based breakdown:
  * ✓ "Full refund if cancelled 24h+ before"
  * ⚠️ "50% refund if cancelled 12-24h before"
  * ✗ "No refund if cancelled within 12h"
- Highlight applicable policy with color

REASON SELECTION (optional):
- "Reason for cancellation" dropdown
- Options: Change of plans, Found better salon, etc.

REFUND INFO:
- "Refund amount: ₹1,688" (green, bold)
- "Will be credited to your wallet in 3-5 days"

ACTION BUTTONS:
- "Keep Booking" (outlined, gray)
- "Yes, Cancel Booking" (filled, red)

Style: Warning but not scary, clear consequences
```

---

### Screen 30: Reschedule Booking

**Prompt for Uizard:**
```
Design a reschedule booking screen.

HEADER:
- Back arrow
- "Reschedule Appointment" title

CURRENT BOOKING CARD (gray background):
- "Current Appointment" label
- Date: Nov 10, 2025
- Time: 10:30 AM
- Staff: Priya Sharma
- "Change to new time" text

NEW DATE SELECTION:
- Mini calendar (similar to booking flow)
- Available dates highlighted
- Selected new date: Purple background

NEW TIME SELECTION:
- "Available Time Slots" heading
- Grid of available times
- Selected time: Purple background

STAFF PREFERENCE:
- "Keep same staff?" toggle (ON by default)
- If OFF: Show staff selection carousel

RESCHEDULE FEE (if applicable):
- Warning card
- "⚠️ Rescheduling fee: ₹100"
- "Will be charged to your wallet"

COMPARISON VIEW:
- Side by side:
  OLD: Nov 10, 10:30 AM
  →
  NEW: Nov 12, 2:00 PM

FOOTER:
- "Confirm Reschedule" button (purple, full width)
- "Terms apply" link

Background: White
Style: Clear before/after, easy to compare
```

---

## Payment & Wallet Screens

### Screen 31: Payment Processing

**Prompt for Uizard:**
```
Design a payment processing loading screen.

CENTER CONTENT (vertically centered):
- Animated payment processing icon (credit card with waves/sparkles)
- Large circular progress indicator (purple, rotating)
- "Processing Payment..." heading (bold, 18sp)
- "Please don't close the app" subtext (gray, 14sp)

PAYMENT DETAILS (below):
- "Paying to: [Salon Name]" (gray)
- "Amount: ₹1,688" (bold)
- "Transaction ID: TXN123456" (small, gray)

SECURITY BADGE:
- Small shield icon + "Secured by Razorpay" text
- Or payment gateway logo

WHAT'S NEXT (small text, bottom):
- "You'll receive confirmation once payment is complete"

Add subtle animation:
- Pulsing progress ring
- Dots animation in text
- Card icon animation

Background: White or very light purple
Style: Reassuring, professional, shows activity
No buttons (this is a loading state)
```

---

### Screen 32: Payment Success

**Prompt for Uizard:**
```
Design a payment success confirmation screen.

CENTER CONTENT:
- Large success animation (checkmark in purple circle, 120px)
- Confetti or sparkle animation
- "Payment Successful!" heading (bold, 24sp, green)
- "Your booking is confirmed" subtext (gray, 16sp)

PAYMENT RECEIPT CARD:
- "Receipt" heading with download icon
- Transaction details:
  * Transaction ID: TXN123456
  * Date & Time: Nov 8, 2025, 10:30 AM
  * Amount Paid: ₹1,688 (large, bold)
  * Payment Method: UPI / Credit Card (with icon)
  * Status: Success (green badge)

NEXT STEPS:
- "What's Next?" heading
- Icon list:
  ✓ Booking confirmed
  📧 Receipt sent to email
  🔔 Reminder before appointment
  📍 Directions on appointment day

ACTION BUTTONS (stacked):
- "View Booking" (purple filled, primary)
- "Download Receipt" (white with border)
- "Share Receipt" (white with border)

FOOTER:
- "Back to Home" text link (purple)

Add celebratory visual elements
Background: White with subtle green tint
Style: Celebratory, clear, informative
```

---

### Screen 33: Payment Failed

**Prompt for Uizard:**
```
Design a payment failure screen.

CENTER CONTENT:
- Error icon (✗ in red circle, 96px)
- "Payment Failed" heading (bold, 20sp, red)
- Error message "We couldn't process your payment" (gray, 15sp)

ERROR DETAILS CARD:
- Transaction ID (if available)
- Attempted amount: ₹1,688
- Payment method tried
- Error reason: "Insufficient funds" or "Card declined" (red text)

WHAT HAPPENED:
- "Why did this happen?" collapsible section
- Common reasons:
  * Insufficient balance
  * Card declined by bank
  * Network issue
  * Wrong details

YOUR BOOKING:
- "Don't worry, your booking is saved"
- "Complete payment to confirm booking"
- Shows booking details (salon, date, time)

ACTION BUTTONS (stacked):
- "Try Again" (purple filled, primary)
- "Try Different Method" (outlined)
- "Contact Support" (text link)

FOOTER:
- "Save for Later" text link
- "Go to Home" text link

Background: White
Style: Helpful, not alarming, provides solutions
```

---

## Additional Screens

### Screen 34: Notifications Screen

**Prompt for Uizard:**
```
Design a notifications center screen.

HEADER:
- Back arrow
- "Notifications" title
- "Mark all as read" text link (right, purple)

FILTER TABS:
- [All] [Bookings] [Offers] [Updates]

NOTIFICATIONS LIST (grouped by date):

"Today" section:
- Notification 1:
  * Left: Icon in colored circle (purple for booking, green for offer, blue for update)
  * Center: 
    - Title (bold, 15sp) "Booking Confirmed"
    - Message (gray, 13sp) "Your appointment at Glow Salon..."
    - Time "2 hours ago" (light gray, 11sp)
  * Right: Dot indicator (if unread, purple dot)
  * Tap area: Light gray background on press

- Notification 2:
  * Offer icon
  * "20% Off This Weekend!"
  * Message preview
  * "5 hours ago"

"Yesterday" section:
- 2-3 older notifications

"Earlier" section:
- Older notifications

Each notification:
- 80px height
- 16px padding
- Divider below
- Swipe left: Delete action (red)

EMPTY STATE (if no notifications):
- Bell illustration
- "No notifications yet"
- "We'll notify you about bookings and offers"

Background: White
Unread notifications: Slight purple tint background
Style: Organized by time, scannable, clear hierarchy
```

---

### Screen 35: Offers & Promotions

**Prompt for Uizard:**
```
Design an offers listing screen.

HEADER:
- Back arrow
- "Offers & Deals" title
- Filter icon (right)

FEATURED BANNER:
- Large promotional card (gradient background)
- "Limited Time Offer!" badge
- "Get 30% off on first booking"
- Code: "FIRST30" (dotted border box)
- Valid until date
- [Copy Code] button

FILTER CHIPS (horizontal scroll):
- [All Offers] [New Users] [Salons] [Services] [Wallet]
- Selected: Purple filled, others outlined

OFFERS GRID (2 columns):

Offer Card 1:
- Purple gradient background
- Offer badge "20% OFF"
- Title "Weekend Special"
- Description "Valid on all services"
- Code "WEEKEND20" (dotted box)
- Expiry "Valid till Nov 15"
- [Copy] button

Offer Card 2:
- Pink gradient background
- Offer badge "₹500 OFF"
- Title "Premium Package"
- Description "On orders above ₹2000"
- Code "PREMIUM500"
- [Copy] button

Each card:
- Rounded corners (16px)
- Gradient background (different colors)
- White text
- 12px padding
- 8px margin

Show 6-8 offer cards

TERMS LINK (bottom of each card):
- "Terms & Conditions" (small, underlined)

Background: Light gray
Style: Promotional, exciting, easy to scan and copy
```

---

### Screen 36: Favorites/Saved Salons

**Prompt for Uizard:**
```
Design a favorites/saved salons screen.

HEADER:
- Back arrow
- "Favorites" title  
- Heart icon (right, filled purple)

FILTER/SORT:
- "Sort by: Recently Added ▼" dropdown

FAVORITES LIST (vertical):

Each salon card:
- Salon image (left, 100x100px, rounded 12px)
- Details (right):
  * Salon name (bold, 16sp)
  * Categories "Hair, Nails, Spa" (gray, 12sp)
  * ⭐ 4.5 rating (120 reviews)
  * Distance "2.3 km away"
  * Status "Open Now" (green) or "Closed" (red)
- Filled heart icon (top-right of card, purple)
- [Book Now] button (bottom, purple, full width of detail section)

Card styling:
- White background
- Subtle shadow
- Rounded corners
- 16px padding
- 12px margin between

QUICK ACTIONS (on card press):
- View Details
- Remove from Favorites
- Share

EMPTY STATE (if no favorites):
- Heart outline illustration (large)
- "No favorites yet"
- "Save salons to quickly book them later"
- "Explore Salons" button (purple)

FOOTER SUGGESTION:
- "You might also like..." section
- Horizontal scroll of recommended salons

Background: Light gray
Style: Personal collection feel, quick access
```

---

### Screen 37: Help & Support

**Prompt for Uizard:**
```
Design a help and support screen.

HEADER:
- Back arrow
- "Help & Support" title

SEARCH BAR:
- "Search for help..." input
- Search icon

QUICK ACTIONS (cards, 2x2 grid):
- [📞 Call Support] - with phone number
- [💬 Chat with Us] - "Usually replies in 5min"
- [📧 Email Us] - "support@salonhub.com"
- [❓ FAQs] - "Find answers quickly"

Each quick action card:
- Icon (large, 48px)
- Title (bold)
- Description (small, gray)
- Purple background on tap

FAQ CATEGORIES:
- "Frequently Asked" heading

Expandable sections:
1. "Booking & Cancellations" (collapsed)
   - Expandable icon (chevron down)
2. "Payments & Refunds" (expanded, showing 3-4 questions)
   - Question 1: "How do I get a refund?"
   - Answer (gray text, indented)
   - Question 2: "Payment methods accepted?"
   - Answer...
3. "Account & Profile" (collapsed)
4. "Offers & Wallet" (collapsed)

CONTACT INFO CARD (bottom):
- "Still need help?" heading
- Phone: +91 1234567890
- Email: support@salonhub.com
- Hours: Mon-Sat, 9 AM - 6 PM

FEEDBACK SECTION:
- "Was this helpful?" 
- Thumbs up/down icons

Background: White
Style: Helpful, organized, accessible
```

---

### Screen 38: Filter & Sort (Bottom Sheet)

**Prompt for Uizard:**
```
Design a filter and sort bottom sheet modal.

HEADER:
- Drag handle (gray bar, center)
- "Filter & Sort" title (left)
- "Reset" button (right, purple text)
- Close × icon (top-right)

TABS:
- [Filters] [Sort]
- Selected tab underlined in purple

FILTERS TAB CONTENT (scrollable):

Section 1: "Distance"
- Slider from 0-10 km
- Current value shown: "Within 5 km"

Section 2: "Price Range"
- Dual handle slider
- "₹500 - ₹2000" shown

Section 3: "Rating"
- Star selection: ⭐ 4+ and above (checkbox)
- Options: 4+, 3+, 2+

Section 4: "Availability"
- "Open Now" (checkbox)
- "Available Today" (checkbox)
- "Weekend Available" (checkbox)

Section 5: "Categories"
- Checkboxes:
  ☑ Hair Services
  ☐ Nail Services
  ☐ Spa & Massage
  ☐ Skin Care
  ☐ Makeup

Section 6: "Offers"
- "Salons with offers" (toggle switch)
- "First booking discount" (toggle)

Each section:
- Clear label
- Appropriate input control
- 16px spacing

STICKY FOOTER:
- "Found 24 salons" text (left)
- "Apply Filters" button (purple, right, wide)

Background: White
Style: Organized, easy to select/deselect, clear results count
```

---

### Screen 39: Location Picker

**Prompt for Uizard:**
```
Design a location selection screen.

HEADER:
- Back arrow
- "Select Location" title
- Current location icon (right)

SEARCH BAR:
- "Search for area, landmark..." input
- Search icon left
- Maps marker icon right

CURRENT LOCATION (card):
- GPS icon (left, purple)
- "Use Current Location" (bold)
- "Sector 18, Noida" (gray)
- Chevron right
- Blue "CURRENT" badge

SAVED ADDRESSES:
- "Saved Addresses" heading

Address 1:
- Home icon + "Home" label (purple pill)
- Address text (gray)
- Distance "2.3 km from you"
- Chevron right

Address 2:
- Work icon + "Work" label
- Address text
- Chevron right

RECENT SEARCHES:
- "Recent Locations" heading

Location 1:
- Clock icon
- "Connaught Place, Delhi"
- Chevron right

Location 2:
- Clock icon
- "GK M Block Market"
- Chevron right

POPULAR AREAS:
- "Popular in Delhi NCR" heading
- Grid layout (2 columns):
  - "Saket"
  - "Hauz Khas"
  - "Dwarka"
  - "Greater Noida"

Each area: Pill button, purple border, tap to select

MAP PREVIEW (optional):
- Small map showing selected location
- Pin marker

Background: White
Style: Location-focused, quick selection, clear hierarchy
```

---

### Screen 40: Category/Service Deep Dive

**Prompt for Uizard:**
```
Design a category-specific screen (e.g., "Hair Services").

HEADER:
- Back arrow
- "Hair Services" title
- Search icon (right)

HERO BANNER:
- Category image/illustration
- "Hair Services" overlay text
- "150+ salons near you" subtext

FILTER BAR:
- "Price: All ▼"
- "Rating: 4+ ▼"
- "Distance: 5km ▼"
- Horizontal scroll

POPULAR SERVICES (pills):
- [Women's Haircut] [Men's Haircut] [Hair Color]
- [Keratin] [Hair Spa] [Hair Extensions]
- Selected: Purple filled

FEATURED SALONS:
- "Top Rated for Hair" heading
- Horizontal scroll of salon cards

ALL SALONS (list view):
Each salon card:
- Salon image (left, square)
- Name + rating
- "Specializes in Hair Services" badge
- Starting price "Hair services from ₹500"
- Distance + status
- [View Services] button

PROMOTED SECTION:
- "Sponsored" label (gray, small)
- 1-2 promoted salon cards
- Slightly different visual treatment (subtle badge)

TRENDING SEARCHES (bottom):
- "People also searched for:"
- Pills: Balayage, Ombre, Hair Smoothening

Background: Light gray
Style: Category-focused, service-oriented
```

---

### Screen 41: App Permissions Request

**Prompt for Uizard:**
```
Design permission request screens for first-time app usage.

LOCATION PERMISSION:

CENTER CONTENT:
- Large location pin icon (purple, 96px)
- "Enable Location" heading (bold, 20sp)
- "We use your location to show salons near you" description (gray, 15sp)
- "Your data is only stored on your device" privacy note (small, gray)

BENEFITS LIST:
- ✓ Find nearest salons
- ✓ Get accurate travel time
- ✓ Quick address selection

BUTTONS (stacked):
- "Allow Location" (purple filled, primary)
- "Not Now" (outlined, secondary)

---

NOTIFICATION PERMISSION:

CENTER CONTENT:
- Bell icon (purple, 96px)
- "Stay Updated" heading
- "Get notifications about your bookings and exclusive offers"

BENEFITS:
- ✓ Booking reminders
- ✓ Exclusive deals
- ✓ Status updates

BUTTONS:
- "Enable Notifications" (purple)
- "Maybe Later" (outlined)

---

Each permission screen:
- White background
- Centered content
- Clear icon
- Simple language
- Easy to skip
- Privacy-conscious messaging

Style: Non-intrusive, benefit-focused, trustworthy
```

---

### Screen 42: No Internet Connection

**Prompt for Uizard:**
```
Design an offline/no internet error state.

CENTER CONTENT (vertically centered):
- Offline cloud icon or disconnected wifi symbol (gray, 120px)
- "No Internet Connection" heading (bold, 20sp)
- "Check your connection and try again" message (gray, 15sp)

OFFLINE FEATURES (if any):
- "You can still:" heading (small)
- ✓ View saved bookings
- ✓ Browse favorites
- ✓ Access wallet balance

ACTION BUTTONS:
- "Try Again" (purple filled, primary)
- "View Offline Content" (outlined, secondary)

ANIMATION:
- Subtle animation on wifi icon (pulse or fade)

BOTTOM TEXT:
- "Having trouble? Check our Help Center" link

Use muted colors (grays)
No harsh reds
Helpful, not frustrating
Provide useful offline actions
Background: Light gray
```

---

### Screen 43: Loading States / Skeletons

**Prompt for Uizard:**
```
Design skeleton loading screens for main content areas.

HOME SCREEN SKELETON:
- Header bar (gray rectangle)
- Search bar (gray rounded rectangle, shimmer effect)
- Category pills (3-4 gray pill shapes, animated shimmer)
- Banner area (gray rectangle, 16:9 ratio)
- Salon cards (2x2 grid):
  * Each card: Image placeholder (gray rectangle)
  * Text lines (2-3 gray bars, varying widths)
  * Button placeholder (gray rounded rectangle)

SALON PROFILE SKELETON:
- Hero image area (full width gray rectangle, shimmer)
- Title area (gray bar, 60% width)
- Rating area (gray bar, 40% width)
- Tab bar (4 gray rectangles)
- Service list (3-4 rows of gray shapes)

BOOKING DETAILS SKELETON:
- Status banner (gray bar)
- Salon card (image + text placeholders)
- Detail sections (multiple gray blocks)

SHIMMER ANIMATION:
- Subtle left-to-right shimmer effect
- Light gray (#E0E0E0) to lighter gray (#F5F5F5)
- Smooth, continuous animation
- 1.5-2s duration

GENERAL RULES:
- Match actual content layout
- Rounded corners same as real components
- Shimmer effect for "loading" feel
- No text, just shapes
- Gray scale only

Style: Smooth, professional, non-jarring
```

---

### Screen 44: Error States

**Prompt for Uizard:**
```
Design various error state screens.

GENERAL ERROR:
- Error icon (triangle with ! - orange, 96px)
- "Oops! Something went wrong" heading
- "We're working to fix this" message
- "Try Again" button (purple)
- "Report Issue" text link
- Error code (small, gray, bottom)

404 / NOT FOUND:
- Confused person illustration or 404 graphic
- "Page Not Found" heading
- "The page you're looking for doesn't exist"
- "Go to Home" button
- "Search" button (outlined)

SERVER ERROR (500):
- Server/maintenance illustration
- "We're Having Technical Issues"
- "Our team is working on it"
- Estimated fix time (if known)
- "Retry" button
- "Contact Support" link

SEARCH NO RESULTS:
- Magnifying glass with "no results" icon
- "No Results Found"
- "Try different keywords or filters"
- "Clear Filters" button
- "Browse All Salons" button

BOOKING NOT FOUND:
- Calendar with question mark
- "Booking Not Found"
- "This booking may have been cancelled or doesn't exist"
- "View All Bookings" button
- "Contact Support" link

Each error screen:
- Friendly illustration
- Clear heading
- Helpful message
- Action button(s)
- Support option
- Not alarming colors

Background: White
Style: Friendly, helpful, not scary
```

---

## Implementation Notes for Uizard

### Using These Prompts

1. **One prompt per screen**: Copy each individual screen prompt into Uizard.io's AI designer
2. **Customize as needed**: Add specific brand colors, fonts, or modify layouts
3. **Component consistency**: Reference earlier screens for consistent button styles, card designs, etc.
4. **Mobile-first**: All designs are optimized for mobile (375x812px or similar)

### Design System Tokens to Apply

After generating screens in Uizard, apply these consistent tokens:

**Colors:**
```
Primary: #8B5CF6
Secondary: #EC4899
Background: #FFFFFF
Surface: #F9FAFB
Text: #111827
Text-secondary: #6B7280
Success: #10B981
Warning: #F59E0B
Error: #EF4444
```

**Typography:**
```
H1: 24sp, Bold
H2: 20sp, Bold  
H3: 18sp, Bold
Body: 15-16sp, Regular
Caption: 13sp, Regular
Small: 11-12sp, Regular
```

**Spacing:**
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
```

**Borders:**
```
radius-sm: 8px
radius-md: 12px
radius-lg: 16px
radius-full: 9999px
```

### Component Library to Build

Create reusable components in Uizard:
- Button (primary, secondary, outlined, text)
- Input field
- Card (salon card, info card, offer card)
- Chip/Pill
- Badge
- Bottom sheet
- Header bar
- Tab bar
- Navigation bar

### Export & Handoff

Once designs are complete:
1. Export as PNG/SVG for development reference
2. Generate design specs for developers
3. Create component library
4. Document interactions and animations
5. Specify responsive breakpoints if needed

---

## Screens Summary Checklist

### Authentication Flow (8 screens)
- [✓] Splash Screen
- [✓] Welcome Carousel (3 slides)
- [✓] Login/Signup Choice
- [✓] Phone Entry
- [✓] OTP Verification
- [✓] Profile Completion

### Discovery & Search (5 screens)
- [✓] Home Screen
- [✓] Search (Active)
- [✓] Search (Empty)
- [✓] Map View
- [✓] Category Deep Dive

### Salon & Booking (9 screens)
- [✓] Salon Profile
- [✓] Services Tab
- [✓] Staff Tab
- [✓] Reviews Tab
- [✓] Service Selection
- [✓] Date/Time Selection
- [✓] Review Booking
- [✓] Payment Selection
- [✓] Booking Confirmation

### User Account (6 screens)
- [✓] Profile Main
- [✓] Edit Profile
- [✓] Wallet
- [✓] Add Money
- [✓] Saved Addresses
- [✓] Notifications

### Booking Management (4 screens)
- [✓] My Bookings
- [✓] Booking Details
- [✓] Cancel Confirmation
- [✓] Reschedule

### Payments (3 screens)
- [✓] Payment Processing
- [✓] Payment Success
- [✓] Payment Failed

### Additional (10 screens)
- [✓] Offers & Promotions
- [✓] Favorites
- [✓] Help & Support
- [✓] Filter Bottom Sheet
- [✓] Location Picker
- [✓] Permissions
- [✓] No Internet
- [✓] Loading States
- [✓] Error States

### E-Commerce & Shopping (8 screens) ⭐ NEW
- [✓] Product Shop/Catalog
- [✓] Product Details
- [✓] Shopping Cart
- [✓] Wishlist
- [✓] Checkout (Multi-Step Flow)
- [✓] Order Confirmation
- [✓] Order Details
- [✓] Order History/My Orders

### AI-Powered Features (1 screen) ⭐ NEW
- [✓] AI Look Advisor (Virtual Try-On & Beauty Recommendations)

**Total: 53 screens defined** (44 original + 8 E-commerce + 1 AI Feature)

---

## E-Commerce & Shop Screens

### Screen 45: Product Shop/Catalog

**Prompt for Uizard:**
```
Design a product catalog/shop screen for browsing beauty products.

HEADER (sticky):
- Back arrow (left)
- "Shop Products" title (center)
- Cart icon with badge showing item count (right)
- Wishlist/heart icon

SEARCH & FILTERS:
- Search bar with icon: "Search products..."
- Filter button (shows active filter count badge)
- Sort dropdown "Sort: Featured ▼" (price-low, price-high, rating)

FILTER CHIPS (horizontal scroll):
- [All] [Hair Care] [Skin Care] [Makeup] [Fragrance]
- Selected: Purple background, white text
- Unselected: White with border

PRODUCT GRID (2 columns, scrollable):
Each product card shows:
- Product image (square, 1:1 ratio)
- Heart icon (top-right overlay) - filled if in wishlist
- Brand name (small, gray, uppercase)
- Product name (bold, 2 lines max, truncated)
- Star rating ⭐ 4.5 (small)
- Price display:
  * Current price "₹250" (bold, large)
  * Original price "₹350" (crossed out, gray) if discounted
  * Discount badge "28% OFF" (green pill, top-left)
- Stock status:
  * "In Stock" (green text)
  * "Low Stock" (orange with ⚠️ icon)
  * "Out of Stock" (red, grayed out card)
- "+ Add to Cart" button (purple, full width, rounded)
  * Or "Added ✓" if already in cart

Empty state (no products):
- Shopping bag icon (gray, 96px)
- "No products found"
- "Try different filters or search terms"
- "Clear Filters" button

Loading state:
- Skeleton cards (gray rectangles with shimmer)

Background: Light gray (#F9FAFB)
Cards: White, rounded (12px), subtle shadow
Style: Product-focused, clean grid, easy scanning
```

---

### Screen 46: Product Details

**Prompt for Uizard:**
```
Design a comprehensive product detail screen.

HEADER (overlay on image):
- Back arrow (left, white circle background)
- Share icon (right, white circle)
- Cart badge icon (far right)

PRODUCT IMAGE GALLERY:
- Full-width swipeable carousel
- Multiple product images
- Pagination dots (white, bottom-center)
- Zoom-in capability icon (bottom-right)

PRODUCT INFO SECTION:
BRAND & NAME:
- Brand name (small, gray, uppercase)
- Product name (bold, 20sp, 2-3 lines)
- Rating: ⭐ 4.5 (120 reviews) - tappable to scroll to reviews

PRICE SECTION:
- Current price "₹250" (bold, 28sp, purple)
- Original price "₹350" (crossed out, gray, 18sp)
- Discount "28% OFF" (green badge)
- You save: "₹100" (green text, small)

STOCK & DELIVERY:
- Stock status badge:
  * "In Stock" (green dot + text)
  * "Low Stock - Only 3 left!" (orange ⚠️)
  * "Out of Stock" (red)
- Delivery info: "📦 Delivery by Dec 25" (gray)
- Free delivery badge if eligible

VARIANT SELECTOR (if applicable):
- "Select Size" heading
- Size pills: [50ml] [100ml] [250ml]
- Selected: Purple filled, white text
- Price difference shown: "+₹50" or "-₹20"

QUANTITY SELECTOR:
- "Quantity" label
- [-] button, count "1", [+] button
- Styled with borders, 40px height
- Max quantity note: "Max 10 per order"

EXPANDABLE SECTIONS (accordion):
1. DESCRIPTION (expanded by default):
   - Full product description
   - Bullet points for key features
   - Ingredients list (if beauty product)
   - Usage instructions

2. SPECIFICATIONS:
   - Net weight/volume
   - Manufacturing date
   - Expiry date
   - Country of origin
   - Manufacturer details

3. REVIEWS & RATINGS (collapsed):
   - Rating summary bar (like salon reviews)
   - Review cards with:
     * User avatar + name
     * Star rating + date
     * Review text (expandable)
     * Review images (if any)
     * Verified purchase badge
   - "Write a Review" button

STICKY BOTTOM ACTIONS:
- Two-button layout:
  * [♡ Add to Wishlist] - outlined button (left)
  * [🛒 Add to Cart] - purple filled (right, larger)
- If out of stock: "Notify When Available" button

RELATED PRODUCTS (bottom):
- "You May Also Like" heading
- Horizontal scroll of 3-4 product cards
- Same format as catalog cards

Background: White
Cards: Light gray (#F9FAFB)
Style: Detailed, trustworthy, conversion-focused
```

---

### Screen 47: Shopping Cart

**Prompt for Uizard:**
```
Design a shopping cart screen showing cart items and pricing.

HEADER (sticky):
- Back arrow (left)
- "My Cart" title
- Cart item count "(3 items)"

CART ITEMS SECTION (scrollable):
Each cart item card shows:
- LEFT: Product image (80x80px, rounded, tap to view details)
- RIGHT:
  * Product name (bold, 2 lines max, truncated)
  * Variant info "Size: 100ml" (gray, small) if applicable
  * Price per unit "₹250" (gray, medium)
  * Quantity controls:
    - [-] button (outlined, 32x32px)
    - Quantity "2" (centered, bold)
    - [+] button (outlined, 32x32px)
  * Total price for item "₹500" (bold, right-aligned)
  * Remove icon 🗑️ (gray, top-right, tap to delete)
- Stock warning if low: "Only 2 left in stock" (orange, small)
- Unavailable items grayed out with "Out of Stock" badge

SEPARATOR between items (light gray line)

UNAVAILABLE ITEMS (if any):
- Separate section with heading "Unavailable Items (2)"
- Grayed out cards with:
  * "Out of Stock" badge (red)
  * "Remove" button (outlined, red text)

COUPON SECTION:
- Input field: "Enter coupon code"
- Apply button (purple, right side)
- If applied: Green checkmark + "SAVE20 applied" + Remove link
- Discount amount shown "-₹100" (green)

PRICE BREAKDOWN CARD:
- White card with subtle border
- Line items:
  * Subtotal (2 items): ₹650
  * Discount: -₹100 (green)
  * Delivery Charge: ₹50 (or "FREE" in green if >₹500)
  * Tax (GST 18%): ₹117
  * Divider line (bold)
  * Total Amount: ₹767 (bold, large, 20sp)
- All amounts right-aligned

STICKY FOOTER:
- Total amount summary:
  * "₹767" (bold, left)
  * Item count "(3 items)" (gray, small)
- "Proceed to Checkout →" button (purple, full width, 56px height)

EMPTY CART STATE:
- Shopping cart icon (gray, 120px)
- "Your cart is empty"
- "Looks like you haven't added any products yet"
- "Continue Shopping" button (purple, outlined)

Background: Light gray (#F9FAFB)
Cards: White, rounded, subtle shadow
Style: Clear pricing, easy quantity adjustment, trust-building
```

---

### Screen 48: Wishlist

**Prompt for Uizard:**
```
Design a wishlist/favorites screen for saved products.

HEADER:
- Back arrow (left)
- "My Wishlist" title
- Heart icon (right, filled purple)
- Item count badge "(5)"

WISHLIST GRID (2 columns):
Each wishlist item card shows:
- Product image (square, 1:1 ratio)
- Filled heart icon (top-right, purple, tap to remove)
- "OUT OF STOCK" overlay (gray, if applicable)
- Brand name (small, gray)
- Product name (bold, 2 lines max)
- Star rating ⭐ 4.5
- Price "₹250" (bold)
- Original price "₹350" (crossed out) if discount
- Stock status badge:
  * "In Stock" (green)
  * "Low Stock" (orange)
  * "Out of Stock" (gray)
- Action button:
  * "Add to Cart" (purple, full width) if in stock
  * "Notify Me" (outlined) if out of stock
  * "Already in Cart ✓" (gray) if added

QUICK ACTIONS (top):
- "Share Wishlist" button (outlined)
- "Move All to Cart" button (purple, if items in stock)

SORTING/FILTER:
- "Sort by: Date Added ▼" dropdown
- Filter: "In Stock Only" toggle

EMPTY WISHLIST STATE:
- Heart icon (gray, outline, 120px)
- "Your wishlist is empty"
- "Save products you love for later"
- "Start Shopping" button (purple)

REMOVE CONFIRMATION (bottom sheet):
- "Remove from wishlist?"
- Product image + name
- "Cancel" (outlined) and "Remove" (red) buttons

Background: Light gray
Cards: White, rounded, grid layout
Style: Organized, easy management, clear stock indicators
```

---

### Screen 49: Checkout (Multi-Step Flow)

**Prompt for Uizard:**
```
Design a multi-step checkout flow for completing orders.

HEADER (sticky):
- Back arrow (left)
- "Checkout" title (center)
- Step indicator "Step 2 of 4" (right, gray)

PROGRESS INDICATOR:
- Four dots with icons:
  * Step 1: 🚚 Delivery (filled purple)
  * Step 2: 📍 Address (current, purple outline)
  * Step 3: 💳 Payment (gray)
  * Step 4: ✓ Review (gray)
- Connecting lines between dots
- Current step: Larger circle, purple border
- Completed: Filled purple with checkmark
- Pending: Gray outline

---

STEP 1: DELIVERY METHOD
Card showing two options (radio buttons):

Option 1: HOME DELIVERY (selected by default)
- 🚚 Truck icon
- "Home Delivery" heading
- "Get it delivered to your doorstep"
- Estimated delivery: "3-5 business days"
- Delivery charge: "₹50" or "FREE above ₹500"

Option 2: STORE PICKUP
- 🏪 Store icon
- "Store Pickup"
- "Collect from salon"
- "Ready for pickup: Same day"
- "No delivery charges"

[Continue] button (purple, full width)

---

STEP 2: ADDRESS
If HOME DELIVERY selected:

SAVED ADDRESSES:
- "Select Delivery Address" heading
- Address cards (2-3):
  * LEFT: Home/Work icon + label badge
  * Name: "John Doe"
  * Address: "123 Main St, Sector 18, Noida - 201301"
  * Phone: "+91 98765 43210"
  * Radio button (right side)
  * [Edit] link (small, purple)
- "+ Add New Address" button (outlined, purple)

NEW ADDRESS FORM (if adding):
- Input fields (vertical stack):
  * Full Name*
  * Phone Number* (+91 prefix)
  * Address Line 1*
  * Address Line 2
  * City*
  * State* (dropdown)
  * PIN Code*
- "Save address for future" checkbox
- Label as: [Home] [Work] [Other] pills
- [Save & Continue] button (purple)

If STORE PICKUP selected:
- Salon details card:
  * Salon image (rounded)
  * Name + rating
  * Full address
  * Phone number
  * "View on Map" link
  * Operating hours
  * 📍 "2.3 km from you"

[Continue] button (purple)

---

STEP 3: PAYMENT METHOD
Cards showing payment options (radio selection):

Option 1: ONLINE PAYMENT (Razorpay)
- 💳 Card icon
- "Credit/Debit Card, UPI, Netbanking"
- "Secure payment via Razorpay"
- Card logos: Visa, Mastercard, RuPay

Option 2: UPI PAYMENT
- QR code icon
- "UPI (Google Pay, PhonePe, Paytm)"
- "Pay using UPI ID or QR code"

Option 3: CASH ON DELIVERY
- 💵 Cash icon
- "Cash on Delivery"
- "Pay when you receive"
- "₹10 handling fee" (gray note)

[Continue] button (purple)

---

STEP 4: ORDER REVIEW
ORDER SUMMARY CARD:
- Product items (mini cards):
  * Image thumbnail (48x48px)
  * Name + variant
  * Qty × Price
  * Subtotal
  (List 2-3 items, "+ 2 more items" if >3)

DELIVERY INFO:
- Delivery method icon + text
- If HOME: Full delivery address
- If PICKUP: Salon details
- Estimated delivery/pickup date

PAYMENT INFO:
- Payment method icon + name
- Last 4 digits if card (masked)

PRICE BREAKDOWN:
- Subtotal: ₹650
- Discount: -₹100 (green)
- Delivery: ₹50 or FREE
- Tax (18% GST): ₹117
- Divider
- TOTAL: ₹767 (bold, large, purple)

TERMS CHECKBOX:
- ☑ "I agree to Terms & Conditions and Privacy Policy"
- Links clickable

STICKY FOOTER:
- Total: "₹767" (bold, left)
- [Place Order] button (purple, large, full width)
- Lock icon + "Secure checkout" (gray, small, centered below)

PROCESSING STATE (after Place Order):
- Full-screen overlay with:
  * Loading spinner (purple)
  * "Processing your order..."
  * "Please don't close this page"

Background: Light gray
Cards: White, rounded, well-spaced
Style: Step-by-step, clear progress, trust elements
```

---

### Screen 50: Order Confirmation

**Prompt for Uizard:**
```
Design an order confirmation success screen.

CENTER CONTENT (vertically centered):
SUCCESS ANIMATION:
- Large checkmark icon (120px, green, animated)
- Circular green background with pulse animation
- Confetti or celebration particles (subtle)

HEADING:
- "Order Placed Successfully!" (bold, 24sp)
- "Thank you for your order!" (gray, 16sp)

ORDER SUMMARY CARD:
- Order number: "#ORD-2024-0125" (bold, centered)
  * Copy icon next to it
- Order date: "Dec 22, 2024, 3:45 PM"
- Total amount: "₹767" (bold, large, purple)

ORDER DETAILS:
- Small product thumbnails (horizontal row, max 3)
- "+ 2 more items" if applicable
- Delivery type badge:
  * "🚚 Home Delivery" or
  * "🏪 Store Pickup"
- Estimated delivery/pickup: "Dec 25, 2024"

COMMUNICATION NOTE:
- 📧 Icon + "Order confirmation sent to your email"
- 📱 Icon + "Track updates via SMS"

ACTION BUTTONS (stacked):
1. [View Order Details] (purple filled, full width)
2. [Continue Shopping] (outlined, full width)
3. [Download Invoice] (text link, purple)

WHAT'S NEXT SECTION:
- Timeline/steps preview:
  * ✓ Order Confirmed (green, completed)
  * → Processing (purple, current)
  * → Shipped
  * → Delivered

BOTTOM SECTION:
- "Need help?" text
- Customer support links:
  * 📧 Email support
  * 📞 Call support
  * 💬 Live chat

Background: White
Cards: Light gray, rounded
Style: Celebratory, reassuring, helpful
```

---

### Screen 51: Order Details

**Prompt for Uizard:**
```
Design a detailed order tracking and information screen.

HEADER (sticky):
- Back arrow (left)
- "Order Details" title
- Share icon (right)

ORDER STATUS CARD (top):
- Large status badge (centered):
  * "Processing" with spinning icon (orange)
  * "Shipped" with truck icon (blue)
  * "Delivered" with checkmark (green)
  * "Cancelled" with X icon (red)
- Order number: "#ORD-2024-0125"
- Order date: "Dec 22, 2024"
- Estimated delivery: "Dec 25, 2024" (bold, purple)

ORDER TRACKING TIMELINE (vertical):
- Step 1: ✓ Order Placed (green, completed)
  * "Dec 22, 3:45 PM"
  * "Your order has been confirmed"
  
- Step 2: ✓ Processing (green, completed)
  * "Dec 22, 4:30 PM"
  * "Items are being packed"
  
- Step 3: → Shipped (purple, current)
  * "Expected Dec 23"
  * "Out for delivery"
  * Tracking: "ABC123456789" (copy button)
  * Courier: "BlueDart Express"
  
- Step 4: ○ Delivered (gray, pending)
  * "Dec 25"

ORDER ITEMS SECTION:
- "Items Ordered (3)" heading
- Each item card:
  * Product image (left, 64x64px)
  * Product name (bold)
  * Variant (if any)
  * Quantity: "Qty: 2"
  * Price: "₹250 × 2 = ₹500"
  * Separator line

DELIVERY ADDRESS CARD:
- 📍 Icon
- "Delivery Address" heading
- Full address with:
  * Recipient name
  * Complete address
  * PIN code
  * Phone number

PAYMENT INFORMATION CARD:
- 💳 Icon
- "Payment Details" heading
- Payment method used
- Payment status badge:
  * "Paid" (green)
  * "Pending" (orange) if COD
  * "Failed" (red) if applicable

PRICE BREAKDOWN CARD:
- Subtotal: ₹650
- Discount: -₹100 (green)
- Delivery: ₹50
- Tax (GST 18%): ₹117
- Divider (bold)
- Total Paid: ₹767 (bold, large)

ACTION BUTTONS (if applicable):
- [Cancel Order] (outlined, red text) - if pending/confirmed
- [Download Invoice] (outlined, purple)
- [Reorder Items] (outlined, purple) - if delivered
- [Write Review] (purple filled) - if delivered

HELP SECTION:
- "Need Help?" heading
- Options:
  * 📧 Email support
  * 📞 Call customer care
  * 💬 Chat with us
  * "Report an issue" link

Background: Light gray
Cards: White, rounded, well-organized
Style: Informative, trackable, helpful
```

---

### Screen 52: Order History / My Orders

**Prompt for Uizard:**
```
Design an order history listing screen.

HEADER (sticky):
- Back arrow (left)
- "My Orders" title
- Filter icon (right)

TAB BAR (sticky below header):
- Tabs with counts:
  * [All (12)]
  * [Pending (2)]
  * [Shipped (3)]
  * [Delivered (6)]
  * [Cancelled (1)]
- Horizontal scroll if needed
- Selected tab: Purple underline + text
- Badge count in gray circles

FILTER & SORT (expandable):
- Date range selector
- "Sort by: Most Recent ▼" dropdown

ORDER LIST (scrollable):
Each order card shows:
- TOP ROW:
  * Order number "#ORD-2024-0125" (bold, left)
  * Status badge (right):
    - Pending: Orange pill
    - Shipped: Blue pill
    - Delivered: Green pill
    - Cancelled: Red pill
  * Date "Dec 22, 2024" (gray, small, below number)

- PRODUCT PREVIEW:
  * Row of small product thumbnails (3-4, 48x48px)
  * "+ 2 more" badge if >3 items

- BOTTOM ROW:
  * Total amount "₹767" (bold, left)
  * [View Details] button (outlined, small, right)
  * Chevron right icon

- Divider line between order cards

EACH ORDER CARD ACTIONS (swipe left to reveal):
- [Track] button (blue) - if shipped
- [Cancel] button (red) - if pending
- [Reorder] button (purple) - if delivered

EMPTY STATE (if no orders):
- Package box icon (gray, 120px)
- "No orders yet"
- "You haven't placed any orders yet"
- [Start Shopping] button (purple)

FILTER RESULTS (if filtered):
- "Showing 5 cancelled orders" (gray text)
- [Clear Filters] link (purple)

PAGINATION/LOAD MORE:
- Load more button at bottom
- Or infinite scroll with loading spinner

Background: Light gray
Cards: White, rounded, shadow on active
Style: Scannable, organized, status-focused
```

---

## AI-Powered Feature Screens

### Screen 53: AI Look Advisor (Virtual Try-On & Beauty Recommendations)

**Prompt for Uizard:**
```
Design a multi-step AI-powered beauty advisor screen with virtual makeup try-on.

HEADER (sticky):
- Back arrow (left)
- "AI Look Advisor" title with sparkles ✨ icon
- History icon (right) - view past sessions

---

STEP 1: CUSTOMER INTAKE FORM

INTRO SECTION:
- Large sparkles icon (purple, 80px)
- "Get Your Perfect Look" heading (bold, 24sp)
- "AI-powered beauty recommendations tailored for you" description

PHOTO UPLOAD:
- Large upload area with dashed border (purple)
- Camera icon + "Upload Your Photo" label
- "Take Photo" and "Choose from Gallery" buttons
- Preview of selected photo (rounded, 200x200px)
- "Clear Photo" link if photo selected

EVENT & CONTEXT INPUTS:
- "Event Type" dropdown:
  * Wedding
  * Party
  * Date Night
  * Professional Meeting
  * Casual Outing
  * Festival
  * Other

- "Weather" selector (pills):
  * [☀️ Sunny] [☁️ Cloudy] [🌧️ Rainy] [❄️ Cold]

- "Location" input field:
  * "e.g., Delhi, Mumbai, Bangalore"
  * Location icon + autocomplete

OPTIONAL INPUTS (collapsible):
- "Skin Tone" selector
- "Hair Type" selector
- "Preferred Style" checkboxes

[Get AI Recommendations] button (purple, large, full width)
- Disabled until photo uploaded

---

STEP 2: AI ANALYSIS LOADING

CENTER CONTENT (animated):
- Large animated AI brain/sparkles icon (120px)
- Progress indicator (0% → 100%)
- Loading message that changes:
  * "Analyzing your features..." (0-30%)
  * "Finding perfect looks for you..." (30-60%)
  * "Generating recommendations..." (60-90%)
  * "Almost ready..." (90-100%)

PROCESSING STEPS (vertical checklist):
- ✓ Photo uploaded (green, completed)
- ⟳ Analyzing skin tone (purple, current, spinning)
- ○ Finding matching looks (gray, pending)
- ○ Generating product list (gray, pending)

"This may take 15-20 seconds" note (gray, small)

---

STEP 3: LOOK OPTIONS CAROUSEL

TOP SECTION:
- Customer's original photo (left, 80x80px, rounded)
- "3 Perfect Looks for [Name]" heading
- Event badge: "Wedding Look" (purple pill)

SWIPEABLE CAROUSEL:
Each look card shows:
- Look name: "Radiant Bridal Glow" (bold, 20sp)
- Confidence score: "95% Match" (green badge)
- Description: "Soft, dewy makeup with natural tones perfect for your complexion"
- Preview image: Customer photo with makeup applied (if available)
- Key features (bullet points):
  * Natural foundation
  * Soft pink blush
  * Gold eyeshadow
  * Nude lipstick

CAROUSEL INDICATORS:
- Dots at bottom (purple filled for current)
- Swipe left/right arrows
- "Look 1 of 3" text

ACTION BUTTONS (for each look):
- [👁️ Try This Look] (purple, full width)
- [View Products Needed] (outlined)

---

STEP 4: VIRTUAL TRY-ON VIEW

FULL-SCREEN PHOTO VIEW:
- Customer photo with selected makeup look applied
- Zoom controls (pinch to zoom, expand icon)
- Toggle switch: "Before / After" slider
  * Drag slider to compare original vs makeup

LOOK DETAILS CARD (bottom sheet, 40% height):
- Look name + confidence score
- "How it looks on you" heading
- Feature breakdown:
  * Foundation: "Light beige, dewy finish"
  * Eyes: "Gold shimmer, winged liner"
  * Lips: "Nude pink matte"
  * Cheeks: "Coral blush, subtle highlight"

ALTERNATIVE HAIRSTYLES (if available):
- "Try Different Hairstyles" heading
- Horizontal scroll of hairstyle options:
  * Each thumbnail: Different hairstyle applied
  * Tap to preview
  * Style names: "Beach Waves", "Sleek Updo", "Curly Bun"

ACTION BUTTONS (sticky footer):
- [♡ Save This Look] (outlined, left)
- [View Products →] (purple filled, right)

---

STEP 5: PRODUCT CHECKLIST

PRODUCTS NEEDED SECTION:
- "Products for [Look Name]" heading
- Total items: "8 products" (gray)
- Estimated cost: "₹2,450" (bold)

PRODUCT LIST (grouped by category):

FACE PRODUCTS:
- Foundation (checkbox):
  * Product image (48x48px)
  * Brand + Name: "Maybelline Fit Me Foundation"
  * Shade: "Natural Beige"
  * Price: "₹499"
  * Stock: "In Stock" (green)
  * [Add to Cart] button

- Concealer (checkbox):
  * Similar format

EYES PRODUCTS:
- Eyeshadow palette
- Eyeliner
- Mascara

LIPS PRODUCTS:
- Lipstick
- Lip liner (optional)

CHEEKS PRODUCTS:
- Blush
- Highlighter

FILTERS/ACTIONS (top):
- "Select All" checkbox
- Filter: "In Stock Only" toggle
- Sort: "By Price ▼"

STICKY FOOTER:
- Items selected: "5 of 8 selected"
- Total: "₹1,850"
- [Add Selected to Cart] button (purple, full width)
- "Book appointment to apply this look" link

---

STEP 6: SESSION HISTORY (separate view)

LIST OF PAST SESSIONS:
Each history card shows:
- Session date: "Dec 22, 2024"
- Event type badge: "Wedding"
- Before/After thumbnail images (side by side)
- Selected look name
- Product count: "8 products used"
- [View Details] button
- [Reorder Products] button (outlined)

EMPTY HISTORY:
- Clock/history icon (gray, 96px)
- "No sessions yet"
- "Your AI look sessions will appear here"

FILTERS:
- "All Events ▼" dropdown
- Date range selector

---

DESIGN TOKENS:
Background: White
Accent: Purple (#8B5CF6)
Success: Green (#10B981)
Cards: Light gray (#F9FAFB), rounded
Confidence badges: Green (90%+), Blue (75-89%), Orange (60-74%)
Animations: Smooth transitions, fade-ins
Style: Modern, AI-powered, beauty-focused, interactive
```

---

## Event Management Screens (9 screens)

### Screen 54: Events Browse & Discover

**Prompt for Uizard:**
```
Design an engaging events discovery screen with excellent UX for browsing beauty & wellness events.

HEADER (fixed, with shadow):
- "Events" title (left, bold, 24sp)
- Search icon (right)
- Filter icon (right, shows active count badge if filters applied)
- Location selector: "Delhi NCR ▼" (small, gray, below title)

HERO SECTION - FEATURED EVENTS (top):
Full-width horizontal scrolling carousel
- Card size: 340px width × 200px height
- Auto-advance every 5 seconds
- Swipe gesture enabled
- Pagination dots below

Each featured card:
- Event cover image (full bleed, overlay gradient)
- "FEATURED" badge (top-left, gold)
- Event category pill: "Workshop" (top-right, semi-transparent)
- Content (bottom, white text):
  * Event title: "Bridal Makeup Masterclass" (bold, 18sp)
  * Salon name: "Glow Studio" with verified badge ✓
  * Date & time: "Dec 15 • 2:00 PM" (with calendar icon)
  * Price tag: "From ₹960" (highlighted, yellow background)
  * Filling fast indicator: "🔥 8/15 spots left" (if <50% capacity)
- CTA: "Register Now →" button (white outlined)
- Tap anywhere on card → Event details

QUICK FILTERS (horizontal scroll chips):
Sticky below header when scrolling
Chips with icon + text:
- "All Events" (selected: purple background, white text)
- "🎨 Workshops" 
- "✨ Product Launches"
- "💄 Seasonal Sales"
- "👯 Group Events"
- "⭐ Celebrity Events"
- "This Week" (calendar icon)
- "Free Events" (tag icon)
- "Near Me" (location icon)

Selection state:
- Selected: Purple (#8B5CF6) background, white text, bold
- Unselected: Light gray background, dark text
- Tap to toggle filter

SORT & VIEW OPTIONS ROW:
- Left: "156 events found" (gray, 14sp)
- Right controls:
  * Sort dropdown: "Newest First ▼"
    Options: Newest, Soonest, Price: Low to High, Most Popular, Nearest
  * View toggle: Grid icon / List icon (currently list)

EVENTS LIST (main content):
Vertical scrolling, pull-to-refresh enabled

Each event card (list view - default):
Card layout: White background, rounded 16px, shadow, 16px padding
Tap anywhere → Event details

LEFT SECTION (100px square):
- Event cover image (rounded 12px)
- Date badge overlay (top-right of image):
  * Month: "DEC" (uppercase, 10sp)
  * Day: "15" (large, bold, 24sp)
  * White background, purple text
- "Early Bird" label (if discount active, yellow ribbon)

RIGHT SECTION (flex, fills space):
Top row:
- Event title: "Bridal Makeup Masterclass" (bold, 16sp, 2 lines max)
- Category badge: "Workshop" (small, gray pill)

Salon info:
- Salon logo (24px circle) + Name: "Glow Studio" (14sp)
- Verified checkmark (blue)
- Rating: ⭐ 4.8 (12 reviews) - tappable

Details row (icons + text, gray, 12sp):
- 📅 "Dec 15 • 2:00 PM - 5:00 PM"
- 📍 "Sector 18, Noida" (location icon, tappable for map)
- 👥 "8 spots left" (person icon, orange if <50%)

Bottom row:
- Left: Price display
  * Original: "₹1,200" (strikethrough, small)
  * Current: "₹960" (large, bold, purple)
  * Savings: "Save 20%" (green pill)
- Right: "View Details →" button (purple, rounded)

SPECIAL INDICATORS (overlays on card):
- "🔥 Filling Fast" banner (orange) if <30% spots
- "⏰ Last 24h to Register" (red) if deadline soon
- "✨ New" badge (green) if created <7 days ago
- "♻️ Recurring" icon (blue) if recurring event

GRID VIEW (when toggled):
2 columns on mobile, 3 on tablet
Each card:
- Square event image (full width)
- Overlay gradient (bottom)
- Date badge (top-right)
- Title (2 lines, white text over gradient)
- Salon name (small, white)
- Price (bottom-left, yellow background)
- Spots indicator (bottom-right)
- Tap → Details

FLOATING CATEGORIES (appears on scroll):
Bottom-right floating button
- Purple circular button with "+" icon
- Tap opens bottom sheet with all categories
- Quick navigation

EMPTY STATES:

No Events Found:
- Search/filter icon (gray, 120px)
- "No events found"
- Suggestion: "Try different filters or check back later"
- [Clear Filters] button (if filters active)
- [View All Events] button

No Events in Location:
- Location pin icon (gray, 120px)
- "No events in your area yet"
- "We're expanding to new locations"
- [Change Location] button
- "Browse all events" link

SEARCH OVERLAY (when search icon tapped):
Full-screen modal with white background

Search bar (top):
- Large input field with search icon
- Placeholder: "Search workshops, salons, events..."
- Voice search icon (right)
- "Cancel" text button (right)

Recent Searches (if exists):
- Clock icon + "bridal makeup" (tap to search)
- Clock icon + "hair workshop" 
- "Clear history" link (right)

Trending Searches:
- 🔥 "Diwali makeup"
- 🔥 "Christmas spa"
- 🔥 "New Year party makeup"

Suggested Categories:
- Grid of category cards with icons
- Tap to filter by category

FILTER BOTTOM SHEET (when filter icon tapped):
Slides up from bottom, 80% screen height

Header:
- "Filters" title (left)
- "Clear All" (right, purple text)
- Drag handle (top center)

Filter Sections (scrollable):

1. EVENT TYPE (multi-select):
   Checkbox options:
   - ☐ Workshops & Classes (45)
   - ☐ Product Launches (12)
   - ☐ Seasonal Sales (8)
   - ☐ Group Events (23)
   - ☐ Celebrity Events (3)
   - ☐ Recurring Events (15)

2. DATE RANGE:
   - "Any time" (default, selected)
   - "Today"
   - "This weekend"
   - "This week"
   - "This month"
   - "Custom range" (opens date picker)

3. PRICE RANGE:
   Dual-handle slider:
   - Min: ₹0 - Max: ₹5,000
   - Current: ₹500 - ₹2,000
   - Free events toggle: "Show only free events"

4. LOCATION & DISTANCE:
   - Current: "Delhi NCR"
   - [Change Location] (opens map/autocomplete)
   - Distance slider: "Within 10 km"
   - Range: 1km - 50km

5. AVAILABILITY:
   Checkbox options:
   - ☐ Available spots (only events with seats)
   - ☐ Waitlist available
   - ☐ Early bird pricing active
   - ☐ Group discounts available

6. SKILL LEVEL (for workshops):
   Radio buttons:
   - ○ All levels
   - ○ Beginner
   - ○ Intermediate
   - ○ Advanced

7. RATING:
   Star selector:
   - "4+ stars" (selected)
   - "3+ stars"
   - "Any rating"

8. SALON FEATURES:
   Checkbox options:
   - ☐ Verified salons only
   - ☐ Highly rated (4.5+)
   - ☐ Certificate provided
   - ☐ Materials included

Sticky Footer (filter sheet):
- Results preview: "Showing 45 events"
- [Apply Filters] button (purple, full width)

BOTTOM NAVIGATION:
- Home tab
- Services tab
- Events tab (ACTIVE - purple)
- Orders tab
- Profile tab

PULL-TO-REFRESH:
- Swipe down gesture
- Loading spinner with text: "Checking for new events..."
- Success feedback

SCROLL BEHAVIOR:
- Infinite scroll: Load 20 events per page
- "Loading more..." indicator
- Smooth scroll to top button (appears after scrolling >2 screens)

PERFORMANCE UX:
- Skeleton loading for initial load (shimmer effect)
- Progressive image loading (blur to sharp)
- Optimistic UI updates
- Smooth 60fps scrolling

ACCESSIBILITY:
- High contrast mode support
- Screen reader labels
- Keyboard navigation ready
- Touch target min 48px
- Font scaling support

Background: Light gray (#F5F5F7)
Cards: White with subtle shadow
Active filters: Purple accent
Price: Bold, purple or green (discount)
Urgency: Orange/red indicators
Style: Clean, scannable, action-oriented, discovery-focused
```

---

### Screen 55: Event Details Page

**Prompt for Uizard:**
```
Design a comprehensive event details page with exceptional UX for informed decision-making.

HEADER (transparent initially, becomes solid on scroll):
- Back arrow (left)
- Share icon (right) - opens share sheet
- Wishlist heart icon (right) - tap to save event
- Three-dot menu (right):
  * Report Event
  * Block Salon
  * Get Help

HERO SECTION (full-width):
Image carousel:
- Main event cover image (full width, 400px height)
- Swipe for more images (gallery of 3-6 images)
- Pagination dots (bottom center)
- Zoom gesture enabled
- Auto-play disabled (user control)

Image overlay (bottom gradient):
- Event category badge: "Workshop" (top-left, white pill)
- "FEATURED" ribbon (top-right, gold) if featured
- Quick info chips (bottom):
  * "🔥 Filling Fast" (orange)
  * "⏰ 5 days left to register" (blue)

QUICK INFO BAR (sticky after scroll past hero):
Horizontal scroll chips:
- 📅 "Dec 15, 2PM"
- ⏱️ "3 hours"
- 📍 "4.2 km away"
- 👥 "8 spots left"
- ⭐ "4.8 rating"

MAIN CONTENT SECTION:

EVENT TITLE & SALON:
- Event title: "Bridal Makeup Masterclass" (bold, 24sp, 2 lines max)
- Hosted by (gray text):
  * Salon logo (32px circle)
  * "Glow Studio" (bold, 16sp)
  * Verified badge ✓ (blue)
  * [View Profile →] (purple link)

TRUST INDICATORS ROW:
- Rating: ⭐ 4.8/5.0 (small stars)
- Reviews: "Based on 156 reviews" (tappable)
- Past attendees: "1,200+ attended" (person icons)
- Success rate: "92% would attend again" (thumbs up)

EVENT META INFO GRID (2×2 cards):
Each card: Light purple background, icon, label, value

Card 1 - Date & Time:
- 📅 Icon
- "When"
- "Dec 15, 2024"
- "2:00 PM - 5:00 PM"
- [Add to Calendar] link (small)

Card 2 - Location:
- 📍 Icon
- "Where"
- "Glow Studio, Sector 18"
- "Noida, Delhi NCR - 201301"
- [Get Directions] link
- Distance: "4.2 km away"

Card 3 - Capacity:
- 👥 Icon
- "Attendees"
- "15 maximum"
- "8 spots remaining"
- Progress bar: 47% filled (orange)

Card 4 - Skill Level:
- 🎯 Icon
- "Level"
- "Intermediate"
- "Basic makeup knowledge helpful"

PRICING CARD (sticky on scroll, top of viewport):
Elevated white card with shadow, 16px border radius

Top section:
- Original price: "₹1,200" (gray, strikethrough, 16sp)
- Current price: "₹960" (purple, bold, 32sp)
- Discount badge: "20% OFF" (green pill, right)

Breakdown (expandable):
- Tap "Price Details ▼" to expand
- When expanded:
  * Base price: ₹1,200
  * Early bird discount: -₹240 (green)
  * Subtotal: ₹960
  * GST (18%): ₹172.80
  * Total: ₹1,132.80 (large, bold)

Discount timer (if early bird):
- ⏰ Icon
- "Early bird ends in:"
- Countdown: "4d 12h 35m" (red, updates live)

Additional savings (if applicable):
- "💳 Member discount: Extra 10% off"
- "👥 Group discount: 15% off for 3+ people"
- Tap to see conditions

Availability status:
- "✅ Available" (green) if >30% capacity
- "⚠️ Filling Fast - 8 left" (orange) if 10-30%
- "🔥 Almost Full - 3 left" (red) if <10%
- "⛔ Sold Out - Join Waitlist" (gray) if full

Primary CTA:
- [Register Now] button (purple, full width, 56px height, bold)
- Or [Join Waitlist] if sold out (orange)

Secondary actions (below CTA):
- "Free cancellation until Dec 8" (green checkmark, small)
- "Have a promo code?" (link, opens input)

TABS NAVIGATION (sticky):
Horizontal tabs with bottom border indicator:
- [Overview] (selected: purple underline)
- [What's Included]
- [Requirements]
- [Location]
- [Reviews]
- [FAQs]

Swipe gesture to change tabs
Smooth scroll to section on tap

---

TAB 1: OVERVIEW

ABOUT THE EVENT:
- Section heading: "About This Event" (bold, 20sp)
- Full description (rich text, formatted):
  * Paragraphs properly spaced
  * Bullet points for key highlights
  * Bold emphasis on important details
  * "Read More ▼" if >300 words (expandable)

KEY HIGHLIGHTS (icon + text list):
- ✓ Professional makeup kit included (worth ₹800)
- ✓ Certificate of completion
- ✓ Hands-on practice with guidance
- ✓ Product samples to take home (₹500 value)
- ✓ Tea, coffee & snacks provided
- ✓ Small group (max 15) for personal attention

INSTRUCTOR SECTION:
Card with image and bio:
- Profile photo (80px circle, left)
- Name: "Riya Kapoor" (bold, 18sp)
- Title: "Celebrity Makeup Artist" (gray)
- Credentials:
  * "12 years experience"
  * "Featured in Vogue, Elle"
  * "500+ workshops conducted"
- Social links: Instagram icon, YouTube icon
- [View Full Bio] expandable section:
  * Detailed background
  * Awards & recognition
  * Portfolio images (gallery)
  * Testimonials from past students

EVENT SCHEDULE (timeline):
Visual timeline with time markers:
- 2:00 PM: Registration & Welcome
  * "Arrive 10 mins early for check-in"
- 2:15 PM: Theory Session
  * "Bridal makeup trends & color theory"
- 3:00 PM: Hands-on Practice
  * "Work on your own face with guidance"
- 4:15 PM: Tea Break
  * "Networking with fellow attendees"
- 4:30 PM: Advanced Techniques
  * "Contouring, highlighting, finishing touches"
- 5:00 PM: Q&A & Certificate Distribution

---

TAB 2: WHAT'S INCLUDED

MATERIALS PROVIDED:
Grid layout, 2 columns:

Each item card:
- Icon/image (64px)
- Item name (bold)
- Description (small, gray)
- "Keep" or "Use only" label

Items:
1. 💄 Professional Makeup Kit
   - "Full kit worth ₹800"
   - "Yours to keep!"
   - Image of kit

2. 📜 Digital Certificate
   - "Completion certificate"
   - "Emailed within 24h"

3. 🎁 Product Samples
   - "₹500 worth samples"
   - "Try before you buy"

4. 📚 Workbook
   - "Step-by-step guide PDF"
   - "Downloadable"

5. ☕ Refreshments
   - "Tea, coffee, snacks"
   - "Veg & non-veg options"

6. 📸 Photos
   - "Professional photos of your work"
   - "Shared via WhatsApp group"

7. 💬 Community Access
   - "WhatsApp group for alumni"
   - "Lifetime support"

8. 🎟️ Future Discounts
   - "10% off next workshop"
   - "Valid for 6 months"

TOTAL VALUE:
- "Total value: ₹2,500+"
- "You pay: ₹960"
- "You save: ₹1,540!" (green, bold)

---

TAB 3: REQUIREMENTS

WHAT TO BRING:
Checklist format:
- ☑ Clean face (no makeup)
- ☑ Hair tied back
- ☑ Face wipes/tissues
- ☑ Notebook & pen (optional)
- ☑ Your own makeup brushes (optional - we provide too)

PREREQUISITES:
- Age requirement: "18 years and above"
- Skill level: "Basic makeup knowledge helpful but not required"
- Physical: "Must be comfortable standing for 2-3 hours"
- Health: "Please inform us of any skin allergies"

WHAT NOT TO BRING:
- ✗ Professional camera equipment
- ✗ Outside food/beverages
- ✗ Children (adult-only event)

DRESS CODE:
- "Comfortable clothing"
- "Avoid white tops (makeup stains)"
- "Hair should be accessible"

PARKING & ARRIVAL:
- "Free parking available (rear entrance)"
- "Arrive 10-15 minutes early for registration"
- "Late entry may not be permitted after 2:30 PM"

COVID-19 SAFETY (if applicable):
- "Mask optional"
- "Sanitizers provided"
- "Well-ventilated space"

---

TAB 4: LOCATION

MAP (interactive):
- Full-width embedded map (Google Maps/Mapbox)
- Salon pin marker (purple)
- "Your location" pin (blue)
- Route drawn between points
- Distance & ETA display: "4.2 km • 12 mins by car"

ADDRESS CARD:
- Full address (copyable):
  "Glow Studio
   B-402, Stellar Apartments
   Sector 18, Noida
   Uttar Pradesh - 201301"
- [Copy Address] button
- [Get Directions] button (opens maps app)
- [Call Salon] button (phone icon)

VENUE DETAILS:
- Floor: "4th Floor, Building B"
- Landmarks: "Near City Center Metro, opposite Galleria Mall"
- Parking: "Basement parking + street parking available"

NEARBY TRANSIT:
Icons + info:
- 🚇 Metro: "Noida City Center - 400m walk"
- 🚌 Bus: "Stop #42 - 200m"
- 🚗 Cab drop point: "Main entrance"

DISTANCE FROM YOU:
- Current location: "South Delhi"
- Distance: "4.2 km away"
- Travel time estimates:
  * 🚗 Car: 12 mins
  * 🚇 Metro: 25 mins
  * 🚌 Bus: 30 mins

VENUE PHOTOS:
Gallery of 3-4 images:
- Exterior building photo
- Event space interior
- Parking area
- Reception/entrance

---

TAB 5: REVIEWS

RATING SUMMARY:
Top card with overall stats:
- Large rating: "4.8" (bold, 64sp)
- Stars: ⭐⭐⭐⭐⭐ (visual)
- "Based on 156 reviews"
- "From past attendees of this event"

RATING BREAKDOWN (bar chart):
- 5 stars: ████████████████████ 130 reviews (83%)
- 4 stars: ████ 20 reviews (13%)
- 3 stars: █ 4 reviews (3%)
- 2 stars: ▌ 1 review (1%)
- 1 star: 1 review (1%)

Bars are proportional, purple fill
Tap bar to filter reviews

HIGHLIGHTS (tags):
Most mentioned positive aspects:
- "Excellent instructor" (45 mentions)
- "Great value" (38 mentions)
- "Well organized" (32 mentions)
- "Learned a lot" (29 mentions)

SORT & FILTER:
- Sort by: "Most Recent ▼"
  Options: Most Recent, Highest Rated, Lowest Rated, Most Helpful
- Filter: "All Ratings ▼", "Verified Only" toggle

REVIEW CARDS (list):
Each review card:

Header:
- Reviewer photo (48px circle) or initial
- Name: "Priya S." (bold)
- Verified badge: "✓ Verified Attendee" (green)
- Date: "2 weeks ago" (gray)

Rating:
- Stars: ⭐⭐⭐⭐⭐ (5.0)
- Event attended: "Dec 1, 2024" (small, gray)

Review content:
- Title: "Amazing workshop!" (bold, if provided)
- Text: Full review (expandable if >3 lines)
  "Had an incredible time learning bridal makeup techniques. Riya was patient and answered all questions. The makeup kit alone is worth the price!"
- "Read More ▼" if truncated

Review images (if uploaded):
- Horizontal scroll gallery
- 3-4 photos from event
- Tap to view full screen

Helpful counter:
- "Was this helpful?"
- 👍 Helpful (45) - tap to upvote
- Flag icon - tap to report

Salon response (if any):
- Salon logo + name
- "Thank you for attending! We're thrilled you enjoyed it. Hope to see you at our next workshop! 💜"
- Date: "1 week ago"

LOAD MORE:
- "Load More Reviews" button
- Or infinite scroll

WRITE REVIEW (only if attended):
- Floating button: "Write a Review"
- Opens review form

---

TAB 6: FAQs

SEARCH BAR:
- "Search questions..." input
- Real-time filter as you type

FREQUENTLY ASKED QUESTIONS:
Accordion/expandable sections:

Q1: "What if I need to cancel my registration?"
- ▼ Tap to expand
- Answer: "You can cancel up to 7 days before the event for a full refund. 3-7 days: 50% refund. Less than 3 days: No refund. See our full cancellation policy for details."

Q2: "Can I bring a friend who's not registered?"
- Answer: "Only registered attendees are allowed. However, your friend can register separately if spots are available. Group discounts apply for 3+ people!"

Q3: "Will I receive a certificate?"
- Answer: "Yes! All attendees receive a digital certificate of completion via email within 24 hours after the event."

Q4: "What if I'm a complete beginner?"
- Answer: "No worries! This workshop welcomes all skill levels. Our instructor adjusts the pace based on the group and provides individual attention."

Q5: "Can I take photos during the workshop?"
- Answer: "Absolutely! Feel free to document your learning. We'll also provide professional photos of your final look."

Q6: "Is parking available?"
- Answer: "Yes, free parking is available at the rear entrance (basement level). Street parking is also available nearby."

Q7: "What happens if the event is cancelled?"
- Answer: "In the rare case we need to cancel, you'll receive a full refund plus a ₹200 salon credit within 24 hours. We'll notify you via email and SMS."

Q8: "Can I get a refund if I'm sick?"
- Answer: "Medical emergencies are handled case-by-case. Please contact us with documentation, and we'll do our best to accommodate."

Q9: "Will lunch be provided?"
- Answer: "We provide tea, coffee, and snacks during the break. The event ends at 5 PM, so a full meal is not included."

Q10: "Can I reschedule to a different date?"
- Answer: "If this is a recurring event, we can transfer your registration to the next session (subject to availability). Contact us at least 3 days before."

STILL HAVE QUESTIONS?
- Card with contact options:
  * [Message Salon] (WhatsApp icon)
  * [Call Us] (phone icon)
  * [Email Support] (email icon)

---

SIMILAR EVENTS SECTION (bottom):
- "You Might Also Like" heading
- Horizontal scroll carousel
- 3-4 similar event cards
- Compact card format:
  * Small image (160x120px)
  * Title (2 lines)
  * Date, price
  * [View] button

BOTTOM CTA SECTION (sticky footer):
Always visible, elevated white bar with shadow

Left section:
- Price: "₹960" (bold, purple, 20sp)
- Was: "₹1,200" (small, strikethrough)
- Per person label (gray)

Right section:
- [Register Now] button (purple, bold, 48px height)
- Spots indicator: "8 left" (small, orange, below button)

Alternative states:
- If sold out: [Join Waitlist] (orange button)
- If already registered: [View My Ticket] (green button)
- If event passed: [View Next Event] (gray button)

TRUST BADGES (above sticky CTA):
Small icons with text:
- 🔒 Secure payment
- ↩️ Easy cancellation
- ✅ Verified salon
- 💯 100% refund guarantee

Background: White
Primary color: Purple (#8B5CF6)
Accent: Green (discounts), Orange (urgency)
Cards: Light gray background (#F9FAFB)
Shadows: Subtle, elevated feel
Typography: Clear hierarchy, readable
Style: Comprehensive, trustworthy, conversion-optimized
```

---

### Screen 56: Event Registration & Checkout

**Prompt for Uizard:**
```
Design a seamless multi-step checkout flow with excellent UX for event registration.

PROGRESS INDICATOR (top, sticky):
4-step horizontal stepper with connecting lines:
- Step 1: "Attendees" ● (filled circle, purple) - ACTIVE
- Step 2: "Details" ○ (empty circle, gray)
- Step 3: "Payment" ○
- Step 4: "Confirm" ○

Active step: Purple circle with checkmark when complete
Current step: Purple circle pulsing
Future steps: Gray empty circles
Connection lines: Purple for completed, gray for upcoming

HEADER:
- Back arrow (left)
- Event name: "Bridal Makeup..." (truncated, 14sp)
- Cancel (right, gray text) - shows exit confirmation

---

STEP 1: ATTENDEE DETAILS

EVENT SUMMARY CARD (top, collapsible):
Compact view by default:
- Event title + date
- "Tap to view details ▼"

When expanded:
- Event cover image (small, 60px height)
- Full title
- Date, time, duration
- Location
- [View Full Details] link

NUMBER OF TICKETS:
Large card with centered content:
- "How many tickets?" heading (20sp, bold)
- Ticket icon + number selector
- Current count: "1" (large, 48sp, bold)
- - and + buttons (48px, circle, purple border)
  * Minus: Disabled if count = 1
  * Plus: Disabled if count = available spots
- Available spots: "8 spots available" (gray, small)
- Group discount trigger: "Add 2 more for 15% off!" (green banner)

Price preview:
- Per ticket: "₹960 × 1"
- Subtotal: "₹960" (bold)
- Group discount: "-₹0" (grayed out, will update)

TICKET HOLDER INFORMATION:
Tabs for multiple tickets:
- [Ticket 1] (active, purple underline) - YOU
- [Ticket 2] (gray) - if selected
- Swipe to navigate between tickets

For primary ticket (yourself):
- "Your Details" heading
- Info pre-filled from profile:
  * Full name: "Priya Sharma" (editable)
  * Email: "priya@email.com"
  * Phone: "+91 98765 43210"
  * Age: "28" (dropdown: 18-80)
- Checkbox: "☑ I will be attending" (checked)
- If unchecked: "Who is this ticket for?" field appears

For additional tickets:
- "Ticket 2 Details" heading
- Full name input (required)
- Email input (required)
- Phone input (required)
- Age (dropdown)
- Relationship dropdown (optional):
  * Friend
  * Family member
  * Colleague
  * Partner
- "Quick fill from contacts" button

VALIDATION:
- Real-time validation as user types
- Email format check
- Phone number format (+91 required)
- Minimum age verification (18+)
- Required field indicators (red asterisk)
- Error messages below fields (red text)

[Continue to Details] button (bottom, sticky)
- Disabled (gray) until all fields valid
- Enabled (purple) when ready
- Shows loading spinner on tap

---

STEP 2: ADDITIONAL DETAILS

QUESTIONS FROM ORGANIZER (if any):
Form fields based on event requirements:

1. DIETARY RESTRICTIONS (if food included):
   - "Any dietary requirements?" label
   - Checkboxes:
     * ☐ Vegetarian
     * ☐ Vegan
     * ☐ Gluten-free
     * ☐ Nut allergy
     * ☐ Other (text field)

2. SPECIAL REQUIREMENTS:
   - "Any special needs or accommodations?" label
   - Textarea (optional)
   - Placeholder: "Wheelchair access, sign language interpreter, etc."
   - Character limit: 500

3. T-SHIRT SIZE (if merchandise):
   - "T-shirt size" label
   - Dropdown: XS, S, M, L, XL, XXL, XXXL

4. EMERGENCY CONTACT:
   - "Emergency contact name" (required)
   - "Emergency contact phone" (required)
   - Info text: "In case of any emergency during the event"

5. HOW DID YOU HEAR ABOUT US?
   - Dropdown (optional):
     * Instagram
     * Facebook
     * Google Search
     * Friend referral
     * Past event
     * Other

AGREEMENTS & CONSENT:
Checkboxes (all required):
- ☑ "I agree to the terms & conditions" (link to T&C)
- ☑ "I accept the cancellation policy" (link to policy)
- ☑ "I consent to event photography/videography"
  * Optional sub-checkbox: "☐ Please exclude me from photos"
- ☑ "I agree to receive event updates via email/SMS"

PROMO CODE SECTION (collapsible):
- "Have a promo code?" (link, expands section)
- When expanded:
  * Input field with "ENTER CODE" placeholder
  * [Apply] button
  * Validation messages:
    - Success: "✅ Code applied! ₹100 discount" (green)
    - Error: "❌ Invalid or expired code" (red)
    - Info: "This code cannot be combined with other offers" (orange)

[Continue to Payment] button (bottom, sticky)

---

STEP 3: PAYMENT

PRICE SUMMARY CARD (top):
Expandable/collapsible for space:

Collapsed view:
- "Total: ₹1,132.80" (large, bold)
- "Tap for breakdown ▼"

Expanded view:
- Base price: ₹1,200 × 1 = ₹1,200
- Early bird discount: -₹240 (green)
- Promo code (SAVE20): -₹100 (green)
- Group discount: ₹0 (gray)
- Subtotal: ₹860
- GST (18%): ₹154.80
- ──────────────────
- **Total: ₹1,014.80** (purple, bold, 24sp)

Savings highlight:
- "🎉 You're saving ₹340!" (green banner)

PAYMENT METHODS:
Section heading: "Choose Payment Method"
Large tappable cards:

Card 1: UPI (recommended badge):
- UPI icon (large, 48px)
- "Pay with UPI" (bold)
- "Google Pay, PhonePe, Paytm..." (gray)
- "Instant confirmation" (green text, small)
- Radio button (right)

Card 2: Cards:
- Credit/Debit card icon
- "Debit / Credit Card"
- "Visa, Mastercard, Amex, Rupay"
- Radio button

Card 3: Net Banking:
- Bank icon
- "Net Banking"
- "All major banks supported"
- Radio button

Card 4: Wallets:
- Wallet icon
- "Wallets"
- "Paytm, MobiKwik, Freecharge"
- Radio button

Card 5: Pay Later (if eligible):
- Clock icon
- "Pay Later" (new badge)
- "Buy now, pay in 14 days"
- "Eligibility check required" (small)
- Radio button

SELECTED PAYMENT DETAILS:
Expands when method selected

If UPI selected:
- "Enter UPI ID" input
- Placeholder: "yourname@upi"
- [Verify] button
- Or "Pay via QR code" option
- Or "Select UPI app" (GPay, PhonePe, Paytm icons)

If Card selected:
- Card number input (16 digits, auto-formatted)
- Name on card input
- Expiry (MM/YY) and CVV (side by side)
- "💳 Card details are encrypted and secure" (lock icon)
- [Save card for future] checkbox (optional)

If Net Banking selected:
- Bank dropdown (searchable)
- Popular banks shown first

If Wallet selected:
- Wallet selection (radio buttons)
- "You'll be redirected to complete payment"

SECURITY BADGES:
- 🔒 "256-bit SSL encryption"
- Razorpay logo: "Secured by Razorpay"
- "PCI DSS compliant"

CANCELLATION POLICY REMINDER:
Info card (blue background):
- ℹ️ Icon
- "Free cancellation until Dec 8"
- "Full refund if you cancel before the deadline"
- [View full policy] link

[Pay ₹1,014.80] button (bottom, sticky)
- Large, bold, purple
- Shows amount prominently
- Loading state: "Processing..."
- Success state: Green checkmark
- Error state: Red, "Retry Payment"

TRUST INDICATORS (above button):
- "🔒 100% secure payment"
- "↩️ Easy refunds"

---

STEP 4: CONFIRMATION (after payment)

SUCCESS ANIMATION:
- Large green checkmark animation (scale + fade in)
- Confetti animation (brief, 2 seconds)
- Success sound (optional, with permission)

CONFIRMATION MESSAGE:
- "🎉 Registration Confirmed!"
- "You're all set for the event!"

BOOKING REFERENCE CARD:
Large card, elevated, white background:
- "Booking Reference" label
- Reference number: "REG-EVT-2024-0125-001" (large, bold, monospace)
- [Copy] button (copies to clipboard)
- QR Code (200x200px, centered)
  * "Show this QR code for check-in"
  * Tap to enlarge full screen

EVENT SUMMARY:
Quick reference card:
- Event title with image thumbnail
- Date & time with calendar icon
- Location with map pin
- "1 ticket" (person icon)
- Total paid: "₹1,014.80" (bold)

QUICK ACTIONS (grid, 2×2):
Large tappable cards:

1. 📅 Add to Calendar:
   - Downloads .ics file
   - Opens native calendar picker
   - Auto-fills event details

2. 📍 Get Directions:
   - Opens maps app
   - Route from current location
   - Estimated travel time

3. 📱 View Ticket:
   - Opens full ticket view
   - Shows QR code prominently
   - Downloadable as PDF

4. 📤 Share Event:
   - Share with friends
   - "I'm attending!" message
   - Event link + image

WHAT'S NEXT? (timeline):
Visual timeline showing next steps:
- ✅ Registration confirmed (NOW)
  * "Confirmation email sent to priya@email.com"
- → 1 week before (Dec 8)
  * "You'll receive event reminder & preparation tips"
- → 1 day before (Dec 14)
  * "Final reminder with venue details"
- → 2 hours before (Dec 15, 12PM)
  * "Get ready notification with directions"
- → Event day (Dec 15, 2PM)
  * "Show QR code at check-in counter"

CONFIRMATION EMAIL SENT:
Info banner:
- "📧 Confirmation email sent to priya@email.com"
- "Check spam folder if not received in 5 mins"
- [Resend Email] link

SALON CONTACT:
Card with contact options:
- "Questions about the event?"
- Salon logo + name
- [💬 Chat] [📞 Call] [📧 Email] buttons

RELATED ACTIONS:
- "Invite friends to this event" (share icon)
- "Browse similar events" (search icon)
- "View event details again" (info icon)

PRIMARY CTA (bottom):
- [Done] button (purple, goes to "My Events")
- Alternative: [Back to Events] (outlined)

PAYMENT RECEIPT:
- "View receipt" link
- Opens detailed transaction:
  * Transaction ID
  * Payment method
  * Amount breakdown
  * Date & time
  * [Download PDF] button
  * [Email Receipt] button

Background: Light celebration gradient (subtle purple/white)
Success color: Green (#10B981)
Animations: Smooth, delightful
Icons: Large, clear
Style: Celebratory, confirmatory, action-enabling
```

---

### Screen 57: Registration Confirmation & Ticket

**Prompt for Uizard:**
```
Design a digital event ticket with excellent scanability and essential information.

HEADER:
- Back arrow (left) → Returns to Events list
- "My Ticket" title (center)
- Three-dot menu (right):
  * Download PDF
  * Add to Wallet (Apple/Google Pay)
  * Email Ticket
  * Report Issue

TICKET CARD (main content):
Large card mimicking physical ticket design
White background, subtle shadow, rounded corners (24px)

Top section (colored header - purple gradient):
- Event category: "WORKSHOP" (uppercase, white, small)
- Event title: "Bridal Makeup Masterclass" (white, bold, 24sp)
- Hosted by: "Glow Studio ✓" (white, 14sp)

Ticket tear/perforation line:
- Decorative dotted line separator
- Semi-circles on left & right edges
- Creates physical ticket aesthetic

Middle section (main ticket body):
QR CODE (center, prominent):
- Large QR code: 280x280px
- High contrast black/white
- Error correction: High level
- Contains: booking_reference + event_id + customer_id
- "Scan for check-in" label below
- Tap QR to view full-screen (for easy scanning)

BOOKING REFERENCE:
- Below QR code
- Large, bold, monospace font
- "REG-EVT-2024-0125-001"
- [Copy] icon button (right)
- "Save this reference" hint

EVENT DETAILS GRID (2 columns):
Icons + information:

Row 1:
- 📅 DATE:
  * "Saturday, December 15"
  * "2024"
- ⏰ TIME:
  * "2:00 PM - 5:00 PM"
  * "3 hours"

Row 2:
- 📍 LOCATION:
  * "Glow Studio, Sector 18"
  * "Noida - 201301"
  * [Directions →] link
- 👤 ATTENDEE:
  * "Priya Sharma"
  * "1 ticket"

Row 3:
- 💰 AMOUNT PAID:
  * "₹1,014.80"
  * "Paid via UPI"
- 🎟️ TICKET TYPE:
  * "Early Bird"
  * "General Admission"

STATUS INDICATOR:
Dynamic status banner:
- "✅ CONFIRMED" (green, if upcoming)
- "🔓 CHECK-IN READY" (blue, on event day)
- "✓ ATTENDED" (green, after check-in)
- "⏰ COMPLETED" (gray, after event)
- "❌ CANCELLED" (red, if cancelled)

Bottom section:
BARCODE (optional redundancy):
- Code 128 barcode
- Booking reference encoded
- Scannable backup if QR fails

---

IMPORTANT INFORMATION SECTION:

WHAT TO BRING:
Collapsible section (tap to expand)
- ☑ This ticket (digital or printed)
- ☑ Government ID (age verification)
- ☑ Clean face (no makeup)
- ☑ Hair tie
- ☑ Notebook (optional)

CHECK-IN INSTRUCTIONS:
- "Arrive 10-15 minutes early"
- "Show QR code at registration desk"
- "Download ticket offline (below) if no internet"

PARKING & VENUE:
- "Free parking at rear entrance"
- "4th Floor, Building B"
- "Near City Center Metro"

CANCELLATION POLICY:
- Current deadline: "Dec 8, 2024"
- Refund: "Full refund available"
- [Cancel Registration] button (red, outlined)

---

QUICK ACTIONS BAR (horizontal scroll):
Large icon buttons:

1. 📍 Get Directions:
   - Opens maps
   - Shows route
   - Travel time

2. 📅 Add to Calendar:
   - .ics download
   - Auto-adds to calendar
   - Sets reminders

3. 💾 Download Ticket:
   - PDF generation
   - Save to device
   - Print-friendly format

4. 📤 Share:
   - Share ticket details
   - "I'm attending!"
   - Invite friends

5. ☎️ Contact Salon:
   - Quick call button
   - WhatsApp option
   - Email option

6. 📧 Email Ticket:
   - Send to inbox
   - Send to friend
   - Backup copy

---

EVENT COUNTDOWN (if upcoming):
Prominent card:
- "Event starts in:"
- Large countdown timer
  * Days: 12
  * Hours: 15
  * Minutes: 30
  * Seconds: 45 (live updating)
- Changes to "Happening Now!" on event day

REMINDER SETTINGS:
- "Get reminded" section
- Toggle switches:
  * ☑ 1 week before
  * ☑ 1 day before
  * ☑ 2 hours before
  * ☑ When you're nearby (geofencing)

OFFLINE ACCESS:
Banner notification:
- "📥 Save for offline access"
- "Download ticket to view without internet"
- [Download] button
- Stored in device storage
- "✓ Available offline" when done

---

ATTENDEE INFORMATION:
If multiple tickets purchased:
- "Your group (3 tickets)" heading
- List of attendees:
  1. Priya Sharma (You) ✓
  2. Neha Gupta ✓
  3. Ritu Kapoor ✓
- [Manage Attendees] button
  * Edit attendee details
  * Transfer ticket to someone else
  * Cancel specific tickets

GROUP CHAT (if available):
- "Event community" card
- "Connect with other attendees"
- [Join WhatsApp Group] button
- Member count: "24 members"

---

VENUE MAP CARD:
- Static map image with pin
- Salon location highlighted
- "4.2 km from your location"
- [View Full Map] button
- Transit options shown

WEATHER FORECAST (on event day):
- Weather icon + temperature
- "22°C, Sunny"
- "Perfect day for your event!"
- Clothing suggestion if needed

TRANSACTION DETAILS:
Expandable section:
- Transaction ID: "txn_ABC123XYZ"
- Payment method: "UPI (priya@oksbi)"
- Date of booking: "Dec 1, 2024, 3:45 PM"
- Amount breakdown:
  * Base price: ₹1,200
  * Early bird: -₹240
  * Subtotal: ₹960
  * GST 18%: ₹172.80
  * Total: ₹1,132.80
  * Promo discount: -₹118
  * **Final paid: ₹1,014.80**
- [Download Receipt] button
- [Request Refund] button (if eligible)

---

HELP & SUPPORT:
Quick access card:
- "Need help?" heading
- FAQ button:
  * "What if I'm running late?"
  * "Can I bring a friend?"
  * "Refund policy?"
- [Contact Support] button
- Live chat icon (if available)

SIMILAR EVENTS (bottom):
- "You might also like" section
- Horizontal scroll
- 2-3 similar event cards
- Compact format with image, title, date, price
- [View Event] button

---

BOTTOM STICKY BAR:
Two-button layout:

If before event:
- [Cancel Registration] (red, outlined, left)
- [View Event Details] (purple, filled, right)

On event day:
- [Get Directions] (outlined)
- [Ready for Check-in] (purple, pulsing animation)

After event:
- [Download Certificate] (outlined)
- [Write Review] (purple)

---

SPECIAL STATES:

CANCELLED TICKET:
- Grayed out appearance
- Red "CANCELLED" watermark (diagonal)
- Cancellation date & time
- Refund status: "₹1,014.80 refunded to UPI"
- Refund ETA: "Credited in 5-7 days"
- [View Other Events] button

COMPLETED EVENT:
- "EVENT COMPLETED" badge (gold)
- "Thanks for attending!" message
- [Download Certificate] (if available)
- [Rate Event] (stars + text)
- [View Photos] (if organizer uploaded)
- [Rebook] (if recurring event)

NO INTERNET:
- Offline banner: "📵 No internet connection"
- QR code still visible (cached)
- "Ticket saved offline - you can still check in"
- Reduced functionality warning
- [Refresh] button

Background: Light gray (#F5F5F7)
Ticket card: White, elevated
QR code: High contrast, easily scannable
Status colors: Green (confirmed), Blue (active), Gray (past)
Icons: Clear, recognizable
Typography: Scannable from distance
Style: Ticket-like, official, trustworthy, functional
```

This screen is **production-ready** with:
- ✅ Large, scannable QR code (main check-in method)
- ✅ Backup barcode and reference number
- ✅ Offline functionality
- ✅ All essential information at a glance
- ✅ Quick actions for common needs
- ✅ Multiple state handling (upcoming, active, completed, cancelled)
- ✅ Accessibility-friendly high contrast

---

### Screen 58: My Events - Upcoming

**Prompt for Uizard:**
```
Design a user-friendly upcoming events list with quick actions and seamless navigation.

HEADER (sticky):
- "My Events" title (left, bold, 24sp)
- Search icon (right) - search my events
- Calendar icon (right) - opens calendar view

TABS (horizontal, sticky below header):
- [Upcoming] (ACTIVE - purple underline, bold)
- [Past] (gray)
- Badge count on Upcoming: "(3)" if >0

FILTER CHIPS (horizontal scroll, below tabs):
- "All Types ▼" (selected)
- "This Week"
- "This Month"
- Sort: "Soonest First ▼"

EVENT CARDS LIST (scrollable):
Each upcoming event card (larger, action-oriented):

CARD LAYOUT:
White background, rounded 20px, shadow, 20px padding

Top section:
- Event date badge (left, prominent):
  * Circle with gradient purple background (64px)
  * Month: "DEC" (white, uppercase, 12sp)
  * Day: "15" (white, bold, 28sp)
  * Weekday below: "Sat" (small, 10sp)

- Event info (right, fills space):
  * Category badge: "Workshop" (purple pill, top)
  * Event title: "Bridal Makeup Masterclass" (bold, 18sp, 2 lines max)
  * Salon: "Glow Studio ✓" (gray, 14sp)
  * Time: "2:00 PM - 5:00 PM" with clock icon (gray)
  * Location: "Sector 18, Noida" with pin icon (gray, tappable)

Status banner (if applicable):
- "Starts in 2 hours!" (blue banner, full width, 32px height)
- "Starting soon!" (green, pulsing) if <30 mins
- "Happening now!" (bright green, animated) if during event
- "Registration confirmed ✓" (default state)

Quick info row (icons):
- 🎟️ "1 ticket"
- 💰 "₹1,014.80 paid"
- 👥 "15 max attendees"

Action buttons row (bottom):
Two-button layout:

Primary actions (based on timing):
If >2 days away:
- [View Ticket] (outlined, left, purple border)
- [Get Directions] (outlined, right)

If <2 days away:
- [View Ticket] (filled, purple, left) - more prominent
- [Add to Calendar] (outlined, right) if not added

If today:
- [Show QR Code] (large, purple, full width OR left 60%)
  * Opens ticket screen
  * Animated pulse effect
- [Directions] (outlined, right 40%)

If happening now (<2 hours to start):
- [Check In Now →] (green, full width, large, 56px height)
  * Prominent, impossible to miss
  * Opens ticket with QR ready

Secondary actions (three-dot menu, top-right):
- Add to Calendar
- Share Event
- Contact Salon
- Invite Friends
- **Cancel Registration** (red text)

---

COUNTDOWN TIMER (for events <7 days):
Compact timer above card:
- "Event starts in: 2d 15h 30m" (purple text, medium size)
- Updates in real-time
- Changes to "Starts in 2 hours!" when <24h

---

REMINDERS SECTION (collapsible card):
"Upcoming Reminders" heading
Next reminder card:
- "📧 Final reminder will be sent"
- "Tomorrow at 2:00 PM"
- [Manage Reminders] link

---

EMPTY STATE (no upcoming events):
- Calendar icon with checkmark (gray, 140px)
- "No upcoming events"
- "Looks like you're all caught up!"
- Suggestions:
  * [Browse Events] button (purple)
  * "Discover workshops near you" subtitle

LOADING STATE:
- Skeleton cards (3-4 visible)
- Shimmer animation
- Event image placeholder
- Text line placeholders

PULL-TO-REFRESH:
- Swipe down from top
- "Checking for updates..." spinner
- Refresh event data

FLOATING ACTION BUTTON (bottom-right):
- Purple circle with "+" icon
- "Browse Events" tooltip
- Quick access to discovery

Background: Light gray (#F5F5F7)
Cards: White, elevated
Urgent states: Green/blue highlights
Actions: Clear, context-aware
Style: Action-oriented, time-aware, convenient
```

---

### Screen 59: My Events - Past

**Prompt for Uizard:**
```
Design a past events screen with review prompts and easy rebooking.

HEADER (sticky):
- "My Events" title
- Search icon
- Filter icon

TABS:
- [Upcoming] (gray)
- [Past] (ACTIVE - purple underline)

STATS SUMMARY (top card):
Light purple background, rounded, padding 20px:
- "Your Event Journey" heading (bold)
- Stats grid (3 columns):
  * Total attended: "12 events"
  * Hours learned: "36 hours"
  * Certificates: "8 earned"
- [View All Certificates] link

FILTER & SORT:
- "All Events ▼" dropdown
  * All Events
  * Attended
  * Missed (no-shows)
  * Cancelled
- "Most Recent ▼" sort
  * Most Recent
  * Oldest First
  * Highest Rated

PAST EVENT CARDS (list):
Each card (grayed/muted compared to upcoming):

Card layout:
White background, rounded 16px, shadow

Top section:
- Event image (left, 80px square, slightly desaturated)
- Date completed badge (overlay):
  * "✓ Attended" (green) OR
  * "✗ Missed" (red) OR
  * "⊘ Cancelled" (gray)

Event info (right):
- Event title (bold, 16sp)
- Salon name with checkmark
- Date attended: "Dec 1, 2024" (gray)
- Location (gray, small)

Status & Actions:
For ATTENDED events:
- Your rating: ⭐⭐⭐⭐⭐ 5.0 (if reviewed)
- OR "Rate this event →" (purple link, prominent)
- Certificate: "✓ Certificate earned" (green pill)
  * [Download PDF] button

For MISSED events:
- "No-show" status (red text)
- Reason (if provided)
- Rebook option (if recurring)

For CANCELLED events:
- "Cancelled on [date]"
- Refund status: "✓ ₹1,014.80 refunded" (green)

Action buttons:
- [View Details] (outlined)
- [Download Certificate] (if earned)
- [Rebook] (purple, if recurring event)
- [Write Review] (purple, if not reviewed)

Three-dot menu:
- View Receipt
- Share Experience
- Delete from History
- Report Issue

---

REVIEW PROMPTS (for unreviewed):
Highlighted card every 3rd event:
- "How was your experience?" (bold)
- Event thumbnail + title
- Quick rating: Tap stars (1-5)
- "Write Review" button
- "Skip" link (dismisses)

---

CERTIFICATES SECTION (if any earned):
Horizontal scroll gallery:
"Your Certificates" heading

Each certificate card:
- Certificate thumbnail (white background, decorative border)
- Event name
- Date earned
- [Download] icon
- [Share] icon
- Tap to preview full

---

REBOOK OPPORTUNITIES:
Section: "Events You Might Want to Attend Again"
Horizontal scroll of recurring/similar events:
- Event image
- "Next session: Dec 22" (date)
- [Register] button

---

YEAR IN REVIEW (December or yearly summary):
Special card (gradient background, festive):
- "Your 2024 in Events! 🎉"
- Highlights:
  * "12 events attended"
  * "Most attended category: Makeup Workshops"
  * "Favorite salon: Glow Studio"
  * "Total learning hours: 36"
- [View Full Report] button
- [Share] social share button

---

SEARCH (when icon tapped):
Overlay modal:
- "Search past events..."
- Search by:
  * Event name
  * Salon name
  * Date range
  * Category
- Recent searches
- Results filtered in real-time

---

EMPTY STATE (no past events):
- History icon (gray, 120px)
- "No past events yet"
- "Your attended events will appear here"
- [Browse Events] button

LOADING STATE:
- Skeleton cards with shimmer
- Placeholders for images and text

Background: Light gray (#F5F5F7)
Cards: White, slightly desaturated for past
Review prompts: Highlighted, actionable
Certificates: Elevated, special treatment
Style: Reflective, achievement-focused, rebooking-oriented
```

---

### Screen 60: Event Cancellation Flow

**Prompt for Uizard:**
```
Design a clear, transparent cancellation flow with empathy and policy clarity.

SCREEN 1: CANCELLATION CONFIRMATION

HEADER:
- Back arrow (left)
- "Cancel Registration" title (center)

EVENT SUMMARY CARD (top):
Light background, informational:
- Event cover image (small, 60px)
- Event title: "Bridal Makeup Masterclass"
- Date: "Dec 15, 2024 at 2:00 PM"
- Booking ref: "REG-EVT-2024-0125-001"

WARNING BANNER:
Yellow background, padding 16px:
- ⚠️ Icon (left)
- "Are you sure you want to cancel?" (bold)
- "This action may affect your refund amount"

REFUND CALCULATOR (interactive):
Large card, white background, border

Current timing indicator:
- "Cancelling: 5 days before event"
- Visual timeline showing current position:
  [●━━━━━○━━━○━━○] Now → Event Day
  7+ days | 3-7 days | 1-3 days | <24h

Refund breakdown:
- Amount paid: ₹1,014.80 (gray)
- Refund policy: "3-7 days before = 50% refund"
- Cancellation fee: -₹507.40 (red)
- ──────────────
- **Refund amount: ₹507.40** (large, green, bold)
- Refund to: "UPI (priya@oksbi)"
- Processing time: "5-7 business days"

Alternative actions suggested:
- "💡 Consider These Options Instead:"
  * [Transfer to Friend] - keep full value
  * [Reschedule] - move to next session (if recurring)
  * [Join Waitlist for Another Date] - no penalty

REASON FOR CANCELLATION (required):
- "Help us improve - Why are you cancelling?" (heading)
- Dropdown selection:
  * Can't make the date/time
  * Found another event
  * Personal emergency
  * Health reasons
  * Event too expensive
  * Not what I expected
  * Salon issues
  * Other (opens text field)

Additional comments (optional):
- Text area (200 chars)
- "Your feedback helps us improve" (gray text)

POLICY REMINDER:
Expandable section:
- "Cancellation Policy for This Event ▼"
- When expanded shows full policy:
  * 7+ days: 100% refund
  * 3-7 days: 50% refund (YOUR CURRENT WINDOW)
  * 1-3 days: 25% refund
  * <24 hours: No refund
  * Salon cancellation: Full refund + credit

IMPACT WARNING:
Info card (blue background):
- "💔 The salon has been notified"
- "They were counting on you to attend"
- "Your spot will be offered to waitlist members"

AGREEMENTS:
Checkbox (required):
- ☑ "I understand this cancellation is final"
- ☑ "I agree to the refund terms"

ACTION BUTTONS (bottom, sticky):
Two options:

Option 1 - Keep Registration:
- [Keep My Spot] button (outlined, left)
- Shows as "Recommended" badge

Option 2 - Proceed:
- [Confirm Cancellation] button (red, right)
- Shows refund amount: "Get ₹507.40"

---

SCREEN 2: CANCELLATION PROCESSING

Full-screen modal with overlay:
- Loading spinner (large, centered)
- "Processing cancellation..."
- Progress messages:
  1. "Cancelling registration..." ✓
  2. "Initiating refund..." ✓
  3. "Updating waitlist..." ✓
- Auto-advances (2-3 seconds)

---

SCREEN 3: CANCELLATION CONFIRMED

SUCCESS STATE:
- Checkmark icon (large, gray/blue, not celebratory)
- "Registration Cancelled"
- Empathetic message: "We're sorry to see you go"

REFUND SUMMARY CARD:
- "Refund Details" heading
- Amount: ₹507.40 (large)
- Method: "UPI - priya@oksbi"
- Timeline: "Expect refund in 5-7 business days"
- Reference: "REF-2024-0125-ABC"
- [Track Refund] link

WHAT HAPPENS NEXT:
Timeline view:
- ✅ Registration cancelled (NOW)
  * "Confirmation email sent"
- → Within 1 hour
  * "Refund initiated"
- → 5-7 business days
  * "Refund credited to your account"
- → Immediately
  * "Waitlist notified of open spot"

ALTERNATIVE OPTIONS:
"Not Ready to Give Up?" section:
Card with suggestions:
- [Browse Similar Events] button
- "Next session: Dec 22, 2024" (if recurring)
  * [Register for Next Session] button
- "Get notified when we host similar events"
  * [Set Alert] button

FEEDBACK REQUEST (optional):
- "Help us improve - Quick feedback?"
- 5-star rating for cancellation experience
- "How easy was it to cancel?" (1-5)
- Text field (optional)

PRIMARY CTA (bottom):
- [Done] button (purple, goes to Events list)
- [View Other Events] (outlined)

EMAIL CONFIRMATION SENT:
Banner notification:
- "📧 Cancellation confirmation sent to priya@email.com"
- [Resend] link

HELP & SUPPORT:
- "Need help?" link
- "Questions about your refund?"
- [Contact Support] button

---

EDGE CASES HANDLED:

LAST-MINUTE CANCELLATION (<24h):
- Red warning banner
- "No refund available"
- "You're past the refund deadline"
- Still allows cancellation
- Explains impact

MEDICAL EMERGENCY:
- Special option: "Medical Emergency?"
- "We may make exceptions"
- "Upload documentation (optional)"
- [Request Manual Review] button
- "We'll review in 24 hours"

ALREADY CHECKED IN:
- Cannot cancel UI
- "You've already checked in"
- "Contact salon directly for assistance"
- [Call Salon] button

WAITLIST TRANSFER CONFIRMATION:
If waitlist exists:
- "Your spot will go to: [Next Person]"
- "They'll be notified immediately"
- Feel-good message: "You're helping someone join!"

Background: White/light gray
Destructive action: Red (but not aggressive)
Refund amount: Green (positive)
Warnings: Yellow (cautionary)
Style: Empathetic, clear, transparent, policy-focused
```

---

### Screen 61: Event Review & Rating

**Prompt for Uizard:**
```
Design an engaging review interface that encourages quality feedback.

HEADER:
- Back arrow (left)
- "Write Review" title (center)
- [Submit] (right, purple text, disabled until valid)

EVENT CONTEXT CARD (top, compact):
Light purple background, rounded:
- Event image (48px, left)
- Event title + salon name (right)
- Date attended: "You attended on Dec 15, 2024"
- Verified badge: "✓ Verified Attendee" (green)

---

SECTION 1: OVERALL RATING (required)

"How was your experience?" (heading, 20sp, bold)

STAR RATING (large, interactive):
- 5 stars, 56px each, tap to rate
- Unselected: Gray outline
- Selected: Filled gold/yellow
- Tap star = select that rating
- Shows number: "5.0" below stars
- Animated: Stars scale slightly on selection

Rating labels (update based on selection):
- 1 star: "😞 Poor"
- 2 stars: "😐 Below Average"
- 3 stars: "😊 Average"
- 4 stars: "😃 Good"
- 5 stars: "🤩 Excellent"

---

SECTION 2: DETAILED RATINGS (optional but encouraged)

"Rate Specific Aspects" (heading)
Horizontal slider ratings (1-5 for each):

1. 👨‍🏫 Instructor/Host:
   - Slider: ━━━●━ (4/5)
   - Quick labels: Poor — Excellent

2. 📚 Content Quality:
   - Slider for educational value
   - Labels: Not useful — Very valuable

3. 🏢 Venue & Facilities:
   - Slider for location/amenities
   - Labels: Poor — Excellent

4. 💰 Value for Money:
   - Slider for price vs value
   - Labels: Overpriced — Great deal

5. 📝 Organization:
   - Slider for event management
   - Labels: Chaotic — Well-organized

Each slider shows:
- Current value (1-5)
- Color coded: Red (1-2), Yellow (3), Green (4-5)

---

SECTION 3: WRITTEN REVIEW (optional)

"Share Your Experience" (heading)

Text area (rich text):
- Placeholder: "What did you like most? What could be improved? Any tips for future attendees?"
- Character counter: "0 / 500"
- Minimum suggested: "50 characters for helpful review" (gray hint)
- Auto-saves draft every 30 seconds

Writing prompts (tappable to insert):
- "What I learned..."
- "The instructor was..."
- "I recommend this for..."
- "Improvement suggestion..."

---

SECTION 4: PHOTO UPLOAD (optional)

"Add Photos" (heading)
"Show others what you created!" (subtitle, gray)

Photo upload area:
- + Add Photos button (dashed border, 120px square)
- Supports up to 4 photos
- Image guidelines shown:
  * "Your final look"
  * "Materials provided"
  * "Venue atmosphere"
  * "With instructor (with permission)"

Each uploaded photo:
- Thumbnail (120px square)
- Remove (X) icon
- Tap to preview/edit
- Reorder by drag

Image requirements:
- Max 5MB per image
- JPG, PNG, HEIC formats
- Auto-compression if too large

---

SECTION 5: QUICK QUESTIONS

"Help Others Decide" (heading)

Toggle questions:
1. "Would you attend again?"
   - ○ Yes, definitely
   - ○ Maybe
   - ○ No

2. "Would you recommend to friends?"
   - Toggle switch: Yes / No
   - Default based on star rating (4+ = Yes)

3. "Best for which skill level?"
   - ☐ Beginner
   - ☐ Intermediate
   - ☐ Advanced

4. "What did you like most?" (multi-select):
   - ☐ Hands-on practice
   - ☐ Expert instructor
   - ☐ Materials provided
   - ☐ Small group size
   - ☐ Certificate
   - ☐ Venue quality
   - ☐ Value for money

---

SECTION 6: TAGS (optional)

"Quick Tags" (heading)
Tappable chips (select multiple):

Positive tags (green border):
- "Professional" "Well-organized" "Great value"
- "Beginner-friendly" "Hands-on" "Fun"
- "Informative" "Patient instructor"

Improvement tags (orange border):
- "Too advanced" "Too basic" "Crowded"
- "Short duration" "Limited practice time"

Selected tags: Filled background
Unselected: Outlined only

---

SECTION 7: ADDITIONAL INFO (collapsible)

"More Details ▼" (expandable)

When expanded:
- "How did you find this event?"
  Dropdown: Instagram, Google, Friend, Past Event, etc.

- "Any suggestions for improvement?"
  Text area (optional)

- "Make review anonymous?"
  Toggle: Show name / Anonymous
  Default: Show name

---

PREVIEW SECTION:

"Preview Your Review ▼" (expandable)

Shows how review will appear:
- Your profile photo + name
- Star rating
- Review text
- Photos
- "Verified Attendee" badge
- Date: "2 days ago"

---

INCENTIVE BANNER (top of form):
Light green background:
- 🎁 Icon
- "Get ₹50 credit for detailed review!"
- Criteria:
  * 4+ star rating: ✓
  * Written review (50+ chars): ✓
  * At least 1 photo: ○
  * All quick questions answered: ✓
- Progress: "3/4 completed"

---

GUIDELINES CARD:

"Review Guidelines" (collapsible info card)
When expanded:
- ✓ Be honest and constructive
- ✓ Focus on your experience
- ✓ Mention specific details
- ✗ No offensive language
- ✗ No personal attacks
- ✗ No promotional content
- "Reviews are moderated" note

---

DRAFT SAVING:

Auto-save indicator (top):
- "Draft saved ✓" (green, small)
- "Saving..." (gray, when typing)
- "Tap back to save draft" reminder

Can exit and resume later:
- Draft stored for 30 days
- Notification: "Finish your review for [Event]"

---

BOTTOM ACTIONS (sticky):

Two buttons:
- [Save Draft] (outlined, left)
  * Saves and exits
  * Can resume later

- [Submit Review] (purple, filled, right)
  * Disabled if missing required fields
  * Shows check animation when submitting
  * "Publishing..." loading state

Validation messages (inline):
- "⚠️ Rating required" (if not rated)
- "✓ Ready to submit!" (if valid)

---

POST-SUBMISSION:

SUCCESS SCREEN:
- Checkmark animation (green, large)
- "🎉 Review Published!"
- "Thank you for your feedback!"

Confirmation:
- "Your review is now live"
- Credit earned (if eligible):
  * "₹50 credit added to your account!"
  * "Use on your next booking"

Share options:
- "Share your review?" heading
- [Share on Instagram] (gradient button)
- [Share on Facebook] (blue button)
- [Copy Link] (gray button)

Actions:
- [View Review] - see published review
- [Back to Events] - return to events list

Email confirmation:
- "Confirmation sent to your email"
- Includes review snapshot

---

GAMIFICATION:

Achievement unlocked (if applicable):
- "🏆 Review Master!"
- "You've reviewed 5 events"
- Badge displayed on profile
- [View All Badges] link

Leaderboard (optional):
- "Top reviewers this month"
- Your rank: "#23"
- "Review 2 more to reach top 20!"

---

EDIT REVIEW (if already submitted):

If coming from past review:
- All fields pre-filled
- "Edit Your Review" title
- "Originally posted on [date]"
- Update button instead of Submit
- "Updated [X] time(s)" indicator

Background: White
Primary color: Purple (#8B5CF6)
Ratings: Gold stars, colorful sliders
Incentive: Green highlight
Style: Engaging, rewarding, helpful, quality-focused
```

---

## 🎉 CUSTOMER EVENT SCREENS COMPLETE!

All 9 customer-facing event management screens have been added with:
- ✅ Exceptional UX and intuitive flows
- ✅ Clear visual hierarchy
- ✅ Mobile-first responsive design
- ✅ Accessibility considerations
- ✅ Multiple state handling
- ✅ Gamification and engagement
- ✅ Seamless integration with existing app

**Total customer screens now: 61 (53 original + 8 new event screens + new review screen)**

---

## Next Steps

1. Import each prompt into Uizard.io AI Designer
2. Generate initial designs
3. Refine with brand guidelines
4. Create component library
5. Build prototypes with interactions
6. Export for development
7. Conduct user testing
8. Iterate based on feedback

---

**End of Document**
