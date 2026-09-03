"""Channel Partner Locator Service.

Provides deterministic matching of channel partners based on user location
and scheme requirements. This service does NOT use AI - it uses rule-based
matching from verified partner data.
"""

import json
import math
from pathlib import Path
from typing import Any

# Partner data file path
_PARTNER_FILE = (
    Path(__file__).resolve().parent.parent / "data" / "channel_partners.json"
)

_PARTNERS_CACHE: list[dict[str, Any]] | None = None


def _load_partners() -> list[dict[str, Any]]:
    """Load channel partners from JSON data file with safe in-memory caching."""
    global _PARTNERS_CACHE
    if _PARTNERS_CACHE is None:
        if not _PARTNER_FILE.exists():
            return []
        with open(_PARTNER_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        _PARTNERS_CACHE = data.get("partners", [])
    return _PARTNERS_CACHE


def _calculate_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate approximate distance between two coordinates in km."""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def find_channel_partners(
    state: str | None = None,
    district: str | None = None,
    scheme_id: str | None = None,
    loan_category: str | None = None,
    max_results: int = 5,
    user_lat: float | None = None,
    user_lon: float | None = None,
) -> dict[str, Any]:
    """Find channel partners based on user location and scheme requirements.

    This is a deterministic function that matches partners from verified data.
    It does NOT use AI or make any subjective recommendations.

    Args:
        state: User's state (e.g., "Maharashtra", "Delhi")
        district: User's district (e.g., "Mumbai", "New Delhi")
        scheme_id: Scheme ID to find partners for (e.g., "NSFDC_ATNF")
        loan_category: Loan category needed (e.g., "education", "business")
        max_results: Maximum number of partners to return (default 5)
        user_lat: User's latitude for distance calculation (-90 to 90 degrees)
        user_lon: User's longitude for distance calculation (-180 to 180 degrees)

    Returns:
        dict with keys:
            - partners: list of matched partners (sorted by distance if coordinates provided)
            - total_found: total number of matching partners
            - search_criteria: the criteria used for matching
    """
    # Validate latitude and longitude ranges
    if user_lat is not None:
        try:
            user_lat = float(user_lat)
        except (ValueError, TypeError) as err:
            raise ValueError("Latitude must be a valid number") from err
        if not (-90.0 <= user_lat <= 90.0):
            raise ValueError(f"Latitude must be between -90 and 90 degrees (got {user_lat})")

    if user_lon is not None:
        try:
            user_lon = float(user_lon)
        except (ValueError, TypeError) as err:
            raise ValueError("Longitude must be a valid number") from err
        if not (-180.0 <= user_lon <= 180.0):
            raise ValueError(f"Longitude must be between -180 and 180 degrees (got {user_lon})")

    partners = _load_partners()

    if not partners:
        return {
            "partners": [],
            "total_found": 0,
            "search_criteria": {
                "state": state,
                "district": district,
                "scheme_id": scheme_id,
                "loan_category": loan_category,
            },
            "message": "No channel partner data available.",
        }

    # Filter partners based on criteria
    matched = []

    clean_state = state.strip().lower() if state else None
    clean_district = district.strip().lower() if district else None
    clean_cat = loan_category.strip().lower() if loan_category else None

    for partner in partners:
        # Skip inactive partners
        if partner.get("status") != "active":
            continue

        # Robust case-insensitive state matching
        if clean_state:
            partner_state = str(partner.get("state") or "").strip().lower()
            if not partner_state or partner_state != clean_state:
                continue

        # Robust case-insensitive district matching
        if clean_district:
            partner_district = str(partner.get("district") or "").strip().lower()
            if not partner_district or partner_district != clean_district:
                continue

        # Filter by supported schemes if provided
        if scheme_id:
            supported_schemes = partner.get("supported_schemes", [])
            if supported_schemes and scheme_id not in supported_schemes:
                continue

        # Filter by supported loan categories if provided
        if clean_cat:
            supported_categories = [
                str(c).strip().lower()
                for c in partner.get("supported_loan_categories", [])
            ]
            if supported_categories and clean_cat not in supported_categories:
                continue

        # Calculate distance if coordinates provided
        distance_km = None
        if user_lat is not None and user_lon is not None:
            partner_lat = partner.get("latitude")
            partner_lon = partner.get("longitude")
            if (
                partner_lat is not None
                and partner_lon is not None
                and isinstance(partner_lat, (int, float))
                and isinstance(partner_lon, (int, float))
                and -90.0 <= partner_lat <= 90.0
                and -180.0 <= partner_lon <= 180.0
            ):
                distance_km = _calculate_distance(
                    user_lat, user_lon, partner_lat, partner_lon
                )

        matched.append(
            {
                "partner_id": partner.get("partner_id"),
                "name": partner.get("name"),
                "type": partner.get("type"),
                "state": partner.get("state"),
                "district": partner.get("district"),
                "address": partner.get("address"),
                "contact": partner.get("contact"),
                "website": partner.get("website"),
                "official_url": partner.get("official_url"),
                "supported_loan_categories": partner.get("supported_loan_categories", []),
                "supported_schemes": partner.get("supported_schemes", []),
                "max_loan_amount_handled": partner.get("max_loan_amount_handled"),
                "distance_km": round(distance_km, 2) if distance_km is not None else None,
                "verified": partner.get("verified", False),
            }
        )

    # Sort by distance if coordinates were provided
    if user_lat is not None and user_lon is not None:
        matched.sort(
            key=lambda p: p["distance_km"] if p["distance_km"] is not None else float("inf")
        )

    # Limit results
    matched = matched[:max_results]

    return {
        "partners": matched,
        "total_found": len(matched),
        "search_criteria": {
            "state": state,
            "district": district,
            "scheme_id": scheme_id,
            "loan_category": loan_category,
        },
        "message": (
            f"Found {len(matched)} channel partner(s)"
            if matched
            else "No verified eligible Channel Partner was found for your location and requirement."
        ),
    }


def get_partner_by_id(partner_id: str) -> dict[str, Any] | None:
    """Get a specific partner by ID."""
    partners = _load_partners()

    for partner in partners:
        if partner.get("partner_id") == partner_id:
            return partner

    return None
