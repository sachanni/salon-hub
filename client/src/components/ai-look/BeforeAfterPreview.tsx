import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import CircularScore from './CircularScore';
import ProductOverlay from './ProductOverlay';
import { applyMakeupEffects, getProductColor, type MakeupEffect } from '@/utils/imageEffects';
import { Loader2, Sparkles } from 'lucide-react';

export interface EffectOverride {
  category: string;
  enabled: boolean;
  intensity: number;
  color?: string;
}

interface BeforeAfterPreviewProps {
  originalImage: string;
  customerAnalysis: {
    skinTone: string;
    facialFeatures: string;
    recommendations: string;
  };
  products: Array<{
    applicationArea: string;
    attributes: {
      shade?: string;
      finish?: string;
      type?: string;
    };
    product?: {
      name: string;
      brand: string;
      imageUrl?: string;
    };
    reason: string;
  }>;
  confidenceScore: number;
  effectOverrides?: EffectOverride[];
}

export default function BeforeAfterPreview({
  originalImage,
  customerAnalysis,
  products,
  confidenceScore,
  effectOverrides,
}: BeforeAfterPreviewProps) {
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    async function generateEnhancedPreview() {
      try {
        setIsProcessing(true);
        
        console.log('[BeforeAfterPreview] Generating preview with overrides:', effectOverrides);
        
        const effects: MakeupEffect[] = products.slice(0, 10).map(p => {
          const categoryLower = p.applicationArea.toLowerCase();
          const override = effectOverrides?.find(o => o.category.toLowerCase() === categoryLower);
          
          console.log(`[BeforeAfterPreview] Product: ${p.applicationArea}, Override:`, override);
          
          if (override && !override.enabled) {
            console.log(`[BeforeAfterPreview] Skipping ${p.applicationArea} - disabled`);
            return null;
          }
          
          const defaultIntensity = getCategoryDefaultIntensity(p.applicationArea);
          const effect = {
            type: mapCategoryToEffectType(p.applicationArea),
            color: override?.color || getProductColor(p.applicationArea, p.attributes.shade),
            intensity: override?.intensity !== undefined ? override.intensity : defaultIntensity,
          };
          
          console.log(`[BeforeAfterPreview] Creating effect for ${p.applicationArea}:`, effect);
          return effect;
        }).filter((e): e is MakeupEffect => e !== null);

        console.log('[BeforeAfterPreview] Final effects array:', effects);
        const enhanced = await applyMakeupEffects(originalImage, effects);
        setEnhancedImage(enhanced);
      } catch (error) {
        console.error('Failed to generate preview:', error);
        setEnhancedImage(originalImage);
      } finally {
        setIsProcessing(false);
      }
    }

    generateEnhancedPreview();
  }, [originalImage, products, effectOverrides]);

  const scores = useMemo(() => {
    const skinToneScore = calculateSkinToneScore(customerAnalysis.skinTone);
    const shapeScore = calculateShapeScore(customerAnalysis.facialFeatures);
    const undertoneScore = calculateUndertoneScore(customerAnalysis.skinTone);
    const colorTypeScore = confidenceScore;

    return {
      skin: skinToneScore,
      shape: shapeScore,
      undertone: undertoneScore,
      colorType: colorTypeScore,
    };
  }, [customerAnalysis, confidenceScore]);

  const topProducts = products.slice(0, 4);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 shadow-2xl">
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
            <p className="text-white font-medium">Applying AI recommendations...</p>
          </div>
        </div>
      )}

      <div className="relative w-full h-full flex">
        <div className="relative w-1/2 h-full">
          <img
            src={originalImage}
            alt="Original"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full">
            <span className="text-sm font-medium text-gray-900">Before</span>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-1 h-full bg-white shadow-lg"></div>
        </div>

        <div className="relative w-1/2 h-full">
          {enhancedImage && (
            <>
              <img
                src={enhancedImage}
                alt="Enhanced"
                className="w-full h-full object-cover"
              />

              {topProducts[0] && (
                <ProductOverlay
                  icon={<Sparkles className="h-6 w-6" />}
                  label={topProducts[0].applicationArea}
                  position="top-right"
                  isBestMatch={true}
                  productImage={topProducts[0].product?.imageUrl}
                  delay={200}
                />
              )}

              {topProducts[1] && (
                <ProductOverlay
                  icon={<Sparkles className="h-6 w-6" />}
                  label={topProducts[1].applicationArea}
                  position="bottom-right"
                  productImage={topProducts[1].product?.imageUrl}
                  delay={400}
                />
              )}

              {topProducts[2] && (
                <ProductOverlay
                  icon={<Sparkles className="h-6 w-6" />}
                  label={topProducts[2].applicationArea}
                  position="top-left"
                  productImage={topProducts[2].product?.imageUrl}
                  delay={600}
                />
              )}

              {topProducts[3] && (
                <ProductOverlay
                  icon={<Sparkles className="h-6 w-6" />}
                  label={topProducts[3].applicationArea}
                  position="bottom-left"
                  productImage={topProducts[3].product?.imageUrl}
                  delay={800}
                />
              )}

              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full">
                <span className="text-sm font-medium text-gray-900">After</span>
              </div>
            </>
          )}
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-2xl px-8 py-4 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="text-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900">AI recommendations based on:</h3>
        </div>
        <div className="flex items-center gap-6">
          <CircularScore label="Skin" score={Math.round(scores.skin)} size={60} strokeWidth={5} delay={1200} />
          <CircularScore label="Shape" score={Math.round(scores.shape)} size={60} strokeWidth={5} delay={1300} />
          <CircularScore label="Undertone" score={Math.round(scores.undertone)} size={60} strokeWidth={5} delay={1400} />
          <CircularScore label="Color type" score={Math.round(scores.colorType)} size={60} strokeWidth={5} delay={1500} />
        </div>
      </motion.div>
    </div>
  );
}

