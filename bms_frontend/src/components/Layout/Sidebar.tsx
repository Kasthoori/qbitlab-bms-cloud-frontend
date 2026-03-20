/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { navItems, type NavItem } from "./nav.config";
import { useLocation, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join("");
}

function isGroup(item: NavItem): item is NavItem & { children: NavItem[] } {
  return Array.isArray(item.children) && item.children.length > 0;
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.path) {
    return pathname === item.path || pathname.startsWith(item.path + "/");
  }

  if (item.children) {
    return item.children.some((child) => isItemActive(pathname, child));
  }

  return false;
}

type SidebarNodeProps = {
  item: NavItem;
  pathname: string;
  level?: number;
  openGroups: Record<string, boolean>;
  toggleGroup: (key: string) => void;
  parentKey?: string;
};

function SidebarNode({
  item,
  pathname,
  level = 0,
  openGroups,
  toggleGroup,
  parentKey = "",
}: SidebarNodeProps) {
  const key = parentKey ? `${parentKey}-${item.label}` : item.label;
  const active = isItemActive(pathname, item);

  if (!isGroup(item) && item.path) {
    const Icon = item.icon;

    return (
      <NavLink
        to={item.path}
        className={({ isActive }: any) =>
            cn(
            "flex items-center gap-3 rounded-md py-2 text-sm transition-colors",
            "hover:bg-slate-900",

            level === 0 && "px-3",
            level === 1 && "pl-6 pr-3",
            level >= 2 && "pl-10 pr-3",

            isActive ? "bg-slate-900 text-yellow-500" : "text-slate-200"
            )
        }
     >
        <Icon className={cn(
            level === 0 ? "h-5 w-5" :
            level === 1 ? "h-4 w-4" :
            "h-3.5 w-3.5",
            "text-slate-300"
            )} />
        <span>{item.label}</span>
      </NavLink>
    );
  }

  if (isGroup(item)) {
    const GroupIcon = item.icon;
    const open = openGroups[key];

    return (
      <div className="select-none">
        <button
          type="button"
          onClick={() => toggleGroup(key)}
          className={cn(
                "w-full flex items-center justify-between rounded-md py-2 text-sm transition-colors",
                "hover:bg-slate-900",
                level === 0 && "px-3",
                level >= 1 && "pl-3 pr-3",
                active ? "bg-slate-900 text-white" : "text-slate-200"
            )}
          aria-expanded={open}
          aria-controls={`group-${key}`}
        >
          <span className="flex items-center gap-3">
            <GroupIcon className={cn(
              level === 0 ? "h-5 w-5" :
              level === 1 ? "h-4 w-4" :
              "h-3.5 w-3.5",
              "text-slate-300"
            )} />
            <span>{item.label}</span>
          </span>

          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            className="text-slate-300"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={`group-${key}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                    "mt-1 space-y-1",
                    level === 0 && "ml-2 pl-2",
                    level >= 1 && "ml-6 pl-3"
                )}
                style={{ borderLeft: "1px solid gray" }}
                >
                {item.children.map((child) => (
                  <SidebarNode
                    key={`${key}-${child.label}`}
                    item={child}
                    pathname={pathname}
                    level={level + 1}
                    openGroups={openGroups}
                    toggleGroup={toggleGroup}
                    parentKey={key}
                    
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

export default function Sidebar() {
  const { pathname } = useLocation();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const nextState: Record<string, boolean> = {};

    const walk = (items: NavItem[], parentKey = "") => {
      for (const item of items) {
        const key = parentKey ? `${parentKey}-${item.label}` : item.label;

        if (isGroup(item)) {
          if (isItemActive(pathname, item)) {
            nextState[key] = true;
          }

          walk(item.children, key);
        }
      }
    };

    walk(navItems);

    setOpenGroups((prev) => ({ ...prev, ...nextState }));
  }, [pathname]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <aside className="relative h-screen w-64 bg-slate-950 text-slate-100 border-r border-slate-800">
      <div className="px-5 py-4 text-xl font-semibold">QbitLab BMS</div>

      <nav className="px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <SidebarNode
            key={item.label}
            item={item}
            pathname={pathname}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
          />
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 px-5 py-3 text-xs text-slate-500">
        @ 2026 QbitLab. All rights reserved.
      </div>
    </aside>
  );
}