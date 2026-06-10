"""
Import cleaned resources JSON into MySQL database.

Usage:
    python import_mysql.py --input data/clean/resources_clean.json

Environment variables:
    DB_HOST (default: localhost)
    DB_PORT (default: 3306)
    DB_NAME (default: handicare)
    DB_USER (default: root)
    DB_PASSWORD (required)
"""

import argparse
import json
import os
from pathlib import Path

import mysql.connector


def get_db_config() -> dict:
    return {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'port': int(os.environ.get('DB_PORT', '3306')),
        'database': os.environ.get('DB_NAME', 'handicare'),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'charset': 'utf8mb4',
    }


INSERT_SQL = """
INSERT INTO resources 
    (name, type, disability_keys, description, address, latitude, longitude,
     phone, website, opening_hours, accessibility_score, accessibility_features,
     verified, services, languages, contact_preference, last_updated)
VALUES 
    (%(name)s, %(type)s, %(disabilityKeys)s, %(description)s, %(address)s,
     %(latitude)s, %(longitude)s, %(phone)s, %(website)s, %(openingHours)s,
     %(accessibilityScore)s, %(accessibilityFeatures)s, %(verified)s,
     %(services)s, %(languages)s, %(contactPreference)s, CURDATE())
"""

CHECK_SQL = "SELECT id FROM resources WHERE name = %(name)s LIMIT 1"


def main():
    parser = argparse.ArgumentParser(description="Import resources into MySQL")
    parser.add_argument("--input", required=True, help="Cleaned JSON file path")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be imported without writing")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: input file not found: {input_path}")
        return

    resources = json.loads(input_path.read_text(encoding='utf-8'))
    print(f"Loaded {len(resources)} resources to import")

    if args.dry_run:
        for r in resources[:5]:
            print(f"  [DRY] {r['name']} ({r['type']})")
        print(f"  ... and {max(0, len(resources) - 5)} more")
        return

    config = get_db_config()
    if not config['password']:
        print("Error: DB_PASSWORD environment variable is required")
        return

    print(f"Connecting to {config['user']}@{config['host']}:{config['port']}/{config['database']}")

    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()

    inserted = 0
    skipped = 0
    errors = 0

    for resource in resources:
        try:
            # Check if already exists
            cursor.execute(CHECK_SQL, {'name': resource['name']})
            if cursor.fetchone():
                skipped += 1
                continue

            params = {
                'name': resource['name'],
                'type': resource['type'],
                'disabilityKeys': resource.get('disabilityKeys', 'motor'),
                'description': resource.get('description', ''),
                'address': resource.get('address', ''),
                'latitude': resource.get('latitude'),
                'longitude': resource.get('longitude'),
                'phone': resource.get('phone', ''),
                'website': resource.get('website', ''),
                'openingHours': resource.get('openingHours', ''),
                'accessibilityScore': resource.get('accessibilityScore', 70),
                'accessibilityFeatures': resource.get('accessibilityFeatures', ''),
                'verified': resource.get('verified', False),
                'services': resource.get('services', ''),
                'languages': resource.get('languages', 'Arabe, Francais'),
                'contactPreference': resource.get('contactPreference', 'Telephone'),
            }
            cursor.execute(INSERT_SQL, params)
            inserted += 1
        except Exception as e:
            errors += 1
            print(f"  [ERROR] {resource['name']}: {e}")

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\nDone! Inserted: {inserted}, Skipped (duplicates): {skipped}, Errors: {errors}")


if __name__ == '__main__':
    main()
