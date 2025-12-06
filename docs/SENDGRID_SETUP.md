# SendGrid Domain Authentication Setup Guide

## Why Domain Authentication is Important

Your password reset emails are currently going to the **junk/spam folder** because your domain (`aulnovatechsoft.com`) is not authenticated with SendGrid. Email providers like Outlook, Gmail, and Yahoo use SPF, DKIM, and DMARC records to verify that emails are legitimately sent from your domain.

**Without domain authentication:**
- ✗ Emails go to spam/junk folders
- ✗ Lower email deliverability rates
- ✗ Domain appears as "unverified" to recipients

**With domain authentication:**
- ✓ Emails land in inbox (not spam)
- ✓ 95%+ email deliverability
- ✓ Professional sender reputation

---

## Step-by-Step Setup Instructions

### Step 1: Access SendGrid Domain Authentication

1. Log into your SendGrid account at [https://sendgrid.com](https://sendgrid.com)
2. Navigate to **Settings** → **Sender Authentication**
3. Click **Authenticate Your Domain**

### Step 2: Domain Setup in SendGrid

1. **Select your DNS provider**: Choose your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. **Enter your domain**: `aulnovatechsoft.com`
3. **Choose "Yes" for branded links** (optional but recommended for better tracking)
4. SendGrid will generate DNS records for you

### Step 3: Add DNS Records to Your Domain

SendGrid will provide you with **3 types of DNS records** that need to be added to your domain's DNS settings:

#### A) CNAME Records for DKIM (DomainKeys Identified Mail)

You'll receive 3 CNAME records that look like this:

| Type  | Host/Name                          | Value/Points To                                    | TTL  |
|-------|------------------------------------|----------------------------------------------------|------|
| CNAME | s1._domainkey.aulnovatechsoft.com | s1.domainkey.u12345.wl123.sendgrid.net           | 3600 |
| CNAME | s2._domainkey.aulnovatechsoft.com | s2.domainkey.u12345.wl123.sendgrid.net           | 3600 |
| CNAME | em1234.aulnovatechsoft.com        | u12345.wl123.sendgrid.net                         | 3600 |

*Note: The actual values will be different - copy them exactly from SendGrid*

#### B) TXT Record for SPF (Sender Policy Framework)

If you don't already have an SPF record, you'll add one like this:

| Type | Host/Name              | Value/Points To                           | TTL  |
|------|------------------------|-------------------------------------------|------|
| TXT  | aulnovatechsoft.com   | v=spf1 include:sendgrid.net ~all         | 3600 |

**Important:** If you already have an SPF record, you need to **modify** it to include SendGrid:
- Existing: `v=spf1 include:_spf.google.com ~all`
- Updated: `v=spf1 include:_spf.google.com include:sendgrid.net ~all`

*Note: You can only have ONE SPF record per domain*

#### C) TXT Record for DMARC (Domain-based Message Authentication)

Add a DMARC policy to tell email providers what to do with unauthenticated emails:

| Type | Host/Name                    | Value/Points To                                      | TTL  |
|------|------------------------------|------------------------------------------------------|------|
| TXT  | _dmarc.aulnovatechsoft.com  | v=DMARC1; p=none; rua=mailto:niraj@aulnovatechsoft.com | 3600 |

**DMARC Policy Levels:**
- `p=none` - Monitor only (recommended to start)
- `p=quarantine` - Send suspicious emails to spam
- `p=reject` - Reject suspicious emails entirely

### Step 4: Add DNS Records to Your Domain Registrar

**Where to add these records:**

1. Log into your domain registrar (where you purchased `aulnovatechsoft.com`)
2. Find **DNS Management** or **DNS Settings**
3. Add each record **exactly** as provided by SendGrid
4. Save your changes

**Common domain registrars:**
- **GoDaddy**: My Products → Domain → DNS → Add Record
- **Namecheap**: Domain List → Manage → Advanced DNS → Add New Record
- **Cloudflare**: Dashboard → DNS → Add Record
- **Google Domains**: My Domains → DNS → Custom Records

### Step 5: Verify Domain Authentication in SendGrid

1. After adding all DNS records to your domain, go back to SendGrid
2. Click **Verify Domain**
3. SendGrid will check your DNS records (this may take 24-48 hours to propagate)
4. Once verified, you'll see a **green checkmark** ✓

---

## Testing Email Deliverability

After domain authentication is verified:

1. **Test the password reset flow:**
   - Go to `/login/business`
   - Click "Forgot password?"
   - Enter your business email
   - Check your **inbox** (not spam!)

2. **Check email headers:**
   - Open the received email
   - View email source/headers
   - Look for:
     - `SPF: PASS`
     - `DKIM: PASS`
     - `DMARC: PASS`

---

## Troubleshooting

### DNS records not verifying?

**Wait 24-48 hours** - DNS propagation can take time

**Check your DNS records:**
```bash
# Check DKIM records
nslookup -type=CNAME s1._domainkey.aulnovatechsoft.com

# Check SPF record
nslookup -type=TXT aulnovatechsoft.com

# Check DMARC record
nslookup -type=TXT _dmarc.aulnovatechsoft.com
```

### Emails still going to spam?

1. **Verify domain is authenticated** in SendGrid (green checkmark)
2. **Wait 24 hours** after authentication for sender reputation to improve
3. **Ask recipients** to mark your email as "Not Spam" to train filters
4. **Check email content** - avoid spam trigger words like "FREE", "URGENT", excessive caps

### Multiple SPF records error?

- You can only have **ONE SPF record** per domain
- If you have multiple services (Google, SendGrid), combine them:
  ```
  v=spf1 include:_spf.google.com include:sendgrid.net ~all
  ```

---

## Environment Variables (Already Configured)

✓ `SENDGRID_API_KEY` - Your SendGrid API key (set)  
✓ `SENDGRID_FROM_EMAIL` - niraj@aulnovatechsoft.com (set)  
✓ `APP_BASE_URL` - (optional) Custom production domain  

---

## Current Status

✅ SendGrid API key configured  
✅ From email set to niraj@aulnovatechsoft.com  
✅ Email button styling fixed for Outlook  
✅ Reset password URL fixed to use correct domain  
⏳ **Domain authentication pending** (requires DNS record setup)

---

## Summary Checklist

- [ ] Log into SendGrid account
- [ ] Navigate to Settings → Sender Authentication
- [ ] Click "Authenticate Your Domain"
- [ ] Enter domain: `aulnovatechsoft.com`
- [ ] Copy all DNS records provided by SendGrid
- [ ] Add CNAME records (3x) to domain DNS settings
- [ ] Add/update SPF TXT record
- [ ] Add DMARC TXT record
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Verify domain in SendGrid (click "Verify")
- [ ] Test password reset email delivery
- [ ] Check email lands in inbox (not spam)

---

## Need Help?

- **SendGrid Documentation**: [https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- **SendGrid Support**: Available in your SendGrid dashboard
- **DNS Propagation Checker**: [https://dnschecker.org](https://dnschecker.org)
