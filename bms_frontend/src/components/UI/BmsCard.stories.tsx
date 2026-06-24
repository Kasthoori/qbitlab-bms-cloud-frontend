import type { Meta, StoryObj } from "@storybook/react-vite";
import { BmsCard } from "./BmsCard";

const meta = {
  title: "BMS/UI/BmsCard",
  component: BmsCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["glass", "section"],
    },
    hover: {
      control: "boolean",
    },
    className: {
      control: "text",
    },
  },
  args: {
    variant: "glass",
    hover: false,
    className: "w-[420px]",
    children: (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
            QbitLabs BMS
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-50">
            AI + Glass Card
          </h3>
        </div>

        <p className="text-sm leading-6 text-slate-300">
          This card is used as a reusable container for dashboard widgets,
          settings sections, analytics panels, and BMS feature modules.
        </p>
      </div>
    ),
  },
} satisfies Meta<typeof BmsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Glass: Story = {
  args: {
    variant: "glass",
  },
};

export const GlassWithHover: Story = {
  args: {
    variant: "glass",
    hover: true,
  },
};

export const Section: Story = {
  args: {
    variant: "section",
  },
};

export const DashboardWidget: Story = {
  args: {
    variant: "glass",
    hover: true,
    className: "w-[460px]",
    children: (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              Site Health
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-50">
              Auckland Demo Site
            </h3>
          </div>

          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Healthy
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-xs text-slate-400">HVACs</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">18</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-xs text-slate-400">Alarms</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">2</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-3">
            <p className="text-xs text-slate-400">Energy</p>
            <p className="mt-1 text-lg font-semibold text-slate-50">74%</p>
          </div>
        </div>
      </div>
    ),
  },
};