import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Calendar, Users, AlertTriangle, Info, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
  relatedEventId: string | null;
  relatedEventTitle: string | null;
}

export default function NotificationCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/events/business/notifications'],
    queryFn: async () => {
      const res = await fetch('/api/events/business/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/events/business/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/business/notifications'] });
    },
  });

  const getIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (type === 'new_registration') return <Users className="h-5 w-5 text-blue-500" />;
    if (type === 'event_starting_soon') return <Clock className="h-5 w-5 text-orange-500" />;
    if (type === 'low_attendance') return <TrendingUp className="h-5 w-5 text-yellow-500" />;
    return <Info className="h-5 w-5 text-gray-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const criticalCount = notifications?.filter(n => n.severity === 'critical' && !n.isRead).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-1/2 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  const readNotifications = notifications?.filter(n => n.isRead) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notification Center</h1>
            <p className="text-muted-foreground">
              Stay updated with your event activities
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {unreadCount} New
              </Badge>
            )}
          </div>
        </div>

        {criticalCount > 0 && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-900">Critical Alerts</h3>
                  <p className="text-sm text-red-700">
                    You have {criticalCount} critical {criticalCount === 1 ? 'notification' : 'notifications'} requiring immediate attention
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="unread" className="space-y-4">
          <TabsList>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">
                    You have no unread notifications
                  </p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => markAsReadMutation.mutate(notification.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex gap-4">
                      {getIcon(notification.type, notification.severity)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <Badge variant={getSeverityColor(notification.severity) as any}>
                            {notification.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.relatedEventId && (
                            <Link href={`/events/${notification.relatedEventId}`}>
                              <Button variant="ghost" size="sm" className="h-auto p-0">
                                View Event
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {!notifications || notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                  <p className="text-muted-foreground">
                    You'll see notifications here as events get activity
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`hover:shadow-md transition-shadow ${notification.isRead ? 'opacity-60' : ''}`}
                >
                  <CardContent className="py-4">
                    <div className="flex gap-4">
                      {getIcon(notification.type, notification.severity)}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                            <Badge variant={getSeverityColor(notification.severity) as any}>
                              {notification.severity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.relatedEventId && (
                            <Link href={`/events/${notification.relatedEventId}`}>
                              <Button variant="ghost" size="sm" className="h-auto p-0">
                                View Event
                              </Button>
                            </Link>
                          )}
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
