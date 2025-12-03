import { Button } from "@/components/ui/button";
import { Filter, Grid3x3, MapIcon } from "lucide-react";

interface SearchResultsHeaderProps {
  salonCount: number;
  locationName: string;
  onOpenFilters: () => void;
  viewMode: 'grid' | 'map';
  onToggleView: (mode: 'grid' | 'map') => void;
}

const SearchResultsHeader = ({
  salonCount,
  locationName,
  onOpenFilters,
  viewMode,
  onToggleView,
}: SearchResultsHeaderProps) => {
  return (
    <div className="p-4 md:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl md:text-lg font-semibold text-gray-900">
            {salonCount} salons found
          </h2>
          <p className="text-base md:text-sm text-gray-600">
            Near {locationName || 'your location'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggleView('grid')}
              className="px-3 py-1.5 text-xs h-8"
            >
              <Grid3x3 className="w-3.5 h-3.5 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggleView('map')}
              className="px-3 py-1.5 text-xs h-8"
            >
              <MapIcon className="w-3.5 h-3.5 mr-1" />
              Map
            </Button>
          </div>
          
          {/* Filter Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 hover:bg-white/80"
            onClick={onOpenFilters}
            data-testid="button-open-filters"
          >
            <Filter className="w-5 h-5 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsHeader;
