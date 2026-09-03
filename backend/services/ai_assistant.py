"""
Scheme Saathi AI Assistant Service.

Connects to Google Gemini 2.5 Flash via the official google-genai SDK.
Uses verified backend context: user profile, scheme data, rule-engine output,
deterministic EMI output, deterministic partner locator output.

AI is responsible for: ranking, explaining, translating, guiding.
AI is NOT responsible for: eligibility, EMI calculation, partner matching.
"""

import os
import json
import logging
import asyncio
import warnings
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

warnings.filterwarnings("ignore", message=".*automatic function calling.*")

from services.languages import (
    get_language_info,
    is_supported_language,
    get_language_name,
)

logger = logging.getLogger(__name__)


def get_gemini_api_key() -> str:
    """Retrieve GEMINI_API_KEY dynamically from the environment, checking .env if needed."""
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        here = Path(__file__).resolve()
        possible_envs = [
            here.parent.parent / ".env",          # backend/.env
            here.parent.parent.parent / ".env",   # root .env
            Path.cwd() / ".env",
        ]
        for env_path in possible_envs:
            if env_path.exists():
                load_dotenv(env_path, override=True)
                key = os.environ.get("GEMINI_API_KEY", "").strip()
                if key:
                    break
    return key

VALID_GEMINI_MODELS = {
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
}
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


def get_validated_gemini_model() -> str:
    """Validate configured GEMINI_MODEL and return a supported model name."""
    raw = os.environ.get("GEMINI_MODEL", "").strip()
    if not raw:
        return DEFAULT_GEMINI_MODEL
    if raw in VALID_GEMINI_MODELS:
        return raw
    if raw.startswith("gemini-") and not raw.startswith("gemini-3."):
        return raw
    logger.warning(
        "Configured GEMINI_MODEL '%s' is not recognized or valid. Defaulting to '%s'.",
        raw,
        DEFAULT_GEMINI_MODEL,
    )
    return DEFAULT_GEMINI_MODEL


GEMINI_MODEL = get_validated_gemini_model()


SYSTEM_PROMPT = """You are Scheme Saathi AI Assistant. You help marginalized entrepreneurs, especially eligible Scheduled Caste applicants, understand government concessional financial schemes.

STRICT DOMAIN:
- You are NOT a general-purpose chatbot.
- Stay ONLY within Scheme Saathi and supported government-scheme assistance.
- For unrelated topics (entertainment, movies, jokes, general coding, unrelated politics/news/weather, general knowledge), politely state you are designed specifically for Scheme Saathi and government-scheme assistance.

GREETING RULES (CRITICAL):
- The welcome greeting (e.g. "Hi! How can I help you today?") is shown ONLY once at the very start of a new conversation by the frontend.
- You must NEVER repeat or generate a greeting yourself. After the initial greeting, respond directly to the user's message.
- Do NOT start your response with greetings like "Hello!", "Namaste!", "Hi there!" unless the user explicitly greeted you first.
- Jump straight to answering the user's question or guiding them.

CONVERSATION FLOW:
- After the initial greeting, respond directly to what the user says.
- Be natural, polite, and contextually relevant.
- Use the user's selected language throughout the conversation.
- The AI is a guidance and explanation layer over Scheme Saathi's existing deterministic systems.

NAVIGATION AND USER FLOW:
- When a user asks which schemes they are eligible for, or asks about schemes in general, guide them to the appropriate action.
- If scheme context is NOT provided (no eligible/ineligible schemes in the context), the user has NOT run the scheme finder yet. Suggest they use "Find My Schemes" to check eligibility.
- If scheme context IS provided with eligible schemes, explain the results and rank them.
- If scheme context IS provided with only ineligible schemes, explain why no schemes matched and suggest they explore other options.
- You may suggest "Explore Schemes" for browsing all available schemes without eligibility checking.
- You may suggest "Find My Schemes" for personalized eligibility checking.
- If the user asks about a scheme that is NOT in their previous checked history but IS available in Scheme Saathi, explain it using verified data and include navigation: {"navigation": {"explore": true}} to let them browse all schemes.
- Do NOT claim the user is eligible or ineligible without rule-engine data in the context.

APPLICATION GUIDANCE (CRITICAL):
- When the user wants to apply for a scheme, provide the application guidance available from the backend.
- Explain the relevant application process, required steps, and official links.
- Scheme rates, limits, application steps and document requirements must come from verified backend/scheme data.
- If information is unavailable or unverified, explicitly state that it is unavailable/unverified instead of generating an answer.
- Guide the user to the Document Center for uploading required documents.
- Application Tracking is admin/owner-only and is NOT available through this AI assistant. Do not provide tracking status or tracking navigation to users.

DOCUMENT MANAGEMENT (CRITICAL):
- When the user asks about documents, use the DOCUMENT STATUS data supplied in context from the backend.
- Guide the user about required, uploaded, pending or missing documents based ONLY on backend data.
- Do NOT invent document requirements.
- Tell users they can upload documents through the Document Center.
- Document verification is handled by the App Owner/Admin — the AI does not verify documents.
- If document status is not available (user not logged in), suggest they sign in to check their document status.

AUTHENTICATED VS UNAUTHENTICATED:
- If USER PROFILE is provided in context, the user is authenticated. Use their profile data for personalized responses.
- If USER PROFILE is NOT provided, the user may not be logged in. Do not assume they have an account.
- For unauthenticated users asking about eligibility, suggest they sign in for personalized matching.
- Never guess whether the user has an account.

ELIGIBILITY RULES (CRITICAL):
- Eligibility comes ONLY from the deterministic rule engine. You must NEVER override it.
- Never recommend an ineligible scheme.
- Never declare an ineligible user eligible.
- Never ignore gender, category, income, purpose, project-cost, or education rules.
- Never invent exceptions or workarounds.
- Never infer eligibility from language or AI reasoning alone.
- If no eligibility data is in the context, say you cannot determine eligibility without running the scheme finder.

SCHEME RANKING (CRITICAL — READ CAREFULLY):
When eligible schemes are provided in context, you MUST rank them based on the USER'S PERSONAL PROFILE AND REQUIREMENTS. Do NOT use the order they appear in the list.

For EACH eligible scheme, compare the user's actual profile with verified scheme attributes:
- purpose match (does the scheme's purpose align with what the user needs?)
- project cost fit (does the user's project cost fall within the scheme's range?)
- required loan vs verified loan limit (is the loan amount suitable?)
- verified interest rate (lower is better for the user)
- scheme benefits and target structure
- education/business relevance to the user
- age, gender, category, income alignment

Rank from BEST FIT to LEAST FIT for THIS SPECIFIC USER.

AI Suitability Score: Rate each scheme 1-100 based on how well it fits this user's personal situation. This is NOT an eligibility score. Eligibility is binary (pass/fail from rule engine). Suitability measures how good a match the scheme is for this user's needs.

OUTPUT YOUR RANKING as a JSON block at the very end of your response, wrapped in <!--RANKING_START--> and <!--RANKING_END--> markers. Use this exact format:

<!--RANKING_START-->
{"ranking": [{"scheme_id": "SCHEME_ID_HERE", "score": 85, "reason": "Brief reason for this score in the user's language"}]}
<!--RANKING_END-->

Rules for the ranking JSON:
- scheme_id MUST match exactly one of the eligible scheme IDs provided in the context
- score is an integer 1-100 (higher = better fit for this user)
- reason is a short explanation (1-2 sentences) in the user's language
- List schemes from BEST FIT (highest score) to LEAST FIT (lowest score)
- Include ALL eligible schemes in the ranking
- The JSON must be valid and parseable
- Do NOT include any text inside the RANKING markers except the JSON

INELIGIBLE SCHEME EXPLANATIONS:
- If the user asks why they are not eligible for a specific scheme, explain ONLY the exact rule-engine failure reasons supplied to you.
- Show the scheme's verified eligibility criteria.
- Clearly state which criteria the user satisfies and which criteria the user fails.
- Use this exact format when explaining ineligibility:

Scheme eligibility:
✓ Category requirement (satisfied/failed)
✓ Income requirement (satisfied/failed)
✓ Project-cost requirement (satisfied/failed)

Your profile:
✓ Category: [value] (satisfied/failed)
✓ Income: [value] (satisfied/failed)
✓ Project cost: [value] (satisfied/failed)

Why it was not recommended:
[exact rule-engine failure reason]

- Never reinterpret the rule or invent a workaround.
- Never say "Try this anyway, you may still qualify."

OUT-OF-SCOPE SCHEMES:
- If no suitable Scheme Saathi-supported scheme exists but a verified eligible out-of-scope scheme exists, show ONLY: official scheme name + verified official website.
- Clearly label: "Outside Scheme Saathi Scope"
- Do NOT show: score, benefits, documents, steps, EMI, partner info for out-of-scope schemes.
- Never invent an out-of-scope scheme or URL.

FINANCIAL CALCULATOR:
- You must NEVER calculate EMI, interest, or repayment yourself.
- Only explain deterministic calculator output supplied to you.
- If calculator output is unavailable, say "The EMI calculation is temporarily unavailable. Please use the Financial Calculator."

CHANNEL PARTNER:
- You must NEVER invent Channel Partners, locations, distances, or health status.
- Only explain deterministic locator output supplied to you.
- If no verified partner is found, say "No verified eligible Channel Partner was found in the available Scheme Saathi data for your location and requirement."

OFFICIAL INFORMATION:
- NEVER hallucinate or invent government websites, scheme URLs, application portal URLs, ministry links, contact numbers, email addresses, or partner websites.
- URLs may be shown ONLY from trusted verified scheme/partner metadata supplied to you.
- If no verified URL exists, say "Official website link is not verified in the available Scheme Saathi data."
- Never guess URLs.

MULTILINGUAL:
- Respond in the user's preferred or detected language.
- Preserve exact financial figures (rupee amounts, percentages, EMI values).
- Preserve official scheme names in their verified form.
- Preserve official URLs exactly.
- Do not translate or alter numbers, rates, limits, or URLs.
- Support Hinglish and mixed Indian-language + English input naturally.
- Language MUST NEVER affect eligibility, scheme ranking, EMI, or partner matching.
- Do NOT infer location from language.

DATA HIERARCHY:
1. Verified project/database scheme data
2. Deterministic rule-engine output
3. Deterministic calculator output
4. Deterministic partner-locator output
5. Document status from backend database
6. Other explicitly approved verified sources

Never use unsupported model knowledge as verified Scheme Saathi data.
When information is unavailable, say so clearly.

RESPONSE FORMAT:
- Be clear, polite, and practical.
- Use structured information where helpful.
- Distinguish between verified facts and AI analysis.
- Always include the disclaimer about rule-engine authority."""


