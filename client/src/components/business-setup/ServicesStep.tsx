import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Scissors, Plus, Trash2, Edit } from "lucide-react";

interface ServicesStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

interface Service {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

export default function ServicesStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: ServicesStepProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Service>({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    category: "Hair"
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing services
  const { data: existingServices } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update local services state when query data changes
  useEffect(() => {
    if (existingServices && Array.isArray(existingServices)) {
      setServices(existingServices);
    }
  }, [existingServices]);

  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: async (service: Service) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/services`, service);
      return response.json();
    },
    onSuccess: (data) => {
      setServices(prev => [...prev, data]);
      setNewService({ name: "", description: "", duration: 60, price: 0, category: "Hair" });
      setIsAddingService(false);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'services'] });
      toast({
        title: "Service Added",
        description: "Service has been added to your catalog.",
      });
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (service: Service) => {
      if (!service.id) throw new Error('Service ID required for update');
      
      const response = await apiRequest('PUT', `/api/salons/${salonId}/services/${service.id}`, service);
      return response.json();
    },
    onSuccess: (data) => {
      setServices(prev => prev.map(s => s.id === data.id ? data : s));
      setEditingService(null);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'services'] });
      toast({
        title: "Service Updated",
        description: "Service has been updated successfully.",
      });
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await apiRequest('DELETE', `/api/salons/${salonId}/services/${serviceId}`);
      return response.json();
    },
    onSuccess: (_, serviceId) => {
      setServices(prev => prev.filter(s => s.id !== serviceId));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'services'] });
      toast({
        title: "Service Deleted",
        description: "Service has been removed from your catalog.",
      });
    }
  });

  const handleAddService = async () => {
    if (!newService.name.trim() || newService.price <= 0) {
      toast({
        title: "Invalid Service",
        description: "Please provide a service name and valid price.",
        variant: "destructive",
      });
      return;
    }

    await addServiceMutation.mutateAsync(newService);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    await updateServiceMutation.mutateAsync(editingService);
  };

  const handleContinue = () => {
    if (services.length === 0) {
      toast({
        title: "No Services Added",
        description: "Please add at least one service to continue.",
        variant: "destructive",
      });
      return;
    }

    onComplete({ services });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Scissors className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">What services do you offer?</h3>
          <p className="text-muted-foreground">
            Add the services customers can book with you
          </p>
        </div>
      </div>

      {/* Existing Services */}
      {services.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Your Services ({services.length})</h4>
          <div className="grid gap-4">
            {services.map((service) => (
              <Card key={service.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h5 className="font-medium">{service.name}</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">{service.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {service.duration} min
                          </span>
                          <span className="font-medium text-primary">
                            ${service.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingService(service)}
                      data-testid={`button-edit-service-${service.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => service.id && deleteServiceMutation.mutate(service.id)}
                      disabled={deleteServiceMutation.isPending}
                      data-testid={`button-delete-service-${service.id}`}
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

      {/* Add New Service */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {isAddingService ? "Add New Service" : "Add Your First Service"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAddingService ? (
            <Button
              onClick={() => setIsAddingService(true)}
              className="w-full"
              variant="outline"
              data-testid="button-add-service"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-name">Service Name *</Label>
                  <Input
                    id="service-name"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Haircut & Style"
                    data-testid="input-service-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-category">Category</Label>
                  <Input
                    id="service-category"
                    value={newService.category}
                    onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Hair, Nails, Massage"
                    data-testid="input-service-category"
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-duration">Duration (minutes) *</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    min="15"
                    max="480"
                    value={newService.duration}
                    onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    data-testid="input-service-duration"
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-price">Price ($) *</Label>
                  <Input
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newService.price}
                    onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    data-testid="input-service-price"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what's included in this service..."
                  className="min-h-[80px]"
                  data-testid="textarea-service-description"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddService}
                  disabled={addServiceMutation.isPending}
                  data-testid="button-save-service"
                >
                  {addServiceMutation.isPending ? "Adding..." : "Add Service"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingService(false)}
                  data-testid="button-cancel-add-service"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Modal */}
      {editingService && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Edit Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-service-name">Service Name *</Label>
                  <Input
                    id="edit-service-name"
                    value={editingService.name}
                    onChange={(e) => setEditingService(prev => prev ? { ...prev, name: e.target.value } : null)}
                    data-testid="input-edit-service-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-service-category">Category</Label>
                  <Input
                    id="edit-service-category"
                    value={editingService.category}
                    onChange={(e) => setEditingService(prev => prev ? { ...prev, category: e.target.value } : null)}
                    data-testid="input-edit-service-category"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-service-duration">Duration (minutes) *</Label>
                  <Input
                    id="edit-service-duration"
                    type="number"
                    min="15"
                    max="480"
                    value={editingService.duration}
                    onChange={(e) => setEditingService(prev => prev ? { ...prev, duration: parseInt(e.target.value) } : null)}
                    data-testid="input-edit-service-duration"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-service-price">Price ($) *</Label>
                  <Input
                    id="edit-service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingService.price}
                    onChange={(e) => setEditingService(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                    data-testid="input-edit-service-price"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-service-description">Description</Label>
                <Textarea
                  id="edit-service-description"
                  value={editingService.description}
                  onChange={(e) => setEditingService(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="min-h-[80px]"
                  data-testid="textarea-edit-service-description"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpdateService}
                  disabled={updateServiceMutation.isPending}
                  data-testid="button-update-service"
                >
                  {updateServiceMutation.isPending ? "Updating..." : "Update Service"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingService(null)}
                  data-testid="button-cancel-edit-service"
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
        </div>

        <Button
          onClick={handleContinue}
          disabled={services.length === 0}
          data-testid="button-continue-services"
        >
          Continue with {services.length} Service{services.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}