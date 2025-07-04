import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "../db"; // your drizzle instance
import { user, session, account, verification } from "../db/schema/auth";
import { eq } from "drizzle-orm";
 
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user,
            session, 
            account,
            verification
        }
    }),
    user:{
        additionalFields: {
            profileSetupCompleted: { type: "boolean", required: false },
            username: { type: "string",required: false },
        }
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes cache
        },
    },
    emailAndPassword: {  
        enabled: false
    },
    trustedOrigins: [
        process.env.FRONTEND_URL as string,
    ],
    socialProviders: { 
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            // Only run this hook for signup endpoints
            if (ctx.path.startsWith("/callback/:id")) {
                const newSession = ctx.context.newSession;
                const username = newSession?.user.username;
                if (newSession && newSession.user && !username) {
                    const userId = newSession.user.id;
                    const userEmail = newSession.user.email;
                    
                    // Extract username from email (part before @)
                    let proposedUsername = userEmail.split('@')[0];
                    
                    // Check if this username is already taken
                    const usernameExists = await db
                        .select({ id: user.id })
                        .from(user)
                        .where(eq(user.username, proposedUsername))
                        .limit(1);
                    
                    // If username exists, append random num
                    if (usernameExists.length > 0) {
                        const randomNum = Math.floor(Math.random() * 1000);
                        proposedUsername += 'e' + randomNum;
                    }
                    
                    // Update the user with the generated username
                    await db
                        .update(user)
                        .set({ 
                            username: proposedUsername,
                            updatedAt: new Date()
                        })
                        .where(eq(user.id, userId));
                    
                    console.log(`Assigned username '${proposedUsername}' to user ${userId} with email ${userEmail}`);
                }
            }
        }),
    },
    advanced:{
        defaultCookieAttributes:{
            secure: true,
            sameSite: "none",
            httpOnly: true,
        }
    }
});
// type Session = typeof auth.$Infer.Session