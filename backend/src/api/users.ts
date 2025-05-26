import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { user } from '../db/schema/auth'
import { eq, and, sql } from 'drizzle-orm'
import { auth } from '../lib/auth'
import { follows } from '../db/schema/tweets'
import { HTTPException } from 'hono/http-exception'

// Profile setup/update schema
const profileUpdateSchema = z.object({
    username: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    bio: z.string().max(500).optional(),
    graduationYear: z.number().int().min(1960).max(new Date().getFullYear()).optional(),
    branch: z.string().min(1).max(100).optional(),
    currentCompany: z.string().max(100).optional(),
    currentRole: z.string().max(100).optional(),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
})

const userParamsSchema = z.object({
  id: z.string(),
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
.get('/:id', requireAuth, zValidator('param', userParamsSchema), async (c) => {
  const { id } = c.req.valid('param')

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
      .where(eq(user.id, id))
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