import type { Meta, StoryObj } from "@storybook/react-vite";
import { BmsTextarea } from "./BmsTextarea";

const meta = {
  title: "BMS/UI/BmsTextarea",
  component: BmsTextarea,
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
    rows: {
      control: "number",
    },
    className: {
      control: "text",
    },
    wrapperClassName: {
      control: "text",
    },
  },
  args: {
    label: "Maintenance note",
    placeholder: "Write technician note...",
    helperText: "Add clear details about the HVAC issue or inspection result.",
    disabled: false,
    rows: 5,
    wrapperClassName: "w-[520px]",
  },
} satisfies Meta<typeof BmsTextarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Maintenance note",
    placeholder: "Write technician note...",
    helperText: "Add clear details about the HVAC issue or inspection result.",
  },
};

export const WithValue: Story = {
  args: {
    label: "Technician update",
    defaultValue:
      "Checked AHU-01. Filter looks dirty and airflow is lower than expected. Recommend replacing filter during next service window.",
    helperText: "This note can be reviewed by the site manager.",
  },
};

export const Error: Story = {
  args: {
    label: "Manager review comment",
    placeholder: "Write review comment...",
    error: "Review comment is required before rejecting this maintenance note.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Resolved note",
    defaultValue:
      "Issue resolved. Setpoint was corrected and system returned to normal operation.",
    disabled: true,
    helperText: "This note is read-only because the workflow is already closed.",
  },
};

export const ShortTextarea: Story = {
  args: {
    label: "Quick comment",
    placeholder: "Write a short comment...",
    rows: 3,
    helperText: "Use this for small updates or quick technician messages.",
  },
};

export const LargeTextarea: Story = {
  args: {
    label: "Detailed fault description",
    placeholder: "Describe the issue, observation, action taken, and recommendation...",
    rows: 8,
    helperText: "Use detailed notes for fault diagnosis and audit history.",
  },
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    placeholder: "Search or write note...",
    helperText: "Textarea without visible label.",
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="grid w-140 gap-5">
      <BmsTextarea
        label="Normal textarea"
        placeholder="Write note..."
        helperText="This is a normal textarea field."
        rows={4}
      />

      <BmsTextarea
        label="Textarea with value"
        defaultValue="AHU-02 temperature is not reaching setpoint during afternoon peak load."
        helperText="This field already has a value."
        rows={4}
      />

      <BmsTextarea
        label="Error textarea"
        placeholder="Write rejection reason..."
        error="Reason is required."
        rows={4}
      />

      <BmsTextarea
        label="Disabled textarea"
        defaultValue="This maintenance note has already been approved."
        disabled
        helperText="This field cannot be edited."
        rows={4}
      />
    </div>
  ),
};