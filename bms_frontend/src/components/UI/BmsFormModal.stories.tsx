import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Cpu,
  RadioTower,
} from "lucide-react";

import {
  BmsFormModal,
  BmsFormModalFooter,
  BmsModalMessage,
} from "./BmsFormModal";
import { BmsInput } from "./BmsInput";
import { BmsSelect } from "./BmsSelect";

const meta = {
  title: "BMS/UI/BmsFormModal",
  component: BmsFormModal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
    },
    eyebrow: {
      control: "text",
    },
    title: {
      control: "text",
    },
    subtitle: {
      control: "text",
    },
    saving: {
      control: "boolean",
    },
    maxWidthClassName: {
      control: "text",
    },
  },
  args: {
    open: true,
    eyebrow: "Update Record",
    title: "Reusable Form Modal",
    subtitle: "This modal is used for add/update forms across QbitLabs BMS.",
    saving: false,
    maxWidthClassName: "max-w-2xl",
    onClose: () => undefined,
    children: (
      <form>
        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="Name"
            placeholder="e.g., Auckland Demo Site"
            defaultValue="Auckland Demo Site"
          />

          <BmsInput
            label="Reference ID"
            placeholder="e.g., demo-site-001"
            defaultValue="demo-site-001"
          />
        </div>

        <BmsFormModalFooter
          submitLabel="Save Changes"
          onCancel={() => undefined}
        />
      </form>
    ),
  },
} satisfies Meta<typeof BmsFormModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UpdateTenant: Story = {
  args: {
    eyebrow: "Update Tenant",
    title: "Swanson Transport Ltd",
    icon: <Building2 className="h-5 w-5" />,
    subtitle: (
      <p>
        Tenant ID:
        <span className="ml-1 break-all font-medium text-slate-200">
          045f186d-dfc5-49a9-861e-97e0fd22a4df
        </span>
      </p>
    ),
    children: (
      <form>
        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="Tenant Name"
            defaultValue="Swanson Transport Ltd"
            placeholder="e.g., Swanson Transport Ltd"
          />

          <BmsInput
            label="Contact Email"
            defaultValue="admin@swanson.example"
            placeholder="e.g., admin@company.co.nz"
          />
        </div>

        <BmsFormModalFooter
          submitLabel="Update Tenant"
          onCancel={() => undefined}
        />
      </form>
    ),
  },
};

export const UpdateSite: Story = {
  args: {
    eyebrow: "Update Site",
    title: "Auckland Demo Site",
    icon: <Building2 className="h-5 w-5" />,
    subtitle: (
      <p>
        Site ID:
        <span className="ml-1 break-all font-medium text-slate-200">
          27ebff4e-88e3-4fb2-8da0-6bcd9d3b25fd
        </span>
      </p>
    ),
    children: (
      <form>
        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="Site Name"
            defaultValue="Auckland Demo Site"
            placeholder="e.g., Auckland Office"
          />

          <BmsInput
            label="Address Line 1"
            defaultValue="42 Queen Street"
            placeholder="e.g., 42 Queen Street"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BmsInput
              label="City"
              defaultValue="Auckland"
              placeholder="e.g., Auckland"
            />

            <BmsInput
              label="Postcode"
              defaultValue="1010"
              placeholder="e.g., 1010"
            />
          </div>

          <BmsInput
            label="Timezone"
            defaultValue="Pacific/Auckland"
            placeholder="e.g., Pacific/Auckland"
          />
        </div>

        <BmsFormModalFooter
          submitLabel="Update Site"
          onCancel={() => undefined}
        />
      </form>
    ),
  },
};

