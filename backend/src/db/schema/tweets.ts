import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations } from "drizzle-orm";

export const tweets = pgTable("tweets", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  parentTweetId: text('parent_tweet_id'), // For replies
  isRetweet: boolean('is_retweet').$defaultFn(() => false).notNull(),
  originalTweetId: text('original_tweet_id'), // For retweets
  mediaUrls: text('media_urls').array(), // Array of image URLs from UploadThing
  likesCount: integer('likes_count').$defaultFn(() => 0).notNull(),
  retweetsCount: integer('retweets_count').$defaultFn(() => 0).notNull(),
  repliesCount: integer('replies_count').$defaultFn(() => 0).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
});

export const likes = pgTable("likes", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  tweetId: text('tweet_id').notNull().references(() => tweets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
});

export const retweets = pgTable("retweets", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  tweetId: text('tweet_id').notNull().references(() => tweets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
});

export const follows = pgTable("follows", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  followerId: text('follower_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
});

// Relations
export const tweetsRelations = relations(tweets, ({ one, many }) => ({
  author: one(user, {
    fields: [tweets.authorId],
    references: [user.id],
  }),
  parentTweet: one(tweets, {
    fields: [tweets.parentTweetId],
    references: [tweets.id],
    relationName: "replies",
  }),
  replies: many(tweets, {
    relationName: "replies",
  }),
  originalTweet: one(tweets, {
    fields: [tweets.originalTweetId],
    references: [tweets.id],
    relationName: "retweets",
  }),
  retweets: many(tweets, {
    relationName: "retweets",
  }),
  likes: many(likes),
  retweetRecords: many(retweets),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(user, {
    fields: [likes.userId],
    references: [user.id],
  }),
  tweet: one(tweets, {
    fields: [likes.tweetId],
    references: [tweets.id],
  }),
}));

export const retweetsRelations = relations(retweets, ({ one }) => ({
  user: one(user, {
    fields: [retweets.userId],
    references: [user.id],
  }),
  tweet: one(tweets, {
    fields: [retweets.tweetId],
    references: [tweets.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(user, {
    fields: [follows.followerId],
    references: [user.id],
    relationName: "follower",
  }),
  following: one(user, {
    fields: [follows.followingId],
    references: [user.id],
    relationName: "following",
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  tweets: many(tweets),
  likes: many(likes),
  retweets: many(retweets),
  followers: many(follows, {
    relationName: "following",
  }),
  following: many(follows, {
    relationName: "follower",
  }),
})); 