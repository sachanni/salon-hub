import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Ticket } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  basePricePaisa: number;
  quantityAvailable: number | null;
  quantitySold: number;
  orderIndex: number;
}

export default function ManageTickets() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('draft');
    if (!id) {
      toast({
        title: "Error",
        description: "No event ID provided",
        variant: "destructive",
      });
      setLocation('/business/events/drafts');
      return;
    }
    setDraftId(id);
  }, []);

  const { data: tickets, isLoading } = useQuery<TicketType[]>({
    queryKey: [`/api/events/business/${draftId}/tickets`],
    queryFn: async () => {
      if (!draftId) return [];
      const res = await fetch(`/api/events/business/${draftId}/tickets`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load tickets');
      return res.json();
    },
    enabled: !!draftId,
  });

  const addTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/events/business/${draftId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          basePricePaisa: Math.round(parseFloat(data.price) * 100),
          quantityAvailable: data.quantity ? parseInt(data.quantity) : null,
          orderIndex: (tickets?.length || 0) + 1,
        }),
      });
      if (!res.ok) throw new Error('Failed to add ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/tickets`] });
      toast({ title: "Ticket Added", description: "Ticket type added successfully." });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add ticket.", variant: "destructive" });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const res = await fetch(`/api/events/business/${draftId}/tickets/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          basePricePaisa: Math.round(parseFloat(data.price) * 100),
          quantityAvailable: data.quantity ? parseInt(data.quantity) : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/tickets`] });
      toast({ title: "Ticket Updated", description: "Ticket type updated successfully." });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ticket.", variant: "destructive" });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await fetch(`/api/events/business/${draftId}/tickets/${ticketId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/tickets`] });
      toast({ title: "Ticket Deleted", description: "Ticket type removed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete ticket.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', quantity: '' });
    setEditingTicket(null);
  };

  const handleOpenDialog = (ticket?: TicketType) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        name: ticket.name,
        description: ticket.description || '',
        price: (ticket.basePricePaisa / 100).toFixed(2),
        quantity: ticket.quantityAvailable?.toString() || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate price is a valid number
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Validate quantity if provided
    if (formData.quantity && (isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity or leave empty for unlimited",
        variant: "destructive",
      });
      return;
    }
    
    if (editingTicket) {
      updateTicketMutation.mutate({ ...formData, id: editingTicket.id });
    } else {
      addTicketMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => setLocation(`/business/events/builder?draft=${draftId}`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Event Builder
      </Button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Tickets & Pricing</h1>
          <p className="text-muted-foreground mt-2">Configure ticket types and pricing for your event</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ticket Type
        </Button>
      </div>

      {!tickets || tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No ticket types added yet</h3>
            <p className="text-muted-foreground mb-4">
              Create ticket types with different pricing options
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Ticket Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{ticket.name}</h3>
                      <Badge variant="outline">
                        ₹{(ticket.basePricePaisa / 100).toFixed(2)}
                      </Badge>
                    </div>
                    {ticket.description && (
                      <p className="text-muted-foreground mb-3">{ticket.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Available: {ticket.quantityAvailable || 'Unlimited'}
                      </span>
                      <span className="text-muted-foreground">
                        Sold: {ticket.quantitySold}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(ticket)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteTicketMutation.mutate(ticket.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTicket ? 'Edit Ticket Type' : 'Add Ticket Type'}</DialogTitle>
            <DialogDescription>
              {editingTicket ? 'Update ticket information' : 'Create a new ticket type with pricing'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Ticket Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., General Admission, VIP Pass"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="499.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity">Available Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited tickets
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's included in this ticket?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingTicket ? 'Update' : 'Add'} Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
