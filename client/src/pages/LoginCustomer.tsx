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
import { Heart, Eye, EyeOff, Sparkles, Star, Calendar } from "lucide-react";

export default function LoginCustomer() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
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
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Welcome back!",
          description: "You've been logged in successfully.",
        });
        
        // Refresh auth state
        await checkAuth();
        
        // Handle redirect (customers typically go to home)
        setLocation(data.redirect || '/');
      } else {
        setError(data.error || "Login failed. Please try again.");
        
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

  const handleReplitLogin = () => {
    window.location.href = '/api/login?userType=customer';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-orange-900/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 opacity-10">
        <Sparkles className="h-24 w-24 text-pink-400" />
      </div>
      <div className="absolute top-32 right-16 opacity-10">
        <Heart className="h-16 w-16 text-rose-400" />
      </div>
      <div className="absolute bottom-20 left-20 opacity-10">
        <Star className="h-20 w-20 text-orange-400" />
      </div>
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-3 shadow-lg">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">SalonHub</h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-pink-700 to-rose-700 bg-clip-text text-transparent">Welcome back, Beautiful!</h2>
            <p className="text-lg text-pink-700 dark:text-pink-300 font-medium">
              Ready to book your next beauty appointment?
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-pink-600 dark:text-pink-400">
              <Calendar className="h-4 w-4" />
              <span>Book • Relax • Glow</span>
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-6 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 rounded-t-lg">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2 text-pink-800 dark:text-pink-200">
              <Heart className="h-6 w-6 text-pink-500" />
              Customer Portal
            </CardTitle>
            <CardDescription className="text-center text-pink-700 dark:text-pink-300 text-base">
              Sign in to book appointments at your favorite salons
            </CardDescription>
            <div className="flex items-center justify-center gap-4 text-xs text-pink-600 dark:text-pink-400 pt-2">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Appointments
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Favorites
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Reviews
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
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
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-lg py-6" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Sign In & Start Booking
                  </div>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-pink-200 hover:bg-pink-50 text-pink-700 hover:text-pink-800 py-3" 
              onClick={handleReplitLogin}
              data-testid="button-replit-login"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Continue with Replit
            </Button>

            <div className="text-center space-y-3">
              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                <p className="text-sm text-pink-700 dark:text-pink-300">
                  New to SalonHub?{" "}
                  <Link href="/join/customer" className="text-pink-600 hover:text-pink-800 underline font-semibold">
                    Create your free account
                  </Link>
                </p>
                <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                  Join thousands of happy customers!
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Business owner?{" "}
                <Link href="/login/business" className="text-blue-600 hover:text-blue-800 underline font-medium">
                  Switch to Business Portal →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 font-medium">
            ← Explore Salons Near You
          </Link>
        </div>
      </div>
    </div>
  );
}