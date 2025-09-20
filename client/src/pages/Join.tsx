import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Building, Calendar, BarChart3 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import customerImage from "@assets/stock_images/happy_woman_getting__3f5716b3.jpg";
import professionalImage from "@assets/stock_images/professional_hair_st_a5606468.jpg";

export default function Join() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Join SalonHub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose how you want to experience our beauty and wellness marketplace
          </p>
        </div>

        {/* Two Path Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Customer Path */}
          <Card className="group hover-elevate transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              {/* Content Section */}
              <div className="bg-gradient-to-br from-purple-600 to-rose-600 p-8 text-white">
                <div className="mb-6">
                  <User className="h-12 w-12 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">I'm a Customer</h2>
                  <p className="text-white/90 text-lg">Book beauty & wellness services</p>
                </div>
                
                <ul className="space-y-3 mb-8 text-white/90">
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Book appointments instantly</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Discover local salons & spas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Read reviews & ratings</span>
                  </li>
                </ul>

                <Button 
                  asChild
                  variant="secondary" 
                  size="lg" 
                  className="w-full group-hover:bg-white group-hover:text-primary mb-6"
                  data-testid="button-join-customer"
                >
                  <Link href="/join/customer">Get Started as Customer</Link>
                </Button>
              </div>

              {/* Image Section */}
              <div className="aspect-video">
                <img 
                  src={customerImage} 
                  alt="Happy customer receiving beauty treatment" 
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Path */}
          <Card className="group hover-elevate transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              {/* Content Section */}
              <div className="bg-gradient-to-br from-emerald-600 to-blue-600 p-8 text-white">
                <div className="mb-6">
                  <Building className="h-12 w-12 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">I'm a Professional</h2>
                  <p className="text-white/90 text-lg">Grow your salon business</p>
                </div>
                
                <ul className="space-y-3 mb-8 text-white/90">
                  <li className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>Manage appointments & services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Reach new customers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Track business performance</span>
                  </li>
                </ul>

                <Button 
                  asChild
                  variant="secondary" 
                  size="lg" 
                  className="w-full group-hover:bg-white group-hover:text-primary mb-6"
                  data-testid="button-join-business"
                >
                  <Link href="/join/business">Get Started as Professional</Link>
                </Button>
              </div>

              {/* Image Section */}
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

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Button variant="ghost" className="p-0 h-auto" data-testid="link-login">
              Sign in here
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}