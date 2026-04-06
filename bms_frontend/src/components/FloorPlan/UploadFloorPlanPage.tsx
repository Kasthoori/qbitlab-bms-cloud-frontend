import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BmsApi } from "@/api/bms";

export default function UploadFloorPlanPage() {

  const navigate = useNavigate();

  const { tenantId, siteId } = useParams<{ tenantId: string; siteId: string }>();

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
   <>
    <div className="mb-4 flex items-center gap-3">
        <button
          className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
          onClick={() => navigate(`/admin/tenants/query/${tenantId}/sites`)}
        >
          ← Back
        </button>
      </div>
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Upload Floor Plan</h1>
      <p className="mt-1 text-sm text-slate-500">
        Tenant: {tenantId} | Site: {siteId}
      </p>


      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Floor Plan Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ground Floor"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Select File
          </label>
          <input
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.bmp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />
        </div>

        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || busy}
          className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Uploading..." : "Upload Floor Plan"}
        </button>
      </form>
    </div>
   </>
  );
}