import { NavLink } from "react-router-dom";
import { 
    LayoutDashboard,
    Wind,
    Lightbulb,
    Zap,
    Bell,
    Users

} from "lucide-react";


const navItems = [
    {label: "Dashboard", path: "/", icon: LayoutDashboard },
    {label: "HVAC", path: "/hvac", icon: Wind},
    { label: "Lighting", path: "/onboarding", icon: Lightbulb },
    { label: "Energy", path: "/energy", icon: Zap },
    { label: "Alarms", path: "/alarms", icon: Bell },
    { label: "Users", path: "/users", icon: Users },
];


export default function Sidebar() {
    return (
        <aside className="w-64 bg-[#0F172A] text-slate-200 flex flex-col">
            <div className="h-16 flex items-center px-6 text-xl font-semibold border-b border-slate-700">
                QbitLab BMS
            </div>

            {/* Navigation */}

            <nav className="flex-1 px-3 py-4 space-y-1">
               {navItems.map(({ label, path, icon: Icon}) => (
                   <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium
                             transition-colors
                            ${
                                isActive
                                ? "bg-slate-800 text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                             }`
                        }
                   >
                        <Icon size={18} />
                        {label}
                   </NavLink>
               ))}
            </nav>

            {/* Footer */}
            <div className="p-4 boarder-t border-slate-700 text-xs text-slate-400">
                &copy; 2024 QbitLab. All rights reserved.
            </div>
        </aside>
    );
}