import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, Star, Trash2, Edit2, ArrowLeft, Shield, Plus, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SavedCard {
  id: string;
  cardNetwork: string | null;
  cardType: string | null;
  cardLast4: string | null;
  cardIssuer: string | null;
  cardBrand: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  nickname: string | null;
  isDefault: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface CardsResponse {
  cards: SavedCard[];
  count: number;
}

const getCardIcon = (network: string | null) => {
  const networkLower = (network || "").toLowerCase();
  switch (networkLower) {
    case "visa":
      return "💳";
    case "mastercard":
      return "💳";
    case "rupay":
      return "🏦";
    case "amex":
      return "💳";
    default:
      return "💳";
  }
};

const getNetworkColor = (network: string | null) => {
  const networkLower = (network || "").toLowerCase();
  switch (networkLower) {
    case "visa":
      return "bg-blue-100 text-blue-800";
    case "mastercard":
      return "bg-orange-100 text-orange-800";
    case "rupay":
      return "bg-green-100 text-green-800";
    case "amex":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function SavedCards() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCard, setEditingCard] = useState<SavedCard | null>(null);
  const [deleteCard, setDeleteCard] = useState<SavedCard | null>(null);
  const [nickname, setNickname] = useState("");

  const { data, isLoading, error } = useQuery<CardsResponse>({
    queryKey: ["/api/deposits/my-cards"],
    retry: false,
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, data }: { cardId: string; data: { nickname?: string; isDefault?: boolean } }) => {
      return apiRequest(`/api/deposits/my-cards/${cardId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/my-cards"] });
      toast({ title: "Card updated", description: "Your card has been updated successfully." });
      setEditingCard(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update card.", variant: "destructive" });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      return apiRequest(`/api/deposits/my-cards/${cardId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/my-cards"] });
      toast({ title: "Card removed", description: "Your card has been removed successfully." });
      setDeleteCard(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove card.", variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (cardId: string) => {
      return apiRequest(`/api/deposits/my-cards/${cardId}/set-default`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/my-cards"] });
      toast({ title: "Default card updated", description: "Your default payment method has been changed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to set default card.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-white rounded-lg w-48"></div>
            <div className="h-40 bg-white rounded-lg"></div>
            <div className="h-40 bg-white rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-8 text-center">
              <p className="text-red-600">Failed to load saved cards. Please try again later.</p>
              <Button onClick={() => setLocation("/customer/wallet")} variant="outline" className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const cards = data?.cards || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/customer/wallet")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Payment Methods</h1>
            <p className="text-gray-600">Manage your saved cards for faster checkout</p>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm mb-1">Secure Card Storage</p>
                <h2 className="text-2xl font-bold">{cards.length} Card{cards.length !== 1 ? "s" : ""} Saved</h2>
                <p className="text-indigo-100 text-sm mt-2 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  RBI compliant tokenization
                </p>
              </div>
              <CreditCard className="w-16 h-16 text-indigo-200" />
            </div>
          </CardContent>
        </Card>

        {cards.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Cards</h3>
              <p className="text-gray-500 mb-6">
                Your payment cards will appear here when you save them during checkout.
              </p>
              <Button onClick={() => setLocation("/salons")} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Book a Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <Card
                key={card.id}
                className={`transition-all hover:shadow-md ${card.isDefault ? "ring-2 ring-purple-500" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-2xl">
                        {getCardIcon(card.cardNetwork)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {card.nickname || `${card.cardNetwork || "Card"} ending in ${card.cardLast4}`}
                          </span>
                          {card.isDefault && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getNetworkColor(card.cardNetwork)}>
                            {card.cardNetwork || "Unknown"}
                          </Badge>
                          <span className="text-sm text-gray-500">•••• {card.cardLast4}</span>
                          {card.expiryMonth && card.expiryYear && (
                            <span className="text-sm text-gray-500">
                              Expires {card.expiryMonth.toString().padStart(2, "0")}/{card.expiryYear.toString().slice(-2)}
                            </span>
                          )}
                        </div>
                        {card.cardIssuer && (
                          <p className="text-xs text-gray-400 mt-1">{card.cardIssuer}</p>
                        )}
                        {card.lastUsedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last used: {format(new Date(card.lastUsedAt), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!card.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(card.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCard(card);
                          setNickname(card.nickname || "");
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteCard(card)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Your Cards Are Safe
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Card details are securely tokenized via RBI-compliant methods
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                We never store your actual card numbers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Tokens are unique to this merchant and cannot be used elsewhere
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Remove a card anytime to instantly revoke access
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card Nickname</DialogTitle>
            <DialogDescription>
              Give your card a friendly name to identify it easily.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g., Personal Visa, Office Card"
                maxLength={50}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingCard) {
                  updateCardMutation.mutate({
                    cardId: editingCard.id,
                    data: { nickname: nickname || undefined },
                  });
                }
              }}
              disabled={updateCardMutation.isPending}
            >
              {updateCardMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCard} onOpenChange={() => setDeleteCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Card?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this card ending in {deleteCard?.cardLast4}? 
              You'll need to add it again if you want to use it for future payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCard && deleteCardMutation.mutate(deleteCard.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCardMutation.isPending ? "Removing..." : "Remove Card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
