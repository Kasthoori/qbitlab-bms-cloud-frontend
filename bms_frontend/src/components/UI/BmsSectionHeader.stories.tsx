import type { Meta, StoryObj } from "@storybook/react-vite";
import { BmsSectionHeader } from "./BmsSectionHeader";
import { BmsButton } from "./BmsButton";
import { BmsBadge } from "./BmsBadge";

const meta = {
  title: "BMS/UI/BmsSectionHeader",
  component: BmsSectionHeader,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
    },
    subtitle: {
      control: "text",
    },
    className: {
      control: "text",
    },
  },
  args: {
    title: "Dashboard Overview",
    subtitle: "Monitor site health, HVAC status, alarms, and AI insights.",
    className: "w-[720px]",
  },
} satisfies Meta<typeof BmsSectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Dashboard Overview",
    subtitle: "Monitor site health, HVAC status, alarms, and AI insights.",
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Energy Overview",
    subtitle: undefined,
  },
};

export const WithButtonAction: Story = {
  args: {
    title: "HVAC Devices",
    subtitle: "Manage logical HVAC units, discovered devices, and point mappings.",
    action: <BmsButton variant="primary">Add HVAC</BmsButton>,
  },
};

export const WithSecondaryAction: Story = {
  args: {
    title: "Maintenance Notes",
    subtitle: "Review technician notes, clarifications, and manager approvals.",
    action: <BmsButton variant="secondary">View All Notes</BmsButton>,
  },
};

export const WithBadgeAction: Story = {
  args: {
    title: "Continuous Commissioning",
    subtitle: "AI-driven checks for waste, comfort problems, and repeated faults.",
    action: <BmsBadge variant="purple">AI Enabled</BmsBadge>,
  },
};

export const WithMultipleActions: Story = {
  args: {
    title: "Discovered Devices",
    subtitle: "Review BACnet, Modbus TCP, and Modbus RTU devices found by edge controllers.",
    action: (
      <div className="flex items-center gap-3">
        <BmsButton variant="ghost">Refresh</BmsButton>
        <BmsButton variant="primary">Start Scan</BmsButton>
      </div>
    ),
  },
};

export const LongSubtitle: Story = {
  args: {
    title: "Command Audit Report",
    subtitle:
      "Track every command sent to HVAC devices, including who requested it, safety validation result, execution status, and edge controller response.",
    action: <BmsButton variant="secondary">Export CSV</BmsButton>,
  },
};

export const BmsPageExamples: Story = {
  render: () => (
    <div className="grid w-190 gap-8">
      <BmsSectionHeader
        title="Role Based Dashboard"
        subtitle="Personalized dashboard layout with draggable widgets and hidden drawer support."
        action={<BmsButton variant="primary">Customize</BmsButton>}
      />

      <BmsSectionHeader
        title="AI Recommendations"
        subtitle="Suggested operational improvements based on telemetry, alarms, and maintenance history."
        action={<BmsBadge variant="purple">AI Insight</BmsBadge>}
      />

      <BmsSectionHeader
        title="Energy Meter Mapping"
        subtitle="Map discovered energy meters to logical meters before sending production telemetry."
        action={<BmsButton variant="success">Save Mapping</BmsButton>}
      />

      <BmsSectionHeader
        title="Alarm Management"
        subtitle="Critical alarms that need attention from site managers or technicians."
        action={<BmsBadge variant="danger">Critical</BmsBadge>}
      />
    </div>
  ),
};