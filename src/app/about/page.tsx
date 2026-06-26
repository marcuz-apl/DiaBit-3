'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Info, Cpu, Database, Compass, Award } from 'lucide-react';
import { VERSION } from '@/lib/version';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-slate-100 grid-lines">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-[#0b0f19]/85">
        <div className="flex h-14 items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Workspace</span>
          </Link>
          
          <div className="flex items-center space-x-1.5">
            <Info className="h-5 w-5 text-sky-500" />
            <span className="text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase">
              About DiaBit Trajectory Suite
            </span>
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-8">
        
        {/* Main Branding Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-[#111827] text-center space-y-4">
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-8 w-8"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight">DiaBit Drilling Trajectory Suite</h1>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
              Version {VERSION} (Next.js Engineering Build)
            </p>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            DiaBit is an ultra-performant, premium web-native suite designed for well planners and directional drilling engineers. It serves as a modern, lightweight, and collaborative alternative to heavy legacy desktop software packages like COMPASS or EDT.
          </p>
        </div>

        {/* Tech Stack Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Architecture Stack</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Next.js */}
            <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-[#111827] space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">Next.js App Router</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Next.js with React 19 and TypeScript, optimizing client-side calculations and rendering pipelines.
              </p>
            </div>

            {/* SQLite */}
            <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-[#111827] space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Database className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">SQLite3 & better-sqlite3</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Low-overhead, zero-network-latency structured storage of well logs, slots, reference settings, and user preferences.
              </p>
            </div>

            {/* Plotly */}
            <div className="rounded-xl border border-slate-200 bg-white p-4.5 dark:border-slate-800 dark:bg-[#111827] space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Compass className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">3D Plotly WebGL</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Hardware-accelerated dynamic canvas rendering 3D spatial trajectories and dual 2D projection planes.
              </p>
            </div>

          </div>
        </div>

        {/* Corporate / Engineering block */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827] flex items-start space-x-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Award className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 text-xs leading-relaxed">
            <h4 className="font-bold text-slate-700 dark:text-slate-200">Alfazen Engineering Division</h4>
            <p className="text-slate-500 dark:text-slate-400">
              Alfazen Inc. focuses on building high-fidelity directional drilling solvers, casing design packages, and downhole mechanics tracking software. DiaBit represents our next-generation web-based operational planning module.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
