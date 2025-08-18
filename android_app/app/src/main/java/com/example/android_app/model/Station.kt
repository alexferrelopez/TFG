package com.example.android_app.model

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import org.maplibre.geojson.Feature
import org.maplibre.geojson.Point

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

fun createStationFromFeature(feature: Feature): Station {
    val props = feature.properties() ?: JsonObject()

    // energyInfrastructureStation
    var eis: JsonObject? = null
    if (props.has("energyInfrastructureStation")) {
        val raw = props.get("energyInfrastructureStation")
        if (raw.isJsonObject) {
            eis = raw.asJsonObject
        } else if (raw.isJsonPrimitive && raw.asJsonPrimitive.isString) {
            try { eis = JsonParser.parseString(raw.asString).asJsonObject } catch (_: Exception) {}
        }
    }

    val typeOfSiteMap = mapOf(
        "openSpace" to "Open Space",
        "onstreet" to "On Street",
        "inBuilding" to "In Building",
        "other" to "Other"
    )

    val siteType = props.optString("typeOfSite", "other") ?: "other"
    val typeOfSite = typeOfSiteMap[siteType] ?: typeOfSiteMap["other"]!!

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