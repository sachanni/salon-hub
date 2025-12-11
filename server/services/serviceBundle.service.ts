import { db } from '../db';
import { 
  servicePackages, 
  packageServices, 
  packageBookings,
  services,
  bookings,
  salons,
  staff,
  SERVICE_PACKAGE_CATEGORIES,
  type ServicePackage,
  type InsertServicePackage,
  type InsertPackageService,
} from '@shared/schema';
import { eq, and, desc, asc, gte, lte, sql, inArray } from 'drizzle-orm';

interface ServiceEntry {
  serviceId: string;
  quantity: number;
}

interface CreatePackageInput {
  name: string;
  description?: string;
  serviceIds?: string[];
  services?: ServiceEntry[];
  packagePriceInPaisa: number;
  category?: string;
  imageUrl?: string | null;
  gender?: 'male' | 'female' | 'unisex';
  maxBookingsPerDay?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  minAdvanceBookingHours?: number | null;
  availableDays?: string[] | null;
  availableTimeStart?: string | null;
  availableTimeEnd?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
}

function normalizeServiceEntries(input: CreatePackageInput): ServiceEntry[] {
  if (input.services && input.services.length > 0) {
    return input.services;
  }
  if (input.serviceIds && input.serviceIds.length > 0) {
    return input.serviceIds.map(serviceId => ({ serviceId, quantity: 1 }));
  }
  return [];
}

interface UpdatePackageInput extends Partial<CreatePackageInput> {
  isActive?: boolean;
}

interface PackageResult {
  success: boolean;
  package?: ServicePackage;
  error?: string;
}

interface PackageAvailability {
  isAvailable: boolean;
  reason?: string;
  dailyBookingsRemaining?: number;
}

interface BookPackageInput {
  packageId: string;
  salonId: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  staffId?: string;
  notes?: string;
  guestSessionId?: string;
}

interface BookPackageResult {
  success: boolean;
  booking?: any;
  packageBooking?: any;
  error?: string;
}

const IST_TIMEZONE = 'Asia/Kolkata';

function getISTDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function getISTDayOfWeek(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    weekday: 'short',
  });
  return formatter.format(new Date());
}

function calculateDiscountPercentage(regular: number, discounted: number): number {
  if (regular <= 0) return 0;
  return Math.round(((regular - discounted) / regular) * 100);
}

class ServiceBundleService {
  async createPackage(salonId: string, input: CreatePackageInput): Promise<PackageResult> {
    try {
      const serviceEntries = normalizeServiceEntries(input);
      const totalServiceCount = serviceEntries.reduce((sum, e) => sum + e.quantity, 0);
      
      if (totalServiceCount < 2) {
        return { success: false, error: 'Package must contain at least 2 service instances' };
      }

      const uniqueServiceIds = [...new Set(serviceEntries.map(e => e.serviceId))];

      const salonServices = await db.query.services.findMany({
        where: and(
          eq(services.salonId, salonId),
          eq(services.isActive, 1),
          inArray(services.id, uniqueServiceIds)
        ),
      });

      if (salonServices.length !== uniqueServiceIds.length) {
        const foundIds = new Set(salonServices.map(s => s.id));
        const missingIds = uniqueServiceIds.filter(id => !foundIds.has(id));
        return { 
          success: false, 
          error: `Some services not found or inactive: ${missingIds.join(', ')}` 
        };
      }

      const serviceMap = new Map(salonServices.map(s => [s.id, s]));
      
      let totalDurationMinutes = 0;
      let regularPriceInPaisa = 0;
      
      for (const entry of serviceEntries) {
        const service = serviceMap.get(entry.serviceId);
        if (service) {
          totalDurationMinutes += service.durationMinutes * entry.quantity;
          regularPriceInPaisa += service.priceInPaisa * entry.quantity;
        }
      }

      if (input.packagePriceInPaisa >= regularPriceInPaisa) {
        return { 
          success: false, 
          error: 'Package price must be less than sum of individual service prices' 
        };
      }

      const discountPercentage = calculateDiscountPercentage(regularPriceInPaisa, input.packagePriceInPaisa);
      if (discountPercentage > 50) {
        return { 
          success: false, 
          error: 'Discount cannot exceed 50%' 
        };
      }

      const [newPackage] = await db.insert(servicePackages).values({
        salonId,
        name: input.name,
        description: input.description || null,
        totalDurationMinutes,
        packagePriceInPaisa: input.packagePriceInPaisa,
        regularPriceInPaisa,
        discountPercentage,
        category: input.category || null,
        imageUrl: input.imageUrl || null,
        gender: input.gender || null,
        maxBookingsPerDay: input.maxBookingsPerDay || null,
        validFrom: input.validFrom || null,
        validUntil: input.validUntil || null,
        minAdvanceBookingHours: input.minAdvanceBookingHours || null,
        availableDays: input.availableDays || null,
        availableTimeStart: input.availableTimeStart || null,
        availableTimeEnd: input.availableTimeEnd || null,
        isFeatured: input.isFeatured ? 1 : 0,
        sortOrder: input.sortOrder || 0,
      }).returning();

      const packageServiceEntries = serviceEntries.map((entry, index) => ({
        packageId: newPackage.id,
        serviceId: entry.serviceId,
        salonId,
        sequenceOrder: index + 1,
        quantity: entry.quantity,
      }));

      await db.insert(packageServices).values(packageServiceEntries);

      return { success: true, package: newPackage };
    } catch (error) {
      console.error('Error creating package:', error);
      return { success: false, error: 'Failed to create package' };
    }
  }