def _build_user_context(
    user_profile: dict[str, Any] | None,
    eligible_schemes: list[dict[str, Any]] | None,
    ineligible_schemes: list[dict[str, Any]] | None,
    emi_output: dict[str, Any] | None,
    partner_output: dict[str, Any] | None,
    ineligibility_query: dict[str, Any] | None,
    out_of_scope_schemes: list[dict[str, Any]] | None = None,
    document_status: dict[str, Any] | None = None,
) -> str:
    """Build the user context block for the LLM prompt."""
    parts = []

    if user_profile:
        parts.append("USER PROFILE:")
        profile_fields = {
            "name": user_profile.get("name"),
            "age": user_profile.get("age"),
            "gender": user_profile.get("gender"),
            "category": user_profile.get("category"),
            "state": user_profile.get("state"),
            "district": user_profile.get("district"),
            "annual_income": user_profile.get("annual_income"),
            "purpose": user_profile.get("purpose"),
            "business_type": user_profile.get("business_type"),
            "project_cost": user_profile.get("project_cost"),
            "required_loan": user_profile.get("required_loan"),
            "education_level": user_profile.get("education_level"),
            "course": user_profile.get("course"),
            "institution": user_profile.get("institution"),
        }
        for key, value in profile_fields.items():
            if value is not None and value != "":
                parts.append(f"- {key}: {value}")
        parts.append("")

    if eligible_schemes:
        parts.append("ELIGIBLE SCHEMES (from rule engine):")
        for scheme in eligible_schemes:
            parts.append(f"- {scheme.get('scheme_name', scheme.get('name', 'Unknown'))} (ID: {scheme.get('scheme_id', scheme.get('id', 'Unknown'))})")
            if scheme.get("type"):
                parts.append(f"  Type: {scheme['type']}")
            if scheme.get("reasons"):
                for reason in scheme["reasons"]:
                    parts.append(f"  Reason: {reason}")
            financial = scheme.get("financial_terms") or scheme.get("financial_terms_raw")
            if financial:
                parts.append(f"  Financial terms: {json.dumps(financial, default=str)}")
            source = scheme.get("source")
            if source:
                parts.append(f"  Source: {json.dumps(source, default=str)}")
            channel = scheme.get("channel_requirements")
            if channel:
                parts.append(f"  Channel requirements: {json.dumps(channel, default=str)}")
            docs = scheme.get("required_documents")
            if docs:
                parts.append(f"  Required documents: {json.dumps(docs, default=str)}")
            if scheme.get("application_steps"):
                parts.append(f"  Application steps: {json.dumps(scheme['application_steps'], default=str)}")
            if scheme.get("official_url"):
                parts.append(f"  Official URL: {scheme['official_url']}")
            if scheme.get("application_process_verified") is not None:
                parts.append(f"  Application process verified: {scheme['application_process_verified']}")
            if scheme.get("channel_partner_fallback_needed"):
                parts.append("  NOTE: Complete application process is NOT verified. If user asks how to apply, recommend the Channel Partner Locator and use deterministic partner data.")
        parts.append("")

    if ineligible_schemes:
        parts.append("INELIGIBLE SCHEMES (from rule engine):")
        for scheme in ineligible_schemes:
            parts.append(f"- {scheme.get('scheme_name', scheme.get('name', 'Unknown'))} (ID: {scheme.get('scheme_id', scheme.get('id', 'Unknown'))})")
            if scheme.get("type"):
                parts.append(f"  Type: {scheme['type']}")
            if scheme.get("failures"):
                for failure in scheme["failures"]:
                    parts.append(f"  Failure reason: {failure}")
            criterion_status = scheme.get("criterion_status")
            if criterion_status:
                parts.append("  Criterion-level status:")
                for c in criterion_status:
                    status_marker = "✓" if c.get("satisfied") else "✗"
                    parts.append(
                        f"    {status_marker} {c.get('criterion', 'unknown')}: "
                        f"{c.get('user_value', 'N/A')} "
                        f"(required: {c.get('required', 'N/A')}) — "
                        f"{c.get('message', '')}"
                    )
            financial = scheme.get("financial_terms") or scheme.get("financial_terms_raw")
            if financial:
                parts.append(f"  Financial terms: {json.dumps(financial, default=str)}")
            eligibility = scheme.get("eligibility") or scheme.get("eligibility_criteria")
            if eligibility:
                parts.append(f"  Eligibility criteria: {json.dumps(eligibility, default=str)}")
        parts.append("")

    if out_of_scope_schemes:
        parts.append("OUT-OF-SCOPE SCHEMES (verified but outside Scheme Saathi):")
        for scheme in out_of_scope_schemes:
            parts.append(f"- {scheme.get('name', 'Unknown')}")
            if scheme.get("official_url"):
                parts.append(f"  Official URL: {scheme['official_url']}")
            if scheme.get("reason"):
                parts.append(f"  Reason: {scheme['reason']}")
        parts.append("")

    if ineligibility_query:
        parts.append("USER INELIGIBILITY QUESTION:")
        parts.append(f"- Scheme: {ineligibility_query.get('scheme_name', 'Unknown')}")
        parts.append(f"- Scheme ID: {ineligibility_query.get('scheme_id', 'Unknown')}")
        failure_reasons = ineligibility_query.get("failure_reasons", [])
        if failure_reasons:
            parts.append("- Rule engine failure reasons:")
            for reason in failure_reasons:
                parts.append(f"  * {reason}")
        parts.append("")

    if emi_output:
        parts.append("DETERMINISTIC EMI CALCULATOR OUTPUT:")
        parts.append(f"- Scheme: {emi_output.get('scheme_name', 'N/A')}")
        parts.append(f"- Principal: ₹{emi_output.get('principal', 'N/A')}")
        parts.append(f"- Interest rate: {emi_output.get('interest_rate', 'N/A')}% p.a.")
        parts.append(f"- Tenure: {emi_output.get('tenure_months', 'N/A')} months")
        parts.append(f"- Monthly EMI: ₹{emi_output.get('monthly_emi', 'N/A')}")
        parts.append(f"- Total interest: ₹{emi_output.get('total_interest', 'N/A')}")
        parts.append(f"- Total repayment: ₹{emi_output.get('total_repayment', 'N/A')}")
        if emi_output.get("moratorium_months"):
            parts.append(f"- Moratorium: {emi_output['moratorium_months']} months")
        if emi_output.get("moratorium_treatment"):
            parts.append(f"- Moratorium treatment: {emi_output['moratorium_treatment']}")
        parts.append("")

    if partner_output:
        parts.append("DETERMINISTIC CHANNEL PARTNER LOCATOR OUTPUT:")
        partners = partner_output.get("partners", [])
        if partners:
            for i, partner in enumerate(partners[:5], 1):
                parts.append(f"  Partner {i}:")
                parts.append(f"    Name: {partner.get('name', 'N/A')}")
                parts.append(f"    Type: {partner.get('type', 'N/A')}")
                parts.append(f"    Distance: {partner.get('distance_km', 'N/A')} km")
                parts.append(f"    Supported categories: {partner.get('supported_loan_categories', [])}")
                parts.append(f"    Max loan handled: ₹{partner.get('max_loan_amount_handled', 'N/A')}")
                if partner.get("address"):
                    parts.append(f"    Address: {partner['address']}")
                if partner.get("contact"):
                    parts.append(f"    Contact: {partner['contact']}")
                if partner.get("website") or partner.get("official_url"):
                    parts.append(f"    Website: {partner.get('website') or partner.get('official_url')}")
        else:
            parts.append("  No verified eligible Channel Partners found.")
        parts.append("")

    if document_status:
        parts.append("DOCUMENT STATUS (from backend):")
        parts.append(f"- Completion: {document_status.get('completion_percentage', 0)}%")
        parts.append(f"- Mandatory uploaded: {document_status.get('mandatory_uploaded', 0)}/{document_status.get('mandatory_total', 0)}")
        missing = document_status.get("missing_mandatory", [])
        if missing:
            parts.append(f"- Missing mandatory documents: {', '.join(missing)}")
        uploaded = document_status.get("uploaded", [])
        if uploaded:
            parts.append("- Uploaded documents:")
            for doc in uploaded:
                status = doc.get("verification_status", "pending")
                parts.append(f"  * {doc.get('document_name', doc.get('document_type', 'Unknown'))} — Status: {status}")
        all_reqs = document_status.get("all_requirements", [])
        if all_reqs:
            parts.append("- All required documents:")
            for req in all_reqs:
                upload_status = "uploaded" if req.get("uploaded") else "NOT uploaded"
                mandatory_tag = " (mandatory)" if req.get("mandatory") else " (optional)"
                parts.append(f"  * {req.get('name', 'Unknown')}{mandatory_tag} — {upload_status}")
        parts.append("")

    full_context = "\n".join(parts)
    max_chars = 12000
    if len(full_context) > max_chars:
        full_context = full_context[:max_chars] + "\n...[Context truncated to maintain safe prompt size]"

    return full_context


