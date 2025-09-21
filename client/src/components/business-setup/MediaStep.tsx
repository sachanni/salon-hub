import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Upload, Trash2, Image, Plus } from "lucide-react";

interface MediaStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

interface MediaAsset {
  id?: string;
  url: string;
  assetType: string;
  caption: string;
  isPrimary: boolean;
}

const MEDIA_TYPES = [
  { value: "cover", label: "Cover Photo (Main salon image)" },
  { value: "gallery", label: "Gallery (Services, staff, before/after)" },
  { value: "logo", label: "Business Logo" },
  { value: "video", label: "Video Content" }
];

export default function MediaStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: MediaStepProps) {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [newMedia, setNewMedia] = useState<MediaAsset>({
    url: "",
    assetType: "cover",
    caption: "",
    isPrimary: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing media assets
  const { data: existingMedia, isLoading: isLoadingMedia } = useQuery({
    queryKey: ['/api/salons', salonId, 'media-assets'],
    enabled: !!salonId,
  });

  // Update media assets when data loads
  useEffect(() => {
    if (existingMedia) {
      setMediaAssets(Array.isArray(existingMedia) ? existingMedia : []);
    }
  }, [existingMedia]);

  // Add media asset mutation
  const addMediaMutation = useMutation({
    mutationFn: async (media: MediaAsset) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/media-assets`, media);
      return response.json();
    },
    onSuccess: (data) => {
      setMediaAssets(prev => [...prev, data]);
      setNewMedia({ url: "", assetType: "cover", caption: "", isPrimary: false });
      setIsAddingMedia(false);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      // Also invalidate salon profile to ensure immediate updates
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Photo Added!",
        description: `${data.caption || 'New photo'} has been added to your gallery and is now visible to customers.`,
      });
    },
    onError: (error) => {
      console.error('Failed to add media asset:', error);
      toast({
        title: "Upload Failed",
        description: "Unable to add photo. Please check the image URL and try again.",
        variant: "destructive",
      });
    }
  });

  // Delete media asset mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await apiRequest('DELETE', `/api/salons/${salonId}/media-assets/${mediaId}`);
      return response.json();
    },
    onSuccess: (_, mediaId) => {
      const deletedMedia = mediaAssets.find(m => m.id === mediaId);
      setMediaAssets(prev => prev.filter(m => m.id !== mediaId));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      // Also invalidate salon profile to ensure immediate updates
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Photo Removed",
        description: `${deletedMedia?.caption || 'Photo'} has been removed from your salon profile.`,
      });
    },
    onError: (error) => {
      console.error('Failed to delete media asset:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddMedia = async () => {
    if (!newMedia.url.trim()) {
      toast({
        title: "Image URL Required",
        description: "Please provide a valid image URL.",
        variant: "destructive",
      });
      return;
    }

    // If this is set as primary, unset others
    if (newMedia.isPrimary) {
      setMediaAssets(prev => prev.map(asset => ({ ...asset, isPrimary: false })));
    }

    await addMediaMutation.mutateAsync(newMedia);
  };

  // Set primary media mutation
  const setPrimaryMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}/media-assets/${mediaId}/set-primary`);
      return response.json();
    },
    onSuccess: (data, mediaId) => {
      // Update local state to reflect the change
      setMediaAssets(prev => prev.map(asset => ({
        ...asset,
        isPrimary: asset.id === mediaId
      })));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      // Also invalidate salon profile to ensure immediate updates
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Primary Photo Set",
        description: "This photo will be shown as your main salon image.",
      });
    },
    onError: (error) => {
      console.error('Failed to set primary media:', error);
      toast({
        title: "Failed to Set Primary",
        description: "Unable to set primary photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSetPrimary = (mediaId: string) => {
    setPrimaryMediaMutation.mutate(mediaId);
  };

  const handleContinue = () => {
    onComplete({ mediaAssets });
  };

  const isValidImageUrl = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes('unsplash.com') || url.includes('pexels.com');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Showcase your business</h3>
          <p className="text-muted-foreground">
            Add photos to help customers discover and choose your salon
          </p>
        </div>
      </div>

      {/* Existing Media Gallery */}
      {mediaAssets.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Your Gallery ({mediaAssets.length} photo{mediaAssets.length !== 1 ? 's' : ''})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaAssets.map((media) => (
              <Card key={media.id} className="overflow-hidden">
                <div className="relative aspect-video">
                  <img 
                    src={media.url} 
                    alt={media.caption}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                    }}
                  />
                  {media.isPrimary && (
                    <Badge className="absolute top-2 left-2" variant="default">
                      Primary
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {!media.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => media.id && handleSetPrimary(media.id)}
                        disabled={setPrimaryMediaMutation.isPending}
                        data-testid={`button-set-primary-${media.id}`}
                      >
                        {setPrimaryMediaMutation.isPending ? "Setting..." : "Set Primary"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => media.id && deleteMediaMutation.mutate(media.id)}
                      disabled={deleteMediaMutation.isPending}
                      data-testid={`button-delete-media-${media.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{media.caption || 'Untitled'}</p>
                  <Badge variant="outline" className="mt-1">
                    {MEDIA_TYPES.find(t => t.value === media.assetType)?.label || media.assetType}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Media */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {mediaAssets.length === 0 ? "Add Your First Photo" : "Add Photo"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAddingMedia ? (
            <div className="space-y-4">
              <Button
                onClick={() => setIsAddingMedia(true)}
                className="w-full"
                variant="outline"
                data-testid="button-add-media"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <p>Recommended photo types:</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge variant="outline">Salon interior</Badge>
                  <Badge variant="outline">Service photos</Badge>
                  <Badge variant="outline">Before & after</Badge>
                  <Badge variant="outline">Staff photos</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="media-url">Image URL *</Label>
                  <Input
                    id="media-url"
                    type="url"
                    value={newMedia.url}
                    onChange={(e) => setNewMedia(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-media-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a direct link to an image (JPG, PNG, WebP)
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="media-type">Photo Type</Label>
                  <Select 
                    value={newMedia.assetType} 
                    onValueChange={(value) => setNewMedia(prev => ({ ...prev, assetType: value }))}
                  >
                    <SelectTrigger data-testid="select-media-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIA_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="media-caption">Caption</Label>
                  <Input
                    id="media-caption"
                    value={newMedia.caption}
                    onChange={(e) => setNewMedia(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Describe this photo..."
                    data-testid="input-media-caption"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="media-primary"
                    checked={newMedia.isPrimary}
                    onChange={(e) => setNewMedia(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="h-4 w-4"
                    data-testid="checkbox-media-primary"
                  />
                  <Label htmlFor="media-primary" className="text-sm">
                    Set as primary photo
                  </Label>
                </div>
              </div>

              {/* Preview */}
              {newMedia.url && isValidImageUrl(newMedia.url) && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative aspect-video w-full max-w-md border rounded-lg overflow-hidden">
                    <img 
                      src={newMedia.url} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddMedia}
                  disabled={addMediaMutation.isPending || !newMedia.url.trim()}
                  data-testid="button-save-media"
                >
                  {addMediaMutation.isPending ? "Adding..." : "Add Photo"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingMedia(false)}
                  data-testid="button-cancel-add-media"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Images for Testing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" />
            Sample Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click to use these sample salon images for testing:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500",
                caption: "Modern Salon Interior",
                assetType: "cover"
              },
              {
                url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
                caption: "Hair Styling Service",
                assetType: "gallery"
              },
              {
                url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500",
                caption: "Nail Art Service",
                assetType: "gallery"
              },
              {
                url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
                caption: "Spa Treatment Room",
                assetType: "cover"
              }
            ].map((sample, index) => (
              <div key={index} className="relative">
                <button
                  onClick={() => setNewMedia({
                    url: sample.url,
                    caption: sample.caption,
                    assetType: sample.assetType,
                    isPrimary: index === 0 && mediaAssets.length === 0
                  })}
                  className="w-full aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                  data-testid={`button-sample-image-${index}`}
                >
                  <img 
                    src={sample.url}
                    alt={sample.caption}
                    className="w-full h-full object-cover"
                  />
                </button>
                <p className="text-xs text-center mt-1">{sample.caption}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {isCompleted && (
            <span className="text-green-600 font-medium">✓ Completed</span>
          )}
          {mediaAssets.length === 0 && (
            <span className="text-amber-600">
              Adding photos helps customers choose your salon
            </span>
          )}
        </div>

        <Button
          onClick={handleContinue}
          data-testid="button-continue-media"
        >
          Continue {mediaAssets.length > 0 ? `with ${mediaAssets.length} Photo${mediaAssets.length !== 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
}