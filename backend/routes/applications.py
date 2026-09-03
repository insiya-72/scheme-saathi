import secrets
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, status, Header

from database.database import get_db
from schemas.applications import (
    ApplicationCreateRequest,
    ApplicationResponse,
    ApplicationTrackResponse,
    TimelineItemResponse,
)
from services.auth import decode_token

router = APIRouter(
    prefix="/api/applications",
    tags=["Applications"],
)


def _get_optional_user_id(authorization: Optional[str] = Header(None)) -> Optional[int]:
    """Extract user_id from Bearer token if present, otherwise return None."""
    if not authorization:
        return None
    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            payload = decode_token(token)
            if payload and "sub" in payload:
                return int(payload["sub"])
    except Exception:
        pass
    return None


def _generate_application_number(scheme_id: str) -> str:
    """Generate a clean, professional application number e.g. SS-2026-MFS-748921."""
    clean_scheme = "".join(c for c in scheme_id.upper() if c.isalnum()) or "SCH"
    year = datetime.now().year
    random_part = secrets.randbelow(900000) + 100000
    return f"SS-{year}-{clean_scheme}-{random_part}"


def _get_stage_progress(status_code: str) -> tuple[int, str, str]:
    """Return (progress_percentage, current_stage_title, next_step) for an application status."""
    mapping = {
        "submitted": (
            20,
            "Application Registered",
            "Your application has been received. Document verification is starting shortly.",
        ),
        "document_verification": (
            40,
            "Document Verification",
            "Please ensure your Caste and Income certificates are uploaded in Document Center.",
        ),
        "under_review": (
            60,
            "Agency Review in Progress",
            "State Channelizing Agency is verifying project details and category norms.",
        ),
        "partner_processing": (
            75,
            "Partner Branch Appraisal",
            "Channel partner branch is completing financial and field verification.",
        ),
        "approved": (
            90,
            "Application Approved & Sanctioned",
            "Sanction letter issued. Disbursement clearance in process.",
        ),
        "disbursed": (
            100,
            "Loan Disbursed",
            "Concessional credit funds have been successfully released.",
        ),
        "rejected": (
            100,
            "Application Clarification Needed",
            "Application could not be approved based on initial criteria. Check remarks for details.",
        ),
    }
    return mapping.get(status_code.lower(), (20, "Under Processing", "Processing according to scheme guidelines."))


def _fetch_application_with_timeline(cursor, app_id: int) -> ApplicationResponse:
    cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
    app_row = cursor.fetchone()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found.")

    cursor.execute(
        "SELECT * FROM application_timeline WHERE application_id = ? ORDER BY id ASC",
        (app_id,),
    )
    timeline_rows = cursor.fetchall()
    timeline = [
        TimelineItemResponse(
            id=r["id"],
            stage=r["stage"],
            title=r["title"],
            description=r["description"],
            status=r["status"],
            updated_at=str(r["updated_at"]),
        )
        for r in timeline_rows
    ]

    return ApplicationResponse(
        id=app_row["id"],
        application_number=app_row["application_number"],
        user_id=app_row["user_id"],
        scheme_id=app_row["scheme_id"],
        scheme_name=app_row["scheme_name"],
        applicant_name=app_row["applicant_name"],
        applicant_phone=app_row["applicant_phone"],
        category=app_row["category"],
        state=app_row["state"],
        district=app_row["district"],
        loan_amount=app_row["loan_amount"],
        purpose=app_row["purpose"],
        channel_partner_name=app_row["channel_partner_name"],
        status=app_row["status"],
        remarks=app_row["remarks"],
        created_at=str(app_row["created_at"]),
        updated_at=str(app_row["updated_at"]),
        timeline=timeline,
    )


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_application(
    request: ApplicationCreateRequest,
    user_id: Optional[int] = Depends(_get_optional_user_id),
):
    """Submit a new scheme concessional loan application and initialize tracking."""
    app_number = _generate_application_number(request.scheme_id)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO applications (
                application_number, user_id, scheme_id, scheme_name,
                applicant_name, applicant_phone, category, state, district,
                loan_amount, purpose, channel_partner_name, status, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)
            """,
            (
                app_number,
                user_id,
                request.scheme_id,
                request.scheme_name,
                request.applicant_name,
                request.applicant_phone,
                request.category,
                request.state,
                request.district,
                request.loan_amount,
                request.purpose,
                request.channel_partner_name,
                request.remarks or "Application submitted online via Scheme Saathi portal.",
            ),
        )
        app_id = cursor.lastrowid

        # Standard 5-stage timeline setup
        initial_stages = [
            (
                "submitted",
                "Application Registered",
                f"Application registered under {request.scheme_name} for ₹{request.loan_amount:,.0f}.",
                "completed",
            ),
            (
                "document_verification",
                "Document Verification",
                "Verification of Caste Certificate, Income Certificate, and KYC by State Agency.",
                "current",
            ),
            (
                "partner_processing",
                "Lending Partner Processing",
                f"Assigned to {request.channel_partner_name or 'State Channelizing Agency'} for field evaluation.",
                "pending",
            ),
            (
                "sanction",
                "Sanction & Letter Issuance",
                "Approval of concessional credit and sanction letter preparation.",
                "pending",
            ),
            (
                "disbursement",
                "Fund Disbursement",
                "Direct credit release into verified beneficiary account.",
                "pending",
            ),
        ]

        for stage, title, desc, st_val in initial_stages:
            cursor.execute(
                """
                INSERT INTO application_timeline (application_id, stage, title, description, status)
                VALUES (?, ?, ?, ?, ?)
                """,
                (app_id, stage, title, desc, st_val),
            )

        return _fetch_application_with_timeline(cursor, app_id)


@router.get("", response_model=List[ApplicationResponse])
def get_user_applications(user_id: Optional[int] = Depends(_get_optional_user_id)):
    """Retrieve all applications for the authenticated user."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view your applications.",
        )

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM applications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        rows = cursor.fetchall()
        return [_fetch_application_with_timeline(cursor, r["id"]) for r in rows]


@router.get("/track/{identifier}", response_model=ApplicationTrackResponse)
def track_application(identifier: str):
    """Track an application in real-time by application number (e.g. SS-2026-MFS-1002) or phone."""
    clean_id = identifier.strip()
    if not clean_id:
        raise HTTPException(status_code=400, detail="Please provide a valid application number or mobile number.")

    with get_db() as conn:
        cursor = conn.cursor()
        # Search by exact application_number first
        cursor.execute(
            "SELECT id, status FROM applications WHERE lower(application_number) = lower(?) ORDER BY created_at DESC LIMIT 1",
            (clean_id,),
        )
        row = cursor.fetchone()

        # If not found, try searching by phone number
        if not row:
            cursor.execute(
                "SELECT id, status FROM applications WHERE applicant_phone = ? ORDER BY created_at DESC LIMIT 1",
                (clean_id,),
            )
            row = cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No application found for '{clean_id}'. Please verify the number and try again.",
            )

        app_obj = _fetch_application_with_timeline(cursor, row["id"])
        progress_pct, stage_title, next_step = _get_stage_progress(app_obj.status)

        return ApplicationTrackResponse(
            status="success",
            application=app_obj,
            progress_percentage=progress_pct,
            current_stage_title=stage_title,
            next_step=next_step,
        )


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application_details(application_id: int):
    """Get single application details by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        return _fetch_application_with_timeline(cursor, application_id)