export const UpdateHvac: Story = {
  args: {
    eyebrow: "Update HVAC",
    title: "PT100 Temperature Sensor Unit 1",
    icon: <Cpu className="h-5 w-5" />,
    subtitle: (
      <p>
        HVAC ID:
        <span className="ml-1 break-all font-medium text-slate-200">
          modbus-rtu-pt100-1
        </span>
      </p>
    ),
    children: (
      <form>
        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="HVAC Name"
            defaultValue="PT100 Temperature Sensor Unit 1"
            placeholder="e.g., AHU - Level 2"
          />

          <BmsInput
            label="Device ID"
            defaultValue="modbus-rtu-pt100-1"
            placeholder="e.g., hvac-1"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BmsSelect
              label={
                <span className="inline-flex items-center gap-2">
                  <RadioTower className="h-4 w-4 text-cyan-300" />
                  Protocol
                </span>
              }
              defaultValue="MODBUS"
            >
              <option value="BACNET">BACNET</option>
              <option value="MODBUS">MODBUS</option>
              <option value="SIMULATOR">SIMULATOR</option>
            </BmsSelect>

            <BmsSelect label="Unit Type" defaultValue="AHU">
              <option value="AHU">AHU</option>
              <option value="VRF">VRF</option>
              <option value="FCU">FCU</option>
              <option value="CHILLER">CHILLER</option>
              <option value="OTHER">OTHER</option>
            </BmsSelect>
          </div>
        </div>

        <BmsFormModalFooter
          submitLabel="Update HVAC"
          onCancel={() => undefined}
        />
      </form>
    ),
  },
};

export const WithError: Story = {
  args: {
    eyebrow: "Update HVAC",
    title: "AHU Level 2",
    icon: <Cpu className="h-5 w-5" />,
    children: (
      <form>
        <BmsModalMessage
          type="error"
          icon={<AlertCircle className="h-4 w-4" />}
        >
          Device ID is required. Please enter a valid device identifier.
        </BmsModalMessage>

        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="HVAC Name"
            defaultValue="AHU Level 2"
            placeholder="e.g., AHU - Level 2"
          />

          <BmsInput label="Device ID" placeholder="e.g., hvac-1" />
        </div>

        <BmsFormModalFooter
          submitLabel="Update HVAC"
          onCancel={() => undefined}
        />
      </form>
    ),
  },
};

export const WithSuccess: Story = {
  args: {
    eyebrow: "Update Site",
    title: "Auckland Demo Site",
    icon: <Building2 className="h-5 w-5" />,
    children: (
      <form>
        <BmsModalMessage
          type="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        >
          Site updated successfully.
        </BmsModalMessage>

        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="Site Name"
            defaultValue="Auckland Demo Site"
            placeholder="e.g., Auckland Office"
          />

          <BmsInput
            label="Timezone"
            defaultValue="Pacific/Auckland"
            placeholder="e.g., Pacific/Auckland"
          />
        </div>

        <BmsFormModalFooter
          submitLabel="Update Site"
          onCancel={() => undefined}
        />
      </form>
    ),
  },
};

export const Saving: Story = {
  args: {
    eyebrow: "Update HVAC",
    title: "Saving HVAC Details",
    icon: <Cpu className="h-5 w-5" />,
    saving: true,
    children: (
      <form>
        <div className="grid grid-cols-1 gap-4">
          <BmsInput
            label="HVAC Name"
            defaultValue="AHU Level 2"
            disabled
          />

          <BmsInput
            label="Device ID"
            defaultValue="ahu-level-2"
            disabled
          />
        </div>

        <BmsFormModalFooter
          saving
          submitLabel="Update HVAC"
          savingLabel="Saving..."
          onCancel={() => undefined}
        />
      </form>
    ),
  },
};

export const WideModal: Story = {
  args: {
    eyebrow: "Update Building Asset",
    title: "Large Form Example",
    icon: <Building2 className="h-5 w-5" />,
    maxWidthClassName: "max-w-4xl",
    children: (
      <form>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BmsInput label="Name" placeholder="Asset name" />
          <BmsInput label="Device ID" placeholder="Device ID" />
          <BmsInput label="Location" placeholder="Location" />
          <BmsInput label="Timezone" placeholder="Timezone" />
        </div>

        <BmsFormModalFooter
          submitLabel="Save Asset"
          onCancel={() => undefined}
        />
      </form>
    ),
  },
};