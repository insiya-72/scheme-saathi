"""Channel Partner Locator Service.

Provides deterministic matching of channel partners based on user location
and scheme requirements. This service does NOT use AI - it uses rule-based
matching from verified partner data.
"""

from pathlib import Path
from typing import Any


# Partner data file path
_PARTNER_FILE = (
    Path(__file__).resolve().parent.parent / "data" / "channel_partners.json"
)


def _load_partners() -> list[dict[str, Any]]:
    """Load channel partners from JSON data file."""
    import json

    if not _PARTNER_FILE.exists():
        return []

    with open(_PARTNER_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data.get("partners", [])


def _calculate_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate approximate distance between two coordinates in km."""
    import math

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
        user_lat: User's latitude for distance calculation (optional)
        user_lon: User's longitude for distance calculation (optional)

    Returns:
        dict with keys:
            - partners: list of matched partners (sorted by distance if coordinates provided)
            - total_found: total number of matching partners
            - search_criteria: the criteria used for matching
    """
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

    for partner in partners:
        # Skip inactive partners
        if partner.get("status") != "active":
            continue

        # Filter by state if provided
        if state and partner.get("state") and partner["state"].lower() != state.lower():
            continue

        # Filter by district if provided
        if district and partner.get("district") and partner["district"].lower() != district.lower():
            continue

        # Filter by supported schemes if provided
        if scheme_id:
            supported_schemes = partner.get("supported_schemes", [])
            if supported_schemes and scheme_id not in supported_schemes:
                continue

        # Filter by supported loan categories if provided
        if loan_category:
            supported_categories = partner.get("supported_loan_categories", [])
            if supported_categories and loan_category.lower() not in [c.lower() for c in supported_categories]:
                continue

        # Calculate distance if coordinates provided
        distance_km = None
        if user_lat is not None and user_lon is not None:
            partner_lat = partner.get("latitude")
            partner_lon = partner.get("longitude")
            if partner_lat is not None and partner_lon is not None:
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
