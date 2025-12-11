import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
  Settings,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PricingRule {
  id: string;
  salonId: string;
  name: string;
  ruleType: 'off_peak_discount' | 'peak_surcharge' | 'happy_hour' | 'seasonal';
  dayOfWeek: number | null;
  startHour: number;
  endHour: number;
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
  maxDiscountPaisa: number | null;
  minBookingValuePaisa: number | null;
  applicableServiceIds: string[] | null;
  validFrom: string | null;
  validUntil: string | null;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

interface PricingRuleEditorProps {
  salonId: string;
}

const RULE_TYPES = [
  { value: 'off_peak_discount', label: 'Off-Peak Discount', description: 'Discount during quiet hours' },
  { value: 'peak_surcharge', label: 'Peak Surcharge', description: 'Extra charge during busy hours' },
  { value: 'happy_hour', label: 'Happy Hour', description: 'Special time-limited discount' },
  { value: 'seasonal', label: 'Seasonal', description: 'Holiday or seasonal pricing' },
];

const ADJUSTMENT_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount (₹)' },
];

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, '0')}:00`,
}));

function RuleCard({ rule, onEdit, onDelete, onToggle }: { 
  rule: PricingRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (active: boolean) => void;
}) {
  const isDiscount = rule.adjustmentValue < 0;
  const displayValue = Math.abs(rule.adjustmentValue);
  const valueLabel = rule.adjustmentType === 'percentage' 
    ? `${displayValue}%` 
    : `₹${displayValue / 100}`;

  return (
    <Card className={`${!rule.isActive ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{rule.name}</h3>
              <Badge variant="outline" className="text-xs">
                {RULE_TYPES.find(t => t.value === rule.ruleType)?.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {isDiscount ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <TrendingDown className="h-4 w-4" />
                  {valueLabel} discount
                </span>
              ) : (
                <span className="flex items-center gap-1 text-orange-600">
                  <TrendingUp className="h-4 w-4" />
                  {valueLabel} surcharge
                </span>
              )}
              {rule.dayOfWeek !== null && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {DAYS_OF_WEEK[rule.dayOfWeek].label}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {rule.startHour.toString().padStart(2, '0')}:00 - {rule.endHour.toString().padStart(2, '0')}:00
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.isActive}
              onCheckedChange={onToggle}
            />
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Pricing Rule</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{rule.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PricingRuleEditor({ salonId }: PricingRuleEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    ruleType: 'off_peak_discount' | 'peak_surcharge' | 'happy_hour' | 'seasonal';
    adjustmentType: 'percentage' | 'fixed';
    adjustmentValue: string;
    dayOfWeek: string;
    startHour: string;
    endHour: string;
    priority: string;
  }>({
    name: "",
    ruleType: "off_peak_discount",
    adjustmentType: "percentage",
    adjustmentValue: "",
    dayOfWeek: "",
    startHour: "9",
    endHour: "12",
    priority: "0",
  });

  const { data, isLoading } = useQuery<{ rules: PricingRule[] }>({
    queryKey: ["pricing-rules", salonId],
    queryFn: async () => {
      const res = await fetch(`/api/dynamic-pricing/salons/${salonId}/pricing-rules`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch rules");
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const conflicts = useMemo(() => {
    if (!data?.rules) return { hasConflict: false, conflictingRules: [] as PricingRule[], message: '' };
    
    const startHour = parseInt(formData.startHour);
    const endHour = parseInt(formData.endHour);
    const dayOfWeek = formData.dayOfWeek ? parseInt(formData.dayOfWeek) : null;
    
    const conflictingRules = data.rules.filter(rule => {
      if (editingRule && rule.id === editingRule.id) return false;
      if (!rule.isActive) return false;
      
      const dayMatch = dayOfWeek === null || rule.dayOfWeek === null || dayOfWeek === rule.dayOfWeek;
      if (!dayMatch) return false;
      
      const hoursOverlap = startHour < rule.endHour && endHour > rule.startHour;
      return hoursOverlap;
    });

    if (conflictingRules.length === 0) {
      return { hasConflict: false, conflictingRules: [] as PricingRule[], message: '' };
    }

    const ruleNames = conflictingRules.map(r => `"${r.name}"`).join(', ');
    const currentPriority = parseInt(formData.priority) || 0;
    const higherPriorityExists = conflictingRules.some(r => r.priority > currentPriority);
    
    let message = `This rule overlaps with: ${ruleNames}. `;
    if (higherPriorityExists) {
      message += 'Some existing rules have higher priority and will take precedence during overlap.';
    } else {
      message += 'This rule will take precedence during overlap if it has higher priority.';
    }

    return { hasConflict: true, conflictingRules, message };
  }, [data?.rules, formData.startHour, formData.endHour, formData.dayOfWeek, formData.priority, editingRule]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const value = parseInt(formData.adjustmentValue) || 0;
    const isDiscount = formData.ruleType === 'off_peak_discount' || formData.ruleType === 'happy_hour';
    const isSurcharge = formData.ruleType === 'peak_surcharge';
    
    if (formData.adjustmentType === 'percentage') {
      if (isDiscount && value > 50) {
        errors.push('Maximum discount is 50%');
      }
      if (isSurcharge && value > 25) {
        errors.push('Maximum surcharge is 25%');
      }
    }
    
    const startHour = parseInt(formData.startHour);
    const endHour = parseInt(formData.endHour);
    if (startHour >= endHour) {
      errors.push('End hour must be after start hour');
    }
    
    if (!formData.name.trim()) {
      errors.push('Rule name is required');
    }
    
    if (!formData.adjustmentValue || parseInt(formData.adjustmentValue) === 0) {
      errors.push('Adjustment value is required');
    }
    
    return errors;
  }, [formData]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/dynamic-pricing/salons/${salonId}/pricing-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create rule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules", salonId] });
      toast({ title: "Pricing rule created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ ruleId, data }: { ruleId: string; data: any }) => {
      const res = await fetch(`/api/dynamic-pricing/salons/${salonId}/pricing-rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update rule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules", salonId] });
      toast({ title: "Pricing rule updated successfully" });
      setEditingRule(null);
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const res = await fetch(`/api/dynamic-pricing/salons/${salonId}/pricing-rules/${ruleId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete rule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules", salonId] });
      toast({ title: "Pricing rule deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      ruleType: "off_peak_discount",
      adjustmentType: "percentage",
      adjustmentValue: "",
      dayOfWeek: "",
      startHour: "9",
      endHour: "12",
      priority: "0",
    });
    setEditingRule(null);
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      ruleType: rule.ruleType,
      adjustmentType: rule.adjustmentType,
      adjustmentValue: Math.abs(rule.adjustmentValue).toString(),
      dayOfWeek: rule.dayOfWeek?.toString() || "",
      startHour: rule.startHour.toString(),
      endHour: rule.endHour.toString(),
      priority: rule.priority.toString(),
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = () => {
    const isDiscount = formData.ruleType === 'off_peak_discount' || formData.ruleType === 'happy_hour';
    const rawValue = parseInt(formData.adjustmentValue) || 0;
    const adjustmentValue = isDiscount ? -rawValue : rawValue;

    const payload = {
      name: formData.name,
      ruleType: formData.ruleType,
      adjustmentType: formData.adjustmentType,
      adjustmentValue,
      dayOfWeek: formData.dayOfWeek ? parseInt(formData.dayOfWeek) : null,
      startHour: parseInt(formData.startHour),
      endHour: parseInt(formData.endHour),
      priority: parseInt(formData.priority),
    };

    if (editingRule) {
      updateMutation.mutate({ ruleId: editingRule.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggle = (rule: PricingRule, active: boolean) => {
    updateMutation.mutate({
      ruleId: rule.id,
      data: { isActive: active },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pricing Rules
            </CardTitle>
            <CardDescription>
              Configure dynamic pricing rules based on demand and time
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Edit Pricing Rule" : "Create Pricing Rule"}
                </DialogTitle>
                <DialogDescription>
                  Set up automatic price adjustments based on demand patterns
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Weekday Morning Discount"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rule Type</Label>
                  <Select
                    value={formData.ruleType}
                    onValueChange={(value: any) => setFormData({ ...formData, ruleType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">({type.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Adjustment Type</Label>
                    <Select
                      value={formData.adjustmentType}
                      onValueChange={(value: any) => setFormData({ ...formData, adjustmentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADJUSTMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      {formData.ruleType === 'off_peak_discount' || formData.ruleType === 'happy_hour' 
                        ? 'Discount' 
                        : 'Surcharge'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="value"
                        type="number"
                        min="0"
                        max={formData.adjustmentType === 'percentage' ? 50 : 10000}
                        value={formData.adjustmentValue}
                        onChange={(e) => setFormData({ ...formData, adjustmentValue: e.target.value })}
                        placeholder="0"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {formData.adjustmentType === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Day of Week (optional)</Label>
                  <Select
                    value={formData.dayOfWeek}
                    onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All days</SelectItem>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Hour</Label>
                    <Select
                      value={formData.startHour}
                      onValueChange={(value) => setFormData({ ...formData, startHour: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((hour) => (
                          <SelectItem key={hour.value} value={hour.value}>
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Hour</Label>
                    <Select
                      value={formData.endHour}
                      onValueChange={(value) => setFormData({ ...formData, endHour: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((hour) => (
                          <SelectItem key={hour.value} value={hour.value}>
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (0-100)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher priority rules take precedence when multiple rules apply
                  </p>
                </div>

                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1">
                        {validationErrors.map((error, i) => (
                          <li key={i} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {conflicts.hasConflict && validationErrors.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {conflicts.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={validationErrors.length > 0 || createMutation.isPending || updateMutation.isPending}
                >
                  {editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {data?.rules && data.rules.length > 0 ? (
          <div className="space-y-3">
            {data.rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={() => handleEdit(rule)}
                onDelete={() => deleteMutation.mutate(rule.id)}
                onToggle={(active) => handleToggle(rule, active)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="font-medium">No pricing rules configured</p>
            <p className="text-sm">Create your first rule to enable dynamic pricing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
