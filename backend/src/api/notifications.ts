import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { notifications } from '../db/schema/tweets'
import { user } from '../db/schema/auth'
import { auth } from '../lib/auth'
import { HTTPException } from 'hono/http-exception'
import { eq, desc, and, sql, lt } from 'drizzle-orm'

// Validation schemas
const infiniteQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 5 && num <= 50;
  }, {
    message: "Limit must be a number between 5 and 50"
  }),
});

interface NotificationMetadata {
  tweetContent?: string;
  tweetAuthor?: string;
  [key: string]: any;
}

// Middleware to require authentication
const requireAuth = async (c: any, next: any) => {
  const user = c.get('user')
  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  await next()
}

export const notificationsRoute = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  }
}>()

// GET /api/notifications - Get user notifications with pagination
.get('/', requireAuth, zValidator('query', infiniteQuerySchema), async (c) => {
  const currentUser = c.get('user');
  const { cursor, limit } = c.req.valid('query');
  const safeLimit = parseInt(limit, 10);
  
  try {
    // Build where conditions
    const whereConditions = cursor
      ? and(
          eq(notifications.userId, currentUser!.id),
          lt(notifications.createdAt, new Date(cursor))
        )
      : eq(notifications.userId, currentUser!.id);

    const userNotifications = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        actorId: notifications.actorId,
        targetId: notifications.targetId,
        targetType: notifications.targetType,
        metadata: notifications.metadata,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        // Actor details
        actorName: user.name,
        actorUsername: user.username,
        actorImage: user.image,
      })
      .from(notifications)
      .leftJoin(user, eq(notifications.actorId, user.id))
      .where(whereConditions)
      .orderBy(desc(notifications.createdAt))
      .limit(safeLimit + 1); // Fetch one extra to determine if there are more

    // Check if there are more notifications
    const hasMore = userNotifications.length > safeLimit;
    const notificationsData = hasMore ? userNotifications.slice(0, safeLimit) : userNotifications;
    
    // Get the next cursor (last notification's createdAt)
    let nextCursor = null;
    if (notificationsData.length > 0 && hasMore) {
      nextCursor = notificationsData[notificationsData.length - 1].createdAt.toISOString();
    }

    return c.json({ 
      notifications: notificationsData,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new HTTPException(500, { message: 'Failed to fetch notifications' });
  }
})

// GET /api/notifications/unread-count - Get unread notifications count
.get('/unread-count', requireAuth, async (c) => {
  const currentUser = c.get('user');
  
  try {
    const [result] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(notifications)
      .where(and(
        eq(notifications.userId, currentUser!.id),
        eq(notifications.isRead, false)
      ));

    return c.json({ count: result.count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw new HTTPException(500, { message: 'Failed to fetch unread count' });
  }
})

// PATCH /api/notifications/read-all - Mark all notifications as read
.patch('/read-all', requireAuth, async (c) => {
  const currentUser = c.get('user');
  
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, currentUser!.id),
        eq(notifications.isRead, false)
      ));

    return c.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new HTTPException(500, { message: 'Failed to mark all notifications as read' });
  }
});

// Utility function to create notifications (used by other API routes)
export async function createNotification({
  actorId,
  type,
  userId,
  targetType,
  targetId,
  metadata
}: {
  actorId: string;
  type: 'like' | 'retweet' | 'reply' | 'follow' | 'mention';
  userId: string;
  targetType: 'tweet' | 'user';
  targetId?: string;
  metadata?: NotificationMetadata;
}) {
  try {
    // Don't create notification if user is acting on their own content
    if (userId === actorId) {
      return;
    }

    // Create the notification
    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        actorId,
        targetId,
        targetType,
        metadata,
      })
      .returning();

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error to avoid breaking the main action
  }
} 