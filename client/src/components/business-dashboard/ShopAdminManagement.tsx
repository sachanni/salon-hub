import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  Trash2,
  Edit2,
  Search,
  AlertCircle,
  CheckCircle,
  History,
  UserCog,
  Crown,
  Building
} from "lucide-react";
import { format } from "date-fns";

interface ShopAdminListItem {
  userId: string;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  userProfileImage: string | null;
  role: 'shop_admin' | 'staff';
  assignedAt: string;
  assignedByName: string | null;
  isActive: boolean;
}

interface AuditLog {
  id: number;
  userId: string;
  action: string;
  targetUserId: string | null;
  previousValue: any;
  newValue: any;
  createdAt: string;
}

interface Permission {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
}

interface ShopAdminManagementProps {
  salonId: string;
}

export default function ShopAdminManagement({ salonId }: ShopAdminManagementProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("admins");
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [editAdminDialogOpen, setEditAdminDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<ShopAdminListItem | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<'shop_admin' | 'staff'>('shop_admin');
  const [notes, setNotes] = useState("");
  const [confirmRevokeDialogOpen, setConfirmRevokeDialogOpen] = useState(false);

  const { data: adminsData, isLoading: adminsLoading } = useQuery({
    queryKey: ['/api/shop-admin', salonId, 'admins'],
    queryFn: async () => {
      const response = await fetch(`/api/shop-admin/${salonId}/admins`);
      if (!response.ok) throw new Error('Failed to fetch admins');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: myPermissions } = useQuery({
    queryKey: ['/api/shop-admin', salonId, 'my-permissions'],
    queryFn: async () => {
      const response = await fetch(`/api/shop-admin/${salonId}/my-permissions`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: allPermissions } = useQuery({
    queryKey: ['/api/shop-admin/permissions/all'],
    queryFn: async () => {
      const response = await fetch('/api/shop-admin/permissions/all');
      if (!response.ok) throw new Error('Failed to fetch all permissions');
      return response.json();
    },
  });

  const { data: rolePermissions } = useQuery({
    queryKey: ['/api/shop-admin/permissions/role', selectedRole],
    queryFn: async () => {
      const response = await fetch(`/api/shop-admin/permissions/role/${selectedRole}`);
      if (!response.ok) throw new Error('Failed to fetch role permissions');
      return response.json();
    },
    enabled: addAdminDialogOpen || editAdminDialogOpen,
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/shop-admin', salonId, 'audit-logs'],
    queryFn: async () => {
      const response = await fetch(`/api/shop-admin/${salonId}/audit-logs`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    },
    enabled: !!salonId && activeTab === 'audit' && myPermissions?.isBusinessOwner,
  });

  const { data: userSearch, isLoading: userSearchLoading } = useQuery({
    queryKey: ['/api/users/search', searchEmail],
    queryFn: async () => {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(searchEmail)}`);
      if (!response.ok) throw new Error('Failed to search users');
      return response.json();
    },
    enabled: searchEmail.length >= 3,
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; role: 'shop_admin' | 'staff'; notes?: string }) => {
      return apiRequest('POST', `/api/shop-admin/${salonId}/assign`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-admin', salonId, 'admins'] });
      toast({ title: "Success", description: "Role assigned successfully" });
      setAddAdminDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; newRole: 'shop_admin' | 'staff'; notes?: string }) => {
      return apiRequest('POST', `/api/shop-admin/${salonId}/update-role`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-admin', salonId, 'admins'] });
      toast({ title: "Success", description: "Role updated successfully" });
      setEditAdminDialogOpen(false);
      setSelectedAdmin(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const revokeRoleMutation = useMutation({
    mutationFn: async (data: { userId: string }) => {
      return apiRequest('POST', `/api/shop-admin/${salonId}/revoke`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-admin', salonId, 'admins'] });
      toast({ title: "Success", description: "Access revoked successfully" });
      setConfirmRevokeDialogOpen(false);
      setSelectedAdmin(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSearchEmail("");
    setSelectedRole('shop_admin');
    setNotes("");
  };

  const handleAddAdmin = (userId: string) => {
    assignRoleMutation.mutate({
      userId,
      role: selectedRole,
      notes: notes || undefined,
    });
  };

  const handleUpdateRole = () => {
    if (!selectedAdmin) return;
    updateRoleMutation.mutate({
      userId: selectedAdmin.userId,
      newRole: selectedRole,
      notes: notes || undefined,
    });
  };

  const handleRevokeRole = () => {
    if (!selectedAdmin) return;
    revokeRoleMutation.mutate({
      userId: selectedAdmin.userId,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'business_owner':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'shop_admin':
        return 'bg-violet-100 text-violet-700 border-violet-300';
      case 'staff':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'business_owner':
        return 'Business Owner';
      case 'shop_admin':
        return 'Shop Admin';
      case 'staff':
        return 'Staff';
      default:
        return role;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'role_assigned':
        return 'Role Assigned';
      case 'role_updated':
        return 'Role Updated';
      case 'role_revoked':
        return 'Access Revoked';
      default:
        return action;
    }
  };

  const isBusinessOwner = myPermissions?.isBusinessOwner;
  const admins: ShopAdminListItem[] = adminsData?.admins || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Team & Permissions</h2>
          <p className="text-muted-foreground">Manage who has access to your salon dashboard</p>
        </div>
        {isBusinessOwner && (
          <Button
            onClick={() => setAddAdminDialogOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      <Separator />

      {myPermissions && (
        <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Your Role</p>
                <Badge className={getRoleBadgeColor(myPermissions.role)}>
                  {myPermissions.role === 'business_owner' && <Crown className="h-3 w-3 mr-1" />}
                  {getRoleLabel(myPermissions.role)}
                </Badge>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {myPermissions.permissions?.length || 0} permissions
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          {isBusinessOwner && (
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="admins" className="mt-6">
          {adminsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading team members...</p>
            </div>
          ) : admins.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add team members to help manage your salon
                </p>
                {isBusinessOwner && (
                  <Button onClick={() => setAddAdminDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Team Member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <Card key={admin.userId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={admin.userProfileImage || undefined} />
                        <AvatarFallback className="bg-violet-100 text-violet-700">
                          {admin.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{admin.userName}</p>
                          <Badge className={getRoleBadgeColor(admin.role)}>
                            {getRoleLabel(admin.role)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {admin.userEmail || admin.userPhone || 'No contact info'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Added {format(new Date(admin.assignedAt), 'MMM d, yyyy')}
                          {admin.assignedByName && ` by ${admin.assignedByName}`}
                        </div>
                      </div>
                      {isBusinessOwner && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setSelectedRole(admin.role);
                              setNotes("");
                              setEditAdminDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setConfirmRevokeDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-violet-600" />
                Permission Reference
              </CardTitle>
              <CardDescription>
                Understand what each role can access in your salon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['business_owner', 'shop_admin', 'staff'].map((role) => (
                  <Card key={role} className={`border ${role === 'business_owner' ? 'border-amber-200 bg-amber-50' : role === 'shop_admin' ? 'border-violet-200 bg-violet-50' : 'border-blue-200 bg-blue-50'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {role === 'business_owner' && <Crown className="h-4 w-4 text-amber-600" />}
                        {role === 'shop_admin' && <UserCog className="h-4 w-4 text-violet-600" />}
                        {role === 'staff' && <Users className="h-4 w-4 text-blue-600" />}
                        <CardTitle className="text-sm">{getRoleLabel(role)}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-2">
                        {role === 'business_owner' && 'Full access to all features and settings'}
                        {role === 'shop_admin' && 'Manage day-to-day operations'}
                        {role === 'staff' && 'View bookings and basic features'}
                      </p>
                      <div className="text-xs font-medium text-muted-foreground">
                        {role === 'business_owner' && '36 permissions'}
                        {role === 'shop_admin' && '30 permissions'}
                        {role === 'staff' && '9 permissions'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {allPermissions?.grouped && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold">All Available Permissions</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {Object.entries(allPermissions.grouped as Record<string, Permission[]>).map(([category, perms]) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm text-violet-600 mb-2 capitalize">{category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {perms.map((perm: Permission) => (
                              <div key={perm.code} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">{perm.name}</p>
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isBusinessOwner && (
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-violet-600" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  Track all permission changes and admin actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : !auditLogs?.logs || auditLogs.logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activity logs yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {auditLogs.logs.map((log: AuditLog) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            {log.action === 'role_assigned' && <UserPlus className="h-4 w-4 text-green-600" />}
                            {log.action === 'role_updated' && <Edit2 className="h-4 w-4 text-blue-600" />}
                            {log.action === 'role_revoked' && <Trash2 className="h-4 w-4 text-red-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{getActionLabel(log.action)}</p>
                            <div className="text-xs text-muted-foreground mt-1">
                              {log.previousValue && (
                                <span>From: <Badge variant="outline" className="text-xs">{log.previousValue.role}</Badge> </span>
                              )}
                              {log.newValue && (
                                <span>To: <Badge variant="outline" className="text-xs">{log.newValue.role}</Badge></span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Search for a user and assign them a role in your salon
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="search-email">Search by Email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter email address (min 3 characters)"
                  className="pl-10"
                />
              </div>
            </div>

            {userSearchLoading && (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-violet-600 border-t-transparent rounded-full mx-auto" />
              </div>
            )}

            {userSearch?.users && userSearch.users.length > 0 && (
              <div className="space-y-2">
                <Label>Select User</Label>
                {userSearch.users.map((user: any) => (
                  <Card
                    key={user.id}
                    className="cursor-pointer hover:bg-violet-50 transition-colors"
                    onClick={() => handleAddAdmin(user.id)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>
                          {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchEmail.length >= 3 && !userSearchLoading && (!userSearch?.users || userSearch.users.length === 0) && (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No users found with that email</p>
              </div>
            )}

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'shop_admin' | 'staff')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shop_admin">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Shop Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Staff
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {rolePermissions && (
                <p className="text-xs text-muted-foreground mt-1">
                  This role has {rolePermissions.permissions?.length || 0} permissions
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this team member..."
                rows={2}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editAdminDialogOpen} onOpenChange={setEditAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update the role for {selectedAdmin?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Role</Label>
              <div className="mt-1">
                <Badge className={getRoleBadgeColor(selectedAdmin?.role || 'staff')}>
                  {getRoleLabel(selectedAdmin?.role || 'staff')}
                </Badge>
              </div>
            </div>

            <div>
              <Label htmlFor="new-role">New Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'shop_admin' | 'staff')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shop_admin">Shop Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this change..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAdminDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRevokeDialogOpen} onOpenChange={setConfirmRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke access for {selectedAdmin?.userName}? They will no longer be able to access this salon's dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeRole}
              disabled={revokeRoleMutation.isPending}
            >
              {revokeRoleMutation.isPending ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
