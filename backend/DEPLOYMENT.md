# Deploying DTU Alumni Backend to Cloudflare Workers

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Already included in devDependencies
3. **Environment Variables**: Prepare your environment variables

## Step 1: Install and Authenticate Wrangler

```bash
# Install wrangler globally (optional, already in devDependencies)
npm install -g wrangler

# Login to Cloudflare
npx wrangler login
```

## Step 2: Set Environment Variables

You need to set these environment variables as Cloudflare Workers secrets:

```bash
# Set your database URL (Neon PostgreSQL)
npx wrangler secret put DATABASE_URL

# Set your frontend URL for CORS
npx wrangler secret put FRONTEND_URL

# Set your Better Auth secret
npx wrangler secret put BETTER_AUTH_SECRET

# Set your Better Auth URL (will be your Workers URL)
npx wrangler secret put BETTER_AUTH_URL
```

### Environment Variables Needed:

- **DATABASE_URL**: Your Neon PostgreSQL connection string
- **FRONTEND_URL**: Your frontend URL (e.g., `https://your-frontend.vercel.app`)
- **BETTER_AUTH_SECRET**: A secure random string for auth
- **BETTER_AUTH_URL**: Your backend URL (e.g., `https://your-worker.your-subdomain.workers.dev`)

## Step 3: Deploy

```bash
# Build and deploy to production
bun run deploy:prod

# Or deploy to development environment
bun run deploy:dev

# Or just deploy (uses default environment)
bun run deploy
```

## Step 4: Test Your Deployment

After deployment, Wrangler will provide you with a URL like:
`https://dtu-alumni-backend.your-subdomain.workers.dev`

Test your API:
```bash
curl https://your-worker-url.workers.dev/api/health
```

## Step 5: Update Frontend Configuration

Update your frontend's API base URL to point to your new Cloudflare Workers URL.

## Development Workflow

### Local Development with Wrangler
```bash
# Run locally with Wrangler (simulates Workers environment)
bun run wrangler:dev

# Run with Bun (faster for development)
bun run dev
```

### Environment-Specific Deployments

```bash
# Deploy to development
bun run deploy:dev

# Deploy to production
bun run deploy:prod
```

## Troubleshooting

### Common Issues:

1. **Environment Variables**: Make sure all secrets are set correctly
2. **CORS Issues**: Ensure FRONTEND_URL is set to your actual frontend domain
3. **Database Connection**: Verify your Neon database URL is correct and accessible

### Logs and Debugging:

```bash
# View real-time logs
npx wrangler tail

# View deployment logs
npx wrangler tail --format pretty
```

### Custom Domain (Optional)

To use a custom domain:

1. Add your domain to Cloudflare
2. Uncomment and configure the `routes` section in `wrangler.toml`
3. Deploy again

## Performance Notes

- Cloudflare Workers have a 10ms CPU time limit per request
- Your Neon database connection is optimized for serverless environments
- Consider implementing caching strategies for frequently accessed data

## Security Considerations

- All environment variables are encrypted as Workers secrets
- Enable Cloudflare's security features (DDoS protection, WAF)
- Consider rate limiting for your API endpoints 