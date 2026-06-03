import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BmsApi } from "@/api/bms";
import type {
  CreateHvacMaintenanceNoteRequest,
  HvacMaintenanceMessageAttachmentDto,
  HvacMaintenanceNoteDto,
  HvacMaintenanceNoteThreadDto,
  HvacMaintenanceNoteType,
} from "@/api/bms";

import { generateMaintenanceAiDraft } from "../../utils/maintenanceAi";

type UserRole =
  | "ADMIN"
  | "BMS_ADMIN"
  | "TECHNICIAN"
  | "FACILITY_MANAGER"
  | "SITE_MANAGER";

type NoteStatusFilter =
  | "ALL"
  | "SUBMITTED"
  | "REVIEWED"
  | "NEEDS_CLARIFICATION"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CLOSED";

interface HvacMaintenanceNotesPanelProps {
  tenantId: string;
  siteId: string;
  externalDeviceId: string;

  unitName?: string;
  temperature?: number | string | null;
  setpoint?: number | string | null;
  fanSpeed?: string | null;
  flowRate?: number | string | null;
  fault?: boolean | null;

  currentUserRole?: UserRole;
  currentUserRoles?: string[];
  currentUserName?: string;
  onFailureResolved?: () => void;
}

const emptyForm: CreateHvacMaintenanceNoteRequest = {
  noteType: "SCHEDULED_MAINTENANCE",
  workDone: "",
  filterChanged: false,
  serviceDone: false,
  failureCause: "",
  correctiveAction: "",
  sparePartsAdded: "",
  machineRestartedAt: "",
  technicianName: "",
};

function normalizeRole(role: string): string {
  return role.startsWith("ROLE_") ? role.replace("ROLE_", "") : role;
}

function getStatusLabel(status: string) {
  if (status === "REVIEWED") return "APPROVED";
  return status.replaceAll("_", " ");
}

function getDisplayStatus(note: HvacMaintenanceNoteDto) {
  return note.workflow?.workflowStatus ?? note.status;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
    case "REVIEWED":
      return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
    case "NEEDS_CLARIFICATION":
      return "border-amber-300/20 bg-amber-400/10 text-amber-100";
    case "RESUBMITTED":
      return "border-violet-300/20 bg-violet-400/10 text-violet-100";
    case "REJECTED":
      return "border-red-300/20 bg-red-400/10 text-red-100";
    case "CLOSED":
      return "border-slate-300/20 bg-slate-400/10 text-slate-200";
    default:
      return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
  }
}

