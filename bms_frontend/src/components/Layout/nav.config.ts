import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Building2Icon,
  BuildingIcon,
  ClipboardList,
  FileCheck2,
  FileImage,
  Shield,
  User,
  UserPlus,
  Zap,
} from "lucide-react";

export type NavItem = {
  label: string;
  path?: string;
  children?: NavItem[];
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  {
    label: "Admin",
    icon: Shield,
    children: [
      { label: "Onboarding Tenants", path: "/onboarding", icon: Building2 },
      {
        label: "Update Tenant Info",
        path: "/admin/update-tenant",
        icon: Building2Icon,
      },
      {
        label: "User Management",
        icon: UserPlus,
        children: [
          { label: "Add User", path: "/admin/users", icon: UserPlus },
          {
            label: "View Users",
            path: "/admin/user-management/view-users",
            icon: User,
          },
          {
            label: "Edit User",
            path: "/admin/user-management/edit-user",
            icon: User,
          },
          {
            label: "Delete User",
            path: "/admin/user-management/delete-user",
            icon: User,
          },
        ],
      },
    ],
  },

  {
    label: "Buildings",
    icon: Building2,
    children: [
      {
        label: "Tenants",
        path: "/buildings/user/tenants",
        icon: BuildingIcon,
      },
    ],
  },

  {
    label: "Reports",
    icon: FileImage,
    children: [
      {
        label: "Command Audit",
        path: "/reports/command-audit",
        icon: ClipboardList,
      },
      {
        label: "IQP Compliance Evidence",
        path: "/reports/compliance-evidence",
        icon: FileCheck2,
      },
    ],
  },

  { label: "Dashboard", path: "/dashboard", icon: Zap },
];