import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, Plus, Trash2, Edit, User, Camera, Mail, Phone, 
  Sparkles, Briefcase, Scissors, PaintBucket, Smile, Star, CheckCircle2,
  Lightbulb, Zap, Eye, Circle, Palette
} from "lucide-react";

interface StaffStepProps {
  salonId: string;
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

interface StaffMember {
  id?: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  gender?: string;
  photoUrl?: string;
  specialties: string[];
}

interface StaffFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  gender?: string;
  photoUrl?: string;
  specialties: string;
}

interface SuggestedRole {
  role: string;
  reason: string;
  matchedServices: string[];
}

// Extended role templates with all available roles
const ROLE_TEMPLATES = [
  { value: "Stylist", icon: Scissors, color: "from-purple-500 to-pink-500" },
  { value: "Colorist", icon: PaintBucket, color: "from-pink-500 to-rose-500" },
  { value: "Nail Technician", icon: Sparkles, color: "from-violet-500 to-purple-500" },
  { value: "Makeup Artist", icon: Smile, color: "from-rose-500 to-pink-500" },
  { value: "Esthetician", icon: Star, color: "from-purple-500 to-violet-500" },
  { value: "Massage Therapist", icon: Briefcase, color: "from-pink-500 to-purple-500" },
  { value: "Piercing Specialist", icon: Circle, color: "from-indigo-500 to-purple-500" },
  { value: "Tattoo Artist", icon: Palette, color: "from-purple-500 to-indigo-500" },
  { value: "Barber", icon: Scissors, color: "from-blue-500 to-indigo-500" },
  { value: "Lash Technician", icon: Eye, color: "from-pink-500 to-rose-500" },
  { value: "Waxing Specialist", icon: Zap, color: "from-orange-500 to-pink-500" },
];

