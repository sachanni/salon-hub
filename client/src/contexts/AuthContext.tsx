import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneVerified?: boolean;
  profileImageUrl?: string;
  workPreference?: string;
  businessCategory?: string;
  businessName?: string;
  panNumber?: string;
  gstNumber?: string;
  roles: string[];
  orgMemberships: Array<{
    orgId: string;
    orgRole: string;
    organization: {
      id: string;
      name: string;
      type: string;
    };
  }>;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasOrgRole: (orgId: string, role: string) => boolean;
  isBusinessUser: boolean;
  userSalons: Array<{
    id: string;
    name: string;
    orgId: string;
    orgRole: string;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClientInstance = useQueryClient();
  
  // Fetch current user using session auth - handle 401s gracefully
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary requests
  });
  
  // Function to refresh authentication state
  const checkAuth = async () => {
    await queryClientInstance.invalidateQueries({ queryKey: ['/api/auth/user'] });
  };

  // Redirect to login page
  const login = () => {
    window.location.href = '/login';
  };

  // Session-based logout
  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Clear user data from cache
        queryClientInstance.setQueryData(['/api/auth/user'], null);
        window.location.href = '/';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if server call fails
      queryClientInstance.setQueryData(['/api/auth/user'], null);
      window.location.href = '/';
    }
  };

  const hasRole = (role: string): boolean => {
    return (user as any)?.roles?.includes(role) ?? false;
  };

  const hasOrgRole = (orgId: string, role: string): boolean => {
    return (user as any)?.orgMemberships?.some(
      (membership: any) => membership.orgId === orgId && membership.orgRole === role
    ) ?? false;
  };

  const isBusinessUser = (user as any)?.orgMemberships?.some(
    (membership: any) => ['owner', 'manager', 'staff'].includes(membership.orgRole)
  ) ?? false;

  // Get salons the user has access to (for business users)
  const userSalons = (user as any)?.orgMemberships
    ?.filter((membership: any) => ['owner', 'manager', 'staff'].includes(membership.orgRole))
    ?.map((membership: any) => ({
      id: membership.organization.id, // This would be the salon ID
      name: membership.organization.name,
      orgId: membership.orgId,
      orgRole: membership.orgRole,
    })) ?? [];

  const value: AuthContextType = {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
    hasRole,
    hasOrgRole,
    isBusinessUser,
    userSalons,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}