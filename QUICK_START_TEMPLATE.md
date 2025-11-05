# 🚀 Quick Start Template - Copy & Paste Implementation

**Time to implement: ~30 minutes**

This guide contains ready-to-use code for implementing Firebase + SendGrid authentication on any platform.

---

## Step 1: Environment Variables (2 minutes)

Copy this template and fill in your values:

```bash
# Firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"YOUR_PROJECT",...}

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# App URL (production domain)
APP_URL=https://yourdomain.com
```

---

## Step 2: Install Dependencies (1 minute)

```bash
npm install firebase firebase-admin @sendgrid/mail drizzle-orm @neondatabase/serverless
npm install -D @types/node
```

---

## Step 3: Database Schema (3 minutes)

Add to your schema file (e.g., `schema.ts`):

```typescript
import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Firebase UID
  phoneNumber: text("phone_number").notNull().unique(),
  email: text("email").unique(),
  fullName: text("full_name").notNull(),

  // Password reset fields
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),

  createdAt: timestamp("created_at").defaultNow(),
});
```

Run migration:
```bash
npx drizzle-kit push:pg
```

---

## Step 4: Backend Files (10 minutes)

### File 1: `server/firebase-admin.ts`

```typescript
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const auth = admin.auth();

export async function verifyIdToken(idToken: string) {
  return await auth.verifyIdToken(idToken);
}

export async function updateUserPassword(userId: string, newPassword: string, email?: string) {
  const updateData: admin.auth.UpdateRequest = { password: newPassword };
  if (email) {
    updateData.email = email;
    updateData.emailVerified = true;
  }
  await auth.updateUser(userId, updateData);
}
```

### File 2: `server/lib/sendgrid.ts`

```typescript
import sgMail from '@sendgrid/mail';

let cachedClient: typeof sgMail | null = null;
let cachedFromEmail: string | null = null;

async function getSendGridClient() {
  if (cachedClient && cachedFromEmail) {
    return { client: cachedClient, fromEmail: cachedFromEmail };
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error('SendGrid not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL');
  }

  sgMail.setApiKey(apiKey);
  cachedClient = sgMail;
  cachedFromEmail = fromEmail;

  return { client: sgMail, fromEmail };
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const { client, fromEmail } = await getSendGridClient();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0 0 20px; color: #333; font-size: 24px;">Reset Your Password</h1>
              <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="background-color: #007bff; border-radius: 4px;">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; color: #666; font-size: 14px; line-height: 1.5;">
                This link will expire in <strong>1 hour</strong> for security reasons.
              </p>
              <p style="margin: 20px 0 0; color: #666; font-size: 14px; line-height: 1.5;">
                If you didn't request this, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #007bff; word-break: break-all;">${resetLink}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await client.send({
    to: email,
    from: { email: fromEmail, name: 'Your App Name' },
    subject: 'Reset your password',
    html,
    text: `Reset your password by clicking this link: ${resetLink}\n\nThis link expires in 1 hour.`
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const { client, fromEmail } = await getSendGridClient();

  await client.send({
    to: email,
    from: { email: fromEmail, name: 'Your App Name' },
    subject: 'Welcome to Our Platform!',
    html: `<h1>Welcome ${name}!</h1><p>Thanks for joining us.</p>`,
    text: `Welcome ${name}! Thanks for joining us.`
  });
}
```

### File 3: `server/routes.ts` (Password Reset Endpoints)

```typescript
import express from 'express';
import { randomUUID } from 'crypto';
import { auth, updateUserPassword } from './firebase-admin';
import { sendPasswordResetEmail } from './lib/sendgrid';
import { db } from './db'; // Your database instance
import { users } from './schema';
import { eq } from 'drizzle-orm';

const app = express();

// 1. Send Password Reset Email
app.post("/api/auth/send-password-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      // Security: Don't reveal if email exists
      return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
    }

    // Generate token
    const resetToken = randomUUID();
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await db.update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry
      })
      .where(eq(users.id, user.id));

    // Build reset link
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    const resetLink = `${baseUrl}/?mode=resetPassword&oobCode=${resetToken}`;

    // Send email
    await sendPasswordResetEmail(email, resetLink);

    return res.json({ message: "If an account exists with this email, you will receive a password reset link." });
  } catch (error: any) {
    console.error('[Password Reset] Error:', error);
    return res.status(500).json({ error: "Failed to send reset email" });
  }
});

// 2. Verify Reset Token
app.post("/api/auth/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.body;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    if (new Date(user.passwordResetExpiry!) < new Date()) {
      // Clear expired token
      await db.update(users)
        .set({ passwordResetToken: null, passwordResetExpiry: null })
        .where(eq(users.id, user.id));

      return res.status(400).json({ error: "Token has expired" });
    }

    return res.json({ email: user.email, valid: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to verify token" });
  }
});

// 3. Confirm Password Reset
app.post("/api/auth/confirm-password-reset", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate token
    const [user] = await db.select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user || new Date(user.passwordResetExpiry!) < new Date()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Look up Firebase user by email (handles UID mismatches)
    let firebaseUid: string;
    try {
      const firebaseUser = await auth.getUserByEmail(user.email!);
      firebaseUid = firebaseUser.uid;
    } catch (error) {
      // Create Firebase user if doesn't exist
      const newUser = await auth.createUser({
        email: user.email!,
        password: newPassword,
        emailVerified: true
      });
      firebaseUid = newUser.uid;
    }

    // Update password
    await updateUserPassword(firebaseUid, newPassword, user.email!);

    // Clear token
    await db.update(users)
      .set({ passwordResetToken: null, passwordResetExpiry: null })
      .where(eq(users.id, user.id));

    return res.json({ message: "Password successfully reset" });
  } catch (error: any) {
    console.error('[Password Reset] Error:', error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});
```

