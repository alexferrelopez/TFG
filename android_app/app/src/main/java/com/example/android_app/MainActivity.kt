package com.example.android_app


import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import com.example.android_app.model.RefillPoint
import com.example.android_app.model.Station
import com.example.android_app.model.createStationFromFeature
import com.example.android_app.model.formatKw
import com.example.android_app.model.groupConnectors
import com.example.android_app.model.parseRefillPoints
import com.example.android_app.ui.ChargersDialog
import com.example.android_app.ui.connectorIconRes
import com.google.android.material.bottomsheet.BottomSheetBehavior
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapView


class MainActivity : AppCompatActivity() {

    // Declare a variable for MapView
    private lateinit var mapView: MapView
    private lateinit var bottomSheet: LinearLayout
    private lateinit var bottomSheetBehavior: BottomSheetBehavior<LinearLayout>


    private fun bindRefillPointCard(card: View, point: RefillPoint) {
        card.findViewById<TextView>(R.id.refill_point_name).text = point.name ?: "Refill point"

        val groups = groupConnectors(point.connectors)
        val container = card.findViewById<LinearLayout>(R.id.connector_groups_container)
        container.removeAllViews()

        // Add one row per group
        for (grp in groups) {
            val row = layoutInflater.inflate(R.layout.connector_group_chip, container, false)

            row.findViewById<ImageView>(R.id.connector_icon)
                .setImageResource(connectorIconRes(grp.type))

            row.findViewById<TextView>(R.id.connector_power).text = formatKw(grp.powerKw)

            row.findViewById<TextView>(R.id.connector_count).apply {
                text = if (grp.count > 1) "x${grp.count}" else "x1"
                visibility = View.VISIBLE
            }

            container.addView(row)
        }
    }

