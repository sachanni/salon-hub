import React, { useEffect } from 'react';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
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

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'SALONHUB_QUERY_CACHE',
  throttleTime: 1000,
  serialize: JSON.stringify,
  deserialize: (data: string) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse persisted query cache, clearing:', error);
      AsyncStorage.removeItem('SALONHUB_QUERY_CACHE').catch(() => {});
      return {};
    }
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

interface OfflineQueryProviderProps {
  children: React.ReactNode;
}

export function OfflineQueryProvider({ children }: OfflineQueryProviderProps) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24,
        buster: 'v1',
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

export { queryClient };
export default OfflineQueryProvider;
