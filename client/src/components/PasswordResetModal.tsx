import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Send, Phone, CheckCircle2, XCircle, Loader2, X, Smartphone } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface PasswordResetModalProps {
  open: boolean;
  onClose: () => void;
}

export function PasswordResetModal({ open, onClose }: PasswordResetModalProps) {
  const [resetMethod, setResetMethod] = useState<'email' | 'phone' | null>(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'choose' | 'verify-otp' | 'reset-password'>('choose');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  
  const { toast } = useToast();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Initialize reCAPTCHA on component mount
  useEffect(() => {
    if (!open) return;
    
    if (!auth) {
      toast({
        title: "Firebase not configured",
        description: "Phone verification is not available.",
        variant: "destructive",
      });
      return;
    }

    // Setup invisible reCAPTCHA
    const verifier = new RecaptchaVerifier(auth, 'password-reset-recaptcha', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved for password reset');
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
  }, [open, toast]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Format phone number to E.164 format
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    if (phone.startsWith('+')) {
      return phone;
    }
    
    return '+' + cleaned;
  };

  const handleSendEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send password reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOTP = async () => {
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

    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      console.log('Sending OTP to:', formattedPhone);

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      setResendCooldown(30);
      
      toast({
        title: "OTP Sent",
        description: `A 6-digit code has been sent to ${formattedPhone}`,
      });
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try email reset or contact support.';
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!confirmationResult) {
      setError('Please request OTP first');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify the OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken();
      
      // CRITICAL: Store the E.164 formatted phone number (same format used by Firebase)
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      console.log('OTP verified successfully');
      
      // Store the Firebase token and FORMATTED phone number for password reset
      sessionStorage.setItem('password_reset_token', firebaseToken);
      sessionStorage.setItem('password_reset_phone', formattedPhone);
      
      setStep('reset-password');
      
      toast({
        title: "Phone Verified",
        description: "Please enter your new password",
      });
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.';
      }
      
      setError(errorMessage);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const firebaseToken = sessionStorage.getItem('password_reset_token');
    const phone = sessionStorage.getItem('password_reset_phone');

    if (!firebaseToken || !phone) {
      setError('Session expired. Please start over.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password-via-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firebaseToken,
          phoneNumber: phone,
          newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear session storage
        sessionStorage.removeItem('password_reset_token');
        sessionStorage.removeItem('password_reset_phone');
        
        setSuccess(true);
        toast({
          title: "Password Reset Successfully",
          description: "You can now login with your new password",
        });
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResetMethod(null);
    setEmail('');
    setPhoneNumber('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess(false);
    setError('');
    setIsOtpSent(false);
    setConfirmationResult(null);
    setStep('choose');
    sessionStorage.removeItem('password_reset_token');
    sessionStorage.removeItem('password_reset_phone');
    onClose();
  };

  return (
    <>
      <div id="password-reset-recaptcha" ref={recaptchaContainerRef}></div>
      
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">
                Reset Your Password
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {step === 'choose' && (
              <p className="text-sm text-muted-foreground mt-1">
                Choose your preferred password reset method
              </p>
            )}
          </DialogHeader>

          {success ? (
            <div className="space-y-6 mt-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {resetMethod === 'email' ? 'Check Your Email' : 'Password Reset Successfully'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {resetMethod === 'email' 
                      ? `If an account exists with ${email}, you will receive a password reset link.`
                      : 'Your password has been reset successfully. You can now login with your new password.'}
                  </p>
                </div>
              </div>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          ) : step === 'choose' ? (
            <div className="space-y-4 mt-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      Reset via Email (Recommended)
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                      Get an instant password reset link sent to your email.
                    </p>
                    
                    <form onSubmit={handleSendEmailReset} className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-green-900 dark:text-green-100 block mb-2">
                          Email Address
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="your.email@example.com"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setResetMethod('email');
                              }}
                              required
                              disabled={loading}
                              className="pl-10 bg-white dark:bg-gray-900 border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500"
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={loading || !email}
                            className="bg-green-600 hover:bg-green-700 text-white px-6"
                          >
                            {loading && resetMethod === 'email' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Send
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Smartphone className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Reset via Phone OTP
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                      Verify your identity with a one-time code sent to your phone.
                    </p>
                    
                    <Button
                      type="button"
                      onClick={() => {
                        setResetMethod('phone');
                        setStep('verify-otp');
                      }}
                      variant="outline"
                      className="w-full border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Continue with Phone
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : step === 'verify-otp' ? (
            <div className="space-y-4 mt-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {!isOtpSent ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200/50">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Enter your phone number to receive a one-time verification code via SMS.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('choose')}
                      disabled={loading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={sendPhoneOTP}
                      disabled={loading || !phoneNumber}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200/50">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      We've sent a 6-digit verification code to <strong>{formatPhoneNumber(phoneNumber)}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enter OTP</label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        disabled={loading}
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

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (resendCooldown === 0) {
                          sendPhoneOTP();
                        }
                      }}
                      disabled={loading || resendCooldown > 0}
                      className="flex-1"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </Button>
                    <Button
                      type="button"
                      onClick={verifyOTP}
                      disabled={loading || otp.length !== 6}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify OTP'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200/50">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Create a new password for your account.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
