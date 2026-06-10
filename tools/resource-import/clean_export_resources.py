"""
Clean and normalize raw scraped Google Maps data into the HandiCare resource format.

Usage:
    python clean_export_resources.py --input raw_resources.json --out-dir data/clean
"""

import argparse
import json
import re
from pathlib import Path

# Map Google Maps categories to HandiCare ResourceType
CATEGORY_TYPE_MAP = {
    'hôpital': 'HOSPITAL',
    'hospital': 'HOSPITAL',
    'clinique': 'HOSPITAL',
    'clinic': 'HOSPITAL',
    'pharmacie': 'PHARMACY',
    'pharmacy': 'PHARMACY',
    'médecin': 'DOCTOR',
    'doctor': 'DOCTOR',
    'généraliste': 'DOCTOR',
    'cabinet': 'CABINET',
    'orthopédie': 'CABINET',
    'orthophoniste': 'CABINET',
    'kinésithérapeute': 'REHABILITATION_CENTER',
    'kinésithérapie': 'REHABILITATION_CENTER',
    'rééducation': 'REHABILITATION_CENTER',
    'ergothérapie': 'REHABILITATION_CENTER',
    'réhabilitation': 'REHABILITATION_CENTER',
    'rehabilitation': 'REHABILITATION_CENTER',
    'association': 'ASSOCIATION',
    'ong': 'ASSOCIATION',
    'transport': 'TRANSPORT',
    'ambulance': 'EMERGENCY',
    'urgence': 'EMERGENCY',
    'emergency': 'EMERGENCY',
    'samu': 'EMERGENCY',
    'administration': 'ADMINISTRATIVE_SUPPORT',
    'anapec': 'ADMINISTRATIVE_SUPPORT',
    'entraide': 'ADMINISTRATIVE_SUPPORT',
}

# Infer disability keys from query or category
QUERY_DISABILITY_MAP = {
    'rééducation': 'motor,chronic',
    'kinésithérapie': 'motor,chronic',
    'orthopédie': 'motor',
    'orthophoniste': 'cognitive,hearing',
    'ergothérapie': 'motor,cognitive',
    'handicap': 'motor,visual,hearing,cognitive',
    'transport adapté': 'motor,visual',
    'pharmacie': 'motor,visual,chronic',
    'urgence': 'motor,visual,hearing,cognitive,chronic',
    'hôpitaux': 'motor,visual,hearing,cognitive,chronic',
    'aide administrative': 'motor,visual,hearing,cognitive',
}


def infer_type(place: dict) -> str:
    """Infer the resource type from category and query."""
    category = (place.get('category') or '').lower()
    query = (place.get('_query') or '').lower()
    name = (place.get('name') or '').lower()

    # Check category first
    for keyword, rtype in CATEGORY_TYPE_MAP.items():
        if keyword in category:
            return rtype

    # Check name
    for keyword, rtype in CATEGORY_TYPE_MAP.items():
        if keyword in name:
            return rtype

    # Check query
    for keyword, rtype in CATEGORY_TYPE_MAP.items():
        if keyword in query:
            return rtype

    return 'ASSOCIATION'  # Default


def infer_disability_keys(place: dict) -> str:
    """Infer disability keys from query context."""
    query = (place.get('_query') or '').lower()
    for keyword, keys in QUERY_DISABILITY_MAP.items():
        if keyword in query:
            return keys
    return 'motor'


def normalize_phone(phone: str) -> str:
    """Normalize phone number format."""
    if not phone:
        return ''
    # Remove extra spaces, keep +212 format
    phone = re.sub(r'\s+', ' ', phone.strip())
    # If starts with 0, convert to +212
    if phone.startswith('0'):
        phone = '+212 ' + phone[1:]
    return phone


def clean_place(place: dict) -> dict:
    """Convert a raw scraped place into HandiCare resource format."""
    resource = {
        'name': (place.get('name') or '').strip(),
        'type': infer_type(place),
        'disabilityKeys': infer_disability_keys(place),
        'description': place.get('category', ''),
        'address': (place.get('address') or '').strip(),
        'latitude': place.get('latitude'),
        'longitude': place.get('longitude'),
        'phone': normalize_phone(place.get('phone', '')),
        'website': (place.get('website') or '').strip(),
        'openingHours': (place.get('hours') or '').strip(),
        'accessibilityScore': 70,
        'accessibilityFeatures': '',
        'verified': False,
        'services': place.get('category', ''),
        'languages': 'Arabe, Francais',
        'contactPreference': 'Telephone',
    }

    # Filter out places without name or outside Casablanca area
    if not resource['name']:
        return None

    # Check coordinates are within Casablanca area (roughly)
    lat = resource.get('latitude')
    lng = resource.get('longitude')
    if lat and lng:
        if not (33.4 <= lat <= 33.7 and -7.8 <= lng <= -7.4):
            return None

    return resource


def main():
    parser = argparse.ArgumentParser(description="Clean scraped resources")
    parser.add_argument("--input", required=True, help="Raw scraped JSON file")
    parser.add_argument("--out-dir", required=True, help="Output directory for cleaned files")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: input file not found: {input_path}")
        return

    raw_data = json.loads(input_path.read_text(encoding='utf-8'))
    print(f"Loaded {len(raw_data)} raw places")

    cleaned = []
    skipped = 0
    seen_names = set()

    for place in raw_data:
        resource = clean_place(place)
        if resource is None:
            skipped += 1
            continue
        # Deduplicate by name
        norm_name = resource['name'].lower().strip()
        if norm_name in seen_names:
            skipped += 1
            continue
        seen_names.add(norm_name)
        cleaned.append(resource)

    print(f"Cleaned: {len(cleaned)} resources, skipped: {skipped}")

    # Group by type for stats
    type_counts = {}
    for r in cleaned:
        type_counts[r['type']] = type_counts.get(r['type'], 0) + 1
    print("By type:")
    for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    out_file = out_dir / 'resources_clean.json'
    out_file.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\nSaved to: {out_file}")

    # Also save a SQL-ready version
    sql_file = out_dir / 'resources_insert.sql'
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write("USE handicare;\n\n")
        for r in cleaned:
            name = r['name'].replace("'", "''")
            desc = (r.get('description') or '').replace("'", "''")
            addr = (r.get('address') or '').replace("'", "''")
            phone = (r.get('phone') or '').replace("'", "''")
            website = (r.get('website') or '').replace("'", "''")
            hours = (r.get('openingHours') or '').replace("'", "''")
            features = (r.get('accessibilityFeatures') or '').replace("'", "''")
            services = (r.get('services') or '').replace("'", "''")
            lat = r.get('latitude') or 'NULL'
            lng = r.get('longitude') or 'NULL'
            f.write(
                f"INSERT IGNORE INTO resources (name, type, disability_keys, description, address, "
                f"latitude, longitude, phone, website, opening_hours, accessibility_score, "
                f"accessibility_features, verified, services, languages, contact_preference, last_updated) "
                f"VALUES ('{name}', '{r['type']}', '{r['disabilityKeys']}', '{desc}', '{addr}', "
                f"{lat}, {lng}, '{phone}', '{website}', '{hours}', {r['accessibilityScore']}, "
                f"'{features}', {1 if r['verified'] else 0}, '{services}', 'Arabe, Francais', "
                f"'Telephone', CURDATE());\n"
            )
    print(f"SQL file saved to: {sql_file}")


if __name__ == '__main__':
    main()
