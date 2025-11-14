import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, History, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ClientIntakeForm from '@/components/ai-look/ClientIntakeForm';
import AIAnalysisLoader from '@/components/ai-look/AIAnalysisLoader';
import LookCarousel from '@/components/ai-look/LookCarousel';
import ProductChecklist from '@/components/ai-look/ProductChecklist';
import SessionHistory from '@/components/ai-look/SessionHistory';
import HairTransformations from '@/components/ai-look/HairTransformations';
import { useToast } from '@/hooks/use-toast';

type AnalysisStep = 'intake' | 'analyzing' | 'reviewing-looks' | 'hair-transform' | 'finalizing';

interface AILookSession {
  customerName: string;
  customerPhoto: string;
  finalPhoto?: string;
  eventType?: string;
  weather?: string;
  location?: string;
  skinTone?: string;
  hairType?: string;
}

interface LookOption {
  lookName: string;
  description: string;
  confidenceScore: number;
  presetIds: string[];
  products: any[];
}

export default function AILookAdvisor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('intake');
  const [sessionData, setSessionData] = useState<AILookSession | null>(null);
  const [lookOptions, setLookOptions] = useState<LookOption[]>([]);
  const [selectedLookIndex, setSelectedLookIndex] = useState<number>(0);
  const [customerAnalysis, setCustomerAnalysis] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [makeupAppliedPhoto, setMakeupAppliedPhoto] = useState<string>('');
  
  const salonId = localStorage.getItem('selectedSalonId');
  const MIN_SUBMIT_INTERVAL = 10000;

  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  useEffect(() => {
    if (!salonId) {
      toast({
        title: 'No salon selected',
        description: 'Please select a salon from your business dashboard',
        variant: 'destructive',
      });
      navigate('/business');
    }
  }, [salonId, navigate, toast]);

  const handleIntakeComplete = async (data: AILookSession) => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTime;

    if (isSubmitting) {
      toast({
        title: 'Analysis in progress',
        description: 'Please wait for the current analysis to complete',
        variant: 'default',
      });
      return;
    }

    if (timeSinceLastSubmit < MIN_SUBMIT_INTERVAL) {
      const waitSeconds = Math.ceil((MIN_SUBMIT_INTERVAL - timeSinceLastSubmit) / 1000);
      toast({
        title: `⏳ Please wait ${waitSeconds}s`,
        description: 'This prevents AI rate limiting and ensures better service quality',
        variant: 'default',
      });
      return;
    }

    setSessionData(data);
    setCurrentStep('analyzing');
    setIsSubmitting(true);
    setLastSubmitTime(now);

    try {
      const response = await fetch('/api/premium/ai-look/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: data.customerPhoto,
          customerName: data.customerName,
          eventType: data.eventType,
          weather: data.weather,
          location: data.location,
          skinTone: data.skinTone,
          hairType: data.hairType,
          salonId,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'AI analysis failed' }));
        throw new Error(errorData.message || 'AI analysis failed');
      }

      const result = await response.json();
      setCustomerAnalysis(result.customerAnalysis);
      setLookOptions(result.looks);
      setCurrentStep('reviewing-looks');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to analyze image. Please try again.';
      
      toast({
        title: 'Analysis failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
      setCurrentStep('intake');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookSelected = (makeupPhoto: string) => {
    if (!sessionData || !lookOptions[selectedLookIndex]) return;
    
    setMakeupAppliedPhoto(makeupPhoto);
    setCurrentStep('hair-transform');
  };

  const handleRetry = () => {
    setCurrentStep('intake');
    setLookOptions([]);
    setCustomerAnalysis(null);
    setMakeupAppliedPhoto('');
  };

  const handleHairTransformComplete = async (finalPhoto: string) => {
    if (!sessionData) return;
    
    setCurrentStep('finalizing');

    try {
      const response = await fetch('/api/premium/ai-look/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId,
          customerName: sessionData.customerName,
          customerPhotoUrl: finalPhoto,
          eventType: sessionData.eventType,
          weather: sessionData.weather,
          location: sessionData.location,
          skinTone: sessionData.skinTone,
          hairType: sessionData.hairType,
          selectedLookIndex,
          looks: lookOptions.map(look => ({
            lookName: look.lookName,
            description: look.description,
            confidenceScore: look.confidenceScore,
            presetIds: look.presetIds,
            products: look.products.map(p => ({
              productId: p.product.id,
              applicationArea: p.applicationArea,
              quantityNeeded: p.quantityNeeded,
              isInStock: p.product.isInStock,
              substituteProductId: p.product.substituteProduct?.id,
            })),
          })),
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      await response.json();
      
      toast({
        title: 'Look saved! ✨',
        description: `${sessionData.customerName}'s complete transformation has been saved`,
      });

      setTimeout(() => {
        setCurrentStep('intake');
        setSessionData(null);
        setLookOptions([]);
        setSelectedLookIndex(0);
        setCustomerAnalysis(null);
        setMakeupAppliedPhoto('');
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save session. Please try again.',
        variant: 'destructive',
      });
      setCurrentStep('hair-transform');
    }
  };

  const handleBackToMakeup = () => {
    setCurrentStep('reviewing-looks');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/business')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="h-8 w-px bg-purple-200" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">AI Personal Look Advisor</h1>
                  <p className="text-xs text-gray-500">
                    {salonData?.name || 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/business/${salonId}/inventory`)}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Inventory
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Area */}
          <div className="lg:col-span-3">
            {currentStep === 'intake' && (
              <ClientIntakeForm onComplete={handleIntakeComplete} />
            )}
            
            {currentStep === 'analyzing' && (
              <AIAnalysisLoader customerName={sessionData?.customerName || ''} />
            )}
            
            {currentStep === 'reviewing-looks' && lookOptions.length > 0 && (
              <div className="space-y-6">
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-purple-100">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">
                        AI Analysis for {sessionData?.customerName}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {customerAnalysis?.skinTone && `Skin Tone: ${customerAnalysis.skinTone}`}
                      </p>
                    </div>
                    
                    {customerAnalysis?.recommendations && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">AI Insight:</span> {customerAnalysis.recommendations}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <LookCarousel
                  looks={lookOptions}
                  selectedIndex={selectedLookIndex}
                  onSelectLook={setSelectedLookIndex}
                  onRetry={handleRetry}
                  customerPhoto={sessionData?.customerPhoto || ''}
                  customerAnalysis={customerAnalysis}
                />

                <ProductChecklist
                  look={lookOptions[selectedLookIndex]}
                  salonId={salonId || ''}
                  onConfirm={handleLookSelected}
                />
              </div>
            )}
            
            {currentStep === 'hair-transform' && sessionData && customerAnalysis && (
              <HairTransformations
                originalPhoto={makeupAppliedPhoto || sessionData.customerPhoto}
                customerAnalysis={customerAnalysis}
                onComplete={handleHairTransformComplete}
                onBack={handleBackToMakeup}
              />
            )}
            
            {currentStep === 'finalizing' && (
              <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border-purple-100">
                <div className="animate-pulse">
                  <Sparkles className="h-16 w-16 mx-auto text-purple-500 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900">Saving your look...</h3>
                  <p className="text-gray-600 mt-2">Almost done!</p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Session History */}
          {showHistory && (
            <div className="lg:col-span-1">
              <SessionHistory salonId={salonId || ''} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
