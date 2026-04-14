import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
  Map,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { BmsApi } from "@/api/bms";

export default function UploadFloorPlanPage() {
  const navigate = useNavigate();
  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInfo = useMemo(() => {
    if (!file) return null;

    const sizeInKb = file.size / 1024;
    const readableSize =
      sizeInKb < 1024
        ? `${sizeInKb.toFixed(1)} KB`
        : `${(sizeInKb / 1024).toFixed(2)} MB`;

    return {
      name: file.name,
      type: file.type || "Unknown",
      size: readableSize,
    };
  }, [file]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!tenantId || !siteId) {
      setErrorMessage("Tenant ID or Site ID is missing from the route.");
      return;
    }

    if (!file) {
      setErrorMessage("Please select a file.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Selected file must be an image.");
      return;
    }

    setBusy(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await BmsApi.UploadFloorPlan(tenantId, siteId, file, name);
      setSuccessMessage("Floor plan uploaded successfully.");
      setName("");
      setFile(null);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to upload floor plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
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

      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-300">
            <Map className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              <Sparkles className="h-4 w-4" />
              Floor Plan Management
            </div>

            <h1 className="mt-3 text-3xl font-bold text-white">
              Upload Floor Plan
            </h1>

            <p className="mt-2 text-slate-400">
              Upload building plan images for device placement, visual navigation,
              and smart site mapping.
            </p>

            <p className="mt-3 text-sm text-slate-500">
              <span className="font-medium text-slate-300">Tenant:</span> {tenantId}
              <span className="mx-2 text-slate-600">•</span>
              <span className="font-medium text-slate-300">Site:</span> {siteId}
            </p>
          </div>
        </div>
      </div>

      {/* Main Upload Form */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left Info Panel */}
        <div className="space-y-6 xl:col-span-1">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-purple-300" />
              AI Guidance
            </h2>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Use clear floor plan names such as:
                <div className="mt-2 text-slate-400">
                  Ground Floor, Level 1, Warehouse South, Lobby Plan
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Best results come from:
                <div className="mt-2 text-slate-400">
                  SVG, PNG, JPG, WEBP, or high-resolution building layout images.
                </div>
              </div>

              <div className="rounded-2xl bg-linear-to-r from-blue-500/20 to-purple-500/20 p-4 text-slate-200">
                💡 Tip: Upload clean plans first, then place HVAC units visually on top of them.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <ImagePlus className="h-5 w-5 text-cyan-300" />
              Selected File
            </h2>

            {fileInfo ? (
              <div className="space-y-3 text-sm text-slate-300">
                <div>
                  <p className="text-slate-400">Name</p>
                  <p className="break-all text-white">{fileInfo.name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Type</p>
                  <p>{fileInfo.type}</p>
                </div>
                <div>
                  <p className="text-slate-400">Size</p>
                  <p>{fileInfo.size}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No file selected yet.</p>
            )}
          </div>
        </div>

        {/* Right Upload Form */}
        <div className="xl:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
              <UploadCloud className="h-5 w-5 text-blue-300" />
              Upload New Plan
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Floor Plan Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Ground Floor"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Select File
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center transition hover:bg-white/10">
                  <UploadCloud className="mb-3 h-10 w-10 text-blue-300" />
                  <span className="text-base font-medium text-white">
                    Choose a floor plan image
                  </span>
                  <span className="mt-2 text-sm text-slate-400">
                    Supported: SVG, PNG, JPG, JPEG, WEBP, GIF, BMP
                  </span>

                  <input
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.bmp"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              </div>

              {successMessage && (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!file || busy}
                  className="rounded-2xl bg-linear-to-r from-blue-500 to-purple-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Uploading..." : "Upload Floor Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}