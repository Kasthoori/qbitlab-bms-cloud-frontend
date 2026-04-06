import HvacWsTable from "../HvacWsTable";

export default function Dashboard() {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            {/* <p className="text-slate-800">
                Real time building matrix
            </p> */}
            <HvacWsTable />
        </div>
    );
}