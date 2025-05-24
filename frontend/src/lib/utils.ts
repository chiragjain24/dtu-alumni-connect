import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { hc } from 'hono/client'
import { type AppType } from '@backend/src/app'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const backend = hc<AppType>('http://localhost:3000/',{
  fetch: ((input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, { 
      ...init, 
      credentials: "include" // Required for sending cookies cross-origin
    });
  }),
}).api;