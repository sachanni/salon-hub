import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, index, jsonb, check, foreignKey, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(), // Optional - auto-generated from email
  password: text("password"), // Made optional for Replit Auth users
  email: varchar("email").unique(), // Made nullable for Replit Auth compatibility
  firstName: varchar("first_name"), // Replit Auth field
  lastName: varchar("last_name"), // Replit Auth field
  profileImageUrl: varchar("profile_image_url"), // Replit Auth field
  phone: text("phone"),
  emailVerified: integer("email_verified").notNull().default(0),
  phoneVerified: integer("phone_verified").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(), // Replit Auth field
});

export const insertUserSchema = createInsertSchema(users).pick({
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
}).extend({
  username: z.string().optional(), // Username is optional, auto-generated if not provided
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Replit Auth types
export type UpsertUser = typeof users.$inferInsert;

// Roles table - define system roles (customer, owner, admin)
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().unique(), // customer, owner, admin
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
});

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

// User roles relationship - many-to-many
export const userRoles = pgTable("user_roles", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => ({
  pk: { primaryKey: [table.userId, table.roleId] },
}));

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  assignedAt: true,
});

export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

// Organizations table - business workspaces (following Fresha's model)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  ownerUserId: varchar("owner_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, suspended, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Organization users relationship - team members within organizations
export const orgUsers = pgTable("org_users", {
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgRole: varchar("org_role", { length: 50 }).notNull().default('staff'), // owner, manager, staff
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
  isActive: integer("is_active").notNull().default(1),
}, (table) => ({
  pk: { primaryKey: [table.orgId, table.userId] },
}));

export const insertOrgUserSchema = createInsertSchema(orgUsers).omit({
  joinedAt: true,
});

export type InsertOrgUser = z.infer<typeof insertOrgUserSchema>;
export type OrgUser = typeof orgUsers.$inferSelect;

// Salons table - business profiles linked to organizations
export const salons = pgTable("salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  category: varchar("category", { length: 50 }).notNull(), // Hair Salon, Spa, Nails, etc
  priceRange: varchar("price_range", { length: 10 }).notNull(), // $, $$, $$$, $$$$
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0.00'),
  reviewCount: integer("review_count").notNull().default(0),
  imageUrl: text("image_url"),
  openTime: text("open_time"), // e.g., "9:00 AM"
  closeTime: text("close_time"), // e.g., "8:00 PM"
  isActive: integer("is_active").notNull().default(1),
  ownerId: varchar("owner_id").references(() => users.id), // Keep for backward compatibility
  orgId: varchar("org_id").references(() => organizations.id, { onDelete: "set null" }), // New organization link
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalonSchema = createInsertSchema(salons).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
});

export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type Salon = typeof salons.$inferSelect;

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  ownedSalons: many(salons),
  userRoles: many(userRoles),
  ownedOrganizations: many(organizations),
  orgMemberships: many(orgUsers),
  staffProfiles: many(staff),
}));

// Salon relations
export const salonsRelations = relations(salons, ({ one, many }) => ({
  owner: one(users, {
    fields: [salons.ownerId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [salons.orgId],
    references: [organizations.id],
  }),
  services: many(services),
  bookings: many(bookings),
  staff: many(staff),
  availabilityPatterns: many(availabilityPatterns),
  timeSlots: many(timeSlots),
}));

// Services table - defines available salon services with fixed pricing
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  priceInPaisa: integer("price_in_paisa").notNull(), // Store price in smallest currency unit
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  isActive: integer("is_active").notNull().default(1),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "restrict" }), // Prevent deleting salons with services
  category: varchar("category", { length: 50 }), // Hair, Nails, Facial, Massage, etc
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Composite unique constraint to enable composite foreign keys
  unique("services_id_salon_id_unique").on(table.id, table.salonId),
]);

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Service relations
export const servicesRelations = relations(services, ({ one, many }) => ({
  salon: one(salons, {
    fields: [services.salonId],
    references: [salons.id],
  }),
  bookings: many(bookings),
}));

// Staff table - salon staff members who provide services
export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  orgId: varchar("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  specialties: text("specialties").array(), // Array of service categories they specialize in
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Composite unique constraint to enable composite foreign keys
  unique("staff_id_salon_id_unique").on(table.id, table.salonId),
]);

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
});

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

// Recurring availability patterns table
export const availabilityPatterns = pgTable("availability_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "cascade" }),
  patternName: text("pattern_name").notNull(), // e.g., "Weekday Morning Hours"
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30),
  isActive: integer("is_active").notNull().default(1),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  effectiveUntil: timestamp("effective_until"), // null means indefinite
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Composite unique constraint to enable composite foreign keys
  unique("availability_patterns_id_salon_id_unique").on(table.id, table.salonId),
  // Composite foreign key to enforce same-salon staff membership
  foreignKey({
    columns: [table.staffId, table.salonId],
    foreignColumns: [staff.id, staff.salonId],
    name: "availability_patterns_staff_salon_fk"
  }),
]);

export const insertAvailabilityPatternSchema = createInsertSchema(availabilityPatterns).omit({
  id: true,
  createdAt: true,
});

export type InsertAvailabilityPattern = z.infer<typeof insertAvailabilityPatternSchema>;
export type AvailabilityPattern = typeof availabilityPatterns.$inferSelect;

// Generated time slots table - actual bookable slots from patterns
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patternId: varchar("pattern_id").references(() => availabilityPatterns.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "cascade" }),
  startDateTime: timestamp("start_date_time").notNull(),
  endDateTime: timestamp("end_date_time").notNull(),
  isBooked: integer("is_booked").notNull().default(0),
  isBlocked: integer("is_blocked").notNull().default(0), // Manually blocked by salon
  bookingId: varchar("booking_id"), // Will be defined after bookings table
  generatedAt: timestamp("generated_at").defaultNow(),
}, (table) => [
  // Composite unique constraint to enable composite foreign keys
  unique("time_slots_id_salon_id_unique").on(table.id, table.salonId),
  // Composite foreign keys to enforce same-salon membership
  foreignKey({
    columns: [table.patternId, table.salonId],
    foreignColumns: [availabilityPatterns.id, availabilityPatterns.salonId],
    name: "time_slots_pattern_salon_fk"
  }),
  foreignKey({
    columns: [table.staffId, table.salonId],
    foreignColumns: [staff.id, staff.salonId],
    name: "time_slots_staff_salon_fk"
  }),
]);

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
  generatedAt: true,
});

export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;

