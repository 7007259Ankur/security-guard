"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Shield,
  KeyRound,
  FolderLock,
  CalendarDays,
  LogOut,
  User,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { User as UserType } from "@/lib/types";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    const u = api.getUser();
    if (u) {
      setCurrentUser(u);
    } else {
      api.getMe().then(setCurrentUser).catch(() => {});
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      router.push("/login");
    }
  };

  const navItems = [
    {
      name: "Security Dashboard",
      href: "/data_security_dashboard",
      icon: Shield,
    },
    {
      name: "File Manager",
      href: "/file_manager",
      icon: FolderLock,
    },
    {
      name: "Calendar & Audits",
      href: "/calendar_setter",
      icon: CalendarDays,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-lg flex items-center gap-1.5">
              SECURITY<span className="text-emerald-400">GUARD</span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              256-bit AES Zero-Knowledge
            </p>
          </div>
        </div>

        {/* Security Health status pill */}
        <div className="mx-4 mt-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Vault Encryption</span>
          </div>
          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
            ACTIVE
          </span>
        </div>

        {/* Nav list */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {currentUser?.full_name || currentUser?.email?.split("@")[0] || "SecOps User"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || "user@example.com"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