def _detect_language_from_text(text: str) -> str:
    """Simple heuristic to detect if text contains specific language scripts.

    For scripts not covered, returns 'und' (undefined) instead of defaulting
    to English, so that the caller can keep the user's explicit language
    selection rather than silently switching to English.
    """
    text_lower = text.lower()

    devanagari_range = any("\u0900" <= ch <= "\u097f" for ch in text)
    bengali_range = any("\u0980" <= ch <= "\u09ff" for ch in text)
    tamil_range = any("\u0b80" <= ch <= "\u0bff" for ch in text)
    telugu_range = any("\u0c00" <= ch <= "\u0c7f" for ch in text)
    kannada_range = any("\u0c80" <= ch <= "\u0cff" for ch in text)
    malayalam_range = any("\u0d00" <= ch <= "\u0d7f" for ch in text)
    gujarati_range = any("\u0a80" <= ch <= "\u0aff" for ch in text)
    gurmukhi_range = any("\u0a00" <= ch <= "\u0a7f" for ch in text)
    odia_range = any("\u0b00" <= ch <= "\u0b7f" for ch in text)
    ol_chiki_range = any("\u1c50" <= ch <= "\u1c7f" for ch in text)  # Santali
    meitei_range = any("\uabc0" <= ch <= "\uabff" for ch in text)    # Manipuri (Meitei Mayek)

    hinglish_indicators = [
        "kya", "hai", "ka", "ki", "ke", "ko", "mein", "se", "ko",
        "yaar", "bhai", "bahut", "accha", "theek", "chahiye",
        "hoon", "hain", "tha", "thi", "hoga", "karna", "karo",
        "mujhe", "mera", "meri", "hamara", "unka", "uska",
        "kaunsi", "konsa", "kitna", "kab", "kaise", "kyun",
    ]

    hindi_words = [
        "aur", "yeh", "woh", "yahan", "wahan", "abhi", "phir",
        "lekin", "agar", "toh", "kyunki", "jaise", "sirf", "bhi",
    ]

    marathi_words = [
        "आहे", "आहेत", "होता", "होते", "होतो", "करा", "करत", "केले",
        "तुम्ही", "तुम्हाला", "मी", "माझे", "माझ्या", "तुमचे", "तुमच्या",
        "येथे", "तेथे", "कुठे", "कसे", "काय", "का", "पण", "म्हणून",
    ]

    nepali_words = [
        "छ", "छन्", "हो", "होइन", "गर्नु", "गरेको", "भएको", "हुन्छ",
        "तपाईं", "तिमी", "म", "मेरो", "तिम्रो", "तपाईंको", "हाम्रो",
        "यहाँ", "त्यहाँ", "कहाँ", "कसरी", "किन", "र", "तर", "पनि",
    ]

    sanskrit_words = [
        "अस्ति", "सन्ति", "करोति", "कुर्वन्ति", "भवति", "भवन्ति",
        "त्वम्", "भवान्", "अहम्", "मम", "तव", "भवतः", "अस्माकम्",
        "अत्र", "तत्र", "कुत्र", "कथम्", "किम्", "च", "तत्", "पि",
    ]

    if devanagari_range:
        # Check for Marathi-specific words first
        if any(w in text for w in marathi_words):
            return "mr"
        # Check for Nepali-specific words
        if any(w in text for w in nepali_words):
            return "ne"
        # Check for Sanskrit-specific words
        if any(w in text for w in sanskrit_words):
            return "sa"
        # Check for Hindi/Hinglish indicators
        if any(w in text_lower for w in ["ka", "ki", "ke", "hai", "kya", "mein"]):
            return "hi"
        if any(w in text_lower for w in ["raha", "ne", "ko", "se", "par"]):
            return "hi"
        # Default to Hindi for Devanagari if no specific language detected
        return "hi"

    if bengali_range:
        return "bn"
    if tamil_range:
        return "ta"
    if telugu_range:
        return "te"
    if kannada_range:
        return "kn"
    if malayalam_range:
        return "ml"
    if gujarati_range:
        return "gu"
    if gurmukhi_range:
        return "pa"
    if odia_range:
        return "or"
    if ol_chiki_range:
        return "sat"
    if meitei_range:
        return "mni"

    hinglish_score = sum(1 for w in hinglish_indicators if w in text_lower)
    hindi_score = sum(1 for w in hindi_words if w in text_lower)

    if hinglish_score >= 2 or hindi_score >= 2:
        return "hi"

    # For Latin-only text that doesn't match any non-English indicators,
    # return 'und' (undefined) so the caller keeps the explicit language
    # selection instead of assuming English.
    return "und"


