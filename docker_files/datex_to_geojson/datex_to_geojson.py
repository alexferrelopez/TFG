#!/usr/bin/env python3
import argparse
import bisect
import json
import os
import re

import xmltodict


def strip_ns(obj):
    if isinstance(obj, dict):
        return {
            re.sub(r'^.*?:', '', k): strip_ns(v)
            for k, v in obj.items()
        }
    if isinstance(obj, list):
        return [strip_ns(i) for i in obj]
    return obj

def flatten_name(obj):
    # Flatten the nested name text
    name = ""
    name_struct = obj.get("name", {}).get("values", {}).get("value", {})
    if isinstance(name_struct, dict):
        name = name_struct.get("#text", "")
    return name

def parse_datex2_to_geojson(xml_path, geojson_path):
    # load XML (ignore bad bytes)
    with open(xml_path, 'r', encoding='utf-8', errors='ignore') as f:
        doc = xmltodict.parse(f.read())

    sites = doc['d2:payload']['egi:energyInfrastructureTable']['egi:energyInfrastructureSite']
    if not isinstance(sites, list):
        sites = [sites]

    features = []
    scores = []
    for site in sites:
        site = strip_ns(site)

        operator = site.get("operator", {})
        operator_name = flatten_name(operator)
        site["operator"] = operator_name

        site_name = flatten_name(site)
        site["name"] = site_name

        # Trim energyInfrastructureStation to keep only required fields
        station = site.get("energyInfrastructureStation", {})
        new_station = {
            "authenticationAndIdentificationMethods": station.get("authenticationAndIdentificationMethods", [])
        }

        # Prepare to process refill points and calculate score
        raw_rps = station.get("refillPoint", [])
        if isinstance(raw_rps, dict):
            raw_rps = [raw_rps]
        trimmed_rps = []
        total_power = 0.0

        for rp in raw_rps:
            name = flatten_name(rp)

            # Normalize connectors to list
            conns = rp.get("connector", [])
            if isinstance(conns, dict):
                conns = [conns]

            # Trim connector fields and compute max power inline using max()
            rp_power = 0.0
            connectors = []
            for c in conns:
                ctype = c.get("connectorType")
                try:
                    pwr = float(c.get("maxPowerAtSocket", 0))
                except (TypeError, ValueError):
                    pwr = 0.0
                # use max() to track maximum power
                rp_power = max(rp_power, pwr)
                connectors.append({
                    "connectorType": ctype,
                    "maxPowerAtSocket": c.get("maxPowerAtSocket")
                })

            total_power += rp_power

            trimmed_rps.append({
                "name": name,
                "connectorCount": len(connectors),
                "connectors": connectors
            })

        new_station["refillPoint"] = trimmed_rps
        site["energyInfrastructureStation"] = new_station

        # Extract geometry and remove coords
        loc = site.get('locationReference', {}).get('coordinatesForDisplay', {})
        try:
            lat, lon = float(loc.get('latitude', 0)), float(loc.get('longitude', 0))
        except ValueError:
            continue
        site.get('locationReference', {}).pop('coordinatesForDisplay', None)

        # Build feature with score
        feature = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": site
        }
        feature["properties"]["score"] = total_power
        features.append(feature)
        scores.append(total_power)

    # compute percentiles
    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    for feat in features:
        s = feat["properties"]["score"]
        rank = bisect.bisect_left(sorted_scores, s)
        feat["properties"]["percentile"] = round((rank / n) * 100, 1)

    # write GeoJSON output
    out = {"type": "FeatureCollection", "features": features}
    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    p = argparse.ArgumentParser(
        description="DatexII → GeoJSON with proper scoring"
    )
    p.add_argument("xml_file")
    p.add_argument("geojson_file")
    args = p.parse_args()

    parse_datex2_to_geojson(args.xml_file, args.geojson_file)
    size = os.path.getsize(args.geojson_file)
    print(f"Converted {args.xml_file!r} → {args.geojson_file!r} ({size} bytes)")
