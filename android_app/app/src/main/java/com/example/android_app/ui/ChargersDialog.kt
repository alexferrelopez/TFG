package com.example.android_app.ui

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.DialogFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.android_app.R
import org.maplibre.geojson.Feature
import com.example.android_app.model.typeOfSiteLabel

class ChargersDialog(
    private val features: List<Feature>,
    private val onPick: (Feature) -> Unit
) : DialogFragment() {

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val view = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_chargers, null)

        view.findViewById<TextView>(R.id.header).text = "${features.size} stations here"
        view.findViewById<ImageButton>(R.id.close_btn).setOnClickListener { dismiss() }

        val rv = view.findViewById<RecyclerView>(R.id.list)
        rv.layoutManager = LinearLayoutManager(requireContext())
        val items = features.map { f ->
            val p = f.properties()!!
            val name = p.get("name")?.asString ?: "Unnamed"
            val typeLabel = typeOfSiteLabel(p.get("typeOfSite")?.asString)
            val color = p.get("color")?.asInt ?: 0xFF6200EE.toInt() // Default purple color
            ChargerItem(f, name, typeLabel, color)
        }
        rv.adapter = ChargersAdapter(items) { feature ->
            onPick(feature)
            dismiss()
        }

        return AlertDialog.Builder(requireContext())
            .setView(view)
            .create()
    }
}
