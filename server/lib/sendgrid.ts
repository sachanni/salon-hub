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

export async function sendPasswordResetEmail(email: string, resetLink: string, firstName?: string) {
  const { client, fromEmail } = await getSendGridClient();

  const name = firstName || 'there';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - SalonHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">SalonHub</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Beauty & Wellness Platform</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your SalonHub business account. Click the button below to create a new password:
              </p>
              
              <!-- Reset Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" bgcolor="#667eea" style="background-color: #667eea; border-radius: 8px; box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);">
                    <a href="${resetLink}" style="display: block; padding: 16px 48px; color: #ffffff; background-color: #667eea; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Security Info -->
              <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #f57c00; font-size: 14px; font-weight: 600;">
                  ⏱️ This link expires in <strong>1 hour</strong>
                </p>
                <p style="margin: 0; color: #e65100; font-size: 13px; line-height: 1.5;">
                  For security reasons, this password reset link will only work once and expires after 60 minutes.
                </p>
              </div>
              
              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 0;">
            </td>
          </tr>
          
          <!-- Alternative Link -->
          <tr>
            <td style="padding: 24px 40px 40px;">
              <p style="margin: 0 0 12px; color: #888888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Button not working?
              </p>
              <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.6;">
                Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; color: #667eea; font-size: 12px; word-break: break-all; line-height: 1.5;">
                ${resetLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 24px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px; color: #888888; font-size: 12px; line-height: 1.5;">
                This email was sent by <strong>SalonHub</strong>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 11px; line-height: 1.4;">
                The world's premier beauty & wellness booking platform
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Security Notice -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 0 20px;">
              <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5;">
                🔒 This is an automated security email. Please do not reply to this message.
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

  const textContent = `
Hi ${name},

We received a request to reset your password for your SalonHub business account.

Click this link to reset your password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

---
This email was sent by SalonHub
The world's premier beauty & wellness booking platform
  `.trim();

  await client.send({
    to: email,
    from: { email: fromEmail, name: 'SalonHub' },
    subject: 'Reset your SalonHub password',
    html,
    text: textContent
  });
}

export async function sendPasswordChangedEmail(email: string, firstName?: string) {
  const { client, fromEmail } = await getSendGridClient();

  const name = firstName || 'there';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed - SalonHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 64px; height: 64px; background-color: #4caf50; border-radius: 50%; line-height: 64px;">
                  <span style="color: white; font-size: 32px;">✓</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600; text-align: center;">Password Changed Successfully</h2>
              
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>
              
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                This is to confirm that your SalonHub password has been successfully changed.
              </p>
              
              <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1565c0; font-size: 14px; line-height: 1.5;">
                  <strong>What this means:</strong><br>
                  You can now log in to your account using your new password.
                </p>
              </div>
              
              <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #c62828; font-size: 14px; font-weight: 600;">
                  ⚠️ Didn't make this change?
                </p>
                <p style="margin: 0; color: #d32f2f; font-size: 13px; line-height: 1.5;">
                  If you did not request this password change, please contact our support team immediately.
                </p>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f9f9f9; padding: 24px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px; color: #888888; font-size: 12px;">
                This email was sent by <strong>SalonHub</strong>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 11px;">
                The world's premier beauty & wellness booking platform
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
    from: { email: fromEmail, name: 'SalonHub' },
    subject: 'Your SalonHub password has been changed',
    html,
    text: `Hi ${name},\n\nThis is to confirm that your SalonHub password has been successfully changed.\n\nIf you did not make this change, please contact our support team immediately.\n\n---\nSalonHub Team`
  });
}

