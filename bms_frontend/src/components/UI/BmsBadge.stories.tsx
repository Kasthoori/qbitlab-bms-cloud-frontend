import type { Meta, StoryObj } from "@storybook/react-vite";
import { BmsBadge } from "./BmsBadge";

const meta = {
  title: "BMS/UI/BmsBadge",
  component: BmsBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["cyan", "purple", "success", "warning", "danger", "neutral"],
    },
    children: {
      control: "text",
    },
    className: {
      control: "text",
    },
  },
  args: {
    variant: "neutral",
    children: "Neutral",
  },
} satisfies Meta<typeof BmsBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: {
    variant: "neutral",
    children: "Neutral",
  },
};

export const Cyan: Story = {
  args: {
    variant: "cyan",
    children: "BACnet",
  },
};

export const Purple: Story = {
  args: {
    variant: "purple",
    children: "AI Insight",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Healthy",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Critical",
  },
};

export const WithIcon: Story = {
  args: {
    variant: "success",
    children: (
      <span className="inline-flex items-center gap-1.5">
        <span>●</span>
        <span>Online</span>
      </span>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <BmsBadge variant="cyan">BACnet</BmsBadge>
      <BmsBadge variant="purple">AI Insight</BmsBadge>
      <BmsBadge variant="success">Healthy</BmsBadge>
      <BmsBadge variant="warning">Warning</BmsBadge>
      <BmsBadge variant="danger">Critical</BmsBadge>
      <BmsBadge variant="neutral">Offline</BmsBadge>
    </div>
  ),
};

export const BmsUseCases: Story = {
  render: () => (
    <div className="grid w-130 gap-4">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <span className="text-sm font-semibold text-slate-200">AHU-01 Status</span>
        <BmsBadge variant="success">Running</BmsBadge>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <span className="text-sm font-semibold text-slate-200">Telemetry</span>
        <BmsBadge variant="warning">Stale</BmsBadge>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <span className="text-sm font-semibold text-slate-200">Alarm Severity</span>
        <BmsBadge variant="danger">Critical</BmsBadge>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <span className="text-sm font-semibold text-slate-200">Protocol</span>
        <BmsBadge variant="cyan">Modbus RTU</BmsBadge>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <span className="text-sm font-semibold text-slate-200">Recommendation</span>
        <BmsBadge variant="purple">AI Generated</BmsBadge>
      </div>
    </div>
  ),
};