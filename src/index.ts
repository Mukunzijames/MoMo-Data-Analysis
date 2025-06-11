import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from 'hono/node-server/serve-static'

// Create the Hono app
const app = new Hono()

// Middleware to serve static files
app.use('/*', serveStatic({ root: './' }))

// API routes
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Server is running'
  })
})

// Start the server
const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
}) 