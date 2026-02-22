CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"image_file_id" uuid,
	"meta_title" varchar(255),
	"meta_description" text,
	"meta_keywords" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_image_file_id_uploaded_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blog_categories_slug_unique" ON "blog_categories" USING btree ("slug");