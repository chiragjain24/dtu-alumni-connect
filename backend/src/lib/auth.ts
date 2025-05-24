import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db"; // your drizzle instance
import { user, session, account, verification } from "../db/schema/auth";
 
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
            profileSetupCompleted: { type: "boolean",required: false },
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
        "http://localhost:5173",
        process.env.CORS_ORIGIN as string,
    ],
    socialProviders: { 
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    advanced:{
        defaultCookieAttributes:{
            secure: true,
            sameSite: "none",
        }
    }
});
// type Session = typeof auth.$Infer.Session