import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PhotoGallery } from "@/components/customer/PhotoGallery";
import { NotesFeed } from "@/components/customer/NotesFeed";
import {
  ArrowLeft,
  User,
  Sparkles,
  Heart,
  AlertTriangle,
  Coffee,
  Music,
  MessageSquare,
  Star,
  Camera,
  Edit2,
  Save,
  X,
  Store,
  Calendar,
  Scissors,
  Droplets,
  Leaf,
  Crown,
  Check,
  ChevronRight,
  Image,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface SalonProfile {
  id: string;
  salonId: string;
  salon: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  isVip: boolean;
  hairProfile: {
    hairType?: string;
    hairCondition?: string;
    hairLength?: string;
    hairDensity?: string;
    scalpCondition?: string;
  } | null;
  skinProfile: {
    skinType?: string;
    skinConcerns?: string[];
  } | null;
  allergies?: string[] | null;
  sensitivities?: string[] | null;
  preferences: {
    preferredStylist?: string;
    preferredStylistId?: string;
    communicationStyle?: string;
    beveragePreference?: string;
    musicPreference?: string;
    specialRequirements?: string;
    preferredProducts?: string[];
    dislikedProducts?: string[];
  } | null;
  visitStats: {
    totalVisits: number;
    lastVisitDate?: string;
    totalSpentPaisa?: number;
  } | null;
  notes: Array<{
    id: string;
    title?: string;
    content: string;
    noteType: string;
    createdAt: string;
  }>;
  photos: Array<{
    id: string;
    photoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    photoType: string;
    serviceType?: string;
    takenAt?: string;
  }>;
  formulas: Array<{
    id: string;
    formulaName: string;
    formulaType: string;
    targetColor?: string;
    resultNotes?: string;
    resultRating?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface BeautyProfileResponse {
  profiles: SalonProfile[];
  aggregated: {
    hairTypes: string[];
    skinTypes: string[];
    allAllergies: string[];
    allSensitivities: string[];
    totalVisitsAcrossSalons: number;
    isVipAnywhere: boolean;
  };
  hasProfiles: boolean;
  salonCount: number;
}

const HAIR_TYPES = ["Straight", "Wavy", "Curly", "Coily"];
const HAIR_CONDITIONS = ["Healthy", "Dry", "Oily", "Damaged", "Color-treated"];
const HAIR_LENGTHS = ["Short", "Medium", "Long", "Very Long"];
const HAIR_DENSITIES = ["Thin", "Medium", "Thick"];
const SCALP_CONDITIONS = ["Normal", "Dry", "Oily", "Sensitive", "Flaky"];
const SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const SKIN_CONCERNS = ["Acne", "Aging", "Hyperpigmentation", "Redness", "Dullness", "Large Pores", "Fine Lines"];
const COMMUNICATION_STYLES = ["Chatty", "Quiet", "Professional"];
const BEVERAGE_PREFERENCES = ["Coffee", "Tea", "Water", "Juice", "None"];
const MUSIC_PREFERENCES = ["Pop", "Classical", "Jazz", "Rock", "Ambient", "None"];

export default function MyBeautyProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [selectedProfile, setSelectedProfile] = useState<SalonProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<SalonProfile | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = useQuery<BeautyProfileResponse>({
    queryKey: ["/api/client-profiles/my-beauty-profile"],
    queryFn: async () => {
      const response = await fetch("/api/client-profiles/my-beauty-profile", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          return { profiles: [], aggregated: null, hasProfiles: false, salonCount: 0 };
        }
        throw new Error("Failed to fetch beauty profile");
      }
      return response.json();
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileId, data }: { profileId: string; data: any }) => {
      const response = await fetch(`/api/client-profiles/my-beauty-profile/${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile Updated", description: "Your preferences have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/client-profiles/my-beauty-profile"] });
      setEditingProfile(null);
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your beauty profile.</p>
            <Button onClick={() => setLocation("/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-4">Unable to load your beauty profile. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profiles = [], aggregated, hasProfiles = false, salonCount = 0 } = data || {};

  if (!hasProfiles) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => setLocation("/customer/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-6">
              <Sparkles className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Beauty Profile</h1>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Your personalized beauty profile will be created when you book your first appointment at a salon.
              It helps stylists remember your preferences and provide personalized service.
            </p>
            <Button onClick={() => setLocation("/salons")} className="bg-purple-600 hover:bg-purple-700">
              <Scissors className="w-4 h-4 mr-2" />
              Browse Salons
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sanitizeArray = (arr: string[] | null | undefined): string[] => {
    if (!arr || !Array.isArray(arr)) return [];
    return arr
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(item => item.length > 0 && item.length <= 100)
      .slice(0, 20);
  };

  const sanitizeString = (str: string | undefined, maxLength: number = 500): string | undefined => {
    if (!str || typeof str !== 'string') return undefined;
    const trimmed = str.trim();
    return trimmed.length > 0 ? trimmed.slice(0, maxLength) : undefined;
  };

  const handleSaveProfile = (profile: SalonProfile) => {
    if (!editingProfile) return;

    const updateData: any = {};

    if (editingProfile.hairProfile) {
      updateData.hairType = sanitizeString(editingProfile.hairProfile.hairType, 50);
      updateData.hairCondition = sanitizeString(editingProfile.hairProfile.hairCondition, 50);
      updateData.hairLength = sanitizeString(editingProfile.hairProfile.hairLength, 50);
      updateData.hairDensity = sanitizeString(editingProfile.hairProfile.hairDensity, 50);
      updateData.scalpCondition = sanitizeString(editingProfile.hairProfile.scalpCondition, 50);
    }

    if (editingProfile.skinProfile) {
      updateData.skinType = sanitizeString(editingProfile.skinProfile.skinType, 50);
      updateData.skinConcerns = sanitizeArray(editingProfile.skinProfile.skinConcerns);
    }

    updateData.allergies = sanitizeArray(editingProfile.allergies);
    updateData.sensitivities = sanitizeArray(editingProfile.sensitivities);

    if (editingProfile.preferences) {
      updateData.communicationStyle = sanitizeString(editingProfile.preferences.communicationStyle, 50);
      updateData.beveragePreference = sanitizeString(editingProfile.preferences.beveragePreference, 50);
      updateData.musicPreference = sanitizeString(editingProfile.preferences.musicPreference, 50);
      updateData.specialRequirements = sanitizeString(editingProfile.preferences.specialRequirements, 500);
      updateData.preferredProducts = sanitizeArray(editingProfile.preferences.preferredProducts);
      updateData.dislikedProducts = sanitizeArray(editingProfile.preferences.dislikedProducts);
    }

    updateProfileMutation.mutate({ profileId: profile.id, data: updateData });
  };

  const renderProfileCard = (profile: SalonProfile) => (
    <Card key={profile.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {profile.salon.imageUrl ? (
              <img
                src={profile.salon.imageUrl}
                alt={profile.salon.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-purple-600" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{profile.salon.name}</CardTitle>
              {profile.visitStats && (
                <p className="text-sm text-gray-500">
                  {profile.visitStats.totalVisits} visits
                  {profile.visitStats.lastVisitDate && (
                    <span> • Last: {format(new Date(profile.visitStats.lastVisitDate), "MMM d, yyyy")}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile.isVip && (
              <Badge className="bg-amber-100 text-amber-800">
                <Crown className="w-3 h-3 mr-1" />
                VIP
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => setSelectedProfile(profile)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {profile.hairProfile?.hairType && (
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-gray-400" />
              <span>{profile.hairProfile.hairType} hair</span>
            </div>
          )}
          {profile.skinProfile?.skinType && (
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-gray-400" />
              <span>{profile.skinProfile.skinType} skin</span>
            </div>
          )}
          {profile.preferences?.preferredStylist && (
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-gray-400" />
              <span>Prefers: {profile.preferences.preferredStylist}</span>
            </div>
          )}
          {profile.photos.length > 0 && (
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-gray-400" />
              <span>{profile.photos.length} photos</span>
            </div>
          )}
        </div>

        {profile.allergies && profile.allergies.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Allergies:</span>
              <span>{profile.allergies.join(", ")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDetailedProfile = (profile: SalonProfile) => (
    <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile.salon.imageUrl ? (
                <img src={profile.salon.imageUrl} alt={profile.salon.name} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Store className="w-5 h-5 text-purple-600" />
                </div>
              )}
              <div>
                <DialogTitle>{profile.salon.name}</DialogTitle>
                <DialogDescription>Your beauty profile at this salon</DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingProfile(JSON.parse(JSON.stringify(profile)));
                setSelectedProfile(null);
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              {profile.hairProfile && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-purple-600" />
                    Hair Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
                    {profile.hairProfile.hairType && (
                      <div><span className="text-gray-500">Type:</span> {profile.hairProfile.hairType}</div>
                    )}
                    {profile.hairProfile.hairCondition && (
                      <div><span className="text-gray-500">Condition:</span> {profile.hairProfile.hairCondition}</div>
                    )}
                    {profile.hairProfile.hairLength && (
                      <div><span className="text-gray-500">Length:</span> {profile.hairProfile.hairLength}</div>
                    )}
                    {profile.hairProfile.hairDensity && (
                      <div><span className="text-gray-500">Density:</span> {profile.hairProfile.hairDensity}</div>
                    )}
                    {profile.hairProfile.scalpCondition && (
                      <div><span className="text-gray-500">Scalp:</span> {profile.hairProfile.scalpCondition}</div>
                    )}
                  </div>
                </div>
              )}

              {profile.skinProfile && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-purple-600" />
                    Skin Profile
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {profile.skinProfile.skinType && (
                      <div className="text-sm"><span className="text-gray-500">Type:</span> {profile.skinProfile.skinType}</div>
                    )}
                    {profile.skinProfile.skinConcerns && profile.skinProfile.skinConcerns.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profile.skinProfile.skinConcerns.map((concern) => (
                          <Badge key={concern} variant="secondary">{concern}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {((profile.allergies && profile.allergies.length > 0) || (profile.sensitivities && profile.sensitivities.length > 0)) && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    Allergies & Sensitivities
                  </h4>
                  <div className="bg-red-50 p-4 rounded-lg space-y-2">
                    {profile.allergies && profile.allergies.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-red-700">Allergies: </span>
                        <span className="text-sm text-red-600">{profile.allergies.join(", ")}</span>
                      </div>
                    )}
                    {profile.sensitivities && profile.sensitivities.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-orange-700">Sensitivities: </span>
                        <span className="text-sm text-orange-600">{profile.sensitivities.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-4">
              {profile.preferences && (
                <div className="space-y-4">
                  {profile.preferences.preferredStylist && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Heart className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">Preferred Stylist</p>
                        <p className="font-medium">{profile.preferences.preferredStylist}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {profile.preferences.communicationStyle && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Communication</p>
                          <p className="text-sm font-medium">{profile.preferences.communicationStyle}</p>
                        </div>
                      </div>
                    )}
                    {profile.preferences.beveragePreference && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Coffee className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Beverage</p>
                          <p className="text-sm font-medium">{profile.preferences.beveragePreference}</p>
                        </div>
                      </div>
                    )}
                    {profile.preferences.musicPreference && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Music className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Music</p>
                          <p className="text-sm font-medium">{profile.preferences.musicPreference}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {profile.preferences.specialRequirements && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Special Requirements</p>
                      <p className="text-sm">{profile.preferences.specialRequirements}</p>
                    </div>
                  )}

                  {profile.preferences.preferredProducts && profile.preferences.preferredProducts.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Preferred Products</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferences.preferredProducts.map((product) => (
                          <Badge key={product} className="bg-green-100 text-green-700">{product}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.preferences.dislikedProducts && profile.preferences.dislikedProducts.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Products to Avoid</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferences.dislikedProducts.map((product) => (
                          <Badge key={product} variant="destructive">{product}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              <PhotoGallery
                photos={profile.photos}
                emptyMessage="No photos available yet"
                columns={3}
                showBeforeAfter={true}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <NotesFeed
                notes={profile.notes.map(note => ({
                  ...note,
                  isPinned: false
                }))}
                emptyMessage="No notes shared with you yet"
                maxItems={5}
                showExpandButton={true}
              />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  const renderEditDialog = () => {
    if (!editingProfile) return null;

    return (
      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Your Preferences</DialogTitle>
            <DialogDescription>
              Update your beauty profile at {editingProfile.salon.name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-purple-600" />
                  Hair Profile
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Hair Type</Label>
                    <Select
                      value={editingProfile.hairProfile?.hairType || ""}
                      onValueChange={(v) =>
                        setEditingProfile({
                          ...editingProfile,
                          hairProfile: { ...editingProfile.hairProfile, hairType: v },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {HAIR_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hair Condition</Label>
                    <Select
                      value={editingProfile.hairProfile?.hairCondition || ""}
                      onValueChange={(v) =>
                        setEditingProfile({
                          ...editingProfile,
                          hairProfile: { ...editingProfile.hairProfile, hairCondition: v },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {HAIR_CONDITIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hair Length</Label>
                    <Select
                      value={editingProfile.hairProfile?.hairLength || ""}
                      onValueChange={(v) =>
                        setEditingProfile({
                          ...editingProfile,
                          hairProfile: { ...editingProfile.hairProfile, hairLength: v },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {HAIR_LENGTHS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hair Density</Label>
                    <Select
                      value={editingProfile.hairProfile?.hairDensity || ""}
                      onValueChange={(v) =>
                        setEditingProfile({
                          ...editingProfile,
                          hairProfile: { ...editingProfile.hairProfile, hairDensity: v },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {HAIR_DENSITIES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Scalp Condition</Label>
                    <Select
                      value={editingProfile.hairProfile?.scalpCondition || ""}
                      onValueChange={(v) =>
                        setEditingProfile({
                          ...editingProfile,
                          hairProfile: { ...editingProfile.hairProfile, scalpCondition: v },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SCALP_CONDITIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-purple-600" />
                  Skin Profile
                </h4>
                <div>
                  <Label>Skin Type</Label>
                  <Select
                    value={editingProfile.skinProfile?.skinType || ""}
                    onValueChange={(v) =>
                      setEditingProfile({
                        ...editingProfile,
                        skinProfile: { ...editingProfile.skinProfile, skinType: v },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {SKIN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Skin Concerns (select multiple)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SKIN_CONCERNS.map((concern) => (
                      <Badge
                        key={concern}
                        variant={editingProfile.skinProfile?.skinConcerns?.includes(concern) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = editingProfile.skinProfile?.skinConcerns || [];
                          const updated = current.includes(concern)
                            ? current.filter((c) => c !== concern)
                            : [...current, concern];
                          setEditingProfile({
                            ...editingProfile,
                            skinProfile: { ...editingProfile.skinProfile, skinConcerns: updated },
                          });
                        }}
                      >
                        {editingProfile.skinProfile?.skinConcerns?.includes(concern) && (
                          <Check className="w-3 h-3 mr-1" />
                        )}
                        {concern}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  Allergies & Sensitivities
                </h4>
                <div>
                  <Label>Allergies (comma-separated)</Label>
                  <Input
                    value={editingProfile.allergies?.join(", ") || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        allergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="e.g., Ammonia, Parabens"
                  />
                </div>
                <div>
                  <Label>Sensitivities (comma-separated)</Label>
                  <Input
                    value={editingProfile.sensitivities?.join(", ") || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        sensitivities: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="e.g., Strong fragrances, Sulfates"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-600" />
                  Salon Preferences
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Communication Style</Label>
                    <Select
                      value={editingProfile.preferences?.communicationStyle || ""}
                      onValueChange={(v) =>
                        setEditingProfile({
                          ...editingProfile,
                          preferences: { ...editingProfile.preferences, communicationStyle: v },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_STYLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Beverage</Label>
                    <Select
                      value={editingProfile.preferences?.beveragePreference || ""}
                      onValueChange={(v) =>
                        setEditingProfile({
                          ...editingProfile,
                          preferences: { ...editingProfile.preferences, beveragePreference: v },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BEVERAGE_PREFERENCES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Music</Label>
                    <Select
                      value={editingProfile.preferences?.musicPreference || ""}
                      onValueChange={(v) =>
                        setEditingProfile({
                          ...editingProfile,
                          preferences: { ...editingProfile.preferences, musicPreference: v },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {MUSIC_PREFERENCES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Special Requirements</Label>
                  <Textarea
                    value={editingProfile.preferences?.specialRequirements || ""}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        preferences: { ...editingProfile.preferences, specialRequirements: e.target.value },
                      })
                    }
                    placeholder="Any special needs or requests..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProfile(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveProfile(editingProfile)}
              disabled={updateProfileMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => setLocation("/customer/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Beauty Profile</h1>
              <p className="text-gray-600">
                Your personalized preferences across {salonCount} salon{salonCount > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {aggregated && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="pt-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">{aggregated.totalVisitsAcrossSalons}</p>
                  <p className="text-sm text-gray-500">Total Visits</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Store className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">{salonCount}</p>
                  <p className="text-sm text-gray-500">Salons</p>
                </CardContent>
              </Card>
              {aggregated.isVipAnywhere && (
                <Card className="bg-amber-50">
                  <CardContent className="pt-4 text-center">
                    <Crown className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                    <p className="text-lg font-bold text-amber-800">VIP</p>
                    <p className="text-sm text-amber-600">Status</p>
                  </CardContent>
                </Card>
              )}
              {aggregated.allAllergies.length > 0 && (
                <Card className="bg-red-50">
                  <CardContent className="pt-4 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto text-red-600 mb-2" />
                    <p className="text-2xl font-bold text-red-800">{aggregated.allAllergies.length}</p>
                    <p className="text-sm text-red-600">Allergies</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="salons">By Salon</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {aggregated && (
              <div className="space-y-6">
                {aggregated.allAllergies.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Your Allergies
                      </CardTitle>
                      <CardDescription className="text-red-600">
                        Important safety information shared with all your salons
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {aggregated.allAllergies.map((allergy) => (
                          <Badge key={allergy} variant="destructive">{allergy}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-purple-600" />
                      Hair Types Recorded
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {aggregated.hairTypes.length > 0 ? (
                        aggregated.hairTypes.map((type) => (
                          <Badge key={type} variant="secondary">{type}</Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No hair type recorded yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-purple-600" />
                      Skin Types Recorded
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {aggregated.skinTypes.length > 0 ? (
                        aggregated.skinTypes.map((type) => (
                          <Badge key={type} variant="secondary">{type}</Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No skin type recorded yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="salons">
            <div className="grid gap-4">
              {profiles.map(renderProfileCard)}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedProfile && renderDetailedProfile(selectedProfile)}
      {renderEditDialog()}

      <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
        <DialogContent className="max-w-3xl">
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.caption || "Beauty photo"}
                className="w-full rounded-lg"
              />
              {selectedPhoto.caption && (
                <p className="text-center text-gray-600">{selectedPhoto.caption}</p>
              )}
              {selectedPhoto.serviceType && (
                <Badge className="mx-auto block w-fit">{selectedPhoto.serviceType}</Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
