import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Building2, Eye, EyeOff, BarChart3, Shield, TrendingUp, Users, Calendar, DollarSign } from "lucide-react";
import { PasswordResetModal } from "@/components/PasswordResetModal";
import { handleLoginSuccess } from "@/lib/auth";

export default function LoginBusiness() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          loginType: 'business' // Enforce business-only login
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT access token if provided (for mobile app support)
        if (data.accessToken) {
          handleLoginSuccess(data.accessToken);
        }
        
        toast({
          title: "Welcome back!",
          description: "You've been logged in successfully.",
        });
        
        // Refresh auth state
        await checkAuth();
        
        // Handle redirect (business owners might go to setup or dashboard)
        setLocation(data.redirect || '/');
      } else {
        setError(data.error || "Login failed. Please try again.");
        
        // Handle wrong portal redirect
        if (data.redirectTo) {
          toast({
            title: "Wrong Login Portal",
            description: data.error,
            variant: "destructive",
          });
          // Redirect to the correct portal after 2 seconds
          setTimeout(() => {
            setLocation(data.redirectTo);
          }, 2000);
          return;
        }
        
        if (data.requiresVerification) {
          toast({
            title: "Email Verification Required",
            description: "Please check your email and verify your account before logging in.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Professional background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full"></div>
        <div className="absolute top-40 left-60 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-60 left-40 w-2 h-2 bg-white rounded-full"></div>
        <div className="absolute top-80 left-80 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute top-32 right-40 w-2 h-2 bg-white rounded-full"></div>
        <div className="absolute top-52 right-20 w-1 h-1 bg-white rounded-full"></div>
        <div className="absolute bottom-40 left-32 w-2 h-2 bg-white rounded-full"></div>
        <div className="absolute bottom-20 right-60 w-1 h-1 bg-white rounded-full"></div>
      </div>
      
      {/* Corporate decorative elements */}
      <div className="absolute top-16 right-20 opacity-10">
        <BarChart3 className="h-32 w-32 text-blue-400" />
      </div>
      <div className="absolute bottom-16 left-16 opacity-10">
        <TrendingUp className="h-24 w-24 text-indigo-400" />
      </div>
      <div className="absolute top-1/2 left-10 opacity-5">
        <Building2 className="h-40 w-40 text-slate-400" />
      </div>
      
      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-2xl border border-blue-500/20">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">SalonHub</h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight text-white">Business Portal</h2>
            <p className="text-xl text-blue-200 font-medium">
              Professional salon management platform
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="flex flex-col items-center gap-1 text-blue-300">
                <Users className="h-5 w-5" />
                <span className="text-xs font-medium">Staff</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-blue-300">
                <Calendar className="h-5 w-5" />
                <span className="text-xs font-medium">Bookings</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-blue-300">
                <DollarSign className="h-5 w-5" />
                <span className="text-xs font-medium">Revenue</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="border border-blue-200/20 shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
          <CardHeader className="space-y-4 pb-8 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/30 rounded-t-lg border-b border-blue-100/50">
            <CardTitle className="text-3xl text-center flex items-center justify-center gap-3 text-slate-800 dark:text-slate-200">
              <div className="bg-blue-600 rounded-lg p-2">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              Business Login
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-300 text-lg">
              Access your professional salon management dashboard
            </CardDescription>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400 pt-3">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Secure Access
              </span>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Analytics
              </span>
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Growth Tools
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your business email"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    required
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-lg py-6 font-semibold" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5" />
                    Access Business Dashboard
                  </div>
                )}
              </Button>
              
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 underline transition-colors"
                >
                  Forgot password? Click here to Reset
                </button>
              </div>
            </form>

            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4 border border-blue-200/50">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Enterprise Security</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                  Bank-level encryption • Two-factor authentication • SOC 2 compliant
                </p>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Looking to book an appointment?{" "}
                <Link href="/login/customer" className="text-pink-600 hover:text-pink-800 underline font-medium">
                  ← Customer Portal
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-blue-300 hover:text-blue-100 font-medium">
            ← Return to SalonHub
          </Link>
        </div>
      </div>
      
      <PasswordResetModal 
        open={showResetModal} 
        onClose={() => setShowResetModal(false)} 
      />
    </div>
  );
}