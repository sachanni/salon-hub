import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Mail, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { applyActionCode } from 'firebase/auth';

export default function EmailVerified() {
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'failed'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmailFromLink = async () => {
      if (!auth) {
        setVerificationStatus('failed');
        setErrorMessage('Firebase is not configured');
        return;
      }

      try {
        // Get the action code from the URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const oobCode = urlParams.get('oobCode');

        console.log('📧 Email verification - mode:', mode, 'code:', oobCode ? 'present' : 'missing');

        if (mode !== 'verifyEmail' || !oobCode) {
          setVerificationStatus('failed');
          setErrorMessage('Invalid verification link. Please check your email and try again.');
          return;
        }

        // Apply the action code to verify the email
        await applyActionCode(auth, oobCode);
        
        console.log('✅ Email verified successfully via action code');
        setVerificationStatus('verified');
        
        // Update backend database to mark email as verified
        try {
          await fetch('/api/auth/update-email-verification', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emailVerified: true }),
          });
          console.log('✅ Backend database updated with email verification status');
        } catch (error) {
          console.error('Failed to update backend:', error);
          // Don't fail the whole verification if backend update fails
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

    verifyEmailFromLink();
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
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                <p className="text-gray-600">
                  Your email has been successfully verified. You can now access all features of SalonHub.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
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
