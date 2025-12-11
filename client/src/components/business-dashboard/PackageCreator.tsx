import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Package, 
  Check, 
  Clock, 
  Plus, 
  Minus, 
  Tag,
  Calendar,
  Sparkles,
  AlertCircle,
  Image
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PackageCreatorProps {
  salonId: string;
  packageId?: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

interface Service {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceInPaisa: number;
  categoryId?: string | null;
  isActive: number;
}

const CATEGORIES = [
  "Bridal",
  "Party",
  "Grooming",
  "Spa Day",
  "Weekend Special",
  "Festival",
  "Seasonal",
  "First Time",
  "Couples",
  "Men's Essential",
  "Women's Essential",
  "Quick Refresh",
  "Full Makeover"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatCurrency(paisa: number): string {
  const rupees = paisa / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

interface ServiceSelection {
  serviceId: string;
  quantity: number;
}

export function PackageCreator({ salonId, packageId, onBack, onSuccess }: PackageCreatorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [gender, setGender] = useState<string>("unisex");
  const [imageUrl, setImageUrl] = useState("");
  const [serviceSelections, setServiceSelections] = useState<ServiceSelection[]>([]);
  const [packagePrice, setPackagePrice] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [validFrom, setValidFrom] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [minAdvanceHours, setMinAdvanceHours] = useState<string>("");
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState<string>("");
  const [availableDays, setAvailableDays] = useState<string[]>(DAYS);
  const [availableTimeStart, setAvailableTimeStart] = useState<string>("");
  const [availableTimeEnd, setAvailableTimeEnd] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servicesData } = useQuery({
    queryKey: ["/api/salons", salonId, "services"],
    queryFn: async () => {
      const res = await fetch(`/api/salons/${salonId}/services`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  const { data: existingPackage } = useQuery({
    queryKey: ["/api/service-bundles/packages", packageId],
    queryFn: async () => {
      if (!packageId) return null;
      const res = await fetch(`/api/service-bundles/packages/${packageId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch package");
      return res.json();
    },
    enabled: !!packageId,
  });

  useEffect(() => {
    if (existingPackage?.package) {
      const pkg = existingPackage.package;
      setName(pkg.name);
      setDescription(pkg.description || "");
      setCategory(pkg.category || "");
      setGender(pkg.gender || "unisex");
      setImageUrl(pkg.imageUrl || "");
      setServiceSelections(pkg.services.map((s: any) => ({ 
        serviceId: s.id, 
        quantity: s.quantity || 1 
      })));
      setPackagePrice(pkg.packagePriceInPaisa / 100);
      setIsFeatured(pkg.isFeatured === 1);
      setValidFrom(pkg.validFrom ? pkg.validFrom.split('T')[0] : "");
      setValidUntil(pkg.validUntil ? pkg.validUntil.split('T')[0] : "");
      setMinAdvanceHours(pkg.minAdvanceBookingHours?.toString() || "");
      setMaxBookingsPerDay(pkg.maxBookingsPerDay?.toString() || "");
      setAvailableDays(pkg.availableDays || DAYS);
      setAvailableTimeStart(pkg.availableTimeStart || "");
      setAvailableTimeEnd(pkg.availableTimeEnd || "");
    }
  }, [existingPackage]);

  const services: Service[] = servicesData?.services || servicesData || [];
  const activeServices = services.filter((s) => s.isActive === 1);

  const serviceMap = new Map(activeServices.map(s => [s.id, s]));
  
  const totalServiceCount = serviceSelections.reduce((sum, sel) => sum + sel.quantity, 0);
  
  let totalDuration = 0;
  let regularPrice = 0;
  for (const sel of serviceSelections) {
    const service = serviceMap.get(sel.serviceId);
    if (service) {
      totalDuration += service.durationMinutes * sel.quantity;
      regularPrice += service.priceInPaisa * sel.quantity;
    }
  }
  
  const packagePriceInPaisa = packagePrice * 100;
  const discount = regularPrice > 0 
    ? Math.round(((regularPrice - packagePriceInPaisa) / regularPrice) * 100)
    : 0;
  const savings = regularPrice - packagePriceInPaisa;

  const isValid = 
    name.trim() !== "" &&
    totalServiceCount >= 2 &&
    packagePriceInPaisa > 0 &&
    packagePriceInPaisa < regularPrice &&
    discount <= 50;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || undefined,
        category: category || undefined,
        gender: gender as any,
        imageUrl: imageUrl || undefined,
        services: serviceSelections,
        packagePriceInPaisa,
        isFeatured,
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
        minAdvanceBookingHours: minAdvanceHours ? parseInt(minAdvanceHours) : undefined,
        maxBookingsPerDay: maxBookingsPerDay ? parseInt(maxBookingsPerDay) : undefined,
        availableDays: availableDays.length === 7 ? undefined : availableDays,
        availableTimeStart: availableTimeStart || undefined,
        availableTimeEnd: availableTimeEnd || undefined,
      };

      const url = packageId 
        ? `/api/service-bundles/packages/${packageId}`
        : `/api/service-bundles/salons/${salonId}/packages`;
      
      const res = await fetch(url, {
        method: packageId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save package");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-bundles/salons", salonId] });
      toast({ 
        title: packageId ? "Package updated" : "Package created",
        description: "Your service package has been saved successfully."
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const toggleService = (serviceId: string) => {
    setServiceSelections((prev) => {
      const existing = prev.find(s => s.serviceId === serviceId);
      if (existing) {
        return prev.filter(s => s.serviceId !== serviceId);
      } else {
        return [...prev, { serviceId, quantity: 1 }];
      }
    });
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) {
      setServiceSelections(prev => prev.filter(s => s.serviceId !== serviceId));
    } else if (quantity <= 10) {
      setServiceSelections(prev => 
        prev.map(s => s.serviceId === serviceId ? { ...s, quantity } : s)
      );
    }
  };

  const getServiceQuantity = (serviceId: string): number => {
    return serviceSelections.find(s => s.serviceId === serviceId)?.quantity || 0;
  };

  const isServiceSelected = (serviceId: string): boolean => {
    return serviceSelections.some(s => s.serviceId === serviceId);
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {packageId ? "Edit Package" : "Create Package"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Bundle services together with a discount
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Package Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Bridal Bliss Package"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this package includes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gender">Target Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unisex">All Genders</SelectItem>
                      <SelectItem value="female">Women Only</SelectItem>
                      <SelectItem value="male">Men Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <div className="flex gap-2">
                    <Image className="w-5 h-5 text-slate-400 mt-2.5" />
                    <Input
                      id="imageUrl"
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Select Services (min 2 instances)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeServices.length === 0 ? (
                <p className="text-slate-500 text-center py-6">No active services found</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeServices.map((service) => {
                    const selected = isServiceSelected(service.id);
                    const quantity = getServiceQuantity(service.id);
                    return (
                      <div
                        key={service.id}
                        className={`p-3 rounded-lg border transition-all ${
                          selected 
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => toggleService(service.id)}
                          >
                            <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                              {service.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(service.durationMinutes)}
                              <span>•</span>
                              {formatCurrency(service.priceInPaisa)}
                            </div>
                          </div>
                          {selected ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateServiceQuantity(service.id, quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateServiceQuantity(service.id, quantity + 1)}
                                disabled={quantity >= 10}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Checkbox 
                              checked={selected} 
                              className="mt-0.5 cursor-pointer" 
                              onClick={() => toggleService(service.id)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Availability Settings (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Available Time (Start)</Label>
                  <Input
                    type="time"
                    value={availableTimeStart}
                    onChange={(e) => setAvailableTimeStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Available Time (End)</Label>
                  <Input
                    type="time"
                    value={availableTimeEnd}
                    onChange={(e) => setAvailableTimeEnd(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Min Advance Booking (hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 24"
                    value={minAdvanceHours}
                    onChange={(e) => setMinAdvanceHours(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Max Bookings Per Day</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={maxBookingsPerDay}
                    onChange={(e) => setMaxBookingsPerDay(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Available Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <Badge
                      key={day}
                      variant={availableDays.includes(day) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {totalServiceCount < 2 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Select at least 2 service instances</span>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Service instances ({totalServiceCount})</span>
                  <span>{formatCurrency(regularPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Duration</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="packagePrice">Package Price (₹) *</Label>
                <Input
                  id="packagePrice"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0"
                  value={packagePrice || ""}
                  onChange={(e) => setPackagePrice(parseFloat(e.target.value) || 0)}
                  className="text-lg font-bold"
                />
              </div>

              {packagePriceInPaisa > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Discount</span>
                    <Badge className={discount > 50 ? "bg-red-500" : discount > 0 ? "bg-green-500" : ""}>
                      {discount}%
                    </Badge>
                  </div>
                  {discount > 50 && (
                    <p className="text-xs text-red-500">Discount cannot exceed 50%</p>
                  )}
                  {discount <= 0 && regularPrice > 0 && (
                    <p className="text-xs text-red-500">Package price must be less than regular price</p>
                  )}
                  {discount > 0 && discount <= 50 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Customer Saves</span>
                      <span>{formatCurrency(savings)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <Label htmlFor="featured" className="cursor-pointer">Featured</Label>
                </div>
                <Switch
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                />
              </div>

              <Button 
                className="w-full bg-rose-500 hover:bg-rose-600"
                disabled={!isValid || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving..." : packageId ? "Update Package" : "Create Package"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
