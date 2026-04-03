import { useParams } from "react-router-dom";
import HvacWsTable from "../ViewHvacDetails/HvacWsTable";
import StatCard from "./StatCard";

export default function HvacPage() {
    const { tenantId, siteId } = useParams<{
        tenantId: string;
        siteId: string;
    }>();

    if (!tenantId || !siteId) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 shadow">
                Missing tenantId or siteId in route.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">HVAC</h2>

            <section className="grid grid-cols-4 gap-4">
                <StatCard title="Active Units" value="18" />
                <StatCard title="Faults" value="2" status="warning" />
                <StatCard title="Avg Temp" value="22.4°C" />
                <StatCard title="Total Energy Consumption (kWh)" value="1250" />
            </section>

            <section className="rounded-lg bg-white shadow">
                <HvacWsTable tenantId={tenantId} siteId={siteId} />
            </section>
        </div>
    );
}