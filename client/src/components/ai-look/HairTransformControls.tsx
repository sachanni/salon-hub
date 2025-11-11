import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Palette, Scissors, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HairTransformControlsProps {
  originalPhoto: string;
  onComplete: (transformedPhoto: string) => void;
  onSkip: () => void;
}

export default function HairTransformControls({ 
  originalPhoto, 
  onComplete,
  onSkip 
}: HairTransformControlsProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'color' | 'style'>('color');
  const [customPrompt, setCustomPrompt] = useState('');

  const hairColorPresets = [
    { label: 'Platinum Blonde', prompt: 'platinum blonde hair color, natural looking' },
    { label: 'Golden Blonde', prompt: 'golden blonde hair color, warm tones' },
    { label: 'Chestnut Brown', prompt: 'chestnut brown hair color, rich and glossy' },
    { label: 'Auburn Red', prompt: 'auburn red hair color, natural copper tones' },
    { label: 'Burgundy', prompt: 'burgundy wine red hair color, deep rich color' },
    { label: 'Jet Black', prompt: 'jet black hair color, glossy finish' },
    { label: 'Ash Brown', prompt: 'ash brown hair color, cool tones' },
    { label: 'Rose Gold', prompt: 'rose gold hair color, pink champagne blend' },
    { label: 'Caramel Highlights', prompt: 'caramel highlights on brown hair, natural blend' },
    { label: 'Balayage Ombre', prompt: 'balayage ombre from dark to light, natural gradient' },
  ];

  const hairstylePresets = [
    { label: 'Long Wavy', prompt: 'long wavy hairstyle, flowing and voluminous' },
    { label: 'Bob Cut', prompt: 'classic bob haircut, sleek and modern' },
    { label: 'Curly', prompt: 'natural curly hairstyle, bouncy curls' },
    { label: 'Straight & Sleek', prompt: 'straight sleek hairstyle, smooth and shiny' },
    { label: 'Layered', prompt: 'layered haircut with volume and movement' },
    { label: 'Beach Waves', prompt: 'beach waves hairstyle, textured and effortless' },
    { label: 'Pixie Cut', prompt: 'pixie short haircut, modern and chic' },
    { label: 'Shoulder Length', prompt: 'shoulder length hairstyle, medium length' },
    { label: 'Loose Curls', prompt: 'loose soft curls, romantic and feminine' },
    { label: 'Updo', prompt: 'elegant updo hairstyle, formal and polished' },
  ];

  const handleHairColorTransform = async (prompt: string) => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/premium/ai-look/hair-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: originalPhoto,
          textPrompt: prompt,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Transformation failed' }));
        throw new Error(errorData.message || 'Hair color transformation failed');
      }

      const result = await response.json();
      
      if (result.success && result.imageData) {
        setTransformedImage(result.imageData.resultUrl || result.imageData.url || result.imageData);
        toast({
          title: 'Hair color applied! ✨',
          description: 'Your new hair color looks amazing',
        });
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error: any) {
      console.error('[Hair Color] Error:', error);
      toast({
        title: 'Transformation failed',
        description: error.message || 'Failed to apply hair color. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHairstyleTransform = async (prompt: string) => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/premium/ai-look/hairstyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: transformedImage || originalPhoto,
          textPrompt: prompt,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Transformation failed' }));
        throw new Error(errorData.message || 'Hairstyle transformation failed');
      }

      const result = await response.json();
      
      if (result.success && result.imageData) {
        setTransformedImage(result.imageData.resultUrl || result.imageData.url || result.imageData);
        toast({
          title: 'Hairstyle applied! ✨',
          description: 'Your new hairstyle looks fabulous',
        });
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error: any) {
      console.error('[Hairstyle] Error:', error);
      toast({
        title: 'Transformation failed',
        description: error.message || 'Failed to apply hairstyle. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomTransform = async () => {
    if (!customPrompt.trim()) {
      toast({
        title: 'Enter a description',
        description: 'Please describe the hair transformation you want',
        variant: 'destructive',
      });
      return;
    }

    if (activeTab === 'color') {
      await handleHairColorTransform(customPrompt);
    } else {
      await handleHairstyleTransform(customPrompt);
    }
  };

  const handleComplete = () => {
    if (transformedImage) {
      onComplete(transformedImage);
    } else {
      onComplete(originalPhoto);
    }
  };

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-purple-100">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Scissors className="h-6 w-6 text-purple-600" />
              Hair Transformations
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Try different hair colors and styles - Women's looks first!
            </p>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            AI Powered
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'color' | 'style')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="color" className="gap-2">
              <Palette className="h-4 w-4" />
              Hair Color
            </TabsTrigger>
            <TabsTrigger value="style" className="gap-2">
              <Scissors className="h-4 w-4" />
              Hairstyle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="color" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {hairColorPresets.map((preset) => (
                <Button
                  key={preset.label}
                  onClick={() => handleHairColorTransform(preset.prompt)}
                  disabled={isProcessing}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50"
                >
                  <Palette className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-medium text-center">{preset.label}</span>
                </Button>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Hair Color
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g., 'silver gray hair with lavender tints'"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleCustomTransform}
                  disabled={isProcessing || !customPrompt.trim()}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Apply
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {hairstylePresets.map((preset) => (
                <Button
                  key={preset.label}
                  onClick={() => handleHairstyleTransform(preset.prompt)}
                  disabled={isProcessing}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-2 hover:border-purple-400 hover:bg-purple-50"
                >
                  <Scissors className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-medium text-center">{preset.label}</span>
                </Button>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Hairstyle
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="E.g., 'medium length with soft bangs'"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleCustomTransform}
                  disabled={isProcessing || !customPrompt.trim()}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Apply
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Original</label>
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 aspect-[3/4]">
              <img
                src={originalPhoto}
                alt="Original"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {transformedImage ? 'Transformed' : 'Preview'}
            </label>
            <div className="relative rounded-lg overflow-hidden border-2 border-purple-300 bg-purple-50 aspect-[3/4]">
              {isProcessing ? (
                <div className="absolute inset-0 flex items-center justify-center bg-purple-50/90">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-purple-700 font-medium">
                      Transforming hair...
                    </p>
                    <p className="text-xs text-purple-600 mt-1">This may take 20-30 seconds</p>
                  </div>
                </div>
              ) : transformedImage ? (
                <img
                  src={transformedImage}
                  alt="Transformed"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-purple-400">
                    <Sparkles className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">Select a preset to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isProcessing}
          >
            Skip Hair Transformations
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isProcessing}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="h-4 w-4" />
            Continue with {transformedImage ? 'New Look' : 'Original Look'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
