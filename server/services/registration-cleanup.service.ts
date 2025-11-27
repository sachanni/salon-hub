import cron, { type ScheduledTask } from 'node-cron';
import { db } from '../db';
import { eventRegistrations } from '../../shared/schema';
import { and, eq, sql, lt } from 'drizzle-orm';

export class RegistrationCleanupService {
  private static instance: RegistrationCleanupService;
  private cronJob: ScheduledTask | null = null;

  private constructor() {}

  public static getInstance(): RegistrationCleanupService {
    if (!RegistrationCleanupService.instance) {
      RegistrationCleanupService.instance = new RegistrationCleanupService();
    }
    return RegistrationCleanupService.instance;
  }

  public start(): void {
    if (this.cronJob) {
      console.log('⚠️  Registration cleanup service already running');
      return;
    }

    // Run every 5 minutes
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      await this.cleanupExpiredRegistrations();
    });

    console.log('✅ Registration cleanup service started (runs every 5 minutes)');
  }

  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Registration cleanup service stopped');
    }
  }

  private async cleanupExpiredRegistrations(): Promise<void> {
    try {
      const now = new Date();

      // Find all expired pending registrations
      const expiredRegistrations = await db
        .select({
          id: eventRegistrations.id,
          bookingId: eventRegistrations.bookingId,
          attendeeEmail: eventRegistrations.attendeeEmail,
          expiresAt: eventRegistrations.expiresAt,
        })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.status, 'pending'),
            eq(eventRegistrations.paymentStatus, 'pending'),
            sql`${eventRegistrations.expiresAt} IS NOT NULL`,
            lt(eventRegistrations.expiresAt, now)
          )
        );

      if (expiredRegistrations.length === 0) {
        return;
      }

      // Batch cancel expired registrations
      const registrationIds = expiredRegistrations.map((r) => r.id);

      await db
        .update(eventRegistrations)
        .set({
          status: 'cancelled',
          cancelledAt: now,
          cancellationReason: 'Payment window expired (automatic cleanup)',
          updatedAt: now,
        })
        .where(
          sql`${eventRegistrations.id} IN (${sql.join(
            registrationIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      console.log(
        `🧹 Cleanup: Cancelled ${expiredRegistrations.length} expired registration(s)`,
        {
          count: expiredRegistrations.length,
          bookingIds: expiredRegistrations.map((r) => r.bookingId),
          timestamp: now.toISOString(),
        }
      );
    } catch (error) {
      console.error('❌ Error in registration cleanup service:', error);
    }
  }

  public async runManualCleanup(): Promise<number> {
    await this.cleanupExpiredRegistrations();
    
    const result = await db
      .select({
        count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.status, 'cancelled'),
          eq(eventRegistrations.cancellationReason, 'Payment window expired (automatic cleanup)')
        )
      );

    return result[0]?.count || 0;
  }
}

export const registrationCleanupService = RegistrationCleanupService.getInstance();