export default function HvacMaintenanceNotesPanel({
  tenantId,
  siteId,
  externalDeviceId,
  unitName,
  temperature,
  setpoint,
  fanSpeed,
  flowRate,
  fault,
  currentUserRole,
  currentUserRoles,
  currentUserName,
  onFailureResolved,
}: HvacMaintenanceNotesPanelProps) {
  const [notes, setNotes] = useState<HvacMaintenanceNoteDto[]>([]);
  const [form, setForm] =
    useState<CreateHvacMaintenanceNoteRequest>(emptyForm);

  const [filterType, setFilterType] =
    useState<HvacMaintenanceNoteType | "ALL">("ALL");

  const [statusFilter, setStatusFilter] = useState<NoteStatusFilter>("ALL");
  const [searchText, setSearchText] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolvingFailure, setResolvingFailure] = useState(false);
  const [reviewingNoteId, setReviewingNoteId] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Thread drawer state:
   * - selectedThread stores full note + workflow + messages.
   * - threadOpen controls the right-side AI + Glass drawer.
   * - visibleMessageCount keeps long conversations compact.
   */
  const [selectedThread, setSelectedThread] =
    useState<HvacMaintenanceNoteThreadDto | null>(null);

  const [threadOpen, setThreadOpen] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadActionLoading, setThreadActionLoading] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyFilePreviews, setReplyFilePreviews] = useState<string[]>([]);
  const [clarificationText, setClarificationText] = useState("");
  const [visibleMessageCount, setVisibleMessageCount] = useState(10);

  const [initialFiles, setInitialFiles] = useState<File[]>([]);
  const [initialFilePreviews, setInitialFilePreviews] = useState<string[]>([]);

  /*
   * Used for both:
   * - selected local upload preview
   * - already uploaded maintenance attachment preview
   */
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const normalizedRoles = useMemo(() => {
    const roles =
      currentUserRoles && currentUserRoles.length > 0
        ? currentUserRoles
        : currentUserRole
        ? [currentUserRole]
        : [];

    return roles.map(normalizeRole);
  }, [currentUserRole, currentUserRoles]);

  const isAdminLike =
    normalizedRoles.includes("ADMIN") || normalizedRoles.includes("BMS_ADMIN");

  const isSiteManager = normalizedRoles.includes("SITE_MANAGER");

  const isTechnicianOnly =
    normalizedRoles.includes("TECHNICIAN") && !isAdminLike && !isSiteManager;

  const canCreateNote = isTechnicianOnly;

  const canReview = isAdminLike || isSiteManager;

  function clearReplyFiles() {
    replyFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    setReplyFiles([]);
    setReplyFilePreviews([]);
  }

  async function loadNotes() {
    if (!externalDeviceId?.trim()) {
      setNotes([]);
      setError("Cannot load notes: externalDeviceId is missing.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await BmsApi.getHvacMaintenanceNotes(
        tenantId,
        siteId,
        externalDeviceId,
        filterType
      );

      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Reset local filters, drawer, messages, photo previews, and pagination when selected HVAC changes.
   */
  useEffect(() => {
    setSuccessMessage("");
    setError("");
    setSearchText("");
    setStatusFilter("ALL");
    setFilterType("ALL");
    setPage(1);
    setThreadOpen(false);
    setSelectedThread(null);
    setReplyText("");
    setClarificationText("");
    setVisibleMessageCount(10);
    setPreviewImageUrl(null);
    clearReplyFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalDeviceId]);

  /**
   * Load maintenance notes whenever tenant/site/HVAC/type filter changes.
   *
   * Backend controls data visibility:
   * - technician receives only own notes
   * - manager/admin receives all notes
   */
  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, siteId, externalDeviceId, filterType]);

  /**
   * Cleanup temporary object URLs when component unmounts.
   */
  useEffect(() => {
    return () => {
      replyFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [replyFilePreviews]);

  function updateField<K extends keyof CreateHvacMaintenanceNoteRequest>(
    key: K,
    value: CreateHvacMaintenanceNoteRequest[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateForm() {
    if (form.noteType === "SCHEDULED_MAINTENANCE") {
      if (!form.workDone?.trim()) {
        return "Please enter what was done during maintenance.";
      }
    }

    if (form.noteType === "FAILURE_REPAIR") {
      if (!form.failureCause?.trim()) {
        return "Please enter the identified failure cause.";
      }

      if (!form.correctiveAction?.trim()) {
        return "Please enter the corrective action.";
      }
    }

    return "";
  }

  function buildPayload(): CreateHvacMaintenanceNoteRequest {
    return {
      ...form,
      technicianName: form.technicianName?.trim() || currentUserName || "",
      machineRestartedAt:
        form.machineRestartedAt && form.machineRestartedAt.trim()
          ? form.machineRestartedAt
          : undefined,
    };
  }

  function ensureExternalDeviceId() {
    if (!externalDeviceId || externalDeviceId.trim() === "") {
      setError("Cannot continue: externalDeviceId is missing.");
      return false;
    }

    return true;
  }

  function handleReplyFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;

    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type) || file.size > maxSizeBytes
    );

    if (invalidFile) {
      setError("Only JPEG, PNG, or WEBP images up to 5 MB are allowed.");
      return;
    }

    const mergedFiles = [...replyFiles, ...selectedFiles].slice(0, 5);

    if (replyFiles.length + selectedFiles.length > 5) {
      setError("Maximum 5 photos can be attached to one reply.");
    }

    replyFilePreviews.forEach((url) => URL.revokeObjectURL(url));

    setReplyFiles(mergedFiles);
    setReplyFilePreviews(mergedFiles.map((file) => URL.createObjectURL(file)));
  }

  function removeReplyFile(index: number) {
    const nextFiles = replyFiles.filter((_, fileIndex) => fileIndex !== index);

    replyFilePreviews.forEach((url) => URL.revokeObjectURL(url));

    setReplyFiles(nextFiles);
    setReplyFilePreviews(nextFiles.map((file) => URL.createObjectURL(file)));
  }


  function handleInitialFilesSelected(files: FileList | null) {
  if (!files || files.length === 0) return;

  const selectedFiles = Array.from(files);
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeBytes = 5 * 1024 * 1024;

  const invalidFile = selectedFiles.find(
    (file) => !allowedTypes.includes(file.type) || file.size > maxSizeBytes
  );

  if (invalidFile) {
    setError("Only JPEG, PNG, or WEBP images up to 5 MB are allowed.");
    return;
  }

  const mergedFiles = [...initialFiles, ...selectedFiles].slice(0, 5);

  if (initialFiles.length + selectedFiles.length > 5) {
    setError("Maximum 5 photos can be attached to one maintenance note.");
  }

  initialFilePreviews.forEach((url) => URL.revokeObjectURL(url));

  setInitialFiles(mergedFiles);
  setInitialFilePreviews(
    mergedFiles.map((file) => URL.createObjectURL(file))
  );
}

function removeInitialFile(index: number) {
  const nextFiles = initialFiles.filter((_, fileIndex) => fileIndex !== index);

  initialFilePreviews.forEach((url) => URL.revokeObjectURL(url));

  setInitialFiles(nextFiles);
  setInitialFilePreviews(
    nextFiles.map((file) => URL.createObjectURL(file))
  );
}

function clearInitialFiles() {
  initialFilePreviews.forEach((url) => URL.revokeObjectURL(url));
  setInitialFiles([]);
  setInitialFilePreviews([]);
}

  async function handleSubmit() {
    if (!canCreateNote) {
      setError("Only technicians can add maintenance notes from this screen.");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!ensureExternalDeviceId()) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      // await BmsApi.createHvacMaintenanceNote(
      //   tenantId,
      //   siteId,
      //   externalDeviceId,
      //   buildPayload()
      // );

      const createdNote = await BmsApi.createHvacMaintenanceNote(
        tenantId,
        siteId,
        externalDeviceId,
        buildPayload()
      );

      if (initialFiles.length > 0) {
        await BmsApi.replyToHvacMaintenanceThreadWithAttachments(
          tenantId,
          siteId,
          externalDeviceId,
          createdNote.noteId,
          "Initial maintenance photos attached.",
          initialFiles
        );
      }

      setSuccessMessage("Maintenance note submitted successfully.");

      setForm({
        ...emptyForm,
        noteType: form.noteType,
      });

      clearInitialFiles();

      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRepairNoteAndResolve() {
    if (!canCreateNote) {
      setError("Only technicians can add repair notes from this screen.");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!ensureExternalDeviceId()) return;

    const confirmed = window.confirm(
      "Confirm this HVAC failure has been repaired and the machine is running normally?"
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setResolvingFailure(true);
      setError("");
      setSuccessMessage("");

      await BmsApi.createHvacMaintenanceNote(
        tenantId,
        siteId,
        externalDeviceId,
        buildPayload()
      );

      await BmsApi.markHvacFailureGone(tenantId, siteId, externalDeviceId);

      setSuccessMessage("Repair note submitted and failure marked as resolved.");

      setForm({
        ...emptyForm,
        noteType: "FAILURE_REPAIR",
      });

      await loadNotes();
      onFailureResolved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save repair note and resolve failure"
      );
    } finally {
      setSaving(false);
      setResolvingFailure(false);
    }
  }

  async function handleMarkFailureGone() {
    if (!canCreateNote) {
      setError("Only technicians can resolve failures from this screen.");
      return;
    }

    if (!ensureExternalDeviceId()) return;

    const confirmed = window.confirm(
      "Are you sure this HVAC failure is repaired and the machine is running normally?"
    );

    if (!confirmed) return;

    try {
      setResolvingFailure(true);
      setError("");
      setSuccessMessage("");

      await BmsApi.markHvacFailureGone(tenantId, siteId, externalDeviceId);

      setSuccessMessage("Failure marked as resolved successfully.");

      await loadNotes();
      onFailureResolved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark failure as resolved"
      );
    } finally {
      setResolvingFailure(false);
    }
  }

  async function handleReview(noteId: string) {
    if (!canReview) {
      setError("Only Site Managers or BMS Admins can approve maintenance notes.");
      return;
    }

    if (!ensureExternalDeviceId()) return;

    try {
      setReviewingNoteId(noteId);
      setError("");
      setSuccessMessage("");

      await BmsApi.reviewHvacMaintenanceNote(
        tenantId,
        siteId,
        externalDeviceId,
        noteId
      );

      setSuccessMessage("Maintenance note approved successfully.");
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve note");
    } finally {
      setReviewingNoteId(null);
    }
  }

  async function openThread(noteId: string) {
    if (!ensureExternalDeviceId()) return;

    try {
      setThreadOpen(true);
      setThreadLoading(true);
      setError("");
      setReplyText("");
      setClarificationText("");
      setVisibleMessageCount(10);
      setPreviewImageUrl(null);
      clearReplyFiles();

      const data = await BmsApi.getHvacMaintenanceNoteThread(
        tenantId,
        siteId,
        externalDeviceId,
        noteId
      );

      setSelectedThread(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load note thread");
      setThreadOpen(false);
      setSelectedThread(null);
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleSendReply() {
    if (!selectedThread?.note?.noteId) return;

    /*
    * Message text is optional only when photos are attached.
    * Backend still receives a non-empty message string.
    */
    const message =
      replyText.trim() ||
      (replyFiles.length > 0 ? "Photo attachment added." : "");

    if (!message && replyFiles.length === 0) {
      setError("Please write a reply or attach at least one photo.");
      return;
    }

    try {
      setThreadActionLoading(true);
      setError("");
      setSuccessMessage("");

      /*
      * Preserve existing text-only flow.
      * Only use multipart upload endpoint when user selected one or more photos.
      */
      const updatedThread =
        replyFiles.length > 0
          ? await BmsApi.replyToHvacMaintenanceThreadWithAttachments(
              tenantId,
              siteId,
              externalDeviceId,
              selectedThread.note.noteId,
              message,
              replyFiles
            )
          : await BmsApi.replyToHvacMaintenanceThread(
              tenantId,
              siteId,
              externalDeviceId,
              selectedThread.note.noteId,
              { message }
            );

      setSelectedThread(updatedThread);
      setReplyText("");
      clearReplyFiles();
      setVisibleMessageCount(10);
      setSuccessMessage("Reply sent successfully.");
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setThreadActionLoading(false);
    }
  }

  async function handleRequestClarification() {
    if (!selectedThread?.note?.noteId) return;

    const message = clarificationText.trim();

    if (!message) {
      setError("Clarification message is required.");
      return;
    }

    try {
      setThreadActionLoading(true);
      setError("");
      setSuccessMessage("");

      const updatedThread = await BmsApi.requestHvacMaintenanceClarification(
        tenantId,
        siteId,
        externalDeviceId,
        selectedThread.note.noteId,
        { message }
      );

      setSelectedThread(updatedThread);
      setClarificationText("");
      setVisibleMessageCount(10);
      setSuccessMessage("Clarification request sent to technician.");
      await loadNotes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to request clarification"
      );
    } finally {
      setThreadActionLoading(false);
    }
  }

  async function handleReviewFromThread() {
    if (!selectedThread?.note?.noteId) return;

    await handleReview(selectedThread.note.noteId);

    try {
      const updatedThread = await BmsApi.getHvacMaintenanceNoteThread(
        tenantId,
        siteId,
        externalDeviceId,
        selectedThread.note.noteId
      );

      setSelectedThread(updatedThread);
    } catch {
      // Existing review flow already succeeded; thread refresh failure should not break UX.
    }
  }

  function handleGenerateAiDraft() {
    if (!canCreateNote) {
      setError("Only technicians can generate maintenance note drafts.");
      return;
    }

    const draft = generateMaintenanceAiDraft({
      noteType: form.noteType,
      unitName,
      externalDeviceId,
      temperature,
      setpoint,
      fanSpeed,
      flowRate,
      fault,
    });

    setForm((prev) => ({
      ...prev,
      ...draft,
    }));

    setSuccessMessage("AI draft generated. Please review before saving.");
  }

  const noteStats = useMemo(() => {
    const scheduled = notes.filter(
      (note) => note.noteType === "SCHEDULED_MAINTENANCE"
    ).length;

    const failure = notes.filter(
      (note) => note.noteType === "FAILURE_REPAIR"
    ).length;

    const pending = notes.filter((note) => {
      const status = getDisplayStatus(note);
      return status === "SUBMITTED" || status === "RESUBMITTED";
    }).length;

    const needsClarification = notes.filter(
      (note) => getDisplayStatus(note) === "NEEDS_CLARIFICATION"
    ).length;

    const approved = notes.filter((note) => {
      const status = getDisplayStatus(note);
      return status === "REVIEWED" || status === "APPROVED";
    }).length;

    return {
      scheduled,
      failure,
      pending,
      needsClarification,
      approved,
    };
  }, [notes]);

  const aiMaintenanceSummary = useMemo(() => {
    if (noteStats.needsClarification > 0) {
      return {
        title: "Clarification needed",
        message: `${noteStats.needsClarification} maintenance note${
          noteStats.needsClarification > 1 ? "s need" : " needs"
        } technician follow-up before approval.`,
        action: "Open the review thread and check manager questions first.",
        severity: "WARNING",
      };
    }

    if (noteStats.pending > 0) {
      return {
        title: "Pending manager review",
        message: `${noteStats.pending} submitted maintenance note${
          noteStats.pending > 1 ? "s are" : " is"
        } waiting for review.`,
        action: "Review newest submitted notes and approve or ask clarification.",
        severity: "INFO",
      };
    }

    if (noteStats.failure > 0) {
      return {
        title: "Failure repair history available",
        message: `${noteStats.failure} failure repair note${
          noteStats.failure > 1 ? "s are" : " is"
        } recorded for this HVAC.`,
        action: "Check repeated failure causes and corrective actions.",
        severity: "WARNING",
      };
    }

    return {
      title: "Maintenance record healthy",
      message: "No pending review or clarification actions for this HVAC.",
      action: "Continue monitoring and record future service work.",
      severity: "GOOD",
    };
  }, [noteStats]);

  const filteredNotes = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return notes.filter((note) => {
      const displayStatus = getDisplayStatus(note);

      const matchesStatus =
        statusFilter === "ALL" ||
        displayStatus === statusFilter ||
        note.status === statusFilter;

      const matchesSearch =
        !search ||
        note.technicianName?.toLowerCase().includes(search) ||
        note.workDone?.toLowerCase().includes(search) ||
        note.failureCause?.toLowerCase().includes(search) ||
        note.correctiveAction?.toLowerCase().includes(search) ||
        note.sparePartsAdded?.toLowerCase().includes(search) ||
        displayStatus.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [notes, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));

  const pagedNotes = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredNotes.slice(start, start + pageSize);
  }, [filteredNotes, page, pageSize, totalPages]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const hasActiveFault = Boolean(fault);

  return (
    <div className="w-full max-w-full space-y-5 overflow-x-hidden">
      <div className="rounded-3xl border border-cyan-300/15 bg-linear-to-br from-cyan-400/10 via-slate-950/80 to-blue-500/10 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
              AI Maintenance Intelligence
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-slate-100">
              {isTechnicianOnly
                ? "Technician Workflow"
                : "Maintenance Review Center"}
            </h2>

            <p className="mt-1 wrap-break-word text-sm text-slate-400">
              {unitName || externalDeviceId} · {aiMaintenanceSummary.message}
            </p>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-slate-100">
                {aiMaintenanceSummary.title}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Suggested action:{" "}
                <span className="text-cyan-100">
                  {aiMaintenanceSummary.action}
                </span>
              </p>
            </div>

            {hasActiveFault && (
              <div className="mt-3 inline-flex rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-100">
                Active fault detected
              </div>
            )}
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 text-center sm:grid-cols-5 lg:grid-cols-5">
            <MetricCard label="Scheduled" value={noteStats.scheduled} />
            <MetricCard label="Failures" value={noteStats.failure} tone="red" />
            <MetricCard label="Pending" value={noteStats.pending} tone="amber" />
            <MetricCard
              label="Clarify"
              value={noteStats.needsClarification}
              tone="violet"
            />
            <MetricCard
              label="Approved"
              value={noteStats.approved}
              tone="green"
            />
          </div>
        </div>
      </div>

      {canCreateNote && (
        <div className="rounded-3xl border border-white/20 bg-slate-950/60 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                Add Maintenance Note
              </h3>
              <p className="text-sm text-slate-400">
                Record scheduled maintenance or failure repair details.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateAiDraft}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg transition hover:bg-cyan-400/20"
            >
              ✨ Generate AI Draft
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Note Type
              </label>
              <select
                value={form.noteType}
                onChange={(e) =>
                  updateField(
                    "noteType",
                    e.target.value as HvacMaintenanceNoteType
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none ring-cyan-400/30 focus:ring-2"
              >
                <option value="SCHEDULED_MAINTENANCE">
                  Scheduled Maintenance
                </option>
                <option value="FAILURE_REPAIR">Failure Repair</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Technician Name
              </label>
              <input
                value={form.technicianName ?? ""}
                onChange={(e) => updateField("technicianName", e.target.value)}
                placeholder={currentUserName || "Technician name"}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none ring-cyan-400/30 placeholder:text-slate-500 focus:ring-2"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm text-slate-300">
              What has done?
            </label>
            <textarea
              value={form.workDone ?? ""}
              onChange={(e) => updateField("workDone", e.target.value)}
              rows={4}
              placeholder="Example: Cleaned unit, checked airflow, changed filter, tested cooling cycle..."
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none ring-cyan-400/30 placeholder:text-slate-500 focus:ring-2"
            />
          </div>

          <div className="mt-4 rounded-3xl border border-cyan-300/10 bg-slate-900/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Maintenance Photos
                </p>
                <p className="text-xs text-slate-500">
                  Optional. Upload photos of HVAC parts, filters, damage, or completed work.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-400/25">
                <span>📷</span>
                <span>Choose Photos</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleInitialFilesSelected(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {initialFilePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {initialFilePreviews.map((url, index) => (
                  <div
                    key={url}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewImageUrl(url)}
                      className="block w-full"
                    >
                      <img
                        src={url}
                        alt={`Selected maintenance photo ${index + 1}`}
                        className="h-28 w-full object-cover transition group-hover:scale-105"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeInitialFile(index)}
                      className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-xs text-red-100 backdrop-blur hover:bg-red-500/80"
                    >
                      Remove
                    </button>

                    <p className="truncate px-2 py-2 text-xs text-slate-400">
                      {initialFiles[index]?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(form.filterChanged)}
                onChange={(e) => updateField("filterChanged", e.target.checked)}
                className="h-4 w-4"
              />
              Filter changed
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(form.serviceDone)}
                onChange={(e) => updateField("serviceDone", e.target.checked)}
                className="h-4 w-4"
              />
              Service done
            </label>
          </div>

          {form.noteType === "FAILURE_REPAIR" && (
            <div className="mt-5 space-y-4 rounded-3xl border border-red-300/20 bg-red-500/5 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-100">
                    Failure Repair Details
                  </p>
                  <p className="text-xs text-red-100/70">
                    Save the real cause and corrective action before resolving.
                  </p>
                </div>

                {hasActiveFault && (
                  <button
                    type="button"
                    onClick={handleMarkFailureGone}
                    disabled={resolvingFailure}
                    className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resolvingFailure ? "Resolving..." : "Mark Failure Gone"}
                  </button>
                )}
              </div>

              <textarea
                value={form.failureCause ?? ""}
                onChange={(e) => updateField("failureCause", e.target.value)}
                rows={3}
                placeholder="Real failure cause..."
                className="w-full rounded-2xl border border-red-200/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none ring-red-400/30 placeholder:text-slate-500 focus:ring-2"
              />

              <textarea
                value={form.correctiveAction ?? ""}
                onChange={(e) =>
                  updateField("correctiveAction", e.target.value)
                }
                rows={3}
                placeholder="Corrective action..."
                className="w-full rounded-2xl border border-red-200/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none ring-red-400/30 placeholder:text-slate-500 focus:ring-2"
              />
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {successMessage}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {form.noteType === "FAILURE_REPAIR" && hasActiveFault && (
              <button
                type="button"
                onClick={handleSaveRepairNoteAndResolve}
                disabled={saving || resolvingFailure}
                className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving || resolvingFailure
                  ? "Saving & Resolving..."
                  : "Save Repair Note & Resolve Failure"}
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Submit Maintenance Note"}
            </button>
          </div>
        </div>
      )}

      {!canCreateNote && (error || successMessage) && (
        <div className="space-y-3">
          {error && (
            <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {successMessage}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-100">
            {isTechnicianOnly
              ? "My Maintenance Inbox"
              : "Maintenance Review Inbox"}
          </h3>
          <p className="text-sm text-slate-400">
            {isTechnicianOnly
              ? "Open a thread to reply to manager clarification requests."
              : "Open a thread to approve, ask clarification, or review technician records."}
          </p>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <input
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            placeholder="Search notes..."
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400/30 placeholder:text-slate-500 focus:ring-2"
          />

          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as HvacMaintenanceNoteType | "ALL");
              setPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400/30 focus:ring-2"
          >
            <option value="ALL">All Types</option>
            <option value="SCHEDULED_MAINTENANCE">Scheduled</option>
            <option value="FAILURE_REPAIR">Failure Repair</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as NoteStatusFilter);
              setPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400/30 focus:ring-2"
          >
            <option value="ALL">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="NEEDS_CLARIFICATION">Needs Clarification</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="REVIEWED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400/30 focus:ring-2"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Loading maintenance notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
            {isTechnicianOnly
              ? "You have no maintenance notes matching these filters."
              : "No maintenance notes matched your filters."}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {pagedNotes.map((note) => {
                const displayStatus = getDisplayStatus(note);
                const isReviewing = reviewingNoteId === note.noteId;
                const isApproved =
                  displayStatus === "APPROVED" ||
                  displayStatus === "REVIEWED" ||
                  note.status === "REVIEWED";

                const summary =
                  note.workDone ||
                  note.failureCause ||
                  note.correctiveAction ||
                  "No summary provided.";

                return (
                  <div
                    key={note.noteId}
                    className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 shadow-xl sm:p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              note.noteType === "FAILURE_REPAIR"
                                ? "border-red-300/20 bg-red-500/15 text-red-100"
                                : "border-cyan-300/20 bg-cyan-500/15 text-cyan-100"
                            }`}
                          >
                            {note.noteType === "FAILURE_REPAIR"
                              ? "Failure Repair"
                              : "Scheduled Maintenance"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                              displayStatus
                            )}`}
                          >
                            {getStatusLabel(displayStatus)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          Technician:{" "}
                          <span className="text-slate-200">
                            {note.technicianName || "Unknown"}
                          </span>
                        </p>

                        <p className="text-xs text-slate-500">
                          Created: {formatDate(note.createdAt)}
                        </p>

                        <p className="mt-3 line-clamp-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-300">
                          {summary}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openThread(note.noteId)}
                          className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                        >
                          View Thread
                        </button>

                        {canReview &&
                          (isApproved ? (
                            <button
                              type="button"
                              disabled
                              className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200/80 opacity-80"
                            >
                              Approved
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReview(note.noteId)}
                              disabled={isReviewing}
                              className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isReviewing ? "Approving..." : "Approve"}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <SmallInfo
                        label="Filter Changed"
                        value={note.filterChanged ? "Yes" : "No"}
                      />
                      <SmallInfo
                        label="Service Done"
                        value={note.serviceDone ? "Yes" : "No"}
                      />
                      <SmallInfo
                        label="Thread Status"
                        value={getStatusLabel(displayStatus)}
                      />
                    </div>

                    {note.reviewedAt && (
                      <p className="mt-4 text-xs text-emerald-200/80">
                        Approved at {formatDate(note.reviewedAt)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Page {page} of {totalPages} · {filteredNotes.length} records
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-xl border border-white/10 px-4 py-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className="rounded-xl border border-white/10 px-4 py-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {threadOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
          >
            <button
              type="button"
              aria-label="Close maintenance thread"
              className="absolute inset-0 cursor-default"
              onClick={() => setThreadOpen(false)}
            />

            <motion.aside
              className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-300/20 bg-slate-950/95 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl"
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 24,
                mass: 0.9,
              }}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                    AI Maintenance Thread
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-100">
                    Review Conversation
                  </h3>
                  <p className="mt-1 break-all text-sm text-slate-400">
                    {unitName || externalDeviceId}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setThreadOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              {threadLoading && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  Loading thread...
                </div>
              )}

              {!threadLoading && selectedThread && (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-cyan-300/15 bg-linear-to-br from-cyan-400/10 via-slate-900/70 to-blue-500/10 p-4 shadow-xl shadow-cyan-950/20">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Note Summary
                        </p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-100">
                          {selectedThread.note.noteType.replaceAll("_", " ")}
                        </h4>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          selectedThread.workflow?.workflowStatus ??
                            selectedThread.note.workflow?.workflowStatus ??
                            selectedThread.note.status
                        )}`}
                      >
                        {getStatusLabel(
                          selectedThread.workflow?.workflowStatus ??
                            selectedThread.note.workflow?.workflowStatus ??
                            selectedThread.note.status
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500">Technician</span>
                        <p className="text-slate-100">
                          {selectedThread.note.technicianName || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-500">Created</span>
                        <p className="text-slate-100">
                          {formatDate(selectedThread.note.createdAt)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                      {selectedThread.note.workDone ||
                        selectedThread.note.failureCause ||
                        selectedThread.note.correctiveAction ||
                        "No summary provided."}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-100">
                        Conversation
                      </h4>

                      <span className="text-xs text-slate-500">
                        {selectedThread.messages.length} messages
                      </span>
                    </div>

                    {visibleMessageCount < selectedThread.messages.length && (
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleMessageCount((prev) => prev + 10)
                        }
                        className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                      >
                        Show older messages
                      </button>
                    )}

                    <div className="space-y-3">
                      {selectedThread.messages
                        .slice(
                          Math.max(
                            selectedThread.messages.length - visibleMessageCount,
                            0
                          )
                        )
                        .map((message) => (
                          <div
                            key={message.messageId}
                            className="rounded-2xl border border-white/10 bg-slate-900/70 p-3"
                          >
                            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-cyan-200">
                                {message.senderDisplayName ||
                                  message.senderEmail ||
                                  "System"}
                              </p>

                              <p className="text-[11px] text-slate-500">
                                {formatDate(message.createdAt)}
                              </p>
                            </div>

                            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
                              {message.messageType.replaceAll("_", " ")}
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                              {message.message}
                            </p>

                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                  {message.attachments.map((attachment) => (
                                    <MaintenanceAttachmentThumbnail
                                      key={attachment.attachmentId}
                                      attachment={attachment}
                                      onPreview={setPreviewImageUrl}
                                    />
                                  ))}
                                </div>
                              )}
                          </div>
                        ))}

                      {selectedThread.messages.length === 0 && (
                        <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                          No conversation messages yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <label className="block text-sm font-medium text-slate-200">
                          Reply
                        </label>
                        <p className="mt-1 text-xs text-slate-500">
                          Write a message, upload photos, or do both.
                        </p>
                      </div>

                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-400/25">
                        <span>📷</span>
                        <span>Upload Photos</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            handleReplyFilesSelected(event.target.files);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Write a reply to this maintenance thread..."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400/30 placeholder:text-slate-600 focus:ring-2"
                    />

                    <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-slate-900/50 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            Attach photos if needed
                          </p>
                          <p className="text-xs text-slate-500">
                            JPEG, PNG, or WEBP. Max 5 photos, 5 MB each.
                          </p>
                        </div>

                        <label className="cursor-pointer rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20">
                          Add More Photos
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                              handleReplyFilesSelected(event.target.files);
                              event.target.value = "";
                            }}
                          />
                        </label>
                      </div>

                      {replyFilePreviews.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {replyFilePreviews.map((url, index) => (
                            <div
                              key={url}
                              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                            >
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(url)}
                                className="block w-full"
                              >
                                <img
                                  src={url}
                                  alt={`Selected maintenance attachment ${index + 1}`}
                                  className="h-28 w-full object-cover transition group-hover:scale-105"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeReplyFile(index)}
                                className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-xs text-red-100 backdrop-blur hover:bg-red-500/80"
                              >
                                Remove
                              </button>

                              <p className="truncate px-2 py-2 text-xs text-slate-400">
                                {replyFiles[index]?.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={
                          threadActionLoading ||
                          (!replyText.trim() && replyFiles.length === 0)
                        }
                        className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {threadActionLoading
                          ? "Sending..."
                          : replyFiles.length > 0
                          ? "Send Reply with Photos"
                          : "Send Reply"}
                      </button>

                      {canReview &&
                        selectedThread.note.status !== "REVIEWED" &&
                        selectedThread.workflow?.workflowStatus !== "APPROVED" && (
                          <button
                            type="button"
                            onClick={handleReviewFromThread}
                            disabled={threadActionLoading}
                            className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve Note
                          </button>
                        )}
                    </div>
                  </div>

                  {canReview && (
                    <div className="rounded-3xl border border-amber-300/15 bg-amber-400/5 p-4">
                      <label className="mb-2 block text-sm font-medium text-amber-100">
                        Ask Technician for Clarification
                      </label>

                      <textarea
                        value={clarificationText}
                        onChange={(e) => setClarificationText(e.target.value)}
                        rows={3}
                        placeholder="Example: Please confirm whether the machine was restarted after service."
                        className="w-full resize-none rounded-2xl border border-amber-300/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-amber-400/30 placeholder:text-slate-600 focus:ring-2"
                      />

                      <button
                        type="button"
                        onClick={handleRequestClarification}
                        disabled={
                          threadActionLoading || !clarificationText.trim()
                        }
                        className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {threadActionLoading
                          ? "Sending..."
                          : "Request Clarification"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImageUrl && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Close image preview"
              onClick={() => setPreviewImageUrl(null)}
            />

            <motion.div
              className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="absolute right-3 top-3 z-10 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 backdrop-blur hover:bg-white/10"
              >
                Close
              </button>

              <img
                src={previewImageUrl}
                alt="Maintenance attachment preview"
                className="max-h-[90vh] w-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MaintenanceAttachmentThumbnail({
  attachment,
  onPreview,
}: {
  attachment: HvacMaintenanceMessageAttachmentDto;
  onPreview: (url: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function loadImage() {
      try {
        setFailed(false);

        objectUrl = await BmsApi.getMaintenanceAttachmentObjectUrl(
          attachment.downloadUrl
        );

        if (active) {
          setImageUrl(objectUrl);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    }

    loadImage();

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachment.downloadUrl]);

  if (failed) {
    return (
      <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs text-red-100">
        Failed to load image
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs text-slate-500">
        Loading image...
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPreview(imageUrl)}
      className="group overflow-hidden rounded-2xl border border-cyan-300/10 bg-white/5 text-left transition hover:border-cyan-300/30"
    >
      <img
        src={imageUrl}
        alt={attachment.originalFileName}
        className="h-28 w-full object-cover transition group-hover:scale-105"
      />

      <div className="p-2">
        <p className="truncate text-xs text-slate-300">
          {attachment.originalFileName}
        </p>
        <p className="text-[11px] text-slate-500">
          {formatFileSize(attachment.fileSizeBytes)}
        </p>
      </div>
    </button>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "red" | "amber" | "violet" | "green";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-300/20 bg-red-500/10 text-red-200"
      : tone === "amber"
      ? "border-amber-300/20 bg-amber-500/10 text-amber-200"
      : tone === "violet"
      ? "border-violet-300/20 bg-violet-500/10 text-violet-200"
      : tone === "green"
      ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-200"
      : "border-white/10 bg-white/10 text-slate-100";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs opacity-75">{label}</p>
    </div>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "Unknown size";

  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }

  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}