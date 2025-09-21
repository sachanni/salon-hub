import { Search, MapPin, Calendar, Scissors, Paintbrush2, Sparkles, Dumbbell, Heart, Star, SlidersHorizontal, LayoutGrid, ChevronDown, Zap, Smile, User, Stethoscope, Brain, ArrowUpDown, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

const serviceCategories = [
  // Popular categories (shown in top row)
  { id: "hair", label: "Hair", icon: Scissors, group: "Beauty", popular: true, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { id: "facials", label: "Facials & Skincare", icon: Sparkles, group: "Skin & Aesthetics", popular: true, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "nails", label: "Nails", icon: Paintbrush2, group: "Beauty", popular: true, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "massage", label: "Massage", icon: Heart, group: "Body & Wellness", popular: true, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "hair-removal", label: "Hair Removal", icon: Zap, group: "Skin & Aesthetics", popular: true, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, group: "Body & Wellness", popular: true, color: "bg-red-500/10 text-red-700 dark:text-red-300" },
  
  // Additional categories (shown in "More" section)
  { id: "makeup", label: "Makeup", icon: Smile, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "injectables", label: "Injectables & Fillers", icon: User, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "body-treatments", label: "Body Treatments", icon: Heart, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "tattoo-piercing", label: "Tattoo & Piercing", icon: Zap, group: "Specialty", popular: false, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { id: "medical-dental", label: "Medical & Dental", icon: Stethoscope, group: "Clinical", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "counseling", label: "Counseling & Holistic", icon: Brain, group: "Mind & Holistic", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
];

const categoryGroups = [
  "Beauty",
  "Skin & Aesthetics", 
  "Body & Wellness",
  "Specialty",
  "Clinical",
  "Mind & Holistic"
];

export default function SearchBar() {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [availableToday, setAvailableToday] = useState(false);
  const [specificServices, setSpecificServices] = useState<string[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [showServicesFilter, setShowServicesFilter] = useState(false);

  const popularCategories = serviceCategories.filter(cat => cat.popular);
  const hiddenCategoriesCount = serviceCategories.filter(cat => !cat.popular).length;

  // Fetch all services for specific services filter
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const services = await response.json();
          setAllServices(services);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSearch = async () => {
    try {
      // Build search parameters
      const searchParams = new URLSearchParams();
      
      if (service.trim()) {
        searchParams.append('service', service.trim());
      }
      
      if (location.trim()) {
        searchParams.append('location', location.trim());
      }
      
      if (selectedCategories.length > 0) {
        // Map category IDs to readable category names for search
        const categoryNames = selectedCategories.map(id => {
          const category = serviceCategories.find(cat => cat.id === id);
          return category?.label || id;
        });
        searchParams.append('categories', categoryNames.join(','));
      }
      
      if (priceRange[0] > 0) {
        searchParams.append('minPrice', priceRange[0].toString());
      }
      
      if (priceRange[1] < 5000) {
        searchParams.append('maxPrice', priceRange[1].toString());
      }
      
      if (minRating > 0) {
        searchParams.append('minRating', minRating.toString());
      }

      if (sortBy) {
        searchParams.append('sortBy', sortBy);
      }

      if (availableToday) {
        searchParams.append('availableToday', 'true');
      }

      if (specificServices.length > 0) {
        searchParams.append('services', specificServices.join(','));
      }

      // Make the search API call
      const response = await fetch(`/api/salons?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const results = await response.json();
      
      // For now, log the results - you may want to navigate to a results page
      // or update the parent component to show results
      console.log('Search results:', results);
      
      // You can emit this data to parent component or navigate to results page
      // For example: onSearchResults?.(results);
      
    } catch (error) {
      console.error('Search error:', error);
      // You may want to show an error toast here
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 5000]);
    setMinRating(0);
    setSortBy("");
    setAvailableToday(false);
    setSpecificServices([]);
  };

  const hasActiveFilters = selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000 || minRating > 0 || sortBy || availableToday || specificServices.length > 0;

  return (
    <div className="bg-white dark:bg-card p-6 rounded-xl shadow-lg max-w-6xl mx-auto space-y-6">
      {/* Service Categories */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Popular categories</p>
        <div className="flex items-start gap-2">
          {/* Horizontal scrollable popular categories */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {popularCategories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <Button
                      key={category.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryToggle(category.id)}
                      data-testid={`button-category-${category.id}`}
                      className={`gap-2 whitespace-nowrap ${!isSelected ? category.color : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{category.label}</span>
                      <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                    </Button>
                  );
                })}
                
                {/* More Categories Button */}
                {hiddenCategoriesCount > 0 && (
                  <Popover open={showMoreCategories} onOpenChange={setShowMoreCategories}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1 whitespace-nowrap shrink-0 min-w-fit text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950"
                        data-testid="button-category-more"
                        aria-label={`Show ${hiddenCategoriesCount} more categories`}
                        aria-expanded={showMoreCategories}
                        aria-controls="more-categories-popover"
                      >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">All categories</span>
                        <span className="sm:hidden">More</span>
                        <Badge variant="outline" className="h-4 min-w-4 rounded-full px-1 text-xs">
                          {hiddenCategoriesCount}
                        </Badge>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0" align="end" id="more-categories-popover">
                      <Command>
                        <CommandInput 
                          placeholder="Search categories..." 
                          data-testid="input-category-search"
                        />
                        <CommandList>
                          <CommandEmpty>No categories found.</CommandEmpty>
                          <ScrollArea className="max-h-80">
                            {categoryGroups.map((group) => {
                              const groupCategories = serviceCategories.filter(cat => cat.group === group && !cat.popular);
                              if (groupCategories.length === 0) return null;
                              
                              return (
                                <CommandGroup key={group} heading={group}>
                                  {groupCategories.map((category) => {
                                    const Icon = category.icon;
                                    const isSelected = selectedCategories.includes(category.id);
                                    return (
                                      <CommandItem
                                        key={category.id}
                                        onSelect={() => handleCategoryToggle(category.id)}
                                        data-testid={`command-item-category-${category.id}`}
                                        className="flex items-center gap-2"
                                      >
                                        <div className={`flex items-center justify-center w-5 h-5 rounded border-2 ${
                                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                        }`}>
                                          {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                                        </div>
                                        <Icon className="h-4 w-4" />
                                        <span>{category.label}</span>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              );
                            })}
                          </ScrollArea>
                        </CommandList>
                        <div className="p-3 border-t">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCategories([])}
                              className="flex-1"
                              data-testid="button-clear-categories"
                            >
                              Clear all
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setShowMoreCategories(false)}
                              className="flex-1"
                              data-testid="button-apply-categories"
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Service Search */}
        <div className="md:col-span-4 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">What are you looking for?</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              data-testid="input-service"
              placeholder="Search treatments, salons..."
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Location */}
        <div className="md:col-span-3 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Where?</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              data-testid="input-location"
              placeholder="City, area, or postcode"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Date */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">When?</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              data-testid="input-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Filters</label>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full h-12 gap-2"
                data-testid="button-filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {selectedCategories.length + 
                     (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0) + 
                     (minRating > 0 ? 1 : 0) + 
                     (sortBy ? 1 : 0) + 
                     (availableToday ? 1 : 0) + 
                     specificServices.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      data-testid="button-clear-filters"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Price range</label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={5000}
                      step={50}
                      className="w-full"
                      data-testid="slider-price-range"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}{priceRange[1] === 5000 ? '+' : ''}</span>
                  </div>
                </div>

                {/* Enhanced Rating Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Minimum rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={minRating >= rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                        className="flex-1 gap-1"
                        data-testid={`button-rating-${rating}`}
                      >
                        <Star className={`h-3 w-3 ${minRating >= rating ? 'fill-current' : ''}`} />
                        {rating}
                      </Button>
                    ))}
                  </div>
                  {minRating > 0 && (
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-3 w-3 ${star <= minRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span>and above</span>
                    </div>
                  )}
                </div>

                {/* Sorting Options */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Sort by</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger data-testid="select-sort-by">
                      <SelectValue placeholder="Choose sorting..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Best match</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="distance">Nearest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability Filter */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="available-today" 
                      checked={availableToday}
                      onCheckedChange={setAvailableToday}
                      data-testid="checkbox-available-today"
                    />
                    <label htmlFor="available-today" className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Available today
                    </label>
                  </div>
                </div>

                {/* Specific Services Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Specific services</label>
                  <Popover open={showServicesFilter} onOpenChange={setShowServicesFilter}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between" data-testid="button-specific-services">
                        <span>
                          {specificServices.length > 0 
                            ? `${specificServices.length} service${specificServices.length > 1 ? 's' : ''} selected`
                            : 'Select services...'
                          }
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search services..." data-testid="input-service-search" />
                        <CommandList>
                          <CommandEmpty>No services found.</CommandEmpty>
                          <ScrollArea className="max-h-60">
                            <CommandGroup>
                              {allServices.map((service) => {
                                const isSelected = specificServices.includes(service.id);
                                return (
                                  <CommandItem
                                    key={service.id}
                                    onSelect={() => {
                                      setSpecificServices(prev => 
                                        isSelected 
                                          ? prev.filter(id => id !== service.id)
                                          : [...prev, service.id]
                                      );
                                    }}
                                    data-testid={`command-item-service-${service.id}`}
                                    className="flex items-center gap-2"
                                  >
                                    <div className={`flex items-center justify-center w-4 h-4 rounded border ${
                                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                    }`}>
                                      {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{service.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        ₹{Math.round(service.priceInPaisa / 100)} • {service.durationMinutes}min
                                        {service.category && ` • ${service.category}`}
                                      </div>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </ScrollArea>
                        </CommandList>
                        <div className="p-3 border-t">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSpecificServices([])}
                              className="flex-1"
                              data-testid="button-clear-services"
                            >
                              Clear all
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setShowServicesFilter(false)}
                              className="flex-1"
                              data-testid="button-apply-services"
                            >
                              Done ({specificServices.length})
                            </Button>
                          </div>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Button */}
        <div className="md:col-span-1">
          <Button 
            data-testid="button-search"
            onClick={handleSearch}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {selectedCategories.map((categoryId) => {
            const category = serviceCategories.find(c => c.id === categoryId);
            return (
              <Badge
                key={categoryId}
                variant="secondary"
                className="gap-1"
                data-testid={`badge-active-category-${categoryId}`}
              >
                {category?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleCategoryToggle(categoryId)}
                  data-testid={`button-remove-category-${categoryId}`}
                  aria-label={`Remove ${category?.label} filter`}
                >
                  ×
                </Button>
              </Badge>
            );
          })}
          {(priceRange[0] > 0 || priceRange[1] < 5000) && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-price">
              ₹{priceRange[0]} - ₹{priceRange[1]}{priceRange[1] === 5000 ? '+' : ''}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setPriceRange([0, 5000])}
                data-testid="button-remove-price"
                aria-label="Remove price filter"
              >
                ×
              </Button>
            </Badge>
          )}
          {sortBy && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-sort">
              <ArrowUpDown className="h-3 w-3" />
              Sort: {sortBy === 'price-low' ? 'Price Low' : 
                     sortBy === 'price-high' ? 'Price High' : 
                     sortBy === 'rating' ? 'Rating' : 
                     sortBy === 'newest' ? 'Newest' : 
                     sortBy === 'distance' ? 'Distance' : sortBy}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setSortBy("")}
                data-testid="button-remove-sort"
                aria-label="Remove sort filter"
              >
                ×
              </Button>
            </Badge>
          )}
          {availableToday && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-availability">
              <Clock className="h-3 w-3" />
              Available today
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setAvailableToday(false)}
                data-testid="button-remove-availability"
                aria-label="Remove availability filter"
              >
                ×
              </Button>
            </Badge>
          )}
          {specificServices.length > 0 && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-services">
              <CheckCircle className="h-3 w-3" />
              {specificServices.length} service{specificServices.length > 1 ? 's' : ''}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setSpecificServices([])}
                data-testid="button-remove-services"
                aria-label="Remove services filter"
              >
                ×
              </Button>
            </Badge>
          )}
          {minRating > 0 && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-rating">
              <Star className="h-3 w-3" />
              {minRating}+ stars
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setMinRating(0)}
                data-testid="button-remove-rating"
                aria-label="Remove rating filter"
              >
                ×
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}