import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, Sparkles, Send } from 'lucide-react';

interface HairColorControlsProps {
  onApplyColor: (colorPrompt: string) => Promise<void>;
  isProcessing: boolean;
  skinTone: string;
}

interface ColorSuggestion {
  name: string;
  prompt: string;
  hex: string;
  description: string;
}

export default function HairColorControls({
  onApplyColor,
  isProcessing,
  skinTone
}: HairColorControlsProps) {
  const [customPrompt, setCustomPrompt] = useState('');

  const colorSuggestions: ColorSuggestion[] = useMemo(() => {
    const skinToneLower = skinTone.toLowerCase();
    
    const fairSkinColors: ColorSuggestion[] = [
      { name: 'Platinum Blonde', prompt: 'platinum blonde hair', hex: '#f5f5dc', description: 'Cool, icy blonde' },
      { name: 'Ash Brown', prompt: 'ash brown hair', hex: '#8b7d6b', description: 'Cool-toned brown' },
      { name: 'Burgundy', prompt: 'burgundy red hair', hex: '#800020', description: 'Rich wine red' },
      { name: 'Rose Gold', prompt: 'rose gold pink hair', hex: '#b76e79', description: 'Soft pink blonde' },
      { name: 'Caramel', prompt: 'caramel blonde hair', hex: '#c68642', description: 'Warm honey blonde' },
      { name: 'Auburn', prompt: 'auburn red hair', hex: '#a52a2a', description: 'Red-brown blend' },
    ];

    const mediumSkinColors: ColorSuggestion[] = [
      { name: 'Warm Chocolate', prompt: 'warm chocolate brown hair', hex: '#5c4033', description: 'Rich warm brown' },
      { name: 'Honey Blonde', prompt: 'honey blonde highlights', hex: '#e1a95f', description: 'Golden blonde' },
      { name: 'Copper', prompt: 'copper red hair', hex: '#b87333', description: 'Vibrant copper' },
      { name: 'Chestnut', prompt: 'chestnut brown hair', hex: '#954535', description: 'Red-brown tone' },
      { name: 'Golden Brown', prompt: 'golden brown hair', hex: '#996515', description: 'Warm brown' },
      { name: 'Mahogany', prompt: 'mahogany red hair', hex: '#c04000', description: 'Deep reddish brown' },
    ];

    const darkSkinColors: ColorSuggestion[] = [
      { name: 'Deep Espresso', prompt: 'deep espresso brown hair', hex: '#3e2723', description: 'Very dark brown' },
      { name: 'Blue Black', prompt: 'blue black hair', hex: '#1a1110', description: 'Black with blue tint' },
      { name: 'Rich Mahogany', prompt: 'rich mahogany highlights', hex: '#c04000', description: 'Deep red-brown' },
      { name: 'Burgundy Highlights', prompt: 'burgundy highlights on dark hair', hex: '#800020', description: 'Wine red accents' },
      { name: 'Chocolate Cherry', prompt: 'chocolate cherry brown hair', hex: '#4a0e0e', description: 'Brown with red' },
      { name: 'Warm Black', prompt: 'warm black hair', hex: '#0a0a0a', description: 'Soft black' },
    ];

    if (skinToneLower.includes('fair') || skinToneLower.includes('light')) {
      return fairSkinColors;
    } else if (skinToneLower.includes('dark') || skinToneLower.includes('deep')) {
      return darkSkinColors;
    } else {
      return mediumSkinColors;
    }
  }, [skinTone]);

  const handleApplyColor = async (prompt: string) => {
    await onApplyColor(prompt);
    setCustomPrompt('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      handleApplyColor(customPrompt.trim());
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
              AI-Recommended Colors for {skinTone}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              These colors are specifically chosen to complement your skin tone
            </p>
          </div>
        </div>
      </Card>

      <div>
        <Label className="text-sm font-semibold mb-3 block">Recommended Hair Colors</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {colorSuggestions.map((color) => (
            <Button
              key={color.name}
              variant="outline"
              onClick={() => handleApplyColor(color.prompt)}
              disabled={isProcessing}
              className="h-auto p-3 flex flex-col items-start gap-2 hover-elevate"
              data-testid={`button-color-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center gap-2 w-full">
                <div
                  className="w-6 h-6 rounded-full border-2 border-border flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-semibold text-sm text-left">{color.name}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                {color.description}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <Label htmlFor="custom-color" className="text-sm font-semibold mb-3 block">
          Custom Hair Color
        </Label>
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              id="custom-color"
              placeholder="e.g., pastel pink, silver grey, balayage highlights..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isProcessing}
              data-testid="input-custom-hair-color"
            />
          </div>
          <Button
            type="submit"
            disabled={isProcessing || !customPrompt.trim()}
            data-testid="button-apply-custom-color"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Describe any hair color you'd like to try
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Badge variant="secondary" className="justify-center py-2">
          <Palette className="h-3 w-3 mr-1" />
          Natural Colors
        </Badge>
        <Badge variant="secondary" className="justify-center py-2">
          <Sparkles className="h-3 w-3 mr-1" />
          Bold & Creative
        </Badge>
      </div>
    </div>
  );
}
