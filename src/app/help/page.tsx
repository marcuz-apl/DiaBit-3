'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Calculator, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';

export default function HelpPage() {
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
            <HelpCircle className="h-5 w-5 text-sky-500" />
            <span className="text-sm font-black tracking-tight text-slate-800 dark:text-white uppercase">
              DiaBit Support Documentation
            </span>
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Help Center & Manual</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome to the DiaBit technical guides. Learn about the workspace operations, data editing, and underlying trajectory mechanics.
          </p>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Guide 1: Sidebar & Hierarchy */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#111827] space-y-3">
            <div className="flex items-center space-x-2 text-sky-500">
              <Layers className="h-5 w-5" />
              <h3 className="text-sm font-bold">Workspace Asset Hierarchy</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              DiaBit organizes geological drilling locations in a strict physical parent-child tree structure:
              <br />
              <code className="block mt-2 rounded-lg bg-slate-50 p-2 text-[10px] dark:bg-slate-900 font-bold border border-slate-100 dark:border-slate-800">
                Country → State/Province → GeoBasin → Field → Well → Slot → Plans / Surveys
              </code>
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Clicking any Plan or Survey loads the respective dataset into the data grids and canvas charts.</li>
              <li>Right-click any trajectory file in the tree to select <strong>"Mark as Definite"</strong>, which sets it as the default tracking baseline for the workspace.</li>
              <li>The sidebar is draggable. Place your mouse over the right border and drag to expand it.</li>
            </ul>
          </div>

          {/* Guide 2: Calculation Settings */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#111827] space-y-3">
            <div className="flex items-center space-x-2 text-emerald-500">
              <Calculator className="h-5 w-5" />
              <h3 className="text-sm font-bold">Excel spreadsheet Grids</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Live calculation grids are divided into stacked Upper (Plans) and Lower (Actual Surveys) panels:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Input columns are: <strong>Measured Depth (MD)</strong>, <strong>Inclination (Inc)</strong>, and <strong>Azimuth (Az)</strong>.</li>
              <li>Type directly in the cells. The app recalculates coordinates in real-time on the client side using the Minimum Curvature Method (MCM).</li>
              <li>Click <strong>"Save Matrix"</strong> (when authenticated) to sync changes to the SQLite database.</li>
              <li>Calculated read-only fields include TVD, Easting, Northing, SSTVD, and Dogleg Severity.</li>
            </ul>
          </div>

          {/* Guide 3: Charts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#111827] space-y-3">
            <div className="flex items-center space-x-2 text-amber-500">
              <BookOpen className="h-5 w-5" />
              <h3 className="text-sm font-bold">Chart Suite Interaction</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The graphics canvas holds three interactive plots linked in real-time to the active data tables:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>3D Spatial Curve</strong>: Move your mouse inside the plot to rotate, scroll to zoom, and double-click to reset camera perspective.</li>
              <li><strong>2D Plan View</strong>: Shows the plan view footprint (Easting vs. Northing footprint).</li>
              <li><strong>2D Vertical Section</strong>: Plots the vertical displacement profile (TVD vs. Horizontal Displacement), showing vertical deflection with the TVD axis inverted to point downward.</li>
            </ul>
          </div>

          {/* Guide 4: Mathematical MCM Engine */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#111827] space-y-3">
            <div className="flex items-center space-x-2 text-indigo-500">
              <Calculator className="h-5 w-5" />
              <h3 className="text-sm font-bold">MCM Mathematics</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Calculations are performed sequentially between survey logs:
              <br />
              <code className="block mt-2 rounded-lg bg-slate-50 p-2 text-[10px] dark:bg-slate-900 font-mono leading-relaxed border border-slate-100 dark:border-slate-800">
                cos(α) = cos(θ₂ - θ₁) - sin(θ₁)sin(θ₂)[1 - cos(ϕ₂ - ϕ₁)]
                <br />
                F = (2/α) * tan(α/2) (where α → 0, F = 1)
                <br />
                ΔTVD = (ΔMD/2) * [cos(θ₁) + cos(θ₂)] * F
                <br />
                ΔNorthing = (ΔMD/2) * [sin(θ₁)cos(ϕ₁) + sin(θ₂)cos(ϕ₂)] * F
                <br />
                ΔEasting = (ΔMD/2) * [sin(θ₁)sin(ϕ₁) + sin(θ₂)sin(ϕ₂)] * F
              </code>
            </p>
            <p className="text-[10px] text-slate-400">
              Dogleg Severity is calculated as: DLS = (α / ΔMD) * ref. Where ref = 30m for Metric, or 100ft for Imperial.
            </p>
          </div>

        </div>

        {/* Support Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Still need help?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click the "Contact Us" link in the footer bar to transmit a technical support ticket directly to our engineers.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-4 py-2 transition-colors cursor-pointer"
          >
            Launch central workspace
          </Link>
        </div>
      </main>
    </div>
  );
}
