"""Import MySQL des ressources nettoyées."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import mysql.connector

COLUMNS = {
    'name': 'name', 'type': 'type', 'disabilityKeys': 'disability_keys', 'description': 'description',
    'address': 'address', 'latitude': 'latitude', 'longitude': 'longitude', 'phone': 'phone',
    'website': 'website', 'openingHours': 'opening_hours', 'accessibilityScore': 'accessibility_score',
    'accessibilityFeatures': 'accessibility_features', 'verified': 'verified', 'services': 'services',
    'languages': 'languages', 'lastUpdated': 'last_updated', 'googleRating': 'google_rating',
    'googleReviewCount': 'google_review_count', 'source': 'source', 'sourceUrl': 'source_url'
}


def run(input_path: Path):
    records = json.loads(input_path.read_text(encoding='utf-8'))
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '3306')),
        database=os.getenv('DB_NAME', 'handicare'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', '1234'),
    )
    cursor = conn.cursor()
    cols = list(COLUMNS.values())
    placeholders = ', '.join(['%s'] * len(cols))
    sql = f"INSERT INTO resources ({', '.join(cols)}) VALUES ({placeholders})"
    inserted = 0
    for r in records:
        source_url = r.get('sourceUrl')
        if isinstance(source_url, str) and len(source_url) > 500:
            r['sourceUrl'] = source_url[:500]
        values = [r.get(key) for key in COLUMNS.keys()]
        cursor.execute(sql, values)
        inserted += 1
    conn.commit()
    cursor.close(); conn.close()
    print(f"Inserted {inserted} resources into MySQL")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='data/clean/resources_clean.json')
    args = parser.parse_args()
    run(Path(args.input))
