package com.example.android_app.ui

import android.graphics.drawable.GradientDrawable
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.android_app.R
import com.example.android_app.model.Station
import com.example.android_app.model.createStationFromFeature
import org.maplibre.geojson.Feature

// Lightweight wrapper so we don't pass the heavy Feature everywhere if you prefer:
data class ChargerItem(
    val feature: Feature,
    val title: String,
    val subtitle: String,
    val colorInt: Int
)

class ChargersAdapter(
    private val items: List<ChargerItem>,
    private val onPick: (Feature) -> Unit
) : RecyclerView.Adapter<ChargersAdapter.VH>() {

    class VH(v: View) : RecyclerView.ViewHolder(v) {
        val iconDot: View = v.findViewById(R.id.icon_dot)
        val title: TextView = v.findViewById(R.id.title)
        val subtitle: TextView = v.findViewById(R.id.subtitle)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.item_charger_row, parent, false)
        return VH(v)
    }

    override fun onBindViewHolder(h: VH, position: Int) {
        val item = items[position]
        h.title.text = item.title
        h.subtitle.text = item.subtitle

        // tint circle
        (h.iconDot.background as? GradientDrawable)?.setColor(item.colorInt)
            ?: run { h.iconDot.setBackgroundColor(item.colorInt) }

        h.itemView.setOnClickListener { onPick(item.feature) }
    }

    override fun getItemCount(): Int = items.size
}