  async updatePackage(packageId: string, salonId: string, input: UpdatePackageInput): Promise<PackageResult> {
    try {
      const existingPackage = await db.query.servicePackages.findFirst({
        where: and(
          eq(servicePackages.id, packageId),
          eq(servicePackages.salonId, salonId)
        ),
      });

      if (!existingPackage) {
        return { success: false, error: 'Package not found' };
      }

      let totalDurationMinutes = existingPackage.totalDurationMinutes;
      let regularPriceInPaisa = existingPackage.regularPriceInPaisa;
      let discountPercentage = existingPackage.discountPercentage;

      const serviceEntries = normalizeServiceEntries(input);
      const hasServiceUpdate = serviceEntries.length > 0;

      if (hasServiceUpdate) {
        const totalServiceCount = serviceEntries.reduce((sum, e) => sum + e.quantity, 0);
        if (totalServiceCount < 2) {
          return { success: false, error: 'Package must contain at least 2 service instances' };
        }

        const uniqueServiceIds = [...new Set(serviceEntries.map(e => e.serviceId))];

        const salonServices = await db.query.services.findMany({
          where: and(
            eq(services.salonId, salonId),
            eq(services.isActive, 1),
            inArray(services.id, uniqueServiceIds)
          ),
        });

        if (salonServices.length !== uniqueServiceIds.length) {
          return { success: false, error: 'Some services not found or inactive' };
        }

        const serviceMap = new Map(salonServices.map(s => [s.id, s]));
        
        totalDurationMinutes = 0;
        regularPriceInPaisa = 0;
        
        for (const entry of serviceEntries) {
          const service = serviceMap.get(entry.serviceId);
          if (service) {
            totalDurationMinutes += service.durationMinutes * entry.quantity;
            regularPriceInPaisa += service.priceInPaisa * entry.quantity;
          }
        }

        await db.delete(packageServices).where(eq(packageServices.packageId, packageId));

        const packageServiceEntries = serviceEntries.map((entry, index) => ({
          packageId,
          serviceId: entry.serviceId,
          salonId,
          sequenceOrder: index + 1,
          quantity: entry.quantity,
        }));

        await db.insert(packageServices).values(packageServiceEntries);
      }

      const newPackagePrice = input.packagePriceInPaisa ?? existingPackage.packagePriceInPaisa;
      
      if (newPackagePrice >= regularPriceInPaisa) {
        return { success: false, error: 'Package price must be less than sum of individual service prices' };
      }

      discountPercentage = calculateDiscountPercentage(regularPriceInPaisa, newPackagePrice);
      if (discountPercentage > 50) {
        return { success: false, error: 'Discount cannot exceed 50%' };
      }

      const [updated] = await db.update(servicePackages)
        .set({
          name: input.name ?? existingPackage.name,
          description: input.description !== undefined ? input.description : existingPackage.description,
          totalDurationMinutes,
          packagePriceInPaisa: newPackagePrice,
          regularPriceInPaisa,
          discountPercentage,
          category: input.category !== undefined ? input.category : existingPackage.category,
          imageUrl: input.imageUrl !== undefined ? input.imageUrl : existingPackage.imageUrl,
          gender: input.gender !== undefined ? input.gender : existingPackage.gender,
          maxBookingsPerDay: input.maxBookingsPerDay !== undefined ? input.maxBookingsPerDay : existingPackage.maxBookingsPerDay,
          validFrom: input.validFrom !== undefined ? input.validFrom : existingPackage.validFrom,
          validUntil: input.validUntil !== undefined ? input.validUntil : existingPackage.validUntil,
          minAdvanceBookingHours: input.minAdvanceBookingHours !== undefined ? input.minAdvanceBookingHours : existingPackage.minAdvanceBookingHours,
          availableDays: input.availableDays !== undefined ? input.availableDays : existingPackage.availableDays,
          availableTimeStart: input.availableTimeStart !== undefined ? input.availableTimeStart : existingPackage.availableTimeStart,
          availableTimeEnd: input.availableTimeEnd !== undefined ? input.availableTimeEnd : existingPackage.availableTimeEnd,
          isFeatured: input.isFeatured !== undefined ? (input.isFeatured ? 1 : 0) : existingPackage.isFeatured,
          sortOrder: input.sortOrder !== undefined ? input.sortOrder : existingPackage.sortOrder,
          isActive: input.isActive !== undefined ? (input.isActive ? 1 : 0) : existingPackage.isActive,
          updatedAt: new Date(),
        })
        .where(eq(servicePackages.id, packageId))
        .returning();

      return { success: true, package: updated };
    } catch (error) {
      console.error('Error updating package:', error);
      return { success: false, error: 'Failed to update package' };
    }
  }

