import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // Backend URL
});

export const { signIn, signOut, signUp, useSession } = authClient; 