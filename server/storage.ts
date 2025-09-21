import { 
  type User, type InsertUser, type UpsertUser,
  type Service, type InsertService,
  type Booking, type InsertBooking,
  type Payment, type InsertPayment,
  type Salon, type InsertSalon,
  type Role, type InsertRole,
  type Organization, type InsertOrganization,
  type UserRole, type InsertUserRole,
  type OrgUser, type InsertOrgUser,
  type Staff, type InsertStaff,
  type AvailabilityPattern, type InsertAvailabilityPattern,
  type TimeSlot, type InsertTimeSlot,
  type BookingSettings, type InsertBookingSettings,
  type StaffService, type InsertStaffService,
  type Resource, type InsertResource,
  type ServiceResource, type InsertServiceResource,
  type MediaAsset, type InsertMediaAsset,
  type TaxRate, type InsertTaxRate,
  type PayoutAccount, type InsertPayoutAccount,
  type PublishState, type InsertPublishState,
  type CustomerProfile, type InsertCustomerProfile, type UpdateCustomerNotesInput,
  users, services, bookings, payments, salons, roles, organizations, userRoles, orgUsers,
  staff, availabilityPatterns, timeSlots, emailVerificationTokens,
  bookingSettings, staffServices, resources, serviceResources, mediaAssets, taxRates, payoutAccounts, publishState, customerProfiles
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>; // Required for Replit Auth
  
  // Role operations
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  getUserRoles(userId: string): Promise<Role[]>;
  assignUserRole(userId: string, roleId: string): Promise<void>;
  
  // Organization operations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  addUserToOrganization(orgId: string, userId: string, role: string): Promise<void>;
  getUserOrganizations(userId: string): Promise<Array<{
    orgId: string;
    orgRole: string;
    organization: {
      id: string;
      name: string;
      type: string;
    };
  }>>;
  
  // Salon operations (additional methods)
  getSalonById(id: string): Promise<Salon | undefined>;
  getSalonsByOrgId(orgId: string): Promise<Salon[]>;
  isUserStaffOfSalon(userId: string, salonId: string): Promise<boolean>;
  
  // Email verification operations
  createVerificationToken(email: string, userId: string): Promise<string>;
  verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; userId?: string }>;
  markEmailAsVerified(userId: string): Promise<void>;
  
  // Salon operations
  getSalon(id: string): Promise<Salon | undefined>;
  getAllSalons(): Promise<Salon[]>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  updateSalon(id: string, updates: Partial<InsertSalon>): Promise<void>;
  
  // Service operations
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getServicesBySalonId(salonId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<void>;
  deleteService(id: string): Promise<void>;
  
  // Booking operations
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<number>;
  updateBookingNotes(id: string, notes: string): Promise<number>;
  bulkUpdateBookingStatus(bookingIds: string[], status: string, salonId: string): Promise<number>;
  getBookingsBySalonId(salonId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Booking[]>;
  getCustomersBySalonId(salonId: string): Promise<any[]>;
  getSalonAnalytics(salonId: string, period: string): Promise<any>;
  
  // Advanced Analytics Methods
  getAdvancedStaffAnalytics(salonId: string, period: string): Promise<any>;
  getClientRetentionAnalytics(salonId: string, period: string): Promise<any>;
  getServicePopularityAnalytics(salonId: string, period: string): Promise<any>;
  getBusinessIntelligenceMetrics(salonId: string, period: string): Promise<any>;
  getCohortAnalysis(salonId: string): Promise<any>;
  getCustomerSegmentation(salonId: string): Promise<any>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByBookingId(bookingId: string): Promise<Payment | undefined>;
  getAllPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: string, status: string, completedAt?: Date): Promise<void>;
  updatePaymentOrderId(id: string, razorpayOrderId: string): Promise<void>;
  updatePaymentDetails(id: string, razorpayPaymentId: string, razorpaySignature: string): Promise<void>;
  getPaymentByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | undefined>;
  
  // Staff operations
  getStaff(id: string): Promise<Staff | undefined>;
  getStaffBySalonId(salonId: string): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: string, updates: Partial<InsertStaff>): Promise<void>;
  
  // Availability pattern operations
  getAvailabilityPattern(id: string): Promise<AvailabilityPattern | undefined>;
  getAvailabilityPatternsBySalonId(salonId: string): Promise<AvailabilityPattern[]>;
  getAvailabilityPatternsByStaffId(staffId: string): Promise<AvailabilityPattern[]>;
  createAvailabilityPattern(pattern: InsertAvailabilityPattern): Promise<AvailabilityPattern>;
  updateAvailabilityPattern(id: string, updates: Partial<InsertAvailabilityPattern>): Promise<void>;
  deleteAvailabilityPattern(id: string): Promise<void>;
  
  // Time slot operations
  getTimeSlot(id: string): Promise<TimeSlot | undefined>;
  getTimeSlotsByDateRange(salonId: string, startDate: string, endDate: string): Promise<TimeSlot[]>;
  getAvailableTimeSlots(salonId: string, date: string, staffId?: string): Promise<TimeSlot[]>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: string, updates: Partial<InsertTimeSlot>): Promise<void>;
  blockTimeSlot(id: string): Promise<void>;
  unblockTimeSlot(id: string): Promise<void>;
  
  // Availability generation
  generateTimeSlotsFromPattern(patternId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]>;
  regenerateTimeSlotsForSalon(salonId: string, startDate: Date, endDate: Date): Promise<void>;

  // Business Profile Setup Operations
  
  // Booking settings operations
  getBookingSettings(salonId: string): Promise<BookingSettings | undefined>;
  createBookingSettings(settings: InsertBookingSettings): Promise<BookingSettings>;
  updateBookingSettings(salonId: string, updates: Partial<InsertBookingSettings>): Promise<void>;
  
  // Staff-service operations  
  getStaffService(staffId: string, serviceId: string): Promise<StaffService | undefined>;
  getStaffServicesBySalonId(salonId: string): Promise<StaffService[]>;
  getStaffServicesByStaffId(staffId: string): Promise<StaffService[]>;
  getStaffServicesByServiceId(serviceId: string): Promise<StaffService[]>;
  createStaffService(staffService: InsertStaffService): Promise<StaffService>;
  updateStaffService(staffId: string, serviceId: string, updates: Partial<InsertStaffService>): Promise<void>;
  deleteStaffService(staffId: string, serviceId: string): Promise<void>;
  
  // Resource operations
  getResource(id: string): Promise<Resource | undefined>;
  getResourcesBySalonId(salonId: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: string, salonId: string, updates: Partial<InsertResource>): Promise<void>;
  deleteResource(id: string, salonId: string): Promise<void>;
  
  // Service-resource operations
  getServiceResource(serviceId: string, resourceId: string): Promise<ServiceResource | undefined>;
  getServiceResourcesBySalonId(salonId: string): Promise<ServiceResource[]>;
  getServiceResourcesByServiceId(serviceId: string): Promise<ServiceResource[]>;
  getServiceResourcesByResourceId(resourceId: string): Promise<ServiceResource[]>;
  createServiceResource(serviceResource: InsertServiceResource): Promise<ServiceResource>;
  updateServiceResource(serviceId: string, resourceId: string, updates: Partial<InsertServiceResource>): Promise<void>;
  deleteServiceResource(serviceId: string, resourceId: string): Promise<void>;
  
  // Media asset operations
  getMediaAsset(id: string): Promise<MediaAsset | undefined>;
  getMediaAssetsBySalonId(salonId: string): Promise<MediaAsset[]>;
  getMediaAssetsByType(salonId: string, assetType: string): Promise<MediaAsset[]>;
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  updateMediaAsset(id: string, salonId: string, updates: Partial<InsertMediaAsset>): Promise<void>;
  setPrimaryMediaAsset(salonId: string, assetId: string): Promise<MediaAsset>;
  deleteMediaAsset(id: string, salonId: string): Promise<void>;
  
  // Tax rate operations
  getTaxRate(id: string): Promise<TaxRate | undefined>;
  getTaxRatesBySalonId(salonId: string): Promise<TaxRate[]>;
  getDefaultTaxRate(salonId: string): Promise<TaxRate | undefined>;
  createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate>;
  updateTaxRate(id: string, salonId: string, updates: Partial<InsertTaxRate>): Promise<void>;
  setDefaultTaxRate(salonId: string, taxRateId: string): Promise<void>;
  deleteTaxRate(id: string, salonId: string): Promise<void>;
  
  // Payout account operations
  getPayoutAccount(id: string): Promise<PayoutAccount | undefined>;
  getPayoutAccountsBySalonId(salonId: string): Promise<PayoutAccount[]>;
  getDefaultPayoutAccount(salonId: string): Promise<PayoutAccount | undefined>;
  createPayoutAccount(account: InsertPayoutAccount): Promise<PayoutAccount>;
  updatePayoutAccount(id: string, salonId: string, updates: Partial<InsertPayoutAccount>): Promise<void>;
  setDefaultPayoutAccount(salonId: string, accountId: string): Promise<void>;
  deletePayoutAccount(id: string, salonId: string): Promise<void>;
  
  // Publish state operations
  getPublishState(salonId: string): Promise<PublishState | undefined>;
  createPublishState(state: InsertPublishState): Promise<PublishState>;
  updatePublishState(salonId: string, updates: Partial<InsertPublishState>): Promise<void>;
  checkBusinessReadiness(salonId: string): Promise<{ isReady: boolean; missingRequirements: string[] }>;
  checkDashboardCompletion(salonId: string): Promise<{
    profile: { isComplete: boolean; missingFields?: string[] };
    services: { isComplete: boolean; count: number };
    staff: { isComplete: boolean; count: number };
    settings: { isComplete: boolean; missingFields?: string[] };
    media: { isComplete: boolean; count: number };
    overallProgress: number;
    nextStep?: string;
  }>;
  
  // Customer profile operations
  getCustomerProfile(salonId: string, customerEmail: string): Promise<CustomerProfile | undefined>;
  getCustomerProfileById(id: string): Promise<CustomerProfile | undefined>;
  getOrCreateCustomerProfile(salonId: string, customerEmail: string): Promise<CustomerProfile | undefined>;
  createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  updateCustomerProfile(id: string, salonId: string, updates: UpdateCustomerNotesInput): Promise<void>;
  getCustomerBookingHistory(salonId: string, customerEmail: string): Promise<any[]>;
  getCustomerStats(salonId: string, customerEmail: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastVisit: string | null;
    favoriteServices: Array<{ serviceId: string; serviceName: string; count: number }>;
    averageSpend: number;
    bookingFrequency: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Generate username if not provided
    if (!user.username && user.email) {
      user.username = user.email.split('@')[0] + '_' + Date.now().toString().slice(-6);
    }
    
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Role operations
  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRolesList = await db.select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      createdAt: roles.createdAt,
    }).from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    
    return userRolesList;
  }

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    await db.insert(userRoles).values({ userId, roleId });
  }

  // Organization operations
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db.insert(organizations).values(organization).returning();
    return newOrg;
  }

  async addUserToOrganization(orgId: string, userId: string, role: string): Promise<void> {
    await db.insert(orgUsers).values({ orgId, userId, orgRole: role });
  }

  async getUserOrganizations(userId: string): Promise<Array<{
    orgId: string;
    orgRole: string;
    organization: {
      id: string;
      name: string;
      type: string;
    };
  }>> {
    const userOrgs = await db
      .select({
        orgId: orgUsers.orgId,
        orgRole: orgUsers.orgRole,
        orgName: organizations.name,
        orgId2: organizations.id,
        orgDescription: organizations.description
      })
      .from(orgUsers)
      .innerJoin(organizations, eq(orgUsers.orgId, organizations.id))
      .where(eq(orgUsers.userId, userId));

    return userOrgs.map(org => ({
      orgId: org.orgId,
      orgRole: org.orgRole,
      organization: {
        id: org.orgId2,
        name: org.orgName,
        type: 'salon' // Default type for now
      }
    }));
  }

  async getSalonById(id: string): Promise<Salon | undefined> {
    return this.getSalon(id);
  }

  async getSalonsByOrgId(orgId: string): Promise<Salon[]> {
    return await db.select().from(salons).where(and(
      eq(salons.orgId, orgId),
      eq(salons.isActive, 1)
    ));
  }

  async isUserStaffOfSalon(userId: string, salonId: string): Promise<boolean> {
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.userId, userId), eq(staff.salonId, salonId)));
    return !!staffMember;
  }

  // Salon operations
  async getSalon(id: string): Promise<Salon | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.id, id));
    return salon || undefined;
  }

  async getAllSalons(): Promise<Salon[]> {
    return await db.select().from(salons).where(eq(salons.isActive, 1));
  }

  async createSalon(salon: InsertSalon): Promise<Salon> {
    const [newSalon] = await db.insert(salons).values(salon).returning();
    return newSalon;
  }

  async updateSalon(id: string, updates: Partial<InsertSalon>): Promise<void> {
    await db.update(salons).set(updates).where(eq(salons.id, id));
  }

  // Service operations
  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, 1));
  }

  async getServicesBySalonId(salonId: string): Promise<Service[]> {
    return await db.select().from(services).where(and(
      eq(services.salonId, salonId),
      eq(services.isActive, 1)
    ));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<void> {
    await db.update(services).set(updates).where(eq(services.id, id));
  }

  async deleteService(id: string): Promise<void> {
    await db.update(services).set({ isActive: 0 }).where(eq(services.id, id));
  }

  // Booking operations
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBookingStatus(id: string, status: string): Promise<number> {
    const result = await db.update(bookings).set({ status }).where(eq(bookings.id, id));
    return result.rowCount || 0;
  }

  async updateBookingNotes(id: string, notes: string): Promise<number> {
    const result = await db.update(bookings).set({ notes }).where(eq(bookings.id, id));
    return result.rowCount || 0;
  }

  async bulkUpdateBookingStatus(bookingIds: string[], status: string, salonId: string): Promise<number> {
    const result = await db
      .update(bookings)
      .set({ status })
      .where(and(
        inArray(bookings.id, bookingIds),
        eq(bookings.salonId, salonId) // Security: ensure bookings belong to the salon
      ));
    return result.rowCount || 0;
  }

  async getBookingsBySalonId(salonId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Booking[]> {
    try {
      const conditions = [eq(bookings.salonId, salonId)];

      // Add status filter if provided
      if (filters?.status) {
        conditions.push(eq(bookings.status, filters.status));
      }

      // Add date range filters if provided
      if (filters?.startDate) {
        conditions.push(gte(bookings.bookingDate, filters.startDate));
      }
      if (filters?.endDate) {
        conditions.push(lte(bookings.bookingDate, filters.endDate));
      }

      return await db
        .select()
        .from(bookings)
        .where(and(...conditions))
        .orderBy(desc(bookings.createdAt));
    } catch (error) {
      console.error('Error fetching bookings by salon ID:', error);
      throw error;
    }
  }

  async getCustomersBySalonId(salonId: string): Promise<any[]> {
    try {
      // Get unique customers from bookings for this salon
      const customers = await db
        .selectDistinct({
          name: bookings.customerName,
          email: bookings.customerEmail,
          phone: bookings.customerPhone,
          totalBookings: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          lastBookingDate: sql<string>`max(${bookings.bookingDate})`,
          lastBookingStatus: sql<string>`max(${bookings.status})`
        })
        .from(bookings)
        .where(eq(bookings.salonId, salonId))
        .groupBy(bookings.customerEmail, bookings.customerName, bookings.customerPhone)
        .orderBy(desc(sql`max(${bookings.createdAt})`));

      return customers.map(customer => ({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalBookings: Number(customer.totalBookings) || 0,
        totalSpentPaisa: Number(customer.totalSpent) || 0,
        lastBookingDate: customer.lastBookingDate,
        lastBookingStatus: customer.lastBookingStatus
      }));
    } catch (error) {
      console.error('Error fetching customers by salon ID:', error);
      throw error;
    }
  }

  async getSalonAnalytics(salonId: string, period: string): Promise<any> {
    try {
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      const previousStartDate = new Date();
      const previousEndDate = new Date();
      
      // Today's date for daily metrics
      const today = new Date().toISOString().split('T')[0];
      
      switch (period) {
        case 'daily':
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          previousStartDate.setDate(endDate.getDate() - 2);
          previousEndDate.setDate(endDate.getDate() - 1);
          break;
        case 'weekly':
        case 'week':
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          previousStartDate.setDate(endDate.getDate() - 14);
          previousEndDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
        case 'month':
        case '30d':
          startDate.setMonth(endDate.getMonth() - 1);
          previousStartDate.setMonth(endDate.getMonth() - 2);
          previousEndDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarterly':
        case 'quarter':
        case '90d':
          startDate.setMonth(endDate.getMonth() - 3);
          previousStartDate.setMonth(endDate.getMonth() - 6);
          previousEndDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'yearly':
        case 'year':
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          previousStartDate.setFullYear(endDate.getFullYear() - 2);
          previousEndDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1); // Default to month
          previousStartDate.setMonth(endDate.getMonth() - 2);
          previousEndDate.setMonth(endDate.getMonth() - 1);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

      // Get current period stats
      const bookingStats = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          confirmedBookings: sql<number>`count(case when ${bookings.status} = 'confirmed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ));

      // Get previous period stats for comparison
      const previousBookingStats = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          confirmedBookings: sql<number>`count(case when ${bookings.status} = 'confirmed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, previousStartDateStr),
          lte(bookings.bookingDate, previousEndDateStr)
        ));

      // Get today's specific data
      const todayStats = await db
        .select({
          todayBookings: sql<number>`count(*)`,
          todayRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          todayConfirmed: sql<number>`count(case when ${bookings.status} = 'confirmed' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.bookingDate, today)
        ));

      // Get active staff count
      const activeStaffCount = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(staff)
        .where(and(
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ));

      // Get popular services
      const popularServices = await db
        .select({
          serviceName: services.name,
          bookingCount: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(services.id, services.name)
        .orderBy(desc(sql`count(*)`))
        .limit(5);

      // Get booking trends by day
      const bookingTrends = await db
        .select({
          date: bookings.bookingDate,
          bookingCount: sql<number>`count(*)`,
          revenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(bookings.bookingDate)
        .orderBy(asc(bookings.bookingDate));

      // Get staff performance
      const staffPerformance = await db
        .select({
          staffName: staff.name,
          bookingCount: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(bookings)
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(staff.id, staff.name)
        .orderBy(desc(sql`count(*)`));

      const stats = bookingStats[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0
      };

      const previousStats = previousBookingStats[0] || {
        totalBookings: 0,
        totalRevenue: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0
      };

      const todayData = todayStats[0] || {
        todayBookings: 0,
        todayRevenue: 0,
        todayConfirmed: 0
      };

      const staffCount = activeStaffCount[0]?.count || 0;

      // Calculate trends and percentages
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? { percentage: 100, trend: 'up' } : { percentage: 0, trend: 'neutral' };
        const change = ((current - previous) / previous) * 100;
        return {
          percentage: Math.abs(change),
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
        };
      };

      const currentBookings = Number(stats.totalBookings) || 0;
      const currentRevenue = Number(stats.totalRevenue) || 0;
      const previousBookings = Number(previousStats.totalBookings) || 0;
      const previousRevenue = Number(previousStats.totalRevenue) || 0;

      const bookingsTrend = calculateTrend(currentBookings, previousBookings);
      const revenueTrend = calculateTrend(currentRevenue, previousRevenue);

      // Calculate average booking value
      const averageBookingValue = currentBookings > 0 ? currentRevenue / currentBookings : 0;
      const previousAverageBookingValue = previousBookings > 0 ? previousRevenue / previousBookings : 0;
      const averageValueTrend = calculateTrend(averageBookingValue, previousAverageBookingValue);

      return {
        period,
        startDate: startDateStr,
        endDate: endDateStr,
        overview: {
          // Current period data
          totalBookings: currentBookings,
          totalRevenuePaisa: currentRevenue,
          confirmedBookings: Number(stats.confirmedBookings) || 0,
          cancelledBookings: Number(stats.cancelledBookings) || 0,
          completedBookings: Number(stats.completedBookings) || 0,
          cancellationRate: currentBookings > 0 
            ? ((Number(stats.cancelledBookings) || 0) / currentBookings * 100).toFixed(2)
            : '0.00',
          
          // Today's specific data
          todayBookings: Number(todayData.todayBookings) || 0,
          todayRevenuePaisa: Number(todayData.todayRevenue) || 0,
          todayConfirmed: Number(todayData.todayConfirmed) || 0,
          
          // Staff metrics
          activeStaffCount: Number(staffCount),
          
          // Average values
          averageBookingValuePaisa: Math.round(averageBookingValue),
          
          // Trending data with percentages
          bookingsTrend: {
            percentage: bookingsTrend.percentage.toFixed(1),
            direction: bookingsTrend.trend,
            previousPeriodValue: previousBookings
          },
          revenueTrend: {
            percentage: revenueTrend.percentage.toFixed(1),
            direction: revenueTrend.trend,
            previousPeriodValue: previousRevenue
          },
          averageValueTrend: {
            percentage: averageValueTrend.percentage.toFixed(1),
            direction: averageValueTrend.trend,
            previousPeriodValue: Math.round(previousAverageBookingValue)
          }
        },
        popularServices: popularServices.map(service => ({
          serviceName: service.serviceName,
          bookingCount: Number(service.bookingCount) || 0,
          totalRevenuePaisa: Number(service.totalRevenue) || 0
        })),
        bookingTrends: bookingTrends.map(trend => ({
          date: trend.date,
          bookingCount: Number(trend.bookingCount) || 0,
          revenuePaisa: Number(trend.revenue) || 0
        })),
        staffPerformance: staffPerformance
          .filter(performer => performer.staffName) // Filter out null staff names
          .map(performer => ({
            staffName: performer.staffName,
            bookingCount: Number(performer.bookingCount) || 0,
            totalRevenuePaisa: Number(performer.totalRevenue) || 0,
            utilization: staffCount > 0 ? ((Number(performer.bookingCount) || 0) / currentBookings * 100).toFixed(1) : '0.0'
          }))
      };
    } catch (error) {
      console.error('Error fetching salon analytics:', error);
      throw error;
    }
  }

  // Advanced Staff Analytics
  async getAdvancedStaffAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate, previousStartDate, previousEndDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

      // Get detailed staff performance metrics
      const staffMetrics = await db
        .select({
          staffId: staff.id,
          staffName: staff.name,
          position: staff.position,
          hourlyRatePaisa: staff.hourlyRatePaisa,
          totalBookings: sql<number>`count(${bookings.id})`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          averageBookingValue: sql<number>`avg(${bookings.totalAmountPaisa})`,
          workingDays: sql<number>`count(distinct ${bookings.bookingDate})`,
          firstBookingDate: sql<string>`min(${bookings.bookingDate})`,
          lastBookingDate: sql<string>`max(${bookings.bookingDate})`
        })
        .from(staff)
        .leftJoin(bookings, and(
          eq(bookings.staffId, staff.id),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .where(and(
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ))
        .groupBy(staff.id, staff.name, staff.position, staff.hourlyRatePaisa);

      // Calculate utilization and efficiency metrics
      const staffAnalytics = staffMetrics.map(staff => {
        const totalBookings = Number(staff.totalBookings) || 0;
        const completedBookings = Number(staff.completedBookings) || 0;
        const cancelledBookings = Number(staff.cancelledBookings) || 0;
        const totalRevenue = Number(staff.totalRevenue) || 0;
        const workingDays = Number(staff.workingDays) || 0;
        const averageBookingValue = Number(staff.averageBookingValue) || 0;

        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100) : 0;
        const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings * 100) : 0;
        const bookingsPerDay = workingDays > 0 ? (totalBookings / workingDays) : 0;
        const revenuePerDay = workingDays > 0 ? (totalRevenue / workingDays) : 0;

        return {
          staffId: staff.staffId,
          staffName: staff.staffName,
          position: staff.position,
          totalBookings,
          completedBookings,
          completionRate: Number(completionRate.toFixed(1)),
          cancellationRate: Number(cancellationRate.toFixed(1)),
          totalRevenuePaisa: totalRevenue,
          averageBookingValuePaisa: Math.round(averageBookingValue),
          workingDays,
          bookingsPerDay: Number(bookingsPerDay.toFixed(1)),
          revenuePerDay: Math.round(revenuePerDay),
          utilizationScore: Number((completionRate * 0.6 + bookingsPerDay * 10).toFixed(1)),
          efficiency: Number((totalRevenue / Math.max(totalBookings, 1)).toFixed(0))
        };
      });

      return {
        period,
        staffAnalytics: staffAnalytics.sort((a, b) => b.totalRevenuePaisa - a.totalRevenuePaisa),
        summary: {
          totalStaff: staffAnalytics.length,
          averageUtilization: staffAnalytics.length > 0 
            ? Number((staffAnalytics.reduce((sum, s) => sum + s.utilizationScore, 0) / staffAnalytics.length).toFixed(1))
            : 0,
          topPerformer: staffAnalytics.length > 0 ? staffAnalytics[0].staffName : null,
          totalStaffRevenue: staffAnalytics.reduce((sum, s) => sum + s.totalRevenuePaisa, 0)
        }
      };
    } catch (error) {
      console.error('Error fetching advanced staff analytics:', error);
      throw error;
    }
  }

  // Client Retention Analytics
  async getClientRetentionAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get customer behavior data
      const customerMetrics = await db
        .select({
          customerEmail: bookings.customerEmail,
          customerName: bookings.customerName,
          totalBookings: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          firstBooking: sql<string>`min(${bookings.bookingDate})`,
          lastBooking: sql<string>`max(${bookings.bookingDate})`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .groupBy(bookings.customerEmail, bookings.customerName);

      // Calculate retention metrics
      const now = new Date();
      const retentionAnalytics = customerMetrics.map(customer => {
        const totalBookings = Number(customer.totalBookings) || 0;
        const totalSpent = Number(customer.totalSpent) || 0;
        const completedBookings = Number(customer.completedBookings) || 0;
        const firstBookingDate = new Date(customer.firstBooking);
        const lastBookingDate = new Date(customer.lastBooking);
        
        const daysSinceFirst = Math.floor((now.getTime() - firstBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLast = Math.floor((now.getTime() - lastBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const customerLifespan = Math.floor((lastBookingDate.getTime() - firstBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const averageDaysBetweenBookings = totalBookings > 1 ? customerLifespan / (totalBookings - 1) : 0;

        // Customer lifecycle stage
        let lifecycleStage = 'new';
        if (totalBookings >= 5) lifecycleStage = 'loyal';
        else if (totalBookings >= 2) lifecycleStage = 'returning';
        
        // Churn risk assessment
        let churnRisk = 'low';
        if (daysSinceLast > 90) churnRisk = 'high';
        else if (daysSinceLast > 45) churnRisk = 'medium';

        return {
          customerEmail: customer.customerEmail,
          customerName: customer.customerName,
          totalBookings,
          completedBookings,
          totalSpentPaisa: totalSpent,
          averageBookingValuePaisa: totalBookings > 0 ? Math.round(totalSpent / totalBookings) : 0,
          daysSinceFirst,
          daysSinceLast,
          averageDaysBetweenBookings: Math.round(averageDaysBetweenBookings),
          lifecycleStage,
          churnRisk,
          lifetimeValue: totalSpent
        };
      });

      // Calculate aggregate retention metrics
      const totalCustomers = retentionAnalytics.length;
      const returningCustomers = retentionAnalytics.filter(c => c.totalBookings > 1).length;
      const loyalCustomers = retentionAnalytics.filter(c => c.lifecycleStage === 'loyal').length;
      const highRiskCustomers = retentionAnalytics.filter(c => c.churnRisk === 'high').length;

      const averageLifetimeValue = totalCustomers > 0 
        ? retentionAnalytics.reduce((sum, c) => sum + c.lifetimeValue, 0) / totalCustomers 
        : 0;

      return {
        period,
        customerAnalytics: retentionAnalytics.sort((a, b) => b.lifetimeValue - a.lifetimeValue),
        retentionMetrics: {
          totalCustomers,
          newCustomers: retentionAnalytics.filter(c => c.lifecycleStage === 'new').length,
          returningCustomers,
          loyalCustomers,
          retentionRate: totalCustomers > 0 ? Number((returningCustomers / totalCustomers * 100).toFixed(1)) : 0,
          loyaltyRate: totalCustomers > 0 ? Number((loyalCustomers / totalCustomers * 100).toFixed(1)) : 0,
          churnRisk: {
            high: highRiskCustomers,
            medium: retentionAnalytics.filter(c => c.churnRisk === 'medium').length,
            low: retentionAnalytics.filter(c => c.churnRisk === 'low').length
          },
          averageLifetimeValuePaisa: Math.round(averageLifetimeValue),
          averageBookingsPerCustomer: totalCustomers > 0 
            ? Number((retentionAnalytics.reduce((sum, c) => sum + c.totalBookings, 0) / totalCustomers).toFixed(1))
            : 0
        }
      };
    } catch (error) {
      console.error('Error fetching client retention analytics:', error);
      throw error;
    }
  }

  // Service Popularity Analytics
  async getServicePopularityAnalytics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate, previousStartDate, previousEndDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
      const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

      // Current period service performance
      const currentServiceMetrics = await db
        .select({
          serviceId: services.id,
          serviceName: services.name,
          serviceCategory: services.category,
          servicePricePaisa: services.priceInPaisa,
          serviceDuration: services.durationMinutes,
          totalBookings: sql<number>`count(*)`,
          completedBookings: sql<number>`count(case when ${bookings.status} = 'completed' then 1 end)`,
          cancelledBookings: sql<number>`count(case when ${bookings.status} = 'cancelled' then 1 end)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          averageBookingValue: sql<number>`avg(${bookings.totalAmountPaisa})`,
          uniqueCustomers: sql<number>`count(distinct ${bookings.customerEmail})`
        })
        .from(services)
        .leftJoin(bookings, and(
          eq(bookings.serviceId, services.id),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr)
        ))
        .where(eq(services.salonId, salonId))
        .groupBy(services.id, services.name, services.category, services.priceInPaisa, services.durationMinutes);

      // Previous period for comparison
      const previousServiceMetrics = await db
        .select({
          serviceId: services.id,
          totalBookings: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${bookings.totalAmountPaisa})`
        })
        .from(services)
        .leftJoin(bookings, and(
          eq(bookings.serviceId, services.id),
          gte(bookings.bookingDate, previousStartDateStr),
          lte(bookings.bookingDate, previousEndDateStr)
        ))
        .where(eq(services.salonId, salonId))
        .groupBy(services.id);

      // Create lookup for previous period data
      const previousMetricsMap = new Map();
      previousServiceMetrics.forEach(metric => {
        previousMetricsMap.set(metric.serviceId, {
          totalBookings: Number(metric.totalBookings) || 0,
          totalRevenue: Number(metric.totalRevenue) || 0
        });
      });

      // Calculate service analytics with trends
      const serviceAnalytics = currentServiceMetrics.map(service => {
        const totalBookings = Number(service.totalBookings) || 0;
        const completedBookings = Number(service.completedBookings) || 0;
        const totalRevenue = Number(service.totalRevenue) || 0;
        const uniqueCustomers = Number(service.uniqueCustomers) || 0;
        
        const previousData = previousMetricsMap.get(service.serviceId) || { totalBookings: 0, totalRevenue: 0 };
        
        const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100) : 0;
        const cancellationRate = totalBookings > 0 ? (Number(service.cancelledBookings) / totalBookings * 100) : 0;
        const revenuePerBooking = totalBookings > 0 ? (totalRevenue / totalBookings) : 0;
        
        // Trend calculations
        const bookingsTrend = this.calculateTrendMetric(totalBookings, previousData.totalBookings);
        const revenueTrend = this.calculateTrendMetric(totalRevenue, previousData.totalRevenue);

        return {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          category: service.serviceCategory,
          standardPricePaisa: Number(service.servicePricePaisa) || 0,
          durationMinutes: Number(service.serviceDuration) || 0,
          totalBookings,
          completedBookings,
          completionRate: Number(completionRate.toFixed(1)),
          cancellationRate: Number(cancellationRate.toFixed(1)),
          totalRevenuePaisa: totalRevenue,
          averageRevenuePerBookingPaisa: Math.round(revenuePerBooking),
          uniqueCustomers,
          customerReturnRate: uniqueCustomers > 0 ? Number(((totalBookings - uniqueCustomers) / uniqueCustomers * 100).toFixed(1)) : 0,
          bookingsTrend,
          revenueTrend,
          popularityScore: totalBookings * 0.4 + completionRate * 0.3 + (uniqueCustomers / Math.max(totalBookings, 1)) * 100 * 0.3
        };
      });

      // Service category analysis
      const categoryAnalysis = {};
      serviceAnalytics.forEach(service => {
        const category = service.category || 'Other';
        if (!categoryAnalysis[category]) {
          categoryAnalysis[category] = {
            serviceCount: 0,
            totalBookings: 0,
            totalRevenue: 0,
            averageCompletionRate: 0
          };
        }
        categoryAnalysis[category].serviceCount++;
        categoryAnalysis[category].totalBookings += service.totalBookings;
        categoryAnalysis[category].totalRevenue += service.totalRevenuePaisa;
        categoryAnalysis[category].averageCompletionRate += service.completionRate;
      });

      // Calculate category averages
      Object.values(categoryAnalysis).forEach((category: any) => {
        category.averageCompletionRate = category.serviceCount > 0 
          ? Number((category.averageCompletionRate / category.serviceCount).toFixed(1))
          : 0;
      });

      return {
        period,
        serviceAnalytics: serviceAnalytics.sort((a, b) => b.popularityScore - a.popularityScore),
        categoryAnalysis,
        insights: {
          topService: serviceAnalytics.length > 0 ? serviceAnalytics[0].serviceName : null,
          mostProfitableService: serviceAnalytics.length > 0 
            ? serviceAnalytics.sort((a, b) => b.totalRevenuePaisa - a.totalRevenuePaisa)[0].serviceName 
            : null,
          highestCompletionRate: serviceAnalytics.length > 0 
            ? Math.max(...serviceAnalytics.map(s => s.completionRate))
            : 0,
          lowestCancellationRate: serviceAnalytics.length > 0 
            ? Math.min(...serviceAnalytics.map(s => s.cancellationRate))
            : 0
        }
      };
    } catch (error) {
      console.error('Error fetching service popularity analytics:', error);
      throw error;
    }
  }

  // Business Intelligence Metrics
  async getBusinessIntelligenceMetrics(salonId: string, period: string): Promise<any> {
    try {
      const { startDate, endDate } = this.calculateDateRange(period);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Revenue forecasting based on trends
      const dailyRevenue = await db
        .select({
          date: bookings.bookingDate,
          revenue: sql<number>`sum(${bookings.totalAmountPaisa})`,
          bookingCount: sql<number>`count(*)`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, startDateStr),
          lte(bookings.bookingDate, endDateStr),
          eq(bookings.status, 'completed')
        ))
        .groupBy(bookings.bookingDate)
        .orderBy(asc(bookings.bookingDate));

      // Calculate growth trends
      const revenueData = dailyRevenue.map(day => Number(day.revenue) || 0);
      const bookingData = dailyRevenue.map(day => Number(day.bookingCount) || 0);
      
      const averageRevenue = revenueData.length > 0 ? revenueData.reduce((a, b) => a + b, 0) / revenueData.length : 0;
      const averageBookings = bookingData.length > 0 ? bookingData.reduce((a, b) => a + b, 0) / bookingData.length : 0;
      
      // Simple linear trend calculation
      const revenueTrend = this.calculateLinearTrend(revenueData);
      const bookingTrend = this.calculateLinearTrend(bookingData);

      // Peak performance analysis
      const peakRevenueDay = dailyRevenue.length > 0 
        ? dailyRevenue.reduce((max, day) => Number(day.revenue) > Number(max.revenue) ? day : max)
        : null;

      const peakBookingDay = dailyRevenue.length > 0 
        ? dailyRevenue.reduce((max, day) => Number(day.bookingCount) > Number(max.bookingCount) ? day : max)
        : null;

      // Capacity utilization
      const totalStaff = await db
        .select({ count: sql<number>`count(*)` })
        .from(staff)
        .where(and(eq(staff.salonId, salonId), eq(staff.isActive, 1)));

      const staffCount = totalStaff[0]?.count || 0;
      const workingDaysInPeriod = dailyRevenue.length;
      const totalBookings = bookingData.reduce((a, b) => a + b, 0);
      
      // Assume 8 hours working day, 1 hour per booking average
      const theoreticalCapacity = staffCount * workingDaysInPeriod * 8;
      const capacityUtilization = theoreticalCapacity > 0 ? (totalBookings / theoreticalCapacity * 100) : 0;

      return {
        period,
        forecasting: {
          averageDailyRevenuePaisa: Math.round(averageRevenue),
          averageDailyBookings: Number(averageBookings.toFixed(1)),
          revenueTrendSlope: revenueTrend.slope,
          bookingTrendSlope: bookingTrend.slope,
          projectedNextPeriodRevenuePaisa: Math.round(averageRevenue * (1 + revenueTrend.slope / 100)),
          projectedNextPeriodBookings: Math.round(averageBookings * (1 + bookingTrend.slope / 100))
        },
        performance: {
          peakRevenueDay: peakRevenueDay ? {
            date: peakRevenueDay.date,
            revenuePaisa: Number(peakRevenueDay.revenue),
            bookings: Number(peakRevenueDay.bookingCount)
          } : null,
          peakBookingDay: peakBookingDay ? {
            date: peakBookingDay.date,
            revenuePaisa: Number(peakBookingDay.revenue),
            bookings: Number(peakBookingDay.bookingCount)
          } : null,
          capacityUtilization: Number(capacityUtilization.toFixed(1)),
          staffCount,
          workingDays: workingDaysInPeriod
        },
        trends: {
          dailyData: dailyRevenue.map(day => ({
            date: day.date,
            revenuePaisa: Number(day.revenue) || 0,
            bookings: Number(day.bookingCount) || 0
          })),
          revenueGrowthRate: Number(revenueTrend.slope.toFixed(2)),
          bookingGrowthRate: Number(bookingTrend.slope.toFixed(2))
        }
      };
    } catch (error) {
      console.error('Error fetching business intelligence metrics:', error);
      throw error;
    }
  }

  // Cohort Analysis
  async getCohortAnalysis(salonId: string): Promise<any> {
    try {
      // Get all customers with their first booking date
      const customerCohorts = await db
        .select({
          customerEmail: bookings.customerEmail,
          firstBookingDate: sql<string>`min(${bookings.bookingDate})`,
          totalBookings: sql<number>`count(*)`
        })
        .from(bookings)
        .where(eq(bookings.salonId, salonId))
        .groupBy(bookings.customerEmail);

      // Group customers by cohort (month of first booking)
      const cohortData = {};
      customerCohorts.forEach(customer => {
        const cohortMonth = customer.firstBookingDate.substring(0, 7); // YYYY-MM format
        if (!cohortData[cohortMonth]) {
          cohortData[cohortMonth] = {
            cohortSize: 0,
            customers: []
          };
        }
        cohortData[cohortMonth].cohortSize++;
        cohortData[cohortMonth].customers.push({
          email: customer.customerEmail,
          totalBookings: Number(customer.totalBookings)
        });
      });

      // Calculate retention rates for each cohort
      const cohortAnalysis = Object.entries(cohortData).map(([cohortMonth, data]: [string, any]) => {
        const returningCustomers = data.customers.filter(c => c.totalBookings > 1).length;
        const loyalCustomers = data.customers.filter(c => c.totalBookings >= 5).length;
        
        return {
          cohortMonth,
          cohortSize: data.cohortSize,
          returningCustomers,
          loyalCustomers,
          retentionRate: data.cohortSize > 0 ? Number((returningCustomers / data.cohortSize * 100).toFixed(1)) : 0,
          loyaltyRate: data.cohortSize > 0 ? Number((loyalCustomers / data.cohortSize * 100).toFixed(1)) : 0,
          averageBookingsPerCustomer: data.cohortSize > 0 
            ? Number((data.customers.reduce((sum, c) => sum + c.totalBookings, 0) / data.cohortSize).toFixed(1))
            : 0
        };
      }).sort((a, b) => b.cohortMonth.localeCompare(a.cohortMonth));

      return {
        cohorts: cohortAnalysis,
        summary: {
          totalCohorts: cohortAnalysis.length,
          averageRetentionRate: cohortAnalysis.length > 0 
            ? Number((cohortAnalysis.reduce((sum, c) => sum + c.retentionRate, 0) / cohortAnalysis.length).toFixed(1))
            : 0,
          averageLoyaltyRate: cohortAnalysis.length > 0 
            ? Number((cohortAnalysis.reduce((sum, c) => sum + c.loyaltyRate, 0) / cohortAnalysis.length).toFixed(1))
            : 0,
          bestPerformingCohort: cohortAnalysis.length > 0 
            ? cohortAnalysis.reduce((best, current) => current.retentionRate > best.retentionRate ? current : best)
            : null
        }
      };
    } catch (error) {
      console.error('Error fetching cohort analysis:', error);
      throw error;
    }
  }

  // Customer Segmentation
  async getCustomerSegmentation(salonId: string): Promise<any> {
    try {
      const customerData = await db
        .select({
          customerEmail: bookings.customerEmail,
          customerName: bookings.customerName,
          totalBookings: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          lastBookingDate: sql<string>`max(${bookings.bookingDate})`,
          firstBookingDate: sql<string>`min(${bookings.bookingDate})`
        })
        .from(bookings)
        .where(eq(bookings.salonId, salonId))
        .groupBy(bookings.customerEmail, bookings.customerName);

      // Segment customers based on RFM analysis (Recency, Frequency, Monetary)
      const now = new Date();
      const segments = {
        champions: [], // High value, frequent, recent
        loyalCustomers: [], // High frequency, good monetary
        potentialLoyalists: [], // Recent customers with good frequency
        newCustomers: [], // Recent but low frequency
        promising: [], // Recent customers with potential
        needsAttention: [], // Good monetary but declining frequency
        aboutToSleep: [], // Low recency but good historical value
        atRisk: [], // Low recency and frequency but good monetary
        cannotLoseThem: [], // High monetary value but low recency
        hibernating: [] // Low on all metrics
      };

      customerData.forEach(customer => {
        const totalBookings = Number(customer.totalBookings);
        const totalSpent = Number(customer.totalSpent);
        const lastBookingDate = new Date(customer.lastBookingDate);
        const firstBookingDate = new Date(customer.firstBookingDate);
        
        const daysSinceLastBooking = Math.floor((now.getTime() - lastBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const customerAge = Math.floor((now.getTime() - firstBookingDate.getTime()) / (1000 * 60 * 60 * 24));
        const averageBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;

        // Simple segmentation logic
        if (totalBookings >= 5 && daysSinceLastBooking <= 30 && totalSpent >= 500000) {
          segments.champions.push(customer);
        } else if (totalBookings >= 3 && daysSinceLastBooking <= 60) {
          segments.loyalCustomers.push(customer);
        } else if (daysSinceLastBooking <= 30 && totalBookings >= 2) {
          segments.potentialLoyalists.push(customer);
        } else if (daysSinceLastBooking <= 30 && totalBookings === 1) {
          segments.newCustomers.push(customer);
        } else if (daysSinceLastBooking <= 60 && totalBookings >= 2) {
          segments.promising.push(customer);
        } else if (totalSpent >= 300000 && daysSinceLastBooking <= 90) {
          segments.needsAttention.push(customer);
        } else if (totalSpent >= 200000 && daysSinceLastBooking <= 120) {
          segments.aboutToSleep.push(customer);
        } else if (totalBookings >= 2 && daysSinceLastBooking <= 180) {
          segments.atRisk.push(customer);
        } else if (totalSpent >= 500000) {
          segments.cannotLoseThem.push(customer);
        } else {
          segments.hibernating.push(customer);
        }
      });

      // Calculate segment metrics
      const segmentMetrics = Object.entries(segments).map(([segmentName, customers]: [string, any[]]) => ({
        segmentName,
        customerCount: customers.length,
        totalRevenuePaisa: customers.reduce((sum, c) => sum + Number(c.totalSpent), 0),
        averageLifetimeValuePaisa: customers.length > 0 
          ? Math.round(customers.reduce((sum, c) => sum + Number(c.totalSpent), 0) / customers.length)
          : 0,
        averageBookings: customers.length > 0 
          ? Number((customers.reduce((sum, c) => sum + Number(c.totalBookings), 0) / customers.length).toFixed(1))
          : 0,
        percentage: customerData.length > 0 ? Number((customers.length / customerData.length * 100).toFixed(1)) : 0
      }));

      return {
        segments: segmentMetrics.sort((a, b) => b.totalRevenuePaisa - a.totalRevenuePaisa),
        totalCustomers: customerData.length,
        insights: {
          highValueSegments: ['champions', 'loyalCustomers', 'cannotLoseThem'],
          atRiskSegments: ['aboutToSleep', 'atRisk', 'hibernating'],
          growthOpportunitySegments: ['potentialLoyalists', 'promising', 'newCustomers']
        }
      };
    } catch (error) {
      console.error('Error fetching customer segmentation:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateDateRange(period: string) {
    const endDate = new Date();
    const startDate = new Date();
    const previousStartDate = new Date();
    const previousEndDate = new Date();
    
    switch (period) {
      case 'daily':
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        previousStartDate.setDate(endDate.getDate() - 2);
        previousEndDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
      case 'week':
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        previousStartDate.setDate(endDate.getDate() - 14);
        previousEndDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
      case 'month':
      case '30d':
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(endDate.getMonth() - 2);
        previousEndDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
      case 'quarter':
      case '90d':
        startDate.setMonth(endDate.getMonth() - 3);
        previousStartDate.setMonth(endDate.getMonth() - 6);
        previousEndDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'yearly':
      case 'year':
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        previousStartDate.setFullYear(endDate.getFullYear() - 2);
        previousEndDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
        previousStartDate.setMonth(endDate.getMonth() - 2);
        previousEndDate.setMonth(endDate.getMonth() - 1);
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  private calculateTrendMetric(current: number, previous: number) {
    if (previous === 0) {
      return current > 0 ? { percentage: '100.0', direction: 'up' } : { percentage: '0.0', direction: 'neutral' };
    }
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  }

  private calculateLinearTrend(data: number[]) {
    if (data.length < 2) return { slope: 0, intercept: 0 };
    
    const n = data.length;
    const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = data.reduce((sum, _, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope: slope || 0, intercept: intercept || 0 };
  }

  // Payment operations
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByBookingId(bookingId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.bookingId, bookingId));
    return payment || undefined;
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    const updates: any = { status };
    if (completedAt) {
      updates.completedAt = completedAt;
    }
    await db.update(payments).set(updates).where(eq(payments.id, id));
  }

  async updatePaymentOrderId(id: string, razorpayOrderId: string): Promise<void> {
    await db.update(payments).set({ razorpayOrderId }).where(eq(payments.id, id));
  }

  async updatePaymentDetails(id: string, razorpayPaymentId: string, razorpaySignature: string): Promise<void> {
    await db.update(payments).set({ 
      razorpayPaymentId, 
      razorpaySignature 
    }).where(eq(payments.id, id));
  }

  async getPaymentByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, razorpayOrderId));
    return payment || undefined;
  }

  // Staff operations
  async getStaff(id: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember || undefined;
  }

  async getStaffBySalonId(salonId: string): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.salonId, salonId));
  }

  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffData).returning();
    return newStaff;
  }

  async updateStaff(id: string, updates: Partial<InsertStaff>): Promise<void> {
    await db.update(staff).set(updates).where(eq(staff.id, id));
  }

  // Availability pattern operations
  async getAvailabilityPattern(id: string): Promise<AvailabilityPattern | undefined> {
    const [pattern] = await db.select().from(availabilityPatterns).where(eq(availabilityPatterns.id, id));
    return pattern || undefined;
  }

  async getAvailabilityPatternsBySalonId(salonId: string): Promise<AvailabilityPattern[]> {
    return await db.select().from(availabilityPatterns).where(eq(availabilityPatterns.salonId, salonId));
  }

  async getAvailabilityPatternsByStaffId(staffId: string): Promise<AvailabilityPattern[]> {
    return await db.select().from(availabilityPatterns).where(eq(availabilityPatterns.staffId, staffId));
  }

  async createAvailabilityPattern(pattern: InsertAvailabilityPattern): Promise<AvailabilityPattern> {
    const [newPattern] = await db.insert(availabilityPatterns).values(pattern).returning();
    return newPattern;
  }

  async updateAvailabilityPattern(id: string, updates: Partial<InsertAvailabilityPattern>): Promise<void> {
    await db.update(availabilityPatterns).set(updates).where(eq(availabilityPatterns.id, id));
  }

  async deleteAvailabilityPattern(id: string): Promise<void> {
    await db.delete(availabilityPatterns).where(eq(availabilityPatterns.id, id));
  }

  // Time slot operations
  async getTimeSlot(id: string): Promise<TimeSlot | undefined> {
    const [slot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return slot || undefined;
  }

  async getTimeSlotsByDateRange(salonId: string, startDate: string, endDate: string): Promise<TimeSlot[]> {
    return await db.select().from(timeSlots)
      .where(and(
        eq(timeSlots.salonId, salonId),
        eq(timeSlots.startDateTime, new Date(startDate)),
        eq(timeSlots.endDateTime, new Date(endDate))
      ));
  }

  async getAvailableTimeSlots(salonId: string, date: string, staffId?: string): Promise<TimeSlot[]> {
    const conditions = [
      eq(timeSlots.salonId, salonId),
      eq(timeSlots.isBooked, 0),
      eq(timeSlots.isBlocked, 0)
    ];
    
    if (staffId) {
      conditions.push(eq(timeSlots.staffId, staffId));
    }

    return await db.select().from(timeSlots).where(and(...conditions));
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const [newSlot] = await db.insert(timeSlots).values(timeSlot).returning();
    return newSlot;
  }

  async updateTimeSlot(id: string, updates: Partial<InsertTimeSlot>): Promise<void> {
    await db.update(timeSlots).set(updates).where(eq(timeSlots.id, id));
  }

  async blockTimeSlot(id: string): Promise<void> {
    await db.update(timeSlots).set({ isBlocked: 1 }).where(eq(timeSlots.id, id));
  }

  async unblockTimeSlot(id: string): Promise<void> {
    await db.update(timeSlots).set({ isBlocked: 0 }).where(eq(timeSlots.id, id));
  }

  // Availability generation methods
  async generateTimeSlotsFromPattern(patternId: string, startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    const pattern = await this.getAvailabilityPattern(patternId);
    if (!pattern) {
      throw new Error('Availability pattern not found');
    }

    const slots: InsertTimeSlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Check if current date matches the pattern's day of week
      if (currentDate.getDay() === pattern.dayOfWeek) {
        // Parse start and end times
        const [startHour, startMinute] = pattern.startTime.split(':').map(Number);
        const [endHour, endMinute] = pattern.endTime.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        // Generate slots for this day
        while (slotStart < dayEnd) {
          const slotEnd = new Date(slotStart.getTime() + pattern.slotDurationMinutes * 60000);
          
          if (slotEnd <= dayEnd) {
            slots.push({
              patternId: pattern.id,
              salonId: pattern.salonId,
              staffId: pattern.staffId,
              startDateTime: new Date(slotStart),
              endDateTime: new Date(slotEnd),
              isBooked: 0,
              isBlocked: 0
            });
          }

          slotStart = new Date(slotEnd);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert all slots and return them
    if (slots.length > 0) {
      return await db.insert(timeSlots).values(slots).returning();
    }
    
    return [];
  }

  async regenerateTimeSlotsForSalon(salonId: string, startDate: Date, endDate: Date): Promise<void> {
    // Delete existing slots in the date range
    await db.delete(timeSlots).where(and(
      eq(timeSlots.salonId, salonId),
      eq(timeSlots.isBooked, 0) // Only delete unbooked slots
    ));

    // Get all active patterns for this salon
    const patterns = await this.getAvailabilityPatternsBySalonId(salonId);
    const activePatterns = patterns.filter(p => p.isActive === 1);

    // Generate slots for each pattern
    for (const pattern of activePatterns) {
      await this.generateTimeSlotsFromPattern(pattern.id, startDate, endDate);
    }
  }

  // Email verification operations
  async createVerificationToken(email: string, userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    await db.insert(emailVerificationTokens).values({
      email,
      token,
      userId,
      expiresAt
    });

    return token;
  }

  async verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; userId?: string }> {
    const [verificationToken] = await db.select()
      .from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.token, token),
        isNull(emailVerificationTokens.verifiedAt) // Not already verified
      ));

    if (!verificationToken) {
      return { success: false };
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      return { success: false };
    }

    // Mark token as verified
    await db.update(emailVerificationTokens)
      .set({ verifiedAt: new Date() })
      .where(eq(emailVerificationTokens.token, token));

    return {
      success: true,
      email: verificationToken.email,
      userId: verificationToken.userId || undefined
    };
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await db.update(users)
      .set({ emailVerified: 1 })
      .where(eq(users.id, userId));
  }

  // Business Profile Setup Implementation

  // Booking settings operations
  async getBookingSettings(salonId: string): Promise<BookingSettings | undefined> {
    const [settings] = await db.select().from(bookingSettings).where(eq(bookingSettings.salonId, salonId));
    return settings || undefined;
  }

  async createBookingSettings(settings: InsertBookingSettings): Promise<BookingSettings> {
    const [newSettings] = await db.insert(bookingSettings).values(settings).returning();
    return newSettings;
  }

  async updateBookingSettings(salonId: string, updates: Partial<InsertBookingSettings>): Promise<void> {
    await db.update(bookingSettings).set(updates).where(eq(bookingSettings.salonId, salonId));
  }

  // Staff-service operations
  async getStaffService(staffId: string, serviceId: string): Promise<StaffService | undefined> {
    const [staffService] = await db.select().from(staffServices).where(
      and(eq(staffServices.staffId, staffId), eq(staffServices.serviceId, serviceId))
    );
    return staffService || undefined;
  }

  async getStaffServicesBySalonId(salonId: string): Promise<StaffService[]> {
    return await db.select().from(staffServices).where(eq(staffServices.salonId, salonId));
  }

  async getStaffServicesByStaffId(staffId: string): Promise<StaffService[]> {
    return await db.select().from(staffServices).where(eq(staffServices.staffId, staffId));
  }

  async getStaffServicesByServiceId(serviceId: string): Promise<StaffService[]> {
    return await db.select().from(staffServices).where(eq(staffServices.serviceId, serviceId));
  }

  async createStaffService(staffService: InsertStaffService): Promise<StaffService> {
    const [newStaffService] = await db.insert(staffServices).values(staffService).returning();
    return newStaffService;
  }

  async updateStaffService(staffId: string, serviceId: string, updates: Partial<InsertStaffService>): Promise<void> {
    await db.update(staffServices).set(updates).where(
      and(eq(staffServices.staffId, staffId), eq(staffServices.serviceId, serviceId))
    );
  }

  async deleteStaffService(staffId: string, serviceId: string): Promise<void> {
    await db.delete(staffServices).where(
      and(eq(staffServices.staffId, staffId), eq(staffServices.serviceId, serviceId))
    );
  }

  // Resource operations
  async getResource(id: string): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource || undefined;
  }

  async getResourcesBySalonId(salonId: string): Promise<Resource[]> {
    return await db.select().from(resources).where(and(
      eq(resources.salonId, salonId),
      eq(resources.isActive, 1)
    ));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: string, salonId: string, updates: Partial<InsertResource>): Promise<void> {
    await db.update(resources).set(updates).where(and(eq(resources.id, id), eq(resources.salonId, salonId)));
  }

  async deleteResource(id: string, salonId: string): Promise<void> {
    await db.update(resources).set({ isActive: 0 }).where(and(eq(resources.id, id), eq(resources.salonId, salonId)));
  }

  // Service-resource operations
  async getServiceResource(serviceId: string, resourceId: string): Promise<ServiceResource | undefined> {
    const [serviceResource] = await db.select().from(serviceResources).where(
      and(eq(serviceResources.serviceId, serviceId), eq(serviceResources.resourceId, resourceId))
    );
    return serviceResource || undefined;
  }

  async getServiceResourcesBySalonId(salonId: string): Promise<ServiceResource[]> {
    return await db.select().from(serviceResources).where(eq(serviceResources.salonId, salonId));
  }

  async getServiceResourcesByServiceId(serviceId: string): Promise<ServiceResource[]> {
    return await db.select().from(serviceResources).where(eq(serviceResources.serviceId, serviceId));
  }

  async getServiceResourcesByResourceId(resourceId: string): Promise<ServiceResource[]> {
    return await db.select().from(serviceResources).where(eq(serviceResources.resourceId, resourceId));
  }

  async createServiceResource(serviceResource: InsertServiceResource): Promise<ServiceResource> {
    const [newServiceResource] = await db.insert(serviceResources).values(serviceResource).returning();
    return newServiceResource;
  }

  async updateServiceResource(serviceId: string, resourceId: string, updates: Partial<InsertServiceResource>): Promise<void> {
    await db.update(serviceResources).set(updates).where(
      and(eq(serviceResources.serviceId, serviceId), eq(serviceResources.resourceId, resourceId))
    );
  }

  async deleteServiceResource(serviceId: string, resourceId: string): Promise<void> {
    await db.delete(serviceResources).where(
      and(eq(serviceResources.serviceId, serviceId), eq(serviceResources.resourceId, resourceId))
    );
  }

  // Media asset operations
  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
    return asset || undefined;
  }

  async getMediaAssetsBySalonId(salonId: string): Promise<MediaAsset[]> {
    return await db.select().from(mediaAssets).where(eq(mediaAssets.salonId, salonId));
  }

  async getMediaAssetsByType(salonId: string, assetType: string): Promise<MediaAsset[]> {
    return await db.select().from(mediaAssets).where(
      and(eq(mediaAssets.salonId, salonId), eq(mediaAssets.assetType, assetType))
    );
  }

  async createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset> {
    const [newAsset] = await db.insert(mediaAssets).values(asset).returning();
    return newAsset;
  }

  async updateMediaAsset(id: string, salonId: string, updates: Partial<InsertMediaAsset>): Promise<void> {
    await db.update(mediaAssets).set(updates).where(and(eq(mediaAssets.id, id), eq(mediaAssets.salonId, salonId)));
  }

  async setPrimaryMediaAsset(salonId: string, assetId: string): Promise<MediaAsset> {
    // Use transaction to ensure atomicity and prevent split-brain primaries
    return await db.transaction(async (tx) => {
      // First, remove primary from all existing assets for this salon
      await tx.update(mediaAssets).set({ isPrimary: 0 }).where(eq(mediaAssets.salonId, salonId));
      // Then set the specified asset as primary (with salon validation)
      await tx.update(mediaAssets).set({ isPrimary: 1 }).where(
        and(eq(mediaAssets.id, assetId), eq(mediaAssets.salonId, salonId))
      );
      // Return the updated asset
      const [updatedAsset] = await tx.select().from(mediaAssets).where(
        and(eq(mediaAssets.id, assetId), eq(mediaAssets.salonId, salonId))
      );
      if (!updatedAsset) {
        throw new Error('Media asset not found');
      }
      return updatedAsset;
    });
  }

  async deleteMediaAsset(id: string, salonId: string): Promise<void> {
    await db.delete(mediaAssets).where(and(eq(mediaAssets.id, id), eq(mediaAssets.salonId, salonId)));
  }

  // Tax rate operations
  async getTaxRate(id: string): Promise<TaxRate | undefined> {
    const [taxRate] = await db.select().from(taxRates).where(eq(taxRates.id, id));
    return taxRate || undefined;
  }

  async getTaxRatesBySalonId(salonId: string): Promise<TaxRate[]> {
    return await db.select().from(taxRates).where(and(
      eq(taxRates.salonId, salonId),
      eq(taxRates.isActive, 1)
    ));
  }

  async getDefaultTaxRate(salonId: string): Promise<TaxRate | undefined> {
    const [defaultTax] = await db.select().from(taxRates).where(
      and(eq(taxRates.salonId, salonId), eq(taxRates.isDefault, 1), eq(taxRates.isActive, 1))
    );
    return defaultTax || undefined;
  }

  async createTaxRate(taxRate: InsertTaxRate): Promise<TaxRate> {
    const [newTaxRate] = await db.insert(taxRates).values(taxRate).returning();
    return newTaxRate;
  }

  async updateTaxRate(id: string, salonId: string, updates: Partial<InsertTaxRate>): Promise<void> {
    await db.update(taxRates).set(updates).where(and(eq(taxRates.id, id), eq(taxRates.salonId, salonId)));
  }

  async setDefaultTaxRate(salonId: string, taxRateId: string): Promise<void> {
    // Use transaction to ensure atomicity and prevent split-brain defaults
    await db.transaction(async (tx) => {
      // First, remove default from all existing tax rates for this salon
      await tx.update(taxRates).set({ isDefault: 0 }).where(eq(taxRates.salonId, salonId));
      // Then set the specified tax rate as default (with salon validation)
      await tx.update(taxRates).set({ isDefault: 1 }).where(
        and(eq(taxRates.id, taxRateId), eq(taxRates.salonId, salonId))
      );
    });
  }

  async deleteTaxRate(id: string, salonId: string): Promise<void> {
    await db.update(taxRates).set({ isActive: 0 }).where(and(eq(taxRates.id, id), eq(taxRates.salonId, salonId)));
  }

  // Payout account operations
  async getPayoutAccount(id: string): Promise<PayoutAccount | undefined> {
    const [account] = await db.select().from(payoutAccounts).where(eq(payoutAccounts.id, id));
    return account || undefined;
  }

  async getPayoutAccountsBySalonId(salonId: string): Promise<PayoutAccount[]> {
    return await db.select().from(payoutAccounts).where(and(
      eq(payoutAccounts.salonId, salonId),
      eq(payoutAccounts.isActive, 1)
    ));
  }

  async getDefaultPayoutAccount(salonId: string): Promise<PayoutAccount | undefined> {
    const [defaultAccount] = await db.select().from(payoutAccounts).where(
      and(eq(payoutAccounts.salonId, salonId), eq(payoutAccounts.isDefault, 1), eq(payoutAccounts.isActive, 1))
    );
    return defaultAccount || undefined;
  }

  async createPayoutAccount(account: InsertPayoutAccount): Promise<PayoutAccount> {
    const [newAccount] = await db.insert(payoutAccounts).values(account).returning();
    return newAccount;
  }

  async updatePayoutAccount(id: string, salonId: string, updates: Partial<InsertPayoutAccount>): Promise<void> {
    await db.update(payoutAccounts).set(updates).where(and(eq(payoutAccounts.id, id), eq(payoutAccounts.salonId, salonId)));
  }

  async setDefaultPayoutAccount(salonId: string, accountId: string): Promise<void> {
    // Use transaction to ensure atomicity and prevent split-brain defaults
    await db.transaction(async (tx) => {
      // First, remove default from all existing accounts for this salon
      await tx.update(payoutAccounts).set({ isDefault: 0 }).where(eq(payoutAccounts.salonId, salonId));
      // Then set the specified account as default (with salon validation)
      await tx.update(payoutAccounts).set({ isDefault: 1 }).where(
        and(eq(payoutAccounts.id, accountId), eq(payoutAccounts.salonId, salonId))
      );
    });
  }

  async deletePayoutAccount(id: string, salonId: string): Promise<void> {
    await db.update(payoutAccounts).set({ isActive: 0 }).where(and(eq(payoutAccounts.id, id), eq(payoutAccounts.salonId, salonId)));
  }

  // Publish state operations
  async getPublishState(salonId: string): Promise<PublishState | undefined> {
    const [state] = await db.select().from(publishState).where(eq(publishState.salonId, salonId));
    return state || undefined;
  }

  async createPublishState(state: InsertPublishState): Promise<PublishState> {
    const [newState] = await db.insert(publishState).values(state).returning();
    return newState;
  }

  async updatePublishState(salonId: string, updates: Partial<InsertPublishState>): Promise<void> {
    await db.update(publishState).set(updates).where(eq(publishState.salonId, salonId));
  }

  async checkBusinessReadiness(salonId: string): Promise<{ isReady: boolean; missingRequirements: string[] }> {
    const missingRequirements: string[] = [];

    // Check if salon has basic information
    const salon = await this.getSalon(salonId);
    if (!salon || !salon.name || !salon.address || !salon.phone) {
      missingRequirements.push("Complete salon basic information");
    }

    // Check if salon has at least one service
    const services = await this.getServicesBySalonId(salonId);
    if (services.length === 0) {
      missingRequirements.push("Add at least one service");
    }

    // Check if salon has at least one staff member
    const staff = await this.getStaffBySalonId(salonId);
    if (staff.length === 0) {
      missingRequirements.push("Add at least one staff member");
    }

    // Check if salon has booking settings configured
    const bookingSettings = await this.getBookingSettings(salonId);
    if (!bookingSettings) {
      missingRequirements.push("Configure booking settings");
    }

    // Check if salon has at least one tax rate configured
    const taxRates = await this.getTaxRatesBySalonId(salonId);
    if (taxRates.length === 0) {
      missingRequirements.push("Configure tax rates");
    }

    // Check if salon has a default payout account
    const defaultPayoutAccount = await this.getDefaultPayoutAccount(salonId);
    if (!defaultPayoutAccount) {
      missingRequirements.push("Configure payout account");
    }

    return {
      isReady: missingRequirements.length === 0,
      missingRequirements
    };
  }

  async checkDashboardCompletion(salonId: string): Promise<{
    profile: { isComplete: boolean; missingFields?: string[] };
    services: { isComplete: boolean; count: number };
    staff: { isComplete: boolean; count: number };
    settings: { isComplete: boolean; missingFields?: string[] };
    media: { isComplete: boolean; count: number };
    overallProgress: number;
    nextStep?: string;
  }> {
    // Get all the data we need to check completion
    const salon = await this.getSalon(salonId);
    const services = await this.getServicesBySalonId(salonId);
    const staff = await this.getStaffBySalonId(salonId);
    const bookingSettings = await this.getBookingSettings(salonId);
    const mediaAssets = await this.getMediaAssetsBySalonId(salonId);

    // Check Profile completion
    const profileMissingFields: string[] = [];
    if (!salon?.name) profileMissingFields.push('name');
    if (!salon?.address) profileMissingFields.push('address');
    if (!salon?.phone) profileMissingFields.push('phone');
    if (!salon?.email) profileMissingFields.push('email');
    if (!salon?.description) profileMissingFields.push('description');
    
    const profileComplete = profileMissingFields.length === 0;

    // Check Services completion
    const servicesComplete = services.length > 0;

    // Check Staff completion
    const staffComplete = staff.length > 0;

    // Check Settings completion - settings are complete if they exist and have required fields
    const settingsMissingFields: string[] = [];
    if (!bookingSettings) {
      settingsMissingFields.push('bookingSettings');
    } else {
      // Only check for essential fields, not specific values
      if (!bookingSettings.timezone) {
        settingsMissingFields.push('timezone');
      }
      if (bookingSettings.leadTimeMinutes === null || bookingSettings.leadTimeMinutes === undefined) {
        settingsMissingFields.push('leadTimeMinutes');
      }
      if (bookingSettings.cancelWindowMinutes === null || bookingSettings.cancelWindowMinutes === undefined) {
        settingsMissingFields.push('cancelWindowMinutes');
      }
    }
    
    const settingsComplete = settingsMissingFields.length === 0;

    // Check Media completion
    const mediaComplete = mediaAssets.length > 0;

    // Calculate overall progress
    const completedSections = [
      profileComplete,
      servicesComplete,
      staffComplete,
      settingsComplete,
      mediaComplete
    ].filter(Boolean).length;
    
    const overallProgress = Math.round((completedSections / 5) * 100);

    // Determine next step
    let nextStep: string | undefined;
    if (!profileComplete) {
      nextStep = 'profile';
    } else if (!servicesComplete) {
      nextStep = 'services';
    } else if (!staffComplete) {
      nextStep = 'staff';
    } else if (!settingsComplete) {
      nextStep = 'settings';
    } else if (!mediaComplete) {
      nextStep = 'media';
    }

    return {
      profile: { 
        isComplete: profileComplete, 
        missingFields: profileComplete ? undefined : profileMissingFields 
      },
      services: { 
        isComplete: servicesComplete, 
        count: services.length 
      },
      staff: { 
        isComplete: staffComplete, 
        count: staff.length 
      },
      settings: { 
        isComplete: settingsComplete, 
        missingFields: settingsComplete ? undefined : settingsMissingFields 
      },
      media: { 
        isComplete: mediaComplete, 
        count: mediaAssets.length 
      },
      overallProgress,
      nextStep
    };
  }
  
  // Customer Profile Operations
  async getCustomerProfile(salonId: string, customerEmail: string): Promise<CustomerProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(customerProfiles)
        .where(and(
          eq(customerProfiles.salonId, salonId),
          eq(customerProfiles.customerEmail, customerEmail)
        ));
      return profile || undefined;
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      throw error;
    }
  }
  
  async getOrCreateCustomerProfile(salonId: string, customerEmail: string): Promise<CustomerProfile | undefined> {
    try {
      // First try to get existing profile
      const existingProfile = await this.getCustomerProfile(salonId, customerEmail);
      if (existingProfile) {
        return existingProfile;
      }
      
      // If no profile exists, find customer data from their most recent booking
      // Direct query instead of O(n) scan
      const [customerBooking] = await db
        .select({
          customerName: bookings.customerName,
          customerPhone: bookings.customerPhone,
          customerEmail: bookings.customerEmail
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerEmail, customerEmail)
        ))
        .orderBy(desc(bookings.createdAt))
        .limit(1);
      
      if (!customerBooking) {
        return undefined; // Customer not found
      }
      
      // Use INSERT...ON CONFLICT for safe profile creation
      try {
        const [created] = await db
          .insert(customerProfiles)
          .values({
            salonId,
            customerEmail: customerEmail,
            customerName: customerBooking.customerName,
            customerPhone: customerBooking.customerPhone,
            notes: '',
            preferences: {},
            isVip: 0,
            tags: []
          })
          .onConflictDoNothing()
          .returning();
        
        // If conflict occurred (profile already exists), fetch the existing one
        if (!created) {
          return await this.getCustomerProfile(salonId, customerEmail);
        }
        
        return created;
      } catch (error) {
        // Handle unique constraint violations gracefully
        console.warn('Profile creation conflict, fetching existing profile:', error);
        return await this.getCustomerProfile(salonId, customerEmail);
      }
      
    } catch (error) {
      console.error('Error getting or creating customer profile:', error);
      throw error;
    }
  }
  
  async getCustomerProfileById(id: string): Promise<CustomerProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(customerProfiles)
        .where(eq(customerProfiles.id, id));
      return profile || undefined;
    } catch (error) {
      console.error('Error fetching customer profile by ID:', error);
      throw error;
    }
  }
  
  async createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    try {
      const [created] = await db
        .insert(customerProfiles)
        .values(profile)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating customer profile:', error);
      throw error;
    }
  }
  
  async updateCustomerProfile(id: string, salonId: string, updates: UpdateCustomerNotesInput): Promise<void> {
    try {
      // Build update object - only include isVip if explicitly provided
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };
      
      // Fix: Only update isVip if explicitly provided, preserve existing value otherwise
      if (updates.isVip !== undefined) {
        updateData.isVip = updates.isVip ? 1 : 0;
      }
      
      await db
        .update(customerProfiles)
        .set(updateData)
        .where(and(
          eq(customerProfiles.id, id),
          eq(customerProfiles.salonId, salonId)
        ));
    } catch (error) {
      console.error('Error updating customer profile:', error);
      throw error;
    }
  }
  
  async getCustomerBookingHistory(salonId: string, customerEmail: string): Promise<any[]> {
    try {
      const bookingHistory = await db
        .select({
          id: bookings.id,
          serviceId: bookings.serviceId,
          bookingDate: bookings.bookingDate,
          bookingTime: bookings.bookingTime,
          status: bookings.status,
          totalAmountPaisa: bookings.totalAmountPaisa,
          currency: bookings.currency,
          notes: bookings.notes,
          createdAt: bookings.createdAt,
          serviceName: services.name,
          serviceDuration: services.durationMinutes,
          staffName: staff.name
        })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerEmail, customerEmail)
        ))
        .orderBy(desc(bookings.createdAt));
        
      return bookingHistory;
    } catch (error) {
      console.error('Error fetching customer booking history:', error);
      throw error;
    }
  }
  
  async getCustomerStats(salonId: string, customerEmail: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastVisit: string | null;
    favoriteServices: Array<{ serviceId: string; serviceName: string; count: number }>;
    averageSpend: number;
    bookingFrequency: string;
  }> {
    try {
      // Get basic stats
      const [stats] = await db
        .select({
          totalBookings: sql<number>`count(*)`,
          totalSpent: sql<number>`sum(${bookings.totalAmountPaisa})`,
          lastVisit: sql<string>`max(${bookings.bookingDate})`
        })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerEmail, customerEmail)
        ));
        
      // Get favorite services
      const favoriteServices = await db
        .select({
          serviceId: bookings.serviceId,
          serviceName: services.name,
          count: sql<number>`count(*)`
        })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerEmail, customerEmail)
        ))
        .groupBy(bookings.serviceId, services.name)
        .orderBy(desc(sql`count(*)`));
        
      const totalBookings = Number(stats?.totalBookings) || 0;
      const totalSpent = Number(stats?.totalSpent) || 0;
      const averageSpend = totalBookings > 0 ? totalSpent / totalBookings : 0;
      
      // Calculate booking frequency
      let bookingFrequency = 'New Customer';
      if (totalBookings >= 10) {
        bookingFrequency = 'Frequent';
      } else if (totalBookings >= 5) {
        bookingFrequency = 'Regular';
      } else if (totalBookings >= 2) {
        bookingFrequency = 'Returning';
      }
      
      return {
        totalBookings,
        totalSpent,
        lastVisit: stats?.lastVisit || null,
        favoriteServices: favoriteServices || [],
        averageSpend,
        bookingFrequency
      };
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      throw error;
    }
  }
}

// Example data initialization
async function initializeSalonsAndServices() {
  try {
    // Check if salons already exist
    const existingSalons = await db.select().from(salons);
    if (existingSalons.length === 0) {
      // Create sample salons for demonstration
      const mockSalons: InsertSalon[] = [
        {
          name: "Artisan Theory Salon",
          description: "Modern hair salon specializing in cuts, color, and styling",
          address: "789 Fashion Avenue",
          city: "Chicago",
          state: "IL", 
          zipCode: "60603",
          phone: "+1-312-555-0123",
          email: "info@artisantheory.com",
          category: "Hair Salon",
          priceRange: "$$",
          openTime: "9:00 AM",
          closeTime: "9:00 PM",
          isActive: 1
        },
        {
          name: "LO Spa & Nails",
          description: "Luxury nail spa with premium manicure and pedicure services",
          address: "123 Chicago Loop",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          phone: "+1-312-555-0456",
          email: "contact@lospa.com",
          category: "Nails",
          priceRange: "$$$",
          openTime: "10:00 AM",
          closeTime: "8:00 PM",
          isActive: 1
        },
        {
          name: "Tranquil Spa Retreat",
          description: "Full-service spa offering massage, facials, and wellness treatments",
          address: "456 Downtown District",
          city: "Chicago",
          state: "IL",
          zipCode: "60602",
          phone: "+1-312-555-0789",
          email: "hello@tranquilspa.com",
          category: "Massage",
          priceRange: "$$$$",
          openTime: "8:00 AM",
          closeTime: "10:00 PM",
          isActive: 1
        }
      ];
      
      const createdSalons = await db.insert(salons).values(mockSalons).returning();
      console.log('✅ Initialized salons in database');
      
      // Create services for each salon
      const salonServices: InsertService[] = [
        // Artisan Theory Salon services
        { salonId: createdSalons[0].id, name: "Haircut & Style", description: "Professional haircut and styling", durationMinutes: 60, priceInPaisa: 6500, category: "Hair", currency: "INR", isActive: 1 },
        { salonId: createdSalons[0].id, name: "Color Treatment", description: "Full hair coloring service", durationMinutes: 120, priceInPaisa: 15000, category: "Hair", currency: "INR", isActive: 1 },
        
        // LO Spa & Nails services
        { salonId: createdSalons[1].id, name: "Manicure", description: "Complete nail care and polish", durationMinutes: 45, priceInPaisa: 3500, category: "Nails", currency: "INR", isActive: 1 },
        { salonId: createdSalons[1].id, name: "Pedicure", description: "Relaxing foot care and polish", durationMinutes: 60, priceInPaisa: 4500, category: "Nails", currency: "INR", isActive: 1 },
        
        // Tranquil Spa Retreat services
        { salonId: createdSalons[2].id, name: "Facial Treatment", description: "Deep cleansing facial", durationMinutes: 90, priceInPaisa: 12000, category: "Facial", currency: "INR", isActive: 1 },
        { salonId: createdSalons[2].id, name: "Swedish Massage", description: "Relaxing full body massage", durationMinutes: 60, priceInPaisa: 8000, category: "Massage", currency: "INR", isActive: 1 }
      ];
      
      await db.insert(services).values(salonServices);
      console.log('✅ Initialized services in database');
    }
  } catch (error) {
    console.error('Error initializing salons and services:', error);
  }
}

export const storage = new DatabaseStorage();

// Legacy MemStorage for reference
class MemStorage {
  private salons: Salon[] = [];
  private services: Service[] = [];
  private bookings: Booking[] = [];
  private payments: Payment[] = [];

  async getSalon(id: string): Promise<Salon | undefined> {
    return this.salons.find(s => s.id === id);
  }

  async getAllSalons(): Promise<Salon[]> {
    return this.salons.filter(s => s.isActive === 1);
  }

  async createSalon(salon: InsertSalon): Promise<Salon> {
    const newSalon: Salon = {
      id: randomUUID(),
      ...salon,
      description: salon.description || null,
      website: salon.website || null,
      imageUrl: salon.imageUrl || null,
      openTime: salon.openTime || null,
      closeTime: salon.closeTime || null,
      ownerId: salon.ownerId || null,
      orgId: salon.orgId || null,
      isActive: salon.isActive ?? 1,
      rating: "0.00",
      reviewCount: 0,
      createdAt: new Date(),
    };
    this.salons.push(newSalon);
    return newSalon;
  }

  async updateSalon(id: string, updates: Partial<InsertSalon>): Promise<void> {
    const index = this.salons.findIndex(s => s.id === id);
    if (index !== -1) {
      this.salons[index] = { ...this.salons[index], ...updates };
    }
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.find(s => s.id === id);
  }

  async getAllServices(): Promise<Service[]> {
    return this.services.filter(s => s.isActive === 1);
  }

  async getServicesBySalonId(salonId: string): Promise<Service[]> {
    return this.services.filter(s => s.salonId === salonId && s.isActive === 1);
  }

  async createService(service: InsertService): Promise<Service> {
    const newService: Service = {
      id: randomUUID(),
      ...service,
      description: service.description || null,
      category: service.category || null,
      currency: service.currency || 'INR',
      isActive: service.isActive ?? 1,
      createdAt: new Date(),
    };
    this.services.push(newService);
    return newService;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.find(b => b.id === id);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const newBooking: Booking = {
      id: randomUUID(),
      ...booking,
      status: booking.status || 'pending',
      currency: booking.currency || 'INR',
      staffId: booking.staffId || null,
      timeSlotId: booking.timeSlotId || null,
      guestSessionId: booking.guestSessionId || null,
      salonName: booking.salonName || null,
      notes: booking.notes || null,
      createdAt: new Date(),
    };
    this.bookings.push(newBooking);
    return newBooking;
  }

  async updateBookingStatus(id: string, status: string): Promise<number> {
    const booking = this.bookings.find(b => b.id === id);
    if (booking) {
      booking.status = status;
      return 1;
    }
    return 0;
  }

  async updateBookingNotes(id: string, notes: string): Promise<number> {
    const booking = this.bookings.find(b => b.id === id);
    if (booking) {
      booking.notes = notes;
      return 1;
    }
    return 0;
  }

  async bulkUpdateBookingStatus(bookingIds: string[], status: string, salonId: string): Promise<number> {
    let updatedCount = 0;
    for (const bookingId of bookingIds) {
      const booking = this.bookings.find(b => b.id === bookingId && b.salonId === salonId);
      if (booking) {
        booking.status = status;
        updatedCount++;
      }
    }
    return updatedCount;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.find(p => p.id === id);
  }

  async getPaymentByBookingId(bookingId: string): Promise<Payment | undefined> {
    return this.payments.find(p => p.bookingId === bookingId);
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.payments;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = {
      id: randomUUID(),
      ...payment,
      status: payment.status || 'pending',
      currency: payment.currency || 'INR',
      razorpayOrderId: payment.razorpayOrderId || null,
      razorpayPaymentId: payment.razorpayPaymentId || null,
      razorpaySignature: payment.razorpaySignature || null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.payments.push(newPayment);
    return newPayment;
  }

  async updatePaymentStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    const payment = this.payments.find(p => p.id === id);
    if (payment) {
      payment.status = status;
      if (completedAt) {
        payment.completedAt = completedAt;
      }
    }
  }

  async updatePaymentOrderId(id: string, razorpayOrderId: string): Promise<void> {
    const payment = this.payments.find(p => p.id === id);
    if (payment) {
      payment.razorpayOrderId = razorpayOrderId;
    }
  }

  async updatePaymentDetails(id: string, razorpayPaymentId: string, razorpaySignature: string): Promise<void> {
    const payment = this.payments.find(p => p.id === id);
    if (payment) {
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
    }
  }

  async getPaymentByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | undefined> {
    return this.payments.find(p => p.razorpayOrderId === razorpayOrderId);
  }
}

// Initialize data on startup - using database now
async function initializeServices() {
  await initializeSalonsAndServices();
}

initializeSalonsAndServices();

export { initializeServices };