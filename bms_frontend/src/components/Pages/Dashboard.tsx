import HvacWsTable from "../ViewHvacDetails/HvacWsTable";

type Props = {
    tenantId: string;
    siteId: string;
};

export default function Dashboard({ tenantId, siteId }: Props) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>

            <HvacWsTable tenantId={tenantId} siteId={siteId} />
        </div>
    );
}