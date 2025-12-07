import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Shield,
  ArrowLeft,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  MapPin,
  Store,
  CreditCard,
  Info,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";

interface DepositTransaction {
  id: string;
  salonId: string;
  salonName: string | null;
  salonImageUrl: string | null;
  bookingId: string;
  transactionType: string;
  amountPaisa: number;
  currency: string;
  serviceAmountPaisa: number;
  depositPercentage: number;
  status: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  bookingDate: string | null;
  bookingTime: string | null;
  serviceName: string | null;
}

interface DepositStats {
  totalDeposits: number;
  totalRefunded: number;
  totalForfeited: number;
  activeDeposits: number;
}

interface DepositHistoryResponse {
  transactions: DepositTransaction[];
  stats: DepositStats;
  count: number;
}

export default function DepositHistory() {
  const [, setLocation] = useLocation();
  const [selectedTransaction, setSelectedTransaction] = useState<DepositTransaction | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading, error } = useQuery<DepositHistoryResponse>({
    queryKey: ['/api/deposits/my-deposits'],
    retry: false,
  });

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case 'deposit_collected':
        return {
          label: 'Deposit Paid',
          icon: ArrowUpRight,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          badgeVariant: 'default' as const,
        };
      case 'deposit_refunded':
        return {
          label: 'Refunded',
          icon: ArrowDownLeft,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          badgeVariant: 'outline' as const,
        };
      case 'deposit_forfeited':
        return {
          label: 'Forfeited',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badgeVariant: 'destructive' as const,
        };
      case 'no_show_charged':
        return {
          label: 'No-Show Charge',
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          badgeVariant: 'destructive' as const,
        };
      case 'deposit_applied':
        return {
          label: 'Applied to Service',
          icon: CheckCircle,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          badgeVariant: 'secondary' as const,
        };
      default:
        return {
          label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          icon: Receipt,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          badgeVariant: 'secondary' as const,
        };
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">Refunded</Badge>;
      default:
        return null;
    }
  };

  const filteredTransactions = data?.transactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'deposits') return tx.transactionType === 'deposit_collected';
    if (activeTab === 'refunds') return tx.transactionType === 'deposit_refunded';
    if (activeTab === 'forfeits') return ['deposit_forfeited', 'no_show_charged'].includes(tx.transactionType);
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-white rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-white rounded-lg" />
              ))}
            </div>
            <div className="h-96 bg-white rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Deposits</h2>
              <p className="text-gray-600 mb-4">Please try again or contact support if the issue persists.</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = data?.stats || { totalDeposits: 0, totalRefunded: 0, totalForfeited: 0, activeDeposits: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/customer/wallet')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-7 w-7 text-blue-600" />
              Deposit History
            </h1>
            <p className="text-gray-600 mt-1">Track your booking deposits and refunds</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Paid</p>
                  <p className="text-lg font-bold text-gray-900">{formatAmount(stats.totalDeposits)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <ArrowDownLeft className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Refunded</p>
                  <p className="text-lg font-bold text-gray-900">{formatAmount(stats.totalRefunded)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Forfeited</p>
                  <p className="text-lg font-bold text-gray-900">{formatAmount(stats.totalForfeited)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Wallet className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active</p>
                  <p className="text-lg font-bold text-gray-900">{formatAmount(stats.activeDeposits)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Transaction History</CardTitle>
            <CardDescription>
              {data?.count || 0} total transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="deposits">Deposits</TabsTrigger>
                <TabsTrigger value="refunds">Refunds</TabsTrigger>
                <TabsTrigger value="forfeits">Forfeits</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {filteredTransactions.map((tx) => {
                        const typeInfo = getTransactionTypeInfo(tx.transactionType);
                        const TypeIcon = typeInfo.icon;
                        
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer transition-all"
                            onClick={() => setSelectedTransaction(tx)}
                          >
                            <div className={`p-2.5 rounded-full ${typeInfo.bgColor}`}>
                              <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900">
                                  {typeInfo.label}
                                </span>
                                {getStatusBadge(tx.status)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <Store className="w-3.5 h-3.5" />
                                <span className="truncate">{tx.salonName || 'Unknown Salon'}</span>
                                {tx.serviceName && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{tx.serviceName}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(tx.createdAt), 'MMM d, yyyy • h:mm a')}
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <p className={`font-semibold ${
                                tx.transactionType === 'deposit_refunded' 
                                  ? 'text-green-600' 
                                  : tx.transactionType.includes('forfeit') || tx.transactionType === 'no_show_charged'
                                    ? 'text-red-600'
                                    : 'text-gray-900'
                              }`}>
                                {tx.transactionType === 'deposit_refunded' ? '+' : ''}
                                {formatAmount(tx.amountPaisa)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {tx.depositPercentage}% of service
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">About Deposits</h3>
                <p className="text-blue-100 text-sm">
                  Deposits protect salons from no-shows and last-minute cancellations. 
                  Your deposit is applied to your service cost when you complete your appointment. 
                  Refund policies vary by salon - check their cancellation policy before booking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this deposit transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                {selectedTransaction.salonImageUrl ? (
                  <img 
                    src={selectedTransaction.salonImageUrl} 
                    alt={selectedTransaction.salonName || ''} 
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Store className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedTransaction.salonName || 'Unknown Salon'}</p>
                  {selectedTransaction.serviceName && (
                    <p className="text-sm text-gray-500">{selectedTransaction.serviceName}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                  <Badge className="mt-1" variant={getTransactionTypeInfo(selectedTransaction.transactionType).badgeVariant}>
                    {getTransactionTypeInfo(selectedTransaction.transactionType).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                  <p className="font-semibold text-lg">{formatAmount(selectedTransaction.amountPaisa)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Service Total</p>
                  <p className="font-medium">{formatAmount(selectedTransaction.serviceAmountPaisa)}</p>
                </div>
              </div>

              {selectedTransaction.bookingDate && selectedTransaction.bookingTime && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      Appointment: {format(new Date(selectedTransaction.bookingDate), 'EEEE, MMMM d, yyyy')} at {selectedTransaction.bookingTime}
                    </span>
                  </div>
                </>
              )}

              {selectedTransaction.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{selectedTransaction.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="text-xs text-gray-400 text-center">
                Transaction ID: {selectedTransaction.id.slice(0, 8)}...
                <br />
                {format(new Date(selectedTransaction.createdAt), 'MMMM d, yyyy • h:mm:ss a')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
