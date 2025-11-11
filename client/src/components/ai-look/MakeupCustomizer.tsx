import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';

export interface MakeupCustomization {
  eyelinerStyle: 'basic' | 'winged' | 'cat-eye' | 'classic' | 'smokey';
  lipLiner: boolean;
}

interface MakeupCustomizerProps {
  customization: MakeupCustomization;
  onCustomizationChange: (customization: MakeupCustomization) => void;
  hasEyeliner: boolean;
  hasLipstick: boolean;
}

export default function MakeupCustomizer({
  customization,
  onCustomizationChange,
  hasEyeliner,
  hasLipstick,
}: MakeupCustomizerProps) {
  if (!hasEyeliner && !hasLipstick) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2 text-purple-600 mb-2">
        <Sparkles className="w-4 h-4" />
        <h3 className="font-semibold text-sm">Customize Your Look</h3>
      </div>

      {hasEyeliner && (
        <div className="space-y-2">
          <Label htmlFor="eyeliner-style" className="text-sm font-medium text-gray-700">
            Eyeliner Style
          </Label>
          <Select
            value={customization.eyelinerStyle}
            onValueChange={(value) =>
              onCustomizationChange({
                ...customization,
                eyelinerStyle: value as MakeupCustomization['eyelinerStyle'],
              })
            }
          >
            <SelectTrigger id="eyeliner-style" className="w-full">
              <SelectValue placeholder="Select eyeliner style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic - Thin line</SelectItem>
              <SelectItem value="classic">Classic - Medium line</SelectItem>
              <SelectItem value="winged">Winged - Classic flick</SelectItem>
              <SelectItem value="cat-eye">Cat-Eye - Dramatic wing</SelectItem>
              <SelectItem value="smokey">Smokey - Smudged effect</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {hasLipstick && (
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label htmlFor="lip-liner" className="text-sm font-medium text-gray-700">
              Lip Liner
            </Label>
            <p className="text-xs text-gray-500">Add defined lip contour</p>
          </div>
          <Switch
            id="lip-liner"
            checked={customization.lipLiner}
            onCheckedChange={(checked) =>
              onCustomizationChange({
                ...customization,
                lipLiner: checked,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
