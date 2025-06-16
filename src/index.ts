import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { handle } from '@hono/node-server/vercel'
import { cors } from 'hono/cors'
import apiRoutes from './routes/api'
import { serveStatic } from '@hono/node-server/serve-static'

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

// For local development with Node.js
if (process.env.NODE_ENV !== 'production') {
  // MOMO Data analysis server Port 
  const port = process.env.PORT || 3000
  console.log(`Server is running on port ${port}`)

  serve({
    fetch: app.fetch,
    port: Number(port)
  })
}

// Export for Vercel Edge Functions
export default app 