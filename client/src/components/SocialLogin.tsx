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
  return null;
}