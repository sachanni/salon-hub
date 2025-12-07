import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Gift,
  Check,
  Loader2,
  Mail,
  Phone,
  User,
  MessageSquare,
  CreditCard,
  Store,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface GiftCardTemplate {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  themeColor: string | null;
  minValuePaisa: number;
  maxValuePaisa: number;
  suggestedAmountsPaisa: number[] | null;
  validityDays: number;
  isActive: number;
}

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  imageUrl?: string;
}

type PurchaseStep = 'select' | 'customize' | 'recipient' | 'payment';

export default function GiftCardsPage() {
  const { salonId } = useParams<{ salonId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const [currentStep, setCurrentStep] = useState<PurchaseStep>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<GiftCardTemplate | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState<Date | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: salon, isLoading: salonLoading } = useQuery<Salon>({
    queryKey: [`/api/salons/${salonId}`],
    enabled: !!salonId,
  });

  const { data: templatesData, isLoading: templatesLoading } = useQuery<{ templates: GiftCardTemplate[] }>({
    queryKey: [`/api/gift-cards/templates/${salonId}`],
    enabled: !!salonId,
  });

  const templates = templatesData?.templates || [];

  const formatAmount = (paisa: number) => `₹${(paisa / 100).toLocaleString('en-IN')}`;

  const handleTemplateSelect = (template: GiftCardTemplate) => {
    setSelectedTemplate(template);
    const defaultAmount = template.suggestedAmountsPaisa?.[0] || template.minValuePaisa;
    setCustomAmount(defaultAmount);
    setCurrentStep('customize');
  };

  const handleAmountSelect = (amount: number) => {
    setCustomAmount(amount);
  };

  const isAmountValid = () => {
    if (!selectedTemplate) return false;
    return customAmount >= selectedTemplate.minValuePaisa && customAmount <= selectedTemplate.maxValuePaisa;
  };

  const handleProceedToRecipient = () => {
    if (!isAmountValid()) {
      toast({
        title: 'Invalid Amount',
        description: `Please select an amount between ${formatAmount(selectedTemplate!.minValuePaisa)} and ${formatAmount(selectedTemplate!.maxValuePaisa)}`,
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep('recipient');
  };

  const handleProceedToPayment = () => {
    if (!recipientName.trim()) {
      toast({
        title: 'Recipient Required',
        description: 'Please enter the recipient\'s name',
        variant: 'destructive',
      });
      return;
    }
    if (!recipientEmail.trim() && !recipientPhone.trim()) {
      toast({
        title: 'Contact Required',
        description: 'Please enter at least an email or phone for delivery',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep('payment');
  };

  const handlePurchase = async () => {
    if (!selectedTemplate || !salonId) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/gift-cards/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          salonId,
          valuePaisa: customAmount,
          templateId: selectedTemplate.id,
          recipientName,
          recipientEmail: recipientEmail || undefined,
          recipientPhone: recipientPhone || undefined,
          personalMessage: personalMessage || undefined,
          deliveryMethod: recipientEmail ? 'email' : 'sms',
          scheduledDeliveryAt: scheduledDeliveryDate ? scheduledDeliveryDate.toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const { orderId, giftCardId, keyId, amount } = await response.json();

      const options = {
        key: keyId,
        amount,
        currency: 'INR',
        name: salon?.name || 'Gift Card',
        description: `Gift Card - ${formatAmount(customAmount)}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/gift-cards/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                giftCardId,
                purchasedBy: user?.id,
              }),
            });

            if (verifyRes.ok) {
              const result = await verifyRes.json();
              toast({
                title: 'Gift Card Purchased!',
                description: `Your gift card (${result.giftCard?.code}) has been sent to ${recipientEmail || recipientPhone}`,
              });
              setLocation('/wallet');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast({
              title: 'Payment Error',
              description: 'Payment verification failed. Please contact support.',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#9333ea',
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function (response: any) {
        toast({
          title: 'Payment Failed',
          description: response.error.description,
          variant: 'destructive',
        });
      });
    } catch (error: any) {
      console.error('Error creating gift card order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process purchase',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'customize':
        setCurrentStep('select');
        setSelectedTemplate(null);
        break;
      case 'recipient':
        setCurrentStep('customize');
        break;
      case 'payment':
        setCurrentStep('recipient');
        break;
      default:
        setLocation(`/salon/${salonId}`);
    }
  };

  if (salonLoading || templatesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={goBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
            <Gift className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gift Cards</h1>
          <p className="text-gray-600">
            {salon?.name ? `Purchase a gift card for ${salon.name}` : 'Give the gift of beauty'}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {(['select', 'customize', 'recipient', 'payment'] as PurchaseStep[]).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step
                      ? 'bg-purple-600 text-white'
                      : index < ['select', 'customize', 'recipient', 'payment'].indexOf(currentStep)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < ['select', 'customize', 'recipient', 'payment'].indexOf(currentStep) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={`w-12 h-1 mx-1 ${
                      index < ['select', 'customize', 'recipient', 'payment'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 'select' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose a Design</h2>
            {templates.length === 0 ? (
              <Card className="p-8 text-center">
                <Gift className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No gift card designs available for this salon yet.</p>
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/salon/${salonId}`)}
                  className="mt-4"
                >
                  Back to Salon
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-300"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {template.imageUrl ? (
                      <div
                        className="h-40 bg-cover bg-center rounded-t-lg"
                        style={{ backgroundImage: `url(${template.imageUrl})` }}
                      />
                    ) : (
                      <div
                        className="h-40 rounded-t-lg flex items-center justify-center"
                        style={{ backgroundColor: template.themeColor || '#9333ea' }}
                      >
                        <Gift className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {formatAmount(template.minValuePaisa)} - {formatAmount(template.maxValuePaisa)}
                        </span>
                        <span className="text-purple-600 font-medium">
                          Valid for {template.validityDays} days
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'customize' && selectedTemplate && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Select Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate.suggestedAmountsPaisa && selectedTemplate.suggestedAmountsPaisa.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedTemplate.suggestedAmountsPaisa.map((amount) => (
                      <Button
                        key={amount}
                        variant={customAmount === amount ? 'default' : 'outline'}
                        className={customAmount === amount ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        onClick={() => handleAmountSelect(amount)}
                      >
                        {formatAmount(amount)}
                      </Button>
                    ))}
                  </div>
                )}

                <Separator />

                <div>
                  <Label htmlFor="customAmount">Custom Amount</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-semibold text-gray-700">₹</span>
                    <Input
                      id="customAmount"
                      type="number"
                      value={customAmount / 100}
                      onChange={(e) => setCustomAmount(Math.round(parseFloat(e.target.value || '0') * 100))}
                      min={selectedTemplate.minValuePaisa / 100}
                      max={selectedTemplate.maxValuePaisa / 100}
                      className="text-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Min: {formatAmount(selectedTemplate.minValuePaisa)} | Max: {formatAmount(selectedTemplate.maxValuePaisa)}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Gift Card Value</span>
                    <span className="text-2xl font-bold text-purple-600">{formatAmount(customAmount)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Valid for {selectedTemplate.validityDays} days from purchase
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleProceedToRecipient}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={!isAmountValid()}
            >
              Continue to Recipient Details
            </Button>
          </div>
        )}

        {currentStep === 'recipient' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Recipient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipientName">Recipient's Name *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Enter recipient's name"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipientEmail">Email (for delivery)</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="recipient@email.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipientPhone">Phone (for SMS delivery)</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="recipientPhone"
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Enter email or phone for gift card delivery</p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                  <div className="relative mt-1">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      id="personalMessage"
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder="Add a personal message for the recipient..."
                      className="pl-10 min-h-[100px]"
                      maxLength={500}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{personalMessage.length}/500 characters</p>
                </div>

                <Separator />

                <div>
                  <Label>Schedule Delivery (Optional)</Label>
                  <p className="text-sm text-gray-500 mb-2">Choose a future date to deliver this gift card</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !scheduledDeliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {scheduledDeliveryDate ? (
                          format(scheduledDeliveryDate, "PPP")
                        ) : (
                          "Send immediately after purchase"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={scheduledDeliveryDate}
                        onSelect={setScheduledDeliveryDate}
                        disabled={(date) => date < new Date() || date > addDays(new Date(), 365)}
                        initialFocus
                      />
                      {scheduledDeliveryDate && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setScheduledDeliveryDate(undefined)}
                          >
                            Clear date (send immediately)
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleProceedToPayment}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {currentStep === 'payment' && selectedTemplate && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {selectedTemplate.imageUrl ? (
                    <img
                      src={selectedTemplate.imageUrl}
                      alt={selectedTemplate.name}
                      className="w-24 h-16 object-cover rounded"
                    />
                  ) : (
                    <div
                      className="w-24 h-16 rounded flex items-center justify-center"
                      style={{ backgroundColor: selectedTemplate.themeColor || '#9333ea' }}
                    >
                      <Gift className="w-8 h-8 text-white opacity-50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-500">{salon?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-purple-600">{formatAmount(customAmount)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recipient</span>
                    <span className="font-medium">{recipientName}</span>
                  </div>
                  {recipientEmail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Email</span>
                      <span className="font-medium">{recipientEmail}</span>
                    </div>
                  )}
                  {recipientPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Phone</span>
                      <span className="font-medium">{recipientPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Validity</span>
                    <span className="font-medium">{selectedTemplate.validityDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-medium">
                      {scheduledDeliveryDate 
                        ? format(scheduledDeliveryDate, "PPP")
                        : "Immediately after purchase"}
                    </span>
                  </div>
                </div>

                {personalMessage && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Personal Message:</p>
                      <p className="text-sm italic bg-gray-50 p-3 rounded">"{personalMessage}"</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-purple-600">{formatAmount(customAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Secure Payment</p>
                  <p className="text-sm text-green-700">
                    Your payment is secured by Razorpay. 
                    {scheduledDeliveryDate 
                      ? ` The gift card will be delivered on ${format(scheduledDeliveryDate, "PPP")}.`
                      : ' The gift card will be delivered immediately after payment.'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatAmount(customAmount)}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
