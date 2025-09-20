import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SiFacebook, SiApple, SiGithub } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { Mail } from "lucide-react";

interface SocialLoginProps {
  userType: 'customer' | 'owner';
  disabled?: boolean;
}

export function SocialLogin({ userType, disabled }: SocialLoginProps) {
  const handleLogin = () => {
    // Redirect to Replit Auth - it handles all OAuth providers
    window.location.href = `/api/login?userType=${userType}`;
  };

  return (
    <div className="space-y-4">
      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">OR</span>
        </div>
      </div>

      {/* Secure Authentication */}
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full h-12 flex items-center justify-center gap-3 text-base font-medium"
          onClick={handleLogin}
          disabled={disabled}
          data-testid="button-secure-login"
        >
          <div className="flex items-center gap-2">
            <FcGoogle className="h-5 w-5" />
            <SiGithub className="h-5 w-5" />
            <SiApple className="h-5 w-5 text-black dark:text-white" />
            <Mail className="h-5 w-5" />
          </div>
          Continue with Secure Login
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Choose from Google, GitHub, Apple, or email/password
        </p>
      </div>
    </div>
  );
}