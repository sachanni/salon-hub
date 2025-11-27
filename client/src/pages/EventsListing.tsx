import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Search, Star, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

interface Event {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  startDate: string;
  startTime: string;
  endTime: string;
  venueCity: string;
  venueName: string;
  maxCapacity: number;
  currentRegistrations: number;
  coverImageUrl: string | null;
  isFeatured: number;
  startingPricePaisa: number;
  spotsLeft: number;
}

interface EventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function EventsListing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<EventsResponse>({
    queryKey: ['/api/events/public', { page, search: searchQuery, sort: sortBy }],
  });

  const featuredEvents = data?.events.filter(e => e.isFeatured === 1) || [];
  const regularEvents = data?.events.filter(e => e.isFeatured === 0) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50">
      <div className="bg-gradient-to-br from-violet-600/90 via-purple-600/90 to-pink-600/90 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Amazing Events</h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Join workshops, masterclasses, and exclusive events at your favorite salons
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white text-gray-900"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-white text-gray-900">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Upcoming</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {featuredEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              Featured Events
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    {event.coverImageUrl ? (
                      <img
                        src={event.coverImageUrl}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-purple-400" />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <Badge className="mb-2">Featured</Badge>
                      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {event.shortDescription}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.startDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at {event.startTime}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.venueName}, {event.venueCity}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{event.spotsLeft} spots left</span>
                          </div>
                          <div className="font-semibold text-lg">
                            From ₹{(event.startingPricePaisa / 100).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">
            {featuredEvents.length > 0 ? 'More Events' : 'All Events'}
          </h2>
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : regularEvents.length > 0 ? (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {regularEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      {event.coverImageUrl ? (
                        <img
                          src={event.coverImageUrl}
                          alt={event.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <Calendar className="h-16 w-16 text-blue-400" />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {event.shortDescription}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.startDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.venueCity}
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            {event.spotsLeft <= 10 && event.spotsLeft > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                {event.spotsLeft} left
                              </Badge>
                            ) : event.spotsLeft === 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                Sold Out
                              </Badge>
                            ) : (
                              <span></span>
                            )}
                            <div className="font-semibold">
                              ₹{(event.startingPricePaisa / 100).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {data && data.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Check back soon for upcoming events'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
