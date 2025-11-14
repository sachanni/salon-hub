import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import CircularScore from './CircularScore';
import ProductOverlay from './ProductOverlay';
import MakeupCustomizer, { type MakeupCustomization } from './MakeupCustomizer';
import { initializeMediaPipe, applyMakeupWithMediaPipe, type MediaPipeRenderResult } from '@/services/mediaPipeRenderer';
import { Loader2, Sparkles } from 'lucide-react';

export interface EffectOverride {
  category: string;
  enabled: boolean;
  intensity: number;
  color?: string;
  style?: string; // For eyeliner styles or lip liner option
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
  onRenderedImage?: (imageData: string) => void;
}

export default function BeforeAfterPreview({
  originalImage,
  customerAnalysis,
  products,
  confidenceScore,
  effectOverrides,
  onRenderedImage,
}: BeforeAfterPreviewProps) {
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string>('Loading AI models...');
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  
  // Makeup customization state
  const [customization, setCustomization] = useState<MakeupCustomization>({
    eyelinerStyle: 'basic',
    lipLiner: false,
  });
  
  // Check if products include eyeliner or lipstick
  const hasEyeliner = products.some(p => p.applicationArea.toLowerCase() === 'eyeliner');
  const hasLipstick = products.some(p => ['lipstick', 'lips'].includes(p.applicationArea.toLowerCase()));

  // Initialize MediaPipe Face Mesh on mount
  useEffect(() => {
    async function initMediaPipe() {
      try {
        setProcessingStatus('Initializing face detection...');
        await initializeMediaPipe();
        console.log('[BeforeAfterPreview] ✅ MediaPipe initialized');
        setIsMediaPipeReady(true);
      } catch (error) {
        console.error('[BeforeAfterPreview] Failed to initialize MediaPipe:', error);
        setIsMediaPipeReady(false);
        setIsProcessing(false);
        setEnhancedImage(originalImage);
        setFaceDetected(false);
        setProcessingStatus('');
      }
    }
    initMediaPipe();
  }, [originalImage]);

  // Generate preview only after MediaPipe is ready
  useEffect(() => {
    if (!isMediaPipeReady) {
      console.log('[BeforeAfterPreview] Waiting for MediaPipe to initialize...');
      return;
    }

    async function generateEnhancedPreview() {
      try {
        setIsProcessing(true);
        setProcessingStatus('Detecting facial features...');
        
        console.log('[BeforeAfterPreview] Generating preview with MediaPipe');
        console.log('[BeforeAfterPreview] Products:', products.length);
        
        setProcessingStatus('Applying natural makeup rendering...');
        
        // Merge customization with effectOverrides
        const customOverrides: EffectOverride[] = [];
        
        if (hasEyeliner) {
          customOverrides.push({
            category: 'eyeliner',
            enabled: true,
            intensity: 1,
            style: customization.eyelinerStyle,
          });
        }
        
        if (hasLipstick) {
          customOverrides.push({
            category: 'lipstick',
            enabled: true,
            intensity: 1,
            style: customization.lipLiner ? 'with-liner' : undefined,
          });
        }
        
        const allOverrides = [...(effectOverrides || []), ...customOverrides];
        
        const result: MediaPipeRenderResult = await applyMakeupWithMediaPipe(
          originalImage, 
          products,
          allOverrides
        );
        
        setEnhancedImage(result.imageData);
        setFaceDetected(result.faceDetected);
      } catch (error) {
        console.error('[BeforeAfterPreview] Failed to generate preview:', error);
        setEnhancedImage(originalImage);
        setFaceDetected(false);
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    }

    generateEnhancedPreview();
  }, [isMediaPipeReady, originalImage, products, effectOverrides, customization, hasEyeliner, hasLipstick]);

  // Notify parent when rendered image is ready
  useEffect(() => {
    if (enhancedImage && !isProcessing && onRenderedImage) {
      console.log('[BeforeAfterPreview] Emitting rendered image to parent');
      onRenderedImage(enhancedImage);
    }
  }, [enhancedImage, isProcessing, onRenderedImage]);

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
    <div className="space-y-4">
      {/* Makeup customization controls */}
      <MakeupCustomizer
        customization={customization}
        onCustomizationChange={setCustomization}
        hasEyeliner={hasEyeliner}
        hasLipstick={hasLipstick}
      />
      
      <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 shadow-2xl">
      {isProcessing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
            <p className="text-white font-medium">{processingStatus}</p>
            <p className="text-white/70 text-sm">Using AI face detection for natural makeup</p>
          </div>
        </div>
      )}
      
      {!faceDetected && !isProcessing && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-lg">
          <p className="text-white text-sm font-medium">⚠️ Face detection unavailable - using approximate positioning</p>
        </div>
      )}

      <div className="relative w-full h-full flex">
        <div className="relative w-1/2 h-full">
          <img
            src={originalImage}
            alt="Original"
            className="w-full h-full object-contain bg-gray-900"
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
                className="w-full h-full object-contain bg-gray-900"
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
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full bg-white/95 backdrop-blur-md rounded-2xl px-8 py-4 shadow-2xl mt-4"
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
    </div>
  );
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
