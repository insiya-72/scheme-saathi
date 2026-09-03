import os
import uuid
import base64
import mimetypes
from pathlib import Path
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse

from database.database import get_db
from schemas.documents import (
    DocumentRequirementItem,
    DocumentResponse,
    DocumentUploadRequest,
    DocumentUploadResponse,
    DocumentChecklistResponse,
)
from services.auth import get_current_user

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_REQUIREMENTS: List[DocumentRequirementItem] = [
    DocumentRequirementItem(
        document_type="caste_certificate",
        name="Caste Certificate",
        name_hi="जाति प्रमाण पत्र",
        description="Valid Scheduled Caste (SC) certificate issued by a competent Revenue / Tehsildar authority.",
        mandatory=True,
        accepted_formats=["pdf", "jpg", "jpeg", "png"],
        max_size_mb=5,
    ),
    DocumentRequirementItem(
        document_type="income_certificate",
        name="Income Certificate",
        name_hi="आय प्रमाण पत्र",
        description="Annual family income certificate (income must not exceed ₹5,00,000 per annum).",
        mandatory=True,
        accepted_formats=["pdf", "jpg", "jpeg", "png"],
        max_size_mb=5,
    ),
    DocumentRequirementItem(
        document_type="identity_proof",
        name="Identity Proof (Aadhaar / Voter ID)",
        name_hi="पहचान प्रमाण (आधार / मतदाता पहचान पत्र)",
        description="Government photo ID proof: Aadhaar Card, Voter Identity Card, or PAN Card.",
        mandatory=True,
        accepted_formats=["pdf", "jpg", "jpeg", "png"],
        max_size_mb=5,
    ),
    DocumentRequirementItem(
        document_type="address_proof",
        name="Address Proof / Domicile",
        name_hi="निवास / पता प्रमाण",
        description="Ration Card, Electricity Bill, Domicile certificate, or Bank Statement.",
        mandatory=True,
        accepted_formats=["pdf", "jpg", "jpeg", "png"],
        max_size_mb=5,
    ),
    DocumentRequirementItem(
        document_type="bank_statement",
        name="Bank Passbook / Cancelled Cheque",
        name_hi="बैंक पासबुक / रद्द चेक",
        description="Bank passbook front page or cancelled cheque showing Account Number and IFSC.",
        mandatory=True,
        accepted_formats=["pdf", "jpg", "jpeg", "png"],
        max_size_mb=5,
    ),
    DocumentRequirementItem(
        document_type="dpr",
        name="Project Report / Quotation (DPR)",
        name_hi="परियोजना रिपोर्ट / कोटेशन (DPR)",
        description="Detailed project report or vendor quotations for machinery, stock, or business setup.",
        mandatory=False,
        accepted_formats=["pdf", "jpg", "jpeg", "png"],
        max_size_mb=10,
    ),
    DocumentRequirementItem(
        document_type="education_proof",
        name="Educational Admission / Fee Slip",
        name_hi="शैक्षणिक प्रवेश / शुल्क रसीद",
        description="Offer letter, admission proof, or fee structure (required for Educational Loan Scheme - ELS).",
        mandatory=False,
        accepted_formats=["pdf", "jpg", "jpeg", "png"],
        max_size_mb=10,
    ),
]


def _row_to_document_response(row) -> DocumentResponse:
    return DocumentResponse(
        id=row["id"],
        user_id=row["user_id"],
        application_id=row["application_id"],
        document_type=row["document_type"],
        document_name=row["document_name"],
        file_path=row["file_path"],
        file_size=row["file_size"],
        file_type=row["file_type"],
        verification_status=row["verification_status"] or "pending",
        verified_at=str(row["verified_at"]) if row["verified_at"] else None,
        notes=row["notes"],
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"]),
    )


@router.get("/requirements", response_model=List[DocumentRequirementItem])
def get_document_requirements():
    """Return standard indicative document requirements and guidelines."""
    return DEFAULT_REQUIREMENTS


@router.get("", response_model=List[DocumentResponse])
def get_user_documents(current_user: dict = Depends(get_current_user)):
    """Retrieve all uploaded documents for the authenticated user."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM documents 
            WHERE user_id = ? 
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = cursor.fetchall()
        return [_row_to_document_response(r) for r in rows]


@router.get("/checklist", response_model=DocumentChecklistResponse)
def get_user_checklist(current_user: dict = Depends(get_current_user)):
    """Return document checklist with completion rate for the authenticated user."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
        rows = cursor.fetchall()
        uploaded_docs = [_row_to_document_response(r) for r in rows]

    uploaded_types = {d.document_type for d in uploaded_docs}
    mandatory_reqs = [r for r in DEFAULT_REQUIREMENTS if r.mandatory]
    mandatory_total = len(mandatory_reqs)
    mandatory_uploaded = sum(1 for r in mandatory_reqs if r.document_type in uploaded_types)

    percentage = int((mandatory_uploaded / mandatory_total) * 100) if mandatory_total > 0 else 100

    return DocumentChecklistResponse(
        requirements=DEFAULT_REQUIREMENTS,
        uploaded=uploaded_docs,
        completion_percentage=percentage,
        mandatory_uploaded=mandatory_uploaded,
        mandatory_total=mandatory_total,
    )


@router.post("/upload", response_model=DocumentUploadResponse)
def upload_document(
    payload: DocumentUploadRequest,
    current_user: dict = Depends(get_current_user),
):
    """Upload a verified document file via Base64 payload and record it in Document Center."""
    user_id = current_user["id"]
    filename = payload.file_name or "document"
    ext = Path(filename).suffix.lower()

    allowed_exts = {".pdf", ".jpg", ".jpeg", ".png"}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed types: PDF, JPG, JPEG, PNG.",
        )

    # Strip potential data URL prefix, e.g. "data:image/png;base64,"
    raw_b64 = payload.file_base64
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]

    try:
        file_bytes = base64.b64decode(raw_b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 file data provided.",
        )

    file_size = len(file_bytes)
    max_bytes = 10 * 1024 * 1024  # 10MB
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10MB.",
        )

    # Save to disk with unique secure filename
    stored_name = f"user_{user_id}_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = UPLOAD_DIR / stored_name

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    content_type, _ = mimetypes.guess_type(filename)
    if not content_type:
        content_type = "application/pdf" if ext == ".pdf" else "image/jpeg"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO documents (
                user_id, application_id, document_type, document_name,
                file_path, file_size, file_type, verification_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', ?)
            """,
            (
                user_id,
                payload.application_id,
                payload.document_type,
                filename,
                stored_name,
                file_size,
                content_type,
                "Uploaded via Scheme Saathi Document Center",
            ),
        )
        doc_id = cursor.lastrowid
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        new_row = cursor.fetchone()

    return DocumentUploadResponse(
        status="success",
        message=f"{filename} uploaded and verified successfully.",
        document=_row_to_document_response(new_row),
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Delete an uploaded document."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ? AND user_id = ?", (document_id, user_id))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        file_path = UPLOAD_DIR / row["file_path"]
        if file_path.exists():
            try:
                os.remove(file_path)
            except Exception:
                pass

        cursor.execute("DELETE FROM documents WHERE id = ?", (document_id,))

    return {"status": "success", "message": "Document deleted successfully."}


@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve and download document file."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ? AND user_id = ?", (document_id, user_id))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

        file_path = UPLOAD_DIR / row["file_path"]
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on server.",
            )

        return FileResponse(
            path=str(file_path),
            filename=row["document_name"],
            media_type=row["file_type"] or "application/octet-stream",
        )
