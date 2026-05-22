/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BmsApi,
  type DiscoveredHvacDeviceDto,
  type HvacDeviceMappingDto,
  type HvacDto,
  type SiteEdgeAssignmentResponse,
} from "@/api/bms";
import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import DiscoveredDevicesPanel from "./DiscoveredDevicesPanel";
import LogicalHvacsPanel from "./LogicalHvacsPanel";
import ExistingMappingsPanel from "./ExistingMappingsPanel";
import HvacPointMappingPanel from "./HvacPointMappingPanel";

const HvacDeviceMappingPage: FC = () => {
  const navigate = useNavigate();
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredHvacDeviceDto[]>([]);
  const [logicalHvacs, setLogicalHvacs] = useState<HvacDto[]>([]);
  const [mappings, setMappings] = useState<HvacDeviceMappingDto[]>([]);
  const [edgeAssignment, setEdgeAssignment] = useState<SiteEdgeAssignmentResponse | null>(null);

  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [selectedPointMapping, setSelectedPointMapping] =
    useState<HvacDeviceMappingDto | null>(null);

  const loadAll = useCallback(async () => {
    if (!tenantId || !siteId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const [devices, hvacs, existingMappings, assignmentResult] =
        await Promise.allSettled([
          BmsApi.getDiscoveredDevices(tenantId, siteId),
          BmsApi.getHvacsByTenantSite(tenantId, siteId),
          BmsApi.getHvacMappings(tenantId, siteId),
          BmsApi.getSiteEdgeAssignment(tenantId, siteId),
        ]);

      if (devices.status === "fulfilled") {
        const safeDevices = Array.isArray(devices.value) ? devices.value : [];
        setDiscoveredDevices(safeDevices);
        console.log("[HVAC MAPPING] Discovered devices:", safeDevices);
      } else {
        console.warn("[HVAC MAPPING] Failed to load discovered devices:", devices.reason);
        setDiscoveredDevices([]);
      }

      if (hvacs.status === "fulfilled") {
        const safeHvacs = Array.isArray(hvacs.value) ? hvacs.value : [];
        setLogicalHvacs(safeHvacs);
        console.log("[HVAC MAPPING] Logical HVACs:", safeHvacs);
      } else {
        console.warn("[HVAC MAPPING] Failed to load logical HVACs:", hvacs.reason);
        setLogicalHvacs([]);
      }

      if (existingMappings.status === "fulfilled") {
        const safeMappings = Array.isArray(existingMappings.value)
          ? existingMappings.value
          : [];
        setMappings(safeMappings);
        console.log("[HVAC MAPPING] Existing mappings:", safeMappings);
      } else {
        console.warn("[HVAC MAPPING] Failed to load existing mappings:", existingMappings.reason);
        setMappings([]);
      }

      if (assignmentResult.status === "fulfilled") {
        setEdgeAssignment(assignmentResult.value);
        console.log("[HVAC MAPPING] Edge assignment:", assignmentResult.value);
      } else {
        console.warn("[HVAC MAPPING] Failed to load edge assignment:", assignmentResult.reason);
        setEdgeAssignment(null);
      }

      const rejected = [devices, hvacs, existingMappings].find(
        (item) => item.status === "rejected"
      );

      if (rejected && rejected.status === "rejected") {
        throw rejected.reason;
      }
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load HVAC mapping data."
      );
      setDiscoveredDevices([]);
      setLogicalHvacs([]);
      setMappings([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, siteId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const mappedHvacIds = useMemo(() => {
    return new Set(mappings.map((m) => m.hvacId));
  }, [mappings]);

  const mappedDeviceIds = useMemo(() => {
    return new Set(
      mappings
        .map((m) => m.externalDeviceId)
        .filter((id): id is string => Boolean(id))
        .map((id) => id.trim().toLowerCase())
    );
  }, [mappings]);

  const availableDiscoveredDevices = useMemo(() => {
    return discoveredDevices.filter((device) => {
      const externalId = device.externalDeviceId || device.discoveredDeviceId;
      const dragId = device.discoveredDeviceId || device.externalDeviceId;

      if (!externalId || !dragId) {
        return false;
      }

      return !mappedDeviceIds.has(externalId.trim().toLowerCase());
    });
  }, [discoveredDevices, mappedDeviceIds]);

  const getProtocolForMapping = (mapping: HvacDeviceMappingDto): string => {
    const device = discoveredDevices.find(
      (d) =>
        d.externalDeviceId === mapping.externalDeviceId ||
        d.discoveredDeviceId === mapping.externalDeviceId ||
        d.discoveredDeviceId === mapping.mappingId
    );

    return (device?.protocol || "SIMULATOR").toUpperCase();
  };

  const handleStartDrag = (deviceId: string) => {
    setDraggingDeviceId(deviceId);
  };

  const handleEndDrag = () => {
    setDraggingDeviceId(null);
  };

  const handleCreateMapping = async (hvacId: string, discoveredDeviceId: string) => {
    if (!tenantId || !siteId) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const selectedDevice = discoveredDevices.find(
        (d) =>
          d.discoveredDeviceId === discoveredDeviceId ||
          d.externalDeviceId === discoveredDeviceId
      );

      if (!selectedDevice) {
        throw new Error(
          `Selected discovered device was not found. Drag ID: ${discoveredDeviceId}`
        );
      }

      const created = await BmsApi.createHvacMapping(tenantId, siteId, {
        hvacId,
        externalDeviceId: selectedDevice.externalDeviceId,
      });

      setMappings((prev) => {
        const withoutSameHvac = prev.filter((m) => m.hvacId !== created.hvacId);
        return [...withoutSameHvac, created];
      });

      const protocol = (selectedDevice.protocol || "SIMULATOR").toUpperCase();

      if (protocol === "SIMULATOR" && edgeAssignment?.edgeControllerId) {
        await BmsApi.createSimulatorPointMappingDefaults(
          tenantId,
          siteId,
          created.hvacId,
          {
            edgeControllerId: edgeAssignment.edgeControllerId,
            externalDeviceId: created.externalDeviceId,
            unitName:
              created.unitName ||
              selectedDevice.deviceName ||
              created.externalDeviceId,
          }
        );

        setSuccessMessage("HVAC mapped and simulator point defaults created.");
      } else {
        setSuccessMessage("HVAC mapped successfully. Configure points before running edge.");
      }

      await loadAll();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create HVAC mapping."
      );
    } finally {
      setSaving(false);
      setDraggingDeviceId(null);

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  };

  const handleUnMap = async (mappingId: string) => {
    if (!tenantId || !siteId) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await BmsApi.unmapByMappingId(tenantId, siteId, mappingId);
      setSelectedPointMapping(null);
      setSuccessMessage("Mapping removed successfully.");
      await loadAll();
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to remove mapping."
      );
    } finally {
      setSaving(false);

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 2500);
    }
  };

  const handleConfigurePoints = (mapping: HvacDeviceMappingDto) => {
    setSelectedPointMapping(mapping);

    window.setTimeout(() => {
      document
        .getElementById("point-mapping-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  if (!tenantId || !siteId) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300">
          Missing tenantId or siteId.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(`/admin/tenants/query/${tenantId}/sites`)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            <Sparkles className="h-4 w-4" />
            Mapping Workspace
          </div>

          <h1 className="mt-3 text-3xl font-bold text-white">HVAC Device Mapping</h1>
          <p className="mt-2 text-slate-400">
            Drag a discovered device onto a logical BMS HVAC, then configure its
            telemetry and command points.
          </p>

          <p className="mt-3 text-sm text-slate-500">
            <span className="font-medium text-slate-300">Tenant:</span> {tenantId}
            <span className="mx-2 text-slate-600">•</span>
            <span className="font-medium text-slate-300">Site:</span> {siteId}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            <span className="font-medium text-slate-300">Edge:</span>{" "}
            {edgeAssignment?.edgeKey ||
              edgeAssignment?.edgeControllerId ||
              "No edge assigned"}
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void loadAll()}
          disabled={loading || saving}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          Loading mapping data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DiscoveredDevicesPanel
              devices={availableDiscoveredDevices}
              draggingDeviceId={draggingDeviceId}
              onStartDrag={handleStartDrag}
              onEndDrag={handleEndDrag}
            />

            <LogicalHvacsPanel
              hvacs={logicalHvacs}
              mappedHvacIds={mappedHvacIds}
              mappings={mappings}
              discoveredDevices={discoveredDevices}
              disabled={saving}
              onDropDevice={handleCreateMapping}
            />
          </div>

          <ExistingMappingsPanel
            mappings={mappings}
            onUnmap={handleUnMap}
            onConfigurePoints={handleConfigurePoints}
            busy={saving}
          />

          {selectedPointMapping && (
            <div id="point-mapping-panel">
              <HvacPointMappingPanel
                tenantId={tenantId}
                siteId={siteId}
                mapping={selectedPointMapping}
                edgeControllerId={edgeAssignment?.edgeControllerId}
                protocol={getProtocolForMapping(selectedPointMapping)}
                onClose={() => setSelectedPointMapping(null)}
                onSaved={() => void loadAll()}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HvacDeviceMappingPage;