---

## Step 5: Frontend Files (10 minutes)

### File 1: `client/src/lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export class EmailPasswordAuthService {
  async signInWithEmail(email: string, password: string): Promise<string> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return await result.user.getIdToken();
  }
}

export class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  setupRecaptcha(containerId: string) {
    this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    });
  }

  async sendOTP(phoneNumber: string): Promise<void> {
    if (!this.recaptchaVerifier) throw new Error('reCAPTCHA not initialized');
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    this.confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, this.recaptchaVerifier);
  }

  async verifyOTP(code: string): Promise<string> {
    if (!this.confirmationResult) throw new Error('No confirmation result');
    const result = await this.confirmationResult.confirm(code);
    return await result.user.getIdToken();
  }

  cleanup() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }
}
```

### File 2: `client/src/components/EmailPasswordLogin.tsx` (React)

```typescript
import { useState } from 'react';
import { EmailPasswordAuthService } from '../lib/firebase';

export default function EmailPasswordLogin({ onLoginSuccess }: { onLoginSuccess: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const service = new EmailPasswordAuthService();
      const token = await service.signInWithEmail(email, password);
      onLoginSuccess(token);
    } catch (error) {
      alert('Login failed: Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const response = await fetch('/api/auth/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      if (response.ok) {
        alert('Password reset email sent! Check your inbox.');
        setShowResetDialog(false);
      }
    } catch (error) {
      alert('Failed to send reset email');
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <button onClick={() => setShowResetDialog(true)}>
        Forgot password?
      </button>

      {showResetDialog && (
        <div>
          <input
            type="email"
            placeholder="Enter your email"
            value={resetEmail}
            onChange={e => setResetEmail(e.target.value)}
          />
          <button onClick={handlePasswordReset}>Send Reset Link</button>
          <button onClick={() => setShowResetDialog(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

### File 3: `client/src/components/PasswordResetAction.tsx` (React)

```typescript
import { useState, useEffect } from 'react';

export default function PasswordResetAction() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('oobCode');
    if (code) {
      setOobCode(code);
      verifyToken(code);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
    } catch (error) {
      alert('Invalid or expired reset link');
    }
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/confirm-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: oobCode, newPassword })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => window.location.href = '/', 3000);
      }
    } catch (error) {
      alert('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <div>Password changed! Redirecting to login...</div>;
  }

  return (
    <div>
      <h2>Reset Your Password</h2>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleReset} disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </div>
  );
}
```

---

## Step 6: Testing Checklist (5 minutes)

```bash
# 1. Test email/password login
curl -X POST http://localhost:5000/api/auth/send-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Check SendGrid dashboard
# - Go to https://app.sendgrid.com/
# - Activity → View email delivery status

# 3. Test password reset flow
# - Click link in email
# - Should redirect to /?mode=resetPassword&oobCode=xxx
# - Enter new password
# - Should redirect to login

# 4. Test login with new password
# - Enter email + new password
# - Should successfully log in
```

---

## Quick Reference Commands

```bash
# Install dependencies
npm install firebase firebase-admin @sendgrid/mail drizzle-orm @neondatabase/serverless

# Push database schema
npx drizzle-kit push:pg

# Start development server
npm run dev

# Test email sending
curl -X POST http://localhost:5000/api/auth/send-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

---

## Common Issues & Solutions

### Issue 1: SendGrid emails not arriving
**Solution:** Check domain authentication at https://app.sendgrid.com/settings/sender_auth

### Issue 2: Firebase UID mismatch
**Solution:** Backend uses email lookup (not database UID) - already handled in code above

### Issue 3: Reset link goes to localhost
**Solution:** Set `APP_URL=https://yourdomain.com` in production

---

## What You Get

✅ Phone OTP registration (one-time ₹0.03)  
✅ Email/password login (free forever)  
✅ Email-based password reset (free with SendGrid)  
✅ Professional HTML email templates  
✅ 99%+ inbox delivery rate  
✅ 1-hour token expiration  
✅ Custom branded reset page  
✅ Works on any platform (Replit, Heroku, AWS, etc.)  

**Total Cost Per User:** ₹0.03 (99% savings vs phone-only auth)

---

**Estimated Implementation Time: 30 minutes**

**Support:** Use AUTH_IMPLEMENTATION_GUIDE.md for detailed explanations