// Bookings table - stores booking information before payment
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "restrict" }), // Prevent deleting salons with bookings
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "restrict" }),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "set null" }),
  timeSlotId: varchar("time_slot_id").references(() => timeSlots.id, { onDelete: "restrict" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  salonName: text("salon_name"), // Missing column that exists in database
  bookingDate: text("booking_date").notNull(), // Store as ISO date string
  bookingTime: text("booking_time").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, confirmed, cancelled, completed
  totalAmountPaisa: integer("total_amount_paisa").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  notes: text("notes"), // Special requests or notes
  guestSessionId: text("guest_session_id"), // For tracking guest user sessions
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Composite foreign keys to enforce same-salon membership
  foreignKey({
    columns: [table.serviceId, table.salonId],
    foreignColumns: [services.id, services.salonId],
    name: "bookings_service_salon_fk"
  }),
  // Handle nullable staffId - only enforce if staffId is not null
  foreignKey({
    columns: [table.staffId, table.salonId],
    foreignColumns: [staff.id, staff.salonId],
    name: "bookings_staff_salon_fk"
  }),
  // Handle nullable timeSlotId - only enforce if timeSlotId is not null  
  foreignKey({
    columns: [table.timeSlotId, table.salonId],
    foreignColumns: [timeSlots.id, timeSlots.salonId],
    name: "bookings_timeslot_salon_fk"
  }),
]);

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Booking relations
export const bookingsRelations = relations(bookings, ({ one }) => ({
  salon: one(salons, {
    fields: [bookings.salonId],
    references: [salons.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  staff: one(staff, {
    fields: [bookings.staffId],
    references: [staff.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [bookings.timeSlotId],
    references: [timeSlots.id],
  }),
  payment: one(payments, {
    fields: [bookings.id],
    references: [payments.bookingId],
  }),
}));

// Payments table - tracks payment information
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  amountPaisa: integer("amount_paisa").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Role relations (roles table is standalone, no relations needed)

// User roles relations
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

// Organization relations
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerUserId],
    references: [users.id],
  }),
  salons: many(salons),
  members: many(orgUsers),
}));

// Organization users relations
export const orgUsersRelations = relations(orgUsers, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgUsers.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [orgUsers.userId],
    references: [users.id],
  }),
}));

// Payment relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

// Customer profiles table - for customer-specific notes and preferences
export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone"),
  notes: text("notes"), // Customer-specific notes
  preferences: jsonb("preferences"), // Customer preferences as JSON
  isVip: integer("is_vip").notNull().default(0),
  tags: text("tags").array(), // Array of tags for customer categorization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint for customer per salon
  unique("customer_profiles_salon_email_unique").on(table.salonId, table.customerEmail),
]);

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type CustomerProfile = typeof customerProfiles.$inferSelect;

// Customer profile relations
export const customerProfilesRelations = relations(customerProfiles, ({ one }) => ({
  salon: one(salons, {
    fields: [customerProfiles.salonId],
    references: [salons.id],
  }),
}));

// Input validation schemas for API endpoints
export const createPaymentOrderSchema = z.object({
  salonId: z.string().uuid(),
  serviceId: z.string().uuid(),
  booking: z.object({
    date: z.string().min(1),
    time: z.string().min(1),
    customer: z.object({
      name: z.string().optional(), // Allow empty name for guest bookings
      email: z.string().email(),
      phone: z.string().optional(), // Allow empty phone for guest bookings
    }),
    notes: z.string().optional(),
    guestSessionId: z.string().optional(), // For guest session tracking
  }),
});

export const createSalonSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  website: z.string().url().optional(),
  category: z.string().min(1),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
  imageUrl: z.string().url().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Booking status enum for validation
const bookingStatusEnum = z.enum(['pending', 'confirmed', 'cancelled', 'completed']);

// Single booking update schema - status and optional notes
export const updateBookingSchema = z.object({
  status: bookingStatusEnum,
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

// Bulk booking update schema - multiple booking IDs and status
export const bulkUpdateBookingSchema = z.object({
  bookingIds: z.array(z.string().uuid()).min(1, "At least one booking ID is required"),
  status: bookingStatusEnum,
});

// Status transition validation function
export const validateStatusTransition = (currentStatus: string, newStatus: string): { isValid: boolean, error?: string } => {
  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [], // Cannot transition from completed
    cancelled: []  // Cannot transition from cancelled
  };

  if (!validTransitions[currentStatus]) {
    return { isValid: false, error: `Invalid current status: ${currentStatus}` };
  }

  if (!validTransitions[currentStatus].includes(newStatus)) {
    return { 
      isValid: false, 
      error: `Invalid status transition: ${currentStatus} → ${newStatus}. Valid transitions are: ${validTransitions[currentStatus].join(', ') || 'none'}` 
    };
  }

  return { isValid: true };
};

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CreateSalonInput = z.infer<typeof createSalonSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type BulkUpdateBookingInput = z.infer<typeof bulkUpdateBookingSchema>;

// Staff relations
export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
  salon: one(salons, {
    fields: [staff.salonId],
    references: [salons.id],
  }),
  organization: one(organizations, {
    fields: [staff.orgId],
    references: [organizations.id],
  }),
  availabilityPatterns: many(availabilityPatterns),
  timeSlots: many(timeSlots),
}));

// Availability pattern relations
export const availabilityPatternsRelations = relations(availabilityPatterns, ({ one, many }) => ({
  salon: one(salons, {
    fields: [availabilityPatterns.salonId],
    references: [salons.id],
  }),
  staff: one(staff, {
    fields: [availabilityPatterns.staffId],
    references: [staff.id],
  }),
  timeSlots: many(timeSlots),
}));

// Time slot relations
export const timeSlotsRelations = relations(timeSlots, ({ one }) => ({
  pattern: one(availabilityPatterns, {
    fields: [timeSlots.patternId],
    references: [availabilityPatterns.id],
  }),
  salon: one(salons, {
    fields: [timeSlots.salonId],
    references: [salons.id],
  }),
  staff: one(staff, {
    fields: [timeSlots.staffId],
    references: [staff.id],
  }),
  booking: one(bookings, {
    fields: [timeSlots.bookingId],
    references: [bookings.id],
  }),
}));

// Business onboarding and management tables

// Booking settings - salon-level booking policies
export const bookingSettings = pgTable("booking_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }).unique(),
  timezone: varchar("timezone", { length: 50 }).notNull().default('America/New_York'),
  leadTimeMinutes: integer("lead_time_minutes").notNull().default(60),
  cancelWindowMinutes: integer("cancel_window_minutes").notNull().default(1440),
  bufferMinutes: integer("buffer_minutes").notNull().default(15),
  depositPercentage: integer("deposit_percentage").notNull().default(0),
  autoConfirm: integer("auto_confirm").notNull().default(1),
  allowCancellation: integer("allow_cancellation").notNull().default(1),
  allowRescheduling: integer("allow_reschedule").notNull().default(1),
  maxAdvanceBookingDays: integer("max_advance_booking_days").notNull().default(90),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Removed redundant index since unique constraint already creates one
  check("lead_time_positive", sql`lead_time_minutes > 0`),
  check("cancel_window_positive", sql`cancel_window_minutes > 0`),
  check("buffer_minutes_valid", sql`buffer_minutes >= 0`),
  check("deposit_percentage_valid", sql`deposit_percentage >= 0 AND deposit_percentage <= 100`),
  check("auto_confirm_valid", sql`auto_confirm IN (0,1)`),
  check("allow_cancellation_valid", sql`allow_cancellation IN (0,1)`),
  check("allow_reschedule_valid", sql`allow_reschedule IN (0,1)`),
  check("max_advance_days_positive", sql`max_advance_booking_days > 0`),
]);

