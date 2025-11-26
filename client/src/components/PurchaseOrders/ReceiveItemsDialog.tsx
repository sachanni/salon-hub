import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Check } from 'lucide-react';

interface ReceiveItemsDialogProps {
  salonId: string;
  poId: string;
  items: any[];
  onSuccess: () => void;
}

export function ReceiveItemsDialog({ salonId, poId, items, onSuccess }: ReceiveItemsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [received, setReceived] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
  );

  const receiveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/salons/${salonId}/purchase-orders/${poId}/receive`, {
        receivedItems: Object.entries(received).map(([itemId, qty]) => ({
          itemId: itemId,
          receivedQuantity: qty,
        })),
      });
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Items received and inventory updated' });
      setOpen(false);
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'purchase-orders'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to receive items', variant: 'destructive' });
    },
  });

  const discrepancies = items.filter((item) => received[item.id] !== item.quantity);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Check className="h-4 w-4 mr-2" />
          Receive Goods
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive Purchase Order Items</DialogTitle>
          <DialogDescription>
            Enter quantities received for each item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const discrepancy = received[item.id] !== item.quantity;
                return (
                  <TableRow key={item.id} className={discrepancy ? 'bg-yellow-50' : ''}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={received[item.id]}
                        onChange={(e) => setReceived({
                          ...received,
                          [item.id]: parseInt(e.target.value) || 0,
                        })}
                        className="w-20 text-right"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {discrepancies.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 space-y-2">
              <div className="flex items-center gap-2 text-yellow-900 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Discrepancies Detected
              </div>
              {discrepancies.map((item) => {
                const diff = item.quantity - received[item.id];
                return (
                  <div key={item.id} className="text-sm text-yellow-800">
                    {item.product_name}: {Math.abs(diff)} units {diff > 0 ? 'short' : 'extra'}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => receiveMutation.mutate()}
              disabled={receiveMutation.isPending}
            >
              {receiveMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
