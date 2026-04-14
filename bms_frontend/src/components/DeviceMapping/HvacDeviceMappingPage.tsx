/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BmsApi,
  type DiscoveredHvacDeviceDto,
  type HvacDeviceMappingDto,
  type HvacDto,
} from "@/api/bms";
import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

import DiscoveredDevicesPanel from "./DiscoveredDevicesPanel";
import LogicalHvacsPanel from "./LogicalHvacsPanel";
import ExistingMappingsPanel from "./ExistingMappingsPanel";

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
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!tenantId || !siteId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const [devices, hvacs, existingMappings] = await Promise.all([
        BmsApi.getDiscoveredDevices(tenantId, siteId),
        BmsApi.getHvacsByTenantSite(tenantId, siteId),
        BmsApi.getHvacMappings(tenantId, siteId),
      ]);

      setDiscoveredDevices(Array.isArray(devices) ? devices : []);
      setLogicalHvacs(Array.isArray(hvacs) ? hvacs : []);
      setMappings(Array.isArray(existingMappings) ? existingMappings : []);
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
    );
  }, [mappings]);

  const availableDiscoveredDevices = useMemo(() => {
    return discoveredDevices.filter(
      (d) => !!d.discoveredDeviceId && !mappedDeviceIds.has(d.discoveredDeviceId)
    );
  }, [discoveredDevices, mappedDeviceIds]);

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
        (d) => d.discoveredDeviceId === discoveredDeviceId
      );

      if (!selectedDevice) {
        throw new Error("Selected discovered device was not found.");
      }

      const created = await BmsApi.createHvacMapping(tenantId, siteId, {
        hvacId,
        externalDeviceId: selectedDevice.externalDeviceId,
      });

      setMappings((prev) => {
        const withoutSameHvac = prev.filter((m) => m.hvacId !== created.hvacId);
        return [...withoutSameHvac, created];
      });

      setSuccessMessage("HVAC mapped successfully.");
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
      }, 2500);
    }
  };

  const handleUnMap = async (mappingId: string) => {
    if (!tenantId || !siteId) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await BmsApi.unmapByMappingId(tenantId, siteId, mappingId);
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
            Drag a real discovered device and drop it onto a logical BMS HVAC.
          </p>

          <p className="mt-3 text-sm text-slate-500">
            <span className="font-medium text-slate-300">Tenant:</span> {tenantId}
            <span className="mx-2 text-slate-600">•</span>
            <span className="font-medium text-slate-300">Site:</span> {siteId}
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
            busy={saving}
          />
        </>
      )}
    </div>
  );
};

export default HvacDeviceMappingPage;