import { User, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, login, logout } = useAuth();

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
            <a href="#" className="text-foreground hover:text-primary transition-colors">Find Salons</a>
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
                  <Button 
                    data-testid="button-login"
                    variant="ghost" 
                    onClick={handleLogin}
                  >
                    Log in
                  </Button>
                  <Button 
                    asChild
                    data-testid="button-signup"
                  >
                    <Link href="/join">Sign up</Link>
                  </Button>
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