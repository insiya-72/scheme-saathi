import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileCheck2,
  Building2,
  Landmark,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  PlusCircle,
  X,
  ExternalLink,
  Phone,
  User,
  MapPin,
} from "lucide-react";
import { t } from "../i18n/translations.js";
import "../i18n/schemeData.js";

const API_BASE_URL = "http://127.0.0.1:8000";

const CORE_SCHEMES_OPTIONS = [
  { id: "MFS", name: "Micro Finance Scheme (MFS)", maxLoan: 125000 },
  { id: "AMY", name: "Aajeevika Micro-Finance Yojana (AMY)", maxLoan: 125000 },
  { id: "TL", name: "Term Loan (TL)", maxLoan: 4500000 },
  { id: "UNY", name: "Udyam Nidhi Yojana (UNY)", maxLoan: 450000 },
  { id: "ELS", name: "Educational Loan Scheme (ELS)", maxLoan: 4000000 },
];

export default function ApplicationTracking({
  onBack,
  onNavigate,
  isLoggedIn = false,
  currentUser = null,
  initialAppNumber = "",
  initialScheme = null,
  currentLanguage = "en",
  onLanguageChange,
}) {
  const [searchQuery, setSearchQuery] = useState(initialAppNumber || "");
  const [loading, setLoading] = useState(false);
  const [trackResult, setTrackResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [myApplications, setMyApplications] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    scheme_id: initialScheme?.id || "MFS",
    scheme_name: initialScheme?.name || "Micro Finance Scheme (MFS)",
    applicant_name: currentUser?.name || "",
    applicant_phone: currentUser?.identifier || "",
    category: "SC",
    state: "Bihar",
    district: "Patna",
    loan_amount: 100000,
    purpose: "Working capital for small enterprise",
    channel_partner_name: "State Scheduled Castes Development Corporation",
  });
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState("");

  const token = localStorage.getItem("scheme_saathi_token");

  // Fetch logged in user applications
  const fetchUserApplications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyApplications(data || []);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchUserApplications();
    }
  }, [isLoggedIn, token]);

  // If initial application number was passed, auto-track
  useEffect(() => {
    if (initialAppNumber) {
      handleTrack(initialAppNumber);
    }
  }, [initialAppNumber]);

  const handleTrack = async (queryToUse) => {
    const q = (queryToUse || searchQuery).trim();
    if (!q) {
      setErrorMsg("Please enter an application number or mobile number.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setTrackResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/track/${encodeURIComponent(q)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Application not found.");
      }
      const data = await res.json();
      setTrackResult(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to find application. Please verify details.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmittingApply(true);
    setErrorMsg("");
    setApplySuccessMsg("");

    const selectedSchemeObj = CORE_SCHEMES_OPTIONS.find((s) => s.id === applyForm.scheme_id);
    const payload = {
      ...applyForm,
      scheme_name: selectedSchemeObj ? selectedSchemeObj.name : applyForm.scheme_name,
      loan_amount: parseFloat(applyForm.loan_amount) || 50000,
    };

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/applications`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to submit application.");
      }

      const created = await res.json();
      setApplySuccessMsg(
        `Application submitted! Tracking Number: ${created.application_number}`
      );
      setShowApplyModal(false);
      setSearchQuery(created.application_number);
      await handleTrack(created.application_number);
      if (token) fetchUserApplications();
    } catch (err) {
      setErrorMsg(err.message || "Could not submit application.");
    } finally {
      setSubmittingApply(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = String(statusStr || "").toLowerCase();
    if (s === "approved" || s === "disbursed") {
      return (
        <span className="rounded-full bg-[#dcf5e3] px-3 py-1 text-xs font-bold text-[#1e7e34]">
          ✓ {s.toUpperCase()}
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span className="rounded-full bg-[#feeded] px-3 py-1 text-xs font-bold text-[#b32b38]">
          ✕ REJECTED
        </span>
      );
    }
    return (
      <span className="rounded-full bg-[#eef7fb] px-3 py-1 text-xs font-bold text-[#1769a8]">
        ● {s.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#e1e8ed] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-[#506379] transition hover:text-[#1769a8]"
          >
            <ArrowLeft size={16} />
            <span>{t("back", currentLanguage)}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef7fb] text-[#1769a8]">
              <Clock size={18} />
            </div>
            <div>
              <p className="font-serif text-[17px] font-bold tracking-wide text-[#172a43]">
                {t("trackApplication", currentLanguage)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8090a0]">
                SCHEME SAATHI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate?.("documents")}
              className="rounded-lg border border-[#cfdbe5] bg-white px-3 py-1.5 text-xs font-semibold text-[#506379] transition hover:bg-[#f0f5fa]"
            >
              {t("documentCenter", currentLanguage)}
            </button>
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1769a8] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#12578c]"
            >
              <PlusCircle size={14} />
              <span>{t("applyNowBtn", currentLanguage)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <div className="border-b border-[#e1e8ed] bg-gradient-to-b from-white to-[#f4f8fb] py-12">
        <div className="mx-auto max-w-[860px] px-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf4fa] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1769a8]">
            <ShieldCheck size={13} />
            Government Concessional Credit
          </span>

          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#172a43] md:text-4xl">
            {t("trackApplicationTitle", currentLanguage)}
          </h1>
          <p className="mt-2 text-sm text-[#5c7086]">
            {t("trackApplicationSubtitle", currentLanguage)}
          </p>

          {/* Search Box */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                placeholder={t("searchApplicationPlaceholder", currentLanguage)}
                className="h-12 w-full rounded-xl border border-[#cbd8e2] bg-white px-4 text-sm font-medium text-[#172a43] shadow-sm outline-none transition placeholder:text-[#9bb0c1] focus:border-[#1769a8] focus:ring-2 focus:ring-[#1769a8]/20"
              />
            </div>

            <button
              onClick={() => handleTrack()}
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1769a8] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#12578c] disabled:opacity-60"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Search size={16} />
                  <span>{t("trackStatusBtn", currentLanguage)}</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#f5c6cb] bg-[#fff5f5] p-3 text-xs font-semibold text-[#b02a37]">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}
          {applySuccessMsg && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#c3e6cb] bg-[#f2fbf4] p-3 text-xs font-semibold text-[#1e7e34]">
              <CheckCircle2 size={15} />
              <span>{applySuccessMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-[1040px] px-6 pt-10">
        {/* Track Result Card */}
        {trackResult && trackResult.application && (
          <div className="rounded-2xl border border-[#d2e2ec] bg-white p-6 shadow-md md:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-[#edf2f6] pb-6 md:flex-row md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold tracking-wider text-[#1769a8]">
                    {trackResult.application.application_number}
                  </span>
                  {getStatusBadge(trackResult.application.status)}
                </div>
                <h2 className="mt-2 font-serif text-2xl font-bold text-[#172a43]">
                  {trackResult.application.scheme_name}
                </h2>
              </div>

              <div className="text-left md:text-right">
                <p className="text-xs font-semibold text-[#8091a1]">
                  {t("loanAmountRequested", currentLanguage)}
                </p>
                <p className="font-serif text-2xl font-bold text-[#203a56]">
                  ₹{trackResult.application.loan_amount?.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Applicant & Partner Meta */}
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-[#f8fbfd] p-4 text-xs md:grid-cols-4">
              <div>
                <p className="font-semibold text-[#8596a7]">{t("applicantNameLabel", currentLanguage)}</p>
                <p className="mt-0.5 font-bold text-[#172a43]">{trackResult.application.applicant_name}</p>
              </div>
              <div>
                <p className="font-semibold text-[#8596a7]">{t("applicantPhoneLabel", currentLanguage)}</p>
                <p className="mt-0.5 font-bold text-[#172a43]">{trackResult.application.applicant_phone}</p>
              </div>
              <div>
                <p className="font-semibold text-[#8596a7]">Location</p>
                <p className="mt-0.5 font-bold text-[#172a43]">
                  {trackResult.application.district || trackResult.application.state || "State Agency"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#8596a7]">{t("appliedOn", currentLanguage)}</p>
                <p className="mt-0.5 font-bold text-[#172a43]">
                  {trackResult.application.created_at?.slice(0, 10)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between text-xs font-bold text-[#5c7086]">
                <span>{t("progress", currentLanguage)}: {trackResult.current_stage_title}</span>
                <span className="text-base text-[#1769a8]">{trackResult.progress_percentage}%</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#edf3f7]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1769a8] to-[#3d9a87] transition-all duration-700"
                  style={{ width: `${trackResult.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Next Step Banner */}
            <div className="mt-6 rounded-xl border border-[#d9ebf5] bg-[#f0f8fd] p-4 text-xs">
              <p className="font-bold text-[#1769a8] uppercase tracking-wider text-[10px]">
                {t("nextStepLabel", currentLanguage)}
              </p>
              <p className="mt-1 font-medium text-[#2d465e]">
                {trackResult.next_step}
              </p>
              <button
                onClick={() => onNavigate?.("documents")}
                className="mt-2.5 inline-flex items-center gap-1.5 font-bold text-[#1769a8] hover:underline"
              >
                <span>Upload Missing Certificates in Document Center</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Timeline Stepper */}
            <div className="mt-8">
              <h3 className="font-serif text-lg font-bold text-[#172a43]">
                {t("timelineLabel", currentLanguage)}
              </h3>
              <div className="mt-4 space-y-4">
                {trackResult.application.timeline?.map((step, idx) => {
                  const isDone = step.status === "completed";
                  const isCurrent = step.status === "current";

                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={[
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                            isDone
                              ? "bg-[#3d9a87] text-white"
                              : isCurrent
                              ? "border-2 border-[#1769a8] bg-[#eef7fb] text-[#1769a8] ring-4 ring-[#1769a8]/10"
                              : "bg-[#edf2f7] text-[#8090a0]",
                          ].join(" ")}
                        >
                          {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        {idx < trackResult.application.timeline.length - 1 && (
                          <div
                            className={[
                              "h-10 w-0.5 mt-1",
                              isDone ? "bg-[#3d9a87]" : "bg-[#e2e8f0]",
                            ].join(" ")}
                          />
                        )}
                      </div>

                      <div className="pt-1">
                        <p
                          className={[
                            "text-sm font-bold",
                            isDone
                              ? "text-[#172a43]"
                              : isCurrent
                              ? "text-[#1769a8]"
                              : "text-[#8091a1]",
                          ].join(" ")}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-[#5c7086]">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* User's Submitted Applications List */}
        {isLoggedIn && myApplications.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-[#172a43]">
              {t("myApplicationsTitle", currentLanguage)}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setSearchQuery(app.application_number);
                    handleTrack(app.application_number);
                  }}
                  className="group cursor-pointer rounded-2xl border border-[#e1e8ed] bg-white p-5 shadow-sm transition hover:border-[#1769a8] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#1769a8]">
                      {app.application_number}
                    </span>
                    {getStatusBadge(app.status)}
                  </div>
                  <h3 className="mt-2 font-serif text-lg font-bold text-[#172a43] group-hover:text-[#1769a8] transition">
                    {app.scheme_name}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#718496]">
                    <span>₹{app.loan_amount?.toLocaleString("en-IN")}</span>
                    <span>Applied: {app.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Apply for Scheme Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-center justify-between border-b border-[#edf2f6] pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#172a43]">
                  {t("applySchemeModalTitle", currentLanguage)}
                </h3>
                <p className="text-xs text-[#6e8294]">
                  Direct application to State Channelizing Agency (SCA)
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-full p-2 text-[#7f90a1] hover:bg-[#f0f4f8]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-5 space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[#3c5067]">Select Concessional Scheme</label>
                <select
                  value={applyForm.scheme_id}
                  onChange={(e) => {
                    const sel = CORE_SCHEMES_OPTIONS.find((s) => s.id === e.target.value);
                    setApplyForm({
                      ...applyForm,
                      scheme_id: e.target.value,
                      scheme_name: sel ? sel.name : "",
                    });
                  }}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#cbd8e2] bg-[#f8fbfd] px-3 font-medium text-[#172a43] outline-none focus:border-[#1769a8]"
                >
                  {CORE_SCHEMES_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Max: ₹{s.maxLoan?.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#3c5067]">Applicant Full Name</label>
                <input
                  type="text"
                  required
                  value={applyForm.applicant_name}
                  onChange={(e) => setApplyForm({ ...applyForm, applicant_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#cbd8e2] px-3 font-medium text-[#172a43] outline-none focus:border-[#1769a8]"
                />
              </div>

              <div>
                <label className="text-[#3c5067]">10-Digit Mobile Number</label>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={applyForm.applicant_phone}
                  onChange={(e) => setApplyForm({ ...applyForm, applicant_phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#cbd8e2] px-3 font-medium text-[#172a43] outline-none focus:border-[#1769a8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3c5067]">Requested Loan Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="10000"
                    value={applyForm.loan_amount}
                    onChange={(e) => setApplyForm({ ...applyForm, loan_amount: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#cbd8e2] px-3 font-medium text-[#172a43] outline-none focus:border-[#1769a8]"
                  />
                </div>
                <div>
                  <label className="text-[#3c5067]">Category</label>
                  <select
                    value={applyForm.category}
                    onChange={(e) => setApplyForm({ ...applyForm, category: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#cbd8e2] bg-[#f8fbfd] px-3 font-medium text-[#172a43] outline-none focus:border-[#1769a8]"
                  >
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="OBC">OBC</option>
                    <option value="General">General / Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#3c5067]">State</label>
                  <input
                    type="text"
                    value={applyForm.state}
                    onChange={(e) => setApplyForm({ ...applyForm, state: e.target.value })}
                    placeholder="e.g. Bihar"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#cbd8e2] px-3 font-medium text-[#172a43] outline-none focus:border-[#1769a8]"
                  />
                </div>
                <div>
                  <label className="text-[#3c5067]">District</label>
                  <input
                    type="text"
                    value={applyForm.district}
                    onChange={(e) => setApplyForm({ ...applyForm, district: e.target.value })}
                    placeholder="e.g. Patna"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#cbd8e2] px-3 font-medium text-[#172a43] outline-none focus:border-[#1769a8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#3c5067]">Business / Loan Purpose</label>
                <input
                  type="text"
                  value={applyForm.purpose}
                  onChange={(e) => setApplyForm({ ...applyForm, purpose: e.target.value })}
                  placeholder="e.g. Setting up small retail store"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#cbd8e2] px-3 font-medium text-[#172a43] outline-none focus:border-[#1769a8]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingApply}
                className="mt-4 h-12 w-full rounded-xl bg-[#1769a8] font-bold text-white shadow-md transition hover:bg-[#12578c] disabled:opacity-60"
              >
                {submittingApply
                  ? t("submitting", currentLanguage)
                  : t("confirmAndSubmit", currentLanguage)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
