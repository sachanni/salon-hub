import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
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
  // Fetch current user using Replit Auth
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Redirect to Replit Auth login
  const login = () => {
    window.location.href = '/api/login';
  };

  // Redirect to Replit Auth logout
  const logout = () => {
    window.location.href = '/api/logout';
  };

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) ?? false;
  };

  const hasOrgRole = (orgId: string, role: string): boolean => {
    return user?.orgMemberships.some(
      membership => membership.orgId === orgId && membership.orgRole === role
    ) ?? false;
  };

  const isBusinessUser = user?.orgMemberships.some(
    membership => ['owner', 'manager', 'staff'].includes(membership.orgRole)
  ) ?? false;

  // Get salons the user has access to (for business users)
  const userSalons = user?.orgMemberships
    .filter(membership => ['owner', 'manager', 'staff'].includes(membership.orgRole))
    .map(membership => ({
      id: membership.organization.id, // This would be the salon ID
      name: membership.organization.name,
      orgId: membership.orgId,
      orgRole: membership.orgRole,
    })) ?? [];

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
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