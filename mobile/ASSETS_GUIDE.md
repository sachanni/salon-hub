# Image Assets Guide for SalonHub Mobile App

## Required Assets

All image assets should be placed in `mobile/src/assets/` directory.

### 📱 Splash Screen Images (1080x1920px, Portrait)

#### splash1.png
- **Subject**: Female beauty services
- **Description**: Professional woman getting hair styled in luxury salon
- **Style**: Warm lighting, purple and pink accent lighting
- **Mood**: Premium, sophisticated, welcoming
- **Reference**: Similar to the HTML splash screen image 1

#### splash2.png
- **Subject**: Male grooming services
- **Description**: Professional man getting haircut at modern barbershop
- **Style**: Contemporary masculine salon interior with purple/pink accents
- **Mood**: Professional, trendy, confident
- **Reference**: Similar to the HTML splash screen image 2

#### splash3.png
- **Subject**: Spa and wellness
- **Description**: Luxury spa interior, relaxing massage or wellness scene
- **Style**: Serene spa environment, purple/pink ambient lighting
- **Mood**: Relaxing, premium, peaceful
- **Reference**: Similar to the HTML splash screen image 3

### 🗺️ Map Images (512x512px, Square)

#### map-bg.png
- **Subject**: City map illustration
- **Description**: Minimalist illustrated vector city map, top view
- **Style**: Light grey and white tones, subtle streets, clean design
- **Usage**: Background for location permission screen

#### precise-map.png
- **Subject**: Zoomed-in street map
- **Description**: Vector map zoomed to street level with distinct location pin
- **Style**: Minimalist, clear street detail, purple location marker in center
- **Usage**: "Precise" location option preview

#### approximate-map.png
- **Subject**: Zoomed-out city map
- **Description**: Vector map showing wider city area without specific pin
- **Style**: Minimalist, light colors, wide area view
- **Usage**: "Approximate" location option preview

### 🎨 App Icons

#### icon.png (1024x1024px)
- **Design**: SalonHub app icon
- **Elements**: 
  - Purple-to-pink gradient background (#8B5CF6 to #EC4899)
  - "SH" text in white, bold, modern sans-serif
  - Or salon-themed icon (scissors, mirror, etc.)
- **Style**: Modern, clean, recognizable at small sizes

#### adaptive-icon.png (1024x1024px)
- **Design**: Android adaptive icon version
- **Safe area**: Keep important elements within 66% center circle
- **Background**: Solid purple-pink gradient
- **Foreground**: "SH" or salon icon in white

#### splash.png (1242x2436px)
- **Design**: App launch splash screen
- **Elements**:
  - White background
  - SalonHub logo/text in center
  - Purple-pink gradient elements
- **Style**: Clean, minimal, fast-loading

#### notification-icon.png (96x96px)
- **Design**: Push notification icon
- **Style**: Simple, monochrome-friendly
- **Content**: SH monogram or simple bell icon
- **Format**: PNG with transparency

## 🎨 Design Guidelines

### Color Palette
- **Primary Purple**: #8B5CF6
- **Primary Pink**: #EC4899
- **Dark**: #111827
- **Light Gray**: #F9FAFB

### Style Consistency
- All images should feel cohesive and premium
- Use soft lighting and professional photography
- Include subtle purple/pink accent colors
- Maintain modern, clean aesthetic

### Technical Requirements
- **Format**: PNG with transparency where needed
- **Compression**: Optimize for mobile (use tools like TinyPNG)
- **Aspect Ratios**: Maintain specified dimensions
- **File Size**: Keep under 500KB each for optimal performance

## 📥 How to Obtain Assets

### Option 1: Use Stock Photography
Recommended sites:
- **Unsplash** (free, high-quality)
- **Pexels** (free, commercial use)
- **Freepik** (free and premium)

Search terms:
- "woman hair salon luxury"
- "man barbershop haircut"
- "spa wellness massage"
- "city map vector illustration"

### Option 2: Generate with AI
Use AI image generators:
- **DALL-E** (OpenAI)
- **Midjourney**
- **Stable Diffusion**

Prompts:
- "professional woman getting hair styled at luxury salon, warm lighting, purple and pink accents, cinematic"
- "modern barbershop interior, man getting haircut, contemporary masculine design, purple lighting"
- "minimalist city map vector illustration, top view, light colors"

### Option 3: Hire a Designer
- **Fiverr**: $50-200 for complete asset package
- **Upwork**: Professional designers for custom work
- **99designs**: Contest-based design options

## 🔧 Adding Assets to the Project

1. Place all images in `mobile/src/assets/` directory

2. Update import statements in screens (already configured):
   ```typescript
   // Splash screens
   require('../assets/splash1.png')
   require('../assets/splash2.png')
   require('../assets/splash3.png')
   
   // Map images
   require('../assets/map-bg.png')
   require('../assets/precise-map.png')
   require('../assets/approximate-map.png')
   ```

3. App icons are automatically loaded from root-level assets (configured in app.json)

## ✅ Asset Checklist

- [ ] splash1.png (1080x1920px)
- [ ] splash2.png (1080x1920px)
- [ ] splash3.png (1080x1920px)
- [ ] map-bg.png (512x512px)
- [ ] precise-map.png (512x512px)
- [ ] approximate-map.png (512x512px)
- [ ] icon.png (1024x1024px)
- [ ] adaptive-icon.png (1024x1024px)
- [ ] splash.png (1242x2436px)
- [ ] notification-icon.png (96x96px)

## 🎯 Quick Start Without Assets

For development/testing, you can:
1. Use placeholder images from online sources
2. Use solid color backgrounds temporarily
3. Comment out image imports and use LinearGradient backgrounds instead

The app will work without images but won't look polished until assets are added.
