ALTER TABLE "tweets" ADD COLUMN "media" jsonb;--> statement-breakpoint
ALTER TABLE "tweets" DROP COLUMN "media_urls";