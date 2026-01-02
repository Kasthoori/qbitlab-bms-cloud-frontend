import type { ReactNode } from 'react';

type Status = "normal" | "warning" | "error";

interface StatCardProps {
    title: string;
    value: string  | number;
    status?: Status;
    icon?: ReactNode;
}


export default function StatCard({title, value, status = "normal", icon}: StatCardProps) {

    const statusColor = {
        normal: "text-slate-800",
        warning: "text-yellow-600",
        error: "text-red-600",
    }[status];

    return (
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500">{title}</p>
                <p className={`text-2xl font-semibold ${statusColor}`}>
                    {value}
                </p>
            </div>
            {icon && <div className="text-slate-400">{icon}</div>}
        </div>
    );
}