import type { LucideIcon } from "lucide-react";
import { Bell, Building2, LayoutDashboard, Shield, User, UserPlus, Wind, Zap } from "lucide-react";


export type NavItem = 

| {
    label: string;
    path: string;
    icon: LucideIcon
  }

| {
    label: string;
    icon: LucideIcon;
    children: Array<{
        label: string;
        path: string;
        icon?: LucideIcon;
    }>;
  };

  export const navItems: NavItem[] = [
      { label: "Dashboard", path: "/", icon: LayoutDashboard},
      { label: "HVAC", path: "/hvac", icon: Wind},

      {
        label: "Admin",
        icon: Shield,
        children: [
            { label: "Onboarding Tenants", path:"/onboarding", icon: Building2},
            { label: "Create User", path: "/admin/create-user", icon: UserPlus}
        ],
      },

      { label: "Energy", path: "/energy", icon: Zap},
      { label: "Alarms", path: "/alarms", icon: Bell},
      { label: "Users", path: "/users", icon: User},
  ]