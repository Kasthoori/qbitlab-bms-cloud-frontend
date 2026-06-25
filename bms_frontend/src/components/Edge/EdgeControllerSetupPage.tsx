/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Cpu,
  KeyRound,
  Loader2,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
  Trash2,
} from "lucide-react";

import {
  BmsApi,
  type EdgeControllerViewResponse,
  type EdgeRegisterResponse,
} from "@/api/bms";
import { BmsButton, BmsCard, BmsInput } from "@/components/UI";

type RegisterForm = {
  name: string;
  networkId: string;
  ipAddress: string;
  notes: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusClass(status?: string | null) {
  if (status === "ONLINE") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-100";
  }

  if (status === "REVOKED") {
    return "border-rose-300/30 bg-rose-500/10 text-rose-100";
  }

  return "border-amber-300/30 bg-amber-500/10 text-amber-100";
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function downloadConfig(configYaml: string) {
  const blob = new Blob([configYaml], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "edge-config.yml";
  a.click();

  URL.revokeObjectURL(url);
}

export default function EdgeControllerSetupPage() {
  const navigate = useNavigate();
  const { tenantId, siteId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [edge, setEdge] = useState<EdgeControllerViewResponse | null>(null);
  const [generated, setGenerated] = useState<EdgeRegisterResponse | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    networkId: "",
    ipAddress: "",
    notes: "",
  });

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && !saving;
  }, [form.name, saving]);

  useEffect(() => {
    void loadEdge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, siteId]);

  async function loadEdge() {
    if (!tenantId || !siteId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await BmsApi.getSiteEdgeController(tenantId, siteId);
      setEdge(data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setEdge(null);
      } else {
        console.error(err);
        setError("Failed to load edge controller details.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!tenantId || !siteId || !canSubmit) return;

    try {
      setSaving(true);
      setError(null);
      setGenerated(null);

      const response = await BmsApi.registerSiteEdgeController(tenantId, siteId, {
        name: form.name.trim(),
        networkId: form.networkId.trim() || null,
        ipAddress: form.ipAddress.trim() || null,
        notes: form.notes.trim() || null,
      });

      setGenerated(response);
      await loadEdge();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to register edge controller."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRotateSecret() {
    if (!tenantId || !siteId) return;

    const ok = window.confirm(
      "Rotate edge secret? The Python edge controller will stop connecting until you update its config."
    );

    if (!ok) return;

    try {
      setSaving(true);
      setError(null);

      const response = await BmsApi.rotateSiteEdgeSecret(tenantId, siteId);

      setGenerated({
        edgeControllerId: response.edgeControllerId,
        tenantId,
        siteId,
        edgeKey: response.edgeKey,
        edgeSecret: response.edgeSecret,
        name: edge?.name || "Edge Controller",
        networkId: edge?.networkId,
        ipAddress: edge?.ipAddress,
        status: edge?.status || "OFFLINE",
        registeredAt: edge?.registeredAt || new Date().toISOString(),
        configYaml: response.configYaml,
      });

      await loadEdge();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to rotate edge secret."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke() {
    if (!tenantId || !siteId) return;

    const ok = window.confirm(
      "Revoke this edge controller? Python edge access will be disabled and this site will no longer have an active edge assignment."
    );

    if (!ok) return;

    try {
      setSaving(true);
      setError(null);
      setGenerated(null);

      await BmsApi.revokeSiteEdgeController(tenantId, siteId);
      await loadEdge();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to revoke edge controller."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyAndShow(label: string, value: string) {
    await copyText(value);
    setCopyMessage(`${label} copied`);
    window.setTimeout(() => setCopyMessage(null), 1800);
  }

  if (!tenantId || !siteId) {
    return (
      <div className="bms-dashboard-bg min-h-screen p-6 text-slate-100">
        <BmsCard
          variant="section"
          className="border-rose-500/20 bg-rose-500/10 p-6 text-rose-300"
        >
          Missing tenantId or siteId.
        </BmsCard>
      </div>
    );
  }

  return (
    <div className="bms-dashboard-bg min-h-screen px-5 py-6 text-slate-100 md:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-10%] top-[20%] h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[25%] h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <main className="bms-dashboard-shell relative z-10 mx-auto max-w-6xl">
        <BmsButton
          type="button"
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </BmsButton>

        <BmsCard variant="section" className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
                  <Cpu className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
                    QbitLabs BMS
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
                    Edge Controller Setup
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Register and secure the Python edge controller for this site.
                The backend generates an edge key and one-time secret. The
                installer copies the config into the edge computer.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-xs text-slate-400">
              <p>Tenant ID</p>
              <p className="mt-1 break-all font-mono text-cyan-100">
                {tenantId}
              </p>
              <p className="mt-3">Site ID</p>
              <p className="mt-1 break-all font-mono text-cyan-100">{siteId}</p>
            </div>
          </div>
        </BmsCard>

        {copyMessage && (
          <BmsCard
            variant="section"
            className="mt-4 border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          >
            {copyMessage}
          </BmsCard>
        )}

        {error && (
          <BmsCard
            variant="section"
            className="mt-4 border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          >
            {error}
          </BmsCard>
        )}

        {loading ? (
          <BmsCard variant="section" className="mt-6 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-200" />
            <p className="mt-3 text-sm text-slate-300">
              Loading edge controller...
            </p>
          </BmsCard>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <BmsCard variant="section" className="p-5">
              {edge ? (
                <ExistingEdgePanel
                  edge={edge}
                  saving={saving}
                  onRotate={handleRotateSecret}
                  onRevoke={handleRevoke}
                />
              ) : (
                <RegisterEdgePanel
                  form={form}
                  saving={saving}
                  canSubmit={canSubmit}
                  onChange={setForm}
                  onSubmit={handleRegister}
                />
              )}
            </BmsCard>

            <BmsCard variant="section" className="p-5">
              {generated ? (
                <GeneratedSecretPanel
                  generated={generated}
                  onCopy={copyAndShow}
                  onDownload={() => downloadConfig(generated.configYaml)}
                />
              ) : (
                <HelpPanel />
              )}
            </BmsCard>
          </div>
        )}
      </main>
    </div>
  );
}

function RegisterEdgePanel({
  form,
  saving,
  canSubmit,
  onChange,
  onSubmit,
}: {
  form: RegisterForm;
  saving: boolean;
  canSubmit: boolean;
  onChange: (value: RegisterForm) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-amber-100">
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            No edge controller assigned
          </h2>

          <p className="mt-1 text-sm text-slate-300">
            Register an edge controller before using live telemetry,
            BACnet/Modbus scan, point mapping, or command polling.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Field
          label="Edge controller name"
          required
          value={form.name}
          placeholder="Auckland Main Office Edge"
          onChange={(value) => onChange({ ...form, name: value })}
        />

        <Field
          label="Network ID"
          value={form.networkId}
          placeholder="Optional, e.g. main-lan"
          onChange={(value) => onChange({ ...form, networkId: value })}
        />

        <Field
          label="IP address"
          value={form.ipAddress}
          placeholder="Optional, e.g. 192.168.1.20"
          onChange={(value) => onChange({ ...form, ipAddress: value })}
        />

        <div>
          <label className="text-sm font-medium text-slate-300">Notes</label>

          <textarea
            value={form.notes}
            onChange={(event) =>
              onChange({ ...form, notes: event.target.value })
            }
            rows={4}
            placeholder="Installation notes..."
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
          />
        </div>

        <BmsButton
          type="button"
          variant="primary"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="w-full justify-center py-3"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Register Edge Controller
        </BmsButton>
      </div>
    </div>
  );
}

function ExistingEdgePanel({
  edge,
  saving,
  onRotate,
  onRevoke,
}: {
  edge: EdgeControllerViewResponse;
  saving: boolean;
  onRotate: () => void;
  onRevoke: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-emerald-100">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">
              Edge controller assigned
            </h2>

            <p className="mt-1 text-sm text-slate-300">
              This site has an active edge controller assignment.
            </p>
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs ${statusClass(
            edge.status
          )}`}
        >
          {edge.status}
        </span>
      </div>

      <div className="grid gap-3">
        <InfoRow label="Name" value={edge.name} />
        <InfoRow label="Edge key" value={edge.edgeKey} mono />
        <InfoRow label="Network ID" value={edge.networkId || "—"} />
        <InfoRow label="IP address" value={edge.ipAddress || "—"} />
        <InfoRow label="Last seen" value={formatDate(edge.lastSeenAt)} />
        <InfoRow label="Registered at" value={formatDate(edge.registeredAt)} />
        <InfoRow label="Assigned at" value={formatDate(edge.assignedAt)} />
        <InfoRow label="Notes" value={edge.notes || "—"} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <BmsButton
          type="button"
          variant="warning"
          disabled={saving}
          onClick={onRotate}
          className="justify-center py-3"
        >
          <RotateCw className="h-4 w-4" />
          Rotate Secret
        </BmsButton>

        <BmsButton
          type="button"
          variant="danger"
          disabled={saving}
          onClick={onRevoke}
          className="justify-center py-3"
        >
          <Trash2 className="h-4 w-4" />
          Revoke
        </BmsButton>
      </div>
    </div>
  );
}

function GeneratedSecretPanel({
  generated,
  onCopy,
  onDownload,
}: {
  generated: EdgeRegisterResponse;
  onCopy: (label: string, value: string) => void;
  onDownload: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-rose-100">
          <ShieldAlert className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            Save this secret now
          </h2>

          <p className="mt-1 text-sm text-slate-300">
            The edge secret is shown only once. Copy it into the Python edge
            computer config.
          </p>
        </div>
      </div>

      <SecretBox
        label="Edge Key"
        value={generated.edgeKey}
        onCopy={() => onCopy("Edge key", generated.edgeKey)}
      />

      <SecretBox
        label="Edge Secret"
        value={generated.edgeSecret}
        onCopy={() => onCopy("Edge secret", generated.edgeSecret)}
      />

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">
            edge-config.yml
          </label>

          <div className="flex gap-2">
            <BmsButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onCopy("Config", generated.configYaml)}
              className="rounded-xl px-3 py-2 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </BmsButton>

            <BmsButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onDownload}
              className="rounded-xl px-3 py-2 text-xs"
            >
              Download
            </BmsButton>
          </div>
        </div>

        <pre className="max-h-80 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs leading-6 text-cyan-100">
          {generated.configYaml}
        </pre>
      </div>
    </div>
  );
}

function HelpPanel() {
  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-100">
          <TerminalSquare className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            Installation flow
          </h2>

          <p className="mt-1 text-sm text-slate-300">
            Use this panel to prepare the Python edge computer for a physical
            customer site.
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-slate-300">
        <Step number="1" text="Register edge controller for this site." />
        <Step number="2" text="Copy or download the generated edge config." />
        <Step number="3" text="Paste config into the Python edge computer." />
        <Step number="4" text="Start Python edge runtime." />
        <Step number="5" text="Confirm status becomes ONLINE." />
      </div>

      <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        The edge secret is never shown again after registration or rotation.
        Store it safely during installation.
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300">
        {label} {required && <span className="text-rose-300">*</span>}
      </label>

      <BmsInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2"
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <BmsCard variant="glass" className="p-3">
      <p className="text-xs text-slate-500">{label}</p>

      <p
        className={`mt-1 break-all text-sm text-slate-100 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </BmsCard>
  );
}

function SecretBox({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <BmsCard variant="glass" className="mt-4 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-300">{label}</p>

        <BmsButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="rounded-xl px-3 py-2 text-xs"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </BmsButton>
      </div>

      <p className="break-all font-mono text-sm text-cyan-100">{value}</p>
    </BmsCard>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <BmsCard variant="glass" className="flex items-center gap-3 p-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-bold text-cyan-100">
        {number}
      </div>

      <p>{text}</p>
    </BmsCard>
  );
}