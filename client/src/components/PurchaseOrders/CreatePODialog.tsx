import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface POItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export function CreatePODialog({ salonId, onSuccess }: { salonId: string; onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'basic' | 'items' | 'review'>('basic');
  const [vendorId, setVendorId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const { data: vendorsData } = useQuery({
    queryKey: ['/api/salons', salonId, 'vendors'],
    enabled: !!salonId && open,
  });

  const { data: productsData } = useQuery({
    queryKey: ['/api/salons', salonId, 'products'],
    enabled: !!salonId && open && step === 'items',
  });

  const createPOMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/salons/${salonId}/purchase-orders`, {
        vendor_id: vendorId,
        expected_delivery_date: expectedDelivery,
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice * 100,
        })),
        notes: notes || null,
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Purchase order created' });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'purchase-orders'] });
      setOpen(false);
      resetForm();
      onSuccess();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create purchase order', variant: 'destructive' });
    },
  });

  const vendors = (vendorsData as any) || [];
  const products = (productsData as any) || [];

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const resetForm = () => {
    setStep('basic');
    setVendorId('');
    setExpectedDelivery('');
    setNotes('');
    setItems([]);
    setSelectedProduct('');
    setQuantity('');
    setUnitPrice('');
  };

  const addItem = () => {
    if (!selectedProduct || !quantity || !unitPrice) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    const product = products.find((p: any) => p.id === selectedProduct);
    if (product) {
      setItems([...items, {
        productId: selectedProduct,
        productName: product.name,
        sku: product.sku,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
      }]);
      setSelectedProduct('');
      setQuantity('');
      setUnitPrice('');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'basic' && 'Basic Information'}
            {step === 'items' && 'Add Items'}
            {step === 'review' && 'Review Order'}
          </DialogTitle>
          <DialogDescription>
            {step === 'basic' && 'Select vendor and delivery date'}
            {step === 'items' && 'Add products to this order'}
            {step === 'review' && 'Review and confirm your order'}
          </DialogDescription>
        </DialogHeader>

        {step === 'basic' && (
          <div className="space-y-4">
            <div>
              <Label>Vendor *</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected Delivery Date *</Label>
              <Input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Special instructions or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={() => setStep('items')}
                disabled={!vendorId || !expectedDelivery}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 'items' && (
          <div className="space-y-4">
            <div>
              <Label>Product *</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Search and select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Qty"
                />
              </div>
              <div>
                <Label>Unit Price (₹) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="Price"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addItem} className="w-full">Add</Button>
              </div>
            </div>

            {items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Items ({items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div>{item.productName}</div>
                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>₹{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('basic')}>Back</Button>
              <Button
                onClick={() => setStep('review')}
                disabled={items.length === 0}
              >
                Review Order
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Vendor:</span>
                  <span className="font-medium">{vendors.find((v: any) => v.id === vendorId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expected Delivery:</span>
                  <span className="font-medium">{new Date(expectedDelivery).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
              </CardContent>
            </Card>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="bg-muted p-4 rounded">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('items')}>Back</Button>
              <Button
                onClick={() => createPOMutation.mutate()}
                disabled={createPOMutation.isPending}
              >
                {createPOMutation.isPending ? 'Creating...' : 'Confirm Order'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
