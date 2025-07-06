ALTER TABLE "notifications" ADD COLUMN "target_tweet_id" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_target_tweet_id_tweets_id_fk" FOREIGN KEY ("target_tweet_id") REFERENCES "public"."tweets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "target_id";