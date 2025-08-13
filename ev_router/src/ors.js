import { fetch } from 'undici'

const ORS_URL = process.env.ORS_URL || 'http://localhost:8080/ors'
const PROFILE = 'driving-car'

// POST to ORS with generic body
async function orsFetch(endpoint, body) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout
  
  try {
    const res = await fetch(`${ORS_URL}/v2/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`ORS ${endpoint} failed: ${res.status} ${err}`)
    }

    return res.json()
  } catch (error) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error(`ORS ${endpoint} request timed out after 30 seconds`)
    }
    throw error
  }
}

export async function orsMatrix(coords) {
  const body = {
    locations: coords,
    metrics: ['distance', 'duration'],
    resolve_locations: false
  }

  const result = await orsFetch(`matrix/${PROFILE}`, body)
  return {
    durations: result.durations,
    distances: result.distances
  }
}

export async function orsRoute(coords) {
  const body = {
    coordinates: coords,
    instructions: false,
    geometry: true,
    elevation: false
  }

  const result = await orsFetch(`directions/${PROFILE}/geojson`, body)
  return result
}
