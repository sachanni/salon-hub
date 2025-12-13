import { getSocketIO } from './chat.service';

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
}

const salonSubscribers = new Map<string, Set<string>>();
const bookingSubscribers = new Map<string, Set<string>>();

export const queueSocketService = {
  emitSalonQueueUpdate(salonId: string, queueStatus: SalonQueueUpdate): void {
    const io = getSocketIO();
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit queue update');
      return;
    }

    io.to(`salon:queue:${salonId}`).emit('queue:salon:update', {
      ...queueStatus,
      updatedAt: new Date().toISOString()
    });

    console.log(`Queue Socket: Emitted salon queue update for salon ${salonId}`);
  },

  emitStaffQueueUpdate(salonId: string, staffId: string, staffStatus: StaffQueueUpdate): void {
    const io = getSocketIO();
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit staff queue update');
      return;
    }

    io.to(`salon:queue:${salonId}`).emit('queue:staff:update', {
      salonId,
      staff: staffStatus,
      updatedAt: new Date().toISOString()
    });

    console.log(`Queue Socket: Emitted staff queue update for staff ${staffId} in salon ${salonId}`);
  },

  emitDepartureStatusUpdate(userId: string, bookingId: string, status: DepartureStatusUpdate): void {
    const io = getSocketIO();
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit departure status update');
      return;
    }

    io.to(`user:departure:${userId}`).emit('departure:status:update', {
      ...status,
      updatedAt: new Date().toISOString()
    });

    console.log(`Queue Socket: Emitted departure status update for booking ${bookingId} to user ${userId}`);
  },

  emitDelayAlert(userId: string, bookingId: string, data: {
    delayMinutes: number;
    newDepartureTime: string;
    reason?: string;
  }): void {
    const io = getSocketIO();
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit delay alert');
      return;
    }

    io.to(`user:departure:${userId}`).emit('departure:delay:alert', {
      bookingId,
      ...data,
      timestamp: new Date().toISOString()
    });

    console.log(`Queue Socket: Emitted delay alert for booking ${bookingId} to user ${userId}`);
  },

  emitQueueCaughtUp(userId: string, bookingId: string, data: {
    newDepartureTime: string;
    minutesSaved: number;
  }): void {
    const io = getSocketIO();
    if (!io) {
      console.warn('Socket.IO not initialized, cannot emit queue caught up');
      return;
    }

    io.to(`user:departure:${userId}`).emit('departure:queue:caught_up', {
      bookingId,
      ...data,
      timestamp: new Date().toISOString()
    });

    console.log(`Queue Socket: Emitted queue caught up for booking ${bookingId} to user ${userId}`);
  },

  joinSalonQueueRoom(socketId: string, salonId: string): void {
    const io = getSocketIO();
    if (!io) return;

    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(`salon:queue:${salonId}`);
      console.log(`Queue Socket: Socket ${socketId} joined salon queue room ${salonId}`);
    }
  },

  leaveSalonQueueRoom(socketId: string, salonId: string): void {
    const io = getSocketIO();
    if (!io) return;

    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(`salon:queue:${salonId}`);
      console.log(`Queue Socket: Socket ${socketId} left salon queue room ${salonId}`);
    }
  },

  joinUserDepartureRoom(socketId: string, userId: string): void {
    const io = getSocketIO();
    if (!io) return;

    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(`user:departure:${userId}`);
      console.log(`Queue Socket: Socket ${socketId} joined user departure room ${userId}`);
    }
  },

  leaveUserDepartureRoom(socketId: string, userId: string): void {
    const io = getSocketIO();
    if (!io) return;

    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(`user:departure:${userId}`);
      console.log(`Queue Socket: Socket ${socketId} left user departure room ${userId}`);
    }
  }
};

export function initializeQueueSocketEvents(): void {
  const io = getSocketIO();
  if (!io) {
    console.warn('Socket.IO not initialized, cannot setup queue events');
    return;
  }

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;

    socket.on('queue:salon:subscribe', (salonId: string) => {
      if (!salonId) return;
      socket.join(`salon:queue:${salonId}`);
      console.log(`Queue Socket: User ${userId || 'unknown'} subscribed to salon ${salonId} queue updates`);
    });

    socket.on('queue:salon:unsubscribe', (salonId: string) => {
      if (!salonId) return;
      socket.leave(`salon:queue:${salonId}`);
      console.log(`Queue Socket: User ${userId || 'unknown'} unsubscribed from salon ${salonId} queue updates`);
    });

    socket.on('departure:subscribe', () => {
      if (!userId) return;
      socket.join(`user:departure:${userId}`);
      console.log(`Queue Socket: User ${userId} subscribed to departure updates`);
    });

    socket.on('departure:unsubscribe', () => {
      if (!userId) return;
      socket.leave(`user:departure:${userId}`);
      console.log(`Queue Socket: User ${userId} unsubscribed from departure updates`);
    });
  });

  console.log('✅ Queue Socket events initialized');
}
