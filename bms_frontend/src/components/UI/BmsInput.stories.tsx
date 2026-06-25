import type { Meta, StoryObj } from "@storybook/react-vite";
import { BmsInput } from "./BmsInput";

const meta = {
  title: "BMS/UI/BmsInput",
  component: BmsInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
    },
    helperText: {
      control: "text",
    },
    error: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
    className: {
      control: "text",
    },
    wrapperClassName: {
      control: "text",
    },
  },
  args: {
    label: "Site name",
    placeholder: "Enter site name",
    helperText: "Use a clear name for the building or site.",
    disabled: false,
    type: "text",
    wrapperClassName: "w-[420px]",
  },
} satisfies Meta<typeof BmsInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Site name",
    placeholder: "Auckland Demo Site",
    helperText: "This name will appear on dashboards and reports.",
  },
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    placeholder: "Search HVAC units...",
    helperText: "Search by HVAC name, device ID, or site.",
  },
};

export const WithValue: Story = {
  args: {
    label: "Device ID",
    defaultValue: "modbus-rtu-pt100-1",
    helperText: "External device ID received from the edge controller.",
  },
};

export const Error: Story = {
  args: {
    label: "Setpoint",
    placeholder: "Enter setpoint",
    error: "Setpoint must be between 16°C and 30°C.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Tenant",
    defaultValue: "QbitLabs Demo Tenant",
    disabled: true,
    helperText: "This field is controlled by your user role.",
  },
};

export const Password: Story = {
  args: {
    label: "Edge secret",
    type: "password",
    placeholder: "Enter edge secret",
    helperText: "Used by the edge controller to authenticate with backend APIs.",
  },
};

export const NumberInput: Story = {
  args: {
    label: "Telemetry interval",
    type: "number",
    defaultValue: 120,
    helperText: "Recommended production interval is usually around 60–120 seconds.",
  },
};

export const SearchInput: Story = {
  args: {
    label: "Search devices",
    type: "search",
    placeholder: "Search by device name or protocol...",
    helperText: "Example: BACnet, Modbus, AHU, PT100.",
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="grid w-130 gap-5">
      <BmsInput
        label="Normal input"
        placeholder="Enter value"
        helperText="This is a normal input field."
      />

      <BmsInput
        label="Input with value"
        defaultValue="Auckland Demo Site"
        helperText="This field already has a value."
      />

      <BmsInput
        label="Error input"
        placeholder="Enter setpoint"
        error="Setpoint must be between 16°C and 30°C."
      />

      <BmsInput
        label="Disabled input"
        defaultValue="Read-only value"
        disabled
        helperText="This field cannot be edited."
      />
    </div>
  ),
};