  async deletePackage(packageId: string, salonId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existingPackage = await db.query.servicePackages.findFirst({
        where: and(
          eq(servicePackages.id, packageId),
          eq(servicePackages.salonId, salonId)
        ),
      });

      if (!existingPackage) {
        return { success: false, error: 'Package not found' };
      }

      await db.update(servicePackages)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(servicePackages.id, packageId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting package:', error);
      return { success: false, error: 'Failed to delete package' };
    }
  }

  async getPackageById(packageId: string): Promise<any | null> {
    try {
      const pkg = await db.query.servicePackages.findFirst({
        where: eq(servicePackages.id, packageId),
        with: {
          salon: {
            columns: { id: true, name: true },
          },
          packageServices: {
            with: {
              service: true,
            },
            orderBy: [asc(packageServices.sequenceOrder)],
          },
        },
      });

      if (!pkg) return null;

      return {
        ...pkg,
        services: pkg.packageServices.map(ps => ({
          ...ps.service,
          sequenceOrder: ps.sequenceOrder,
          quantity: ps.quantity,
        })),
        savings: pkg.regularPriceInPaisa - pkg.packagePriceInPaisa,
        savingsFormatted: this.formatCurrency(pkg.regularPriceInPaisa - pkg.packagePriceInPaisa),
      };
    } catch (error) {
      console.error('Error fetching package:', error);
      return null;
    }
  }

