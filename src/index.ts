import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

app.use('/*', serveStatic({ root: './' }))

// API routes
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Server is running'
  })
})

// MOMO Data analysis server Port 
const port = process.env.PORT || 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port: Number(port)
}) 