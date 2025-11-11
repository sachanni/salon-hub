import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Sparkles, RotateCcw, Sliders, Eye, Palette, ThumbsUp } from 'lucide-react';
import BeforeAfterPreview, { type EffectOverride } from './BeforeAfterPreview';
import MakeupControlsPanel, { type MakeupCategoryControl } from './MakeupControlsPanel';
import ProductColorPicker from './ProductColorPicker';
import { getProductColor } from '@/utils/colors';

interface LookCarouselProps {
  looks: any[];
  selectedIndex: number;
  onSelectLook: (index: number) => void;
  onRetry: () => void;
  customerPhoto: string;
  customerAnalysis: {
    skinTone: string;
    facialFeatures: string;
    recommendations: string;
  };
}

export default function LookCarousel({ 
  looks, 
  selectedIndex, 
  onSelectLook, 
  onRetry,
  customerPhoto,
  customerAnalysis 
}: LookCarouselProps) {
  const currentLook = looks[selectedIndex];
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [effectOverrides, setEffectOverrides] = useState<EffectOverride[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});

  const handlePrevious = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : looks.length - 1;
    onSelectLook(newIndex);
    setEffectOverrides([]);
    setSelectedProducts({});
  };

  const handleNext = () => {
    const newIndex = selectedIndex < looks.length - 1 ? selectedIndex + 1 : 0;
    onSelectLook(newIndex);
    setEffectOverrides([]);
    setSelectedProducts({});
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 85) return 'Perfect Match';
    if (score >= 70) return 'Great Match';
    return 'Good Match';
  };

  const categoryIcons: Record<string, JSX.Element> = {
    foundation: <Sparkles className="h-4 w-4 text-amber-600" />,
    concealer: <Sparkles className="h-4 w-4 text-amber-600" />,
    lipstick: <Sparkles className="h-4 w-4 text-red-600" />,
    'lip gloss': <Sparkles className="h-4 w-4 text-pink-600" />,
    blush: <Sparkles className="h-4 w-4 text-pink-600" />,
    bronzer: <Sparkles className="h-4 w-4 text-orange-600" />,
    highlighter: <Sparkles className="h-4 w-4 text-yellow-400" />,
    eyeshadow: <Eye className="h-4 w-4 text-purple-600" />,
    eyeliner: <Eye className="h-4 w-4 text-gray-800" />,
    mascara: <Eye className="h-4 w-4 text-gray-900" />,
    'hair color': <Sparkles className="h-4 w-4 text-brown-600" />,
  };

  const makeupControls: MakeupCategoryControl[] = useMemo(() => {
    const categories = Array.from(
      new Set(
        currentLook.products
          .filter((p: any) => p.applicationArea)
          .map((p: any) => p.applicationArea.toLowerCase())
      )
    ) as string[];

    return categories.map((category: string) => {
      const override = effectOverrides.find((o) => o.category === category);
      return {
        category,
        enabled: override?.enabled ?? true,
        intensity: override?.intensity ?? 0.6,
        icon: categoryIcons[category] || <Sparkles className="h-4 w-4" />,
        color: getProductColor(category),
      };
    });
  }, [currentLook.products, effectOverrides]);

  const handleControlChange = (category: string, updates: Partial<MakeupCategoryControl>) => {
    setEffectOverrides((prev) => {
      const existing = prev.find((o) => o.category === category);
      if (existing) {
        return prev.map((o) =>
          o.category === category
            ? { ...o, ...updates }
            : o
        );
      }
      return [
        ...prev,
        {
          category,
          enabled: updates.enabled ?? true,
          intensity: updates.intensity ?? 0.6,
        },
      ];
    });
  };

  const handleReset = () => {
    setEffectOverrides([]);
    setSelectedProducts({});
  };

  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    currentLook.products
      .filter((p: any) => p.applicationArea && p.product)
      .forEach((p: any) => {
        const category = p.applicationArea.toLowerCase();
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push({
          productId: p.product.id,
          name: p.product.name,
          brand: p.product.brand,
          shade: p.product.shade,
          color: getProductColor(category, p.product.shade),
          isInStock: p.product.isInStock,
          isBestMatch: groups[category].length === 0,
        });
      });
    return groups;
  }, [currentLook.products]);

  const handleProductSelect = (category: string, productId: string) => {
    setSelectedProducts((prev) => ({ ...prev, [category]: productId }));
    
    const product = groupedProducts[category]?.find((p) => p.productId === productId);
    if (product) {
      setEffectOverrides((prev) => {
        const existing = prev.find((o) => o.category === category);
        if (existing) {
          return prev.map((o) =>
            o.category === category ? { ...o, color: product.color } : o
          );
        }
        return [...prev, { category, enabled: true, intensity: 0.6, color: product.color }];
      });
    }
  };

  return (
    <Card className="p-8 bg-white/80 backdrop-blur-sm border-purple-100">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI-Generated Looks
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {looks.length} personalized looks created • Swipe to explore
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </Button>
        </div>

        {/* Look Card */}
        <div className="relative">
          {/* Navigation Arrows */}
          {looks.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg hover:bg-gray-100"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg hover:bg-gray-100"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Main Look Content */}
          <div className="space-y-6">
            {/* Look Title & Confidence */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900">{currentLook.lookName}</h4>
                  <p className="text-gray-700 mt-2">{currentLook.description}</p>
                </div>
                <div className="text-right ml-4">
                  <Badge className={`${getConfidenceColor(currentLook.confidenceScore)} text-white`}>
                    {currentLook.confidenceScore}%
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">{getConfidenceLabel(currentLook.confidenceScore)}</p>
                </div>
              </div>
            </div>

            {/* Interactive Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  AI Preview
                </TabsTrigger>
                <TabsTrigger value="adjust" className="gap-2">
                  <Sliders className="h-4 w-4" />
                  Interactive Adjust
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4 mt-6">
                <BeforeAfterPreview
                  originalImage={customerPhoto}
                  customerAnalysis={customerAnalysis}
                  products={currentLook.products}
                  confidenceScore={currentLook.confidenceScore}
                />
              </TabsContent>

              <TabsContent value="adjust" className="space-y-6 mt-6">
                {/* Banuba-style Layout: Preview with color dots on left, Product cards on right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT: Preview with Color Dots Overlay */}
                  <div className="relative">
                    <BeforeAfterPreview
                      originalImage={customerPhoto}
                      customerAnalysis={customerAnalysis}
                      products={currentLook.products}
                      confidenceScore={currentLook.confidenceScore}
                      effectOverrides={effectOverrides}
                    />
                    
                    {/* Color Dots Overlay - Banuba Style */}
                    {Object.keys(groupedProducts).length > 0 && (
                      <div className="absolute top-4 left-4 flex flex-col gap-3 z-20">
                        {Object.entries(groupedProducts).map(([category, products]) => (
                          <div key={category} className="flex flex-col gap-2">
                            {products.slice(0, 4).map((product) => {
                              const isSelected = selectedProducts[category] === product.productId || 
                                               (!selectedProducts[category] && product.isBestMatch);
                              return (
                                <button
                                  key={product.productId}
                                  onClick={() => handleProductSelect(category, product.productId)}
                                  className={`
                                    relative w-12 h-12 rounded-full border-3 transition-all shadow-lg cursor-pointer
                                    hover:shadow-xl active:scale-95
                                    ${isSelected ? 'border-white scale-110 ring-4 ring-white/50' : 'border-white/70 hover:scale-105'}
                                  `}
                                  style={{ backgroundColor: product.color }}
                                  title={`${product.brand} ${product.name} - Click to select`}
                                  type="button"
                                >
                                  {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Product Cards - Banuba Style */}
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
                    {Object.keys(groupedProducts).length === 0 ? (
                      <Card className="p-12 text-center bg-gray-50">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 font-medium">Generating product recommendations...</p>
                        <p className="text-sm text-gray-500 mt-2">Virtual try-on will appear shortly</p>
                      </Card>
                    ) : (
                      Object.entries(groupedProducts).map(([category, products]) => {
                        const selectedId = selectedProducts[category] || products.find(p => p.isBestMatch)?.productId || products[0]?.productId;
                        const selectedProduct = products.find(p => p.productId === selectedId);
                        
                        if (!selectedProduct) return null;
                        
                        return (
                          <Card key={category} className="p-6 bg-white shadow-xl border-2 border-gray-100">
                            <div className="flex items-start gap-6">
                              {/* Product Image Placeholder */}
                              <div className="relative w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg">
                                <div 
                                  className="w-20 h-20 rounded-lg shadow-md"
                                  style={{ backgroundColor: selectedProduct.color }}
                                />
                                {selectedProduct.isBestMatch && (
                                  <div className="absolute -top-2 -right-2">
                                    <Badge className="bg-green-600 text-white gap-1 shadow-lg">
                                      <ThumbsUp className="h-3 w-3" />
                                      Best match
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              
                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{category}</p>
                                <h4 className="text-lg font-bold text-gray-900 mb-1">
                                  {selectedProduct.brand}
                                </h4>
                                <p className="text-sm text-gray-700 mb-2">
                                  {selectedProduct.name}
                                </p>
                                {selectedProduct.shade && (
                                  <p className="text-xs text-gray-600 mb-3">
                                    Shade: <span className="font-medium">{selectedProduct.shade}</span>
                                  </p>
                                )}
                                <Badge variant={selectedProduct.isInStock ? "default" : "secondary"} className="text-xs">
                                  {selectedProduct.isInStock ? '✓ In Stock' : 'Out of Stock'}
                                </Badge>
                                
                                {/* All shades for this category */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-xs text-gray-600 mb-2">Other shades:</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {products.map((product) => (
                                      <button
                                        key={product.productId}
                                        onClick={() => handleProductSelect(category, product.productId)}
                                        className={`
                                          w-10 h-10 rounded-lg border-2 transition-all
                                          ${product.productId === selectedId ? 'border-purple-600 scale-110' : 'border-gray-300 hover:scale-105'}
                                        `}
                                        style={{ backgroundColor: product.color }}
                                        title={product.name}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
                
                {/* Makeup Controls Panel - Full Width Below */}
                <MakeupControlsPanel
                  controls={makeupControls}
                  onControlChange={handleControlChange}
                  onReset={handleReset}
                />
              </TabsContent>
            </Tabs>

            {/* AI Insight */}
            {currentLook.confidenceScore >= 85 && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-sm text-green-800 text-center">
                  ✨ <span className="font-medium">AI Recommendation:</span> This look perfectly complements the customer's features and event type!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Look Indicators */}
        {looks.length > 1 && (
          <div className="flex justify-center gap-2">
            {looks.map((_, index) => (
              <button
                key={index}
                onClick={() => onSelectLook(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
