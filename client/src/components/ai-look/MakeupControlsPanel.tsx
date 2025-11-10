import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Sparkles, Palette, Eye, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MakeupCategoryControl {
  category: string;
  enabled: boolean;
  intensity: number;
  icon: React.ReactNode;
  color: string;
}

interface MakeupControlsPanelProps {
  controls: MakeupCategoryControl[];
  onControlChange: (category: string, updates: Partial<MakeupCategoryControl>) => void;
  onReset: () => void;
}

export default function MakeupControlsPanel({
  controls,
  onControlChange,
  onReset,
}: MakeupControlsPanelProps) {
  return (
    <Card className="p-6 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Adjust Look</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs"
        >
          Reset to AI
        </Button>
      </div>

      <div className="space-y-5">
        {controls.map((control) => (
          <div key={control.category} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${control.color}15` }}
                >
                  {control.icon}
                </div>
                <Label
                  htmlFor={`${control.category}-switch`}
                  className="text-sm font-medium text-gray-900 capitalize"
                >
                  {control.category}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 min-w-[40px] text-right">
                  {Math.round(control.intensity * 100)}%
                </span>
                <Switch
                  id={`${control.category}-switch`}
                  checked={control.enabled}
                  onCheckedChange={(enabled) =>
                    onControlChange(control.category, { enabled })
                  }
                />
              </div>
            </div>

            {control.enabled && (
              <Slider
                value={[control.intensity * 100]}
                onValueChange={([value]) =>
                  onControlChange(control.category, { intensity: value / 100 })
                }
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Adjust intensity and toggle effects to customize the look
        </p>
      </div>
    </Card>
  );
}