// Staff-service mappings with custom pricing and duration overrides
export const staffServices = pgTable("staff_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  priceInPaisa: integer("price_in_paisa"),
  durationMinutes: integer("duration_minutes"),
  isActive: integer("is_active").notNull().default(1),
  commissionPercentage: integer("commission_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("staff_service_salon_idx").on(table.salonId),
  index("staff_service_idx").on(table.staffId, table.serviceId),
  index("staff_service_service_idx").on(table.serviceId),
  unique("staff_services_salon_staff_service_unique").on(table.salonId, table.staffId, table.serviceId),
  check("price_positive", sql`price_in_paisa IS NULL OR price_in_paisa > 0`),
  check("duration_positive", sql`duration_minutes IS NULL OR duration_minutes > 0`),
  check("is_active_valid", sql`is_active IN (0,1)`),
  check("commission_valid", sql`commission_percentage >= 0 AND commission_percentage <= 100`),
  // Composite foreign keys to enforce same-salon membership
  foreignKey({
    columns: [table.staffId, table.salonId],
    foreignColumns: [staff.id, staff.salonId],
    name: "staff_services_staff_salon_fk"
  }),
  foreignKey({
    columns: [table.serviceId, table.salonId],
    foreignColumns: [services.id, services.salonId], 
    name: "staff_services_service_salon_fk"
  }),
]);

// Salon resources (chairs, rooms, equipment)
export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  capacity: integer("capacity").notNull().default(1),
  description: text("description"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("resources_salon_idx").on(table.salonId),
  // Composite unique constraint to enable composite foreign keys
  unique("resources_id_salon_id_unique").on(table.id, table.salonId),
  check("capacity_positive", sql`capacity > 0`),
  check("is_active_valid", sql`is_active IN (0,1)`),
  check("resource_type_valid", sql`resource_type IN ('chair', 'room', 'equipment', 'station', 'bed')`),
]);

// Service-resource mappings
export const serviceResources = pgTable("service_resources", {
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  resourceId: varchar("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  quantityRequired: integer("quantity_required").notNull().default(1),
}, (table) => [
  index("service_resources_salon_idx").on(table.salonId),
  index("service_resources_resource_idx").on(table.resourceId),
  { pk: { columns: [table.salonId, table.serviceId, table.resourceId], primaryKey: true } },
  check("quantity_positive", sql`quantity_required > 0`),
  // Composite foreign keys to enforce same-salon membership
  foreignKey({
    columns: [table.serviceId, table.salonId],
    foreignColumns: [services.id, services.salonId],
    name: "service_resources_service_salon_fk"
  }),
  foreignKey({
    columns: [table.resourceId, table.salonId],
    foreignColumns: [resources.id, resources.salonId],
    name: "service_resources_resource_salon_fk"
  }),
]);

// Media assets (logos, gallery images, videos)
export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  assetType: varchar("asset_type", { length: 20 }).notNull(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  displayOrder: integer("display_order").default(0),
  isPrimary: integer("is_primary").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
}, (table) => [
  index("media_assets_salon_idx").on(table.salonId),
  index("media_assets_salon_type_order_idx").on(table.salonId, table.assetType, table.displayOrder),
  // Only one primary media asset per salon
  uniqueIndex("media_assets_primary_unique").on(table.salonId).where(sql`is_primary = 1`),
  check("is_primary_valid", sql`is_primary IN (0,1)`),
  check("is_active_valid", sql`is_active IN (0,1)`),
  check("asset_type_valid", sql`asset_type IN ('logo', 'cover', 'gallery', 'video')`),
]);

// Tax rates configuration
export const taxRates = pgTable("tax_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  rateBasisPoints: integer("rate_basis_points").notNull(),
  isDefault: integer("is_default").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("tax_rates_salon_idx").on(table.salonId),
  unique("tax_rates_salon_name_unique").on(table.salonId, table.name),
  // Only one default tax rate per salon - use uniqueIndex for partial constraints
  uniqueIndex("tax_rates_default_unique").on(table.salonId).where(sql`is_default = 1`),
  check("rate_valid", sql`rate_basis_points >= 0 AND rate_basis_points <= 10000`), // Max 100%
  check("is_default_valid", sql`is_default IN (0,1)`),
  check("is_active_valid", sql`is_active IN (0,1)`),
]);

// Payout accounts and KYC status
export const payoutAccounts = pgTable("payout_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 20 }).notNull(),
  onboardingStatus: varchar("onboarding_status", { length: 20 }).notNull().default('pending'),
  accountId: text("account_id"),
  requirementsMissing: jsonb("requirements_missing"),
  isDefault: integer("is_default").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("payout_accounts_salon_idx").on(table.salonId),
  unique("payout_accounts_salon_provider_unique").on(table.salonId, table.provider),
  // Only one default payout account per salon
  uniqueIndex("payout_accounts_default_unique").on(table.salonId).where(sql`is_default = 1`),
  check("provider_valid", sql`provider IN ('razorpay', 'stripe')`),
  check("onboarding_status_valid", sql`onboarding_status IN ('pending', 'incomplete', 'approved', 'rejected')`),
  check("is_default_valid", sql`is_default IN (0,1)`),
  check("is_active_valid", sql`is_active IN (0,1)`),
]);

// Business publish state and readiness
export const publishState = pgTable("publish_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }).unique(),
  canAcceptBookings: integer("can_accept_bookings").notNull().default(0),
  isPublished: integer("is_published").notNull().default(0),
  onboardingStep: integer("onboarding_step").notNull().default(1),
  completedSteps: jsonb("completed_steps").default(sql`'[]'::jsonb`),
  checklist: jsonb("checklist").default(sql`'{}'::jsonb`),
  publishedAt: timestamp("published_at"),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => [
  // Removed redundant index since unique constraint already creates one
  check("can_accept_bookings_valid", sql`can_accept_bookings IN (0,1)`),
  check("is_published_valid", sql`is_published IN (0,1)`),
  check("onboarding_step_valid", sql`onboarding_step >= 1`),
]);

