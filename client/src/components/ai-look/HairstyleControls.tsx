import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Scissors, Send, TrendingUp } from 'lucide-react';

interface HairstyleControlsProps {
  onApplyStyle: (stylePrompt: string) => Promise<void>;
  isProcessing: boolean;
}

interface StyleSuggestion {
  name: string;
  prompt: string;
  category: 'short' | 'medium' | 'long' | 'trendy';
  description: string;
}

const styleSuggestions: StyleSuggestion[] = [
  { name: 'Bob Cut', prompt: 'classic bob haircut', category: 'short', description: 'Chin-length classic' },
  { name: 'Pixie Cut', prompt: 'pixie cut hairstyle', category: 'short', description: 'Short & chic' },
  { name: 'Lob', prompt: 'long bob lob haircut', category: 'medium', description: 'Shoulder-length bob' },
  { name: 'Shag', prompt: 'shaggy layered haircut', category: 'medium', description: 'Textured layers' },
  { name: 'Beach Waves', prompt: 'beachy waves hairstyle', category: 'medium', description: 'Relaxed waves' },
  { name: 'Long Layers', prompt: 'long layered hair', category: 'long', description: 'Flowing layers' },
  { name: 'Curtain Bangs', prompt: 'curtain bangs hairstyle', category: 'trendy', description: 'Face-framing bangs' },
  { name: 'Butterfly Cut', prompt: 'butterfly haircut with layers', category: 'trendy', description: 'Layered & voluminous' },
  { name: 'Wolf Cut', prompt: 'wolf cut hairstyle', category: 'trendy', description: 'Edgy & textured' },
  { name: 'Blunt Cut', prompt: 'blunt straight haircut', category: 'medium', description: 'Sharp, even ends' },
  { name: 'Curly Afro', prompt: 'curly afro hairstyle', category: 'trendy', description: 'Natural curls' },
  { name: 'Sleek Straight', prompt: 'sleek straight hair', category: 'long', description: 'Smooth & polished' },
];

export default function HairstyleControls({
  onApplyStyle,
  isProcessing
}: HairstyleControlsProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredStyles = selectedCategory === 'all'
    ? styleSuggestions
    : styleSuggestions.filter(s => s.category === selectedCategory);

  const handleApplyStyle = async (prompt: string) => {
    await onApplyStyle(prompt);
    setCustomPrompt('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      handleApplyStyle(customPrompt.trim());
    }
  };

  const categories = [
    { id: 'all', label: 'All Styles' },
    { id: 'short', label: 'Short' },
    { id: 'medium', label: 'Medium' },
    { id: 'long', label: 'Long' },
    { id: 'trendy', label: 'Trending' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Popular Hairstyles
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Try trending cuts and classic styles
            </p>
          </div>
        </div>
      </Card>

      <div>
        <Label className="text-sm font-semibold mb-3 block">Filter by Length</Label>
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              data-testid={`filter-style-${cat.id}`}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredStyles.map((style) => (
            <Button
              key={style.name}
              variant="outline"
              onClick={() => handleApplyStyle(style.prompt)}
              disabled={isProcessing}
              className="h-auto p-3 flex flex-col items-start gap-2 hover-elevate"
              data-testid={`button-style-${style.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center gap-2 w-full">
                <Scissors className="h-4 w-4 flex-shrink-0" />
                <span className="font-semibold text-sm text-left">{style.name}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                {style.description}
              </span>
              <Badge variant="secondary" className="text-xs">
                {style.category}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <Label htmlFor="custom-style" className="text-sm font-semibold mb-3 block">
          Custom Hairstyle
        </Label>
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              id="custom-style"
              placeholder="e.g., wavy shoulder-length with bangs, messy bun..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isProcessing}
              data-testid="input-custom-hairstyle"
            />
          </div>
          <Button
            type="submit"
            disabled={isProcessing || !customPrompt.trim()}
            data-testid="button-apply-custom-style"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Describe any hairstyle you'd like to try
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Badge variant="outline" className="justify-center py-2 text-xs">
          Classic Cuts
        </Badge>
        <Badge variant="outline" className="justify-center py-2 text-xs">
          Modern Styles
        </Badge>
        <Badge variant="outline" className="justify-center py-2 text-xs">
          Trendy Looks
        </Badge>
      </div>
    </div>
  );
}