def _is_transient_error(error: Exception) -> bool:
    """Check if an exception represents a transient failure eligible for retry."""
    err_str = str(error).lower()
    transient_indicators = [
        "503", "502", "504", "500", "429",
        "service unavailable", "resource_exhausted", "quota",
        "rate limit", "temporarily unavailable", "deadline_exceeded",
        "timeout", "timed out", "connection reset", "connection refused",
        "broken pipe", "network error", "try again",
    ]
    return any(indicator in err_str for indicator in transient_indicators)


def _detect_language(message: str, user_language: str | None) -> tuple[str, bool]:
    """Detect the language of the user message.

    Returns (language_code, is_detected).
    Priority: explicit > detected from text.
    If the detected language is 'und' (undefined), keep the user's
    explicit selection; never force English.
    """
    if user_language:
        normalized_lang = user_language.lower().strip()
        if is_supported_language(normalized_lang):
            return normalized_lang, False

    detected = _detect_language_from_text(message)

    # 'und' means the script was not recognised; keep the user's
    # explicit language selection rather than defaulting to English.
    if detected == "und":
        if user_language:
            normalized_lang = user_language.lower().strip()
            if is_supported_language(normalized_lang):
                return normalized_lang, False
        return "en", True

    return detected, True


async def _call_gemini(
    system_prompt: str,
    user_message: str,
    context: str,
) -> str | None:
    """Call Google Gemini and return the response text.

    Uses the proper ``system_instruction`` config parameter so that the
    system prompt is treated as a system-level instruction by the model
    rather than appearing as a user message.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        logger.error("GEMINI_API_KEY environment variable is not set")
        return None

    full_user_content = (
        f"{context}\n\n"
        f"USER MESSAGE:\n{user_message}\n\n"
        f"RESPOND IN THE USER'S LANGUAGE. Be clear, polite, and practical."
    )

    max_retries = 2
    retry_delay = 0.5

    for attempt in range(max_retries):
        try:
            client = genai.Client(api_key=api_key)

            response = client.models.generate_content(
                model=get_validated_gemini_model(),
                contents=types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=full_user_content)],
                ),
                config=types.GenerateContentConfig(
                    system_instruction=types.Content(
                        parts=[types.Part.from_text(text=system_prompt)],
                    ),
                    temperature=0.3,
                    top_p=0.9,
                    max_output_tokens=2048,
                ),
            )

            if response.text:
                return response.text

            logger.warning("Gemini returned empty response")
            return None

        except Exception as e:
            error_str = str(e)
            if attempt < max_retries - 1 and _is_transient_error(e):
                logger.warning(
                    "Gemini API transient failure (attempt %d/%d): %s. Retrying in %.2fs...",
                    attempt + 1,
                    max_retries,
                    error_str,
                )
                await asyncio.sleep(retry_delay)
                retry_delay *= 2
                continue
            logger.error("Gemini call failed: %s", error_str)
            return None

    return None


def _build_disclaimer() -> str:
    return (
        "Eligibility is determined by Scheme Saathi's rule engine. "
        "EMI figures are computed by the deterministic calculator. "
        "Channel Partner matches are based on available verified partner data. "
        "Final approval is decided by the concerned authority/lending institution."
    )


def _parse_ai_ranking(
    reply: str,
    eligible_schemes: list[dict[str, Any]] | None,
) -> list[dict[str, Any]] | None:
    """Parse the AI's structured ranking from the response text.

    Looks for <!--RANKING_START-->...<!--RANKING_END--> JSON block.
    Validates that all scheme IDs exist in the eligible schemes list.
    Validates that scores are numeric 0-100.
    Returns None if parsing fails or validation fails.
    """
    if not reply or not eligible_schemes:
        return None

    # Extract the ranking block between markers
    start_marker = "<!--RANKING_START-->"
    end_marker = "<!--RANKING_END-->"

    start_idx = reply.find(start_marker)
    end_idx = reply.find(end_marker)

    if start_idx == -1 or end_idx == -1 or end_idx <= start_idx:
        logger.info("No ranking block found in AI response")
        return None

    ranking_text = reply[start_idx + len(start_marker):end_idx].strip()

    if not ranking_text:
        return None

    # Parse JSON
    try:
        ranking_data = json.loads(ranking_text)
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse ranking JSON: %s", str(e))
        return None

    ranking_list = ranking_data.get("ranking")
    if not isinstance(ranking_list, list) or len(ranking_list) == 0:
        logger.warning("Ranking JSON missing 'ranking' array or empty")
        return None

    # Build set of valid eligible scheme IDs
    valid_ids = set()
    scheme_lookup = {}
    for scheme in eligible_schemes:
        sid = scheme.get("scheme_id") or scheme.get("id", "")
        if sid:
            valid_ids.add(sid)
            scheme_lookup[sid] = scheme

    # Build verified URL set from backend scheme data
    verified_urls: set[str] = set()
    for scheme in eligible_schemes:
        source = scheme.get("source") or {}
        if source.get("official_url"):
            verified_urls.add(source["official_url"].rstrip("/"))
        if source.get("policy_registry_url"):
            verified_urls.add(source["policy_registry_url"].rstrip("/"))

    # Validate and build result
    validated = []
    seen_ids = set()

    for entry in ranking_list:
        if not isinstance(entry, dict):
            continue

        scheme_id = entry.get("scheme_id", "")
        score = entry.get("score")
        reason = entry.get("reason", "")
        official_url = entry.get("official_url")

        # Validate scheme_id
        if not scheme_id or scheme_id not in valid_ids:
            logger.warning("AI ranked unknown scheme_id: %s", scheme_id)
            continue

        # Prevent duplicates
        if scheme_id in seen_ids:
            continue
        seen_ids.add(scheme_id)

        # Validate score — must be numeric 1-100; do not fake a 50 score
        validated_score: int | None = None
        if isinstance(score, (int, float)) and 1 <= score <= 100:
            validated_score = int(score)
        else:
            logger.warning(
                "Invalid score %s for scheme %s; recording without misleading default score",
                score, scheme_id,
            )

        # Validate URL — strip if not from verified backend data
        if official_url:
            if official_url.rstrip("/") not in verified_urls:
                logger.warning(
                    "AI provided unverified URL for scheme %s: %s — stripping",
                    scheme_id, official_url,
                )
                official_url = None

        scheme = scheme_lookup[scheme_id]

        validated.append({
            "scheme_id": scheme_id,
            "scheme_name": scheme.get("scheme_name") or scheme.get("name", ""),
            "score": validated_score,
            "reason": reason if isinstance(reason, str) else "",
            "official_url": official_url,
        })

    if not validated:
        logger.warning("No valid entries in AI ranking")
        return None

    # Sort by score descending (highest = best fit, None at end)
    validated.sort(
        key=lambda x: (x["score"] is not None, x["score"] if x["score"] is not None else -1),
        reverse=True,
    )

    return validated


def _strip_ranking_markers(reply: str) -> str:
    """Remove the <!--RANKING_START-->...<!--RANKING_END--> block from the reply text."""
    start_marker = "<!--RANKING_START-->"
    end_marker = "<!--RANKING_END-->"

    start_idx = reply.find(start_marker)
    end_idx = reply.find(end_marker)

    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        # Remove the block and any surrounding whitespace
        cleaned = reply[:start_idx].rstrip() + reply[end_idx + len(end_marker):]
        return cleaned.strip()

    return reply


def _extract_structured_data(
    reply: str,
    eligible_schemes: list[dict[str, Any]] | None,
    emi_output: dict[str, Any] | None,
    partner_output: dict[str, Any] | None,
    ineligibility_query: dict[str, Any] | None,
    out_of_scope_schemes: list[dict[str, Any]] | None = None,
    user_asked_partner: bool = False,
    document_status: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Extract structured response fields, using AI ranking when available.

    Attempts to parse AI-generated ranking from the reply.
    Falls back to rule-engine order if parsing fails.
    Validates scheme IDs, scores, and URLs against backend data.
    """
    result: dict[str, Any] = {
        "disclaimer": _build_disclaimer() if (eligible_schemes or emi_output) else "",
    }

    if eligible_schemes and len(eligible_schemes) > 0:
        # Try to parse AI ranking
        ai_ranking = _parse_ai_ranking(reply, eligible_schemes)

        if ai_ranking and len(ai_ranking) > 0:
            # AI ranking succeeded — use it
            best = ai_ranking[0]
            result["primary_recommendation"] = {
                "scheme_id": best["scheme_id"],
                "scheme_name": best["scheme_name"],
                "rank": 1,
                "score": best["score"],
                "reasons": [best["reason"]] if best["reason"] else [],
                "official_url": best.get("official_url"),
            }

            if len(ai_ranking) > 1:
                others = []
                for i, entry in enumerate(ai_ranking[1:], 2):
                    others.append({
                        "scheme_id": entry["scheme_id"],
                        "scheme_name": entry["scheme_name"],
                        "rank": i,
                        "score": entry["score"],
                        "reasons": [entry["reason"]] if entry["reason"] else [],
                        "official_url": entry.get("official_url"),
                    })
                result["other_eligible_schemes"] = others

            logger.info("Using AI ranking with %d schemes", len(ai_ranking))
        else:
            # Fallback: use rule-engine order
            top = eligible_schemes[0]
            top_source = top.get("source") or {}
            result["primary_recommendation"] = {
                "scheme_id": top.get("scheme_id", top.get("id", "")),
                "scheme_name": top.get("scheme_name", top.get("name", "")),
                "rank": 1,
                "score": None,
                "reasons": top.get("reasons", []),
                "official_url": top_source.get("official_url"),
            }

            if len(eligible_schemes) > 1:
                others = []
                for i, scheme in enumerate(eligible_schemes[1:], 2):
                    scheme_source = scheme.get("source") or {}
                    others.append({
                        "scheme_id": scheme.get("scheme_id", scheme.get("id", "")),
                        "scheme_name": scheme.get("scheme_name", scheme.get("name", "")),
                        "rank": i,
                        "score": None,
                        "reasons": scheme.get("reasons", []),
                        "official_url": scheme_source.get("official_url"),
                    })
                result["other_eligible_schemes"] = others

            logger.info("AI ranking unavailable, using rule-engine order")

    if emi_output:
        result["emi_projection"] = emi_output

    if partner_output and user_asked_partner:
        result["matched_channel_partners"] = partner_output.get("partners", [])

    if ineligibility_query:
        result["ineligibility_explanations"] = [{
            "scheme_id": ineligibility_query.get("scheme_id", ""),
            "scheme_name": ineligibility_query.get("scheme_name", ""),
            "failure_reasons": ineligibility_query.get("failure_reasons", []),
            "criterion_status": ineligibility_query.get("criterion_status", []),
        }]

    if out_of_scope_schemes:
        result["out_of_scope_schemes"] = [
            {
                "name": s.get("name", "Unknown"),
                "official_url": s.get("official_url"),
                "reason": s.get("reason", ""),
            }
            for s in out_of_scope_schemes
        ]

    # Build application guidance from eligible schemes
    if eligible_schemes:
        guidance_items = []
        for scheme in eligible_schemes:
            sid = scheme.get("scheme_id") or scheme.get("id", "")
            scheme_name = scheme.get("scheme_name") or scheme.get("name", "")
            app_verified = scheme.get("application_process_verified", False)
            app_steps = scheme.get("application_steps")
            official_url = scheme.get("official_url")
            channel_req = scheme.get("channel_requirements")
            needs_partner = scheme.get("channel_partner_fallback_needed", False)

            if app_verified and app_steps:
                guidance_items.append({
                    "scheme_id": sid,
                    "scheme_name": scheme_name,
                    "status": "verified",
                    "application_steps": app_steps,
                    "official_url": official_url,
                })
            elif needs_partner:
                guidance_items.append({
                    "scheme_id": sid,
                    "scheme_name": scheme_name,
                    "status": "channel_partner_needed",
                    "message": "Complete application process is not verified. Channel Partner assistance is recommended.",
                    "official_url": official_url,
                    "channel_requirements": channel_req,
                })
            elif official_url:
                guidance_items.append({
                    "scheme_id": sid,
                    "scheme_name": scheme_name,
                    "status": "partial",
                    "official_url": official_url,
                    "message": "Limited application information available. Please check the official website.",
                })

        if guidance_items:
            result["application_guidance"] = guidance_items

    if document_status:
        result["document_status"] = document_status

    return result


