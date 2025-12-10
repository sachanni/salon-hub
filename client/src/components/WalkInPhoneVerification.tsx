import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, Loader2, CheckCircle, AlertCircle, ArrowLeft, UserCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { PhoneInput } from "@/components/ui/phone-input";

interface WalkInPhoneVerificationProps {
  onVerified: (data: { phone: string; verificationSessionId: string; userId?: number; alreadyVerified?: boolean }) => void;
  onSkip?: () => void;
  initialPhone?: string;
  allowSkip?: boolean;
  customerName?: string;
}

type Step = 'phone' | 'otp' | 'verified' | 'already-verified';

export function WalkInPhoneVerification({
  onVerified,
  onSkip,
  initialPhone = '',
  allowSkip = false,
  customerName: providedName = '',
}: WalkInPhoneVerificationProps) {
  const [step, setStep] = useState<Step>('phone');
  const [nationalNumber, setNationalNumber] = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [existingUser, setExistingUser] = useState<{ userId: number; firstName?: string; lastName?: string } | null>(null);
  const phoneCheckRef = useRef<string | null>(null);

  const handlePhoneInputChange = useCallback((number: string, valid: boolean, e164: string) => {
    setNationalNumber(number);
    setE164Phone(e164);
    setIsPhoneValid(valid);
  }, []);

  const requestOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await fetch('/api/phone-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: phoneNumber, context: 'walk-in' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      return data;
    },
    onSuccess: () => {
      setStep('otp');
      setCountdown(30);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/phone-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: e164Phone, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      return data;
    },
    onSuccess: (data) => {
      setStep('verified');
      setError(null);
      setTimeout(() => {
        onVerified({
          phone: e164Phone,
          verificationSessionId: data.verificationSessionId,
          userId: data.userId,
        });
      }, 500);
    },
    onError: (err: Error) => {
      setError(err.message);
      setOtp('');
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onPhoneChange = (number: string, valid: boolean, e164: string) => {
    handlePhoneInputChange(number, valid, e164);
    setError(null);
    setExistingUser(null);
  };

  const handleCheckAndSendOtp = async () => {
    if (!isPhoneValid || !e164Phone) {
      setError('Please enter a valid phone number');
      return;
    }
    
    // If customer name is provided, use identity check to verify
    if (providedName && providedName.trim()) {
      try {
        const identityResponse = await fetch('/api/phone-verification/identity-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            phone: e164Phone,
            providedName: providedName.trim(),
          }),
        });
        const identityData = await identityResponse.json();
        
        if (identityData.identityMatched && !identityData.requiresOtp && identityData.verificationSessionId) {
          // Identity verified - skip OTP
          setExistingUser({
            userId: identityData.userId,
            firstName: identityData.firstName,
            lastName: identityData.lastName,
          });
          setStep('already-verified');
          setError(null);
          setTimeout(() => {
            onVerified({
              phone: e164Phone,
              verificationSessionId: identityData.verificationSessionId,
              userId: identityData.userId,
              alreadyVerified: true,
            });
          }, 500);
          return;
        } else if (identityData.reason === 'identity_mismatch') {
          // Identity mismatch - require OTP even if phone is verified
          requestOtpMutation.mutate(e164Phone);
          return;
        }
      } catch (err) {
        console.error('Identity check failed:', err);
      }
    }
    
    // Fallback: check phone status if no name provided
    try {
      const response = await fetch(`/api/phone-verification/status?phone=${encodeURIComponent(e164Phone)}&createSession=true`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.exists && data.phoneVerified && data.verificationSessionId) {
        // User already verified but no name to verify against - still require OTP for safety
        // Only allow bypass if name was checked above
        requestOtpMutation.mutate(e164Phone);
        return;
      }
    } catch (err) {
      // If check fails, continue with OTP flow
      console.error('Phone status check failed:', err);
    }
    
    // Not verified - send OTP
    requestOtpMutation.mutate(e164Phone);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    verifyOtpMutation.mutate(otp);
  };

  const handleResend = () => {
    if (countdown > 0) return;
    requestOtpMutation.mutate(e164Phone);
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          step === 'verified' || step === 'already-verified' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
        }`}>
          {step === 'verified' ? (
            <CheckCircle className="w-4 h-4" />
          ) : step === 'already-verified' ? (
            <UserCheck className="w-4 h-4" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
        </div>
        <span>Phone Verification</span>
        <span className="text-red-500">*</span>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {step === 'phone' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="walkin-phone" className="text-xs">Phone Number</Label>
            <PhoneInput
              id="walkin-phone"
              onChange={onPhoneChange}
              defaultCountry="IN"
              value={initialPhone}
            />
            <p className="text-xs text-muted-foreground">
              Select your country and enter your phone number
            </p>
          </div>

          <div className="flex gap-2">
            {allowSkip && onSkip && (
              <Button variant="ghost" size="sm" onClick={onSkip} className="flex-1">
                Skip
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleCheckAndSendOtp}
              disabled={requestOtpMutation.isPending || !isPhoneValid}
              className="flex-1"
              data-testid="walkin-send-otp"
            >
              {requestOtpMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Checking...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enter 6-Digit Code</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={handleBack}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Change
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Code sent to {e164Phone}
            </p>
            <div className="flex justify-center py-2">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                autoFocus
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
          </div>

          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              onClick={handleVerifyOtp}
              disabled={verifyOtpMutation.isPending || otp.length !== 6}
              className="w-full"
              data-testid="walkin-verify-otp"
            >
              {verifyOtpMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={countdown > 0 || requestOtpMutation.isPending}
              className="w-full text-xs"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </Button>
          </div>
        </div>
      )}

      {step === 'verified' && (
        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              {e164Phone} verified
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setStep('phone');
              setOtp('');
              setError(null);
            }}
          >
            Change
          </Button>
        </div>
      )}

      {step === 'already-verified' && (
        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-sm text-blue-700 font-medium">
                Returning customer
              </span>
              <span className="text-xs text-blue-600">
                {existingUser?.firstName ? `${existingUser.firstName}${existingUser.lastName ? ' ' + existingUser.lastName : ''}` : e164Phone} - Already verified
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setStep('phone');
              setNationalNumber('');
              setE164Phone('');
              setIsPhoneValid(false);
              setExistingUser(null);
              setError(null);
            }}
          >
            Change
          </Button>
        </div>
      )}
    </div>
  );
}
