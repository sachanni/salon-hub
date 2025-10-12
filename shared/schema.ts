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

// Profile update schema for customer profile management
export const profileUpdateSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  phone: true
});

// Preferences schema for customer preferences
export const preferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingComms: z.boolean().default(false),
  preferredTimes: z.array(z.string()).default([]),
  preferredDays: z.array(z.string()).default([]),
  preferredCommunicationMethod: z.enum(['email', 'sms', 'both']).default('email')
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Replit Auth types
export type UpsertUser = typeof users.$inferInsert;

// User saved locations table - for storing user addresses (home, office, custom)
export const userSavedLocations = pgTable("user_saved_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 20 }).notNull(), // 'home', 'office', 'custom'
  name: text("name").notNull(), // User-friendly name for the location
  address: text("address").notNull(), // Full address text
  latitude: decimal("latitude", { precision: 9, scale: 6 }).notNull(), // Required for proximity search
  longitude: decimal("longitude", { precision: 9, scale: 6 }).notNull(), // Required for proximity search
  placeId: text("place_id"), // Optional Google Places ID for address validation
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint: each user can have only one home and one office location
  uniqueIndex("user_saved_locations_user_label_unique").on(table.userId, table.label)
    .where(sql`${table.label} IN ('home', 'office')`),
  // Spatial index for geospatial queries
  index("user_saved_locations_lat_lng_idx").on(table.latitude, table.longitude),
  // Constraint to validate label values
  check("user_saved_locations_label_check", sql`${table.label} IN ('home', 'office', 'custom')`),
]);

export const insertUserSavedLocationSchema = createInsertSchema(userSavedLocations).omit({
  id: true,
  createdAt: true,
});

export type InsertUserSavedLocation = z.infer<typeof insertUserSavedLocationSchema>;
export type UserSavedLocation = typeof userSavedLocations.$inferSelect;

// User saved locations relations
export const userSavedLocationsRelations = relations(userSavedLocations, ({ one }) => ({
  user: one(users, {
    fields: [userSavedLocations.userId],
    references: [users.id],
  }),
}));

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
  latitude: decimal("latitude", { precision: 9, scale: 6 }), // For global proximity search
  longitude: decimal("longitude", { precision: 9, scale: 6 }), // For global proximity search
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
  setupProgress: jsonb("setup_progress"), // Tracks completion of 8 setup steps: businessInfo, locationContact, services, staff, resources, bookingSettings, paymentSetup, media
  ownerId: varchar("owner_id").references(() => users.id), // Keep for backward compatibility
  orgId: varchar("org_id").references(() => organizations.id, { onDelete: "set null" }), // New organization link
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Spatial index for geospatial queries (lat/lng proximity search)
  index("salons_lat_lng_idx").on(table.latitude, table.longitude),
]);

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
  savedLocations: many(userSavedLocations),
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
  servicePackages: many(servicePackages),
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
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
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
  packageServices: many(packageServices),
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
  role: varchar("role", { length: 100 }), // Staff role (Stylist, Colorist, Nail Technician, etc.)
  photoUrl: text("photo_url"), // Staff photo URL
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

// Service Packages table - allows salons to create combo/package deals
export const servicePackages = pgTable("service_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Bridal Package", "Spa Day Special"
  description: text("description"), // Package details
  totalDurationMinutes: integer("total_duration_minutes").notNull(), // Sum of all services or custom
  packagePriceInPaisa: integer("package_price_in_paisa").notNull(), // Discounted package price
  regularPriceInPaisa: integer("regular_price_in_paisa").notNull(), // Total if booked separately
  discountPercentage: integer("discount_percentage"), // Calculated discount percentage
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("service_packages_id_salon_id_unique").on(table.id, table.salonId),
]);

export const insertServicePackageSchema = createInsertSchema(servicePackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;
export type ServicePackage = typeof servicePackages.$inferSelect;

// Package Services junction table - links services to packages (many-to-many)
export const packageServices = pgTable("package_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: varchar("package_id").notNull().references(() => servicePackages.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  sequenceOrder: integer("sequence_order").notNull().default(1), // Order in which services are performed
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Ensure same package doesn't have duplicate services
  unique("package_services_package_service_unique").on(table.packageId, table.serviceId),
  // Foreign key constraints to enforce same-salon membership
  foreignKey({
    columns: [table.packageId, table.salonId],
    foreignColumns: [servicePackages.id, servicePackages.salonId],
    name: "package_services_package_salon_fk"
  }),
  foreignKey({
    columns: [table.serviceId, table.salonId],
    foreignColumns: [services.id, services.salonId],
    name: "package_services_service_salon_fk"
  }),
]);

export const insertPackageServiceSchema = createInsertSchema(packageServices).omit({
  id: true,
  createdAt: true,
});

export type InsertPackageService = z.infer<typeof insertPackageServiceSchema>;
export type PackageService = typeof packageServices.$inferSelect;

// Package relations
export const servicePackagesRelations = relations(servicePackages, ({ one, many }) => ({
  salon: one(salons, {
    fields: [servicePackages.salonId],
    references: [salons.id],
  }),
  packageServices: many(packageServices),
}));

export const packageServicesRelations = relations(packageServices, ({ one }) => ({
  package: one(servicePackages, {
    fields: [packageServices.packageId],
    references: [servicePackages.id],
  }),
  service: one(services, {
    fields: [packageServices.serviceId],
    references: [services.id],
  }),
  salon: one(salons, {
    fields: [packageServices.salonId],
    references: [salons.id],
  }),
}));

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
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().default('pay_now'), // pay_now, pay_at_salon
  notes: text("notes"), // Special requests or notes
  guestSessionId: text("guest_session_id"), // For tracking guest user sessions
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique index to enable composite FKs from booking_services
  uniqueIndex("bookings_id_salon_id_unique").on(table.id, table.salonId),
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

