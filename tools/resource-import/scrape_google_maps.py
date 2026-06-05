"""Collecte prudente de ressources Google Maps pour HandiCare.

Usage:
  python scrape_google_maps.py --queries queries.json --out data/raw_resources.json
  playwright install chromium

Note: pour une production stable et conforme, préférez Google Places API.
Ce script applique des délais, limite les volumes et écrit des résultats bruts à valider.
"""
from __future__ import annotations

import argparse
import json
import random
import re
import time
from pathlib import Path
from urllib.parse import quote_plus

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


def sleep_between(bounds: dict) -> None:
    time.sleep(random.uniform(float(bounds.get("min", 4)), float(bounds.get("max", 9))))


def text_or_none(locator):
    try:
        value = locator.first.text_content(timeout=1500)
        return value.strip() if value else None
    except Exception:
        return None


def extract_coords(url: str):
    patterns = [r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", r"@(-?\d+\.\d+),(-?\d+\.\d+),"]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return float(match.group(1)), float(match.group(2))
    return None, None


def parse_rating(text: str | None):
    if not text:
        return None, None
    rating_match = re.search(r"(\d+[,.]\d+)", text)
    count_match = re.search(r"\(?([\d\s,.]+)\)?\s*(avis|reviews)", text, re.I)
    rating = float(rating_match.group(1).replace(',', '.')) if rating_match else None
    count = None
    if count_match:
        raw = re.sub(r"\D", "", count_match.group(1))
        count = int(raw) if raw else None
    return rating, count


def scrape_place(page, base_meta: dict):
    url = page.url
    lat, lng = extract_coords(url)
    title = text_or_none(page.locator('h1'))
    rating_text = text_or_none(page.locator('[role="img"][aria-label*="étoile"], [role="img"][aria-label*="star"]'))
    rating, review_count = parse_rating(rating_text)

    details = page.locator('button[data-item-id], a[data-item-id]')
    address = phone = website = hours = None
    for i in range(min(details.count(), 40)):
        try:
            item = details.nth(i)
            label = (item.get_attribute('aria-label') or '').strip()
            data_id = item.get_attribute('data-item-id') or ''
            if not label:
                continue
            lower = label.lower()
            if 'address' in data_id or 'adresse' in lower:
                address = label.replace('Adresse:', '').strip()
            elif 'phone' in data_id or 'téléphone' in lower or 'telephone' in lower:
                phone = label.replace('Téléphone:', '').replace('Phone:', '').strip()
            elif 'authority' in data_id or 'site web' in lower or 'website' in lower:
                website = item.get_attribute('href') or label
            elif 'hours' in data_id or 'horaires' in lower:
                hours = label
        except Exception:
            continue

    if not title or not address or lat is None or lng is None:
        return None

    return {
        'name': title,
        'type': base_meta['type'],
        'disabilityKeys': base_meta['disabilityKeys'],
        'description': f"Ressource détectée via Google Maps pour la recherche: {base_meta['query']}",
        'address': address,
        'latitude': lat,
        'longitude': lng,
        'phone': phone,
        'website': website,
        'openingHours': hours,
        'googleRating': rating,
        'googleReviewCount': review_count,
        'source': 'google_maps',
        'sourceUrl': url,
        'verified': False,
        'services': base_meta['query'],
        'languages': 'Arabe, Français',
    }


def run(config_path: Path, out_path: Path) -> None:
    config = json.loads(config_path.read_text(encoding='utf-8'))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=150)
        page = browser.new_page(locale='fr-FR')
        for item in config['queries']:
            search = f"{item['query']} {config.get('city', '')}".strip()
            page.goto(f"https://www.google.com/maps/search/{quote_plus(search)}", wait_until='domcontentloaded')
            sleep_between(config.get('delaySeconds', {}))

            cards = page.locator('a[href*="/maps/place/"]')
            seen_links = []
            limit = int(config.get('maxResultsPerQuery', 25))
            for _ in range(8):
                for i in range(min(cards.count(), limit * 2)):
                    try:
                        href = cards.nth(i).get_attribute('href')
                        if href and href not in seen_links:
                            seen_links.append(href)
                    except Exception:
                        pass
                if len(seen_links) >= limit:
                    break
                page.mouse.wheel(0, 900)
                sleep_between({'min': 1.5, 'max': 3})

            for href in seen_links[:limit]:
                page.goto(href, wait_until='domcontentloaded')
                sleep_between(config.get('delaySeconds', {}))
                try:
                    record = scrape_place(page, item)
                    if record:
                        results.append(record)
                except PlaywrightTimeoutError:
                    continue

        browser.close()

    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Raw resources: {len(results)} -> {out_path}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--queries', default='queries.json')
    parser.add_argument('--out', default='data/raw_resources.json')
    args = parser.parse_args()
    run(Path(args.queries), Path(args.out))
