import { User, Menu, Moon, Sun, ChevronDown, Building2, Scissors, Wallet, Gift, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = () => {
    console.log('Login clicked');
    login(); // Redirects to /api/login for Replit Auth
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    logout(); // Redirects to /api/logout for Replit Auth
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">SalonHub</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            {isAuthenticated && user?.roles?.includes('customer') && (
              <Link href="/customer/dashboard" className="text-foreground hover:text-primary transition-colors flex items-center gap-1" data-testid="link-dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
            <a href="#" className="text-foreground hover:text-primary transition-colors">Find Salons</a>
            <Link href="/all-offers" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm" data-testid="link-all-offers">
              <Gift className="h-4 w-4" />
              Offers
            </Link>
            {isAuthenticated && user?.roles?.includes('customer') && (
              <Link href="/wallet" className="text-foreground hover:text-primary transition-colors flex items-center gap-1" data-testid="link-wallet">
                <Wallet className="h-4 w-4" />
                Wallet
              </Link>
            )}
            <Link href="/join/business" className="text-foreground hover:text-primary transition-colors">
              For Business
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <Button
              data-testid="button-theme-toggle"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Button 
                    data-testid="button-profile"
                    variant="ghost" 
                    size="icon"
                    onClick={() => console.log('Profile clicked')}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  <Button 
                    data-testid="button-logout"
                    variant="ghost"
                    onClick={handleLogout}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" data-testid="button-join">
                        Join <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Create Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation('/join/customer')}>
                        <User className="mr-2 h-4 w-4" />
                        Customer Account
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation('/join/business')}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Business Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button data-testid="button-login">
                        Login <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Sign In</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation('/login/customer')}>
                        <User className="mr-2 h-4 w-4" />
                        Customer Login
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation('/login/business')}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Business Login
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogin}>
                        <Scissors className="mr-2 h-4 w-4" />
                        Login with Replit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <Button 
              data-testid="button-mobile-menu"
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => console.log('Mobile menu clicked')}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}