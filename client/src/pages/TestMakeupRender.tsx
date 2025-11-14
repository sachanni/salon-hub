import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Sparkles, Palette, Scissors, RotateCcw, Loader2, LogIn, Users } from 'lucide-react';
import BeforeAfterPreview, { type EffectOverride } from '@/components/ai-look/BeforeAfterPreview';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const SAMPLE_PRODUCTS = [
  {
    applicationArea: "Lipstick",
    product: {
      id: "1",
      name: "Matte Luxe Lipstick",
      brand: "MAC",
      shade: "Ruby Woo",
      color: "#c83264",
      isInStock: true
    },
    attributes: {
      shade: "#c83264",
      finish: "Matte"
    },
    reason: "Perfect red for fair skin tone"
  },
  {
    applicationArea: "Blush",
    product: {
      id: "2",
      name: "Powder Blush",
      brand: "NARS",
      shade: "Orgasm",
      color: "#ff9eb3",
      isInStock: true
    },
    attributes: {
      shade: "#ff9eb3",
      finish: "Powder"
    },
    reason: "Natural flush for cheeks"
  },
  {
    applicationArea: "Eyeliner",
    product: {
      id: "3",
      name: "Precision Liner",
      brand: "Urban Decay",
      shade: "Black",
      color: "#2c1810",
      isInStock: true
    },
    attributes: {
      shade: "#2c1810",
      finish: "Matte"
    },
    reason: "Classic eyeliner for definition"
  },
  {
    applicationArea: "Foundation",
    product: {
      id: "4",
      name: "Radiant Foundation",
      brand: "Fenty Beauty",
      shade: "120",
      color: "#f5d5c2",
      isInStock: true
    },
    attributes: {
      shade: "#f5d5c2",
      finish: "Natural"
    },
    reason: "Even skin tone"
  },
  {
    applicationArea: "Kajal",
    product: {
      id: "5",
      name: "Intense Kajal",
      brand: "Lakme",
      shade: "Black",
      color: "#1a1a1a",
      isInStock: true
    },
    attributes: {
      shade: "#1a1a1a",
      finish: "Matte"
    },
    reason: "Define lower waterline"
  },
  {
    applicationArea: "Eyeshadow",
    product: {
      id: "6",
      name: "Nude Eyeshadow",
      brand: "Maybelline",
      shade: "Brown Shimmer",
      color: "#8b6f47",
      isInStock: true
    },
    attributes: {
      shade: "#8b6f47",
      finish: "Shimmer"
    },
    reason: "Natural eye definition"
  },
  {
    applicationArea: "Eyebrow Pencil",
    product: {
      id: "7",
      name: "Brow Define",
      brand: "Anastasia",
      shade: "Medium Brown",
      color: "#3d2817",
      isInStock: true
    },
    attributes: {
      shade: "#3d2817",
      finish: "Matte"
    },
    reason: "Fill and shape brows"
  }
];

const SAMPLE_ANALYSIS = {
  skinTone: "Fair with warm undertones",
  facialFeatures: "Oval face shape, high cheekbones",
  recommendations: "Classic makeup with warm tones"
};

const HAIR_COLORS = [
  { name: 'Blonde', value: 'blonde', color: '#f5deb3' },
  { name: 'Platinum Blonde', value: 'platinum blonde', color: '#e5e4e2' },
  { name: 'Light Brown', value: 'light brown', color: '#a67b5b' },
  { name: 'Brunette', value: 'brunette', color: '#654321' },
  { name: 'Auburn', value: 'auburn', color: '#a52a2a' },
  { name: 'Red', value: 'red', color: '#8b0000' },
  { name: 'Black', value: 'black', color: '#1a1a1a' },
  { name: 'Dark Brown', value: 'dark brown', color: '#3d2817' },
];

const HAIRSTYLES = [
  { name: 'Bob Cut', value: 'bob cut', icon: Scissors },
  { name: 'Pixie Cut', value: 'pixie cut', icon: Scissors },
  { name: 'Long Waves', value: 'long waves', icon: Sparkles },
  { name: 'Beach Waves', value: 'beach waves', icon: Sparkles },
  { name: 'Straight Hair', value: 'straight hair', icon: Sparkles },
  { name: 'Curly Hair', value: 'curly hair', icon: Sparkles },
  { name: 'Bangs', value: 'bangs', icon: Scissors },
  { name: 'Updo', value: 'updo', icon: Sparkles },
  { name: 'Messy Bun', value: 'messy bun', icon: Sparkles },
  { name: 'Ponytail', value: 'ponytail', icon: Sparkles },
];

