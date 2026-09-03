import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Globe2,
  LockKeyhole,
  LogIn,
  MapPin,
  Loader2,
  Send,
  BookOpen,
  ShieldCheck,
  Sparkles,
  UserRound,
  Eye,
  EyeOff,
  AlertCircle,
  Search,
} from "lucide-react";

/* =========================================================
   CONFIG
========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

import {
  SUPPORTED_LANGUAGES,
  t,
  isRTL,
} from "./i18n/translations";
import {
  getPrimarySchemes,
  getLocalizedSchemeName,
} from "./i18n/schemeData";
import DocumentCenter from "./components/DocumentCenter.jsx";
import ApplicationTracking from "./components/ApplicationTracking.jsx";

function LanguageSelector({ currentLanguage = "en", onLanguageChange }) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setShowLangMenu((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-[#cfd8e3] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#24344e] transition hover:bg-[#f5f8fb]"
        title="Select Language"
        type="button"
      >
        <Globe2 size={14} />
        <span>{activeLangObj?.display || "English"}</span>
        <ChevronDown size={13} />
      </button>

      {showLangMenu && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-[320px] w-[240px] overflow-y-auto rounded-xl border border-[#d5e0e7] bg-white shadow-xl">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                onLanguageChange?.(lang.code);
                setShowLangMenu(false);
              }}
              className={[
                "flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] transition hover:bg-[#f0f6fa]",
                currentLanguage === lang.code
                  ? "bg-[#eef7fb] font-bold text-[#145c91]"
                  : "text-[#34475d]",
              ].join(" ")}
            >
              {currentLanguage === lang.code && (
                <span className="text-[#145c91] font-bold">✓</span>
              )}
              <span>{lang.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeMatchScore(score) {
  if (
    score === null ||
    score === undefined ||
    score === ""
  ) {
    return null;
  }

  const numericScore = Number(score);

  if (Number.isNaN(numericScore)) {
    return null;
  }

  const percentage =
    numericScore <= 1
      ? numericScore * 100
      : numericScore;

  return Math.max(
    0,
    Math.min(100, Math.round(percentage)),
  );
}

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not provided";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return `₹${numericValue.toLocaleString("en-IN")}`;
}

function formatValue(value) {
  if (!value) {
    return "Not provided";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase(),
    );
}

/* =========================================================
   GENDER / SCHEME HELPERS
========================================================= */

/*
  Detect whether a scheme is women-focused.

  Backend may expose this information through:
    - women_focused
    - womenFocused
    - gender_status.message
    - gender_message
    - gender_requirement

  We check all common possibilities so the frontend
  does not accidentally recommend a women-focused scheme
  to a male applicant.
*/
function isWomenFocusedScheme(scheme) {
  if (!scheme) {
    return false;
  }

  if (
    scheme.women_focused === true ||
    scheme.womenFocused === true ||
    scheme.gender_status?.women_focused === true ||
    scheme.gender_status?.womenFocused === true
  ) {
    return true;
  }

  const messages = [
    scheme.gender_status?.message,
    scheme.gender_message,
    scheme.gender_requirement,
    scheme.preference_message,
  ]
    .filter(Boolean)
    .map((value) =>
      String(value).toLowerCase(),
    )
    .join(" ");

  return (
    messages.includes("women-focused") ||
    messages.includes("women focused") ||
    messages.includes("women-focused fund") ||
    messages.includes("women focused fund") ||
    messages.includes("women only") ||
    messages.includes("for women") ||
    messages.includes("female focused") ||
    messages.includes("female-focused")
  );
}

function isFemaleApplicant(formData) {
  return (
    String(formData?.gender || "")
      .toLowerCase() === "female"
  );
}

/*
  Explicit product rule:

  A women-focused scheme must NOT be recommended
  to a non-female applicant.

  This is a recommendation-level filter.
*/
function shouldExcludeForGender(
  scheme,
  formData,
) {
  return (
    isWomenFocusedScheme(scheme) &&
    !isFemaleApplicant(formData)
  );
}

/*
  Extract a useful gender failure reason.
*/
function getGenderFailureReason(scheme) {
  if (scheme?.gender_status?.message) {
    return String(
      scheme.gender_status.message,
    );
  }

  return "This scheme has a women-focused fund allocation and is not recommended for male / non-female applicants.";
}

/* =========================================================
   FALLBACK MATCH SCORE
========================================================= */

/*
  IMPORTANT:

  This is only a temporary deterministic fallback.
  It is NOT an AI score.

  Core eligibility signals:
    Community  = 20
    Income     = 20
    Purpose    = 20
    Project    = 20
    Preference = 20

  For a women-focused scheme:
    Female applicant     -> +20 preference
    Non-female applicant -> scheme is excluded BEFORE scoring

  Therefore:
    women-focused + male => 0%
*/
  function calculateFallbackMatchScore(
  scheme,
  formData,
) {
  if (!scheme) {
    return 0;
  }

  /*
    Safety rule:
    women-focused scheme + non-female applicant = ZERO.
  */
  if (
    shouldExcludeForGender(
      scheme,
      formData,
    )
  ) {
    return 0;
  }

  const reasons = Array.isArray(
    scheme.reasons,
  )
    ? scheme.reasons
    : [];

  let score = 0;

  const hasCommunityMatch =
    reasons.some((reason) =>
      String(reason)
        .toLowerCase()
        .includes(
          "community requirement satisfied",
        ),
    );

  const hasIncomeMatch =
    reasons.some((reason) =>
      String(reason)
        .toLowerCase()
        .includes(
          "annual family income is within",
        ),
    );

  const hasPurposeMatch =
    reasons.some((reason) =>
      String(reason)
        .toLowerCase()
        .includes(
          "requirement type is compatible",
        ),
    );

  const hasProjectMatch =
    reasons.some((reason) =>
      String(reason)
        .toLowerCase()
        .includes(
          "project cost falls within",
        ),
    );

  if (hasCommunityMatch) {
    score += 20;
  }

  if (hasIncomeMatch) {
    score += 20;
  }

  if (hasPurposeMatch) {
    score += 20;
  }

  if (hasProjectMatch) {
    score += 20;
  }

  /*
    Gender-specific positive match:
    female applicant + women-focused scheme = +20.
  */
  if (
    scheme?.gender_status?.rule_type ===
      "women_target" &&
    formData?.gender === "female"
  ) {
    score += 20;
  }

  return Math.min(
    100,
    Math.round(score),
  );
}



/* =========================================================
   RESULT NORMALIZATION
========================================================= */

/*
  This is the MOST IMPORTANT FIX.

  Backend may say:
      primary.eligible = [Term Loan, UNY]

  But if the applicant is male and Term Loan is
  women-focused, we MUST NOT display Term Loan
  as a recommendation.

  So we sanitize the backend response before rendering.
*/
function normalizeSchemeResults(
  results,
  formData,
) {
  const backendPrimaryEligible =
    Array.isArray(
      results?.primary?.eligible,
    )
      ? results.primary.eligible
      : [];

  const backendPrimaryIneligible =
    Array.isArray(
      results?.primary?.ineligible,
    )
      ? results.primary.ineligible
      : [];

  const backendSecondaryEligible =
    Array.isArray(
      results?.secondary?.eligible,
    )
      ? results.secondary.eligible
      : [];

  /*
    Keep backend-eligible schemes only when
    their gender requirement is satisfied.
  */
  const allowedPrimaryEligible = [];
  const genderFilteredPrimary = [];

  backendPrimaryEligible.forEach(
    (scheme) => {
      if (
        shouldExcludeForGender(
          scheme,
          formData,
        )
      ) {
        genderFilteredPrimary.push({
          ...scheme,
          eligibility_status:
            "NOT_ELIGIBLE_GENDER",
          match_score: 0,
          failures: [
            ...(Array.isArray(
              scheme.failures,
            )
              ? scheme.failures
              : []),
            getGenderFailureReason(scheme),
          ],
        });

        return;
      }

      allowedPrimaryEligible.push(
        scheme,
      );
    },
  );

  /*
    Secondary schemes should follow the same
    gender restriction so that a women-focused
    support scheme is not recommended to a male
    applicant either.
  */
  const allowedSecondaryEligible = [];

  backendSecondaryEligible.forEach(
    (scheme) => {
      if (
        shouldExcludeForGender(
          scheme,
          formData,
        )
      ) {
        return;
      }

      allowedSecondaryEligible.push(
        scheme,
      );
    },
  );

  return {
    ...results,

    primary: {
      ...(results?.primary || {}),
      eligible:
        allowedPrimaryEligible,
      ineligible: [
        ...backendPrimaryIneligible,
        ...genderFilteredPrimary,
      ],
    },

    secondary: {
      ...(results?.secondary || {}),
      eligible:
        allowedSecondaryEligible,
    },
  };
}

/* =========================================================
   MATCH SCORE COMPONENTS
========================================================= */

function MatchScoreDisplay({
  score,
}) {
  const normalizedScore =
    normalizeMatchScore(score);

  return (
    <div className="mt-1 flex h-[58px] items-baseline justify-center">
      <span className="font-serif text-[54px] font-bold leading-none text-[#155985]">
        {normalizedScore !== null
          ? normalizedScore
          : "—"}
      </span>

      {normalizedScore !== null && (
        <span className="ml-0.5 font-serif text-[23px] font-bold leading-none text-[#155985]">
          %
        </span>
      )}
    </div>
  );
}

