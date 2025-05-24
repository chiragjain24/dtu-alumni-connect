import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { expensesRoute } from './api/expenses'
import { usersRoute } from './api/users'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'
import { HTTPException } from 'hono/http-exception'

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>().basePath('/api')

app.use('*', cors({
  origin: 'http://localhost:5173', // allow Vite frontend,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS", "PATCH"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
}))
app.use('*', logger())


// Auth Middleware(Calls Database to verify session or use cookie cache)
app.use("*", async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
  	if (!session) {
    	c.set("user", null);
    	c.set("session", null);
    	return next();
  	}
  	c.set("user", session.user);
  	c.set("session", session.session);
  	return next();
});

app.on(["POST", "GET"], "/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

app.onError((err, c) => {
  if(err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(err)
  return c.json({error: 'Internal Server Error'}, 500)
})


const apiRoutes = app
  .route('/expenses', expensesRoute)
  .route('/users', usersRoute)

export default app
export type AppType = typeof apiRoutes