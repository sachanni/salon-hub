import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Users, Plus, Trash2, Edit, User } from "lucide-react";

interface StaffStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

interface StaffMember {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialties: string;
}

export default function StaffStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: StaffStepProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [newStaff, setNewStaff] = useState<StaffMember>({
    name: "",
    email: "",
    phone: "",
    role: "Stylist",
    specialties: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing staff
  const { data: existingStaff } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId,
    onSuccess: (data) => {
      setStaff(data || []);
    }
  });

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (staffMember: StaffMember) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/staff`, staffMember);
      return response.json();
    },
    onSuccess: (data) => {
      setStaff(prev => [...prev, data]);
      setNewStaff({ name: "", email: "", phone: "", role: "Stylist", specialties: "" });
      setIsAddingStaff(false);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'staff'] });
      toast({
        title: "Staff Member Added",
        description: "Team member has been added successfully.",
      });
    }
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async (staffMember: StaffMember) => {
      if (!staffMember.id) throw new Error('Staff ID required for update');
      
      const response = await apiRequest('PUT', `/api/salons/${salonId}/staff/${staffMember.id}`, staffMember);
      return response.json();
    },
    onSuccess: (data) => {
      setStaff(prev => prev.map(s => s.id === data.id ? data : s));
      setEditingStaff(null);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'staff'] });
      toast({
        title: "Staff Member Updated",
        description: "Team member has been updated successfully.",
      });
    }
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const response = await apiRequest('DELETE', `/api/salons/${salonId}/staff/${staffId}`);
      return response.json();
    },
    onSuccess: (_, staffId) => {
      setStaff(prev => prev.filter(s => s.id !== staffId));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'staff'] });
      toast({
        title: "Staff Member Removed",
        description: "Team member has been removed.",
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

  const handleContinue = () => {
    onComplete({ staff });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Add your team members</h3>
          <p className="text-muted-foreground">
            Set up your staff so customers can book with specific team members
          </p>
        </div>
      </div>

      {/* Existing Staff */}
      {staff.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Your Team ({staff.length} member{staff.length !== 1 ? 's' : ''})</h4>
          <div className="grid gap-4">
            {staff.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium">{member.name}</h5>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      {member.phone && (
                        <p className="text-sm text-muted-foreground">{member.phone}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{member.role}</Badge>
                        {member.specialties && (
                          <span className="text-sm text-muted-foreground">
                            {member.specialties}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingStaff(member)}
                      data-testid={`button-edit-staff-${member.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => member.id && deleteStaffMutation.mutate(member.id)}
                      disabled={deleteStaffMutation.isPending}
                      data-testid={`button-delete-staff-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Staff */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {staff.length === 0 ? "Add Your First Team Member" : "Add Team Member"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAddingStaff ? (
            <Button
              onClick={() => setIsAddingStaff(true)}
              className="w-full"
              variant="outline"
              data-testid="button-add-staff"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staff-name">Full Name *</Label>
                  <Input
                    id="staff-name"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sarah Johnson"
                    data-testid="input-staff-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="staff-role">Role</Label>
                  <Input
                    id="staff-role"
                    value={newStaff.role}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Stylist, Colorist, Manager"
                    data-testid="input-staff-role"
                  />
                </div>
                
                <div>
                  <Label htmlFor="staff-email">Email Address *</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="sarah@salon.com"
                    data-testid="input-staff-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="staff-phone">Phone Number</Label>
                  <Input
                    id="staff-phone"
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    data-testid="input-staff-phone"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="staff-specialties">Specialties</Label>
                <Input
                  id="staff-specialties"
                  value={newStaff.specialties}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, specialties: e.target.value }))}
                  placeholder="e.g., Balayage, Extensions, Bridal Hair"
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
                  data-testid="button-save-staff"
                >
                  {addStaffMutation.isPending ? "Adding..." : "Add Team Member"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingStaff(false)}
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
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Edit Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-staff-name">Full Name *</Label>
                  <Input
                    id="edit-staff-name"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff(prev => prev ? { ...prev, name: e.target.value } : null)}
                    data-testid="input-edit-staff-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-staff-role">Role</Label>
                  <Input
                    id="edit-staff-role"
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff(prev => prev ? { ...prev, role: e.target.value } : null)}
                    data-testid="input-edit-staff-role"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-staff-email">Email Address *</Label>
                  <Input
                    id="edit-staff-email"
                    type="email"
                    value={editingStaff.email}
                    onChange={(e) => setEditingStaff(prev => prev ? { ...prev, email: e.target.value } : null)}
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
                  data-testid="input-edit-staff-specialties"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpdateStaff}
                  disabled={updateStaffMutation.isPending}
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
          {isCompleted && (
            <span className="text-green-600 font-medium">✓ Completed</span>
          )}
          {staff.length === 0 && (
            <span className="text-amber-600">
              You can add team members later if needed
            </span>
          )}
        </div>

        <Button
          onClick={handleContinue}
          data-testid="button-continue-staff"
        >
          Continue {staff.length > 0 ? `with ${staff.length} Team Member${staff.length !== 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
}