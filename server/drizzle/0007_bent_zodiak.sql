ALTER TABLE "blog_tags" ADD COLUMN "image_file_id" uuid;--> statement-breakpoint
ALTER TABLE "blog_tags" ADD COLUMN "meta_title" varchar(255);--> statement-breakpoint
ALTER TABLE "blog_tags" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "blog_tags" ADD COLUMN "meta_keywords" text;--> statement-breakpoint
ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_image_file_id_uploaded_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."uploaded_files"("id") ON DELETE set null ON UPDATE no action;