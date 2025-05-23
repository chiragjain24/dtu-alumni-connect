import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { expensesRoute } from './routes/expenses'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

const app = new Hono().basePath('/api')

app.use('*', cors({
  origin: 'http://localhost:5173', // allow Vite frontend
}))
app.use('*', logger())


// app.onError((err, c) => {
//   if(err instanceof HTTPException) {
//     return err.getResponse()
//   }
//   return c.json({error: 'Internal Server Error'}, 500)
// })


const apiRoutes = app
  .route('/expenses', expensesRoute)
  // .route('/users', usersRoute)

export default app
export type AppType = typeof apiRoutes