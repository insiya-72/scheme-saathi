"""Channel Partner Locator API route for Scheme Saathi.

Provides deterministic partner matching endpoint.
Does NOT use AI — uses rule-based matching from verified partner data.
"""

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.channel_partner_locator import find_channel_partners, get_partner_by_id


router = APIRouter(
    prefix="/api/partners",
    tags=["Channel Partner Locator"],
)


class PartnerSearchRequest(BaseModel):
    state: Optional[str] = Field(default=None, description="User's state")
    district: Optional[str] = Field(default=None, description="User's district")
    scheme_id: Optional[str] = Field(default=None, description="Scheme ID to match partners for")
    loan_category: Optional[str] = Field(default=None, description="Loan category needed")
    max_results: int = Field(default=5, ge=1, le=20)


@router.post("/search")
def search_partners(request: PartnerSearchRequest):
    """Find channel partners based on location and scheme requirements.

    Uses deterministic matching from verified channel partner data.
    """
    result = find_channel_partners(
        state=request.state,
        district=request.district,
        scheme_id=request.scheme_id,
        loan_category=request.loan_category,
        max_results=request.max_results,
    )

    return {
        "status": "success",
        **result,
    }


@router.get("/{partner_id}")
def get_partner(partner_id: str):
    """Get a specific partner by ID."""
    partner = get_partner_by_id(partner_id)

    if not partner:
        return {"status": "error", "message": "Partner not found"}

    return {
        "status": "success",
        "partner": partner,
    }
