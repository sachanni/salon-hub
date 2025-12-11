import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles,
  Clock,
  Tag,
  Filter,
  BarChart3,
  Search,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PackageManagerProps {
  salonId: string;
  onCreatePackage: () => void;
  onEditPackage: (packageId: string) => void;
  onViewAnalytics: () => void;
}

interface ServicePackage {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  totalDurationMinutes: number;
  packagePriceInPaisa: number;
  regularPriceInPaisa: number;
  discountPercentage: number;
  isActive: number;
  isFeatured: number;
  bookingCount: number;
  validUntil?: string | null;
  services: Array<{ id: string; name: string; quantity?: number }>;
}

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
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function PackageManager({ salonId, onCreatePackage, onEditPackage, onViewAnalytics }: PackageManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/service-bundles/salons", salonId, "packages/manage"],
    queryFn: async () => {
      const res = await fetch(`/api/service-bundles/salons/${salonId}/packages/manage`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch packages");
      return res.json();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ packageId, isActive }: { packageId: string; isActive: boolean }) => {
      const res = await fetch(`/api/service-bundles/packages/${packageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-bundles/salons", salonId, "packages/manage"] });
      toast({ title: "Package updated", description: "Package status has been changed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update package.", variant: "destructive" });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ packageId, isFeatured }: { packageId: string; isFeatured: boolean }) => {
      const res = await fetch(`/api/service-bundles/packages/${packageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isFeatured }),
      });
      if (!res.ok) throw new Error("Failed to update package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-bundles/salons", salonId, "packages/manage"] });
      toast({ title: "Package updated", description: "Featured status has been changed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update package.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await fetch(`/api/service-bundles/packages/${packageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-bundles/salons", salonId, "packages/manage"] });
      toast({ title: "Package deleted", description: "Package has been deactivated." });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete package.", variant: "destructive" });
      setDeleteConfirm(null);
    },
  });

  const packages: ServicePackage[] = data?.packages || [];
  const categories: string[] = data?.categories || [];

  const filteredPackages = packages.filter((pkg) => {
    if (searchQuery && !pkg.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== "all" && pkg.category !== categoryFilter) {
      return false;
    }
    if (statusFilter === "active" && pkg.isActive !== 1) return false;
    if (statusFilter === "inactive" && pkg.isActive === 1) return false;
    if (statusFilter === "featured" && pkg.isFeatured !== 1) return false;
    return true;
  });

  const activeCount = packages.filter(p => p.isActive === 1).length;
  const featuredCount = packages.filter(p => p.isFeatured === 1).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-rose-500" />
            Service Packages
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {packages.length} packages ({activeCount} active, {featuredCount} featured)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onViewAnalytics}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={onCreatePackage} className="bg-rose-500 hover:bg-rose-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Package
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Tag className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPackages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              {packages.length === 0 ? "No packages yet" : "No matching packages"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {packages.length === 0 
                ? "Create your first service package to offer bundled discounts"
                : "Try adjusting your search or filters"
              }
            </p>
            {packages.length === 0 && (
              <Button onClick={onCreatePackage}>
                <Plus className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative transition-all ${pkg.isActive !== 1 ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {pkg.name}
                      </h3>
                      {pkg.isFeatured === 1 && (
                        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDuration(pkg.totalDurationMinutes)}
                      {pkg.category && (
                        <>
                          <span className="text-slate-300">•</span>
                          <Tag className="w-3 h-3" />
                          {pkg.category}
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditPackage(pkg.id)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => toggleFeaturedMutation.mutate({ 
                          packageId: pkg.id, 
                          isFeatured: pkg.isFeatured !== 1 
                        })}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {pkg.isFeatured === 1 ? 'Remove Featured' : 'Make Featured'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleActiveMutation.mutate({ 
                          packageId: pkg.id, 
                          isActive: pkg.isActive !== 1 
                        })}
                      >
                        {pkg.isActive === 1 ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setDeleteConfirm(pkg.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {pkg.services.slice(0, 3).map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-xs">
                      {s.name}{s.quantity && s.quantity > 1 ? ` ×${s.quantity}` : ''}
                    </Badge>
                  ))}
                  {pkg.services.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{pkg.services.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(pkg.packagePriceInPaisa)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 line-through">
                        {formatCurrency(pkg.regularPriceInPaisa)}
                      </span>
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        {pkg.discountPercentage}% off
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {pkg.bookingCount}
                    </div>
                    <div className="text-xs text-slate-500">bookings</div>
                  </div>
                </div>

                <div className="flex gap-1 mt-3">
                  <Badge 
                    variant={pkg.isActive === 1 ? "default" : "secondary"}
                    className={pkg.isActive === 1 ? "bg-green-500" : ""}
                  >
                    {pkg.isActive === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                  {pkg.validUntil && new Date(pkg.validUntil) > new Date() && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Limited Time
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the package and hide it from customers. 
              Existing bookings will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