export default function StaffStep({ 
  salonId, 
  onNext,
  onComplete,
  onBack,
  onSkip,
  isCompleted
}: StaffStepProps) {
  // Use onNext if provided (from SetupWizard), otherwise use onComplete (from Dashboard)
  const handleNext = onNext || onComplete || (() => {});
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffFormData | null>(null);
  const [newStaff, setNewStaff] = useState<StaffFormData>({
    name: "",
    email: "",
    phone: "",
    roles: [],
    gender: "",
    photoUrl: "",
    specialties: ""
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const arrayToString = (arr: string[] | string): string => {
    if (Array.isArray(arr)) {
      return arr.join(", ");
    }
    return arr || "";
  };

  const stringToArray = (str: string): string[] => {
    if (!str || typeof str !== 'string') return [];
    return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingStaff } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId
  });

  // Fetch intelligent role suggestions based on salon's services
  const { data: roleSuggestions } = useQuery<{
    suggestedRoles: SuggestedRole[];
    totalServices: number;
    message: string;
  }>({
    queryKey: ['/api/salons', salonId, 'suggested-roles'],
    enabled: !!salonId
  });

  useEffect(() => {
    if (existingStaff) {
      setStaff(Array.isArray(existingStaff) ? existingStaff : []);
    }
  }, [existingStaff]);

  // Auto-suggest roles when form is opened and suggestions are available
  useEffect(() => {
    if (isAddingStaff && roleSuggestions?.suggestedRoles && roleSuggestions.suggestedRoles.length > 0 && newStaff.roles.length === 0) {
      // Auto-select suggested roles when opening the add staff form
      const suggestedRoleNames = roleSuggestions.suggestedRoles.map(sr => sr.role);
      setNewStaff(prev => ({ ...prev, roles: suggestedRoleNames }));
    }
  }, [isAddingStaff, roleSuggestions]);

  // Handle photo upload
  const handlePhotoUpload = async (file: File, isEdit = false) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        if (isEdit && editingStaff) {
          setEditingStaff(prev => prev ? { ...prev, photoUrl: base64String } : null);
        } else {
          setNewStaff(prev => ({ ...prev, photoUrl: base64String }));
          setPhotoPreview(base64String);
        }

        toast({
          title: "Photo Uploaded!",
          description: "Staff photo has been added successfully.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Unable to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addStaffMutation = useMutation({
    mutationFn: async (staffFormData: StaffFormData) => {
      const staffMember: Omit<StaffMember, 'id'> = {
        ...staffFormData,
        specialties: stringToArray(staffFormData.specialties)
      };
      const response = await apiRequest('POST', `/api/salons/${salonId}/staff`, staffMember);
      return response.json();
    },
    onSuccess: (data) => {
      setStaff(prev => [...prev, data]);
      setNewStaff({ name: "", email: "", phone: "", roles: [], gender: "", photoUrl: "", specialties: "" });
      setPhotoPreview("");
      setIsAddingStaff(false);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Team Member Added!",
        description: `${data.name} has been added to your team.`,
      });
    },
    onError: (error) => {
      console.error('Failed to add staff member:', error);
      toast({
        title: "Failed to Add Team Member",
        description: "Unable to add team member. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (staffFormData: StaffFormData) => {
      if (!staffFormData.id) throw new Error('Staff ID required for update');
      
      const staffMember: StaffMember = {
        ...staffFormData,
        specialties: stringToArray(staffFormData.specialties)
      };
      
      const response = await apiRequest('PUT', `/api/salons/${salonId}/staff/${staffFormData.id}`, staffMember);
      return response.json();
    },
    onSuccess: (data) => {
      setStaff(prev => prev.map(s => s.id === data.id ? data : s));
      setEditingStaff(null);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Team Member Updated!",
        description: `${data.name}'s profile has been updated.`,
      });
    },
    onError: (error) => {
      console.error('Failed to update staff member:', error);
      toast({
        title: "Failed to Update",
        description: "Unable to update team member. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const response = await apiRequest('DELETE', `/api/salons/${salonId}/staff/${staffId}`);
      return response.json();
    },
    onSuccess: (_, staffId) => {
      const removedStaff = staff.find(s => s.id === staffId);
      setStaff(prev => prev.filter(s => s.id !== staffId));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Team Member Removed",
        description: `${removedStaff?.name || 'Team member'} has been removed.`,
      });
    },
    onError: (error) => {
      console.error('Failed to delete staff member:', error);
      toast({
        title: "Failed to Delete",
        description: "Unable to delete team member. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.email.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please provide name and email address.",
        variant: "destructive",
      });
      return;
    }

    await addStaffMutation.mutateAsync(newStaff);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    await updateStaffMutation.mutateAsync(editingStaff);
  };

  const handleContinue = async () => {
    // Invalidate completion status cache
    await queryClient.invalidateQueries({ 
      queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
    });
    
    handleNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center">
          <Users className="h-6 w-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" />
        </div>
        <div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Build Your Team
          </h3>
          <p className="text-muted-foreground">
            Add team members so customers can book with their favorites
          </p>
        </div>
      </div>

      {/* Existing Staff Grid */}
      {staff.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-lg">
              Your Team ({staff.length} member{staff.length !== 1 ? 's' : ''})
            </h4>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {staff.map((member) => (
              <Card key={member.id} className="border-purple-200 bg-gradient-to-br from-violet-50/50 to-pink-50/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    <div className="relative">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-lg truncate">{member.name}</h5>
                      {member.roles && member.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {member.roles.map((role, idx) => (
                            <Badge key={idx} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {member.gender && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span>{member.gender}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>

                      {member.specialties && member.specialties.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-purple-600">Specialties:</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {arrayToString(member.specialties)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStaff({
                          ...member,
                          specialties: arrayToString(member.specialties)
                        })}
                        className="h-8 w-8 p-0"
                        data-testid={`button-edit-staff-${member.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => member.id && deleteStaffMutation.mutate(member.id)}
                        disabled={deleteStaffMutation.isPending}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        data-testid={`button-delete-staff-${member.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Staff */}
      <Card className="border-purple-300 bg-gradient-to-br from-violet-50/50 to-pink-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {staff.length === 0 ? "Add Your First Team Member" : "Add Team Member"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAddingStaff ? (
            <Button
              onClick={() => setIsAddingStaff(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-add-staff"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          ) : (
            <div className="space-y-6">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4">
                <Label className="text-sm font-medium">Staff Photo (Optional)</Label>
                <div className="relative">
                  {photoPreview || newStaff.photoUrl ? (
                    <div className="relative">
                      <img
                        src={photoPreview || newStaff.photoUrl}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                      />
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center hover:from-violet-200 hover:to-pink-200 transition-colors"
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full" />
                      ) : (
                        <Camera className="h-8 w-8 text-purple-500" />
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Click to upload staff photo (JPG, PNG, max 5MB)
                </p>
              </div>

              {/* Intelligent Role Suggestions Banner */}
              {roleSuggestions && roleSuggestions.suggestedRoles.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shrink-0">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 mb-1">Smart Role Suggestions</h4>
                      <p className="text-sm text-amber-800 mb-3">
                        Based on your {roleSuggestions.totalServices} service{roleSuggestions.totalServices !== 1 ? 's' : ''}, we recommend these roles:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {roleSuggestions.suggestedRoles.map((suggested) => (
                          <Badge key={suggested.role} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {suggested.role}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-amber-700 mt-2">
                        ✨ Roles auto-selected below. Click any role to remove it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Role Templates - Multiple Selection */}
              <div>
                <Label className="mb-3 block">Select Roles (Multiple)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ROLE_TEMPLATES.map((roleTemplate) => {
                    const Icon = roleTemplate.icon;
                    const isSelected = newStaff.roles.includes(roleTemplate.value);
                    const isSuggested = roleSuggestions?.suggestedRoles.some(sr => sr.role === roleTemplate.value);
                    return (
                      <button
                        key={roleTemplate.value}
                        type="button"
                        onClick={() => {
                          setNewStaff(prev => ({
                            ...prev,
                            roles: isSelected
                              ? prev.roles.filter(r => r !== roleTemplate.value)
                              : [...prev.roles, roleTemplate.value]
                          }));
                        }}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 relative ${
                          isSelected
                            ? `border-purple-400 bg-gradient-to-r ${roleTemplate.color} text-white shadow-md`
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        {isSuggested && !isSelected && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-purple-500'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                          {roleTemplate.value}
                        </span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 ml-auto text-white" />}
                      </button>
                    );
                  })}
                </div>
                {newStaff.roles.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {newStaff.roles.length} role{newStaff.roles.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staff-name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    Full Name *
                  </Label>
                  <Input
                    id="staff-name"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sarah Johnson"
                    className="mt-1"
                    data-testid="input-staff-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="staff-gender" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    Gender
                  </Label>
                  <Select
                    value={newStaff.gender || ""}
                    onValueChange={(value) => setNewStaff(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger id="staff-gender" className="mt-1" data-testid="select-staff-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="staff-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-500" />
                    Email Address *
                  </Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="sarah@salon.com"
                    className="mt-1"
                    data-testid="input-staff-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="staff-phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-500" />
                    Phone Number
                  </Label>
                  <Input
                    id="staff-phone"
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                    data-testid="input-staff-phone"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="staff-specialties" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Specialties
                </Label>
                <Input
                  id="staff-specialties"
                  value={newStaff.specialties}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, specialties: e.target.value }))}
                  placeholder="e.g., Balayage, Extensions, Bridal Hair"
                  className="mt-1"
                  data-testid="input-staff-specialties"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  What are they particularly skilled at?
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddStaff}
                  disabled={addStaffMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  data-testid="button-save-staff"
                >
                  {addStaffMutation.isPending ? "Adding..." : "Add Team Member"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingStaff(false);
                    setPhotoPreview("");
                  }}
                  data-testid="button-cancel-add-staff"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <Card className="border-purple-400 bg-gradient-to-br from-violet-50/50 to-pink-50/50 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit className="h-5 w-5 text-purple-500" />
              Edit Team Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Photo Upload for Edit */}
              <div className="flex flex-col items-center gap-4">
                <Label className="text-sm font-medium">Staff Photo (Optional)</Label>
                <div className="relative">
                  {editingStaff.photoUrl ? (
                    <div className="relative">
                      <img
                        src={editingStaff.photoUrl}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                      />
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => editFileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center hover:from-violet-200 hover:to-pink-200 transition-colors"
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full" />
                      ) : (
                        <Camera className="h-8 w-8 text-purple-500" />
                      )}
                    </button>
                  )}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file, true);
                    }}
                  />
                </div>
              </div>

              {/* Role Templates for Edit - Multiple Selection */}
              <div>
                <Label className="mb-3 block">Select Roles (Multiple)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ROLE_TEMPLATES.map((roleTemplate) => {
                    const Icon = roleTemplate.icon;
                    const isSelected = editingStaff.roles.includes(roleTemplate.value);
                    return (
                      <button
                        key={roleTemplate.value}
                        type="button"
                        onClick={() => {
                          setEditingStaff(prev => prev ? {
                            ...prev,
                            roles: isSelected
                              ? prev.roles.filter(r => r !== roleTemplate.value)
                              : [...prev.roles, roleTemplate.value]
                          } : null);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                          isSelected
                            ? `border-purple-400 bg-gradient-to-r ${roleTemplate.color} text-white shadow-md`
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-purple-500'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                          {roleTemplate.value}
                        </span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 ml-auto text-white" />}
                      </button>
                    );
                  })}
                </div>
                {editingStaff.roles.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {editingStaff.roles.length} role{editingStaff.roles.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-staff-name">Full Name *</Label>
                  <Input
                    id="edit-staff-name"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="mt-1"
                    data-testid="input-edit-staff-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-staff-gender">Gender</Label>
                  <Select
                    value={editingStaff.gender || ""}
                    onValueChange={(value) => setEditingStaff(prev => prev ? { ...prev, gender: value } : null)}
                  >
                    <SelectTrigger id="edit-staff-gender" className="mt-1" data-testid="select-edit-staff-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-staff-email">Email Address *</Label>
                  <Input
                    id="edit-staff-email"
                    type="email"
                    value={editingStaff.email}
                    onChange={(e) => setEditingStaff(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="mt-1"
                    data-testid="input-edit-staff-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-staff-phone">Phone Number</Label>
                  <Input
                    id="edit-staff-phone"
                    type="tel"
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="mt-1"
                    data-testid="input-edit-staff-phone"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-staff-specialties">Specialties</Label>
                <Input
                  id="edit-staff-specialties"
                  value={editingStaff.specialties}
                  onChange={(e) => setEditingStaff(prev => prev ? { ...prev, specialties: e.target.value } : null)}
                  className="mt-1"
                  data-testid="input-edit-staff-specialties"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpdateStaff}
                  disabled={updateStaffMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  data-testid="button-update-staff"
                >
                  {updateStaffMutation.isPending ? "Updating..." : "Update Team Member"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingStaff(null)}
                  data-testid="button-cancel-edit-staff"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {staff.length === 0 && (
            <span className="text-amber-600">
              You can add team members later if needed
            </span>
          )}
        </div>

        <Button
          onClick={handleContinue}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          data-testid="button-continue-staff"
        >
          Continue {staff.length > 0 ? `with ${staff.length} Team Member${staff.length !== 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
}
