import { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, Auth } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string, verificationId?: string) => void;
  initialPhone?: string;
  required?: boolean;
}

export function PhoneVerification({ onVerified, initialPhone = '', required = true }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  
  const { toast } = useToast();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Initialize reCAPTCHA on component mount
  useEffect(() => {
    if (!auth) {
      toast({
        title: "Firebase not configured",
        description: "Phone verification is not available. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Setup invisible reCAPTCHA
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        toast({
          title: "Verification expired",
          description: "Please try sending OTP again.",
          variant: "destructive",
        });
      }
    });

    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, [toast]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Format phone number to E.164 format (international)
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If starts with 91 (India), add +
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // If doesn't start with country code, assume India (+91)
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    // If already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: add + if not present
    return '+' + cleaned;
  };

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    if (!recaptchaVerifier || !auth) {
      toast({
        title: "Verification not ready",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('Sending OTP to:', formattedPhone);

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      setResendCooldown(30); // 30 second cooldown

      toast({
        title: "OTP sent successfully!",
        description: `A 6-digit code has been sent to ${formattedPhone}`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = "Failed to send OTP. Please try again.";
      let debugInfo = error.code ? `Error code: ${error.code}` : error.message;
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format. Please check and try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = "Daily SMS quota exceeded. Please try again tomorrow.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized. Please add it to Firebase Console.";
        debugInfo = "Go to Firebase Console → Authentication → Settings → Authorized domains";
      } else if (error.message && error.message.includes('reCAPTCHA')) {
        errorMessage = "reCAPTCHA verification failed. Please refresh and try again.";
      }

      toast({
        title: "Failed to send OTP",
        description: `${errorMessage}\n\n${debugInfo}`,
        variant: "destructive",
      });

      // Reset reCAPTCHA on error
      recaptchaVerifier.clear();
      const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      setRecaptchaVerifier(newVerifier);
    } finally {
      setIsSending(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    if (!confirmationResult) {
      toast({
        title: "Error",
        description: "Please request OTP first",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const result = await confirmationResult.confirm(otp);
      console.log('Phone verification successful:', result.user.uid);
      
      setIsVerified(true);
      
      toast({
        title: "Phone verified successfully!",
        description: "Your phone number has been verified.",
        duration: 3000,
      });

      // Get Firebase ID token
      const idToken = await result.user.getIdToken();
      
      // Call parent callback with verified phone and token
      onVerified(formatPhoneNumber(phoneNumber), idToken);

    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      
      let errorMessage = "Invalid OTP. Please check and try again.";
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid OTP code. Please check and try again.";
      } else if (error.code === 'auth/code-expired') {
        errorMessage = "OTP has expired. Please request a new one.";
      }

      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOTP = () => {
    setIsOtpSent(false);
    setOtp('');
    setConfirmationResult(null);
    sendOTP();
  };

  return (
    <div className="space-y-4">
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

      {/* Phone Number Input */}
      <div className="space-y-2">
        <Label htmlFor="phone-verify" className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Phone Number {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex gap-2">
          <Input
            id="phone-verify"
            type="tel"
            placeholder="+91 9XXXXXXXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isOtpSent || isVerified}
            className="flex-1"
            maxLength={13}
          />
          {!isOtpSent && !isVerified && (
            <Button
              type="button"
              onClick={sendOTP}
              disabled={isSending || !phoneNumber || phoneNumber.length < 10}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Send OTP
                </>
              )}
            </Button>
          )}
          {isVerified && (
            <Button
              type="button"
              disabled
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verified
            </Button>
          )}
        </div>
        {!isOtpSent && (
          <p className="text-xs text-gray-500">
            Enter your phone number to receive a verification code
          </p>
        )}
      </div>

      {/* OTP Input (shown after OTP is sent) */}
      {isOtpSent && !isVerified && (
        <div className="space-y-3">
          <Label htmlFor="otp-input" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Enter 6-Digit OTP
          </Label>
          
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={verifyOTP}
              disabled={isVerifying || otp.length !== 6}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify OTP
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={resendOTP}
              disabled={resendCooldown > 0 || isSending}
            >
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Didn't receive the code? Check your SMS or click resend.
          </p>
        </div>
      )}

      {/* Verification Success Message */}
      {isVerified && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">
            Phone number verified successfully!
          </span>
        </div>
      )}
    </div>
  );
}
