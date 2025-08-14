import express from 'express'
import { fetch } from 'undici'

const router = express.Router()

// Simple geocoding endpoint
router.get('/geocode', async (req, res) => {
  try {
    const { q, limit, lat, lon, lang } = req.query

    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter: q' })
    }

    // Build URL with optional parameters
    const urlParams = new URLSearchParams({ q })
    
    // Add limit parameter if provided (default to reasonable limit if not specified)
    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (limitNum > 0 && limitNum <= 50) { // Reasonable bounds
        urlParams.set('limit', limitNum.toString())
      }
    }
    
    // Add lat/lon for geo-prioritized search if provided
    if (lat && lon) {
      const latNum = parseFloat(lat)
      const lonNum = parseFloat(lon)
      if (!isNaN(latNum) && !isNaN(lonNum)) {
        urlParams.set('lat', latNum.toString())
        urlParams.set('lon', lonNum.toString())
      }
    }
    
    // Add language preference if provided
    if (lang && typeof lang === 'string' && lang.length <= 5) {
      urlParams.set('lang', lang)
    }

    const photonUrl = `http://192.168.1.153:2322/api?${urlParams.toString()}`
    
    const response = await fetch(photonUrl)
    const data = await response.json()
    
    res.json(data)

  } catch (error) {
    console.error('Geocoding error:', error)
    res.status(500).json({ error: 'Geocoding failed' })
  }
})

export default router
