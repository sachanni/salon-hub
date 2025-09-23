import { Button } from "@/components/ui/button";
import SearchBar from "./SearchBar";
import heroImage from '@assets/generated_images/Modern_luxury_salon_interior_aa8eed5a.png';

interface SearchParams {
  coordinates?: { lat: number; lng: number };
  radius?: number;
  service?: string;
  category?: string;
  sortBy?: string;
  filters?: {
    priceRange?: [number, number];
    minRating?: number;
    availableToday?: boolean;
    specificServices?: string[];
  };
}

interface HeroProps {
  onSearch?: (params: SearchParams) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const handleGetApp = () => {
    console.log('Get app clicked');
  };

  return (
    <section className="relative min-h-[600px] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Modern salon interior"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 
            data-testid="text-hero-title"
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Book local beauty and wellness services
          </h1>
          
          <p 
            data-testid="text-hero-subtitle"
            className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto"
          >
            Discover and book appointments at top-rated salons, spas, and wellness centers near you
          </p>

          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar onSearch={onSearch} />
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">455,219</p>
              <p className="text-sm text-white/80">appointments booked today</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                data-testid="button-get-app"
                variant="outline" 
                onClick={handleGetApp}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                Get the app
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}