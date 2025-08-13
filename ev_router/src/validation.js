/**
 * Validates EV route request parameters
 * @param {Object} body - Request body to validate
 * @returns {Array<string>} Array of validation error messages (empty if valid)
 */
export function validateEvRouteRequest(body) {
  const errors = []
  
  // Required coordinate validation
  errors.push(...validateCoordinate(body.origin, 'origin'))
  errors.push(...validateCoordinate(body.destination, 'destination'))

  // Optional parameter validation
  errors.push(...validateOptionalNumber(body.evRangeKm, 'evRangeKm'))
  errors.push(...validateOptionalNumber(body.evMaxPowerKw, 'evMaxPowerKw'))
  errors.push(...validateOptionalNumber(body.minPowerKw, 'minPowerKw'))

  // Connectors validation
  if (body.connectors !== undefined) {
    if (!Array.isArray(body.connectors) || body.connectors.length === 0) {
      errors.push('connectors must be a non-empty array')
    } else if (!body.connectors.every(c => typeof c === 'string' && c.length > 0)) {
      errors.push('all connectors must be non-empty strings')
    }
  }

  // Basic relationship validation
  if (body.evMaxPowerKw && body.minPowerKw && body.minPowerKw > body.evMaxPowerKw) {
    errors.push('minPowerKw should not exceed evMaxPowerKw')
  }

  return errors
}

/**
 * Validates individual coordinate pair
 * @param {Array} coord - [longitude, latitude] array
 * @param {string} name - Name for error messages
 * @returns {Array<string>} Array of validation errors
 */
export function validateCoordinate(coord, name = 'coordinate') {
  const errors = []
  
  if (!coord) {
    errors.push(`${name} is required`)
  } else if (!Array.isArray(coord) || coord.length !== 2) {
    errors.push(`${name} must be an array with exactly 2 elements [longitude, latitude]`)
  } else {
    const [lon, lat] = coord
    if (typeof lon !== 'number' || typeof lat !== 'number' || !Number.isFinite(lon) || !Number.isFinite(lat)) {
      errors.push(`${name} coordinates must be finite numbers`)
    } else if (Math.abs(lon) > 180 || Math.abs(lat) > 90) {
      errors.push(`${name} coordinates out of valid range`)
    }
  }
  
  return errors
}

/**
 * Validates optional numeric parameter
 * @param {*} value - Value to validate
 * @param {string} name - Parameter name for error messages
 * @param {Object} options - Validation options
 * @param {number} [options.min=0] - Minimum allowed value
 * @param {number} [options.max] - Maximum allowed value
 * @returns {Array<string>} Array of validation errors
 */
export function validateOptionalNumber(value, name, options = {}) {
  const errors = []
  const { min = 0, max } = options
  
  if (value !== undefined) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`${name} must be a finite number`)
    } else if (value < min) {
      errors.push(`${name} must be at least ${min}`)
    } else if (max !== undefined && value > max) {
      errors.push(`${name} must not exceed ${max}`)
    }
  }
  
  return errors
}
