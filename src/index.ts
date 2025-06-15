import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import apiRoutes from './routes/api'

// Create Hono app
const app = new Hono()

// Apply CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}))

// API routes
app.route('/api', apiRoutes)

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Server is running'
  })
})

// Export for Vercel
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
