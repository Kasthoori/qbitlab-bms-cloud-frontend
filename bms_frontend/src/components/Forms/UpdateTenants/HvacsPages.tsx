/* eslint-disable @typescript-eslint/no-explicit-any */
import { BmsApi, type CreateHvacRequest, type HvacDto } from "@/api/bms";
import { useCallback, useEffect, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Cpu,
  Pencil,
  Sparkles,
  Thermometer,
  Trash2,
  Wind,
} from "lucide-react";

import { BmsEntityCard } from "@/components/UI";

import UpdateHvacModal from "./UpdateHvacModal";
import ConfirmDeleteHvacModal from "./ConfirmDeleteHvacModal";
import BackButton from "@/components/common/BackButton";

type Protocol = CreateHvacRequest["protocol"];
type UnitType = CreateHvacRequest["unitType"];

const isProtocol = (value: any): value is Protocol =>
  value === "BACNET" || value === "MODBUS" || value === "SIMULATOR";

const isUnitType = (value: any): value is UnitType =>
  value === "AHU" ||
  value === "VRF" ||
  value === "FCU" ||
  value === "CHILLER" ||
  value === "OTHER";

const EMPTY_HVAC_FORM: CreateHvacRequest = {
  hvacName: "",
  deviceId: "",
  protocol: "BACNET",
  unitType: "AHU",
};

