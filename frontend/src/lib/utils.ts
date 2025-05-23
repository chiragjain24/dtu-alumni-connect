import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { hc } from 'hono/client'
import { type AppType } from '@backend/src/app'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const backend = hc<AppType>('http://localhost:3000').api;