import type { LucideIcon } from "lucide-react";
import {
  //Bell,
  Building2,
  Building2Icon,
  BuildingIcon,
  //FileImage,
  //LayoutDashboard,
  Shield,
  //Upload,
  User,
  UserPlus,
  //Wind,
  Zap,
} from "lucide-react";

export type NavItem = {
  label: string;
  path?: string;
  children?: NavItem[];
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  // { label: "Dashboard", path: "/buildings/user/tenants", icon: LayoutDashboard },
  // { label: "HVAC", path: "/buildings/user/tenants", icon: Wind },

  {
    label: "Admin",
    icon: Shield,
    children: [
      { label: "Onboarding Tenants", path: "/onboarding", icon: Building2 },
      { label: "Update Tenant Info", path: "/admin/update-tenant", icon: Building2Icon },
      // {
      //   label: "Floor Plans",
      //   icon: FileImage,
      //   children: [
      //     { label: "Upload Floor Plan", path: "/buildings/user/tenants", icon: Upload },
      //     { label: "View Floor Plan", path: "/buildings/user/tenants", icon: FileImage },
      //   ],
      // },
      {
        label: "User Management",
        icon: UserPlus,
        children: [
          { label: "Add User", path: "/admin/users", icon: UserPlus },
          { label: "View Users", path: "/admin/user-management/view-users", icon: User },
          { label: "Edit User", path: "/admin/user-management/edit-user", icon: User },
          { label: "Delete User", path: "/admin/user-management/delete-user", icon: User },
        ],
      },
    ],
  },

  {
    label: "Buildings",
    icon: Building2,
    children: [
      { label: "Tenants", path: "/buildings/user/tenants", icon: BuildingIcon },
    ],
  },

  { label: "Dashboard", path: "/dashboard", icon: Zap },
  // { label: "Alarms", path: "/buildings/user/tenants", icon: Bell },
  // { label: "Users", path: "/admin/users", icon: User },
];