import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Search, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  MessageSquare,
  User, 
  Crown, 
  Calendar,
  Scissors,
  ArrowUpDown,
  Eye,
  Edit,
  Plus,
  Trash2,
  AlertTriangle,
  Pin,
  Image,
  Palette,
  FileText,
  Heart,
  Droplet,
  X,
  Upload,
  Camera,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Settings,
  RefreshCw,
  StickyNote,
  Beaker,
  Images as ImagesIcon,
  UserCircle,
  Save,
  AlertCircle
} from "lucide-react";

interface ClientProfile {
  id: string;
  salonId: string;
  customerId: string;
  hairType?: string;
  hairCondition?: string;
  hairLength?: string;
  hairDensity?: string;
  scalpCondition?: string;
  skinType?: string;
  skinConcerns?: string[];
  allergies?: string[];
  sensitivities?: string[];
  contraindications?: string;
  preferredStylistId?: string;
  communicationStyle?: string;
  beveragePreference?: string;
  musicPreference?: string;
  specialRequirements?: string;
  preferredProducts?: string[];
  dislikedProducts?: string[];
  isVip: number;
  vipNotes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  lastVisitDate?: string;
  totalVisits?: number;
  totalSpentPaisa?: number;
  notesCount?: number;
  formulasCount?: number;
  photosCount?: number;
}

interface ClientNote {
  id: string;
  profileId: string;
  staffId: string;
  bookingId?: string;
  serviceId?: string;
  noteType: 'general' | 'appointment' | 'formula' | 'complaint' | 'compliment';
  title?: string;
  content: string;
  isPinned: number;
  isAlertNote: number;
  isVisibleToCustomer: number;
  createdAt: string;
  updatedAt: string;
  staffName?: string;
  serviceName?: string;
}

interface ClientFormula {
  id: string;
  profileId: string;
  staffId: string;
  bookingId?: string;
  formulaType: 'hair_color' | 'highlights' | 'treatment' | 'perm' | 'relaxer' | 'other';
  formulaName: string;
  baseColor?: string;
  targetColor?: string;
  developer?: string;
  mixingRatio?: string;
  processingTime?: number;
  heatUsed?: number;
  products?: Array<{ brand?: string; name?: string; shade?: string; amount?: string }>;
  applicationTechnique?: string;
  sectioning?: string;
  specialInstructions?: string;
  resultNotes?: string;
  resultRating?: number;
  isActiveFormula: number;
  isCustomerFavorite: number;
  createdAt: string;
  updatedAt: string;
  staffName?: string;
}

interface ClientPhoto {
  id: string;
  profileId: string;
  staffId: string;
  bookingId?: string;
  photoType: 'before' | 'after' | 'inspiration' | 'result' | 'other';
  photoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  servicePerformed?: string;
  takenAt?: string;
  isFavorite: number;
  createdAt: string;
  staffName?: string;
}

interface VisibilitySettings {
  id: string;
  salonId: string;
  visibilityMode: 'all' | 'preferences_only' | 'none' | 'custom';
  showHairProfile: number;
  showSkinProfile: number;
  showAllergies: number;
  showPreferences: number;
  showPhotos: number;
  showNotes: number;
  showFormulas: number;
  showVisitHistory: number;
  showProfileOnBooking: number;
  highlightAllergies: number;
  highlightVip: number;
}

const NOTE_TYPE_COLORS = {
  general: 'bg-gray-100 text-gray-800',
  appointment: 'bg-blue-100 text-blue-800',
  formula: 'bg-purple-100 text-purple-800',
  complaint: 'bg-red-100 text-red-800',
  compliment: 'bg-green-100 text-green-800'
};

const NOTE_TYPE_LABELS = {
  general: 'General',
  appointment: 'Appointment',
  formula: 'Formula',
  complaint: 'Complaint',
  compliment: 'Compliment'
};

const FORMULA_TYPE_COLORS = {
  hair_color: 'bg-pink-100 text-pink-800',
  highlights: 'bg-yellow-100 text-yellow-800',
  treatment: 'bg-green-100 text-green-800',
  perm: 'bg-purple-100 text-purple-800',
  relaxer: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800'
};

const FORMULA_TYPE_LABELS = {
  hair_color: 'Hair Color',
  highlights: 'Highlights',
  treatment: 'Treatment',
  perm: 'Perm',
  relaxer: 'Relaxer',
  other: 'Other'
};

const HAIR_TYPES = ['Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Medium', 'Thick'];
const HAIR_CONDITIONS = ['Healthy', 'Damaged', 'Color-treated', 'Chemically-treated', 'Dry', 'Oily'];
const SKIN_TYPES = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
const COMMUNICATION_STYLES = ['Chatty', 'Quiet', 'Professional', 'Friendly'];

