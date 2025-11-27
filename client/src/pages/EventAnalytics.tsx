import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Ticket,
  UserCheck,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalRegistrations: number;
    totalRevenue: number;
    totalCheckedIn: number;
    attendanceRate: number;
  };
  registrationsByDate: Array<{
    date: string;
    count: number;
  }>;
  ticketTypeBreakdown: Array<{
    name: string;
    sold: number;
    revenue: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    amount: number;
  }>;
}

export default function EventAnalytics() {
  const [, params] = useRoute('/business/events/:eventId/analytics');
  const eventId = params?.eventId;

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    if (eventId) {
      fetchAnalytics();
    }
  }, [eventId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/events/business/${eventId}/analytics?range=${timeRange}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!analytics) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Registrations', analytics.overview.totalRegistrations],
      ['Total Revenue', `₹${analytics.overview.totalRevenue}`],
      ['Total Checked In', analytics.overview.totalCheckedIn],
      ['Attendance Rate', `${analytics.overview.attendanceRate}%`],
      [],
      ['Ticket Type', 'Sold', 'Revenue'],
      ...analytics.ticketTypeBreakdown.map(t => [t.name, t.sold, `₹${t.revenue}`]),
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-analytics-${eventId}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Analytics</h1>
            <p className="text-gray-600">Track your event performance and insights</p>
          </div>
          <Button onClick={exportData} className="gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('7d')}
            size="sm"
          >
            Last 7 Days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeRange('30d')}
            size="sm"
          >
            Last 30 Days
          </Button>
          <Button
            variant={timeRange === 'all' ? 'default' : 'outline'}
            onClick={() => setTimeRange('all')}
            size="sm"
          >
            All Time
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalRegistrations}</div>
              <p className="text-xs text-gray-600 mt-1">Total attendees registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analytics.overview.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">Total earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalCheckedIn}</div>
              <p className="text-xs text-gray-600 mt-1">Attendees present</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.attendanceRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-600 mt-1">Show-up percentage</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Types</TabsTrigger>
          </TabsList>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Registrations Over Time
                </CardTitle>
                <CardDescription>Daily registration trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.registrationsByDate.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No registration data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.registrationsByDate.map((day, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-32 text-sm text-gray-600">{day.date}</div>
                          <div className="flex-1">
                            <div className="bg-purple-100 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="bg-purple-600 h-full flex items-center px-3 text-white text-sm font-medium"
                                style={{
                                  width: `${(day.count / Math.max(...analytics.registrationsByDate.map(d => d.count))) * 100}%`,
                                  minWidth: '40px'
                                }}
                              >
                                {day.count}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Breakdown
                </CardTitle>
                <CardDescription>Daily revenue trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.dailyRevenue.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No revenue data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {analytics.dailyRevenue.map((day, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-32 text-sm text-gray-600">{day.date}</div>
                          <div className="flex-1">
                            <div className="bg-green-100 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="bg-green-600 h-full flex items-center px-3 text-white text-sm font-medium"
                                style={{
                                  width: `${(day.amount / Math.max(...analytics.dailyRevenue.map(d => d.amount))) * 100}%`,
                                  minWidth: '60px'
                                }}
                              >
                                ₹{day.amount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ticket Types Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Ticket Type Performance
                </CardTitle>
                <CardDescription>Sales breakdown by ticket type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.ticketTypeBreakdown.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No ticket data yet</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.ticketTypeBreakdown.map((ticket, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-lg">{ticket.name}</h4>
                              <p className="text-sm text-gray-600">{ticket.sold} tickets sold</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600">
                                ₹{ticket.revenue.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600">Total revenue</p>
                            </div>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-purple-600 h-full"
                              style={{
                                width: `${(ticket.sold / analytics.overview.totalRegistrations) * 100}%`
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {((ticket.sold / analytics.overview.totalRegistrations) * 100).toFixed(1)}% of total sales
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
