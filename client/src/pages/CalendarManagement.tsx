import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, Plus, Edit, Trash2, Settings, CheckCircle, XCircle, Lock, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import BookingCalendarView from "@/components/BookingCalendarView";
import BookingListView from "@/components/BookingListView";
import CustomerProfilesView from "@/components/CustomerProfilesView";
import FrontDeskPanel from "@/components/FrontDeskPanel";
import JobCardDrawer from "@/components/JobCardDrawer";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  salonId: string;
}

interface AvailabilityPattern {
  id: string;
  salonId: string;
  staffId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

const staffSchema = z.object({
  name: z.string().min(1, "Staff name is required"),
  email: z.string().email("Valid email is required"),
  role: z.string().min(1, "Role is required")
});

const availabilityPatternSchema = z.object({
  staffId: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  slotDuration: z.number().min(15).max(480),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().optional()
});

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

interface CalendarManagementProps {
  salonId?: string; // Optional prop for embedding in dashboard
}

export default function CalendarManagement({ salonId: propSalonId }: CalendarManagementProps = {}) {
  const { user, isAuthenticated, isBusinessUser, token, userSalons } = useAuth();
  const { toast } = useToast();
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<AvailabilityPattern | null>(null);
  const [selectedSalonId, setSelectedSalonId] = useState<string>('');
  const [jobCardDrawerOpen, setJobCardDrawerOpen] = useState(false);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string | null>(null);

  const handleOpenJobCard = (jobCardId: string) => {
    setSelectedJobCardId(jobCardId);
    setJobCardDrawerOpen(true);
  };

  // Get salonId from prop (dashboard embedding) or selected salon or first available salon
  const salonId = propSalonId || selectedSalonId || userSalons[0]?.id || '';

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS!
  // Fetch staff
  const { data: staff = [], isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/staff`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }
      return response.json() as Promise<Staff[]>;
    },
    enabled: !!salonId && !!token
  });

  // Fetch availability patterns
  const { data: patterns = [], isLoading: patternsLoading, error: patternsError } = useQuery({
    queryKey: ['/api/salons', salonId, 'availability-patterns'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/availability-patterns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch availability patterns');
      }
      return response.json() as Promise<AvailabilityPattern[]>;
    },
    enabled: !!salonId && !!token
  });

  // Staff form
  const staffForm = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: ""
    }
  });

  // Pattern form
  const patternForm = useForm({
    resolver: zodResolver(availabilityPatternSchema),
    defaultValues: {
      staffId: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 60,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: ""
    }
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/salons/${salonId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create staff member');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'staff'] });
      setIsStaffDialogOpen(false);
      staffForm.reset();
      toast({
        title: "Success",
        description: "Staff member added successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive"
      });
    }
  });

  // Create/update pattern mutation
  const savePatternMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingPattern 
        ? `/api/availability-patterns/${editingPattern.id}`
        : `/api/salons/${salonId}/availability-patterns`;
      const method = editingPattern ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to save availability pattern');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'availability-patterns'] });
      setIsPatternDialogOpen(false);
      setEditingPattern(null);
      patternForm.reset();
      toast({
        title: "Success",
        description: editingPattern ? "Availability pattern updated successfully" : "Availability pattern created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save availability pattern",
        variant: "destructive"
      });
    }
  });

  // Delete pattern mutation
  const deletePatternMutation = useMutation({
    mutationFn: async (patternId: string) => {
      const response = await fetch(`/api/availability-patterns/${patternId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete availability pattern');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'availability-patterns'] });
      toast({
        title: "Success",
        description: "Availability pattern deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete availability pattern",
        variant: "destructive"
      });
    }
  });