// Booking Services Join Table - supports multiple services per booking
// MUST be defined BEFORE bookingsRelations to avoid initialization errors
export const bookingServices = pgTable("booking_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull(),
  serviceId: varchar("service_id").notNull(),
  salonId: varchar("salon_id").notNull(),
  priceInPaisa: integer("price_in_paisa").notNull(), // Captured at time of booking
  durationMinutes: integer("duration_minutes").notNull(), // Captured at time of booking
  sequence: integer("sequence").notNull(), // Order of services in the booking (required, no default)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Composite foreign keys to enforce same-salon membership
  foreignKey({
    columns: [table.bookingId, table.salonId],
    foreignColumns: [bookings.id, bookings.salonId],
    name: "booking_services_booking_salon_fk"
  }),
  foreignKey({
    columns: [table.serviceId, table.salonId],
    foreignColumns: [services.id, services.salonId],
    name: "booking_services_service_salon_fk"
  }),
  // Unique constraint: booking can't have duplicate sequence numbers
  unique().on(table.bookingId, table.sequence),
]);

export const insertBookingServiceSchema = createInsertSchema(bookingServices).omit({
  id: true,
  createdAt: true,
});

export type InsertBookingService = z.infer<typeof insertBookingServiceSchema>;
export type BookingService = typeof bookingServices.$inferSelect;

// Booking Services relations
export const bookingServicesRelations = relations(bookingServices, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingServices.bookingId],
    references: [bookings.id],
  }),
  service: one(services, {
    fields: [bookingServices.serviceId],
    references: [services.id],
  }),
  salon: one(salons, {
    fields: [bookingServices.salonId],
    references: [salons.id],
  }),
}));

// Booking relations
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
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
  bookingServices: many(bookingServices),
}));

// Payments table - tracks payment information
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  amountPaisa: integer("amount_paisa").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
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
    paymentMethod: z.enum(['pay_now', 'pay_at_salon']).default('pay_now'), // Payment method selection
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

// Reschedule booking schema - change date, time, and optionally staff
export const rescheduleBookingInputSchema = z.object({
  bookingDate: z.string().min(1, "Booking date is required"),
  bookingTime: z.string().min(1, "Booking time is required"),
  staffId: z.string().uuid().optional(),
});

// Package/Combo validation schemas
export const createPackageSchema = z.object({
  name: z.string().min(1, "Package name is required").max(100, "Package name must be under 100 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  serviceIds: z.array(z.string().uuid())
    .min(2, "Package must include at least 2 services")
    .max(10, "Package cannot have more than 10 services"),
  discountedPricePaisa: z.number()
    .int("Price must be a whole number")
    .positive("Price must be greater than 0")
    .max(10000000, "Price cannot exceed ₹100,000"), // Max ₹1 lakh
});

export const updatePackageSchema = z.object({
  name: z.string().min(1, "Package name is required").max(100, "Package name must be under 100 characters").optional(),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  serviceIds: z.array(z.string().uuid())
    .min(2, "Package must include at least 2 services")
    .max(10, "Package cannot have more than 10 services")
    .optional(),
  discountedPricePaisa: z.number()
    .int("Price must be a whole number")
    .positive("Price must be greater than 0")
    .max(10000000, "Price cannot exceed ₹100,000")
    .optional(),
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
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingInputSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

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
  depositType: varchar("deposit_type", { length: 20 }).default('percentage'),
  depositAmountFixed: integer("deposit_amount_fixed").default(0),
  autoConfirm: integer("auto_confirm").notNull().default(1),
  allowCancellation: integer("allow_cancellation").notNull().default(1),
  allowRescheduling: integer("allow_reschedule").notNull().default(1),
  maxAdvanceBookingDays: integer("max_advance_booking_days").notNull().default(90),
  maxConcurrentBookings: integer("max_concurrent_bookings").default(1),
  allowGroupBookings: integer("allow_group_bookings").default(0),
  maxGroupSize: integer("max_group_size").default(1),
  sendAutomatedReminders: integer("send_automated_reminders").default(1),
  reminderHoursBefore: integer("reminder_hours_before").default(24),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Removed redundant index since unique constraint already creates one
  check("lead_time_positive", sql`lead_time_minutes > 0`),
  check("cancel_window_positive", sql`cancel_window_minutes > 0`),
  check("buffer_minutes_valid", sql`buffer_minutes >= 0`),
  check("deposit_percentage_valid", sql`deposit_percentage >= 0 AND deposit_percentage <= 100`),
  check("deposit_type_valid", sql`deposit_type IN ('fixed', 'percentage')`),
  check("deposit_amount_fixed_valid", sql`deposit_amount_fixed >= 0`),
  check("auto_confirm_valid", sql`auto_confirm IN (0,1)`),
  check("allow_cancellation_valid", sql`allow_cancellation IN (0,1)`),
  check("allow_reschedule_valid", sql`allow_reschedule IN (0,1)`),
  check("max_advance_days_positive", sql`max_advance_booking_days > 0`),
  check("max_concurrent_positive", sql`max_concurrent_bookings >= 1`),
  check("allow_group_bookings_valid", sql`allow_group_bookings IN (0,1)`),
  check("max_group_size_valid", sql`max_group_size >= 1 AND max_group_size <= 20`),
  check("send_reminders_valid", sql`send_automated_reminders IN (0,1)`),
  check("reminder_hours_valid", sql`reminder_hours_before >= 1`),
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

// Customer profile update schema for /api/customer/profile endpoint
export const updateCustomerProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name cannot exceed 50 characters").optional(),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name cannot exceed 50 characters").optional(),
  phone: z.string().max(20, "Phone number cannot exceed 20 characters").optional().nullable(),
  preferences: z.object({
    emailNotifications: z.boolean().default(true),
    smsNotifications: z.boolean().default(false),
    marketingComms: z.boolean().default(false),
    preferredTimes: z.array(z.enum(['morning', 'afternoon', 'evening'])).default([]),
    preferredDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).default([]),
    preferredCommunicationMethod: z.enum(['email', 'sms', 'both']).default('email')
  }).optional()
});

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;

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
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
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
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
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
  abTestCampaigns: many(abTestCampaigns),
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
  abTestCampaigns: many(abTestCampaigns),
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

