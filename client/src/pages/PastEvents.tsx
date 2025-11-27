import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Star, TrendingUp, IndianRupee, Search, FileText } from 'lucide-react';
import { Link } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface PastEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string | null;
  venueName: string;
  eventType: {
    name: string;
  } | null;
  currentRegistrations: number;
  maxCapacity: number;
  totalRevenue: number;
  averageRating: number | null;
  reviewCount: number;
  coverImageUrl: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PastEvents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: pastEvents, isLoading } = useQuery<PastEvent[]>({
    queryKey: ['/api/events/business/past'],
    queryFn: async () => {
      const res = await fetch('/api/events/business/past');
      if (!res.ok) throw new Error('Failed to fetch past events');
      const data = await res.json();
      return data.events; // Extract events array from response object
    },
  });

  const filteredEvents = pastEvents?.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = pastEvents?.reduce((sum, e) => sum + e.totalRevenue, 0) || 0;
  const totalAttendees = pastEvents?.reduce((sum, e) => sum + e.currentRegistrations, 0) || 0;
  const avgRating = (pastEvents?.reduce((sum, e) => sum + (e.averageRating || 0), 0) || 0) / (pastEvents?.length || 1);

  const revenueByType = pastEvents?.reduce((acc, event) => {
    const type = event.eventType?.name || 'Other';
    if (!acc[type]) acc[type] = 0;
    acc[type] += event.totalRevenue;
    return acc;
  }, {} as Record<string, number>);

  const revenueChartData = Object.entries(revenueByType || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const attendanceByType = pastEvents?.reduce((acc, event) => {
    const type = event.eventType?.name || 'Other';
    if (!acc[type]) acc[type] = 0;
    acc[type] += event.currentRegistrations;
    return acc;
  }, {} as Record<string, number>);

  const attendanceChartData = Object.entries(attendanceByType || {}).map(([name, count]) => ({
    name,
    count,
  }));

  const topEvents = [...(pastEvents || [])]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-1/2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Skeleton className="h-32" />
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
            <h1 className="text-3xl font-bold mb-2">Past Events</h1>
            <p className="text-muted-foreground">
              View historical performance and insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pastEvents?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₹{totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Attendees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalAttendees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-yellow-600">
                  {avgRating.toFixed(1)}
                </div>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Event List</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Event Type</CardTitle>
                  <CardDescription>Total revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance by Event Type</CardTitle>
                  <CardDescription>Total participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Events</CardTitle>
                <CardDescription>Events with highest revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topEvents.map((event, index) => (
                    <div key={event.id} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <Link href={`/events/${event.slug}`}>
                          <h4 className="font-semibold hover:underline">{event.title}</h4>
                        </Link>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(event.startDate).toLocaleDateString()}</span>
                          <span>{event.currentRegistrations} attendees</span>
                          {event.averageRating && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {event.averageRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ₹{event.totalRevenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search past events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {!filteredEvents || filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past events</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No events match your search' : 'Past events will appear here after completion'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {event.coverImageUrl ? (
                          <img
                            src={event.coverImageUrl}
                            alt={event.title}
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
                              <Link href={`/events/${event.slug}`}>
                                <h3 className="text-xl font-semibold mb-1 hover:underline">
                                  {event.title}
                                </h3>
                              </Link>
                              {event.eventType && (
                                <Badge variant="outline">{event.eventType.name}</Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(event.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{event.venueName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {event.currentRegistrations}/{event.maxCapacity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IndianRupee className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-green-600">
                                ₹{event.totalRevenue.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {event.averageRating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{event.averageRating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({event.reviewCount} {event.reviewCount === 1 ? 'review' : 'reviews'})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
