import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { 
  Calendar, 
  Clock, 
  RefreshCw, 
  Sparkles, 
  User, 
  ChevronRight,
  X,
  Bell,
  MoreVertical,
  Gift,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface RebookingSuggestion {
  serviceId: string;
  serviceName: string;
  salonId: string;
  salonName: string;
  lastBookingDate: string;
  dueDate: string;
  daysOverdue: number;
  status: 'approaching' | 'due' | 'overdue';
  preferredStaffId?: string;
  preferredStaffName?: string;
  preferredDayOfWeek?: number;
  preferredTimeSlot?: string;
  discountAvailable?: boolean;
  discountPercent?: number;
}

export default function RebookingSuggestions() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { data: suggestions, isLoading, error } = useQuery<RebookingSuggestion[]>({
    queryKey: ['/api/rebooking/suggestions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/rebooking/suggestions');
      return response.json();
    },
    enabled: isAuthenticated && !!user,
  });

  const dismissMutation = useMutation({
    mutationFn: async ({ serviceId, salonId, reason, snoozeDays }: { 
      serviceId: string; 
      salonId: string;
      reason: string; 
      snoozeDays?: number 
    }) => {
      return apiRequest('POST', '/api/rebooking/dismiss', {
        serviceId,
        salonId,
        reason,
        snoozeDays
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rebooking/suggestions'] });
      toast({
        title: "Reminder updated",
        description: "We'll remind you later",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    }
  });

  const handleDismiss = (suggestion: RebookingSuggestion, reason: string, snoozeDays?: number) => {
    setDismissedIds(prev => new Set([...prev, `${suggestion.salonId}-${suggestion.serviceId}`]));
    dismissMutation.mutate({
      serviceId: suggestion.serviceId,
      salonId: suggestion.salonId,
      reason,
      snoozeDays
    });
  };

  const handleBookNow = (suggestion: RebookingSuggestion) => {
    setLocation(`/salon/${suggestion.salonId}?service=${suggestion.serviceId}`);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-80 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !suggestions || suggestions.length === 0) {
    return null;
  }

  const visibleSuggestions = suggestions.filter(
    s => !dismissedIds.has(`${s.salonId}-${s.serviceId}`)
  );

  if (visibleSuggestions.length === 0) {
    return null;
  }

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'due':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'approaching':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'due':
        return 'Due Now';
      case 'approaching':
        return 'Coming Up';
      default:
        return status;
    }
  };

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
              <p className="text-sm text-gray-600">Based on your previous visits</p>
            </div>
          </div>
          {visibleSuggestions.length > 3 && (
            <Badge variant="secondary" className="hidden sm:flex gap-1">
              <Bell className="h-3 w-3" />
              {visibleSuggestions.length} services due
            </Badge>
          )}
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {visibleSuggestions.map((suggestion) => (
              <Card 
                key={`${suggestion.salonId}-${suggestion.serviceId}`}
                className="w-80 flex-shrink-0 border-violet-100 hover:shadow-lg hover:shadow-violet-100 transition-all duration-300 overflow-hidden group"
              >
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDismiss(suggestion, 'snooze', 7)}>
                          <Clock className="h-4 w-4 mr-2" />
                          Remind me in 7 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDismiss(suggestion, 'snooze', 14)}>
                          <Clock className="h-4 w-4 mr-2" />
                          Remind me in 2 weeks
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDismiss(suggestion, 'snooze', 30)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Remind me in a month
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDismiss(suggestion, 'not_interested')}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Not interested
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="h-6 w-6 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <CardTitle className="text-base font-semibold text-gray-900 truncate">
                        {suggestion.serviceName}
                      </CardTitle>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        at {suggestion.salonName}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(suggestion.status)} font-medium`}
                    >
                      {suggestion.status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {getStatusLabel(suggestion.status)}
                    </Badge>
                    
                    {suggestion.discountAvailable && suggestion.discountPercent && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                        <Gift className="h-3 w-3 mr-1" />
                        {suggestion.discountPercent}% off
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      Last visit: {suggestion.lastBookingDate ? (
                        formatDistanceToNow(new Date(suggestion.lastBookingDate), { addSuffix: true })
                      ) : 'Unknown'}
                    </div>
                    
                    {suggestion.preferredStaffName && (
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        With {suggestion.preferredStaffName}
                      </div>
                    )}

                    {suggestion.preferredDayOfWeek !== undefined && suggestion.preferredTimeSlot && (
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        Usually {getDayName(suggestion.preferredDayOfWeek)} {suggestion.preferredTimeSlot}
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md shadow-violet-200"
                    onClick={() => handleBookNow(suggestion)}
                  >
                    Book Again
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