export async function sendWelcomeVerificationEmail(
  email: string,
  verificationLink: string,
  firstName?: string
) {
  const { client, fromEmail } = await getSendGridClient();

  const name = firstName || 'there';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SalonHub - Verify Your Email</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f7f7f7; padding: 20px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%); padding: 48px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                SalonHub
              </h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 500;">
                Beauty & Wellness at Your Fingertips
              </p>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 48px 32px 32px;">
              <h2 style="margin: 0 0 24px; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">
                Welcome to SalonHub! 👋
              </h2>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 17px; line-height: 1.6;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 17px; line-height: 1.6;">
                We're thrilled to have you join our community of beauty enthusiasts! Get ready to discover amazing salons, book appointments with ease, and enjoy exclusive offers.
              </p>
              
              <!-- Verify Button -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 36px 0;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);">
                    <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 18px 48px; color: #ffffff; background-color: transparent; text-decoration: none; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; border-radius: 12px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits Section -->
              <div style="background: linear-gradient(135deg, #fef3ff 0%, #f5f3ff 100%); border-left: 4px solid #ec4899; padding: 24px; margin: 32px 0; border-radius: 8px;">
                <p style="margin: 0 0 16px; color: #7c3aed; font-size: 16px; font-weight: 700;">
                  ✨ What you can do after verification:
                </p>
                <ul style="margin: 0; padding-left: 24px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;"><strong>Book appointments</strong> at top-rated salons</li>
                  <li style="margin-bottom: 8px;"><strong>Save your favorites</strong> and track your beauty journey</li>
                  <li style="margin-bottom: 8px;"><strong>Get exclusive offers</strong> and early access to deals</li>
                  <li style="margin-bottom: 0;"><strong>Manage bookings</strong> easily from your dashboard</li>
                </ul>
              </div>
              
              <!-- Expiration Notice -->
              <div style="background-color: #fff8e1; border-left: 4px solid #fbbf24; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px; color: #b45309; font-size: 15px; font-weight: 700;">
                  ⏱️ This verification link expires in <strong>24 hours</strong>
                </p>
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  For your security, please verify your email within 24 hours. You can request a new link from your dashboard if this one expires.
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 15px; line-height: 1.6;">
                Didn't create an account? You can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 2px solid #f0f0f0; margin: 0;">
            </td>
          </tr>
          
          <!-- Alternative Link Section -->
          <tr>
            <td style="padding: 32px 32px 48px;">
              <p style="margin: 0 0 12px; color: #888888; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Button not working?
              </p>
              <p style="margin: 0 0 12px; color: #666666; font-size: 14px; line-height: 1.5;">
                Copy and paste this link into your browser:
              </p>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #8b5cf6; font-size: 13px; word-break: break-all; line-height: 1.6;">
                  ${verificationLink}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px; color: #666666; font-size: 14px; font-weight: 600;">
                Need help? We're here for you!
              </p>
              <p style="margin: 0 0 16px; color: #888888; font-size: 13px; line-height: 1.5;">
                Reply to this email or contact us at support@salonhub.com
              </p>
              <p style="margin: 0 0 8px; color: #888888; font-size: 13px;">
                This email was sent by <strong style="color: #ec4899;">SalonHub</strong>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                The world's premier beauty & wellness booking platform
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Mobile Optimization Notice -->
        <!--[if !mso]><!-->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 16px;">
              <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5;">
                © 2025 SalonHub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const plainText = `
Hi ${name},

Welcome to SalonHub! 🎉

We're thrilled to have you join our community. To get started and unlock all features, please verify your email address by clicking the link below:

${verificationLink}

What you can do after verification:
• Book appointments at top-rated salons
• Save your favorites and track your beauty journey
• Get exclusive offers and early access to deals
• Manage bookings easily from your dashboard

⏱️ This verification link expires in 24 hours.

Didn't create an account? You can safely ignore this email.

Need help? Reply to this email or contact us at support@salonhub.com

---
SalonHub Team
The world's premier beauty & wellness booking platform
  `.trim();

  await client.send({
    to: email,
    from: { email: fromEmail, name: 'SalonHub' },
    subject: 'Welcome to SalonHub! Verify your email to start booking 🎉',
    html,
    text: plainText
  });
}

