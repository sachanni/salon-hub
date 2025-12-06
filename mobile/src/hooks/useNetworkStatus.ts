import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isLoading: boolean;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isLoading: true,
  });

  useEffect(() => {
    const handleNetworkChange = (state: NetInfoState) => {
      setStatus({
        isConnected: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isLoading: false,
      });
    };

    NetInfo.fetch().then(handleNetworkChange);

    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    return () => unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    setStatus({
      isConnected: !!state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isLoading: false,
    });
  }, []);

  return { ...status, refresh };
}

export default useNetworkStatus;
