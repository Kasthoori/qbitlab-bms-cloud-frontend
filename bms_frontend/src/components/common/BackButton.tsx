import type { FC } from "react";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  label?: string;
  onClick: () => void;
};

const BackButton: FC<BackButtonProps> = ({ label = "Back", onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
};

export default BackButton;