const HvacsPages: FC = () => {
  const nav = useNavigate();
  const { tenantId, siteId } = useParams<{
    tenantId: string;
    siteId: string;
  }>();

  const [hvacs, setHvacs] = useState<HvacDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openUpdateHvac, setOpenUpdateHvac] = useState(false);
  const [selectedHvac, setSelectedHvac] = useState<HvacDto | null>(null);
  const [hvacForm, setHvacForm] =
    useState<CreateHvacRequest>(EMPTY_HVAC_FORM);

  const [openDeleteHvac, setOpenDeleteHvac] = useState(false);
  const [hvacToDelete, setHvacToDelete] = useState<HvacDto | null>(null);
  const [deletingHvac, setDeletingHvac] = useState(false);
  const [deleteHvacError, setDeleteHvacError] = useState<string | null>(null);
  const [deleteHvacSuccess, setDeleteHvacSuccess] = useState(false);

  const loadHvacs = useCallback(async () => {
    if (!tenantId || !siteId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await BmsApi.getHvacsByTenantSite(tenantId, siteId);
      setHvacs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "An error occurred loading HVACs"
      );
    } finally {
      setLoading(false);
    }
  }, [tenantId, siteId]);

  useEffect(() => {
    void loadHvacs();
  }, [loadHvacs]);

  const onEditHvac = (hvac: HvacDto) => {
    const hvacId = (hvac as any).hvacId ?? (hvac as any).id;

    setSelectedHvac({ ...(hvac as any), hvacId });

    setHvacForm({
      hvacName: (hvac as any).hvacName ?? "",
      deviceId: (hvac as any).deviceId ?? "",
      protocol: isProtocol((hvac as any).protocol)
        ? (hvac as any).protocol
        : "BACNET",
      unitType: isUnitType((hvac as any).unitType)
        ? (hvac as any).unitType
        : "AHU",
    });

    setOpenUpdateHvac(true);
  };

  const closeEditModal = () => {
    setOpenUpdateHvac(false);
    setSelectedHvac(null);
    setHvacForm(EMPTY_HVAC_FORM);
  };

  const onAskDeleteHvac = (hvac: HvacDto) => {
    setHvacToDelete(hvac);
    setDeleteHvacError(null);
    setDeleteHvacSuccess(false);
    setOpenDeleteHvac(true);
  };

  const onConfirmDeleteHvac = async () => {
    if (!tenantId || !siteId || !hvacToDelete) return;

    const hvacId = (hvacToDelete as any).hvacId ?? (hvacToDelete as any).id;

    setDeletingHvac(true);
    setDeleteHvacError(null);
    setDeleteHvacSuccess(false);

    try {
      await BmsApi.deleteHvac(tenantId, siteId, hvacId);

      setDeleteHvacSuccess(true);
      await loadHvacs();

      setTimeout(() => {
        setOpenDeleteHvac(false);
        setHvacToDelete(null);
        setDeleteHvacSuccess(false);
      }, 700);
    } catch (e: unknown) {
      setDeleteHvacError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingHvac(false);
    }
  };

  function getHvacId(hvac: HvacDto): string {
    return (hvac as any).hvacId ?? (hvac as any).id ?? "";
  }

  function getHvacName(hvac: HvacDto): string {
    return (hvac as any).hvacName ?? (hvac as any).name ?? "Unnamed HVAC";
  }

  function getHvacStatus(hvac: HvacDto): string {
    return String((hvac as any).status ?? "Active");
  }

  function getStatusTone(
    hvac: HvacDto
  ): "active" | "inactive" | "warning" | "danger" | "neutral" {
    const status = getHvacStatus(hvac).toUpperCase();
    const fault = Boolean((hvac as any).fault);

    if (fault || status.includes("FAULT") || status.includes("ERROR")) {
      return "danger";
    }

    if (status.includes("WARN") || status.includes("STALE")) {
      return "warning";
    }

    if (status.includes("OFF") || status.includes("INACTIVE")) {
      return "inactive";
    }

    if (status.includes("ACTIVE") || status.includes("ONLINE")) {
      return "active";
    }

    return "neutral";
  }

  function getProtocol(hvac: HvacDto): string {
    return String((hvac as any).protocol ?? "Unknown");
  }

  function getUnitType(hvac: HvacDto): string {
    return String((hvac as any).unitType ?? "Unknown");
  }

  function getDeviceId(hvac: HvacDto): string {
    return String((hvac as any).deviceId ?? "Not mapped");
  }

  function getLastSeen(hvac: HvacDto): string | null {
    const value = (hvac as any).lastSeenAt;

    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }

  function getTemperature(hvac: HvacDto): string | null {
    const value = (hvac as any).temperature;

    if (typeof value !== "number") return null;

    return `${value.toFixed(1)}°C`;
  }

  return (
    <div className="bms-dashboard-bg bms-dashboard-shell mx-auto w-full max-w-7xl">
      <div className="mb-6 space-y-4">
        <BackButton
          onClick={() => nav(`/admin/tenants/query/${tenantId}/sites`)}
        />

        <section className="bms-dashboard-hero">
          <div className="bms-dashboard-hero-content">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                HVAC Workspace
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-100">
                HVAC Units
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                View HVAC units, edit configuration, monitor protocol details,
                and manage connected building equipment.
              </p>

              <p className="mt-3 max-w-2xl break-all text-sm text-slate-400">
                <span className="font-medium text-slate-200">Tenant:</span>{" "}
                {tenantId}
                <span className="mx-2 text-slate-600">•</span>
                <span className="font-medium text-slate-200">Site:</span>{" "}
                {siteId}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/45 px-4 py-3 text-sm text-slate-300">
              <span className="font-semibold text-cyan-100">
                {hvacs.length}
              </span>{" "}
              HVAC unit{hvacs.length === 1 ? "" : "s"} registered
            </div>
          </div>
          </div>
        </section>
      </div>

      {loading && (
        <div className="bms-section">
          <div className="flex items-center gap-3 text-slate-300">
            <Sparkles className="h-5 w-5 text-cyan-300" />
            <span>Loading HVAC units...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="whitespace-pre-wrap rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm font-medium text-rose-100">
          {error}
        </div>
      )}

      {!loading && !error && hvacs.length === 0 && (
        <div className="bms-section">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-slate-900/55 text-cyan-200">
              <Wind className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                No HVAC units found
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Onboard an HVAC under this site to begin telemetry and control
                setup.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && hvacs.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {hvacs.map((hvac) => {
            const hvacId = getHvacId(hvac);
            const hvacName = getHvacName(hvac);
            const statusTone = getStatusTone(hvac);
            const statusLabel = getHvacStatus(hvac);
            const lastSeen = getLastSeen(hvac);
            const temperature = getTemperature(hvac);
            const isDeletingThis =
              deletingHvac &&
              ((hvacToDelete as any)?.hvacId ?? (hvacToDelete as any)?.id) ===
                hvacId;

            return (
              <BmsEntityCard
                key={hvacId}
                eyebrow="HVAC"
                title={hvacName}
                icon={<Wind className="h-5 w-5" />}
                statusLabel={statusLabel}
                status={statusTone}
                meta={
                  <div className="space-y-2">
                    <p>
                      <span className="text-slate-500">HVAC ID:</span>{" "}
                      <span className="break-all text-slate-300">
                        {hvacId || "—"}
                      </span>
                    </p>

                    <p className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-cyan-300/80" />
                      <span>
                        <span className="text-slate-500">Protocol:</span>{" "}
                        <span className="text-slate-300">
                          {getProtocol(hvac)}
                        </span>
                      </span>
                    </p>

                    <p>
                      <span className="text-slate-500">Unit Type:</span>{" "}
                      <span className="text-slate-300">
                        {getUnitType(hvac)}
                      </span>
                    </p>

                    <p>
                      <span className="text-slate-500">Device ID:</span>{" "}
                      <span className="break-all text-slate-300">
                        {getDeviceId(hvac)}
                      </span>
                    </p>

                    {temperature && (
                      <p className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-cyan-300/80" />
                        <span>
                          <span className="text-slate-500">Temperature:</span>{" "}
                          <span className="text-slate-300">
                            {temperature}
                          </span>
                        </span>
                      </p>
                    )}

                    {lastSeen && (
                      <p>
                        <span className="text-slate-500">Last seen:</span>{" "}
                        <span className="text-slate-300">{lastSeen}</span>
                      </p>
                    )}
                  </div>
                }
                helperText={
                  statusTone === "danger"
                    ? "Fault detected. Technician review recommended."
                    : "AI-ready HVAC asset"
                }
                actions={[
                  {
                    label: (
                      <>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </>
                    ),
                    variant: "secondary",
                    onClick: () => onEditHvac(hvac),
                  },
                  {
                    label: (
                      <>
                        {isDeletingThis ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {isDeletingThis ? "Deleting..." : "Delete"}
                      </>
                    ),
                    variant: "danger",
                    disabled: isDeletingThis,
                    onClick: () => onAskDeleteHvac(hvac),
                  },
                ]}
              />
            );
          })}
        </div>
      )}

      {openUpdateHvac && selectedHvac && tenantId && siteId && (
        <UpdateHvacModal
          open={openUpdateHvac}
          tenantId={tenantId}
          siteId={siteId}
          hvacId={(selectedHvac as any).hvacId}
          hvac={selectedHvac}
          form={hvacForm}
          setForm={setHvacForm}
          onClose={closeEditModal}
          onUpdated={loadHvacs}
        />
      )}

      {tenantId && siteId && hvacToDelete && (
        <ConfirmDeleteHvacModal
          open={openDeleteHvac}
          tenantId={tenantId}
          siteId={siteId}
          hvacId={(hvacToDelete as any).hvacId ?? (hvacToDelete as any).id}
          hvacName={(hvacToDelete as any).hvacName ?? (hvacToDelete as any).name}
          deleting={deletingHvac}
          error={deleteHvacError}
          success={deleteHvacSuccess}
          onClose={() => {
            if (deletingHvac) return;
            setOpenDeleteHvac(false);
            setHvacToDelete(null);
            setDeleteHvacError(null);
            setDeleteHvacSuccess(false);
          }}
          onConfirmDelete={onConfirmDeleteHvac}
        />
      )}
    </div>
  );
};

export default HvacsPages;