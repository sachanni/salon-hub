import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, X, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebcamCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onCancel: () => void;
}

export default function WebcamCapture({ onCapture, onCancel }: WebcamCaptureProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const initializeCamera = async () => {
    try {
      setIsInitializing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsInitializing(false);
    } catch (error: any) {
      setIsInitializing(false);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to capture photos. Check your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      stopCamera();
      onCapture(capturedPhoto);
    }
  };

  const toggleCamera = () => {
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-purple-100">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Capture Customer Photo</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
          {capturedPhoto ? (
            <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Camera Guidelines Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-4 border-white/30 m-8 rounded-full">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8">
                    <div className="bg-purple-500/90 text-white px-3 py-1 rounded-full text-xs">
                      Position face in center
                    </div>
                  </div>
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Tips */}
        <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700">
          <p className="font-medium mb-1">📸 Tips for best results:</p>
          <ul className="space-y-1 text-xs">
            <li>• Ensure good lighting (natural light is best)</li>
            <li>• Face the camera directly</li>
            <li>• Remove glasses if possible</li>
            <li>• Keep a neutral expression</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {capturedPhoto ? (
            <>
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
              >
                <Camera className="h-4 w-4" />
                Use This Photo
              </Button>
            </>
          ) : (
            <>
              {/* Toggle camera for mobile */}
              <Button
                variant="outline"
                onClick={toggleCamera}
                className="gap-2"
                title="Switch camera"
              >
                <Smartphone className="h-4 w-4" />
                Flip
              </Button>
              
              <Button
                onClick={handleCapture}
                disabled={isInitializing}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