// ===== A/B TESTING FOR COMMUNICATION CAMPAIGNS =====

// A/B Test Campaigns - Main A/B test configurations
export const abTestCampaigns = pgTable("ab_test_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  campaignName: varchar("campaign_name", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default('draft'), // draft, active, completed, paused
  baseTemplateId: varchar("base_template_id").notNull().references(() => messageTemplates.id, { onDelete: "restrict" }),
  testType: varchar("test_type", { length: 50 }).notNull(), // subject, content, timing, channel, multivariate
  targetSegmentId: varchar("target_segment_id").references(() => customerSegments.id, { onDelete: "set null" }),
  sampleSizePercentage: integer("sample_size_percentage").notNull().default(100), // 1-100
  testDuration: integer("test_duration").notNull().default(7), // Duration in days
  confidenceLevel: integer("confidence_level").notNull().default(95), // 90, 95, 99
  successMetric: varchar("success_metric", { length: 50 }).notNull().default('open_rate'), // open_rate, click_rate, conversion_rate, booking_rate
  winnerSelectionCriteria: varchar("winner_selection_criteria", { length: 50 }).notNull().default('statistical_significance'), // statistical_significance, business_rules
  autoOptimization: integer("auto_optimization").notNull().default(0), // Boolean: auto-select winner
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").references(() => users.id),
}, (table) => [
  index("ab_test_campaigns_salon_id_idx").on(table.salonId),
  index("ab_test_campaigns_status_idx").on(table.status),
  index("ab_test_campaigns_test_type_idx").on(table.testType),
  index("ab_test_campaigns_started_at_idx").on(table.startedAt),
  index("ab_test_campaigns_completed_at_idx").on(table.completedAt),
  check("sample_size_valid", sql`sample_size_percentage >= 1 AND sample_size_percentage <= 100`),
  check("test_duration_valid", sql`test_duration >= 1`),
  check("confidence_level_valid", sql`confidence_level IN (90, 95, 99)`),
  check("auto_optimization_valid", sql`auto_optimization IN (0,1)`),
]);

export const insertAbTestCampaignSchema = createInsertSchema(abTestCampaigns).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export type AbTestCampaign = typeof abTestCampaigns.$inferSelect;
export type InsertAbTestCampaign = z.infer<typeof insertAbTestCampaignSchema>;

// Test Variants - Individual test variations
export const testVariants = pgTable("test_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testCampaignId: varchar("test_campaign_id").notNull().references(() => abTestCampaigns.id, { onDelete: "cascade" }),
  variantName: varchar("variant_name", { length: 100 }).notNull(),
  isControl: integer("is_control").notNull().default(0), // Boolean: control variant
  templateOverrides: jsonb("template_overrides").default('{}'), // JSON: subject, content, timing modifications
  channelOverride: varchar("channel_override", { length: 20 }), // email, sms, both - overrides base template channel
  priority: integer("priority").notNull().default(0), // For ordering variants
  audiencePercentage: integer("audience_percentage").notNull(), // Percentage of test audience for this variant
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, paused, winner, loser
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("test_variants_campaign_id_idx").on(table.testCampaignId),
  index("test_variants_status_idx").on(table.status),
  index("test_variants_priority_idx").on(table.priority),
  unique("test_variants_campaign_name_unique").on(table.testCampaignId, table.variantName),
  check("is_control_valid", sql`is_control IN (0,1)`),
  check("audience_percentage_valid", sql`audience_percentage >= 1 AND audience_percentage <= 100`),
  check("priority_valid", sql`priority >= 0`),
]);

