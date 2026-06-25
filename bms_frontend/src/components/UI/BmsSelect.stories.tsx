import type { Meta, StoryObj } from "@storybook/react-vite";
import { BmsSelect } from "./BmsSelect";

const meta = {
  title: "BMS/UI/BmsSelect",
  component: BmsSelect,
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
    disabled: {
      control: "boolean",
    },
    className: {
      control: "text",
    },
    wrapperClassName: {
      control: "text",
    },
    defaultValue: {
      control: "text",
    },
  },
  args: {
    label: "Protocol",
    helperText: "Select the communication protocol used by this device.",
    disabled: false,
    wrapperClassName: "w-[420px]",
    defaultValue: "MODBUS_RTU",
    children: (
      <>
        <option value="">Select protocol</option>
        <option value="SIMULATOR">Simulator</option>
        <option value="BACNET">BACnet</option>
        <option value="MODBUS_TCP">Modbus TCP</option>
        <option value="MODBUS_RTU">Modbus RTU</option>
      </>
    ),
  },
} satisfies Meta<typeof BmsSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Protocol",
    helperText: "Select the communication protocol used by this device.",
    defaultValue: "MODBUS_RTU",
  },
};

export const SiteSelect: Story = {
  args: {
    label: "Site",
    helperText: "Choose the site where this controller is installed.",
    defaultValue: "auckland-demo",
    children: (
      <>
        <option value="">Select site</option>
        <option value="auckland-demo">Auckland Demo Site</option>
        <option value="wellington-office">Wellington Office</option>
        <option value="christchurch-plant">Christchurch Plant</option>
      </>
    ),
  },
};

export const RoleSelect: Story = {
  args: {
    label: "User role",
    helperText: "This role controls dashboard visibility and permissions.",
    defaultValue: "SITE_MANAGER",
    children: (
      <>
        <option value="">Select role</option>
        <option value="BMS_ADMIN">BMS Admin</option>
        <option value="SITE_MANAGER">Site Manager</option>
        <option value="TECHNICIAN">Technician</option>
      </>
    ),
  },
};

export const Error: Story = {
  args: {
    label: "HVAC point",
    error: "Please select a valid HVAC point.",
    defaultValue: "",
    children: (
      <>
        <option value="">Select HVAC point</option>
        <option value="temperature">Temperature</option>
        <option value="setpoint">Setpoint</option>
        <option value="on_state">On State</option>
        <option value="fan_speed">Fan Speed</option>
        <option value="flow_rate">Flow Rate</option>
        <option value="fault">Fault</option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    label: "Tenant",
    helperText: "Tenant is controlled by your current login session.",
    disabled: true,
    defaultValue: "qbitlabs-demo",
    children: (
      <>
        <option value="qbitlabs-demo">QbitLabs Demo Tenant</option>
      </>
    ),
  },
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    helperText: "Filter dashboard widgets by status.",
    defaultValue: "active",
    children: (
      <>
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="fault">Fault</option>
        <option value="offline">Offline</option>
        <option value="maintenance">Maintenance</option>
      </>
    ),
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="grid w-130 gap-5">
      <BmsSelect
        label="Normal select"
        helperText="Select a normal value."
        defaultValue="BACNET"
      >
        <option value="">Select protocol</option>
        <option value="SIMULATOR">Simulator</option>
        <option value="BACNET">BACnet</option>
        <option value="MODBUS_TCP">Modbus TCP</option>
        <option value="MODBUS_RTU">Modbus RTU</option>
      </BmsSelect>

      <BmsSelect
        label="Error select"
        error="Protocol is required."
        defaultValue=""
      >
        <option value="">Select protocol</option>
        <option value="SIMULATOR">Simulator</option>
        <option value="BACNET">BACnet</option>
        <option value="MODBUS_TCP">Modbus TCP</option>
        <option value="MODBUS_RTU">Modbus RTU</option>
      </BmsSelect>

      <BmsSelect
        label="Disabled select"
        helperText="This field cannot be changed."
        disabled
        defaultValue="qbitlabs-demo"
      >
        <option value="qbitlabs-demo">QbitLabs Demo Tenant</option>
      </BmsSelect>
    </div>
  ),
};