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

// Refresh tokens table for JWT authentication
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  deviceInfo: text("device_info"),
  ipAddress: varchar("ip_address", { length: 45 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
}, (table) => [
  index("refresh_tokens_user_id_idx").on(table.userId),
  index("refresh_tokens_expires_at_idx").on(table.expiresAt),
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(), // Optional - auto-generated from email
  password: text("password"), // Made optional for Replit Auth users
  email: varchar("email").unique(), // Made nullable for Replit Auth compatibility
  firstName: varchar("first_name"), // Replit Auth field
  lastName: varchar("last_name"), // Replit Auth field
  profileImageUrl: varchar("profile_image_url"), // Replit Auth field
  phone: text("phone"),
  workPreference: varchar("work_preference", { length: 20 }), // salon, home, both
  businessCategory: varchar("business_category", { length: 50 }), // unisex, beauty_parlour, mens_parlour
  businessName: varchar("business_name", { length: 255 }), // Business/Salon name
  panNumber: varchar("pan_number", { length: 10 }), // PAN number for tax
  gstNumber: varchar("gst_number", { length: 15 }), // GST number
  emailVerified: integer("email_verified").notNull().default(0),
  emailVerificationToken: varchar("email_verification_token"), // Email verification token
  emailVerificationExpiry: timestamp("email_verification_expiry"), // Email verification token expiry
  emailVerificationSentAt: timestamp("email_verification_sent_at"), // When verification email was last sent
  phoneVerified: integer("phone_verified").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  passwordResetToken: varchar("password_reset_token"), // Password reset token
  passwordResetExpiry: timestamp("password_reset_expiry"), // Password reset token expiry
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(), // Replit Auth field
});

export const insertUserSchema = createInsertSchema(users).pick({
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  workPreference: true,
  businessCategory: true,
  businessName: true,
  panNumber: true,
  gstNumber: true,
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

// Platform configuration - super admin settings
export const platformConfig = pgTable("platform_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: varchar("config_key", { length: 100 }).notNull().unique(), // commission_rate, booking_rules, etc
  configValue: jsonb("config_value").notNull(), // Flexible JSON storage for any config
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlatformConfigSchema = createInsertSchema(platformConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlatformConfig = z.infer<typeof insertPlatformConfigSchema>;
export type PlatformConfig = typeof platformConfig.$inferSelect;

// Platform commissions - track earnings per booking
export const platformCommissions = pgTable("platform_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  bookingAmountPaisa: integer("booking_amount_paisa").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // e.g., 15.00 for 15%
  commissionAmountPaisa: integer("commission_amount_paisa").notNull(),
  salonEarningsPaisa: integer("salon_earnings_paisa").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, paid, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlatformCommissionSchema = createInsertSchema(platformCommissions).omit({
  id: true,
  createdAt: true,
});

export type InsertPlatformCommission = z.infer<typeof insertPlatformCommissionSchema>;
export type PlatformCommission = typeof platformCommissions.$inferSelect;

// Platform payouts - manual payout approvals to salons
export const platformPayouts = pgTable("platform_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  amountPaisa: integer("amount_paisa").notNull(), // Total payout amount
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, approved, rejected, paid
  paymentMethod: varchar("payment_method", { length: 50 }), // bank_transfer, upi, etc
  paymentDetails: jsonb("payment_details"), // Account details, UPI ID, etc
  approvedBy: varchar("approved_by").references(() => users.id), // Super admin who approved
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlatformPayoutSchema = createInsertSchema(platformPayouts).omit({
  id: true,
  createdAt: true,
});

export type InsertPlatformPayout = z.infer<typeof insertPlatformPayoutSchema>;
export type PlatformPayout = typeof platformPayouts.$inferSelect;

// Salons table - business profiles linked to organizations
export const salons = pgTable("salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  shopNumber: text("shop_number"), // Shop/unit/suite number (e.g., "Shop 12", "Suite 3B")
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
  venueType: varchar("venue_type", { length: 20 }).default('everyone'), // everyone, female-only, male-only
  instantBooking: integer("instant_booking").notNull().default(0), // 1 if salon supports instant booking, 0 otherwise
  offerDeals: integer("offer_deals").notNull().default(0), // 1 if salon offers deals/promotions, 0 otherwise
  acceptGroup: integer("accept_group").notNull().default(0), // 1 if salon accepts group bookings, 0 otherwise
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0.00'),
  reviewCount: integer("review_count").notNull().default(0),
  googlePlaceId: text("google_place_id"), // Google Places API Place ID for syncing
  googleRating: decimal("google_rating", { precision: 3, scale: 2 }), // Rating from Google (0.00-5.00)
  googleReviewCount: integer("google_review_count").default(0), // Total review count on Google
  googleRatingSyncedAt: timestamp("google_rating_synced_at"), // Last time Google rating was synced
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array(), // Array of image URLs for carousel
  openTime: text("open_time"), // e.g., "9:00 AM" (legacy - kept for backward compatibility)
  closeTime: text("close_time"), // e.g., "8:00 PM" (legacy - kept for backward compatibility)
  businessHours: jsonb("business_hours"), // Structured day-by-day hours: { monday: { open: true, start: "09:00", end: "17:00" }, ... }
  isActive: integer("is_active").notNull().default(1),
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id), // Super admin who approved
  rejectionReason: text("rejection_reason"), // Reason for rejection if status is rejected
  setupProgress: jsonb("setup_progress"), // Tracks completion of 8 setup steps: businessInfo, locationContact, services, staff, resources, bookingSettings, paymentSetup, media
  ownerId: varchar("owner_id").references(() => users.id), // Keep for backward compatibility
  orgId: varchar("org_id").references(() => organizations.id, { onDelete: "set null" }), // New organization link
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Spatial index for geospatial queries (lat/lng proximity search)
  index("salons_lat_lng_idx").on(table.latitude, table.longitude),
  // Index for Google Place ID lookups
  index("salons_google_place_id_idx").on(table.googlePlaceId),
]);

export const insertSalonSchema = createInsertSchema(salons).omit({
  id: true,
  createdAt: true,
  rating: true,
  reviewCount: true,
});

export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type Salon = typeof salons.$inferSelect;

// Salon Reviews table - stores both Google-imported and SalonHub native reviews
export const salonReviews = pgTable("salon_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "set null" }), // Null for Google reviews
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }), // Null for Google reviews
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  source: varchar("source", { length: 20 }).notNull().default('salonhub'), // 'salonhub' or 'google'
  googleAuthorName: text("google_author_name"), // Author name from Google (for Google reviews)
  googleAuthorPhoto: text("google_author_photo"), // Author photo URL from Google
  googleReviewId: text("google_review_id"), // Unique Google review ID for deduplication
  isVerified: integer("is_verified").notNull().default(0), // 1 if review is from completed booking
  createdAt: timestamp("created_at").defaultNow(),
  googlePublishedAt: timestamp("google_published_at"), // Original publish date from Google
}, (table) => [
  // Index for fetching reviews by salon
  index("salon_reviews_salon_id_idx").on(table.salonId),
  // Index for filtering by source
  index("salon_reviews_source_idx").on(table.source),
  // Index for checking Google review duplicates
  index("salon_reviews_google_review_id_idx").on(table.googleReviewId),
  // Unique constraint to prevent duplicate Google reviews
  uniqueIndex("salon_reviews_google_unique").on(table.salonId, table.googleReviewId)
    .where(sql`${table.source} = 'google' AND ${table.googleReviewId} IS NOT NULL`),
  // Constraint to validate rating range
  check("salon_reviews_rating_check", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  // Constraint to validate source values
  check("salon_reviews_source_check", sql`${table.source} IN ('salonhub', 'google')`),
]);

export const insertSalonReviewSchema = createInsertSchema(salonReviews).omit({
  id: true,
  createdAt: true,
});

export type InsertSalonReview = z.infer<typeof insertSalonReviewSchema>;
export type SalonReview = typeof salonReviews.$inferSelect;

// Google Places Cache table - stores Google Places API results for 30 days
export const googlePlacesCache = pgTable("google_places_cache", {
  placeId: text("place_id").primaryKey(), // Google Place ID
  businessName: text("business_name").notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 9, scale: 6 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  payload: jsonb("payload").notNull(), // Full API response for place details
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 30 days from fetchedAt
}, (table) => [
  // Index for coordinate-based proximity search
  index("google_places_cache_lat_lng_idx").on(table.latitude, table.longitude),
  // Index for finding expired cache entries
  index("google_places_cache_expires_at_idx").on(table.expiresAt),
  // Index for business name search
  index("google_places_cache_business_name_idx").on(table.businessName),
]);

export const insertGooglePlacesCacheSchema = createInsertSchema(googlePlacesCache).omit({
  fetchedAt: true,
});

export type InsertGooglePlacesCache = z.infer<typeof insertGooglePlacesCacheSchema>;
export type GooglePlacesCache = typeof googlePlacesCache.$inferSelect;

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
  reviews: many(salonReviews),
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
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }), // Auto-delete services when salon is deleted
  category: varchar("category", { length: 50 }), // Hair Cut & Style, Hair Color, Makeup, etc
  subCategory: varchar("sub_category", { length: 100 }), // Male, Female, or specific sub-category
  imageUrl: text("image_url"), // Visual image for the service
  
  // Gender-based service differentiation (Billu Partner App style)
  gender: varchar("gender", { length: 10 }), // 'male', 'female', 'unisex'
  
  // Service approval workflow
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default('approved'), // 'approved', 'pending', 'rejected'
  
  // Custom service flag
  isCustomService: integer("is_custom_service").notNull().default(0), // 1 = salon created custom service, 0 = platform template
  
  // Flexible pricing structure
  priceType: varchar("price_type", { length: 20 }).notNull().default('fixed'), // 'fixed', 'variable', 'starting_from'
  productCostPaisa: integer("product_cost_paisa"), // Additional product cost if applicable
  specialPricePaisa: integer("special_price_paisa"), // Promotional/special pricing
  
  // Service combination/package support
  isComboService: integer("is_combo_service").notNull().default(0), // 1 if this is a combination service
  comboServiceIds: text("combo_service_ids").array(), // Array of service IDs if combo
  
  // Service template reference
  templateId: varchar("template_id"), // Reference to service template if created from template
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Composite unique constraint to enable composite foreign keys
  unique("services_id_salon_id_unique").on(table.id, table.salonId),
  // Index for gender-based filtering
  index("services_gender_idx").on(table.gender),
  // Index for category filtering
  index("services_category_idx").on(table.category),
  // Index for approval status
  index("services_approval_status_idx").on(table.approvalStatus),
]);

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Service Templates table - platform-wide service templates (Billu Partner App style)
export const serviceTemplates = pgTable("service_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // Hair Cut & Style, Hair Color, Makeup, etc
  subCategory: varchar("sub_category", { length: 100 }), // Male, Female, or specific sub-category
  gender: varchar("gender", { length: 10 }).notNull(), // 'male', 'female', 'unisex'
  
  // Suggested pricing and duration (salons can override)
  suggestedDurationMinutes: integer("suggested_duration_minutes").notNull(),
  suggestedPriceInPaisa: integer("suggested_price_in_paisa").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  
  // Template metadata
  isPopular: integer("is_popular").notNull().default(0), // 1 if this is a popular service
  sortOrder: integer("sort_order").notNull().default(0), // For display ordering
  imageUrl: text("image_url"), // Visual image for the template
  
  // Tags for better categorization
  tags: text("tags").array(), // e.g., ['beard', 'fade', 'modern'], ['bridal', 'party'], etc
  
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Index for category filtering
  index("service_templates_category_idx").on(table.category),
  // Index for gender filtering
  index("service_templates_gender_idx").on(table.gender),
  // Index for popular services
  index("service_templates_popular_idx").on(table.isPopular),
  // Unique constraint on name + category + gender to prevent duplicates
  unique("service_templates_name_category_gender_unique").on(table.name, table.category, table.gender),
]);

export const insertServiceTemplateSchema = createInsertSchema(serviceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServiceTemplate = z.infer<typeof insertServiceTemplateSchema>;
export type ServiceTemplate = typeof serviceTemplates.$inferSelect;

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
  roles: text("roles").array(), // Staff roles (Stylist, Colorist, Nail Technician, etc.) - supports multiple roles
  gender: varchar("gender", { length: 10 }), // Staff gender (Male/Female)
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
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }), // Auto-delete bookings when salon is deleted
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }), // Auto-delete bookings when service is deleted
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "set null" }),
  timeSlotId: varchar("time_slot_id").references(() => timeSlots.id, { onDelete: "restrict" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Link to authenticated user (null for guests)
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
  guestSessionId: text("guest_session_id"), // For tracking guest user sessions (null for authenticated users)
  // Offer-related fields (snapshot at booking time for audit trail)
  offerId: varchar("offer_id").references(() => platformOffers.id, { onDelete: "set null" }), // Applied offer (if any)
  offerTitle: text("offer_title"), // Snapshot of offer title at booking time
  offerDiscountType: varchar("offer_discount_type", { length: 20 }), // Snapshot: 'percentage' | 'fixed'
  offerDiscountValue: integer("offer_discount_value"), // Snapshot: percentage or paisa amount
  originalAmountPaisa: integer("original_amount_paisa"), // Original price before discount
  discountAmountPaisa: integer("discount_amount_paisa"), // Discount applied in paisa
  finalAmountPaisa: integer("final_amount_paisa"), // Final amount after discount
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint to enable composite FKs from booking_services
  unique("bookings_id_salon_id_unique").on(table.id, table.salonId),
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
  }).onDelete("cascade"), // Auto-delete when booking is deleted
  foreignKey({
    columns: [table.serviceId, table.salonId],
    foreignColumns: [services.id, services.salonId],
    name: "booking_services_service_salon_fk"
  }).onDelete("cascade"), // Auto-delete when service is deleted
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

// Payments table - tracks payment information for both service bookings and product orders
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Either bookingId (for service bookings) OR productOrderId (for product orders) must be set
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  productOrderId: varchar("product_order_id").references(() => productOrders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  paymentMethod: varchar("payment_method", { length: 50 }), // online, cod, upi, wallet
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
    paymentMethod: z.enum(['pay_now', 'pay_at_salon']).default('pay_now'), // Payment method selection
    offerId: z.string().uuid().optional(), // Optional offer to apply
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
const bookingStatusEnum = z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']);

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
    confirmed: ['completed', 'cancelled', 'no_show'],
    completed: [], // Cannot transition from completed
    cancelled: [], // Cannot transition from cancelled
    no_show: []    // Cannot transition from no_show
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
  
  // E-commerce retail fields
  availableForRetail: integer("available_for_retail").notNull().default(0), // Enable retail sales for this product
  retailPriceInPaisa: integer("retail_price_in_paisa"), // Customer-facing price (separate from cost_price_in_paisa)
  
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
  index("products_retail_idx").on(table.salonId, table.availableForRetail, table.isActive), // E-commerce: Efficient retail product filtering
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
  sort: z.enum(['distance', 'rating', 'name', 'recommended', 'top-rated', 'nearest']).default('distance'),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(20),
  time: z.string().optional(),
  date: z.string().optional(),
  maxPrice: z.number().optional(),
  venueType: z.string().optional(),
  availableToday: z.boolean().optional(),
  instantBooking: z.boolean().optional(),
  offerDeals: z.boolean().optional(),
  acceptGroup: z.boolean().optional(),
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

// Platform Offers/Promotions - Managed by Super Admin & Salon Owners
export const platformOffers = pgTable("platform_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }), // null for platform-wide offers
  ownedBySalonId: varchar("owned_by_salon_id").references(() => salons.id, { onDelete: "cascade" }), // Track salon ownership (null = super admin created)
  title: text("title").notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' | 'fixed'
  discountValue: integer("discount_value").notNull(), // percentage (1-100) or paisa amount
  minimumPurchase: integer("minimum_purchase"), // minimum purchase in paisa
  maxDiscount: integer("max_discount"), // maximum discount cap in paisa (for percentage discounts)
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: integer("is_active").notNull().default(1),
  isPlatformWide: integer("is_platform_wide").notNull().default(0), // 1 for all salons, 0 for specific salon
  usageLimit: integer("usage_limit"), // null for unlimited
  usageCount: integer("usage_count").notNull().default(0),
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  approvalNotes: text("approval_notes"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Approval workflow tracking (Migration: All existing offers default to manually approved state)
  autoApproved: integer("auto_approved").notNull().default(0), // 1 if auto-approved by system, 0 if manually created/approved by admin
  requiresApprovalOnEdit: integer("requires_approval_on_edit").notNull().default(0), // 1 if future edits need re-approval (set when auto-approve is disabled)
  lastEditedBy: varchar("last_edited_by").references(() => users.id),
  lastEditedAt: timestamp("last_edited_at"),
  imageUrl: text("image_url"), // Promotional image for the offer card
}, (table) => ({
  // Index for salon-scoped offer queries (performance optimization)
  ownedBySalonIdIdx: index("platform_offers_owned_by_salon_id_idx").on(table.ownedBySalonId),
}));

export const insertPlatformOfferSchema = createInsertSchema(platformOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  autoApproved: true,
  requiresApprovalOnEdit: true,
  lastEditedBy: true,
  lastEditedAt: true,
});

