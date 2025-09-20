import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Plus, Trash2, Edit, Armchair } from "lucide-react";

interface ResourcesStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

interface Resource {
  id?: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  isActive: boolean;
}

const RESOURCE_TYPES = [
  { value: "chair", label: "Styling Chair" },
  { value: "room", label: "Private Room" },
  { value: "station", label: "Work Station" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" }
];

export default function ResourcesStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: ResourcesStepProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [newResource, setNewResource] = useState<Resource>({
    name: "",
    type: "chair",
    description: "",
    capacity: 1,
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing resources
  const { data: existingResources } = useQuery({
    queryKey: ['/api/salons', salonId, 'resources'],
    enabled: !!salonId,
    onSuccess: (data) => {
      setResources(data || []);
    }
  });

  // Add resource mutation
  const addResourceMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/resources`, resource);
      return response.json();
    },
    onSuccess: (data) => {
      setResources(prev => [...prev, data]);
      setNewResource({ name: "", type: "chair", description: "", capacity: 1, isActive: true });
      setIsAddingResource(false);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'resources'] });
      toast({
        title: "Resource Added",
        description: "Resource has been added to your salon.",
      });
    }
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      if (!resource.id) throw new Error('Resource ID required for update');
      
      const response = await apiRequest('PUT', `/api/salons/${salonId}/resources/${resource.id}`, resource);
      return response.json();
    },
    onSuccess: (data) => {
      setResources(prev => prev.map(r => r.id === data.id ? data : r));
      setEditingResource(null);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'resources'] });
      toast({
        title: "Resource Updated",
        description: "Resource has been updated successfully.",
      });
    }
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await apiRequest('DELETE', `/api/salons/${salonId}/resources/${resourceId}`);
      return response.json();
    },
    onSuccess: (_, resourceId) => {
      setResources(prev => prev.filter(r => r.id !== resourceId));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'resources'] });
      toast({
        title: "Resource Deleted",
        description: "Resource has been removed from your salon.",
      });
    }
  });

  const handleAddResource = async () => {
    if (!newResource.name.trim()) {
      toast({
        title: "Resource Name Required",
        description: "Please provide a name for the resource.",
        variant: "destructive",
      });
      return;
    }

    await addResourceMutation.mutateAsync(newResource);
  };

  const handleUpdateResource = async () => {
    if (!editingResource) return;
    await updateResourceMutation.mutateAsync(editingResource);
  };

  const handleContinue = () => {
    onComplete({ resources });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Set up your resources</h3>
          <p className="text-muted-foreground">
            Add chairs, rooms, and equipment that customers can book
          </p>
        </div>
      </div>

      {/* Existing Resources */}
      {resources.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Your Resources ({resources.length})</h4>
          <div className="grid gap-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Armchair className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium">{resource.name}</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        {resource.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline">
                          {RESOURCE_TYPES.find(t => t.value === resource.type)?.label || resource.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Capacity: {resource.capacity}
                        </span>
                        <Badge variant={resource.isActive ? "default" : "secondary"}>
                          {resource.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingResource(resource)}
                      data-testid={`button-edit-resource-${resource.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resource.id && deleteResourceMutation.mutate(resource.id)}
                      disabled={deleteResourceMutation.isPending}
                      data-testid={`button-delete-resource-${resource.id}`}
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

      {/* Add New Resource */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {resources.length === 0 ? "Add Your First Resource" : "Add Resource"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAddingResource ? (
            <Button
              onClick={() => setIsAddingResource(true)}
              className="w-full"
              variant="outline"
              data-testid="button-add-resource"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resource-name">Resource Name *</Label>
                  <Input
                    id="resource-name"
                    value={newResource.name}
                    onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Styling Chair 1"
                    data-testid="input-resource-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="resource-type">Type</Label>
                  <Select 
                    value={newResource.type} 
                    onValueChange={(value) => setNewResource(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger data-testid="select-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="resource-capacity">Capacity</Label>
                  <Input
                    id="resource-capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={newResource.capacity}
                    onChange={(e) => setNewResource(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    data-testid="input-resource-capacity"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How many people can use this resource simultaneously?
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="resource-active"
                    checked={newResource.isActive}
                    onChange={(e) => setNewResource(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4"
                    data-testid="checkbox-resource-active"
                  />
                  <Label htmlFor="resource-active" className="text-sm">
                    Available for booking
                  </Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="resource-description">Description</Label>
                <Input
                  id="resource-description"
                  value={newResource.description}
                  onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this resource..."
                  data-testid="input-resource-description"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddResource}
                  disabled={addResourceMutation.isPending}
                  data-testid="button-save-resource"
                >
                  {addResourceMutation.isPending ? "Adding..." : "Add Resource"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingResource(false)}
                  data-testid="button-cancel-add-resource"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Resource Modal */}
      {editingResource && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Edit Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-resource-name">Resource Name *</Label>
                  <Input
                    id="edit-resource-name"
                    value={editingResource.name}
                    onChange={(e) => setEditingResource(prev => prev ? { ...prev, name: e.target.value } : null)}
                    data-testid="input-edit-resource-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-resource-type">Type</Label>
                  <Select 
                    value={editingResource.type} 
                    onValueChange={(value) => setEditingResource(prev => prev ? { ...prev, type: value } : null)}
                  >
                    <SelectTrigger data-testid="select-edit-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-resource-capacity">Capacity</Label>
                  <Input
                    id="edit-resource-capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={editingResource.capacity}
                    onChange={(e) => setEditingResource(prev => prev ? { ...prev, capacity: parseInt(e.target.value) } : null)}
                    data-testid="input-edit-resource-capacity"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-resource-active"
                    checked={editingResource.isActive}
                    onChange={(e) => setEditingResource(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                    className="h-4 w-4"
                    data-testid="checkbox-edit-resource-active"
                  />
                  <Label htmlFor="edit-resource-active" className="text-sm">
                    Available for booking
                  </Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-resource-description">Description</Label>
                <Input
                  id="edit-resource-description"
                  value={editingResource.description}
                  onChange={(e) => setEditingResource(prev => prev ? { ...prev, description: e.target.value } : null)}
                  data-testid="input-edit-resource-description"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpdateResource}
                  disabled={updateResourceMutation.isPending}
                  data-testid="button-update-resource"
                >
                  {updateResourceMutation.isPending ? "Updating..." : "Update Resource"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingResource(null)}
                  data-testid="button-cancel-edit-resource"
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
          {resources.length === 0 && (
            <span className="text-amber-600">
              You can add resources later if needed
            </span>
          )}
        </div>

        <Button
          onClick={handleContinue}
          data-testid="button-continue-resources"
        >
          Continue {resources.length > 0 ? `with ${resources.length} Resource${resources.length !== 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
}