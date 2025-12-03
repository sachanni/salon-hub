# Image Assets for SalonHub Mobile App

This directory should contain the following image assets. See `/mobile/ASSETS_GUIDE.md` for detailed specifications.

## Required Files

### Splash Screen Images (1080x1920px)
- `splash1.png` - Woman getting hair styled
- `splash2.png` - Man getting haircut
- `splash3.png` - Spa/wellness scene

### Map Images (512x512px)
- `map-bg.png` - City map illustration
- `precise-map.png` - Zoomed-in street map
- `approximate-map.png` - Zoomed-out city map

### App Icons (in root /mobile/assets/)
- `icon.png` (1024x1024px) - App icon
- `adaptive-icon.png` (1024x1024px) - Android adaptive icon
- `splash.png` (1242x2436px) - Launch splash screen
- `notification-icon.png` (96x96px) - Notification icon

## Temporary Solution

Until assets are added, the app will show errors when trying to load images. To test the app without assets:

1. Comment out image imports in screens
2. Use placeholder colored backgrounds
3. Or add placeholder images from online sources

See parent directory's ASSETS_GUIDE.md for download sources and specifications.