export default function TestMakeupRender() {
  const { toast } = useToast();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [effectOverrides, setEffectOverrides] = useState<EffectOverride[]>([]);
  
  const [makeupAppliedImage, setMakeupAppliedImage] = useState<string>('');
  const [hairColorImage, setHairColorImage] = useState<string>('');
  const [hairstyleImage, setHairstyleImage] = useState<string>('');
  
  const [selectedHairColor, setSelectedHairColor] = useState<string>('');
  const [customHairColor, setCustomHairColor] = useState<string>('');
  const [selectedHairstyle, setSelectedHairstyle] = useState<string>('');
  const [customHairstyle, setCustomHairstyle] = useState<string>('');
  
  const [isProcessingColor, setIsProcessingColor] = useState(false);
  const [isProcessingStyle, setIsProcessingStyle] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setMakeupAppliedImage('');
        setHairColorImage('');
        setHairstyleImage('');
        setSelectedHairColor('');
        setSelectedHairstyle('');
        setCustomHairColor('');
        setCustomHairstyle('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to upload base64 image and get public URL
  const uploadImageForLightX = async (imageUrl: string): Promise<string> => {
    // Skip upload if already a public URL (from previous LightX transformation)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('[Upload] Image is already a public URL, reusing:', imageUrl);
      return imageUrl;
    }

    // Only upload base64 data URIs
    if (!imageUrl.startsWith('data:image/')) {
      throw new Error('Invalid image format. Expected base64 data URI or public URL.');
    }

    // Convert base64 to Blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Create FormData and append the blob as a file
    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');

    // Upload to backend
    const uploadResponse = await fetch('/api/premium/ai-look/uploads', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.message || 'Image upload failed');
    }

    const uploadData = await uploadResponse.json();
    console.log('[Upload] Image uploaded successfully, public URL:', uploadData.publicUrl);
    return uploadData.publicUrl;
  };

  const handleApplyHairColor = async (colorDescription: string) => {
    if (!colorDescription.trim()) {
      toast({
        title: 'Please select or enter a hair color',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingColor(true);
    try {
      const sourceImage = hairColorImage || makeupAppliedImage || selectedImage;
      
      // Step 1: Upload image to get public URL
      const publicUrl = await uploadImageForLightX(sourceImage);
      
      // Step 2: Apply hair color transformation using public URL
      const response = await fetch('/api/premium/ai-look/hair-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: publicUrl,
          textPrompt: colorDescription.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Hair color transformation failed');
      }

      const data = await response.json();
      const transformedUrl = data.output_url || data.outputUrl;

      if (!transformedUrl) {
        throw new Error('No transformed image URL in response');
      }

      setHairColorImage(transformedUrl);
      toast({
        title: 'Hair color applied! ✨',
        description: `Successfully applied ${colorDescription}`,
      });
    } catch (error) {
      console.error('Hair color transformation error:', error);
      toast({
        title: 'Transformation failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingColor(false);
    }
  };

  const handleApplyHairstyle = async (styleDescription: string) => {
    if (!styleDescription.trim()) {
      toast({
        title: 'Please select or enter a hairstyle',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessingStyle(true);
    try {
      const sourceImage = hairstyleImage || hairColorImage || makeupAppliedImage || selectedImage;
      
      // Step 1: Upload image to get public URL
      const publicUrl = await uploadImageForLightX(sourceImage);
      
      // Step 2: Apply hairstyle transformation using public URL
      const response = await fetch('/api/premium/ai-look/hairstyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: publicUrl,
          textPrompt: styleDescription.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Hairstyle transformation failed');
      }

      const data = await response.json();
      const transformedUrl = data.output_url || data.outputUrl;

      if (!transformedUrl) {
        throw new Error('No transformed image URL in response');
      }

      setHairstyleImage(transformedUrl);
      toast({
        title: 'Hairstyle applied! ✨',
        description: `Successfully applied ${styleDescription}`,
      });
    } catch (error) {
      console.error('Hairstyle transformation error:', error);
      toast({
        title: 'Transformation failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingStyle(false);
    }
  };

  const resetHairColor = () => {
    setHairColorImage('');
    setSelectedHairColor('');
    setCustomHairColor('');
  };

  const resetHairstyle = () => {
    setHairstyleImage('');
    setSelectedHairstyle('');
    setCustomHairstyle('');
  };

  const resetAll = () => {
    setMakeupAppliedImage('');
    setHairColorImage('');
    setHairstyleImage('');
    setSelectedHairColor('');
    setSelectedHairstyle('');
    setCustomHairColor('');
    setCustomHairstyle('');
    setEffectOverrides([]);
  };

  const getCurrentDisplayImage = () => {
    return hairstyleImage || hairColorImage || makeupAppliedImage || selectedImage;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MediaPipe Makeup Rendering Test
          </h1>
          <p className="text-gray-600">
            Test the MediaPipe rendering directly without calling Gemini API
          </p>
        </Card>

        {!isAuthenticated && !isLoading && (
          <Card className="p-8 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-center">
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 text-center mb-6">
                Please log in to access hair transformation features (Hair Color & Hairstyle).
                Makeup rendering is available for all users.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <Link href={`/login/business?redirect=${encodeURIComponent('/test/makeup-render')}`}>
                  <Button 
                    className="w-full" 
                    variant="default"
                    data-testid="button-login-business"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Login as Business User
                  </Button>
                </Link>
                <Link href={`/login/customer?redirect=${encodeURIComponent('/test/makeup-render')}`}>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    data-testid="button-login-customer"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login as Customer
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                {user ? `Welcome back, ${user.firstName || user.email}!` : 'Choose your account type to continue'}
              </p>
            </CardContent>
          </Card>
        )}

        {!selectedImage ? (
          <Card className="p-12 bg-white/80 backdrop-blur-sm text-center">
            <Upload className="h-16 w-16 mx-auto mb-4 text-purple-500" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload a Photo to Test
            </h3>
            <p className="text-gray-600 mb-6">
              Upload any face photo to test MediaPipe makeup rendering
            </p>
            <div>
              <input
                id="test-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('test-image-upload')?.click()}
                className="cursor-pointer"
              >
                Choose Image
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Multi-Stage Preview
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAll}
                    data-testid="button-reset-all"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedImage('')}
                    data-testid="button-change-image"
                  >
                    Change Image
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 text-center">Original</p>
                  <div className="h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                    <img src={selectedImage} alt="Original" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 text-center">+ Makeup</p>
                  <div className="h-64 rounded-lg overflow-hidden border-2 border-purple-200 bg-purple-50 flex items-center justify-center">
                    {makeupAppliedImage ? (
                      <img src={makeupAppliedImage} alt="With Makeup" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        Not Applied
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 text-center">+ Hair Color</p>
                  <div className="h-64 rounded-lg overflow-hidden border-2 border-pink-200 bg-pink-50 flex items-center justify-center">
                    {hairColorImage ? (
                      <img src={hairColorImage} alt="With Hair Color" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        Not Applied
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 text-center">+ Hairstyle</p>
                  <div className="h-64 rounded-lg overflow-hidden border-2 border-amber-200 bg-amber-50 flex items-center justify-center">
                    {hairstyleImage ? (
                      <img src={hairstyleImage} alt="With Hairstyle" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        Not Applied
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Current Final Result:</p>
                <div className="h-96 max-w-md mx-auto rounded-lg overflow-hidden border-4 border-purple-300 shadow-lg bg-white flex items-center justify-center">
                  <img src={getCurrentDisplayImage()} alt="Final Result" className="w-full h-full object-contain" />
                </div>
              </div>
            </Card>

            <Tabs defaultValue="makeup" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="makeup" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Makeup
                </TabsTrigger>
                <TabsTrigger value="hair-color" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Hair Color
                </TabsTrigger>
                <TabsTrigger value="hairstyle" className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Hairstyle
                </TabsTrigger>
              </TabsList>

              <TabsContent value="makeup" className="space-y-4">
                <Card className="p-6 bg-white/80 backdrop-blur-sm">
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Test Products:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {SAMPLE_PRODUCTS.map((p) => (
                        <li key={p.product.id}>
                          • {p.applicationArea}: {p.product.brand} - {p.product.name} ({p.product.shade})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <BeforeAfterPreview
                    originalImage={selectedImage}
                    customerAnalysis={SAMPLE_ANALYSIS}
                    products={SAMPLE_PRODUCTS}
                    confidenceScore={92}
                    effectOverrides={effectOverrides}
                    onRenderedImage={(renderedImage) => setMakeupAppliedImage(renderedImage)}
                  />

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Makeup Controls:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['lipstick', 'blush', 'eyeliner', 'foundation', 'kajal', 'eyeshadow', 'eyebrow pencil'].map((category) => (
                        <Button
                          key={category}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const existing = effectOverrides.find(o => o.category === category);
                            if (existing) {
                              setEffectOverrides(prev => prev.filter(o => o.category !== category));
                            } else {
                              setEffectOverrides(prev => [...prev, {
                                category,
                                enabled: false,
                                intensity: 0.6
                              }]);
                            }
                          }}
                          className={
                            effectOverrides.find(o => o.category === category && !o.enabled)
                              ? 'bg-red-100 border-red-300'
                              : ''
                          }
                          data-testid={`button-toggle-${category}`}
                        >
                          {effectOverrides.find(o => o.category === category && !o.enabled)
                            ? `Disabled`
                            : category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="hair-color" className="space-y-4">
                <Card className="p-6 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Hair Color Transformation
                    </h3>
                    {hairColorImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetHairColor}
                        data-testid="button-reset-hair-color"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Popular Hair Colors:
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {HAIR_COLORS.map((color) => (
                          <Button
                            key={color.value}
                            variant={selectedHairColor === color.value ? 'default' : 'outline'}
                            size="sm"
                            disabled={!isAuthenticated || isProcessingColor}
                            onClick={() => {
                              if (!isAuthenticated) {
                                toast({
                                  title: 'Authentication required',
                                  description: 'Please log in to use hair transformations',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              setSelectedHairColor(color.value);
                              setCustomHairColor('');
                              handleApplyHairColor(color.value);
                            }}
                            className="flex items-center gap-2"
                            data-testid={`button-hair-color-${color.value}`}
                          >
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.color }}
                            />
                            {color.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <Label htmlFor="custom-hair-color" className="text-sm font-medium text-gray-700 mb-2 block">
                        Or describe a custom color:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-hair-color"
                          type="text"
                          placeholder="e.g., pastel pink, honey blonde, deep burgundy..."
                          value={customHairColor}
                          onChange={(e) => {
                            setCustomHairColor(e.target.value);
                            setSelectedHairColor('');
                          }}
                          disabled={isProcessingColor}
                          data-testid="input-custom-hair-color"
                        />
                        <Button
                          onClick={() => handleApplyHairColor(customHairColor)}
                          disabled={isProcessingColor || !customHairColor.trim()}
                          data-testid="button-apply-custom-hair-color"
                        >
                          {isProcessingColor ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    </div>

                    {isProcessingColor && (
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-600" />
                        <p className="text-sm text-blue-800">
                          Transforming hair color... This may take 20-30 seconds.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="hairstyle" className="space-y-4">
                <Card className="p-6 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Hairstyle Transformation
                    </h3>
                    {hairstyleImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetHairstyle}
                        data-testid="button-reset-hairstyle"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Popular Hairstyles:
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {HAIRSTYLES.map((style) => {
                          const Icon = style.icon;
                          return (
                            <Button
                              key={style.value}
                              variant={selectedHairstyle === style.value ? 'default' : 'outline'}
                              size="sm"
                              disabled={!isAuthenticated || isProcessingStyle}
                              onClick={() => {
                                if (!isAuthenticated) {
                                  toast({
                                    title: 'Authentication required',
                                    description: 'Please log in to use hair transformations',
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                setSelectedHairstyle(style.value);
                                setCustomHairstyle('');
                                handleApplyHairstyle(style.value);
                              }}
                              className="flex items-center gap-2"
                              data-testid={`button-hairstyle-${style.value}`}
                            >
                              <Icon className="h-4 w-4" />
                              {style.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative">
                      <Label htmlFor="custom-hairstyle" className="text-sm font-medium text-gray-700 mb-2 block">
                        Or describe a custom hairstyle:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-hairstyle"
                          type="text"
                          placeholder="e.g., layered shoulder-length with side bangs..."
                          value={customHairstyle}
                          onChange={(e) => {
                            setCustomHairstyle(e.target.value);
                            setSelectedHairstyle('');
                          }}
                          disabled={isProcessingStyle}
                          data-testid="input-custom-hairstyle"
                        />
                        <Button
                          onClick={() => handleApplyHairstyle(customHairstyle)}
                          disabled={isProcessingStyle || !customHairstyle.trim()}
                          data-testid="button-apply-custom-hairstyle"
                        >
                          {isProcessingStyle ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    </div>

                    {isProcessingStyle && (
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-600" />
                        <p className="text-sm text-blue-800">
                          Transforming hairstyle... This may take 20-30 seconds.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>💡 Testing Tips:</strong> Apply makeup first using MediaPipe, then try hair color and hairstyle transformations with LightX AI. 
                The multi-stage preview shows your complete transformation pipeline!
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
