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
    """Extract name text from nested name structure"""
    name_struct = obj.get("name", {}).get("values", {}).get("value", {})
    if isinstance(name_struct, dict):
        return name_struct.get("#text", "")
    return ""


def load_and_parse_xml(xml_path):
    """Load XML file and extract energy infrastructure sites"""
    with open(xml_path, 'r', encoding='utf-8', errors='ignore') as f:
        doc = xmltodict.parse(f.read())

    sites = doc['d2:payload']['egi:energyInfrastructureTable']['egi:energyInfrastructureSite']
    if not isinstance(sites, list):
        sites = [sites]
    
    return sites


def process_refill_points(raw_rps):
    """Process refill points and calculate total power"""
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

        # Process connectors and find max power
        rp_power = 0.0
        connectors = []
        for c in conns:
            ctype = c.get("connectorType")
            try:
                pwr = float(c.get("maxPowerAtSocket", 0))
            except (TypeError, ValueError):
                pwr = 0.0
            
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

    return trimmed_rps, total_power


def extract_address_info(site):
    """Extract and clean address and town from location reference"""
    loc_ref = site.get('locationReference', {})
    ext = loc_ref.get('_locationReferenceExtension', {})
    facility = ext.get('facilityLocation', {})
    addr = facility.get('address', {})
    
    # Extract address lines
    lines = addr.get('addressLine', [])
    if isinstance(lines, dict):
        lines = [lines]
    
    # Sort by order
    try:
        lines = sorted(lines, key=lambda x: int(x.get('@order', 0)))
    except (TypeError, ValueError):
        pass
    
    def extract_text(line):
        txt = line.get('text', {}).get('values', {}).get('value', {})
        if isinstance(txt, dict):
            return txt.get('#text', '')
        return ''

    address = extract_text(lines[0]) if len(lines) > 0 else ''
    town = extract_text(lines[1]) if len(lines) > 1 else ''
    
    # Clean prefixes
    town = re.sub(r'^[^:]+:\s*', '', town).lstrip()
    address = re.sub(r'^[^:]+:\s*', '', address).lstrip()
    
    # Remove town from address if it appears there
    pat = rf"(?:,\s*|\s+){re.escape(town)}\b.*$"
    if re.search(pat, address, flags=re.IGNORECASE):
        address = re.sub(pat, "", address, flags=re.IGNORECASE)

    return {
        'town': town.rstrip(", ").strip(),
        'address': address.rstrip(", ").strip()
    }


def get_coordinates(site):
    """Extract latitude and longitude from site location"""
    loc_ref = site.get('locationReference', {})
    loc = loc_ref.get('coordinatesForDisplay', {})
    try:
        lat = float(loc.get('latitude', 0))
        lon = float(loc.get('longitude', 0))
        return lat, lon
    except ValueError:
        return None, None


def process_site(site):
    """Process a single energy infrastructure site"""
    site = strip_ns(site)

    # Process operator and site names
    operator = site.get("operator", {})
    site["operator"] = flatten_name(operator)
    site["name"] = flatten_name(site)

    # Get coordinates
    lat, lon = get_coordinates(site)
    if lat is None or lon is None:
        return None

    # Process energy infrastructure station
    station = site.get("energyInfrastructureStation", {})
    raw_rps = station.get("refillPoint", [])
    trimmed_rps, total_power = process_refill_points(raw_rps)

    # Update station with trimmed data
    new_station = {
        "authenticationAndIdentificationMethods": station.get("authenticationAndIdentificationMethods", []),
        "refillPoint": trimmed_rps
    }
    site["energyInfrastructureStation"] = new_station

    # Extract and add address info
    address_info = extract_address_info(site)
    site.update(address_info)
    
    # Remove original locationReference
    site.pop('locationReference', None)

    # Build feature
    feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": site
    }
    feature["properties"]["score"] = total_power
    
    return feature


def calculate_percentiles(features):
    """Calculate percentiles for all features based on their scores"""
    scores = [feat["properties"]["score"] for feat in features]
    sorted_scores = sorted(scores)
    n = len(sorted_scores)
    
    for feat in features:
        s = feat["properties"]["score"]
        rank = bisect.bisect_left(sorted_scores, s)
        feat["properties"]["percentile"] = round((rank / n) * 100, 1)


def save_geojson(features, geojson_path):
    """Save features to GeoJSON file"""
    out = {"type": "FeatureCollection", "features": features}
    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)


def parse_datex2_to_geojson(xml_path, geojson_path):
    """Main function to convert DatexII XML to GeoJSON"""
    # Load and parse XML
    sites = load_and_parse_xml(xml_path)
    
    # Process all sites
    features = []
    for site in sites:
        feature = process_site(site)
        if feature:  # Skip sites with invalid coordinates
            features.append(feature)
    
    # Calculate percentiles
    calculate_percentiles(features)
    
    # Save to file
    save_geojson(features, geojson_path)


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
    