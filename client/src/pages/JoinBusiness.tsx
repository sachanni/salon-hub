import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Building, User, Mail, Phone, Lock, TrendingUp, Award } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import professionalImage from "@assets/stock_images/professional_hair_st_a5606468.jpg";
import { SocialLogin } from "@/components/SocialLogin";
import { handleSocialAuth } from "@/lib/socialAuth";
import { PhoneVerification } from "@/components/PhoneVerification";
import { sendWelcomeEmailWithVerification } from "@/lib/emailVerification";

export default function JoinBusiness() {
  const [, setLocation] = useLocation();
  
  // Get work preference from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const workPreference = searchParams.get('preference') || '';
  
  const [formData, setFormData] = useState({
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    panNumber: "",
    gstNumber: "",
    workPreference,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [firebaseToken, setFirebaseToken] = useState<string | undefined>();
  const { toast } = useToast();
  const { checkAuth, isAuthenticated, user } = useAuth();

  // Redirect authenticated users away from registration page
  useEffect(() => {
    if (isAuthenticated && user) {
      // If user has salons, go to dashboard
      if (user.orgMemberships && user.orgMemberships.length > 0) {
        setLocation('/dashboard');
      } else {
        // If no salons, go to business setup
        setLocation('/business/setup');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  // Handle redirect after state update
  useEffect(() => {
    if (shouldRedirect) {
      console.log('Executing redirect via useEffect');
      const timer = setTimeout(() => {
        console.log('Forcing navigation to /business/setup');
        window.location.href = '/business/setup';
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

  const handlePhoneVerified = (phone: string, token?: string) => {
    setFormData(prev => ({ ...prev, phone }));
    setPhoneVerified(true);
    setFirebaseToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneVerified) {
      toast({
        title: "Phone verification required",
        description: "Please verify your phone number before creating an account.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // AUTHENTICATION FIX: Include credentials for cookie handling
        body: JSON.stringify({
          ...formData,
          userType: 'owner',
          firebaseToken,
          phoneVerified: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Registration successful, data:', data);
        
        // Store user data immediately with error handling
        try {
          if (data.token) {
            localStorage.setItem('token', data.token);
            console.log('Token stored');
          }
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('User data stored');
          }
        } catch (error) {
          console.warn('Failed to store auth data:', error);
        }

        // Send welcome email with verification link using Firebase
        console.log('📧 Sending welcome email with verification link...');
        const emailResult = await sendWelcomeEmailWithVerification(
          formData.email,
          formData.password
        );

        if (emailResult.success) {
          console.log('✅ Verification email sent successfully');
          toast({
            title: "Welcome to SalonHub!",
            description: "Registration successful! Please check your email to verify your account.",
            duration: 6000,
          });
        } else {
          console.error('❌ Email verification failed:', emailResult.error);
          toast({
            title: "Email verification failed",
            description: emailResult.message || "Failed to send verification email. Please contact support.",
            variant: "destructive",
            duration: 6000,
          });
        }
        
        console.log('Registration complete, refreshing auth state');
        
        // Refresh authentication state to update isAuthenticated in AuthContext
        await checkAuth();
        
        console.log('Auth state refreshed, triggering redirect');
        
        // Handle backend-provided redirect (production-ready auto-detection)
        if (data.redirect) {
          console.log(`Backend suggested redirect to: ${data.redirect}`);
          setTimeout(() => {
            setLocation(data.redirect);
          }, 1000);
        } else {
          // Fallback: Trigger redirect via React state
          setShouldRedirect(true);
        }
      } else {
        // Handle "User already exists" error with smart detection (Fresha pattern)
        if (data.error === "User with this email already exists") {
          await handleExistingUser(formData.email);
        } else {
          toast({
            title: "Registration Failed",
            description: data.error || "Something went wrong. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExistingUser = async (email: string) => {
    try {
      // Check profile completion status for existing user
      const response = await fetch('/api/auth/check-profile-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.exists && data.isOwner) {
        if (!data.hasProfile || !data.profileComplete) {
          // User exists but has incomplete profile - automatically redirect
          toast({
            title: "Welcome back!",
            description: data.hasProfile 
              ? `Redirecting to continue your salon setup. ${data.missingRequirements?.length || 0} steps remaining.`
              : "Redirecting to complete your salon profile...",
            duration: 3000,
          });
          
          // Immediately redirect to business setup at the appropriate step
          setTimeout(() => {
            setLocation(data.resumeUrl || '/business/setup');
          }, 1000);
        } else {
          // User exists and profile is complete
          toast({
            title: "Account Already Exists",
            description: "Your salon profile is complete. Please sign in to access your dashboard.",
            action: (
              <ToastAction
                altText="Sign In"
                onClick={() => {
                  setLocation('/login');
                }}
              >
                Sign In
              </ToastAction>
            )
          });
        }
      } else if (data.exists && !data.isOwner) {
        // User exists but is not a business owner
        toast({
          title: "Account Already Exists",
          description: "An account with this email exists but is not a business account.",
          variant: "destructive",
        });
      } else {
        // Fallback to generic error
        toast({
          title: "Registration Failed", 
          description: "User with this email already exists.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      toast({
        title: "Registration Failed",
        description: "User with this email already exists.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-100 to-rose-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-8">
            <Button 
              onClick={() => window.history.back()} 
              variant="ghost" 
              size="sm" 
              data-testid="button-back"
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create Business Account</h1>
                <p className="text-muted-foreground">
                  Start managing your salon business
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section Header */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Account Owner Information</h3>
            </div>
            
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  data-testid="input-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Doe"
                  data-testid="input-lastname"
                />
              </div>
            </div>

            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Business Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@salonname.com"
                  className="pl-10"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>
            
            {/* Phone Verification */}
            <PhoneVerification
              onVerified={handlePhoneVerified}
              initialPhone={formData.phone}
              required={true}
            />
            
            {/* PAN Number */}
            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                value={formData.panNumber}
                onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                maxLength={10}
                data-testid="input-pannumber"
              />
            </div>
            
            {/* GST Number */}
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                data-testid="input-gstnumber"
              />
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  data-testid="input-password"
                />
              </div>
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base" 
              disabled={isLoading}
              data-testid="button-create-business-account"
            >
              {isLoading ? "Creating Account..." : "Create Business Account"}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>By creating a business account, you agree to our Terms of Service and Privacy Policy.</p>
              <p className="text-emerald-600 dark:text-emerald-400">
                After registration, you'll be able to add your salon details and start accepting bookings.
              </p>
            </div>
          </form>

          {/* Social Login */}
          <SocialLogin 
            userType="owner" 
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Right Side - Image & Benefits */}
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0">
          <img 
            src={professionalImage} 
            alt="Professional hair stylist working in modern salon" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-blue-600/90" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Grow your salon business
            </h2>
            <p className="text-xl text-white/90 mb-6">
              Join thousands of successful salon owners and reach new customers today.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <TrendingUp className="h-6 w-6 text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Increase Revenue</h3>
                <p className="text-white/80">Book more appointments and grow your business</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <Award className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Professional Tools</h3>
                <p className="text-white/80">Manage your salon with our comprehensive dashboard</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-lg italic mb-2">
              "SalonHub increased my bookings by 40% in the first month. It's a game-changer!"
            </p>
            <p className="text-white/80">- Maria L., Salon Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
}