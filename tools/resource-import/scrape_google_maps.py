"""
Scrape Google Maps for disability-related resources in Casablanca.
Uses Playwright to automate searches and extract place data.

Usage:
    python scrape_google_maps.py --queries queries.json --out raw_resources.json
"""

import argparse
import json
import re
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout


def parse_args():
    parser = argparse.ArgumentParser(description="Scrape Google Maps places")
    parser.add_argument("--queries", required=True, help="Path to JSON array of search queries")
    parser.add_argument("--out", required=True, help="Output JSON file path")
    parser.add_argument("--max-scroll", type=int, default=8, help="Max scroll iterations per query")
    return parser.parse_args()


def extract_places(page, max_scroll: int):
    """Scroll the results panel and extract place cards."""
    places = []
    seen_names = set()

    # Wait for results to load
    try:
        page.wait_for_selector('[role="feed"]', timeout=8000)
    except PwTimeout:
        # Try alternative selector
        try:
            page.wait_for_selector('div.Nv2PK', timeout=5000)
        except PwTimeout:
            return places

    feed = page.query_selector('[role="feed"]')
    if not feed:
        feed = page.query_selector('div[aria-label]')

    for _ in range(max_scroll):
        # Scroll down in the feed
        if feed:
            feed.evaluate('el => el.scrollTop = el.scrollHeight')
        else:
            page.mouse.wheel(0, 800)
        time.sleep(2)

    # Extract all place links
    cards = page.query_selector_all('a.hfpxzc')
    if not cards:
        cards = page.query_selector_all('div.Nv2PK a')

    for card in cards:
        name = card.get_attribute('aria-label') or ''
        href = card.get_attribute('href') or ''
        if not name or name in seen_names:
            continue
        seen_names.add(name)
        places.append({'name': name, 'url': href})

    return places


def extract_place_details(page, place_url: str, timeout_ms: int = 10000) -> dict:
    """Navigate to a place page and extract details."""
    details = {}
    try:
        page.goto(place_url, wait_until='domcontentloaded', timeout=timeout_ms)
        time.sleep(2)

        # Name
        name_el = page.query_selector('h1.DUwDvf')
        if name_el:
            details['name'] = name_el.inner_text().strip()

        # Address
        addr_el = page.query_selector('button[data-item-id="address"] .Io6YTe')
        if not addr_el:
            addr_el = page.query_selector('[data-item-id="address"]')
        if addr_el:
            details['address'] = addr_el.inner_text().strip()

        # Phone
        phone_el = page.query_selector('button[data-item-id^="phone"] .Io6YTe')
        if not phone_el:
            phone_el = page.query_selector('[data-item-id^="phone"]')
        if phone_el:
            details['phone'] = phone_el.inner_text().strip()

        # Website
        web_el = page.query_selector('a[data-item-id="authority"] .Io6YTe')
        if not web_el:
            web_el = page.query_selector('[data-item-id="authority"]')
        if web_el:
            details['website'] = web_el.inner_text().strip()

        # Rating
        rating_el = page.query_selector('div.F7nice span[aria-hidden="true"]')
        if rating_el:
            try:
                details['rating'] = float(rating_el.inner_text().strip().replace(',', '.'))
            except ValueError:
                pass

        # Category / type
        cat_el = page.query_selector('button.DkEaL')
        if cat_el:
            details['category'] = cat_el.inner_text().strip()

        # Hours
        hours_el = page.query_selector('[data-item-id="oh"] .Io6YTe')
        if hours_el:
            details['hours'] = hours_el.inner_text().strip()

        # Coordinates from URL
        url = page.url
        coord_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url)
        if coord_match:
            details['latitude'] = float(coord_match.group(1))
            details['longitude'] = float(coord_match.group(2))

    except Exception as e:
        details['_error'] = str(e)

    return details


def run_scraper(queries: list, max_scroll: int) -> list:
    """Run the scraper across all queries."""
    all_results = []
    seen_names = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            locale='fr-FR',
            geolocation={'latitude': 33.5731, 'longitude': -7.5898},
            permissions=['geolocation']
        )
        page = context.new_page()

        for query in queries:
            print(f"[*] Searching: {query}")
            search_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
            try:
                page.goto(search_url, wait_until='domcontentloaded', timeout=15000)
            except PwTimeout:
                print(f"  [!] Timeout loading search page for: {query}")
                continue

            time.sleep(3)

            # Accept cookies if prompted
            try:
                accept_btn = page.query_selector('button[aria-label*="Accept"], button[aria-label*="Accepter"], form[action*="consent"] button')
                if accept_btn:
                    accept_btn.click()
                    time.sleep(1)
            except Exception:
                pass

            places = extract_places(page, max_scroll)
            print(f"  Found {len(places)} places")

            for place in places:
                if place['name'] in seen_names:
                    continue
                seen_names.add(place['name'])

                if place.get('url'):
                    details = extract_place_details(page, place['url'])
                    place.update(details)

                place['_query'] = query
                all_results.append(place)
                print(f"    -> {place.get('name', '?')}")

        browser.close()

    return all_results


def main():
    args = parse_args()

    queries_path = Path(args.queries)
    if not queries_path.exists():
        print(f"Error: queries file not found: {queries_path}")
        return

    queries = json.loads(queries_path.read_text(encoding='utf-8'))

    print(f"Loaded {len(queries)} queries")
    results = run_scraper(queries, args.max_scroll)
    print(f"\nTotal unique places scraped: {len(results)}")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Saved to: {out_path}")


if __name__ == '__main__':
    main()
