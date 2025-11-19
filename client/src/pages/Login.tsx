import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Building, Calendar, BarChart3 } from "lucide-react";
import customerImage from "@assets/stock_images/happy_woman_getting__3f5716b3.jpg";
import professionalImage from "@assets/stock_images/professional_hair_st_a5606468.jpg";

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-100 to-rose-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Welcome Back to SalonHub
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Sign in to your account
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          <Card className="group hover-elevate transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-purple-600 to-rose-600 p-8 text-white">
                <div className="mb-6">
                  <User className="h-12 w-12 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Customer Login</h2>
                  <p className="text-white/90 text-lg">Access your appointments & bookings</p>
                </div>
                
                <ul className="space-y-3 mb-8 text-white/90">
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>View your appointments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Manage your profile</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Track your beauty journey</span>
                  </li>
                </ul>

                <Button 
                  asChild
                  variant="secondary" 
                  size="lg" 
                  className="w-full group-hover:bg-white group-hover:text-primary mb-6"
                  data-testid="button-login-customer"
                >
                  <Link href="/login/customer">Sign In as Customer</Link>
                </Button>
              </div>

              <div className="aspect-video">
                <img 
                  src={customerImage} 
                  alt="Happy customer receiving beauty treatment" 
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="group hover-elevate transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-emerald-600 to-blue-600 p-8 text-white">
                <div className="mb-6">
                  <Building className="h-12 w-12 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Business Login</h2>
                  <p className="text-white/90 text-lg">Manage your salon & bookings</p>
                </div>
                
                <ul className="space-y-3 mb-8 text-white/90">
                  <li className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>Manage appointments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Track customer bookings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>View business analytics</span>
                  </li>
                </ul>

                <Button 
                  asChild
                  variant="secondary" 
                  size="lg" 
                  className="w-full group-hover:bg-white group-hover:text-primary mb-6"
                  data-testid="button-login-business"
                >
                  <Link href="/login/business">Sign In as Business</Link>
                </Button>
              </div>

              <div className="aspect-video">
                <img 
                  src={professionalImage} 
                  alt="Professional hair stylist working in modern salon" 
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="text-center mt-12">
          <p className="text-gray-700">
            Don't have an account?{" "}
            <Link href="/join">
              <Button variant="ghost" className="p-0 h-auto text-purple-600 hover:text-purple-700" data-testid="link-join">
                Create account
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
