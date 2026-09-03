from typing import Optional, List
from pydantic import BaseModel, Field


class TimelineItemResponse(BaseModel):
    id: Optional[int] = None
    stage: str
    title: str
    description: Optional[str] = None
    status: str  # 'completed', 'current', 'pending'
    updated_at: str


class ApplicationCreateRequest(BaseModel):
    scheme_id: str = Field(..., description="Target Scheme ID, e.g. MFS, AMY, TL")
    scheme_name: str = Field(..., description="Full Name of the Scheme")
    applicant_name: str = Field(..., min_length=2, description="Applicant Full Name")
    applicant_phone: str = Field(..., description="10-digit Indian Mobile Number")
    loan_amount: float = Field(..., gt=0, description="Requested Loan Amount in INR")
    category: Optional[str] = Field("SC", description="Social category (SC, OBC, etc.)")
    state: Optional[str] = None
    district: Optional[str] = None
    purpose: Optional[str] = None
    channel_partner_name: Optional[str] = None
    remarks: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    application_number: str
    user_id: Optional[int] = None
    scheme_id: str
    scheme_name: str
    applicant_name: str
    applicant_phone: str
    category: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    loan_amount: float
    purpose: Optional[str] = None
    channel_partner_name: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    created_at: str
    updated_at: str
    timeline: List[TimelineItemResponse] = []


class ApplicationTrackResponse(BaseModel):
    status: str
    application: Optional[ApplicationResponse] = None
    progress_percentage: int = 0
    current_stage_title: str = ""
    next_step: str = ""