export const createOfferSchema = insertPlatformOfferSchema.extend({
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  isPlatformWide: z.number().int().min(0).max(1),
  isActive: z.number().int().min(0).max(1).default(1),
  imageUrl: z.string().url().optional(),
});

export const updateOfferSchema = createOfferSchema.partial().omit({
  createdBy: true,
});

export const approveRejectOfferSchema = z.object({
  reason: z.string().optional(),
});

export const toggleOfferStatusSchema = z.object({
  isActive: z.number().int().min(0).max(1),
});

// Salon owner offer creation schema - simplified (no platform-wide, no super admin fields)
export const salonOfferSchema = z.object({
  salonId: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive("Discount value must be positive"),
  minimumPurchase: z.number().int().nonnegative().optional(),
  maxDiscount: z.number().int().nonnegative().optional(),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.number().int().min(0).max(1).default(1),
  imageUrl: z.string().url().optional(),
});

// Platform settings schemas
export const platformSettingsSchema = z.object({
  autoApproveSalonOffers: z.boolean(),
  commissionRate: z.number().min(0).max(100).optional(),
});

export type InsertPlatformOffer = z.infer<typeof insertPlatformOfferSchema>;
export type PlatformOffer = typeof platformOffers.$inferSelect;
export type SalonOfferInput = z.infer<typeof salonOfferSchema>;
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

// Digital Wallet for Customers
export const userWallets = pgTable("user_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  balanceInPaisa: integer("balance_in_paisa").notNull().default(0),
  lifetimeEarnedInPaisa: integer("lifetime_earned_in_paisa").notNull().default(0),
  lifetimeSpentInPaisa: integer("lifetime_spent_in_paisa").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet Transaction History
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => userWallets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'credit' | 'debit'
  amountInPaisa: integer("amount_in_paisa").notNull(),
  reason: text("reason").notNull(), // 'signup_bonus' | 'cashback' | 'booking_payment' | 'referral_reward' etc
  bookingId: varchar("booking_id"),
  offerId: varchar("offer_id").references(() => platformOffers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Offer Usage Tracking (for "First 3 Bookings" type offers)
export const userOfferUsage = pgTable("user_offer_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offerId: varchar("offer_id").notNull().references(() => platformOffers.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").notNull(),
  discountAppliedInPaisa: integer("discount_applied_in_paisa").notNull(),
  usageNumber: integer("usage_number").notNull(), // 1st, 2nd, 3rd booking etc
  createdAt: timestamp("created_at").defaultNow(),
});

