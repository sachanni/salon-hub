CREATE TABLE "ab_test_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"campaign_name" varchar(200) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"base_template_id" varchar NOT NULL,
	"test_type" varchar(50) NOT NULL,
	"target_segment_id" varchar,
	"sample_size_percentage" integer DEFAULT 100 NOT NULL,
	"test_duration" integer DEFAULT 7 NOT NULL,
	"confidence_level" integer DEFAULT 95 NOT NULL,
	"success_metric" varchar(50) DEFAULT 'open_rate' NOT NULL,
	"winner_selection_criteria" varchar(50) DEFAULT 'statistical_significance' NOT NULL,
	"auto_optimization" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_by" varchar,
	CONSTRAINT "sample_size_valid" CHECK (sample_size_percentage >= 1 AND sample_size_percentage <= 100),
	CONSTRAINT "test_duration_valid" CHECK (test_duration >= 1),
	CONSTRAINT "confidence_level_valid" CHECK (confidence_level IN (90, 95, 99)),
	CONSTRAINT "auto_optimization_valid" CHECK (auto_optimization IN (0,1))
);
--> statement-breakpoint
CREATE TABLE "automated_action_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"configuration_id" varchar,
	"campaign_id" varchar,
	"test_campaign_id" varchar,
	"recommendation_id" varchar,
	"action_type" varchar(50) NOT NULL,
	"action_description" text NOT NULL,
	"action_data" jsonb DEFAULT '{}',
	"triggered_by" varchar(50) NOT NULL,
	"trigger_data" jsonb DEFAULT '{}',
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"result_data" jsonb DEFAULT '{}',
	"error_message" text,
	"performance_impact" jsonb DEFAULT '{}',
	"execution_time_ms" integer,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "automation_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"configuration_name" varchar(100) NOT NULL,
	"is_enabled" integer DEFAULT 1 NOT NULL,
	"enable_variant_generation" integer DEFAULT 1 NOT NULL,
	"max_variants_per_test" integer DEFAULT 4 NOT NULL,
	"variant_generation_types" jsonb DEFAULT '["subject_line", "content", "send_time"]',
	"enable_performance_monitoring" integer DEFAULT 1 NOT NULL,
	"monitoring_interval_minutes" integer DEFAULT 15 NOT NULL,
	"performance_alert_threshold" numeric(5, 4) DEFAULT '0.0500',
	"enable_auto_winner_selection" integer DEFAULT 0 NOT NULL,
	"auto_winner_confidence_level" integer DEFAULT 95 NOT NULL,
	"minimum_test_duration_hours" integer DEFAULT 24 NOT NULL,
	"minimum_sample_size" integer DEFAULT 100 NOT NULL,
	"enable_campaign_optimization" integer DEFAULT 1 NOT NULL,
	"optimization_types" jsonb DEFAULT '["send_time", "frequency", "channel"]',
	"learning_data_days" integer DEFAULT 30 NOT NULL,
	"business_rules" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "automation_configurations_salon_name_unique" UNIQUE("salon_id","configuration_name"),
	CONSTRAINT "max_variants_valid" CHECK (max_variants_per_test >= 2 AND max_variants_per_test <= 10),
	CONSTRAINT "monitoring_interval_valid" CHECK (monitoring_interval_minutes >= 5 AND monitoring_interval_minutes <= 1440),
	CONSTRAINT "confidence_level_valid" CHECK (auto_winner_confidence_level IN (90, 95, 99)),
	CONSTRAINT "duration_valid" CHECK (minimum_test_duration_hours >= 1 AND minimum_test_duration_hours <= 168),
	CONSTRAINT "sample_size_valid" CHECK (minimum_sample_size >= 10)
);
--> statement-breakpoint
CREATE TABLE "availability_patterns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"staff_id" varchar,
	"pattern_name" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"effective_from" timestamp DEFAULT now(),
	"effective_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "availability_patterns_id_salon_id_unique" UNIQUE("id","salon_id")
);
--> statement-breakpoint
CREATE TABLE "booking_services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"service_id" varchar NOT NULL,
	"salon_id" varchar NOT NULL,
	"price_in_paisa" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "booking_services_booking_id_sequence_unique" UNIQUE("booking_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "booking_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/New_York' NOT NULL,
	"lead_time_minutes" integer DEFAULT 60 NOT NULL,
	"cancel_window_minutes" integer DEFAULT 1440 NOT NULL,
	"buffer_minutes" integer DEFAULT 15 NOT NULL,
	"deposit_percentage" integer DEFAULT 0 NOT NULL,
	"deposit_type" varchar(20) DEFAULT 'percentage',
	"deposit_amount_fixed" integer DEFAULT 0,
	"auto_confirm" integer DEFAULT 1 NOT NULL,
	"allow_cancellation" integer DEFAULT 1 NOT NULL,
	"allow_reschedule" integer DEFAULT 1 NOT NULL,
	"max_advance_booking_days" integer DEFAULT 90 NOT NULL,
	"max_concurrent_bookings" integer DEFAULT 1,
	"allow_group_bookings" integer DEFAULT 0,
	"max_group_size" integer DEFAULT 1,
	"send_automated_reminders" integer DEFAULT 1,
	"reminder_hours_before" integer DEFAULT 24,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "booking_settings_salon_id_unique" UNIQUE("salon_id"),
	CONSTRAINT "lead_time_positive" CHECK (lead_time_minutes > 0),
	CONSTRAINT "cancel_window_positive" CHECK (cancel_window_minutes > 0),
	CONSTRAINT "buffer_minutes_valid" CHECK (buffer_minutes >= 0),
	CONSTRAINT "deposit_percentage_valid" CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100),
	CONSTRAINT "deposit_type_valid" CHECK (deposit_type IN ('fixed', 'percentage')),
	CONSTRAINT "deposit_amount_fixed_valid" CHECK (deposit_amount_fixed >= 0),
	CONSTRAINT "auto_confirm_valid" CHECK (auto_confirm IN (0,1)),
	CONSTRAINT "allow_cancellation_valid" CHECK (allow_cancellation IN (0,1)),
	CONSTRAINT "allow_reschedule_valid" CHECK (allow_reschedule IN (0,1)),
	CONSTRAINT "max_advance_days_positive" CHECK (max_advance_booking_days > 0),
	CONSTRAINT "max_concurrent_positive" CHECK (max_concurrent_bookings >= 1),
	CONSTRAINT "allow_group_bookings_valid" CHECK (allow_group_bookings IN (0,1)),
	CONSTRAINT "max_group_size_valid" CHECK (max_group_size >= 1 AND max_group_size <= 20),
	CONSTRAINT "send_reminders_valid" CHECK (send_automated_reminders IN (0,1)),
	CONSTRAINT "reminder_hours_valid" CHECK (reminder_hours_before >= 1)
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"category_id" varchar,
	"name" varchar(200) NOT NULL,
	"description" text,
	"budget_type" varchar(20) NOT NULL,
	"budget_amount_paisa" integer NOT NULL,
	"spent_amount_paisa" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"budget_period" varchar(20) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"alert_threshold" integer DEFAULT 80,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "budget_type_valid" CHECK (budget_type IN ('category', 'overall', 'department')),
	CONSTRAINT "budget_period_valid" CHECK (budget_period IN ('monthly', 'quarterly', 'yearly')),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1)),
	CONSTRAINT "alert_threshold_valid" CHECK (alert_threshold >= 0 AND alert_threshold <= 100)
);
--> statement-breakpoint
CREATE TABLE "campaign_optimization_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"insight_type" varchar(50) NOT NULL,
	"insight_title" varchar(200) NOT NULL,
	"insight_description" text NOT NULL,
	"insight_data" jsonb DEFAULT '{}',
	"supporting_metrics" jsonb DEFAULT '{}',
	"confidence_score" numeric(5, 4) NOT NULL,
	"sample_size" integer NOT NULL,
	"data_date_range" jsonb DEFAULT '{}',
	"is_actionable" integer DEFAULT 1 NOT NULL,
	"recommended_actions" jsonb DEFAULT '[]',
	"times_acted_upon" integer DEFAULT 0 NOT NULL,
	"average_impact_when_acted_upon" numeric(5, 4) DEFAULT '0.0000',
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"valid_until" timestamp,
	"superseded_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "confidence_score_valid" CHECK (confidence_score >= 0 AND confidence_score <= 1),
	CONSTRAINT "sample_size_valid" CHECK (sample_size > 0)
);
--> statement-breakpoint
CREATE TABLE "commission_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"staff_id" varchar,
	"service_id" varchar,
	"rate_type" varchar(20) NOT NULL,
	"rate_value" numeric(10, 4) NOT NULL,
	"min_amount_paisa" integer,
	"max_amount_paisa" integer,
	"is_default" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "rate_type_valid" CHECK (rate_type IN ('percentage', 'fixed_amount', 'tiered')),
	CONSTRAINT "is_default_valid" CHECK (is_default IN (0,1)),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1))
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"booking_id" varchar,
	"service_id" varchar,
	"rate_id" varchar,
	"base_amount_paisa" integer NOT NULL,
	"commission_amount_paisa" integer NOT NULL,
	"commission_rate" numeric(10, 4) NOT NULL,
	"service_date" timestamp NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"payment_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"paid_by" varchar,
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_status_valid" CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
	CONSTRAINT "period_month_valid" CHECK (period_month >= 1 AND period_month <= 12),
	CONSTRAINT "period_year_valid" CHECK (period_year >= 2020)
);
--> statement-breakpoint
CREATE TABLE "communication_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"campaign_id" varchar,
	"date" timestamp NOT NULL,
	"channel" varchar(20) NOT NULL,
	"messages_sent" integer DEFAULT 0 NOT NULL,
	"messages_delivered" integer DEFAULT 0 NOT NULL,
	"messages_opened" integer DEFAULT 0 NOT NULL,
	"messages_clicked" integer DEFAULT 0 NOT NULL,
	"messages_failed" integer DEFAULT 0 NOT NULL,
	"unsubscribes" integer DEFAULT 0 NOT NULL,
	"bounces" integer DEFAULT 0 NOT NULL,
	"complaints" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "communication_analytics_salon_campaign_date_channel_unique" UNIQUE("salon_id","campaign_id","date","channel")
);
--> statement-breakpoint
CREATE TABLE "communication_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"template_id" varchar,
	"segment_id" varchar,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"messages_sent" integer DEFAULT 0 NOT NULL,
	"messages_delivered" integer DEFAULT 0 NOT NULL,
	"messages_opened" integer DEFAULT 0 NOT NULL,
	"messages_clicked" integer DEFAULT 0 NOT NULL,
	"messages_failed" integer DEFAULT 0 NOT NULL,
	"unsubscribes" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"campaign_id" varchar,
	"template_id" varchar,
	"booking_id" varchar,
	"type" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(200),
	"content" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"provider_id" varchar,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"failure_reason" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"salon_id" varchar NOT NULL,
	"email_opt_in" integer DEFAULT 1 NOT NULL,
	"sms_opt_in" integer DEFAULT 1 NOT NULL,
	"marketing_opt_in" integer DEFAULT 1 NOT NULL,
	"booking_notifications" integer DEFAULT 1 NOT NULL,
	"promotional_offers" integer DEFAULT 1 NOT NULL,
	"birthday_offers" integer DEFAULT 1 NOT NULL,
	"preferred_channel" varchar(20) DEFAULT 'email',
	"unsubscribed_at" timestamp,
	"unsubscribe_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "communication_preferences_customer_salon_unique" UNIQUE("customer_id","salon_id")
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"customer_email" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_phone" varchar,
	"notes" text,
	"preferences" jsonb,
	"is_vip" integer DEFAULT 0 NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customer_profiles_salon_email_unique" UNIQUE("salon_id","customer_email")
);
--> statement-breakpoint
CREATE TABLE "customer_segments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"criteria" jsonb NOT NULL,
	"customer_count" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"token" varchar NOT NULL,
	"user_id" varchar,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"verified_at" timestamp,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#6366f1',
	"is_default" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "expense_categories_salon_name_unique" UNIQUE("salon_id","name"),
	CONSTRAINT "is_default_valid" CHECK (is_default IN (0,1)),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1))
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"amount_paisa" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"expense_date" timestamp NOT NULL,
	"receipt_url" text,
	"receipt_number" varchar(100),
	"vendor" varchar(200),
	"is_recurring" integer DEFAULT 0 NOT NULL,
	"recurring_frequency" varchar(20),
	"tax_deductible" integer DEFAULT 0 NOT NULL,
	"tax_amount_paisa" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "is_recurring_valid" CHECK (is_recurring IN (0,1)),
	CONSTRAINT "tax_deductible_valid" CHECK (tax_deductible IN (0,1)),
	CONSTRAINT "status_valid" CHECK (status IN ('pending', 'approved', 'rejected')),
	CONSTRAINT "recurring_frequency_valid" CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('monthly', 'quarterly', 'yearly'))
);
--> statement-breakpoint
CREATE TABLE "financial_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"report_title" varchar(200) NOT NULL,
	"report_period" varchar(20) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"report_data" jsonb NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb,
	"generated_by" varchar NOT NULL,
	"exported_at" timestamp,
	"export_format" varchar(20),
	"is_scheduled" integer DEFAULT 0 NOT NULL,
	"schedule_frequency" varchar(20),
	"next_scheduled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "report_type_valid" CHECK (report_type IN ('pl_statement', 'cash_flow', 'commission_report', 'expense_report', 'tax_report', 'budget_report')),
	CONSTRAINT "report_period_valid" CHECK (report_period IN ('monthly', 'quarterly', 'yearly', 'custom')),
	CONSTRAINT "export_format_valid" CHECK (export_format IS NULL OR export_format IN ('pdf', 'excel', 'csv')),
	CONSTRAINT "is_scheduled_valid" CHECK (is_scheduled IN (0,1)),
	CONSTRAINT "schedule_frequency_valid" CHECK (schedule_frequency IS NULL OR schedule_frequency IN ('weekly', 'monthly', 'quarterly'))
);
--> statement-breakpoint
CREATE TABLE "inventory_adjustment_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adjustment_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"expected_quantity" numeric(10, 3) NOT NULL,
	"actual_quantity" numeric(10, 3) NOT NULL,
	"adjustment_quantity" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"unit_cost_in_paisa" integer,
	"total_cost_in_paisa" integer,
	"reason" varchar(200),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_adjustments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"adjustment_number" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"adjustment_date" timestamp DEFAULT now() NOT NULL,
	"reason" varchar(200) NOT NULL,
	"description" text,
	"total_value_in_paisa" integer DEFAULT 0,
	"created_by" varchar NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "inventory_adjustments_salon_number_unique" UNIQUE("salon_id","adjustment_number")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"asset_type" varchar(20) NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"display_order" integer DEFAULT 0,
	"is_primary" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	CONSTRAINT "is_primary_valid" CHECK (is_primary IN (0,1)),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1)),
	CONSTRAINT "asset_type_valid" CHECK (asset_type IN ('logo', 'cover', 'gallery', 'video'))
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"subject" varchar(200),
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]',
	"is_active" integer DEFAULT 1 NOT NULL,
	"is_default" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "optimization_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"campaign_id" varchar,
	"test_campaign_id" varchar,
	"recommendation_type" varchar(50) NOT NULL,
	"recommendation_title" varchar(200) NOT NULL,
	"recommendation_description" text NOT NULL,
	"confidence_score" numeric(5, 4) NOT NULL,
	"expected_improvement" numeric(5, 4) NOT NULL,
	"impact_score" numeric(5, 4) NOT NULL,
	"implementation_data" jsonb DEFAULT '{}',
	"implementation_complexity" varchar(20) DEFAULT 'low' NOT NULL,
	"estimated_effort_hours" numeric(4, 2) DEFAULT '0.25',
	"model_version" varchar(50),
	"model_features" jsonb DEFAULT '{}',
	"based_on_data_points" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"implemented_at" timestamp,
	"implemented_by" varchar,
	"actual_improvement" numeric(5, 4),
	"feedback_score" integer,
	"feedback_notes" text,
	"expires_at" timestamp,
	"priority" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "confidence_score_valid" CHECK (confidence_score >= 0 AND confidence_score <= 1),
	CONSTRAINT "impact_score_valid" CHECK (impact_score >= 0 AND impact_score <= 1),
	CONSTRAINT "priority_valid" CHECK (priority >= 1 AND priority <= 10),
	CONSTRAINT "feedback_score_valid" CHECK (feedback_score IS NULL OR (feedback_score >= 1 AND feedback_score <= 5))
);
--> statement-breakpoint
CREATE TABLE "org_users" (
	"org_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"org_role" varchar(50) DEFAULT 'staff' NOT NULL,
	"invited_at" timestamp,
	"joined_at" timestamp DEFAULT now(),
	"is_active" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website" text,
	"owner_user_id" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "package_services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" varchar NOT NULL,
	"service_id" varchar NOT NULL,
	"salon_id" varchar NOT NULL,
	"sequence_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "package_services_package_service_unique" UNIQUE("package_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "payout_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"provider" varchar(20) NOT NULL,
	"onboarding_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"account_id" text,
	"requirements_missing" jsonb,
	"is_default" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payout_accounts_salon_provider_unique" UNIQUE("salon_id","provider"),
	CONSTRAINT "provider_valid" CHECK (provider IN ('razorpay', 'stripe')),
	CONSTRAINT "onboarding_status_valid" CHECK (onboarding_status IN ('pending', 'incomplete', 'approved', 'rejected')),
	CONSTRAINT "is_default_valid" CHECK (is_default IN (0,1)),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1))
);
--> statement-breakpoint
CREATE TABLE "performance_monitoring_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"configuration_id" varchar NOT NULL,
	"monitoring_name" varchar(100) NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"target_metrics" jsonb DEFAULT '["open_rate", "click_rate", "conversion_rate"]',
	"metric_thresholds" jsonb DEFAULT '{}',
	"check_interval_minutes" integer DEFAULT 15 NOT NULL,
	"alert_cooldown_minutes" integer DEFAULT 60 NOT NULL,
	"enable_email_alerts" integer DEFAULT 1 NOT NULL,
	"enable_sms_alerts" integer DEFAULT 0 NOT NULL,
	"alert_recipients" jsonb DEFAULT '[]',
	"enable_early_winner_detection" integer DEFAULT 1 NOT NULL,
	"early_detection_minimum_samples" integer DEFAULT 50 NOT NULL,
	"early_detection_significance_level" numeric(5, 4) DEFAULT '0.0500',
	"enable_provider_integration" integer DEFAULT 1 NOT NULL,
	"provider_settings" jsonb DEFAULT '{}',
	"last_monitored_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "performance_monitoring_settings_config_name_unique" UNIQUE("configuration_id","monitoring_name"),
	CONSTRAINT "check_interval_valid" CHECK (check_interval_minutes >= 5 AND check_interval_minutes <= 1440),
	CONSTRAINT "cooldown_valid" CHECK (alert_cooldown_minutes >= 5 AND alert_cooldown_minutes <= 1440)
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"parent_category_id" varchar,
	"is_active" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "product_categories_salon_name_unique" UNIQUE("salon_id","name")
);
--> statement-breakpoint
CREATE TABLE "product_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"service_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity_per_service" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"cost_per_service_in_paisa" integer,
	"is_active" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_usage_service_product_unique" UNIQUE("service_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"category_id" varchar,
	"vendor_id" varchar,
	"sku" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"brand" varchar(100),
	"size" varchar(50),
	"unit" varchar(20) DEFAULT 'piece' NOT NULL,
	"cost_price_in_paisa" integer NOT NULL,
	"selling_price_in_paisa" integer,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"current_stock" numeric(10, 3) DEFAULT '0' NOT NULL,
	"minimum_stock" numeric(10, 3) DEFAULT '0' NOT NULL,
	"maximum_stock" numeric(10, 3),
	"reorder_point" numeric(10, 3),
	"reorder_quantity" numeric(10, 3),
	"lead_time_days" integer DEFAULT 7,
	"expiry_date" timestamp,
	"batch_number" varchar(100),
	"barcode" varchar(100),
	"location" varchar(100),
	"is_active" integer DEFAULT 1 NOT NULL,
	"is_retail_item" integer DEFAULT 0 NOT NULL,
	"track_stock" integer DEFAULT 1 NOT NULL,
	"low_stock_alert" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"tags" jsonb DEFAULT '[]',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_salon_sku_unique" UNIQUE("salon_id","sku")
);
--> statement-breakpoint
CREATE TABLE "publish_state" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"can_accept_bookings" integer DEFAULT 0 NOT NULL,
	"is_published" integer DEFAULT 0 NOT NULL,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"completed_steps" jsonb DEFAULT '[]'::jsonb,
	"checklist" jsonb DEFAULT '{}'::jsonb,
	"published_at" timestamp,
	"last_updated" timestamp DEFAULT now(),
	CONSTRAINT "publish_state_salon_id_unique" UNIQUE("salon_id"),
	CONSTRAINT "can_accept_bookings_valid" CHECK (can_accept_bookings IN (0,1)),
	CONSTRAINT "is_published_valid" CHECK (is_published IN (0,1)),
	CONSTRAINT "onboarding_step_valid" CHECK (onboarding_step >= 1)
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"unit_cost_in_paisa" integer NOT NULL,
	"total_cost_in_paisa" integer NOT NULL,
	"received_quantity" numeric(10, 3) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"vendor_id" varchar NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"expected_delivery_date" timestamp,
	"actual_delivery_date" timestamp,
	"subtotal_in_paisa" integer DEFAULT 0 NOT NULL,
	"tax_in_paisa" integer DEFAULT 0 NOT NULL,
	"shipping_in_paisa" integer DEFAULT 0 NOT NULL,
	"discount_in_paisa" integer DEFAULT 0 NOT NULL,
	"total_in_paisa" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_terms" varchar(100),
	"payment_status" varchar(20) DEFAULT 'pending',
	"created_by" varchar NOT NULL,
	"approved_by" varchar,
	"received_by" varchar,
	"notes" text,
	"internal_notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "purchase_orders_salon_order_number_unique" UNIQUE("salon_id","order_number")
);
--> statement-breakpoint
CREATE TABLE "reorder_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"vendor_id" varchar,
	"is_active" integer DEFAULT 1 NOT NULL,
	"reorder_point" numeric(10, 3) NOT NULL,
	"reorder_quantity" numeric(10, 3) NOT NULL,
	"lead_time_days" integer DEFAULT 7 NOT NULL,
	"safety_stock_days" integer DEFAULT 3,
	"auto_create_po" integer DEFAULT 0 NOT NULL,
	"last_triggered" timestamp,
	"next_review_date" timestamp,
	"seasonal_factor" numeric(5, 2) DEFAULT '1.00',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "reorder_rules_salon_product_unique" UNIQUE("salon_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" text NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"description" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "resources_id_salon_id_unique" UNIQUE("id","salon_id"),
	CONSTRAINT "capacity_positive" CHECK (capacity > 0),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1)),
	CONSTRAINT "resource_type_valid" CHECK (resource_type IN ('chair', 'room', 'equipment', 'station', 'bed'))
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "scheduled_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"customer_id" varchar,
	"booking_id" varchar,
	"campaign_id" varchar,
	"template_id" varchar,
	"type" varchar(50) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"subject" varchar(200),
	"content" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_attempt_at" timestamp,
	"sent_at" timestamp,
	"failure_reason" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_duration_minutes" integer NOT NULL,
	"package_price_in_paisa" integer NOT NULL,
	"regular_price_in_paisa" integer NOT NULL,
	"discount_percentage" integer,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_packages_id_salon_id_unique" UNIQUE("id","salon_id")
);
--> statement-breakpoint
CREATE TABLE "service_resources" (
	"salon_id" varchar NOT NULL,
	"service_id" varchar NOT NULL,
	"resource_id" varchar NOT NULL,
	"quantity_required" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "quantity_positive" CHECK (quantity_required > 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"salon_id" varchar NOT NULL,
	"org_id" varchar,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"roles" text[],
	"gender" varchar(10),
	"photo_url" text,
	"specialties" text[],
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_id_salon_id_unique" UNIQUE("id","salon_id")
);
--> statement-breakpoint
CREATE TABLE "staff_services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"service_id" varchar NOT NULL,
	"price_in_paisa" integer,
	"duration_minutes" integer,
	"is_active" integer DEFAULT 1 NOT NULL,
	"commission_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_services_salon_staff_service_unique" UNIQUE("salon_id","staff_id","service_id"),
	CONSTRAINT "price_positive" CHECK (price_in_paisa IS NULL OR price_in_paisa > 0),
	CONSTRAINT "duration_positive" CHECK (duration_minutes IS NULL OR duration_minutes > 0),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1)),
	CONSTRAINT "commission_valid" CHECK (commission_percentage >= 0 AND commission_percentage <= 100)
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"type" varchar(50) NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"unit_cost_in_paisa" integer,
	"total_cost_in_paisa" integer,
	"previous_stock" numeric(10, 3) NOT NULL,
	"new_stock" numeric(10, 3) NOT NULL,
	"reason" varchar(100),
	"reference" varchar(100),
	"reference_id" varchar,
	"reference_type" varchar(50),
	"staff_id" varchar,
	"notes" text,
	"batch_number" varchar(100),
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate_basis_points" integer NOT NULL,
	"is_default" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tax_rates_salon_name_unique" UNIQUE("salon_id","name"),
	CONSTRAINT "rate_valid" CHECK (rate_basis_points >= 0 AND rate_basis_points <= 10000),
	CONSTRAINT "is_default_valid" CHECK (is_default IN (0,1)),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1))
);
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"tax_type" varchar(50) NOT NULL,
	"tax_name" varchar(100) NOT NULL,
	"tax_rate" numeric(10, 4) NOT NULL,
	"is_inclusive" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"applicable_from" timestamp DEFAULT now() NOT NULL,
	"applicable_to" timestamp,
	"tax_authority" varchar(200),
	"registration_number" varchar(100),
	"filing_frequency" varchar(20),
	"next_filing_date" timestamp,
	"auto_calculate" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tax_settings_salon_type_unique" UNIQUE("salon_id","tax_type"),
	CONSTRAINT "tax_type_valid" CHECK (tax_type IN ('gst', 'vat', 'sales_tax', 'income_tax', 'service_tax')),
	CONSTRAINT "is_inclusive_valid" CHECK (is_inclusive IN (0,1)),
	CONSTRAINT "is_active_valid" CHECK (is_active IN (0,1)),
	CONSTRAINT "auto_calculate_valid" CHECK (auto_calculate IN (0,1)),
	CONSTRAINT "filing_frequency_valid" CHECK (filing_frequency IS NULL OR filing_frequency IN ('monthly', 'quarterly', 'yearly'))
);
--> statement-breakpoint
CREATE TABLE "test_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_campaign_id" varchar NOT NULL,
	"variant_id" varchar NOT NULL,
	"metric_date" timestamp NOT NULL,
	"participant_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"booking_count" integer DEFAULT 0 NOT NULL,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"bounce_count" integer DEFAULT 0 NOT NULL,
	"unsubscribe_count" integer DEFAULT 0 NOT NULL,
	"open_rate" numeric(5, 4) DEFAULT '0.0000',
	"click_rate" numeric(5, 4) DEFAULT '0.0000',
	"conversion_rate" numeric(5, 4) DEFAULT '0.0000',
	"booking_rate" numeric(5, 4) DEFAULT '0.0000',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "test_metrics_variant_date_unique" UNIQUE("variant_id","metric_date"),
	CONSTRAINT "participant_count_valid" CHECK (participant_count >= 0),
	CONSTRAINT "sent_count_valid" CHECK (sent_count >= 0),
	CONSTRAINT "delivered_count_valid" CHECK (delivered_count >= 0),
	CONSTRAINT "open_count_valid" CHECK (open_count >= 0),
	CONSTRAINT "click_count_valid" CHECK (click_count >= 0),
	CONSTRAINT "reply_count_valid" CHECK (reply_count >= 0),
	CONSTRAINT "booking_count_valid" CHECK (booking_count >= 0),
	CONSTRAINT "conversion_count_valid" CHECK (conversion_count >= 0),
	CONSTRAINT "bounce_count_valid" CHECK (bounce_count >= 0),
	CONSTRAINT "unsubscribe_count_valid" CHECK (unsubscribe_count >= 0),
	CONSTRAINT "rates_valid" CHECK (open_rate >= 0 AND click_rate >= 0 AND conversion_rate >= 0 AND booking_rate >= 0)
);
--> statement-breakpoint
CREATE TABLE "test_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_campaign_id" varchar NOT NULL,
	"winner_variant_id" varchar,
	"completed_at" timestamp NOT NULL,
	"statistical_significance" numeric(5, 4),
	"confidence_level" integer,
	"p_value" numeric(10, 9),
	"performance_improvement" numeric(5, 4),
	"result_summary" jsonb DEFAULT '{}',
	"action_taken" varchar(50) NOT NULL,
	"implemented_at" timestamp,
	"notes" text,
	CONSTRAINT "test_results_test_campaign_id_unique" UNIQUE("test_campaign_id"),
	CONSTRAINT "confidence_level_valid" CHECK (confidence_level IS NULL OR confidence_level IN (90, 95, 99)),
	CONSTRAINT "statistical_significance_valid" CHECK (statistical_significance IS NULL OR (statistical_significance >= 0 AND statistical_significance <= 1)),
	CONSTRAINT "p_value_valid" CHECK (p_value IS NULL OR (p_value >= 0 AND p_value <= 1))
);
--> statement-breakpoint
CREATE TABLE "test_variants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_campaign_id" varchar NOT NULL,
	"variant_name" varchar(100) NOT NULL,
	"is_control" integer DEFAULT 0 NOT NULL,
	"template_overrides" jsonb DEFAULT '{}',
	"channel_override" varchar(20),
	"priority" integer DEFAULT 0 NOT NULL,
	"audience_percentage" integer NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "test_variants_campaign_name_unique" UNIQUE("test_campaign_id","variant_name"),
	CONSTRAINT "is_control_valid" CHECK (is_control IN (0,1)),
	CONSTRAINT "audience_percentage_valid" CHECK (audience_percentage >= 1 AND audience_percentage <= 100),
	CONSTRAINT "priority_valid" CHECK (priority >= 0)
);
--> statement-breakpoint
CREATE TABLE "time_slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern_id" varchar,
	"salon_id" varchar NOT NULL,
	"staff_id" varchar,
	"start_date_time" timestamp NOT NULL,
	"end_date_time" timestamp NOT NULL,
	"is_booked" integer DEFAULT 0 NOT NULL,
	"is_blocked" integer DEFAULT 0 NOT NULL,
	"booking_id" varchar,
	"generated_at" timestamp DEFAULT now(),
	CONSTRAINT "time_slots_id_salon_id_unique" UNIQUE("id","salon_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" varchar NOT NULL,
	"role_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_saved_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"label" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"place_id" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_saved_locations_label_check" CHECK ("user_saved_locations"."label" IN ('home', 'office', 'custom'))
);
--> statement-breakpoint
CREATE TABLE "variant_generation_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"configuration_id" varchar NOT NULL,
	"rule_name" varchar(100) NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"conditions" jsonb DEFAULT '{}',
	"actions" jsonb DEFAULT '{}',
	"times_applied" integer DEFAULT 0 NOT NULL,
	"success_rate" numeric(5, 4) DEFAULT '0.0000',
	"average_improvement" numeric(5, 4) DEFAULT '0.0000',
	"best_practice_templates" jsonb DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "variant_generation_rules_config_name_unique" UNIQUE("configuration_id","rule_name")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"contact_person" varchar(200),
	"email" varchar(200),
	"phone" varchar(50),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"zip_code" varchar(20),
	"country" varchar(100) DEFAULT 'India',
	"website" varchar(200),
	"tax_id" varchar(50),
	"payment_terms" varchar(100),
	"notes" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_booking_id_bookings_id_fk";
