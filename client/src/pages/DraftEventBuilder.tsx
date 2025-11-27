import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Circle, Edit, Plus, Calendar, Users, Ticket, Clock, RefreshCw } from 'lucide-react';

interface DraftData {
  event: any;
  speakers: any[];
  tickets: any[];
  schedules: any[];
}

export default function DraftEventBuilder() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('draft');
    
    if (!id) {
      toast({
        title: "Error",
        description: "No draft ID provided",
        variant: "destructive",
      });
      setLocation('/business/events/drafts');
      return;
    }

    setDraftId(id);
    loadDraft(id);
  }, []);

  // Auto-refresh when navigating back to builder (triggered by location change)
  useEffect(() => {
    if (!draftId || !location.includes('/business/events/builder')) return;
    
    // Only refresh if we have a draftId and location changed
    const params = new URLSearchParams(window.location.search);
    const currentId = params.get('draft');
    
    if (currentId === draftId && draftData) {
      // Silently refresh data when returning to builder
      loadDraft(draftId);
    }
  }, [location]);

  const loadDraft = async (id: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await fetch(`/api/events/business/${id}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to load draft');

      const data = await res.json();
      setDraftData(data);
      setLoading(false);
      setRefreshing(false);
      
      if (isRefresh) {
        toast({
          title: "Refreshed",
          description: "Event data reloaded successfully",
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      setRefreshing(false);
      toast({
        title: "Error",
        description: "Failed to load draft event",
        variant: "destructive",
      });
      if (!isRefresh) {
        setLocation('/business/events/drafts');
      }
    }
  };

  const getCompletionStatus = () => {
    if (!draftData) return { completed: 0, total: 3, sections: [] };

    const sections = [
      {
        id: 'speakers',
        title: 'Speakers & Instructors',
        description: 'Add people who will present or teach',
        completed: draftData.speakers.length > 0,
        icon: Users,
        count: draftData.speakers.length,
        addAction: () => setLocation(`/business/events/manage-speakers?draft=${draftId}`),
      },
      {
        id: 'tickets',
        title: 'Tickets & Pricing',
        description: 'Configure ticket types and pricing',
        completed: draftData.tickets.length > 0,
        icon: Ticket,
        count: draftData.tickets.length,
        addAction: () => setLocation(`/business/events/manage-tickets?draft=${draftId}`),
      },
      {
        id: 'schedule',
        title: 'Schedule & Agenda',
        description: 'Event timeline and activities',
        completed: draftData.schedules.length > 0,
        icon: Clock,
        count: draftData.schedules.length,
        addAction: () => setLocation(`/business/events/manage-schedule?draft=${draftId}`),
      },
    ];

    const completed = sections.filter(s => s.completed).length;
    return { completed, total: sections.length, sections };
  };

  const handlePublish = async () => {
    if (!draftId) return;

    try {
      const res = await fetch(`/api/events/business/${draftId}/publish`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: 'public', status: 'published' }),
      });

      if (!res.ok) throw new Error('Failed to publish event');

      toast({
        title: "Event Published!",
        description: "Your event is now live and accepting registrations.",
      });

      setLocation('/business/events/dashboard');
    } catch (error) {
      console.error('Error publishing event:', error);
      toast({
        title: "Error",
        description: "Failed to publish event",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading draft event...</p>
        </div>
      </div>
    );
  }

  if (!draftData) return null;

  const status = getCompletionStatus();
  const canPublish = status.completed === status.total;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation('/business/events/drafts')}
          className="mb-4"
        >
          ← Back to Drafts
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{draftData.event.title || 'Untitled Event'}</h1>
            <p className="text-muted-foreground mt-2">
              Add speakers, tickets, and schedule to complete your event
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              To edit basic event details or venue, use "Edit Draft" from the draft list
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => draftId && loadDraft(draftId, true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant={canPublish ? 'default' : 'secondary'} className="text-lg px-4 py-2">
              {status.completed} / {status.total} Complete
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {status.sections.map((section) => (
          <Card key={section.id} className={section.completed ? 'border-green-200 bg-green-50/50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {section.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <section.icon className="h-5 w-5" />
                      {section.title}
                      {section.count !== undefined && section.count > 0 && (
                        <Badge variant="secondary">{section.count}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>

                <Button
                  variant={section.completed ? 'outline' : 'default'}
                  onClick={section.addAction}
                >
                  {section.completed ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Manage
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            {section.completed && (
              <CardContent>
                {section.id === 'speakers' && (
                  <div className="text-sm text-muted-foreground">
                    {draftData.speakers.slice(0, 3).map((s: any) => s.name).join(', ')}
                    {draftData.speakers.length > 3 && ` +${draftData.speakers.length - 3} more`}
                  </div>
                )}
                {section.id === 'tickets' && (
                  <div className="text-sm text-muted-foreground">
                    {draftData.tickets.slice(0, 2).map((t: any) => t.name).join(', ')}
                    {draftData.tickets.length > 2 && ` +${draftData.tickets.length - 2} more`}
                  </div>
                )}
                {section.id === 'schedule' && (
                  <div className="text-sm text-muted-foreground">
                    {draftData.schedules.length} session{draftData.schedules.length !== 1 ? 's' : ''} scheduled
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center p-6 bg-muted rounded-lg">
        <div>
          <h3 className="font-semibold">Ready to publish?</h3>
          <p className="text-sm text-muted-foreground">
            {canPublish 
              ? 'All sections are complete. Your event is ready to go live!'
              : `Complete ${status.total - status.completed} more section${status.total - status.completed !== 1 ? 's' : ''} to publish.`}
          </p>
        </div>
        <Button
          size="lg"
          disabled={!canPublish}
          onClick={handlePublish}
        >
          Publish Event
        </Button>
      </div>
    </div>
  );
}
