import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  sortBy: 'recommended' | 'nearest' | 'top-rated' | 'distance';
  maxPrice: number;
  venueType: 'everyone' | 'female-only' | 'male-only';
  instantBooking?: boolean;
  availableToday?: boolean;
  offerDeals?: boolean;
  acceptGroup?: boolean;
}

const FilterPanel = ({ isOpen, onClose, onApplyFilters, currentFilters }: FilterPanelProps) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  // Update local filters when currentFilters change
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      sortBy: 'recommended',
      maxPrice: 10000,
      venueType: 'everyone',
      instantBooking: false,
      availableToday: false,
      offerDeals: false,
      acceptGroup: false
    };
    setFilters(defaultFilters);
    onApplyFilters(defaultFilters);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        data-testid="filter-backdrop"
      />

      {/* Filter Panel - Dropdown from filter button (left-aligned) */}
      <div className={cn(
        "fixed left-4 right-4 top-20 h-[calc(100vh-6rem)] max-w-sm bg-white shadow-2xl z-50 rounded-2xl transform transition-all duration-300 ease-out overflow-hidden",
        "sm:left-8 sm:right-auto sm:max-w-sm md:max-w-md",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            data-testid="button-close-filters"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter Content */}
        <div className="overflow-y-auto h-[calc(100%-140px)] p-6 space-y-8">
          {/* Sort By Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sort by</h3>
            <RadioGroup
              value={filters.sortBy}
              onValueChange={(value) => setFilters({ ...filters, sortBy: value as FilterState['sortBy'] })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem 
                  value="recommended" 
                  id="recommended" 
                  className="border-purple-500 text-purple-600"
                  data-testid="radio-recommended"
                />
                <Label htmlFor="recommended" className="text-sm font-normal cursor-pointer">
                  Recommended
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem 
                  value="nearest" 
                  id="nearest" 
                  className="border-purple-500 text-purple-600"
                  data-testid="radio-nearest"
                />
                <Label htmlFor="nearest" className="text-sm font-normal cursor-pointer">
                  Nearest
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem 
                  value="top-rated" 
                  id="top-rated" 
                  className="border-purple-500 text-purple-600"
                  data-testid="radio-top-rated"
                />
                <Label htmlFor="top-rated" className="text-sm font-normal cursor-pointer">
                  Top-rated
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem 
                  value="distance" 
                  id="distance" 
                  className="border-purple-500 text-purple-600"
                  data-testid="radio-distance"
                />
                <Label htmlFor="distance" className="text-sm font-normal cursor-pointer">
                  Distance
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Maximum Price Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Maximum price</h3>
              <span className="text-lg font-semibold text-purple-600" data-testid="text-max-price">
                ₹{filters.maxPrice.toLocaleString()}
              </span>
            </div>
            <Slider
              value={[filters.maxPrice]}
              onValueChange={(value) => setFilters({ ...filters, maxPrice: value[0] })}
              min={0}
              max={10000}
              step={500}
              className="w-full"
              data-testid="slider-max-price"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>₹0</span>
              <span>₹10,000</span>
            </div>
          </div>

          {/* Venue Type Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Venue type</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setFilters({ ...filters, venueType: 'everyone' })}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                  filters.venueType === 'everyone'
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                data-testid="button-venue-everyone"
              >
                Everyone
              </button>
              <button
                onClick={() => setFilters({ ...filters, venueType: 'female-only' })}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                  filters.venueType === 'female-only'
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                data-testid="button-venue-female"
              >
                Female only
              </button>
              <button
                onClick={() => setFilters({ ...filters, venueType: 'male-only' })}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                  filters.venueType === 'male-only'
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                data-testid="button-venue-male"
              >
                Male only
              </button>
            </div>
          </div>

          {/* Booking Options Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Booking options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.instantBooking || false}
                  onChange={(e) => setFilters({ ...filters, instantBooking: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  data-testid="checkbox-instant-booking"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Instant booking</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.availableToday || false}
                  onChange={(e) => setFilters({ ...filters, availableToday: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  data-testid="checkbox-available-today"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Available today</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.offerDeals || false}
                  onChange={(e) => setFilters({ ...filters, offerDeals: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  data-testid="checkbox-offer-deals"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Offer deals</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.acceptGroup || false}
                  onChange={(e) => setFilters({ ...filters, acceptGroup: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  data-testid="checkbox-accept-group"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Accept group</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              data-testid="button-reset-filters"
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-apply-filters"
            >
              Apply filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