--> statement-breakpoint
ALTER TABLE "salons" DROP CONSTRAINT "salons_owner_id_fkey";
--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_service_id_services_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "salons" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "currency" SET DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "salon_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "currency" SET DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "salon_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image_url" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "latitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "longitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "venue_type" varchar(20) DEFAULT 'everyone';--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "instant_booking" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "offer_deals" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "accept_group" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "image_urls" text[];--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "business_hours" jsonb;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "setup_progress" jsonb;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "org_id" varchar;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "staff_id" varchar;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "time_slot_id" varchar;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_method" varchar(20) DEFAULT 'pay_now' NOT NULL;--> statement-breakpoint
ALTER TABLE "ab_test_campaigns" ADD CONSTRAINT "ab_test_campaigns_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_campaigns" ADD CONSTRAINT "ab_test_campaigns_base_template_id_message_templates_id_fk" FOREIGN KEY ("base_template_id") REFERENCES "public"."message_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_campaigns" ADD CONSTRAINT "ab_test_campaigns_target_segment_id_customer_segments_id_fk" FOREIGN KEY ("target_segment_id") REFERENCES "public"."customer_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_campaigns" ADD CONSTRAINT "ab_test_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_action_logs" ADD CONSTRAINT "automated_action_logs_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_action_logs" ADD CONSTRAINT "automated_action_logs_configuration_id_automation_configurations_id_fk" FOREIGN KEY ("configuration_id") REFERENCES "public"."automation_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_action_logs" ADD CONSTRAINT "automated_action_logs_campaign_id_communication_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."communication_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_action_logs" ADD CONSTRAINT "automated_action_logs_test_campaign_id_ab_test_campaigns_id_fk" FOREIGN KEY ("test_campaign_id") REFERENCES "public"."ab_test_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automated_action_logs" ADD CONSTRAINT "automated_action_logs_recommendation_id_optimization_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."optimization_recommendations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_configurations" ADD CONSTRAINT "automation_configurations_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_patterns" ADD CONSTRAINT "availability_patterns_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_patterns" ADD CONSTRAINT "availability_patterns_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_patterns" ADD CONSTRAINT "availability_patterns_staff_salon_fk" FOREIGN KEY ("staff_id","salon_id") REFERENCES "public"."staff"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_booking_salon_fk" FOREIGN KEY ("booking_id","salon_id") REFERENCES "public"."bookings"("id","salon_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_service_salon_fk" FOREIGN KEY ("service_id","salon_id") REFERENCES "public"."services"("id","salon_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_settings" ADD CONSTRAINT "booking_settings_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_optimization_insights" ADD CONSTRAINT "campaign_optimization_insights_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_rate_id_commission_rates_id_fk" FOREIGN KEY ("rate_id") REFERENCES "public"."commission_rates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_analytics" ADD CONSTRAINT "communication_analytics_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_analytics" ADD CONSTRAINT "communication_analytics_campaign_id_communication_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."communication_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_segment_id_customer_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."customer_segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_history" ADD CONSTRAINT "communication_history_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_history" ADD CONSTRAINT "communication_history_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_history" ADD CONSTRAINT "communication_history_campaign_id_communication_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."communication_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_history" ADD CONSTRAINT "communication_history_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_history" ADD CONSTRAINT "communication_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_preferences" ADD CONSTRAINT "communication_preferences_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_preferences" ADD CONSTRAINT "communication_preferences_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_segments" ADD CONSTRAINT "customer_segments_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_segments" ADD CONSTRAINT "customer_segments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustment_items" ADD CONSTRAINT "inventory_adjustment_items_adjustment_id_inventory_adjustments_id_fk" FOREIGN KEY ("adjustment_id") REFERENCES "public"."inventory_adjustments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustment_items" ADD CONSTRAINT "inventory_adjustment_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_recommendations" ADD CONSTRAINT "optimization_recommendations_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_recommendations" ADD CONSTRAINT "optimization_recommendations_campaign_id_communication_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."communication_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_recommendations" ADD CONSTRAINT "optimization_recommendations_test_campaign_id_ab_test_campaigns_id_fk" FOREIGN KEY ("test_campaign_id") REFERENCES "public"."ab_test_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_recommendations" ADD CONSTRAINT "optimization_recommendations_implemented_by_users_id_fk" FOREIGN KEY ("implemented_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_users" ADD CONSTRAINT "org_users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_users" ADD CONSTRAINT "org_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_services" ADD CONSTRAINT "package_services_package_id_service_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."service_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_services" ADD CONSTRAINT "package_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_services" ADD CONSTRAINT "package_services_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_services" ADD CONSTRAINT "package_services_package_salon_fk" FOREIGN KEY ("package_id","salon_id") REFERENCES "public"."service_packages"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_services" ADD CONSTRAINT "package_services_service_salon_fk" FOREIGN KEY ("service_id","salon_id") REFERENCES "public"."services"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_monitoring_settings" ADD CONSTRAINT "performance_monitoring_settings_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_monitoring_settings" ADD CONSTRAINT "performance_monitoring_settings_configuration_id_automation_configurations_id_fk" FOREIGN KEY ("configuration_id") REFERENCES "public"."automation_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_usage" ADD CONSTRAINT "product_usage_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_usage" ADD CONSTRAINT "product_usage_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_usage" ADD CONSTRAINT "product_usage_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publish_state" ADD CONSTRAINT "publish_state_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_campaign_id_communication_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."communication_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_template_id_message_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."message_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_resources" ADD CONSTRAINT "service_resources_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_resources" ADD CONSTRAINT "service_resources_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_resources" ADD CONSTRAINT "service_resources_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_resources" ADD CONSTRAINT "service_resources_service_salon_fk" FOREIGN KEY ("service_id","salon_id") REFERENCES "public"."services"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_resources" ADD CONSTRAINT "service_resources_resource_salon_fk" FOREIGN KEY ("resource_id","salon_id") REFERENCES "public"."resources"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staff_salon_fk" FOREIGN KEY ("staff_id","salon_id") REFERENCES "public"."staff"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_service_salon_fk" FOREIGN KEY ("service_id","salon_id") REFERENCES "public"."services"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_settings" ADD CONSTRAINT "tax_settings_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_metrics" ADD CONSTRAINT "test_metrics_test_campaign_id_ab_test_campaigns_id_fk" FOREIGN KEY ("test_campaign_id") REFERENCES "public"."ab_test_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_metrics" ADD CONSTRAINT "test_metrics_variant_id_test_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."test_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_test_campaign_id_ab_test_campaigns_id_fk" FOREIGN KEY ("test_campaign_id") REFERENCES "public"."ab_test_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_winner_variant_id_test_variants_id_fk" FOREIGN KEY ("winner_variant_id") REFERENCES "public"."test_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_variants" ADD CONSTRAINT "test_variants_test_campaign_id_ab_test_campaigns_id_fk" FOREIGN KEY ("test_campaign_id") REFERENCES "public"."ab_test_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_pattern_id_availability_patterns_id_fk" FOREIGN KEY ("pattern_id") REFERENCES "public"."availability_patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_pattern_salon_fk" FOREIGN KEY ("pattern_id","salon_id") REFERENCES "public"."availability_patterns"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_staff_salon_fk" FOREIGN KEY ("staff_id","salon_id") REFERENCES "public"."staff"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_locations" ADD CONSTRAINT "user_saved_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_generation_rules" ADD CONSTRAINT "variant_generation_rules_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_generation_rules" ADD CONSTRAINT "variant_generation_rules_configuration_id_automation_configurations_id_fk" FOREIGN KEY ("configuration_id") REFERENCES "public"."automation_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ab_test_campaigns_salon_id_idx" ON "ab_test_campaigns" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "ab_test_campaigns_status_idx" ON "ab_test_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ab_test_campaigns_test_type_idx" ON "ab_test_campaigns" USING btree ("test_type");--> statement-breakpoint
CREATE INDEX "ab_test_campaigns_started_at_idx" ON "ab_test_campaigns" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "ab_test_campaigns_completed_at_idx" ON "ab_test_campaigns" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "automated_action_logs_salon_id_idx" ON "automated_action_logs" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "automated_action_logs_config_id_idx" ON "automated_action_logs" USING btree ("configuration_id");--> statement-breakpoint
CREATE INDEX "automated_action_logs_campaign_id_idx" ON "automated_action_logs" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "automated_action_logs_test_campaign_id_idx" ON "automated_action_logs" USING btree ("test_campaign_id");--> statement-breakpoint
CREATE INDEX "automated_action_logs_action_type_idx" ON "automated_action_logs" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "automated_action_logs_status_idx" ON "automated_action_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "automated_action_logs_triggered_by_idx" ON "automated_action_logs" USING btree ("triggered_by");--> statement-breakpoint
CREATE INDEX "automated_action_logs_created_at_idx" ON "automated_action_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "automation_configurations_salon_id_idx" ON "automation_configurations" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "automation_configurations_enabled_idx" ON "automation_configurations" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "budgets_salon_idx" ON "budgets" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "budgets_category_idx" ON "budgets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "budgets_period_idx" ON "budgets" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "campaign_optimization_insights_salon_id_idx" ON "campaign_optimization_insights" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "campaign_optimization_insights_type_idx" ON "campaign_optimization_insights" USING btree ("insight_type");--> statement-breakpoint
CREATE INDEX "campaign_optimization_insights_status_idx" ON "campaign_optimization_insights" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_optimization_insights_actionable_idx" ON "campaign_optimization_insights" USING btree ("is_actionable");--> statement-breakpoint
CREATE INDEX "campaign_optimization_insights_valid_until_idx" ON "campaign_optimization_insights" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "commission_rates_salon_idx" ON "commission_rates" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "commission_rates_staff_idx" ON "commission_rates" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "commission_rates_service_idx" ON "commission_rates" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "commission_rates_effective_idx" ON "commission_rates" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "commissions_salon_idx" ON "commissions" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "commissions_staff_idx" ON "commissions" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "commissions_booking_idx" ON "commissions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "commissions_period_idx" ON "commissions" USING btree ("period_year","period_month");--> statement-breakpoint
CREATE INDEX "commissions_payment_status_idx" ON "commissions" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "commissions_service_date_idx" ON "commissions" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX "communication_analytics_salon_id_idx" ON "communication_analytics" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "communication_analytics_date_idx" ON "communication_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "communication_analytics_campaign_id_idx" ON "communication_analytics" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "communication_campaigns_salon_id_idx" ON "communication_campaigns" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "communication_campaigns_status_idx" ON "communication_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "communication_campaigns_scheduled_at_idx" ON "communication_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "communication_history_salon_id_idx" ON "communication_history" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "communication_history_customer_id_idx" ON "communication_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "communication_history_campaign_id_idx" ON "communication_history" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "communication_history_booking_id_idx" ON "communication_history" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "communication_history_status_idx" ON "communication_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "communication_history_sent_at_idx" ON "communication_history" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "communication_preferences_customer_id_idx" ON "communication_preferences" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "communication_preferences_salon_id_idx" ON "communication_preferences" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "customer_segments_salon_id_idx" ON "customer_segments" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "expense_categories_salon_idx" ON "expense_categories" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "expenses_salon_idx" ON "expenses" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "expenses_status_idx" ON "expenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "financial_reports_salon_idx" ON "financial_reports" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "financial_reports_type_idx" ON "financial_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "financial_reports_period_idx" ON "financial_reports" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "inventory_adjustment_items_adjustment_id_idx" ON "inventory_adjustment_items" USING btree ("adjustment_id");--> statement-breakpoint
CREATE INDEX "inventory_adjustment_items_product_id_idx" ON "inventory_adjustment_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_salon_id_idx" ON "inventory_adjustments" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_type_idx" ON "inventory_adjustments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_status_idx" ON "inventory_adjustments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_date_idx" ON "inventory_adjustments" USING btree ("adjustment_date");--> statement-breakpoint
CREATE INDEX "media_assets_salon_idx" ON "media_assets" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "media_assets_salon_type_order_idx" ON "media_assets" USING btree ("salon_id","asset_type","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_primary_unique" ON "media_assets" USING btree ("salon_id") WHERE is_primary = 1;--> statement-breakpoint
CREATE INDEX "message_templates_salon_id_idx" ON "message_templates" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "message_templates_type_idx" ON "message_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "optimization_recommendations_salon_id_idx" ON "optimization_recommendations" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "optimization_recommendations_campaign_id_idx" ON "optimization_recommendations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "optimization_recommendations_test_campaign_id_idx" ON "optimization_recommendations" USING btree ("test_campaign_id");--> statement-breakpoint
CREATE INDEX "optimization_recommendations_type_idx" ON "optimization_recommendations" USING btree ("recommendation_type");--> statement-breakpoint
CREATE INDEX "optimization_recommendations_status_idx" ON "optimization_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "optimization_recommendations_priority_idx" ON "optimization_recommendations" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "optimization_recommendations_expires_at_idx" ON "optimization_recommendations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "payout_accounts_salon_idx" ON "payout_accounts" USING btree ("salon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_accounts_default_unique" ON "payout_accounts" USING btree ("salon_id") WHERE is_default = 1;--> statement-breakpoint
CREATE INDEX "performance_monitoring_settings_salon_id_idx" ON "performance_monitoring_settings" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "performance_monitoring_settings_config_id_idx" ON "performance_monitoring_settings" USING btree ("configuration_id");--> statement-breakpoint
CREATE INDEX "performance_monitoring_settings_active_idx" ON "performance_monitoring_settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "performance_monitoring_settings_last_monitored_idx" ON "performance_monitoring_settings" USING btree ("last_monitored_at");--> statement-breakpoint
CREATE INDEX "product_categories_salon_id_idx" ON "product_categories" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "product_categories_parent_idx" ON "product_categories" USING btree ("parent_category_id");--> statement-breakpoint
CREATE INDEX "product_usage_salon_id_idx" ON "product_usage" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "product_usage_service_id_idx" ON "product_usage" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "product_usage_product_id_idx" ON "product_usage" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_salon_id_idx" ON "products" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_vendor_id_idx" ON "products" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_barcode_idx" ON "products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "products_current_stock_idx" ON "products" USING btree ("current_stock");--> statement-breakpoint
CREATE INDEX "products_low_stock_idx" ON "products" USING btree ("current_stock","minimum_stock");--> statement-breakpoint
CREATE INDEX "purchase_order_items_po_id_idx" ON "purchase_order_items" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "purchase_order_items_product_id_idx" ON "purchase_order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_salon_id_idx" ON "purchase_orders" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_vendor_id_idx" ON "purchase_orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "purchase_orders_order_date_idx" ON "purchase_orders" USING btree ("order_date");--> statement-breakpoint
CREATE INDEX "reorder_rules_salon_id_idx" ON "reorder_rules" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "reorder_rules_product_id_idx" ON "reorder_rules" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reorder_rules_vendor_id_idx" ON "reorder_rules" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "reorder_rules_next_review_idx" ON "reorder_rules" USING btree ("next_review_date");--> statement-breakpoint
CREATE INDEX "resources_salon_idx" ON "resources" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "scheduled_messages_salon_id_idx" ON "scheduled_messages" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "scheduled_messages_scheduled_for_idx" ON "scheduled_messages" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "scheduled_messages_status_idx" ON "scheduled_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scheduled_messages_booking_id_idx" ON "scheduled_messages" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "service_resources_salon_idx" ON "service_resources" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "service_resources_resource_idx" ON "service_resources" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "staff_service_salon_idx" ON "staff_services" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "staff_service_idx" ON "staff_services" USING btree ("staff_id","service_id");--> statement-breakpoint
CREATE INDEX "staff_service_service_idx" ON "staff_services" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "stock_movements_salon_id_idx" ON "stock_movements" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_movements_type_idx" ON "stock_movements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_reference_idx" ON "stock_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "tax_rates_salon_idx" ON "tax_rates" USING btree ("salon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_rates_default_unique" ON "tax_rates" USING btree ("salon_id") WHERE is_default = 1;--> statement-breakpoint
CREATE INDEX "tax_settings_salon_idx" ON "tax_settings" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "tax_settings_type_idx" ON "tax_settings" USING btree ("tax_type");--> statement-breakpoint
CREATE INDEX "test_metrics_campaign_id_idx" ON "test_metrics" USING btree ("test_campaign_id");--> statement-breakpoint
CREATE INDEX "test_metrics_variant_id_idx" ON "test_metrics" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "test_metrics_date_idx" ON "test_metrics" USING btree ("metric_date");--> statement-breakpoint
CREATE INDEX "test_results_campaign_id_idx" ON "test_results" USING btree ("test_campaign_id");--> statement-breakpoint
CREATE INDEX "test_results_winner_variant_idx" ON "test_results" USING btree ("winner_variant_id");--> statement-breakpoint
CREATE INDEX "test_results_completed_at_idx" ON "test_results" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "test_results_implemented_at_idx" ON "test_results" USING btree ("implemented_at");--> statement-breakpoint
CREATE INDEX "test_variants_campaign_id_idx" ON "test_variants" USING btree ("test_campaign_id");--> statement-breakpoint
CREATE INDEX "test_variants_status_idx" ON "test_variants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_variants_priority_idx" ON "test_variants" USING btree ("priority");--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_locations_user_label_unique" ON "user_saved_locations" USING btree ("user_id","label") WHERE "user_saved_locations"."label" IN ('home', 'office');--> statement-breakpoint
CREATE INDEX "user_saved_locations_lat_lng_idx" ON "user_saved_locations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "variant_generation_rules_salon_id_idx" ON "variant_generation_rules" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "variant_generation_rules_config_id_idx" ON "variant_generation_rules" USING btree ("configuration_id");--> statement-breakpoint
CREATE INDEX "variant_generation_rules_type_idx" ON "variant_generation_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "variant_generation_rules_active_idx" ON "variant_generation_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "variant_generation_rules_priority_idx" ON "variant_generation_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "vendors_salon_id_idx" ON "vendors" USING btree ("salon_id");--> statement-breakpoint
CREATE INDEX "vendors_status_idx" ON "vendors" USING btree ("status");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salons" ADD CONSTRAINT "salons_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salons" ADD CONSTRAINT "salons_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_time_slot_id_time_slots_id_fk" FOREIGN KEY ("time_slot_id") REFERENCES "public"."time_slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_salon_fk" FOREIGN KEY ("service_id","salon_id") REFERENCES "public"."services"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staff_salon_fk" FOREIGN KEY ("staff_id","salon_id") REFERENCES "public"."staff"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_timeslot_salon_fk" FOREIGN KEY ("time_slot_id","salon_id") REFERENCES "public"."time_slots"("id","salon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "salons_lat_lng_idx" ON "salons" USING btree ("latitude","longitude");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_id_salon_id_unique" UNIQUE("id","salon_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_id_salon_id_unique" UNIQUE("id","salon_id");