// Schema exports and types for new tables
export const insertBookingSettingsSchema = createInsertSchema(bookingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffServiceSchema = createInsertSchema(staffServices).omit({
  id: true,
  createdAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export const insertServiceResourceSchema = createInsertSchema(serviceResources);

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  id: true,
  uploadedAt: true,
});

export const insertTaxRateSchema = createInsertSchema(taxRates).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutAccountSchema = createInsertSchema(payoutAccounts).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertPublishStateSchema = createInsertSchema(publishState).omit({
  id: true,
  lastUpdated: true,
}).extend({
  // Allow publishedAt to accept ISO string dates from frontend
  publishedAt: z.union([z.date(), z.string().datetime()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

// Types for new models
export type BookingSettings = typeof bookingSettings.$inferSelect;
export type InsertBookingSettings = z.infer<typeof insertBookingSettingsSchema>;

export type StaffService = typeof staffServices.$inferSelect;
export type InsertStaffService = z.infer<typeof insertStaffServiceSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type ServiceResource = typeof serviceResources.$inferSelect;
export type InsertServiceResource = z.infer<typeof insertServiceResourceSchema>;

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;

export type TaxRate = typeof taxRates.$inferSelect;
export type InsertTaxRate = z.infer<typeof insertTaxRateSchema>;

export type PayoutAccount = typeof payoutAccounts.$inferSelect;
export type InsertPayoutAccount = z.infer<typeof insertPayoutAccountSchema>;

export type PublishState = typeof publishState.$inferSelect;
export type InsertPublishState = z.infer<typeof insertPublishStateSchema>;

// Customer profile validation schemas
export const updateCustomerNotesSchema = z.object({
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  preferences: z.record(z.any()).optional(), // JSON object for preferences
  isVip: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateCustomerNotesInput = z.infer<typeof updateCustomerNotesSchema>;

// ===============================================
// FINANCIAL REPORTING SYSTEM TABLES
// ===============================================

// Expense categories for organizing business expenses
export const expenseCategories = pgTable("expense_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default('#6366f1'), // Hex color for UI
  isDefault: integer("is_default").notNull().default(0), // System default categories
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("expense_categories_salon_idx").on(table.salonId),
  unique("expense_categories_salon_name_unique").on(table.salonId, table.name),
  check("is_default_valid", sql`is_default IN (0,1)`),
  check("is_active_valid", sql`is_active IN (0,1)`),
]);

// Business expenses tracking
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => expenseCategories.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  amountPaisa: integer("amount_paisa").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  expenseDate: timestamp("expense_date").notNull(),
  receiptUrl: text("receipt_url"), // URL to uploaded receipt
  receiptNumber: varchar("receipt_number", { length: 100 }),
  vendor: varchar("vendor", { length: 200 }),
  isRecurring: integer("is_recurring").notNull().default(0),
  recurringFrequency: varchar("recurring_frequency", { length: 20 }), // monthly, quarterly, yearly
  taxDeductible: integer("tax_deductible").notNull().default(0),
  taxAmountPaisa: integer("tax_amount_paisa").default(0),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("expenses_salon_idx").on(table.salonId),
  index("expenses_category_idx").on(table.categoryId),
  index("expenses_date_idx").on(table.expenseDate),
  index("expenses_status_idx").on(table.status),
  check("is_recurring_valid", sql`is_recurring IN (0,1)`),
  check("tax_deductible_valid", sql`tax_deductible IN (0,1)`),
  check("status_valid", sql`status IN ('pending', 'approved', 'rejected')`),
  check("recurring_frequency_valid", sql`recurring_frequency IS NULL OR recurring_frequency IN ('monthly', 'quarterly', 'yearly')`),
]);

// Commission rate configurations for staff
export const commissionRates = pgTable("commission_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "cascade" }),
  rateType: varchar("rate_type", { length: 20 }).notNull(), // percentage, fixed_amount, tiered
  rateValue: decimal("rate_value", { precision: 10, scale: 4 }).notNull(), // % or fixed amount
  minAmount: integer("min_amount_paisa"), // Minimum earning threshold
  maxAmount: integer("max_amount_paisa"), // Maximum earning cap
  isDefault: integer("is_default").notNull().default(0), // Default rate for new staff/services
  isActive: integer("is_active").notNull().default(1),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("commission_rates_salon_idx").on(table.salonId),
  index("commission_rates_staff_idx").on(table.staffId),
  index("commission_rates_service_idx").on(table.serviceId),
  index("commission_rates_effective_idx").on(table.effectiveFrom, table.effectiveTo),
  check("rate_type_valid", sql`rate_type IN ('percentage', 'fixed_amount', 'tiered')`),
  check("is_default_valid", sql`is_default IN (0,1)`),
  check("is_active_valid", sql`is_active IN (0,1)`),
]);

// Staff commission calculations and tracking
export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "set null" }),
  rateId: varchar("rate_id").references(() => commissionRates.id, { onDelete: "set null" }),
  baseAmountPaisa: integer("base_amount_paisa").notNull(), // Service amount
  commissionAmountPaisa: integer("commission_amount_paisa").notNull(), // Calculated commission
  commissionRate: decimal("commission_rate", { precision: 10, scale: 4 }).notNull(), // Applied rate
  serviceDate: timestamp("service_date").notNull(),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default('pending'), // pending, paid, cancelled
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentReference: varchar("payment_reference", { length: 100 }),
  notes: text("notes"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("commissions_salon_idx").on(table.salonId),
  index("commissions_staff_idx").on(table.staffId),
  index("commissions_booking_idx").on(table.bookingId),
  index("commissions_period_idx").on(table.periodYear, table.periodMonth),
  index("commissions_payment_status_idx").on(table.paymentStatus),
  index("commissions_service_date_idx").on(table.serviceDate),
  check("payment_status_valid", sql`payment_status IN ('pending', 'paid', 'cancelled')`),
  check("period_month_valid", sql`period_month >= 1 AND period_month <= 12`),
  check("period_year_valid", sql`period_year >= 2020`),
]);

// Budget planning and tracking
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  budgetType: varchar("budget_type", { length: 20 }).notNull(), // category, overall, department
  budgetAmountPaisa: integer("budget_amount_paisa").notNull(),
  spentAmountPaisa: integer("spent_amount_paisa").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  budgetPeriod: varchar("budget_period", { length: 20 }).notNull(), // monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  alertThreshold: integer("alert_threshold").default(80), // Alert when % of budget used
  isActive: integer("is_active").notNull().default(1),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("budgets_salon_idx").on(table.salonId),
  index("budgets_category_idx").on(table.categoryId),
  index("budgets_period_idx").on(table.startDate, table.endDate),
  check("budget_type_valid", sql`budget_type IN ('category', 'overall', 'department')`),
  check("budget_period_valid", sql`budget_period IN ('monthly', 'quarterly', 'yearly')`),
  check("is_active_valid", sql`is_active IN (0,1)`),
  check("alert_threshold_valid", sql`alert_threshold >= 0 AND alert_threshold <= 100`),
]);

// Generated financial reports storage
export const financialReports = pgTable("financial_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  reportType: varchar("report_type", { length: 50 }).notNull(), // pl_statement, cash_flow, commission_report, expense_report
  reportTitle: varchar("report_title", { length: 200 }).notNull(),
  reportPeriod: varchar("report_period", { length: 20 }).notNull(), // monthly, quarterly, yearly, custom
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reportData: jsonb("report_data").notNull(), // Structured report data
  summary: jsonb("summary").default(sql`'{}'::jsonb`), // Key metrics summary
  generatedBy: varchar("generated_by").notNull().references(() => users.id),
  exportedAt: timestamp("exported_at"),
  exportFormat: varchar("export_format", { length: 20 }), // pdf, excel, csv
  isScheduled: integer("is_scheduled").notNull().default(0),
  scheduleFrequency: varchar("schedule_frequency", { length: 20 }),
  nextScheduledAt: timestamp("next_scheduled_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("financial_reports_salon_idx").on(table.salonId),
  index("financial_reports_type_idx").on(table.reportType),
  index("financial_reports_period_idx").on(table.startDate, table.endDate),
  check("report_type_valid", sql`report_type IN ('pl_statement', 'cash_flow', 'commission_report', 'expense_report', 'tax_report', 'budget_report')`),
  check("report_period_valid", sql`report_period IN ('monthly', 'quarterly', 'yearly', 'custom')`),
  check("export_format_valid", sql`export_format IS NULL OR export_format IN ('pdf', 'excel', 'csv')`),
  check("is_scheduled_valid", sql`is_scheduled IN (0,1)`),
  check("schedule_frequency_valid", sql`schedule_frequency IS NULL OR schedule_frequency IN ('weekly', 'monthly', 'quarterly')`),
]);