  // Regenerate availability mutation
  const regenerateAvailabilityMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/regenerate-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error('Failed to regenerate availability');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Availability regenerated successfully for the next 90 days"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate availability",
        variant: "destructive"
      });
    }
  });

  // Check authentication and permissions AFTER all hooks
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to be signed in to access calendar management
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/join">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isBusinessUser) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              Business Access Required
            </CardTitle>
            <CardDescription>
              Only business owners, managers, and staff can access calendar management
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <Link href="/join/business">Join as Business</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!salonId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>No Salon Access</CardTitle>
            <CardDescription>
              You don't have access to any salons yet
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const onStaffSubmit = (data: any) => {
    createStaffMutation.mutate(data);
  };

  const onPatternSubmit = (data: any) => {
    savePatternMutation.mutate(data);
  };

  const handleEditPattern = (pattern: AvailabilityPattern) => {
    setEditingPattern(pattern);
    patternForm.reset({
      staffId: pattern.staffId || "",
      dayOfWeek: pattern.dayOfWeek,
      startTime: pattern.startTime,
      endTime: pattern.endTime,
      slotDuration: pattern.slotDuration,
      effectiveFrom: pattern.effectiveFrom.split('T')[0],
      effectiveTo: pattern.effectiveTo?.split('T')[0] || ""
    });
    setIsPatternDialogOpen(true);
  };

  const handleDeletePattern = (patternId: string) => {
    if (confirm("Are you sure you want to delete this availability pattern?")) {
      deletePatternMutation.mutate(patternId);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (staffLoading || patternsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading calendar management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-calendar-title">
              <Calendar className="h-8 w-8" />
              Calendar Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your salon's staff and recurring availability patterns
            </p>
          </div>
          <Button 
            onClick={() => regenerateAvailabilityMutation.mutate()}
            disabled={regenerateAvailabilityMutation.isPending}
            data-testid="button-regenerate-availability"
          >
            <Settings className="h-4 w-4 mr-2" />
            {regenerateAvailabilityMutation.isPending ? "Regenerating..." : "Regenerate Availability"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="frontdesk" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="frontdesk" data-testid="tab-frontdesk">
            <ClipboardList className="h-4 w-4 mr-2" />
            Front Desk
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Booking Calendar
          </TabsTrigger>
          <TabsTrigger value="bookings" data-testid="tab-bookings">
            <Users className="h-4 w-4 mr-2" />
            Booking List
          </TabsTrigger>
          <TabsTrigger value="staff" data-testid="tab-staff">
            <Users className="h-4 w-4 mr-2" />
            Staff Management
          </TabsTrigger>
          <TabsTrigger value="patterns" data-testid="tab-patterns">
            <Clock className="h-4 w-4 mr-2" />
            Availability Patterns
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            <Users className="h-4 w-4 mr-2" />
            Customer Profiles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frontdesk">
          <FrontDeskPanel 
            salonId={salonId} 
            onOpenJobCard={handleOpenJobCard}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Live Booking Calendar</CardTitle>
              <CardDescription>
                View and manage all your salon bookings in calendar format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingCalendarView salonId={salonId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <BookingListView salonId={salonId} />
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Staff Members</CardTitle>
                  <CardDescription>
                    Manage your salon's staff members and their roles
                  </CardDescription>
                </div>
                <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-staff">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Staff Member</DialogTitle>
                      <DialogDescription>
                        Add a new staff member to your salon
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...staffForm}>
                      <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-4">
                        <FormField
                          control={staffForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter staff name" {...field} data-testid="input-staff-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={staffForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter email address" {...field} data-testid="input-staff-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={staffForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Hair Stylist, Nail Technician" {...field} data-testid="input-staff-role" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createStaffMutation.isPending} data-testid="button-save-staff">
                            {createStaffMutation.isPending ? "Adding..." : "Add Staff Member"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No staff members added yet</p>
                  <p className="text-sm text-muted-foreground">Add your first staff member to get started</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {staff.map((member) => (
                    <Card key={member.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium" data-testid={`text-staff-name-${member.id}`}>{member.name}</h3>
                          <p className="text-sm text-muted-foreground" data-testid={`text-staff-email-${member.id}`}>{member.email}</p>
                        </div>
                        <Badge variant="secondary" data-testid={`badge-staff-role-${member.id}`}>{member.role}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Availability Patterns</CardTitle>
                  <CardDescription>
                    Set up recurring availability schedules for your salon
                  </CardDescription>
                </div>
                <Dialog open={isPatternDialogOpen} onOpenChange={(open) => {
                  setIsPatternDialogOpen(open);
                  if (!open) {
                    setEditingPattern(null);
                    patternForm.reset();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-pattern">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Availability Pattern
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPattern ? "Edit Availability Pattern" : "Add Availability Pattern"}
                      </DialogTitle>
                      <DialogDescription>
                        Create a recurring schedule pattern for your salon
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...patternForm}>
                      <form onSubmit={patternForm.handleSubmit(onPatternSubmit)} className="space-y-4">
                        <FormField
                          control={patternForm.control}
                          name="staffId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Staff Member (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-pattern-staff">
                                    <SelectValue placeholder="Select staff member (leave empty for general availability)" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="general" data-testid="select-option-no-staff">General Availability</SelectItem>
                                  {staff.map((member) => (
                                    <SelectItem key={member.id} value={member.id} data-testid={`select-option-staff-${member.id}`}>
                                      {member.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={patternForm.control}
                          name="dayOfWeek"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Day of Week</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-pattern-day">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DAYS_OF_WEEK.map((day, index) => (
                                    <SelectItem key={index} value={index.toString()} data-testid={`select-option-day-${index}`}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={patternForm.control}
                            name="startTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} data-testid="input-pattern-start-time" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={patternForm.control}
                            name="endTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} data-testid="input-pattern-end-time" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={patternForm.control}
                          name="slotDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slot Duration (minutes)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-pattern-duration">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="15">15 minutes</SelectItem>
                                  <SelectItem value="30">30 minutes</SelectItem>
                                  <SelectItem value="45">45 minutes</SelectItem>
                                  <SelectItem value="60">1 hour</SelectItem>
                                  <SelectItem value="90">1.5 hours</SelectItem>
                                  <SelectItem value="120">2 hours</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={patternForm.control}
                            name="effectiveFrom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Effective From</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-pattern-effective-from" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={patternForm.control}
                            name="effectiveTo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Effective To (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-pattern-effective-to" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => {
                            setIsPatternDialogOpen(false);
                            setEditingPattern(null);
                            patternForm.reset();
                          }}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={savePatternMutation.isPending} data-testid="button-save-pattern">
                            {savePatternMutation.isPending ? "Saving..." : (editingPattern ? "Update Pattern" : "Create Pattern")}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No availability patterns set up yet</p>
                  <p className="text-sm text-muted-foreground">Create your first pattern to schedule recurring availability</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {patterns.map((pattern) => {
                    const staffMember = staff.find(s => s.id === pattern.staffId);
                    return (
                      <Card key={pattern.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" data-testid={`badge-pattern-day-${pattern.id}`}>
                                {DAYS_OF_WEEK[pattern.dayOfWeek]}
                              </Badge>
                              <Badge variant={pattern.isActive ? "default" : "secondary"} data-testid={`badge-pattern-status-${pattern.id}`}>
                                {pattern.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                              {staffMember && (
                                <Badge variant="secondary" data-testid={`badge-pattern-staff-${pattern.id}`}>
                                  {staffMember.name}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span data-testid={`text-pattern-time-${pattern.id}`}>
                                {formatTime(pattern.startTime)} - {formatTime(pattern.endTime)}
                              </span>
                              <span className="mx-2">•</span>
                              <span data-testid={`text-pattern-duration-${pattern.id}`}>
                                {pattern.slotDuration} min slots
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Effective from {new Date(pattern.effectiveFrom).toLocaleDateString()}
                              {pattern.effectiveTo && ` to ${new Date(pattern.effectiveTo).toLocaleDateString()}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditPattern(pattern)}
                              data-testid={`button-edit-pattern-${pattern.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeletePattern(pattern.id)}
                              data-testid={`button-delete-pattern-${pattern.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <CustomerProfilesView salonId={salonId} />
        </TabsContent>
      </Tabs>

      <JobCardDrawer
        salonId={salonId}
        jobCardId={selectedJobCardId}
        open={jobCardDrawerOpen}
        onOpenChange={setJobCardDrawerOpen}
      />
    </div>
  );
}