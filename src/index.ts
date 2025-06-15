import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
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

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Server is running'
  })
})

// Serve static files (frontend)
app.use('/*', serveStatic({ root: './' }))

// MOMO Data analysis server Port 
const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: Number(port)
}) 