import { useEffect, useMemo, useState } from "react";
import { BmsApi } from "@/api/bms";
import type {
  CreateHvacMaintenanceNoteRequest,
  HvacMaintenanceNoteDto,
  HvacMaintenanceNoteType,
} from "@/api/bms";

import { generateMaintenanceAiDraft } from "../../utils/maintenanceAi";

type UserRole =
  | "ADMIN"
  | "BMS_ADMIN"
  | "TECHNICIAN"
  | "FACILITY_MANAGER"
  | "SITE_MANAGER";

type NoteStatusFilter = "ALL" | "SUBMITTED" | "REVIEWED";

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
  currentUserName,
  onFailureResolved,
}: HvacMaintenanceNotesPanelProps) {
  const [notes, setNotes] = useState<HvacMaintenanceNoteDto[]>([]);
  const [form, setForm] =
    useState<CreateHvacMaintenanceNoteRequest>(emptyForm);

  // Filter from backend by note type.
  const [filterType, setFilterType] =
    useState<HvacMaintenanceNoteType | "ALL">("ALL");

  // Extra frontend filters.
  const [statusFilter, setStatusFilter] =
    useState<NoteStatusFilter>("ALL");
  const [searchText, setSearchText] = useState("");

  // Frontend pagination.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolvingFailure, setResolvingFailure] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const canCreateNote =
    currentUserRole === "ADMIN" ||
    currentUserRole === "BMS_ADMIN" ||
    currentUserRole === "TECHNICIAN" ||
    currentUserRole === "FACILITY_MANAGER" ||
    currentUserRole === "SITE_MANAGER";

  const canReview =
    currentUserRole === "ADMIN" ||
    currentUserRole === "BMS_ADMIN" ||
    currentUserRole === "FACILITY_MANAGER" ||
    currentUserRole === "SITE_MANAGER";

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
      //setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
        setSuccessMessage("");
        setError("");
        setSearchText("");
        setStatusFilter("ALL");
        setFilterType("ALL");
        setPage(1);
    }, [externalDeviceId]);

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, siteId, externalDeviceId, filterType]);

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
      setError("Cannot save note: externalDeviceId is missing.");
      return false;
    }

    return true;
  }

  async function handleSubmit() {
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

      await BmsApi.createHvacMaintenanceNote(
        tenantId,
        siteId,
        externalDeviceId,
        buildPayload()
      );

      setSuccessMessage("Maintenance note saved successfully.");

      setForm({
        ...emptyForm,
        noteType: form.noteType,
      });

      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRepairNoteAndResolve() {
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

      setSuccessMessage("Repair note saved and failure marked as resolved.");

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
    if (!ensureExternalDeviceId()) return;

    try {
      setError("");
      setSuccessMessage("");

      await BmsApi.reviewHvacMaintenanceNote(
        tenantId,
        siteId,
        externalDeviceId,
        noteId
      );

      setSuccessMessage("Maintenance note marked as reviewed.");
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review note");
    }
  }

  function handleGenerateAiDraft() {
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

    const submitted = notes.filter(
      (note) => note.status === "SUBMITTED"
    ).length;

    return {
      scheduled,
      failure,
      submitted,
    };
  }, [notes]);

  // Frontend filtering for search + status.
  const filteredNotes = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesStatus =
        statusFilter === "ALL" || note.status === statusFilter;

      const matchesSearch =
        !search ||
        note.technicianName?.toLowerCase().includes(search) ||
        note.workDone?.toLowerCase().includes(search) ||
        note.failureCause?.toLowerCase().includes(search) ||
        note.correctiveAction?.toLowerCase().includes(search) ||
        note.sparePartsAdded?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [notes, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));

  const pagedNotes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredNotes.slice(start, start + pageSize);
  }, [filteredNotes, page, pageSize]);

  const hasActiveFault = Boolean(fault);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              HVAC Maintenance
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-slate-100">
              Maintenance Notes
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {unitName || externalDeviceId} · Technician service history and
              failure repair records
            </p>

            {hasActiveFault && (
              <div className="mt-3 inline-flex rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-100">
                Active fault detected
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-lg font-semibold text-slate-100">
                {noteStats.scheduled}
              </p>
              <p className="text-xs text-slate-400">Scheduled</p>
            </div>

            <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3">
              <p className="text-lg font-semibold text-red-200">
                {noteStats.failure}
              </p>
              <p className="text-xs text-red-200/70">Failures</p>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3">
              <p className="text-lg font-semibold text-amber-200">
                {noteStats.submitted}
              </p>
              <p className="text-xs text-amber-200/70">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {canCreateNote && (
        <div className="rounded-3xl border border-white/20 bg-slate-950/60 p-5 shadow-2xl backdrop-blur-xl">
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
              {saving ? "Saving..." : "Save Maintenance Note"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-100">
            Maintenance History
          </h3>
          <p className="text-sm text-slate-400">
            Search, filter, review, and paginate records for this HVAC.
          </p>
        </div>

        {/* Filter controls */}
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
            <option value="REVIEWED">Reviewed</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400/30 focus:ring-2"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Loading maintenance notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
            No maintenance notes matched your filters.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {pagedNotes.map((note) => (
                <div
                  key={note.noteId}
                  className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-xl"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            note.noteType === "FAILURE_REPAIR"
                              ? "bg-red-500/15 text-red-100"
                              : "bg-cyan-500/15 text-cyan-100"
                          }`}
                        >
                          {note.noteType === "FAILURE_REPAIR"
                            ? "Failure Repair"
                            : "Scheduled Maintenance"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            note.status === "REVIEWED"
                              ? "bg-emerald-500/15 text-emerald-100"
                              : "bg-amber-500/15 text-amber-100"
                          }`}
                        >
                          {note.status}
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
                    </div>

                    {canReview && note.status !== "REVIEWED" && (
                      <button
                        type="button"
                        onClick={() => handleReview(note.noteId)}
                        className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20"
                      >
                        Mark Reviewed
                      </button>
                    )}
                  </div>

                  {note.workDone && (
                    <NoteSection title="Work Done" value={note.workDone} />
                  )}

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SmallInfo
                      label="Filter Changed"
                      value={note.filterChanged ? "Yes" : "No"}
                    />
                    <SmallInfo
                      label="Service Done"
                      value={note.serviceDone ? "Yes" : "No"}
                    />
                  </div>

                  {note.noteType === "FAILURE_REPAIR" && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-red-300/10 bg-red-500/5 p-4">
                      {note.failureCause && (
                        <NoteSection
                          title="Failure Cause"
                          value={note.failureCause}
                        />
                      )}

                      {note.correctiveAction && (
                        <NoteSection
                          title="Corrective Action"
                          value={note.correctiveAction}
                        />
                      )}

                      {note.sparePartsAdded && (
                        <SmallInfo
                          label="Spare Parts Added"
                          value={note.sparePartsAdded}
                        />
                      )}

                      {note.machineRestartedAt && (
                        <SmallInfo
                          label="Machine Restarted At"
                          value={formatDate(note.machineRestartedAt)}
                        />
                      )}
                    </div>
                  )}

                  {note.reviewedAt && (
                    <p className="mt-4 text-xs text-emerald-200/80">
                      Reviewed at {formatDate(note.reviewedAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination controls */}
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
    </div>
  );
}

function NoteSection({ title, value }: { title: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-200">
        {value}
      </p>
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
  return new Date(value).toLocaleString();
}