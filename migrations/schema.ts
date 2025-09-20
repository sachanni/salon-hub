import { pgTable, foreignKey, varchar, text, integer, timestamp, unique, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const payments = pgTable("payments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	bookingId: varchar("booking_id").notNull(),
	razorpayOrderId: text("razorpay_order_id"),
	razorpayPaymentId: text("razorpay_payment_id"),
	razorpaySignature: text("razorpay_signature"),
	amountPaisa: integer("amount_paisa").notNull(),
	currency: varchar({ length: 3 }).default('INR').notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "payments_booking_id_bookings_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const salons = pgTable("salons", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	address: text().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	zipCode: text("zip_code").notNull(),
	phone: text().notNull(),
	email: text().notNull(),
	website: text(),
	category: varchar({ length: 50 }).notNull(),
	priceRange: varchar("price_range", { length: 10 }).notNull(),
	rating: numeric({ precision: 3, scale:  2 }).default('0.00'),
	reviewCount: integer("review_count").default(0).notNull(),
	imageUrl: text("image_url"),
	openTime: text("open_time"),
	closeTime: text("close_time"),
	isActive: integer("is_active").default(1).notNull(),
	ownerId: varchar("owner_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "salons_owner_id_fkey"
		}),
]);

export const services = pgTable("services", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	durationMinutes: integer("duration_minutes").notNull(),
	priceInPaisa: integer("price_in_paisa").notNull(),
	currency: varchar({ length: 3 }).default('INR').notNull(),
	isActive: integer("is_active").default(1).notNull(),
	salonId: varchar("salon_id"),
	category: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const bookings = pgTable("bookings", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	serviceId: varchar("service_id").notNull(),
	customerName: text("customer_name").notNull(),
	customerEmail: text("customer_email").notNull(),
	customerPhone: text("customer_phone").notNull(),
	salonName: text("salon_name"),
	bookingDate: text("booking_date").notNull(),
	bookingTime: text("booking_time").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	totalAmountPaisa: integer("total_amount_paisa").notNull(),
	currency: varchar({ length: 3 }).default('INR').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	salonId: varchar("salon_id"),
	notes: text(),
	guestSessionId: text("guest_session_id"),
}, (table) => [
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "bookings_service_id_services_id_fk"
		}),
]);
