CREATE TABLE IF NOT EXISTS "authpassword" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"auth_type" text NOT NULL,
	"auth_password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN IF EXISTS "auth_type";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN IF EXISTS "auth_password";