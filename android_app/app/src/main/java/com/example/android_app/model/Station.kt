package com.example.android_app.model

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.maplibre.geojson.Feature
import org.maplibre.geojson.Point
import com.google.gson.JsonArray

data class Station(
    val id: String?,
    val name: String?,
    val operator: String?,
    val percentile: Double?,
    val score: Double?,
    val energyInfrastructureStation: JsonObject?,
    val typeOfSite: String,
    val address: String?,
    val town: String?,
    val accessibility: String?,
    val operatingHours: String?,
    val coordinates: List<Double>? // [lon, lat]
)

// Helpers for safe access
private fun JsonObject.optString(name: String, default: String? = null): String? {
    return if (this.has(name) && this.get(name).isJsonPrimitive) this.get(name).asString else default
}

private fun JsonObject.optDouble(name: String): Double? {
    return if (this.has(name) && this.get(name).isJsonPrimitive) this.get(name).asDouble else null
}

// models
data class Connector(val connectorType: String, val maxPowerAtSocketWatts: Double?)
data class RefillPoint(val name: String?, val connectors: List<Connector>)

// grouping result
data class ConnectorGroup(val type: String, val powerKw: Double, val count: Int)


fun parseRefillPoints(eis: JsonObject?): List<RefillPoint> {
    if (eis == null) return emptyList()
    val arr = eis.getAsJsonArray("refillPoint") ?: return emptyList()
    val points = mutableListOf<RefillPoint>()
    for (el in arr) {
        val obj = el.asJsonObject
        val name = obj.get("name")?.asString
        val conns = mutableListOf<Connector>()
        val connectorsJson =
            obj.getAsJsonArray("connectors") ?: obj.getAsJsonArray("connector") ?: JsonArray()
        for (cEl in connectorsJson) {
            val cObj = cEl.asJsonObject
            val type = cObj.get("connectorType")?.asString ?: "unknown"
            val watts = cObj.get("maxPowerAtSocket")?.asDouble
            conns.add(Connector(type, watts))
        }
        points.add(RefillPoint(name, conns))
    }
    return points
}

fun groupConnectors(connectors: List<Connector>): List<ConnectorGroup> {
    val map = linkedMapOf<String, ConnectorGroup>() // preserve insertion
    for (c in connectors) {
        val kw = ((c.maxPowerAtSocketWatts ?: 0.0) / 1000.0)
        val kwRounded = kotlin.math.round(kw * 10.0) / 10.0
        val key = "${c.connectorType}::$kwRounded"
        val existing = map[key]
        if (existing == null) {
            map[key] = ConnectorGroup(c.connectorType, kwRounded, 1)
        } else {
            map[key] = existing.copy(count = existing.count + 1)
        }
    }
    return map.values.toList()
}

fun formatKw(kW: Double): String =
    if (kW % 1.0 == 0.0) "${kW.toInt()} kW" else String.format("%.1f kW", kW)


fun typeOfSiteLabel(raw: String?): String = when (raw) {
    "openSpace" -> "Open Space"
    "onstreet"  -> "On Street"
    "inBuilding"-> "In Building"
    else        -> "Other"
}

fun createStationFromFeature(feature: Feature): Station {
    val props = feature.properties() ?: JsonObject()

    // energyInfrastructureStation
    var eis: JsonObject? = null
    if (props.has("energyInfrastructureStation")) {
        val raw = props.get("energyInfrastructureStation")
        if (raw.isJsonObject) {
            eis = raw.asJsonObject
        } else if (raw.isJsonPrimitive && raw.asJsonPrimitive.isString) {
            try {
                eis = JsonParser.parseString(raw.asString).asJsonObject
            } catch (_: Exception) {
            }
        }
    }

    val siteType = props.optString("typeOfSite", "other")
    val typeOfSite = typeOfSiteLabel(siteType)

    // Coordinates
    val coords: List<Double>? = if (feature.geometry() is Point) {
        val pt = feature.geometry() as Point
        listOf(pt.longitude(), pt.latitude())
    } else null

    return Station(
        id = props.optString("@id"),
        name = props.optString("name"),
        operator = props.optString("operator"),
        percentile = props.optDouble("percentile"),
        score = props.optDouble("score"),
        energyInfrastructureStation = eis,
        typeOfSite = typeOfSite,
        address = props.optString("address"),
        town = props.optString("town"),
        accessibility = props.optString("accessibility"),
        operatingHours = props.optString("operatingHours"),
        coordinates = coords
    )
}