import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, User, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  salonId: string;
  customerId?: string;
  customerName: string;
  customerPhoto?: string;
  rating: number;
  comment?: string;
  source: 'google' | 'salonhub';
  isVerified?: boolean;
  createdAt: string;
}

interface ReviewSectionProps {
  salonId: string;
}

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({ rating, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
};

const ReviewCardSkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const isGoogle = review.source === 'google';
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            {review.customerPhoto && (
              <AvatarImage src={review.customerPhoto} alt={review.customerName} />
            )}
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
              {review.customerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
              {isGoogle ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Google
                </Badge>
              ) : review.isVerified ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Customer
                </Badge>
              ) : null}
            </div>

            <div className="mb-2">
              <StarRating rating={review.rating} />
            </div>

            {review.comment && (
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                {review.comment}
              </p>
            )}

            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState: React.FC<{ filter: string }> = ({ filter }) => (
  <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed">
    <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
    <p className="text-lg font-medium text-gray-900 mb-2">No reviews yet</p>
    <p className="text-sm text-gray-600">
      {filter === 'all' 
        ? 'Be the first to share your experience!' 
        : `No ${filter === 'google' ? 'Google' : 'verified customer'} reviews yet`}
    </p>
  </div>
);

export const ReviewSection: React.FC<ReviewSectionProps> = ({ salonId }) => {
  const [filter, setFilter] = useState<'all' | 'google' | 'salonhub'>('all');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['salon-reviews', salonId, filter],
    queryFn: async (): Promise<Review[]> => {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('source', filter);
      }
      const response = await fetch(`/api/salons/${salonId}/reviews?${params.toString()}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!salonId,
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const reviewCount = reviews.length;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">{averageRating}</div>
            <StarRating rating={Math.round(parseFloat(averageRating))} size="md" />
            <p className="text-sm text-gray-600 mt-1">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</p>
          </div>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all">
            All Reviews
          </TabsTrigger>
          <TabsTrigger value="google">
            Google Reviews
          </TabsTrigger>
          <TabsTrigger value="salonhub">
            Verified Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {isLoading ? (
            <>
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
              <ReviewCardSkeleton />
            </>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <EmptyState filter={filter} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
