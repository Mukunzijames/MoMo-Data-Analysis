import { Hono } from 'hono'
import { handle } from '@hono/node-server/vercel'
import type { PageConfig } from 'next'
import { cors } from 'hono/cors'

export const runtime = 'edge'
import apiRoutes from '../../../routes/api'

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
}

// Create Hono app
const app = new Hono().basePath('/api')

// Apply CORS middleware    
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Server is running'
  })
})

// Test endpoint that doesn't require database connection
app.get('/test', (c) => {
  return c.json({
    status: 'ok',
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString()
  })
})

// Mount existing API routes - using a different approach to avoid conflicts
app.route('/v1', apiRoutes)

export default handle(app) 