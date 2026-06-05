"""Nettoyage, déduplication, statistiques et exports HandiCare."""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from datetime import date
from pathlib import Path

VALID_TYPES = {
    'DOCTOR', 'ASSOCIATION', 'EVENT', 'REHABILITATION_CENTER', 'CABINET',
    'HOSPITAL', 'PHARMACY', 'EMERGENCY', 'TRANSPORT', 'ADMINISTRATIVE_SUPPORT'
}

COLUMNS = [
    'name', 'type', 'disabilityKeys', 'description', 'address', 'latitude', 'longitude',
    'phone', 'website', 'openingHours', 'accessibilityScore', 'accessibilityFeatures',
    'verified', 'services', 'languages', 'lastUpdated', 'googleRating', 'googleReviewCount',
    'source', 'sourceUrl'
]


def norm(value):
    return re.sub(r'\s+', ' ', (value or '').strip())


def key_for(record):
    return (norm(record.get('name')).lower(), norm(record.get('address')).lower())


def clean(records):
    cleaned = []
    seen = set()
    rejected = []
    for record in records:
        record = {k: norm(v) if isinstance(v, str) else v for k, v in record.items()}
        if not record.get('name') or not record.get('address') or not record.get('latitude') or not record.get('longitude'):
            rejected.append({'reason': 'incomplete', 'record': record})
            continue
        if record.get('type') not in VALID_TYPES:
            rejected.append({'reason': 'invalid_type', 'record': record})
            continue
        key = key_for(record)
        if key in seen:
            rejected.append({'reason': 'duplicate', 'record': record})
            continue
        seen.add(key)
        record.setdefault('verified', False)
        record.setdefault('accessibilityScore', 70)
        record.setdefault('accessibilityFeatures', 'À vérifier par administrateur')
        record.setdefault('lastUpdated', date.today().isoformat())
        cleaned.append(record)
    return cleaned, rejected


def sql_value(value):
    if value is None or value == '':
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def write_sql(records, path):
    lines = ['USE handicare;']
    for r in records:
        cols = COLUMNS
        values = [sql_value(r.get(c)) for c in cols]
        col_sql = ', '.join(['disability_keys' if c == 'disabilityKeys' else 'opening_hours' if c == 'openingHours' else 'accessibility_score' if c == 'accessibilityScore' else 'accessibility_features' if c == 'accessibilityFeatures' else 'last_updated' if c == 'lastUpdated' else 'google_rating' if c == 'googleRating' else 'google_review_count' if c == 'googleReviewCount' else 'source_url' if c == 'sourceUrl' else c for c in cols])
        lines.append(f"INSERT INTO resources ({col_sql}) VALUES ({', '.join(values)});")
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def write_pdf(stats, records, path):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
    except Exception:
        path.with_suffix('.txt').write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding='utf-8')
        return
    c = canvas.Canvas(str(path), pagesize=A4)
    width, height = A4
    y = height - 50
    c.setFont('Helvetica-Bold', 16)
    c.drawString(50, y, 'Rapport import ressources HandiCare')
    y -= 35
    c.setFont('Helvetica', 10)
    for line in [f"Total validé: {stats['total_validated']}", f"Total rejeté: {stats['total_rejected']}", f"Catégories: {stats['by_type']}"]:
        c.drawString(50, y, line[:110])
        y -= 18
    y -= 10
    for record in records[:35]:
        if y < 60:
            c.showPage(); y = height - 50; c.setFont('Helvetica', 9)
        c.drawString(50, y, f"- {record['name']} | {record['type']} | {record['address']}"[:115])
        y -= 14
    c.save()


def run(input_path: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    records = json.loads(input_path.read_text(encoding='utf-8'))
    cleaned, rejected = clean(records)
    stats = {
        'total_raw': len(records),
        'total_validated': len(cleaned),
        'total_rejected': len(rejected),
        'by_type': dict(Counter(r['type'] for r in cleaned)),
        'by_need': dict(Counter(k.strip() for r in cleaned for k in (r.get('disabilityKeys') or '').split(',') if k.strip()))
    }
    (out_dir / 'resources_clean.json').write_text(json.dumps(cleaned, ensure_ascii=False, indent=2), encoding='utf-8')
    (out_dir / 'resources_rejected.json').write_text(json.dumps(rejected, ensure_ascii=False, indent=2), encoding='utf-8')
    (out_dir / 'report.json').write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding='utf-8')
    with (out_dir / 'resources_clean.csv').open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS, extrasaction='ignore')
        writer.writeheader(); writer.writerows(cleaned)
    write_sql(cleaned, out_dir / 'resources_import.sql')
    write_pdf(stats, cleaned, out_dir / 'report.pdf')
    print(json.dumps(stats, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='data/raw_resources.json')
    parser.add_argument('--out-dir', default='data/clean')
    args = parser.parse_args()
    run(Path(args.input), Path(args.out_dir))
