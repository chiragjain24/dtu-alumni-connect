import { Hono } from 'hono';
import { db } from '../db';
import { tweets, likes, retweets } from '../db/schema/tweets';
import { user as users } from '../db/schema/auth';
import { eq, desc, and, sql, isNull, asc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Validation schemas
const createTweetSchema = z.object({
  content: z.string().min(1).max(2048),
  parentTweetId: z.string().optional(),
});

const tweetParamsSchema = z.object({
  id: z.string(),
});

const userParamsSchema = z.object({
  id: z.string(),
});

// Middleware to require authentication
const requireAuth = async (c: any, next: any) => {
  const currentUser = c.get('user');
  if (!currentUser) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  await next();
};

// Helper function to build nested tweet threads
function buildNestedReplies(allReplies: any[], parentId: string): any[] {
  const directReplies = allReplies.filter(reply => reply.parentTweetId === parentId);
  
  return directReplies.map(reply => ({
    ...reply,
    replies: buildNestedReplies(allReplies, reply.id)
  }));
}

const app = new Hono<{
    Variables: {
      user: typeof import('../lib/auth').auth.$Infer.Session.user | null;
      session: typeof import('../lib/auth').auth.$Infer.Session.session | null;
    }
  }>()

// GET /api/tweets - Get timeline tweets
.get('/', requireAuth, async (c) => {
  const currentUser = c.get('user');
  
  try {
    const timelineTweets = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
        isRetweet: tweets.isRetweet,
        originalTweetId: tweets.originalTweetId,
        likesCount: tweets.likesCount,
        retweetsCount: tweets.retweetsCount,
        repliesCount: tweets.repliesCount,
        createdAt: tweets.createdAt,
        updatedAt: tweets.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorImage: users.image,
        // Use conditional aggregation to check if user liked/retweeted
        isLikedByUser: sql<boolean>`CASE WHEN ${likes.userId} IS NOT NULL THEN true ELSE false END`,
        isRetweetedByUser: sql<boolean>`CASE WHEN ${retweets.userId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(tweets)
      .leftJoin(users, eq(tweets.authorId, users.id))
      .leftJoin(likes, and(
        eq(likes.tweetId, tweets.id),
        eq(likes.userId, currentUser!.id)
      ))
      .leftJoin(retweets, and(
        eq(retweets.tweetId, tweets.id),
        eq(retweets.userId, currentUser!.id)
      ))
      .where(isNull(tweets.parentTweetId)) // Only top-level tweets
      .orderBy(desc(tweets.createdAt))
      .limit(20);

    return c.json({ tweets: timelineTweets });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    throw new HTTPException(500, { message: 'Failed to fetch timeline' });
  }
})

// POST /api/tweets - Create new tweet
.post('/', requireAuth, zValidator('json', createTweetSchema), async (c) => {
  const currentUser = c.get('user');
  const { content, parentTweetId } = c.req.valid('json');

  try {
    // If it's a reply, verify parent exists and increment reply count  
    if (parentTweetId) {
      const [updatedParent] = await db
        .update(tweets)
        .set({ 
          repliesCount: sql`${tweets.repliesCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(tweets.id, parentTweetId))
        .returning({ id: tweets.id });

      if (!updatedParent) {
        throw new HTTPException(404, { message: 'Parent tweet not found' });
      }
    }

    // Insert new tweet
    const [newTweet] = await db
      .insert(tweets)
      .values({
        content,
        authorId: currentUser!.id,
        parentTweetId,
      })
      .returning();

    // Build optimistic response with current user data (avoid extra DB call)
    const tweetResponse = {
      id: newTweet.id,
      content: newTweet.content,
      authorId: newTweet.authorId,
      parentTweetId: newTweet.parentTweetId,
      isRetweet: newTweet.isRetweet,
      originalTweetId: newTweet.originalTweetId,
      likesCount: newTweet.likesCount,
      retweetsCount: newTweet.retweetsCount,
      repliesCount: newTweet.repliesCount,
      createdAt: newTweet.createdAt,
      updatedAt: newTweet.updatedAt,
      // Use current user data from session (no DB call needed)
      authorName: currentUser!.name,
      authorUsername: currentUser!.username,
      authorImage: currentUser!.image,
      // New tweets are never liked/retweeted by the author initially
      isLikedByUser: false,
      isRetweetedByUser: false,
    };

    return c.json({ tweet: tweetResponse }, 201);
  } catch (error) {
    console.error('Error creating tweet:', error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Failed to create tweet' });
  }
})

// GET /api/tweets/:id - Get single tweet
.get('/:id', requireAuth, zValidator('param', tweetParamsSchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');

  try {
    // Get main tweet with user interaction status in single query
    const [tweet] = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
        isRetweet: tweets.isRetweet,
        originalTweetId: tweets.originalTweetId,
        likesCount: tweets.likesCount,
        retweetsCount: tweets.retweetsCount,
        repliesCount: tweets.repliesCount,
        createdAt: tweets.createdAt,
        updatedAt: tweets.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorImage: users.image,
        isLikedByUser: sql<boolean>`CASE WHEN ${likes.userId} IS NOT NULL THEN true ELSE false END`,
        isRetweetedByUser: sql<boolean>`CASE WHEN ${retweets.userId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(tweets)
      .leftJoin(users, eq(tweets.authorId, users.id))
      .leftJoin(likes, and(
        eq(likes.tweetId, tweets.id),
        eq(likes.userId, currentUser!.id)
      ))
      .leftJoin(retweets, and(
        eq(retweets.tweetId, tweets.id),
        eq(retweets.userId, currentUser!.id)
      ))
      .where(eq(tweets.id, id))
      .limit(1);

    if (!tweet) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    // Get ALL replies in the thread (not just direct replies)
    const allReplies = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
        isRetweet: tweets.isRetweet,
        originalTweetId: tweets.originalTweetId,
        likesCount: tweets.likesCount,
        retweetsCount: tweets.retweetsCount,
        repliesCount: tweets.repliesCount,
        createdAt: tweets.createdAt,
        updatedAt: tweets.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorImage: users.image,
        isLikedByUser: sql<boolean>`CASE WHEN ${likes.userId} IS NOT NULL THEN true ELSE false END`,
        isRetweetedByUser: sql<boolean>`CASE WHEN ${retweets.userId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(tweets)
      .leftJoin(users, eq(tweets.authorId, users.id))
      .leftJoin(likes, and(
        eq(likes.tweetId, tweets.id),
        eq(likes.userId, currentUser!.id)
      ))
      .leftJoin(retweets, and(
        eq(retweets.tweetId, tweets.id),
        eq(retweets.userId, currentUser!.id)
      ))
      .where(sql`
        parent_tweet_id IS NOT NULL AND (
          parent_tweet_id = ${id} OR
          EXISTS (
            WITH RECURSIVE reply_tree AS (
              SELECT id, parent_tweet_id FROM tweets WHERE parent_tweet_id = ${id}
              UNION ALL
              SELECT t.id, t.parent_tweet_id 
              FROM tweets t
              INNER JOIN reply_tree rt ON t.parent_tweet_id = rt.id
            )
            SELECT 1 FROM reply_tree WHERE reply_tree.id = tweets.id
          )
        )
      `)
      .orderBy(asc(tweets.createdAt)); // Chronological order for threading

    // Build nested structure - only direct replies to the main tweet
    const nestedReplies = buildNestedReplies(allReplies, id);

    return c.json({ tweet, replies: nestedReplies });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Failed to fetch tweet' });
  }
})

// DELETE /api/tweets/:id - Delete tweet
.delete('/:id', requireAuth, zValidator('param', tweetParamsSchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');

  try {
    // Check if tweet exists and user owns it
    const [tweet] = await db
      .select({
        id: tweets.id,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
      })
      .from(tweets)
      .where(eq(tweets.id, id))
      .limit(1);

    if (!tweet) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    if (tweet.authorId !== currentUser!.id) {
      throw new HTTPException(403, { message: 'Not authorized to delete this tweet' });
    }

    // If it's a reply, decrement parent's reply count
    if (tweet.parentTweetId) {
      await db
        .update(tweets)
        .set({ 
          repliesCount: sql`GREATEST(0, ${tweets.repliesCount} - 1)`,
          updatedAt: new Date()
        })
        .where(eq(tweets.id, tweet.parentTweetId));
    }

    // Delete the tweet (cascading deletes will handle likes/retweets if configured)
    await db.delete(tweets).where(eq(tweets.id, id));

    return c.json({ message: 'Tweet deleted successfully' });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Failed to delete tweet' });
  }
})

// GET /api/tweets/user/:id - Get user tweets
.get('/user/:id', requireAuth, zValidator('param', userParamsSchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');

  try {
    const userTweets = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
        isRetweet: tweets.isRetweet,
        originalTweetId: tweets.originalTweetId,
        likesCount: tweets.likesCount,
        retweetsCount: tweets.retweetsCount,
        repliesCount: tweets.repliesCount,
        createdAt: tweets.createdAt,
        updatedAt: tweets.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorImage: users.image,
        isLikedByUser: sql<boolean>`CASE WHEN ${likes.userId} IS NOT NULL THEN true ELSE false END`,
        isRetweetedByUser: sql<boolean>`CASE WHEN ${retweets.userId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(tweets)
      .leftJoin(users, eq(tweets.authorId, users.id))
      .leftJoin(likes, and(
        eq(likes.tweetId, tweets.id),
        eq(likes.userId, currentUser!.id)
      ))
      .leftJoin(retweets, and(
        eq(retweets.tweetId, tweets.id),
        eq(retweets.userId, currentUser!.id)
      ))
      .where(and(
        eq(tweets.authorId, id),
        isNull(tweets.parentTweetId) // Only top-level tweets
      ))
      .orderBy(desc(tweets.createdAt))
      .limit(20);

    return c.json({ tweets: userTweets });
  } catch (error) {
    console.error('Error fetching user tweets:', error);
    throw new HTTPException(500, { message: 'Failed to fetch user tweets' });
  }
})

// POST /api/tweets/:id/like - Like/unlike tweet
.post('/:id/like', requireAuth,
    zValidator('param', tweetParamsSchema),
    zValidator('json', z.object({ isLike: z.boolean()})),
async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');
  const { isLike } = c.req.valid('json');

  try {
    // Single query to check both tweet existence and existing like status
    const [tweetWithLike] = await db
      .select({
        tweetId: tweets.id,
        likeId: likes.id,
      })
      .from(tweets)
      .leftJoin(likes, and(
        eq(likes.tweetId, tweets.id),
        eq(likes.userId, currentUser!.id)
      ))
      .where(eq(tweets.id, id))
      .limit(1);

    if (!tweetWithLike?.tweetId) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    const existingLike = !!tweetWithLike.likeId;
    
    if(isLike && !existingLike) {
      // Like the tweet - insert like record
      await db.insert(likes).values({
        userId: currentUser!.id,
        tweetId: id,
      });

      // Increment likes count
      await db
        .update(tweets)
        .set({ 
          likesCount: sql`${tweets.likesCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(tweets.id, id));

      return c.json({ message: 'Tweet liked', liked: true });
    }
    
    if(!isLike && existingLike) {
      // Unlike the tweet - delete like record
      await db.delete(likes).where(and(
        eq(likes.userId, currentUser!.id),
        eq(likes.tweetId, id)
      ));
      
      // Decrement likes count
      await db
        .update(tweets)
        .set({ 
          likesCount: sql`GREATEST(0, ${tweets.likesCount} - 1)`,
          updatedAt: new Date()
        })
        .where(eq(tweets.id, id));

      return c.json({ message: 'Tweet unliked', liked: false });
    } 
    
    return c.json({ message: 'Tweet already liked/unliked', liked: isLike });

  } catch (error) {
    console.error('Error toggling like:', error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Failed to toggle like' });
  }
})

// POST /api/tweets/:id/retweet - Retweet functionality
.post('/:id/retweet', requireAuth, zValidator('param', tweetParamsSchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');

  try {
    // Single query to check both tweet existence and existing retweet status
    const [tweetWithRetweet] = await db
      .select({
        tweetId: tweets.id,
        retweetId: retweets.id,
      })
      .from(tweets)
      .leftJoin(retweets, and(
        eq(retweets.tweetId, tweets.id),
        eq(retweets.userId, currentUser!.id)
      ))
      .where(eq(tweets.id, id))
      .limit(1);

    if (!tweetWithRetweet?.tweetId) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    const existingRetweet = !!tweetWithRetweet.retweetId;

    if (existingRetweet) {
      // Undo retweet - delete retweet record
      await db.delete(retweets).where(and(
        eq(retweets.userId, currentUser!.id),
        eq(retweets.tweetId, id)
      ));
      
      // Decrement retweets count
      await db
        .update(tweets)
        .set({ 
          retweetsCount: sql`GREATEST(0, ${tweets.retweetsCount} - 1)`,
          updatedAt: new Date()
        })
        .where(eq(tweets.id, id));

      return c.json({ message: 'Retweet removed', retweeted: false });
    } else {
      // Create retweet record
      await db.insert(retweets).values({
        userId: currentUser!.id,
        tweetId: id,
      });

      // Increment retweets count
      await db
        .update(tweets)
        .set({ 
          retweetsCount: sql`${tweets.retweetsCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(tweets.id, id));

      return c.json({ message: 'Tweet retweeted', retweeted: true });
    }
  } catch (error) {
    console.error('Error toggling retweet:', error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Failed to toggle retweet' });
  }
})

export { app as tweetsRoute }; 