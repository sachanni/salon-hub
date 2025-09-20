# Design Guidelines for Salon Booking Platform

## Design Approach
**Reference-Based Approach** - Drawing inspiration from Airbnb and modern booking platforms
- Clean, hospitality-focused design that builds trust
- Visual-rich interface showcasing salon imagery
- Experience-focused with strong emotional appeal
- Modern marketplace aesthetics with professional polish

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light mode: 220 15% 15% (deep charcoal for text/headers)
- Dark mode: 220 15% 95% (warm white for text)

**Brand Colors:**
- Primary: 280 60% 55% (sophisticated purple for CTAs and accents)
- Secondary: 320 45% 50% (warm rose for secondary actions)

**Background Colors:**
- Light mode: 0 0% 98% (crisp white background)
- Dark mode: 220 15% 8% (rich dark background)

**Gradient Usage:**
- Hero sections: Subtle purple-to-rose gradients (280 60% 55% to 320 45% 50%)
- Card overlays: Dark gradient overlays on salon photos for text readability
- Button backgrounds: Gentle gradients on primary CTAs

### B. Typography
**Font Families:**
- Primary: Inter (headings, UI elements) - modern, readable
- Secondary: Source Sans Pro (body text) - clean, professional

**Hierarchy:**
- Hero headlines: 48px/52px bold
- Section headers: 32px/36px semibold
- Card titles: 20px/24px medium
- Body text: 16px/24px regular
- Small text: 14px/20px regular

### C. Layout System
**Tailwind Spacing Units:** 2, 4, 6, 8, 12, 16, 24
- Cards: p-6, gap-4
- Sections: py-16, px-8
- Forms: space-y-4, p-6
- Navigation: px-8, py-4

### D. Component Library

**Navigation:**
- Clean header with logo, search, and user menu
- Sticky navigation with subtle shadow
- Mobile hamburger menu with slide-out panel

**Search & Discovery:**
- Prominent search bar with location and service filters
- Filter sidebar with categories, price range, ratings
- Salon cards with high-quality images, ratings, and key info

**Booking Flow:**
- Step-by-step booking wizard
- Calendar picker with available time slots
- Service selection with pricing
- Payment form integration with Razorpay

**Cards & Data Display:**
- Salon cards: large image, name, rating, location, price range
- Service cards: image, name, duration, price
- Review cards: user photo, rating, comment, date

**Forms:**
- Rounded input fields (border-radius: 8px)
- Focus states with purple accent
- Clear error and success states
- Consistent button styling

**Overlays:**
- Modal dialogs for detailed booking
- Image galleries for salon photos
- Confirmation overlays for bookings

### E. Visual Treatment

**Photography Style:**
- High-quality salon interiors and service photos
- Professional, welcoming atmosphere
- Consistent lighting and color treatment
- Focus on cleanliness and modern aesthetics

**Card Design:**
- Rounded corners (12px radius)
- Subtle shadows for depth
- Hover states with gentle lift effect
- Image overlays for better text contrast

**Trust Signals:**
- Star ratings prominently displayed
- Review counts and verified badges
- Professional photography
- Clean, organized information hierarchy

## Images Section

**Hero Image:** Large full-width hero image showing a beautiful, modern salon interior with natural lighting. Should convey luxury, cleanliness, and professionalism.

**Salon Cards:** Each salon should have a high-quality featured image showing the interior or a signature service being performed.

**Service Images:** Smaller images for individual services (haircuts, manicures, massage, etc.) that are consistent in style and lighting.

**Background Elements:** Subtle geometric patterns or gradients as background elements, never competing with content.

## Key Design Principles

**Trust & Professionalism:** Clean layouts, professional imagery, clear pricing, and verified reviews build customer confidence.

**Visual Hierarchy:** Clear distinction between different content types using typography, spacing, and color.

**Mobile-First:** Responsive design that works seamlessly across all devices with touch-friendly interactions.

**Accessibility:** High contrast ratios, clear focus states, and screen reader friendly markup throughout.