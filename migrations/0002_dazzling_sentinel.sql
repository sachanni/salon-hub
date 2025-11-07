CREATE TABLE "geocode_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" varchar(255),
	"formatted_address" text NOT NULL,
	"normalized_hash" varchar(64),
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"viewport" jsonb,
	"location_type" varchar(30),
	"confidence" varchar(20) DEFAULT 'medium' NOT NULL,
	"source" varchar(50) DEFAULT 'google_places' NOT NULL,
	"raw_response" jsonb,
	"verified_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"needs_review" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "geocode_locations_place_id_unique" UNIQUE("place_id")
);
--> statement-breakpoint
CREATE TABLE "google_places_cache" (
	"place_id" text PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"rating" numeric(3, 2),
	"review_count" integer DEFAULT 0,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "launch_offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"instant_discount_percent" integer,
	"wallet_cashback_percent" integer,
	"wallet_bonus_in_paisa" integer,
	"max_usage_per_user" integer,
	"minimum_purchase_in_paisa" integer,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "location_aliases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_query" varchar(255) NOT NULL,
	"original_query" varchar(255) NOT NULL,
	"place_id" varchar(255) NOT NULL,
	"match_type" varchar(20) DEFAULT 'exact' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"locale" varchar(10) DEFAULT 'en',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_otps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_commissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"salon_id" varchar NOT NULL,
	"booking_amount_paisa" integer NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"commission_amount_paisa" integer NOT NULL,
	"salon_earnings_paisa" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" varchar(100) NOT NULL,
	"config_value" jsonb NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "platform_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "platform_offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar,
	"owned_by_salon_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" integer NOT NULL,
	"minimum_purchase" integer,
	"max_discount" integer,
	"valid_from" timestamp NOT NULL,
	"valid_until" timestamp NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"is_platform_wide" integer DEFAULT 0 NOT NULL,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"approval_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approval_notes" text,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"auto_approved" integer DEFAULT 0 NOT NULL,
	"requires_approval_on_edit" integer DEFAULT 0 NOT NULL,
	"last_edited_by" varchar,
	"last_edited_at" timestamp,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "platform_payouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"amount_paisa" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"payment_details" jsonb,
	"approved_by" varchar,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salon_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"customer_id" varchar,
	"booking_id" varchar,
	"rating" integer NOT NULL,
	"comment" text,
	"source" varchar(20) DEFAULT 'salonhub' NOT NULL,
	"google_author_name" text,
	"google_author_photo" text,
	"google_review_id" text,
	"is_verified" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"google_published_at" timestamp,
	CONSTRAINT "salon_reviews_rating_check" CHECK ("salon_reviews"."rating" >= 1 AND "salon_reviews"."rating" <= 5),
	CONSTRAINT "salon_reviews_source_check" CHECK ("salon_reviews"."source" IN ('salonhub', 'google'))
);
--> statement-breakpoint
CREATE TABLE "service_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"sub_category" varchar(100),
	"gender" varchar(10) NOT NULL,
	"suggested_duration_minutes" integer NOT NULL,
	"suggested_price_in_paisa" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"is_popular" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"tags" text[],
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_templates_name_category_gender_unique" UNIQUE("name","category","gender")
);
--> statement-breakpoint
CREATE TABLE "user_offer_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"offer_id" varchar NOT NULL,
	"booking_id" varchar NOT NULL,
	"discount_applied_in_paisa" integer NOT NULL,
	"usage_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"balance_in_paisa" integer DEFAULT 0 NOT NULL,
	"lifetime_earned_in_paisa" integer DEFAULT 0 NOT NULL,
	"lifetime_spent_in_paisa" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount_in_paisa" integer NOT NULL,
	"reason" text NOT NULL,
	"booking_id" varchar,
	"offer_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "currency" SET DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "offer_id" varchar;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "offer_title" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "offer_discount_type" varchar(20);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "offer_discount_value" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "original_amount_paisa" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "discount_amount_paisa" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "final_amount_paisa" integer;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "shop_number" text;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "google_place_id" text;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "google_rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "google_review_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "google_rating_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "approval_status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "approved_by" varchar;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "sub_category" varchar(100);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "gender" varchar(10);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "approval_status" varchar(20) DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "is_custom_service" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "price_type" varchar(20) DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "product_cost_paisa" integer;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "special_price_paisa" integer;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "is_combo_service" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "combo_service_ids" text[];--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "template_id" varchar;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "work_preference" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_category" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pan_number" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gst_number" varchar(15);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "platform_commissions" ADD CONSTRAINT "platform_commissions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_commissions" ADD CONSTRAINT "platform_commissions_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_config" ADD CONSTRAINT "platform_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_offers" ADD CONSTRAINT "platform_offers_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_offers" ADD CONSTRAINT "platform_offers_owned_by_salon_id_salons_id_fk" FOREIGN KEY ("owned_by_salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_offers" ADD CONSTRAINT "platform_offers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_offers" ADD CONSTRAINT "platform_offers_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_offers" ADD CONSTRAINT "platform_offers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_offers" ADD CONSTRAINT "platform_offers_last_edited_by_users_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_payouts" ADD CONSTRAINT "platform_payouts_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_payouts" ADD CONSTRAINT "platform_payouts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_reviews" ADD CONSTRAINT "salon_reviews_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_reviews" ADD CONSTRAINT "salon_reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salon_reviews" ADD CONSTRAINT "salon_reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_offer_usage" ADD CONSTRAINT "user_offer_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_offer_usage" ADD CONSTRAINT "user_offer_usage_offer_id_platform_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."platform_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_user_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_offer_id_platform_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."platform_offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "geocode_locations_place_id_idx" ON "geocode_locations" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "geocode_locations_hash_idx" ON "geocode_locations" USING btree ("normalized_hash");--> statement-breakpoint
CREATE INDEX "geocode_locations_expires_idx" ON "geocode_locations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "geocode_locations_coords_idx" ON "geocode_locations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "google_places_cache_lat_lng_idx" ON "google_places_cache" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "google_places_cache_expires_at_idx" ON "google_places_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "google_places_cache_business_name_idx" ON "google_places_cache" USING btree ("business_name");--> statement-breakpoint
CREATE INDEX "location_aliases_normalized_idx" ON "location_aliases" USING btree ("normalized_query");--> statement-breakpoint
CREATE INDEX "location_aliases_place_id_idx" ON "location_aliases" USING btree ("place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "location_aliases_query_unique" ON "location_aliases" USING btree ("normalized_query","place_id");--> statement-breakpoint
CREATE INDEX "platform_offers_owned_by_salon_id_idx" ON "platform_offers" USING btree ("owned_by_salon_id");--> statement-breakpoint
CREATE INDEX "salon_reviews_salon_id_idx" ON "salon_reviews" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "salon_reviews_source_idx" ON "salon_reviews" USING btree ("source");--> statement-breakpoint
CREATE INDEX "salon_reviews_google_review_id_idx" ON "salon_reviews" USING btree ("google_review_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salon_reviews_google_unique" ON "salon_reviews" USING btree ("salon_id","google_review_id") WHERE "salon_reviews"."source" = 'google' AND "salon_reviews"."google_review_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "service_templates_category_idx" ON "service_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "service_templates_gender_idx" ON "service_templates" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "service_templates_popular_idx" ON "service_templates" USING btree ("is_popular");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_offer_id_platform_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."platform_offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salons" ADD CONSTRAINT "salons_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "salons_google_place_id_idx" ON "salons" USING btree ("google_place_id");--> statement-breakpoint
CREATE INDEX "services_gender_idx" ON "services" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "services_category_idx" ON "services" USING btree ("category");--> statement-breakpoint
CREATE INDEX "services_approval_status_idx" ON "services" USING btree ("approval_status");