ALTER TABLE "tweets" ADD COLUMN "media_items" jsonb;--> statement-breakpoint
ALTER TABLE "tweets" DROP COLUMN "media";