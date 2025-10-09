# Google Places API + Redis Setup Guide

## 🚀 **Google Places API Setup**

### **Step 1: Get Google Cloud Account & API Key**

1. **Go to Google Cloud Console**
   - Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name: "SalonHub" (or your preferred name)
   - Click "Create"

3. **Enable Places API**
   - Go to "APIs & Services" → "Library"
   - Search for "Places API"
   - Click "Places API" → "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key (starts with `AIza...`)

5. **Secure Your API Key**
   - Click on your API key to edit
   - Under "Application restrictions" → "HTTP referrers"
   - Add: `http://localhost:*`, `https://yourdomain.com/*`
   - Under "API restrictions" → Select "Places API"
   - Click "Save"

### **Step 2: Add to Environment Variables**
Add this to your `.env` file:
```bash
GOOGLE_PLACES_API_KEY=AIza_your_token_here
```

## 🔴 **Redis Setup (Cloud)**

### **Option 1: Redis Cloud (Recommended)**

1. **Sign up for Redis Cloud**
   - Go to [https://redis.com/try-free/](https://redis.com/try-free/)
   - Sign up with email

2. **Create Database**
   - Click "New Database"
   - Choose "Fixed" plan (FREE tier available)
   - Select region closest to you (Asia Pacific - Mumbai)
   - Click "Activate Database"

3. **Get Connection Details**
   - Copy "Endpoint" (e.g., `redis-12345.c1.ap-south-1-1.ec2.cloud.redislabs.com:12345`)
   - Copy "Password" (e.g., `abc123def456`)

4. **Add to Environment Variables**
```bash
REDIS_URL=redis://default:abc123def456@redis-12345.c1.ap-south-1-1.ec2.cloud.redislabs.com:12345
```

### **Option 2: Upstash Redis (Alternative)**

1. **Sign up for Upstash**
   - Go to [https://upstash.com/](https://upstash.com/)
   - Sign up with GitHub

2. **Create Database**
   - Click "Create Database"
   - Choose "Global" region
   - Click "Create"

3. **Get Connection Details**
   - Copy "Redis URL" from dashboard

4. **Add to Environment Variables**
```bash
REDIS_URL=redis://default:abc123def456@redis-12345.upstash.io:12345
```

## 💰 **Pricing Breakdown**

### **Google Places API (20k searches/month)**
- First 1,000 requests: **FREE**
- Next 9,000 requests: $0.017 × 9,000 = **$153**
- Next 10,000 requests: $0.017 × 10,000 = **$170**
- **Total: $323/month**

### **Redis Cloud (20k searches/month)**
- **FREE tier**: 30MB storage, 30 connections
- **Perfect for**: 20k searches/month
- **Total: $0/month**

## 🎯 **Benefits You'll Get**

### **Google Places API:**
- ✅ **Best accuracy** - Most comprehensive database
- ✅ **Real-time data** - Always up-to-date
- ✅ **Rich details** - Photos, reviews, business hours
- ✅ **Smart suggestions** - Context-aware autocomplete
- ✅ **Global coverage** - Works worldwide

### **Redis Caching:**
- ✅ **Lightning fast** - 1-5ms response time
- ✅ **Cost effective** - Reduces API calls by 80%
- ✅ **Scalable** - Handles millions of requests
- ✅ **Reliable** - 99.9% uptime

## 🚀 **Test It**

1. Add both API keys to `.env`
2. Restart server: `npm run dev`
3. Search for "Nirala Aspire"
4. You'll see Fresha-level results!

## 📞 **Support**

If you need help with setup, let me know!
