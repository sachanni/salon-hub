import { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Camera, CheckCircle, XCircle, User, Mail, Phone, Ticket } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import jsQR from 'jsqr';
import { ExportAttendees } from '@/components/events/ExportAttendees';

interface CheckInResult {
  success: boolean;
  message: string;
  registration?: {
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string;
    status: string;
    tickets: Array<{
      ticketType: {
        name: string;
      };
      quantity: number;
    }>;
  };
}

export default function EventCheckIn() {
  const [, params] = useRoute('/business/events/:eventId/check-in');
  const eventId = params?.eventId;

  const [scanning, setScanning] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        setCheckInResult(null);
        requestAnimationFrame(scanQRCode);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current || processing) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      handleQRCodeDetected(code.data);
    } else {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleQRCodeDetected = async (qrData: string) => {
    setProcessing(true);
    stopScanning();

    try {
      // Parse QR code data (format: "eventId:registrationId")
      const [scannedEventId, registrationId] = qrData.split(':');
      
      if (scannedEventId !== eventId) {
        setCheckInResult({
          success: false,
          message: 'This ticket is for a different event'
        });
        return;
      }

      // Call check-in API
      const response = await fetch(`/api/events/business/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrCode: qrData }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setCheckInResult({
          success: true,
          message: 'Check-in successful!',
          registration: result.registration
        });
      } else {
        setCheckInResult({
          success: false,
          message: result.message || 'Check-in failed'
        });
      }
    } catch (error) {
      console.error('Error processing check-in:', error);
      setCheckInResult({
        success: false,
        message: 'Error processing check-in'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualEntry = () => {
    const qrCode = prompt('Enter QR Code or Registration ID:');
    if (qrCode) {
      handleQRCodeDetected(`${eventId}:${qrCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Check-In</h1>
            <p className="text-gray-600">Scan attendee QR codes to check them in</p>
          </div>
          {eventId && (
            <ExportAttendees eventId={eventId} variant="outline" size="default" />
          )}
        </div>

        {/* Scanner Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View */}
            {scanning && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg border-4 border-purple-200"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-purple-600 rounded-lg w-64 h-64 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-600 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-600 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-600 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-600 rounded-br-lg" />
                  </div>
                </div>

                {processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="bg-white rounded-lg p-6 flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                      <span className="font-medium">Processing...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {!scanning ? (
                <>
                  <Button onClick={startScanning} className="flex-1 gap-2">
                    <Camera className="w-5 h-5" />
                    Start Scanning
                  </Button>
                  <Button onClick={handleManualEntry} variant="outline" className="flex-1">
                    Manual Entry
                  </Button>
                </>
              ) : (
                <Button onClick={stopScanning} variant="destructive" className="w-full">
                  Stop Scanning
                </Button>
              )}
            </div>

            {/* Instructions */}
            {!scanning && !checkInResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>How to use:</strong> Click "Start Scanning" and point the camera at the attendee's QR code ticket. 
                  The check-in will happen automatically when the code is detected.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-In Result */}
        {checkInResult && (
          <Card className={`border-2 ${
            checkInResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                {checkInResult.success ? (
                  <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${
                    checkInResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {checkInResult.success ? 'Check-In Successful!' : 'Check-In Failed'}
                  </h3>
                  <p className={checkInResult.success ? 'text-green-800' : 'text-red-800'}>
                    {checkInResult.message}
                  </p>
                </div>
              </div>

              {/* Attendee Details */}
              {checkInResult.success && checkInResult.registration && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900">Attendee Details</h4>
                  
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{checkInResult.registration.attendeeName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{checkInResult.registration.attendeeEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{checkInResult.registration.attendeePhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tickets</p>
                      {checkInResult.registration.tickets.map((ticket, index) => (
                        <p key={index} className="font-medium">
                          {ticket.ticketType.name} × {ticket.quantity}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Scan Another Button */}
              <Button
                onClick={() => {
                  setCheckInResult(null);
                  startScanning();
                }}
                className="w-full mt-4"
              >
                Scan Next Attendee
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
