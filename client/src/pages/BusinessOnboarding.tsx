import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Building, User, Home, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Step 1: Work Preference Selection
interface WorkPreferenceStepProps {
  onNext: (preference: string) => void;
  onBack: () => void;
}

function WorkPreferenceStep({ onNext, onBack }: WorkPreferenceStepProps) {
  const [selected, setSelected] = useState<string>("");

  const preferences = [
    {
      id: "salon",
      title: "At Your Studio",
      subtitle: "Setup",
      description: "I have a physical salon location",
      image: "/api/placeholder/300/200",
      icon: Building,
    },
    {
      id: "home",
      title: "At Home Setup",
      subtitle: "For Freelancer",
      description: "I provide services at customer's location",
      image: "/api/placeholder/300/200",
      icon: Home,
    },
    {
      id: "both",
      title: "At Your Studio + At Home",
      subtitle: "Both",
      description: "I offer both salon and at-home services",
      image: "/api/placeholder/300/200",
      icon: Building,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-100 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Work Preference</h1>
          <p className="text-muted-foreground">
            Tell us how you prefer to work
          </p>
        </div>

        {/* Preference Cards */}
        <div className="space-y-4 mb-8">
          {preferences.map((pref) => {
            const Icon = pref.icon;
            return (
              <Card
                key={pref.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg border-2",
                  selected === pref.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                    : "border-gray-200 hover:border-purple-300"
                )}
                onClick={() => setSelected(pref.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Icon/Image */}
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-xl flex items-center justify-center",
                          selected === pref.id
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {pref.title}
                      </h3>
                      <p className="text-sm text-purple-600 font-medium mb-1">
                        {pref.subtitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pref.description}
                      </p>
                    </div>

                    {/* Check Icon */}
                    {selected === pref.id && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <Button
          onClick={() => onNext(selected)}
          disabled={!selected}
          className="w-full h-12 text-base"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// Main Onboarding Component
export default function BusinessOnboarding() {
  const [, setLocation] = useLocation();

  const handlePreferenceNext = (preference: string) => {
    // Navigate directly to registration form with only work preference
    setLocation(`/join/business/register?preference=${preference}`);
  };

  const handleBack = () => {
    setLocation("/join");
  };

  return (
    <WorkPreferenceStep onNext={handlePreferenceNext} onBack={handleBack} />
  );
}