OUT_OF_SCOPE_NATIONAL_SCHEMES = [
    {
        "name": "Pradhan Mantri MUDRA Yojana (PMMY)",
        "official_url": "https://www.mudra.org.in",
        "reason": "National collateral-free loan up to ₹10–20 Lakh open to General category and all citizens.",
        "scheme_id": "PMMY",
    },
    {
        "name": "Prime Minister Employment Generation Programme (PMEGP)",
        "official_url": "https://www.kviconline.gov.in/pmegpeportal",
        "reason": "Credit-linked capital subsidy for setting up new micro-enterprises across all categories.",
        "scheme_id": "PMEGP",
    },
    {
        "name": "PM SVANidhi (Street Vendor AtmaNirbhar Nidhi)",
        "official_url": "https://pmsvanidhi.mohua.gov.in",
        "reason": "Collateral-free working capital loan for small traders and vendors across all categories.",
        "scheme_id": "PMSVANIDHI",
    },
    {
        "name": "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
        "official_url": "https://www.cgtmse.in",
        "reason": "Collateral-free business credit facility through commercial banks for all categories.",
        "scheme_id": "CGTMSE",
    },
    {
        "name": "Stand-Up India Scheme",
        "official_url": "https://www.standupmitra.in",
        "reason": "Bank loans between ₹10 Lakh and ₹1 Crore for women entrepreneurs of any category.",
        "scheme_id": "STANDUPINDIA",
    },
]


