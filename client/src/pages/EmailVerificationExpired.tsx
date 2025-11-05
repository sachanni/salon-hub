import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, Clock, HelpCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

export default function EmailVerificationExpired() {
  const [, navigate] = useLocation();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState('');

  // Get error type from URL
  const urlParams = new URLSearchParams(window.location.search);
  const errorType = urlParams.get('error');

  // Try to get current user (may be logged out)
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    retry: false
  });

  const isAuthenticated = !!currentUser;

  // Resend verification email mutation
  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: isAuthenticated ? undefined : email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend verification email');
      }

      return response.json();
    },
    onSuccess: () => {
      setResendSuccess(true);
    },
  });

  const getErrorTitle = () => {
    switch (errorType) {
      case 'expired':
        return 'Verification Link Expired';
      case 'invalid':
        return 'Invalid Verification Link';
      case 'unknown':
        return 'Verification Failed';
      default:
        return 'Unable to Verify Email';
    }
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case 'expired':
        return 'Your verification link has expired. For security, verification links are only valid for 24 hours.';
      case 'invalid':
        return 'This verification link is invalid or has already been used.';
      case 'unknown':
        return 'We encountered an unexpected error while verifying your email.';
      default:
        return 'We couldn\'t verify your email address. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-rose-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-8 pb-6">
          {resendSuccess ? (
            // Success state after resending
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Email Sent!</h2>
                <p className="text-gray-600">
                  We've sent a new verification link to your email. Please check your inbox and verify your email within 24 hours.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-left">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-gray-900">Check your spam folder</p>
                    <p className="text-gray-600">
                      If you don't see the email in a few minutes, please check your spam or junk folder.
                    </p>
                  </div>
                </div>
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
          ) : (
            // Error state
            <div className="space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-12 h-12 text-orange-600" />
                </div>
              </div>
              
              {/* Error Message */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{getErrorTitle()}</h2>
                <p className="text-gray-600 text-lg">
                  {getErrorMessage()}
                </p>
              </div>

              {/* Troubleshooting Section */}
              <div className="bg-gradient-to-r from-purple-50 to-rose-50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Common Solutions</h3>
                </div>
                
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Request a new verification link</p>
                      <p className="text-gray-600">Click the button below to get a fresh verification link sent to your email.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Check your email for the latest link</p>
                      <p className="text-gray-600">Make sure you're using the most recent verification email we sent you.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Copy the full link</p>
                      <p className="text-gray-600">Some email clients break long links. Try copying and pasting the entire URL into your browser.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* Email Input for unauthenticated users */}
                {!isAuthenticated && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Enter the email address you used to register
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending || (!isAuthenticated && !email)}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all"
                >
                  {resendMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send New Verification Email
                    </>
                  )}
                </Button>

                {resendMutation.isError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">Failed to send email</p>
                        <p className="text-gray-600">
                          {resendMutation.error instanceof Error 
                            ? resendMutation.error.message 
                            : 'Please try again or contact support if the problem persists.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline">
                    <Link href="/login">
                      Go to Login
                    </Link>
                  </Button>
                  
                  <Button asChild variant="ghost">
                    <Link href="/">
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Help Section */}
              <div className="border-t pt-6">
                <div className="text-center text-sm text-gray-600">
                  <p>Still having trouble?</p>
                  <p className="mt-1">
                    Contact us at{' '}
                    <a href="mailto:support@salonhub.com" className="text-purple-600 hover:text-purple-700 font-medium">
                      support@salonhub.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
