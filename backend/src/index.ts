import app from './app'

// For Cloudflare Workers
export default app

// For local development
if (typeof Bun !== 'undefined') {
  Bun.serve({
    fetch: app.fetch,
    port: 3000
  })
  console.log(`Server is running on http://localhost:${3000}`)
}