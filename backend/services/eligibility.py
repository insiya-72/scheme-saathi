from typing import Any


def _income_is_eligible(user_income: float, scheme: dict[str, Any]) -> bool:
    income_rule = scheme["eligibility"].get("annual_family_income")

    if not income_rule:
        return True

    limit = income_rule["amount_inr"]
    operator = income_rule["operator"]

    if operator == "<=":
        return user_income <= limit

    if operator == "<":
        return user_income < limit

    if operator == ">=":
        return user_income >= limit

    if operator == ">":
        return user_income > limit

    return False


def _community_is_eligible(user_category: str, scheme: dict[str, Any]) -> bool:
    allowed = scheme["eligibility"]["community"].get("allowed", [])

    if not allowed:
        return True

    return user_category.upper() in allowed


def _project_cost_is_eligible(
    project_cost: float | None,
    scheme: dict[str, Any],
) -> tuple[bool, str | None]:
    if project_cost is None:
        return True, None

    financial_terms = scheme["financial_terms"]

    minimum_project_cost = financial_terms.get(
        "minimum_project_cost_exclusive_inr"
    )

    maximum_project_cost = financial_terms.get(
        "maximum_project_cost_inr"
    )

    if (
        minimum_project_cost is not None
        and project_cost <= minimum_project_cost
    ):
        return (
            False,
            f"Project cost must be greater than ₹{minimum_project_cost:,}.",
        )

    if (
        maximum_project_cost is not None
        and project_cost > maximum_project_cost
    ):
        return (
            False,
            f"Project cost exceeds the scheme limit of ₹{maximum_project_cost:,}.",
        )

    return True, None


def _purpose_is_eligible(
    purpose: str | None,
    scheme: dict[str, Any],
) -> bool:
    if not purpose:
        return True

    purpose = purpose.lower()

    scheme_name = scheme["name"].lower()

    if "educational" in scheme_name:
        return purpose == "education"

    if "micro finance" in scheme_name:
        return purpose in {
            "new_business",
            "business_expansion",
            "agriculture",
            "skill",
        }

    if "aajeevika" in scheme_name:
        return purpose in {
            "new_business",
            "business_expansion",
            "agriculture",
            "skill",
        }

    if "term loan" in scheme_name:
        return purpose in {
            "new_business",
            "business_expansion",
            "agriculture",
            "skill",
        }

    if "udyam nidhi" in scheme_name:
        return purpose in {
            "new_business",
            "business_expansion",
            "agriculture",
            "skill",
        }

    return True


def _education_is_eligible(
    user_data: dict[str, Any],
    scheme: dict[str, Any],
) -> tuple[bool, str | None]:
    scheme_name = scheme["name"].lower()

    if "educational" not in scheme_name:
        return True, None

    if user_data.get("purpose") != "education":
        return False, "The selected requirement is not education."

    education_level = user_data.get("education_level")

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
        normalized = education_level.lower().strip()

        if normalized not in allowed_levels:
            return (
                False,
                "The selected education level may not match the applicable course requirements.",
            )

    return True, None


def _gender_status(
    gender: str | None,
    scheme: dict[str, Any],
) -> dict[str, Any]:
    gender_rule = scheme["eligibility"].get("gender_rule", {})

    if gender_rule.get("type") == "women_target":
        return {
            "rule_type": "women_target",
            "applies": gender == "female",
            "message": (
                "Women-focused fund allocation target applies."
                if gender == "female"
                else "Scheme has a women-focused fund allocation target."
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

    category = str(
        user_data.get("category", "")
    ).upper()

    income = float(
        user_data.get("annual_income", 0)
    )

    project_cost_raw = user_data.get(
        "project_cost"
    )

    project_cost = (
        float(project_cost_raw)
        if project_cost_raw not in (None, "", 0)
        else None
    )

    purpose = user_data.get(
        "purpose"
    )

    gender = user_data.get(
        "gender"
    )

    # -----------------------------------------------------
    # COMMUNITY
    # -----------------------------------------------------

    if _community_is_eligible(
        category,
        scheme,
    ):
        reasons.append(
            "Community requirement satisfied."
        )
    else:
        failures.append(
            "Applicant does not satisfy the scheme's community requirement."
        )

    # -----------------------------------------------------
    # INCOME
    # -----------------------------------------------------

    if _income_is_eligible(
        income,
        scheme,
    ):
        reasons.append(
            "Annual family income is within the applicable scheme limit."
        )
    else:
        failures.append(
            "Annual family income exceeds the applicable scheme limit."
        )

    # -----------------------------------------------------
    # PURPOSE
    # -----------------------------------------------------

    if _purpose_is_eligible(
        purpose,
        scheme,
    ):
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

    if project_ok:
        if project_cost is not None:
            reasons.append(
                "Project cost falls within the applicable scheme range."
            )
    else:
        failures.append(
            project_error
            or "Project cost is outside the applicable scheme range."
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

    if education_ok:
        if scheme["id"] == "ELS":
            reasons.append(
                "Education requirement is compatible with ELS."
            )
    else:
        failures.append(
            education_error
            or "Education requirement does not satisfy the applicable conditions."
        )

    # -----------------------------------------------------
    # GENDER
    # -----------------------------------------------------

    gender_status = _gender_status(
        gender,
        scheme,
    )

    return {
        "scheme_id": scheme["id"],
        "scheme_name": scheme["name"],
        "type": scheme["type"],
        "eligible": len(failures) == 0,
        "reasons": reasons,
        "failures": failures,
        "gender_status": gender_status,
    }


def evaluate_schemes(
    user_data: dict[str, Any],
    schemes: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    results = []

    for scheme in schemes:
        result = check_scheme_eligibility(
            user_data,
            scheme,
        )

        results.append(result)

    return results