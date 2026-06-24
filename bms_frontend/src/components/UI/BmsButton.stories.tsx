import type { Meta, StoryObj } from "@storybook/react-vite";
import { BmsButton } from "./BmsButton";

const meta = {
  title: "BMS/UI/BmsButton",
  component: BmsButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger", "success"],
    },
    disabled: {
      control: "boolean",
    },
    className: {
      control: "text",
    },
    children: {
      control: "text",
    },
    onClick: {
      action: "clicked",
    },
  },
  args: {
    variant: "primary",
    disabled: false,
    children: "Save Changes",
  },
} satisfies Meta<typeof BmsButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Delete",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Approve",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    disabled: true,
    children: "Disabled Button",
  },
};

export const FullWidth: Story = {
  args: {
    variant: "primary",
    className: "w-80",
    children: "Full Width Button",
  },
};

export const WithIcon: Story = {
  args: {
    variant: "primary",
    children: (
      <>
        <span>⚡</span>
        <span>Run AI Check</span>
      </>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <BmsButton variant="primary">Primary</BmsButton>
      <BmsButton variant="secondary">Secondary</BmsButton>
      <BmsButton variant="ghost">Ghost</BmsButton>
      <BmsButton variant="danger">Danger</BmsButton>
      <BmsButton variant="success">Success</BmsButton>
    </div>
  ),
};