  async getPackagesForSalon(
    salonId: string, 
    options: {
      category?: string;
      gender?: string;
      featured?: boolean;
      activeOnly?: boolean;
      includeExpired?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      const allPackages = await db.query.servicePackages.findMany({
        where: eq(servicePackages.salonId, salonId),
        with: {
          packageServices: {
            with: {
              service: true,
            },
            orderBy: [asc(packageServices.sequenceOrder)],
          },
        },
        orderBy: [asc(servicePackages.sortOrder), desc(servicePackages.createdAt)],
      });

      const now = new Date();
      const today = getISTDate();

      return allPackages
        .filter(pkg => {
          if (options.activeOnly !== false && pkg.isActive !== 1) return false;
          if (options.category && pkg.category !== options.category) return false;
          if (options.gender && pkg.gender && pkg.gender !== options.gender) return false;
          if (options.featured && pkg.isFeatured !== 1) return false;
          
          if (!options.includeExpired) {
            if (pkg.validFrom && new Date(pkg.validFrom) > now) return false;
            if (pkg.validUntil && new Date(pkg.validUntil) < now) return false;
          }

          return true;
        })
        .map(pkg => ({
          ...pkg,
          services: pkg.packageServices.map(ps => ({
            ...ps.service,
            sequenceOrder: ps.sequenceOrder,
            quantity: ps.quantity,
          })),
          savings: pkg.regularPriceInPaisa - pkg.packagePriceInPaisa,
          savingsFormatted: this.formatCurrency(pkg.regularPriceInPaisa - pkg.packagePriceInPaisa),
        }));
    } catch (error) {
      console.error('Error fetching packages:', error);
      return [];
    }
  }

