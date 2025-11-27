import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Calendar, MapPin, Users, MoreVertical, Edit, Trash2, Copy, Eye, CheckCircle2, AlertCircle, FileEdit, Search } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface DraftEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  startTime: string;
  venueName: string | null;
  maxCapacity: number;
  coverImageUrl: string | null;
  eventType: {
    name: string;
  } | null;
  completionPercentage: number;
  missingFields: string[];
  createdAt: string;
}

export default function DraftEvents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data: drafts, isLoading } = useQuery<DraftEvent[]>({
    queryKey: ['/api/events/business/drafts'],
    queryFn: async () => {
      const res = await fetch('/api/events/business/drafts');
      if (!res.ok) throw new Error('Failed to fetch drafts');
      const data = await res.json();
      return data.drafts; // Extract drafts array from response object
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete draft');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/business/drafts'] });
      toast({
        title: "Draft Deleted",
        description: "The draft event has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the draft event.",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events/${eventId}/publish`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to publish event');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/business/drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/business/dashboard'] });
      toast({
        title: "Event Published",
        description: "Your event is now live and visible to customers!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Publish Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredDrafts = drafts?.filter(draft =>
    draft.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const readyToPublish = drafts?.filter(d => d.completionPercentage === 100).length || 0;
  const needsAttention = drafts?.filter(d => d.completionPercentage < 50).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-1/2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Draft Events</h1>
            <p className="text-muted-foreground">
              Manage and complete your draft events before publishing
            </p>
          </div>
          <Link href="/business/events/create">
            <Button>
              <FileEdit className="h-4 w-4 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{drafts?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ready to Publish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{readyToPublish}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{needsAttention}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drafts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {!filteredDrafts || filteredDrafts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No draft events</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No drafts match your search' : 'Create your first event to get started'}
              </p>
              {!searchQuery && (
                <Link href="/events/create">
                  <Button>Create Event</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDrafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {draft.coverImageUrl ? (
                      <img
                        src={draft.coverImageUrl}
                        alt={draft.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{draft.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {draft.eventType && (
                              <Badge variant="outline">{draft.eventType.name}</Badge>
                            )}
                            <span>Created {new Date(draft.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/business/events/builder?draft=${draft.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Draft
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={draft.completionPercentage < 100}
                              onClick={() => publishMutation.mutate(draft.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Publish Event
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedEventId(draft.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Draft
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{draft.startDate ? new Date(draft.startDate).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{draft.venueName || 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Max {draft.maxCapacity}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Completion</span>
                          <span className={draft.completionPercentage === 100 ? 'text-green-600' : 'text-orange-600'}>
                            {draft.completionPercentage}%
                          </span>
                        </div>
                        <Progress value={draft.completionPercentage} className="h-2" />
                        {draft.missingFields.length > 0 && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                              Missing: {draft.missingFields.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/business/events/builder?draft=${draft.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Continue Editing
                          </Button>
                        </Link>
                        {draft.completionPercentage === 100 && (
                          <Button
                            size="sm"
                            onClick={() => publishMutation.mutate(draft.id)}
                            disabled={publishMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Publish Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedEventId) {
                  deleteMutation.mutate(selectedEventId);
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
