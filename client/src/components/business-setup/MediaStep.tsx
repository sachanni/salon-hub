import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, Upload, Trash2, Image as ImageIcon, Plus, 
  Star, Grid3x3, X, AlertCircle, CheckCircle2, 
  Sparkles, ImagePlus, Layers, Crown
} from "lucide-react";

interface MediaStepProps {
  salonId: string;
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

interface MediaAsset {
  id?: string;
  url: string;
  assetType: string;
  caption: string;
  isPrimary: boolean | number;
}

const MEDIA_CATEGORIES = [
  { 
    value: "cover", 
    label: "Cover Photo", 
    description: "Main image that represents your business",
    icon: Crown,
    color: "from-purple-500 to-pink-500"
  },
  { 
    value: "interior", 
    label: "Salon Interior", 
    description: "Showcase your beautiful space",
    icon: Layers,
    color: "from-violet-500 to-purple-500"
  },
  { 
    value: "services", 
    label: "Services & Work", 
    description: "Before & after, treatments in action",
    icon: Sparkles,
    color: "from-pink-500 to-rose-500"
  },
  { 
    value: "team", 
    label: "Team Photos", 
    description: "Your talented staff members",
    icon: ImagePlus,
    color: "from-fuchsia-500 to-pink-500"
  },
  { 
    value: "products", 
    label: "Products", 
    description: "Beauty products you use",
    icon: Grid3x3,
    color: "from-purple-500 to-violet-500"
  },
  { 
    value: "gallery", 
    label: "General Gallery", 
    description: "Other photos",
    icon: ImageIcon,
    color: "from-violet-500 to-pink-500"
  }
];

const SMART_TIPS = [
  { icon: Camera, text: "High-quality photos increase bookings by 65%" },
  { icon: Sparkles, text: "Show before & after transformations" },
  { icon: Star, text: "Upload at least 5-8 photos for best results" },
  { icon: CheckCircle2, text: "Natural lighting works best" }
];

export default function MediaStep({ 
  salonId, 
  onNext,
  onComplete,
  onBack,
  onSkip,
  isCompleted
}: MediaStepProps) {
  // Use onNext if provided (from SetupWizard), otherwise use onComplete (from Dashboard)
  const handleNext = onNext || onComplete || (() => {});
  
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [uploadTab, setUploadTab] = useState<"local" | "url">("local");
  const [newMedia, setNewMedia] = useState<MediaAsset>({
    url: "",
    assetType: "cover",
    caption: "",
    isPrimary: false
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Map frontend categories to valid database types
  const mapCategoryToDbType = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'cover': 'cover',
      'interior': 'gallery',
      'services': 'gallery',
      'team': 'gallery',
      'products': 'gallery',
      'gallery': 'gallery',
      'logo': 'logo',
      'video': 'video'
    };
    return categoryMap[category] || 'gallery';
  };

  // Smart category suggestion based on existing photos
  const suggestedCategory = () => {
    const categories = mediaAssets.map(m => m.assetType);
    if (!categories.includes('cover')) return 'cover';
    if (!categories.includes('interior')) return 'interior';
    if (!categories.includes('services')) return 'services';
    return 'gallery';
  };

  // Image compression utility
  const compressImage = async (file: File, maxSizeMB = 1): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (max 1920px width)
          const maxWidth = 1920;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress with quality
          const quality = file.size > maxSizeMB * 1024 * 1024 ? 0.7 : 0.85;
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isImage) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
      }
      if (!isUnder10MB) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
      }
      
      return isImage && isUnder10MB;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    const urls = await Promise.all(
      validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
    
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Add media asset mutation
  const addMediaMutation = useMutation({
    mutationFn: async (media: MediaAsset) => {
      const mediaData = {
        ...media,
        assetType: mapCategoryToDbType(media.assetType), // Map to valid DB type
        isPrimary: media.isPrimary ? 1 : 0
      };
      const response = await apiRequest('POST', `/api/salons/${salonId}/media-assets`, mediaData);
      return response.json();
    },
    onSuccess: (data) => {
      setMediaAssets(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Photo Added! ✨",
        description: `${data.caption || 'New photo'} has been added to your gallery`,
      });
    },
    onError: (error) => {
      console.error('Failed to add media asset:', error);
      toast({
        title: "Upload Failed",
        description: "Unable to add photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Upload local files
  const handleUploadLocalFiles = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploadProgress(0);
      const totalFiles = selectedFiles.length;
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Compress image
        const compressedImage = await compressImage(file);
        
        // Create media asset
        const media: MediaAsset = {
          url: compressedImage,
          assetType: newMedia.assetType || suggestedCategory(),
          caption: newMedia.caption || file.name.replace(/\.[^/.]+$/, ""),
          isPrimary: i === 0 && mediaAssets.length === 0 && newMedia.isPrimary
        };
        
        await addMediaMutation.mutateAsync(media);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }
      
      // Clear selection
      setSelectedFiles([]);
      setPreviewUrls([]);
      setNewMedia({ url: "", assetType: "cover", caption: "", isPrimary: false });
      
      toast({
        title: "Upload Complete! 🎉",
        description: `Successfully uploaded ${totalFiles} photo${totalFiles > 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Some photos couldn't be uploaded. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadProgress(0);
    }
  };

  // Handle URL upload
  const handleAddUrlMedia = async () => {
    if (!newMedia.url.trim()) {
      toast({
        title: "Image URL Required",
        description: "Please provide a valid image URL.",
        variant: "destructive",
      });
      return;
    }

    await addMediaMutation.mutateAsync(newMedia);
    setNewMedia({ url: "", assetType: "cover", caption: "", isPrimary: false });
  };

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
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Photo Removed",
        description: `${deletedMedia?.caption || 'Photo'} has been removed`,
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

  // Set primary media mutation
  const setPrimaryMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}/media-assets/${mediaId}/set-primary`);
      return response.json();
    },
    onSuccess: (data, mediaId) => {
      setMediaAssets(prev => prev.map(asset => ({
        ...asset,
        isPrimary: asset.id === mediaId ? 1 : 0
      })));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Primary Photo Set ⭐",
        description: "This photo will be shown as your main salon image",
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

  const handleContinue = async () => {
    // Invalidate completion status cache
    await queryClient.invalidateQueries({ 
      queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
    });
    
    handleNext();
  };

  // Group media by category
  const mediaByCategory = MEDIA_CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = mediaAssets.filter(m => m.assetType === cat.value);
    return acc;
  }, {} as Record<string, MediaAsset[]>);

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 via-pink-100 to-rose-50 p-6 border border-purple-200">
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-300/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-300/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Camera className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Media & Gallery
            </h3>
            <p className="text-gray-600 mt-1">
              Upload stunning photos to attract more customers and showcase your work
            </p>
          </div>
          {mediaAssets.length > 0 && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              {mediaAssets.length} Photo{mediaAssets.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Smart Tips */}
      {showSmartSuggestions && mediaAssets.length < 5 && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Smart Tips
                </span>
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSmartSuggestions(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SMART_TIPS.map((tip, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <tip.icon className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span>{tip.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Gallery */}
      {mediaAssets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg">Your Gallery</h4>
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              {mediaAssets.length} total
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaAssets.map((media) => {
              const category = MEDIA_CATEGORIES.find(c => c.value === media.assetType);
              const IconComponent = category?.icon || ImageIcon;
              
              return (
                <Card key={media.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-purple-100">
                  <div className="relative aspect-[4/3]">
                    <img 
                      src={media.url} 
                      alt={media.caption}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image';
                      }}
                    />
                    
                    {/* Primary Badge */}
                    {media.isPrimary && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg">
                          <Crown className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`bg-gradient-to-r ${category?.color} text-white border-0`}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {category?.label}
                      </Badge>
                    </div>
                    
                    {/* Actions */}
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!media.isPrimary && (
                        <Button
                          size="sm"
                          className="bg-white/90 hover:bg-white text-purple-600 shadow-lg"
                          onClick={() => media.id && handleSetPrimary(media.id)}
                          disabled={setPrimaryMediaMutation.isPending}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="shadow-lg"
                        onClick={() => media.id && deleteMediaMutation.mutate(media.id)}
                        disabled={deleteMediaMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                    <p className="font-medium text-gray-900 truncate">
                      {media.caption || 'Untitled'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Section */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-600" />
            Upload Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as "local" | "url")} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-purple-100">
              <TabsTrigger value="local" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                <Upload className="h-4 w-4 mr-2" />
                From Computer
              </TabsTrigger>
              <TabsTrigger value="url" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                <ImageIcon className="h-4 w-4 mr-2" />
                From URL
              </TabsTrigger>
            </TabsList>

            {/* Local Upload Tab */}
            <TabsContent value="local" className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragging 
                    ? 'border-purple-500 bg-purple-50 scale-[1.02]' 
                    : 'border-purple-300 hover:border-purple-400 hover:bg-purple-50/50'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`
                    p-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100
                    ${isDragging ? 'scale-110' : 'scale-100'}
                    transition-transform
                  `}>
                    <ImagePlus className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {isDragging ? 'Drop photos here' : 'Drag & drop photos here'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse from your computer
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supports: JPG, PNG, WebP (Max 10MB per file)
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Selected Files Preview */}
              {previewUrls.length > 0 && (
                <div className="space-y-3">
                  <Label>Selected Photos ({previewUrls.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-purple-200">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeSelectedFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Upload Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Category</Label>
                      <Select 
                        value={newMedia.assetType} 
                        onValueChange={(value) => setNewMedia(prev => ({ ...prev, assetType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDIA_CATEGORIES.map((cat) => {
                            const IconComp = cat.icon;
                            return (
                              <SelectItem key={cat.value} value={cat.value}>
                                <div className="flex items-center gap-2">
                                  <IconComp className="h-4 w-4" />
                                  {cat.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Caption (Optional)</Label>
                      <Input
                        value={newMedia.caption}
                        onChange={(e) => setNewMedia(prev => ({ ...prev, caption: e.target.value }))}
                        placeholder="Describe these photos..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="set-primary-local"
                      checked={!!newMedia.isPrimary}
                      onChange={(e) => setNewMedia(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                    />
                    <Label htmlFor="set-primary-local" className="text-sm cursor-pointer">
                      Set first photo as primary
                    </Label>
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleUploadLocalFiles}
                    disabled={addMediaMutation.isPending || selectedFiles.length === 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {addMediaMutation.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Uploading {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : '...'}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* URL Upload Tab */}
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Image URL</Label>
                  <Input
                    type="url"
                    value={newMedia.url}
                    onChange={(e) => setNewMedia(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a direct link to an image (JPG, PNG, WebP)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={newMedia.assetType} 
                      onValueChange={(value) => setNewMedia(prev => ({ ...prev, assetType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDIA_CATEGORIES.map((cat) => {
                          const IconComp = cat.icon;
                          return (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <IconComp className="h-4 w-4" />
                                {cat.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Caption</Label>
                    <Input
                      value={newMedia.caption}
                      onChange={(e) => setNewMedia(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Describe this photo..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="set-primary-url"
                    checked={!!newMedia.isPrimary}
                    onChange={(e) => setNewMedia(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Label htmlFor="set-primary-url" className="text-sm cursor-pointer">
                    Set as primary photo
                  </Label>
                </div>

                {newMedia.url && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="relative aspect-video w-full max-w-md border-2 border-purple-200 rounded-lg overflow-hidden">
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

                <Button
                  onClick={handleAddUrlMedia}
                  disabled={addMediaMutation.isPending || !newMedia.url.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {addMediaMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Photo
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm">
          {mediaAssets.length === 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Adding photos helps customers choose your salon
            </span>
          )}
        </div>

        <Button
          onClick={handleContinue}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Continue {mediaAssets.length > 0 ? `with ${mediaAssets.length} Photo${mediaAssets.length !== 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
}
