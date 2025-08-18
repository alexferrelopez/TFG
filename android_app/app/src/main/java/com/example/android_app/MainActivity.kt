package com.example.android_app

import com.example.android_app.model.Station
import com.example.android_app.model.createStationFromFeature
import com.google.android.material.bottomsheet.BottomSheetDialog


import android.os.Bundle
import android.view.LayoutInflater
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.bottomsheet.BottomSheetBehavior
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapView


class MainActivity : AppCompatActivity() {

    // Declare a variable for MapView
    private lateinit var mapView: MapView
    private lateinit var bottomSheetBehavior: BottomSheetBehavior<FrameLayout>
    private lateinit var bottomSheet: FrameLayout

    private fun showStation(station: Station) {
        bottomSheet.removeAllViews()

        val view = layoutInflater.inflate(R.layout.station_card, bottomSheet, false)
        bottomSheet.addView(view)

        view.findViewById<TextView>(R.id.station_name).text = station.name ?: "n/a"
        view.findViewById<TextView>(R.id.station_address).text =
            "${station.address ?: "n/a"}, ${station.town ?: "n/a"}"
        view.findViewById<TextView>(R.id.station_operator).text = station.operator ?: "n/a"

        bottomSheetBehavior.state = BottomSheetBehavior.STATE_EXPANDED
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Init MapLibre
        MapLibre.getInstance(this)

        // Init layout view
        val inflater = LayoutInflater.from(this)
        val rootView = inflater.inflate(R.layout.activity_main, null)
        setContentView(rootView)

        bottomSheet = findViewById(R.id.bottom_sheet)
        bottomSheetBehavior = BottomSheetBehavior.from(bottomSheet)
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_HIDDEN

        // Init the MapView
        mapView = rootView.findViewById(R.id.mapView)
        mapView.getMapAsync { map ->
            map.setStyle("http://192.168.1.153:3000/style/style")
            map.cameraPosition = CameraPosition.Builder()
                .target(LatLng(40.4637, 3.7492)) // Spain lat/lon
                .zoom(2.0)
                .build()

            // You can also control min/max zoom:
            map.setMinZoomPreference(4.0)
            map.setMaxZoomPreference(19.0)
        }

        mapView.getMapAsync { map ->

            // Listen for map clicks
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

                    // Example: show a simple AlertDialog list
                    val names = sorted.map { it.getStringProperty("name") ?: "Unnamed" }
                    AlertDialog.Builder(this).setTitle("Select charger")
                        .setItems(names.toTypedArray()) { _, which ->
                            val feature = sorted[which]
                            val station = createStationFromFeature(feature)
                            showStation(station)
                        }.setNegativeButton("Cancel", null).show()
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