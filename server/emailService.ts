import { MailService } from '@sendgrid/mail';

let mailService: MailService | null = null;

function getMailService(): MailService | null {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not set - email functionality disabled");
    return null;
  }
  
  if (!mailService) {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
  }
  
  return mailService;
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  const service = getMailService();
  
  if (!service) {
    console.log(`Email would be sent to ${params.to}: ${params.subject}`);
    return false; // Email functionality disabled
  }
  
  try {
    await service.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateVerificationEmailHTML(firstName: string, verificationLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your SalonHub email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #8b5cf6; font-size: 24px; margin: 0;">SalonHub</h1>
            </div>
            
            <!-- Main Content -->
            <div style="text-align: center;">
                <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">
                    Hi ${firstName}, please verify your email address
                </h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                    To keep your account secure we need to check that the email address belongs to you. 
                    You'll only need to do this once, click below to verify now.
                </p>
                
                <!-- Verify Button -->
                <div style="margin: 40px 0;">
                    <a href="${verificationLink}" 
                       style="background-color: #333; color: white; padding: 12px 30px; text-decoration: none; 
                              border-radius: 6px; font-weight: bold; display: inline-block;">
                        Verify email
                    </a>
                </div>
                
                <!-- Alternative link -->
                <p style="color: #999; font-size: 14px; margin-top: 30px;">
                    If the button doesn't work, copy and paste this link: <br>
                    <a href="${verificationLink}" style="color: #8b5cf6;">${verificationLink}</a>
                </p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid #eee; text-align: center;">
                <h3 style="color: #333; font-size: 18px; margin-bottom: 10px;">Why did I receive this?</h3>
                <p style="color: #666; font-size: 14px; line-height: 1.5;">
                    Your email address was used to create an account on SalonHub. If you have received this email by mistake, you can safely ignore it.
                </p>
                
                <div style="margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">
                        The world's premier beauty & wellness booking platform, trusted by millions worldwide.<br>
                        Powerful features, unlimited possibilities.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(
  email: string, 
  firstName: string, 
  verificationToken: string
): Promise<boolean> {
  const verificationLink = `${process.env.REPL_SLUG ? 
    `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
    'http://localhost:5000'}/verify-email?token=${verificationToken}`;
    
  const htmlContent = generateVerificationEmailHTML(firstName, verificationLink);
  
  // Use environment variable for FROM email, fallback to placeholder
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@example.com';
  
  return await sendEmail({
    to: email,
    from: fromEmail,
    subject: 'Verify your SalonHub email',
    html: htmlContent,
    text: `Hi ${firstName}, please verify your email address by clicking this link: ${verificationLink}`
  });
}