import { UserCircle } from "lucide-react";

export default function Topbar() {
    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
            <h1 className="text-lg font-semibold text-slate-800">
                Building Management System
            </h1>

            <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">Admin</span>
                <UserCircle className="text-slate-600" />
            </div>
        </header>
    );
}