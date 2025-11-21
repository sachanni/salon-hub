# SalonHub - Beauty & Wellness Booking Platform

## Overview

SalonHub is a comprehensive platform connecting customers with beauty and wellness service providers for online booking, payment, and service discovery. It also provides salon owners with powerful tools for business management, staff scheduling, inventory, and customer engagement, primarily focusing on the Delhi NCR region in India. The platform aims to create seamless booking experiences for customers and efficient management for salons.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React with TypeScript, Vite, Tailwind CSS, and shadcn/ui for UI components. It leverages Wouter for client-side routing and follows a responsive, mobile-first design. Key patterns include Context API for authentication, React Query for server state management and caching, and custom hooks for reusable logic. User preferences are persisted in versioned localStorage.

### Backend Architecture

The backend is an Express-based REST API built with Node.js and TypeScript. It utilizes middleware for request processing, authentication, and role-based access control. Authentication supports Firebase phone verification, email/password, and session management. Core services include a centralized database access layer (`storage.ts`), communication service (`communicationService.ts`) for email/SMS, geocoding (`geocodingService.ts`), and dynamic offer calculation (`offerCalculator.ts`).

### Data Storage Solutions

The primary database is PostgreSQL, delivered via Neon serverless. The schema is normalized with foreign key constraints, UUID primary keys, and timestamp tracking. It supports soft deletes and JSON columns for flexible metadata. Key domain models cover users, business entities (salons, staff), services, bookings, payments, financial data, communication, and inventory. Caching is implemented for geocoding results, and performance indexes are used for high-traffic queries.

### Authentication & Authorization

SalonHub employs multi-method authentication, including Firebase phone authentication, email/password with SendGrid verification, and session-based persistence. Security measures include bcrypt for password hashing, JWT-style token verification, and role-based access control (RBAC) with middleware for staff, salon owners, and super administrators.

### Inventory Management System

The system provides comprehensive inventory management including CRUD operations for product categories with hierarchy, vendor management, and product management with SKU validation, advanced filtering, and barcode support. A critical stock movement system ensures transaction-based stock updates with row-level locking for audit trails. A complete purchase order (PO) system manages the PO lifecycle from draft to received, ensuring atomic operations and accurate stock level updates.

### E-commerce System

The platform includes a full e-commerce system with customer-facing screens for product listing, detailed product views, shopping cart, multi-step checkout, order confirmation, order details, order history, and a wishlist. It supports various delivery methods, address management, and multiple payment options. Admin functionalities include product retail configuration, order management (status updates, cancellation), and delivery settings.

## External Dependencies

**Payment Processing**:
- **Razorpay**: For payment acceptance, order creation, capture, and refunds within the Indian market.

**Communication Services**:
- **SendGrid**: For transactional and marketing emails.
- **Twilio**: For SMS notifications (optional).

**Location & Mapping**:
- **Google Places API**: For address autocomplete and geocoding.
- **Mapbox**: As an alternative geocoding service.

**AI & Computer Vision**:
- **Google Generative AI (Gemini)**: For personalized beauty recommendations.
- **Banuba SDK**: For AR makeup try-on and virtual hairstyle previews.

**Database Hosting**:
- **Neon serverless PostgreSQL**: Primary database hosting.

**Environment Configuration**:
- **Firebase**: For phone authentication (via service account JSON).
- **SendGrid**: API key and verified sender email.
- **Razorpay**: Key ID and secret.
- **Google Places API Key (or Mapbox token)**: For location services.
- **Banuba client token**: For AR features.
- Database connection strings (`EXTERNAL_DATABASE_URL`).
- `APP_URL` for email verification links.