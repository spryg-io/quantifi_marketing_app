"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Daily", href: "/daily", icon: Calendar },
  { name: "Monthly", href: "/monthly", icon: BarChart3 },
  { name: "Brand", href: "/brand/herbivore", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-56 bg-slate-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-slate-700">
        <h1 className="text-lg font-bold tracking-tight">Quantifi</h1>
        <p className="text-xs text-slate-400 mt-0.5">Marketing Dashboard</p>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/brand/herbivore" && pathname.startsWith("/brand"));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