// Special Launch Offers Configuration
export const launchOffers = pgTable("launch_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerType: varchar("offer_type", { length: 50 }).notNull(), // 'first_booking' | 'signup_bonus' | 'referral'
  title: text("title").notNull(),
  description: text("description"),
  instantDiscountPercent: integer("instant_discount_percent"), // e.g., 15%
  walletCashbackPercent: integer("wallet_cashback_percent"), // e.g., 10%
  walletBonusInPaisa: integer("wallet_bonus_in_paisa"), // Fixed amount bonus
  maxUsagePerUser: integer("max_usage_per_user"), // e.g., 3 for "first 3 bookings"
  minimumPurchaseInPaisa: integer("minimum_purchase_in_paisa"),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserWalletSchema = createInsertSchema(userWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserOfferUsageSchema = createInsertSchema(userOfferUsage).omit({
  id: true,
  createdAt: true,
});

export const insertLaunchOfferSchema = createInsertSchema(launchOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserWallet = typeof userWallets.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type UserOfferUsage = typeof userOfferUsage.$inferSelect;
export type LaunchOffer = typeof launchOffers.$inferSelect;

// Password Reset OTP for Phone Numbers
export const passwordResetOtps = pgTable("password_reset_otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: integer("verified").notNull().default(0), // 0 = not verified, 1 = verified
  attempts: integer("attempts").notNull().default(0), // Track OTP verification attempts
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetOtpSchema = createInsertSchema(passwordResetOtps).omit({
  id: true,
  createdAt: true,
});

export type PasswordResetOtp = typeof passwordResetOtps.$inferSelect;

// ===============================================
// GEOCODING CACHE SYSTEM - Production-Grade Location Accuracy
// ===============================================

// Canonical geocoding locations - stores ONE authoritative record per place_id
// This prevents duplicate coordinates for same location with different search keywords
export const geocodeLocations = pgTable("geocode_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  placeId: varchar("place_id", { length: 255 }).unique(), // Google Place ID - unique identifier
  formattedAddress: text("formatted_address").notNull(), // Official address from Google
  normalizedHash: varchar("normalized_hash", { length: 64 }), // MD5 hash for deduplication
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(), // 10.8 decimals = 1.1mm precision
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(), // 11.8 decimals = 1.1mm precision
  viewport: jsonb("viewport"), // Bounding box for map display
  locationType: varchar("location_type", { length: 30 }), // ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE
  confidence: varchar("confidence", { length: 20 }).notNull().default('medium'), // high, medium, low
  source: varchar("source", { length: 50 }).notNull().default('google_places'), // google_places, geoapify, nominatim, hardcoded
  rawResponse: jsonb("raw_response"), // Full API response for debugging
  verifiedAt: timestamp("verified_at").defaultNow(), // Last validation timestamp
  expiresAt: timestamp("expires_at").notNull(), // TTL for cache - 60-90 days
  needsReview: integer("needs_review").notNull().default(0), // Flag for manual verification
  usageCount: integer("usage_count").notNull().default(0), // Track how often this location is used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("geocode_locations_place_id_idx").on(table.placeId),
  index("geocode_locations_hash_idx").on(table.normalizedHash),
  index("geocode_locations_expires_idx").on(table.expiresAt),
  index("geocode_locations_coords_idx").on(table.latitude, table.longitude),
]);

// Location aliases - maps search keyword variations to canonical place_id
// Handles: "DLF Mall" vs "DLF Mall of India" vs "DLF Mall Noida" → same place_id
export const locationAliases = pgTable("location_aliases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  normalizedQuery: varchar("normalized_query", { length: 255 }).notNull(), // "dlf mall of india noida" (lowercase, trimmed)
  originalQuery: varchar("original_query", { length: 255 }).notNull(), // "DLF Mall of India, Noida" (as user typed)
  placeId: varchar("place_id", { length: 255 }).notNull(), // Foreign key to geocode_locations
  matchType: varchar("match_type", { length: 20 }).notNull().default('exact'), // exact, partial, alias
  usageCount: integer("usage_count").notNull().default(0), // Track popular search terms
  locale: varchar("locale", { length: 10 }).default('en'), // Language/region code
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("location_aliases_normalized_idx").on(table.normalizedQuery),
  index("location_aliases_place_id_idx").on(table.placeId),
  uniqueIndex("location_aliases_query_unique").on(table.normalizedQuery, table.placeId),
]);

// Schemas for geocoding cache
export const insertGeocodeLocationSchema = createInsertSchema(geocodeLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationAliasSchema = createInsertSchema(locationAliases).omit({
  id: true,
  createdAt: true,
});

export type GeocodeLocation = typeof geocodeLocations.$inferSelect;
export type LocationAlias = typeof locationAliases.$inferSelect;
export type InsertGeocodeLocation = z.infer<typeof insertGeocodeLocationSchema>;
export type InsertLocationAlias = z.infer<typeof insertLocationAliasSchema>;

// ===============================================
// AI PERSONAL LOOK ADVISOR - Premium Feature
// ===============================================

// Beauty Products Database - Curated catalog of 60+ premium beauty products
export const beautyProducts = pgTable("beauty_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brand: text("brand").notNull(),
  productLine: text("product_line"),
  name: text("name").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // foundation, lipstick, eyeshadow, etc
  shade: text("shade"),
  sku: text("sku").notNull(),
  finishType: text("finish_type"), // matte, satin, shimmer, etc
  skinToneCompatibility: text("skin_tone_compatibility"), // fair, medium, deep, etc
  price: integer("price").notNull(), // Price in paisa
  imageUrl: text("image_url"),
  description: text("description"),
  gender: varchar("gender", { length: 20 }).default('unisex'), // male, female, unisex
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique("beauty_products_sku_unique").on(table.sku),
]);

// AR Effect Presets - DeepAR effect configurations for virtual try-on
export const effectPresets = pgTable("effect_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // Canonical slug matching Gemini categories
  name: text("name").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // makeup, hair, beard
  deeparEffectFile: text("deepar_effect_file"),
  lookTags: text("look_tags"), // glamorous, natural, bold, etc
  associatedProducts: text("associated_products"), // Product IDs as JSON array
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

// Salon Inventory - Tracks which products are available at each salon
export const salonInventory = pgTable("salon_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id),
  productId: varchar("product_id").notNull().references(() => beautyProducts.id),
  quantity: integer("quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  lastRestockedAt: timestamp("last_restocked_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique("salon_inventory_salon_product_unique").on(table.salonId, table.productId),
]);

// AI Look Sessions - Customer consultation history with AI recommendations
export const aiLookSessions = pgTable("ai_look_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id),
  customerName: text("customer_name").notNull(),
  customerPhotoUrl: text("customer_photo_url"),
  gender: varchar("gender", { length: 20 }), // male, female, prefer_not_to_say
  eventType: varchar("event_type", { length: 50 }), // wedding, party, casual, etc
  weather: varchar("weather", { length: 50 }),
  location: varchar("location", { length: 50 }),
  skinTone: varchar("skin_tone", { length: 50 }),
  hairType: varchar("hair_type", { length: 50 }),
  staffUserId: varchar("staff_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

// AI Look Options - Different look variations generated for each session
export const aiLookOptions = pgTable("ai_look_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => aiLookSessions.id),
  lookName: text("look_name").notNull(),
  description: text("description"),
  presetIds: text("preset_ids"), // JSON array of preset IDs
  aiConfidenceScore: decimal("ai_confidence_score", { precision: 5, scale: 2 }),
  isSelected: integer("is_selected").notNull().default(0),
  previewImageUrl: text("preview_image_url"),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

// AI Look Products - Product recommendations for each look option
export const aiLookProducts = pgTable("ai_look_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lookOptionId: varchar("look_option_id").notNull().references(() => aiLookOptions.id),
  productId: varchar("product_id").notNull().references(() => beautyProducts.id),
  applicationArea: text("application_area"), // face, eyes, lips, etc
  applicationInstructions: text("application_instructions"),
  quantityNeeded: text("quantity_needed"), // "1 pump", "2 dots", etc
  isInStock: integer("is_in_stock").notNull().default(1),
  substituteProductId: varchar("substitute_product_id").references(() => beautyProducts.id),
  createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

// Schemas
export const insertBeautyProductSchema = createInsertSchema(beautyProducts).omit({
  id: true,
  createdAt: true,
});

export const insertEffectPresetSchema = createInsertSchema(effectPresets).omit({
  id: true,
  createdAt: true,
});

export const insertSalonInventorySchema = createInsertSchema(salonInventory).omit({
  id: true,
  createdAt: true,
});

export const insertAiLookSessionSchema = createInsertSchema(aiLookSessions).omit({
  id: true,
  createdAt: true,
});

export const insertAiLookOptionSchema = createInsertSchema(aiLookOptions).omit({
  id: true,
  createdAt: true,
});

export const insertAiLookProductSchema = createInsertSchema(aiLookProducts).omit({
  id: true,
  createdAt: true,
});

export type BeautyProduct = typeof beautyProducts.$inferSelect;
export type EffectPreset = typeof effectPresets.$inferSelect;
export type SalonInventory = typeof salonInventory.$inferSelect;
export type AiLookSession = typeof aiLookSessions.$inferSelect;
export type AiLookOption = typeof aiLookOptions.$inferSelect;
export type AiLookProduct = typeof aiLookProducts.$inferSelect;

// ===== PRODUCT E-COMMERCE SYSTEM =====
// Tables for customer-facing product sales, shopping cart, orders, reviews

// Product Retail Configuration - retail-specific settings per product
export const productRetailConfig = pgTable("product_retail_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  // Retail settings
  availableForRetail: integer("available_for_retail").notNull().default(0),
  retailPriceInPaisa: integer("retail_price_in_paisa"), // Overrides products.retailPriceInPaisa if set
  
  // Display settings
  featured: integer("featured").default(0),
  displayOrder: integer("display_order").default(0),
  
  // Stock allocation (separate from main inventory)
  retailStockAllocated: decimal("retail_stock_allocated", { precision: 10, scale: 3 }).default('0'),
  useAllocatedStock: integer("use_allocated_stock").notNull().default(1), // Hybrid model: 1=use allocated stock, 0=use warehouse stock
  lowStockThreshold: decimal("low_stock_threshold", { precision: 10, scale: 3 }).default('5'), // Alert when retail stock falls below this
  
  // Images & Media
  retailImages: text("retail_images").array(), // Retail-specific images
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("product_retail_config_salon_id_idx").on(table.salonId, table.availableForRetail),
  index("product_retail_config_featured_idx").on(table.salonId, table.featured).where(sql`${table.featured} = 1`),
  index("product_retail_config_product_id_idx").on(table.productId),
  unique("retail_config_unique").on(table.salonId, table.productId),
]);

export const insertProductRetailConfigSchema = createInsertSchema(productRetailConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProductRetailConfig = typeof productRetailConfig.$inferSelect;
export type InsertProductRetailConfig = z.infer<typeof insertProductRetailConfigSchema>;

// Product Variants - size, color, scent variations of products
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Variant details
  variantType: varchar("variant_type", { length: 50 }).notNull(), // size, color, scent, etc.
  variantValue: varchar("variant_value", { length: 100 }).notNull(), // 100ml, Red, Lavender, etc.
  skuSuffix: varchar("sku_suffix", { length: 20 }), // -100ML, -RED
  
  // Pricing override (if different from base product)
  priceAdjustmentPaisa: integer("price_adjustment_paisa").default(0), // +/- from base price
  
  // Stock
  stockQuantity: integer("stock_quantity").notNull().default(0),
  
  // Display
  displayOrder: integer("display_order").default(0),
  colorHex: varchar("color_hex", { length: 7 }), // For color variants: #FF5733
  imageUrl: text("image_url"),
  
  // Availability
  isActive: integer("is_active").notNull().default(1),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("product_variants_product_id_idx").on(table.productId),
  index("product_variants_salon_id_idx").on(table.salonId),
  index("product_variants_active_idx").on(table.productId, table.isActive),
  unique("product_variants_salon_unique").on(table.salonId, table.productId, table.variantType, table.variantValue),
]);

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

// Shopping Carts - customer shopping carts
export const shoppingCarts = pgTable("shopping_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id"), // For guest users
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, abandoned, converted, expired
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '30 days'`),
}, (table) => [
  index("shopping_carts_user_id_idx").on(table.userId, table.status),
  index("shopping_carts_session_id_idx").on(table.sessionId, table.status),
  index("shopping_carts_expires_idx").on(table.expiresAt),
  check("shopping_carts_user_or_session", sql`${table.userId} IS NOT NULL OR ${table.sessionId} IS NOT NULL`),
]);

export const insertShoppingCartSchema = createInsertSchema(shoppingCarts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ShoppingCart = typeof shoppingCarts.$inferSelect;
export type InsertShoppingCart = z.infer<typeof insertShoppingCartSchema>;

// Cart Items - items within shopping carts
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").notNull().references(() => shoppingCarts.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  
  // Pricing (locked at time of adding to cart)
  priceAtAddPaisa: integer("price_at_add_paisa").notNull(),
  currentPricePaisa: integer("current_price_paisa").notNull(), // Updated when cart is loaded
  
  // Quantity
  quantity: integer("quantity").notNull().default(1),
  
  // Timestamps
  addedAt: timestamp("added_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("cart_items_cart_id_idx").on(table.cartId),
  index("cart_items_product_id_idx").on(table.productId),
  unique("cart_items_unique").on(table.cartId, table.productId, table.variantId),
  check("cart_items_quantity_positive", sql`${table.quantity} > 0`),
]);

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  addedAt: true,
  updatedAt: true,
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Product Orders - customer product purchases (separate from service bookings)
export const productOrders = pgTable("product_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  
  // Relationships
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "restrict" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  
  // Order details
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  // pending, confirmed, packed, shipped, delivered, cancelled, refunded
  
  // Fulfillment
  fulfillmentType: varchar("fulfillment_type", { length: 20 }).notNull(), // delivery, salon_pickup
  deliveryAddressId: varchar("delivery_address_id").references(() => userSavedLocations.id),
  deliveryAddress: text("delivery_address"), // Snapshot of address at order time
  pickupCode: varchar("pickup_code", { length: 10 }), // For salon pickup: 6-digit code
  
  // Pricing (all in paisa)
  subtotalPaisa: integer("subtotal_paisa").notNull(),
  discountPaisa: integer("discount_paisa").default(0),
  deliveryChargePaisa: integer("delivery_charge_paisa").default(0),
  taxPaisa: integer("tax_paisa").notNull(),
  totalPaisa: integer("total_paisa").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  
  // Payment
  paymentMethod: varchar("payment_method", { length: 50 }), // online, cod, wallet, pay_at_salon
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default('pending'), // pending, paid, failed, refunded
  paymentId: varchar("payment_id"), // Razorpay payment ID
  razorpayOrderId: varchar("razorpay_order_id"),
  walletAmountUsedPaisa: integer("wallet_amount_used_paisa").default(0),
  
  // Offers (offer system to be implemented separately)
  offerId: varchar("offer_id"),
  offerCode: varchar("offer_code", { length: 20 }),
  
  // Tracking
  trackingNumber: varchar("tracking_number", { length: 100 }),
  courierPartner: varchar("courier_partner", { length: 100 }),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  
  // Cancellation/Return
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: varchar("cancelled_by").references(() => users.id),
  
  // Platform commission
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default('10.00'),
  commissionPaisa: integer("commission_paisa"),
  
  // Notes
  customerNotes: text("customer_notes"),
  adminNotes: text("admin_notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  packedAt: timestamp("packed_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
}, (table) => [
  index("product_orders_salon_id_idx").on(table.salonId, table.status),
  index("product_orders_customer_id_idx").on(table.customerId, table.status),
  index("product_orders_status_idx").on(table.status, table.createdAt),
  index("product_orders_number_idx").on(table.orderNumber),
  check("product_orders_total_check", sql`${table.totalPaisa} = ${table.subtotalPaisa} - ${table.discountPaisa} + ${table.deliveryChargePaisa} + ${table.taxPaisa}`),
]);

export const insertProductOrderSchema = createInsertSchema(productOrders).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
  packedAt: true,
  shippedAt: true,
  deliveredAt: true,
});

export type ProductOrder = typeof productOrders.$inferSelect;
export type InsertProductOrder = z.infer<typeof insertProductOrderSchema>;

// Product Order Items - items within product orders
export const productOrderItems = pgTable("product_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => productOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  
  // Snapshot at time of order (in case product is deleted/updated)
  productName: varchar("product_name", { length: 255 }).notNull(),
  productSku: varchar("product_sku", { length: 100 }),
  variantInfo: jsonb("variant_info"), // {type: "size", value: "100ml"}
  productImageUrl: text("product_image_url"),
  
  // Pricing
  unitPricePaisa: integer("unit_price_paisa").notNull(),
  quantity: integer("quantity").notNull(),
  discountPerItemPaisa: integer("discount_per_item_paisa").default(0),
  subtotalPaisa: integer("subtotal_paisa").notNull(),
  
  // Review
  reviewSubmitted: integer("review_submitted").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("product_order_items_order_id_idx").on(table.orderId),
  index("product_order_items_product_id_idx").on(table.productId),
  check("product_order_items_quantity_positive", sql`${table.quantity} > 0`),
]);

export const insertProductOrderItemSchema = createInsertSchema(productOrderItems).omit({
  id: true,
  createdAt: true,
});

export type ProductOrderItem = typeof productOrderItems.$inferSelect;
export type InsertProductOrderItem = z.infer<typeof insertProductOrderItemSchema>;

// Wishlists - customer saved products
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  
  // Price tracking
  priceAtAddPaisa: integer("price_at_add_paisa").notNull(),
  
  // Notifications
  notifyOnPriceDrop: integer("notify_on_price_drop").notNull().default(1),
  notifyOnBackInStock: integer("notify_on_back_in_stock").notNull().default(1),
  
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  index("wishlists_user_id_idx").on(table.userId, table.addedAt),
  index("wishlists_product_id_idx").on(table.productId),
  unique("wishlists_unique").on(table.userId, table.productId, table.variantId),
]);

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  addedAt: true,
});

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

// Product Reviews - customer reviews of purchased products
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").notNull().references(() => productOrders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Review content
  rating: integer("rating").notNull(), // 1-5
  title: varchar("title", { length: 200 }),
  comment: text("comment"),
  
  // Media
  imageUrls: text("image_urls").array(), // Array of review images
  
  // Verification
  verifiedPurchase: integer("verified_purchase").notNull().default(1),
  
  // Moderation
  isVisible: integer("is_visible").notNull().default(1),
  moderationStatus: varchar("moderation_status", { length: 20 }).notNull().default('approved'), // pending, approved, rejected
  moderationReason: text("moderation_reason"),
  
  // Salon response
  salonResponse: text("salon_response"),
  salonRespondedAt: timestamp("salon_responded_at"),
  
  // Helpfulness
  helpfulCount: integer("helpful_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("product_reviews_product_id_idx").on(table.productId, table.isVisible, table.createdAt),
  index("product_reviews_user_id_idx").on(table.userId),
  index("product_reviews_salon_id_idx").on(table.salonId, table.moderationStatus),
  index("product_reviews_rating_idx").on(table.productId, table.rating),
  unique("product_reviews_unique").on(table.orderId, table.productId, table.userId),
  check("product_reviews_rating_range", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
]);

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;

// Delivery Settings - salon-specific delivery configuration
export const deliverySettings = pgTable("delivery_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().unique().references(() => salons.id, { onDelete: "cascade" }),
  
  // Delivery options
  enableHomeDelivery: integer("enable_home_delivery").notNull().default(0),
  enableSalonPickup: integer("enable_salon_pickup").notNull().default(1),
  
  // Delivery charges
  deliveryChargePaisa: integer("delivery_charge_paisa").default(5000), // ₹50
  freeDeliveryAbovePaisa: integer("free_delivery_above_paisa").default(50000), // ₹500
  
  // Delivery area
  deliveryRadiusKm: integer("delivery_radius_km").default(10),
  serviceablePincodes: text("serviceable_pincodes").array(), // Array of pincodes
  
  // Timing
  estimatedDeliveryDays: integer("estimated_delivery_days").default(3),
  pickupReadyHours: integer("pickup_ready_hours").default(24),
  
  // Return policy
  acceptReturns: integer("accept_returns").notNull().default(1),
  returnWindowDays: integer("return_window_days").default(7),
  returnConditions: text("return_conditions"),
  
  // Packaging
  packagingChargePaisa: integer("packaging_charge_paisa").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("delivery_settings_salon_id_idx").on(table.salonId),
]);

export const insertDeliverySettingsSchema = createInsertSchema(deliverySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DeliverySettings = typeof deliverySettings.$inferSelect;
export type InsertDeliverySettings = z.infer<typeof insertDeliverySettingsSchema>;

// Product Views - analytics tracking for product page views
export const productViews = pgTable("product_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id"), // For anonymous users
  viewedAt: timestamp("viewed_at").defaultNow(),
}, (table) => [
  index("product_views_product_id_idx").on(table.productId, table.viewedAt),
  index("product_views_user_id_idx").on(table.userId),
  index("product_views_salon_id_idx").on(table.salonId, table.viewedAt),
]);

export const insertProductViewSchema = createInsertSchema(productViews).omit({
  id: true,
  viewedAt: true,
});

export type ProductView = typeof productViews.$inferSelect;
export type InsertProductView = z.infer<typeof insertProductViewSchema>;

// ===============================================
// E-COMMERCE API REQUEST VALIDATION SCHEMAS
// ===============================================

// Shopping Cart Schemas
export const addToCartSchema = z.object({
  salonId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(100),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(100),
});

// Product Order Schemas
export const createProductOrderSchema = z.object({
  salonId: z.string().uuid().optional(), // Optional - will be derived from cart items
  cartId: z.string().optional(), // Optional - supports virtual "combined" cart
  addressId: z.string().uuid().optional(), // For existing saved addresses
  fulfillmentType: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.union([z.string(), z.object({
    fullName: z.string(),
    phone: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
  })]).optional(),
  paymentMethod: z.enum(['cod', 'online', 'upi', 'razorpay', 'pay_at_salon']).default('cod'),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
});

// Wishlist Schemas
export const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
});

// Review Schemas
export const createReviewSchema = z.object({
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  reviewText: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

export const trackProductViewSchema = z.object({
  sessionId: z.string().max(100).optional(),
});
export type TrackProductViewInput = z.infer<typeof trackProductViewSchema>;

// ========================================================================
// BUSINESS ADMIN - E-COMMERCE VALIDATION SCHEMAS
// ========================================================================

// Admin - Configure product for retail
export const configureRetailSchema = z.object({
  availableForRetail: z.boolean(),
  retailPriceInPaisa: z.number().int().positive().optional(),
  retailStockAllocated: z.number().int().min(0).optional(),
  retailDescription: z.string().optional(),
  retailImageUrls: z.array(z.string().url()).optional(),
  featured: z.boolean().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  searchKeywords: z.array(z.string()).optional(),
});
export type ConfigureRetailInput = z.infer<typeof configureRetailSchema>;

// Admin - Update order status
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']),
  trackingNumber: z.string().max(100).optional(),
  courierPartner: z.string().max(100).optional(),
  estimatedDeliveryDate: z.string().optional(), // ISO date string
  notes: z.string().optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// Admin - Cancel order
export const cancelOrderAdminSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
  refundAmountPaisa: z.number().int().positive().optional(),
});
export type CancelOrderAdminInput = z.infer<typeof cancelOrderAdminSchema>;

// Admin - Update delivery settings
export const updateDeliverySettingsSchema = z.object({
  salonPickupEnabled: z.number().int().min(0).max(1).optional(),
  homeDeliveryEnabled: z.number().int().min(0).max(1).optional(),
  freeDeliveryThresholdPaisa: z.number().int().min(0).optional(),
  baseDeliveryChargePaisa: z.number().int().min(0).optional(),
  maxDeliveryRadiusKm: z.number().min(0).optional(),
  estimatedPickupMinutes: z.number().int().min(0).optional(),
  estimatedDeliveryMinutes: z.number().int().min(0).optional(),
  deliveryInstructions: z.string().optional(),
});
export type UpdateDeliverySettingsInput = z.infer<typeof updateDeliverySettingsSchema>;

// ========================================================================
// EVENT MANAGEMENT SYSTEM TABLES
// ========================================================================

// Event Types/Categories (Workshop, Masterclass, Product Launch, etc.)
export const eventTypes = pgTable("event_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  isActive: integer("is_active").notNull().default(1),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventTypeSchema = createInsertSchema(eventTypes).omit({
  id: true,
  createdAt: true,
});
export type InsertEventType = z.infer<typeof insertEventTypeSchema>;
export type EventType = typeof eventTypes.$inferSelect;

// Events - Main Event Table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").references(() => organizations.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).unique(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  eventTypeId: varchar("event_type_id").references(() => eventTypes.id),
  
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }),
  startTime: varchar("start_time", { length: 8 }).notNull(),
  endTime: varchar("end_time", { length: 8 }).notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Kolkata"),
  durationMinutes: integer("duration_minutes"),
  
  venueType: varchar("venue_type", { length: 20 }).default("salon"),
  venueName: varchar("venue_name", { length: 200 }),
  venueAddress: text("venue_address"),
  venueCity: varchar("venue_city", { length: 100 }),
  venueState: varchar("venue_state", { length: 100 }),
  venuePincode: varchar("venue_pincode", { length: 10 }),
  venueLatitude: decimal("venue_latitude", { precision: 9, scale: 6 }),
  venueLongitude: decimal("venue_longitude", { precision: 9, scale: 6 }),
  venueInstructions: text("venue_instructions"),
  
  maxCapacity: integer("max_capacity").notNull().default(20),
  currentRegistrations: integer("current_registrations").default(0),
  minCapacity: integer("min_capacity").default(1),
  registrationStartDate: varchar("registration_start_date", { length: 10 }),
  registrationEndDate: varchar("registration_end_date", { length: 10 }),
  
  status: varchar("status", { length: 20 }).default("draft"),
  visibility: varchar("visibility", { length: 20 }).default("public"),
  isFeatured: integer("is_featured").default(0),
  
  coverImageUrl: text("cover_image_url"),
  galleryImages: jsonb("gallery_images").default(sql`'[]'::jsonb`),
  videoUrl: text("video_url"),
  
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 500 }),
  socialLinks: jsonb("social_links").default(sql`'{}'::jsonb`),
  
  cancellationPolicy: jsonb("cancellation_policy").default(sql`'{"7_plus_days": 100, "3_to_6_days": 75, "1_to_2_days": 50, "same_day": 0}'::jsonb`),
  termsConditions: text("terms_conditions"),
  
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("events_salon_id_idx").on(table.salonId),
  index("events_status_idx").on(table.status),
  index("events_start_date_idx").on(table.startDate),
]);

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  currentRegistrations: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event Speakers
export const eventSpeakers = pgTable("event_speakers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  credentials: text("credentials"),
  socialLinks: jsonb("social_links").default(sql`'{}'::jsonb`),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("event_speakers_event_id_idx").on(table.eventId),
]);

export const insertEventSpeakerSchema = createInsertSchema(eventSpeakers).omit({
  id: true,
  createdAt: true,
});
export type InsertEventSpeaker = z.infer<typeof insertEventSpeakerSchema>;
export type EventSpeaker = typeof eventSpeakers.$inferSelect;

// Event Schedules/Agenda
export const eventSchedules = pgTable("event_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  startTime: varchar("start_time", { length: 8 }).notNull(),
  endTime: varchar("end_time", { length: 8 }).notNull(),
  speakerId: varchar("speaker_id").references(() => eventSpeakers.id),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("event_schedules_event_id_idx").on(table.eventId),
]);

export const insertEventScheduleSchema = createInsertSchema(eventSchedules).omit({
  id: true,
  createdAt: true,
});
export type InsertEventSchedule = z.infer<typeof insertEventScheduleSchema>;
export type EventSchedule = typeof eventSchedules.$inferSelect;

// Ticket Types for Events
export const eventTicketTypes = pgTable("event_ticket_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  basePricePaisa: integer("base_price_paisa").notNull(),
  gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }).default("18.00"),
  quantityAvailable: integer("quantity_available"),
  quantitySold: integer("quantity_sold").default(0),
  saleStartDate: timestamp("sale_start_date"),
  saleEndDate: timestamp("sale_end_date"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  discountLabel: varchar("discount_label", { length: 50 }),
  includes: jsonb("includes").default(sql`'[]'::jsonb`),
  isActive: integer("is_active").default(1),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("event_ticket_types_event_id_idx").on(table.eventId),
]);

export const insertEventTicketTypeSchema = createInsertSchema(eventTicketTypes).omit({
  id: true,
  quantitySold: true,
  createdAt: true,
});
export type InsertEventTicketType = z.infer<typeof insertEventTicketTypeSchema>;
export type EventTicketType = typeof eventTicketTypes.$inferSelect;

// Group Discounts
export const eventGroupDiscounts = pgTable("event_group_discounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  minGroupSize: integer("min_group_size").notNull(),
  maxGroupSize: integer("max_group_size"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventGroupDiscountSchema = createInsertSchema(eventGroupDiscounts).omit({
  id: true,
  createdAt: true,
});
export type InsertEventGroupDiscount = z.infer<typeof insertEventGroupDiscountSchema>;
export type EventGroupDiscount = typeof eventGroupDiscounts.$inferSelect;

// Promo Codes
export const eventPromoCodes = pgTable("event_promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  minOrderAmountPaisa: integer("min_order_amount_paisa"),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventPromoCodeSchema = createInsertSchema(eventPromoCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
});
export type InsertEventPromoCode = z.infer<typeof insertEventPromoCodeSchema>;
export type EventPromoCode = typeof eventPromoCodes.$inferSelect;

// Event Registrations
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").references(() => users.id),
  ticketTypeId: varchar("ticket_type_id").notNull().references(() => eventTicketTypes.id),
  bookingId: varchar("booking_id", { length: 20 }).notNull().unique(),
  
  attendeeName: varchar("attendee_name", { length: 200 }).notNull(),
  attendeeEmail: varchar("attendee_email", { length: 255 }).notNull(),
  attendeePhone: varchar("attendee_phone", { length: 20 }).notNull(),
  attendeeAgeGroup: varchar("attendee_age_group", { length: 20 }),
  
  experienceLevel: varchar("experience_level", { length: 20 }),
  dietaryPreference: varchar("dietary_preference", { length: 50 }),
  specialRequirements: text("special_requirements"),
  
  ticketPricePaisa: integer("ticket_price_paisa").notNull(),
  discountAmountPaisa: integer("discount_amount_paisa").default(0),
  promoCodeId: varchar("promo_code_id").references(() => eventPromoCodes.id),
  gstAmountPaisa: integer("gst_amount_paisa").notNull(),
  totalAmountPaisa: integer("total_amount_paisa").notNull(),
  
  status: varchar("status", { length: 20 }).default("pending"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  paymentOrderId: varchar("payment_order_id", { length: 100 }),
  paymentTransactionId: varchar("payment_transaction_id", { length: 100 }),
  
  qrCodeData: varchar("qr_code_data", { length: 255 }).unique(),
  checkedInAt: timestamp("checked_in_at"),
  checkedInBy: varchar("checked_in_by").references(() => users.id),
  
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  refundAmountPaisa: integer("refund_amount_paisa"),
  refundStatus: varchar("refund_status", { length: 20 }),
  refundProcessedAt: timestamp("refund_processed_at"),
  
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("event_registrations_event_id_idx").on(table.eventId),
  index("event_registrations_user_id_idx").on(table.userId),
  index("event_registrations_booking_id_idx").on(table.bookingId),
  index("event_registrations_status_idx").on(table.status),
  index("event_registrations_expires_at_idx").on(table.expiresAt),
]);

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  qrCodeData: true,
  checkedInAt: true,
  checkedInBy: true,
  cancelledAt: true,
  cancellationReason: true,
  refundAmountPaisa: true,
  refundStatus: true,
  refundProcessedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;

// Registration Payments
export const eventRegistrationPayments = pgTable("event_registration_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationId: varchar("registration_id").notNull().references(() => eventRegistrations.id),
  amountPaisa: integer("amount_paisa").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentProvider: varchar("payment_provider", { length: 50 }),
  providerOrderId: varchar("provider_order_id", { length: 100 }),
  providerPaymentId: varchar("provider_payment_id", { length: 100 }),
  providerSignature: varchar("provider_signature", { length: 255 }),
  status: varchar("status", { length: 20 }).default("pending"),
  paymentMetadata: jsonb("payment_metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("event_registration_payments_registration_id_idx").on(table.registrationId),
]);

export const insertEventRegistrationPaymentSchema = createInsertSchema(eventRegistrationPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEventRegistrationPayment = z.infer<typeof insertEventRegistrationPaymentSchema>;
export type EventRegistrationPayment = typeof eventRegistrationPayments.$inferSelect;

// Event Reviews
export const eventReviews = pgTable("event_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  registrationId: varchar("registration_id").notNull().references(() => eventRegistrations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  overallRating: integer("overall_rating").notNull(),
  instructorRating: integer("instructor_rating"),
  contentRating: integer("content_rating"),
  venueRating: integer("venue_rating"),
  valueRating: integer("value_rating"),
  organizationRating: integer("organization_rating"),
  
  likedAspects: jsonb("liked_aspects").default(sql`'[]'::jsonb`),
  reviewText: text("review_text"),
  reviewPhotos: jsonb("review_photos").default(sql`'[]'::jsonb`),
  
  status: varchar("status", { length: 20 }).default("pending"),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  
  isFeatured: integer("is_featured").default(0),
  helpfulCount: integer("helpful_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("event_reviews_event_id_idx").on(table.eventId),
  index("event_reviews_user_id_idx").on(table.userId),
]);

export const insertEventReviewSchema = createInsertSchema(eventReviews).omit({
  id: true,
  status: true,
  moderatedBy: true,
  moderatedAt: true,
  isFeatured: true,
  helpfulCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEventReview = z.infer<typeof insertEventReviewSchema>;
export type EventReview = typeof eventReviews.$inferSelect;

// Event Notifications
export const eventNotifications = pgTable("event_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: varchar("event_id").references(() => events.id),
  registrationId: varchar("registration_id").references(() => eventRegistrations.id),
  type: varchar("type", { length: 50 }).notNull(),
  category: varchar("category", { length: 30 }).notNull(),
  priority: varchar("priority", { length: 10 }).default("normal"),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url", { length: 500 }),
  isRead: integer("is_read").default(0),
  readAt: timestamp("read_at"),
  channels: jsonb("channels").default(sql`'["in_app"]'::jsonb`),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("event_notifications_user_id_idx").on(table.userId),
  index("event_notifications_event_id_idx").on(table.eventId),
]);

export const insertEventNotificationSchema = createInsertSchema(eventNotifications).omit({
  id: true,
  isRead: true,
  readAt: true,
  deliveredAt: true,
  createdAt: true,
});
export type InsertEventNotification = z.infer<typeof insertEventNotificationSchema>;
export type EventNotification = typeof eventNotifications.$inferSelect;

// Notification Preferences
export const eventNotificationPreferences = pgTable("event_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  emailNewRegistration: integer("email_new_registration").default(1),
  emailEventReminder: integer("email_event_reminder").default(1),
  emailLowAttendance: integer("email_low_attendance").default(1),
  emailCancellation: integer("email_cancellation").default(1),
  pushNewRegistration: integer("push_new_registration").default(1),
  pushEventReminder: integer("push_event_reminder").default(1),
  pushLowAttendance: integer("push_low_attendance").default(1),
  pushCancellation: integer("push_cancellation").default(1),
  smsEventReminder: integer("sms_event_reminder").default(0),
  smsCancellation: integer("sms_cancellation").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEventNotificationPreferencesSchema = createInsertSchema(eventNotificationPreferences).omit({
  id: true,
  updatedAt: true,
});
export type InsertEventNotificationPreferences = z.infer<typeof insertEventNotificationPreferencesSchema>;
export type EventNotificationPreferences = typeof eventNotificationPreferences.$inferSelect;

// Daily Event Analytics
export const eventAnalyticsDaily = pgTable("event_analytics_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  date: varchar("date", { length: 10 }).notNull(),
  totalRegistrations: integer("total_registrations").default(0),
  newRegistrations: integer("new_registrations").default(0),
  cancellations: integer("cancellations").default(0),
  totalRevenuePaisa: integer("total_revenue_paisa").default(0),
  refundsPaisa: integer("refunds_paisa").default(0),
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("event_analytics_daily_event_id_idx").on(table.eventId),
  uniqueIndex("event_analytics_daily_event_date_unique").on(table.eventId, table.date),
]);

export const insertEventAnalyticsDailySchema = createInsertSchema(eventAnalyticsDaily).omit({
  id: true,
  createdAt: true,
});
export type InsertEventAnalyticsDaily = z.infer<typeof insertEventAnalyticsDailySchema>;
export type EventAnalyticsDaily = typeof eventAnalyticsDaily.$inferSelect;

// Event Views Log
export const eventViews = pgTable("event_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 100 }),
  source: varchar("source", { length: 50 }),
  platform: varchar("platform", { length: 20 }),
  referrer: text("referrer"),
  deviceType: varchar("device_type", { length: 20 }),
  browser: varchar("browser", { length: 50 }),
  os: varchar("os", { length: 50 }),
  viewedAt: timestamp("viewed_at").defaultNow(),
}, (table) => [
  index("event_views_event_id_idx").on(table.eventId),
  index("event_views_viewed_at_idx").on(table.viewedAt),
]);

export const insertEventViewSchema = createInsertSchema(eventViews).omit({
  id: true,
  viewedAt: true,
});
export type InsertEventView = z.infer<typeof insertEventViewSchema>;
export type EventView = typeof eventViews.$inferSelect;

// ========================================================================
// EVENT MANAGEMENT RELATIONS
// ========================================================================

export const eventTypesRelations = relations(eventTypes, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  salon: one(salons, {
    fields: [events.salonId],
    references: [salons.id],
  }),
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  eventType: one(eventTypes, {
    fields: [events.eventTypeId],
    references: [eventTypes.id],
  }),
  speakers: many(eventSpeakers),
  schedules: many(eventSchedules),
  ticketTypes: many(eventTicketTypes),
  groupDiscounts: many(eventGroupDiscounts),
  registrations: many(eventRegistrations),
  reviews: many(eventReviews),
  notifications: many(eventNotifications),
  analyticsDaily: many(eventAnalyticsDaily),
  views: many(eventViews),
}));

export const eventSpeakersRelations = relations(eventSpeakers, ({ one, many }) => ({
  event: one(events, {
    fields: [eventSpeakers.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventSpeakers.userId],
    references: [users.id],
  }),
  schedules: many(eventSchedules),
}));

export const eventSchedulesRelations = relations(eventSchedules, ({ one }) => ({
  event: one(events, {
    fields: [eventSchedules.eventId],
    references: [events.id],
  }),
  speaker: one(eventSpeakers, {
    fields: [eventSchedules.speakerId],
    references: [eventSpeakers.id],
  }),
}));

export const eventTicketTypesRelations = relations(eventTicketTypes, ({ one, many }) => ({
  event: one(events, {
    fields: [eventTicketTypes.eventId],
    references: [events.id],
  }),
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one, many }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
  ticketType: one(eventTicketTypes, {
    fields: [eventRegistrations.ticketTypeId],
    references: [eventTicketTypes.id],
  }),
  promoCode: one(eventPromoCodes, {
    fields: [eventRegistrations.promoCodeId],
    references: [eventPromoCodes.id],
  }),
  payments: many(eventRegistrationPayments),
  reviews: many(eventReviews),
}));

export const eventRegistrationPaymentsRelations = relations(eventRegistrationPayments, ({ one }) => ({
  registration: one(eventRegistrations, {
    fields: [eventRegistrationPayments.registrationId],
    references: [eventRegistrations.id],
  }),
}));

export const eventReviewsRelations = relations(eventReviews, ({ one }) => ({
  event: one(events, {
    fields: [eventReviews.eventId],
    references: [events.id],
  }),
  registration: one(eventRegistrations, {
    fields: [eventReviews.registrationId],
    references: [eventRegistrations.id],
  }),
  user: one(users, {
    fields: [eventReviews.userId],
    references: [users.id],
  }),
}));

// ========================================================================
// EVENT MANAGEMENT API VALIDATION SCHEMAS
// ========================================================================

export const createEventSchema = z.object({
  salonId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  eventTypeId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  venueType: z.enum(['salon', 'external', 'online']).default('salon'),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().optional(),
  venueCity: z.string().max(100).optional(),
  venueState: z.string().max(100).optional(),
  venuePincode: z.string().max(10).optional(),
  venueLatitude: z.number().optional(),
  venueLongitude: z.number().optional(),
  maxCapacity: z.number().int().min(1).default(20),
  minCapacity: z.number().int().min(1).default(1),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  coverImageUrl: z.string().url().optional(),
  galleryImages: z.array(z.string().url()).optional(),
  cancellationPolicy: z.object({
    "7_plus_days": z.number().min(0).max(100),
    "3_to_6_days": z.number().min(0).max(100),
    "1_to_2_days": z.number().min(0).max(100),
    "same_day": z.number().min(0).max(100),
  }).optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const createTicketTypeSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  basePricePaisa: z.number().int().min(0),
  gstPercentage: z.number().min(0).max(100).default(18),
  quantityAvailable: z.number().int().min(1).optional(),
  saleStartDate: z.string().optional(),
  saleEndDate: z.string().optional(),
  discountPercentage: z.number().min(0).max(100).default(0),
  discountLabel: z.string().max(50).optional(),
  includes: z.array(z.string()).optional(),
});
export type CreateTicketTypeInput = z.infer<typeof createTicketTypeSchema>;

export const eventRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  ticketTypeId: z.string().uuid(),
  attendeeName: z.string().min(1).max(200),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().min(10).max(20),
  attendeeAgeGroup: z.string().max(20).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  dietaryPreference: z.string().max(50).optional(),
  specialRequirements: z.string().max(500).optional(),
  promoCode: z.string().max(50).optional(),
});
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;

export const eventReviewSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  instructorRating: z.number().int().min(1).max(5).optional(),
  contentRating: z.number().int().min(1).max(5).optional(),
  venueRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  organizationRating: z.number().int().min(1).max(5).optional(),
  likedAspects: z.array(z.string()).optional(),
  reviewText: z.string().max(2000).optional(),
  reviewPhotos: z.array(z.string().url()).max(5).optional(),
});
export type EventReviewInput = z.infer<typeof eventReviewSchema>;

export const cancelRegistrationSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>;

// ===============================================
// USER NOTIFICATIONS - General notifications for mobile app
// ===============================================
export const userNotifications = pgTable("user_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // booking, payment, wallet, promo, system
  referenceId: varchar("reference_id"), // bookingId, orderId, etc.
  referenceType: varchar("reference_type", { length: 50 }), // booking, order, wallet, etc.
  isRead: integer("is_read").notNull().default(0),
  readAt: timestamp("read_at"),
  imageUrl: varchar("image_url"),
  actionUrl: varchar("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("user_notifications_user_id_idx").on(table.userId),
  index("user_notifications_created_at_idx").on(table.createdAt),
]);

export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;
export type UserNotification = typeof userNotifications.$inferSelect;

// ===============================================
// LOYALTY & REWARDS SYSTEM
// ===============================================

// Loyalty Tiers - Bronze, Silver, Gold, Platinum
export const loyaltyTiers = pgTable("loyalty_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().unique(), // bronze, silver, gold, platinum
  displayName: varchar("display_name", { length: 100 }).notNull(), // Bronze, Silver, Gold, Platinum
  minPoints: integer("min_points").notNull().default(0), // Minimum points to reach this tier
  maxPoints: integer("max_points"), // Maximum points for this tier (null for highest tier)
  pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).notNull().default('1.00'), // Points earned multiplier
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull().default('0.00'), // Discount on bookings
  benefits: jsonb("benefits").default('[]'), // Array of benefit descriptions
  iconUrl: varchar("icon_url"), // Tier badge icon
  colorHex: varchar("color_hex", { length: 7 }).default('#CD7F32'), // Bronze color by default
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export type LoyaltyTier = typeof loyaltyTiers.$inferSelect;
export type InsertLoyaltyTier = typeof loyaltyTiers.$inferInsert;

// User Points - Tracks user's current points and tier
export const userPoints = pgTable("user_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentPoints: integer("current_points").notNull().default(0), // Redeemable points
  lifetimePoints: integer("lifetime_points").notNull().default(0), // Total points ever earned (for tier calculation)
  currentTierId: varchar("current_tier_id").references(() => loyaltyTiers.id),
  tierExpiresAt: timestamp("tier_expires_at"), // When current tier status expires
  lastPointsEarnedAt: timestamp("last_points_earned_at"),
  lastPointsRedeemedAt: timestamp("last_points_redeemed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_points_user_id_idx").on(table.userId),
  index("user_points_lifetime_points_idx").on(table.lifetimePoints),
]);

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

// Point Transactions - History of points earned/redeemed
export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // earn, redeem, expire, bonus, referral
  points: integer("points").notNull(), // Positive for earn, negative for redeem/expire
  balanceAfter: integer("balance_after").notNull(), // Points balance after this transaction
  source: varchar("source", { length: 50 }).notNull(), // booking, review, referral, promotion, birthday, signup
  referenceId: varchar("reference_id"), // bookingId, reviewId, etc.
  referenceType: varchar("reference_type", { length: 50 }), // booking, review, referral, reward
  description: text("description").notNull(), // Human readable description
  expiresAt: timestamp("expires_at"), // When these points expire (for earned points)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("point_transactions_user_id_idx").on(table.userId),
  index("point_transactions_created_at_idx").on(table.createdAt),
  index("point_transactions_type_idx").on(table.type),
]);

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = typeof pointTransactions.$inferInsert;

// Rewards Catalog - Available rewards for redemption
export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 200 }),
  pointsCost: integer("points_cost").notNull(), // Points required to redeem
  rewardType: varchar("reward_type", { length: 50 }).notNull(), // discount, free_service, product, voucher, experience
  rewardValue: integer("reward_value"), // Value in paisa for discounts/vouchers
  rewardPercentage: decimal("reward_percentage", { precision: 5, scale: 2 }), // Percentage discount
  category: varchar("category", { length: 50 }), // hair, spa, nails, makeup, products
  imageUrl: varchar("image_url"),
  termsConditions: text("terms_conditions"),
  validityDays: integer("validity_days").default(30), // Days until reward expires after redemption
  minTierRequired: varchar("min_tier_required").references(() => loyaltyTiers.id), // Minimum tier to redeem
  maxRedemptionsPerUser: integer("max_redemptions_per_user"), // Limit per user
  totalQuantity: integer("total_quantity"), // Total available (null = unlimited)
  redeemedCount: integer("redeemed_count").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("rewards_points_cost_idx").on(table.pointsCost),
  index("rewards_reward_type_idx").on(table.rewardType),
  index("rewards_is_active_idx").on(table.isActive),
]);

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

// User Redeemed Rewards - Track redeemed rewards
export const userRedeemedRewards = pgTable("user_redeemed_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardId: varchar("reward_id").notNull().references(() => rewards.id, { onDelete: "cascade" }),
  pointsSpent: integer("points_spent").notNull(),
  redemptionCode: varchar("redemption_code", { length: 20 }).notNull().unique(), // Unique code for this redemption
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, used, expired, cancelled
  usedAt: timestamp("used_at"),
  usedAtSalonId: varchar("used_at_salon_id").references(() => salons.id),
  usedAtBookingId: varchar("used_at_booking_id"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("user_redeemed_rewards_user_id_idx").on(table.userId),
  index("user_redeemed_rewards_status_idx").on(table.status),
  index("user_redeemed_rewards_expires_at_idx").on(table.expiresAt),
]);

export type UserRedeemedReward = typeof userRedeemedRewards.$inferSelect;
export type InsertUserRedeemedReward = typeof userRedeemedRewards.$inferInsert;

// ===============================================
// FAVORITES - Salons & Stylists
// ===============================================

// Favorite Salons
export const favoriteSalons = pgTable("favorite_salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("favorite_salons_user_id_idx").on(table.userId),
  index("favorite_salons_salon_id_idx").on(table.salonId),
  uniqueIndex("favorite_salons_user_salon_unique").on(table.userId, table.salonId),
]);

export type FavoriteSalon = typeof favoriteSalons.$inferSelect;
export type InsertFavoriteSalon = typeof favoriteSalons.$inferInsert;

// Favorite Stylists
export const favoriteStylists = pgTable("favorite_stylists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("favorite_stylists_user_id_idx").on(table.userId),
  index("favorite_stylists_staff_id_idx").on(table.staffId),
  uniqueIndex("favorite_stylists_user_staff_unique").on(table.userId, table.staffId),
]);

export type FavoriteStylist = typeof favoriteStylists.$inferSelect;
export type InsertFavoriteStylist = typeof favoriteStylists.$inferInsert;

// ===============================================
// REFERRAL PROGRAM
// ===============================================

// Referral Codes - Unique codes for each user
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  code: varchar("code", { length: 20 }).notNull().unique(), // e.g., JOHN2024, BEAUTY123
  referrerRewardPoints: integer("referrer_reward_points").notNull().default(200), // Points for referrer
  refereeRewardPoints: integer("referee_reward_points").notNull().default(100), // Points for new user
  refereeDiscountPercentage: decimal("referee_discount_percentage", { precision: 5, scale: 2 }).default('10.00'), // Discount for first booking
  maxUses: integer("max_uses"), // Maximum times this code can be used (null = unlimited)
  usedCount: integer("used_count").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  expiresAt: timestamp("expires_at"), // Optional expiry date
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("referral_codes_code_idx").on(table.code),
  index("referral_codes_user_id_idx").on(table.userId),
]);

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

// Referrals - Track who referred whom
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }), // User who referred
  refereeId: varchar("referee_id").notNull().references(() => users.id, { onDelete: "cascade" }), // New user who signed up
  referralCodeId: varchar("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, completed, rewarded, expired
  referrerPointsAwarded: integer("referrer_points_awarded").default(0), // Points given to referrer
  refereePointsAwarded: integer("referee_points_awarded").default(0), // Points given to referee
  refereeFirstBookingId: varchar("referee_first_booking_id"), // First booking by referred user
  refereeFirstBookingAt: timestamp("referee_first_booking_at"),
  rewardedAt: timestamp("rewarded_at"), // When both parties were rewarded
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("referrals_referrer_id_idx").on(table.referrerId),
  index("referrals_referee_id_idx").on(table.refereeId),
  index("referrals_status_idx").on(table.status),
  uniqueIndex("referrals_referee_unique").on(table.refereeId), // Each user can only be referred once
]);

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// Referral Relations
export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
  user: one(users, {
    fields: [referralCodes.userId],
    references: [users.id],
  }),
  referrals: many(referrals),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'referrer',
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
    relationName: 'referee',
  }),
  referralCode: one(referralCodes, {
    fields: [referrals.referralCodeId],
    references: [referralCodes.id],
  }),
}));

// Loyalty Relations
export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
  currentTier: one(loyaltyTiers, {
    fields: [userPoints.currentTierId],
    references: [loyaltyTiers.id],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
}));

export const userRedeemedRewardsRelations = relations(userRedeemedRewards, ({ one }) => ({
  user: one(users, {
    fields: [userRedeemedRewards.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [userRedeemedRewards.rewardId],
    references: [rewards.id],
  }),
  salon: one(salons, {
    fields: [userRedeemedRewards.usedAtSalonId],
    references: [salons.id],
  }),
}));

// Favorites Relations
export const favoriteSalonsRelations = relations(favoriteSalons, ({ one }) => ({
  user: one(users, {
    fields: [favoriteSalons.userId],
    references: [users.id],
  }),
  salon: one(salons, {
    fields: [favoriteSalons.salonId],
    references: [salons.id],
  }),
}));

export const favoriteStylistsRelations = relations(favoriteStylists, ({ one }) => ({
  user: one(users, {
    fields: [favoriteStylists.userId],
    references: [users.id],
  }),
  stylist: one(staff, {
    fields: [favoriteStylists.staffId],
    references: [staff.id],
  }),
}));

// =====================================================
// CHAT SYSTEM TABLES
// =====================================================

// Chat Conversations - Links customer with salon for pre-booking discussions
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default('active'), // active, archived, closed
  context: varchar("context", { length: 50 }).default('pre_booking'), // pre_booking, booking_inquiry, support
  relatedBookingId: varchar("related_booking_id"), // Optional: if conversation relates to a specific booking
  relatedServiceId: varchar("related_service_id"), // Optional: if discussing a specific service
  assignedStaffId: varchar("assigned_staff_id").references(() => staff.id, { onDelete: "set null" }), // Staff handling this chat
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: text("last_message_preview"), // First 100 chars of last message for list view
  customerUnreadCount: integer("customer_unread_count").notNull().default(0),
  staffUnreadCount: integer("staff_unread_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("chat_conversations_salon_id_idx").on(table.salonId),
  index("chat_conversations_customer_id_idx").on(table.customerId),
  index("chat_conversations_assigned_staff_idx").on(table.assignedStaffId),
  index("chat_conversations_status_idx").on(table.status),
  index("chat_conversations_last_message_at_idx").on(table.lastMessageAt),
  uniqueIndex("chat_conversations_salon_customer_unique").on(table.salonId, table.customerId),
]);

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

// Chat Participants - Tracks all users who can view/participate in a conversation
export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // customer, staff, admin
  staffId: varchar("staff_id").references(() => staff.id, { onDelete: "cascade" }), // Only if role is 'staff'
  joinedAt: timestamp("joined_at").defaultNow(),
  lastReadAt: timestamp("last_read_at"),
  isActive: integer("is_active").notNull().default(1), // 0 if left the conversation
}, (table) => [
  index("chat_participants_conversation_id_idx").on(table.conversationId),
  index("chat_participants_user_id_idx").on(table.userId),
  uniqueIndex("chat_participants_conversation_user_unique").on(table.conversationId, table.userId),
]);

export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatParticipant = typeof chatParticipants.$inferInsert;

// Chat Messages - Individual messages in a conversation
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderRole: varchar("sender_role", { length: 20 }).notNull(), // customer, staff
  senderName: text("sender_name"), // Cached sender name for display
  senderAvatar: text("sender_avatar"), // Cached sender avatar URL
  messageType: varchar("message_type", { length: 20 }).notNull().default('text'), // text, image, file, system
  body: text("body"), // Message text content
  attachmentUrl: text("attachment_url"), // URL for image/file attachments
  attachmentType: varchar("attachment_type", { length: 50 }), // image/jpeg, application/pdf, etc.
  attachmentName: text("attachment_name"), // Original filename
  attachmentSize: integer("attachment_size"), // File size in bytes
  metadata: jsonb("metadata"), // Additional data (e.g., service details, booking info)
  isEdited: integer("is_edited").notNull().default(0),
  editedAt: timestamp("edited_at"),
  isDeleted: integer("is_deleted").notNull().default(0),
  deletedAt: timestamp("deleted_at"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
}, (table) => [
  index("chat_messages_conversation_id_idx").on(table.conversationId),
  index("chat_messages_sender_id_idx").on(table.senderId),
  index("chat_messages_sent_at_idx").on(table.sentAt),
  index("chat_messages_conversation_sent_idx").on(table.conversationId, table.sentAt),
]);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Message Read Receipts - Track who has read each message (for per-user read tracking)
export const chatMessageReads = pgTable("chat_message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow(),
}, (table) => [
  index("chat_message_reads_message_id_idx").on(table.messageId),
  index("chat_message_reads_user_id_idx").on(table.userId),
  uniqueIndex("chat_message_reads_message_user_unique").on(table.messageId, table.userId),
]);

export type ChatMessageRead = typeof chatMessageReads.$inferSelect;
export type InsertChatMessageRead = typeof chatMessageReads.$inferInsert;

// Chat Relations
export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  salon: one(salons, {
    fields: [chatConversations.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [chatConversations.customerId],
    references: [users.id],
  }),
  assignedStaff: one(staff, {
    fields: [chatConversations.assignedStaffId],
    references: [staff.id],
  }),
  participants: many(chatParticipants),
  messages: many(chatMessages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatParticipants.conversationId],
    references: [chatConversations.id],
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
  staffMember: one(staff, {
    fields: [chatParticipants.staffId],
    references: [staff.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
  readReceipts: many(chatMessageReads),
}));

export const chatMessageReadsRelations = relations(chatMessageReads, ({ one }) => ({
  message: one(chatMessages, {
    fields: [chatMessageReads.messageId],
    references: [chatMessages.id],
  }),
  user: one(users, {
    fields: [chatMessageReads.userId],
    references: [users.id],
  }),
}));

// Chat Zod Schemas for validation
export const insertChatConversationSchema = createInsertSchema(chatConversations).pick({
  salonId: true,
  customerId: true,
  context: true,
  relatedBookingId: true,
  relatedServiceId: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  conversationId: true,
  body: true,
  messageType: true,
  attachmentUrl: true,
  attachmentType: true,
  attachmentName: true,
  attachmentSize: true,
  metadata: true,
});

// =====================================================
// CLIENT NOTES & PREFERENCES SYSTEM (Feature 1)
// =====================================================

// Client Profiles - Extended customer profiles per salon (salon-specific relationship)
export const clientProfiles = pgTable("client_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Hair-specific structured fields
  hairType: varchar("hair_type", { length: 50 }), // straight, wavy, curly, coily
  hairCondition: varchar("hair_condition", { length: 50 }), // healthy, damaged, color-treated
  hairLength: varchar("hair_length", { length: 50 }), // short, medium, long
  hairDensity: varchar("hair_density", { length: 50 }), // thin, medium, thick
  scalpCondition: varchar("scalp_condition", { length: 50 }), // normal, oily, dry, sensitive
  
  // Skin-specific structured fields
  skinType: varchar("skin_type", { length: 50 }), // oily, dry, combination, sensitive, normal
  skinConcerns: text("skin_concerns").array(), // Array of concerns: acne, aging, hyperpigmentation, etc
  
  // Allergy & sensitivity information (critical for safety)
  allergies: text("allergies").array(), // Array of known allergies
  sensitivities: text("sensitivities").array(), // Array of sensitivities
  contraindications: text("contraindications"), // Free text for medical contraindications
  
  // Preference fields
  preferredStylistId: varchar("preferred_stylist_id").references(() => staff.id, { onDelete: "set null" }),
  communicationStyle: varchar("communication_style", { length: 50 }), // chatty, quiet, professional
  beveragePreference: varchar("beverage_preference", { length: 100 }), // tea, coffee, water, none
  musicPreference: varchar("music_preference", { length: 100 }), // pop, classical, ambient, none
  specialRequirements: text("special_requirements"), // Free text for any special needs
  
  // Customer-provided preferences
  preferredProducts: text("preferred_products").array(), // Products customer likes
  dislikedProducts: text("disliked_products").array(), // Products customer dislikes
  
  // Tracking fields
  lastVisitDate: timestamp("last_visit_date"),
  totalVisits: integer("total_visits").notNull().default(0),
  lifetimeSpendPaisa: integer("lifetime_spend_paisa").notNull().default(0),
  
  // VIP/loyalty status for this salon
  isVip: integer("is_vip").notNull().default(0),
  vipNotes: text("vip_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("client_profiles_salon_id_idx").on(table.salonId),
  index("client_profiles_customer_id_idx").on(table.customerId),
  index("client_profiles_preferred_stylist_idx").on(table.preferredStylistId),
  uniqueIndex("client_profiles_salon_customer_unique").on(table.salonId, table.customerId),
]);

export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = typeof clientProfiles.$inferInsert;

// Client Notes - Free-text notes with timestamps and author
export const clientNotes = pgTable("client_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientProfileId: varchar("client_profile_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }), // Optional link to specific appointment
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "set null" }), // Optional link to specific service
  
  noteType: varchar("note_type", { length: 50 }).notNull().default('general'), // general, appointment, formula, complaint, compliment
  title: varchar("title", { length: 200 }), // Optional title for the note
  content: text("content").notNull(), // The actual note content
  
  // Priority/visibility flags
  isPinned: integer("is_pinned").notNull().default(0), // Pinned notes show first
  isAlertNote: integer("is_alert_note").notNull().default(0), // Alert notes show as popups
  isVisibleToCustomer: integer("is_visible_to_customer").notNull().default(0), // Can customer see this note
  
  // Author tracking
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorStaffId: varchar("author_staff_id").references(() => staff.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("client_notes_client_profile_id_idx").on(table.clientProfileId),
  index("client_notes_booking_id_idx").on(table.bookingId),
  index("client_notes_author_id_idx").on(table.authorId),
  index("client_notes_note_type_idx").on(table.noteType),
  index("client_notes_is_pinned_idx").on(table.isPinned),
]);

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

// Client Formulas - Structured formula data for hair color, treatments, etc.
export const clientFormulas = pgTable("client_formulas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientProfileId: varchar("client_profile_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }), // Link to appointment when formula was used
  
  formulaType: varchar("formula_type", { length: 50 }).notNull(), // hair_color, highlights, treatment, perm, relaxer
  formulaName: varchar("formula_name", { length: 200 }).notNull(), // User-friendly name for this formula
  
  // Hair color specific fields
  baseColor: varchar("base_color", { length: 100 }), // Base color used
  targetColor: varchar("target_color", { length: 100 }), // Desired result color
  developer: varchar("developer", { length: 50 }), // Developer volume (10, 20, 30, 40)
  mixingRatio: varchar("mixing_ratio", { length: 50 }), // e.g., "1:1", "1:2"
  processingTime: integer("processing_time"), // Time in minutes
  heatUsed: integer("heat_used").notNull().default(0), // 1 if heat was used
  
  // Product details (flexible JSON for various products)
  products: jsonb("products"), // Array of { brand, name, shade, amount }
  
  // Additional formula notes
  applicationTechnique: text("application_technique"), // How formula was applied
  sectioning: text("sectioning"), // How hair was sectioned
  specialInstructions: text("special_instructions"), // Any special instructions
  
  // Result tracking
  resultNotes: text("result_notes"), // How the result turned out
  resultRating: integer("result_rating"), // 1-5 rating of the result
  
  // Flags
  isActiveFormula: integer("is_active_formula").notNull().default(1), // Current formula vs historical
  isCustomerFavorite: integer("is_customer_favorite").notNull().default(0), // Customer marked as favorite
  
  // Author tracking
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("client_formulas_client_profile_id_idx").on(table.clientProfileId),
  index("client_formulas_formula_type_idx").on(table.formulaType),
  index("client_formulas_booking_id_idx").on(table.bookingId),
  index("client_formulas_is_active_idx").on(table.isActiveFormula),
]);

export type ClientFormula = typeof clientFormulas.$inferSelect;
export type InsertClientFormula = typeof clientFormulas.$inferInsert;

// Client Photos - Before/after photo storage linked to appointments
export const clientPhotos = pgTable("client_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientProfileId: varchar("client_profile_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }), // Link to appointment
  formulaId: varchar("formula_id").references(() => clientFormulas.id, { onDelete: "set null" }), // Optional link to formula used
  
  photoType: varchar("photo_type", { length: 20 }).notNull(), // before, after, reference, inspiration
  photoUrl: text("photo_url").notNull(), // URL to stored photo
  thumbnailUrl: text("thumbnail_url"), // Compressed thumbnail URL
  
  caption: varchar("caption", { length: 500 }), // Optional caption/description
  serviceType: varchar("service_type", { length: 100 }), // What service this photo relates to
  
  // Visibility flags
  isVisibleToCustomer: integer("is_visible_to_customer").notNull().default(1), // Customer can view
  isPortfolioPhoto: integer("is_portfolio_photo").notNull().default(0), // Can be used in salon portfolio (with consent)
  consentGiven: integer("consent_given").notNull().default(0), // Customer gave consent for portfolio use
  
  // Metadata
  takenAt: timestamp("taken_at"), // When photo was taken (can differ from upload)
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("client_photos_client_profile_id_idx").on(table.clientProfileId),
  index("client_photos_booking_id_idx").on(table.bookingId),
  index("client_photos_formula_id_idx").on(table.formulaId),
  index("client_photos_photo_type_idx").on(table.photoType),
  index("client_photos_is_portfolio_idx").on(table.isPortfolioPhoto),
]);

export type ClientPhoto = typeof clientPhotos.$inferSelect;
export type InsertClientPhoto = typeof clientPhotos.$inferInsert;

// Profile Visibility Settings - Salon-level settings for what customers can see
export const profileVisibilitySettings = pgTable("profile_visibility_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Visibility mode: 'all', 'preferences_only', 'none'
  visibilityMode: varchar("visibility_mode", { length: 20 }).notNull().default('preferences_only'),
  
  // Fine-grained field visibility (when mode is 'custom')
  showHairProfile: integer("show_hair_profile").notNull().default(1),
  showSkinProfile: integer("show_skin_profile").notNull().default(1),
  showAllergies: integer("show_allergies").notNull().default(1),
  showPreferences: integer("show_preferences").notNull().default(1),
  showPhotos: integer("show_photos").notNull().default(1),
  showNotes: integer("show_notes").notNull().default(0), // Staff notes hidden by default
  showFormulas: integer("show_formulas").notNull().default(0), // Formulas hidden by default
  showVisitHistory: integer("show_visit_history").notNull().default(1),
  
  // Auto-popup settings
  showProfileOnBooking: integer("show_profile_on_booking").notNull().default(1), // Auto-popup for staff
  highlightAllergies: integer("highlight_allergies").notNull().default(1), // Red highlight for allergies
  highlightVip: integer("highlight_vip").notNull().default(1), // VIP badge highlight
  
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  uniqueIndex("profile_visibility_settings_salon_unique").on(table.salonId),
]);

export type ProfileVisibilitySettings = typeof profileVisibilitySettings.$inferSelect;
export type InsertProfileVisibilitySettings = typeof profileVisibilitySettings.$inferInsert;

// Client Profile Relations
export const clientProfilesRelations = relations(clientProfiles, ({ one, many }) => ({
  salon: one(salons, {
    fields: [clientProfiles.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [clientProfiles.customerId],
    references: [users.id],
  }),
  preferredStylist: one(staff, {
    fields: [clientProfiles.preferredStylistId],
    references: [staff.id],
  }),
  notes: many(clientNotes),
  formulas: many(clientFormulas),
  photos: many(clientPhotos),
}));

export const clientNotesRelations = relations(clientNotes, ({ one }) => ({
  clientProfile: one(clientProfiles, {
    fields: [clientNotes.clientProfileId],
    references: [clientProfiles.id],
  }),
  booking: one(bookings, {
    fields: [clientNotes.bookingId],
    references: [bookings.id],
  }),
  service: one(services, {
    fields: [clientNotes.serviceId],
    references: [services.id],
  }),
  author: one(users, {
    fields: [clientNotes.authorId],
    references: [users.id],
  }),
  authorStaff: one(staff, {
    fields: [clientNotes.authorStaffId],
    references: [staff.id],
  }),
}));

export const clientFormulasRelations = relations(clientFormulas, ({ one, many }) => ({
  clientProfile: one(clientProfiles, {
    fields: [clientFormulas.clientProfileId],
    references: [clientProfiles.id],
  }),
  booking: one(bookings, {
    fields: [clientFormulas.bookingId],
    references: [bookings.id],
  }),
  photos: many(clientPhotos),
}));

export const clientPhotosRelations = relations(clientPhotos, ({ one }) => ({
  clientProfile: one(clientProfiles, {
    fields: [clientPhotos.clientProfileId],
    references: [clientProfiles.id],
  }),
  booking: one(bookings, {
    fields: [clientPhotos.bookingId],
    references: [bookings.id],
  }),
  formula: one(clientFormulas, {
    fields: [clientPhotos.formulaId],
    references: [clientFormulas.id],
  }),
  uploader: one(users, {
    fields: [clientPhotos.uploadedBy],
    references: [users.id],
  }),
}));

export const profileVisibilitySettingsRelations = relations(profileVisibilitySettings, ({ one }) => ({
  salon: one(salons, {
    fields: [profileVisibilitySettings.salonId],
    references: [salons.id],
  }),
}));

// Client Notes & Preferences Zod Schemas
export const insertClientProfileSchema = createInsertSchema(clientProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateClientProfileSchema = createInsertSchema(clientProfiles).omit({
  id: true,
  salonId: true,
  customerId: true,
  createdAt: true,
  createdBy: true,
}).partial();

export const insertClientNoteSchema = createInsertSchema(clientNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientFormulaSchema = createInsertSchema(clientFormulas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientPhotoSchema = createInsertSchema(clientPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertProfileVisibilitySettingsSchema = createInsertSchema(profileVisibilitySettings).omit({
  id: true,
  updatedAt: true,
});

// =============================================================================
// FEATURE 2: NO-SHOW PROTECTION (Deposits & Card-on-File)
// =============================================================================

// Deposit Settings - Salon-level deposit configuration
export const depositSettings = pgTable("deposit_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Master toggle
  isEnabled: integer("is_enabled").notNull().default(0), // 1 = deposits enabled
  
  // Deposit amount configuration
  depositPercentage: integer("deposit_percentage").notNull().default(25), // 20, 25, 50, etc.
  
  // Trigger methods (salon owner chooses which to use)
  usePriceThreshold: integer("use_price_threshold").notNull().default(0), // 1 = enabled
  priceThresholdPaisa: integer("price_threshold_paisa"), // e.g., 100000 = ₹1000
  
  useCategoryBased: integer("use_category_based").notNull().default(0), // 1 = enabled
  protectedCategories: text("protected_categories").array(), // e.g., ['Bridal', 'Premium']
  
  useManualToggle: integer("use_manual_toggle").notNull().default(1), // 1 = enabled (default)
  
  // Trusted customer settings
  allowTrustedCustomerBypass: integer("allow_trusted_customer_bypass").notNull().default(1), // 1 = trusted can skip deposit
  requireCardOnFile: integer("require_card_on_file").notNull().default(1), // 1 = card required for bypass
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  uniqueIndex("deposit_settings_salon_unique").on(table.salonId),
]);

export type DepositSettings = typeof depositSettings.$inferSelect;
export type InsertDepositSettings = typeof depositSettings.$inferInsert;

// Service Deposit Rules - Per-service deposit requirements
export const serviceDepositRules = pgTable("service_deposit_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  
  // Manual override for this specific service
  requiresDeposit: integer("requires_deposit").notNull().default(0), // 1 = deposit required
  
  // Optional custom percentage (overrides salon default)
  customPercentage: integer("custom_percentage"), // null = use salon default
  
  // Optional custom minimum deposit amount
  minimumDepositPaisa: integer("minimum_deposit_paisa"), // e.g., 50000 = ₹500 minimum
  
  // Optional maximum deposit cap
  maximumDepositPaisa: integer("maximum_deposit_paisa"), // Cap the deposit amount
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("service_deposit_rules_unique").on(table.salonId, table.serviceId),
  index("service_deposit_rules_salon_idx").on(table.salonId),
  index("service_deposit_rules_service_idx").on(table.serviceId),
]);

export type ServiceDepositRule = typeof serviceDepositRules.$inferSelect;
export type InsertServiceDepositRule = typeof serviceDepositRules.$inferInsert;

// Cancellation Policies - Salon-specific cancellation windows and fees
export const cancellationPolicies = pgTable("cancellation_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Cancellation window in hours (12, 24, 48, 72)
  cancellationWindowHours: integer("cancellation_window_hours").notNull().default(24),
  
  // What happens if cancelled within window
  withinWindowAction: varchar("within_window_action", { length: 30 }).notNull().default('forfeit_full'), 
  // Options: 'forfeit_full', 'forfeit_partial', 'no_penalty'
  
  partialForfeitPercentage: integer("partial_forfeit_percentage").default(50), // % of deposit to forfeit if partial
  
  // No-show handling
  noShowAction: varchar("no_show_action", { length: 30 }).notNull().default('forfeit_full'),
  // Options: 'forfeit_full', 'forfeit_partial', 'charge_full_service'
  
  noShowChargeFull: integer("no_show_charge_full").notNull().default(0), // 1 = charge full service price on no-show
  
  // Grace period (extra minutes before marking as no-show)
  noShowGraceMinutes: integer("no_show_grace_minutes").notNull().default(15),
  
  // Policy text (shown to customers)
  policyText: text("policy_text"), // Custom policy description
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  uniqueIndex("cancellation_policies_salon_unique").on(table.salonId),
]);

export type CancellationPolicy = typeof cancellationPolicies.$inferSelect;
export type InsertCancellationPolicy = typeof cancellationPolicies.$inferInsert;

// Trusted Customers - Salon-specific trusted customer list (can skip deposit)
export const trustedCustomers = pgTable("trusted_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Trust status
  trustLevel: varchar("trust_level", { length: 20 }).notNull().default('trusted'), 
  // Options: 'trusted', 'vip', 'blacklisted'
  
  // Reason for trust status
  reason: text("reason"), // Why customer was marked as trusted/blacklisted
  
  // Bypass settings
  canBypassDeposit: integer("can_bypass_deposit").notNull().default(1), // 1 = can skip deposit
  hasCardOnFile: integer("has_card_on_file").notNull().default(0), // 1 = card saved
  cardTokenId: varchar("card_token_id", { length: 100 }), // Razorpay token reference
  cardLast4: varchar("card_last_4", { length: 4 }), // Last 4 digits for display
  cardBrand: varchar("card_brand", { length: 20 }), // visa, mastercard, etc.
  cardExpiryMonth: integer("card_expiry_month"),
  cardExpiryYear: integer("card_expiry_year"),
  
  // Stats for trust calculation
  totalBookings: integer("total_bookings").notNull().default(0),
  completedBookings: integer("completed_bookings").notNull().default(0),
  noShowCount: integer("no_show_count").notNull().default(0),
  lateCancellationCount: integer("late_cancellation_count").notNull().default(0),
  
  // Tracking
  addedBy: varchar("added_by").references(() => users.id, { onDelete: "set null" }),
  addedAt: timestamp("added_at").defaultNow(),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  lastUpdatedBy: varchar("last_updated_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  uniqueIndex("trusted_customers_unique").on(table.salonId, table.customerId),
  index("trusted_customers_salon_idx").on(table.salonId),
  index("trusted_customers_customer_idx").on(table.customerId),
  index("trusted_customers_trust_level_idx").on(table.trustLevel),
]);

export type TrustedCustomer = typeof trustedCustomers.$inferSelect;
export type InsertTrustedCustomer = typeof trustedCustomers.$inferInsert;

// Deposit Transactions - Track deposits, refunds, forfeitures
export const depositTransactions = pgTable("deposit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  
  // Transaction details
  transactionType: varchar("transaction_type", { length: 30 }).notNull(), 
  // Options: 'deposit_collected', 'deposit_refunded', 'deposit_forfeited', 'no_show_charged', 'deposit_applied'
  
  amountPaisa: integer("amount_paisa").notNull(), // Transaction amount
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  
  // Service details snapshot
  serviceAmountPaisa: integer("service_amount_paisa").notNull(), // Original service price
  depositPercentage: integer("deposit_percentage").notNull(), // % used to calculate
  
  // Payment gateway details
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }), // For deposits/charges
  razorpayRefundId: varchar("razorpay_refund_id", { length: 100 }), // For refunds
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  // Options: 'pending', 'completed', 'failed', 'refund_pending', 'refunded'
  
  // Reason/notes
  reason: text("reason"), // Why refund/forfeit happened
  notes: text("notes"), // Staff notes
  
  // Related to cancellation/no-show
  cancellationWindowHours: integer("cancellation_window_hours"), // Policy at time of booking
  cancelledWithinWindow: integer("cancelled_within_window"), // 1 = within penalty window
  wasNoShow: integer("was_no_show").notNull().default(0), // 1 = no-show
  
  // Processing timestamps
  collectedAt: timestamp("collected_at"), // When deposit was collected
  processedAt: timestamp("processed_at"), // When transaction completed
  refundedAt: timestamp("refunded_at"), // When refund was processed
  forfeitedAt: timestamp("forfeited_at"), // When deposit was forfeited
  
  // Tracking
  processedBy: varchar("processed_by").references(() => users.id, { onDelete: "set null" }), // Staff who processed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("deposit_transactions_salon_idx").on(table.salonId),
  index("deposit_transactions_customer_idx").on(table.customerId),
  index("deposit_transactions_booking_idx").on(table.bookingId),
  index("deposit_transactions_type_idx").on(table.transactionType),
  index("deposit_transactions_status_idx").on(table.status),
  index("deposit_transactions_created_at_idx").on(table.createdAt),
]);

export type DepositTransaction = typeof depositTransactions.$inferSelect;
export type InsertDepositTransaction = typeof depositTransactions.$inferInsert;

// Customer Saved Payment Methods - Razorpay card tokenization
export const customerSavedCards = pgTable("customer_saved_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Razorpay token reference
  razorpayTokenId: varchar("razorpay_token_id", { length: 100 }).notNull(),
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 100 }),
  
  // Card display info (masked)
  cardNetwork: varchar("card_network", { length: 50 }), // visa, mastercard, rupay, etc.
  cardType: varchar("card_type", { length: 20 }), // credit, debit
  cardLast4: varchar("card_last_4", { length: 4 }),
  cardIssuer: varchar("card_issuer", { length: 100 }), // Bank name
  cardBrand: varchar("card_brand", { length: 50 }),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  
  // Card nickname for easy identification
  nickname: varchar("nickname", { length: 50 }),
  
  // Status
  isDefault: integer("is_default").notNull().default(0), // 1 = default card
  isActive: integer("is_active").notNull().default(1), // 0 = deactivated
  
  // Compliance fields
  consentGiven: integer("consent_given").notNull().default(1), // RBI compliance
  consentTimestamp: timestamp("consent_timestamp"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => [
  index("customer_saved_cards_customer_idx").on(table.customerId),
  index("customer_saved_cards_token_idx").on(table.razorpayTokenId),
  index("customer_saved_cards_active_idx").on(table.isActive),
  unique("customer_saved_cards_token_unique").on(table.razorpayTokenId),
]);

export type CustomerSavedCard = typeof customerSavedCards.$inferSelect;
export type InsertCustomerSavedCard = typeof customerSavedCards.$inferInsert;

export const customerSavedCardsRelations = relations(customerSavedCards, ({ one }) => ({
  customer: one(users, {
    fields: [customerSavedCards.customerId],
    references: [users.id],
  }),
}));

// Relations for No-Show Protection tables
export const depositSettingsRelations = relations(depositSettings, ({ one }) => ({
  salon: one(salons, {
    fields: [depositSettings.salonId],
    references: [salons.id],
  }),
}));

export const serviceDepositRulesRelations = relations(serviceDepositRules, ({ one }) => ({
  salon: one(salons, {
    fields: [serviceDepositRules.salonId],
    references: [salons.id],
  }),
  service: one(services, {
    fields: [serviceDepositRules.serviceId],
    references: [services.id],
  }),
}));

export const cancellationPoliciesRelations = relations(cancellationPolicies, ({ one }) => ({
  salon: one(salons, {
    fields: [cancellationPolicies.salonId],
    references: [salons.id],
  }),
}));

export const trustedCustomersRelations = relations(trustedCustomers, ({ one }) => ({
  salon: one(salons, {
    fields: [trustedCustomers.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [trustedCustomers.customerId],
    references: [users.id],
  }),
}));

export const depositTransactionsRelations = relations(depositTransactions, ({ one }) => ({
  salon: one(salons, {
    fields: [depositTransactions.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [depositTransactions.customerId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [depositTransactions.bookingId],
    references: [bookings.id],
  }),
}));

// No-Show Protection Zod Schemas
export const insertDepositSettingsSchema = createInsertSchema(depositSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDepositSettingsSchema = createInsertSchema(depositSettings).omit({
  id: true,
  salonId: true,
  createdAt: true,
}).partial();

export const insertServiceDepositRuleSchema = createInsertSchema(serviceDepositRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCancellationPolicySchema = createInsertSchema(cancellationPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCancellationPolicySchema = createInsertSchema(cancellationPolicies).omit({
  id: true,
  salonId: true,
  createdAt: true,
}).partial();

export const insertTrustedCustomerSchema = createInsertSchema(trustedCustomers).omit({
  id: true,
  addedAt: true,
  lastUpdatedAt: true,
});

export const insertDepositTransactionSchema = createInsertSchema(depositTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// =============================================================================
// FEATURE 3: GIFT CARDS
// =============================================================================

// Gift Card Templates - Salon-specific gift card designs
export const giftCardTemplates = pgTable("gift_card_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Template details
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Birthday Special", "Holiday Gift"
  description: text("description"),
  designUrl: text("design_url"), // URL to the design image
  designData: jsonb("design_data"), // Custom design configuration (colors, fonts, etc.)
  
  // Preset values (optional)
  presetValuesPaisa: text("preset_values_paisa").array(), // e.g., ['100000', '200000', '500000'] for ₹1000, ₹2000, ₹5000
  allowCustomValue: integer("allow_custom_value").notNull().default(1), // 1 = allow custom amounts
  minValuePaisa: integer("min_value_paisa").notNull().default(50000), // Minimum gift card value (₹500)
  maxValuePaisa: integer("max_value_paisa").notNull().default(2500000), // Maximum gift card value (₹25000)
  
  // Display settings
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  isDefault: integer("is_default").notNull().default(0), // 1 = default template
  
  // Category for organization
  category: varchar("category", { length: 50 }), // 'birthday', 'holiday', 'occasion', 'general'
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("gift_card_templates_salon_idx").on(table.salonId),
  index("gift_card_templates_active_idx").on(table.isActive),
  index("gift_card_templates_category_idx").on(table.category),
]);

export type GiftCardTemplate = typeof giftCardTemplates.$inferSelect;
export type InsertGiftCardTemplate = typeof giftCardTemplates.$inferInsert;

// Gift Cards - Main gift card table
export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Gift card code - unique identifier for redemption
  code: varchar("code", { length: 20 }).notNull().unique(), // e.g., "GIFT-ABCD-1234"
  
  // Value tracking
  originalValuePaisa: integer("original_value_paisa").notNull(), // Original purchased amount
  balancePaisa: integer("balance_paisa").notNull(), // Current remaining balance
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default('active'),
  // Options: 'pending_payment', 'active', 'partially_used', 'fully_redeemed', 'expired', 'cancelled', 'refunded'
  
  // Purchase details
  purchasedBy: varchar("purchased_by").references(() => users.id, { onDelete: "set null" }), // Customer who bought
  purchasedAt: timestamp("purchased_at"),
  
  // Recipient details
  recipientName: varchar("recipient_name", { length: 100 }),
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  personalMessage: text("personal_message"), // Gift message from purchaser
  
  // Template used
  templateId: varchar("template_id").references(() => giftCardTemplates.id, { onDelete: "set null" }),
  
  // Scheduling for future delivery
  scheduledDeliveryAt: timestamp("scheduled_delivery_at"), // When to send the gift card
  deliveredAt: timestamp("delivered_at"), // When actually delivered
  
  // Expiry
  expiresAt: timestamp("expires_at"), // Null = never expires
  
  // Payment details
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
  
  // For tracking last usage
  lastUsedAt: timestamp("last_used_at"),
  lastUsedBookingId: varchar("last_used_booking_id"),
  
  // Redemption tracking
  totalRedemptionsPaisa: integer("total_redemptions_paisa").notNull().default(0),
  redemptionCount: integer("redemption_count").notNull().default(0),
  
  // QR Code for easy scanning
  qrCodeUrl: text("qr_code_url"),
  
  // Internal notes
  internalNotes: text("internal_notes"),
  
  // Audit trail
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: varchar("cancelled_by").references(() => users.id, { onDelete: "set null" }),
  cancellationReason: text("cancellation_reason"),
}, (table) => [
  index("gift_cards_salon_idx").on(table.salonId),
  index("gift_cards_code_idx").on(table.code),
  index("gift_cards_status_idx").on(table.status),
  index("gift_cards_purchased_by_idx").on(table.purchasedBy),
  index("gift_cards_recipient_email_idx").on(table.recipientEmail),
  index("gift_cards_expires_at_idx").on(table.expiresAt),
  index("gift_cards_created_at_idx").on(table.createdAt),
]);

export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = typeof giftCards.$inferInsert;

// Gift Card Transactions - Track all gift card activities
export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: varchar("gift_card_id").notNull().references(() => giftCards.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Transaction type
  transactionType: varchar("transaction_type", { length: 30 }).notNull(),
  // Options: 'purchase', 'redemption', 'partial_redemption', 'refund', 'adjustment', 'expiry', 'cancellation'
  
  // Amount details
  amountPaisa: integer("amount_paisa").notNull(), // Transaction amount (positive for purchase/refund, negative for redemption)
  balanceBeforePaisa: integer("balance_before_paisa").notNull(), // Balance before this transaction
  balanceAfterPaisa: integer("balance_after_paisa").notNull(), // Balance after this transaction
  currency: varchar("currency", { length: 3 }).notNull().default('INR'),
  
  // Reference to booking (for redemptions)
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  
  // Payment details (for purchases/refunds)
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
  razorpayRefundId: varchar("razorpay_refund_id", { length: 100 }),
  
  // User who performed the transaction
  performedBy: varchar("performed_by").references(() => users.id, { onDelete: "set null" }), // Staff or customer
  performedByType: varchar("performed_by_type", { length: 20 }), // 'customer', 'staff', 'system'
  
  // Notes
  notes: text("notes"),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default('completed'),
  // Options: 'pending', 'completed', 'failed', 'reversed'
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("gift_card_transactions_gift_card_idx").on(table.giftCardId),
  index("gift_card_transactions_salon_idx").on(table.salonId),
  index("gift_card_transactions_booking_idx").on(table.bookingId),
  index("gift_card_transactions_type_idx").on(table.transactionType),
  index("gift_card_transactions_created_at_idx").on(table.createdAt),
]);

export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
export type InsertGiftCardTransaction = typeof giftCardTransactions.$inferInsert;

// Gift Card Deliveries - Track delivery of gift cards
export const giftCardDeliveries = pgTable("gift_card_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: varchar("gift_card_id").notNull().references(() => giftCards.id, { onDelete: "cascade" }),
  
  // Delivery method
  deliveryMethod: varchar("delivery_method", { length: 20 }).notNull(),
  // Options: 'email', 'sms', 'whatsapp', 'print', 'in_app'
  
  // Recipient details
  recipientEmail: varchar("recipient_email", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  
  // Delivery status
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  // Options: 'pending', 'scheduled', 'sent', 'delivered', 'failed', 'bounced'
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at"), // When to send
  sentAt: timestamp("sent_at"), // When actually sent
  deliveredAt: timestamp("delivered_at"), // When confirmed delivered (email open, etc.)
  
  // Error tracking
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  
  // External service references
  externalMessageId: varchar("external_message_id", { length: 100 }), // SendGrid message ID, Twilio SID, etc.
  
  // Content tracking
  emailSubject: varchar("email_subject", { length: 255 }),
  emailTemplateId: varchar("email_template_id", { length: 100 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("gift_card_deliveries_gift_card_idx").on(table.giftCardId),
  index("gift_card_deliveries_status_idx").on(table.status),
  index("gift_card_deliveries_method_idx").on(table.deliveryMethod),
  index("gift_card_deliveries_scheduled_idx").on(table.scheduledAt),
]);

export type GiftCardDelivery = typeof giftCardDeliveries.$inferSelect;
export type InsertGiftCardDelivery = typeof giftCardDeliveries.$inferInsert;

// Gift Cards Relations
export const giftCardTemplatesRelations = relations(giftCardTemplates, ({ one, many }) => ({
  salon: one(salons, {
    fields: [giftCardTemplates.salonId],
    references: [salons.id],
  }),
  giftCards: many(giftCards),
}));

export const giftCardsRelations = relations(giftCards, ({ one, many }) => ({
  salon: one(salons, {
    fields: [giftCards.salonId],
    references: [salons.id],
  }),
  purchaser: one(users, {
    fields: [giftCards.purchasedBy],
    references: [users.id],
  }),
  template: one(giftCardTemplates, {
    fields: [giftCards.templateId],
    references: [giftCardTemplates.id],
  }),
  transactions: many(giftCardTransactions),
  deliveries: many(giftCardDeliveries),
}));

export const giftCardTransactionsRelations = relations(giftCardTransactions, ({ one }) => ({
  giftCard: one(giftCards, {
    fields: [giftCardTransactions.giftCardId],
    references: [giftCards.id],
  }),
  salon: one(salons, {
    fields: [giftCardTransactions.salonId],
    references: [salons.id],
  }),
  booking: one(bookings, {
    fields: [giftCardTransactions.bookingId],
    references: [bookings.id],
  }),
  performer: one(users, {
    fields: [giftCardTransactions.performedBy],
    references: [users.id],
  }),
}));

export const giftCardDeliveriesRelations = relations(giftCardDeliveries, ({ one }) => ({
  giftCard: one(giftCards, {
    fields: [giftCardDeliveries.giftCardId],
    references: [giftCards.id],
  }),
}));

// Gift Cards Zod Schemas
export const insertGiftCardTemplateSchema = createInsertSchema(giftCardTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGiftCardTemplateSchema = createInsertSchema(giftCardTemplates).omit({
  id: true,
  salonId: true,
  createdAt: true,
  createdBy: true,
}).partial();

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  salonId: true,
  code: true,
  originalValuePaisa: true,
  createdAt: true,
}).partial();

export const insertGiftCardTransactionSchema = createInsertSchema(giftCardTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCardDeliverySchema = createInsertSchema(giftCardDeliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Gift Card purchase request schema (for API validation)
export const purchaseGiftCardSchema = z.object({
  salonId: z.string(),
  templateId: z.string().optional(),
  valuePaisa: z.number().int().positive(),
  recipientName: z.string().max(100).optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().max(20).optional(),
  personalMessage: z.string().max(500).optional(),
  deliveryMethod: z.enum(['email', 'sms', 'whatsapp', 'print', 'in_app']).default('email'),
  scheduledDeliveryAt: z.string().datetime().optional(), // ISO date string for scheduling
});

export type PurchaseGiftCardRequest = z.infer<typeof purchaseGiftCardSchema>;

// Gift Card redemption request schema (for API validation)
export const redeemGiftCardSchema = z.object({
  code: z.string().max(20),
  bookingId: z.string(),
  amountPaisa: z.number().int().positive().optional(), // Optional for partial redemption
});

export type RedeemGiftCardRequest = z.infer<typeof redeemGiftCardSchema>;

// Gift Card validation request schema
export const validateGiftCardSchema = z.object({
  code: z.string().max(20),
  salonId: z.string().optional(), // Optional - to check if card is valid for specific salon
});

export type ValidateGiftCardRequest = z.infer<typeof validateGiftCardSchema>;

// =============================================================================
// FEATURE 4: SMART REBOOKING
// =============================================================================

// Service Rebooking Cycles - Define ideal rebooking intervals for each service
export const serviceRebookingCycles = pgTable("service_rebooking_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  
  // Rebooking cycle configuration
  recommendedDays: integer("recommended_days").notNull().default(30), // Days until next rebooking recommended
  minDays: integer("min_days").notNull().default(14), // Minimum days before suggesting rebooking
  maxDays: integer("max_days").notNull().default(60), // Maximum days before urgent rebooking needed
  
  // Reminder settings
  reminderEnabled: integer("reminder_enabled").notNull().default(1), // 1 = send reminders
  firstReminderDays: integer("first_reminder_days").notNull().default(3), // Days before due date to send first reminder
  secondReminderDays: integer("second_reminder_days"), // Days after due date to send second reminder (optional)
  
  // Reminder channels
  reminderChannels: text("reminder_channels").array().default(sql`ARRAY['email']::text[]`), // 'email', 'sms', 'push', 'whatsapp'
  
  // Customization
  customMessage: text("custom_message"), // Custom reminder message template
  
  // Analytics
  avgCompletionRate: decimal("avg_completion_rate", { precision: 5, scale: 2 }).default('0.00'), // Percentage of customers who rebook
  avgDaysBetweenBookings: decimal("avg_days_between_bookings", { precision: 6, scale: 2 }), // Actual average days between bookings
  
  // Status
  isActive: integer("is_active").notNull().default(1),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("service_rebooking_cycles_salon_idx").on(table.salonId),
  index("service_rebooking_cycles_service_idx").on(table.serviceId),
  index("service_rebooking_cycles_active_idx").on(table.isActive),
  unique("service_rebooking_cycles_salon_service_unique").on(table.salonId, table.serviceId),
]);

export type ServiceRebookingCycle = typeof serviceRebookingCycles.$inferSelect;
export type InsertServiceRebookingCycle = typeof serviceRebookingCycles.$inferInsert;

// Customer Rebooking Stats - Track individual customer rebooking patterns
export const customerRebookingStats = pgTable("customer_rebooking_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  
  // Booking history
  totalBookings: integer("total_bookings").notNull().default(0), // Total times booked this service
  lastBookingId: varchar("last_booking_id").references(() => bookings.id, { onDelete: "set null" }),
  lastBookingDate: timestamp("last_booking_date"),
  
  // Next rebooking
  nextRebookingDue: timestamp("next_rebooking_due"), // Calculated date when rebooking is recommended
  rebookingStatus: varchar("rebooking_status", { length: 20 }).notNull().default('not_due'),
  // Options: 'not_due', 'approaching', 'due', 'overdue', 'booked', 'dismissed'
  
  // Customer behavior tracking
  avgDaysBetweenBookings: decimal("avg_days_between_bookings", { precision: 6, scale: 2 }), // Customer's actual average
  preferredDayOfWeek: integer("preferred_day_of_week"), // 0-6 (Sunday-Saturday)
  preferredTimeSlot: varchar("preferred_time_slot", { length: 20 }), // 'morning', 'afternoon', 'evening'
  preferredStaffId: varchar("preferred_staff_id").references(() => staff.id, { onDelete: "set null" }),
  
  // Engagement
  remindersReceived: integer("reminders_received").notNull().default(0),
  remindersDismissed: integer("reminders_dismissed").notNull().default(0),
  rebookingsFromReminders: integer("rebookings_from_reminders").notNull().default(0), // Conversions
  
  // Last interaction
  lastReminderSentAt: timestamp("last_reminder_sent_at"),
  lastDismissedAt: timestamp("last_dismissed_at"),
  dismissUntil: timestamp("dismiss_until"), // Customer can snooze reminders
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("customer_rebooking_stats_salon_idx").on(table.salonId),
  index("customer_rebooking_stats_customer_idx").on(table.customerId),
  index("customer_rebooking_stats_service_idx").on(table.serviceId),
  index("customer_rebooking_stats_next_due_idx").on(table.nextRebookingDue),
  index("customer_rebooking_stats_status_idx").on(table.rebookingStatus),
  unique("customer_rebooking_stats_unique").on(table.salonId, table.customerId, table.serviceId),
]);

export type CustomerRebookingStat = typeof customerRebookingStats.$inferSelect;
export type InsertCustomerRebookingStat = typeof customerRebookingStats.$inferInsert;

// Rebooking Reminders - Track individual reminder deliveries
export const rebookingReminders = pgTable("rebooking_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  customerStatId: varchar("customer_stat_id").references(() => customerRebookingStats.id, { onDelete: "cascade" }),
  
  // Reminder details
  reminderType: varchar("reminder_type", { length: 20 }).notNull().default('first'),
  // Options: 'first', 'second', 'final', 'custom'
  
  channel: varchar("channel", { length: 20 }).notNull(), // 'email', 'sms', 'push', 'whatsapp'
  
  // Message content
  subject: varchar("subject", { length: 255 }),
  messageBody: text("message_body"),
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  // Options: 'pending', 'scheduled', 'sent', 'delivered', 'failed', 'opened', 'clicked', 'dismissed', 'converted'
  
  // Delivery tracking
  externalMessageId: varchar("external_message_id", { length: 100 }), // SendGrid/Twilio ID
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  
  // Conversion tracking
  convertedBookingId: varchar("converted_booking_id").references(() => bookings.id, { onDelete: "set null" }),
  convertedAt: timestamp("converted_at"),
  
  // Error handling
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  
  // Customer action
  dismissedAt: timestamp("dismissed_at"),
  dismissReason: varchar("dismiss_reason", { length: 50 }), // 'not_interested', 'already_booked', 'snooze', 'unsubscribe'
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("rebooking_reminders_salon_idx").on(table.salonId),
  index("rebooking_reminders_customer_idx").on(table.customerId),
  index("rebooking_reminders_service_idx").on(table.serviceId),
  index("rebooking_reminders_scheduled_idx").on(table.scheduledAt),
  index("rebooking_reminders_status_idx").on(table.status),
  index("rebooking_reminders_sent_at_idx").on(table.sentAt),
]);

export type RebookingReminder = typeof rebookingReminders.$inferSelect;
export type InsertRebookingReminder = typeof rebookingReminders.$inferInsert;

// Rebooking Settings - Salon-level configuration
export const rebookingSettings = pgTable("rebooking_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }).unique(),
  
  // Global enable/disable
  isEnabled: integer("is_enabled").notNull().default(1),
  
  // Default cycle settings (used when service doesn't have specific settings)
  defaultRecommendedDays: integer("default_recommended_days").notNull().default(30),
  defaultMinDays: integer("default_min_days").notNull().default(14),
  defaultMaxDays: integer("default_max_days").notNull().default(60),
  
  // Default reminder settings
  defaultReminderEnabled: integer("default_reminder_enabled").notNull().default(1),
  defaultFirstReminderDays: integer("default_first_reminder_days").notNull().default(3),
  defaultSecondReminderDays: integer("default_second_reminder_days"),
  defaultReminderChannels: text("default_reminder_channels").array().default(sql`ARRAY['email']::text[]`),
  
  // Incentive settings
  enableRebookingDiscount: integer("enable_rebooking_discount").notNull().default(0),
  rebookingDiscountPercent: decimal("rebooking_discount_percent", { precision: 5, scale: 2 }).default('0.00'),
  discountValidDays: integer("discount_valid_days").notNull().default(7), // Days after due date discount is valid
  
  // Communication preferences
  maxRemindersPerService: integer("max_reminders_per_service").notNull().default(2),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }), // e.g., "21:00"
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }), // e.g., "09:00"
  
  // Opt-out management
  respectCustomerOptOut: integer("respect_customer_opt_out").notNull().default(1),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("rebooking_settings_salon_idx").on(table.salonId),
]);

export type RebookingSettings = typeof rebookingSettings.$inferSelect;
export type InsertRebookingSettings = typeof rebookingSettings.$inferInsert;

// Smart Rebooking Relations
export const serviceRebookingCyclesRelations = relations(serviceRebookingCycles, ({ one }) => ({
  salon: one(salons, {
    fields: [serviceRebookingCycles.salonId],
    references: [salons.id],
  }),
  service: one(services, {
    fields: [serviceRebookingCycles.serviceId],
    references: [services.id],
  }),
}));

export const customerRebookingStatsRelations = relations(customerRebookingStats, ({ one }) => ({
  salon: one(salons, {
    fields: [customerRebookingStats.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [customerRebookingStats.customerId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [customerRebookingStats.serviceId],
    references: [services.id],
  }),
  lastBooking: one(bookings, {
    fields: [customerRebookingStats.lastBookingId],
    references: [bookings.id],
  }),
  preferredStaff: one(staff, {
    fields: [customerRebookingStats.preferredStaffId],
    references: [staff.id],
  }),
}));

export const rebookingRemindersRelations = relations(rebookingReminders, ({ one }) => ({
  salon: one(salons, {
    fields: [rebookingReminders.salonId],
    references: [salons.id],
  }),
  customer: one(users, {
    fields: [rebookingReminders.customerId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [rebookingReminders.serviceId],
    references: [services.id],
  }),
  customerStat: one(customerRebookingStats, {
    fields: [rebookingReminders.customerStatId],
    references: [customerRebookingStats.id],
  }),
  convertedBooking: one(bookings, {
    fields: [rebookingReminders.convertedBookingId],
    references: [bookings.id],
  }),
}));

export const rebookingSettingsRelations = relations(rebookingSettings, ({ one }) => ({
  salon: one(salons, {
    fields: [rebookingSettings.salonId],
    references: [salons.id],
  }),
}));

// Smart Rebooking Zod Schemas
export const insertServiceRebookingCycleSchema = createInsertSchema(serviceRebookingCycles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  avgCompletionRate: true,
  avgDaysBetweenBookings: true,
});

export const updateServiceRebookingCycleSchema = createInsertSchema(serviceRebookingCycles).omit({
  id: true,
  salonId: true,
  serviceId: true,
  createdAt: true,
  createdBy: true,
}).partial();

export const insertCustomerRebookingStatSchema = createInsertSchema(customerRebookingStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCustomerRebookingStatSchema = createInsertSchema(customerRebookingStats).omit({
  id: true,
  salonId: true,
  customerId: true,
  serviceId: true,
  createdAt: true,
}).partial();

export const insertRebookingReminderSchema = createInsertSchema(rebookingReminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRebookingSettingsSchema = createInsertSchema(rebookingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRebookingSettingsSchema = createInsertSchema(rebookingSettings).omit({
  id: true,
  salonId: true,
  createdAt: true,
}).partial();

// API request schemas for Smart Rebooking
export const createRebookingCycleSchema = z.object({
  serviceId: z.string(),
  recommendedDays: z.number().int().positive().default(30),
  minDays: z.number().int().positive().default(14),
  maxDays: z.number().int().positive().default(60),
  reminderEnabled: z.boolean().default(true),
  firstReminderDays: z.number().int().positive().default(3),
  secondReminderDays: z.number().int().positive().optional(),
  reminderChannels: z.array(z.enum(['email', 'sms', 'push', 'whatsapp'])).default(['email']),
  customMessage: z.string().max(500).optional(),
});

export type CreateRebookingCycleRequest = z.infer<typeof createRebookingCycleSchema>;

export const updateRebookingCycleSchema = createRebookingCycleSchema.partial();

export type UpdateRebookingCycleRequest = z.infer<typeof updateRebookingCycleSchema>;

export const updateRebookingSettingsRequestSchema = z.object({
  isEnabled: z.boolean().optional(),
  defaultRecommendedDays: z.number().int().positive().optional(),
  defaultMinDays: z.number().int().positive().optional(),
  defaultMaxDays: z.number().int().positive().optional(),
  defaultReminderEnabled: z.boolean().optional(),
  defaultFirstReminderDays: z.number().int().positive().optional(),
  defaultSecondReminderDays: z.number().int().positive().optional(),
  defaultReminderChannels: z.array(z.enum(['email', 'sms', 'push', 'whatsapp'])).optional(),
  enableRebookingDiscount: z.boolean().optional(),
  rebookingDiscountPercent: z.number().min(0).max(100).optional(),
  discountValidDays: z.number().int().positive().optional(),
  maxRemindersPerService: z.number().int().positive().max(5).optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  respectCustomerOptOut: z.boolean().optional(),
});

export type UpdateRebookingSettingsRequest = z.infer<typeof updateRebookingSettingsRequestSchema>;

// Customer rebooking suggestion response type
export const rebookingSuggestionSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  salonId: z.string(),
  salonName: z.string(),
  lastBookingDate: z.string(),
  dueDate: z.string(),
  daysOverdue: z.number(),
  status: z.enum(['approaching', 'due', 'overdue']),
  preferredStaffId: z.string().optional(),
  preferredStaffName: z.string().optional(),
  preferredDayOfWeek: z.number().optional(),
  preferredTimeSlot: z.string().optional(),
  discountAvailable: z.boolean().default(false),
  discountPercent: z.number().optional(),
});

export type RebookingSuggestion = z.infer<typeof rebookingSuggestionSchema>;

// Dismiss rebooking reminder schema
export const dismissRebookingSchema = z.object({
  serviceId: z.string(),
  salonId: z.string(),
  reason: z.enum(['not_interested', 'already_booked', 'snooze', 'unsubscribe']),
  snoozeDays: z.number().int().positive().max(90).optional(), // Only for snooze reason
});

export type DismissRebookingRequest = z.infer<typeof dismissRebookingSchema>;

// ==========================================
// ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
// ==========================================

// Shop Role Types - defines available roles at shop level
export const shopRoleTypes = ['business_owner', 'shop_admin', 'staff'] as const;
export type ShopRoleType = typeof shopRoleTypes[number];

// Permission Categories - groups of related permissions
export const permissionCategories = [
  'shop_management',
  'staff_management', 
  'services_products',
  'bookings',
  'events',
  'analytics',
  'settings',
  'gift_cards',
  'chat'
] as const;
export type PermissionCategory = typeof permissionCategories[number];

// Permissions table - granular permission definitions
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 100 }).notNull().unique(), // e.g., 'shop.edit', 'staff.create', 'booking.manage'
  name: varchar("name", { length: 100 }).notNull(), // Human-readable name
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // shop_management, staff_management, etc.
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("permissions_category_idx").on(table.category),
  index("permissions_code_idx").on(table.code),
]);

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

// Role Permissions - maps shop roles to permissions
export const shopRolePermissions = pgTable("shop_role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: varchar("role", { length: 50 }).notNull(), // 'business_owner', 'shop_admin', 'staff'
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("shop_role_permissions_role_idx").on(table.role),
  uniqueIndex("shop_role_permissions_unique").on(table.role, table.permissionId),
]);

export const insertShopRolePermissionSchema = createInsertSchema(shopRolePermissions).omit({
  id: true,
  createdAt: true,
});

export type InsertShopRolePermission = z.infer<typeof insertShopRolePermissionSchema>;
export type ShopRolePermission = typeof shopRolePermissions.$inferSelect;

// Shop Role Assignments - assigns users to specific salons with roles
export const shopRoleAssignments = pgTable("shop_role_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(), // 'shop_admin', 'staff'
  assignedBy: varchar("assigned_by").references(() => users.id, { onDelete: "set null" }), // Who assigned this role
  isActive: integer("is_active").notNull().default(1),
  assignedAt: timestamp("assigned_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"), // Optional notes about the assignment
}, (table) => [
  index("shop_role_assignments_user_idx").on(table.userId),
  index("shop_role_assignments_salon_idx").on(table.salonId),
  index("shop_role_assignments_role_idx").on(table.role),
  // Unique active assignment per user per salon (user can only have one active role per salon)
  uniqueIndex("shop_role_assignments_active_unique").on(table.userId, table.salonId)
    .where(sql`${table.isActive} = 1`),
]);

export const insertShopRoleAssignmentSchema = createInsertSchema(shopRoleAssignments).omit({
  id: true,
  assignedAt: true,
  revokedAt: true,
});

export type InsertShopRoleAssignment = z.infer<typeof insertShopRoleAssignmentSchema>;
export type ShopRoleAssignment = typeof shopRoleAssignments.$inferSelect;

// Admin Audit Logs - tracks all permission changes and admin actions
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Who performed the action
  salonId: varchar("salon_id").references(() => salons.id, { onDelete: "cascade" }), // Which salon (null for org-level)
  action: varchar("action", { length: 100 }).notNull(), // 'role_assigned', 'role_revoked', 'permission_changed', etc.
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }), // User affected by action
  previousValue: jsonb("previous_value"), // Previous state before change
  newValue: jsonb("new_value"), // New state after change
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("admin_audit_logs_user_idx").on(table.userId),
  index("admin_audit_logs_salon_idx").on(table.salonId),
  index("admin_audit_logs_action_idx").on(table.action),
  index("admin_audit_logs_created_at_idx").on(table.createdAt),
]);

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;

// Relations for RBAC tables
export const shopRoleAssignmentsRelations = relations(shopRoleAssignments, ({ one }) => ({
  user: one(users, {
    fields: [shopRoleAssignments.userId],
    references: [users.id],
  }),
  salon: one(salons, {
    fields: [shopRoleAssignments.salonId],
    references: [salons.id],
  }),
  assignedByUser: one(users, {
    fields: [shopRoleAssignments.assignedBy],
    references: [users.id],
    relationName: 'assignedBy',
  }),
}));

export const shopRolePermissionsRelations = relations(shopRolePermissions, ({ one }) => ({
  permission: one(permissions, {
    fields: [shopRolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  user: one(users, {
    fields: [adminAuditLogs.userId],
    references: [users.id],
    relationName: 'performer',
  }),
  salon: one(salons, {
    fields: [adminAuditLogs.salonId],
    references: [salons.id],
  }),
  targetUser: one(users, {
    fields: [adminAuditLogs.targetUserId],
    references: [users.id],
    relationName: 'target',
  }),
}));

// API Request Schemas for Shop Admin Management
export const assignShopRoleSchema = z.object({
  userId: z.string(),
  salonId: z.string(),
  role: z.enum(['shop_admin', 'staff']),
  notes: z.string().max(500).optional(),
});

export type AssignShopRoleRequest = z.infer<typeof assignShopRoleSchema>;

export const revokeShopRoleSchema = z.object({
  userId: z.string(),
  salonId: z.string(),
});

export type RevokeShopRoleRequest = z.infer<typeof revokeShopRoleSchema>;

export const updateShopRoleSchema = z.object({
  userId: z.string(),
  salonId: z.string(),
  newRole: z.enum(['shop_admin', 'staff']),
  notes: z.string().max(500).optional(),
});

export type UpdateShopRoleRequest = z.infer<typeof updateShopRoleSchema>;

// Permission check response type
export const userSalonPermissionsSchema = z.object({
  userId: z.string(),
  salonId: z.string(),
  role: z.enum(['business_owner', 'shop_admin', 'staff']),
  permissions: z.array(z.string()), // Array of permission codes
  isBusinessOwner: z.boolean(),
});

export type UserSalonPermissions = z.infer<typeof userSalonPermissionsSchema>;

// Shop admin list response type
export const shopAdminListItemSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().nullable(),
  userPhone: z.string().nullable(),
  userProfileImage: z.string().nullable(),
  role: z.enum(['shop_admin', 'staff']),
  assignedAt: z.string(),
  assignedByName: z.string().nullable(),
  isActive: z.boolean(),
});

export type ShopAdminListItem = z.infer<typeof shopAdminListItemSchema>;
