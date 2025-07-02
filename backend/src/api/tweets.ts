import { Hono } from 'hono';
import { db } from '../db';
import { tweets, likes, retweets, bookmarks } from '../db/schema/tweets';
import { user as users } from '../db/schema/auth';
import { eq, desc, and, sql, isNull } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { type Tweet, type TweetWithTreeMetadata } from '../types/types';
import { deleteUploadThingFiles } from '../lib/uploadthing-utils';

// Validation schemas
const mediaItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'document']),
  name: z.string(),
  size: z.number(),
  mimeType: z.string(),
});

const createTweetSchema = z.object({
  content: z.string().min(1).max(2048),
  parentTweetId: z.string().optional(),
  mediaItems: z.array(mediaItemSchema).max(4).optional(),
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

const app = new Hono<{
    Variables: {
      user: typeof import('../lib/auth').auth.$Infer.Session.user | null;
      session: typeof import('../lib/auth').auth.$Infer.Session.session | null;
    }
  }>()

// GET /api/tweets/timeline - Get timeline tweets
.get('/timeline', requireAuth, async (c) => {
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
        mediaItems: tweets.mediaItems,
        likesCount: tweets.likesCount,
        retweetsCount: tweets.retweetsCount,
        repliesCount: tweets.repliesCount,
        createdAt: tweets.createdAt,
        updatedAt: tweets.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorImage: users.image,
        // Use conditional aggregation to check if user liked/retweeted/bookmarked
        isLikedByUser: sql<boolean>`CASE WHEN ${likes.userId} IS NOT NULL THEN true ELSE false END`,
        isRetweetedByUser: sql<boolean>`CASE WHEN ${retweets.userId} IS NOT NULL THEN true ELSE false END`,
        isBookmarkedByUser: sql<boolean>`CASE WHEN ${bookmarks.userId} IS NOT NULL THEN true ELSE false END`,
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
      .leftJoin(bookmarks, and(
        eq(bookmarks.tweetId, tweets.id),
        eq(bookmarks.userId, currentUser!.id)
      ))
      .where(isNull(tweets.parentTweetId)) // Only top-level tweets
      .orderBy(desc(tweets.createdAt))
      .limit(100);

    return c.json({ tweets: timelineTweets });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    throw new HTTPException(500, { message: 'Failed to fetch timeline' });
  }
})

// POST /api/tweets/create - Create new tweet
.post('/create', requireAuth, zValidator('json', createTweetSchema), async (c) => {
  const currentUser = c.get('user');
  const { content, mediaItems, parentTweetId } = c.req.valid('json');

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
        mediaItems,
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
      mediaItems: newTweet.mediaItems,
      likesCount: newTweet.likesCount,
      retweetsCount: newTweet.retweetsCount,
      repliesCount: newTweet.repliesCount,
      createdAt: newTweet.createdAt,
      updatedAt: newTweet.updatedAt,
      // Use current user data from session (no DB call needed)
      authorName: currentUser!.name,
      authorUsername: currentUser!.username,
      authorImage: currentUser!.image,
      // New tweets are never liked/retweeted/bookmarked by the author initially
      isLikedByUser: false,
      isRetweetedByUser: false,
      isBookmarkedByUser: false,
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

// GET /api/tweets/tweet/:id - Get single tweet (OPTIMIZED - Single DB Query)
.get('/tweet/:id', requireAuth, zValidator('param', tweetParamsSchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');

  try {
    // Single comprehensive query that gets target tweet, all parents, and all replies
    const allTweets: TweetWithTreeMetadata[] = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
        isRetweet: tweets.isRetweet,
        originalTweetId: tweets.originalTweetId,
        mediaItems: tweets.mediaItems,
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
        isBookmarkedByUser: sql<boolean>`CASE WHEN ${bookmarks.userId} IS NOT NULL THEN true ELSE false END`,
        // Add metadata to distinguish tweet types
        nodeType: sql<'target' | 'parent' | 'reply' | 'unknown'>`
          CASE 
            WHEN tweets.id = ${id} THEN 'target'
            WHEN tweet_tree.direction = 'parent' THEN 'parent'
            WHEN tweet_tree.direction = 'reply' THEN 'reply'
            ELSE 'unknown'
          END
        `,
        treeLevel: sql<number>`COALESCE(tweet_tree.level, 0)`,
      })
             .from(sql`
         (
           WITH RECURSIVE 
           -- Get parent tweets by walking up the chain
           parent_tree AS (
             SELECT parent_tweet_id as id, 1 as level
             FROM tweets 
             WHERE id = ${id} AND parent_tweet_id IS NOT NULL
             
             UNION ALL
             
             SELECT t.parent_tweet_id as id, pt.level + 1 as level
             FROM tweets t
             INNER JOIN parent_tree pt ON t.id = pt.id
             WHERE t.parent_tweet_id IS NOT NULL AND pt.level < 10
           ),
           -- Get reply tweets by walking down the chain
           reply_tree AS (
             SELECT id, 1 as level
             FROM tweets 
             WHERE parent_tweet_id = ${id}
             
             UNION ALL
             
             SELECT t.id, rt.level + 1 as level
             FROM tweets t
             INNER JOIN reply_tree rt ON t.parent_tweet_id = rt.id
             WHERE rt.level < 10
           ),
           -- Combine all tweet IDs with their types
           tweet_tree AS (
             -- Target tweet
             SELECT ${id} as id, 'target' as direction, 0 as level
             
             UNION ALL
             
             -- Parent tweets
             SELECT id, 'parent' as direction, level
             FROM parent_tree
             
             UNION ALL
             
             -- Reply tweets
             SELECT id, 'reply' as direction, level
             FROM reply_tree
           )
           SELECT * FROM tweet_tree
         ) AS tweet_tree
       `)
      .innerJoin(tweets, eq(sql`tweet_tree.id`, tweets.id))
      .leftJoin(users, eq(tweets.authorId, users.id))
      .leftJoin(likes, and(
        eq(likes.tweetId, tweets.id),
        eq(likes.userId, currentUser!.id)
      ))
      .leftJoin(retweets, and(
        eq(retweets.tweetId, tweets.id),
        eq(retweets.userId, currentUser!.id)
      ))
      .leftJoin(bookmarks, and(
        eq(bookmarks.tweetId, tweets.id),
        eq(bookmarks.userId, currentUser!.id)
      ))
      .orderBy(
        // Sort by direction first (parents, target, replies)
        sql`CASE 
          WHEN tweet_tree.direction = 'parent' THEN 1 
          WHEN tweet_tree.direction = 'target' THEN 2 
          WHEN tweet_tree.direction = 'reply' THEN 3 
        END`,
        // Then sort parents chronologically (oldest first)
        sql`CASE 
          WHEN tweet_tree.direction = 'parent' THEN ${tweets.createdAt} 
        END ASC`,
        // Sort replies reverse chronologically (newest first)  
        sql`CASE 
          WHEN tweet_tree.direction = 'reply' THEN ${tweets.createdAt} 
        END DESC`
      );

    if (allTweets.length === 0) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    // Separate tweets by type
    const targetTweet = allTweets.find(t => t.nodeType === 'target');
    const parentTweetsRaw = allTweets.filter(t => t.nodeType === 'parent');
    const allReplies = allTweets.filter(t => t.nodeType === 'reply');

    if (!targetTweet) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    // Clean up metadata fields from the results
    const { nodeType: _, treeLevel: __, ...tweet } = targetTweet;
    const parentTweets = parentTweetsRaw.map(({ nodeType, treeLevel, ...tweetData }) => tweetData);

    // Helper recursive function to build nested tweet threads
    const buildNestedReplies = (allReplies: TweetWithTreeMetadata[], parentId: string): Tweet[] => {
      const directReplies = allReplies.filter(reply => reply.parentTweetId === parentId);
      
      return directReplies
        .map(reply => {
          // Remove metadata fields when building the final structure
          const { nodeType, treeLevel, ...tweetData } = reply;
          return {
            ...tweetData,
            replies: buildNestedReplies(allReplies, reply.id)
          };
        });
    };

    // Build nested structure - only direct replies to the main tweet
    const nestedReplies = buildNestedReplies(allReplies, id);

    return c.json({ tweet, parentTweets, replies: nestedReplies });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Failed to fetch tweet' });
  }
})

// DELETE /api/tweets/tweet/:id - Delete tweet
.delete('/tweet/:id', requireAuth, zValidator('param', tweetParamsSchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');

  try {
    // Check if tweet exists and user owns it
    const [tweet] = await db
      .select({
        id: tweets.id,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
        mediaItems: tweets.mediaItems,
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

    await deleteUploadThingFiles(tweet.mediaItems?.map(item => item.url) || []);
    
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

// POST /api/tweets/:id/like - Like/unlike tweet
.post('/:id/like', requireAuth, zValidator('param', tweetParamsSchema), zValidator('json', z.object({ isLike: z.boolean()})), async (c) => {
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

// POST /api/tweets/:id/bookmark - Bookmark/unbookmark tweet
.post('/:id/bookmark', requireAuth, zValidator('param', tweetParamsSchema), zValidator('json', z.object({ isBookmark: z.boolean()})), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');
  const { isBookmark } = c.req.valid('json');

  try {
    // Single query to check both tweet existence and existing bookmark status
    const [tweetWithBookmark] = await db
      .select({
        tweetId: tweets.id,
        bookmarkId: bookmarks.id,
      })
      .from(tweets)
      .leftJoin(bookmarks, and(
        eq(bookmarks.tweetId, tweets.id),
        eq(bookmarks.userId, currentUser!.id)
      ))
      .where(eq(tweets.id, id))
      .limit(1);

    if (!tweetWithBookmark?.tweetId) {
      throw new HTTPException(404, { message: 'Tweet not found' });
    }

    const existingBookmark = !!tweetWithBookmark.bookmarkId;
    
    if(isBookmark && !existingBookmark) {
      // Bookmark the tweet - insert bookmark record
      await db.insert(bookmarks).values({
        userId: currentUser!.id,
        tweetId: id,
      });

      return c.json({ message: 'Tweet bookmarked', bookmarked: true });
    }
    
    if(!isBookmark && existingBookmark) {
      // Unbookmark the tweet - delete bookmark record
      await db.delete(bookmarks).where(and(
        eq(bookmarks.userId, currentUser!.id),
        eq(bookmarks.tweetId, id)
      ));

      return c.json({ message: 'Tweet unbookmarked', bookmarked: false });
    } 
    
    return c.json({ message: 'Tweet already bookmarked/unbookmarked', bookmarked: isBookmark });

  } catch (error) {
    console.error('Error toggling bookmark:', error);
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(500, { message: 'Failed to toggle bookmark' });
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
        mediaItems: tweets.mediaItems,
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
        isBookmarkedByUser: sql<boolean>`CASE WHEN ${bookmarks.userId} IS NOT NULL THEN true ELSE false END`,
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
      .leftJoin(bookmarks, and(
        eq(bookmarks.tweetId, tweets.id),
        eq(bookmarks.userId, currentUser!.id)
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

// GET /api/tweets/user/:id/likes - Get user's liked tweets
.get('/user/:id/likes', requireAuth, zValidator('param', userParamsSchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');

  try {
    const likedTweets = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
        isRetweet: tweets.isRetweet,
        originalTweetId: tweets.originalTweetId,
        mediaItems: tweets.mediaItems,
        likesCount: tweets.likesCount,
        retweetsCount: tweets.retweetsCount,
        repliesCount: tweets.repliesCount,
        createdAt: tweets.createdAt,
        updatedAt: tweets.updatedAt,
        authorName: users.name,
        authorUsername: users.username,
        authorImage: users.image,
        isLikedByUser: sql<boolean>`CASE WHEN current_user_likes.user_id IS NOT NULL THEN true ELSE false END`,
        isRetweetedByUser: sql<boolean>`CASE WHEN ${retweets.userId} IS NOT NULL THEN true ELSE false END`,
        isBookmarkedByUser: sql<boolean>`CASE WHEN ${bookmarks.userId} IS NOT NULL THEN true ELSE false END`,
      })
      .from(likes)
      .innerJoin(tweets, eq(likes.tweetId, tweets.id))
      .leftJoin(users, eq(tweets.authorId, users.id))
      .leftJoin(
        sql`(SELECT user_id, tweet_id FROM likes WHERE user_id = ${currentUser!.id}) AS current_user_likes`, // temporary table
        sql`current_user_likes.tweet_id = ${tweets.id}`
      )
      .leftJoin(retweets, and(
        eq(retweets.tweetId, tweets.id),
        eq(retweets.userId, currentUser!.id)
      ))
      .leftJoin(bookmarks, and(
        eq(bookmarks.tweetId, tweets.id),
        eq(bookmarks.userId, currentUser!.id)
      ))
      .where(eq(likes.userId, id))
      .orderBy(desc(likes.createdAt))
      .limit(50);

    return c.json({ tweets: likedTweets });
  } catch (error) {
    console.error('Error fetching user likes:', error);
    throw new HTTPException(500, { message: 'Failed to fetch user likes' });
  }
})

// GET /api/tweets/bookmarks - Get user bookmarks
.get('/bookmarks', requireAuth, async (c) => {
  const currentUser = c.get('user');
  
  try {
    const bookmarkedTweets = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        authorId: tweets.authorId,
        parentTweetId: tweets.parentTweetId,
        isRetweet: tweets.isRetweet,
        originalTweetId: tweets.originalTweetId,
        mediaItems: tweets.mediaItems,
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
        isBookmarkedByUser: sql<boolean>`true`, // Always true since we're filtering by bookmarks,
      })
      .from(bookmarks)
      .innerJoin(tweets, eq(bookmarks.tweetId, tweets.id))
      .leftJoin(users, eq(tweets.authorId, users.id))
      .leftJoin(likes, and(
        eq(likes.tweetId, tweets.id),
        eq(likes.userId, currentUser!.id)
      ))
      .leftJoin(retweets, and(
        eq(retweets.tweetId, tweets.id),
        eq(retweets.userId, currentUser!.id)
      ))
      .where(eq(bookmarks.userId, currentUser!.id))
      .orderBy(desc(bookmarks.createdAt))
      .limit(50);

    return c.json({ tweets: bookmarkedTweets });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw new HTTPException(500, { message: 'Failed to fetch bookmarks' });
  }
})


export { app as tweetsRoute }; 