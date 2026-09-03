import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Trash2,
  Download,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  FileCheck,
  Lock,
  RefreshCw,
} from "lucide-react";
import { t } from "../i18n/translations.js";
import "../i18n/schemeData.js";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function DocumentCenter({
  onBack,
  onNavigate,
  isLoggedIn = false,
  currentUser = null,
  currentLanguage = "en",
  onLanguageChange,
}) {
  const [requirements, setRequirements] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [mandatoryUploaded, setMandatoryUploaded] = useState(0);
  const [mandatoryTotal, setMandatoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRefs = useRef({});

  const token = localStorage.getItem("scheme_saathi_token");

  const fetchDocumentData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch public requirements
      const reqRes = await fetch(`${API_BASE_URL}/api/documents/requirements`);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequirements(reqData);
      }

      // 2. If logged in, fetch user checklist
      if (isLoggedIn && token) {
        const chkRes = await fetch(`${API_BASE_URL}/api/documents/checklist`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (chkRes.ok) {
          const chkData = await chkRes.json();
          setUploadedDocs(chkData.uploaded || []);
          setCompletionPercentage(chkData.completion_percentage || 0);
          setMandatoryUploaded(chkData.mandatory_uploaded || 0);
          setMandatoryTotal(chkData.mandatory_total || 0);
        }
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setErrorMsg("Failed to load documents data. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentData();
  }, [isLoggedIn, token]);

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    if (!isLoggedIn || !token) {
      setErrorMsg("Please sign in to upload and save documents to your account.");
      return;
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size must be under 10MB.");
      return;
    }

    setUploadingType(documentType);
    setErrorMsg("");
    setSuccessMsg("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result;
        const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            document_type: documentType,
            file_name: file.name,
            file_base64: base64Data,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || "Upload failed");
        }

        setSuccessMsg(`${file.name} uploaded successfully!`);
        await fetchDocumentData();
      } catch (err) {
        console.error("Upload error:", err);
        setErrorMsg(err.message || "Failed to upload document. Please try again.");
      } finally {
        setUploadingType(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (docId) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to remove this document?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccessMsg("Document removed.");
        await fetchDocumentData();
      }
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMsg("Failed to delete document.");
    }
  };

  const getUploadedForType = (typeKey) => {
    return uploadedDocs.find((d) => d.document_type === typeKey);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] pb-20">
      {/* Top Header */}
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
              <FileCheck size={18} />
            </div>
            <div>
              <p className="font-serif text-[17px] font-bold tracking-wide text-[#172a43]">
                {t("documentCenter", currentLanguage)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8090a0]">
                SCHEME SAATHI
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.("tracking")}
            className="rounded-lg border border-[#cfdbe5] bg-white px-3.5 py-1.5 text-xs font-bold text-[#1769a8] transition hover:bg-[#eef7fb]"
          >
            {t("trackApplication", currentLanguage)} →
          </button>
        </div>
      </header>

      {/* Hero Banner & Progress */}
      <div className="border-b border-[#e1e8ed] bg-gradient-to-b from-white to-[#f4f8fb] py-10">
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf4fa] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1769a8]">
                <ShieldCheck size={13} />
                {t("completionStatus", currentLanguage)}
              </span>
              <h1 className="mt-2.5 font-serif text-3xl font-bold tracking-tight text-[#172a43] md:text-4xl">
                {t("documentCenterTitle", currentLanguage)}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5c7086]">
                {t("documentCenterSubtitle", currentLanguage)}
              </p>
            </div>

            {/* Readiness Card */}
            {isLoggedIn ? (
              <div className="min-w-[280px] rounded-2xl border border-[#dce6ed] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-[#5c7086]">
                  <span>{t("completionStatus", currentLanguage)}</span>
                  <span className="text-base text-[#1769a8]">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#edf3f7]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1769a8] to-[#3d9a87] transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <p className="mt-2.5 text-[11px] text-[#788a9c]">
                  {mandatoryUploaded} of {mandatoryTotal} mandatory certificates uploaded
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#e5dfce] bg-[#fbf9f4] p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8a7249]">
                  <Lock size={15} />
                  <span>Sign In Required to Save Documents</span>
                </div>
                <p className="mt-1 text-[11px] text-[#8a7b66]">
                  Sign in to link verified documents directly to loan applications.
                </p>
                <button
                  onClick={() => onNavigate?.("login")}
                  className="mt-3 rounded-lg bg-[#1769a8] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#12578c]"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>

          {/* Feedback banners */}
          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#f5c6cb] bg-[#fff5f5] p-3.5 text-xs font-semibold text-[#b02a37]">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#c3e6cb] bg-[#f2fbf4] p-3.5 text-xs font-semibold text-[#1e7e34]">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Document Checklist Grid */}
      <main className="mx-auto max-w-[1240px] px-6 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#172a43]">
              {t("documentChecklist", currentLanguage)}
            </h2>
            <p className="text-xs text-[#718496]">
              Verified by National Scheduled Castes Finance and Development Corporation (NSFDC) norms.
            </p>
          </div>
          <button
            onClick={fetchDocumentData}
            className="flex items-center gap-1.5 rounded-lg border border-[#cfdce5] bg-white px-3 py-1.5 text-xs font-semibold text-[#506379] hover:bg-[#f0f5fa]"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {requirements.map((req) => {
            const uploaded = getUploadedForType(req.document_type);
            const isUploading = uploadingType === req.document_type;

            return (
              <div
                key={req.document_type}
                className={[
                  "flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition",
                  uploaded
                    ? "border-[#b8e0c8] bg-[#fafffc]"
                    : "border-[#e1e8ed] hover:border-[#b4c8d8]",
                ].join(" ")}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                          req.mandatory
                            ? "bg-[#feeced] text-[#b32b38]"
                            : "bg-[#edf2f7] text-[#55697d]",
                        ].join(" ")}
                      >
                        {req.mandatory
                          ? t("mandatoryBadge", currentLanguage)
                          : t("optionalBadge", currentLanguage)}
                      </span>

                      {uploaded ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#dcf5e3] px-2.5 py-0.5 text-[10px] font-bold text-[#1e7e34]">
                          <CheckCircle2 size={11} />
                          {t("verifiedBadge", currentLanguage)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[10px] font-bold text-[#718496]">
                          <Clock size={11} />
                          {t("notUploadedBadge", currentLanguage)}
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl bg-[#f0f5fa] p-2.5 text-[#1769a8]">
                      <FileText size={20} />
                    </div>
                  </div>

                  <h3 className="mt-3 font-serif text-lg font-bold text-[#172a43]">
                    {currentLanguage === "hi" && req.name_hi
                      ? req.name_hi
                      : req.name}
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-[#5c7086]">
                    {req.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-[#8b9aa8]">
                    <span>Accepted: {req.accepted_formats?.join(", ").toUpperCase()}</span>
                    <span>•</span>
                    <span>Max: {req.max_size_mb}MB</span>
                  </div>
                </div>

                {/* Upload or Action Zone */}
                <div className="mt-6 border-t border-[#edf2f6] pt-4">
                  {uploaded ? (
                    <div className="flex items-center justify-between rounded-xl bg-[#f4fbf6] p-3 border border-[#d2edd9]">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="truncate text-xs font-bold text-[#172a43]">
                          {uploaded.document_name}
                        </p>
                        <p className="text-[10px] text-[#4d785a]">
                          {formatFileSize(uploaded.file_size)} • Uploaded {uploaded.created_at?.slice(0, 10)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(uploaded.id)}
                          className="rounded-lg p-1.5 text-[#8899a6] hover:bg-[#feecec] hover:text-[#b32b38] transition"
                          title={t("deleteDoc", currentLanguage)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[req.document_type] = el)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(req.document_type, file);
                        }}
                      />

                      <button
                        disabled={isUploading}
                        onClick={() => {
                          if (!isLoggedIn) {
                            setErrorMsg("Please sign in to upload documents.");
                            return;
                          }
                          fileInputRefs.current[req.document_type]?.click();
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#b8cddc] bg-[#f8fbfd] py-2.5 text-xs font-semibold text-[#1769a8] transition hover:border-[#1769a8] hover:bg-[#eef7fb] disabled:opacity-60"
                      >
                        <UploadCloud size={16} />
                        <span>
                          {isUploading
                            ? t("uploading", currentLanguage)
                            : t("uploadDocument", currentLanguage)}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
