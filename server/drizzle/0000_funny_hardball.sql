CREATE TABLE "platform_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tenant_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"name" varchar(50) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "platform_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "platform_user_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(50) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_user_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_user_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "platform_user_verification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" varchar(20),
	"tenant_id" uuid NOT NULL,
	"role_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_user_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(50) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_user_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"impersonator_admin_id" uuid,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_user_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tenant_user_verification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"device_id" varchar(128),
	"device_info" text,
	"ip_address" varchar(64),
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp,
	"replaced_by_token_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"domain" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "uploaded_files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"storage_key" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"content_type" varchar(150) NOT NULL,
	"size_bytes" integer NOT NULL,
	"status" varchar(20) DEFAULT 'UPLOADED' NOT NULL,
	"attached_to_type" varchar(50),
	"attached_to_id" uuid,
	"attached_at" timestamp,
	"expires_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_error" text,
	CONSTRAINT "uploaded_files_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"type" varchar(50) DEFAULT 'farm' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"image_file_id" uuid,
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"pincode" varchar(20),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"phone" varchar(20),
	"email" varchar(255),
	"manager_id" uuid,
	"gstin" varchar(15),
	"is_headquarters" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(64),
	"last_error" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"event_id" varchar(36) NOT NULL,
	"handler" varchar(100) NOT NULL,
	"status" varchar(20) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" varchar(36) NOT NULL,
	"actor_id" varchar(36) NOT NULL,
	"actor_type" varchar(20) NOT NULL,
	"impersonated_by_admin_id" varchar(36),
	"old_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"path_pattern" text NOT NULL,
	"type" varchar(20) DEFAULT 'HEADER' NOT NULL,
	"slot" varchar(100),
	"target_segments" jsonb DEFAULT '[]'::jsonb,
	"image_file_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"props" jsonb DEFAULT '{}'::jsonb,
	"created_by_admin_id" uuid,
	"updated_by_admin_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_daily_metrics" (
	"date" timestamp NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"count" numeric(14, 0) DEFAULT '0' NOT NULL,
	"sum_value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "analytics_daily_metrics_date_tenant_id_event_type_pk" PRIMARY KEY("date","tenant_id","event_type")
);
--> statement-breakpoint
CREATE TABLE "analytics_dashboard_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"event_type" varchar(80) NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"ip" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "species" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"tracking_type" varchar(50) DEFAULT 'individual' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "species_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "breeds" (
	"id" uuid PRIMARY KEY NOT NULL,
	"species_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"origin" varchar(100),
	"purpose" varchar(100),
	"average_male_weight" integer,
	"average_female_weight" integer,
	"average_maturity_weeks" integer,
	"trait_tags" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_animal_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"source_id" uuid,
	"event_type" varchar(64) NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"data" jsonb,
	"performed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_animals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"species_id" uuid NOT NULL,
	"breed_id" uuid,
	"tag_number" varchar(64) NOT NULL,
	"alternate_id" varchar(64),
	"name" varchar(255),
	"sex" varchar(16) DEFAULT 'unknown' NOT NULL,
	"date_of_birth" date,
	"acquisition_type" varchar(32),
	"acquired_at" date,
	"acquisition_cost" numeric(12, 2),
	"status" varchar(24) DEFAULT 'active' NOT NULL,
	"tracking_state" varchar(24) DEFAULT 'in_farm' NOT NULL,
	"weight_kg" numeric(8, 2),
	"sire_id" uuid,
	"dam_id" uuid,
	"metadata" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_group_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"source_id" uuid,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"delta_quantity" integer NOT NULL,
	"resulting_quantity" integer NOT NULL,
	"notes" text,
	"data" jsonb,
	"performed_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"species_id" uuid NOT NULL,
	"batch_code" varchar(64) NOT NULL,
	"description" text,
	"initial_quantity" integer NOT NULL,
	"current_quantity" integer NOT NULL,
	"unit" varchar(24) DEFAULT 'birds' NOT NULL,
	"hatch_date" date,
	"source" varchar(32),
	"status" varchar(24) DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_tag_sequences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"branch_id" uuid,
	"prefix" varchar(16) DEFAULT 'TAG' NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_vaccination_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"vaccine_name" varchar(255) NOT NULL,
	"batch_number" varchar(100),
	"dosage" varchar(50),
	"dosage_unit" varchar(20),
	"route_of_administration" varchar(20),
	"administration_site" varchar(100),
	"next_due_date" date,
	"withdrawal_period_milk" numeric(8, 2),
	"withdrawal_period_meat" numeric(8, 2),
	"veterinarian_name" varchar(255),
	"veterinarian_license" varchar(100),
	"cost" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_weight_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"weight_kg" numeric(8, 2) NOT NULL,
	"body_condition_score" integer,
	"measurement_method" varchar(50),
	"age_days" integer,
	"daily_gain_g" numeric(10, 2),
	"feed_conversion_ratio" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_movement_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"from_branch_id" uuid NOT NULL,
	"to_branch_id" uuid NOT NULL,
	"transport_method" varchar(50),
	"vehicle_registration" varchar(50),
	"driver_name" varchar(255),
	"departure_date" timestamp,
	"arrival_date" timestamp,
	"reason" varchar(100),
	"health_certificate_number" varchar(100),
	"quarantine_required" boolean DEFAULT false,
	"distance_km" numeric(8, 2),
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"approval_status" varchar(24) DEFAULT 'not_required' NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp,
	"approval_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_treatment_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"diagnosis" varchar(255) NOT NULL,
	"diagnosis_code" varchar(50),
	"severity" varchar(20),
	"symptoms" text,
	"treatment_duration_days" integer,
	"route_of_administration" varchar(20),
	"treatment_cost" numeric(10, 2),
	"withdrawal_period_milk" integer,
	"withdrawal_period_meat" integer,
	"veterinarian_name" varchar(255),
	"veterinarian_license" varchar(100),
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" date,
	"outcome" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_treatment_medications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"treatment_event_id" uuid NOT NULL,
	"medication_id" uuid,
	"medication_name" varchar(255) NOT NULL,
	"dosage" varchar(50),
	"dosage_unit" varchar(20),
	"route_of_administration" varchar(20),
	"frequency" varchar(50),
	"duration_days" integer,
	"withdrawal_period_milk" integer,
	"withdrawal_period_meat" integer,
	"batch_number" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_health_record_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"diagnosis" varchar(255) NOT NULL,
	"symptoms" text,
	"findings" text,
	"treatment_plan" text,
	"outcome" varchar(100),
	"vet_name" varchar(255),
	"next_check_date" date,
	"cost" numeric(12, 2),
	"attachment_file_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_breeding_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"sire_id" uuid NOT NULL,
	"breeding_method" varchar(50) NOT NULL,
	"semen_batch_number" varchar(100),
	"semen_source" varchar(255),
	"technician_name" varchar(255),
	"pregnancy_check_date" date,
	"pregnancy_status" varchar(50),
	"expected_calving_date" date,
	"number_of_straws" integer,
	"breeding_soundness_score" varchar(20),
	"sync_protocol_used" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_birth_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"calving_ease_score" integer,
	"number_of_calves" integer,
	"calf_sex" varchar(20),
	"calf_birth_weight_kg" numeric(6, 2),
	"calf_tag_numbers" text[],
	"complications" varchar(100),
	"assistance_required" boolean DEFAULT false,
	"maternal_sire_id" uuid,
	"colostrum_given" boolean DEFAULT true,
	"calf_vitality_score" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_sale_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"buyer_name" varchar(255) NOT NULL,
	"buyer_contact" varchar(255),
	"sale_price" numeric(12, 2) NOT NULL,
	"sale_weight_kg" numeric(8, 2),
	"price_per_kg" numeric(10, 2),
	"market_location" varchar(255),
	"sale_category" varchar(50),
	"payment_method" varchar(50),
	"invoice_number" varchar(100),
	"transport_included" boolean DEFAULT false,
	"commission_deducted" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_death_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"date_of_death" date NOT NULL,
	"cause_of_death" varchar(100) NOT NULL,
	"cause_category" varchar(50),
	"disposal_method" varchar(50),
	"veterinarian_name" varchar(255),
	"necropsy_performed" boolean DEFAULT false,
	"necropsy_findings" text,
	"insurance_claim_filed" boolean DEFAULT false,
	"estimated_value_loss" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_note_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"note_type" varchar(50),
	"priority" varchar(20),
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" date,
	"assigned_to" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_medications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"default_dosage_unit" varchar(50),
	"default_route_of_administration" varchar(50),
	"default_withdrawal_period_milk" integer,
	"default_withdrawal_period_meat" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_group_birth_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"quantity_born" integer NOT NULL,
	"average_birth_weight_kg" numeric(10, 3),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "livestock_group_death_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"quantity_dead" integer NOT NULL,
	"cause_category" varchar(64),
	"cause_of_death" text
);
--> statement-breakpoint
CREATE TABLE "livestock_group_health_record_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"diagnosis" varchar(255) NOT NULL,
	"symptoms" text,
	"findings" text,
	"treatment_plan" text,
	"outcome" varchar(100),
	"vet_name" varchar(255),
	"next_check_date" date,
	"cost" numeric(12, 2),
	"attachment_file_ids" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_group_movement_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"from_branch_id" uuid,
	"to_branch_id" uuid,
	"quantity_moved" integer,
	"reason" text,
	"transport_method" varchar(64),
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"approval_status" varchar(24) DEFAULT 'not_required' NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp,
	"approval_note" text
);
--> statement-breakpoint
CREATE TABLE "livestock_group_note_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"note_category" varchar(64),
	"note_text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_group_sale_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"quantity_sold" integer NOT NULL,
	"sale_price" numeric(12, 2) NOT NULL,
	"buyer_name" varchar(255),
	"sale_category" varchar(64),
	"payment_method" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "livestock_group_treatment_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"diagnosis" varchar(255) NOT NULL,
	"severity" varchar(32),
	"outcome" varchar(64),
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"treatment_cost" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "livestock_group_vaccination_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"event_date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"vaccine_name" varchar(255) NOT NULL,
	"batch_number" varchar(128),
	"dosage" varchar(64),
	"dosage_unit" varchar(32),
	"route_of_administration" varchar(64),
	"next_due_date" timestamp,
	"veterinarian_name" varchar(255),
	"cost" numeric(12, 2)
);
--> statement-breakpoint
ALTER TABLE "tenant_roles" ADD CONSTRAINT "tenant_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_user" ADD CONSTRAINT "platform_user_role_id_platform_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."platform_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_user_account" ADD CONSTRAINT "platform_user_account_user_id_platform_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."platform_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_user_session" ADD CONSTRAINT "platform_user_session_user_id_platform_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."platform_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_user" ADD CONSTRAINT "tenant_user_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_user" ADD CONSTRAINT "tenant_user_role_id_tenant_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."tenant_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_user_account" ADD CONSTRAINT "tenant_user_account_user_id_tenant_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tenant_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_user_session" ADD CONSTRAINT "tenant_user_session_user_id_tenant_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tenant_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_user_session" ADD CONSTRAINT "tenant_user_session_impersonator_admin_id_platform_user_id_fk" FOREIGN KEY ("impersonator_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_refresh_tokens" ADD CONSTRAINT "tenant_refresh_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_refresh_tokens" ADD CONSTRAINT "tenant_refresh_tokens_user_id_tenant_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tenant_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_image_file_id_uploaded_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_manager_id_tenant_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."tenant_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_image_file_id_uploaded_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_created_by_admin_id_platform_user_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_updated_by_admin_id_platform_user_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_metrics" ADD CONSTRAINT "analytics_daily_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_tenant_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tenant_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breeds" ADD CONSTRAINT "breeds_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_animal_events" ADD CONSTRAINT "livestock_animal_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_animal_events" ADD CONSTRAINT "livestock_animal_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_animals" ADD CONSTRAINT "livestock_animals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_animals" ADD CONSTRAINT "livestock_animals_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_animals" ADD CONSTRAINT "livestock_animals_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_animals" ADD CONSTRAINT "livestock_animals_breed_id_breeds_id_fk" FOREIGN KEY ("breed_id") REFERENCES "public"."breeds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_events" ADD CONSTRAINT "livestock_group_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_events" ADD CONSTRAINT "livestock_group_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_groups" ADD CONSTRAINT "livestock_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_groups" ADD CONSTRAINT "livestock_groups_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_groups" ADD CONSTRAINT "livestock_groups_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_tag_sequences" ADD CONSTRAINT "livestock_tag_sequences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_tag_sequences" ADD CONSTRAINT "livestock_tag_sequences_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_vaccination_events" ADD CONSTRAINT "livestock_vaccination_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_vaccination_events" ADD CONSTRAINT "livestock_vaccination_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_weight_events" ADD CONSTRAINT "livestock_weight_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_weight_events" ADD CONSTRAINT "livestock_weight_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_movement_events" ADD CONSTRAINT "livestock_movement_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_movement_events" ADD CONSTRAINT "livestock_movement_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_movement_events" ADD CONSTRAINT "livestock_movement_events_from_branch_id_branches_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_movement_events" ADD CONSTRAINT "livestock_movement_events_to_branch_id_branches_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_movement_events" ADD CONSTRAINT "livestock_movement_events_approved_by_user_id_tenant_user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."tenant_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_treatment_events" ADD CONSTRAINT "livestock_treatment_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_treatment_events" ADD CONSTRAINT "livestock_treatment_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_treatment_medications" ADD CONSTRAINT "livestock_treatment_medications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_treatment_medications" ADD CONSTRAINT "livestock_treatment_medications_treatment_event_id_livestock_treatment_events_id_fk" FOREIGN KEY ("treatment_event_id") REFERENCES "public"."livestock_treatment_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_treatment_medications" ADD CONSTRAINT "livestock_treatment_medications_medication_id_livestock_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."livestock_medications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_health_record_events" ADD CONSTRAINT "livestock_health_record_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_health_record_events" ADD CONSTRAINT "livestock_health_record_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_breeding_events" ADD CONSTRAINT "livestock_breeding_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_breeding_events" ADD CONSTRAINT "livestock_breeding_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_breeding_events" ADD CONSTRAINT "livestock_breeding_events_sire_id_livestock_animals_id_fk" FOREIGN KEY ("sire_id") REFERENCES "public"."livestock_animals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_birth_events" ADD CONSTRAINT "livestock_birth_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_birth_events" ADD CONSTRAINT "livestock_birth_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_birth_events" ADD CONSTRAINT "livestock_birth_events_maternal_sire_id_livestock_animals_id_fk" FOREIGN KEY ("maternal_sire_id") REFERENCES "public"."livestock_animals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_sale_events" ADD CONSTRAINT "livestock_sale_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_sale_events" ADD CONSTRAINT "livestock_sale_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_death_events" ADD CONSTRAINT "livestock_death_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_death_events" ADD CONSTRAINT "livestock_death_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_note_events" ADD CONSTRAINT "livestock_note_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_note_events" ADD CONSTRAINT "livestock_note_events_animal_id_livestock_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."livestock_animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_medications" ADD CONSTRAINT "livestock_medications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_birth_events" ADD CONSTRAINT "livestock_group_birth_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_birth_events" ADD CONSTRAINT "livestock_group_birth_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_death_events" ADD CONSTRAINT "livestock_group_death_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_death_events" ADD CONSTRAINT "livestock_group_death_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_health_record_events" ADD CONSTRAINT "livestock_group_health_record_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_health_record_events" ADD CONSTRAINT "livestock_group_health_record_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_movement_events" ADD CONSTRAINT "livestock_group_movement_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_movement_events" ADD CONSTRAINT "livestock_group_movement_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_movement_events" ADD CONSTRAINT "livestock_group_movement_events_approved_by_user_id_tenant_user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."tenant_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_note_events" ADD CONSTRAINT "livestock_group_note_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_note_events" ADD CONSTRAINT "livestock_group_note_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_sale_events" ADD CONSTRAINT "livestock_group_sale_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_sale_events" ADD CONSTRAINT "livestock_group_sale_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_treatment_events" ADD CONSTRAINT "livestock_group_treatment_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_treatment_events" ADD CONSTRAINT "livestock_group_treatment_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_vaccination_events" ADD CONSTRAINT "livestock_group_vaccination_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_vaccination_events" ADD CONSTRAINT "livestock_group_vaccination_events_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_roles_tenant_idx" ON "tenant_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_user_tenant_idx" ON "tenant_user" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_user_tenant_email_unique" ON "tenant_user" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_refresh_tokens_token_hash_uidx" ON "tenant_refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "tenant_refresh_tokens_user_idx" ON "tenant_refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_refresh_tokens_tenant_user_idx" ON "tenant_refresh_tokens" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "uploaded_files_tenant_idx" ON "uploaded_files" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "uploaded_files_public_idx" ON "uploaded_files" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "uploaded_files_tenant_public_idx" ON "uploaded_files" USING btree ("tenant_id","is_public");--> statement-breakpoint
CREATE INDEX "uploaded_files_status_idx" ON "uploaded_files" USING btree ("status");--> statement-breakpoint
CREATE INDEX "uploaded_files_tenant_status_idx" ON "uploaded_files" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "uploaded_files_attached_idx" ON "uploaded_files" USING btree ("attached_to_type","attached_to_id");--> statement-breakpoint
CREATE INDEX "uploaded_files_tenant_attached_idx" ON "uploaded_files" USING btree ("tenant_id","attached_to_type","attached_to_id");--> statement-breakpoint
CREATE INDEX "uploaded_files_expires_idx" ON "uploaded_files" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "processed_events_event_handler_unique" ON "processed_events" USING btree ("event_id","handler");--> statement-breakpoint
CREATE INDEX "banners_type_idx" ON "banners" USING btree ("type");--> statement-breakpoint
CREATE INDEX "banners_active_idx" ON "banners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "banners_active_date_idx" ON "banners" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "analytics_events_tenant_type_time_idx" ON "analytics_events" USING btree ("tenant_id","event_type","timestamp");--> statement-breakpoint
CREATE INDEX "analytics_events_time_idx" ON "analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "breeds_species_idx" ON "breeds" USING btree ("species_id");--> statement-breakpoint
CREATE INDEX "breeds_active_idx" ON "breeds" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "breeds_species_name_unique" ON "breeds" USING btree ("species_id","name");--> statement-breakpoint
CREATE INDEX "livestock_animal_events_tenant_idx" ON "livestock_animal_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_animal_events_tenant_animal_idx" ON "livestock_animal_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_animal_events_tenant_animal_event_date_idx" ON "livestock_animal_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_animal_events_tenant_event_date_idx" ON "livestock_animal_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_animal_events_tenant_animal_type_source_unique" ON "livestock_animal_events" USING btree ("tenant_id","animal_id","event_type","source_id") WHERE "livestock_animal_events"."source_id" is not null;--> statement-breakpoint
CREATE INDEX "livestock_animals_tenant_idx" ON "livestock_animals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_animals_tenant_branch_idx" ON "livestock_animals" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE INDEX "livestock_animals_tenant_status_idx" ON "livestock_animals" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "livestock_animals_tenant_sex_idx" ON "livestock_animals" USING btree ("tenant_id","sex");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_animals_tenant_tag_unique" ON "livestock_animals" USING btree ("tenant_id","tag_number");--> statement-breakpoint
CREATE INDEX "livestock_group_events_tenant_idx" ON "livestock_group_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_group_events_tenant_group_idx" ON "livestock_group_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "livestock_group_events_tenant_group_event_date_idx" ON "livestock_group_events" USING btree ("tenant_id","group_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_group_events_tenant_group_source_idx" ON "livestock_group_events" USING btree ("tenant_id","group_id","event_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_group_events_tenant_group_type_source_unique" ON "livestock_group_events" USING btree ("tenant_id","group_id","event_type","source_id") WHERE "livestock_group_events"."source_id" is not null;--> statement-breakpoint
CREATE INDEX "livestock_groups_tenant_idx" ON "livestock_groups" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_groups_tenant_branch_idx" ON "livestock_groups" USING btree ("tenant_id","branch_id");--> statement-breakpoint
CREATE INDEX "livestock_groups_tenant_species_idx" ON "livestock_groups" USING btree ("tenant_id","species_id");--> statement-breakpoint
CREATE INDEX "livestock_groups_tenant_status_idx" ON "livestock_groups" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_groups_tenant_batch_code_unique" ON "livestock_groups" USING btree ("tenant_id","batch_code");--> statement-breakpoint
CREATE INDEX "livestock_tag_sequences_tenant_idx" ON "livestock_tag_sequences" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_tag_sequences_tenant_branch_prefix_unique" ON "livestock_tag_sequences" USING btree ("tenant_id","branch_id","prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_tag_sequences_tenant_prefix_null_branch_unique" ON "livestock_tag_sequences" USING btree ("tenant_id","prefix") WHERE "livestock_tag_sequences"."branch_id" is null;--> statement-breakpoint
CREATE INDEX "livestock_vaccination_events_tenant_idx" ON "livestock_vaccination_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_vaccination_events_tenant_animal_idx" ON "livestock_vaccination_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_vaccination_events_tenant_animal_event_date_idx" ON "livestock_vaccination_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_vaccination_events_tenant_event_date_idx" ON "livestock_vaccination_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_weight_events_tenant_idx" ON "livestock_weight_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_weight_events_tenant_animal_idx" ON "livestock_weight_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_weight_events_tenant_animal_event_date_idx" ON "livestock_weight_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_weight_events_tenant_event_date_idx" ON "livestock_weight_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_movement_events_tenant_idx" ON "livestock_movement_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_movement_events_tenant_animal_idx" ON "livestock_movement_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_movement_events_tenant_animal_event_date_idx" ON "livestock_movement_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_movement_events_tenant_event_date_idx" ON "livestock_movement_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_treatment_events_tenant_idx" ON "livestock_treatment_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_treatment_events_tenant_animal_idx" ON "livestock_treatment_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_treatment_events_tenant_animal_event_date_idx" ON "livestock_treatment_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_treatment_events_tenant_event_date_idx" ON "livestock_treatment_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_treatment_medications_tenant_idx" ON "livestock_treatment_medications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_treatment_medications_tenant_treatment_idx" ON "livestock_treatment_medications" USING btree ("tenant_id","treatment_event_id");--> statement-breakpoint
CREATE INDEX "livestock_health_record_events_tenant_idx" ON "livestock_health_record_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_health_record_events_tenant_animal_idx" ON "livestock_health_record_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_health_record_events_tenant_animal_event_date_idx" ON "livestock_health_record_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_health_record_events_tenant_event_date_idx" ON "livestock_health_record_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_breeding_events_tenant_idx" ON "livestock_breeding_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_breeding_events_tenant_animal_idx" ON "livestock_breeding_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_breeding_events_tenant_animal_event_date_idx" ON "livestock_breeding_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_breeding_events_tenant_event_date_idx" ON "livestock_breeding_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_birth_events_tenant_idx" ON "livestock_birth_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_birth_events_tenant_animal_idx" ON "livestock_birth_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_birth_events_tenant_animal_event_date_idx" ON "livestock_birth_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_birth_events_tenant_event_date_idx" ON "livestock_birth_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_sale_events_tenant_idx" ON "livestock_sale_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_sale_events_tenant_animal_idx" ON "livestock_sale_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_sale_events_tenant_animal_unique" ON "livestock_sale_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_sale_events_tenant_animal_event_date_idx" ON "livestock_sale_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_sale_events_tenant_event_date_idx" ON "livestock_sale_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_death_events_tenant_idx" ON "livestock_death_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_death_events_tenant_animal_idx" ON "livestock_death_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_death_events_tenant_animal_unique" ON "livestock_death_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_death_events_tenant_animal_event_date_idx" ON "livestock_death_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_death_events_tenant_event_date_idx" ON "livestock_death_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_note_events_tenant_idx" ON "livestock_note_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "livestock_note_events_tenant_animal_idx" ON "livestock_note_events" USING btree ("tenant_id","animal_id");--> statement-breakpoint
CREATE INDEX "livestock_note_events_tenant_animal_event_date_idx" ON "livestock_note_events" USING btree ("tenant_id","animal_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_note_events_tenant_event_date_idx" ON "livestock_note_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "livestock_medications_tenant_idx" ON "livestock_medications" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "livestock_medications_tenant_name_unique" ON "livestock_medications" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "group_birth_events_tenant_idx" ON "livestock_group_birth_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "group_birth_events_tenant_group_idx" ON "livestock_group_birth_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "group_birth_events_tenant_event_date_idx" ON "livestock_group_birth_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "group_birth_events_tenant_group_event_date_idx" ON "livestock_group_birth_events" USING btree ("tenant_id","group_id","event_date");--> statement-breakpoint
CREATE INDEX "group_death_events_tenant_idx" ON "livestock_group_death_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "group_death_events_tenant_group_idx" ON "livestock_group_death_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "group_death_events_tenant_event_date_idx" ON "livestock_group_death_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "group_death_events_tenant_group_event_date_idx" ON "livestock_group_death_events" USING btree ("tenant_id","group_id","event_date");--> statement-breakpoint
CREATE INDEX "group_health_record_events_tenant_idx" ON "livestock_group_health_record_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "group_health_record_events_tenant_group_idx" ON "livestock_group_health_record_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "group_health_record_events_tenant_event_date_idx" ON "livestock_group_health_record_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "group_health_record_events_tenant_group_event_date_idx" ON "livestock_group_health_record_events" USING btree ("tenant_id","group_id","event_date");--> statement-breakpoint
CREATE INDEX "group_movement_events_tenant_idx" ON "livestock_group_movement_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "group_movement_events_tenant_group_idx" ON "livestock_group_movement_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "group_movement_events_tenant_event_date_idx" ON "livestock_group_movement_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "group_movement_events_tenant_group_event_date_idx" ON "livestock_group_movement_events" USING btree ("tenant_id","group_id","event_date");--> statement-breakpoint
CREATE INDEX "group_note_events_tenant_idx" ON "livestock_group_note_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "group_note_events_tenant_group_idx" ON "livestock_group_note_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "group_note_events_tenant_event_date_idx" ON "livestock_group_note_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "group_note_events_tenant_group_event_date_idx" ON "livestock_group_note_events" USING btree ("tenant_id","group_id","event_date");--> statement-breakpoint
CREATE INDEX "group_sale_events_tenant_idx" ON "livestock_group_sale_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "group_sale_events_tenant_group_idx" ON "livestock_group_sale_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "group_sale_events_tenant_event_date_idx" ON "livestock_group_sale_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "group_sale_events_tenant_group_event_date_idx" ON "livestock_group_sale_events" USING btree ("tenant_id","group_id","event_date");--> statement-breakpoint
CREATE INDEX "group_treatment_events_tenant_idx" ON "livestock_group_treatment_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "group_treatment_events_tenant_group_idx" ON "livestock_group_treatment_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "group_treatment_events_tenant_event_date_idx" ON "livestock_group_treatment_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "group_treatment_events_tenant_group_event_date_idx" ON "livestock_group_treatment_events" USING btree ("tenant_id","group_id","event_date");--> statement-breakpoint
CREATE INDEX "group_vaccination_events_tenant_idx" ON "livestock_group_vaccination_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "group_vaccination_events_tenant_group_idx" ON "livestock_group_vaccination_events" USING btree ("tenant_id","group_id");--> statement-breakpoint
CREATE INDEX "group_vaccination_events_tenant_event_date_idx" ON "livestock_group_vaccination_events" USING btree ("tenant_id","event_date");--> statement-breakpoint
CREATE INDEX "group_vaccination_events_tenant_group_event_date_idx" ON "livestock_group_vaccination_events" USING btree ("tenant_id","group_id","event_date");