function MatchScoreRing({ score }) {
  const normalizedScore =
    normalizeMatchScore(score);

  const hasScore =
    normalizedScore !== null;

  const ringStyle = hasScore
    ? {
        background: `conic-gradient(#155985 ${
          normalizedScore * 3.6
        }deg, #d8e4eb 0deg)`,
      }
    : {
        background: "#d8e4eb",
      };

  return (
    <div
      className="relative mt-3 flex h-[78px] w-[78px] items-center justify-center rounded-full p-[7px]"
      style={ringStyle}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fffef9]">
        <Sparkles
          size={20}
          className="text-[#155985]"
        />
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [view, setView] = useState("home");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("scheme_saathi_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const token = localStorage.getItem("scheme_saathi_token");
      const user = localStorage.getItem("scheme_saathi_user");
      return Boolean(token && user);
    } catch {
      return false;
    }
  });

  const [currentLanguage, setCurrentLanguage] = useState(() => {
    try {
      return localStorage.getItem("scheme_saathi_lang") || "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("scheme_saathi_lang", currentLanguage);
    } catch {
      // Ignore storage errors
    }
    const rtl = isRTL(currentLanguage);
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const handleLanguageChange = (lang) => {
    const validLang = String(lang || "en").toLowerCase().trim();
    setCurrentLanguage(validLang);
    try {
      localStorage.setItem("scheme_saathi_lang", validLang);
    } catch {
      // Ignore storage errors
    }
    const rtl = isRTL(validLang);
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.documentElement.lang = validLang;
  };

  const [lastSchemeResults, setLastSchemeResults] = useState(() => {
    try {
      const saved = localStorage.getItem("scheme_saathi_last_results");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [lastSchemeFormData, setLastSchemeFormData] = useState(() => {
    try {
      const saved = localStorage.getItem("scheme_saathi_last_form");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleResultsReady = (results, formData) => {
    setLastSchemeResults(results);
    setLastSchemeFormData(formData);
    try {
      localStorage.setItem("scheme_saathi_last_results", JSON.stringify(results));
      localStorage.setItem("scheme_saathi_last_form", JSON.stringify(formData));
    } catch {
      // Ignore storage errors
    }
  };

  const openSchemeFinder = () => {
    if (isLoggedIn) {
      setView("finder");
    } else {
      setView("login");
    }
  };

  const handleLogin = (user) => {
    if (user) {
      setCurrentUser(user);
    }
    setIsLoggedIn(true);
    setView("finder");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("scheme_saathi_token");
      localStorage.removeItem("scheme_saathi_user");
      localStorage.removeItem("scheme_saathi_last_results");
      localStorage.removeItem("scheme_saathi_last_form");
    } catch {
      // Ignore storage errors
    }
    setCurrentUser(null);
    setIsLoggedIn(false);
    setLastSchemeResults(null);
    setLastSchemeFormData(null);
    setView("home");
  };

  const [trackingAppNumber, setTrackingAppNumber] = useState("");
  const [selectedApplyScheme, setSelectedApplyScheme] = useState(null);

  const handleApplyScheme = (scheme) => {
    setSelectedApplyScheme(scheme);
    setView("tracking");
  };

  return (
    <div className="min-h-screen bg-white text-[#10213f]">
      {view === "home" && (
        <LandingPage
          onFindScheme={openSchemeFinder}
          onExplore={() => setView("explore")}
          onLogin={() => setView("login")}
          onNavigate={(nextView) => setView(nextView)}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
          lastSchemeResults={lastSchemeResults}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "explore" && (
        <ExploreSchemes
          onBack={() => setView("home")}
          onLogin={() => setView("login")}
          onFindScheme={openSchemeFinder}
          onNavigate={(nextView) => setView(nextView)}
          onApplyScheme={handleApplyScheme}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleLogout}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "login" && (
        <AuthPage
          mode="login"
          onBack={() => setView("home")}
          onLogin={handleLogin}
          onSignup={() => setView("signup")}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "signup" && (
        <AuthPage
          mode="signup"
          onBack={() => setView("home")}
          onLogin={handleLogin}
          onSignupSuccess={handleLogin}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "finder" && (
        <SchemeFinder
          onBack={() => setView("home")}
          isLoggedIn={isLoggedIn}
          initialResults={lastSchemeResults}
          initialFormData={lastSchemeFormData}
          onResultsReady={handleResultsReady}
          onNavigate={(nextView) => setView(nextView)}
          onApplyScheme={handleApplyScheme}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "emi_calculator" && (
        <EMICalculator
          onBack={() => setView("home")}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "partner_locator" && (
        <PartnerLocator
          onBack={() => setView("home")}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "ai_assistant" && (
        <AIAssistant
          onBack={() => setView("home")}
          onNavigate={(nextView) => setView(nextView)}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          lastSchemeResults={lastSchemeResults}
          lastSchemeFormData={lastSchemeFormData}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "documents" && (
        <DocumentCenter
          onBack={() => setView("home")}
          onNavigate={(nextView) => setView(nextView)}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {view === "tracking" && (
        <ApplicationTracking
          onBack={() => setView("home")}
          onNavigate={(nextView) => setView(nextView)}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          initialAppNumber={trackingAppNumber}
          initialScheme={selectedApplyScheme}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )}
    </div>
  );
}

/* =========================================================
   LANDING PAGE
========================================================= */

function LandingPage({
  onFindScheme,
  onExplore,
  onLogin,
  onNavigate,
  isLoggedIn,
  onLogout,
  currentUser,
  lastSchemeResults,
  currentLanguage = "en",
  onLanguageChange,
}) {
  const topScheme = lastSchemeResults?.primary?.eligible?.[0] || null;
  const matchScore = topScheme?.match_score ?? null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#dce4ec] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[86px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              })
            }
            className="flex items-center gap-3 text-left"
          >
            <div className="relative flex h-12 w-12 items-center justify-center text-[#c6a56b]">
              <div className="absolute inset-1 rotate-45 rounded-[10px] border-[3px] border-[#c6a56b]" />

              <Sparkles
                size={25}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <h1 className="font-serif text-[25px] font-bold leading-none tracking-wide text-[#12213c]">
                SCHEME SAATHI
              </h1>

              <p className="mt-1 text-[12px] font-medium text-[#61738d]">
                {t("tagline", currentLanguage)}
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-7 lg:flex">
            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior:
                    "smooth",
                })
              }
              className="relative py-3 text-[14px] font-medium text-[#17243b]"
            >
              {t("home", currentLanguage)}

              <span className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 bg-[#c6a56b]" />
            </button>

            <button
              onClick={onExplore}
              className="text-[14px] font-medium text-[#17243b] transition hover:text-[#1769a8]"
            >
              {t("exploreSchemes", currentLanguage)}
            </button>

            <button
              onClick={() => {
                const el = document.getElementById("calculator");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                } else if (onNavigate) {
                  onNavigate("emi_calculator");
                }
              }}
              className="text-[14px] font-medium text-[#17243b] transition hover:text-[#1769a8]"
            >
              {t("calculator", currentLanguage)}
            </button>

            <button
              onClick={() => onNavigate?.("partner_locator")}
              className="text-[14px] font-medium text-[#17243b] transition hover:text-[#1769a8]"
            >
              {t("partnerLocator", currentLanguage)}
            </button>

            <button
              onClick={() => onNavigate?.("documents")}
              className="text-[14px] font-medium text-[#17243b] transition hover:text-[#1769a8]"
            >
              {t("documents", currentLanguage)}
            </button>

            <button
              onClick={() => onNavigate?.("tracking")}
              className="text-[14px] font-medium text-[#17243b] transition hover:text-[#1769a8]"
            >
              {t("trackApplication", currentLanguage)}
            </button>

            <button
              onClick={() => onNavigate?.("ai_assistant")}
              className="text-[14px] font-medium text-[#17243b] transition hover:text-[#1769a8]"
            >
              {t("aiAssistant", currentLanguage)}
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-[#eef7fb] px-3.5 py-2 text-[13px] font-semibold text-[#145c91]">
                  <UserRound
                    size={15}
                  />
                  <span>{currentUser?.name || "Account"}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-[#cfd8e3] px-3.5 py-2 text-[13px] font-semibold text-[#52677d] transition hover:bg-[#f5f8fb] hover:text-[#c53030]"
                >
                  {t("logout", currentLanguage)}
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 rounded-lg border border-[#cfd8e3] px-4 py-2.5 text-[13px] font-semibold text-[#24344e] transition hover:bg-[#f5f8fb]"
              >
                <LogIn
                  size={15}
                />
                {t("signIn", currentLanguage)}
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#eaf5fa]">
          <div className="absolute -left-32 top-10 h-[500px] w-[500px] rounded-full bg-white/60 blur-3xl" />

          <div className="absolute right-0 top-0 h-full w-[45%] bg-gradient-to-l from-[#dceef5]/70 to-transparent" />

          <div className="relative mx-auto grid min-h-[610px] max-w-[1440px] items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_0.9fr] lg:px-20 lg:py-20">
            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9d5df] bg-white/75 px-5 py-2.5 shadow-sm">
                <Bot
                  size={18}
                  className="text-[#1769a8]"
                />

                <span className="text-[13px] font-semibold tracking-[0.12em] text-[#536275]">
                  {t("heroBadge", currentLanguage)}
                </span>
              </div>

              <h2 className="max-w-[680px] font-serif text-[52px] font-bold leading-[1.08] tracking-[-0.02em] text-[#12365d] md:text-[62px]">
                {t("heroTitle", currentLanguage)}
              </h2>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px w-20 bg-[#c6a56b]" />
                <div className="h-2 w-2 rotate-45 bg-[#c6a56b]" />
                <div className="h-px w-8 bg-[#c6a56b]" />
              </div>

              <p className="max-w-[650px] text-[18px] leading-8 text-[#43566f]">
                {t("heroSubtitle", currentLanguage)}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={
                    onFindScheme
                  }
                  className="group flex items-center gap-3 rounded-lg bg-[#145c91] px-7 py-4 text-[16px] font-semibold text-white shadow-lg shadow-[#145c91]/20 transition duration-200 hover:-translate-y-0.5 hover:bg-[#104d7b]"
                >
                  {t("findMyScheme", currentLanguage)}

                  <ArrowRight
                    size={19}
                    className="transition group-hover:translate-x-1 rtl:rotate-180"
                  />
                </button>

                <button
                  onClick={
                    onExplore
                  }
                  className="group flex items-center gap-3 rounded-lg border-2 border-[#145c91] bg-white/80 px-7 py-4 text-[16px] font-semibold text-[#145c91] transition hover:bg-white"
                >
                  {t("exploreSchemes", currentLanguage)}

                  <ArrowRight
                    size={19}
                    className="transition group-hover:translate-x-1 rtl:rotate-180"
                  />
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                <TrustItem
                  icon={
                    <Globe2
                      size={19}
                    />
                  }
                  text="Multilingual Support"
                />

                <TrustItem
                  icon={
                    <ShieldCheck
                      size={19}
                    />
                  }
                  text="Explainable Matching"
                />

                <TrustItem
                  icon={
                    <LockKeyhole
                      size={18}
                    />
                  }
                  text="Secure & Trusted"
                />
              </div>
            </div>

            <div className="relative z-10">
              <div className="relative rounded-[18px] border-2 border-[#31465c] bg-[#fffdf7] p-5 shadow-[0_20px_50px_rgba(38,68,94,0.15)] md:p-6">
                <div className="absolute -right-1 top-0 overflow-hidden">
                  <div className="flex h-[105px] w-[65px] flex-col items-center justify-start bg-[#175b88] px-2 pt-3 text-center text-white shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]">
                    <Sparkles
                      size={17}
                    />

                    <span className="mt-2 text-[10px] font-bold leading-3">
                      BEST
                      <br />
                      MATCH
                    </span>
                  </div>
                </div>

                <div className="mb-5 flex items-center justify-center gap-3">
                  <div className="h-px flex-1 bg-[#c8d1d9]" />

                  <span className="font-serif text-[15px] font-bold tracking-[0.08em] text-[#24384e]">
                    YOUR PERSONAL MATCH
                  </span>

                  <div className="h-px flex-1 bg-[#c8d1d9]" />
                </div>

                <div className="rounded-xl border-2 border-[#43586c] bg-[#fffef9] p-5">
                  <div className="grid grid-cols-[0.95fr_1.15fr] gap-5">
                    <div className="flex min-h-[230px] flex-col items-center justify-center border-r border-[#d4dbe1] pr-5">
                      <p className="text-[12px] font-semibold text-[#37485a]">
                        {t("matchScore", currentLanguage)}
                      </p>

                      <MatchScoreDisplay
                        score={matchScore}
                      />

                      <MatchScoreRing
                        score={matchScore}
                      />
                    </div>

                    <div className="space-y-4">
                      <MatchPoint
                        icon={
                          <UserRound
                            size={16}
                          />
                        }
                        title="Income Eligible"
                        subtitle="Verified by rule engine"
                      />

                      <MatchPoint
                        icon={
                          <FileText
                            size={16}
                          />
                        }
                        title="Purpose Matched"
                        subtitle="Based on requirement"
                      />

                      <MatchPoint
                        icon={
                          <Calculator
                            size={16}
                          />
                        }
                        title="Loan Requirement"
                        subtitle="Compared with scheme limits"
                      />

                      <MatchPoint
                        icon={
                          <MapPin
                            size={16}
                          />
                        }
                        title="Partner Matching"
                        subtitle="Location-aware routing"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border-2 border-[#43586c] bg-[#fffef9] p-4">
                  <div className="grid grid-cols-[1.5fr_0.7fr_0.7fr] items-center gap-4">
                    <div>
                      <p className="text-[11px] text-[#748396]">
                        Top Recommended Scheme
                      </p>

                      <h3 className="mt-1 font-serif text-[21px] font-bold text-[#17263b]">
                        {topScheme?.scheme_name || topScheme?.name || "Based on your profile"}
                      </h3>

                      <p className="mt-1 text-[10px] text-[#65758a]">
                        {topScheme ? "Personalized recommendation" : "Live recommendation from backend"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-[#748396]">
                        {t("maxLoan", currentLanguage)}
                      </p>

                      <p className="mt-1 font-bold text-[#17263b]">
                        {topScheme?.max_loan_display || topScheme?.financial_terms?.max_loan || "Applicable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-[#748396]">
                        {t("interestRate", currentLanguage)}
                      </p>

                      <p className="mt-1 font-bold text-[#17263b]">
                        {topScheme?.interest_rate_display || (topScheme?.financial_terms?.interest_rate ? `${topScheme.financial_terms.interest_rate}% p.a.` : "Applicable")}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={
                    onFindScheme
                  }
                  className="mt-4 flex w-full items-center justify-center gap-3 rounded-lg bg-[#3ca1d0] py-3.5 text-[14px] font-bold text-white transition hover:bg-[#288dbb]"
                >
                  {t("viewMyRecommendations", currentLanguage)}
                  <ArrowRight
                    size={18}
                    className="rtl:rotate-180"
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e4ddd2] bg-[#faf3e8] px-6 py-5">
          <div className="mx-auto grid max-w-[1320px] divide-y divide-[#ded5c8] md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
            <FeatureStrip
              icon={
                <Bot size={25} />
              }
              title="AI Scheme Finder"
              text="Get personalized scheme recommendations with clear reasons."
            />

            <FeatureStrip
              icon={
                <Calculator
                  size={25}
                />
              }
              title="Financial Calculator"
              text="Calculate EMI, interest and repayment before applying."
            />

            <FeatureStrip
              icon={
                <MapPin size={25} />
              }
              title="Partner Locator"
              text="Find the right channel partner near you."
            />

            <FeatureStrip
              icon={
                <FileText
                  size={25}
                />
              }
              title="Track Applications"
              text="Track status and understand your application journey."
            />
          </div>
        </section>

        <section className="bg-white px-6 py-20 lg:py-24">
          <div className="mx-auto max-w-[1300px]">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-16 bg-[#ccd3d9]" />

                <span className="text-[12px] font-bold tracking-[0.18em] text-[#7b858e]">
                  SIMPLE PROCESS
                </span>

                <div className="h-px w-16 bg-[#ccd3d9]" />
              </div>

              <h2 className="mt-4 font-serif text-[34px] font-bold text-[#182a42] md:text-[40px]">
                From Confusion to the Right Opportunity
              </h2>

              <div className="mx-auto mt-5 h-2 w-2 rotate-45 bg-[#c6a56b]" />
            </div>

            <div className="relative mt-16">
              <div className="absolute left-[10%] right-[10%] top-[37px] hidden border-t border-dashed border-[#ccd6dd] lg:block" />

              <div className="relative grid gap-12 md:grid-cols-3 lg:grid-cols-5">
                <ProcessStep
                  number="01"
                  icon={
                    <UserRound
                      size={26}
                    />
                  }
                  title="About You"
                  text="Tell us basic details about your income, location and background."
                  iconClass="bg-[#d9eef8] text-[#17669a]"
                />

                <ProcessStep
                  number="02"
                  icon={
                    <Bot
                      size={26}
                    />
                  }
                  title="Get AI Matching"
                  text="Our intelligent engine checks your profile against eligible schemes."
                  iconClass="bg-[#d9eef8] text-[#17669a]"
                />

                <ProcessStep
                  number="03"
                  icon={
                    <Calculator
                      size={26}
                    />
                  }
                  title="Understand Better"
                  text="Calculate loan details, EMI, interest and repayment terms."
                  iconClass="bg-[#dff0ec] text-[#397e72]"
                />

                <ProcessStep
                  number="04"
                  icon={
                    <MapPin
                      size={26}
                    />
                  }
                  title="Connect & Apply"
                  text="Find a suitable channel partner and understand how to apply."
                  iconClass="bg-[#eef0c9] text-[#7a7b2e]"
                />

                <ProcessStep
                  number="05"
                  icon={
                    <CheckCircle2
                      size={26}
                    />
                  }
                  title="Achieve Your Goal"
                  text="Track your application and move confidently toward your goal."
                  iconClass="bg-[#f1e1d4] text-[#925c38]"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="calculator"
          className="bg-[#f7fafc] px-6 py-16"
        >
          <div className="mx-auto max-w-[1200px] rounded-2xl border border-[#d7e2e9] bg-white p-8">
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-[#1769a8]">
                  FINANCIAL CALCULATOR
                </p>

                <h2 className="mt-2 font-serif text-3xl font-bold text-[#172a43]">
                  Understand your loan before applying.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#708095]">
                  The scheme-specific calculator will use official loan
                  limits, rates, tenure and moratorium values from the
                  backend.
                </p>
              </div>

              <button
                onClick={() =>
                  onNavigate("emi_calculator")
                }
                className="flex shrink-0 items-center gap-2 rounded-lg bg-[#145c91] px-6 py-3.5 font-semibold text-white transition hover:bg-[#104d7b]"
              >
                {t("openCalculator", currentLanguage)}
                <ArrowRight
                  size={18}
                  className="rtl:rotate-180"
                />
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[#edf7fb] px-6 py-16">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-8 rounded-2xl border border-[#d4e2e9] bg-white px-8 py-10 shadow-sm md:flex-row">
            <div>
              <p className="text-sm font-semibold tracking-[0.12em] text-[#17669a]">
                READY TO GET STARTED?
              </p>

              <h2 className="mt-2 font-serif text-3xl font-bold text-[#172a43]">
                Let Scheme Saathi find your best match.
              </h2>

              <p className="mt-2 text-[#68788a]">
                Simple. Transparent. Built around your needs.
              </p>
            </div>

            <button
              onClick={
                onFindScheme
              }
              className="flex shrink-0 items-center gap-3 rounded-lg bg-[#145c91] px-7 py-4 font-semibold text-white shadow-md transition hover:bg-[#104d7b]"
            >
              {t("findMyScheme", currentLanguage)}
              <ArrowRight
                size={19}
                className="rtl:rotate-180"
              />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dce4ea] bg-white px-6 py-7">
        <div className="mx-auto flex max-w-[1300px] flex-col justify-between gap-3 text-sm text-[#718096] md:flex-row">
          <p>
            © 2026 Scheme Saathi. Your Government Scheme Companion.
          </p>

          <p>
            AI-assisted • Rule-based • Location-aware
          </p>
        </div>
      </footer>
    </>
  );
}

/* =========================================================
   EXPLORE SCHEMES DATA
========================================================= */

const SCHEME_ICONS = {
  MFS: <Sparkles size={23} />,
  AMY: <UserRound size={23} />,
  TL: <Calculator size={23} />,
  UNY: <Bot size={23} />,
  ELS: <FileText size={23} />,
};

const PRIMARY_SCHEMES = getPrimarySchemes("en");

/* =========================================================
   EXPLORE SCHEMES
========================================================= */

function ExploreSchemes({
  onBack,
  onLogin,
  onFindScheme,
  onNavigate,
  onApplyScheme,
  isLoggedIn,
  currentUser,
  onLogout,
  currentLanguage = "en",
  onLanguageChange,
}) {
  const schemes = getPrimarySchemes(currentLanguage);

  return (
    <div className="min-h-screen bg-[#f5f9fc]">
      <header className="border-b border-[#dce4ec] bg-white">
        <div className="mx-auto flex min-h-[82px] max-w-[1200px] items-center justify-between px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#53657b] transition hover:text-[#145c91]"
          >
            <ArrowLeft
              size={18}
            />
            {t("backToHome", currentLanguage)}
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center text-[#c6a56b]">
              <div className="absolute inset-1 rotate-45 rounded-md border-2 border-[#c6a56b]" />

              <Sparkles
                size={17}
              />
            </div>

            <p className="font-serif text-[18px] font-bold tracking-wide text-[#172a43]">
              SCHEME SAATHI
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-[#eef7fb] px-3.5 py-1.5 text-[12px] font-semibold text-[#145c91]">
                  <UserRound size={14} />
                  <span>{currentUser?.name || t("account", currentLanguage)}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-[#cfd8e3] px-3 py-1.5 text-[12px] font-semibold text-[#52677d] transition hover:bg-[#f5f8fb] hover:text-[#c53030]"
                >
                  {t("logout", currentLanguage)}
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 rounded-lg border border-[#cfd8e3] px-3.5 py-1.5 text-[12px] font-semibold text-[#24344e] transition hover:bg-[#f5f8fb]"
              >
                <LogIn size={14} />
                {t("signIn", currentLanguage)}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#1769a8]">
            {t("exploreSchemes", currentLanguage).toUpperCase()}
          </p>

          <h1 className="mt-3 font-serif text-4xl font-bold text-[#172a43] md:text-5xl">
            {t("exploreTitle", currentLanguage)}
          </h1>

          <p className="mt-4 text-base leading-7 text-[#66788d]">
            {t("exploreSubtitle", currentLanguage)}
          </p>
        </div>

        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#7b8998]">
                {t("primaryEyebrow", currentLanguage)}
              </p>

              <h2 className="mt-1 font-serif text-2xl font-bold text-[#20344b]">
                {t("coreSchemesTitle", currentLanguage)}
              </h2>
            </div>

            <span className="rounded-full border border-[#d5e0e7] bg-white px-4 py-2 text-[11px] font-bold text-[#637589]">
              {t("coreSchemesBadge", currentLanguage)}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {schemes.map(
              (scheme) => (
                <SchemeCard
                  key={
                    scheme.code
                  }
                  {...scheme}
                  icon={
                    SCHEME_ICONS[scheme.code] || (
                      <Sparkles size={23} />
                    )
                  }
                  currentLanguage={currentLanguage}
                  onApply={onApplyScheme}
                  onNavigate={onNavigate}
                />
              ),
            )}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-6">
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#7b8998]">
              {t("secondaryEyebrow", currentLanguage)}
            </p>

            <h2 className="mt-1 font-serif text-2xl font-bold text-[#20344b]">
              {t("connectedSupportTitle", currentLanguage)}
            </h2>
          </div>

          <div className="rounded-2xl border border-[#d7e3ea] bg-white p-7 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf6fa] text-[#1769a8]">
                <ShieldCheck
                  size={23}
                />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-[#23384f]">
                  {t("visvasTitle", currentLanguage)}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#718096]">
                  {t("visvasDesc", currentLanguage)}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-[#f7fafc] p-3">
                    <p className="text-[10px] text-[#84919d]">
                      {t("interestSupport", currentLanguage)}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#145c91]">
                      {t("visvasInterestValue", currentLanguage)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#f7fafc] p-3">
                    <p className="text-[10px] text-[#84919d]">
                      {t("individualLoan", currentLanguage)}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#263b52]">
                      {t("visvasLoanValue", currentLanguage)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#f7fafc] p-3">
                    <p className="text-[10px] text-[#84919d]">
                      {t("route", currentLanguage)}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#263b52]">
                      {t("lendingInstitutions", currentLanguage)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[10px] leading-5 text-[#8a7b62]">
                  {t("visvasDisclaimer", currentLanguage)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl bg-[#eaf5fa] p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.15em] text-[#1769a8]">
                {t("wantPersonalized", currentLanguage)}
              </p>

              <h2 className="mt-2 font-serif text-2xl font-bold text-[#1c334c]">
                {isLoggedIn
                  ? t("findMatchedSchemes", currentLanguage)
                  : t("signInMatchedSchemes", currentLanguage)}
              </h2>
            </div>

            <button
              onClick={isLoggedIn ? onFindScheme : onLogin}
              className="flex items-center gap-2 rounded-lg bg-[#145c91] px-6 py-3.5 font-semibold text-white transition hover:bg-[#104d7b]"
            >
              {isLoggedIn ? t("findMyScheme", currentLanguage) : t("signIn", currentLanguage)}
              <ArrowRight
                size={18}
                className="rtl:rotate-180"
              />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   AUTH PAGE
========================================================= */

function AuthPage({
  mode,
  onBack,
  onLogin,
  onSignup,
  onSignupSuccess,
  currentLanguage = "en",
  onLanguageChange,
}) {
  const [authMode, setAuthMode] =
    useState(mode);

  const [form, setForm] =
    useState({
      name: "",
      identifier: "",
      password: "",
      confirmPassword: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const INDIAN_PHONE_RE = /^[6-9]\d{9}$/;

  const updateField = (
    field,
    value,
  ) => {
    setError("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      authMode ===
      "signup"
    ) {
      if (
        !form.identifier.trim() ||
        !form.name.trim() ||
        !form.password ||
        !form.confirmPassword
      ) {
        setError(
          "Please fill all required fields.",
        );
        return;
      }

      if (
        !INDIAN_PHONE_RE.test(
          form.identifier.trim(),
        )
      ) {
        setError(
          "Enter Valid 10 digit Indian Number",
        );
        return;
      }

      if (
        form.password.length < 6
      ) {
        setError(
          "Password must be at least 6 characters.",
        );
        return;
      }

      if (
        form.password !==
        form.confirmPassword
      ) {
        setError(
          "Password and Confirm Password do not match.",
        );
        return;
      }

      setLoading(true);
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/auth/signup`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                name: form.name.trim(),
                identifier: form.identifier.trim(),
                password: form.password,
              }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data?.detail ||
              "Failed to create account. Please try again.",
          );
          setLoading(false);
          return;
        }

        if (data.access_token) {
          localStorage.setItem(
            "scheme_saathi_token",
            data.access_token,
          );
        }

        if (data.user) {
          localStorage.setItem(
            "scheme_saathi_user",
            JSON.stringify(data.user),
          );
        }

        if (onSignupSuccess) {
          onSignupSuccess(data.user);
        } else if (onLogin) {
          onLogin(data.user);
        }
      } catch {
        setError(
          "Unable to connect to server. Please verify the backend is running.",
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login mode
    if (
      !form.identifier.trim() ||
      !form.password
    ) {
      setError(
        "Please enter your mobile number and password.",
      );
      return;
    }

    setLoading(true);
    try {
      const response =
        await fetch(
          `${API_BASE_URL}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              identifier: form.identifier.trim(),
              password: form.password,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.detail ||
            "Invalid mobile number or password.",
        );
        setLoading(false);
        return;
      }

      if (data.access_token) {
        localStorage.setItem(
          "scheme_saathi_token",
          data.access_token,
        );
      }

      if (data.user) {
        localStorage.setItem(
          "scheme_saathi_user",
          JSON.stringify(data.user),
        );
      }

      if (onLogin) {
        onLogin(data.user);
      }
    } catch {
      setError(
        "Unable to connect to server. Please verify the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf7fb]">
      <header className="border-b border-[#dce4ea] bg-white">
        <div className="mx-auto flex min-h-[82px] max-w-[1200px] items-center justify-between px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#52677d] transition hover:text-[#145c91]"
          >
            <ArrowLeft
              size={18}
            />
            {t("backToHome", currentLanguage)}
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center text-[#c6a56b]">
              <div className="absolute inset-1 rotate-45 rounded-lg border-2 border-[#c6a56b]" />

              <Sparkles
                size={19}
              />
            </div>

            <div>
              <p className="font-serif text-[19px] font-bold tracking-wide text-[#172a43]">
                SCHEME SAATHI
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#7e8d9e]">
                Secure Access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
            <div className="hidden items-center gap-2 text-xs font-semibold text-[#718096] sm:flex">
              <LockKeyhole
                size={15}
              />
              Secure sign-in
            </div>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-82px)] items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-[1040px] overflow-hidden rounded-3xl border border-[#d5e1e8] bg-white shadow-[0_20px_60px_rgba(46,75,98,0.12)] lg:grid-cols-2">
          <div className="relative hidden overflow-hidden bg-[#dff1f7] p-10 lg:block">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/50 blur-2xl" />

            <div className="relative">
              <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1769a8] shadow-sm">
                <Bot size={27} />
              </div>

              <p className="text-[11px] font-bold tracking-[0.18em] text-[#1769a8]">
                PERSONALIZED GUIDANCE
              </p>

              <h1 className="mt-4 max-w-md font-serif text-4xl font-bold leading-tight text-[#173656]">
                Your journey to the right scheme starts here.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#61748a]">
                Sign in to let Scheme Saathi securely save your profile
                and provide personalized scheme discovery and
                recommendations.
              </p>

              <div className="mt-10 space-y-4">
                <AuthBenefit
                  icon={
                    <ShieldCheck
                      size={18}
                    />
                  }
                  title="Personalized matching"
                  text="Your profile can be used for future recommendations."
                />

                <AuthBenefit
                  icon={
                    <FileText
                      size={18}
                    />
                  }
                  title="Application journey"
                  text="Your account can later connect to documents and tracking."
                />

                <AuthBenefit
                  icon={
                    <LockKeyhole
                      size={18}
                    />
                  }
                  title="Secure account"
                  text="Real password verification will be handled by the backend."
                />
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <div className="max-w-md">
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#1769a8]">
                {authMode ===
                "login"
                  ? "WELCOME BACK"
                  : "CREATE ACCOUNT"}
              </p>

              <h2 className="mt-2 font-serif text-3xl font-bold text-[#172a43]">
                {authMode ===
                "login"
                  ? "Sign in to continue"
                  : "Create your Scheme Saathi account"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#718096]">
                {authMode ===
                "login"
                  ? "Login is required before we collect your personal information for scheme matching."
                  : "Create an account to continue to personalized scheme matching."}
              </p>

              {error && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-red-600"
                  />
                  <span className="leading-5 font-medium">{error}</span>
                </div>
              )}

              <form
                onSubmit={
                  submit
                }
                className="mt-6 space-y-5"
              >
                {authMode ===
                  "signup" && (
                  <TextField
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(
                      value,
                    ) =>
                      updateField(
                        "name",
                        value,
                      )
                    }
                  />
                )}

                <TextField
                  label="Mobile Number"
                  placeholder="Enter 10-digit mobile number"
                  value={
                    form.identifier
                  }
                  onChange={(
                    value,
                  ) =>
                    updateField(
                      "identifier",
                      value,
                    )
                  }
                />

                <div>
                  <label className="mb-2 block text-[13px] font-bold text-[#2c4058]">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        form.password
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "password",
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder={authMode === "signup" ? "Create a password (min 6 characters)" : "Enter password"}
                      className="w-full rounded-lg border border-[#ced9e1] bg-white px-4 py-3.5 pr-12 text-sm text-[#21364f] outline-none transition placeholder:text-[#a1acb6] focus:border-[#1769a8] focus:ring-4 focus:ring-[#1769a8]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (
                            current,
                          ) =>
                            !current,
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#768798]"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={
                            18
                          }
                        />
                      ) : (
                        <Eye
                          size={
                            18
                          }
                        />
                      )}
                    </button>
                  </div>
                </div>

                {authMode ===
                  "signup" && (
                  <div>
                    <label className="mb-2 block text-[13px] font-bold text-[#2c4058]">
                      Confirm Password
                    </label>

                    <input
                      type="password"
                      value={
                        form.confirmPassword
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "confirmPassword",
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Re-enter password"
                      className="w-full rounded-lg border border-[#ced9e1] bg-white px-4 py-3.5 text-sm text-[#21364f] outline-none transition placeholder:text-[#a1acb6] focus:border-[#1769a8] focus:ring-4 focus:ring-[#1769a8]/10"
                    />
                  </div>
                )}

                {authMode ===
                  "login" && (
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-[#66778a]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#145c91]"
                      />
                      Remember me
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          "Password recovery will be connected to the backend authentication service.",
                        )
                      }
                      className="font-semibold text-[#1769a8]"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#145c91] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#104d7b] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span>{authMode === "login" ? "Signing In..." : "Creating Account..."}</span>
                  ) : (
                    <>
                      <span>
                        {authMode ===
                        "login"
                          ? t("submitSignIn", currentLanguage)
                          : t("submitSignUp", currentLanguage)}
                      </span>
                      <ArrowRight
                        size={18}
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#e3e9ee]" />

                <span className="text-[11px] font-semibold text-[#95a1ad]">
                  OR
                </span>

                <div className="h-px flex-1 bg-[#e3e9ee]" />
              </div>

              {authMode ===
              "login" ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(
                      "signup",
                    );
                    setError("");
                    if (onSignup) {
                      onSignup();
                    }
                  }}
                  className="w-full rounded-lg border border-[#cfdbe3] px-5 py-3.5 text-sm font-semibold text-[#38506a] transition hover:bg-[#f7fafc]"
                >
                  {t("dontHaveAccount", currentLanguage)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(
                      "login",
                    );
                    setError("");
                  }}
                  className="w-full rounded-lg border border-[#cfdbe3] px-5 py-3.5 text-sm font-semibold text-[#38506a] transition hover:bg-[#f7fafc]"
                >
                  {t("alreadyHaveAccount", currentLanguage)}
                </button>
              )}

              <div className="mt-7 flex gap-2 rounded-lg bg-[#f6fafc] p-3 text-[11px] leading-5 text-[#778799]">
                <LockKeyhole
                  size={15}
                  className="mt-0.5 shrink-0 text-[#1769a8]"
                />

                <span>
                  You can explore general scheme information without
                  signing in. Login is required only for personalized
                  scheme matching.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SCHEME FINDER
========================================================= */

function SchemeFinder({
  onBack,
  isLoggedIn,
  initialResults,
  initialFormData,
  onResultsReady,
  onNavigate,
  onApplyScheme,
  currentLanguage = "en",
  onLanguageChange,
}) {
  const [step, setStep] =
    useState(1);

  const [formData, setFormData] =
    useState(() => initialFormData || {
      fullName: "",
      age: "",
      gender: "",
      state: "",
      district: "",
      category: "",
      annualIncome: "",
      purpose: "",
      businessType: "",
      projectStage: "",
      projectCost: "",
      requiredLoan: "",
      course: "",
      institution: "",
      courseFee: "",
      educationLevel: "",
      ownContribution: "",
      existingLoan: "",
      outstandingAmount: "",
      overdue: "",
    });

  const [results, setResults] =
    useState(() => initialResults || null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const updateField = (
    field,
    value,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (step < 5) {
      setStep(
        (current) =>
          current + 1,
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep(
        (current) =>
          current - 1,
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const runSchemeMatching =
    async () => {
      setLoading(true);
      setError("");
      setResults(null);

      if (!formData.category) {
        setLoading(false);
        setError(
          t("valCategory", currentLanguage)
        );
        return;
      }

      if (!formData.gender) {
        setLoading(false);
        setError(
          t("valGender", currentLanguage)
        );
        return;
      }

      if (!formData.annualIncome) {
        setLoading(false);
        setError(
          t("valIncome", currentLanguage)
        );
        return;
      }

      if (!formData.purpose) {
        setLoading(false);
        setError(
          t("valRequirement", currentLanguage)
        );
        return;
      }

      const payload = {
        category:
          formData.category,

        gender:
          formData.gender ||
          null,

        annual_income:
          Number(
            formData.annualIncome ||
              0,
          ),

        purpose:
          formData.purpose ||
          null,

        project_cost:
          formData.projectCost
            ? Number(
                formData.projectCost,
              )
            : null,

        required_loan:
          formData.requiredLoan
            ? Number(
                formData.requiredLoan,
              )
            : null,

        education_level:
          formData.educationLevel ||
          null,
      };

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/schemes/match`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload,
              ),
            },
          );

        if (!response.ok) {
          let errorMessage =
            "Unable to get scheme recommendations.";

          try {
            const errorData =
              await response.json();

            if (
              errorData?.detail
            ) {
              errorMessage =
                Array.isArray(
                  errorData.detail,
                )
                  ? errorData.detail
                      .map(
                        (item) =>
                          item.msg ||
                          String(
                            item,
                          ),
                      )
                      .join(
                        ", ",
                      )
                  : String(
                      errorData.detail,
                    );
            }
          } catch {
            // Keep default error.
          }

          throw new Error(
            errorMessage,
          );
        }

        const data =
          await response.json();

        /*
          CRITICAL FIX:
          Sanitize backend results BEFORE
          sending them to SchemeResults.
        */
        const normalizedResults =
          normalizeSchemeResults(
            data,
            formData,
          );

        setResults(
          normalizedResults,
        );

        if (onResultsReady) {
          onResultsReady(normalizedResults, formData);
        }

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Unable to connect to the Scheme Saathi backend.",
        );
      } finally {
        setLoading(false);
      }
    };

  const isBusiness = [
    "new_business",
    "business_expansion",
    "agriculture",
  ].includes(
    formData.purpose,
  );

  const isEducation =
    formData.purpose ===
    "education";

  const stepTitles = [
    t("stepAboutYou", currentLanguage),
    t("stepRequirement", currentLanguage),
    t("stepProjectEducation", currentLanguage),
    t("stepFinancialProfile", currentLanguage),
    t("stepReview", currentLanguage),
  ];

  const progress =
    (step / 5) * 100;

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb] px-6">
        <div className="rounded-2xl border border-[#d8e3e9] bg-white p-8 text-center shadow-sm">
          <LockKeyhole
            size={32}
            className="mx-auto text-[#1769a8]"
          />

          <h2 className="mt-4 font-serif text-2xl font-bold text-[#172a43]">
            {t("loginRequired", currentLanguage)}
          </h2>

          <p className="mt-2 text-sm text-[#718096]">
            {t("loginRequiredDesc", currentLanguage)}
          </p>

          <button
            onClick={onBack}
            className="mt-6 rounded-lg bg-[#145c91] px-6 py-3 text-sm font-bold text-white"
          >
            {t("backToHome", currentLanguage)}
          </button>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <SchemeResults
        results={results}
        formData={formData}
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
        onBack={() => {
          setResults(null);
          setStep(5);
          setError("");

          window.scrollTo({
            top: 0,
            behavior:
              "smooth",
          });
        }}
        onHome={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <header className="border-b border-[#dce4ea] bg-white">
        <div className="mx-auto flex min-h-[80px] max-w-[1200px] items-center justify-between px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#53657b] transition hover:text-[#145c91]"
          >
            <ArrowLeft
              size={18}
            />
            {t("backToHome", currentLanguage)}
          </button>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="relative flex h-9 w-9 items-center justify-center text-[#c6a56b]">
              <div className="absolute inset-1 rotate-45 rounded-md border-2 border-[#c6a56b]" />

              <Sparkles
                size={17}
              />
            </div>

            <div>
              <p className="font-serif text-[17px] font-bold tracking-wide text-[#172a43]">
                SCHEME SAATHI
              </p>

              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#8090a0]">
                {t("findMyScheme", currentLanguage)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
            <div className="hidden items-center gap-2 text-xs font-semibold text-[#64758a] sm:flex">
              <LockKeyhole size={15} />
              {t("signedInProfile", currentLanguage)}
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-[#dfe7ed] bg-white">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1769a8]">
                {t("stepLabel", currentLanguage)}{" "}
                {String(
                  step,
                ).padStart(
                  2,
                  "0",
                )}{" "}
                {t("ofFive", currentLanguage)}
              </p>

              <h1 className="mt-1 font-serif text-2xl font-bold text-[#172a43]">
                {
                  stepTitles[
                    step - 1
                  ]
                }
              </h1>
            </div>

            <div className="w-full md:w-[360px]">
              <div className="mb-2 flex justify-between text-[11px] font-semibold text-[#7c8998]">
                <span>
                  {t("yourProgress", currentLanguage)}
                </span>

                <span>
                  {Math.round(
                    progress,
                  )}
                  %
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#e3ebf0]">
                <div
                  className="h-full rounded-full bg-[#1769a8] transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 hidden grid-cols-5 gap-3 md:grid">
            {stepTitles.map(
              (
                title,
                index,
              ) => {
                const currentStep =
                  index + 1;

                const completed =
                  currentStep <
                  step;

                const active =
                  currentStep ===
                  step;

                return (
                  <div
                    key={title}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
                        completed
                          ? "bg-[#1769a8] text-white"
                          : active
                            ? "border-2 border-[#1769a8] bg-white text-[#1769a8]"
                            : "bg-[#eef3f6] text-[#8492a0]",
                      ].join(
                        " ",
                      )}
                    >
                      {completed ? (
                        <Check
                          size={
                            14
                          }
                        />
                      ) : (
                        currentStep
                      )}
                    </div>

                    <span
                      className={[
                        "text-[11px] font-semibold",
                        active
                          ? "text-[#1769a8]"
                          : "text-[#82909f]",
                      ].join(
                        " ",
                      )}
                    >
                      {title}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1000px] px-6 py-10 pb-20">
        <div className="rounded-2xl border border-[#d9e2e9] bg-white p-6 shadow-[0_12px_35px_rgba(46,75,98,0.08)] md:p-9">
          {step ===
            1 && (
            <StepOne
              formData={
                formData
              }
              updateField={
                updateField
              }
              currentLanguage={currentLanguage}
            />
          )}

          {step ===
            2 && (
            <StepTwo
              formData={
                formData
              }
              updateField={
                updateField
              }
              currentLanguage={currentLanguage}
            />
          )}

          {step ===
            3 && (
            <StepThree
              formData={
                formData
              }
              updateField={
                updateField
              }
              isBusiness={
                isBusiness
              }
              isEducation={
                isEducation
              }
              currentLanguage={currentLanguage}
            />
          )}

          {step ===
            4 && (
            <StepFour
              formData={
                formData
              }
              updateField={
                updateField
              }
              currentLanguage={currentLanguage}
            />
          )}

          {step ===
            5 && (
            <StepFive
              formData={
                formData
              }
              currentLanguage={currentLanguage}
            />
          )}

          {error && (
            <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#edc8c8] bg-[#fff5f5] p-4 text-sm text-[#a03a3a]">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-bold">
                  {t("matchingFailed", currentLanguage)}
                </p>

                <p className="mt-1 leading-5">
                  {error}
                </p>

                {!error.includes(
                  "Please",
                ) && (
                  <p className="mt-2 text-xs text-[#9b6666]">
                    {t("checkBackendRunning", currentLanguage)}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[#e1e7ec] pt-7 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={
                previousStep
              }
              disabled={
                step ===
                1
              }
              className={[
                "flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold",
                step === 1
                  ? "cursor-not-allowed text-[#b6bec7]"
                  : "text-[#52657b] transition hover:bg-[#f3f7fa]",
              ].join(" ")}
            >
              <ArrowLeft
                size={17}
              />
              {t("back", currentLanguage)}
            </button>

            {step <
            5 ? (
              <button
                onClick={
                  nextStep
                }
                className="flex items-center justify-center gap-2 rounded-lg bg-[#145c91] px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#104d7b]"
              >
                {t("continue", currentLanguage)}
                <ArrowRight
                  size={17}
                />
              </button>
            ) : (
              <button
                onClick={
                  runSchemeMatching
                }
                disabled={
                  loading
                }
                className={[
                  "flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-sm font-bold text-white shadow-md transition",
                  loading
                    ? "cursor-not-allowed bg-[#7d9aab]"
                    : "bg-[#145c91] hover:bg-[#104d7b]",
                ].join(
                  " ",
                )}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t("findingSchemes", currentLanguage)}
                  </>
                ) : (
                  <>
                    {t("findMyScheme", currentLanguage)}
                    <Sparkles
                      size={
                        17
                      }
                    />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SCHEME RESULTS
========================================================= */

function SchemeResults({
  results,
  formData,
  onBack,
  onHome,
  currentLanguage = "en",
  onLanguageChange,
}) {
  const primaryEligible =
    Array.isArray(
      results?.primary?.eligible,
    )
      ? results.primary
          .eligible
      : [];

  const primaryIneligible =
    Array.isArray(
      results?.primary?.ineligible,
    )
      ? results.primary
          .ineligible
      : [];

  const secondaryEligible =
    Array.isArray(
      results?.secondary?.eligible,
    )
      ? results.secondary
          .eligible
      : [];

  const primaryMatchCount =
    primaryEligible.length;

  const secondaryMatchCount =
    secondaryEligible.length;

  const topScheme =
    primaryEligible[0] ||
    null;

  /*
    IMPORTANT:
    The display score can NEVER recommend
    a women-focused scheme to a male applicant.

    Even if backend sends 100,
    explicit gender restriction wins.
  */
  const backendMatchScore =
    results?.match_score ??
    results?.overall_match_score ??
    topScheme?.match_score ??
    null;

  const matchScore =
    backendMatchScore !==
      null &&
    backendMatchScore !==
      undefined
      ? normalizeMatchScore(
          backendMatchScore,
        )
      : calculateFallbackMatchScore(
          topScheme,
          formData,
        );

  /*
    Top scheme score.
  */
  const topSchemeScore =
    topScheme &&
    shouldExcludeForGender(
      topScheme,
      formData,
    )
      ? 0
      : normalizeMatchScore(
          topScheme?.match_score,
        ) ??
        calculateFallbackMatchScore(
          topScheme,
          formData,
        );

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <header className="sticky top-0 z-50 border-b border-[#dce4ea] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[82px] max-w-[1200px] items-center justify-between px-6">
          <button
            onClick={onHome}
            className="flex items-center gap-2 text-sm font-semibold text-[#53657b] transition hover:text-[#145c91]"
          >
            <ArrowLeft
              size={18}
            />
            {t("home", currentLanguage)}
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center text-[#c6a56b]">
              <div className="absolute inset-1 rotate-45 rounded-md border-2 border-[#c6a56b]" />

              <Sparkles
                size={17}
              />
            </div>

            <p className="font-serif text-[18px] font-bold tracking-wide text-[#172a43]">
              SCHEME SAATHI
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-10 pb-20">
        <div className="rounded-2xl border border-[#cee0e8] bg-[#eaf6fa] p-7">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center md:gap-10">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.17em] text-[#1769a8]">
                {t("eligibilityCheckComplete", currentLanguage)}
              </p>

              <h1 className="mt-2 font-serif text-3xl font-bold text-[#17334f] md:text-4xl">
                {t("schemesYouMayBeEligibleFor", currentLanguage)}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#60758a]">
                {t("resultsDisclaimer", currentLanguage)}
              </p>
            </div>

            <div className="flex h-[122px] w-[122px] shrink-0 flex-col items-center justify-center rounded-full border-[8px] border-white bg-[#d6eaf2] shadow-sm">
              <div className="flex h-[44px] items-baseline justify-center">
                <span className="font-serif text-[36px] font-bold leading-none text-[#145c91]">
                  {matchScore !==
                  null
                    ? matchScore
                    : "—"}
                </span>

                {matchScore !==
                  null && (
                  <span className="ml-0.5 font-serif text-[18px] font-bold leading-none text-[#145c91]">
                    %
                  </span>
                )}
              </div>

              <span className="mt-1 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-[#6a7d8e]">
                {t("matchScore", currentLanguage)}
              </span>
            </div>
          </div>
        </div>

        {topScheme && (
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles
                size={18}
                className="text-[#c19855]"
              />

              <p className="text-[11px] font-bold tracking-[0.16em] text-[#7a6a50]">
                {t("topEligiblePrimaryScheme", currentLanguage)}
              </p>
            </div>

            <div className="rounded-2xl border-2 border-[#35536a] bg-white p-7 shadow-[0_14px_40px_rgba(46,75,98,0.1)]">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#e7f3f8] px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-[#1769a8]">
                      {
                        topScheme.scheme_id
                      }
                    </span>

                    <span className="rounded-full bg-[#edf6ec] px-3 py-1 text-[10px] font-bold text-[#47744a]">
                      {t("eligible", currentLanguage)}
                    </span>

                    <span className="rounded-full bg-[#eaf5fa] px-3 py-1 text-[10px] font-bold text-[#145c91]">
                      {topSchemeScore}%
                      {" "}
                      {t("match", currentLanguage)}
                    </span>
                  </div>

                  <h2 className="mt-4 font-serif text-3xl font-bold text-[#1b3148]">
                    {
                      topScheme.scheme_name
                    }
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#6e7f91]">
                    {t("topSchemePassedDesc", currentLanguage)}
                  </p>
                </div>

                <div className="rounded-xl bg-[#f7fafc] p-5 md:min-w-[260px]">
                  <p className="text-[11px] font-semibold text-[#7f8c99]">
                    {t("matchingReasons", currentLanguage)}
                  </p>

                  <div className="mt-3 space-y-3">
                    {(
                      topScheme.reasons ||
                      []
                    ).map(
                      (reason) => (
                        <ReasonRow
                          key={
                            reason
                          }
                          text={
                            reason
                          }
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>

              {topScheme.gender_status
                ?.message && (
                <div className="mt-6 rounded-xl border border-[#e3d7bf] bg-[#fbf7ee] p-4">
                  <div className="flex gap-3">
                    <Sparkles
                      size={17}
                      className="mt-0.5 shrink-0 text-[#ad8245]"
                    />

                    <p className="text-xs leading-5 text-[#756447]">
                      {
                        topScheme
                          .gender_status
                          .message
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#1769a8]">
                {t("primaryRecommendations", currentLanguage)}
              </p>

              <h2 className="mt-1 font-serif text-2xl font-bold text-[#20344b]">
                {t("eligibleCoreSchemes", currentLanguage)}
              </h2>
            </div>

            <span className="text-xs font-semibold text-[#7a8998]">
              {primaryMatchCount}{" "}
              {t("eligibleCount", currentLanguage)}
            </span>
          </div>

          {primaryEligible.length ===
          0 ? (
            <EmptyState
              title={t("noPrimaryMatched", currentLanguage)}
              text={t("noPrimaryMatchedDesc", currentLanguage)}
            />
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {primaryEligible.map(
                (scheme) => (
                  <EligibleSchemeCard
                    key={
                      scheme.scheme_id
                    }
                    scheme={scheme}
                    formData={
                      formData
                    }
                    currentLanguage={currentLanguage}
                    featured={
                      scheme.scheme_id ===
                      topScheme?.scheme_id
                    }
                    onApply={onApplyScheme}
                    onNavigate={onNavigate}
                  />
                ),
              )}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#7a8998]">
                {t("secondarySupport", currentLanguage)}
              </p>

              <h2 className="mt-1 font-serif text-2xl font-bold text-[#20344b]">
                {t("connectedSupport", currentLanguage)}
              </h2>
            </div>

            <span className="text-xs font-semibold text-[#7a8998]">
              {secondaryMatchCount}{" "}
              {t("availableCount", currentLanguage)}
            </span>
          </div>

          {secondaryEligible.length ===
          0 ? (
            <EmptyState
              title={t("noSecondaryMatched", currentLanguage)}
              text={t("noSecondaryMatchedDesc", currentLanguage)}
            />
          ) : (
            <div className="mt-5 grid gap-5">
              {secondaryEligible.map(
                (scheme) => (
                  <EligibleSchemeCard
                    key={
                      scheme.scheme_id
                    }
                    scheme={scheme}
                    formData={
                      formData
                    }
                    currentLanguage={currentLanguage}
                    secondary
                    onApply={onApplyScheme}
                    onNavigate={onNavigate}
                  />
                ),
              )}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#8c6e6e]">
              {t("notEligible", currentLanguage)}
            </p>

            <h2 className="mt-1 font-serif text-2xl font-bold text-[#48343d]">
              {t("filteredOutSchemes", currentLanguage)}
            </h2>

            <p className="mt-2 text-sm text-[#7b8087]">
              {t("filteredOutDesc", currentLanguage)}
            </p>
          </div>

          {primaryIneligible.length ===
          0 ? (
            <div className="mt-5 rounded-xl border border-[#dfe9df] bg-white p-5 text-sm text-[#607a60]">
              {t("noSchemesFilteredOut", currentLanguage)}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {primaryIneligible.map(
                (scheme) => (
                  <div
                    key={
                      `${scheme.scheme_id}-${scheme.eligibility_status || "ineligible"}`
                    }
                    className="rounded-xl border border-[#eadfe1] bg-white p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-[#f3f0f1] px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-[#7f6d74]">
                            {
                              scheme.scheme_id
                            }
                          </span>

                          <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-[10px] font-bold text-[#a44c4c]">
                            {t("notEligible", currentLanguage)}
                          </span>

                          {scheme.match_score ===
                            0 &&
                            scheme.eligibility_status ===
                              "NOT_ELIGIBLE_GENDER" && (
                              <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-[10px] font-bold text-[#a44c4c]">
                                {t("zeroMatch", currentLanguage)}
                              </span>
                            )}
                        </div>

                        <h3 className="mt-3 font-serif text-xl font-bold text-[#3b3138]">
                          {
                            scheme.scheme_name
                          }
                        </h3>
                      </div>

                      <div className="max-w-[560px] space-y-2">
                        {(
                          scheme.failures ||
                          []
                        ).length ===
                        0 ? (
                          <div className="text-xs text-[#8a747a]">
                            No detailed failure reason was returned by the
                            backend.
                          </div>
                        ) : (
                          (
                            scheme.failures ||
                            []
                          ).map(
                            (
                              failure,
                              index,
                            ) => (
                              <div
                                key={`${failure}-${index}`}
                                className="flex gap-2 text-xs leading-5 text-[#915858]"
                              >
                                <AlertCircle
                                  size={
                                    15
                                  }
                                  className="mt-0.5 shrink-0"
                                />

                                <span>
                                  {
                                    failure
                                  }
                                </span>
                              </div>
                            ),
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className="mt-12 rounded-2xl border border-[#d7e2e8] bg-white p-7">
          <div className="flex items-start gap-3">
            <Bot
              size={21}
              className="mt-0.5 shrink-0 text-[#1769a8]"
            />

            <div>
              <h3 className="font-serif text-xl font-bold text-[#263b52]">
                {t("whatHappensNext", currentLanguage)}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#6e7f91]">
                {t("whatHappensNextDesc", currentLanguage)}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={
              onBack
            }
            className="flex items-center gap-2 rounded-lg border border-[#cfdbe3] bg-white px-5 py-3 text-sm font-semibold text-[#38506a] transition hover:bg-[#f7fafc]"
          >
            <ArrowLeft
              size={17}
            />
            {t("backToProfile", currentLanguage)}
          </button>

          <button
            onClick={
              onHome
            }
            className="flex items-center gap-2 rounded-lg bg-[#145c91] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#104d7b]"
          >
            {t("backToHome", currentLanguage)}
          </button>
        </div>

        <div className="mt-8 text-xs text-[#8a97a3]">
          {t("submittedProfile", currentLanguage)}{" "}
          {formData.fullName ||
            t("applicant", currentLanguage)}{" "}
          • {t("categoryLabel", currentLanguage)}{" "}
          {formData.category ||
            t("notSelected", currentLanguage)}{" "}
          •{" "}
          {formData.state
            ? formatValue(
                formData.state,
              )
            : t("locationNotProvided", currentLanguage)}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   STEP 1
========================================================= */

function StepOne({
  formData,
  updateField,
  currentLanguage = "en",
}) {
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchStates = async () => {
      setLocationLoading(true);
      setLocationError("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/locations/states`);
        if (!response.ok) throw new Error("Failed to fetch states");
        const data = await response.json();
        if (active) {
          setStatesList(data.states || []);
        }
      } catch {
        if (active) {
          setLocationError(t("failedLoadStates", currentLanguage));
          setStatesList([]);
        }
      } finally {
        if (active) {
          setLocationLoading(false);
        }
      }
    };

    fetchStates();

    return () => {
      active = false;
    };
  }, [currentLanguage]);

  useEffect(() => {
    if (!formData.state) return;
    let active = true;

    const fetchDistricts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/locations/states/${encodeURIComponent(formData.state)}/districts`,
        );
        if (!response.ok) throw new Error("Failed to fetch districts");
        const data = await response.json();
        if (active) {
          setDistrictsList(data.districts || []);
        }
      } catch {
        if (active) {
          setDistrictsList([]);
        }
      }
    };

    fetchDistricts();

    return () => {
      active = false;
    };
  }, [formData.state]);

  const handleStateChange = (value) => {
    updateField("state", value);
    updateField("district", "");
    if (!value) {
      setDistrictsList([]);
    }
  };
  return (
    <div>
      <SectionIntro
        eyebrow={t("personalInfoEyebrow", currentLanguage)}
        title={t("tellUsAboutYourself", currentLanguage)}
        description={t("personalInfoDesc", currentLanguage)}
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <TextField
          label={t("fullName", currentLanguage)}
          placeholder={t("enterFullName", currentLanguage)}
          value={
            formData.fullName
          }
          onChange={(value) =>
            updateField(
              "fullName",
              value,
            )
          }
        />

        <TextField
          label={t("age", currentLanguage)}
          placeholder={t("enterAge", currentLanguage)}
          type="number"
          value={
            formData.age
          }
          onChange={(value) =>
            updateField(
              "age",
              value,
            )
          }
        />

        <SelectField
          label={t("gender", currentLanguage)}
          currentLanguage={currentLanguage}
          value={
            formData.gender
          }
          onChange={(value) =>
            updateField(
              "gender",
              value,
            )
          }
          options={[
            {
              value: "female",
              label: t("female", currentLanguage),
            },
            {
              value: "male",
              label: t("male", currentLanguage),
            },
            {
              value: "other",
              label: t("other", currentLanguage),
            },
            {
              value: "prefer_not",
              label: t("preferNotToSay", currentLanguage),
            },
          ]}
        />

        <SelectField
          label={t("category", currentLanguage)}
          currentLanguage={currentLanguage}
          helper={t("catHelper", currentLanguage)}
          value={
            formData.category
          }
          onChange={(value) =>
            updateField(
              "category",
              value,
            )
          }
          options={[
            {
              value: "SC",
              label: t("catSC", currentLanguage),
            },
            {
              value: "ST",
              label: t("catST", currentLanguage),
            },
            {
              value: "OBC",
              label: t("catOBC", currentLanguage),
            },
            {
              value: "GENERAL",
              label: t("catGeneral", currentLanguage),
            },
            {
              value: "EWS",
              label: t("catEWS", currentLanguage),
            },
            {
              value:
                "SAFAI_KARAMCHARI",
              label: t("catSafaiKaramchari", currentLanguage),
            },
          ]}
        />

        <SelectField
          label={t("state", currentLanguage)}
          currentLanguage={currentLanguage}
          value={
            formData.state
          }
          onChange={handleStateChange}
          options={
            locationLoading
              ? []
              : statesList.map((s) => ({
                  value: s.name,
                  label: s.name,
                }))
          }
          helper={
            locationError
              ? locationError
              : locationLoading
              ? t("loadingStates", currentLanguage)
              : undefined
          }
        />

        <SelectField
          label={t("district", currentLanguage)}
          currentLanguage={currentLanguage}
          value={
            formData.district
          }
          onChange={(value) =>
            updateField("district", value)
          }
          options={
            !formData.state
              ? []
              : districtsList.map((d) => ({
                  value: d,
                  label: d,
                }))
          }
          helper={
            !formData.state
              ? t("selectStateFirst", currentLanguage)
              : undefined
          }
          disabled={!formData.state}
        />

        <TextField
          label={t("annualIncome", currentLanguage)}
          prefix="₹"
          type="number"
          placeholder="e.g. 320000"
          value={
            formData.annualIncome
          }
          onChange={(value) =>
            updateField(
              "annualIncome",
              value,
            )
          }
        />
      </div>

      <InfoBox
        icon={
          <ShieldCheck
            size={18}
          />
        }
      >
        {t("infoBox1", currentLanguage)}
      </InfoBox>
    </div>
  );
}

/* =========================================================
   STEP 2
========================================================= */

function StepTwo({
  formData,
  updateField,
  currentLanguage = "en",
}) {
  const purposes = [
    {
      value: "new_business",
      icon: (
        <Sparkles size={24} />
      ),
      title: t("startNewBusiness", currentLanguage),
      text: t("startNewBusinessDesc", currentLanguage),
    },

    {
      value:
        "business_expansion",
      icon: (
        <ArrowRight
          size={24}
        />
      ),
      title: t("expandBusiness", currentLanguage),
      text: t("expandBusinessDesc", currentLanguage),
    },

    {
      value: "agriculture",
      icon: (
        <MapPin size={24} />
      ),
      title: t("agricultureAllied", currentLanguage),
      text: t("agricultureAlliedDesc", currentLanguage),
    },

    {
      value: "education",
      icon: (
        <FileText
          size={24}
        />
      ),
      title: t("education", currentLanguage),
      text: t("educationDesc", currentLanguage),
    },

    {
      value: "skill",
      icon: <Bot size={24} />,
      title: t("skillVocational", currentLanguage),
      text: t("skillVocationalDesc", currentLanguage),
    },
  ];

  return (
    <div>
      <SectionIntro
        eyebrow={t("requirementEyebrow", currentLanguage)}
        title={t("needSupportTitle", currentLanguage)}
        description={t("needSupportSubtitle", currentLanguage)}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {purposes.map(
          (purpose) => {
            const selected =
              formData.purpose ===
              purpose.value;

            return (
              <button
                key={
                  purpose.value
                }
                type="button"
                onClick={() =>
                  updateField(
                    "purpose",
                    purpose.value,
                  )
                }
                className={[
                  "group relative flex items-start gap-4 rounded-xl border-2 p-5 text-left transition",
                  selected
                    ? "border-[#1769a8] bg-[#eef7fb] shadow-sm"
                    : "border-[#dce4ea] bg-white hover:border-[#a9c8da] hover:bg-[#f8fbfd]",
                ].join(
                  " ",
                )}
              >
                <div
                  className={[
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    selected
                      ? "bg-[#1769a8] text-white"
                      : "bg-[#e8f3f8] text-[#1769a8]",
                  ].join(
                    " ",
                  )}
                >
                  {
                    purpose.icon
                  }
                </div>

                <div className="pr-7">
                  <h3 className="font-serif text-[17px] font-bold text-[#1d3048]">
                    {
                      purpose.title
                    }
                  </h3>

                  <p className="mt-1 text-[12px] leading-5 text-[#718096]">
                    {
                      purpose.text
                    }
                  </p>
                </div>

                {selected && (
                  <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#1769a8] text-white">
                    <Check
                      size={14}
                    />
                  </div>
                )}
              </button>
            );
          },
        )}
      </div>

      <InfoBox
        icon={
          <Bot size={18} />
        }
      >
        {t("infoBox2", currentLanguage)}
      </InfoBox>
    </div>
  );
}

/* =========================================================
   STEP 3
========================================================= */

function StepThree({
  formData,
  updateField,
  isBusiness,
  isEducation,
  currentLanguage = "en",
}) {
  return (
    <div>
      <SectionIntro
        eyebrow={t("projectEducationEyebrow", currentLanguage)}
        title={
          isEducation
            ? t("eduTitle", currentLanguage)
            : t("projectTitle", currentLanguage)
        }
        description={
          isEducation
            ? t("eduDesc", currentLanguage)
            : t("projectDesc", currentLanguage)
        }
      />

      {isEducation ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <SelectField
            label={t("educationLevel", currentLanguage)}
            currentLanguage={currentLanguage}
            value={
              formData.educationLevel
            }
            onChange={(value) =>
              updateField(
                "educationLevel",
                value,
              )
            }
            options={[
              {
                value:
                  "professional",
                label: t("eduProfessional", currentLanguage),
              },
              {
                value:
                  "undergraduate",
                label: t("eduUndergraduate", currentLanguage),
              },
              {
                value:
                  "postgraduate",
                label: t("eduPostgraduate", currentLanguage),
              },
              {
                value: "other",
                label: t("other", currentLanguage),
              },
            ]}
          />

          <TextField
            label={t("course", currentLanguage)}
            placeholder="e.g. B.Tech Computer Science"
            value={
              formData.course
            }
            onChange={(value) =>
              updateField(
                "course",
                value,
              )
            }
          />

          <TextField
            label={t("institution", currentLanguage)}
            placeholder={t("enterInstitution", currentLanguage)}
            value={
              formData.institution
            }
            onChange={(value) =>
              updateField(
                "institution",
                value,
              )
            }
          />

          <TextField
            label={t("courseFee", currentLanguage)}
            prefix="₹"
            type="number"
            placeholder="e.g. 800000"
            value={
              formData.courseFee
            }
            onChange={(value) =>
              updateField(
                "courseFee",
                value,
              )
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <SelectField
            label={t("projectBusinessType", currentLanguage)}
            currentLanguage={currentLanguage}
            value={
              formData.businessType
            }
            onChange={(value) =>
              updateField(
                "businessType",
                value,
              )
            }
            options={[
              {
                value:
                  "tailoring",
                label: t("bizTailoring", currentLanguage),
              },
              {
                value:
                  "retail",
                label: t("bizRetail", currentLanguage),
              },
              {
                value: "food",
                label: t("bizFood", currentLanguage),
              },
              {
                value: "dairy",
                label: t("bizDairy", currentLanguage),
              },
              {
                value:
                  "services",
                label: t("bizServices", currentLanguage),
              },
              {
                value:
                  "manufacturing",
                label: t("bizManufacturing", currentLanguage),
              },
              {
                value: "other",
                label: t("other", currentLanguage),
              },
            ]}
          />

          <SelectField
            label={t("projectStage", currentLanguage)}
            currentLanguage={currentLanguage}
            value={
              formData.projectStage
            }
            onChange={(value) =>
              updateField(
                "projectStage",
                value,
              )
            }
            options={[
              {
                value: "new",
                label: t("newProject", currentLanguage),
              },
              {
                value:
                  "existing",
                label: t("existingProject", currentLanguage),
              },
            ]}
          />

          <TextField
            label={t("estimatedProjectCost", currentLanguage)}
            prefix="₹"
            type="number"
            placeholder="e.g. 300000"
            value={
              formData.projectCost
            }
            onChange={(value) =>
              updateField(
                "projectCost",
                value,
              )
            }
          />

          <TextField
            label={t("requiredLoanAmount", currentLanguage)}
            prefix="₹"
            type="number"
            placeholder="e.g. 250000"
            value={
              formData.requiredLoan
            }
            onChange={(value) =>
              updateField(
                "requiredLoan",
                value,
              )
            }
          />
        </div>
      )}

      {isBusiness && (
        <div className="mt-6 rounded-xl border border-[#dbe6ec] bg-[#f8fbfd] p-5">
          <div className="flex gap-3">
            <Bot
              className="mt-0.5 shrink-0 text-[#1769a8]"
              size={19}
            />

            <div>
              <p className="text-sm font-bold text-[#284159]">
                {t("whyWeAskThis", currentLanguage)}
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6d7d8f]">
                {t("whyWeAskThisDesc", currentLanguage)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STEP 4
========================================================= */

function StepFour({
  formData,
  updateField,
  currentLanguage = "en",
}) {
  return (
    <div>
      <SectionIntro
        eyebrow={t("finProfileEyebrow", currentLanguage)}
        title={t("finTitle", currentLanguage)}
        description={t("finDesc", currentLanguage)}
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <TextField
          label={t("ownContribution", currentLanguage)}
          prefix="₹"
          type="number"
          placeholder="e.g. 50000"
          value={
            formData.ownContribution
          }
          onChange={(value) =>
            updateField(
              "ownContribution",
              value,
            )
          }
        />

        <SelectField
          label={t("existingLoan", currentLanguage)}
          currentLanguage={currentLanguage}
          value={
            formData.existingLoan
          }
          onChange={(value) =>
            updateField(
              "existingLoan",
              value,
            )
          }
          options={[
            {
              value: "no",
              label: t("no", currentLanguage),
            },
            {
              value: "yes",
              label: t("yes", currentLanguage),
            },
          ]}
        />

        {formData.existingLoan ===
          "yes" && (
          <>
            <TextField
              label={t("outstandingAmount", currentLanguage)}
              prefix="₹"
              type="number"
              placeholder="e.g. 90000"
              value={
                formData.outstandingAmount
              }
              onChange={(value) =>
                updateField(
                  "outstandingAmount",
                  value,
                )
              }
            />

            <SelectField
              label={t("existingOverdue", currentLanguage)}
              currentLanguage={currentLanguage}
              value={
                formData.overdue
              }
              onChange={(value) =>
                updateField(
                  "overdue",
                  value,
                )
              }
              options={[
                {
                  value: "no",
                  label: t("no", currentLanguage),
                },
                {
                  value: "yes",
                  label: t("yes", currentLanguage),
                },
                {
                  value:
                    "not_sure",
                  label: t("notSure", currentLanguage),
                },
              ]}
            />
          </>
        )}
      </div>

      <InfoBox
        icon={
          <ShieldCheck
            size={18}
          />
        }
      >
        {t("infoBox4", currentLanguage)}
      </InfoBox>
    </div>
  );
}

/* =========================================================
   STEP 5
========================================================= */

function StepFive({
  formData,
  currentLanguage = "en",
}) {
  const purposeLabels = {
    new_business:
      t("startNewBusiness", currentLanguage),

    business_expansion:
      t("expandBusiness", currentLanguage),

    agriculture:
      t("agricultureAllied", currentLanguage),

    education:
      t("education", currentLanguage),

    skill:
      t("skillVocational", currentLanguage),
  };

  const genderLabels = {
    female: t("female", currentLanguage),
    male: t("male", currentLanguage),
    other: t("other", currentLanguage),
    prefer_not:
      t("preferNotToSay", currentLanguage),
  };

  const categoryLabels = {
    SC:
      t("catSC", currentLanguage),

    ST:
      t("catST", currentLanguage),

    OBC:
      t("catOBC", currentLanguage),

    GENERAL:
      t("catGeneral", currentLanguage),

    EWS:
      t("catEWS", currentLanguage),

    SAFAI_KARAMCHARI:
      t("catSafaiKaramchari", currentLanguage),
  };

  return (
    <div>
      <SectionIntro
        eyebrow={t("finalReviewEyebrow", currentLanguage)}
        title={t("reviewTitle", currentLanguage)}
        description={t("reviewDesc", currentLanguage)}
      />

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <ReviewCard
          title={t("personalInformation", currentLanguage)}
          icon={
            <UserRound
              size={20}
            />
          }
          rows={[
            [
              t("name", currentLanguage),
              formData.fullName ||
                t("notProvided", currentLanguage),
            ],

            [
              t("age", currentLanguage),
              formData.age ||
                t("notProvided", currentLanguage),
            ],

            [
              t("gender", currentLanguage),
              genderLabels[
                formData.gender
              ] ||
                t("notSelected", currentLanguage),
            ],

            [
              t("category", currentLanguage),
              categoryLabels[
                formData.category
              ] ||
                t("notSelected", currentLanguage),
            ],

            [
              t("state", currentLanguage),
              formatValue(
                formData.state,
              ),
            ],

            [
              t("district", currentLanguage),
              formData.district ||
                t("notProvided", currentLanguage),
            ],

            [
              t("annualIncome", currentLanguage),
              formData.annualIncome
                ? formatCurrency(
                    formData.annualIncome,
                  )
                : t("notProvided", currentLanguage),
            ],
          ]}
        />

        <ReviewCard
          title={t("requirement", currentLanguage)}
          icon={
            <Sparkles
              size={20}
            />
          }
          rows={[
            [
              t("purpose", currentLanguage),
              purposeLabels[
                formData.purpose
              ] ||
                t("notSelected", currentLanguage),
            ],

            [
              t("projectBusinessType", currentLanguage),
              formatValue(
                formData.businessType,
              ),
            ],

            [
              t("projectStage", currentLanguage),
              formatValue(
                formData.projectStage,
              ),
            ],

            [
              t("estimatedProjectCost", currentLanguage),
              formData.projectCost
                ? formatCurrency(
                    formData.projectCost,
                  )
                : t("notProvided", currentLanguage),
            ],

            [
              t("requiredLoanAmount", currentLanguage),
              formData.requiredLoan
                ? formatCurrency(
                    formData.requiredLoan,
                  )
                : t("notProvided", currentLanguage),
            ],
          ]}
        />

        <ReviewCard
          title={t("education", currentLanguage)}
          icon={
            <FileText
              size={20}
            />
          }
          rows={[
            [
              t("educationLevel", currentLanguage),
              formatValue(
                formData.educationLevel,
              ),
            ],

            [
              t("course", currentLanguage),
              formData.course ||
                t("notProvided", currentLanguage),
            ],

            [
              t("institution", currentLanguage),
              formData.institution ||
                t("notProvided", currentLanguage),
            ],

            [
              t("courseFee", currentLanguage),
              formData.courseFee
                ? formatCurrency(
                    formData.courseFee,
                  )
                : t("notProvided", currentLanguage),
            ],
          ]}
        />

        <ReviewCard
          title={t("stepFinancialProfile", currentLanguage)}
          icon={
            <Calculator
              size={20}
            />
          }
          rows={[
            [
              t("ownContribution", currentLanguage),
              formData.ownContribution
                ? formatCurrency(
                    formData.ownContribution,
                  )
                : t("notProvided", currentLanguage),
            ],

            [
              t("existingLoan", currentLanguage),
              formData.existingLoan ===
              "yes"
                ? t("yes", currentLanguage)
                : formData.existingLoan ===
                    "no"
                  ? t("no", currentLanguage)
                  : t("notSelected", currentLanguage),
            ],

            [
              t("outstandingAmount", currentLanguage),
              formData.outstandingAmount
                ? formatCurrency(
                    formData.outstandingAmount,
                  )
                : t("notProvided", currentLanguage),
            ],

            [
              t("existingOverdue", currentLanguage),
              formData.overdue === "yes"
                ? t("yes", currentLanguage)
                : formData.overdue === "no"
                ? t("no", currentLanguage)
                : t("notSelected", currentLanguage),
            ],
          ]}
        />
      </div>

      <div className="mt-7 rounded-xl border border-[#cfe0ea] bg-[#edf7fb] p-5">
        <div className="flex gap-3">
          <Bot
            className="mt-0.5 shrink-0 text-[#1769a8]"
            size={20}
          />

          <div>
            <p className="font-bold text-[#244058]">
              {t("whatHappensNext", currentLanguage)}
            </p>

            <p className="mt-1 text-xs leading-6 text-[#62768a]">
              {t("whatHappensNextDesc", currentLanguage)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SHARED COMPONENTS
========================================================= */

function SectionIntro({
  eyebrow,
  title,
  description,
}) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.16em] text-[#1769a8]">
        {eyebrow}
      </p>

      <h2 className="mt-2 max-w-[700px] font-serif text-[32px] font-bold leading-tight text-[#172a43]">
        {title}
      </h2>

      <p className="mt-3 max-w-[700px] text-[14px] leading-6 text-[#6d7d8f]">
        {description}
      </p>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  prefix,
}) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-[13px] font-bold text-[#2c4058]">
          {label}
        </span>
      ) : null}

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#7a8998]">
            {prefix}
          </span>
        )}

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className={[
            "w-full rounded-lg border border-[#ced9e1] bg-white px-4 py-3.5 text-sm text-[#21364f] outline-none transition",
            "placeholder:text-[#a1acb6] focus:border-[#1769a8] focus:ring-4 focus:ring-[#1769a8]/10",
            prefix
              ? "pl-9 rtl:pl-4 rtl:pr-9"
              : "",
          ].join(" ")}
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  helper,
  value,
  onChange,
  options,
  disabled = false,
  placeholder,
  currentLanguage = "en",
}) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-[13px] font-bold text-[#2c4058]">
          {label}
        </span>
      ) : null}

      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          className="w-full appearance-none rounded-lg border border-[#ced9e1] bg-white px-4 py-3.5 pr-10 rtl:pr-4 rtl:pl-10 text-sm text-[#21364f] outline-none transition focus:border-[#1769a8] focus:ring-4 focus:ring-[#1769a8]/10 disabled:bg-[#f1f5f9] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <option value="">
            {placeholder || t("selectAnOption", currentLanguage)}
          </option>

          {options.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            ),
          )}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-[#718096]"
        />
      </div>

      {helper && (
        <span className="mt-1.5 block text-[10px] text-[#8a97a4]">
          {helper}
        </span>
      )}
    </label>
  );
}

function InfoBox({
  icon,
  children,
}) {
  return (
    <div className="mt-8 flex gap-3 rounded-xl border border-[#d8e6ed] bg-[#f4fafc] p-4">
      <div className="mt-0.5 shrink-0 text-[#1769a8]">
        {icon}
      </div>

      <p className="text-xs leading-5 text-[#60758a]">
        {children}
      </p>
    </div>
  );
}

function ReviewCard({
  title,
  icon,
  rows,
}) {
  return (
    <div className="rounded-xl border border-[#dbe3e9] bg-[#fbfcfd] p-5">
      <div className="flex items-center gap-3 border-b border-[#e5eaee] pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e5f2f8] text-[#1769a8]">
          {icon}
        </div>

        <h3 className="font-serif text-[17px] font-bold text-[#263a52]">
          {title}
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map(
          ([label, value]) => (
            <div
              key={
                label
              }
              className="flex items-start justify-between gap-5 text-xs"
            >
              <span className="text-[#7a8998]">
                {label}
              </span>

              <span className="max-w-[60%] text-right font-semibold text-[#2b4058]">
                {value}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function TrustItem({
  icon,
  text,
}) {
  return (
    <div className="flex items-center gap-2 text-[13px] font-medium text-[#34475d]">
      <span className="text-[#17669a]">
        {icon}
      </span>

      {text}
    </div>
  );
}

function MatchPoint({
  icon,
  title,
  subtitle,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#dcecf4] text-[#1769a8]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold leading-4 text-[#25374c]">
          {title}
        </p>

        <p className="text-[10px] leading-4 text-[#718196]">
          {subtitle}
        </p>
      </div>

      <CheckCircle2
        size={15}
        className="mt-1 shrink-0 text-[#3d9a87]"
      />
    </div>
  );
}

function FeatureStrip({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-5 lg:px-7">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#17669a] shadow-sm ring-1 ring-[#e5ded3]">
        {icon}
      </div>

      <div>
        <h3 className="font-serif text-[16px] font-bold text-[#1d2d42]">
          {title}
        </h3>

        <p className="mt-1 text-[11px] leading-5 text-[#657487]">
          {text}
        </p>
      </div>
    </div>
  );
}

function ProcessStep({
  number,
  icon,
  title,
  text,
  iconClass,
}) {
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <div
        className={`flex h-[76px] w-[76px] items-center justify-center rounded-full shadow-sm ring-4 ring-white ${iconClass}`}
      >
        {icon}
      </div>

      <p className="mt-5 text-[11px] font-semibold text-[#8a9198]">
        {number}.
      </p>

      <h3 className="mt-1 font-serif text-[17px] font-bold text-[#25364a]">
        {title}
      </h3>

      <p className="mt-2 max-w-[210px] text-[12px] leading-5 text-[#718096]">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   EXPLORE CARD
========================================================= */

function SchemeCard({
  code,
  title,
  description,
  rate,
  limit,
  loan,
  eligibility,
  documents,
  route,
  icon,
  currentLanguage = "en",
  onApply,
  onNavigate,
}) {
  return (
    <div className="group rounded-2xl border border-[#d8e3e9] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f4f9] text-[#1769a8]">
          {icon}
        </div>

        <span className="rounded-full bg-[#f1f5f8] px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-[#768797]">
          {code}
        </span>
      </div>

      <h3 className="mt-6 font-serif text-xl font-bold text-[#1d3048]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#718096]">
        {description}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#f7fafc] p-3">
          <p className="text-[10px] text-[#84919d]">
            {t("interestRate", currentLanguage)}
          </p>

          <p className="mt-1 text-sm font-bold text-[#145c91]">
            {rate}
          </p>
        </div>

        <div className="rounded-lg bg-[#f7fafc] p-3">
          <p className="text-[10px] text-[#84919d]">
            {t("maxLoan", currentLanguage)}
          </p>

          <p className="mt-1 text-sm font-bold text-[#263b52]">
            {loan}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-[#e1e8ed] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8995a0]">
          {t("financialRange", currentLanguage)}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#60758a]">
          {limit}
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-[#f8fbfd] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1769a8]">
          {t("eligibilityTitle", currentLanguage)}
        </p>

        <div className="mt-3 space-y-2">
          {eligibility.map(
            (item) => (
              <div
                key={
                  item
                }
                className="flex items-start gap-2 text-xs leading-5 text-[#60758a]"
              >
                <CheckCircle2
                  size={14}
                  className="mt-0.5 shrink-0 text-[#3d9a87]"
                />

                <span>
                  {item}
                </span>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#fbf7ee] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a7047]">
          {t("indicativeDocuments", currentLanguage)}
        </p>

        <div className="mt-3 space-y-2">
          {documents.map(
            (document) => (
              <div
                key={
                  document
                }
                className="flex items-start gap-2 text-xs leading-5 text-[#756447]"
              >
                <FileText
                  size={14}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {document}
                </span>
              </div>
            ),
          )}
        </div>

        <p className="mt-3 text-[10px] leading-4 text-[#8a7b62]">
          {t("docRequirementsNote", currentLanguage)}
        </p>
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs font-semibold text-[#1769a8]">
        <MapPin
          size={15}
          className="mt-0.5 shrink-0"
        />

        <span>
          {t("applicationRoute", currentLanguage)}{" "}
          {route}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-[#edf2f6] pt-4">
        <button
          onClick={() => onApply?.({ id: code, name: title })}
          className="flex-1 rounded-xl bg-[#1769a8] py-2.5 text-center text-xs font-bold text-white shadow-sm transition hover:bg-[#12578c]"
        >
          {t("applyNowBtn", currentLanguage)}
        </button>
        <button
          onClick={() => onNavigate?.("tracking")}
          className="rounded-xl border border-[#cbd8e2] px-3.5 py-2.5 text-xs font-semibold text-[#506379] transition hover:bg-[#f0f5fa]"
        >
          {t("trackApplication", currentLanguage)}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ELIGIBLE RESULT CARD
========================================================= */

function EligibleSchemeCard({
  scheme,
  formData,
  featured = false,
  secondary = false,
  currentLanguage = "en",
  onApply,
  onNavigate,
}) {
  /*
    Absolute safety:
    even if this component accidentally receives
    a women-focused/non-female scheme,
    its displayed score becomes 0.
  */
  const schemeMatchScore =
    shouldExcludeForGender(
      scheme,
      formData,
    )
      ? 0
      : normalizeMatchScore(
          scheme?.match_score,
        ) ??
        calculateFallbackMatchScore(
          scheme,
          formData,
        );

  const reasons =
    Array.isArray(
      scheme?.reasons,
    )
      ? scheme.reasons
      : [];

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-6 shadow-sm",
        featured
          ? "border-2 border-[#35536a]"
          : "border-[#d8e3e9]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e7f3f8] px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-[#1769a8]">
              {
                scheme.scheme_id
              }
            </span>

            <span
              className={[
                "rounded-full px-3 py-1 text-[10px] font-bold",
                secondary
                  ? "bg-[#f1eef9] text-[#675685]"
                  : "bg-[#edf6ec] text-[#47744a]",
              ].join(
                " ",
              )}
            >
              {secondary
                ? t("connectedSupportBadge", currentLanguage)
                : t("eligible", currentLanguage)}
            </span>

            <span className="rounded-full bg-[#eaf5fa] px-3 py-1 text-[10px] font-bold text-[#145c91]">
              {
                schemeMatchScore
              }
              % {t("match", currentLanguage)}
            </span>
          </div>

          <h3 className="mt-4 font-serif text-xl font-bold text-[#20344b]">
            {
              getLocalizedSchemeName(
                scheme?.scheme_id || scheme?.id,
                scheme?.scheme_name,
                currentLanguage,
              )
            }
          </h3>
        </div>

        <CheckCircle2
          size={21}
          className="shrink-0 text-[#3d9a87]"
        />
      </div>

      <div className="mt-5 rounded-xl bg-[#f7fafc] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8995a0]">
          {t("whyItMatched", currentLanguage)}
        </p>

        {reasons.length ===
        0 ? (
          <p className="mt-3 text-xs text-[#718096]">
            {t("criteriaSatisfiedDesc", currentLanguage)}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {reasons.map(
              (reason) => (
                <ReasonRow
                  key={
                    reason
                  }
                  text={
                    reason
                  }
                />
              ),
            )}
          </div>
        )}
      </div>

      {scheme.gender_status
        ?.message && (
        <div className="mt-4 rounded-lg bg-[#fbf7ee] p-3 text-xs leading-5 text-[#756447]">
          {
            scheme
              .gender_status
              .message
          }
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 border-t border-[#e2eaf0] pt-4">
        <button
          onClick={() =>
            onApply?.({
              id: scheme.scheme_id,
              name: localizedSchemeName,
            })
          }
          className="flex-1 rounded-xl bg-[#1769a8] py-2.5 text-center text-xs font-bold text-white shadow-sm transition hover:bg-[#12578c]"
        >
          {t("applyNowBtn", currentLanguage)}
        </button>
        <button
          onClick={() => onNavigate?.("tracking")}
          className="rounded-xl border border-[#cbd8e2] px-3.5 py-2.5 text-xs font-semibold text-[#506379] transition hover:bg-[#f0f5fa]"
        >
          {t("trackApplication", currentLanguage)}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   REASON ROW
========================================================= */

function ReasonRow({
  text,
}) {
  return (
    <div className="flex items-start gap-2 text-xs leading-5 text-[#60758a]">
      <CheckCircle2
        size={14}
        className="mt-0.5 shrink-0 text-[#3d9a87]"
      />

      <span>
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  title,
  text,
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-[#d4dfe6] bg-white p-7 text-center">
      <AlertCircle
        size={24}
        className="mx-auto text-[#8b98a5]"
      />

      <h3 className="mt-3 font-serif text-lg font-bold text-[#3a4c60]">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-[#7b8998]">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   AUTH BENEFIT
========================================================= */

function AuthBenefit({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#1769a8] shadow-sm">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-[#29445d]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#6d7f92]">
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMI CALCULATOR
========================================================= */

function EMICalculator({ onBack, currentLanguage = "en", onLanguageChange }) {
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("6");
  const [tenure, setTenure] = useState("60");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = async () => {
    setError("");
    setResult(null);

    const p = Number(principal);
    const r = Number(interestRate);
    const t = Number(tenure);

    if (!p || p <= 0) {
      setError("Please enter a valid loan amount.");
      return;
    }
    if (!r || r < 0) {
      setError("Please enter a valid interest rate.");
      return;
    }
    if (!t || t <= 0) {
      setError("Please enter a valid tenure.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/emi/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal: p,
          interest_rate: r,
          tenure_months: t,
        }),
      });

      if (!response.ok) {
        throw new Error("EMI calculation failed.");
      }

      const data = await response.json();
      setResult(data.emi);
    } catch {
      setError("Unable to connect to the backend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <header className="border-b border-[#dce4ea] bg-white">
        <div className="mx-auto flex min-h-[82px] max-w-[1200px] items-center justify-between px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#53657b] transition hover:text-[#145c91]"
          >
            <ArrowLeft size={18} />
            {t("backToHome", currentLanguage)}
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center text-[#c6a56b]">
              <div className="absolute inset-1 rotate-45 rounded-md border-2 border-[#c6a56b]" />
              <Sparkles size={17} />
            </div>
            <p className="font-serif text-[18px] font-bold tracking-wide text-[#172a43]">
              SCHEME SAATHI
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#1769a8]">
            {t("calculator", currentLanguage).toUpperCase()}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#172a43] md:text-5xl">
            {t("calcTitle", currentLanguage)}
          </h1>
          <p className="mt-4 text-base leading-7 text-[#66788d]">
            {t("calcSubtitle", currentLanguage)}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#d7e2e9] bg-white p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#2c4058]">
                {t("loanAmount", currentLanguage)}
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="e.g. 250000"
                className="w-full rounded-lg border border-[#ced9e1] bg-white px-4 py-3.5 text-sm text-[#21364f] outline-none transition placeholder:text-[#a1acb6] focus:border-[#1769a8] focus:ring-4 focus:ring-[#1769a8]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#2c4058]">
                {t("interestRatePercent", currentLanguage)}
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 6.5"
                step="0.1"
                className="w-full rounded-lg border border-[#ced9e1] bg-white px-4 py-3.5 text-sm text-[#21364f] outline-none transition placeholder:text-[#a1acb6] focus:border-[#1769a8] focus:ring-4 focus:ring-[#1769a8]/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#2c4058]">
                {t("tenureMonths", currentLanguage)}
              </label>
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                placeholder="e.g. 60"
                className="w-full rounded-lg border border-[#ced9e1] bg-white px-4 py-3.5 text-sm text-[#21364f] outline-none transition placeholder:text-[#a1acb6] focus:border-[#1769a8] focus:ring-4 focus:ring-[#1769a8]/10"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <span className="leading-5 font-medium">{error}</span>
            </div>
          )}

          <button
            onClick={calculate}
            disabled={loading}
            className="mt-6 flex items-center gap-2 rounded-lg bg-[#145c91] px-6 py-3.5 font-semibold text-white transition hover:bg-[#104d7b] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("calculating", currentLanguage)}
              </>
            ) : (
              <>
                {t("calculateBtn", currentLanguage)}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-2xl border border-[#d4e8d4] bg-[#f0f8f0] p-7">
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#3d7a42]">
              {t("repaymentBreakdown", currentLanguage).toUpperCase()}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-5">
                <p className="text-[11px] text-[#7a8998]">{t("monthlyEmi", currentLanguage)}</p>
                <p className="mt-1 font-serif text-3xl font-bold text-[#145c91]">
                  ₹{Number(result.monthly_emi).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-xl bg-white p-5">
                <p className="text-[11px] text-[#7a8998]">{t("totalInterest", currentLanguage)}</p>
                <p className="mt-1 font-serif text-3xl font-bold text-[#1b3148]">
                  ₹{Number(result.total_interest).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-xl bg-white p-5">
                <p className="text-[11px] text-[#7a8998]">{t("totalRepayment", currentLanguage)}</p>
                <p className="mt-1 font-serif text-2xl font-bold text-[#1b3148]">
                  ₹{Number(result.total_repayment).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-xl bg-white p-5">
                <p className="text-[11px] text-[#7a8998]">{t("tenure", currentLanguage)}</p>
                <p className="mt-1 font-serif text-2xl font-bold text-[#1b3148]">
                  {result.tenure_months} months
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[#d4e2e9] bg-white p-3 text-[11px] leading-5 text-[#718096]">
              Calculation method: {result.calculation_method} •
              Interest rate: {result.interest_rate}% p.a. •
              Principal: ₹{Number(result.principal).toLocaleString("en-IN")}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================
   PARTNER LOCATOR
========================================================= */


function PartnerLocator({ onBack, currentLanguage = "en", onLanguageChange }) {
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [partners, setPartners] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchStates = async () => {
      setLocationLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/locations/states`);
        if (!response.ok) throw new Error("Failed to fetch states");
        const data = await response.json();
        if (active) {
          setStatesList(data.states || []);
        }
      } catch {
        if (active) {
          setStatesList([]);
        }
      } finally {
        if (active) {
          setLocationLoading(false);
        }
      }
    };

    fetchStates();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    let active = true;

    const fetchDistricts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/locations/states/${encodeURIComponent(state)}/districts`,
        );
        if (!response.ok) throw new Error("Failed to fetch districts");
        const data = await response.json();
        if (active) {
          setDistrictsList(data.districts || []);
        }
      } catch {
        if (active) {
          setDistrictsList([]);
        }
      }
    };

    fetchDistricts();

    return () => {
      active = false;
    };
  }, [state]);

  const handleStateChange = (value) => {
    setState(value);
    setDistrict("");
    if (!value) {
      setDistrictsList([]);
    }
  };

  const search = async () => {
    setError("");
    setPartners([]);
    setSearched(false);
    setMessage("");

    if (!state) {
      setError(t("selectStatePrompt", currentLanguage));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/partners/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: state,
          district: district || undefined,
          max_results: 10,
        }),
      });

      if (!response.ok) {
        throw new Error("Partner search failed.");
      }

      const data = await response.json();
      setPartners(data.partners || []);
      setSearched(true);
      setMessage(data.message || "");
    } catch {
      setError("Unable to connect to the backend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <header className="border-b border-[#dce4ea] bg-white">
        <div className="mx-auto flex min-h-[82px] max-w-[1200px] items-center justify-between px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#53657b] transition hover:text-[#145c91]"
          >
            <ArrowLeft size={18} />
            {t("backToHome", currentLanguage)}
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center text-[#c6a56b]">
              <div className="absolute inset-1 rotate-45 rounded-md border-2 border-[#c6a56b]" />
              <Sparkles size={17} />
            </div>
            <p className="font-serif text-[18px] font-bold tracking-wide text-[#172a43]">
              SCHEME SAATHI
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#1769a8]">
            {t("partnerLocator", currentLanguage).toUpperCase()}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[#172a43] md:text-5xl">
            {t("partnerTitle", currentLanguage)}
          </h1>
          <p className="mt-4 text-base leading-7 text-[#66788d]">
            {t("partnerSubtitle", currentLanguage)}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#d7e2e9] bg-white p-8 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#2c4058]">
                {t("state", currentLanguage)}
              </label>
              <SelectField
                label=""
                value={state}
                onChange={handleStateChange}
                options={
                  locationLoading
                    ? []
                    : statesList.map((s) => ({
                        value: s.name,
                        label: s.name,
                      }))
                }
                helper={
                  locationLoading ? t("loading", currentLanguage) : undefined
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-bold text-[#2c4058]">
                {t("district", currentLanguage)}
              </label>
              <SelectField
                label=""
                value={district}
                onChange={setDistrict}
                options={
                  !state
                    ? []
                    : districtsList.map((d) => ({
                        value: d,
                        label: d,
                      }))
                }
                helper={
                  !state
                    ? t("selectStatePrompt", currentLanguage)
                    : districtsList.length === 0
                      ? t("loading", currentLanguage)
                      : undefined
                }
                disabled={!state}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <span className="leading-5 font-medium">{error}</span>
            </div>
          )}

          <button
            onClick={search}
            disabled={loading}
            className="mt-6 flex items-center gap-2 rounded-lg bg-[#145c91] px-6 py-3.5 font-semibold text-white transition hover:bg-[#104d7b] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("searchingPartners", currentLanguage)}
              </>
            ) : (
              <>
                <Search size={16} />
                {t("searchPartners", currentLanguage)}
              </>
            )}
          </button>
        </div>

        {searched && (
          <div className="mt-8">
            {message && (
              <p className="mb-4 text-sm text-[#60758a]">{message}</p>
            )}

            {partners.length === 0 ? (
              <div className="rounded-2xl border border-[#d7e2e9] bg-white p-8 text-center shadow-sm">
                <MapPin size={32} className="mx-auto text-[#a1acb6]" />
                <p className="mt-3 font-serif text-xl font-bold text-[#3b4f63]">
                  No partners found
                </p>
                <p className="mt-2 text-sm text-[#718096]">
                  Try searching with a different state or district.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div
                    key={partner.partner_id}
                    className="rounded-2xl border border-[#d7e2e9] bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#e7f3f8] px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-[#1769a8]">
                            {partner.type}
                          </span>
                          {partner.verified && (
                            <span className="rounded-full bg-[#edf6ec] px-3 py-1 text-[10px] font-bold text-[#47744a]">
                              VERIFIED
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 font-serif text-xl font-bold text-[#1b3148]">
                          {partner.name}
                        </h3>

                        {partner.address && (
                          <p className="mt-2 flex items-start gap-1.5 text-sm text-[#60758a]">
                            <MapPin size={14} className="mt-0.5 shrink-0" />
                            {partner.address}
                          </p>
                        )}

                        {partner.contact && (
                          <p className="mt-1 text-sm text-[#60758a]">
                            Contact: {partner.contact}
                          </p>
                        )}

                        {partner.distance_km != null && (
                          <p className="mt-1 text-sm font-semibold text-[#145c91]">
                            {partner.distance_km} km away
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 space-y-2 text-right">
                        {partner.max_loan_amount_handled && (
                          <div className="rounded-lg bg-[#f7fafc] px-3 py-2">
                            <p className="text-[10px] text-[#84919d]">Max Loan Handled</p>
                            <p className="text-sm font-bold text-[#263b52]">
                              ₹{Number(partner.max_loan_amount_handled).toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}

                        {partner.official_url && (
                          <a
                            href={partner.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#145c91] underline hover:text-[#0d4a78]"
                          >
                            Official Website ↗
                          </a>
                        )}
                      </div>
                    </div>

                    {partner.supported_loan_categories?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {partner.supported_loan_categories.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full border border-[#dce4ea] bg-[#f7fafc] px-2.5 py-1 text-[10px] font-semibold text-[#53657b]"
                          >
                            {formatValue(cat)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* =========================================================
   AI ASSISTANT FOUNDATION
========================================================= */

function AIAssistant({
  onBack,
  onNavigate,
  isLoggedIn,
  currentUser,
  lastSchemeResults,
  lastSchemeFormData,
  currentLanguage = "en",
  onLanguageChange,
}) {
  const detectNavigationFromText = (responseText) => {
    if (!responseText) return null;

    const navigation = {};
    const lines = responseText.split("\n");

    for (const line of lines) {
      const cleaned =
        line
          .replace(/^[\s\-*\u2022\d.]+/, "")
          .trim();

      if (/^find my schemes?$/i.test(cleaned)) {
        navigation.finder = true;
      }

      if (/^explore schemes?$/i.test(cleaned)) {
        navigation.explore = true;
      }
    }

    if (
      !navigation.finder &&
      !navigation.explore
    ) {
      return null;
    }

    return navigation;
  };


  const getCheckedSchemeNames = () => {
    if (!lastSchemeResults) return [];

    const names = new Set();

    const addSchemes = (list) => {
      if (!Array.isArray(list)) return;

      for (const scheme of list) {
        const name =
          scheme.scheme_name ||
          scheme.name ||
          "";

        if (name) {
          names.add(name);
        }
      }
    };

    addSchemes(
      lastSchemeResults.primary?.eligible,
    );

    addSchemes(
      lastSchemeResults.primary?.ineligible,
    );

    addSchemes(
      lastSchemeResults.secondary?.eligible,
    );

    addSchemes(
      lastSchemeResults.secondary?.ineligible,
    );

    return Array.from(names);
  };

  const checkedSchemeNames =
    getCheckedSchemeNames();

  const hasCheckedSchemes =
    Boolean(
      isLoggedIn &&
      lastSchemeResults,
    );

  const buildSchemeContext = () => {
    if (!lastSchemeResults) return null;

    const context = {
      user_profile: lastSchemeFormData
        ? {
            name:
              currentUser?.name ||
              lastSchemeFormData.fullName ||
              "",
            gender:
              lastSchemeFormData.gender ||
              "",
            category:
              lastSchemeFormData.category ||
              "",
            state:
              lastSchemeFormData.state ||
              "",
            district:
              lastSchemeFormData.district ||
              "",
            annual_income:
              lastSchemeFormData.annualIncome ||
              "",
            purpose:
              lastSchemeFormData.purpose ||
              "",
            business_type:
              lastSchemeFormData.businessType ||
              "",
            project_cost:
              lastSchemeFormData.projectCost ||
              "",
            required_loan:
              lastSchemeFormData.requiredLoan ||
              "",
            education_level:
              lastSchemeFormData.educationLevel ||
              "",
          }
        : null,

      eligible_schemes: [],
      ineligible_schemes: [],
    };

    if (
      Array.isArray(
        lastSchemeResults.primary?.eligible,
      )
    ) {
      context.eligible_schemes =
        context.eligible_schemes.concat(
          lastSchemeResults.primary.eligible.map(
            (scheme) => ({
              id:
                scheme.code ||
                scheme.id ||
                "",
              name:
                scheme.name ||
                scheme.scheme_name ||
                "",
              match_score:
                scheme.match_score ??
                null,
              reasons:
                scheme.reasons ||
                [],
              financial_terms:
                scheme.financial_terms ||
                null,
              source:
                scheme.source ||
                null,
              required_documents:
                scheme.required_documents ||
                null,
            }),
          ),
        );
    }

    if (
      Array.isArray(
        lastSchemeResults.primary?.ineligible,
      )
    ) {
      context.ineligible_schemes =
        context.ineligible_schemes.concat(
          lastSchemeResults.primary.ineligible.map(
            (scheme) => ({
              id:
                scheme.code ||
                scheme.id ||
                "",
              name:
                scheme.name ||
                scheme.scheme_name ||
                "",
              reasons:
                scheme.reasons ||
                [],
              failure_reasons:
                scheme.failure_reasons ||
                [],
              criterion_status:
                scheme.criterion_status ||
                [],
              financial_terms:
                scheme.financial_terms ||
                null,
              source:
                scheme.source ||
                null,
            }),
          ),
        );
    }

    if (
      Array.isArray(
        lastSchemeResults.secondary?.eligible,
      )
    ) {
      context.eligible_schemes =
        context.eligible_schemes.concat(
          lastSchemeResults.secondary.eligible.map(
            (scheme) => ({
              scheme_id:
                scheme.scheme_id ||
                scheme.id ||
                "",
              scheme_name:
                scheme.scheme_name ||
                scheme.name ||
                "",
              type:
                "SECONDARY_CONNECTED",
              reasons:
                scheme.reasons || [],
              financial_terms:
                scheme.financial_terms ||
                null,
              source:
                scheme.source ||
                null,
              required_documents:
                scheme.required_documents ||
                null,
            }),
          ),
        );
    }

    return context;
  };


  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content: t("aiWelcome", currentLanguage),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (overrideText) => {
    const trimmed = (overrideText || input).trim();

    if (!trimmed || loading) return;

    setError("");
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmed,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem(
        "scheme_saathi_token",
      );

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/assistant`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: trimmed,
            language: currentLanguage,
            scheme_context:
              buildSchemeContext(),
          }),
        },
      );

      if (!response.ok) {
        let errorMessage =
          "Unable to process AI request. Please try again.";

        try {
          const errorData =
            await response.json();

          if (errorData?.detail) {
            errorMessage =
              String(errorData.detail);
          }
        } catch {
          // Keep default message.
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content:
          data.reply ||
          "I could not generate a response. Please try again.",
        structured: {
          primary_recommendation:
            data.primary_recommendation,
          other_eligible_schemes:
            data.other_eligible_schemes,
          out_of_scope_schemes:
            data.out_of_scope_schemes,
          emi_projection:
            data.emi_projection,
          matched_channel_partners:
            data.matched_channel_partners,
          ineligibility_explanations:
            data.ineligibility_explanations,
          application_guidance:
            data.application_guidance,
          document_status:
            data.document_status,
          disclaimer:
            data.disclaimer,
        },
        navigation:
          data.navigation ||
          detectNavigationFromText(
            data.reply,
          ),
      };

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);

      if (
        data.language_used &&
        data.language_used !== currentLanguage
      ) {
        onLanguageChange?.(data.language_used);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the AI Assistant. Please try again.",
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not complete your request at this moment. Please explore schemes directly or try again in a moment.",
        },
      ]);

      console.error(
        "AI Assistant error:",
        error,
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#f4f8fb]">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#dce4ea] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[70px] max-w-[1200px] items-center justify-between px-6">

          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#53657b] transition hover:text-[#145c91]"
          >
            ←
            <span>{t("back", currentLanguage)}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef7fb] text-[#145c91]">
              <Bot size={18} />
            </div>

            <div>
              <p className="font-serif text-[17px] font-bold tracking-wide text-[#172a43]">
                SCHEME SAATHI
              </p>
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#8090a0]">
                {t("aiAssistant", currentLanguage)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          </div>

        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[800px] space-y-5">

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={[
                "flex gap-3",
                message.role === "user"
                  ? "justify-end"
                  : "justify-start",
              ].join(" ")}
            >

              {message.role === "assistant" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#145c91] text-white">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={[
                  "max-w-[75%] rounded-2xl px-5 py-3.5 text-[14px] leading-6",
                  message.role === "user"
                    ? "rounded-br-md bg-[#145c91] text-white"
                    : "rounded-bl-md border border-[#dce4ea] bg-white text-[#1e3048] shadow-sm",
                ].join(" ")}
              >
                <div className="whitespace-pre-wrap">
                  {message.content}
                </div>

                {message.role === "assistant" &&
                  index === 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          onNavigate("explore")
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-[#d4e8d4] bg-[#f0f8f0] px-3 py-2 text-[12px] font-semibold text-[#3d7a42] transition hover:bg-[#e4f2e4]"
                      >
                        <BookOpen size={13} />
                        {t("exploreSchemes", currentLanguage)}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isLoggedIn) {
                            onNavigate("finder");
                          } else {
                            onNavigate("login");
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-[#dce4ea] bg-[#f7fafc] px-3 py-2 text-[12px] font-semibold text-[#145c91] transition hover:bg-[#eef7fb]"
                      >
                        <Search size={13} />
                        {t("findMyScheme", currentLanguage)}
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate("emi_calculator")}
                        className="flex items-center gap-1.5 rounded-lg border border-[#dce4ea] bg-[#f7fafc] px-3 py-2 text-[12px] font-semibold text-[#145c91] transition hover:bg-[#eef7fb]"
                      >
                        <Calculator size={13} />
                        EMI Calculator
                      </button>

                      {isLoggedIn && (
                        <button
                          type="button"
                          onClick={() => onNavigate("documents")}
                          className="flex items-center gap-1.5 rounded-lg border border-[#d4e8d4] bg-[#f0f8f0] px-3 py-2 text-[12px] font-semibold text-[#3d7a42] transition hover:bg-[#e4f2e4]"
                        >
                          <FileText size={13} />
                          Documents
                        </button>
                      )}

                    </div>
                  )}

                {message.structured && (
                  <div className="mt-4 space-y-3">

                    {/* Best-fit recommendation */}
                    {message.structured.primary_recommendation && (
                      <div className="rounded-xl border border-[#d4e8d4] bg-[#f0f8f0] p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3d7a42]">
                            Best Fit
                          </p>

                          {message.structured.primary_recommendation.score != null && (
                            <span className="rounded-full bg-[#3d7a42] px-2.5 py-0.5 text-[10px] font-bold text-white">
                              AI Score: {message.structured.primary_recommendation.score}/100
                            </span>
                          )}
                        </div>

                        <p className="mt-1 font-serif text-[16px] font-bold text-[#1d3a22]">
                          {message.structured.primary_recommendation.scheme_name}
                        </p>

                        {message.structured.primary_recommendation.reasons?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.structured.primary_recommendation.reasons.map(
                              (reason, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 text-[12px] text-[#4a6b4e]"
                                >
                                  <span className="mt-0.5 shrink-0">✓</span>
                                  <span>{reason}</span>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        {message.structured.primary_recommendation.official_url && (
                          <a
                            href={message.structured.primary_recommendation.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex text-[11px] text-[#145c91] underline"
                          >
                            Official Website ↗
                          </a>
                        )}
                      </div>
                    )}

                    {/* Other eligible schemes */}
                    {message.structured.other_eligible_schemes?.length > 0 && (
                      <div className="rounded-xl border border-[#dce4ea] bg-[#f7fafc] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7a8998]">
                          Other Eligible Options
                        </p>

                        <div className="mt-2 space-y-2">
                          {message.structured.other_eligible_schemes.map(
                            (scheme, index) => (
                              <div
                                key={index}
                                className="rounded-lg bg-white px-3 py-2 text-[12px]"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <span className="font-bold text-[#145c91]">
                                      {scheme.rank || index + 1}.
                                    </span>

                                    <span className="font-semibold text-[#43566f]">
                                      {scheme.scheme_name}
                                    </span>
                                  </div>

                                  {scheme.score != null && (
                                    <span className="rounded-full bg-[#eef7fb] px-2 py-0.5 text-[10px] font-bold text-[#145c91]">
                                      {scheme.score}/100
                                    </span>
                                  )}
                                </div>

                                {scheme.official_url && (
                                  <a
                                    href={scheme.official_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-5 mt-1 inline-flex text-[11px] text-[#145c91] underline"
                                  >
                                    Official Website ↗
                                  </a>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Outside scope */}
                    {message.structured.out_of_scope_schemes?.length > 0 && (
                      <div className="rounded-xl border border-[#e8e0d0] bg-[#fdf8f0] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a7a50]">
                          Outside Scheme Saathi Scope
                        </p>

                        <div className="mt-2 space-y-2">
                          {message.structured.out_of_scope_schemes.map(
                            (scheme, index) => (
                              <div
                                key={index}
                                className="rounded-lg bg-white px-3 py-2 text-[12px]"
                              >
                                <p className="font-semibold text-[#43566f]">
                                  {scheme.name}
                                </p>

                                {scheme.reason && (
                                  <p className="mt-1 text-[11px] text-[#8a7a50]">
                                    {scheme.reason}
                                  </p>
                                )}

                                {scheme.official_url && (
                                  <a
                                    href={scheme.official_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex text-[11px] text-[#145c91] underline"
                                  >
                                    Official Website ↗
                                  </a>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* EMI projection */}
                    {message.structured.emi_projection && (
                      <div className="rounded-xl border border-[#d8dde8] bg-[#f7f8fc] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6a7a8e]">
                          EMI Projection
                        </p>

                        <div className="mt-2 grid grid-cols-2 gap-3 text-[12px]">
                          <div>
                            <span className="text-[#7a8998]">
                              Monthly EMI:
                            </span>{" "}
                            <strong>
                              ₹{message.structured.emi_projection.monthly_emi}
                            </strong>
                          </div>

                          <div>
                            <span className="text-[#7a8998]">
                              Total Interest:
                            </span>{" "}
                            <strong>
                              ₹{message.structured.emi_projection.total_interest}
                            </strong>
                          </div>

                          <div>
                            <span className="text-[#7a8998]">
                              Total Repayment:
                            </span>{" "}
                            <strong>
                              ₹{message.structured.emi_projection.total_repayment}
                            </strong>
                          </div>

                          <div>
                            <span className="text-[#7a8998]">
                              Tenure:
                            </span>{" "}
                            <strong>
                              {message.structured.emi_projection.tenure_months} months
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Channel partners */}
                    {message.structured.matched_channel_partners?.length > 0 && (
                      <div className="rounded-xl border border-[#e0d8c8] bg-[#faf8f0] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a7a50]">
                          Matched Channel Partners
                        </p>

                        <div className="mt-2 space-y-2">
                          {message.structured.matched_channel_partners.map(
                            (partner, index) => (
                              <div
                                key={index}
                                className="rounded-lg bg-white p-3 text-[12px]"
                              >
                                <p className="font-bold text-[#2d4050]">
                                  {partner.name}
                                </p>

                                <p className="mt-0.5 text-[#718096]">
                                  {partner.type}
                                  {partner.distance_km != null
                                    ? ` • ${partner.distance_km} km`
                                    : ""}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ineligibility explanations */}
                    {message.structured.ineligibility_explanations?.length > 0 && (
                      <div className="rounded-xl border border-[#f0d4d4] bg-[#fdf5f5] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a04040]">
                          Ineligibility Explanation
                        </p>

                        <div className="mt-2 space-y-3">
                          {message.structured.ineligibility_explanations.map(
                            (explanation, index) => (
                              <div key={index}>
                                <p className="text-[13px] font-bold text-[#3a2020]">
                                  {explanation.scheme_name}
                                </p>

                                {explanation.criterion_status?.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {explanation.criterion_status.map(
                                      (criterion, criterionIndex) => (
                                        <div
                                          key={criterionIndex}
                                          className="flex items-start gap-2 text-[12px]"
                                        >
                                          <span
                                            className={
                                              criterion.satisfied
                                                ? "text-green-600"
                                                : "text-red-600"
                                            }
                                          >
                                            {criterion.satisfied ? "✓" : "✗"}
                                          </span>

                                          <span>
                                            <strong>
                                              {criterion.criterion}:
                                            </strong>{" "}
                                            {criterion.user_value} →{" "}
                                            {criterion.message}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}

                                {explanation.failure_reasons?.length > 0 && (
                                  <div className="mt-1 space-y-1">
                                    {explanation.failure_reasons.map(
                                      (reason, reasonIndex) => (
                                        <div
                                          key={reasonIndex}
                                          className="flex items-start gap-2 text-[12px] text-[#6a3030]"
                                        >
                                          <span>•</span>
                                          <span>{reason}</span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Application guidance */}
                    {message.structured.application_guidance?.length > 0 && (
                      <div className="rounded-xl border border-[#d4e2e9] bg-[#f0f6fa] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1769a8]">
                          Application Guidance
                        </p>

                        <div className="mt-2 space-y-3">
                          {message.structured.application_guidance.map(
                            (guidance, index) => (
                              <div
                                key={index}
                                className="rounded-lg bg-white p-3 text-[12px]"
                              >
                                <p className="font-bold text-[#2d4050]">
                                  {guidance.scheme_name}
                                </p>

                                {guidance.status === "verified" &&
                                  guidance.application_steps && (
                                    <div className="mt-1 space-y-1">
                                      {guidance.application_steps.map(
                                        (step, stepIndex) => (
                                          <div
                                            key={stepIndex}
                                            className="flex items-start gap-2 text-[#3a5a3a]"
                                          >
                                            <span className="mt-0.5">
                                              ✓
                                            </span>
                                            <span>
                                              {typeof step === "string"
                                                ? step
                                                : step.description ||
                                                  step.step ||
                                                  JSON.stringify(step)}
                                            </span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}

                                {guidance.status === "channel_partner_needed" && (
                                  <div className="mt-2 rounded-lg border border-[#e8e0d0] bg-[#fdf8f0] p-2">
                                    <p className="text-[11px] font-semibold text-[#8a7a50]">
                                      {guidance.message ||
                                        "Channel Partner assistance recommended."}
                                    </p>
                                  </div>
                                )}

                                {guidance.status === "partial" && (
                                  <p className="mt-1 text-[11px] text-[#718096]">
                                    {guidance.message ||
                                      "Limited application information available."}
                                  </p>
                                )}

                                {guidance.official_url && (
                                  <a
                                    href={guidance.official_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-flex text-[11px] text-[#145c91] underline"
                                  >
                                    Official Website ↗
                                  </a>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Document status */}
                    {message.structured.document_status && (
                      <div className="rounded-xl border border-[#d8e8d4] bg-[#f4faf0] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3d7a42]">
                          Document Status
                        </p>

                        <div className="mt-2">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e0ece0]">
                              <div
                                className="h-full rounded-full bg-[#3d7a42] transition-all"
                                style={{
                                  width: `${message.structured.document_status.completion_percentage || 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-[#3d7a42]">
                              {message.structured.document_status.completion_percentage || 0}%
                            </span>
                          </div>

                          <p className="text-[11px] text-[#4a6b4e]">
                            {message.structured.document_status.mandatory_uploaded || 0} of {message.structured.document_status.mandatory_total || 0} mandatory documents uploaded
                          </p>

                          {message.structured.document_status.missing_mandatory?.length > 0 && (
                            <div className="mt-2 rounded-lg bg-white p-2">
                              <p className="text-[10px] font-semibold text-[#a04040]">Missing mandatory documents:</p>
                              <div className="mt-1 space-y-0.5">
                                {message.structured.document_status.missing_mandatory.map((doc, i) => (
                                  <p key={i} className="flex items-start gap-1.5 text-[11px] text-[#6a3030]">
                                    <span>•</span>
                                    <span>{doc}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {message.structured.document_status.uploaded?.length > 0 && (
                            <div className="mt-2 rounded-lg bg-white p-2">
                              <p className="text-[10px] font-semibold text-[#3d7a42]">Uploaded:</p>
                              <div className="mt-1 space-y-0.5">
                                {message.structured.document_status.uploaded.map((doc, i) => (
                                  <p key={i} className="flex items-center gap-1.5 text-[11px] text-[#4a6b4e]">
                                    <span className={doc.verification_status === "verified" ? "text-green-600" : "text-yellow-600"}>
                                      {doc.verification_status === "verified" ? "✓" : "⏳"}
                                    </span>
                                    <span>{doc.document_name}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => onNavigate("documents")}
                            className="mt-2 flex items-center gap-1.5 rounded-lg border border-[#c8dcc4] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#3d7a42] transition hover:bg-[#f0f8f0]"
                          >
                            Open Document Center
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI disclaimer */}
                    {message.structured.disclaimer && (
                      <div className="rounded-lg border border-[#e3e8ed] bg-[#f8fafb] p-3 text-[10px] leading-4 text-[#8a97a3]">
                        {message.structured.disclaimer}
                      </div>
                    )}

                  </div>
                )}

                {message.role === "assistant" &&
                  index === 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">

                      {hasCheckedSchemes && (
                        <button
                          onClick={() =>
                            sendMessage(
                              "Show me my previous scheme results",
                            )
                          }
                          className="rounded-lg border border-[#e0d8c8] bg-[#faf8f0] px-3 py-2 text-[12px] font-semibold text-[#8a7a50] transition hover:bg-[#f5f0e0]"
                        >
                          Previous Results
                        </button>
                      )}

                      {hasCheckedSchemes &&
                        checkedSchemeNames.length > 0 && (
                          <div className="mt-2 w-full">
                            <p className="mb-1.5 text-[11px] font-semibold text-[#718096]">
                              You previously checked:
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                              {checkedSchemeNames.map(
                                (name) => (
                                  <button
                                    key={name}
                                    onClick={() =>
                                      sendMessage(
                                        `Tell me about ${name}`,
                                      )
                                    }
                                    className="rounded-full border border-[#c8d8e8] bg-[#f0f6fb] px-3 py-1.5 text-[11px] font-semibold text-[#145c91] transition hover:bg-[#dceaf5]"
                                  >
                                    {name}
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {isLoggedIn &&
                        !hasCheckedSchemes && (
                          <div className="w-full rounded-lg border border-[#e3e8ed] bg-[#f8fafb] px-3 py-2 text-[11px] text-[#718096]">
                            You have not checked any schemes yet.
                            Use <strong>Find My Schemes</strong>{" "}
                            to check your eligibility.
                          </div>
                        )}

                    </div>
                  )}
              </div>

              {message.role === "user" && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f3f8] text-[#145c91]">
                  <UserRound size={18} />
                </div>
              )}


              {message.role === "assistant" &&
                message.navigation && (
                  <div className="mt-3 flex flex-wrap gap-2">

                    {message.navigation.explore && (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate("explore")
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-[#d4e8d4] bg-[#f0f8f0] px-3 py-2 text-[12px] font-semibold text-[#3d7a42] transition hover:bg-[#e4f2e4]"
                      >
                        <BookOpen size={13} />
                        {t("exploreSchemes", currentLanguage)}
                      </button>
                    )}

                    {message.navigation.finder && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isLoggedIn) {
                            onNavigate("finder");
                          } else {
                            onNavigate("login");
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-[#dce4ea] bg-[#f7fafc] px-3 py-2 text-[12px] font-semibold text-[#145c91] transition hover:bg-[#eef7fb]"
                      >
                        <Search size={13} />
                        {t("findMyScheme", currentLanguage)}
                      </button>
                    )}

                  </div>
                )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#145c91] text-white">
                <Bot size={18} />
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-[#dce4ea] bg-white px-5 py-3.5 shadow-sm">
                <Loader2
                  size={16}
                  className="animate-spin text-[#145c91]"
                />
                <span className="text-[13px] text-[#718096]">
                  {t("thinking", currentLanguage)}
                </span>
              </div>
            </div>
          )}


          {error && !loading && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
              <span className="mt-0.5">!</span>
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />

        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#dce4ea] bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[800px]">

          <div className="flex items-end gap-3 rounded-2xl border border-[#ced9e1] bg-white p-2 shadow-sm focus-within:border-[#1769a8] focus-within:ring-4 focus-within:ring-[#1769a8]/10">

            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("aiPlaceholder", currentLanguage)}
              rows={1}
              className="min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] text-[#1e3048] outline-none placeholder:text-[#a1acb6]"
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
                input.trim() && !loading
                  ? "bg-[#145c91] text-white shadow-md hover:bg-[#104d7b]"
                  : "bg-[#eef3f6] text-[#b6bec7]",
              ].join(" ")}
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Send size={18} className="rtl:rotate-180" />
              )}
            </button>

          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <p className="text-[10px] text-[#a1acb6]">
              Scheme Saathi AI Assistant
            </p>

            <p className="text-[10px] text-[#a1acb6]">
              {t("multilingualSupport", currentLanguage)}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
export default App;