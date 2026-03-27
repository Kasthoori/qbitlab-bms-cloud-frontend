/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BmsApi,
  type DiscoveredHvacDeviceDto,
  type HvacDeviceMappingDto,
  type HvacDto,
} from "@/api/bms";
import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { useParams } from "react-router-dom";
import DiscoveredDevicesPanel from "./DiscoveredDevicesPanel";
import LogicalHvacsPanel from "./LogicalHvacsPanel";
import ExistingMappingsPanel from "./ExistingMappingsPanel";

const HvacDeviceMappingPage: FC = () => {
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          Missing tenantId or siteId.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HVAC Device Mapping</h1>
          <p className="mt-1 text-sm text-slate-600">
            Drag a real discovered device and drop it onto a logical BMS HVAC.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void loadAll()}
          disabled={loading || saving}
        >
          Refresh
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
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