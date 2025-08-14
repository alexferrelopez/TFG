// utils/chargerUtils.js
export function createStationFromFeature(feature) {
  const p = feature.properties || {}
  let eis = p.energyInfrastructureStation
  if (typeof eis === "string") {
    try { 
      eis = JSON.parse(eis) 
    } catch { 
      // ignore parse errors
    }
  }

  const typeOfSiteMap = {
    openSpace: 'Open Space',
    onstreet: 'On Street',
    inBuilding: 'In Building',
    other: 'Other'
  }

  const siteType = p.typeOfSite || 'other'
  const typeOfSite = typeOfSiteMap[siteType] || typeOfSiteMap.other

  return {
    id: p['@id'],
    name: p.name,
    operator: p.operator,
    percentile: p.percentile,
    score: p.score,
    energyInfrastructureStation: eis,
    typeOfSite: typeOfSite,
    address: p.address,
    town: p.town,
    accessibility: p.accessibility,
    operatingHours: p.operatingHours,
    coordinates: feature.geometry?.coordinates
  }
}