def _detect_navigation_from_intent(message: str, reply: str) -> dict[str, bool] | None:
    msg_lower = (message or "").lower().strip()
    reply_lower = (reply or "").lower().strip()
    combined = f"{msg_lower} {reply_lower}"

    nav: dict[str, bool] = {}
    if (
        "eligibility criteria are mentioned in this section" in combined
        or "पात्रता मानदंड इस अनुभाग में" in combined
        or "explore schemes" in combined
        or "explore" in msg_lower
        or "योजनाएं देखें" in combined
    ):
        nav["explore"] = True

    if (
        "locating channel partners" in combined
        or "partner locator" in combined
        or "चैनल पार्टनर खोजने" in combined
        or "nearby partner" in msg_lower
        or "channel partner" in msg_lower
    ):
        nav["partner"] = True

    if (
        "find my schemes" in combined
        or "पात्रता जांचें" in combined
        or "new business" in msg_lower
        or "start business" in msg_lower
    ):
        nav["finder"] = True

    return nav or None


def _build_intelligent_assistant_reply(
    message: str,
    language: str,
    user_profile: dict[str, Any] | None = None,
    eligible_schemes: list[dict[str, Any]] | None = None,
    ineligible_schemes: list[dict[str, Any]] | None = None,
    emi_output: dict[str, Any] | None = None,
    partner_output: dict[str, Any] | None = None,
    ineligibility_query: dict[str, Any] | None = None,
    out_of_scope_schemes: list[dict[str, Any]] | None = None,
) -> tuple[str, dict[str, bool] | None, list[dict[str, Any]] | None]:
    """Generate an intelligent, context-aware assistant reply with navigation and out-of-scope guidance."""
    lang = (language or "en").lower().strip()
    msg = (message or "").lower().strip()

    # 1. Out-of-Scope Category check (e.g. General category)
    out_of_scope_keywords = [
        "general category", "general", "open category", "general wale",
        "general loan", "unreserved", "general schemes", "gen category",
        "सामान्य वर्ग", "सामान्य", "जनरल"
    ]
    is_out_of_scope_category = any(k in msg for k in out_of_scope_keywords)

    # 2. Eligibility Criteria inquiry
    eligibility_keywords = [
        "eligibility criteria", "eligibility", "eligibilty", "criteria",
        "पात्रता मानदंड", "पात्रता", "योग्यता", "शर्तें", "who is eligible", "who can apply", "qualify"
    ]
    is_eligibility_inquiry = (
        any(k in msg for k in eligibility_keywords)
        and not is_out_of_scope_category
        and not ineligibility_query
    )

    # 3. Channel Partner inquiry
    partner_keywords = [
        "channel partner", "channel partners", "partner", "partners", "locator", "nearby",
        "locate", "where to apply", "branch", "branches", "office",
        "चैनल पार्टनर", "पार्टनर", "शाखा", "निकटतम", "कहाँ आवेदन"
    ]
    is_partner_inquiry = any(k in msg for k in partner_keywords)

    # 4. Business Loan inquiry
    biz_keywords = [
        "business", "new business", "start business", "starting business",
        "enterprise", "shop", "startup", "व्यापार", "व्यवसाय", "नया व्यापार",
        "दुकान", "उद्यम", "रोजगार"
    ]
    is_business_inquiry = (
        any(k in msg for k in biz_keywords)
        and not is_out_of_scope_category
        and any(
            k in msg
            for k in [
                "loan", "loans", "scheme", "schemes", "ऋण", "योजना", "लोन",
                "apply", "चाहिए", "start", "starting", "check", "know"
            ]
        )
    )

    # 5. EMI inquiry
    is_emi = any(
        k in msg for k in [
            "emi", "calculator", "calculate", "installment", "monthly payment",
            "repayment", "किस्त", "ईएमआई", "गणना", "ब्याज", "किश्त"
        ]
    )

    # 6. Document inquiry
    is_docs = any(
        k in msg for k in [
            "doc", "document", "documents", "certificate", "paper", "proof",
            "दस्तावेज़", "कागज़", "प्रमाण", "सर्टिफिकेट", "நதி", "নথি"
        ]
    )

    # 7. Pure Greeting
    is_pure_greeting = msg in [
        "hi", "hello", "hey", "namaste", "namaskar", "pranam", "helo",
        "नमस्ते", "नमस्कार", "प्रणाम", "வணக்கம்", "নমস্কার", "నమస్కారం"
    ]

    is_explore = any(
        k in msg for k in ["explore", "all schemes", "browse", "सब योजनाएं", "योजनाएं देखें", "সব স্কিম", "திட்டங்கள்"]
    )

    is_indic = lang in ["hi", "bn", "ta", "te", "mr", "gu", "ne", "sa", "mai", "sat", "doi", "brx", "kok", "pa", "or", "as", "ur"]

    # ==================== INTENT HANDLING ====================

    # Ineligibility explanation for a queried scheme
    if ineligibility_query:
        scheme_name = ineligibility_query.get("scheme_name") or ineligibility_query.get("scheme_id", "Scheme")
        reasons = ineligibility_query.get("reasons", [])
        reason_str = ", ".join(reasons) if reasons else ("पात्रता मानदंड" if is_indic else "eligibility requirements")
        if is_indic:
            return (
                f"**{scheme_name}** के लिए आपकी प्रोफ़ाइल इसलिए मेल नहीं खाती: {reason_str}। आप अपनी जानकारी अपडेट कर सकते हैं या नीचे दी गई अन्य उपलब्ध योजनाओं की जांच कर सकते हैं।",
                {"explore": True},
                None,
            )
        return (
            f"**{scheme_name}** was not matched due to: {reason_str}. You can review the requirements or explore other eligible concessional schemes below.",
            {"explore": True},
            None,
        )

    # Feature 1: Out-of-Scope Category (General Category, etc.)
    if is_out_of_scope_category:
        if is_indic:
            reply = (
                "स्कीम साथी की रियायती ऋण योजनाएं (NSFDC के तहत) विशेष रूप से अनुसूचित जाति (SC) वर्ग (तथा विश्वास योजना के तहत ओबीसी व सफाई कर्मचारियों) के लिए हैं। सामान्य वर्ग (General Category) के लिए रियायती योजनाएं NSFDC के अंतर्गत नहीं आती हैं।\n\n"
                "सामान्य वर्ग व सभी नागरिकों के लिए उपलब्ध प्रमुख राष्ट्रीय सरकारी योजनाएं निम्नलिखित हैं:\n"
                "1. **प्रधानमंत्री मुद्रा योजना (PMMY)**: सूक्ष्म व लघु व्यवसायों के लिए ₹10–20 लाख तक का संपार्श्विक-मुक्त (बिना गारंटी) ऋण।\n"
                "   - आधिकारिक वेबसाइट: https://www.mudra.org.in\n"
                "2. **प्रधानमंत्री रोजगार सृजन कार्यक्रम (PMEGP)**: नए सूक्ष्म उद्यम स्थापित करने के लिए सब्सिडी-युक्त ऋण।\n"
                "   - आधिकारिक वेबसाइट: https://www.kviconline.gov.in/pmegpeportal\n"
                "3. **पीएम स्वनिधि (PM SVANidhi)**: छोटे व्यापारियों व विक्रेताओं के लिए कार्यशील पूंजी ऋण।\n"
                "   - आधिकारिक वेबसाइट: https://pmsvanidhi.mohua.gov.in\n"
                "4. **Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)**: सूक्ष्म एवं लघु उद्यमों के लिए संपार्श्विक-मुक्त ऋण गारंटी।\n"
                "   - आधिकारिक वेबसाइट: https://www.cgtmse.in\n"
                "5. **स्टैंड-अप इंडिया (Stand-Up India)**: किसी भी वर्ग की महिला उद्यमियों के लिए ₹10 लाख से ₹1 करोड़ तक का बैंक ऋण।\n"
                "   - आधिकारिक वेबसाइट: https://www.standupmitra.in\n\n"
                "कृपया इसे देखें, क्योंकि यह मेरे दायरे से बाहर है।"
            )
        else:
            reply = (
                "Scheme Saathi concessional credit schemes under NSFDC are specifically dedicated to Scheduled Caste (SC) beneficiaries (with secondary interest subvention under VISVAS for OBC and Safai Karamcharis). Concessional credit schemes for the General category are not directly covered under NSFDC.\n\n"
                "However, the following central government loan schemes are available for the General category and all citizens:\n"
                "1. **Pradhan Mantri MUDRA Yojana (PMMY)**: Collateral-free micro-enterprise loans up to ₹10–20 Lakh (Shishu, Kishore, Tarun) for all categories.\n"
                "   - Official Website: https://www.mudra.org.in\n"
                "2. **Prime Minister Employment Generation Programme (PMEGP)**: Credit-linked capital subsidy programme for establishing new micro-enterprises across all categories.\n"
                "   - Official Website: https://www.kviconline.gov.in/pmegpeportal\n"
                "3. **PM SVANidhi**: Working capital loans up to ₹50,000 for street vendors and small micro-entrepreneurs.\n"
                "   - Official Website: https://pmsvanidhi.mohua.gov.in\n"
                "4. **Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)**: Collateral-free business credit facility through commercial banks.\n"
                "   - Official Website: https://www.cgtmse.in\n"
                "5. **Stand-Up India Scheme**: Bank loans between ₹10 Lakh and ₹1 Crore for women entrepreneurs of any category.\n"
                "   - Official Website: https://www.standupmitra.in\n\n"
                "Please refer to this, as it is out of my scope."
            )
        return (reply, {"explore": True}, OUT_OF_SCOPE_NATIONAL_SCHEMES)

    # Feature 2: Eligibility Criteria question
    if is_eligibility_inquiry:
        if is_indic:
            reply = "सभी योजनाओं के पात्रता मानदंड इस अनुभाग में दिए गए हैं। कृपया इस अनुभाग को देखें।"
        else:
            reply = "All schemes eligibility criteria are mentioned in this section. Please refer to this section."
        return (reply, {"explore": True}, None)

    # Feature 3: Channel Partner question
    if is_partner_inquiry:
        if is_indic:
            reply = "चैनल पार्टनर खोजने के लिए कृपया इस अनुभाग को देखें।"
        else:
            reply = "Please refer to this section for locating channel partners."
        return (reply, {"partner": True}, None)

    # Feature 4: Business Loan question
    if is_business_inquiry:
        if is_indic:
            reply = (
                "नया व्यवसाय शुरू करने या व्यापार विस्तार के लिए, स्कीम साथी एनएसएफडीसी (NSFDC) के तहत अनुसूचित जाति (SC) वर्ग (वार्षिक पारिवारिक आय ₹5 लाख तक) के लिए निम्नलिखित रियायती ऋण योजनाएं प्रदान करता है:\n\n"
                "1. **टर्म लोन (सावधि ऋण - TL)**: ₹50 लाख तक की परियोजना लागत (ऋण ₹45 लाख तक) 8% वार्षिक ब्याज दर पर।\n"
                "2. **उद्यम निधि योजना (UNY)**: ₹5 लाख तक की परियोजना लागत (ऋण ₹4.50 लाख तक) 13%–15% वार्षिक ब्याज दर पर।\n"
                "3. **माइक्रो फाइनेंस योजना (MFS)**: ₹1.40 लाख तक की परियोजना लागत (ऋण ₹1.25 लाख तक) 6.5% वार्षिक ब्याज दर पर।\n"
                "4. **आजीविका माइक्रो-फाइनेंस योजना (AMY)**: ₹1.25 लाख तक का ऋण 15% वार्षिक ब्याज दर पर एनबीएफसी-एमएफआई के माध्यम से।\n\n"
                "आप नीचे दिए गए बटनों का उपयोग करके अपनी पात्रता जांच सकते हैं या सभी योजनाओं का विवरण देख सकते हैं।"
            )
        else:
            reply = (
                "For starting or expanding a new business, Scheme Saathi offers the following verified concessional credit schemes under NSFDC (for Scheduled Caste beneficiaries with annual family income up to ₹5 Lakh):\n\n"
                "1. **Term Loan (TL)**: Concessional loan up to ₹45 Lakh (project cost up to ₹50 Lakh) at 8% annual interest for viable income-generating business projects.\n"
                "2. **Udyam Nidhi Yojana (UNY)**: Loan up to ₹4.50 Lakh (project cost up to ₹5 Lakh) at 13%–15% annual interest for micro/small enterprises.\n"
                "3. **Micro Finance Scheme (MFS)**: Loan up to ₹1.25 Lakh (project cost up to ₹1.40 Lakh) at 6.5% annual interest for petty business and micro-units.\n"
                "4. **Aajeevika Micro-Finance Yojana (AMY)**: Loan up to ₹1.25 Lakh at 15% annual interest through accredited NBFC-MFIs.\n\n"
                "You can check your eligibility using **Find My Schemes** or browse complete financial terms in **Explore Schemes** below."
            )
        return (reply, {"explore": True, "finder": True}, None)

    # Feature 5: EMI Calculation
    if is_emi and emi_output:
        scheme_name = emi_output.get("scheme_name", "the selected scheme")
        principal = emi_output.get("loan_amount") or emi_output.get("principal", 0)
        rate = emi_output.get("interest_rate_percent") or emi_output.get("annual_interest_rate_percent", 0)
        monthly_emi = emi_output.get("monthly_emi", 0)
        tenure = emi_output.get("tenure_months", 0)
        if is_indic:
            reply = (
                f"आपके ऋण अनुरोध के लिए ईएमआई गणना तैयार है। **{scheme_name}** के अंतर्गत ₹{principal:,.0f} के ऋण पर {rate}% वार्षिक ब्याज दर से आपकी अनुमानित मासिक ईएमआई ₹{monthly_emi:,.0f} होगी (अवधि: {tenure} महीने)। विस्तृत चुकौती विवरण नीचे प्रदर्शित किया गया है।"
            )
        else:
            reply = (
                f"Here is the EMI projection for your requested loan. Under **{scheme_name}**, for a loan of ₹{principal:,.0f} at {rate}% annual interest, your estimated monthly EMI is ₹{monthly_emi:,.0f} over a tenure of {tenure} months. A detailed breakdown is shown below."
            )
        return (reply, {"calculator": True}, None)

    # Feature 6: Documents
    if is_docs:
        if is_indic:
            reply = (
                "एनएसएफडीसी (NSFDC) की रियायती योजनाओं के लिए मुख्य आवश्यक दस्तावेज़ निम्नलिखित हैं:\n"
                "1. **जाति प्रमाण पत्र**: सक्षम प्राधिकारी द्वारा जारी वैध अनुसूचित जाति (SC) प्रमाण पत्र।\n"
                "2. **आय प्रमाण पत्र**: सक्षम अधिकारी द्वारा जारी वार्षिक पारिवारिक आय प्रमाण पत्र (वार्षिक आय ₹5 लाख तक)।\n"
                "3. **पहचान एवं पता प्रमाण**: आधार कार्ड, वोटर आईडी या राशन कार्ड।\n"
                "4. **परियोजना / व्यवसाय दस्तावेज**: डीपीआर (DPR) या लागत अनुमान (जहां लागू हो)।\n"
                "5. **शिक्षा ऋण के लिए**: मान्यता प्राप्त संस्थान का प्रवेश पत्र और फीस संरचना।"
            )
        else:
            reply = (
                "The key required documents for NSFDC concessional schemes are:\n"
                "1. **Valid Caste Certificate**: SC certificate issued by a competent government authority.\n"
                "2. **Income Proof**: Certificate verifying annual family income up to ₹5 lakh.\n"
                "3. **Identity & Address Proof**: Aadhaar Card, Voter ID, Ration Card, etc.\n"
                "4. **Business / Project Documents**: DPR or cost estimates (where applicable).\n"
                "5. **For Educational Loans**: Admission offer letter and course fee structure."
            )
        return (reply, {"documents": True}, None)

    # Feature 7: Matched Schemes Available from Profile
    if eligible_schemes and len(eligible_schemes) > 0 and (not is_explore):
        top = eligible_schemes[0]
        top_name = top.get("scheme_name") or top.get("name", "Primary Scheme")
        top_id = top.get("scheme_id") or top.get("id", "")
        id_tag = f" ({top_id})" if top_id and top_id not in top_name else ""
        if is_indic:
            reply = (
                f"आपकी प्रोफ़ाइल और पात्रता मानदंडों के आधार पर सरकारी रियायती ऋण योजनाएं मिल गई हैं। आपकी शीर्ष अनुशंसित योजना **{top_name}**{id_tag} है। "
                "आप नीचे दिए गए कार्डों में पूर्ण विवरण देख सकते हैं, ईएमआई की गणना कर सकते हैं या निकटतम चैनल पार्टनर ढूंढ सकते हैं।"
            )
        else:
            reply = (
                f"Based on our evaluation against official government guidelines, here are the verified concessional schemes matching your profile. Your top primary recommendation is **{top_name}**{id_tag}. "
                "You can review details, calculate your EMI, and connect with nearby channel partners below."
            )
        return (reply, {"explore": True, "partner": True}, None)

    # Feature 8: Pure Greeting
    if is_pure_greeting:
        if is_indic:
            reply = "नमस्ते! मैं सरकारी रियायती ऋण योजनाओं, पात्रता मानदंडों, ईएमआई गणना या चैनल पार्टनर खोजने में आपकी क्या सहायता कर सकता हूँ?"
        else:
            reply = "Hello! How can I assist you with government concessional loan schemes, eligibility criteria, EMI calculations, or locating channel partners today?"
        return (reply, {"explore": True, "finder": True}, None)

    # Feature 9: Explore all schemes
    if is_explore:
        if is_indic:
            reply = "आप एनएसएफडीसी और भागीदार संस्थानों की सभी 5 प्राथमिक रियायती योजनाएं और संबद्ध सहायता (VISVAS) देख सकते हैं। सभी उपलब्ध विकल्प और वित्तीय विवरण नीचे दिए गए बटन पर क्लिक करके देखें।"
        else:
            reply = "You can explore all verified government concessional schemes from NSFDC and partner institutions. Use the button below to browse all available options and financial details."
        return (reply, {"explore": True}, None)

    # General Fallback (clean, direct, no repetitive intro)
    if is_indic:
        reply = "मैं रियायती ऋण योजनाओं (माइक्रो फाइनेंस, आजीविका, टर्म लोन, उद्यम निधि, शिक्षा ऋण), ईएमआई गणना, आवश्यक दस्तावेज़ों या अधिकृत चैनल पार्टनर खोजने में आपकी सहायता कर सकता हूँ। कृपया अपना प्रश्न बताएं।"
    else:
        reply = "I can help you evaluate concessional credit schemes (Micro Finance, Aajeevika, Term Loan, Udyam Nidhi, Educational Loans), calculate loan EMIs, review required documents, or find authorized channel partners. How can I assist you with your loan inquiry?"
    return (reply, {"explore": True, "finder": True}, None)


