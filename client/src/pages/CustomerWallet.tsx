import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Clock, Gift, CreditCard, QrCode, Store, Calendar, ArrowRight, Copy, Check, Shield } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface WalletData {
  balanceInPaisa: number;
  lifetimeEarnedInPaisa: number;
  lifetimeSpentInPaisa: number;
}

interface Transaction {
  id: string;
  type: string;
  reason: string;
  amountInPaisa: number;
  createdAt: string;
}

interface GiftCard {
  id: string;
  code: string;
  balancePaisa: number;
  originalValuePaisa: number;
  status: string;
  expiresAt: string | null;
  recipientName?: string;
  recipientEmail?: string;
  salonId: string;
  salonName: string;
  purchasedAt?: string;
  deliveredAt?: string;
  personalMessage?: string;
  qrCodeUrl?: string;
}

interface GiftCardsResponse {
  purchased: GiftCard[];
  received: GiftCard[];
}

export default function CustomerWallet() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("wallet");

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['/api/wallet'],
    retry: false,
  });

  const { data: transactionsData, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/wallet/transactions'],
    retry: false,
  });
  
  const transactions = transactionsData || [];

  const { data: giftCardsData, isLoading: giftCardsLoading } = useQuery<GiftCardsResponse>({
    queryKey: ['/api/customer/gift-cards'],
    retry: false,
  });

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTransactionIcon = (reason: string) => {
    if (reason.includes('cashback') || reason.includes('bonus')) return Gift;
    if (reason.includes('payment')) return Wallet;
    return Clock;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'partially_used':
        return 'bg-yellow-100 text-yellow-800';
      case 'fully_redeemed':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: 'Copied!',
        description: 'Gift card code copied to clipboard',
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy code',
        variant: 'destructive',
      });
    }
  };

  const isLoading = walletLoading || txLoading || giftCardsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-white rounded-lg"></div>
            <div className="h-60 bg-white rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const balance = wallet?.balanceInPaisa || 0;
  const totalEarned = wallet?.lifetimeEarnedInPaisa || 0;
  const totalSpent = wallet?.lifetimeSpentInPaisa || 0;

  const purchasedCards = giftCardsData?.purchased || [];
  const receivedCards = giftCardsData?.received || [];
  const activeGiftCards = [...purchasedCards, ...receivedCards].filter(
    (card) => card.status === 'active' || card.status === 'partially_used'
  );
  const totalGiftCardBalance = activeGiftCards.reduce((sum, card) => sum + card.balancePaisa, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Track your savings, rewards & gift cards</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="giftcards" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Gift Cards
              {activeGiftCards.length > 0 && (
                <Badge variant="secondary" className="ml-1">{activeGiftCards.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deposits" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Deposits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white" data-testid="wallet-balance-card">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Available Balance</p>
                    <h2 className="text-4xl font-bold" data-testid="wallet-balance">
                      {formatAmount(balance)}
                    </h2>
                  </div>
                  <Wallet className="w-16 h-16 text-purple-200" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-purple-400">
                  <div>
                    <p className="text-purple-100 text-xs mb-1">Total Earned</p>
                    <p className="text-xl font-semibold" data-testid="wallet-earned">
                      {formatAmount(totalEarned)}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-100 text-xs mb-1">Total Spent</p>
                    <p className="text-xl font-semibold" data-testid="wallet-spent">
                      {formatAmount(totalSpent)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card data-testid="savings-card">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(totalEarned - totalSpent)}
                  </p>
                  <p className="text-sm text-gray-600">Net Savings</p>
                </CardContent>
              </Card>
              <Card data-testid="transactions-count-card">
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                  <p className="text-sm text-gray-600">Transactions</p>
                </CardContent>
              </Card>
              <Card data-testid="rewards-card">
                <CardContent className="p-6 text-center">
                  <Gift className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(balance)}
                  </p>
                  <p className="text-sm text-gray-600">Ready to Use</p>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="transaction-history">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8" data-testid="no-transactions">
                    No transactions yet. Start booking to earn rewards!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx: Transaction, index: number) => {
                      const Icon = getTransactionIcon(tx.reason);
                      const isCredit = tx.type === 'credit';
                      
                      return (
                        <div 
                          key={tx.id || index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          data-testid={`transaction-${index}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              isCredit ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                isCredit ? 'text-green-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 capitalize">
                                {tx.reason.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm') : 'Just now'}
                              </p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${
                            isCredit ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isCredit ? '+' : '-'}{formatAmount(tx.amountInPaisa)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="giftcards" className="space-y-6">
            {totalGiftCardBalance > 0 && (
              <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm mb-1">Total Gift Card Balance</p>
                      <h2 className="text-3xl font-bold">{formatAmount(totalGiftCardBalance)}</h2>
                      <p className="text-emerald-100 text-sm mt-2">
                        {activeGiftCards.length} active gift card{activeGiftCards.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <CreditCard className="w-14 h-14 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>
            )}

            {receivedCards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-pink-500" />
                    Received Gift Cards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {receivedCards.map((card) => (
                    <div
                      key={card.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{card.salonName}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-mono text-lg font-bold text-purple-600">{card.code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(card.code)}
                            >
                              {copiedCode === card.code ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Badge className={getStatusColor(card.status)}>
                          {card.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Balance</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatAmount(card.balancePaisa)}
                            <span className="text-sm text-gray-400 font-normal ml-1">
                              / {formatAmount(card.originalValuePaisa)}
                            </span>
                          </p>
                        </div>
                        {card.expiresAt && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Expires</p>
                            <p className="text-sm font-medium text-gray-700">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {format(new Date(card.expiresAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>

                      {card.personalMessage && (
                        <div className="mt-3 bg-pink-50 rounded-lg p-3">
                          <p className="text-sm italic text-gray-700">"{card.personalMessage}"</p>
                        </div>
                      )}

                      {card.qrCodeUrl && (
                        <div className="mt-3 flex justify-center">
                          <img src={card.qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {purchasedCards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    Purchased Gift Cards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {purchasedCards.map((card) => (
                    <div
                      key={card.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{card.salonName}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-mono text-lg font-bold text-purple-600">{card.code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(card.code)}
                            >
                              {copiedCode === card.code ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Badge className={getStatusColor(card.status)}>
                          {card.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Balance</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatAmount(card.balancePaisa)}
                            <span className="text-sm text-gray-400 font-normal ml-1">
                              / {formatAmount(card.originalValuePaisa)}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Sent To</p>
                          <p className="text-sm font-medium text-gray-700">{card.recipientName}</p>
                          <p className="text-xs text-gray-500">{card.recipientEmail}</p>
                        </div>
                      </div>

                      {card.purchasedAt && (
                        <p className="text-xs text-gray-400 mt-3">
                          Purchased {format(new Date(card.purchasedAt), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {purchasedCards.length === 0 && receivedCards.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Gift Cards Yet</h3>
                  <p className="text-gray-500 mb-6">
                    Purchase a gift card for someone special or wait to receive one!
                  </p>
                  <Button
                    onClick={() => setLocation('/salons')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Browse Salons
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="deposits" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Booking Deposits</p>
                    <h2 className="text-2xl font-bold">Protect Your Appointments</h2>
                    <p className="text-blue-100 text-sm mt-2">
                      View all your deposit transactions and refund history
                    </p>
                  </div>
                  <Shield className="w-16 h-16 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Deposit History</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Track your deposits, refunds, and forfeited amounts.
                  </p>
                  <Button
                    onClick={() => setLocation('/customer/deposits')}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                  >
                    View Deposits
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CreditCard className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved Cards</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Manage your saved payment methods for faster checkout.
                  </p>
                  <Button
                    onClick={() => setLocation('/customer/saved-cards')}
                    className="bg-indigo-600 hover:bg-indigo-700 w-full"
                  >
                    Manage Cards
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  How Deposits Work
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    Some services require a deposit to secure your booking
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    Your deposit is applied to your final bill when you attend
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    Cancel within the salon's policy window for a full refund
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    Late cancellations or no-shows may result in deposit forfeiture
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
