import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Sparkles,
  Droplets,
  AlertCircle,
  Star,
  Camera,
  FileText,
  Crown,
  Heart,
  Coffee,
  Music,
  Scissors,
  User,
  ChevronRight,
  Calendar,
  MapPin
} from "lucide-react";
import { format } from "date-fns";

interface BeautyProfileData {
  profiles: Array<{
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
    allergies: string[] | null;
    sensitivities: string[] | null;
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
  }>;
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

export default function MyBeautyProfile() {
  const { data, isLoading, error } = useQuery<BeautyProfileData | null>({
    queryKey: ['/api/business/my-beauty-profile'],
    queryFn: getQueryFn<BeautyProfileData | null>({ on401: 'returnNull' }),
    staleTime: 60000,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2" data-testid="card-beauty-profile-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            My Beauty Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data === null) {
    return null;
  }

  if (error) {
    return (
      <Card className="lg:col-span-2" data-testid="card-beauty-profile-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            My Beauty Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to load beauty profile</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We couldn't load your beauty profile right now. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasProfiles) {
    return (
      <Card className="lg:col-span-2" data-testid="card-beauty-profile-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            My Beauty Profile
          </CardTitle>
          <CardDescription>
            Your personalized beauty information from salons you've visited
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No beauty profile yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Once you visit salons and they create your beauty profile, you'll see your personalized preferences, formulas, and photos here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profiles = data?.profiles || [];
  const aggregated = data?.aggregated || {
    hairTypes: [],
    skinTypes: [],
    allAllergies: [],
    allSensitivities: [],
    totalVisitsAcrossSalons: 0,
    isVipAnywhere: false,
  };

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(paisa / 100);
  };

  const getHairTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      straight: '💇',
      wavy: '🌊',
      curly: '🌀',
      coily: '➰',
    };
    return icons[type?.toLowerCase()] || '💇';
  };

  const getSkinTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      normal: '✨',
      dry: '🏜️',
      oily: '💧',
      combination: '🔄',
      sensitive: '🌸',
    };
    return icons[type?.toLowerCase()] || '✨';
  };

  return (
    <Card className="lg:col-span-2" data-testid="card-beauty-profile">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              My Beauty Profile
              {aggregated.isVipAnywhere && (
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                  <Crown className="h-3 w-3 mr-1" />
                  VIP
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Your personalized beauty information from {data?.salonCount || profiles.length} {(data?.salonCount || profiles.length) === 1 ? 'salon' : 'salons'}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {aggregated.totalVisitsAcrossSalons} total visits
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {(aggregated.hairTypes.length > 0 || aggregated.skinTypes.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aggregated.hairTypes.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="h-4 w-4 text-pink-600" />
                  <h4 className="font-medium text-sm">Hair Profile</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aggregated.hairTypes.map((type, i) => (
                    <Badge key={i} variant="secondary" className="bg-white/80 dark:bg-gray-800">
                      <span className="mr-1">{getHairTypeIcon(type || '')}</span>
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {aggregated.skinTypes.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-sm">Skin Profile</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aggregated.skinTypes.map((type, i) => (
                    <Badge key={i} variant="secondary" className="bg-white/80 dark:bg-gray-800">
                      <span className="mr-1">{getSkinTypeIcon(type || '')}</span>
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(aggregated.allAllergies.length > 0 || aggregated.allSensitivities.length > 0) && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-medium text-sm text-red-800 dark:text-red-200">Important Health Information</h4>
            </div>
            <div className="space-y-2">
              {aggregated.allAllergies.length > 0 && (
                <div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Allergies:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aggregated.allAllergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {aggregated.allSensitivities.length > 0 && (
                <div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Sensitivities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aggregated.allSensitivities.map((sensitivity, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-300">
                        {sensitivity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Your Salon Profiles
          </h4>
          
          {profiles.map((profile) => (
            <Card key={profile.id} className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {profile.salon?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h5 className="font-semibold">{profile.salon?.name || 'Salon'}</h5>
                      {profile.visitStats && (
                        <p className="text-xs text-muted-foreground">
                          {profile.visitStats.totalVisits} visits
                          {profile.visitStats.lastVisitDate && (
                            <> • Last visit: {format(new Date(profile.visitStats.lastVisitDate), 'MMM d, yyyy')}</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  {profile.isVip && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                      <Crown className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.hairProfile && Object.values(profile.hairProfile).some(v => v) && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    {profile.hairProfile.hairType && (
                      <div>
                        <span className="text-muted-foreground text-xs">Type</span>
                        <p className="font-medium">{profile.hairProfile.hairType}</p>
                      </div>
                    )}
                    {profile.hairProfile.hairCondition && (
                      <div>
                        <span className="text-muted-foreground text-xs">Condition</span>
                        <p className="font-medium">{profile.hairProfile.hairCondition}</p>
                      </div>
                    )}
                    {profile.hairProfile.hairLength && (
                      <div>
                        <span className="text-muted-foreground text-xs">Length</span>
                        <p className="font-medium">{profile.hairProfile.hairLength}</p>
                      </div>
                    )}
                    {profile.hairProfile.hairDensity && (
                      <div>
                        <span className="text-muted-foreground text-xs">Density</span>
                        <p className="font-medium">{profile.hairProfile.hairDensity}</p>
                      </div>
                    )}
                    {profile.hairProfile.scalpCondition && (
                      <div>
                        <span className="text-muted-foreground text-xs">Scalp</span>
                        <p className="font-medium">{profile.hairProfile.scalpCondition}</p>
                      </div>
                    )}
                  </div>
                )}

                {profile.preferences && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {profile.preferences.preferredStylist && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Preferred: {profile.preferences.preferredStylist}</span>
                      </div>
                    )}
                    {profile.preferences.beveragePreference && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Coffee className="h-3 w-3" />
                        <span>{profile.preferences.beveragePreference}</span>
                      </div>
                    )}
                    {profile.preferences.musicPreference && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Music className="h-3 w-3" />
                        <span>{profile.preferences.musicPreference}</span>
                      </div>
                    )}
                  </div>
                )}

                {profile.photos.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Your Photos</span>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-2">
                        {profile.photos.map((photo) => (
                          <div key={photo.id} className="relative shrink-0">
                            <img
                              src={photo.thumbnailUrl || photo.photoUrl}
                              alt={photo.caption || 'Beauty photo'}
                              className="h-24 w-24 object-cover rounded-lg"
                            />
                            {photo.photoType && (
                              <Badge 
                                variant="secondary" 
                                className="absolute bottom-1 left-1 text-[10px] px-1 py-0"
                              >
                                {photo.photoType}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}

                {profile.formulas.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Your Favorite Formulas</span>
                    </div>
                    <div className="grid gap-2">
                      {profile.formulas.map((formula) => (
                        <div 
                          key={formula.id} 
                          className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-pink-500" />
                            <div>
                              <p className="text-sm font-medium">{formula.formulaName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formula.formulaType.replace('_', ' ')}
                                {formula.targetColor && ` • Target: ${formula.targetColor}`}
                              </p>
                            </div>
                          </div>
                          {formula.resultRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              <span className="text-sm font-medium">{formula.resultRating}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.notes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Notes from Your Stylist</span>
                    </div>
                    <div className="space-y-2">
                      {profile.notes.slice(0, 3).map((note) => (
                        <div 
                          key={note.id} 
                          className="p-3 bg-muted/50 rounded-lg"
                        >
                          {note.title && (
                            <p className="text-sm font-medium mb-1">{note.title}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(note.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
