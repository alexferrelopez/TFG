package com.example.android_app.ui

import androidx.annotation.DrawableRes
import com.example.android_app.R

data class ConnectorMeta(
    val id: String,          // canonical id (e.g., "iec62196T2COMBO")
    val displayName: String, // e.g., "Type 2 CCS"
    @DrawableRes val iconRes: Int
)

// 1) Catalog (mirrors your JS connectorConfig)
private val CATALOG: List<ConnectorMeta> = listOf(
    ConnectorMeta("iec62196T2COMBO", "Type 2 CCS",  R.drawable.iec62196t2combo),
    ConnectorMeta("iec62196T2",      "Type 2",      R.drawable.iec62196t2),
    ConnectorMeta("iec62196T1COMBO", "Type 1 CCS",  R.drawable.iec62196t1combo),
    ConnectorMeta("iec62196T1",      "Type 1",      R.drawable.iec62196t1),
    ConnectorMeta("chademo",         "CHAdeMO",     R.drawable.chademo),
    ConnectorMeta("nacs",            "NACS",        R.drawable.nacs),
    ConnectorMeta("iec62196T3A",     "Type 3A",     R.drawable.iec62196t3a),
    ConnectorMeta("iec62196T3C",     "Type 3C",     R.drawable.iec62196t3c),
    ConnectorMeta("domesticF",       "Domestic F",  R.drawable.domesticf),
    ConnectorMeta("iec60309x2three32","IEC 60309",  R.drawable.iec60309x2three32)
)

// 2) Aliases → canonical ids (optional but handy)
private val ALIASES: Map<String, String> = mapOf(
    // Common short-hands:
    "ccs" to "iec62196T2COMBO",
    "ccs2" to "iec62196T2COMBO",
    "type2ccs" to "iec62196T2COMBO",
    "type2" to "iec62196T2",
    "type1ccs" to "iec62196T1COMBO",
    "type1" to "iec62196T1",
    "t3a" to "iec62196T3A",
    "t3c" to "iec62196T3C",

    // Lowercased canonical forms to their originals:
    "iec62196t2combo" to "iec62196T2COMBO",
    "iec62196t2" to "iec62196T2",
    "iec62196t1combo" to "iec62196T1COMBO",
    "iec62196t1" to "iec62196T1",
    "iec62196t3a" to "iec62196T3A",
    "iec62196t3c" to "iec62196T3C",
    "domesticf" to "domesticF",
    "iec60309x2three32" to "iec60309x2three32",
    "chademo" to "chademo",
    "nacs" to "nacs"
)

// 3) Fast lookup by canonical id (case-insensitive build)
private val BY_ID: Map<String, ConnectorMeta> =
    CATALOG.associateBy { it.id.lowercase() }

// 4) Resolve function: normalize/alias → meta (with fallback)
private fun resolveId(rawId: String?): String? {
    if (rawId.isNullOrBlank()) return null
    val key = rawId.trim().lowercase()
    return ALIASES[key] ?: rawId // return canonical if alias known, else original
}

private val FALLBACK = ConnectorMeta(
    id = "unknown",
    displayName = "Unknown",
    iconRes = R.drawable.unknown_charger
)

// --- Public helpers ---

@DrawableRes
fun connectorIconRes(connectorId: String?): Int {
    val resolved = resolveId(connectorId)
    val meta = BY_ID[resolved?.lowercase()] ?: BY_ID[connectorId?.lowercase() ?: ""] ?: FALLBACK
    return meta.iconRes
}

fun connectorDisplayName(connectorId: String?): String {
    val resolved = resolveId(connectorId)
    val meta = BY_ID[resolved?.lowercase()] ?: BY_ID[connectorId?.lowercase() ?: ""] ?: FALLBACK
    return meta.displayName
}
