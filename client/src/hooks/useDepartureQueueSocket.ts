import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

interface StaffQueueUpdate {
  staffId: string;
  staffName: string;
  currentStatus: string;
  appointmentsAhead: number;
  estimatedDelayMinutes: number;
  nextAvailableAt: string | null;
  currentCustomer?: string;
}

interface SalonQueueUpdate {
  salonId: string;
  date: string;
  staff: StaffQueueUpdate[];
  overallStatus: string;
  avgDelayMinutes: number;
  updatedAt: string;
}

interface DepartureStatusUpdate {
  bookingId: string;
  userId: string;
  originalTime: string;
  predictedStartTime: string;
  delayMinutes: number;
  delayReason?: string;
  suggestedDepartureTime: string;
  staffName?: string;
  staffStatus?: string;
  appointmentsAhead?: number;
  updatedAt: string;
}

interface DelayAlert {
  bookingId: string;
  delayMinutes: number;
  newDepartureTime: string;
  reason?: string;
  timestamp: string;
}

interface QueueCaughtUp {
  bookingId: string;
  newDepartureTime: string;
  minutesSaved: number;
  timestamp: string;
}

interface UseDepartureQueueSocketOptions {
  salonId?: string;
  userId?: string;
  authToken?: string;
  userRole?: 'customer' | 'staff';
  enabled?: boolean;
  onQueueUpdate?: (data: SalonQueueUpdate) => void;
  onStaffUpdate?: (data: { salonId: string; staff: StaffQueueUpdate; updatedAt: string }) => void;
  onDepartureStatusUpdate?: (data: DepartureStatusUpdate) => void;
  onDelayAlert?: (data: DelayAlert) => void;
  onQueueCaughtUp?: (data: QueueCaughtUp) => void;
}

export function useDepartureQueueSocket({
  salonId,
  userId,
  authToken,
  userRole = 'customer',
  enabled = true,
  onQueueUpdate,
  onStaffUpdate,
  onDepartureStatusUpdate,
  onDelayAlert,
  onQueueCaughtUp,
}: UseDepartureQueueSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  
  const currentTokenRef = useRef<string | undefined>(authToken);

  const handleQueueUpdate = useCallback((data: SalonQueueUpdate) => {
    if (onQueueUpdate) {
      onQueueUpdate(data);
    }
    queryClient.setQueryData(['salon-queue-status', data.salonId], { data });
  }, [onQueueUpdate, queryClient]);

  const handleStaffUpdate = useCallback((data: { salonId: string; staff: StaffQueueUpdate; updatedAt: string }) => {
    if (onStaffUpdate) {
      onStaffUpdate(data);
    }
    queryClient.invalidateQueries({ queryKey: ['salon-queue-status', data.salonId] });
  }, [onStaffUpdate, queryClient]);

  const handleDepartureStatusUpdate = useCallback((data: DepartureStatusUpdate) => {
    if (onDepartureStatusUpdate) {
      onDepartureStatusUpdate(data);
    }
    queryClient.invalidateQueries({ queryKey: ['departure-status'] });
  }, [onDepartureStatusUpdate, queryClient]);

  const handleDelayAlert = useCallback((data: DelayAlert) => {
    if (onDelayAlert) {
      onDelayAlert(data);
    }
    queryClient.invalidateQueries({ queryKey: ['departure-status'] });
  }, [onDelayAlert, queryClient]);

  const handleQueueCaughtUp = useCallback((data: QueueCaughtUp) => {
    if (onQueueCaughtUp) {
      onQueueCaughtUp(data);
    }
    queryClient.invalidateQueries({ queryKey: ['departure-status'] });
  }, [onQueueCaughtUp, queryClient]);

  useEffect(() => {
    currentTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    if (!enabled || !authToken) return;

    const socket = io(window.location.origin, {
      path: '/socket.io',
      auth: {
        token: authToken,
        userRole,
        salonId,
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Departure queue socket connected, subscribing to rooms...');
      setIsConnected(true);

      if (salonId && userRole === 'staff') {
        socket.emit('queue:salon:subscribe', salonId);
        console.log(`Subscribed to salon queue: ${salonId}`);
      }

      if (userId && userRole === 'customer') {
        socket.emit('departure:subscribe');
        console.log(`Subscribed to departure updates for user: ${userId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Departure queue socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Departure queue socket connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('queue:salon:update', handleQueueUpdate);
    socket.on('queue:staff:update', handleStaffUpdate);
    socket.on('departure:status:update', handleDepartureStatusUpdate);
    socket.on('departure:delay:alert', handleDelayAlert);
    socket.on('departure:queue:caught_up', handleQueueCaughtUp);

    socketRef.current = socket;

    return () => {
      if (salonId && userRole === 'staff') {
        socket.emit('queue:salon:unsubscribe', salonId);
      }
      if (userId && userRole === 'customer') {
        socket.emit('departure:unsubscribe');
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, authToken, salonId, userId, userRole, handleQueueUpdate, handleStaffUpdate, handleDepartureStatusUpdate, handleDelayAlert, handleQueueCaughtUp]);

  const subscribeSalon = useCallback((salonIdToSubscribe: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('queue:salon:subscribe', salonIdToSubscribe);
    }
  }, []);

  const unsubscribeSalon = useCallback((salonIdToUnsubscribe: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('queue:salon:unsubscribe', salonIdToUnsubscribe);
    }
  }, []);

  const subscribeDeparture = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('departure:subscribe');
    }
  }, []);

  const unsubscribeDeparture = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('departure:unsubscribe');
    }
  }, []);

  return {
    isConnected,
    subscribeSalon,
    unsubscribeSalon,
    subscribeDeparture,
    unsubscribeDeparture,
  };
}
