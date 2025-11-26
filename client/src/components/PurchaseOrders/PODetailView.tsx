import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { POStatusBadge } from './POStatusBadge';
import { ArrowLeft } from 'lucide-react';
import { ReceiveItemsDialog } from './ReceiveItemsDialog';

interface PO {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName?: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: string;
  totalAmount: number;
}

export function PODetailView({ salonId, po, onBack }: { salonId: string; po: PO; onBack: () => void }) {
  const { toast } = useToast();

  const { data: detailData, refetch } = useQuery({
    queryKey: ['/api/salons', salonId, 'purchase-orders', po.id],
    enabled: !!salonId && !!po.id,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/salons/${salonId}/purchase-orders/${po.id}/confirm`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'PO confirmed' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'purchase-orders'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to confirm', variant: 'destructive' });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/salons/${salonId}/purchase-orders/${po.id}/deliver`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'PO marked as delivered' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'purchase-orders'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to mark as delivered', variant: 'destructive' });
    },
  });

  const detail = (detailData as any) || po;
  const items = (detailData as any)?.items || [];

  const subtotal = items.reduce((sum: number, item: any) => 
    sum + (item.totalCostInPaisa / 100), 0
  );
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack} className="flex gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to List
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              PO #{detail.poNumber}
              <POStatusBadge status={detail.status} />
            </CardTitle>
            <CardDescription>{detail.vendorName || 'Unknown Vendor'}</CardDescription>
          </div>
          {detail.status === 'draft' && (
            <Button onClick={() => confirmMutation.mutate()}>
              Confirm Order
            </Button>
          )}
          {detail.status === 'confirmed' && (
            <Button onClick={() => deliverMutation.mutate()}>
              Mark as Delivered
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Order Date</span>
              <p className="font-medium">{new Date(detail.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Expected Delivery</span>
              <p className="font-medium">{new Date(detail.expectedDeliveryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <p className="font-medium">₹{total.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {detail.status === 'delivered' && <TableHead className="text-right">Received</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">₹{(item.unitCostInPaisa / 100).toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{(item.totalCostInPaisa / 100).toFixed(2)}</TableCell>
                  {detail.status === 'delivered' && (
                    <TableCell className="text-right">{item.quantity_received || 0}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-end gap-32">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-32">
              <span>Tax (18%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-32 text-lg font-bold">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {detail.status === 'delivered' && (
        <ReceiveItemsDialog salonId={salonId} poId={po.id} items={items} onSuccess={refetch} />
      )}
    </div>
  );
}