  async checkPackageAvailability(
    packageId: string, 
    date: string, 
    time: string
  ): Promise<PackageAvailability> {
    try {
      const pkg = await db.query.servicePackages.findFirst({
        where: eq(servicePackages.id, packageId),
      });

      if (!pkg) {
        return { isAvailable: false, reason: 'Package not found' };
      }

      if (pkg.isActive !== 1) {
        return { isAvailable: false, reason: 'Package is no longer available' };
      }

      const now = new Date();
      if (pkg.validFrom && new Date(pkg.validFrom) > now) {
        return { isAvailable: false, reason: 'Package is not yet available' };
      }
      if (pkg.validUntil && new Date(pkg.validUntil) < now) {
        return { isAvailable: false, reason: 'Package has expired' };
      }

      if (pkg.availableDays && pkg.availableDays.length > 0) {
        const bookingDate = new Date(date);
        const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
        if (!pkg.availableDays.includes(dayOfWeek)) {
          return { 
            isAvailable: false, 
            reason: `Package is only available on ${pkg.availableDays.join(', ')}` 
          };
        }
      }

      if (pkg.availableTimeStart && pkg.availableTimeEnd) {
        if (time < pkg.availableTimeStart || time > pkg.availableTimeEnd) {
          return { 
            isAvailable: false, 
            reason: `Package is only available between ${pkg.availableTimeStart} and ${pkg.availableTimeEnd}` 
          };
        }
      }

      if (pkg.minAdvanceBookingHours) {
        const bookingDateTime = new Date(`${date}T${time}:00`);
        const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilBooking < pkg.minAdvanceBookingHours) {
          return { 
            isAvailable: false, 
            reason: `Package requires ${pkg.minAdvanceBookingHours} hours advance booking` 
          };
        }
      }

      if (pkg.maxBookingsPerDay) {
        const dailyBookings = await db.query.packageBookings.findMany({
          where: eq(packageBookings.packageId, packageId),
          with: {
            booking: true,
          },
        });

        const todayBookings = dailyBookings.filter(pb => 
          pb.booking?.bookingDate === date && 
          pb.booking?.status !== 'cancelled'
        ).length;

        if (todayBookings >= pkg.maxBookingsPerDay) {
          return { 
            isAvailable: false, 
            reason: 'Maximum daily bookings for this package reached' 
          };
        }

        return { 
          isAvailable: true, 
          dailyBookingsRemaining: pkg.maxBookingsPerDay - todayBookings 
        };
      }

      return { isAvailable: true };
    } catch (error) {
      console.error('Error checking package availability:', error);
      return { isAvailable: false, reason: 'Failed to check availability' };
    }
  }

  async getPackageAnalytics(salonId: string): Promise<any> {
    try {
      const packages = await db.query.servicePackages.findMany({
        where: eq(servicePackages.salonId, salonId),
        with: {
          packageBookings: {
            with: {
              booking: true,
            },
          },
        },
      });

      let totalRevenue = 0;
      let totalBookings = 0;
      let totalSavingsProvided = 0;

      const byPackage = packages.map(pkg => {
        const completedBookings = pkg.packageBookings.filter(pb => 
          pb.booking?.status === 'completed'
        );
        
        const packageRevenue = completedBookings.reduce((sum, pb) => 
          sum + pb.packagePriceAtBooking, 0
        );
        
        const packageSavings = completedBookings.reduce((sum, pb) => 
          sum + pb.savingsPaisa, 0
        );

        totalRevenue += packageRevenue;
        totalBookings += completedBookings.length;
        totalSavingsProvided += packageSavings;

        return {
          id: pkg.id,
          name: pkg.name,
          category: pkg.category,
          bookings: completedBookings.length,
          totalBookings: pkg.bookingCount,
          revenue: packageRevenue,
          revenueFormatted: this.formatCurrency(packageRevenue),
          savingsProvided: packageSavings,
          isFeatured: pkg.isFeatured === 1,
          isActive: pkg.isActive === 1,
        };
      });

      const topPackage = byPackage.reduce((top, pkg) => 
        pkg.bookings > (top?.bookings || 0) ? pkg : top, 
        null as any
      );

      return {
        summary: {
          totalPackageRevenue: totalRevenue,
          totalPackageRevenueFormatted: this.formatCurrency(totalRevenue),
          totalPackageBookings: totalBookings,
          averagePackageValue: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
          topPackage: topPackage ? { name: topPackage.name, bookings: topPackage.bookings } : null,
          savingsProvided: totalSavingsProvided,
          savingsProvidedFormatted: this.formatCurrency(totalSavingsProvided),
        },
        byPackage: byPackage.sort((a, b) => b.bookings - a.bookings),
        categories: SERVICE_PACKAGE_CATEGORIES,
      };
    } catch (error) {
      console.error('Error fetching package analytics:', error);
      return {
        summary: {
          totalPackageRevenue: 0,
          totalPackageBookings: 0,
          averagePackageValue: 0,
          topPackage: null,
          savingsProvided: 0,
        },
        byPackage: [],
        categories: SERVICE_PACKAGE_CATEGORIES,
      };
    }
  }

  async bookPackage(input: BookPackageInput): Promise<BookPackageResult> {
    try {
      const pkg = await this.getPackageById(input.packageId);
      if (!pkg) {
        return { success: false, error: 'Package not found' };
      }

      if (pkg.isActive !== 1) {
        return { success: false, error: 'Package is not active' };
      }

      if (pkg.salonId !== input.salonId) {
        return { success: false, error: 'Package does not belong to this salon' };
      }

      const availability = await this.checkPackageAvailability(input.packageId, input.date, input.time);
      if (!availability.isAvailable) {
        return { success: false, error: availability.reason || 'Package not available for this time' };
      }

      if (input.staffId) {
        const staffAvailable = await this.checkStaffAvailability(
          input.staffId,
          input.date,
          input.time,
          pkg.totalDurationMinutes
        );
        if (!staffAvailable.isAvailable) {
          return { success: false, error: staffAvailable.reason || 'Staff not available for full package duration' };
        }
      }

      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, input.salonId),
      });

      const primaryService = pkg.services[0];
      if (!primaryService) {
        return { success: false, error: 'Package has no services' };
      }

      const [newBooking] = await db.insert(bookings).values({
        salonId: input.salonId,
        serviceId: primaryService.id,
        staffId: input.staffId || null,
        userId: input.userId || null,
        packageId: input.packageId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        salonName: salon?.name || null,
        bookingDate: input.date,
        bookingTime: input.time,
        status: 'pending',
        totalAmountPaisa: pkg.packagePriceInPaisa,
        currency: 'INR',
        paymentMethod: 'pay_now',
        notes: input.notes || null,
        guestSessionId: input.guestSessionId || null,
        isPackageBooking: 1,
      }).returning();

      const [newPackageBooking] = await db.insert(packageBookings).values({
        bookingId: newBooking.id,
        packageId: input.packageId,
        salonId: input.salonId,
        packagePriceAtBooking: pkg.packagePriceInPaisa,
        regularPriceAtBooking: pkg.regularPriceInPaisa,
        savingsPaisa: pkg.regularPriceInPaisa - pkg.packagePriceInPaisa,
      }).returning();

      await this.incrementBookingCount(input.packageId);

      return {
        success: true,
        booking: newBooking,
        packageBooking: newPackageBooking,
      };
    } catch (error) {
      console.error('Error booking package:', error);
      return { success: false, error: 'Failed to book package' };
    }
  }

  async checkStaffAvailability(
    staffId: string,
    date: string,
    time: string,
    durationMinutes: number
  ): Promise<{ isAvailable: boolean; reason?: string }> {
    try {
      const staffMember = await db.query.staff.findFirst({
        where: eq(staff.id, staffId),
      });

      if (!staffMember) {
        return { isAvailable: false, reason: 'Staff member not found' };
      }

      if (staffMember.isActive !== 1) {
        return { isAvailable: false, reason: 'Staff member is not active' };
      }

      const [hours, minutes] = time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + durationMinutes;

      const existingBookings = await db.query.bookings.findMany({
        where: and(
          eq(bookings.staffId, staffId),
          eq(bookings.bookingDate, date),
          inArray(bookings.status, ['pending', 'confirmed'])
        ),
        with: {
          service: true,
        },
      });

      for (const booking of existingBookings) {
        const [bHours, bMinutes] = booking.bookingTime.split(':').map(Number);
        const bStartMinutes = bHours * 60 + bMinutes;
        const bEndMinutes = bStartMinutes + (booking.service?.durationMinutes || 30);

        if (
          (startMinutes >= bStartMinutes && startMinutes < bEndMinutes) ||
          (endMinutes > bStartMinutes && endMinutes <= bEndMinutes) ||
          (startMinutes <= bStartMinutes && endMinutes >= bEndMinutes)
        ) {
          return { 
            isAvailable: false, 
            reason: `Staff has another booking from ${booking.bookingTime} that overlaps with this package duration` 
          };
        }
      }

      return { isAvailable: true };
    } catch (error) {
      console.error('Error checking staff availability:', error);
      return { isAvailable: false, reason: 'Failed to check staff availability' };
    }
  }

  async incrementBookingCount(packageId: string): Promise<void> {
    try {
      await db.update(servicePackages)
        .set({ 
          bookingCount: sql`${servicePackages.bookingCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(servicePackages.id, packageId));
    } catch (error) {
      console.error('Error incrementing booking count:', error);
    }
  }

  async deactivatePackagesWithService(serviceId: string, salonId: string): Promise<number> {
    try {
      const affectedPackages = await db.query.packageServices.findMany({
        where: and(
          eq(packageServices.serviceId, serviceId),
          eq(packageServices.salonId, salonId)
        ),
      });

      const packageIds = [...new Set(affectedPackages.map(ps => ps.packageId))];

      if (packageIds.length === 0) return 0;

      await db.update(servicePackages)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(inArray(servicePackages.id, packageIds));

      return packageIds.length;
    } catch (error) {
      console.error('Error deactivating packages:', error);
      return 0;
    }
  }

  async deactivateExpiredPackages(): Promise<number> {
    try {
      const now = new Date();
      
      const result = await db.update(servicePackages)
        .set({ isActive: 0, updatedAt: now })
        .where(
          and(
            eq(servicePackages.isActive, 1),
            lte(servicePackages.validUntil, now.toISOString())
          )
        )
        .returning();

      if (result.length > 0) {
        console.log(`[Service Bundles] Deactivated ${result.length} expired packages`);
      }

      return result.length;
    } catch (error) {
      console.error('Error deactivating expired packages:', error);
      return 0;
    }
  }

  private formatCurrency(paisa: number): string {
    const rupees = paisa / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rupees);
  }
}

export const serviceBundleService = new ServiceBundleService();
