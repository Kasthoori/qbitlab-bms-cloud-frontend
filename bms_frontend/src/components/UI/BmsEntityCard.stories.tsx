import type { Meta, StoryObj } from "@storybook/react-vite";
import { BmsEntityCard } from "./BmsEntityCard";

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h18" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9 7h1" />
      <path d="M14 7h1" />
      <path d="M9 11h1" />
      <path d="M14 11h1" />
      <path d="M9 15h1" />
      <path d="M14 15h1" />
    </svg>
  );
}

function HvacIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <path d="m4.93 4.93 14.14 14.14" />
      <path d="m19.07 4.93-14.14 14.14" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const meta = {
  title: "BMS/UI/BmsEntityCard",
  component: BmsEntityCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    eyebrow: {
      control: "text",
    },
    title: {
      control: "text",
    },
    statusLabel: {
      control: "text",
    },
    status: {
      control: "select",
      options: ["active", "inactive", "warning", "danger", "neutral"],
    },
    helperText: {
      control: "text",
    },
    className: {
      control: "text",
    },
  },
  args: {
    eyebrow: "Tenant",
    title: "Swanson Transport Ltd",
    icon: <BuildingIcon />,
    statusLabel: "Active",
    status: "active",
    className: "w-[540px]",
    meta: (
      <>
        Tenant ID: 045f186d-dfc5-49a9-861e-97e0fd22a4df Created: Not
        available
      </>
    ),
    helperText: "AI-ready tenant workspace",
    actions: [
      {
        label: (
          <>
            View Sites <span>→</span>
          </>
        ),
        onClick: () => undefined,
        variant: "primary",
      },
      {
        label: "Add Site",
        onClick: () => undefined,
        variant: "secondary",
      },
      {
        label: "Edit",
        onClick: () => undefined,
        variant: "ghost",
      },
      {
        label: "Delete",
        onClick: () => undefined,
        variant: "danger",
      },
    ],
  },
} satisfies Meta<typeof BmsEntityCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tenant: Story = {};

export const Site: Story = {
  args: {
    eyebrow: "Site",
    title: "Henderson Mall",
    icon: <BuildingIcon />,
    statusLabel: "Active",
    status: "active",
    meta: (
      <>
        Site ID: 27ebff4e-88e3-4fb2-8da0-6bcd9d3b25fd · Auckland, New
        Zealand
      </>
    ),
    helperText: "AI-ready site workspace",
    actions: [
      {
        label: (
          <>
            View HVACs <span>→</span>
          </>
        ),
        onClick: () => undefined,
        variant: "primary",
      },
      {
        label: "Add HVAC",
        onClick: () => undefined,
        variant: "secondary",
      },
      {
        label: "Edit",
        onClick: () => undefined,
        variant: "ghost",
      },
      {
        label: "Delete",
        onClick: () => undefined,
        variant: "danger",
      },
    ],
  },
};

export const Hvac: Story = {
  args: {
    eyebrow: "HVAC",
    title: "PT100 Temperature Sensor Unit 1",
    icon: <HvacIcon />,
    statusLabel: "Online",
    status: "active",
    meta: (
      <>
        Device ID: modbus-rtu-pt100-1 · Protocol: MODBUS_RTU · Temperature:
        17.4°C
      </>
    ),
    helperText: "Live telemetry available from edge controller",
    actions: [
      {
        label: "View Details",
        onClick: () => undefined,
        variant: "primary",
      },
      {
        label: "Maintenance Notes",
        onClick: () => undefined,
        variant: "secondary",
      },
      {
        label: "Edit",
        onClick: () => undefined,
        variant: "ghost",
      },
      {
        label: "Disable",
        onClick: () => undefined,
        variant: "warning",
      },
    ],
  },
};

export const Warning: Story = {
  args: {
    eyebrow: "HVAC",
    title: "AHU Level 2",
    icon: <HvacIcon />,
    statusLabel: "Warning",
    status: "warning",
    meta: <>Setpoint not reached for 35 minutes · Last telemetry 2 min ago</>,
    helperText: "AI recommends checking filter, airflow, and sensor reading",
    actions: [
      {
        label: "Open Insight",
        onClick: () => undefined,
        variant: "warning",
      },
      {
        label: "Create Note",
        onClick: () => undefined,
        variant: "secondary",
      },
    ],
  },
};

export const Danger: Story = {
  args: {
    eyebrow: "HVAC",
    title: "Chiller Plant Controller",
    icon: <HvacIcon />,
    statusLabel: "Critical",
    status: "danger",
    meta: <>Active fault detected · Cooling demand high · Command blocked</>,
    helperText: "Technician action required before recommissioning",
    actions: [
      {
        label: "View Fault",
        onClick: () => undefined,
        variant: "danger",
      },
      {
        label: "Assign Technician",
        onClick: () => undefined,
        variant: "secondary",
      },
    ],
  },
};

export const Inactive: Story = {
  args: {
    eyebrow: "User",
    title: "Technician Account",
    icon: <UserIcon />,
    statusLabel: "Inactive",
    status: "inactive",
    meta: <>Role: TECHNICIAN · Last login: Not available</>,
    helperText: "Account can be reactivated by BMS Admin",
    actions: [
      {
        label: "Activate",
        onClick: () => undefined,
        variant: "success",
      },
      {
        label: "Edit",
        onClick: () => undefined,
        variant: "ghost",
      },
    ],
  },
};

export const WithoutActions: Story = {
  args: {
    eyebrow: "Tenant",
    title: "Read Only Tenant",
    icon: <BuildingIcon />,
    statusLabel: "Active",
    status: "active",
    meta: <>Tenant ID: read-only-demo · Created: 2026-06-24</>,
    helperText: "This card shows metadata only.",
    actions: [],
  },
};

export const WithCustomChildren: Story = {
  args: {
    eyebrow: "Energy Meter",
    title: "Main Distribution Board",
    icon: <BuildingIcon />,
    statusLabel: "Active",
    status: "active",
    meta: <>Meter ID: energy-main-001 · Source: MODBUS_TCP</>,
    helperText: "Energy telemetry available",
    children: (
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-300/10 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">Power</p>
          <p className="mt-1 text-lg font-bold text-slate-100">18.4 kW</p>
        </div>

        <div className="rounded-2xl border border-slate-300/10 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">Energy</p>
          <p className="mt-1 text-lg font-bold text-slate-100">142 kWh</p>
        </div>

        <div className="rounded-2xl border border-slate-300/10 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">Cost</p>
          <p className="mt-1 text-lg font-bold text-slate-100">$38.20</p>
        </div>
      </div>
    ),
    actions: [
      {
        label: "View Trends",
        onClick: () => undefined,
        variant: "primary",
      },
      {
        label: "Map Points",
        onClick: () => undefined,
        variant: "secondary",
      },
    ],
  },
};