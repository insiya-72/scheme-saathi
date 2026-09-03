from typing import Any


def _income_is_eligible(
    user_income: float | None,
    scheme: dict[str, Any],
) -> tuple[bool, str | None]:
    eligibility = scheme.get("eligibility") or {}
    income_rule = eligibility.get(
        "annual_family_income"
    )

    if not income_rule:
        return True, None

    try:
        income_val = float(user_income) if user_income is not None else 0.0
    except (ValueError, TypeError):
        income_val = 0.0

    limit = income_rule.get("amount_inr", 0)
    operator = income_rule.get("operator", "<=")

    if operator == "<=":
        ok = income_val <= limit
        msg = (
            None
            if ok
            else (
                f"Annual family income ₹{income_val:,.0f} exceeds "
                f"the scheme limit of ₹{limit:,} (≤ ₹{limit:,})."
            )
        )
        return ok, msg

    if operator == "<":
        ok = income_val < limit
        msg = (
            None
            if ok
            else (
                f"Annual family income ₹{income_val:,.0f} is not below "
                f"the scheme limit of ₹{limit:,}."
            )
        )
        return ok, msg

    if operator == ">=":
        ok = income_val >= limit
        msg = (
            None
            if ok
            else (
                f"Annual family income ₹{income_val:,.0f} is below "
                f"the minimum of ₹{limit:,}."
            )
        )
        return ok, msg

    if operator == ">":
        ok = income_val > limit
        msg = (
            None
            if ok
            else (
                f"Annual family income ₹{income_val:,.0f} is not above "
                f"the minimum of ₹{limit:,}."
            )
        )
        return ok, msg

    return False, "Could not evaluate income rule."


def _community_is_eligible(
    user_category: str,
    scheme: dict[str, Any],
) -> tuple[bool, str | None]:
    eligibility = scheme.get("eligibility") or {}
    allowed = (
        eligibility
        .get("community", {})
        .get("allowed", [])
    )

    if not allowed:
        return True, None

    normalized_allowed = {
        str(item).upper().strip()
        for item in allowed
    }

    ok = user_category.upper().strip() in normalized_allowed
    if ok:
        return True, None

    allowed_display = ", ".join(sorted(allowed))
    return (
        False,
        (
            f"Applicant category '{user_category}' does not match "
            f"the required categories: {allowed_display}."
        ),
    )


def _project_cost_is_eligible(
    project_cost: float | None,
    scheme: dict[str, Any],
) -> tuple[bool, str | None]:
    if project_cost is None:
        return True, None

    try:
        cost_val = float(project_cost)
    except (ValueError, TypeError):
        return True, None

    financial_terms = scheme.get("financial_terms") or {}

    minimum_project_cost = financial_terms.get(
        "minimum_project_cost_exclusive_inr"
    )

    maximum_project_cost = financial_terms.get(
        "maximum_project_cost_inr"
    )

    if (
        minimum_project_cost is not None
        and cost_val <= minimum_project_cost
    ):
        return (
            False,
            (
                "Project cost must be greater than "
                f"₹{minimum_project_cost:,}."
            ),
        )

    if (
        maximum_project_cost is not None
        and cost_val > maximum_project_cost
    ):
        return (
            False,
            (
                "Project cost exceeds the scheme limit "
                f"of ₹{maximum_project_cost:,}."
            ),
        )

    return True, None


def _purpose_is_eligible(
    purpose: str | None,
    scheme: dict[str, Any],
) -> bool:
    if not purpose:
        return True

    normalized_purpose = (
        str(purpose)
        .lower()
        .strip()
    )

    scheme_name = (
        str(scheme["name"])
        .lower()
        .strip()
    )

    if "educational" in scheme_name:
        return normalized_purpose == "education"

    business_purposes = {
        "new_business",
        "business_expansion",
        "agriculture",
        "skill",
    }

    if "micro finance" in scheme_name:
        return normalized_purpose in business_purposes

    if "aajeevika" in scheme_name:
        return normalized_purpose in business_purposes

    if "term loan" in scheme_name:
        return normalized_purpose in business_purposes

    if "udyam nidhi" in scheme_name:
        return normalized_purpose in business_purposes

    return True


def _education_is_eligible(
    user_data: dict[str, Any],
    scheme: dict[str, Any],
) -> tuple[bool, str | None]:
    scheme_name = (
        str(scheme["name"])
        .lower()
        .strip()
    )

    if "educational" not in scheme_name:
        return True, None

    if user_data.get("purpose") != "education":
        return (
            False,
            "The selected requirement is not education.",
        )

    education_level = user_data.get(
        "education_level"
    )

    allowed_levels = {
        "professional",
        "technical",
        "professional_technical",
        "undergraduate",
        "postgraduate",
        "doctoral",
        "higher_doctoral",
    }

    if education_level:
        normalized = (
            str(education_level)
            .lower()
            .strip()
        )

        if normalized not in allowed_levels:
            return (
                False,
                (
                    "The selected education level may not "
                    "match the applicable course requirements."
                ),
            )

    return True, None


