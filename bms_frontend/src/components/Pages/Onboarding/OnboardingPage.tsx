import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Building2, MapPin, Cpu } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const steps = ["Tenant", "Site", "Systems", "AI Review"];

  return (
    <div className="min-h-full bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl text-white">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="text-blue-400" />
          Smart Building Setup
        </h1>
        <p className="text-slate-400 mt-2">
          Configure your building with AI-assisted onboarding
        </p>
      </div>

      {/* STEPPER */}
      <div className="flex gap-4 mb-8">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`px-4 py-2 rounded-full text-sm transition ${
              i === step
                ? "bg-linear-to-r from-blue-500 to-purple-500"
                : "bg-white/10 text-slate-400"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* AI PANEL */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="text-purple-400" />
            AI Assistant
          </h2>

          <ul className="space-y-3 text-sm text-slate-300">
            <li>✔ Recommended NZ building structure</li>
            <li>✔ Estimated HVAC units: 12–18</li>
            <li>✔ Energy optimization enabled</li>
          </ul>

          <div className="mt-6 p-4 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
            <p className="text-sm">
              💡 Tip: Add 1 HVAC per 100m² for optimal performance
            </p>
          </div>
        </motion.div>

        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Building2 />
            Create Tenant
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <input
              placeholder="Tenant Name"
              className="input"
            />

            <input
              placeholder="Country"
              defaultValue="New Zealand"
              className="input"
            />

            <input
              placeholder="Address Line 1"
              className="col-span-2 input"
            />

            <input
              placeholder="City"
              className="input"
            />

            <input
              placeholder="Postcode"
              className="input"
            />

          </div>

          {/* ACTION */}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-blue-500 to-purple-500 hover:scale-105 transition"
            >
              🚀 Continue
            </button>
          </div>
        </motion.div>
      </div>

      {/* LIVE PREVIEW */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
      >
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Cpu />
          Live Preview
        </h3>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Tenant</p>
            <p>QbitLab Facilities</p>
          </div>
          <div>
            <p className="text-slate-400">Location</p>
            <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                     Auckland
            </p>
          </div>
          <div>
            <p className="text-slate-400">HVAC</p>
            <p>~14 Units</p>
          </div>
          <div>
            <p className="text-slate-400">Efficiency</p>
            <p className="text-green-400">Good</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}