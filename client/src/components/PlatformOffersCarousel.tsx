import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformOffer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  validUntil: string;
  isPlatformWide: number;
}

interface PlatformOffersCarouselProps {
  offers: PlatformOffer[];
}

export function PlatformOffersCarousel({ offers }: PlatformOffersCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play functionality
  useEffect(() => {
    if (!emblaApi) return;
    
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);

    return () => clearInterval(autoplay);
  }, [emblaApi]);

  if (!offers || offers.length === 0) return null;

  // Filter only platform-wide offers
  const platformOffers = offers.filter(offer => offer.isPlatformWide === 1);
  
  if (platformOffers.length === 0) return null;

  return (
    <div className="bg-white border-t border-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Offers available for you
          </h2>
          
          {/* Text-based pagination (Luzo style) */}
          {platformOffers.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">
                {selectedIndex + 1}/{platformOffers.length}
              </span>
            </div>
          )}
        </div>
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {platformOffers.map((offer) => (
              <div
                key={offer.id}
                className="flex-[0_0_100%] sm:flex-[0_0_85%] md:flex-[0_0_55%] lg:flex-[0_0_45%] min-w-0"
                data-testid={`platform-offer-${offer.id}`}
              >
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 mb-1">
                        {offer.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 font-medium mb-2">
                        {offer.discountType === 'percentage' 
                          ? `${offer.discountValue}% Discount`
                          : `₹${offer.discountValue / 100} OFF`
                        }
                        {offer.description.includes('Cashback') && ' + 10% Cashback'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