export const insertTestVariantSchema = createInsertSchema(testVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TestVariant = typeof testVariants.$inferSelect;
export type InsertTestVariant = z.infer<typeof insertTestVariantSchema>;

// Test Metrics - Performance tracking per variant
export const testMetrics = pgTable("test_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testCampaignId: varchar("test_campaign_id").notNull().references(() => abTestCampaigns.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id").notNull().references(() => testVariants.id, { onDelete: "cascade" }),
  metricDate: timestamp("metric_date").notNull(), // Date for daily aggregated metrics
  participantCount: integer("participant_count").notNull().default(0), // Number of users in this variant
  sentCount: integer("sent_count").notNull().default(0),
  deliveredCount: integer("delivered_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  bookingCount: integer("booking_count").notNull().default(0),
  conversionCount: integer("conversion_count").notNull().default(0),
  bounceCount: integer("bounce_count").notNull().default(0),
  unsubscribeCount: integer("unsubscribe_count").notNull().default(0),
  openRate: decimal("open_rate", { precision: 5, scale: 4 }).default('0.0000'), // Calculated: openCount/deliveredCount
  clickRate: decimal("click_rate", { precision: 5, scale: 4 }).default('0.0000'), // Calculated: clickCount/deliveredCount
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }).default('0.0000'), // Calculated: conversionCount/deliveredCount
  bookingRate: decimal("booking_rate", { precision: 5, scale: 4 }).default('0.0000'), // Calculated: bookingCount/deliveredCount
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("test_metrics_campaign_id_idx").on(table.testCampaignId),
  index("test_metrics_variant_id_idx").on(table.variantId),
  index("test_metrics_date_idx").on(table.metricDate),
  unique("test_metrics_variant_date_unique").on(table.variantId, table.metricDate),
  check("participant_count_valid", sql`participant_count >= 0`),
  check("sent_count_valid", sql`sent_count >= 0`),
  check("delivered_count_valid", sql`delivered_count >= 0`),
  check("open_count_valid", sql`open_count >= 0`),
  check("click_count_valid", sql`click_count >= 0`),
  check("reply_count_valid", sql`reply_count >= 0`),
  check("booking_count_valid", sql`booking_count >= 0`),
  check("conversion_count_valid", sql`conversion_count >= 0`),
  check("bounce_count_valid", sql`bounce_count >= 0`),
  check("unsubscribe_count_valid", sql`unsubscribe_count >= 0`),
  check("rates_valid", sql`open_rate >= 0 AND click_rate >= 0 AND conversion_rate >= 0 AND booking_rate >= 0`),
]);

export const insertTestMetricSchema = createInsertSchema(testMetrics).omit({
  id: true,
  openRate: true, // Calculated field
  clickRate: true, // Calculated field
  conversionRate: true, // Calculated field
  bookingRate: true, // Calculated field
  updatedAt: true,
});

export type TestMetric = typeof testMetrics.$inferSelect;
export type InsertTestMetric = z.infer<typeof insertTestMetricSchema>;

// Test Results - Final test outcomes and decisions
export const testResults = pgTable("test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testCampaignId: varchar("test_campaign_id").notNull().references(() => abTestCampaigns.id, { onDelete: "cascade" }).unique(),
  winnerVariantId: varchar("winner_variant_id").references(() => testVariants.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at").notNull(),
  statisticalSignificance: decimal("statistical_significance", { precision: 5, scale: 4 }), // P-value or confidence level achieved
  confidenceLevel: integer("confidence_level"), // Actual confidence level achieved
  pValue: decimal("p_value", { precision: 10, scale: 9 }), // Statistical p-value
  performanceImprovement: decimal("performance_improvement", { precision: 5, scale: 4 }), // % improvement of winner over control
  resultSummary: jsonb("result_summary").default('{}'), // JSON: detailed results, variant performance comparison
  actionTaken: varchar("action_taken", { length: 50 }).notNull(), // manual_selection, auto_winner, inconclusive
  implementedAt: timestamp("implemented_at"), // When the winning variant was implemented
  notes: text("notes"), // Additional notes about the test conclusion
}, (table) => [
  index("test_results_campaign_id_idx").on(table.testCampaignId),
  index("test_results_winner_variant_idx").on(table.winnerVariantId),
  index("test_results_completed_at_idx").on(table.completedAt),
  index("test_results_implemented_at_idx").on(table.implementedAt),
  check("confidence_level_valid", sql`confidence_level IS NULL OR confidence_level IN (90, 95, 99)`),
  check("statistical_significance_valid", sql`statistical_significance IS NULL OR (statistical_significance >= 0 AND statistical_significance <= 1)`),
  check("p_value_valid", sql`p_value IS NULL OR (p_value >= 0 AND p_value <= 1)`),
]);

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
});

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;

// A/B Testing Relations
export const abTestCampaignsRelations = relations(abTestCampaigns, ({ one, many }) => ({
  salon: one(salons, {
    fields: [abTestCampaigns.salonId],
    references: [salons.id],
  }),
  baseTemplate: one(messageTemplates, {
    fields: [abTestCampaigns.baseTemplateId],
    references: [messageTemplates.id],
  }),
  targetSegment: one(customerSegments, {
    fields: [abTestCampaigns.targetSegmentId],
    references: [customerSegments.id],
  }),
  createdByUser: one(users, {
    fields: [abTestCampaigns.createdBy],
    references: [users.id],
  }),
  variants: many(testVariants),
  metrics: many(testMetrics),
  result: one(testResults, {
    fields: [abTestCampaigns.id],
    references: [testResults.testCampaignId],
  }),
}));

export const testVariantsRelations = relations(testVariants, ({ one, many }) => ({
  testCampaign: one(abTestCampaigns, {
    fields: [testVariants.testCampaignId],
    references: [abTestCampaigns.id],
  }),
  metrics: many(testMetrics),
  winnerResults: many(testResults),
}));

export const testMetricsRelations = relations(testMetrics, ({ one }) => ({
  testCampaign: one(abTestCampaigns, {
    fields: [testMetrics.testCampaignId],
    references: [abTestCampaigns.id],
  }),
  variant: one(testVariants, {
    fields: [testMetrics.variantId],
    references: [testVariants.id],
  }),
}));

export const testResultsRelations = relations(testResults, ({ one }) => ({
  testCampaign: one(abTestCampaigns, {
    fields: [testResults.testCampaignId],
    references: [abTestCampaigns.id],
  }),
  winnerVariant: one(testVariants, {
    fields: [testResults.winnerVariantId],
    references: [testVariants.id],
  }),
}));

// ===== A/B TESTING AUTOMATION SYSTEM =====

