import React, { useEffect, useState } from "react";
import { navItems, type NavItem } from "./nav.config";
import { useLocation, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";




function cn(...classes: Array<string | false | undefined | null>){
    return classes.filter(Boolean).join("");
}

function isGroup(item: NavItem): item is Extract<NavItem, {children: any[]}> {
    return "children" in item;
}

function isChildActive(pathname: string, children: {path: string}[]) {
    // active if current route starts with a child path
    return children.some((c) => pathname === c.path || pathname.startsWith(c.path + "/"));
}

export default function Sidebar () {

    const { pathname } = useLocation();

    // can allow multiple groups later by using a map keyed by group label

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        // auto open Admin if user is on / admin/*
        const initial: Record<string, boolean> = {};
        navItems.forEach((item) => {
            if(isGroup(item)) initial[item.label] = isChildActive(pathname, item.children);
        });

        return initial;
    });

    useEffect(() => {
        navItems.forEach((item) => {
            if (!isGroup(item)) return;
            const shouldOpen = isChildActive(pathname, item.children);
            if (shouldOpen){
                setOpenGroups((prev) => ({...prev, [item.label]: true}));
            }
        });
    }, [pathname]);

    const toggleGroup = (label: string) => {
        setOpenGroups((prev) => ({...prev, [label]: !prev[label]}));
    }

    return (
        <aside className="h-screen w-64 bg-slate-950 text-slate-100 border-r border-slate-800">
            <div className="px-5 py-4 text-xl font-semibold">QbitLab BMS</div>

            <nav className="px-3 py-2 space-y-1">
               {navItems.map((item) => {
                    if (!isGroup(item)){
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.label}
                                to={item.path}
                                className={({ isActive }: any) => 
                                    cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                        "hover:bg-slate-900",
                                        isActive ? "bg-slate-900 text-white" : "text-slate-200"
                                    )
                                }
                            >
                                <Icon className="h-5 w-5 text-slate-300" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    }

                    // Group item (Admin)
                    const GroupIcon = item.icon;
                    const open = !!openGroups[item.label]
                    const active = isChildActive(pathname, item.children)

                    return (
                        <div key={item.label} className="select-none">
                            <button
                                type="button"
                                onClick={() => toggleGroup(item.label)}
                                className={cn(
                                    "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                                    "hover:bg-slate-900",
                                    active ? "bg-slate-900 text-white" : "text-slate-200"
                                )}
                                aria-expanded={open}
                                aria-controls={`group-${item.label}`}
                            >
                                <span className="flex items-center gap-3">
                                    <GroupIcon className="h-5 w-5 text-slate-300" />
                                    <span>{item.label}</span>
                                </span>

                                <motion.span
                                    animate={{ rotate: open ? 180 : 0}}
                                    transition={{duration: 0.18}}
                                    className="text-slate-300"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </motion.span>
                            </button>

                            <AnimatePresence initial={false}>
                                {open && (
                                    <motion.div
                                        id={`group-${item.label}`}
                                        initial={{height: 0, opacity: 0}}
                                        animate={{height: "auto", opacity: 1}}
                                        exit={{height: 0, opacity: 0}}
                                        transition={{duration: 0.22, ease: "easeOut"}}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-1 ml-2 border-l border-slate-800 pl-2 space-y-1">
                                            {item.children.map((child) => {
                                                const ChildIcon = child.icon;

                                                return (
                                                    <NavLink
                                                        key={child.path}
                                                        to={child.path}
                                                        className={({isActive}: any) => 
                                                            cn(
                                                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                                                "hover:bg-slate-900",
                                                                isActive ? "bg-slate-900 text-white" :  "text-slate-300"
                                                            )
                                                        }
                                                    >
                                                        {ChildIcon ? <ChildIcon className="h-4 w-4 text-slate-400" /> : <span className="w-4" />}
                                                        <span>{child.label}</span>
                                                    </NavLink>
                                                );
                                            })

                                            }
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
               })

            }

            </nav>

            <div className="absolute bottom-0 w-64 px-5 py-3 text-xs text-slate-500">
                @ 2026 QbitLab. All rights reserved.
            </div>
        </aside>
    );


}