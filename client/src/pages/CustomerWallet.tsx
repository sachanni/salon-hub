import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Clock, Gift } from "lucide-react";
import { format } from "date-fns";

export default function CustomerWallet() {
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['/api/wallet'],
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['/api/wallet/transactions'],
  });

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const getTransactionIcon = (reason: string) => {
    if (reason.includes('cashback') || reason.includes('bonus')) return Gift;
    if (reason.includes('payment')) return Wallet;
    return Clock;
  };

  if (walletLoading || txLoading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Track your savings and rewards</p>
        </div>

        {/* Balance Card */}
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

        {/* Savings Stats */}
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

        {/* Transaction History */}
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
                {transactions.map((tx: any, index: number) => {
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
      </div>
    </div>
  );
}