interface ClientProfilesManagementProps {
  salonId: string;
}

export default function ClientProfilesManagement({ salonId }: ClientProfilesManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVip, setFilterVip] = useState<string>("all");
  const [sortBy, setSortBy] = useState("lastVisitDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedProfile, setSelectedProfile] = useState<ClientProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddFormulaOpen, setIsAddFormulaOpen] = useState(false);
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState<number | null>(null);

  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['/api/business', salonId, 'clients'],
    queryFn: async () => {
      const response = await fetch(`/api/business/${salonId}/clients?limit=100`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: !!salonId
  });

  const { data: profileDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/business', salonId, 'clients', selectedProfile?.customerId],
    queryFn: async () => {
      if (!selectedProfile?.customerId) return null;
      const response = await fetch(`/api/business/${salonId}/clients/${selectedProfile.customerId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch client details');
      return response.json();
    },
    enabled: !!selectedProfile?.customerId && isDrawerOpen
  });

  const { data: visibilitySettings } = useQuery({
    queryKey: ['/api/business', salonId, 'visibility-settings'],
    queryFn: async () => {
      const response = await fetch(`/api/business/${salonId}/visibility-settings`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch visibility settings');
      return response.json();
    },
    enabled: !!salonId
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ClientProfile>) => {
      const response = await fetch(`/api/business/${salonId}/clients/${selectedProfile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'clients', selectedProfile?.customerId] });
      toast({ title: "Success", description: "Client profile updated" });
      setEditingProfile(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/business/${salonId}/clients/${selectedProfile?.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'clients', selectedProfile?.customerId] });
      toast({ title: "Success", description: "Note added" });
      setIsAddNoteOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    }
  });

  const addFormulaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/business/${salonId}/clients/${selectedProfile?.id}/formulas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add formula');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'clients', selectedProfile?.customerId] });
      toast({ title: "Success", description: "Formula added" });
      setIsAddFormulaOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add formula", variant: "destructive" });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/business/${salonId}/clients/${selectedProfile?.id}/notes/${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'clients', selectedProfile?.customerId] });
      toast({ title: "Success", description: "Note deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!selectedProfile?.id) {
        throw new Error('No client profile selected');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        const response = await fetch(`/api/business/${salonId}/clients/${selectedProfile.id}/photos`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(error.error || 'Failed to upload photo');
        }
        return response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Upload timed out. Please try again with a smaller image.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'clients', selectedProfile?.customerId] });
      toast({ title: "Success", description: "Photo uploaded successfully" });
      setIsAddPhotoOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async (data: Partial<VisibilitySettings>) => {
      const response = await fetch(`/api/business/${salonId}/visibility-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'visibility-settings'] });
      toast({ title: "Success", description: "Visibility settings updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    }
  });

  const clients = clientsData?.profiles || [];
  
  // Keep selectedProfile in sync with the latest data from clientsData after mutations
  // Match by customerId to handle cases where profile ID changes (e.g., recreated profile)
  useEffect(() => {
    if (selectedProfile && clients.length > 0) {
      const updatedProfile = clients.find((p: ClientProfile) => p.customerId === selectedProfile.customerId);
      if (updatedProfile) {
        // Update if data has changed (including if ID changed)
        if (JSON.stringify(updatedProfile) !== JSON.stringify(selectedProfile)) {
          setSelectedProfile(updatedProfile);
          // If the profile ID changed, invalidate and refetch the details query
          if (updatedProfile.id !== selectedProfile.id) {
            queryClient.invalidateQueries({ 
              queryKey: ['/api/business', salonId, 'clients', updatedProfile.customerId] 
            });
          }
        }
      } else if (isDrawerOpen) {
        // Customer no longer has a profile - close the drawer
        setIsDrawerOpen(false);
        setSelectedProfile(null);
      }
    }
  }, [clients, selectedProfile, isDrawerOpen, salonId]);
  
  const filteredClients = useMemo(() => {
    let filtered = clients.filter((profile: ClientProfile) => {
      const customerName = profile.customer?.firstName 
        ? `${profile.customer.firstName} ${profile.customer.lastName || ''}`.trim()
        : profile.customer?.username || profile.customer?.email || '';
      
      const searchMatch = searchTerm === "" || 
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.customer?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.customer?.phone || '').includes(searchTerm);
      
      const vipMatch = filterVip === "all" || 
        (filterVip === "vip" && profile.isVip === 1) ||
        (filterVip === "regular" && profile.isVip !== 1);
      
      return searchMatch && vipMatch;
    });

    return filtered.sort((a: ClientProfile, b: ClientProfile) => {
      let aVal: any, bVal: any;
      
      if (sortBy === 'lastVisitDate') {
        aVal = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0;
        bVal = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0;
      } else if (sortBy === 'totalVisits') {
        aVal = a.totalVisits || 0;
        bVal = b.totalVisits || 0;
      } else if (sortBy === 'totalSpent') {
        aVal = a.totalSpentPaisa || 0;
        bVal = b.totalSpentPaisa || 0;
      } else {
        const aName = a.customer?.firstName || a.customer?.username || a.customer?.email || '';
        const bName = b.customer?.firstName || b.customer?.username || b.customer?.email || '';
        aVal = aName.toLowerCase();
        bVal = bName.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clients, searchTerm, filterVip, sortBy, sortOrder]);

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(paisa / 100);
  };

  const getCustomerName = (profile: ClientProfile) => {
    if (profile.customer?.firstName) {
      return `${profile.customer.firstName} ${profile.customer.lastName || ''}`.trim();
    }
    return profile.customer?.username || profile.customer?.email?.split('@')[0] || 'Unknown';
  };

  const handleViewProfile = (profile: ClientProfile) => {
    setSelectedProfile(profile);
    setActiveTab("overview");
    setIsDrawerOpen(true);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (clientsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Client Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clientsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            Error Loading Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load client profiles. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6 text-violet-600" />
                Client Profiles & Notes
                <Badge variant="secondary" className="ml-2">
                  {clients.length} clients
                </Badge>
              </CardTitle>
              <CardDescription>
                Manage client preferences, formulas, notes, and before/after photos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Visibility Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterVip} onValueChange={setFilterVip}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="vip">VIP Only</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchTerm || filterVip !== "all" ? "No clients match your criteria" : "No client profiles yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                Client profiles are created automatically when customers book appointments
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Client
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => toggleSort('totalVisits')}
                    >
                      <div className="flex items-center gap-2">
                        Visits
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => toggleSort('lastVisitDate')}
                    >
                      <div className="flex items-center gap-2">
                        Last Visit
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Profile Data</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((profile: ClientProfile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {getCustomerName(profile).charAt(0).toUpperCase()}
                            </div>
                            {profile.isVip === 1 && (
                              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-400 flex items-center justify-center">
                                <Crown className="h-3 w-3 text-yellow-800" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {getCustomerName(profile)}
                              {profile.allergies && profile.allergies.length > 0 && (
                                <Badge variant="destructive" className="text-xs px-1 py-0">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Allergies
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {profile.customer?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {profile.customer?.phone && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {profile.totalVisits || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.lastVisitDate ? (
                          <div className="text-sm">
                            <div>{format(new Date(profile.lastVisitDate), 'MMM dd, yyyy')}</div>
                            <div className="text-muted-foreground text-xs">
                              {formatDistanceToNow(new Date(profile.lastVisitDate), { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(profile.notesCount || 0) > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <StickyNote className="h-3 w-3 mr-1" />
                              {profile.notesCount}
                            </Badge>
                          )}
                          {(profile.formulasCount || 0) > 0 && (
                            <Badge variant="outline" className="text-xs bg-purple-50">
                              <Beaker className="h-3 w-3 mr-1" />
                              {profile.formulasCount}
                            </Badge>
                          )}
                          {(profile.photosCount || 0) > 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-50">
                              <ImagesIcon className="h-3 w-3 mr-1" />
                              {profile.photosCount}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleViewProfile(profile)}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedProfile && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xl font-semibold">
                        {getCustomerName(selectedProfile).charAt(0).toUpperCase()}
                      </div>
                      {selectedProfile.isVip === 1 && (
                        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-yellow-400 flex items-center justify-center">
                          <Crown className="h-4 w-4 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    <div>
                      <SheetTitle className="flex items-center gap-2">
                        {getCustomerName(selectedProfile)}
                        {selectedProfile.isVip === 1 && (
                          <Badge className="bg-yellow-100 text-yellow-800">VIP</Badge>
                        )}
                      </SheetTitle>
                      <SheetDescription>
                        {selectedProfile.customer?.email}
                        {selectedProfile.customer?.phone && ` • ${selectedProfile.customer.phone}`}
                      </SheetDescription>
                    </div>
                  </div>
                </div>
                
                {selectedProfile.allergies && selectedProfile.allergies.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 font-medium">
                      <AlertTriangle className="h-5 w-5" />
                      Allergies / Sensitivities
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProfile.allergies.map((allergy, i) => (
                        <Badge key={i} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </SheetHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">
                    <UserCircle className="h-4 w-4 mr-1 hidden sm:inline" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs sm:text-sm">
                    <StickyNote className="h-4 w-4 mr-1 hidden sm:inline" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="formulas" className="text-xs sm:text-sm">
                    <Beaker className="h-4 w-4 mr-1 hidden sm:inline" />
                    Formulas
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="text-xs sm:text-sm">
                    <ImagesIcon className="h-4 w-4 mr-1 hidden sm:inline" />
                    Photos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Total Visits</div>
                      <div className="text-2xl font-bold">{profileDetails?.stats?.totalVisits || 0}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(profileDetails?.stats?.totalSpentPaisa || 0)}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Avg. Spend</div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(profileDetails?.stats?.avgSpendPaisa || 0)}
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Hair Profile</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingProfile(!editingProfile)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {editingProfile ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                    
                    {editingProfile ? (
                      <ProfileEditor 
                        profile={profileDetails?.profile || selectedProfile}
                        onSave={(data) => updateProfileMutation.mutate(data)}
                        onCancel={() => setEditingProfile(false)}
                        isSaving={updateProfileMutation.isPending}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <ProfileField label="Hair Type" value={selectedProfile.hairType} />
                        <ProfileField label="Hair Condition" value={selectedProfile.hairCondition} />
                        <ProfileField label="Hair Length" value={selectedProfile.hairLength} />
                        <ProfileField label="Scalp Condition" value={selectedProfile.scalpCondition} />
                        <ProfileField label="Skin Type" value={selectedProfile.skinType} />
                        <ProfileField label="Communication Style" value={selectedProfile.communicationStyle} />
                        <ProfileField label="Beverage Preference" value={selectedProfile.beveragePreference} />
                        <ProfileField label="Special Requirements" value={selectedProfile.specialRequirements} />
                      </div>
                    )}
                  </div>

                  {selectedProfile.vipNotes && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                        <Crown className="h-4 w-4" />
                        VIP Notes
                      </div>
                      <p className="text-sm text-yellow-900">{selectedProfile.vipNotes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Client Notes</h3>
                    <Button size="sm" onClick={() => setIsAddNoteOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                  </div>
                  
                  <NotesSection
                    notes={profileDetails?.notes || []}
                    onDelete={(noteId) => deleteNoteMutation.mutate(noteId)}
                    isDeleting={deleteNoteMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="formulas" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Color Formulas & Treatments</h3>
                    <Button size="sm" onClick={() => setIsAddFormulaOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Formula
                    </Button>
                  </div>
                  
                  <FormulasSection formulas={profileDetails?.formulas || []} />
                </TabsContent>

                <TabsContent value="photos" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Before/After Photos</h3>
                    <Button size="sm" onClick={() => setIsAddPhotoOpen(true)}>
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Photo
                    </Button>
                  </div>
                  
                  <PhotosSection 
                    photos={profileDetails?.photos || []} 
                    onViewPhoto={setPhotoViewerIndex}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client Note</DialogTitle>
            <DialogDescription>
              Add a note about this client for future reference
            </DialogDescription>
          </DialogHeader>
          <AddNoteForm 
            onSubmit={(data) => addNoteMutation.mutate(data)}
            onCancel={() => setIsAddNoteOpen(false)}
            isSubmitting={addNoteMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddFormulaOpen} onOpenChange={setIsAddFormulaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Formula</DialogTitle>
            <DialogDescription>
              Record a color formula or treatment for this client
            </DialogDescription>
          </DialogHeader>
          <AddFormulaForm 
            onSubmit={(data) => addFormulaMutation.mutate(data)}
            onCancel={() => setIsAddFormulaOpen(false)}
            isSubmitting={addFormulaMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Visibility Settings</DialogTitle>
            <DialogDescription>
              Control what information customers can see about their profiles
            </DialogDescription>
          </DialogHeader>
          <VisibilitySettingsForm
            settings={visibilitySettings}
            onSave={(data) => updateVisibilityMutation.mutate(data)}
            isSaving={updateVisibilityMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddPhotoOpen} onOpenChange={setIsAddPhotoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Before/After Photo</DialogTitle>
            <DialogDescription>
              Upload a photo to track this client's transformation
            </DialogDescription>
          </DialogHeader>
          <AddPhotoForm
            onSubmit={(formData) => uploadPhotoMutation.mutate(formData)}
            onCancel={() => setIsAddPhotoOpen(false)}
            isSubmitting={uploadPhotoMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm font-medium">{value || '—'}</div>
    </div>
  );
}

function ProfileEditor({ 
  profile, 
  onSave, 
  onCancel,
  isSaving 
}: { 
  profile: ClientProfile; 
  onSave: (data: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    hairType: profile.hairType || '',
    hairCondition: profile.hairCondition || '',
    hairLength: profile.hairLength || '',
    scalpCondition: profile.scalpCondition || '',
    skinType: profile.skinType || '',
    communicationStyle: profile.communicationStyle || '',
    beveragePreference: profile.beveragePreference || '',
    specialRequirements: profile.specialRequirements || '',
    isVip: profile.isVip || 0,
    vipNotes: profile.vipNotes || '',
    allergies: profile.allergies || []
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Hair Type</Label>
          <Select 
            value={formData.hairType} 
            onValueChange={(v) => setFormData(p => ({ ...p, hairType: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {HAIR_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Hair Condition</Label>
          <Select 
            value={formData.hairCondition} 
            onValueChange={(v) => setFormData(p => ({ ...p, hairCondition: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {HAIR_CONDITIONS.map(cond => (
                <SelectItem key={cond} value={cond}>{cond}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Skin Type</Label>
          <Select 
            value={formData.skinType} 
            onValueChange={(v) => setFormData(p => ({ ...p, skinType: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {SKIN_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Communication Style</Label>
          <Select 
            value={formData.communicationStyle} 
            onValueChange={(v) => setFormData(p => ({ ...p, communicationStyle: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {COMMUNICATION_STYLES.map(style => (
                <SelectItem key={style} value={style}>{style}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Beverage Preference</Label>
          <Input 
            value={formData.beveragePreference}
            onChange={(e) => setFormData(p => ({ ...p, beveragePreference: e.target.value }))}
            placeholder="e.g., Coffee, Green Tea"
          />
        </div>
        <div className="space-y-2">
          <Label>Hair Length</Label>
          <Input 
            value={formData.hairLength}
            onChange={(e) => setFormData(p => ({ ...p, hairLength: e.target.value }))}
            placeholder="e.g., Short, Medium, Long"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Special Requirements</Label>
        <Textarea 
          value={formData.specialRequirements}
          onChange={(e) => setFormData(p => ({ ...p, specialRequirements: e.target.value }))}
          placeholder="Any special requirements or notes..."
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch 
          checked={formData.isVip === 1}
          onCheckedChange={(checked) => setFormData(p => ({ ...p, isVip: checked ? 1 : 0 }))}
        />
        <Label>VIP Customer</Label>
      </div>

      {formData.isVip === 1 && (
        <div className="space-y-2">
          <Label>VIP Notes</Label>
          <Textarea 
            value={formData.vipNotes}
            onChange={(e) => setFormData(p => ({ ...p, vipNotes: e.target.value }))}
            placeholder="Special VIP treatment notes..."
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function NotesSection({ 
  notes, 
  onDelete,
  isDeleting 
}: { 
  notes: ClientNote[]; 
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No notes yet</p>
        <p className="text-sm">Add notes to track client preferences and history</p>
      </div>
    );
  }

  const pinnedNotes = notes.filter(n => n.isPinned === 1);
  const alertNotes = notes.filter(n => n.isAlertNote === 1 && n.isPinned !== 1);
  const regularNotes = notes.filter(n => n.isPinned !== 1 && n.isAlertNote !== 1);

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {pinnedNotes.map(note => (
          <NoteCard key={note.id} note={note} onDelete={onDelete} isPinned isDeleting={isDeleting} />
        ))}
        {alertNotes.map(note => (
          <NoteCard key={note.id} note={note} onDelete={onDelete} isAlert isDeleting={isDeleting} />
        ))}
        {regularNotes.map(note => (
          <NoteCard key={note.id} note={note} onDelete={onDelete} isDeleting={isDeleting} />
        ))}
      </div>
    </ScrollArea>
  );
}

function NoteCard({ 
  note, 
  onDelete, 
  isPinned, 
  isAlert,
  isDeleting 
}: { 
  note: ClientNote; 
  onDelete: (id: string) => void;
  isPinned?: boolean;
  isAlert?: boolean;
  isDeleting: boolean;
}) {
  return (
    <Card className={`p-4 ${isPinned ? 'border-yellow-300 bg-yellow-50' : isAlert ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isPinned && <Pin className="h-4 w-4 text-yellow-600" />}
            {isAlert && <AlertTriangle className="h-4 w-4 text-red-600" />}
            <Badge className={NOTE_TYPE_COLORS[note.noteType]}>
              {NOTE_TYPE_LABELS[note.noteType]}
            </Badge>
            {note.title && <span className="font-medium">{note.title}</span>}
          </div>
          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(note.createdAt), 'MMM dd, yyyy h:mm a')}
            </span>
            {note.staffName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {note.staffName}
              </span>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 hover:text-red-700"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function FormulasSection({ formulas }: { formulas: ClientFormula[] }) {
  if (formulas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No formulas recorded</p>
        <p className="text-sm">Track color formulas and treatments here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {formulas.map(formula => (
          <Card key={formula.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{formula.formulaName}</h4>
                  <Badge className={FORMULA_TYPE_COLORS[formula.formulaType]}>
                    {FORMULA_TYPE_LABELS[formula.formulaType]}
                  </Badge>
                  {formula.isActiveFormula === 1 && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                  {formula.isCustomerFavorite === 1 && (
                    <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                  )}
                </div>
              </div>
              {formula.resultRating && (
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < formula.resultRating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {formula.baseColor && (
                <div>
                  <span className="text-muted-foreground">Base Color:</span>
                  <span className="ml-2 font-medium">{formula.baseColor}</span>
                </div>
              )}
              {formula.targetColor && (
                <div>
                  <span className="text-muted-foreground">Target Color:</span>
                  <span className="ml-2 font-medium">{formula.targetColor}</span>
                </div>
              )}
              {formula.developer && (
                <div>
                  <span className="text-muted-foreground">Developer:</span>
                  <span className="ml-2 font-medium">{formula.developer}</span>
                </div>
              )}
              {formula.mixingRatio && (
                <div>
                  <span className="text-muted-foreground">Ratio:</span>
                  <span className="ml-2 font-medium">{formula.mixingRatio}</span>
                </div>
              )}
              {formula.processingTime && (
                <div>
                  <span className="text-muted-foreground">Processing:</span>
                  <span className="ml-2 font-medium">{formula.processingTime} min</span>
                </div>
              )}
            </div>

            {formula.products && formula.products.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-muted-foreground">Products Used:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formula.products.map((product, i) => (
                    <Badge key={i} variant="outline">
                      {product.brand && `${product.brand} `}
                      {product.name}
                      {product.shade && ` (${product.shade})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formula.resultNotes && (
              <div className="mt-3 p-2 bg-muted rounded text-sm">
                <span className="text-muted-foreground">Result Notes:</span>
                <p className="mt-1">{formula.resultNotes}</p>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(formula.createdAt), 'MMM dd, yyyy')}
              </span>
              {formula.staffName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {formula.staffName}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function PhotosSection({ 
  photos, 
  onViewPhoto 
}: { 
  photos: ClientPhoto[]; 
  onViewPhoto: (index: number) => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ImagesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No photos yet</p>
        <p className="text-sm">Upload before/after photos to track progress</p>
      </div>
    );
  }

  const beforePhotos = photos.filter(p => p.photoType === 'before');
  const afterPhotos = photos.filter(p => p.photoType === 'after');
  const otherPhotos = photos.filter(p => !['before', 'after'].includes(p.photoType));

  return (
    <div className="space-y-6">
      {beforePhotos.length > 0 && afterPhotos.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Before & After
            <ChevronRight className="h-4 w-4" />
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Before</div>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img 
                  src={beforePhotos[0].photoUrl} 
                  alt="Before" 
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => onViewPhoto(0)}
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">After</div>
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img 
                  src={afterPhotos[0].photoUrl} 
                  alt="After" 
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => onViewPhoto(1)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-3">All Photos</h4>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div 
              key={photo.id} 
              className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer"
              onClick={() => onViewPhoto(index)}
            >
              <img 
                src={photo.thumbnailUrl || photo.photoUrl} 
                alt={photo.caption || 'Client photo'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <Badge className="absolute bottom-1 left-1 text-xs capitalize">
                {photo.photoType}
              </Badge>
              {photo.isFavorite === 1 && (
                <Heart className="absolute top-1 right-1 h-4 w-4 text-pink-500 fill-pink-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddNoteForm({ 
  onSubmit, 
  onCancel,
  isSubmitting 
}: { 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    noteType: 'general' as const,
    title: '',
    content: '',
    isPinned: 0,
    isAlertNote: 0,
    isVisibleToCustomer: 0
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Note Type</Label>
        <Select 
          value={formData.noteType}
          onValueChange={(v: any) => setFormData(p => ({ ...p, noteType: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="appointment">Appointment</SelectItem>
            <SelectItem value="formula">Formula</SelectItem>
            <SelectItem value="complaint">Complaint</SelectItem>
            <SelectItem value="compliment">Compliment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Title (Optional)</Label>
        <Input 
          value={formData.title}
          onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
          placeholder="Brief title..."
        />
      </div>

      <div className="space-y-2">
        <Label>Note Content *</Label>
        <Textarea 
          value={formData.content}
          onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
          placeholder="Write your note here..."
          rows={4}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.isPinned === 1}
            onCheckedChange={(checked) => setFormData(p => ({ ...p, isPinned: checked ? 1 : 0 }))}
          />
          <Label className="flex items-center gap-1">
            <Pin className="h-4 w-4" />
            Pin Note
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.isAlertNote === 1}
            onCheckedChange={(checked) => setFormData(p => ({ ...p, isAlertNote: checked ? 1 : 0 }))}
          />
          <Label className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Alert Note
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.isVisibleToCustomer === 1}
            onCheckedChange={(checked) => setFormData(p => ({ ...p, isVisibleToCustomer: checked ? 1 : 0 }))}
          />
          <Label className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Visible to Customer
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={() => onSubmit(formData)} 
          disabled={!formData.content.trim() || isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Note'}
        </Button>
      </div>
    </div>
  );
}

function AddFormulaForm({ 
  onSubmit, 
  onCancel,
  isSubmitting 
}: { 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    formulaType: 'hair_color' as const,
    formulaName: '',
    baseColor: '',
    targetColor: '',
    developer: '',
    mixingRatio: '',
    processingTime: undefined as number | undefined,
    products: [] as Array<{ brand: string; name: string; shade: string; amount: string }>,
    applicationTechnique: '',
    specialInstructions: '',
    resultNotes: '',
    resultRating: undefined as number | undefined,
    isActiveFormula: 1,
    isCustomerFavorite: 0
  });

  const [newProduct, setNewProduct] = useState({ brand: '', name: '', shade: '', amount: '' });

  const addProduct = () => {
    if (newProduct.name) {
      setFormData(p => ({ ...p, products: [...p.products, newProduct] }));
      setNewProduct({ brand: '', name: '', shade: '', amount: '' });
    }
  };

  const removeProduct = (index: number) => {
    setFormData(p => ({ ...p, products: p.products.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Formula Type *</Label>
          <Select 
            value={formData.formulaType}
            onValueChange={(v: any) => setFormData(p => ({ ...p, formulaType: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hair_color">Hair Color</SelectItem>
              <SelectItem value="highlights">Highlights</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="perm">Perm</SelectItem>
              <SelectItem value="relaxer">Relaxer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Formula Name *</Label>
          <Input 
            value={formData.formulaName}
            onChange={(e) => setFormData(p => ({ ...p, formulaName: e.target.value }))}
            placeholder="e.g., Blonde Balayage Spring 2024"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Base Color</Label>
          <Input 
            value={formData.baseColor}
            onChange={(e) => setFormData(p => ({ ...p, baseColor: e.target.value }))}
            placeholder="e.g., Natural Level 6"
          />
        </div>
        <div className="space-y-2">
          <Label>Target Color</Label>
          <Input 
            value={formData.targetColor}
            onChange={(e) => setFormData(p => ({ ...p, targetColor: e.target.value }))}
            placeholder="e.g., Level 8 Ash Blonde"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Developer</Label>
          <Input 
            value={formData.developer}
            onChange={(e) => setFormData(p => ({ ...p, developer: e.target.value }))}
            placeholder="e.g., 20 Vol"
          />
        </div>
        <div className="space-y-2">
          <Label>Mixing Ratio</Label>
          <Input 
            value={formData.mixingRatio}
            onChange={(e) => setFormData(p => ({ ...p, mixingRatio: e.target.value }))}
            placeholder="e.g., 1:1.5"
          />
        </div>
        <div className="space-y-2">
          <Label>Processing Time (min)</Label>
          <Input 
            type="number"
            value={formData.processingTime || ''}
            onChange={(e) => setFormData(p => ({ ...p, processingTime: parseInt(e.target.value) || undefined }))}
            placeholder="e.g., 35"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Products Used</Label>
        <div className="flex gap-2">
          <Input 
            placeholder="Brand"
            value={newProduct.brand}
            onChange={(e) => setNewProduct(p => ({ ...p, brand: e.target.value }))}
            className="flex-1"
          />
          <Input 
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
            className="flex-1"
          />
          <Input 
            placeholder="Shade"
            value={newProduct.shade}
            onChange={(e) => setNewProduct(p => ({ ...p, shade: e.target.value }))}
            className="w-24"
          />
          <Input 
            placeholder="Amount"
            value={newProduct.amount}
            onChange={(e) => setNewProduct(p => ({ ...p, amount: e.target.value }))}
            className="w-24"
          />
          <Button type="button" variant="outline" onClick={addProduct}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.products.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.products.map((product, i) => (
              <Badge key={i} variant="secondary" className="flex items-center gap-1">
                {product.brand && `${product.brand} `}{product.name}
                {product.shade && ` (${product.shade})`}
                <button onClick={() => removeProduct(i)} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Application Technique</Label>
        <Textarea 
          value={formData.applicationTechnique}
          onChange={(e) => setFormData(p => ({ ...p, applicationTechnique: e.target.value }))}
          placeholder="Describe the application technique..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Special Instructions</Label>
        <Textarea 
          value={formData.specialInstructions}
          onChange={(e) => setFormData(p => ({ ...p, specialInstructions: e.target.value }))}
          placeholder="Any special instructions for next time..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Result Notes</Label>
        <Textarea 
          value={formData.resultNotes}
          onChange={(e) => setFormData(p => ({ ...p, resultNotes: e.target.value }))}
          placeholder="How did it turn out? Any adjustments for next time?"
          rows={2}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.isActiveFormula === 1}
            onCheckedChange={(checked) => setFormData(p => ({ ...p, isActiveFormula: checked ? 1 : 0 }))}
          />
          <Label>Active Formula</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.isCustomerFavorite === 1}
            onCheckedChange={(checked) => setFormData(p => ({ ...p, isCustomerFavorite: checked ? 1 : 0 }))}
          />
          <Label className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            Customer Favorite
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={() => onSubmit(formData)} 
          disabled={!formData.formulaName.trim() || isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Formula'}
        </Button>
      </div>
    </div>
  );
}

function AddPhotoForm({ 
  onSubmit, 
  onCancel,
  isSubmitting 
}: { 
  onSubmit: (formData: FormData) => void; 
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'result' | 'reference'>('after');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum size is 10MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('photoType', photoType);
    if (caption) formData.append('caption', caption);
    
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Photo Type *</Label>
        <Select 
          value={photoType}
          onValueChange={(v: any) => setPhotoType(v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="before">Before</SelectItem>
            <SelectItem value="after">After</SelectItem>
            <SelectItem value="result">Result</SelectItem>
            <SelectItem value="reference">Reference/Inspiration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Photo *</Label>
        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          {previewUrl ? (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
              <Button 
                variant="destructive" 
                size="sm" 
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer block py-8">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to select a photo</p>
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP (max 10MB)</p>
              <input 
                type="file" 
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Caption (optional)</Label>
        <Input 
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g., After balayage treatment"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!selectedFile || isSubmitting}
        >
          {isSubmitting ? 'Uploading...' : 'Upload Photo'}
        </Button>
      </div>
    </div>
  );
}

function VisibilitySettingsForm({ 
  settings, 
  onSave,
  isSaving 
}: { 
  settings: VisibilitySettings | undefined; 
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    visibilityMode: settings?.visibilityMode || 'preferences_only',
    showHairProfile: settings?.showHairProfile ?? 1,
    showSkinProfile: settings?.showSkinProfile ?? 1,
    showAllergies: settings?.showAllergies ?? 1,
    showPreferences: settings?.showPreferences ?? 1,
    showPhotos: settings?.showPhotos ?? 0,
    showNotes: settings?.showNotes ?? 0,
    showFormulas: settings?.showFormulas ?? 0,
    showVisitHistory: settings?.showVisitHistory ?? 1,
    showProfileOnBooking: settings?.showProfileOnBooking ?? 1,
    highlightAllergies: settings?.highlightAllergies ?? 1,
    highlightVip: settings?.highlightVip ?? 1
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Visibility Mode</Label>
        <Select 
          value={formData.visibilityMode}
          onValueChange={(v: any) => setFormData(p => ({ ...p, visibilityMode: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Show All to Customers</SelectItem>
            <SelectItem value="preferences_only">Show Preferences Only</SelectItem>
            <SelectItem value="none">Hide All from Customers</SelectItem>
            <SelectItem value="custom">Custom Settings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.visibilityMode === 'custom' && (
        <div className="space-y-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium">What customers can see:</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.showHairProfile === 1}
                onCheckedChange={(c) => setFormData(p => ({ ...p, showHairProfile: c ? 1 : 0 }))}
              />
              <Label>Hair Profile</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.showSkinProfile === 1}
                onCheckedChange={(c) => setFormData(p => ({ ...p, showSkinProfile: c ? 1 : 0 }))}
              />
              <Label>Skin Profile</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.showAllergies === 1}
                onCheckedChange={(c) => setFormData(p => ({ ...p, showAllergies: c ? 1 : 0 }))}
              />
              <Label>Allergies</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.showPreferences === 1}
                onCheckedChange={(c) => setFormData(p => ({ ...p, showPreferences: c ? 1 : 0 }))}
              />
              <Label>Preferences</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.showPhotos === 1}
                onCheckedChange={(c) => setFormData(p => ({ ...p, showPhotos: c ? 1 : 0 }))}
              />
              <Label>Photos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.showVisitHistory === 1}
                onCheckedChange={(c) => setFormData(p => ({ ...p, showVisitHistory: c ? 1 : 0 }))}
              />
              <Label>Visit History</Label>
            </div>
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium">Staff Dashboard Settings</h4>
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.showProfileOnBooking === 1}
            onCheckedChange={(c) => setFormData(p => ({ ...p, showProfileOnBooking: c ? 1 : 0 }))}
          />
          <Label>Show client profile popup when viewing bookings</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.highlightAllergies === 1}
            onCheckedChange={(c) => setFormData(p => ({ ...p, highlightAllergies: c ? 1 : 0 }))}
          />
          <Label>Highlight allergies in red on client cards</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={formData.highlightVip === 1}
            onCheckedChange={(c) => setFormData(p => ({ ...p, highlightVip: c ? 1 : 0 }))}
          />
          <Label>Show VIP badge on client cards</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={() => onSave(formData)} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
