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

    const photonUrl = `http://localhost:2322/api?${urlParams.toString()}`
    
    const response = await fetch(photonUrl)
    const data = await response.json()
    
    res.json(data)

  } catch (error) {
    console.error('Geocoding error:', error)
    res.status(500).json({ error: 'Geocoding failed' })
  }
})

// Reverse geocoding endpoint
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon, limit, lang } = req.query

    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing required parameters: lat and lon' })
    }

    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    // Validate coordinate values
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return res.status(400).json({ error: 'Invalid latitude or longitude values' })
    }

    // Build URL with required parameters
    const urlParams = new URLSearchParams({
      lat: latNum.toString(),
      lon: lonNum.toString()
    })
    
    // Add limit parameter if provided (default to reasonable limit if not specified)
    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (limitNum > 0 && limitNum <= 50) { // Reasonable bounds
        urlParams.set('limit', limitNum.toString())
      }
    }
    
    // Add language preference if provided
    if (lang && typeof lang === 'string' && lang.length <= 5) {
      urlParams.set('lang', lang)
    }

    const photonUrl = `http://localhost:2322/reverse?${urlParams.toString()}`
    
    const response = await fetch(photonUrl)
    const data = await response.json()
    
    res.json(data)

  } catch (error) {
    console.error('Reverse geocoding error:', error)
    res.status(500).json({ error: 'Reverse geocoding failed' })
  }
})

export default router
