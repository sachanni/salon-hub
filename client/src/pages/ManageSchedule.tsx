import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

interface ScheduleItem {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  orderIndex: number;
}

export default function ManageSchedule() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
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

  const { data: scheduleItems, isLoading } = useQuery<ScheduleItem[]>({
    queryKey: [`/api/events/business/${draftId}/schedule`],
    queryFn: async () => {
      if (!draftId) return [];
      const res = await fetch(`/api/events/business/${draftId}/schedule`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load schedule');
      return res.json();
    },
    enabled: !!draftId,
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/events/business/${draftId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          description: data.description || null,
          orderIndex: (scheduleItems?.length || 0) + 1,
        }),
      });
      if (!res.ok) throw new Error('Failed to add schedule item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/schedule`] });
      toast({ title: "Schedule Added", description: "Schedule item added successfully." });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add schedule item.", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const res = await fetch(`/api/events/business/${draftId}/schedule/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          startTime: data.startTime,
          endTime: data.endTime,
        }),
      });
      if (!res.ok) throw new Error('Failed to update schedule item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/schedule`] });
      toast({ title: "Schedule Updated", description: "Schedule item updated successfully." });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update schedule item.", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/events/business/${draftId}/schedule/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete schedule item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/business/${draftId}/schedule`] });
      toast({ title: "Schedule Deleted", description: "Schedule item removed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete schedule item.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', startTime: '', endTime: '' });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: ScheduleItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        startTime: item.startTime,
        endTime: item.endTime,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItemMutation.mutate({ ...formData, id: editingItem.id });
    } else {
      addItemMutation.mutate(formData);
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
          <h1 className="text-3xl font-bold">Manage Schedule</h1>
          <p className="text-muted-foreground mt-2">Define the agenda and timeline for your event</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule Item
        </Button>
      </div>

      {!scheduleItems || scheduleItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No schedule items yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a timeline of activities, sessions, or agenda items
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Schedule Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scheduleItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="flex flex-col items-center">
                      <Badge variant="outline" className="whitespace-nowrap">
                        {item.startTime}
                      </Badge>
                      <div className="w-px h-8 bg-border my-1"></div>
                      <Badge variant="outline" className="whitespace-nowrap">
                        {item.endTime}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteItemMutation.mutate(item.id)}
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
            <DialogTitle>{editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update schedule information' : 'Add a new item to the event schedule'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Registration & Welcome, Workshop Session"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What happens during this time?"
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
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
