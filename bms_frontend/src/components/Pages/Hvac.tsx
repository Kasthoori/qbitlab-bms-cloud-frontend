import HvacWsTable from "../HvacWsTable";
import StatCard from "./StatCard";

export default function HvacPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">HVAC</h2>
            {/* HVAC Summery */}
            <section className="grid grid-cols-4 gap-4">
                <StatCard title="Active Units" value="18" />
                <StatCard title="Faults" value="2" status="warning" />
                <StatCard title="Avg Temp" value="22.4°C" />
                <StatCard title="Total Energy Consumption (kWh)" value="1250" />
            </section>
            {/* Additional HVAC content can go here */}
            <section className="bg-white rounded-lg shadow">
               <HvacWsTable />
            </section>
        </div>
    );
}