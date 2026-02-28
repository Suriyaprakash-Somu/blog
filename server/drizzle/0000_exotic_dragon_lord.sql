CREATE TYPE "public"."featured_entity_type" AS ENUM('POST', 'CATEGORY', 'TAG');--> statement-breakpoint
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_tenant_required_for_user_actor" CHECK (("audit_logs"."actor_type" <> 'user') OR ("audit_logs"."tenant_id" IS NOT NULL))
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
CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"image_file_id" uuid,
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"image_file_id" uuid,
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"excerpt" text,
	"content" text,
	"table_of_contents" jsonb DEFAULT '[]'::jsonb,
	"read_time_minutes" integer DEFAULT 0,
	"faq" jsonb DEFAULT '[]'::jsonb,
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"is_featured" boolean DEFAULT false NOT NULL,
	"category_id" uuid,
	"featured_image_file_id" uuid,
	"content_image_file_ids" text[] DEFAULT '{}',
	"author_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "blog_post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_collections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_admin_id" uuid,
	"updated_by_admin_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "featured_collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "featured_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"collection_id" uuid NOT NULL,
	"entity_type" "featured_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_image_file_id_uploaded_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_created_by_admin_id_platform_user_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_updated_by_admin_id_platform_user_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_daily_metrics" ADD CONSTRAINT "analytics_daily_metrics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_tenant_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tenant_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_image_file_id_uploaded_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_image_file_id_uploaded_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featured_image_file_id_uploaded_files_id_fk" FOREIGN KEY ("featured_image_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_platform_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_blog_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_collections" ADD CONSTRAINT "featured_collections_created_by_admin_id_platform_user_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_collections" ADD CONSTRAINT "featured_collections_updated_by_admin_id_platform_user_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_items" ADD CONSTRAINT "featured_items_collection_id_featured_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."featured_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "banners_type_idx" ON "banners" USING btree ("type");--> statement-breakpoint
CREATE INDEX "banners_active_idx" ON "banners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "banners_active_date_idx" ON "banners" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "analytics_events_tenant_type_time_idx" ON "analytics_events" USING btree ("tenant_id","event_type","timestamp");--> statement-breakpoint
CREATE INDEX "analytics_events_time_idx" ON "analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_categories_slug_unique" ON "blog_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_tags_slug_unique" ON "blog_tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_posts_slug_unique" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "featured_collections_slug_idx" ON "featured_collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "featured_collections_active_idx" ON "featured_collections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "featured_items_collection_idx" ON "featured_items" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "featured_items_entity_idx" ON "featured_items" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "featured_items_order_idx" ON "featured_items" USING btree ("collection_id","sort_order");