// Tax settings and configurations
export const taxSettings = pgTable("tax_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  taxType: varchar("tax_type", { length: 50 }).notNull(), // gst, vat, sales_tax, income_tax
  taxName: varchar("tax_name", { length: 100 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 10, scale: 4 }).notNull(), // Tax percentage
  isInclusive: integer("is_inclusive").notNull().default(0), // Tax included in price or added
  isActive: integer("is_active").notNull().default(1),
  applicableFrom: timestamp("applicable_from").notNull().defaultNow(),
  applicableTo: timestamp("applicable_to"),
  taxAuthority: varchar("tax_authority", { length: 200 }),
  registrationNumber: varchar("registration_number", { length: 100 }),
  filingFrequency: varchar("filing_frequency", { length: 20 }), // monthly, quarterly, yearly
  nextFilingDate: timestamp("next_filing_date"),
  autoCalculate: integer("auto_calculate").notNull().default(1),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("tax_settings_salon_idx").on(table.salonId),
  index("tax_settings_type_idx").on(table.taxType),
  unique("tax_settings_salon_type_unique").on(table.salonId, table.taxType),
  check("tax_type_valid", sql`tax_type IN ('gst', 'vat', 'sales_tax', 'income_tax', 'service_tax')`),
  check("is_inclusive_valid", sql`is_inclusive IN (0,1)`),
  check("is_active_valid", sql`is_active IN (0,1)`),
  check("auto_calculate_valid", sql`auto_calculate IN (0,1)`),
  check("filing_frequency_valid", sql`filing_frequency IS NULL OR filing_frequency IN ('monthly', 'quarterly', 'yearly')`),
]);

// Financial data relations
export const expenseCategoriesRelations = relations(expenseCategories, ({ one, many }) => ({
  salon: one(salons, {
    fields: [expenseCategories.salonId],
    references: [salons.id],
  }),
  expenses: many(expenses),
  budgets: many(budgets),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  salon: one(salons, {
    fields: [expenses.salonId],
    references: [salons.id],
  }),
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  createdByUser: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [expenses.approvedBy],
    references: [users.id],
  }),
}));

