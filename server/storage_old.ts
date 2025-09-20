import { 
  type User, type InsertUser,
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
  users, services, bookings, payments, salons, roles, organizations, userRoles, orgUsers,
  staff, availabilityPatterns, timeSlots
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
  
  // Role operations
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  getUserRoles(userId: string): Promise<Role[]>;
  assignUserRole(userId: string, roleId: string): Promise<void>;
  
  // Organization operations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  addUserToOrganization(orgId: string, userId: string, role: string): Promise<void>;
  
  // Salon operations
  getSalon(id: string): Promise<Salon | undefined>;
  getAllSalons(): Promise<Salon[]>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  
  // Service operations
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getServicesBySalonId(salonId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  
  // Booking operations
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<void>;
  
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Role operations
  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        createdAt: roles.createdAt
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    return userRolesList;
  }

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    await db.insert(userRoles).values({ userId, roleId });
  }

  // Organization operations
  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(insertOrganization)
      .returning();
    return organization;
  }

  async addUserToOrganization(orgId: string, userId: string, role: string): Promise<void> {
    await db.insert(orgUsers).values({ 
      orgId, 
      userId, 
      orgRole: role,
      isActive: 1
    });
  }
  
  // Salon operations
  async getSalon(id: string): Promise<Salon | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.id, id));
    return salon || undefined;
  }
  
  async getAllSalons(): Promise<Salon[]> {
    return await db.select().from(salons).where(eq(salons.isActive, 1));
  }
  
  async createSalon(insertSalon: InsertSalon): Promise<Salon> {
    const [salon] = await db
      .insert(salons)
      .values(insertSalon)
      .returning();
    return salon;
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
    return await db.select().from(services)
      .where(and(eq(services.salonId, salonId), eq(services.isActive, 1)));
  }
  
  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }
  
  // Booking operations
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }
  
  async updateBookingStatus(id: string, status: string): Promise<void> {
    await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id));
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
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }
  
  async updatePaymentStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    const updateData: any = { status };
    if (completedAt) {
      updateData.completedAt = completedAt;
    }
    await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id));
  }
  
  async updatePaymentOrderId(id: string, razorpayOrderId: string): Promise<void> {
    await db
      .update(payments)
      .set({ razorpayOrderId })
      .where(eq(payments.id, id));
  }
  
  async updatePaymentDetails(id: string, razorpayPaymentId: string, razorpaySignature: string): Promise<void> {
    await db
      .update(payments)
      .set({ razorpayPaymentId, razorpaySignature })
      .where(eq(payments.id, id));
  }
  
  async getPaymentByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, razorpayOrderId));
    return payment || undefined;
  }
}

// PostgreSQL database storage implementation is the primary storage
// MemStorage is available as fallback for development
export class MemStorage implements IStorage {
  // User operations
  async getUserById(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return undefined;
  }

  // Role operations  
  async getRoleByName(name: string): Promise<Role | undefined> {
    return undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    throw new Error('MemStorage not implemented');
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    return [];
  }

  async assignUserRole(userId: string, roleId: string): Promise<void> {
    // No-op
  }

  // Organization operations
  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    throw new Error('MemStorage not implemented');
  }

  async addUserToOrganization(orgId: string, userId: string, role: string): Promise<void> {
    // No-op
  }
  async getSalon(id: string): Promise<Salon | undefined> {
    // Mock implementation - not used in production
    return undefined;
  }
  
  async getAllSalons(): Promise<Salon[]> {
    return [];
  }
  
  async createSalon(salon: InsertSalon): Promise<Salon> {
    throw new Error('MemStorage not implemented for salons');
  }
  
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error('MemStorage not implemented');
  }
  
  async getService(id: string): Promise<Service | undefined> {
    return undefined;
  }
  
  async getAllServices(): Promise<Service[]> {
    return [];
  }
  
  async getServicesBySalonId(salonId: string): Promise<Service[]> {
    return [];
  }
  
  async createService(insertService: InsertService): Promise<Service> {
    throw new Error('MemStorage not implemented');
  }
  
  async getBooking(id: string): Promise<Booking | undefined> {
    return undefined;
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    throw new Error('MemStorage not implemented');
  }
  
  async updateBookingStatus(id: string, status: string): Promise<void> {
    // No-op
  }
  
  async getPayment(id: string): Promise<Payment | undefined> {
    return undefined;
  }
  
  async getPaymentByBookingId(bookingId: string): Promise<Payment | undefined> {
    return undefined;
  }
  
  async getAllPayments(): Promise<Payment[]> {
    return [];
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    throw new Error('MemStorage not implemented');
  }
  
  async updatePaymentStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    // No-op
  }
  
  async updatePaymentOrderId(id: string, razorpayOrderId: string): Promise<void> {
    // No-op
  }
  
  async updatePaymentDetails(id: string, razorpayPaymentId: string, razorpaySignature: string): Promise<void> {
    // No-op
  }
  
  async getPaymentByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | undefined> {
    return undefined;
  }
}

// Initialize salons and services in database
export async function initializeServices() {
  try {
    // Check if salons already exist
    const existingSalons = await db.select().from(salons);
    if (existingSalons.length === 0) {
      // Create sample salons
      const mockSalons: InsertSalon[] = [
        {
          name: "Artisan Theory Salon",
          description: "Modern hair salon specializing in creative cuts and color",
          address: "100 Roosevelt Road",
          city: "Villa Park",
          state: "IL",
          zipCode: "60181",
          phone: "+1-630-555-0123",
          email: "info@artisantheory.com",
          category: "Hair Salon",
          priceRange: "$$",
          rating: "5.00",
          reviewCount: 140,
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
          rating: "4.90",
          reviewCount: 591,
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
          rating: "5.00",
          reviewCount: 328,
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
}

export const storage = new DatabaseStorage();

// Legacy MemStorage for reference
const memStorage = new MemStorage();
