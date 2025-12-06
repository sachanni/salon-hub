import React from 'react';
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
