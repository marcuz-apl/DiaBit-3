'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { Settings, Save, AlertCircle, Sparkles, MoveRight, MoveLeft } from 'lucide-react';

export default function CalculationSettings() {
  const {
    user,
    selectedSlotId,
    wellSettings,
    setWellSettings,
    triggerRefreshTree,
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [idleTime, setIdleTime] = useState(0);

  // Form states
  const [easting, setEasting] = useState(0);
  const [northing, setNorthing] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [gridConvergence, setGridConvergence] = useState(0.0);
  const [magneticDeclination, setMagneticDeclination] = useState(0.0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sync form states with wellSettings loaded from context
  useEffect(() => {
    if (wellSettings) {
      setEasting(wellSettings.easting);
      setNorthing(wellSettings.northing);
      setElevation(wellSettings.elevation);
      setUnit(wellSettings.unit);
    }
  }, [wellSettings]);

  // Idle Timer for Auto-Hide (30 Seconds)
  useEffect(() => {
    const handleActivity = () => {
      setIdleTime(0);
      setIsCollapsed(false); // bring back on activity
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('pointerdown', handleActivity);

    const interval = setInterval(() => {
      setIdleTime((prev) => {
        const nextTime = prev + 1;
        if (nextTime >= 30) {
          setIsCollapsed(true);
        }
        return nextTime;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('pointerdown', handleActivity);
      clearInterval(interval);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlotId,
          easting,
          northing,
          elevation,
          unit,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setWellSettings({ easting, northing, elevation, unit });
        setSuccess(true);
        triggerRefreshTree(); // triggers reload of Loaded Data Grids and Charts!
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        style={{ width: isCollapsed ? '0px' : '280px' }}
        className={`relative flex h-full flex-col border-l border-slate-200 bg-white/70 backdrop-blur-xs transition-all duration-300 dark:border-slate-800 dark:bg-[#0b0f19]/60 shrink-0 ${
          isCollapsed ? 'overflow-hidden border-l-0' : ''
        }`}
      >
        {/* Header Ribbon */}
        <div className="flex h-10 items-center justify-between border-b border-slate-200/60 px-4 dark:border-slate-800/60 shrink-0">
          <button
            onClick={() => setIsCollapsed(true)}
            className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Auto-collapse Settings"
          >
            <MoveRight className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Calculation Settings
          </span>
          <Settings className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Form Container */}
        {selectedSlotId ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Unit Settings */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Unit Profile
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setUnit('metric')}
                  className={`rounded-md py-1.5 text-center font-semibold transition-all ${
                    unit === 'metric'
                      ? 'bg-white shadow-sm text-sky-600 dark:bg-slate-800 dark:text-sky-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Metric (m)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('imperial')}
                  className={`rounded-md py-1.5 text-center font-semibold transition-all ${
                    unit === 'imperial'
                      ? 'bg-white shadow-sm text-sky-600 dark:bg-slate-800 dark:text-sky-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Imperial (ft)
                </button>
              </div>
            </div>

            {/* Wellhead Reference Coordinates */}
            <div className="space-y-3.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
              <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Reference Coordinates
              </label>

              <div>
                <label className="block text-slate-500 mb-1">
                  Reference Easting ({unit === 'metric' ? 'm' : 'ft'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={easting}
                  onChange={(e) => setEasting(parseFloat(e.target.value) || 0)}
                  disabled={!user}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">
                  Reference Northing ({unit === 'metric' ? 'm' : 'ft'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={northing}
                  onChange={(e) => setNorthing(parseFloat(e.target.value) || 0)}
                  disabled={!user}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">
                  KB Elevation / Elevation ({unit === 'metric' ? 'm' : 'ft'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={elevation}
                  onChange={(e) => setElevation(parseFloat(e.target.value) || 0)}
                  disabled={!user}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Grid Corrections */}
            <div className="space-y-3.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
              <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Corrections & Grid Convergence
              </label>

              <div>
                <label className="block text-slate-500 mb-1">
                  Grid Convergence (°)
                </label>
                <input
                  type="number"
                  step="any"
                  value={gridConvergence}
                  onChange={(e) => setGridConvergence(parseFloat(e.target.value) || 0)}
                  disabled={!user}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">
                  Magnetic Declination (°)
                </label>
                <input
                  type="number"
                  step="any"
                  value={magneticDeclination}
                  onChange={(e) => setMagneticDeclination(parseFloat(e.target.value) || 0)}
                  disabled={!user}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
                />
              </div>

              <div className="rounded-lg bg-sky-50/50 p-2.5 dark:bg-sky-950/15 border border-sky-100 dark:border-sky-900/50 text-[11px] leading-relaxed text-sky-700 dark:text-sky-300">
                <span className="font-bold">Total Correction: </span>
                {(gridConvergence + magneticDeclination).toFixed(4)}°
              </div>
            </div>

            {/* Error and Success Indicators */}
            {error && (
              <div className="flex items-center space-x-1.5 text-rose-500 bg-rose-50/50 p-2 rounded-lg dark:bg-rose-950/10">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-1.5 text-emerald-500 bg-emerald-50/50 p-2 rounded-lg dark:bg-emerald-950/10">
                <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
                <span>Recalculations complete!</span>
              </div>
            )}

            {/* Save Button */}
            {user ? (
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-400 text-white font-bold px-4 py-2 text-sm transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Recalculating...' : 'Apply & Recalculate'}</span>
              </button>
            ) : (
              <div className="text-[10px] text-slate-400 text-center font-medium">
                Log in to edit calculation parameters.
              </div>
            )}
          </form>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-600">
            <Settings className="h-7 w-7 mb-2.5" />
            <span className="text-xs font-semibold">Select a Slot in the tree hierarchy to modify calculations.</span>
          </div>
        )}
      </div>

      {/* Manual Collapse Tab Trigger */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-14 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 text-sky-600 dark:text-sky-400 hover:scale-105 active:scale-95 transition-all"
          title="Open Settings Sidebar"
        >
          <MoveLeft className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
