import { pgTable, foreignKey, varchar, text, integer, timestamp, unique, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const payments = pgTable("payments", {
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
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
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
        username: text().notNull(),
        password: text().notNull(),
}, (table) => [
        unique("users_username_unique").on(table.username),
]);

export const salons = pgTable("salons", {
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
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
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
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
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
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

export const beautyProducts = pgTable("beauty_products", {
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
        brand: text().notNull(),
        productLine: text("product_line"),
        name: text().notNull(),
        category: varchar({ length: 50 }).notNull(),
        shade: text(),
        sku: text().notNull(),
        finishType: text("finish_type"),
        skinToneCompatibility: text("skin_tone_compatibility"),
        price: integer().notNull(),
        imageUrl: text("image_url"),
        description: text(),
        createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
        unique("beauty_products_sku_unique").on(table.sku),
]);

export const effectPresets = pgTable("effect_presets", {
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
        name: text().notNull(),
        category: varchar({ length: 50 }).notNull(),
        deeparEffectFile: text("deepar_effect_file"),
        lookTags: text("look_tags"),
        associatedProducts: text("associated_products"),
        createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const salonInventory = pgTable("salon_inventory", {
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
        salonId: varchar("salon_id").notNull(),
        productId: varchar("product_id").notNull(),
        quantity: integer().default(0).notNull(),
        lowStockThreshold: integer("low_stock_threshold").default(5),
        lastRestockedAt: timestamp("last_restocked_at", { mode: 'string' }),
        createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
        foreignKey({
                        columns: [table.salonId],
                        foreignColumns: [salons.id],
                        name: "salon_inventory_salon_id_fk"
                }),
        foreignKey({
                        columns: [table.productId],
                        foreignColumns: [beautyProducts.id],
                        name: "salon_inventory_product_id_fk"
                }),
        unique("salon_inventory_salon_product_unique").on(table.salonId, table.productId),
]);

export const aiLookSessions = pgTable("ai_look_sessions", {
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
        salonId: varchar("salon_id").notNull(),
        customerName: text("customer_name").notNull(),
        customerPhotoUrl: text("customer_photo_url"),
        eventType: varchar("event_type", { length: 50 }),
        weather: varchar({ length: 50 }),
        location: varchar({ length: 50 }),
        skinTone: varchar("skin_tone", { length: 50 }),
        hairType: varchar("hair_type", { length: 50 }),
        staffUserId: varchar("staff_user_id"),
        createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
        foreignKey({
                        columns: [table.salonId],
                        foreignColumns: [salons.id],
                        name: "ai_look_sessions_salon_id_fk"
                }),
        foreignKey({
                        columns: [table.staffUserId],
                        foreignColumns: [users.id],
                        name: "ai_look_sessions_staff_user_id_fk"
                }),
]);

export const aiLookOptions = pgTable("ai_look_options", {
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
        sessionId: varchar("session_id").notNull(),
        lookName: text("look_name").notNull(),
        description: text(),
        presetIds: text("preset_ids"),
        aiConfidenceScore: numeric("ai_confidence_score", { precision: 5, scale: 2 }),
        isSelected: integer("is_selected").default(0).notNull(),
        previewImageUrl: text("preview_image_url"),
        createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
        foreignKey({
                        columns: [table.sessionId],
                        foreignColumns: [aiLookSessions.id],
                        name: "ai_look_options_session_id_fk"
                }),
]);

export const aiLookProducts = pgTable("ai_look_products", {
        id: varchar().default(sql`gen_random_uuid()`).primaryKey().notNull(),
        lookOptionId: varchar("look_option_id").notNull(),
        productId: varchar("product_id").notNull(),
        applicationArea: text("application_area"),
        applicationInstructions: text("application_instructions"),
        quantityNeeded: text("quantity_needed"),
        isInStock: integer("is_in_stock").default(1).notNull(),
        substituteProductId: varchar("substitute_product_id"),
        createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
        foreignKey({
                        columns: [table.lookOptionId],
                        foreignColumns: [aiLookOptions.id],
                        name: "ai_look_products_look_option_id_fk"
                }),
        foreignKey({
                        columns: [table.productId],
                        foreignColumns: [beautyProducts.id],
                        name: "ai_look_products_product_id_fk"
                }),
        foreignKey({
                        columns: [table.substituteProductId],
                        foreignColumns: [beautyProducts.id],
                        name: "ai_look_products_substitute_product_id_fk"
                }),
]);
