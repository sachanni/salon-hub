import { useQuery } from "@tanstack/react-query";

export interface SalonPermissions {
  role: 'business_owner' | 'shop_admin' | 'staff';
  permissions: string[];
  isBusinessOwner: boolean;
}

export function useSalonPermissions(salonId: string | null) {
  const { data, isLoading, error } = useQuery<SalonPermissions>({
    queryKey: ['/api/shop-admin', salonId, 'my-permissions'],
    queryFn: async () => {
      if (!salonId) throw new Error('No salon ID');
      const response = await fetch(`/api/shop-admin/${salonId}/my-permissions`);
      if (!response.ok) {
        if (response.status === 403) {
          return { role: 'staff' as const, permissions: [], isBusinessOwner: false };
        }
        throw new Error('Failed to fetch permissions');
      }
      return response.json();
    },
    enabled: !!salonId,
    staleTime: 60000,
    retry: false,
  });

  const hasPermission = (permissionCode: string): boolean => {
    if (!data) return false;
    if (data.isBusinessOwner) return true;
    return data.permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    if (!data) return false;
    if (data.isBusinessOwner) return true;
    return permissionCodes.some(code => data.permissions.includes(code));
  };

  const canViewBookings = hasPermission('bookings.view');
  const canEditBookings = hasPermission('bookings.edit');
  const canViewServices = hasPermission('services.view');
  const canEditServices = hasPermission('services.edit');
  const canViewStaff = hasPermission('staff.view');
  const canEditStaff = hasPermission('staff.edit');
  const canViewReports = hasPermission('reports.view');
  const canViewSettings = hasPermission('settings.view');
  const canEditSettings = hasPermission('settings.edit');
  const canViewCustomers = hasPermission('customers.view');
  const canEditCustomers = hasPermission('customers.edit');
  const canViewInventory = hasPermission('inventory.view');
  const canEditInventory = hasPermission('inventory.edit');
  const canViewFinancials = hasPermission('financials.view');
  const canEditFinancials = hasPermission('financials.edit');
  const canViewMarketing = hasPermission('marketing.view');
  const canEditMarketing = hasPermission('marketing.edit');
  const isAdmin = data?.isBusinessOwner || data?.role === 'shop_admin';

  return {
    permissions: data,
    isLoading,
    error,
    role: data?.role || null,
    isBusinessOwner: data?.isBusinessOwner || false,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    canViewBookings,
    canEditBookings,
    canViewServices,
    canEditServices,
    canViewStaff,
    canEditStaff,
    canViewReports,
    canViewSettings,
    canEditSettings,
    canViewCustomers,
    canEditCustomers,
    canViewInventory,
    canEditInventory,
    canViewFinancials,
    canEditFinancials,
    canViewMarketing,
    canEditMarketing,
  };
}
