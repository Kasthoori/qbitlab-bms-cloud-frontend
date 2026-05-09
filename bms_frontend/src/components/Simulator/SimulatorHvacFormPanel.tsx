import { X, Zap } from "lucide-react";

export type SimulatorHvacFormState = {
  hvacId: string;
  edgeControllerId: string;

  externalDeviceId: string;
  unitName: string;
  unitType: string;
  zone: string;
  protocol: string;

  temperature: string;
  setpoint: string;
  onState: boolean;
  fanSpeed: string;
  flowRate: string;
  fault: boolean;
  enabled: boolean;
};

type Props = {
  open: boolean;
  form: SimulatorHvacFormState;
  setForm: React.Dispatch<React.SetStateAction<SimulatorHvacFormState>>;
  isEditing: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export default function SimulatorHvacFormPanel({
  open,
  form,
  setForm,
  isEditing,
  saving,
  onClose,
  onSubmit,
}: Props) {
  function updateField<K extends keyof SimulatorHvacFormState>(
    key: K,
    value: SimulatorHvacFormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="h-full w-full overflow-y-auto border-l border-white/10 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-2xl md:max-w-xl">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 border-b border-white/10 bg-slate-950/90 px-5 py-5 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-cyan-300">
                <Zap size={16} />
                Simulator Configuration
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                {isEditing ? "Edit Simulator HVAC" : "Create Simulator HVAC"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <PanelSection title="Device Identity">
            <div className="grid gap-4">
              <Field label="External Device ID" required>
                <input
                  value={form.externalDeviceId}
                  disabled={isEditing}
                  onChange={(e) =>
                    updateField("externalDeviceId", e.target.value)
                  }
                  placeholder="hvac-1"
                  className="glass-input"
                />
              </Field>

              <Field label="Unit Name" required>
                <input
                  value={form.unitName}
                  onChange={(e) => updateField("unitName", e.target.value)}
                  placeholder="HVAC-1"
                  className="glass-input"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Unit Type">
                  <input
                    value={form.unitType}
                    onChange={(e) => updateField("unitType", e.target.value)}
                    placeholder="Split Unit"
                    className="glass-input"
                  />
                </Field>

                <Field label="Zone">
                  <input
                    value={form.zone}
                    onChange={(e) => updateField("zone", e.target.value)}
                    placeholder="Level 1"
                    className="glass-input"
                  />
                </Field>
              </div>

              <Field label="Protocol">
                <select
                  value={form.protocol}
                  onChange={(e) => updateField("protocol", e.target.value)}
                  className="glass-input"
                >
                  <option value="SIMULATOR">SIMULATOR</option>
                  <option value="BACNET">BACNET</option>
                  <option value="MODBUS">MODBUS</option>
                </select>
              </Field>
            </div>
          </PanelSection>

          <PanelSection title="Telemetry Defaults">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Temperature">
                <input
                  type="number"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => updateField("temperature", e.target.value)}
                  className="glass-input"
                />
              </Field>

              <Field label="Setpoint">
                <input
                  type="number"
                  step="0.1"
                  value={form.setpoint}
                  onChange={(e) => updateField("setpoint", e.target.value)}
                  className="glass-input"
                />
              </Field>

              <Field label="Fan Speed">
                <input
                  type="number"
                  step="1"
                  value={form.fanSpeed}
                  onChange={(e) => updateField("fanSpeed", e.target.value)}
                  className="glass-input"
                />
              </Field>

              <Field label="Flow Rate">
                <input
                  type="number"
                  step="0.1"
                  value={form.flowRate}
                  onChange={(e) => updateField("flowRate", e.target.value)}
                  className="glass-input"
                />
              </Field>
            </div>
          </PanelSection>

          <PanelSection title="Simulation State">
            <div className="grid gap-3">
              <ToggleRow
                label="On State"
                description="Simulate the HVAC as powered on."
                checked={form.onState}
                onChange={(checked) => updateField("onState", checked)}
              />

              <ToggleRow
                label="Fault"
                description="Generate fault telemetry for alert testing."
                checked={form.fault}
                onChange={(checked) => updateField("fault", checked)}
                danger
              />

              <ToggleRow
                label="Enabled"
                description="Include this device in Edge Controller config."
                checked={form.enabled}
                onChange={(checked) => updateField("enabled", checked)}
              />
            </div>
          </PanelSection>

          <PanelSection title="Optional Links">
            <div className="grid gap-4">
              <Field label="Linked Logical HVAC ID">
                <input
                  value={form.hvacId}
                  onChange={(e) => updateField("hvacId", e.target.value)}
                  placeholder="Optional UUID"
                  className="glass-input"
                />
              </Field>

              <Field label="Edge Controller ID">
                <input
                  value={form.edgeControllerId}
                  onChange={(e) =>
                    updateField("edgeControllerId", e.target.value)
                  }
                  placeholder="Optional UUID"
                  className="glass-input"
                />
              </Field>
            </div>
          </PanelSection>

          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="flex-1 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : isEditing
                ? "Update Simulator HVAC"
                : "Create Simulator HVAC"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-300">*</span>}
      </span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  danger?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:bg-white/[0.06]">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-xs text-slate-500">{description}</div>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`h-5 w-5 accent-cyan-300 ${danger ? "accent-red-400" : ""}`}
      />
    </label>
  );
}