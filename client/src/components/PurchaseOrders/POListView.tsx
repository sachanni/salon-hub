import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { POStatusBadge, type POStatus } from './POStatusBadge';
import { Trash2, Eye, Check } from 'lucide-react';

interface PO {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName?: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: POStatus;
  totalAmount: number;
  createdAt: string;
}

export function POListView({ salonId, onSelectPO }: { salonId: string; onSelectPO: (po: PO) => void }) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all');

  const { data: posData, isLoading, refetch } = useQuery({
    queryKey: statusFilter === 'all'
      ? ['/api/salons', salonId, 'purchase-orders']
      : ['/api/salons', salonId, 'purchase-orders', { status: statusFilter }],
    enabled: !!salonId,
  });

  const deletePOMutation = useMutation({
    mutationFn: async (poId: string) => {
      return apiRequest('DELETE', `/api/salons/${salonId}/purchase-orders/${poId}`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Purchase order deleted' });
      refetch();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete purchase order', variant: 'destructive' });
    },
  });

  const confirmPOMutation = useMutation({
    mutationFn: async (poId: string) => {
      return apiRequest('POST', `/api/salons/${salonId}/purchase-orders/${poId}/confirm`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Purchase order confirmed' });
      refetch();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to confirm purchase order', variant: 'destructive' });
    },
  });

  const pos = Array.isArray(posData) ? posData : [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'draft', 'confirmed', 'delivered', 'received'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
            size="sm"
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>{pos.length} orders found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pos.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <p>No purchase orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po: PO) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-sm">{po.poNumber}</TableCell>
                    <TableCell>{po.vendorName || 'Unknown'}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(po.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{(po.totalAmount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <POStatusBadge status={po.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectPO(po)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {po.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmPOMutation.mutate(po.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePOMutation.mutate(po.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
