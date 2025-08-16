import express from 'express'
import { chargers } from '../index.js'

const router = express.Router()

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Test route - show basic app info
router.get('/', (req, res) => {
  res.json({
    ok: true,
    chargers: chargers.length
  })
})

export default router