// Automation Configurations - Settings for automated A/B testing features
export const automationConfigurations = pgTable("automation_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  configurationName: varchar("configuration_name", { length: 100 }).notNull(),
  isEnabled: integer("is_enabled").notNull().default(1),
  
  // Variant generation settings
  enableVariantGeneration: integer("enable_variant_generation").notNull().default(1),
  maxVariantsPerTest: integer("max_variants_per_test").notNull().default(4),
  variantGenerationTypes: jsonb("variant_generation_types").default('["subject_line", "content", "send_time"]'), // Types of variants to auto-generate
  
  // Performance monitoring settings
  enablePerformanceMonitoring: integer("enable_performance_monitoring").notNull().default(1),
  monitoringIntervalMinutes: integer("monitoring_interval_minutes").notNull().default(15),
  performanceAlertThreshold: decimal("performance_alert_threshold", { precision: 5, scale: 4 }).default('0.0500'), // 5% performance change threshold
  
  // Winner selection settings
  enableAutoWinnerSelection: integer("enable_auto_winner_selection").notNull().default(0),
  autoWinnerConfidenceLevel: integer("auto_winner_confidence_level").notNull().default(95), // 90, 95, 99
  minimumTestDurationHours: integer("minimum_test_duration_hours").notNull().default(24),
  minimumSampleSize: integer("minimum_sample_size").notNull().default(100),
  
  // Campaign optimization settings
  enableCampaignOptimization: integer("enable_campaign_optimization").notNull().default(1),
  optimizationTypes: jsonb("optimization_types").default('["send_time", "frequency", "channel"]'), // Types of optimizations to suggest
  learningDataDays: integer("learning_data_days").notNull().default(30), // Days of historical data to use for learning
  
  // Business rules for automation
  businessRules: jsonb("business_rules").default('{}'), // Custom business rules as JSON
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("automation_configurations_salon_id_idx").on(table.salonId),
  index("automation_configurations_enabled_idx").on(table.isEnabled),
  unique("automation_configurations_salon_name_unique").on(table.salonId, table.configurationName),
  check("max_variants_valid", sql`max_variants_per_test >= 2 AND max_variants_per_test <= 10`),
  check("monitoring_interval_valid", sql`monitoring_interval_minutes >= 5 AND monitoring_interval_minutes <= 1440`),
  check("confidence_level_valid", sql`auto_winner_confidence_level IN (90, 95, 99)`),
  check("duration_valid", sql`minimum_test_duration_hours >= 1 AND minimum_test_duration_hours <= 168`),
  check("sample_size_valid", sql`minimum_sample_size >= 10`),
]);

export const insertAutomationConfigurationSchema = createInsertSchema(automationConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AutomationConfiguration = typeof automationConfigurations.$inferSelect;
export type InsertAutomationConfiguration = z.infer<typeof insertAutomationConfigurationSchema>;

// Variant Generation Rules - AI-powered rules for creating test variants
export const variantGenerationRules = pgTable("variant_generation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  configurationId: varchar("configuration_id").notNull().references(() => automationConfigurations.id, { onDelete: "cascade" }),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  ruleType: varchar("rule_type", { length: 50 }).notNull(), // subject_line, content, timing, channel, personalization
  isActive: integer("is_active").notNull().default(1),
  priority: integer("priority").notNull().default(0), // Higher priority rules are applied first
  
  // Rule conditions
  conditions: jsonb("conditions").default('{}'), // JSON: audience criteria, performance thresholds, etc.
  
  // Rule actions
  actions: jsonb("actions").default('{}'), // JSON: variant modifications to apply
  
  // Performance tracking
  timesApplied: integer("times_applied").notNull().default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 4 }).default('0.0000'), // % of times this rule improved performance
  averageImprovement: decimal("average_improvement", { precision: 5, scale: 4 }).default('0.0000'), // Average performance improvement
  
  // Best practice templates
  bestPracticeTemplates: jsonb("best_practice_templates").default('[]'), // Proven effective patterns
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("variant_generation_rules_salon_id_idx").on(table.salonId),
  index("variant_generation_rules_config_id_idx").on(table.configurationId),
  index("variant_generation_rules_type_idx").on(table.ruleType),
  index("variant_generation_rules_active_idx").on(table.isActive),
  index("variant_generation_rules_priority_idx").on(table.priority),
  unique("variant_generation_rules_config_name_unique").on(table.configurationId, table.ruleName),
]);

export const insertVariantGenerationRuleSchema = createInsertSchema(variantGenerationRules).omit({
  id: true,
  timesApplied: true,
  successRate: true,
  averageImprovement: true,
  createdAt: true,
  updatedAt: true,
});

export type VariantGenerationRule = typeof variantGenerationRules.$inferSelect;
export type InsertVariantGenerationRule = z.infer<typeof insertVariantGenerationRuleSchema>;

