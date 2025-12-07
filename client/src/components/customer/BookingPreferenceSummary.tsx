import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sparkles,
  AlertTriangle,
  Heart,
  Coffee,
  Music,
  MessageSquare,
  ChevronDown,
  Crown,
  Scissors,
  Droplets,
  Edit2,
  Check,
  User,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface BookingPreferenceSummaryProps {
  salonId: string;
  className?: string;
  onEditProfile?: () => void;
}

interface CustomerProfile {
  id: string;
  hairType?: string;
  hairCondition?: string;
  skinType?: string;
  allergies?: string[];
  sensitivities?: string[];
  communicationStyle?: string;
  beveragePreference?: string;
  musicPreference?: string;
  specialRequirements?: string;
  isVip?: boolean;
  preferredStylist?: {
    id: string;
    name: string;
  };
}

export function BookingPreferenceSummary({
  salonId,
  className,
  onEditProfile,
}: BookingPreferenceSummaryProps) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const { isAuthenticated } = useAuth();

  const { data: profileData, isLoading, isError } = useQuery<{ profile: CustomerProfile }>({
    queryKey: ["/api/client-profiles/booking-summary", salonId],
    queryFn: async () => {
      const response = await fetch(`/api/client-profiles/booking-summary/${salonId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          return { profile: null };
        }
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: isAuthenticated && !!salonId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isError) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const profile = profileData?.profile;

  if (!profile) {
    return (
      <Card
        className={cn(
          "overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
          className
        )}
      >
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                Create Your Beauty Profile
              </h4>
              <p className="text-sm text-gray-600 mt-0.5">
                Help your stylist know your preferences for a personalized
                experience
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/my-beauty-profile")}
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Set Up
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAllergies =
    (profile.allergies && profile.allergies.length > 0) ||
    (profile.sensitivities && profile.sensitivities.length > 0);

  const hasPreferences =
    profile.communicationStyle ||
    profile.beveragePreference ||
    profile.musicPreference ||
    profile.specialRequirements;

  const hasProfile = profile.hairType || profile.skinType;

  if (!hasAllergies && !hasPreferences && !hasProfile) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen
            ? "bg-gradient-to-br from-purple-50/80 to-pink-50/80"
            : "bg-white",
          hasAllergies && "border-amber-200",
          className
        )}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Your Stylist Knows You
                    {profile.isVip && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Your preferences are ready for a personalized experience
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-gray-400 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {hasAllergies && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700 text-sm">
                      Allergies & Sensitivities
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {profile.allergies?.map((allergy) => (
                        <Badge
                          key={allergy}
                          variant="destructive"
                          className="text-xs"
                        >
                          {allergy}
                        </Badge>
                      ))}
                      {profile.sensitivities?.map((sensitivity) => (
                        <Badge
                          key={sensitivity}
                          className="bg-orange-100 text-orange-700 text-xs"
                        >
                          {sensitivity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(profile.hairType || profile.skinType) && (
              <div className="grid grid-cols-2 gap-3">
                {profile.hairType && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white border">
                    <Scissors className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">Hair Type</p>
                      <p className="text-sm font-medium">
                        {profile.hairType}
                        {profile.hairCondition && ` • ${profile.hairCondition}`}
                      </p>
                    </div>
                  </div>
                )}
                {profile.skinType && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white border">
                    <Droplets className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-500">Skin Type</p>
                      <p className="text-sm font-medium">{profile.skinType}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {profile.preferredStylist && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-100/50 border border-purple-200">
                <Heart className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600">Preferred Stylist</p>
                  <p className="text-sm font-medium text-purple-900">
                    {profile.preferredStylist.name}
                  </p>
                </div>
              </div>
            )}

            {hasPreferences && (
              <div className="grid grid-cols-3 gap-2">
                {profile.communicationStyle && (
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white border text-center">
                    <MessageSquare className="w-4 h-4 text-gray-500 mb-1" />
                    <p className="text-[10px] text-gray-400">Style</p>
                    <p className="text-xs font-medium">
                      {profile.communicationStyle}
                    </p>
                  </div>
                )}
                {profile.beveragePreference && (
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white border text-center">
                    <Coffee className="w-4 h-4 text-gray-500 mb-1" />
                    <p className="text-[10px] text-gray-400">Beverage</p>
                    <p className="text-xs font-medium">
                      {profile.beveragePreference}
                    </p>
                  </div>
                )}
                {profile.musicPreference && (
                  <div className="flex flex-col items-center p-2 rounded-lg bg-white border text-center">
                    <Music className="w-4 h-4 text-gray-500 mb-1" />
                    <p className="text-[10px] text-gray-400">Music</p>
                    <p className="text-xs font-medium">
                      {profile.musicPreference}
                    </p>
                  </div>
                )}
              </div>
            )}

            {profile.specialRequirements && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-700 font-medium mb-1">
                  Special Requirements
                </p>
                <p className="text-sm text-amber-900">
                  {profile.specialRequirements}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">
                  Profile ready for your visit
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={
                  onEditProfile || (() => setLocation("/my-beauty-profile"))
                }
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
