import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { hc } from 'hono/client'
import type { AppType } from '@backend/src/app'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const api = hc<AppType>(import.meta.env.VITE_BACKEND_URL!,{
  fetch: ((input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, { 
      ...init, 
      credentials: "include" // Required for sending cookies cross-origin
    });
  }),
}).api;

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}