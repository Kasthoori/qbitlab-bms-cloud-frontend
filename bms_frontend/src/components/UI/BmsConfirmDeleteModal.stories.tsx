import type { Meta, StoryObj } from "@storybook/react-vite";
import { Building2, Cpu, MapPin, Trash2 } from "lucide-react";
import { BmsConfirmDeleteModal } from "./BmsConfirmDeleteModal";

const meta = {
  title: "BMS/UI/BmsConfirmDeleteModal",
  component: BmsConfirmDeleteModal,
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
    entityLabel: {
      control: "text",
    },
    entityName: {
      control: "text",
    },
    entityIdLabel: {
      control: "text",
    },
    entityId: {
      control: "text",
    },
    description: {
      control: "text",
    },
    deleting: {
      control: "boolean",
    },
    error: {
      control: "text",
    },
    success: {
      control: "boolean",
    },
    successMessage: {
      control: "text",
    },
    cancelLabel: {
      control: "text",
    },
    confirmLabel: {
      control: "text",
    },
    deletingLabel: {
      control: "text",
    },
  },
  args: {
    open: true,
    eyebrow: "Delete Record",
    title: "Confirm Deletion",
    entityLabel: "Record",
    entityName: "Demo Record",
    entityIdLabel: "ID",
    entityId: "demo-record-001",
    icon: <Trash2 className="h-5 w-5" />,
    description:
      "This will permanently delete this record. This action cannot be undone.",
    deleting: false,
    error: null,
    success: false,
    successMessage: "Deleted successfully.",
    cancelLabel: "Cancel",
    confirmLabel: "Delete",
    deletingLabel: "Deleting...",
    onClose: () => undefined,
    onConfirmDelete: () => undefined,
  },
} satisfies Meta<typeof BmsConfirmDeleteModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DeleteTenant: Story = {
  args: {
    eyebrow: "Delete Tenant",
    title: "Confirm Tenant Deletion",
    entityLabel: "Tenant",
    entityName: "Swanson Transport Ltd",
    entityIdLabel: "Tenant ID",
    entityId: "045f186d-dfc5-49a9-861e-97e0fd22a4df",
    icon: <Building2 className="h-5 w-5" />,
    description:
      "This will permanently delete this tenant and may affect sites, HVACs, mappings, floor plans, telemetry views, and maintenance workflows under it.",
    confirmLabel: "Delete Tenant",
    successMessage: "Tenant deleted successfully.",
  },
};

export const DeleteSite: Story = {
  args: {
    eyebrow: "Delete Site",
    title: "Confirm Site Deletion",
    entityLabel: "Site",
    entityName: "Auckland Demo Site",
    entityIdLabel: "Site ID",
    entityId: "27ebff4e-88e3-4fb2-8da0-6bcd9d3b25fd",
    icon: <MapPin className="h-5 w-5" />,
    description:
      "This will permanently delete this site and may affect HVACs, mappings, floor plans, telemetry views, and maintenance records under it.",
    confirmLabel: "Delete Site",
    successMessage: "Site deleted successfully.",
  },
};

export const DeleteHvac: Story = {
  args: {
    eyebrow: "Delete HVAC",
    title: "Confirm HVAC Deletion",
    entityLabel: "HVAC",
    entityName: "PT100 Temperature Sensor Unit 1",
    entityIdLabel: "HVAC ID",
    entityId: "modbus-rtu-pt100-1",
    icon: <Cpu className="h-5 w-5" />,
    description:
      "This will permanently delete this HVAC from the site. This action cannot be undone.",
    confirmLabel: "Delete HVAC",
    successMessage: "HVAC deleted successfully.",
  },
};

export const Deleting: Story = {
  args: {
    eyebrow: "Delete HVAC",
    title: "Confirm HVAC Deletion",
    entityLabel: "HVAC",
    entityName: "AHU Level 2",
    entityIdLabel: "HVAC ID",
    entityId: "ahu-level-2",
    icon: <Cpu className="h-5 w-5" />,
    description:
      "This will permanently delete this HVAC from the site. This action cannot be undone.",
    deleting: true,
    confirmLabel: "Delete HVAC",
    deletingLabel: "Deleting...",
  },
};

export const WithError: Story = {
  args: {
    eyebrow: "Delete Tenant",
    title: "Confirm Tenant Deletion",
    entityLabel: "Tenant",
    entityName: "Swanson Transport Ltd",
    entityIdLabel: "Tenant ID",
    entityId: "045f186d-dfc5-49a9-861e-97e0fd22a4df",
    icon: <Building2 className="h-5 w-5" />,
    description:
      "Cannot delete tenant because dependent records may still exist.",
    error:
      "Cannot delete tenant because active sites or HVAC records still exist. Please remove dependent records first.",
    confirmLabel: "Delete Tenant",
  },
};

export const Success: Story = {
  args: {
    eyebrow: "Delete Site",
    title: "Confirm Site Deletion",
    entityLabel: "Site",
    entityName: "Auckland Demo Site",
    entityIdLabel: "Site ID",
    entityId: "27ebff4e-88e3-4fb2-8da0-6bcd9d3b25fd",
    icon: <MapPin className="h-5 w-5" />,
    description:
      "This will permanently delete this site and may affect HVACs, mappings, floor plans, telemetry views, and maintenance records under it.",
    success: true,
    successMessage: "Site deleted successfully.",
    confirmLabel: "Delete Site",
  },
};

export const WithoutEntityId: Story = {
  args: {
    eyebrow: "Delete Record",
    title: "Confirm Deletion",
    entityLabel: "Record",
    entityName: "Temporary Draft",
    entityId: undefined,
    description:
      "This will permanently delete this temporary draft. This action cannot be undone.",
    confirmLabel: "Delete Draft",
  },
};