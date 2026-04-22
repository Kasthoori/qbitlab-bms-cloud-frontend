import { motion } from "framer-motion";
import { ArrowLeft, Home, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-10 text-center max-w-lg w-full shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-full bg-red-500/10 border border-red-400/20">
            <LockKeyhole size={48} className="text-red-300" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          Access Denied
        </h1>

        <p className="text-slate-300 mb-6">
          You don’t have permission to access this page.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-white flex items-center gap-2"
          >
            <Home size={16} /> Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}