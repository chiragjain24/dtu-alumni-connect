import { Hono } from 'hono';
import { db } from '../db';
import { tweets, likes, retweets } from '../db/schema/tweets';
import { user as userSchema } from '../db/schema/auth';
import { eq, desc, and, sql, isNull } from 'drizzle-orm';
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
  const user = c.get('user');
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  await next();
};

const app = new Hono<{
    Variables: {
      user: typeof import('../lib/auth').auth.$Infer.Session.user | null;
      session: typeof import('../lib/auth').auth.$Infer.Session.session | null;
    }
  }>()

// GET /api/tweets - Get timeline tweets
.get('/', requireAuth, async (c) => {
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
        authorName: userSchema.name,
        authorUsername: userSchema.username,
        authorImage: userSchema.image,
      })
      .from(tweets)
      .leftJoin(userSchema, eq(tweets.authorId, userSchema.id))
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
  const user = c.get('user');
  const { content, parentTweetId } = c.req.valid('json');

  try {
    // If it's a reply, verify parent tweet exists and increment reply count
    if (parentTweetId) {
      const parentTweet = await db
        .select()
        .from(tweets)
        .where(eq(tweets.id, parentTweetId))
        .limit(1);

      if (parentTweet.length === 0) {
        throw new HTTPException(404, { message: 'Parent tweet not found' });
      }

      // Increment reply count
      await db
        .update(tweets)
        .set({ 
          repliesCount: sql`${tweets.repliesCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(tweets.id, parentTweetId));
    }

    const [newTweet] = await db
      .insert(tweets)
      .values({
        content,
        authorId: user!.id,
        parentTweetId,
      })
      .returning();

    // Fetch the complete tweet with author info
    const [tweetWithAuthor] = await db
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
        authorName: userSchema.name,
        authorUsername: userSchema.username,
        authorImage: userSchema.image,
      })
      .from(tweets)
      .leftJoin(userSchema, eq(tweets.authorId, userSchema.id))
      .where(eq(tweets.id, newTweet.id))
      .limit(1);

    return c.json({ tweet: tweetWithAuthor }, 201);
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
  const { id } = c.req.valid('param');

  try {
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
        authorName: userSchema.name,
        authorUsername: userSchema.username,
        authorImage: userSchema.image,
      })
      .from(tweets)
      .leftJoin(userSchema, eq(tweets.authorId, userSchema.id))
      .where(eq(tweets.id, id))
      .limit(1);

    if (!tweet) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    // Get replies
    const replies = await db
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
        authorName: userSchema.name,
        authorUsername: userSchema.username,
        authorImage: userSchema.image,
      })
      .from(tweets)
      .leftJoin(userSchema, eq(tweets.authorId, userSchema.id))
      .where(eq(tweets.parentTweetId, id))
      .orderBy(desc(tweets.createdAt));

    return c.json({ tweet, replies });
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
  const user = c.get('user');
  const { id } = c.req.valid('param');

  try {
    // Check if tweet exists and user owns it
    const [tweet] = await db
      .select()
      .from(tweets)
      .where(eq(tweets.id, id))
      .limit(1);

    if (!tweet) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    if (tweet.authorId !== user!.id) {
      throw new HTTPException(403, { message: 'Not authorized to delete this tweet' });
    }

    // If it's a reply, decrement parent's reply count
    if (tweet.parentTweetId) {
      await db
        .update(tweets)
        .set({ 
          repliesCount: sql`${tweets.repliesCount} - 1`,
          updatedAt: new Date()
        })
        .where(eq(tweets.id, tweet.parentTweetId));
    }

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
        authorName: userSchema.name,
        authorUsername: userSchema.username,
        authorImage: userSchema.image,
      })
      .from(tweets)
      .leftJoin(userSchema, eq(tweets.authorId, userSchema.id))
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
});

export { app as tweetsRoute }; 