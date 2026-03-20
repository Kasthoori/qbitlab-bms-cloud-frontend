import type { LucideIcon } from "lucide-react";
import { Bell, Building2, Building2Icon, BuildingIcon, FileImage, LayoutDashboard, Shield, Upload, User, UserPlus, Wind, Zap } from "lucide-react";


export type NavItem = 

| {
    label: string;
    path?: string;
    children?: NavItem[];
    icon: LucideIcon
  }

  export const navItems: NavItem[] = [
      { label: "Dashboard", path: "/", icon: LayoutDashboard},
      { label: "HVAC", path: "/hvac", icon: Wind},

      {
        label: "Admin",
        icon: Shield,
        children: [
            { label: "Onboarding Tenants", path:"/onboarding", icon: Building2},
            {label: "Update Tenant Info", path: "admin/update-tenant", icon: Building2Icon},
            { label: "Floor Plans",
              icon: FileImage,
              children: [
                { label: "Upload Floor Plan", path: "/admin/floor-plans/floor-1", icon: Upload},
                { label: "View Floor Plan", path: "/admin/floor-plans/floor-2", icon: FileImage},
              ],
            },
            { label: "Create User", path: "/admin/create-user", icon: UserPlus}
        ],
      },
      {
        label: "Buildings",
        icon: Building2,
        children: [
          { label: "Tenants", path: "/buildings/user/tenants", icon: BuildingIcon},
          { label: "Building 2", path: "/buildings/building-2", icon: Building2},
        ],
      },

      { label: "Energy", path: "/energy", icon: Zap},
      { label: "Alarms", path: "/alarms", icon: Bell},
      { label: "Users", path: "/users", icon: User},
  ]