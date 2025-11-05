import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Mail, ArrowRight, Sparkles, Calendar, Heart } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { applyActionCode } from 'firebase/auth';
import { useQuery } from '@tanstack/react-query';

export default function EmailVerified() {
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'failed'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [, navigate] = useLocation();

  // Get current user to determine next steps
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: verificationStatus === 'verified'
  });

  const isBusinessUser = currentUser?.roles?.includes('owner');

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const alreadyVerified = urlParams.get('already');
      const mode = urlParams.get('mode');
      const oobCode = urlParams.get('oobCode');

      // Check if verification already completed by backend (token-based verification)
      if (alreadyVerified === 'true' || (!mode && !oobCode)) {
        console.log('✅ Backend says email verification completed, confirming with server...');
        
        // Verify with backend to prevent false positives
        try {
          const response = await fetch('/api/auth/user', { credentials: 'include' });
          if (response.ok) {
            const userData = await response.json();
            if (userData.emailVerified === 1) {
              console.log('✅ Email verification confirmed by backend');
              setVerificationStatus('verified');
            } else {
              console.log('❌ Backend says email is not verified');
              setErrorMessage('Your email is not verified yet. Please check your inbox and click the verification link.');
              setVerificationStatus('failed');
            }
          } else if (response.status === 401 || response.status === 403) {
            // Unauthenticated/unauthorized - cannot verify, redirect to login
            console.log('❌ Not authenticated, cannot verify email status');
            setErrorMessage('Please log in to verify your email status.');
            setVerificationStatus('failed');
          } else {
            // Server error - cannot confirm verification
            console.log('❌ Backend check failed, cannot confirm verification');
            setErrorMessage('Unable to verify your email status. Please try again or contact support.');
            setVerificationStatus('failed');
          }
        } catch (error) {
          // Network error - cannot confirm verification
          console.error('❌ Backend check error:', error);
          setErrorMessage('Unable to verify your email status. Please check your connection and try again.');
          setVerificationStatus('failed');
        }
        return;
      }

      // Firebase verification flow (backwards compatibility)
      if (!auth) {
        // Firebase not configured - cannot verify with Firebase, treat as failure
        console.log('❌ Firebase not configured, cannot verify');
        setErrorMessage('Unable to verify your email. Please try logging in to check your verification status.');
        setVerificationStatus('failed');
        return;
      }

      try {
        console.log('📧 Email verification - mode:', mode, 'code:', oobCode ? 'present' : 'missing');

        if (mode !== 'verifyEmail' || !oobCode) {
          // Invalid Firebase params - treat as failure
          console.log('❌ Invalid Firebase verification parameters');
          setErrorMessage('Invalid verification link. Please check your email and try again.');
          setVerificationStatus('failed');
          return;
        }

        // Apply the Firebase action code
        await applyActionCode(auth, oobCode);
        
        console.log('✅ Email verified successfully via Firebase');
        setVerificationStatus('verified');
        
        // Update backend database
        try {
          await fetch('/api/auth/update-email-verification', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emailVerified: true }),
          });
          console.log('✅ Backend database updated');
        } catch (error) {
          console.error('Backend update failed:', error);
        }
        
      } catch (error: any) {
        console.error('❌ Error verifying email:', error);
        
        let message = 'Unable to verify your email. ';
        
        if (error.code === 'auth/invalid-action-code') {
          message += 'This verification link has expired or has already been used.';
        } else if (error.code === 'auth/expired-action-code') {
          message += 'This verification link has expired. Please request a new one.';
        } else {
          message += error.message || 'Please try again or request a new verification email.';
        }
        
        setErrorMessage(message);
        setVerificationStatus('failed');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-rose-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6">
          {verificationStatus === 'checking' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-purple-600 animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Verifying Email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </div>
          )}

          {verificationStatus === 'verified' && (
            <div className="text-center space-y-6">
              {/* Celebration Animation */}
              <div className="flex justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-green-100/50 animate-ping" />
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center relative z-10 shadow-lg">
                  <CheckCircle2 className="w-12 h-12 text-white animate-bounce" style={{ animationDuration: '1s', animationIterationCount: '3' }} />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-rose-600 bg-clip-text text-transparent">
                    You're All Set!
                  </h2>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-gray-600 text-lg">
                  Your email has been successfully verified. Welcome to SalonHub!
                </p>
              </div>

              {/* Smart Next Steps */}
              <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-left flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  {isBusinessUser ? "Let's grow your business" : "What's next?"}
                </h3>
                
                {isBusinessUser ? (
                  <div className="text-left space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Complete your business setup</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Add your services and pricing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Start receiving bookings 24/7</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-left space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Discover top-rated salons near you</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Book your next appointment</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Enjoy exclusive member offers</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  asChild 
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Link href={isBusinessUser ? "/business/dashboard" : "/customer/dashboard"}>
                    {isBusinessUser ? "Go to Business Dashboard" : "Start Browsing"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {verificationStatus === 'failed' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                  <Mail className="w-12 h-12 text-red-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                <p className="text-gray-600">
                  {errorMessage || 'We couldn\'t verify your email address. The link may have expired or is invalid.'}
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">
                    Go to Login
                  </Link>
                </Button>
                
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
