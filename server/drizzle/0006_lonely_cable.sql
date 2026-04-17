CREATE TABLE IF NOT EXISTS "prompts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"module" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
