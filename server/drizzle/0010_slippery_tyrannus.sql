CREATE TYPE "public"."featured_entity_type" AS ENUM('POST', 'CATEGORY', 'TAG');--> statement-breakpoint
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
ALTER TABLE "featured_collections" ADD CONSTRAINT "featured_collections_created_by_admin_id_platform_user_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_collections" ADD CONSTRAINT "featured_collections_updated_by_admin_id_platform_user_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."platform_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_items" ADD CONSTRAINT "featured_items_collection_id_featured_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."featured_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "featured_collections_slug_idx" ON "featured_collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "featured_collections_active_idx" ON "featured_collections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "featured_items_collection_idx" ON "featured_items" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "featured_items_entity_idx" ON "featured_items" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "featured_items_order_idx" ON "featured_items" USING btree ("collection_id","sort_order");