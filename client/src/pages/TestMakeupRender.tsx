import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import BeforeAfterPreview, { type EffectOverride } from '@/components/ai-look/BeforeAfterPreview';

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

export default function TestMakeupRender() {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [effectOverrides, setEffectOverrides] = useState<EffectOverride[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
                  Rendering Preview
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setSelectedImage('')}
                >
                  Change Image
                </Button>
              </div>

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
              />
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Controls (Optional)
              </h3>
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
                        : 'bg-green-100 border-green-300'
                    }
                  >
                    {effectOverrides.find(o => o.category === category && !o.enabled)
                      ? `Enable ${category}`
                      : `Disable ${category}`
                    }
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setEffectOverrides([])}
                className="mt-4 w-full"
              >
                Reset All
              </Button>
            </Card>

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>💡 Testing Tips:</strong> This page uses hardcoded product data to test MediaPipe rendering. 
                Try different photos to see how the makeup applies to various face shapes and skin tones. 
                Use the quick controls to toggle effects on/off.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