export async function sendBusinessWelcomeVerificationEmail(
  email: string,
  verificationLink: string,
  firstName?: string
) {
  const { client, fromEmail } = await getSendGridClient();

  const name = firstName || 'there';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SalonHub Business - Verify Your Email</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f7f7f7; padding: 20px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header with Professional Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 48px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                SalonHub Business
              </h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">
                Grow Your Beauty Business
              </p>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 48px 32px 32px;">
              <h2 style="margin: 0 0 24px; color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3;">
                Welcome to SalonHub! 🚀
              </h2>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 17px; line-height: 1.6;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 17px; line-height: 1.6;">
                Congratulations on joining SalonHub Business! You're about to connect with thousands of customers and take your salon to the next level.
              </p>
              
              <!-- Verify Button -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 36px 0;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.4);">
                    <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 18px 48px; color: #ffffff; background-color: transparent; text-decoration: none; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; border-radius: 12px;">
                      Verify Email & Get Started
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits Section -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%); border-left: 4px solid #0369a1; padding: 24px; margin: 32px 0; border-radius: 8px;">
                <p style="margin: 0 0 16px; color: #0369a1; font-size: 16px; font-weight: 700;">
                  💼 What you can do after verification:
                </p>
                <ul style="margin: 0; padding-left: 24px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;"><strong>Publish your salon</strong> and go live instantly</li>
                  <li style="margin-bottom: 8px;"><strong>Receive bookings 24/7</strong> from our customer network</li>
                  <li style="margin-bottom: 8px;"><strong>Manage staff & services</strong> with professional tools</li>
                  <li style="margin-bottom: 0;"><strong>Track revenue & analytics</strong> from your dashboard</li>
                </ul>
              </div>
              
              <!-- Expiration Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px; color: #b45309; font-size: 15px; font-weight: 700;">
                  ⏱️ This verification link expires in <strong>24 hours</strong>
                </p>
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  Verify your email to unlock full business features. You can request a new link if this one expires.
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 15px; line-height: 1.6;">
                Didn't sign up for a business account? You can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 2px solid #f0f0f0; margin: 0;">
            </td>
          </tr>
          
          <!-- Alternative Link Section -->
          <tr>
            <td style="padding: 32px 32px 48px;">
              <p style="margin: 0 0 12px; color: #888888; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Button not working?
              </p>
              <p style="margin: 0 0 12px; color: #666666; font-size: 14px; line-height: 1.5;">
                Copy and paste this link into your browser:
              </p>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #0369a1; font-size: 13px; word-break: break-all; line-height: 1.6;">
                  ${verificationLink}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px; color: #666666; font-size: 14px; font-weight: 600;">
                Need help getting started?
              </p>
              <p style="margin: 0 0 16px; color: #888888; font-size: 13px; line-height: 1.5;">
                Reply to this email or contact our business team at business@salonhub.com
              </p>
              <p style="margin: 0 0 8px; color: #888888; font-size: 13px;">
                This email was sent by <strong style="color: #0369a1;">SalonHub Business</strong>
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 12px;">
                Empowering beauty & wellness businesses worldwide
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Mobile Optimization Notice -->
        <!--[if !mso]><!-->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 16px;">
              <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5;">
                © 2025 SalonHub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const plainText = `
Hi ${name},

Welcome to SalonHub Business! 🚀

Congratulations on joining our platform. You're about to connect with thousands of customers and take your salon to the next level.

To unlock all business features and start receiving bookings, please verify your email address:

${verificationLink}

What you can do after verification:
• Publish your salon and go live instantly
• Receive bookings 24/7 from our customer network
• Manage staff & services with professional tools
• Track revenue & analytics from your dashboard

⏱️ This verification link expires in 24 hours.

Didn't sign up for a business account? You can safely ignore this email.

Need help? Reply to this email or contact our business team at business@salonhub.com

---
SalonHub Business Team
Empowering beauty & wellness businesses worldwide
  `.trim();

  await client.send({
    to: email,
    from: { email: fromEmail, name: 'SalonHub Business' },
    subject: 'Welcome to SalonHub Business! Verify to start receiving bookings 💼',
    html,
    text: plainText
  });
}