// Performance Monitoring Settings - Real-time monitoring configurations
export const performanceMonitoringSettings = pgTable("performance_monitoring_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  configurationId: varchar("configuration_id").notNull().references(() => automationConfigurations.id, { onDelete: "cascade" }),
  monitoringName: varchar("monitoring_name", { length: 100 }).notNull(),
  isActive: integer("is_active").notNull().default(1),
  
  // Monitoring targets
  targetMetrics: jsonb("target_metrics").default('["open_rate", "click_rate", "conversion_rate"]'), // Metrics to monitor
  metricThresholds: jsonb("metric_thresholds").default('{}'), // Alert thresholds for each metric
  
  // Monitoring frequency
  checkIntervalMinutes: integer("check_interval_minutes").notNull().default(15),
  alertCooldownMinutes: integer("alert_cooldown_minutes").notNull().default(60), // Prevent spam alerts
  
  // Alert settings
  enableEmailAlerts: integer("enable_email_alerts").notNull().default(1),
  enableSmsAlerts: integer("enable_sms_alerts").notNull().default(0),
  alertRecipients: jsonb("alert_recipients").default('[]'), // Email/phone list for alerts
  
  // Early detection settings
  enableEarlyWinnerDetection: integer("enable_early_winner_detection").notNull().default(1),
  earlyDetectionMinimumSamples: integer("early_detection_minimum_samples").notNull().default(50),
  earlyDetectionSignificanceLevel: decimal("early_detection_significance_level", { precision: 5, scale: 4 }).default('0.0500'), // 5% significance level
  
  // Data collection settings
  enableProviderIntegration: integer("enable_provider_integration").notNull().default(1),
  providerSettings: jsonb("provider_settings").default('{}'), // SendGrid, Twilio integration settings
  
  lastMonitoredAt: timestamp("last_monitored_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("performance_monitoring_settings_salon_id_idx").on(table.salonId),
  index("performance_monitoring_settings_config_id_idx").on(table.configurationId),
  index("performance_monitoring_settings_active_idx").on(table.isActive),
  index("performance_monitoring_settings_last_monitored_idx").on(table.lastMonitoredAt),
  unique("performance_monitoring_settings_config_name_unique").on(table.configurationId, table.monitoringName),
  check("check_interval_valid", sql`check_interval_minutes >= 5 AND check_interval_minutes <= 1440`),
  check("cooldown_valid", sql`alert_cooldown_minutes >= 5 AND alert_cooldown_minutes <= 1440`),
]);

export const insertPerformanceMonitoringSettingSchema = createInsertSchema(performanceMonitoringSettings).omit({
  id: true,
  lastMonitoredAt: true,
  createdAt: true,
  updatedAt: true,
});

export type PerformanceMonitoringSetting = typeof performanceMonitoringSettings.$inferSelect;
export type InsertPerformanceMonitoringSetting = z.infer<typeof insertPerformanceMonitoringSettingSchema>;

// Optimization Recommendations - ML-generated optimization suggestions
export const optimizationRecommendations = pgTable("optimization_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").references(() => communicationCampaigns.id, { onDelete: "cascade" }),
  testCampaignId: varchar("test_campaign_id").references(() => abTestCampaigns.id, { onDelete: "cascade" }),
  
  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(), // send_time, audience, content, frequency, channel
  recommendationTitle: varchar("recommendation_title", { length: 200 }).notNull(),
  recommendationDescription: text("recommendation_description").notNull(),
  
  // Confidence and impact metrics
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }).notNull(), // 0-1 confidence in recommendation
  expectedImprovement: decimal("expected_improvement", { precision: 5, scale: 4 }).notNull(), // % improvement expected
  impactScore: decimal("impact_score", { precision: 5, scale: 4 }).notNull(), // Business impact score
  
  // Implementation details
  implementationData: jsonb("implementation_data").default('{}'), // JSON: specific changes to make
  implementationComplexity: varchar("implementation_complexity", { length: 20 }).notNull().default('low'), // low, medium, high
  estimatedEffortHours: decimal("estimated_effort_hours", { precision: 4, scale: 2 }).default('0.25'),
  
  // ML model details
  modelVersion: varchar("model_version", { length: 50 }),
  modelFeatures: jsonb("model_features").default('{}'), // Features used for this recommendation
  basedOnDataPoints: integer("based_on_data_points").default(0), // Number of data points used
  
  // Status and feedback
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, implemented, rejected, expired
  implementedAt: timestamp("implemented_at"),
  implementedBy: varchar("implemented_by").references(() => users.id),
  actualImprovement: decimal("actual_improvement", { precision: 5, scale: 4 }), // Measured improvement after implementation
  feedbackScore: integer("feedback_score"), // User feedback 1-5
  feedbackNotes: text("feedback_notes"),
  
  // Expiration and priority
  expiresAt: timestamp("expires_at"),
  priority: integer("priority").notNull().default(5), // 1-10 priority scale
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("optimization_recommendations_salon_id_idx").on(table.salonId),
  index("optimization_recommendations_campaign_id_idx").on(table.campaignId),
  index("optimization_recommendations_test_campaign_id_idx").on(table.testCampaignId),
  index("optimization_recommendations_type_idx").on(table.recommendationType),
  index("optimization_recommendations_status_idx").on(table.status),
  index("optimization_recommendations_priority_idx").on(table.priority),
  index("optimization_recommendations_expires_at_idx").on(table.expiresAt),
  check("confidence_score_valid", sql`confidence_score >= 0 AND confidence_score <= 1`),
  check("impact_score_valid", sql`impact_score >= 0 AND impact_score <= 1`),
  check("priority_valid", sql`priority >= 1 AND priority <= 10`),
  check("feedback_score_valid", sql`feedback_score IS NULL OR (feedback_score >= 1 AND feedback_score <= 5)`),
]);

export const insertOptimizationRecommendationSchema = createInsertSchema(optimizationRecommendations).omit({
  id: true,
  implementedAt: true,
  actualImprovement: true,
  feedbackScore: true,
  feedbackNotes: true,
  createdAt: true,
  updatedAt: true,
});

export type OptimizationRecommendation = typeof optimizationRecommendations.$inferSelect;
export type InsertOptimizationRecommendation = z.infer<typeof insertOptimizationRecommendationSchema>;

