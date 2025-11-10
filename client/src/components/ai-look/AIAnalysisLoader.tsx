import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Brain, Palette, Star } from 'lucide-react';

interface AIAnalysisLoaderProps {
  customerName: string;
}

const analysisSteps = [
  { icon: Brain, label: 'Analyzing facial features...', duration: 2000 },
  { icon: Palette, label: 'Detecting skin tone & undertones...', duration: 2000 },
  { icon: Star, label: 'Generating personalized looks...', duration: 2500 },
  { icon: Sparkles, label: 'Matching products from inventory...', duration: 2000 },
];

export default function AIAnalysisLoader({ customerName }: AIAnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = analysisSteps.reduce((sum, step) => sum + step.duration, 0);
    const stepDurations = analysisSteps.map(step => step.duration);
    
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      setProgress((elapsed / totalDuration) * 100);
      
      let accumulatedDuration = 0;
      for (let i = 0; i < stepDurations.length; i++) {
        accumulatedDuration += stepDurations[i];
        if (elapsed < accumulatedDuration) {
          setCurrentStep(i);
          break;
        }
      }
      
      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-12 bg-white/80 backdrop-blur-sm border-purple-100">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <Sparkles className="relative h-16 w-16 text-purple-500 animate-bounce" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">
            AI Beauty Analysis in Progress
          </h2>
          <p className="text-gray-600 mt-2">
            Creating personalized looks for {customerName}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">{Math.round(progress)}% complete</p>
        </div>

        {/* Analysis Steps */}
        <div className="space-y-4">
          {analysisSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-purple-50 border-2 border-purple-200 scale-105'
                    : isCompleted
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200 opacity-50'
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse'
                      : isCompleted
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                >
                  <StepIcon className="h-5 w-5 text-white" />
                </div>
                <p
                  className={`flex-1 font-medium ${
                    isActive
                      ? 'text-gray-900'
                      : isCompleted
                      ? 'text-green-700'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
                {isCompleted && (
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
          <p className="text-sm text-gray-700 text-center">
            <span className="font-medium">✨ AI Tip:</span> Our AI analyzes 50+ facial features and matches from 60+ premium beauty products to create your perfect look
          </p>
        </div>
      </div>
    </Card>
  );
}
