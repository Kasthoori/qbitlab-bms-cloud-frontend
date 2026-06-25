import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Thermometer,
  Wrench,
} from "lucide-react";

import { BmsBadge } from "./BmsBadge";
import { BmsButton } from "./BmsButton";
import { BmsDashboardWidgetCard } from "./BmsDashboardWidgetCard";

const meta = {
  title: "UI/BmsDashboardWidgetCard",
  component: BmsDashboardWidgetCard,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
    },
    subtitle: {
      control: "text",
    },
    size: {
      control: "select",
      options: ["small", "medium", "wide", "full"],
    },
    onHide: {
      action: "hide clicked",
    },
  },
  args: {
    title: "Critical Sites",
    subtitle: "Drag to reorder dashboard",
    size: "medium",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <div className="max-w-md">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof BmsDashboardWidgetCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Critical Sites",
    children: (
      <div className="rounded-[1.25rem] border border-rose-400/50 bg-rose-500/10 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-rose-200/80">
              Critical
            </p>
            <p className="mt-2 text-4xl font-bold text-white">16</p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <Building2 className="h-5 w-5 text-rose-100" />
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-300">
          Driver Rest Room: 9 HVAC unit(s) have stale telemetry.
        </p>
      </div>
    ),
  },
};

export const LongTitleWrapping: Story = {
  args: {
    title: "Open Repairs Requiring Technician or Manager Action",
    subtitle: "Drag to reorder dashboard",
    children: (
      <div className="rounded-[1.25rem] border border-amber-400/50 bg-amber-500/10 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">
              Open Repairs
            </p>
            <p className="mt-2 text-4xl font-bold text-white">17</p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <Wrench className="h-5 w-5 text-amber-100" />
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-300">
          This story confirms that long widget headings wrap correctly instead
          of becoming truncated.
        </p>
      </div>
    ),
  },
};

export const WithHeaderAction: Story = {
  args: {
    title: "Site Health",
    subtitle: "Drag to reorder dashboard",
    headerAction: <BmsBadge variant="success">Healthy</BmsBadge>,
    children: (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-white">System online</p>
              <p className="text-xs text-slate-400">27 active HVAC units</p>
            </div>
          </div>

          <BmsBadge variant="success">Live</BmsBadge>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
          <div className="flex items-center gap-3">
            <Thermometer className="h-5 w-5 text-cyan-300" />
            <div>
              <p className="text-sm font-semibold text-white">Average temp</p>
              <p className="text-xs text-slate-400">Across all active sites</p>
            </div>
          </div>

          <p className="text-lg font-bold text-white">22.1°C</p>
        </div>
      </div>
    ),
  },
};

export const WithoutHideButton: Story = {
  args: {
    title: "Energy Overview",
    subtitle: "Pinned widget",
    onHide: undefined,
    children: (
      <div className="rounded-[1.25rem] border border-cyan-400/40 bg-cyan-500/10 p-5">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-cyan-200" />
          <div>
            <p className="text-sm font-semibold text-white">Current power</p>
            <p className="mt-1 text-3xl font-bold text-white">12.4 kW</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-300">
          Live energy usage from mapped meters.
        </p>
      </div>
    ),
  },
};

export const WideWidget: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <div className="grid max-w-5xl grid-cols-1 gap-6 xl:grid-cols-2">
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    title: "Temperature Trend",
    subtitle: "Drag to reorder dashboard",
    size: "wide",
    children: (
      <div className="rounded-[1.25rem] border border-slate-700/70 bg-slate-900/70 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              Average temperature by site
            </p>
            <p className="text-xs text-slate-400">Last 24 hours</p>
          </div>

          <BarChart3 className="h-5 w-5 text-cyan-300" />
        </div>

        <div className="space-y-3">
          {[
            ["Driver Rest Room", "24.2°C", "w-[82%]"],
            ["Main Building", "22.4°C", "w-[68%]"],
            ["Workshop", "21.7°C", "w-[60%]"],
          ].map(([site, value, width]) => (
            <div key={site}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-300">{site}</span>
                <span className="text-slate-100">{value}</span>
              </div>

              <div className="h-2 rounded-full bg-slate-800">
                <div className={`${width} h-2 rounded-full bg-cyan-300/70`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
};

export const AlertState: Story = {
  args: {
    title: "Stale Telemetry Alerts",
    subtitle: "Drag to reorder dashboard",
    headerAction: <BmsBadge variant="warning">Needs attention</BmsBadge>,
    children: (
      <div className="rounded-[1.25rem] border border-orange-400/50 bg-orange-500/10 p-5">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-orange-200" />
          <div>
            <p className="text-sm font-semibold text-white">Telemetry stale</p>
            <p className="text-xs text-slate-400">
              Some edge devices have not reported recently.
            </p>
          </div>
        </div>

        <BmsButton variant="secondary" size="sm">
          View devices
        </BmsButton>
      </div>
    ),
  },
};