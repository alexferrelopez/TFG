import healthRoutes from './health.js'
import evRoutes from './evRoute.js'
import geocodingRoutes from './geocoding.js'

export default function setupRoutes(app) {
  // Mount routes
  app.use('/', healthRoutes)
  app.use('/', evRoutes)
  app.use('/', geocodingRoutes)
  
}
