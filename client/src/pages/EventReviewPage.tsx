import { useState, useEffect } from "react";
import { useParams, useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Star, Calendar, MapPin, AlertCircle } from "lucide-react";
import { eventReviewSchema, type EventReviewInput } from "@shared/schema";

export default function EventReviewPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const [, routeParams] = useRoute("/events/:eventId/review");
  const { toast } = useToast();
  
  const eventSlug = params.eventId || routeParams?.eventId;
  const registrationId = new URLSearchParams(window.location.search).get("registrationId");

  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<EventReviewInput>({
    resolver: zodResolver(eventReviewSchema),
    mode: "onChange",
    defaultValues: {
      eventId: "",
      registrationId: registrationId || "",
      overallRating: 0,
      instructorRating: undefined,
      contentRating: undefined,
      venueRating: undefined,
      valueRating: undefined,
      organizationRating: undefined,
      reviewText: "",
    },
  });

  const reviewText = watch("reviewText") || "";

  const { data: event, isLoading: eventLoading } = useQuery<{
    id: string;
    title: string;
    startDate: string;
    venueName?: string;
  }>({
    queryKey: [`/api/events/public/${eventSlug}`],
    enabled: !!eventSlug,
  });

  useEffect(() => {
    if (event?.id) {
      setValue("eventId", event.id, { shouldValidate: true });
    }
  }, [event, setValue]);

  const { data: registrationData, isError: registrationError } = useQuery<{
    id: string;
    eventId: string;
    userId: string;
    status: string;
  }>({
    queryKey: [`/api/registrations/${registrationId}`],
    enabled: !!registrationId,
  });

  useEffect(() => {
    if (registrationData?.id) {
      setValue("registrationId", registrationData.id, { shouldValidate: true });
    }
  }, [registrationData, setValue]);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: EventReviewInput) => {
      const res = await fetch(`/api/events/${event?.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reviewData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit review");
      }

      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Review Submitted",
        description: "Thank you for sharing your feedback!",
      });
      setTimeout(() => {
        navigate(`/events/${eventSlug}`);
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventReviewInput) => {
    submitReviewMutation.mutate(data);
  };

  if (!eventSlug || !registrationId) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Required</h2>
            <p className="text-gray-600 mb-4">
              You need a valid registration to write a review. Reviews can only be submitted by attendees who have registered for this event.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-left">
              <p className="font-semibold mb-2">How to write a review:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Register and attend the event</li>
                <li>Check your email for the review link after the event</li>
                <li>Or access it from your registration confirmation page</li>
              </ol>
            </div>
            <Button onClick={() => navigate("/events")} className="w-full md:w-auto">
              Browse Events
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (registrationError) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't verify your registration for this event. Please check your registration details or contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/events")}>
                Browse Events
              </Button>
              <Button onClick={() => navigate(`/events/${eventSlug}`)}>
                View Event Details
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (eventLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Thank You for Your Review!</h2>
          <p className="text-gray-600 mb-4">
            Your feedback helps us improve and helps other attendees make informed decisions.
          </p>
          <p className="text-sm text-gray-500">Redirecting to event details...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Share Your Experience</h1>
          <p className="text-gray-600">
            Help others by sharing your honest feedback about this event
          </p>
        </div>

        {event && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {event.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {event.venueName && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venueName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">
                Overall Rating <span className="text-red-500">*</span>
              </span>
              <p className="text-xs text-gray-500 mb-2">
                How would you rate your overall experience?
              </p>
            </label>
            <Controller
              name="overallRating"
              control={control}
              render={({ field }) => (
                <div>
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    size="lg"
                  />
                  {errors.overallRating && (
                    <p className="text-sm text-red-600 mt-2">
                      {errors.overallRating.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Detailed Ratings (Optional)
            </h3>
            <div className="space-y-4">
              <Controller
                name="instructorRating"
                control={control}
                render={({ field }) => (
                  <StarRating
                    label="Instructor/Speaker"
                    value={field.value || 0}
                    onChange={field.onChange}
                    size="md"
                  />
                )}
              />

              <Controller
                name="contentRating"
                control={control}
                render={({ field }) => (
                  <StarRating
                    label="Content Quality"
                    value={field.value || 0}
                    onChange={field.onChange}
                    size="md"
                  />
                )}
              />

              <Controller
                name="venueRating"
                control={control}
                render={({ field }) => (
                  <StarRating
                    label="Venue & Facilities"
                    value={field.value || 0}
                    onChange={field.onChange}
                    size="md"
                  />
                )}
              />

              <Controller
                name="organizationRating"
                control={control}
                render={({ field }) => (
                  <StarRating
                    label="Event Organization"
                    value={field.value || 0}
                    onChange={field.onChange}
                    size="md"
                  />
                )}
              />

              <Controller
                name="valueRating"
                control={control}
                render={({ field }) => (
                  <StarRating
                    label="Value for Money"
                    value={field.value || 0}
                    onChange={field.onChange}
                    size="md"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">
                Your Review (Optional)
              </span>
              <p className="text-xs text-gray-500 mb-2">
                Share details about your experience to help others
              </p>
            </label>
            <Controller
              name="reviewText"
              control={control}
              render={({ field }) => (
                <div>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="What did you like most? What could be improved?"
                    rows={5}
                    maxLength={2000}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      {errors.reviewText && (
                        <p className="text-sm text-red-600">
                          {errors.reviewText.message}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {reviewText.length}/2000 characters
                    </p>
                  </div>
                </div>
              )}
            />
          </div>

          {submitReviewMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {submitReviewMutation.error instanceof Error
                  ? submitReviewMutation.error.message
                  : "Failed to submit review. Please try again."}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/events/${eventSlug}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || submitReviewMutation.isPending}
              className="flex-1"
            >
              {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
