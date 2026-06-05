import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BmsApi } from "@/api/bms";
import type {
  CreateHvacMaintenanceNoteRequest,
  HvacMaintenanceMessageAttachmentDto,
  HvacMaintenanceNoteDto,
  HvacMaintenanceNoteThreadDto,
  HvacMaintenanceNoteType,
  HvacMaintenanceWorkflowStatus,
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
  | "NEEDS_CLARIFICATION"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CLOSED"
  | "REVIEWED";

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

function formatDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getDisplayStatus(note: HvacMaintenanceNoteDto): string {
  return note.workflow?.workflowStatus ?? note.status;
}

function getStatusLabel(status?: string | null): string {
  if (!status) return "SUBMITTED";
  if (status === "REVIEWED") return "APPROVED";
  return status.replaceAll("_", " ");
}

function getStatusBadgeClass(status?: string | null): string {
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

function isWorkflowClosed(status?: string | null): boolean {
  return status === "CLOSED";
}

function isWorkflowApproved(status?: string | null): boolean {
  return status === "APPROVED" || status === "REVIEWED";
}

function isWorkflowRejected(status?: string | null): boolean {
  return status === "REJECTED";
}

function canManagerAct(status?: string | null): boolean {
  return !isWorkflowClosed(status);
}

function getWorkflowStep(status?: string | null): number {
  switch (status) {
    case "NEEDS_CLARIFICATION":
      return 2;
    case "RESUBMITTED":
      return 3;
    case "APPROVED":
    case "REVIEWED":
    case "REJECTED":
      return 4;
    case "CLOSED":
      return 5;
    default:
      return 1;
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

  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Thread drawer state.
   *
   * Production workflow:
   * - selectedThread contains note + workflow + messages.
   * - manager/admin can approve, reject, ask clarification, or close.
   * - technician can reply and attach photos until workflow is closed.
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
  const [reviewComment, setReviewComment] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");

  const [visibleMessageCount, setVisibleMessageCount] = useState(10);

  /*
   * Initial note photos are uploaded as first thread reply after note creation.
   * This keeps the existing database design unchanged.
   */
  const [initialFiles, setInitialFiles] = useState<File[]>([]);
  const [initialFilePreviews, setInitialFilePreviews] = useState<string[]>([]);

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [remotePreviewUrls, setRemotePreviewUrls] = useState<string[]>([]);

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

  const isSiteManager =
    normalizedRoles.includes("SITE_MANAGER") ||
    normalizedRoles.includes("FACILITY_MANAGER");

  const isTechnicianOnly =
    normalizedRoles.includes("TECHNICIAN") && !isAdminLike && !isSiteManager;

  const canCreateNote = isTechnicianOnly;
  const canReview = isAdminLike || isSiteManager;

  const selectedWorkflowStatus =
    selectedThread?.workflow?.workflowStatus ??
    selectedThread?.note?.workflow?.workflowStatus ??
    selectedThread?.note?.status;

  const selectedWorkflowIsClosed = isWorkflowClosed(selectedWorkflowStatus);

  function clearReplyFiles() {
    replyFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    setReplyFiles([]);
    setReplyFilePreviews([]);
  }

  function clearInitialFiles() {
    initialFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    setInitialFiles([]);
    setInitialFilePreviews([]);
  }

  function clearRemotePreviewUrls() {
    remotePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setRemotePreviewUrls([]);
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

  /*
   * Reset local UI state when selected HVAC changes.
   * This prevents old thread/photo state appearing under another HVAC.
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
    setReviewComment("");
    setRejectedReason("");
    setVisibleMessageCount(10);
    setPreviewImageUrl(null);
    clearReplyFiles();
    clearInitialFiles();
    clearRemotePreviewUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalDeviceId]);

  /*
   * Load notes whenever tenant/site/HVAC/type filter changes.
   * Backend enforces technician-only visibility.
   */
  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, siteId, externalDeviceId, filterType]);

  /*
   * Cleanup generated browser object URLs.
   */
  useEffect(() => {
    return () => {
      replyFilePreviews.forEach((url) => URL.revokeObjectURL(url));
      initialFilePreviews.forEach((url) => URL.revokeObjectURL(url));
      remotePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [replyFilePreviews, initialFilePreviews, remotePreviewUrls]);

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
        return "Please enter work performed.";
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

  function validateSelectedFiles(files: File[]) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024;

    const invalidFile = files.find(
      (file) => !allowedTypes.includes(file.type) || file.size > maxSizeBytes
    );

    if (invalidFile) {
      setError("Only JPEG, PNG, or WEBP images up to 5 MB are allowed.");
      return false;
    }

    return true;
  }

  function handleInitialFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    if (!validateSelectedFiles(selectedFiles)) return;

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

  function handleReplyFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    if (!validateSelectedFiles(selectedFiles)) return;

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

      const createdNote = await BmsApi.createHvacMaintenanceNote(
        tenantId,
        siteId,
        externalDeviceId,
        buildPayload()
      );

      /*
       * Upload selected initial photos as the first thread reply.
       * Existing backend data model remains unchanged.
       */
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
          "Initial repair evidence photos attached.",
          initialFiles
        );
      }

      await BmsApi.markHvacFailureGone(tenantId, siteId, externalDeviceId);

      setSuccessMessage("Repair note submitted and failure marked as resolved.");

      setForm({
        ...emptyForm,
        noteType: "FAILURE_REPAIR",
      });

      clearInitialFiles();
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

  async function openThread(noteId: string) {
    if (!ensureExternalDeviceId()) return;

    try {
      setThreadOpen(true);
      setThreadLoading(true);
      setError("");
      setReplyText("");
      setClarificationText("");
      setReviewComment("");
      setRejectedReason("");
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

  async function refreshSelectedThread(noteId: string) {
    const updatedThread = await BmsApi.getHvacMaintenanceNoteThread(
      tenantId,
      siteId,
      externalDeviceId,
      noteId
    );

    setSelectedThread(updatedThread);
  }

  async function handleSendReply() {
    if (!selectedThread?.note?.noteId) return;

    if (selectedWorkflowIsClosed) {
      setError("Closed workflow cannot receive new replies.");
      return;
    }

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

    if (!canReview) {
      setError("Only Site Managers or BMS Admins can request clarification.");
      return;
    }

    if (selectedWorkflowIsClosed) {
      setError("Closed workflow cannot be updated.");
      return;
    }

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

  async function handleApprove(noteId: string) {
    if (!canReview) {
      setError("Only Site Managers or BMS Admins can approve maintenance notes.");
      return;
    }

    if (!ensureExternalDeviceId()) return;

    try {
      setThreadActionLoading(true);
      setError("");
      setSuccessMessage("");

      await BmsApi.reviewHvacMaintenanceNote(
        tenantId,
        siteId,
        externalDeviceId,
        noteId,
        {
          reviewComment: reviewComment.trim() || null,
        }
      );

      setSuccessMessage("Maintenance workflow approved.");
      setReviewComment("");
      await loadNotes();

      if (selectedThread?.note?.noteId === noteId) {
        await refreshSelectedThread(noteId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve note");
    } finally {
      setThreadActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selectedThread?.note?.noteId) return;

    if (!canReview) {
      setError("Only Site Managers or BMS Admins can reject maintenance notes.");
      return;
    }

    if (selectedWorkflowIsClosed) {
      setError("Closed workflow cannot be updated.");
      return;
    }

    const reason = rejectedReason.trim();

    if (!reason) {
      setError("Rejected reason is required.");
      return;
    }

    const confirmed = window.confirm(
      "Reject this maintenance workflow and notify the technician?"
    );

    if (!confirmed) return;

    try {
      setThreadActionLoading(true);
      setError("");
      setSuccessMessage("");

      await BmsApi.rejectHvacMaintenanceNote(
        tenantId,
        siteId,
        externalDeviceId,
        selectedThread.note.noteId,
        {
          reviewComment: reviewComment.trim() || null,
          rejectedReason: reason,
        }
      );

      setRejectedReason("");
      setReviewComment("");
      setSuccessMessage("Maintenance workflow rejected.");
      await loadNotes();
      await refreshSelectedThread(selectedThread.note.noteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject note");
    } finally {
      setThreadActionLoading(false);
    }
  }

  async function handleCloseWorkflow() {
    if (!selectedThread?.note?.noteId) return;

    if (!canReview) {
      setError("Only Site Managers or BMS Admins can close maintenance workflow.");
      return;
    }

    const confirmed = window.confirm(
      "Close this maintenance workflow? Closed workflows cannot receive more replies."
    );

    if (!confirmed) return;

    try {
      setThreadActionLoading(true);
      setError("");
      setSuccessMessage("");

      await BmsApi.closeHvacMaintenanceWorkflow(
        tenantId,
        siteId,
        externalDeviceId,
        selectedThread.note.noteId,
        {
          reviewComment: reviewComment.trim() || null,
        }
      );

      setReviewComment("");
      setSuccessMessage("Maintenance workflow closed.");
      await loadNotes();
      await refreshSelectedThread(selectedThread.note.noteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close workflow");
    } finally {
      setThreadActionLoading(false);
    }
  }

  async function openAttachmentPreview(
    attachment: HvacMaintenanceMessageAttachmentDto
  ) {
    try {
      setError("");
      const objectUrl = await BmsApi.getMaintenanceAttachmentObjectUrl(
        attachment.downloadUrl
      );

      setRemotePreviewUrls((prev) => [...prev, objectUrl]);
      setPreviewImageUrl(objectUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load attachment preview"
      );
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
      return status === "APPROVED" || status === "REVIEWED";
    }).length;

    const rejected = notes.filter(
      (note) => getDisplayStatus(note) === "REJECTED"
    ).length;

    const closed = notes.filter(
      (note) => getDisplayStatus(note) === "CLOSED"
    ).length;

    return {
      scheduled,
      failure,
      pending,
      needsClarification,
      approved,
      rejected,
      closed,
    };
  }, [notes]);

  const aiMaintenanceSummary = useMemo(() => {
    if (isTechnicianOnly && noteStats.needsClarification > 0) {
      return {
        title: "Action required",
        message: `${noteStats.needsClarification} maintenance note needs your clarification.`,
        action: "Open the thread and reply to manager questions.",
      };
    }

    if (canReview && noteStats.pending > 0) {
      return {
        title: "Pending manager review",
        message: `${noteStats.pending} submitted maintenance note${
          noteStats.pending > 1 ? "s are" : " is"
        } waiting for review.`,
        action:
          "Open newest submitted notes, approve, reject, or ask clarification.",
      };
    }

    if (noteStats.failure > 0) {
      return {
        title: "Failure repair history available",
        message: `${noteStats.failure} failure repair note${
          noteStats.failure > 1 ? "s are" : " is"
        } recorded for this HVAC.`,
        action: "Check repeated failure causes and corrective actions.",
      };
    }

    return {
      title: "Maintenance record healthy",
      message: "No pending review or clarification actions for this HVAC.",
      action: "Continue monitoring and record future service work.",
    };
  }, [canReview, isTechnicianOnly, noteStats]);

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

  function closeThreadDrawer() {
    /*
     * Only close the drawer here.
     * Do not clear selectedThread immediately.
     * The drawer needs its content while the slide-out animation is running.
     */
    setThreadOpen(false);
  }

  function resetThreadDrawerStateAfterClose() {
    /*
     * This runs only after the drawer slide-out animation finishes.
     * It prevents the drawer content from disappearing suddenly during close.
     */
    setSelectedThread(null);
    setPreviewImageUrl(null);
    setReplyText("");
    setClarificationText("");
    setReviewComment("");
    setRejectedReason("");
    clearReplyFiles();
  }

  return (
    <div className="w-full max-w-full space-y-5 overflow-x-hidden">
      <section className="rounded-3xl border border-cyan-300/15 bg-linear-to-br from-cyan-400/10 via-slate-950/80 to-blue-500/10 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
              Production Technician Workflow
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-slate-100">
              {isTechnicianOnly
                ? "Technician Maintenance Workflow"
                : "Maintenance Review Center"}
            </h2>

            <p className="mt-1 wrap-break-word text-sm text-slate-400">
              {unitName || externalDeviceId} · {aiMaintenanceSummary.message}
            </p>

            <WorkflowStepper status={aiMaintenanceSummary.title} />

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

          <div className="grid shrink-0 grid-cols-2 gap-3 text-center sm:grid-cols-4 lg:grid-cols-7">
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
            <MetricCard label="Rejected" value={noteStats.rejected} tone="red" />
            <MetricCard label="Closed" value={noteStats.closed} tone="slate" />
          </div>
        </div>
      </section>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {canCreateNote && (
        <section className="rounded-3xl border border-white/20 bg-slate-950/60 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                Add Maintenance Note
              </h3>
              <p className="text-sm text-slate-400">
                Record scheduled maintenance, failure repair, photos, and
                evidence.
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
            <FieldLabel label="Note Type">
              <select
                value={form.noteType}
                onChange={(event) =>
                  updateField(
                    "noteType",
                    event.target.value as HvacMaintenanceNoteType
                  )
                }
                className="input-glass"
              >
                <option value="SCHEDULED_MAINTENANCE">
                  Scheduled Maintenance
                </option>
                <option value="FAILURE_REPAIR">Failure Repair</option>
              </select>
            </FieldLabel>

            <FieldLabel label="Technician Name">
              <input
                value={form.technicianName ?? ""}
                onChange={(event) =>
                  updateField("technicianName", event.target.value)
                }
                placeholder={currentUserName || "Technician name"}
                className="input-glass"
              />
            </FieldLabel>
          </div>

          <div className="mt-4">
            <FieldLabel label="Work performed">
              <textarea
                value={form.workDone ?? ""}
                onChange={(event) => updateField("workDone", event.target.value)}
                rows={4}
                placeholder="Example: Cleaned unit, checked airflow, changed filter, tested cooling cycle..."
                className="input-glass"
              />
            </FieldLabel>
          </div>

          {form.noteType === "FAILURE_REPAIR" && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FieldLabel label="Failure cause">
                <textarea
                  value={form.failureCause ?? ""}
                  onChange={(event) =>
                    updateField("failureCause", event.target.value)
                  }
                  rows={4}
                  placeholder="Example: Blocked filter, sensor fault, low airflow..."
                  className="input-glass"
                />
              </FieldLabel>

              <FieldLabel label="Corrective action">
                <textarea
                  value={form.correctiveAction ?? ""}
                  onChange={(event) =>
                    updateField("correctiveAction", event.target.value)
                  }
                  rows={4}
                  placeholder="Example: Replaced filter, restarted unit, verified normal operation..."
                  className="input-glass"
                />
              </FieldLabel>
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FieldLabel label="Spare parts added">
              <input
                value={form.sparePartsAdded ?? ""}
                onChange={(event) =>
                  updateField("sparePartsAdded", event.target.value)
                }
                placeholder="Example: Filter, belt, sensor..."
                className="input-glass"
              />
            </FieldLabel>

            <FieldLabel label="Machine restarted at">
              <input
                type="datetime-local"
                value={form.machineRestartedAt ?? ""}
                onChange={(event) =>
                  updateField("machineRestartedAt", event.target.value)
                }
                className="input-glass"
              />
            </FieldLabel>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form.filterChanged)}
                onChange={(event) =>
                  updateField("filterChanged", event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-slate-900"
              />
              Filter changed
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form.serviceDone)}
                onChange={(event) =>
                  updateField("serviceDone", event.target.checked)
                }
                className="h-4 w-4 rounded border-white/20 bg-slate-900"
              />
              Service done
            </label>
          </div>

          <PhotoUploadBox
            title="Maintenance Photos"
            subtitle="Optional. Upload photos of HVAC parts, filters, damage, or completed work."
            previews={initialFilePreviews}
            files={initialFiles}
            onSelect={handleInitialFilesSelected}
            onRemove={removeInitialFile}
            onPreview={setPreviewImageUrl}
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Submitting..." : "Submit Maintenance Note"}
            </button>

            {form.noteType === "FAILURE_REPAIR" && hasActiveFault && (
              <button
                type="button"
                onClick={handleSaveRepairNoteAndResolve}
                disabled={saving || resolvingFailure}
                className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resolvingFailure
                  ? "Resolving..."
                  : "Submit Repair Note + Resolve Failure"}
              </button>
            )}

            {hasActiveFault && (
              <button
                type="button"
                onClick={handleMarkFailureGone}
                disabled={resolvingFailure}
                className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resolvingFailure ? "Resolving..." : "Mark Failure Resolved"}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-xl backdrop-blur-xl sm:p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <select
            value={filterType}
            onChange={(event) => {
              setFilterType(event.target.value as HvacMaintenanceNoteType | "ALL");
              setPage(1);
            }}
            className="input-glass"
          >
            <option value="ALL">All note types</option>
            <option value="SCHEDULED_MAINTENANCE">Scheduled Maintenance</option>
            <option value="FAILURE_REPAIR">Failure Repair</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as NoteStatusFilter);
              setPage(1);
            }}
            className="input-glass"
          >
            <option value="ALL">All workflow statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="NEEDS_CLARIFICATION">Needs Clarification</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>

          <input
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
            placeholder="Search notes..."
            className="input-glass md:col-span-2"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Loading maintenance notes...
          </div>
        ) : pagedNotes.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
            {notes.length === 0
              ? "No maintenance notes recorded for this HVAC."
              : "No maintenance notes matched your filters."}
          </div>
        ) : (
          <div className="space-y-4">
            {pagedNotes.map((note) => {
              const displayStatus = getDisplayStatus(note);
              const isClosed = isWorkflowClosed(displayStatus);
              const isApproved = isWorkflowApproved(displayStatus);
              const summary =
                note.workDone ||
                note.failureCause ||
                note.correctiveAction ||
                "No summary provided.";

              return (
                <article
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

                      {canReview && !isClosed && !isApproved && (
                        <button
                          type="button"
                          onClick={() => handleApprove(note.noteId)}
                          disabled={threadActionLoading}
                          className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Approve
                        </button>
                      )}

                      {isClosed && (
                        <span className="rounded-2xl border border-slate-300/20 bg-slate-400/10 px-4 py-2 text-sm font-medium text-slate-200">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            Showing page {Math.min(page, totalPages)} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence onExitComplete={resetThreadDrawerStateAfterClose}>
        {threadOpen && (
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-9999 bg-slate-950/75 backdrop-blur-sm"
            onClick={closeThreadDrawer}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "tween",
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-y-0 right-0 z-10000 flex w-full max-w-3xl transform-gpu flex-col overflow-hidden border-l border-white/10 bg-slate-950 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10002 flex items-start justify-between gap-4 border-b border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                    Maintenance Workflow Thread
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-100">
                    {selectedThread?.note?.externalDeviceId || externalDeviceId}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Status:{" "}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${getStatusBadgeClass(
                        selectedWorkflowStatus
                      )}`}
                    >
                      {getStatusLabel(selectedWorkflowStatus)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeThreadDrawer}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-300/40 bg-red-500/25 text-2xl font-bold leading-none text-red-100 shadow-xl transition hover:bg-red-500/40"
                  aria-label="Close maintenance workflow drawer"
                  title="Close"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                {threadLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                    Loading thread...
                  </div>
                ) : selectedThread ? (
                  <>
                    <WorkflowTimeline
                      status={
                        selectedWorkflowStatus as HvacMaintenanceWorkflowStatus
                      }
                    />

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <h4 className="text-sm font-semibold text-slate-100">
                        Original Maintenance Note
                      </h4>

                      <div className="mt-3 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                        <InfoRow
                          label="Type"
                          value={
                            selectedThread.note.noteType === "FAILURE_REPAIR"
                              ? "Failure Repair"
                              : "Scheduled Maintenance"
                          }
                        />
                        <InfoRow
                          label="Technician"
                          value={selectedThread.note.technicianName || "Unknown"}
                        />
                        <InfoRow
                          label="Created"
                          value={formatDate(selectedThread.note.createdAt)}
                        />
                        <InfoRow
                          label="Reviewed"
                          value={formatDate(selectedThread.note.reviewedAt)}
                        />
                      </div>

                      {selectedThread.note.workDone && (
                        <ThreadText
                          title="Work performed"
                          text={selectedThread.note.workDone}
                        />
                      )}

                      {selectedThread.note.failureCause && (
                        <ThreadText
                          title="Failure cause"
                          text={selectedThread.note.failureCause}
                        />
                      )}

                      {selectedThread.note.correctiveAction && (
                        <ThreadText
                          title="Corrective action"
                          text={selectedThread.note.correctiveAction}
                        />
                      )}

                      {selectedThread.note.sparePartsAdded && (
                        <ThreadText
                          title="Spare parts"
                          text={selectedThread.note.sparePartsAdded}
                        />
                      )}

                      {(selectedThread.workflow?.reviewComment ||
                        selectedThread.workflow?.rejectedReason) && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                          {selectedThread.workflow?.reviewComment && (
                            <ThreadText
                              title="Manager review comment"
                              text={selectedThread.workflow.reviewComment}
                            />
                          )}

                          {selectedThread.workflow?.rejectedReason && (
                            <ThreadText
                              title="Rejected reason"
                              text={selectedThread.workflow.rejectedReason}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-100">
                          Conversation Timeline
                        </h4>

                        {selectedThread.messages.length >
                          visibleMessageCount && (
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleMessageCount((prev) => prev + 10)
                            }
                            className="text-xs text-cyan-200 hover:text-cyan-100"
                          >
                            Show more
                          </button>
                        )}
                      </div>

                      {selectedThread.messages
                        .slice(-visibleMessageCount)
                        .map((message) => (
                          <div
                            key={message.messageId}
                            className="rounded-3xl border border-white/10 bg-slate-900/60 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-100">
                                  {message.senderDisplayName ||
                                    message.senderEmail ||
                                    "System"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {message.senderRole || "SYSTEM"} ·{" "}
                                  {formatDate(message.createdAt)}
                                </p>
                              </div>

                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                                {message.messageType.replaceAll("_", " ")}
                              </span>
                            </div>

                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-300">
                              {message.message}
                            </p>

                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                  {message.attachments.map((attachment) => (
                                    <button
                                      type="button"
                                      key={attachment.attachmentId}
                                      onClick={() =>
                                        openAttachmentPreview(attachment)
                                      }
                                      className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-left text-xs text-cyan-100 hover:bg-cyan-400/20"
                                    >
                                      📎 {attachment.originalFileName}
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                        ))}
                    </div>

                    {!selectedWorkflowIsClosed && (
                      <div className="rounded-3xl border border-cyan-300/15 bg-cyan-400/5 p-4">
                        <label className="mb-2 block text-sm font-medium text-cyan-100">
                          Reply to Thread
                        </label>

                        <textarea
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          rows={4}
                          placeholder={
                            isTechnicianOnly
                              ? "Reply to manager clarification or add extra work details..."
                              : "Add manager/admin comment..."
                          }
                          className="input-glass"
                        />

                        <PhotoUploadBox
                          title="Reply Photos"
                          subtitle="Optional. Add up to 5 JPEG, PNG, or WEBP images."
                          previews={replyFilePreviews}
                          files={replyFiles}
                          onSelect={handleReplyFilesSelected}
                          onRemove={removeReplyFile}
                          onPreview={setPreviewImageUrl}
                          compact
                        />

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
                        </div>
                      </div>
                    )}

                    {canReview && canManagerAct(selectedWorkflowStatus) && (
                      <div className="rounded-3xl border border-amber-300/15 bg-amber-400/5 p-4">
                        <h4 className="text-sm font-semibold text-amber-100">
                          Manager Review Actions
                        </h4>

                        <div className="mt-3">
                          <label className="mb-2 block text-sm text-slate-300">
                            Review comment
                          </label>
                          <textarea
                            value={reviewComment}
                            onChange={(event) =>
                              setReviewComment(event.target.value)
                            }
                            rows={3}
                            placeholder="Optional manager review comment..."
                            className="input-glass"
                          />
                        </div>

                        <div className="mt-3">
                          <label className="mb-2 block text-sm text-slate-300">
                            Ask Technician for Clarification
                          </label>
                          <textarea
                            value={clarificationText}
                            onChange={(event) =>
                              setClarificationText(event.target.value)
                            }
                            rows={3}
                            placeholder="Example: Please upload photo of replaced filter and confirm restart time."
                            className="input-glass"
                          />
                        </div>

                        <div className="mt-3">
                          <label className="mb-2 block text-sm text-slate-300">
                            Rejected reason
                          </label>
                          <textarea
                            value={rejectedReason}
                            onChange={(event) =>
                              setRejectedReason(event.target.value)
                            }
                            rows={3}
                            placeholder="Required only when rejecting the workflow."
                            className="input-glass"
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {!isWorkflowApproved(selectedWorkflowStatus) &&
                            !isWorkflowRejected(selectedWorkflowStatus) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApprove(selectedThread.note.noteId)
                                }
                                disabled={threadActionLoading}
                                className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={handleRequestClarification}
                            disabled={
                              threadActionLoading || !clarificationText.trim()
                            }
                            className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Request Clarification
                          </button>

                          {!isWorkflowApproved(selectedWorkflowStatus) &&
                            !isWorkflowRejected(selectedWorkflowStatus) && (
                              <button
                                type="button"
                                onClick={handleReject}
                                disabled={
                                  threadActionLoading || !rejectedReason.trim()
                                }
                                className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reject
                              </button>
                            )}

                          {(isWorkflowApproved(selectedWorkflowStatus) ||
                            isWorkflowRejected(selectedWorkflowStatus)) && (
                            <button
                              type="button"
                              onClick={handleCloseWorkflow}
                              disabled={threadActionLoading}
                              className="rounded-2xl border border-slate-300/20 bg-slate-400/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Close Workflow
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedWorkflowIsClosed && (
                      <div className="rounded-3xl border border-slate-300/15 bg-slate-400/5 p-4 text-sm text-slate-300">
                        This maintenance workflow is closed. New replies are
                        disabled.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                    No thread selected.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImageUrl && (
          <motion.div
            className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImageUrl(null)}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setPreviewImageUrl(null);
              }}
              className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white"
            >
              Close
            </button>

            <img
              src={previewImageUrl}
              alt="Maintenance preview"
              className="max-h-[85vh] max-w-[95vw] rounded-3xl border border-white/10 object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "cyan",
}: {
  label: string;
  value: number;
  tone?: "cyan" | "red" | "amber" | "violet" | "green" | "slate";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-300/20 bg-red-400/10 text-red-100"
      : tone === "amber"
      ? "border-amber-300/20 bg-amber-400/10 text-amber-100"
      : tone === "violet"
      ? "border-violet-300/20 bg-violet-400/10 text-violet-100"
      : tone === "green"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      : tone === "slate"
      ? "border-slate-300/20 bg-slate-400/10 text-slate-100"
      : "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.15em] opacity-80">
        {label}
      </p>
    </div>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function PhotoUploadBox({
  title,
  subtitle,
  previews,
  files,
  onSelect,
  onRemove,
  onPreview,
  compact = false,
}: {
  title: string;
  subtitle: string;
  previews: string[];
  files: File[];
  onSelect: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onPreview: (url: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`mt-4 rounded-3xl border border-cyan-300/10 bg-slate-900/50 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
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
              onSelect(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((url, index) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <button
                type="button"
                onClick={() => onPreview(url)}
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
                onClick={() => onRemove(index)}
                className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-xs text-red-100 backdrop-blur hover:bg-red-500/80"
              >
                Remove
              </button>

              <p className="truncate px-2 py-2 text-xs text-slate-400">
                {files[index]?.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowStepper({ status }: { status: string }) {
  return (
    <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-5">
      {["Submitted", "Clarify", "Resubmitted", "Reviewed", "Closed"].map(
        (step) => (
          <div
            key={step}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center"
          >
            {step}
          </div>
        )
      )}
      <span className="sr-only">{status}</span>
    </div>
  );
}

function WorkflowTimeline({
  status,
}: {
  status?: HvacMaintenanceWorkflowStatus | "REVIEWED" | null;
}) {
  const activeStep = getWorkflowStep(status);

  const steps = [
    "Submitted",
    "Manager Review",
    "Clarification",
    "Decision",
    "Closed",
  ];

  return (
    <div className="rounded-3xl border border-cyan-300/10 bg-cyan-400/5 p-4">
      <p className="text-sm font-semibold text-cyan-100">
        Workflow Progress
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber <= activeStep;

          return (
            <div
              key={step}
              className={`rounded-2xl border px-3 py-3 text-center text-xs ${
                active
                  ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-500"
              }`}
            >
              <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full border border-current">
                {stepNumber}
              </div>
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-slate-200">{value}</p>
    </div>
  );
}

function ThreadText({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
        {title}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-300">
        {text}
      </p>
    </div>
  );
}