def _gender_status(
    normalized_gender: str,
    scheme: dict[str, Any],
) -> dict[str, Any]:
    eligibility = scheme.get("eligibility") or {}
    gender_rule = eligibility.get("gender_rule", {})

    rule_type = gender_rule.get("type")

    if rule_type == "women_target":
        is_female = normalized_gender == "female"

        return {
            "rule_type": "women_target",
            "applies": is_female,
            "message": (
                "Women-focused fund allocation target applies."
                if is_female
                else (
                    "Applicant gender does not satisfy the "
                    "women-focused scheme condition."
                )
            ),
        }

    return {
        "rule_type": "none",
        "applies": False,
        "message": None,
    }


def check_scheme_eligibility(
    user_data: dict[str, Any],
    scheme: dict[str, Any],
) -> dict[str, Any]:

    reasons: list[str] = []
    failures: list[str] = []
    criterion_status: list[dict[str, Any]] = []

    category = (
        str(user_data.get("category", ""))
        .upper()
        .strip()
    )

    annual_income_raw = user_data.get("annual_income")
    try:
        income = float(annual_income_raw) if annual_income_raw not in (None, "") else 0.0
        if income < 0:
            income = 0.0
    except (ValueError, TypeError):
        income = 0.0

    project_cost_raw = user_data.get("project_cost")
    project_cost: float | None = None
    if project_cost_raw not in (None, "", 0, "0"):
        try:
            val = float(project_cost_raw)
            if val > 0:
                project_cost = val
        except (ValueError, TypeError):
            project_cost = None

    purpose = user_data.get("purpose")
    gender = user_data.get("gender")
    normalized_gender = (
        str(gender).lower().strip() if gender is not None else ""
    )

    eligibility = scheme.get("eligibility") or {}
    financial_terms = scheme.get("financial_terms") or {}

    # -----------------------------------------------------
    # COMMUNITY
    # -----------------------------------------------------

    community_ok, community_msg = _community_is_eligible(
        category,
        scheme,
    )

    criterion_status.append({
        "criterion": "community",
        "description": "Caste / community requirement",
        "satisfied": community_ok,
        "user_value": category or "Not provided",
        "required": (
            eligibility
            .get("community", {})
            .get("allowed", [])
        ),
        "message": community_msg if not community_ok else "Satisfied.",
    })

    if community_ok:
        reasons.append(
            "Community requirement satisfied."
        )
    else:
        failures.append(
            community_msg
            or (
                "Applicant does not satisfy the scheme's "
                "community requirement."
            )
        )

    # -----------------------------------------------------
    # INCOME
    # -----------------------------------------------------

    income_ok, income_msg = _income_is_eligible(
        income,
        scheme,
    )

    income_rule = eligibility.get(
        "annual_family_income"
    )
    income_limit = (
        income_rule.get("amount_inr") if income_rule else None
    )
    income_operator = (
        income_rule.get("operator") if income_rule else None
    )

    criterion_status.append({
        "criterion": "income",
        "description": "Annual family income limit",
        "satisfied": income_ok,
        "user_value": f"₹{income:,.0f}",
        "required": (
            f"{income_operator} ₹{income_limit:,}"
            if income_limit is not None
            else "No limit"
        ),
        "message": (
            income_msg if not income_ok else "Satisfied."
        ),
    })

    if income_ok:
        reasons.append(
            (
                "Annual family income is within the "
                "applicable scheme limit."
            )
        )
    else:
        failures.append(
            income_msg
            or (
                "Annual family income exceeds the "
                "applicable scheme limit."
            )
        )

    # -----------------------------------------------------
    # PURPOSE
    # -----------------------------------------------------

    purpose_ok = _purpose_is_eligible(
        purpose,
        scheme,
    )

    criterion_status.append({
        "criterion": "purpose",
        "description": "Requirement / purpose type",
        "satisfied": purpose_ok,
        "user_value": purpose or "Not provided",
        "required": (
            scheme.get("purpose", [])
            if isinstance(scheme.get("purpose"), list)
            else scheme.get("purpose", "Any")
        ),
        "message": (
            "Satisfied."
            if purpose_ok
            else "Requirement type does not match the scheme."
        ),
    })

    if purpose_ok:
        reasons.append(
            "Requirement type is compatible with the scheme."
        )
    else:
        failures.append(
            "Requirement type does not match the scheme."
        )

    # -----------------------------------------------------
    # PROJECT COST
    # -----------------------------------------------------

    project_ok, project_error = (
        _project_cost_is_eligible(
            project_cost,
            scheme,
        )
    )

    min_cost = financial_terms.get(
        "minimum_project_cost_exclusive_inr"
    )
    max_cost = financial_terms.get(
        "maximum_project_cost_inr"
    )

    criterion_status.append({
        "criterion": "project_cost",
        "description": "Project cost range",
        "satisfied": project_ok,
        "user_value": (
            f"₹{project_cost:,.0f}" if project_cost is not None
            else "Not provided"
        ),
        "required": (
            (
                f"> ₹{min_cost:,}"
                if min_cost is not None
                else ""
            )
            + (
                f" and ≤ ₹{max_cost:,}"
                if max_cost is not None
                else ""
            )
        ).strip() or "No limit",
        "message": (
            project_error if not project_ok
            else (
                "Satisfied."
                if project_cost is not None
                else "No project cost provided; criterion skipped."
            )
        ),
    })

    if project_ok:
        if project_cost is not None:
            reasons.append(
                (
                    "Project cost falls within the "
                    "applicable scheme range."
                )
            )
    else:
        failures.append(
            project_error
            or (
                "Project cost is outside the "
                "applicable scheme range."
            )
        )

    # -----------------------------------------------------
    # EDUCATION
    # -----------------------------------------------------

    education_ok, education_error = (
        _education_is_eligible(
            user_data,
            scheme,
        )
    )

    scheme_id = str(scheme.get("id", "")).upper().strip()
    scheme_name_lower = str(scheme.get("name", "")).lower().strip()
    scheme_purpose = scheme.get("purpose", [])
    if isinstance(scheme_purpose, str):
        scheme_purpose = [scheme_purpose]
    purpose_list = [str(p).lower().strip() for p in scheme_purpose]

    is_education_scheme = (
        scheme_id == "ELS"
        or "educational" in scheme_name_lower
        or "education" in scheme_name_lower
        or "education" in purpose_list
    )

    criterion_status.append({
        "criterion": "education",
        "description": "Education level requirement",
        "satisfied": education_ok,
        "user_value": user_data.get("education_level") or "Not provided",
        "required": (
            "Professional/technical course"
            if is_education_scheme
            else "N/A"
        ),
        "message": (
            education_error if not education_ok
            else (
                "Satisfied."
                if is_education_scheme
                else "No education criterion for this scheme."
            )
        ),
    })

    if education_ok:
        if is_education_scheme:
            reasons.append(
                f"Education requirement is compatible with {scheme.get('name', 'the scheme')}."
            )
    else:
        failures.append(
            education_error
            or (
                "Education requirement does not satisfy "
                "the applicable conditions."
            )
        )

    # -----------------------------------------------------
    # GENDER
    # -----------------------------------------------------

    gender_status = _gender_status(
        normalized_gender,
        scheme,
    )

    is_women_target = (
        gender_status["rule_type"]
        == "women_target"
    )

    gender_ok = True
    gender_msg = "No gender restriction for this scheme."

    if is_women_target and normalized_gender != "female":
        gender_ok = False
        gender_msg = (
            "Applicant gender does not satisfy the "
            "women-focused scheme condition."
        )
    elif is_women_target and normalized_gender == "female":
        gender_msg = "Women-focused fund allocation target applies."

    criterion_status.append({
        "criterion": "gender",
        "description": "Gender requirement",
        "satisfied": gender_ok,
        "user_value": gender or "Not provided",
        "required": "Female (women-target scheme)" if is_women_target else "Any",
        "message": gender_msg,
    })

    if is_women_target and normalized_gender != "female":
        failures.append(
            gender_msg
        )
    elif is_women_target and normalized_gender == "female":
        reasons.append(
            "Women-focused fund allocation target applies."
        )

    # -----------------------------------------------------
    # FINAL RESULT
    # -----------------------------------------------------

    eligible = len(failures) == 0

    return {
        "scheme_id": scheme.get("id", "Unknown"),
        "scheme_name": scheme.get("name", "Unknown"),
        "type": scheme.get("type", "UNKNOWN"),
        "eligible": eligible,
        "reasons": reasons,
        "failures": failures,
        "criterion_status": criterion_status,
        "gender_status": gender_status,
    }


def evaluate_schemes(
    user_data: dict[str, Any],
    schemes: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    results: list[dict[str, Any]] = []

    for scheme in schemes:
        result = check_scheme_eligibility(
            user_data,
            scheme,
        )

        results.append(result)

    return results