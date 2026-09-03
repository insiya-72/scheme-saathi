from pydantic import BaseModel, Field
from typing import Optional


class UserProfileRequest(BaseModel):
    age: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    annual_income: Optional[float] = Field(default=None, ge=0)
    purpose: Optional[str] = None
    business_type: Optional[str] = None
    project_stage: Optional[str] = None
    project_cost: Optional[float] = Field(default=None, ge=0)
    required_loan: Optional[float] = Field(default=None, ge=0)
    course: Optional[str] = None
    institution: Optional[str] = None
    course_fee: Optional[float] = Field(default=None, ge=0)
    education_level: Optional[str] = None
    own_contribution: Optional[float] = Field(default=None, ge=0)
    existing_loan: Optional[str] = None
    outstanding_amount: Optional[float] = Field(default=None, ge=0)
    overdue: Optional[str] = None
