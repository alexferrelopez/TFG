#!/usr/bin/env python3
import re, json, bisect, os, argparse
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

def parse_datex2_to_geojson(xml_path, geojson_path):
    # load XML (ignore bad bytes)
    with open(xml_path, 'r', encoding='utf-8', errors='ignore') as f:
        doc = xmltodict.parse(f.read())

    sites = doc['d2:payload']['egi:energyInfrastructureTable']['egi:energyInfrastructureSite']
    if not isinstance(sites, list):
        sites = [sites]

    features = []
    for site in sites:
        site = strip_ns(site)
        loc = site.get('locationReference', {}).get('coordinatesForDisplay', {})
        try:
            lat, lon = float(loc.get('latitude', 0)), float(loc.get('longitude', 0))
        except ValueError:
            continue
        # remove coords from props
        site.get('locationReference', {}).pop('coordinatesForDisplay', None)

        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": site
        })

    # compute scores properly: one supply per refillPoint
    scores = []
    for feat in features:
        station = feat["properties"].get("energyInfrastructureStation", {})
        refill = station.get("refillPoint", [])
        if isinstance(refill, dict):
            refill = [refill]

        total_power = 0.0
        for rp in refill:
            # normalize connector to list
            conns = rp.get("connector", [])
            if isinstance(conns, dict):
                conns = [conns]

            # collect all connector powers, then take the max
            powers = []
            for c in conns:
                try:
                    powers.append(float(c.get("maxPowerAtSocket", 0)))
                except (TypeError, ValueError):
                    pass
            rp_power = max(powers) if powers else 0.0
            total_power += rp_power

        feat["properties"]["score"] = total_power
        scores.append(total_power)

    # compute percentiles
    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    for feat in features:
        s = feat["properties"]["score"]
        rank = bisect.bisect_left(sorted_scores, s)
        feat["properties"]["percentile"] = round((rank / n) * 100, 1)

    # write GeoJSON
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
