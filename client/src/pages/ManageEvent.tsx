import { useEffect, useState } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { Calendar, MapPin, Users, Settings, BarChart3, QrCode, Download, Edit, ArrowLeft, Clock, DollarSign, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BusinessLayout } from '@/components/layouts/BusinessLayout';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venueAddress: string;
  venueCity: string;
  status: string;
  maxCapacity: number;
  currentRegistrations: number;
  coverImageUrl?: string;
  eventTypeId?: string;
  visibility: string;
}

interface Ticket {
  id: string;
  ticketName: string;
  basePricePaisa: number;
  quantityAvailable: number;
  quantitySold: number;
}

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl?: string;
}

interface Schedule {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  speaker?: string;
}

export default function ManageEvent() {
  const [, params] = useRoute('/business/events/:eventId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const eventId = params?.eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    
    const fetchData = async () => {
      try {
        const [eventRes, ticketsRes, speakersRes, schedulesRes] = await Promise.all([
          fetch(`/api/events/business/${eventId}`, { credentials: 'include' }),
          fetch(`/api/events/business/${eventId}/tickets`, { credentials: 'include' }),
          fetch(`/api/events/business/${eventId}/speakers`, { credentials: 'include' }),
          fetch(`/api/events/business/${eventId}/schedule`, { credentials: 'include' }),
        ]);

        if (!eventRes.ok) throw new Error('Failed to fetch event');

        const eventData = await eventRes.ok ? await eventRes.json() : null;
        const ticketsData = await ticketsRes.ok ? await ticketsRes.json() : [];
        const speakersData = await speakersRes.ok ? await speakersRes.json() : [];
        const schedulesData = await schedulesRes.ok ? await schedulesRes.json() : [];

        setEvent(eventData);
        setTickets(ticketsData);
        setSpeakers(speakersData);
        setSchedules(schedulesData);
      } catch (error) {
        console.error('Error fetching event data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load event details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Event not found</h2>
          <Button onClick={() => setLocation('/business/events/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const spotsLeft = event.maxCapacity - (event.currentRegistrations || 0);
  const revenue = tickets.reduce((sum, t) => sum + (t.quantitySold * t.basePricePaisa), 0);

  return (
    <BusinessLayout backLink="/business/events/dashboard" backLinkText="Event Dashboard">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(event.startDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{event.startTime} - {event.endTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.venueCity}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/business/events/${eventId}/check-in`}>
              <Button variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                Check-In
              </Button>
            </Link>
            <Link href={`/business/events/${eventId}/analytics`}>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
          </div>
        </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(revenue / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.currentRegistrations || 0}</div>
            <p className="text-xs text-muted-foreground">of {event.maxCapacity} capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spots Left</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spotsLeft}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((spotsLeft / event.maxCapacity) * 100)}% available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
              {event.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">{event.visibility}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="speakers">Speakers ({speakers.length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule ({schedules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Basic information about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.coverImageUrl && (
                <div>
                  <img
                    src={event.coverImageUrl}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{event.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Venue</h3>
                <p className="text-muted-foreground">{event.venueAddress}</p>
                <p className="text-muted-foreground">{event.venueCity}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Types</CardTitle>
              <CardDescription>Pricing and availability for your event</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tickets configured</p>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{ticket.ticketName}</h4>
                        <p className="text-sm text-muted-foreground">
                          ₹{(ticket.basePricePaisa / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{ticket.quantitySold} sold</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.quantityAvailable ? `${ticket.quantityAvailable - ticket.quantitySold} left` : 'Unlimited'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speakers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Speakers</CardTitle>
              <CardDescription>Presenters and instructors for this event</CardDescription>
            </CardHeader>
            <CardContent>
              {speakers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No speakers added</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {speakers.map((speaker) => (
                    <div key={speaker.id} className="flex gap-4 p-4 border rounded-lg">
                      {speaker.photoUrl ? (
                        <img
                          src={speaker.photoUrl}
                          alt={speaker.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{speaker.name}</h4>
                        <p className="text-sm text-muted-foreground">{speaker.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{speaker.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Schedule</CardTitle>
              <CardDescription>Timeline and agenda for your event</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No schedule items added</p>
              ) : (
                <div className="space-y-4">
                  {schedules
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                        <div className="flex flex-col items-center justify-center min-w-[80px] text-center">
                          <div className="text-sm font-semibold">{item.startTime}</div>
                          <div className="text-xs text-muted-foreground">to</div>
                          <div className="text-sm font-semibold">{item.endTime}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                          {item.speaker && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <Users className="h-3 w-3 inline mr-1" />
                              {item.speaker}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </BusinessLayout>
  );
}
