import express from 'express'
import { fetch } from 'undici'

const router = express.Router()

// Simple geocoding endpoint
router.get('/geocode', async (req, res) => {
  try {
    const { q } = req.query

    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter: q' })
    }

    const photonUrl = `http://192.168.1.153:2322/api?q=${encodeURIComponent(q)}`
    
    const response = await fetch(photonUrl)
    const data = await response.json()
    
    res.json(data)

  } catch (error) {
    console.error('Geocoding error:', error)
    res.status(500).json({ error: 'Geocoding failed' })
  }
})

export default router
