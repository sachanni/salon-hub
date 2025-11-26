import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ChevronLeft,
  Truck,
  Store,
  CreditCard,
  Wallet,
  Building2,
  MapPin,
  Check,
} from 'lucide-react';

type CartItem = {
  id: string;
  productName: string;
  quantity: number;
  totalPriceInPaisa: number;
};

type Cart = {
  id: string;
  items: CartItem[];
  subtotalInPaisa: number;
  discountInPaisa: number;
  deliveryChargeInPaisa: number;
  taxInPaisa: number;
  totalInPaisa: number;
};

type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const addressSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Checkout steps
  const [currentStep, setCurrentStep] = useState(1);
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | 'upi'>('online');

  // Form for new address
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  // Fetch cart
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['/api/cart'],
  });

  // Fetch saved addresses
  const { data: addressesData } = useQuery({
    queryKey: ['/api/addresses'],
    enabled: fulfillmentType === 'delivery',
  });

  // QueryClient auto-unwraps {success, data} response envelope
  const cart = (cartData as { cart?: Cart })?.cart;
  const savedAddresses = ((addressesData as { addresses?: SavedAddress[] })?.addresses || []);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest('POST', '/api/product-orders', orderData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Mutations don't auto-unwrap, so we parse JSON and access .data.order.id
      const orderId = data?.data?.order?.id;
      if (orderId) {
        navigate(`/orders/confirmation/${orderId}`);
      } else {
        navigate('/orders');
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Loading state
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <Button onClick={() => navigate('/')}>Start Shopping</Button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    // Validate delivery address requirement
    if (fulfillmentType === 'delivery') {
      // If using new address form, validate it
      if (showNewAddressForm) {
        const isValid = await form.trigger();
        if (!isValid) {
          toast({
            title: 'Invalid Address',
            description: 'Please fill in all required address fields correctly',
            variant: 'destructive',
          });
          return; // CRITICAL: Block submission
        }
      } 
      // If NOT using new address form, MUST have a selected address
      else if (!selectedAddressId) {
        toast({
          title: 'Address Required',
          description: savedAddresses.length === 0 
            ? 'Please add a delivery address'
            : 'Please select a delivery address',
          variant: 'destructive',
        });
        return; // CRITICAL: Block submission
      }
    }

    // Build order payload
    const orderData: any = {
      cartId: cart.id,
      fulfillmentType,
      paymentMethod,
    };

    // Add address data to order payload (delivery only)
    if (fulfillmentType === 'delivery') {
      if (showNewAddressForm) {
        // Attach new address data from form
        const formData = form.getValues();
        orderData.deliveryAddress = formData;
      } else if (selectedAddressId) {
        // Attach selected saved address ID
        orderData.addressId = selectedAddressId;
      } else {
        // CRITICAL SAFETY CHECK: This should never happen due to validation above
        console.error('Checkout validation failed: No address selected for delivery order');
        toast({
          title: 'Error',
          description: 'No delivery address selected. Please go back and select an address.',
          variant: 'destructive',
        });
        return; // CRITICAL: Block submission
      }
    }

    // All validations passed - submit order
    createOrderMutation.mutate(orderData);
  };

  const steps = [
    { id: 1, label: 'Delivery', icon: Truck },
    { id: 2, label: 'Address', icon: MapPin, show: fulfillmentType === 'delivery' },
    { id: 3, label: 'Payment', icon: CreditCard },
    { id: 4, label: 'Review', icon: Check },
  ].filter(step => step.show !== false);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b p-4 flex items-center gap-3">
        <Button
          data-testid="button-back"
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 data-testid="text-checkout-title" className="text-xl font-bold">
          Checkout
        </h1>
      </div>

      {/* Progress Stepper */}
      <div className="bg-background border-b p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-center">{step.label}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Step 1: Delivery Method */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Delivery Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RadioGroup value={fulfillmentType} onValueChange={(value: any) => setFulfillmentType(value)}>
                <Card 
                  data-testid="option-delivery"
                  className={`p-4 cursor-pointer hover-elevate ${fulfillmentType === 'delivery' ? 'border-primary' : ''}`}
                  onClick={() => setFulfillmentType('delivery')}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-5 h-5" />
                        <Label htmlFor="delivery" className="text-base font-semibold cursor-pointer">
                          Home Delivery
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Get it delivered to your doorstep
                      </p>
                      {cart.deliveryChargeInPaisa > 0 && (
                        <p className="text-sm font-medium mt-1">
                          Delivery Charge: ₹{(cart.deliveryChargeInPaisa / 100).toFixed(0)}
                        </p>
                      )}
                      {cart.deliveryChargeInPaisa === 0 && (
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                          FREE Delivery
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
                
                <Card 
                  data-testid="option-pickup"
                  className={`p-4 cursor-pointer hover-elevate ${fulfillmentType === 'pickup' ? 'border-primary' : ''}`}
                  onClick={() => setFulfillmentType('pickup')}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="w-5 h-5" />
                        <Label htmlFor="pickup" className="text-base font-semibold cursor-pointer">
                          Store Pickup
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pick up from salon location
                      </p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                        Save on delivery charges
                      </p>
                    </div>
                  </div>
                </Card>
              </RadioGroup>
              
              <Button
                data-testid="button-next-step-1"
                className="w-full"
                onClick={() => setCurrentStep(fulfillmentType === 'delivery' ? 2 : 3)}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Delivery Address (only for delivery) */}
        {currentStep === 2 && fulfillmentType === 'delivery' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Saved Addresses */}
              {!showNewAddressForm && savedAddresses.length > 0 && (
                <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
                  {savedAddresses.map((address) => (
                    <Card
                      key={address.id}
                      data-testid={`address-${address.id}`}
                      className={`p-4 cursor-pointer hover-elevate ${selectedAddressId === address.id ? 'border-primary' : ''}`}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={address.id} id={address.id} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{address.fullName}</p>
                            {address.isDefault && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Phone: {address.phone}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </RadioGroup>
              )}

              {/* New Address Form */}
              {showNewAddressForm && (
                <Form {...form}>
                  <form className="space-y-3">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-fullname" placeholder="Enter full name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" placeholder="10-digit mobile number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address1" placeholder="House/Flat no., Building name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="addressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address2" placeholder="Street, Area, Landmark" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-city" placeholder="City" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-state" placeholder="State" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-pincode" placeholder="6-digit pincode" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}

              {/* Toggle New Address */}
              {!showNewAddressForm && (
                <Button
                  data-testid="button-add-new-address"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNewAddressForm(true)}
                >
                  + Add New Address
                </Button>
              )}

              {showNewAddressForm && savedAddresses.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNewAddressForm(false)}
                >
                  Use Saved Address
                </Button>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-3">
                <Button
                  data-testid="button-back-step-2"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button
                  data-testid="button-next-step-2"
                  className="flex-1"
                  onClick={async () => {
                    if (showNewAddressForm) {
                      const isValid = await form.trigger();
                      if (!isValid) return;
                    } else if (!selectedAddressId) {
                      toast({
                        title: 'Select Address',
                        description: 'Please select a delivery address',
                        variant: 'destructive',
                      });
                      return;
                    }
                    setCurrentStep(3);
                  }}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment Method */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <Card 
                  data-testid="option-online-payment"
                  className={`p-4 cursor-pointer hover-elevate ${paymentMethod === 'online' ? 'border-primary' : ''}`}
                  onClick={() => setPaymentMethod('online')}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="online" id="online" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-5 h-5" />
                        <Label htmlFor="online" className="text-base font-semibold cursor-pointer">
                          Online Payment
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Credit/Debit Card, Net Banking, Wallets
                      </p>
                    </div>
                  </div>
                </Card>

                <Card 
                  data-testid="option-upi"
                  className={`p-4 cursor-pointer hover-elevate ${paymentMethod === 'upi' ? 'border-primary' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="upi" id="upi" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-5 h-5" />
                        <Label htmlFor="upi" className="text-base font-semibold cursor-pointer">
                          UPI
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Google Pay, PhonePe, Paytm, etc.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card 
                  data-testid="option-cod"
                  className={`p-4 cursor-pointer hover-elevate ${paymentMethod === 'cod' ? 'border-primary' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="cod" id="cod" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-5 h-5" />
                        <Label htmlFor="cod" className="text-base font-semibold cursor-pointer">
                          Cash on Delivery
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pay when you receive
                      </p>
                    </div>
                  </div>
                </Card>
              </RadioGroup>

              <div className="flex gap-3 pt-3">
                <Button
                  data-testid="button-back-step-3"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep(fulfillmentType === 'delivery' ? 2 : 1)}
                >
                  Back
                </Button>
                <Button
                  data-testid="button-next-step-3"
                  className="flex-1"
                  onClick={() => setCurrentStep(4)}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Order Review */}
        {currentStep === 4 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cart.items.length} items)</span>
                    <span>₹{(cart.subtotalInPaisa / 100).toFixed(0)}</span>
                  </div>
                  {cart.discountInPaisa > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-₹{(cart.discountInPaisa / 100).toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Delivery Charge</span>
                    <span>
                      {cart.deliveryChargeInPaisa === 0 ? (
                        <span className="text-green-600 dark:text-green-400">FREE</span>
                      ) : (
                        `₹${(cart.deliveryChargeInPaisa / 100).toFixed(0)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (GST)</span>
                    <span>₹{(cart.taxInPaisa / 100).toFixed(0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span data-testid="text-final-total">₹{(cart.totalInPaisa / 100).toFixed(0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                data-testid="button-back-step-4"
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep(3)}
              >
                Back
              </Button>
              <Button
                data-testid="button-place-order"
                className="flex-1"
                onClick={handlePlaceOrder}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
