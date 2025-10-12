import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import setupRoutes from './routes/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const port = process.env.PORT || 3001

// Load charger data once at startup
const chargersPath = path.join(__dirname, '../data/chargers.geojson')
const chargersRaw = JSON.parse(fs.readFileSync(chargersPath, 'utf8'))
export const chargers = chargersRaw.features || []

// Server-controlled performance parameters (not exposed to users)
export const PERFORMANCE_CONFIG = {
  bufferKm: Number(process.env.BUFFER_KM || 25),
  segmentKm: Number(process.env.SEGMENT_KM || 75),
  maxOrsCandidates: Number(process.env.MAX_ORS_CANDIDATES || 120),
  // Nearby search defaults (kept server-side to avoid client control)
  nearbyRadiusKm: Number(process.env.NEARBY_RADIUS_KM || process.env.BUFFER_KM || 25),
  nearbyLimit: Number(process.env.NEARBY_LIMIT || process.env.MAX_ORS_CANDIDATES || 120),
  requestTimeoutMs: 30000 // 30 second timeout
}


// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 60 requests per minute
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Middleware
app.use(compression())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))

// Apply rate limiting to all requests
app.use(limiter)

// Setup routes
setupRoutes(app)

// Start server
app.listen(port, () => {
  console.log(`EV Router API running at http://localhost:${port}`)
})
