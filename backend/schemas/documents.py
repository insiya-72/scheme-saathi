from typing import Optional, List
from pydantic import BaseModel, Field


class DocumentRequirementItem(BaseModel):
    document_type: str
    name: str
    name_hi: str
    description: str
    mandatory: bool = True
    accepted_formats: List[str] = ["pdf", "jpg", "jpeg", "png"]
    max_size_mb: int = 5
    sample_url: Optional[str] = None


class DocumentUploadRequest(BaseModel):
    document_type: str = Field(..., description="Document type key, e.g. caste_certificate")
    file_name: str = Field(..., description="Original filename with extension")
    file_base64: str = Field(..., description="Base64 encoded file content or data URL")
    application_id: Optional[int] = Field(None, description="Optional associated application ID")


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    application_id: Optional[int] = None
    document_type: str
    document_name: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    verification_status: str = "pending"  # pending, verified, rejected
    verified_at: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class DocumentUploadResponse(BaseModel):
    status: str
    message: str
    document: DocumentResponse


class DocumentChecklistResponse(BaseModel):
    requirements: List[DocumentRequirementItem]
    uploaded: List[DocumentResponse]
    completion_percentage: int
    mandatory_uploaded: int
    mandatory_total: int
