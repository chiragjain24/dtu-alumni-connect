ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "graduation_year" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "branch" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "current_company" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "current_role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_alumni_verified" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profile_setup_completed" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");