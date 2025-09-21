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