export const commissionRatesRelations = relations(commissionRates, ({ one, many }) => ({
  salon: one(salons, {
    fields: [commissionRates.salonId],
    references: [salons.id],
  }),
  staff: one(staff, {
    fields: [commissionRates.staffId],
    references: [staff.id],
  }),
  service: one(services, {
    fields: [commissionRates.serviceId],
    references: [services.id],
  }),
  commissions: many(commissions),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  salon: one(salons, {
    fields: [commissions.salonId],
    references: [salons.id],
  }),
  staff: one(staff, {
    fields: [commissions.staffId],
    references: [staff.id],
  }),
  booking: one(bookings, {
    fields: [commissions.bookingId],
    references: [bookings.id],
  }),
  service: one(services, {
    fields: [commissions.serviceId],
    references: [services.id],
  }),
  rate: one(commissionRates, {
    fields: [commissions.rateId],
    references: [commissionRates.id],
  }),
  paidByUser: one(users, {
    fields: [commissions.paidBy],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  salon: one(salons, {
    fields: [budgets.salonId],
    references: [salons.id],
  }),
  category: one(expenseCategories, {
    fields: [budgets.categoryId],
    references: [expenseCategories.id],
  }),
  createdByUser: one(users, {
    fields: [budgets.createdBy],
    references: [users.id],
  }),
}));

export const financialReportsRelations = relations(financialReports, ({ one }) => ({
  salon: one(salons, {
    fields: [financialReports.salonId],
    references: [salons.id],
  }),
  generatedByUser: one(users, {
    fields: [financialReports.generatedBy],
    references: [users.id],
  }),
}));

export const taxSettingsRelations = relations(taxSettings, ({ one }) => ({
  salon: one(salons, {
    fields: [taxSettings.salonId],
    references: [salons.id],
  }),
}));

// Financial schema validations and types
export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
}).extend({
  expenseDate: z.union([z.date(), z.string().datetime()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertCommissionRateSchema = createInsertSchema(commissionRates).omit({
  id: true,
  createdAt: true,
}).extend({
  effectiveFrom: z.union([z.date(), z.string().datetime()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  effectiveTo: z.union([z.date(), z.string().datetime()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
}).extend({
  serviceDate: z.union([z.date(), z.string().datetime()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.date(), z.string().datetime()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  endDate: z.union([z.date(), z.string().datetime()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertFinancialReportSchema = createInsertSchema(financialReports).omit({
  id: true,
  createdAt: true,
  exportedAt: true,
  nextScheduledAt: true,
}).extend({
  startDate: z.union([z.date(), z.string().datetime()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  endDate: z.union([z.date(), z.string().datetime()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertTaxSettingSchema = createInsertSchema(taxSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  nextFilingDate: true,
}).extend({
  applicableFrom: z.union([z.date(), z.string().datetime()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  applicableTo: z.union([z.date(), z.string().datetime()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

// Financial types exports
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type CommissionRate = typeof commissionRates.$inferSelect;
export type InsertCommissionRate = z.infer<typeof insertCommissionRateSchema>;

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;

export type TaxSetting = typeof taxSettings.$inferSelect;
export type InsertTaxSetting = z.infer<typeof insertTaxSettingSchema>;

// =================================
// CUSTOMER COMMUNICATION SYSTEM
// =================================

// Message Templates - reusable templates for different communication types
export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // Template name
  type: varchar("type", { length: 50 }).notNull(), // booking_confirmation, booking_reminder, marketing, follow_up, birthday, etc.
  channel: varchar("channel", { length: 20 }).notNull(), // email, sms, both
  subject: varchar("subject", { length: 200 }), // For emails
  content: text("content").notNull(), // Template content with placeholders
  variables: jsonb("variables").default('[]'), // Available variables like {{customerName}}, {{appointmentTime}}
  isActive: integer("is_active").notNull().default(1),
  isDefault: integer("is_default").notNull().default(0), // System default templates
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("message_templates_salon_id_idx").on(table.salonId),
  index("message_templates_type_idx").on(table.type),
]);

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

// Customer Segments - for targeted messaging
export const customerSegments = pgTable("customer_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  criteria: jsonb("criteria").notNull(), // Segment criteria (booking count, last visit, services, etc.)
  customerCount: integer("customer_count").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("customer_segments_salon_id_idx").on(table.salonId),
]);

export const insertCustomerSegmentSchema = createInsertSchema(customerSegments).omit({
  id: true,
  customerCount: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomerSegment = typeof customerSegments.$inferSelect;
export type InsertCustomerSegment = z.infer<typeof insertCustomerSegmentSchema>;

// Communication Campaigns - marketing campaigns and automated workflows
export const communicationCampaigns = pgTable("communication_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // marketing, automated, birthday, re_engagement
  status: varchar("status", { length: 20 }).notNull().default('draft'), // draft, scheduled, running, paused, completed, cancelled
  templateId: varchar("template_id").references(() => messageTemplates.id),
  segmentId: varchar("segment_id").references(() => customerSegments.id), // Target segment
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalRecipients: integer("total_recipients").notNull().default(0),
  messagesSent: integer("messages_sent").notNull().default(0),
  messagesDelivered: integer("messages_delivered").notNull().default(0),
  messagesOpened: integer("messages_opened").notNull().default(0),
  messagesClicked: integer("messages_clicked").notNull().default(0),
  messagesFailed: integer("messages_failed").notNull().default(0),
  unsubscribes: integer("unsubscribes").notNull().default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("communication_campaigns_salon_id_idx").on(table.salonId),
  index("communication_campaigns_status_idx").on(table.status),
  index("communication_campaigns_scheduled_at_idx").on(table.scheduledAt),
]);

export const insertCommunicationCampaignSchema = createInsertSchema(communicationCampaigns).omit({
  id: true,
  totalRecipients: true,
  messagesSent: true,
  messagesDelivered: true,
  messagesOpened: true,
  messagesClicked: true,
  messagesFailed: true,
  unsubscribes: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type CommunicationCampaign = typeof communicationCampaigns.$inferSelect;
export type InsertCommunicationCampaign = z.infer<typeof insertCommunicationCampaignSchema>;

// Communication History - tracks all sent messages
export const communicationHistory = pgTable("communication_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => communicationCampaigns.id, { onDelete: "set null" }),
  templateId: varchar("template_id").references(() => messageTemplates.id, { onDelete: "set null" }),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }), // For booking-related messages
  type: varchar("type", { length: 50 }).notNull(), // booking_confirmation, reminder, marketing, etc.
  channel: varchar("channel", { length: 20 }).notNull(), // email, sms
  recipient: varchar("recipient", { length: 255 }).notNull(), // email address or phone number
  subject: varchar("subject", { length: 200 }),
  content: text("content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, sent, delivered, failed, bounced
  providerId: varchar("provider_id"), // External provider message ID (SendGrid, Twilio)
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata").default('{}'), // Additional tracking data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("communication_history_salon_id_idx").on(table.salonId),
  index("communication_history_customer_id_idx").on(table.customerId),
  index("communication_history_campaign_id_idx").on(table.campaignId),
  index("communication_history_booking_id_idx").on(table.bookingId),
  index("communication_history_status_idx").on(table.status),
  index("communication_history_sent_at_idx").on(table.sentAt),
]);

export const insertCommunicationHistorySchema = createInsertSchema(communicationHistory).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  createdAt: true,
});

export type CommunicationHistory = typeof communicationHistory.$inferSelect;
export type InsertCommunicationHistory = z.infer<typeof insertCommunicationHistorySchema>;

// Communication Preferences - customer communication preferences
export const communicationPreferences = pgTable("communication_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  emailOptIn: integer("email_opt_in").notNull().default(1), // 1 = opted in, 0 = opted out
  smsOptIn: integer("sms_opt_in").notNull().default(1),
  marketingOptIn: integer("marketing_opt_in").notNull().default(1), // Marketing communications
  bookingNotifications: integer("booking_notifications").notNull().default(1), // Booking confirmations/reminders
  promotionalOffers: integer("promotional_offers").notNull().default(1),
  birthdayOffers: integer("birthday_offers").notNull().default(1),
  preferredChannel: varchar("preferred_channel", { length: 20 }).default('email'), // email, sms, both
  unsubscribedAt: timestamp("unsubscribed_at"),
  unsubscribeReason: text("unsubscribe_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("communication_preferences_customer_id_idx").on(table.customerId),
  index("communication_preferences_salon_id_idx").on(table.salonId),
  unique("communication_preferences_customer_salon_unique").on(table.customerId, table.salonId),
]);

export const insertCommunicationPreferencesSchema = createInsertSchema(communicationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CommunicationPreferences = typeof communicationPreferences.$inferSelect;
export type InsertCommunicationPreferences = z.infer<typeof insertCommunicationPreferencesSchema>;

// Scheduled Messages - for managing scheduled communications
export const scheduledMessages = pgTable("scheduled_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => communicationCampaigns.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => messageTemplates.id, { onDelete: "set null" }),
  type: varchar("type", { length: 50 }).notNull(), // booking_reminder, follow_up, birthday, etc.
  channel: varchar("channel", { length: 20 }).notNull(), // email, sms
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  content: text("content").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, sent, failed, cancelled
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lastAttemptAt: timestamp("last_attempt_at"),
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("scheduled_messages_salon_id_idx").on(table.salonId),
  index("scheduled_messages_scheduled_for_idx").on(table.scheduledFor),
  index("scheduled_messages_status_idx").on(table.status),
  index("scheduled_messages_booking_id_idx").on(table.bookingId),
]);

export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages).omit({
  id: true,
  attempts: true,
  lastAttemptAt: true,
  sentAt: true,
  createdAt: true,
});

export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type InsertScheduledMessage = z.infer<typeof insertScheduledMessageSchema>;

// Communication Analytics - aggregate analytics data
export const communicationAnalytics = pgTable("communication_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => communicationCampaigns.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // Analytics for specific date
  channel: varchar("channel", { length: 20 }).notNull(), // email, sms
  messagesSent: integer("messages_sent").notNull().default(0),
  messagesDelivered: integer("messages_delivered").notNull().default(0),
  messagesOpened: integer("messages_opened").notNull().default(0),
  messagesClicked: integer("messages_clicked").notNull().default(0),
  messagesFailed: integer("messages_failed").notNull().default(0),
  unsubscribes: integer("unsubscribes").notNull().default(0),
  bounces: integer("bounces").notNull().default(0),
  complaints: integer("complaints").notNull().default(0),
  revenue: integer("revenue").notNull().default(0), // Revenue attributed to communications in paisa
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("communication_analytics_salon_id_idx").on(table.salonId),
  index("communication_analytics_date_idx").on(table.date),
  index("communication_analytics_campaign_id_idx").on(table.campaignId),
  unique("communication_analytics_salon_campaign_date_channel_unique").on(table.salonId, table.campaignId, table.date, table.channel),
]);

export const insertCommunicationAnalyticsSchema = createInsertSchema(communicationAnalytics).omit({
  id: true,
  createdAt: true,
});

export type CommunicationAnalytics = typeof communicationAnalytics.$inferSelect;
export type InsertCommunicationAnalytics = z.infer<typeof insertCommunicationAnalyticsSchema>;

// Add relations for communication tables
export const messageTemplatesRelations = relations(messageTemplates, ({ one, many }) => ({
  salon: one(salons, {
    fields: [messageTemplates.salonId],
    references: [salons.id],
  }),
  createdByUser: one(users, {
    fields: [messageTemplates.createdBy],
    references: [users.id],
  }),
  campaigns: many(communicationCampaigns),
  history: many(communicationHistory),
  scheduledMessages: many(scheduledMessages),
}));

export const customerSegmentsRelations = relations(customerSegments, ({ one, many }) => ({
  salon: one(salons, {
    fields: [customerSegments.salonId],
    references: [salons.id],
  }),
  createdByUser: one(users, {
    fields: [customerSegments.createdBy],
    references: [users.id],
  }),
  campaigns: many(communicationCampaigns),
}));

export const communicationCampaignsRelations = relations(communicationCampaigns, ({ one, many }) => ({
  salon: one(salons, {
    fields: [communicationCampaigns.salonId],
    references: [salons.id],
  }),
  template: one(messageTemplates, {
    fields: [communicationCampaigns.templateId],
    references: [messageTemplates.id],
  }),
  segment: one(customerSegments, {
    fields: [communicationCampaigns.segmentId],
    references: [customerSegments.id],
  }),
  createdByUser: one(users, {
    fields: [communicationCampaigns.createdBy],
    references: [users.id],
  }),
  history: many(communicationHistory),
  analytics: many(communicationAnalytics),
  scheduledMessages: many(scheduledMessages),
}));

export const communicationHistoryRelations = relations(communicationHistory, ({ one }) => ({
  salon: one(salons, {
    fields: [communicationHistory.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [communicationHistory.customerId],
    references: [users.id],
  }),
  campaign: one(communicationCampaigns, {
    fields: [communicationHistory.campaignId],
    references: [communicationCampaigns.id],
  }),
  template: one(messageTemplates, {
    fields: [communicationHistory.templateId],
    references: [messageTemplates.id],
  }),
  booking: one(bookings, {
    fields: [communicationHistory.bookingId],
    references: [bookings.id],
  }),
}));

export const communicationPreferencesRelations = relations(communicationPreferences, ({ one }) => ({
  customer: one(users, {
    fields: [communicationPreferences.customerId],
    references: [users.id],
  }),
  salon: one(salons, {
    fields: [communicationPreferences.salonId],
    references: [salons.id],
  }),
}));

export const scheduledMessagesRelations = relations(scheduledMessages, ({ one }) => ({
  salon: one(salons, {
    fields: [scheduledMessages.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [scheduledMessages.customerId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [scheduledMessages.bookingId],
    references: [bookings.id],
  }),
  campaign: one(communicationCampaigns, {
    fields: [scheduledMessages.campaignId],
    references: [communicationCampaigns.id],
  }),
  template: one(messageTemplates, {
    fields: [scheduledMessages.templateId],
    references: [messageTemplates.id],
  }),
}));

export const communicationAnalyticsRelations = relations(communicationAnalytics, ({ one }) => ({
  salon: one(salons, {
    fields: [communicationAnalytics.salonId],
    references: [salons.id],
  }),
  campaign: one(communicationCampaigns, {
    fields: [communicationAnalytics.campaignId],
    references: [communicationCampaigns.id],
  }),
}));

// ===== INVENTORY MANAGEMENT SYSTEM =====

// Vendors - supplier information for inventory management
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  contactPerson: varchar("contact_person", { length: 200 }),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 100 }).default('India'),
  website: varchar("website", { length: 200 }),
  taxId: varchar("tax_id", { length: 50 }), // GST number in India
  paymentTerms: varchar("payment_terms", { length: 100 }), // Net 30, COD, etc.
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, inactive, suspended
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("vendors_salon_id_idx").on(table.salonId),
  index("vendors_status_idx").on(table.status),
]);

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

// Product Categories - organize products into categories
export const productCategories = pgTable("product_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  parentCategoryId: varchar("parent_category_id").references(() => productCategories.id, { onDelete: "set null" }),
  isActive: integer("is_active").notNull().default(1),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("product_categories_salon_id_idx").on(table.salonId),
  index("product_categories_parent_idx").on(table.parentCategoryId),
  unique("product_categories_salon_name_unique").on(table.salonId, table.name),
]);

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

// Products - main product catalog
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => productCategories.id, { onDelete: "set null" }),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  sku: varchar("sku", { length: 100 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  brand: varchar("brand", { length: 100 }),
  size: varchar("size", { length: 50 }), // 500ml, 1L, etc.
  unit: varchar("unit", { length: 20 }).notNull().default('piece'), // piece, ml, g, kg, etc.
  costPriceInPaisa: integer("cost_price_in_paisa").notNull(), // Purchase cost
  sellingPriceInPaisa: integer("selling_price_in_paisa"), // Retail price for resale items
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  currentStock: decimal("current_stock", { precision: 10, scale: 3 }).notNull().default('0'),
  minimumStock: decimal("minimum_stock", { precision: 10, scale: 3 }).notNull().default('0'),
  maximumStock: decimal("maximum_stock", { precision: 10, scale: 3 }),
  reorderPoint: decimal("reorder_point", { precision: 10, scale: 3 }),
  reorderQuantity: decimal("reorder_quantity", { precision: 10, scale: 3 }),
  leadTimeDays: integer("lead_time_days").default(7),
  expiryDate: timestamp("expiry_date"),
  batchNumber: varchar("batch_number", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }),
  location: varchar("location", { length: 100 }), // Storage location in salon
  isActive: integer("is_active").notNull().default(1),
  isRetailItem: integer("is_retail_item").notNull().default(0), // Can be sold to customers
  trackStock: integer("track_stock").notNull().default(1), // Enable stock tracking
  lowStockAlert: integer("low_stock_alert").notNull().default(1),
  notes: text("notes"),
  tags: jsonb("tags").default('[]'), // Flexible tagging system
  metadata: jsonb("metadata").default('{}'), // Additional custom fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("products_salon_id_idx").on(table.salonId),
  index("products_category_id_idx").on(table.categoryId),
  index("products_vendor_id_idx").on(table.vendorId),
  index("products_sku_idx").on(table.sku),
  index("products_barcode_idx").on(table.barcode),
  index("products_current_stock_idx").on(table.currentStock),
  index("products_low_stock_idx").on(table.currentStock, table.minimumStock),
  unique("products_salon_sku_unique").on(table.salonId, table.sku),
]);

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Stock Movements - track all inventory changes
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // purchase, usage, adjustment, waste, transfer, return
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitCostInPaisa: integer("unit_cost_in_paisa"), // Cost per unit for this movement
  totalCostInPaisa: integer("total_cost_in_paisa"), // Total cost of movement
  previousStock: decimal("previous_stock", { precision: 10, scale: 3 }).notNull(),
  newStock: decimal("new_stock", { precision: 10, scale: 3 }).notNull(),
  reason: varchar("reason", { length: 100 }), // Why the movement happened
  reference: varchar("reference", { length: 100 }), // PO number, booking ID, etc.
  referenceId: varchar("reference_id"), // Foreign key to related record
  referenceType: varchar("reference_type", { length: 50 }), // purchase_order, booking, adjustment, etc.
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "set null" }), // Who performed the movement
  notes: text("notes"),
  batchNumber: varchar("batch_number", { length: 100 }),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("stock_movements_salon_id_idx").on(table.salonId),
  index("stock_movements_product_id_idx").on(table.productId),
  index("stock_movements_type_idx").on(table.type),
  index("stock_movements_created_at_idx").on(table.createdAt),
  index("stock_movements_reference_idx").on(table.referenceType, table.referenceId),
]);

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

// Purchase Orders - manage orders from vendors
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "restrict" }),
  orderNumber: varchar("order_number", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('draft'), // draft, sent, confirmed, received, cancelled
  orderDate: timestamp("order_date").notNull().defaultNow(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  subtotalInPaisa: integer("subtotal_in_paisa").notNull().default(0),
  taxInPaisa: integer("tax_in_paisa").notNull().default(0),
  shippingInPaisa: integer("shipping_in_paisa").notNull().default(0),
  discountInPaisa: integer("discount_in_paisa").notNull().default(0),
  totalInPaisa: integer("total_in_paisa").notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  paymentStatus: varchar("payment_status", { length: 20 }).default('pending'), // pending, partial, paid
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  receivedBy: varchar("received_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  internalNotes: text("internal_notes"), // Private notes not visible to vendor
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("purchase_orders_salon_id_idx").on(table.salonId),
  index("purchase_orders_vendor_id_idx").on(table.vendorId),
  index("purchase_orders_status_idx").on(table.status),
  index("purchase_orders_order_date_idx").on(table.orderDate),
  unique("purchase_orders_salon_order_number_unique").on(table.salonId, table.orderNumber),
]);

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

// Purchase Order Items - items within purchase orders
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitCostInPaisa: integer("unit_cost_in_paisa").notNull(),
  totalCostInPaisa: integer("total_cost_in_paisa").notNull(),
  receivedQuantity: decimal("received_quantity", { precision: 10, scale: 3 }).default('0'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("purchase_order_items_po_id_idx").on(table.purchaseOrderId),
  index("purchase_order_items_product_id_idx").on(table.productId),
]);

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true,
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

// Product Usage - link product consumption to services
export const productUsage = pgTable("product_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantityPerService: decimal("quantity_per_service", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  costPerServiceInPaisa: integer("cost_per_service_in_paisa"), // Calculated cost per service
  isActive: integer("is_active").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("product_usage_salon_id_idx").on(table.salonId),
  index("product_usage_service_id_idx").on(table.serviceId),
  index("product_usage_product_id_idx").on(table.productId),
  unique("product_usage_service_product_unique").on(table.serviceId, table.productId),
]);

export const insertProductUsageSchema = createInsertSchema(productUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProductUsage = typeof productUsage.$inferSelect;
export type InsertProductUsage = z.infer<typeof insertProductUsageSchema>;

// Reorder Rules - automated reorder settings
export const reorderRules = pgTable("reorder_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  isActive: integer("is_active").notNull().default(1),
  reorderPoint: decimal("reorder_point", { precision: 10, scale: 3 }).notNull(),
  reorderQuantity: decimal("reorder_quantity", { precision: 10, scale: 3 }).notNull(),
  leadTimeDays: integer("lead_time_days").notNull().default(7),
  safetyStockDays: integer("safety_stock_days").default(3),
  autoCreatePO: integer("auto_create_po").notNull().default(0), // Automatically create purchase orders
  lastTriggered: timestamp("last_triggered"),
  nextReviewDate: timestamp("next_review_date"),
  seasonalFactor: decimal("seasonal_factor", { precision: 5, scale: 2 }).default('1.00'), // Seasonal adjustment
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("reorder_rules_salon_id_idx").on(table.salonId),
  index("reorder_rules_product_id_idx").on(table.productId),
  index("reorder_rules_vendor_id_idx").on(table.vendorId),
  index("reorder_rules_next_review_idx").on(table.nextReviewDate),
  unique("reorder_rules_salon_product_unique").on(table.salonId, table.productId),
]);

export const insertReorderRuleSchema = createInsertSchema(reorderRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ReorderRule = typeof reorderRules.$inferSelect;
export type InsertReorderRule = z.infer<typeof insertReorderRuleSchema>;

// Inventory Adjustments - manual stock adjustments and audits
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  adjustmentNumber: varchar("adjustment_number", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // physical_count, shrinkage, damage, expired, correction
  status: varchar("status", { length: 20 }).notNull().default('draft'), // draft, submitted, approved
  adjustmentDate: timestamp("adjustment_date").notNull().defaultNow(),
  reason: varchar("reason", { length: 200 }).notNull(),
  description: text("description"),
  totalValueInPaisa: integer("total_value_in_paisa").default(0), // Total value of adjustment
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("inventory_adjustments_salon_id_idx").on(table.salonId),
  index("inventory_adjustments_type_idx").on(table.type),
  index("inventory_adjustments_status_idx").on(table.status),
  index("inventory_adjustments_date_idx").on(table.adjustmentDate),
  unique("inventory_adjustments_salon_number_unique").on(table.salonId, table.adjustmentNumber),
]);

export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments).omit({
  id: true,
  createdAt: true,
});

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type InsertInventoryAdjustment = z.infer<typeof insertInventoryAdjustmentSchema>;

// Inventory Adjustment Items - individual product adjustments
export const inventoryAdjustmentItems = pgTable("inventory_adjustment_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adjustmentId: varchar("adjustment_id").notNull().references(() => inventoryAdjustments.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  expectedQuantity: decimal("expected_quantity", { precision: 10, scale: 3 }).notNull(),
  actualQuantity: decimal("actual_quantity", { precision: 10, scale: 3 }).notNull(),
  adjustmentQuantity: decimal("adjustment_quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitCostInPaisa: integer("unit_cost_in_paisa"),
  totalCostInPaisa: integer("total_cost_in_paisa"),
  reason: varchar("reason", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("inventory_adjustment_items_adjustment_id_idx").on(table.adjustmentId),
  index("inventory_adjustment_items_product_id_idx").on(table.productId),
]);

export const insertInventoryAdjustmentItemSchema = createInsertSchema(inventoryAdjustmentItems).omit({
  id: true,
  createdAt: true,
});

export type InventoryAdjustmentItem = typeof inventoryAdjustmentItems.$inferSelect;
export type InsertInventoryAdjustmentItem = z.infer<typeof insertInventoryAdjustmentItemSchema>;

// Add relations for inventory tables
export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  salon: one(salons, {
    fields: [vendors.salonId],
    references: [salons.id],
  }),
  products: many(products),
  purchaseOrders: many(purchaseOrders),
  reorderRules: many(reorderRules),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  salon: one(salons, {
    fields: [productCategories.salonId],
    references: [salons.id],
  }),
  parentCategory: one(productCategories, {
    fields: [productCategories.parentCategoryId],
    references: [productCategories.id],
  }),
  subcategories: many(productCategories),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  salon: one(salons, {
    fields: [products.salonId],
    references: [salons.id],
  }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  stockMovements: many(stockMovements),
  purchaseOrderItems: many(purchaseOrderItems),
  productUsage: many(productUsage),
  reorderRule: one(reorderRules),
  adjustmentItems: many(inventoryAdjustmentItems),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  salon: one(salons, {
    fields: [stockMovements.salonId],
    references: [salons.id],
  }),
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  staff: one(staff, {
    fields: [stockMovements.staffId],
    references: [staff.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  salon: one(salons, {
    fields: [purchaseOrders.salonId],
    references: [salons.id],
  }),
  vendor: one(vendors, {
    fields: [purchaseOrders.vendorId],
    references: [vendors.id],
  }),
  createdByUser: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [purchaseOrders.approvedBy],
    references: [users.id],
  }),
  receivedByUser: one(users, {
    fields: [purchaseOrders.receivedBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
}));

export const productUsageRelations = relations(productUsage, ({ one }) => ({
  salon: one(salons, {
    fields: [productUsage.salonId],
    references: [salons.id],
  }),
  service: one(services, {
    fields: [productUsage.serviceId],
    references: [services.id],
  }),
  product: one(products, {
    fields: [productUsage.productId],
    references: [products.id],
  }),
}));

export const reorderRulesRelations = relations(reorderRules, ({ one }) => ({
  salon: one(salons, {
    fields: [reorderRules.salonId],
    references: [salons.id],
  }),
  product: one(products, {
    fields: [reorderRules.productId],
    references: [products.id],
  }),
  vendor: one(vendors, {
    fields: [reorderRules.vendorId],
    references: [vendors.id],
  }),
}));

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one, many }) => ({
  salon: one(salons, {
    fields: [inventoryAdjustments.salonId],
    references: [salons.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryAdjustments.createdBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [inventoryAdjustments.approvedBy],
    references: [users.id],
  }),
  items: many(inventoryAdjustmentItems),
}));

export const inventoryAdjustmentItemsRelations = relations(inventoryAdjustmentItems, ({ one }) => ({
  adjustment: one(inventoryAdjustments, {
    fields: [inventoryAdjustmentItems.adjustmentId],
    references: [inventoryAdjustments.id],
  }),
  product: one(products, {
    fields: [inventoryAdjustmentItems.productId],
    references: [products.id],
  }),
}));
