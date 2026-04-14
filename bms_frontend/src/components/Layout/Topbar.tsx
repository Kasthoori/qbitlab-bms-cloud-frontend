import { UserCircle } from "lucide-react";

export default function Topbar() {
    return (
        <header className="h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 text-white">
  
            <h1 className="text-lg font-semibold text-white">
                Building Management System
            </h1>

            <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">Admin</span>
                <UserCircle className="text-slate-300" />
            </div>
        </header>
    );
}