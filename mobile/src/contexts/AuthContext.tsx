import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { secureStorage } from '../utils/secureStorage';
import { AuthState, User, OnboardingPermissions } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (user: User, accessToken?: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updatePermissions: (permissions: Partial<OnboardingPermissions>) => Promise<void>;
  permissions: OnboardingPermissions;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    hasCompletedOnboarding: false,
  });

  const [permissions, setPermissions] = useState<OnboardingPermissions>({
    location: 'pending',
    locationPrecision: 'precise',
    notifications: 'pending',
  });

  const loadAuthState = useCallback(async () => {
    try {
      const [user, hasCompletedOnboarding, storedPermissions] = await Promise.all([
        secureStorage.getUser(),
        secureStorage.getOnboardingComplete(),
        secureStorage.getPermissions(),
      ]);

      setAuthState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        hasCompletedOnboarding,
      });

      if (storedPermissions) {
        setPermissions(storedPermissions);
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  const login = useCallback(async (user: User, accessToken?: string, refreshToken?: string) => {
    try {
      await secureStorage.setUser(user);
      
      if (accessToken) {
        await secureStorage.setAccessToken(accessToken);
      }
      if (refreshToken) {
        await secureStorage.setRefreshToken(refreshToken);
      }

      setAuthState(prev => ({
        user,
        isAuthenticated: true,
        isLoading: false,
        hasCompletedOnboarding: prev.hasCompletedOnboarding,
      }));
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await secureStorage.clearAll();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasCompletedOnboarding: false,
      });
      setPermissions({
        location: 'pending',
        locationPrecision: 'precise',
        notifications: 'pending',
      });
    } catch (error) {
      throw error;
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await secureStorage.setOnboardingComplete(true);
      setAuthState(prev => ({ ...prev, hasCompletedOnboarding: true }));
    } catch (error) {
      throw error;
    }
  }, []);

  const updatePermissions = useCallback(async (newPermissions: Partial<OnboardingPermissions>) => {
    try {
      setPermissions(prev => {
        const updated = { ...prev, ...newPermissions };
        secureStorage.setPermissions(updated);
        return updated;
      });
    } catch (error) {
      throw error;
    }
  }, []);

  const contextValue = useMemo<AuthContextType>(() => ({
    ...authState,
    permissions,
    login,
    logout,
    completeOnboarding,
    updatePermissions,
  }), [authState, permissions, login, logout, completeOnboarding, updatePermissions]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
