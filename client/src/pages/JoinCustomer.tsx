import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, User, Mail, Phone, Lock, Star, Users } from "lucide-react";
import customerImage from "@assets/stock_images/happy_woman_getting__3f5716b3.jpg";
import { SocialLogin } from "@/components/SocialLogin";
import { handleSocialAuth } from "@/lib/socialAuth";
import { useAuth } from "@/contexts/AuthContext";
import { PhoneVerification } from "@/components/PhoneVerification";
import { sendWelcomeEmailWithVerification } from "@/lib/emailVerification";

export default function JoinCustomer() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [firebaseToken, setFirebaseToken] = useState<string | undefined>();
  const { toast } = useToast();
  const { isAuthenticated, isBusinessUser, isLoading: authLoading } = useAuth();

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isBusinessUser) {
        setLocation('/business/dashboard');
      } else {
        setLocation('/customer/dashboard');
      }
    }
  }, [isAuthenticated, isBusinessUser, authLoading, setLocation]);

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
        body: JSON.stringify({
          ...formData,
          userType: 'customer',
          firebaseToken,
          phoneVerified: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
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

        // Store token and user if provided
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Redirect to customer dashboard
        setLocation('/customer/dashboard');
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
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

  const handleSocialLogin = async (provider: string, credential: any, userType: 'customer' | 'owner') => {
    setIsLoading(true);
    try {
      const result = await handleSocialAuth(provider, credential, userType);
      
      if (result.success) {
        // Store auth data
        localStorage.setItem('token', result.token || '');
        localStorage.setItem('user', JSON.stringify(result.user));
        
        toast({
          title: "Account created successfully!",
          description: `Welcome to SalonHub! You can now start booking services.`,
        });
        
        // Redirect to customer dashboard
        setLocation('/customer/dashboard');
      } else {
        throw new Error(result.message || 'Social login failed');
      }
    } catch (error: any) {
      console.error('Social login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-8">
            <Button asChild variant="ghost" size="sm" data-testid="button-back">
              <Link href="/join">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-rose-500">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create Customer Account</h1>
                <p className="text-muted-foreground">
                  Start booking beauty & wellness services
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@example.com"
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
              data-testid="button-create-customer-account"
            >
              {isLoading ? "Creating Account..." : "Create Customer Account"}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          {/* Social Login */}
          <SocialLogin 
            userType="customer" 
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Right Side - Image & Benefits */}
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0">
          <img 
            src={customerImage} 
            alt="Happy customer receiving beauty treatment" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-rose-600/90" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Join thousands of happy customers
            </h2>
            <p className="text-xl text-white/90 mb-6">
              Book appointments instantly and discover amazing local salons & spas.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <Star className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Verified Reviews</h3>
                <p className="text-white/80">Read authentic reviews from real customers</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">50,000+ Happy Customers</h3>
                <p className="text-white/80">Join our growing community of beauty enthusiasts</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-lg italic mb-2">
              "SalonHub made finding my perfect salon so easy. The booking process is seamless!"
            </p>
            <p className="text-white/80">- Sarah M., Verified Customer</p>
          </div>
        </div>
      </div>
    </div>
  );
}