async def get_ai_response(
    message: str,
    language: str | None = None,
    user_profile: dict[str, Any] | None = None,
    eligible_schemes: list[dict[str, Any]] | None = None,
    ineligible_schemes: list[dict[str, Any]] | None = None,
    emi_output: dict[str, Any] | None = None,
    partner_output: dict[str, Any] | None = None,
    ineligibility_query: dict[str, Any] | None = None,
    out_of_scope_schemes: list[dict[str, Any]] | None = None,
    document_status: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Main entry point: get an AI response for the user message."""

    language_used, language_detected = _detect_language(message, language)

    context = _build_user_context(
        user_profile=user_profile,
        eligible_schemes=eligible_schemes,
        ineligible_schemes=ineligible_schemes,
        emi_output=emi_output,
        partner_output=partner_output,
        ineligibility_query=ineligibility_query,
        out_of_scope_schemes=out_of_scope_schemes,
        document_status=document_status,
    )

    reply = await _call_gemini(SYSTEM_PROMPT, message, context)

    navigation = None
    if reply is None:
        candidate_keys = [
            language_used.lower().strip() if language_used else "",
            language.lower().strip() if language else "",
            "en",
        ]
        _fallback_key = candidate_keys[0] or "en"
        reply, navigation, fallback_oos = _build_intelligent_assistant_reply(
            message=message,
            language=_fallback_key,
            user_profile=user_profile,
            eligible_schemes=eligible_schemes,
            ineligible_schemes=ineligible_schemes,
            emi_output=emi_output,
            partner_output=partner_output,
            ineligibility_query=ineligibility_query,
            out_of_scope_schemes=out_of_scope_schemes,
        )
        if fallback_oos and not out_of_scope_schemes:
            out_of_scope_schemes = fallback_oos
    else:
        navigation = _detect_navigation_from_intent(message, reply)

    msg_lower = (message or "").lower().strip()
    user_asked_partner = any(
        k in msg_lower
        for k in [
            "channel partner", "channel partners", "partner", "partners",
            "locator", "nearby", "locate", "where to apply", "branch",
            "चैनल पार्टनर", "पार्टनर", "शाखा", "निकटतम"
        ]
    )

    # Parse AI ranking before stripping markers
    structured = _extract_structured_data(
        reply=reply,
        eligible_schemes=eligible_schemes,
        emi_output=emi_output,
        partner_output=partner_output,
        ineligibility_query=ineligibility_query,
        out_of_scope_schemes=out_of_scope_schemes,
        user_asked_partner=user_asked_partner,
        document_status=document_status,
    )

    # Strip ranking markers from the user-visible reply
    clean_reply = _strip_ranking_markers(reply) if reply else reply

    return {
        "reply": clean_reply,
        "language_used": language_used,
        "language_detected": language_detected,
        "navigation": navigation,
        **structured,
    }