    private fun showStation(station: Station) {
        val content = findViewById<LinearLayout>(R.id.sheetContent)
        content.removeAllViews() // clear old contents
        val view = layoutInflater.inflate(R.layout.station_card, content, false)
        content.addView(view)
        view.findViewById<TextView>(R.id.station_name).text = station.name ?: "n/a"
        view.findViewById<TextView>(R.id.station_address).text =
            "${station.address ?: "n/a"}, ${station.town ?: "n/a"}"
        view.findViewById<TextView>(R.id.station_operator).text =
            station.operator ?: "n/a" // Badge
        val badge = view.findViewById<TextView>(R.id.type_badge)
        badge.text = station.typeOfSite
        when (station.typeOfSite) {
            "Open Space" -> badge.backgroundTintList = getColorStateList(R.color.blue_500)
            "On Street" -> badge.backgroundTintList = getColorStateList(R.color.green_500)
            "In Building" -> badge.backgroundTintList = getColorStateList(R.color.amber_500)
            else -> badge.backgroundTintList = getColorStateList(R.color.gray_500)
        }

        // Hours
        val hoursView = view.findViewById<TextView>(R.id.station_hours)
        if (station.operatingHours != null) {
            hoursView.text =
                "Hours: ${station.operatingHours}"
            hoursView.visibility = View.VISIBLE
        } else {
            hoursView.visibility = View.GONE
        }

        // Accessibility
        val accSection = view.findViewById<LinearLayout>(R.id.accessibility_section)
        if (!station.accessibility.isNullOrBlank() && station.accessibility.lowercase() != "unknown" && station.accessibility.lowercase() != "none") {
            accSection.visibility = View.VISIBLE
        } else {
            accSection.visibility = View.GONE
        }

        // --- Refill points ---
        val refillContainer = view.findViewById<LinearLayout>(R.id.refill_points_container)
        val refillCount = view.findViewById<TextView>(R.id.refill_count)
        val points: List<RefillPoint> = parseRefillPoints(station.energyInfrastructureStation)
        refillContainer.removeAllViews()
        refillCount.text = "${points.size} Refill Points"
        if (points.isEmpty()) {
            // optionally show an "empty" TextView, or leave as-is
        } else {
            for (p in points) {
                val card = layoutInflater.inflate(
                    R.layout.refill_point_card, refillContainer, false
                )
                bindRefillPointCard(card, p)
                refillContainer.addView(card)
            }
        }

        // Destination button
        val btn = view.findViewById<Button>(R.id.set_destination_btn)
        btn.setOnClickListener {
            Toast.makeText(
                this, "Set ${station.name} as destination", Toast.LENGTH_SHORT
            ).show()
        }
        bottomSheetBehavior.peekHeight = 0
        bottomSheetBehavior.isFitToContents = true
        bottomSheetBehavior.skipCollapsed = true
        bottomSheet.post { bottomSheetBehavior.state = BottomSheetBehavior.STATE_EXPANDED }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
        // Init MapLibre
        MapLibre.getInstance(this)

        setContentView(R.layout.activity_main)

        bottomSheet = findViewById(R.id.bottom_sheet)
        bottomSheetBehavior = BottomSheetBehavior.from(bottomSheet)

        // Configure bottom sheet behavior for proper sliding from bottom
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_HIDDEN
        bottomSheetBehavior.peekHeight = 0
        bottomSheetBehavior.isHideable = true
        bottomSheetBehavior.isDraggable = true
        bottomSheetBehavior.isFitToContents = true
        bottomSheetBehavior.skipCollapsed = false

        // Add callback to handle state changes properly
        bottomSheetBehavior.addBottomSheetCallback(object :
            BottomSheetBehavior.BottomSheetCallback() {
            override fun onStateChanged(bottomSheet: View, newState: Int) {
                // Handle state changes if needed
            }

            override fun onSlide(bottomSheet: View, slideOffset: Float) {
                // Handle sliding animation if needed
            }
        })

        // Init the MapView
        mapView = findViewById(R.id.mapView)
        mapView.getMapAsync { map ->
            map.setStyle("http://192.168.1.153:3000/style/style")
            map.cameraPosition =
                CameraPosition.Builder().target(LatLng(40.4637, 3.7492)) // Spain lat/lon
                    .zoom(2.0).build()

            // You can also control min/max zoom:
            map.setMinZoomPreference(4.0)
            map.setMaxZoomPreference(19.0)
            val density = resources.displayMetrics.density
            val topMarginPx = (80 * density).toInt()
            val rightMarginPx = (16 * density).toInt()

            map.uiSettings.setCompassMargins(0, topMarginPx, rightMarginPx, 0)
            map.addOnMapClickListener { latLng ->

                // Convert LatLng to screen pixel
                val screenPoint = map.projection.toScreenLocation(latLng)

                // Query rendered features in the "chargers-point" layer
                val features = map.queryRenderedFeatures(screenPoint, "chargers-point")

                if (features.isEmpty()) {
                    return@addOnMapClickListener false
                }

                if (features.size == 1) {
                    // Single charger
                    val feature = features[0]
                    val station = createStationFromFeature(feature)
                    showStation(station)
                } else {
                    // Multiple chargers -> show popup (Android Dialog, BottomSheet, etc.)
                    val sorted = features.sortedByDescending {
                        it.getNumberProperty("percentile")?.toDouble() ?: 0.0
                    }

                    ChargersDialog(sorted) { picked ->
                        val station = createStationFromFeature(picked)
                        showStation(station)
                    }.show(supportFragmentManager, "chargers_dialog")
                }

                true // we handled the click
            }
        }

    }

    override fun onStart() {
        super.onStart()
        mapView.onStart()
    }

    override fun onResume() {
        super.onResume()
        mapView.onResume()
    }

    override fun onPause() {
        super.onPause()
        mapView.onPause()
    }

    override fun onStop() {
        super.onStop()
        mapView.onStop()
    }

    override fun onLowMemory() {
        super.onLowMemory()
        mapView.onLowMemory()
    }

    override fun onDestroy() {
        super.onDestroy()
        mapView.onDestroy()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        mapView.onSaveInstanceState(outState)
    }
}