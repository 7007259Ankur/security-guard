"use client";

import { ShieldCheck, Server, Lock } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/70 backdrop-blur px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-white tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>PostgreSQL :5435</span>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Client AES-GCM</span>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Contract v1.0</span>
        </div>
      </div>
    </header>
  );
}
