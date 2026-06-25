import { motion } from "framer-motion";
import { ArrowLeft, Home, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { BmsButton, BmsCard } from "@/components/UI";

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="bms-dashboard-bg flex min-h-screen items-center justify-center p-6 text-slate-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <BmsCard variant="section" className="p-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full border border-rose-400/20 bg-rose-500/10 p-6 text-rose-300 shadow-[0_0_40px_rgba(244,63,94,0.12)]">
              <LockKeyhole className="h-12 w-12" />
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300/80">
            Permission Required
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            Access Denied
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            You don’t have permission to access this page.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <BmsButton
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </BmsButton>

            <BmsButton
              type="button"
              variant="primary"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </BmsButton>
          </div>
        </BmsCard>
      </motion.div>
    </div>
  );
}