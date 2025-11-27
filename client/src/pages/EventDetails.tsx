import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Users, Clock, Star, Share2, Heart, Download, MessageSquare } from 'lucide-react';
import { Link, useRoute } from 'wouter';
import { StarRating } from '@/components/StarRating';
import { useAuth } from '@/contexts/AuthContext';

interface EventDetails {
  id: string;
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueLatitude: string | null;
  venueLongitude: string | null;
  maxCapacity: number;
  currentRegistrations: number;
  coverImageUrl: string | null;
  speakers: Array<{
    id: string;
    name: string;
    title: string;
    bio: string;
    photoUrl: string | null;
    credentials: string | null;
  }>;
  schedules: Array<{
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
  }>;
  tickets: Array<{
    id: string;
    name: string;
    description: string | null;
    basePricePaisa: number;
    gstPercentage: number;
    discountPercentage: number;
  }>;
  reviews: Array<{
    id: string;
    overallRating: number;
    reviewText: string | null;
    createdAt: string;
    userName: string | null;
  }>;
  averageRating: number;
  reviewCount: number;
  salon: {
    id: string;
    name: string;
    address: string;
  } | null;
  spotsLeft: number;
}

export default function EventDetails() {
  const [, params] = useRoute('/events/:slug');
  const slug = params?.slug;
  const [savedForLater, setSavedForLater] = useState(false);
  const { user } = useAuth();

  const { data: event, isLoading } = useQuery<EventDetails>({
    queryKey: [`/api/events/public/${slug}`],
    enabled: !!slug,
  });


  if (!slug) {
    return <div>Event not found</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full h-96" />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Event Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/events">
              <Button>Browse All Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lowestPriceTicket = event.tickets.reduce((min, ticket) => {
    const finalPrice = ticket.basePricePaisa * (1 - ticket.discountPercentage / 100) * (1 + ticket.gstPercentage / 100);
    return finalPrice < min ? finalPrice : min;
  }, Infinity);

  return (
    <div className="min-h-screen bg-background">
      {event.coverImageUrl ? (
        <div className="relative w-full h-96 bg-gradient-to-r from-purple-600 to-pink-600">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-96 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
          <Calendar className="h-24 w-24 text-white/50" />
        </div>
      )}

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                {event.salon && (
                  <p className="text-muted-foreground">
                    Hosted by <span className="font-semibold">{event.salon.name}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSavedForLater(!savedForLater)}
                >
                  <Heart className={`h-4 w-4 ${savedForLater ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {new Date(event.startDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-semibold">
                    {event.startTime} - {event.endTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{event.venueCity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Spots Left</p>
                  <p className="font-semibold">{event.spotsLeft} / {event.maxCapacity}</p>
                </div>
              </div>
            </div>

            {event.averageRating > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{event.averageRating}</span>
                <span className="text-muted-foreground">({event.reviewCount} reviews)</span>
              </div>
            )}

            <Separator className="my-6" />

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Starting from</p>
                <p className="text-3xl font-bold">
                  ₹{Math.floor(lowestPriceTicket / 100).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-muted-foreground">+ taxes</p>
              </div>
              <Link href={`/events/${slug}/register`}>
                <Button size="lg" disabled={event.spotsLeft === 0}>
                  {event.spotsLeft === 0 ? 'Sold Out' : 'Register Now'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="details" className="mb-8">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
            <TabsTrigger value="venue">Venue</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews {event.reviewCount > 0 && `(${event.reviewCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">About this Event</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>

                <Separator className="my-6" />

                <h3 className="text-xl font-semibold mb-4">Ticket Options</h3>
                <div className="space-y-4">
                  {event.tickets.map((ticket) => {
                    const basePrice = ticket.basePricePaisa / 100;
                    const discountedPrice = basePrice * (1 - ticket.discountPercentage / 100);
                    const finalPrice = discountedPrice * (1 + ticket.gstPercentage / 100);

                    return (
                      <div key={ticket.id} className="border rounded-lg p-4 flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{ticket.name}</h4>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                          )}
                          {ticket.discountPercentage > 0 && (
                            <Badge variant="secondary" className="mt-2">
                              {ticket.discountPercentage}% Off
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {ticket.discountPercentage > 0 && (
                            <p className="text-sm text-muted-foreground line-through">
                              ₹{basePrice.toLocaleString('en-IN')}
                            </p>
                          )}
                          <p className="text-2xl font-bold">
                            ₹{Math.floor(finalPrice).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-muted-foreground">inc. taxes</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agenda">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Event Schedule</h2>
                {event.schedules.length > 0 ? (
                  <div className="space-y-4">
                    {event.schedules.map((schedule) => (
                      <div key={schedule.id} className="border-l-4 border-purple-600 pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        <h4 className="font-semibold text-lg">{schedule.title}</h4>
                        {schedule.description && (
                          <p className="text-muted-foreground mt-1">{schedule.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Detailed schedule coming soon
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="speakers">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Speakers & Instructors</h2>
                {event.speakers.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {event.speakers.map((speaker) => (
                      <div key={speaker.id} className="flex gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={speaker.photoUrl || undefined} />
                          <AvatarFallback>{speaker.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{speaker.name}</h4>
                          {speaker.title && (
                            <p className="text-sm text-muted-foreground">{speaker.title}</p>
                          )}
                          {speaker.credentials && (
                            <p className="text-xs text-purple-600 mt-1">{speaker.credentials}</p>
                          )}
                          {speaker.bio && (
                            <p className="text-sm mt-2">{speaker.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Speaker information coming soon
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venue">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Venue Details</h2>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">{event.venueName}</h4>
                    <p className="text-muted-foreground">{event.venueAddress}</p>
                    <p className="text-muted-foreground">{event.venueCity}</p>
                  </div>
                  {event.venueLatitude && event.venueLongitude && (
                    <div>
                      <Button variant="outline" className="w-full md:w-auto">
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Directions
                      </Button>
                      <Button variant="ghost" className="w-full md:w-auto ml-2">
                        <Download className="h-4 w-4 mr-2" />
                        Add to Calendar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Reviews & Ratings</h2>
                    {event.averageRating > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <StarRating value={event.averageRating} readonly showValue />
                        <span className="text-sm text-muted-foreground">
                          Based on {event.reviewCount} {event.reviewCount === 1 ? 'review' : 'reviews'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Attended this event? Check your confirmation email for the review link.
                  </p>
                </div>

                <Separator className="my-6" />

                {event.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {event.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{review.userName || 'Anonymous'}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <StarRating value={review.overallRating} readonly size="sm" />
                          </div>
                        </div>
                        {review.reviewText && (
                          <p className="text-gray-700 whitespace-pre-wrap">{review.reviewText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to share your experience!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