function getCategoryDefaultIntensity(category: string): number {
  const categoryLower = category.toLowerCase();
  
  // Eyes - DRAMATIC for visibility
  if (categoryLower.includes('eyeshadow')) return 0.85;
  if (categoryLower.includes('eyeliner')) return 0.95;
  if (categoryLower.includes('mascara')) return 0.9;
  
  // Face color - STRONG for contouring/highlighting
  if (categoryLower.includes('highlighter')) return 0.8;
  if (categoryLower.includes('bronzer')) return 0.6;
  if (categoryLower.includes('blush')) return 0.7;
  
  // Lips - BOLD color
  if (categoryLower.includes('lip')) return 0.8;
  
  // Face base - Natural but visible
  if (categoryLower.includes('foundation')) return 0.5;
  if (categoryLower.includes('concealer')) return 0.5;
  if (categoryLower.includes('powder')) return 0.4;
  
  // Hair - Subtle tint
  if (categoryLower.includes('hair')) return 0.6;
  
  // Default
  return 0.6;
}

function mapCategoryToEffectType(category: string): MakeupEffect['type'] {
  const categoryLower = category.toLowerCase();
  
  // Lips
  if (categoryLower.includes('lip')) return 'lipstick';
  
  // Face base
  if (categoryLower.includes('foundation')) return 'foundation';
  if (categoryLower.includes('concealer')) return 'concealer';
  if (categoryLower.includes('powder')) return 'powder';
  
  // Face color
  if (categoryLower.includes('blush')) return 'blush';
  if (categoryLower.includes('bronzer')) return 'bronzer';
  if (categoryLower.includes('highlighter')) return 'highlighter';
  
  // Eyes
  if (categoryLower.includes('eyeshadow')) return 'eyeshadow';
  if (categoryLower.includes('eyeliner')) return 'eyeliner';
  if (categoryLower.includes('mascara')) return 'mascara';
  
  // Hair
  if (categoryLower.includes('hair')) return 'hair';
  
  // Default fallback
  console.warn(`[mapCategoryToEffectType] Unknown category: ${category}, defaulting to foundation`);
  return 'foundation';
}

function calculateSkinToneScore(skinTone: string): number {
  const skinToneLower = skinTone.toLowerCase();
  if (skinToneLower.includes('fair') || skinToneLower.includes('light')) return 92;
  if (skinToneLower.includes('medium') || skinToneLower.includes('olive')) return 88;
  if (skinToneLower.includes('tan') || skinToneLower.includes('dark')) return 85;
  if (skinToneLower.includes('deep')) return 90;
  return 85;
}

function calculateShapeScore(facialFeatures: string): number {
  const featuresLower = facialFeatures.toLowerCase();
  if (featuresLower.includes('oval') || featuresLower.includes('balanced')) return 95;
  if (featuresLower.includes('heart') || featuresLower.includes('diamond')) return 90;
  if (featuresLower.includes('round') || featuresLower.includes('square')) return 85;
  if (featuresLower.includes('oblong')) return 88;
  return 87;
}

function calculateUndertoneScore(skinTone: string): number {
  const skinToneLower = skinTone.toLowerCase();
  if (skinToneLower.includes('warm') || skinToneLower.includes('golden')) return 91;
  if (skinToneLower.includes('cool') || skinToneLower.includes('pink')) return 89;
  if (skinToneLower.includes('neutral')) return 93;
  return 85;
}
