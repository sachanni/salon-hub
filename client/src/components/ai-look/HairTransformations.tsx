import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Palette, Scissors, AlertCircle, Loader2, RotateCcw, ThumbsUp } from 'lucide-react';
import HairColorControls from './HairColorControls';
import HairstyleControls from './HairstyleControls';
import { useToast } from '@/hooks/use-toast';

interface HairTransformationsProps {
  originalPhoto: string;
  customerAnalysis: {
    skinTone: string;
    facialFeatures: string;
    recommendations: string;
  };
  onComplete?: (finalPhoto: string) => void;
  onBack?: () => void;
}

interface TransformationResult {
  imageUrl: string;
  timestamp: number;
  type: 'color' | 'style';
  description: string;
}

export default function HairTransformations({
  originalPhoto,
  customerAnalysis,
  onComplete,
  onBack
}: HairTransformationsProps) {
  const [activeTab, setActiveTab] = useState<string>('color');
  const [currentImage, setCurrentImage] = useState<string>(originalPhoto);
  const [transformationHistory, setTransformationHistory] = useState<TransformationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleColorTransformation = async (colorPrompt: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/premium/ai-look/hair-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: currentImage,
          textPrompt: colorPrompt,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Transformation failed' }));
        throw new Error(errorData.message || 'Failed to apply hair color');
      }

      const result = await response.json();

      if (result.success && result.imageData) {
        const newImageUrl = result.imageData.output_url || result.imageData.outputUrl;
        
        if (newImageUrl) {
          setCurrentImage(newImageUrl);
          setTransformationHistory(prev => [...prev, {
            imageUrl: newImageUrl,
            timestamp: Date.now(),
            type: 'color',
            description: colorPrompt
          }]);
          
          toast({
            title: "Hair color applied!",
            description: `Applied: ${colorPrompt}`,
          });
        } else {
          throw new Error('No output image received from API');
        }
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error: any) {
      console.error('Hair color transformation failed:', error);
      toast({
        title: "Transformation failed",
        description: error.message || "Failed to apply hair color. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStyleTransformation = async (stylePrompt: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/premium/ai-look/hairstyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: currentImage,
          textPrompt: stylePrompt,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Transformation failed' }));
        throw new Error(errorData.message || 'Failed to apply hairstyle');
      }

      const result = await response.json();

      if (result.success && result.imageData) {
        const newImageUrl = result.imageData.output_url || result.imageData.outputUrl;
        
        if (newImageUrl) {
          setCurrentImage(newImageUrl);
          setTransformationHistory(prev => [...prev, {
            imageUrl: newImageUrl,
            timestamp: Date.now(),
            type: 'style',
            description: stylePrompt
          }]);
          
          toast({
            title: "Hairstyle applied!",
            description: `Applied: ${stylePrompt}`,
          });
        } else {
          throw new Error('No output image received from API');
        }
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error: any) {
      console.error('Hairstyle transformation failed:', error);
      toast({
        title: "Transformation failed",
        description: error.message || "Failed to apply hairstyle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentImage(originalPhoto);
    setTransformationHistory([]);
    toast({
      title: "Reset complete",
      description: "Returned to original photo",
    });
  };

  const handleUndo = () => {
    if (transformationHistory.length > 1) {
      const newHistory = [...transformationHistory];
      newHistory.pop();
      setTransformationHistory(newHistory);
      setCurrentImage(newHistory[newHistory.length - 1].imageUrl);
      
      toast({
        title: "Undone",
        description: "Reverted to previous transformation",
      });
    } else {
      handleReset();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Scissors className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Hair Transformations</h2>
              <p className="text-sm text-muted-foreground">
                Try different hair colors and styles powered by AI
              </p>
            </div>
          </div>
          
          {transformationHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {transformationHistory.length} {transformationHistory.length === 1 ? 'Change' : 'Changes'}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Original</h3>
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
              <img
                src={originalPhoto}
                alt="Original"
                className="w-full h-full object-cover"
                data-testid="img-hair-original"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {transformationHistory.length > 0 ? 'With Transformations' : 'Preview'}
              </h3>
              {isProcessing && (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing...
                </Badge>
              )}
            </div>
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
              {isProcessing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Applying transformation...</p>
                  </div>
                </div>
              )}
              <img
                src={currentImage}
                alt="Transformed"
                className="w-full h-full object-cover"
                data-testid="img-hair-transformed"
              />
            </div>

            {transformationHistory.length > 0 && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={isProcessing}
                  className="flex-1"
                  data-testid="button-hair-undo"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="flex-1"
                  data-testid="button-hair-reset"
                >
                  Reset All
                </Button>
              </div>
            )}
          </div>
        </div>

        {transformationHistory.length > 0 && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Transformation History</h4>
            <div className="space-y-1 text-xs">
              {transformationHistory.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                  {item.type === 'color' ? (
                    <Palette className="h-3 w-3" />
                  ) : (
                    <Scissors className="h-3 w-3" />
                  )}
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="color" className="gap-2" data-testid="tab-hair-color">
              <Palette className="h-4 w-4" />
              Hair Color
            </TabsTrigger>
            <TabsTrigger value="style" className="gap-2" data-testid="tab-hairstyle">
              <Scissors className="h-4 w-4" />
              Hairstyle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="color" className="mt-4">
            <HairColorControls
              onApplyColor={handleColorTransformation}
              isProcessing={isProcessing}
              skinTone={customerAnalysis.skinTone}
            />
          </TabsContent>

          <TabsContent value="style" className="mt-4">
            <HairstyleControls
              onApplyStyle={handleStyleTransformation}
              isProcessing={isProcessing}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">💡 Pro Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Try subtle changes first, then build up to bolder looks</li>
                <li>• Hair color suggestions are based on your skin tone</li>
                <li>• You can undo or reset at any time</li>
                <li>• Combine hair color and style for complete transformations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isProcessing}
              data-testid="button-hair-back"
            >
              Back to Makeup
            </Button>
          )}
          <Button
            onClick={() => onComplete?.(currentImage)}
            disabled={isProcessing}
            className="flex-1"
            data-testid="button-hair-complete"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Finalize Complete Look
          </Button>
        </div>
      </Card>
    </div>
  );
}
