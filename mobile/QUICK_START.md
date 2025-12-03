# Quick Start Guide - SalonHub Mobile

Get the mobile app running in under 5 minutes!

## ⚡ Prerequisites

- Node.js 18+ installed
- iOS Simulator (Mac) or Android Emulator installed

## 🚀 Setup (3 Steps)

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env
```

Edit `.env` and set your API URL:
- **iOS Simulator**: `http://localhost:5000`
- **Android Emulator**: `http://10.0.2.2:5000`
- **Physical Device**: `http://YOUR_LOCAL_IP:5000`

### 3. Start Development Server
```bash
npm start
```

Then press:
- `i` for iOS Simulator
- `a` for Android Emulator
- Scan QR with Expo Go app for physical device

## ⚠️ Known Issues

### App Crashes on Image Screens?
**Cause**: Missing image assets (10 files required)

**Quick Fix** (for testing):
```bash
# Comment out image imports in screens or
# Add placeholder images to mobile/src/assets/
```

See `ASSETS_GUIDE.md` for asset specifications.

### OTP Verification Fails?
**Cause**: Backend endpoints not implemented yet

**Next Step**: Implement backend OTP endpoints (see `IMPLEMENTATION_NOTES.md`)

## 📚 Full Documentation

- **Complete Setup**: `README.md`
- **Asset Requirements**: `ASSETS_GUIDE.md`
- **Implementation Details**: `IMPLEMENTATION_NOTES.md`
- **Production Roadmap**: `PRODUCTION_CHECKLIST.md`
- **Verification Report**: `VERIFICATION_REPORT.md`

## 🆘 Need Help?

1. Check `VERIFICATION_REPORT.md` for known issues
2. Review `PRODUCTION_CHECKLIST.md` for missing pieces
3. See `IMPLEMENTATION_NOTES.md` for technical details

## ✅ What Works Now

- ✅ All 5 onboarding screens (with placeholder images)
- ✅ Native permission requests (location, notifications)
- ✅ Phone number validation
- ✅ OTP input with auto-focus and paste support
- ✅ Navigation flow
- ✅ State persistence

## ❌ What Needs Work

- ❌ Image assets (10 files)
- ❌ Backend OTP endpoints (3 endpoints)
- ❌ JWT token management
- ❌ Security hardening

**Estimated Time to Production**: 13-23 days (see PRODUCTION_CHECKLIST.md)
