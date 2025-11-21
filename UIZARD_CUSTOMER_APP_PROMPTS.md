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

**Total: 44 screens defined**

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
