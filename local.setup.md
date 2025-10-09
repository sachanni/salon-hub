# SalonHub Local Development Setup

This guide will help you set up the SalonHub application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v13 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repository-url>
cd salonhub

# Install dependencies
npm install
```

## Step 2: Database Setup

### Option A: Local PostgreSQL Installation

1. **Install PostgreSQL** on your machine
2. **Create a database** for the project:
   ```sql
   createdb salonhub
   ```
   Or using PostgreSQL command line:
   ```sql
   CREATE DATABASE salonhub;
   ```

3. **Create a database user** (optional but recommended):
   ```sql
   CREATE USER salonhub_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE salonhub TO salonhub_user;
   ```

### Option B: Cloud Database (Recommended)

Use a cloud PostgreSQL service like:
- **Neon** (Free tier available) - [https://neon.tech/](https://neon.tech/)
- **Supabase** (Free tier available) - [https://supabase.com/](https://supabase.com/)
- **Railway** - [https://railway.app/](https://railway.app/)
- **Heroku Postgres** - [https://www.heroku.com/postgres](https://www.heroku.com/postgres)

## Step 3: Environment Configuration

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file** with your actual values:

### Required Configuration:
```env
# Core settings
NODE_ENV=development
PORT=5000

# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/salonhub

# Security (REQUIRED - App will fail without these)
SESSION_SECRET=generate-a-strong-random-string-here
JWT_SECRET=generate-another-strong-random-string-here
```

⚠️ **CRITICAL**: The SESSION_SECRET and JWT_SECRET are required. The application will fail to start without them.

### Optional Services:
Add these if you want full functionality:

**Email Service (SendGrid):**
```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**SMS Service (Twilio):**
```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Payment Processing (Razorpay):**
```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

**Location Services (Geoapify):**
```env
GEOAPIFY_API_KEY=your-geoapify-api-key
```

## Step 4: Generate Secret Keys

Generate strong secret keys for SESSION_SECRET and JWT_SECRET:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using openssl (if available)
openssl rand -hex 64

# Option 3: Online generator (use a trusted source)
# Visit: https://generate-secret.vercel.app/64
```

## Step 5: Database Migration

Run the database migrations to set up the schema:

```bash
# Push the schema to your database
npm run db:push

# If that fails, try force push
npm run db:push -- --force
```

## Step 6: Start the Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend & API**: http://localhost:5000

## Step 7: Verify Installation

1. **Check the server logs** for any errors
2. **Visit http://localhost:5000** - you should see the SalonHub homepage
3. **Check API endpoints**:
   - http://localhost:5000/api/services
   - http://localhost:5000/api/salons

## Optional Service Setup

### SendGrid (Email Service)
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Verify your sender email
4. Add the API key to your .env file

### Twilio (SMS Service)
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Add credentials to your .env file

### Razorpay (Payment Processing)
1. Sign up at [Razorpay](https://razorpay.com/)
2. Get your API keys from the dashboard
3. Add to your .env file

### Geoapify (Location Services)
1. Sign up at [Geoapify](https://www.geoapify.com/)
2. Get your API key
3. Add to your .env file

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your DATABASE_URL format
- Verify database credentials
- Try connecting with a PostgreSQL client

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID)
kill -9 <PID>
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Check TypeScript compilation
npm run check
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database schema push
npm run db:push
```

## Project Structure

```
salonhub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities
│   │   └── hooks/          # Custom hooks
├── server/                 # Express backend
│   ├── middleware/         # Auth & rate limiting
│   ├── automation/         # Background services
│   └── *.ts               # Route handlers & services
├── shared/                 # Shared schemas & types
├── migrations/             # Database migrations
└── attached_assets/        # Static assets
```

## Support

If you encounter any issues:
1. Check the console logs for detailed error messages
2. Ensure all environment variables are properly set
3. Verify database connection and schema
4. Check that all required services are running

For development help, refer to the README.md or create an issue in the repository.