import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db'
import { user } from '../db/schema/auth'
import { eq } from 'drizzle-orm'
import { auth } from '../lib/auth'

// Profile setup/update schema
const profileUpdateSchema = z.object({
    username: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    graduationYear: z.number().int().min(1960).max(new Date().getFullYear()).optional(),
    branch: z.string().min(1).max(100).optional(),
    currentCompany: z.string().max(100).optional(),
    currentRole: z.string().max(100).optional(),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
})

export const usersRoute = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  }
}>()

// Get current user profile
.get('/profile', async (c) => {
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
    // Remove sensitive information
    const { email, emailVerified, ...publicProfile } = profile

    return c.json({ user: publicProfile })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update user profile
.patch('/profile', zValidator('json', profileUpdateSchema), async (c) => {
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
    // Remove sensitive information
    const { email, emailVerified, ...publicProfile } = profile

    return c.json({ user: publicProfile })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get public user profile by username
.get('/:username', async (c) => {
  const username = c.req.param('username')

  try {
    const userProfile = await db
      .select()
      .from(user)
      .where(eq(user.username, username))
      .limit(1)

    if (userProfile.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    const profile = userProfile[0]
    // Remove sensitive information for public profile
    const { email, emailVerified, ...publicProfile } = profile

    return c.json({ user: publicProfile })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})