export async function sendVerificationReminderEmail(
  email: string,
  verificationLink: string,
  firstName?: string,
  isBusinessUser: boolean = false
) {
  const { client, fromEmail } = await getSendGridClient();

  const name = firstName || 'there';
  const platform = isBusinessUser ? 'SalonHub Business' : 'SalonHub';
  const actionText = isBusinessUser ? 'start receiving bookings' : 'book your first appointment';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - SalonHub</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f7f7f7; padding: 20px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: ${isBusinessUser ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'}; padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ${platform}
              </h1>
            </td>
          </tr>
          
          <!-- Reminder Content -->
          <tr>
            <td style="padding: 48px 32px 32px;">
              <h2 style="margin: 0 0 24px; color: #1a1a1a; font-size: 26px; font-weight: 700; line-height: 1.3;">
                You're almost there! ⏰
              </h2>
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 17px; line-height: 1.6;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 17px; line-height: 1.6;">
                We noticed you haven't verified your email yet. Your account is ready to go — you're just one click away from ${actionText}!
              </p>
              
              <!-- Verify Button -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 36px 0;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: ${isBusinessUser ? 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'}; box-shadow: 0 4px 12px rgba(${isBusinessUser ? '15, 23, 42' : '236, 72, 153'}, 0.4);">
                    <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 18px 48px; color: #ffffff; background-color: transparent; text-decoration: none; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; border-radius: 12px;">
                      Verify My Email Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Troubleshooting Tips -->
              <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 24px; margin: 32px 0; border-radius: 8px;">
                <p style="margin: 0 0 16px; color: #0369a1; font-size: 16px; font-weight: 700;">
                  💡 Common questions:
                </p>
                <div style="color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                  <p style="margin: 0 0 12px;">
                    <strong>Can't find the link?</strong> It's at the end of this email.
                  </p>
                  <p style="margin: 0 0 12px;">
                    <strong>Link not working?</strong> Copy and paste the full URL into your browser.
                  </p>
                  <p style="margin: 0;">
                    <strong>Need a new link?</strong> Log in to your dashboard and click "Resend verification email".
                  </p>
                </div>
              </div>
              
              <!-- Why Verify -->
              <div style="background: linear-gradient(135deg, ${isBusinessUser ? '#eff6ff' : '#fef3ff'} 0%, ${isBusinessUser ? '#e0f2fe' : '#f5f3ff'} 100%); border-left: 4px solid ${isBusinessUser ? '#0369a1' : '#ec4899'}; padding: 24px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0 0 12px; color: ${isBusinessUser ? '#0369a1' : '#7c3aed'}; font-size: 16px; font-weight: 700;">
                  🔒 Why we need verification:
                </p>
                <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                  Email verification helps protect your account from unauthorized access and ensures you receive important booking notifications and updates.
                </p>
              </div>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 15px; line-height: 1.6;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 2px solid #f0f0f0; margin: 0;">
            </td>
          </tr>
          
          <!-- Alternative Link Section -->
          <tr>
            <td style="padding: 32px 32px 48px;">
              <p style="margin: 0 0 12px; color: #888888; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                Verification Link
              </p>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: ${isBusinessUser ? '#0369a1' : '#8b5cf6'}; font-size: 13px; word-break: break-all; line-height: 1.6;">
                  ${verificationLink}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%); padding: 32px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px; color: #666666; font-size: 14px; font-weight: 600;">
                Need help?
              </p>
              <p style="margin: 0 0 16px; color: #888888; font-size: 13px; line-height: 1.5;">
                Reply to this email or contact us at ${isBusinessUser ? 'business@salonhub.com' : 'support@salonhub.com'}
              </p>
              <p style="margin: 0 0 8px; color: #888888; font-size: 13px;">
                This email was sent by <strong style="color: ${isBusinessUser ? '#0369a1' : '#ec4899'};">${platform}</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Copyright -->
        <!--[if !mso]><!-->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 16px;">
              <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5;">
                © 2025 SalonHub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const plainText = `
Hi ${name},

You're almost there! ⏰

We noticed you haven't verified your email yet. Your account is ready to go — you're just one click away from ${actionText}!

Verify your email here:
${verificationLink}

Common questions:
• Can't find the link? It's at the end of this email.
• Link not working? Copy and paste the full URL into your browser.
• Need a new link? Log in to your dashboard and click "Resend verification email".

Why we need verification:
Email verification helps protect your account from unauthorized access and ensures you receive important booking notifications and updates.

If you didn't create this account, you can safely ignore this email.

Need help? Reply to this email or contact us at ${isBusinessUser ? 'business@salonhub.com' : 'support@salonhub.com'}

---
${platform} Team
  `.trim();

  await client.send({
    to: email,
    from: { email: fromEmail, name: platform },
    subject: `Reminder: Verify your email to ${actionText} 📧`,
    html,
    text: plainText
  });
}