// Automated Action Logs - Track all automated actions performed by the system
export const automatedActionLogs = pgTable("automated_action_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  configurationId: varchar("configuration_id").references(() => automationConfigurations.id, { onDelete: "set null" }),
  campaignId: varchar("campaign_id").references(() => communicationCampaigns.id, { onDelete: "set null" }),
  testCampaignId: varchar("test_campaign_id").references(() => abTestCampaigns.id, { onDelete: "set null" }),
  recommendationId: varchar("recommendation_id").references(() => optimizationRecommendations.id, { onDelete: "set null" }),
  
  actionType: varchar("action_type", { length: 50 }).notNull(), // variant_generated, winner_selected, optimization_applied, alert_sent, etc.
  actionDescription: text("action_description").notNull(),
  
  // Action details
  actionData: jsonb("action_data").default('{}'), // JSON: specific action parameters and results
  triggeredBy: varchar("triggered_by", { length: 50 }).notNull(), // system, user, schedule, webhook
  triggerData: jsonb("trigger_data").default('{}'), // What triggered this action
  
  // Results
  status: varchar("status", { length: 20 }).notNull().default('completed'), // pending, completed, failed, cancelled
  resultData: jsonb("result_data").default('{}'), // Action results and metrics
  errorMessage: text("error_message"), // Error details if failed
  
  // Performance impact
  performanceImpact: jsonb("performance_impact").default('{}'), // Measured impact of this action
  
  // Timing
  executionTimeMs: integer("execution_time_ms"), // How long the action took
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("automated_action_logs_salon_id_idx").on(table.salonId),
  index("automated_action_logs_config_id_idx").on(table.configurationId),
  index("automated_action_logs_campaign_id_idx").on(table.campaignId),
  index("automated_action_logs_test_campaign_id_idx").on(table.testCampaignId),
  index("automated_action_logs_action_type_idx").on(table.actionType),
  index("automated_action_logs_status_idx").on(table.status),
  index("automated_action_logs_triggered_by_idx").on(table.triggeredBy),
  index("automated_action_logs_created_at_idx").on(table.createdAt),
]);

export const insertAutomatedActionLogSchema = createInsertSchema(automatedActionLogs).omit({
  id: true,
  executionTimeMs: true,
  createdAt: true,
  completedAt: true,
});

export type AutomatedActionLog = typeof automatedActionLogs.$inferSelect;
export type InsertAutomatedActionLog = z.infer<typeof insertAutomatedActionLogSchema>;

// Campaign Optimization Insights - Machine learning insights for campaign improvement
export const campaignOptimizationInsights = pgTable("campaign_optimization_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  insightType: varchar("insight_type", { length: 50 }).notNull(), // send_time_patterns, audience_preferences, content_performance, channel_effectiveness
  insightTitle: varchar("insight_title", { length: 200 }).notNull(),
  insightDescription: text("insight_description").notNull(),
  
  // Insight data
  insightData: jsonb("insight_data").default('{}'), // JSON: detailed insight findings
  supportingMetrics: jsonb("supporting_metrics").default('{}'), // Metrics that support this insight
  
  // Confidence and validity
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }).notNull(), // 0-1 confidence in insight
  sampleSize: integer("sample_size").notNull(), // Number of data points used
  dataDateRange: jsonb("data_date_range").default('{}'), // Start and end dates of analyzed data
  
  // Actionability
  isActionable: integer("is_actionable").notNull().default(1),
  recommendedActions: jsonb("recommended_actions").default('[]'), // List of recommended actions
  
  // Performance tracking
  timesActedUpon: integer("times_acted_upon").notNull().default(0),
  averageImpactWhenActedUpon: decimal("average_impact_when_acted_upon", { precision: 5, scale: 4 }).default('0.0000'),
  
  // Lifecycle
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, implemented, expired, superseded
  validUntil: timestamp("valid_until"), // When this insight expires
  supersededBy: varchar("superseded_by"), // Self-reference will be added after table definition
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("campaign_optimization_insights_salon_id_idx").on(table.salonId),
  index("campaign_optimization_insights_type_idx").on(table.insightType),
  index("campaign_optimization_insights_status_idx").on(table.status),
  index("campaign_optimization_insights_actionable_idx").on(table.isActionable),
  index("campaign_optimization_insights_valid_until_idx").on(table.validUntil),
  check("confidence_score_valid", sql`confidence_score >= 0 AND confidence_score <= 1`),
  check("sample_size_valid", sql`sample_size > 0`),
]);

export const insertCampaignOptimizationInsightSchema = createInsertSchema(campaignOptimizationInsights).omit({
  id: true,
  timesActedUpon: true,
  averageImpactWhenActedUpon: true,
  createdAt: true,
  updatedAt: true,
});

export type CampaignOptimizationInsight = typeof campaignOptimizationInsights.$inferSelect;
export type InsertCampaignOptimizationInsight = z.infer<typeof insertCampaignOptimizationInsightSchema>;

// Automation Relations
export const automationConfigurationsRelations = relations(automationConfigurations, ({ one, many }) => ({
  salon: one(salons, {
    fields: [automationConfigurations.salonId],
    references: [salons.id],
  }),
  variantRules: many(variantGenerationRules),
  monitoringSettings: many(performanceMonitoringSettings),
  actionLogs: many(automatedActionLogs),
}));

export const variantGenerationRulesRelations = relations(variantGenerationRules, ({ one }) => ({
  salon: one(salons, {
    fields: [variantGenerationRules.salonId],
    references: [salons.id],
  }),
  configuration: one(automationConfigurations, {
    fields: [variantGenerationRules.configurationId],
    references: [automationConfigurations.id],
  }),
}));

export const performanceMonitoringSettingsRelations = relations(performanceMonitoringSettings, ({ one }) => ({
  salon: one(salons, {
    fields: [performanceMonitoringSettings.salonId],
    references: [salons.id],
  }),
  configuration: one(automationConfigurations, {
    fields: [performanceMonitoringSettings.configurationId],
    references: [automationConfigurations.id],
  }),
}));

