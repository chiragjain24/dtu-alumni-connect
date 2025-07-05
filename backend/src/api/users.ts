import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { user } from '../db/schema/auth'
import { auth } from '../lib/auth'
import { follows } from '../db/schema/tweets'
import { HTTPException } from 'hono/http-exception'
import { tweets, likes, retweets, bookmarks } from '../db/schema/tweets';
import { user as users } from '../db/schema/auth';
import { eq, desc, and, sql, isNull, lt } from 'drizzle-orm';
// Profile setup/update schema
const profileUpdateSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    bio: z.string().max(500).optional(),
    graduationYear: z.number().int().min(1941).max(2030).optional(),
    branch: z.string().max(100).optional(),
    currentCompany: z.string().max(100).optional(),
    currentRole: z.string().max(100).optional(),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
})

const userParamsSchema = z.object({
  id: z.string(),
})

const infiniteQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 0 && num <= 50;
  }, {
    message: "Limit must be a number between 5 and 50"
  }),
});

const usernameParamsSchema = z.object({
  username: z.string(),
})

// Middleware to require authentication
const requireAuth = async (c: any, next: any) => {
  const user = c.get('user')
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  await next()
}

export const usersRoute = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  }
}>()

// Get current user profile
.get('/profile', requireAuth, async (c) => {
  const currentUser = c.get('user')
  
  if (!currentUser) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const userProfile = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1)

    if (userProfile.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    const profile = userProfile[0]
    return c.json({ user: profile })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update user profile
.patch('/profile', requireAuth, zValidator('json', profileUpdateSchema), async (c) => {
  const currentUser = c.get('user')
  
  if (!currentUser) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = c.req.valid('json')

  try {
    // Check if username is already taken (if username is being updated)
    if (body.username) {
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.username, body.username))
        .limit(1)

      if (existingUser.length > 0 && existingUser[0].id !== currentUser.id) {
        return c.json({ error: 'Username already taken' }, 400)
      }
    }

    // Update user profile
    const updatedUser = await db
      .update(user)
      .set({
        ...body,
        profileSetupCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, currentUser.id))
      .returning()

    if (updatedUser.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    const profile = updatedUser[0]

    return c.json({ user: profile })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get public user profile by username
.get('/:username', requireAuth, zValidator('param', usernameParamsSchema), async (c) => {
  const { username } = c.req.valid('param')

  try {
    const userProfile = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        image: user.image,
        graduationYear: user.graduationYear,
        branch: user.branch,
        currentCompany: user.currentCompany,
        currentRole: user.currentRole,
        linkedinUrl: user.linkedinUrl,
        isAlumniVerified: user.isAlumniVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.username, username))
      .limit(1)

    if (userProfile.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    const profile = userProfile[0]

    return c.json({ user: profile })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/users/:id/tweets - Get user tweets with pagination
.get('/:id/tweets', requireAuth, zValidator('param', userParamsSchema), zValidator('query', infiniteQuerySchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');
  const { cursor, limit } = c.req.valid('query');
  const safeLimit = parseInt(limit, 10);

  try {
    // Build where conditions
    const whereConditions = cursor
      ? and(
          eq(tweets.authorId, id),
          isNull(tweets.parentTweetId),
          lt(tweets.createdAt, new Date(cursor))
        )
      : and(
          eq(tweets.authorId, id),
          isNull(tweets.parentTweetId)
        );

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
      .where(whereConditions)
      .orderBy(desc(tweets.createdAt))
      .limit(safeLimit + 1); // Fetch one extra to determine if there are more

    // Check if there are more tweets
    const hasMore = userTweets.length > safeLimit;
    const tweets_data = hasMore ? userTweets.slice(0, safeLimit) : userTweets;
    
    // Get the next cursor (last tweet's createdAt) - only if we have tweets AND there are more
    let nextCursor = null;
    if (tweets_data.length > 0 && hasMore) {
      nextCursor = tweets_data[tweets_data.length - 1].createdAt.toISOString();
    }

    return c.json({ 
      tweets: tweets_data,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching user tweets:', error);
    throw new HTTPException(500, { message: 'Failed to fetch user tweets' });
  }
})

// GET /api/users/:id/replies - Get user's replies with parent tweets and pagination
.get('/:id/replies', requireAuth, zValidator('param', userParamsSchema), zValidator('query', infiniteQuerySchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');
  const { cursor, limit } = c.req.valid('query');
  const safeLimit = parseInt(limit, 10);

  try {
    // Single query to get all user replies + their parent tweets
    const allTweets = await db
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
        nodeType: sql<'target' | 'parent'>`
          CASE 
            WHEN tweet_tree.direction = 'target' THEN 'target'
            WHEN tweet_tree.direction = 'parent' THEN 'parent'
          END
        `,
        treeLevel: sql<number>`COALESCE(tweet_tree.level, 0)`,
        replyId: sql<string>`tweet_tree.reply_id`,
      })
      .from(sql`
        (
          WITH limited_replies AS (
            SELECT r.id, r.parent_tweet_id, r.created_at
            FROM tweets r
            WHERE r.author_id = ${id} AND r.parent_tweet_id IS NOT NULL ${cursor ? sql`AND r.created_at < ${cursor}` : sql``}
            ORDER BY r.created_at DESC
            LIMIT ${safeLimit + 1}
          )
          
          -- Get all user replies as targets
          SELECT r.id as id, 'target' as direction, 0 as level, r.id as reply_id, r.created_at as reply_created_at
          FROM limited_replies r
          
          UNION ALL
          
          -- Get parent tweets for those replies
          SELECT p.id as id, 'parent' as direction, 1 as level, r.id as reply_id, r.created_at as reply_created_at
          FROM limited_replies r
          INNER JOIN tweets p ON p.id = r.parent_tweet_id
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
      .orderBy(sql`tweet_tree.reply_created_at DESC, tweet_tree.level ASC`); // Group by reply creation time, parents first

    if (allTweets.length === 0) {
      return c.json({ tweets: [], nextCursor: null, hasMore: false });
    }

    // Separate target tweets (replies) from parent tweets
    const targetTweets = allTweets.filter(t => t.nodeType === 'target');
    const parentTweets = allTweets.filter(t => t.nodeType === 'parent');
    
    // Check if there are more replies (based on target tweets count)
    const hasMore = targetTweets.length > safeLimit;
    const limitedTargetTweets = hasMore ? targetTweets.slice(0, safeLimit) : targetTweets;
    
    // Get next cursor from the last target tweet
    let nextCursor = null;
    if (limitedTargetTweets.length > 0 && hasMore) {
      const lastReply = limitedTargetTweets[limitedTargetTweets.length - 1];
      nextCursor = lastReply.createdAt.toISOString();
    }
    
    // Create a map of parent tweets by their ID for quick lookup
    const parentMap = new Map(parentTweets.map(p => [p.id, p]));
    
    // Format each reply with its parent
    const replies = limitedTargetTweets.map(reply => {
      const { nodeType, treeLevel, replyId, ...tweet } = reply;
      const parentTweet = reply.parentTweetId ? parentMap.get(reply.parentTweetId) : null;
      const { nodeType: _, treeLevel: __, replyId: ___, ...cleanParent } = parentTweet || {} as any;
      
      return {
        tweet,
        parentTweets: parentTweet ? [cleanParent] : [],
        replies: []
      };
    });

    return c.json({ tweets: replies, nextCursor, hasMore });
  } catch (error) {
    console.error('Error fetching user replies:', error);
    throw new HTTPException(500, { message: 'Failed to fetch user replies' });
  }
})

// GET /api/users/:id/likes - Get user's liked tweets with pagination
.get('/:id/likes', requireAuth, zValidator('param', userParamsSchema), zValidator('query', infiniteQuerySchema), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.valid('param');
  const { cursor, limit } = c.req.valid('query');
  const safeLimit = parseInt(limit, 10);

  try {
    // Build where conditions
    const whereConditions = cursor
      ? and(
          eq(likes.userId, id),
          lt(likes.createdAt, new Date(cursor))
        )
      : eq(likes.userId, id);

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
        likeCreatedAt: likes.createdAt,
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
      .where(whereConditions)
      .orderBy(desc(likes.createdAt))
      .limit(safeLimit + 1); // Fetch one extra to determine if there are more

    // Check if there are more tweets
    const hasMore = likedTweets.length > safeLimit;
    const tweets_data = hasMore ? likedTweets.slice(0, safeLimit) : likedTweets;
    
    // Get the next cursor (last like's createdAt) - only if we have tweets AND there are more
    let nextCursor = null;
    if (tweets_data.length > 0 && hasMore) {
      nextCursor = tweets_data[tweets_data.length - 1].likeCreatedAt.toISOString();
    }

    // Remove the likeCreatedAt field from the final response
    const finalTweets = tweets_data.map(({ likeCreatedAt, ...tweet }) => tweet);

    return c.json({ 
      tweets: finalTweets,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching user likes:', error);
    throw new HTTPException(500, { message: 'Failed to fetch user likes' });
  }
})

// POST /api/users/:id/follow - Follow/unfollow user
.post('/:id/follow', requireAuth, zValidator('param', userParamsSchema), async (c) => {
  const currentUser = c.get('user')
  const { id } = c.req.valid('param')

  try {
    // Can't follow yourself
    if (currentUser!.id === id) {
      throw new HTTPException(400, { message: 'Cannot follow yourself' })
    }

    // Check if target user exists
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!targetUser) {
      throw new HTTPException(404, { message: 'User not found' })
    }

    // Check if already following
    const [existingFollow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, currentUser!.id),
        eq(follows.followingId, id)
      ))
      .limit(1)

    if (existingFollow) {
      // Unfollow
      await db
        .delete(follows)
        .where(eq(follows.id, existingFollow.id))

      return c.json({ message: 'User unfollowed', following: false })
    } else {
      // Follow
      await db.insert(follows).values({
        followerId: currentUser!.id,
        followingId: id,
      })

      return c.json({ message: 'User followed', following: true })
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to toggle follow' })
  }
})

// GET /api/users/:id/followers - Get user followers
.get('/:id/followers', requireAuth, zValidator('param', userParamsSchema), async (c) => {
  const { id } = c.req.valid('param')

  try {
    const followers = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        image: user.image,
        graduationYear: user.graduationYear,
        branch: user.branch,
        currentCompany: user.currentCompany,
        currentRole: user.currentRole,
        isAlumniVerified: user.isAlumniVerified,
        followedAt: follows.createdAt,
      })
      .from(follows)
      .leftJoin(user, eq(follows.followerId, user.id))
      .where(eq(follows.followingId, id))
      .orderBy(sql`${follows.createdAt} DESC`)

    return c.json({ followers })
  } catch (error) {
    console.error('Error fetching followers:', error)
    throw new HTTPException(500, { message: 'Failed to fetch followers' })
  }
})

// GET /api/users/:id/following - Get users that this user follows
.get('/:id/following', requireAuth, zValidator('param', userParamsSchema), async (c) => {
  const { id } = c.req.valid('param')

  try {
    const following = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        image: user.image,
        graduationYear: user.graduationYear,
        branch: user.branch,
        currentCompany: user.currentCompany,
        currentRole: user.currentRole,
        isAlumniVerified: user.isAlumniVerified,
        followedAt: follows.createdAt,
      })
      .from(follows)
      .leftJoin(user, eq(follows.followingId, user.id))
      .where(eq(follows.followerId, id))
      .orderBy(sql`${follows.createdAt} DESC`)

    return c.json({ following })
  } catch (error) {
    console.error('Error fetching following:', error)
    throw new HTTPException(500, { message: 'Failed to fetch following' })
  }
})
