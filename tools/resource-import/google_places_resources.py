"""Collect Casablanca support resources with Google Places API.

This produces JSON and CSV records compatible with HandiCare's resources table.

Usage with Places API (New):
  $env:GOOGLE_MAPS_API_KEY="your_real_key"
  python google_places_resources.py --api-mode new --queries queries.json --out data/google_places_resources.json
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import time
from pathlib import Path
from typing import Any

import requests


NEW_API_URL = "https://places.googleapis.com/v1/places:searchText"
LEGACY_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
LEGACY_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
CASABLANCA_CENTER = {"latitude": 33.5731, "longitude": -7.5898}
DEFAULT_CITY = "Casablanca, Maroc"

CSV_COLUMNS = [
    "name",
    "type",
    "disabilityKeys",
    "description",
    "address",
    "latitude",
    "longitude",
    "phone",
    "website",
    "openingHours",
    "accessibilityScore",
    "accessibilityFeatures",
    "verified",
    "services",
    "languages",
    "lastUpdated",
    "googleRating",
    "googleReviewCount",
    "source",
    "sourceUrl",
]


def load_queries(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_full_query(base_query: str, city: str | None) -> str:
    city = (city or DEFAULT_CITY).strip()
    query = base_query.strip()
    if "casablanca" in query.lower():
        return query
    return f"{query} {city}".strip()


def request_places(api_key: str, query: str, page_token: str | None = None) -> dict[str, Any]:
    body: dict[str, Any] = {
        "textQuery": query,
        "languageCode": "fr",
        "regionCode": "MA",
        "pageSize": 20,
        "locationBias": {
            "circle": {
                "center": CASABLANCA_CENTER,
                "radius": 30000.0,
            }
        },
    }
    if page_token:
        body["pageToken"] = page_token

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.formattedAddress,"
            "places.location,"
            "places.nationalPhoneNumber,"
            "places.internationalPhoneNumber,"
            "places.websiteUri,"
            "places.googleMapsUri,"
            "places.rating,"
            "places.userRatingCount,"
            "places.regularOpeningHours,"
            "places.businessStatus,"
            "places.types,"
            "places.accessibilityOptions,"
            "nextPageToken"
        ),
    }

    response = requests.post(NEW_API_URL, headers=headers, json=body, timeout=30)
    if not response.ok:
        hint = ""
        if response.status_code == 403:
            hint = (
                "\n\n403 permission checklist for Places API (New):"
                "\n- The key must be created in the same project where Places API (New) is enabled."
                "\n- Billing must be linked to that same project."
                "\n- For local Python testing, Application restrictions should be None."
                "\n- API restrictions should be Places API (New), or temporarily Don't restrict key."
                "\n- Save the key settings and wait a few minutes before retrying."
                "\n- If Google Cloud shows Page usage agreements, accept any pending agreement."
            )
        raise RuntimeError(
            f"Google Places API failed for query {query!r} "
            f"with HTTP {response.status_code}:\n{response.text}{hint}"
        )
    return response.json()


def request_legacy_places(api_key: str, query: str, page_token: str | None = None) -> dict[str, Any]:
    params = {
        "query": query,
        "key": api_key,
        "language": "fr",
        "region": "ma",
        "location": f"{CASABLANCA_CENTER['latitude']},{CASABLANCA_CENTER['longitude']}",
        "radius": 30000,
    }
    if page_token:
        params["pagetoken"] = page_token

    response = requests.get(LEGACY_TEXT_SEARCH_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    status = data.get("status")
    if status not in {"OK", "ZERO_RESULTS"}:
        raise RuntimeError(
            f"Google legacy Places Text Search failed for query {query!r} "
            f"with status {status}:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        )
    return data


def request_legacy_details(api_key: str, place_id: str) -> dict[str, Any]:
    params = {
        "place_id": place_id,
        "key": api_key,
        "language": "fr",
        "fields": (
            "place_id,name,formatted_address,geometry,formatted_phone_number,"
            "international_phone_number,website,url,rating,user_ratings_total,"
            "opening_hours,business_status,type"
        ),
    }
    response = requests.get(LEGACY_DETAILS_URL, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    status = data.get("status")
    if status != "OK":
        raise RuntimeError(
            f"Google legacy Places Details failed for place_id {place_id!r} "
            f"with status {status}:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
        )
    return data["result"]


def opening_hours(place: dict[str, Any]) -> str | None:
    periods = place.get("regularOpeningHours", {}).get("weekdayDescriptions") or []
    return " | ".join(periods) if periods else None


def accessibility_features(place: dict[str, Any]) -> str:
    options = place.get("accessibilityOptions") or {}
    enabled = [key for key, value in options.items() if value is True]
    return ", ".join(enabled) if enabled else "A verifier par administrateur"


def score_from_place(place: dict[str, Any]) -> int:
    options = place.get("accessibilityOptions") or {}
    enabled_count = sum(1 for value in options.values() if value is True)
    if enabled_count >= 3:
        return 85
    if enabled_count == 2:
        return 78
    if enabled_count == 1:
        return 72
    return 65


def to_resource(place: dict[str, Any], meta: dict[str, Any], query: str) -> dict[str, Any] | None:
    name = (place.get("displayName") or {}).get("text")
    address = place.get("formattedAddress")
    location = place.get("location") or {}
    latitude = location.get("latitude")
    longitude = location.get("longitude")

    if not name or not address or latitude is None or longitude is None:
        return None

    phone = place.get("internationalPhoneNumber") or place.get("nationalPhoneNumber")
    source_url = place.get("googleMapsUri")

    return {
        "name": name,
        "type": meta["type"],
        "disabilityKeys": meta["disabilityKeys"],
        "description": f"Ressource trouvee via Google Places pour la recherche: {query}",
        "address": address,
        "latitude": latitude,
        "longitude": longitude,
        "phone": phone,
        "website": place.get("websiteUri"),
        "openingHours": opening_hours(place),
        "accessibilityScore": score_from_place(place),
        "accessibilityFeatures": accessibility_features(place),
        "verified": False,
        "services": query,
        "languages": "Arabe, Francais",
        "lastUpdated": None,
        "googleRating": place.get("rating"),
        "googleReviewCount": place.get("userRatingCount"),
        "source": "google_places_new",
        "sourceUrl": source_url,
    }


def legacy_to_resource(place: dict[str, Any], meta: dict[str, Any], query: str) -> dict[str, Any] | None:
    name = place.get("name")
    address = place.get("formatted_address")
    location = ((place.get("geometry") or {}).get("location") or {})
    latitude = location.get("lat")
    longitude = location.get("lng")

    if not name or not address or latitude is None or longitude is None:
        return None

    opening = (place.get("opening_hours") or {}).get("weekday_text") or []
    phone = place.get("international_phone_number") or place.get("formatted_phone_number")

    return {
        "name": name,
        "type": meta["type"],
        "disabilityKeys": meta["disabilityKeys"],
        "description": f"Ressource trouvee via Google Places pour la recherche: {query}",
        "address": address,
        "latitude": latitude,
        "longitude": longitude,
        "phone": phone,
        "website": place.get("website"),
        "openingHours": " | ".join(opening) if opening else None,
        "accessibilityScore": 65,
        "accessibilityFeatures": "A verifier par administrateur",
        "verified": False,
        "services": query,
        "languages": "Arabe, Francais",
        "lastUpdated": None,
        "googleRating": place.get("rating"),
        "googleReviewCount": place.get("user_ratings_total"),
        "source": "google_places_legacy",
        "sourceUrl": place.get("url"),
    }


def collect(api_key: str, config: dict[str, Any], max_pages: int, sleep_seconds: float) -> list[dict[str, Any]]:
    records_by_key: dict[tuple[str, str], dict[str, Any]] = {}

    for item in config["queries"]:
        base_query = item["query"]
        full_query = build_full_query(base_query, config.get("city"))
        print(f"Searching Places API (New): {full_query}")
        page_token = None

        for _ in range(max_pages):
            data = request_places(api_key, full_query, page_token)
            for place in data.get("places", []):
                record = to_resource(place, item, base_query)
                if not record:
                    continue
                key = (record["name"].strip().lower(), record["address"].strip().lower())
                records_by_key[key] = record

            page_token = data.get("nextPageToken")
            if not page_token:
                break
            time.sleep(sleep_seconds)

    return sorted(records_by_key.values(), key=lambda row: (row["type"], row["name"]))


def collect_legacy(api_key: str, config: dict[str, Any], max_pages: int, sleep_seconds: float) -> list[dict[str, Any]]:
    records_by_key: dict[tuple[str, str], dict[str, Any]] = {}

    for item in config["queries"]:
        base_query = item["query"]
        full_query = build_full_query(base_query, config.get("city"))
        print(f"Searching legacy Places: {full_query}")
        page_token = None

        for _ in range(max_pages):
            data = request_legacy_places(api_key, full_query, page_token)
            for place in data.get("results", []):
                details = place
                if place.get("place_id"):
                    time.sleep(0.2)
                    details = request_legacy_details(api_key, place["place_id"])

                record = legacy_to_resource(details, item, base_query)
                if not record:
                    continue
                key = (record["name"].strip().lower(), record["address"].strip().lower())
                records_by_key[key] = record

            page_token = data.get("next_page_token")
            if not page_token:
                break
            time.sleep(max(sleep_seconds, 2.0))

    return sorted(records_by_key.values(), key=lambda row: (row["type"], row["name"]))


def write_json(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def write_csv(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--queries", default="queries.json", help="Path to queries.json.")
    parser.add_argument("--out", default="data/google_places_resources.json", help="Output JSON path.")
    parser.add_argument("--csv-out", default=None, help="Optional CSV output path.")
    parser.add_argument("--api-key", default=os.getenv("GOOGLE_MAPS_API_KEY"), help="Google Maps API key.")
    parser.add_argument(
        "--api-mode",
        choices=["new", "legacy"],
        default="new",
        help="Use Places API (New) or legacy Places API endpoints.",
    )
    parser.add_argument("--max-pages", type=int, default=3, help="Max result pages per query.")
    parser.add_argument("--sleep-seconds", type=float, default=2.0, help="Delay between pages.")
    args = parser.parse_args()

    if not args.api_key:
        raise SystemExit("Set GOOGLE_MAPS_API_KEY or pass --api-key.")

    config = load_queries(Path(args.queries))
    if args.api_mode == "legacy":
        records = collect_legacy(args.api_key, config, args.max_pages, args.sleep_seconds)
    else:
        records = collect(args.api_key, config, args.max_pages, args.sleep_seconds)

    json_path = Path(args.out)
    csv_path = Path(args.csv_out) if args.csv_out else json_path.with_suffix(".csv")
    write_json(json_path, records)
    write_csv(csv_path, records)
    print(f"Wrote {len(records)} resources to {json_path} and {csv_path}")


if __name__ == "__main__":
    main()
