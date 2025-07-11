import app from './app'

// For Cloudflare Workers
export default app

// For local development
Bun.serve({
  fetch: app.fetch,
  port: 3001
})
console.log(`Server is running on http://localhost:${3001}`)