# StudioHub - Beauty & Wellness Booking Platform

## Copyright
Copyright (c) 2025 Aulnova Techsoft Ind Pvt Ltd
Website: https://aulnovatechsoft.com/

All rights reserved. This source code is proprietary and confidential.

## Overview
StudioHub is a comprehensive beauty and wellness booking platform that allows customers to discover and book services at studios, while providing business owners with tools to manage their establishments.

## Tech Stack
- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS
- **Backend**: Express.js with TypeScript, running on Bun runtime
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with access/refresh tokens
- **Real-time**: Socket.IO for chat functionality
- **Payments**: Razorpay integration
- **Email**: SendGrid
- **SMS**: Twilio
- **Maps**: Mapbox, Google Places API
- **AI Features**: Google Gemini API, OpenAI

## Project Structure
```
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       ├── contexts/    # React contexts
│       └── lib/         # Utilities
├── server/          # Express backend
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── middleware/  # Auth, etc.
├── shared/          # Shared types and schema
│   └── schema.ts    # Drizzle database schema
└── migrations/      # Database migrations
```

## Development Commands
- `bun run dev` - Start development server (port 5000)
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run db:push` - Push database schema changes

## Environment Variables
The following environment variables are configured:
- `DATABASE_URL` - PostgreSQL connection (Replit secret)
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- Various API keys in `.env` file (SendGrid, Twilio, Razorpay, Google, Mapbox, etc.)

## Deployment
- Deployment target: Autoscale
- Build command: `bun run build`
- Run command: `bun run start`

## Recent Changes
- 2025-12-12: Copyright protection added
  - Updated package.json with Aulnova Techsoft Ind Pvt Ltd company details
  - Created proprietary LICENSE file
  - Added copyright headers to key source files (server/index.ts, routes.ts, client/src/main.tsx, App.tsx, shared/schema.ts)
  - Rebranded from SalonHub to StudioHub
- 2025-12-11: Mobile "Running Late" feature complete
  - Created LateArrivalButton and LateArrivalModal React Native components
  - Added lateArrivalAPI service with proper error handling for all endpoints
  - Button shows only for today's confirmed/pending bookings before appointment time
  - Modal features: delay selection, ETA calculation, optional message, success/error states
  - IST timezone normalization for date comparisons
  - Backend routes at `/api/mobile/late-arrival/*` with mobile JWT authentication
  - Distinguishes network errors (retryable) from eligibility denials (business logic)
- 2025-12-11: Chat system fixes for business dashboard
  - Added `role=staff` query parameter to all chat API calls for proper authorization
  - Fixed socket event names to use canonical `message:new`, `message:ack`, `conversation:join`, `conversation:leave`
  - Implemented optimistic UI for message sending with fallback to REST API
  - Fixed unread count logic: only increments for inactive conversations, auto-clears for active
  - Added conversation room join/leave socket events for proper room management
  - Auto-marks messages as read when viewing active conversation
  - Sound notifications only play for inactive conversations
- 2025-12-11: Mobile package booking feature complete
  - Added mobile package API endpoints (GET /api/mobile/salons/:salonId/packages)
  - Implemented server-side price validation for both package and normal bookings
  - Created PackageCard and PackageDetailModal mobile components
  - Updated SalonDetailScreen with "Packages" tab
  - Updated BookingDetailsScreen and PaymentScreen for package pricing
  - Security: Server recomputes totals from database, ignoring client-supplied values
- 2024-12-11: Initial Replit setup complete
  - Database provisioned and schema deployed
  - Bun runtime configured for better compatibility
  - Environment variables configured
  - Deployment configuration set up

## Notes
- The app uses Bun runtime instead of Node.js for better TypeScript support
- Frontend runs on port 5000 with Vite HMR in development
- All API routes are prefixed with `/api/`
