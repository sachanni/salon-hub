import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";

export default function Footer() {
  const handleNewsletterSignup = () => {
    console.log('Newsletter signup clicked');
  };

  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary">SalonHub</h3>
            <p className="text-muted-foreground">
              Your trusted platform for booking beauty and wellness services. 
              Connect with top-rated salons and professionals near you.
            </p>
            <div className="flex space-x-4">
              <Button 
                data-testid="button-facebook"
                variant="ghost" 
                size="icon"
                onClick={() => console.log('Facebook clicked')}
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button 
                data-testid="button-twitter"
                variant="ghost" 
                size="icon"
                onClick={() => console.log('Twitter clicked')}
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button 
                data-testid="button-instagram"
                variant="ghost" 
                size="icon"
                onClick={() => console.log('Instagram clicked')}
              >
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* For Customers */}
          <div className="space-y-4">
            <h4 className="font-semibold">For Customers</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Find Salons</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Book Appointments</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Reviews & Ratings</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Gift Cards</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Mobile App</a></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div className="space-y-4">
            <h4 className="font-semibold">For Businesses</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">List Your Salon</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Business Dashboard</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Resources</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold">Stay Updated</h4>
            <p className="text-muted-foreground text-sm">
              Get the latest news and exclusive offers delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <Input 
                data-testid="input-newsletter"
                placeholder="Enter your email" 
                type="email" 
                className="flex-1"
              />
              <Button 
                data-testid="button-newsletter-signup"
                onClick={handleNewsletterSignup}
                size="icon"
              >
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; 2024 SalonHub. All rights reserved.</p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}