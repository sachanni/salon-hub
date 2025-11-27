import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, DollarSign, Star, Plus, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  activeEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  averageRating: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startDate: string;
    startTime: string;
    maxCapacity: number;
    currentRegistrations: number;
    coverImageUrl: string | null;
    spotsLeft: number;
  }>;
  draftCount: number;
}

export default function EventDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/events/business/dashboard'],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch('/api/events/business/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    },
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Please log in to view your event dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Failed to load dashboard data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your workshops, masterclasses, and events</p>
        </div>
        <div className="flex gap-2">
          {stats && stats.draftCount > 0 && (
            <Link href="/business/events/drafts">
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                {stats.draftCount} Draft{stats.draftCount > 1 ? 's' : ''}
              </Button>
            </Link>
          )}
          <Link href="/business/events/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeEvents || 0}</div>
                <p className="text-xs text-muted-foreground">Published & upcoming</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
                <p className="text-xs text-muted-foreground">Confirmed attendees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{((stats?.totalRevenue || 0) / 100).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-muted-foreground">From all events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {stats?.averageRating || 0}
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-xs text-muted-foreground">From customer reviews</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Upcoming Events</CardTitle>
            <Link href="/business/events">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-20 w-32 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {stats.upcomingEvents.map((event) => (
                <Link key={event.id} href={`/business/events/${event.id}`}>
                  <div className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                    {event.coverImageUrl ? (
                      <img
                        src={event.coverImageUrl}
                        alt={event.title}
                        className="h-20 w-32 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-20 w-32 bg-muted rounded-md flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {event.startTime}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.currentRegistrations || 0}/{event.maxCapacity}
                        </span>
                        {event.spotsLeft <= 10 && event.spotsLeft > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {event.spotsLeft} spots left
                          </Badge>
                        )}
                        {event.spotsLeft === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Fully Booked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Upcoming Events</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first event to start engaging with customers
              </p>
              <Link href="/business/events/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/business/events/create">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
            </Link>
            <Link href="/business/events/drafts">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                View Drafts {stats && stats.draftCount > 0 && `(${stats.draftCount})`}
              </Button>
            </Link>
            <Link href="/business/events/past">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Past Events
              </Button>
            </Link>
            <Link href="/business/events/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips for Success</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Add High-Quality Images</p>
                <p className="text-xs text-muted-foreground">Events with images get 3x more registrations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Users className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Offer Early Bird Discounts</p>
                <p className="text-xs text-muted-foreground">Boost early registrations with limited-time offers</p>
              </div>
            </div>
            <div className="flex gap-2">
              <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Promote on Social Media</p>
                <p className="text-xs text-muted-foreground">Share your event links to reach more customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
