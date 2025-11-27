import { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, CheckCircle, Calendar, MapPin, Mail, Phone, User } from 'lucide-react';
import QRCode from 'qrcode';

interface Registration {
  id: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  totalAmount: number;
  status: string;
  qrCode: string;
  event: {
    title: string;
    startDate: string;
    startTime: string;
    venueName: string;
    venueAddress: string;
  };
  tickets: Array<{
    ticketType: {
      name: string;
      price: number;
    };
    quantity: number;
  }>;
}

export default function RegistrationConfirmation() {
  const [, params] = useRoute('/events/registration/:registrationId/confirmation');
  const [, setLocation] = useLocation();
  const registrationId = params?.registrationId;
  
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (registrationId) {
      fetchRegistration();
    }
  }, [registrationId]);

  useEffect(() => {
    if (registration?.qrCode) {
      generateQRCode(registration.qrCode);
    }
  }, [registration]);

  const fetchRegistration = async () => {
    try {
      const response = await fetch(`/api/events/registrations/${registrationId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRegistration(data);
      } else {
        console.error('Failed to fetch registration');
      }
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (qrData: string) => {
    try {
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#7c3aed',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadTicket = () => {
    if (!canvasRef.current || !registration) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 1000;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#ec4899');
    gradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 150);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Event Ticket', canvas.width / 2, 60);

    // Event name
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.fillText(registration.event.title, canvas.width / 2, 220);

    // Details
    ctx.font = '20px Arial';
    ctx.fillStyle = '#4b5563';
    ctx.textAlign = 'left';
    const detailsY = 280;
    const lineHeight = 40;

    ctx.fillText(`Name: ${registration.attendeeName}`, 80, detailsY);
    ctx.fillText(`Email: ${registration.attendeeEmail}`, 80, detailsY + lineHeight);
    ctx.fillText(`Phone: ${registration.attendeePhone}`, 80, detailsY + lineHeight * 2);
    ctx.fillText(`Date: ${registration.event.startDate}`, 80, detailsY + lineHeight * 3);
    ctx.fillText(`Time: ${registration.event.startTime}`, 80, detailsY + lineHeight * 4);
    ctx.fillText(`Venue: ${registration.event.venueName || 'TBA'}`, 80, detailsY + lineHeight * 5);

    // QR Code
    if (qrCodeUrl) {
      const qrImage = new Image();
      qrImage.onload = () => {
        ctx.drawImage(qrImage, (canvas.width - 300) / 2, 550, 300, 300);
        
        // QR Code label
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#7c3aed';
        ctx.textAlign = 'center';
        ctx.fillText('Scan at Event Check-in', canvas.width / 2, 880);

        // Registration ID
        ctx.font = '14px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`Registration ID: ${registration.id.substring(0, 8).toUpperCase()}`, canvas.width / 2, 920);

        // Download
        const link = document.createElement('a');
        link.download = `ticket-${registration.id}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
      qrImage.src = qrCodeUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Registration not found</p>
          <Button onClick={() => setLocation('/events')}>Browse Events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-900 mb-2">Registration Successful!</h1>
          <p className="text-green-700">
            Your ticket has been confirmed. We've sent a confirmation email to {registration.attendeeEmail}
          </p>
        </div>

        {/* QR Code Card */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle>Your Event Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              {qrCodeUrl ? (
                <div className="bg-white p-6 rounded-lg border-4 border-purple-200 shadow-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  <p className="text-center mt-4 text-sm text-gray-600 font-medium">
                    Show this QR code at event check-in
                  </p>
                </div>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="text-center">
              <Button onClick={downloadTicket} size="lg" className="gap-2">
                <Download className="w-5 h-5" />
                Download Ticket
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{registration.event.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">{registration.event.startDate}</p>
                  <p className="text-sm text-gray-700">{registration.event.startTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Venue</p>
                  <p className="font-medium">{registration.event.venueName || 'TBA'}</p>
                  {registration.event.venueAddress && (
                    <p className="text-sm text-gray-700">{registration.event.venueAddress}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendee Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Attendee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{registration.attendeeName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{registration.attendeeEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{registration.attendeePhone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {registration.tickets.map((ticket, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{ticket.ticketType.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {ticket.quantity}</p>
                </div>
                <p className="font-semibold">₹{ticket.ticketType.price * ticket.quantity}</p>
              </div>
            ))}

            <div className="flex justify-between items-center pt-4 border-t-2 border-purple-200">
              <p className="text-lg font-bold">Total Amount</p>
              <p className="text-2xl font-bold text-purple-600">₹{registration.totalAmount}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-900">
                <strong>Registration ID:</strong> {registration.id.substring(0, 16).toUpperCase()}
              </p>
              <p className="text-sm text-blue-900 mt-1">
                <strong>Status:</strong> <span className="capitalize">{registration.status}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hidden canvas for ticket generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => setLocation('/events')} className="flex-1">
            Browse More Events
          </Button>
          <Button onClick={() => setLocation(`/events/${registration.eventId}`)} className="flex-1">
            View Event Details
          </Button>
        </div>
      </div>
    </div>
  );
}
