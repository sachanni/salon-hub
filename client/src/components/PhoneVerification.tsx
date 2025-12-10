import { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, Auth } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string, verificationId?: string) => void;
  initialPhone?: string;
  required?: boolean;
  customerName?: string;
  customerEmail?: string;
}

export function PhoneVerification({ onVerified, initialPhone = '', required = true, customerName: providedName = '', customerEmail: providedEmail = '' }: PhoneVerificationProps) {
  const [nationalNumber, setNationalNumber] = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [identitySessionId, setIdentitySessionId] = useState<string | null>(null);
  
  const handlePhoneChange = (number: string, valid: boolean, e164: string) => {
    setNationalNumber(number);
    setE164Phone(e164);
    setIsPhoneValid(valid);
  };
  
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
    let verifier: RecaptchaVerifier | null = null;
    
    try {
      // Clear any existing reCAPTCHA widgets from the container first
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }

      verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
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
    } catch (error: any) {
      console.error('Error initializing reCAPTCHA:', error);
      
      // If the error is about already being rendered, clear and retry once
      if (error.message && error.message.includes('already been rendered')) {
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }
        toast({
          title: "Please try again",
          description: "Click 'Send OTP' to verify your phone number.",
        });
      } else {
        toast({
          title: "Verification setup failed",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      }
    }

    return () => {
      // Cleanup: safely clear the verifier
      if (verifier) {
        try {
          verifier.clear();
        } catch (error) {
          // Silently handle cleanup errors to avoid console spam
          console.debug('reCAPTCHA cleanup skipped:', error);
        }
      }
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

  // Check phone status when user enters a valid phone number
  useEffect(() => {
    // Only check status when we have a valid E.164 phone (minimum 11 chars: +XX NNNNNNNN)
    if (isPhoneValid && e164Phone && e164Phone.length >= 11 && !isVerified && !isOtpSent) {
      const checkStatus = async () => {
        setIsCheckingStatus(true);
        try {
          const response = await fetch(`/api/phone-verification/status?phone=${encodeURIComponent(e164Phone)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.exists && data.phoneVerified) {
              // Phone is verified in system - but we need to verify identity before allowing bypass
              setCustomerName(data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : null);
              // Don't auto-set isReturningCustomer - identity check will determine this
              setIsReturningCustomer(false);
            } else {
              setIsReturningCustomer(false);
              setCustomerName(null);
            }
          }
        } catch (error) {
          console.error('Error checking phone status:', error);
        } finally {
          setIsCheckingStatus(false);
        }
      };
      checkStatus();
    } else if (!isPhoneValid) {
      setIsReturningCustomer(false);
      setCustomerName(null);
    }
  }, [e164Phone, isPhoneValid, isVerified, isOtpSent]);

  // Track last checked values to avoid redundant checks
  const lastCheckedRef = useRef<{ phone: string; name: string; email: string } | null>(null);

  // Perform identity check when name/email is provided with valid phone
  useEffect(() => {
    if (isPhoneValid && e164Phone && e164Phone.length >= 11 && !isVerified && !isOtpSent && (providedName || providedEmail)) {
      // Skip if we already have a valid session for the same inputs
      const currentInputs = { phone: e164Phone, name: providedName, email: providedEmail };
      if (identitySessionId && lastCheckedRef.current &&
          lastCheckedRef.current.phone === currentInputs.phone &&
          lastCheckedRef.current.name === currentInputs.name &&
          lastCheckedRef.current.email === currentInputs.email) {
        return; // Already have a valid session for these inputs
      }

      const performIdentityCheck = async () => {
        setIsCheckingStatus(true);
        try {
          const response = await fetch('/api/phone-verification/identity-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: e164Phone,
              providedName: providedName,
              providedEmail: providedEmail,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            lastCheckedRef.current = currentInputs;
            
            if (data.identityMatched && !data.requiresOtp && data.verificationSessionId) {
              // Identity verified - allow bypass with session ID
              setIsReturningCustomer(true);
              setCustomerName(data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : providedName);
              setIdentitySessionId(data.verificationSessionId);
            } else {
              // Identity mismatch or no verified user - require OTP
              setIsReturningCustomer(false);
              setIdentitySessionId(null);
            }
          }
        } catch (error) {
          console.error('Error performing identity check:', error);
          // Don't clear existing session on network errors
        } finally {
          setIsCheckingStatus(false);
        }
      };
      
      // Debounce to avoid too many calls while user is typing
      const timer = setTimeout(performIdentityCheck, 500);
      return () => clearTimeout(timer);
    }
  }, [e164Phone, isPhoneValid, providedName, providedEmail, isVerified, isOtpSent, identitySessionId]);

  // Handle returning customer verification (skip OTP)
  const handleReturningCustomer = () => {
    if (!identitySessionId) {
      // No valid session - require OTP
      toast({
        title: "Verification required",
        description: "Please verify with OTP to continue.",
        variant: "destructive",
      });
      return;
    }
    setIsVerified(true);
    toast({
      title: "Welcome back!",
      description: customerName ? `Phone verified for ${customerName}` : "Your phone number is already verified.",
      duration: 3000,
    });
    onVerified(e164Phone, identitySessionId);
  };

  const sendOTP = async () => {
    if (!isPhoneValid) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
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
      console.log('Sending OTP to:', e164Phone);

      const confirmation = await signInWithPhoneNumber(auth, e164Phone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      setResendCooldown(30); // 30 second cooldown

      toast({
        title: "OTP sent successfully!",
        description: `A 6-digit code has been sent to ${e164Phone}`,
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
      try {
        recaptchaVerifier.clear();
        
        // Clear the container before creating a new verifier
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }
        
        const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          }
        });
        setRecaptchaVerifier(newVerifier);
      } catch (resetError) {
        console.error('Failed to reset reCAPTCHA:', resetError);
        // If reset fails, clear container and ask user to try again
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
        }
        toast({
          title: "Please try again",
          description: "Click 'Send OTP' again to verify your phone number.",
        });
      }
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
      onVerified(e164Phone, idToken);

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
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <PhoneInput
              id="phone-verify"
              onChange={handlePhoneChange}
              disabled={isOtpSent || isVerified}
              defaultCountry="IN"
              value={initialPhone}
            />
            {!isOtpSent && !isVerified && (
              isCheckingStatus ? (
                <Button
                  type="button"
                  disabled
                  className="bg-purple-600 hover:bg-purple-700 shrink-0"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </Button>
              ) : isReturningCustomer ? (
                <Button
                  type="button"
                  onClick={handleReturningCustomer}
                  disabled={!isPhoneValid}
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={sendOTP}
                  disabled={isSending || !isPhoneValid}
                  className="bg-purple-600 hover:bg-purple-700 shrink-0"
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
              )
            )}
            {isVerified && (
              <Button
                type="button"
                disabled
                className="bg-green-600 hover:bg-green-700 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Verified
              </Button>
            )}
          </div>
        </div>
        {!isOtpSent && !isVerified && (
          <p className="text-xs text-gray-500">
            {isReturningCustomer 
              ? (customerName ? `Welcome back, ${customerName}! Click Continue to proceed.` : 'Welcome back! Your phone is already verified.')
              : 'Select your country and enter your phone number'}
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