export const optimizationRecommendationsRelations = relations(optimizationRecommendations, ({ one }) => ({
  salon: one(salons, {
    fields: [optimizationRecommendations.salonId],
    references: [salons.id],
  }),
  campaign: one(communicationCampaigns, {
    fields: [optimizationRecommendations.campaignId],
    references: [communicationCampaigns.id],
  }),
  testCampaign: one(abTestCampaigns, {
    fields: [optimizationRecommendations.testCampaignId],
    references: [abTestCampaigns.id],
  }),
  implementedBy: one(users, {
    fields: [optimizationRecommendations.implementedBy],
    references: [users.id],
  }),
}));

export const automatedActionLogsRelations = relations(automatedActionLogs, ({ one }) => ({
  salon: one(salons, {
    fields: [automatedActionLogs.salonId],
    references: [salons.id],
  }),
  configuration: one(automationConfigurations, {
    fields: [automatedActionLogs.configurationId],
    references: [automationConfigurations.id],
  }),
  campaign: one(communicationCampaigns, {
    fields: [automatedActionLogs.campaignId],
    references: [communicationCampaigns.id],
  }),
  testCampaign: one(abTestCampaigns, {
    fields: [automatedActionLogs.testCampaignId],
    references: [abTestCampaigns.id],
  }),
  recommendation: one(optimizationRecommendations, {
    fields: [automatedActionLogs.recommendationId],
    references: [optimizationRecommendations.id],
  }),
}));

export const campaignOptimizationInsightsRelations = relations(campaignOptimizationInsights, ({ one }) => ({
  salon: one(salons, {
    fields: [campaignOptimizationInsights.salonId],
    references: [salons.id],
  }),
  supersededBy: one(campaignOptimizationInsights, {
    fields: [campaignOptimizationInsights.supersededBy],
    references: [campaignOptimizationInsights.id],
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
  parentCategoryId: varchar("parent_category_id"), // Self-reference will be added after table definition
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
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
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
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
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

// Proximity search validation schemas
export const salonSearchSchema = z.object({
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90 degrees"),
  lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180 degrees"),
  radiusKm: z.number().min(0.1).max(50, "Radius must be between 0.1 and 50 kilometers").default(1),
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(['distance', 'rating', 'name']).default('distance'),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(20),
  time: z.string().optional(),
  date: z.string().optional(),
});

export type SalonSearchParams = z.infer<typeof salonSearchSchema>;

export const salonSearchResultSchema = z.object({
  salons: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    latitude: z.string().nullable(),
    longitude: z.string().nullable(),
    phone: z.string(),
    email: z.string(),
    website: z.string().nullable(),
    category: z.string(),
    priceRange: z.string(),
    rating: z.string(),
    reviewCount: z.number(),
    imageUrl: z.string().nullable(),
    openTime: z.string().nullable(),
    closeTime: z.string().nullable(),
    distance_km: z.number(),
    createdAt: z.date().nullable(),
  })),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean(),
  }),
  searchParams: z.object({
    lat: z.number(),
    lng: z.number(),
    radiusKm: z.number(),
    category: z.string().optional(),
    q: z.string().optional(),
    sort: z.string(),
  }),
});

export type SalonSearchResult = z.infer<typeof salonSearchResultSchema>;

// Places API validation schemas
export const placesAutocompleteSchema = z.object({
  q: z.string().min(1, "Query must not be empty").max(200, "Query too long"),
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90 degrees").optional(),
  lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180 degrees").optional(),
  limit: z.number().min(1).max(20, "Limit must be between 1 and 20").default(10).optional(),
  countrycode: z.string().length(2, "Country code must be 2 characters").optional(),
});

export const placesDetailsSchema = z.object({
  placeId: z.string().min(1, "Place ID is required").max(500, "Place ID too long"),
});

export const placesGeocodeSchema = z.union([
  // Forward geocoding: address -> coordinates
  z.object({
    address: z.string().min(1, "Address is required").max(500, "Address too long"),
    countrycode: z.string().length(2, "Country code must be 2 characters").optional(),
  }),
  // Reverse geocoding: coordinates -> address  
  z.object({
    lat: z.number().min(-90, "Latitude must be between -90 and 90 degrees").max(90, "Latitude must be between -90 and 90 degrees"),
    lng: z.number().min(-180, "Longitude must be between -180 and 180 degrees").max(180, "Longitude must be between -180 and 180 degrees"),
    countrycode: z.string().length(2, "Country code must be 2 characters").optional(),
  })
]);

export type PlacesAutocompleteParams = z.infer<typeof placesAutocompleteSchema>;
export type PlacesDetailsParams = z.infer<typeof placesDetailsSchema>;
export type PlacesGeocodeParams = z.infer<typeof placesGeocodeSchema>;

// Places API response schemas
export const placesAutocompleteResponseSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })),
  query: z.string(),
});

export const placesDetailsResponseSchema = z.object({
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  placeId: z.string().optional(),
  components: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postcode: z.string().optional(),
    street: z.string().optional(),
    housenumber: z.string().optional(),
  }),
});

export const placesGeocodeResponseSchema = z.object({
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  confidence: z.number(),
});

export type PlacesAutocompleteResponse = z.infer<typeof placesAutocompleteResponseSchema>;
export type PlacesDetailsResponse = z.infer<typeof placesDetailsResponseSchema>;
export type PlacesGeocodeResponse = z.infer<typeof placesGeocodeResponseSchema>;
