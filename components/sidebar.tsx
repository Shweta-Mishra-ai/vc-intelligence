"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  List, 
  Search, 
  Home, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Settings, 
  UserCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", exact: true, icon: Home },
  { name: "Discover", href: "/companies", exact: false, icon: Search },
  { name: "Pipeline", href: "/pipeline", exact: false, icon: Activity },
  { name: "Lists", href: "/lists", exact: false, icon: List },
  { name: "Saved", href: "/saved", exact: false, icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={cn(
        "flex h-full flex-col glass-sidebar transition-all duration-300 relative z-30",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              VC Intelligence
            </span>
          </Link>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <Building2 className="h-6 w-6 text-primary animate-pulse" />
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5 p-3">
        {navigation.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary glow-violet"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -right-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-slate-400 hover:text-slate-200 shadow-md"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* User Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-6 w-6 text-slate-400" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-200 truncate">Shweta Mishra</span>
              <span className="text-[10px] text-slate-400 truncate">shweta@vc.dev</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
