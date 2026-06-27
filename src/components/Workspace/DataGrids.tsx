'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/Providers';
import { calculateMCM, RawStation } from '@/lib/mcm';
import { Plus, Trash2, Save, Undo2, ArrowUpRight, Grid, Edit } from 'lucide-react';

interface Station {
  id?: number;
  measuredDepth: number;
  inclination: number;
  azimuth: number;
  tvd: number;
  easting: number;
  northing: number;
  subseaTvd: number;
  dls: number;
  xOffset: number;
  yOffset: number;
  zOffset: number;
}

interface TrajectoryData {
  id: number;
  name: string;
  type: 'Plan' | 'Survey';
  points: Station[];
}

interface DataGridsProps {
  planData: TrajectoryData | null;
  surveyData: TrajectoryData | null;
  onRefresh: () => void;
}

export default function DataGrids({ planData, surveyData, onRefresh }: DataGridsProps) {
  const { user, selectedSlotId, wellSettings } = useApp();

  return (
    <div className="flex flex-col space-y-6">
      {/* Upper Grid: Actual Survey Matrix (Auto-hides, expands on hover) */}
      <div className="group relative transition-all duration-700 ease-in-out max-h-11 hover:max-h-[2000px] overflow-hidden rounded-xl shadow-xs">
        
        {/* Closed State Header Overlay */}
        <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between px-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 opacity-100 transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Actual Deviation Survey Matrix (Hidden)</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Hover to expand ▼</span>
        </div>

        {/* The Grid Component */}
        <div className="transition-opacity duration-500">
          <SingleGrid
            title="Actual Deviation Survey Matrix"
            type="Survey"
            initialData={surveyData}
            wellSettings={wellSettings}
            user={user}
            selectedSlotId={selectedSlotId}
            onRefresh={onRefresh}
          />
        </div>
      </div>

      {/* Lower Grid: Plan Matrix (Auto-hides, expands on hover) */}
      <div className="group relative transition-all duration-700 ease-in-out max-h-11 hover:max-h-[2000px] overflow-hidden rounded-xl shadow-xs">
        
        {/* Closed State Header Overlay */}
        <div className="absolute inset-x-0 top-0 z-10 flex h-11 items-center justify-between px-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 opacity-100 transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Active Trajectory Plan Matrix (Hidden)</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Hover to expand ▼</span>
        </div>

        {/* The Grid Component */}
        <div className="transition-opacity duration-500">
          <SingleGrid
            title="Active Trajectory Plan Matrix"
            type="Plan"
            initialData={planData}
            wellSettings={wellSettings}
            user={user}
            selectedSlotId={selectedSlotId}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
}

interface SingleGridProps {
  title: string;
  type: 'Plan' | 'Survey';
  initialData: TrajectoryData | null;
  wellSettings: any;
  user: any;
  selectedSlotId: number | null;
  onRefresh: () => void;
}

function SingleGrid({ title, type, initialData, wellSettings, user, selectedSlotId, onRefresh }: SingleGridProps) {
  const [points, setPoints] = useState<Station[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (initialData) {
      setPoints(initialData.points);
      setNewName(initialData.name);
      setIsDirty(false);
    } else {
      setPoints([]);
      setNewName('');
      setIsDirty(false);
    }
  }, [initialData]);

  const unitSuffix = wellSettings?.unit === 'metric' ? 'm' : 'ft';
  const dlsSuffix = wellSettings?.unit === 'metric' ? '°/30m' : '°/100ft';

  // Perform Client-side MCM recalculation in real-time as user edits cells
  const recalculateGrid = (updatedRaw: RawStation[]): Station[] => {
    if (!wellSettings) return [];
    
    // Sort raw points by Measured Depth before calculation to guarantee proper sequence accumulation
    const sortedRaw = [...updatedRaw].sort((a, b) => a.measuredDepth - b.measuredDepth);
    const ref = {
      easting: wellSettings.easting,
      northing: wellSettings.northing,
      elevation: wellSettings.elevation,
      unit: wellSettings.unit,
    };

    const calcPoints = calculateMCM(sortedRaw, ref);
    return calcPoints.map((p, idx) => ({
      ...p,
      // Propagate original DB IDs if they match the sequence order
      id: points[idx]?.id,
    }));
  };

  const handleCellChange = (index: number, field: 'measuredDepth' | 'inclination' | 'azimuth', value: string) => {
    const numericValue = parseFloat(value) || 0;
    const newPoints = [...points];
    
    newPoints[index] = {
      ...newPoints[index],
      [field]: numericValue,
    };

    // Extract raw stations for calculator
    const rawStations: RawStation[] = newPoints.map((p) => ({
      measuredDepth: p.measuredDepth,
      inclination: p.inclination,
      azimuth: p.azimuth,
    }));

    // Recalculate dependent coordinates immediately on the client side!
    const reCalculated = recalculateGrid(rawStations);
    setPoints(reCalculated);
    setIsDirty(true);
  };

  // Add station row
  const handleAddRow = () => {
    const lastPoint = points[points.length - 1];
    const newMd = lastPoint ? lastPoint.measuredDepth + 100 : 0;
    
    const newPoints = [
      ...points,
      {
        measuredDepth: newMd,
        inclination: lastPoint ? lastPoint.inclination : 0,
        azimuth: lastPoint ? lastPoint.azimuth : 0,
        tvd: lastPoint ? lastPoint.tvd + 100 : 0,
        easting: lastPoint ? lastPoint.easting : wellSettings?.easting || 0,
        northing: lastPoint ? lastPoint.northing : wellSettings?.northing || 0,
        subseaTvd: lastPoint ? lastPoint.subseaTvd + 100 : 0,
        dls: 0,
        xOffset: lastPoint ? lastPoint.xOffset : 0,
        yOffset: lastPoint ? lastPoint.yOffset : 0,
        zOffset: lastPoint ? lastPoint.zOffset + 100 : 0,
      },
    ];

    const rawStations: RawStation[] = newPoints.map((p) => ({
      measuredDepth: p.measuredDepth,
      inclination: p.inclination,
      azimuth: p.azimuth,
    }));

    const reCalculated = recalculateGrid(rawStations);
    setPoints(reCalculated);
    setIsDirty(true);
  };

  // Remove station row
  const handleDeleteRow = (index: number) => {
    if (points.length <= 1) {
      alert("Trajectories require at least one starting station log.");
      return;
    }
    const newPoints = points.filter((_, i) => i !== index);
    
    const rawStations: RawStation[] = newPoints.map((p) => ({
      measuredDepth: p.measuredDepth,
      inclination: p.inclination,
      azimuth: p.azimuth,
    }));

    const reCalculated = recalculateGrid(rawStations);
    setPoints(reCalculated);
    setIsDirty(true);
  };

  // Undo changes
  const handleUndo = () => {
    if (initialData) {
      setPoints(initialData.points);
      setIsDirty(false);
    }
  };

  // Save changes to database
  const handleSaveChanges = async () => {
    if (!initialData) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/trajectories/${initialData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          points: points,
        }),
      });

      if (res.ok) {
        setIsDirty(false);
        setIsRenaming(false);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving trajectory details:', err);
    } finally {
      setSaving(false);
    }
  };

  // Create trajectory if none exists for this Slot
  const handleCreateTrajectory = async () => {
    if (!selectedSlotId) return;
    const nameInput = prompt(`Enter a name for the new Trajectory ${type}:`, `Default ${type}`);
    if (!nameInput) return;

    try {
      const res = await fetch('/api/trajectories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlotId,
          name: nameInput,
          type: type,
          is_definite: true,
        }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error creating trajectory:', err);
    }
  };

  if (!selectedSlotId) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 dark:border-slate-800 dark:text-slate-600">
        <Grid className="h-6 w-6 mb-2" />
        <span className="text-xs">Select an asset Slot node in the sidebar to populate calculation tables.</span>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-white/40 p-8 text-center text-slate-400 dark:border-slate-800/80 dark:bg-slate-900/10">
        <Grid className="h-6 w-6 mb-2 text-slate-300 dark:text-slate-600" />
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          No Definite {type === 'Plan' ? 'Trajectory Plan' : 'Deviation Survey'} Loaded
        </h3>
        <p className="text-[10px] text-slate-400 max-w-xs mt-1 mb-4 leading-relaxed">
          There are no trajectory iterations marked as definite under this slot.
        </p>
        {user ? (
          <button
            onClick={handleCreateTrajectory}
            className="flex items-center space-x-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold px-3 py-1.5 text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Definite {type}</span>
          </button>
        ) : (
          <span className="text-[10px] text-slate-500">Sign in to initialize trajectory points.</span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-[#111827]">
      {/* Grid Header */}
      <div className="flex h-11 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 dark:border-slate-800/60 dark:bg-slate-900/30">
        <div className="flex items-center space-x-2">
          <ArrowUpRight className={`h-4 w-4 ${type === 'Plan' ? 'text-sky-500' : 'text-emerald-500'}`} />
          {isRenaming && user ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setIsDirty(true);
              }}
              className="rounded-md border border-slate-200 px-2 py-0.5 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsRenaming(false);
              }}
              autoFocus
            />
          ) : (
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {newName}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-500">
                {type}
              </span>
              {user && (
                <button
                  onClick={() => setIsRenaming(true)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <Edit className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        {user && isDirty && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleUndo}
              className="flex items-center space-x-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-2.5 py-1 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-colors"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Discard</span>
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex items-center space-x-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 text-xs font-semibold transition-colors shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Matrix'}</span>
            </button>
          </div>
        )}
      </div>

      {/* spreadsheet container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold dark:bg-slate-900/40 dark:border-slate-800">
              <th className="py-2.5 px-3 text-center w-10">#</th>
              <th className="py-2.5 px-3">MD ({unitSuffix})</th>
              <th className="py-2.5 px-3">Inc (°)</th>
              <th className="py-2.5 px-3">Az (°)</th>
              <th className="py-2.5 px-3 text-slate-400 dark:text-slate-600">TVD ({unitSuffix})</th>
              <th className="py-2.5 px-3 text-slate-400 dark:text-slate-600">Easting ({unitSuffix})</th>
              <th className="py-2.5 px-3 text-slate-400 dark:text-slate-600">Northing ({unitSuffix})</th>
              <th className="py-2.5 px-3 text-slate-400 dark:text-slate-600">X Offset ({unitSuffix})</th>
              <th className="py-2.5 px-3 text-slate-400 dark:text-slate-600">Y Offset ({unitSuffix})</th>
              <th className="py-2.5 px-3 text-slate-400 dark:text-slate-600">SSTVD ({unitSuffix})</th>
              <th className="py-2.5 px-3 text-slate-400 dark:text-slate-600">DLS ({dlsSuffix})</th>
              {user && <th className="py-2.5 px-3 text-center w-12">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {points.map((pt, index) => (
              <tr key={index} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                <td className="py-2 px-3 text-center text-slate-400 font-medium bg-slate-50/20 dark:bg-slate-900/5 select-none">
                  {index + 1}
                </td>
                
                {/* Measured Depth input */}
                <td className="py-1.5 px-2">
                  <input
                    type="number"
                    step="any"
                    value={pt.measuredDepth}
                    onChange={(e) => handleCellChange(index, 'measuredDepth', e.target.value)}
                    disabled={!user || index === 0} // Station 0 MD is usually anchored to 0
                    className="w-full rounded border-0 px-2 py-1 text-xs bg-transparent focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 disabled:opacity-80 dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </td>

                {/* Inclination input */}
                <td className="py-1.5 px-2">
                  <input
                    type="number"
                    step="any"
                    value={pt.inclination}
                    onChange={(e) => handleCellChange(index, 'inclination', e.target.value)}
                    disabled={!user}
                    className="w-full rounded border-0 px-2 py-1 text-xs bg-transparent focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </td>

                {/* Azimuth input */}
                <td className="py-1.5 px-2">
                  <input
                    type="number"
                    step="any"
                    value={pt.azimuth}
                    onChange={(e) => handleCellChange(index, 'azimuth', e.target.value)}
                    disabled={!user}
                    className="w-full rounded border-0 px-2 py-1 text-xs bg-transparent focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </td>

                {/* Calculations columns (Read-Only) */}
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono bg-slate-50/10 dark:bg-slate-900/5 select-none">
                  {pt.tvd.toFixed(1)}
                </td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono bg-slate-50/10 dark:bg-slate-900/5 select-none">
                  {pt.easting.toFixed(1)}
                </td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono bg-slate-50/10 dark:bg-slate-900/5 select-none">
                  {pt.northing.toFixed(1)}
                </td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono bg-slate-50/10 dark:bg-slate-900/5 select-none">
                  {pt.xOffset.toFixed(1)}
                </td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono bg-slate-50/10 dark:bg-slate-900/5 select-none">
                  {pt.yOffset.toFixed(1)}
                </td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono bg-slate-50/10 dark:bg-slate-900/5 select-none">
                  {pt.subseaTvd.toFixed(1)}
                </td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono bg-slate-50/10 dark:bg-slate-900/5 select-none">
                  {pt.dls.toFixed(2)}
                </td>

                {/* Actions column */}
                {user && (
                  <td className="py-1 px-2 text-center">
                    <button
                      onClick={() => handleDeleteRow(index)}
                      disabled={index === 0} // Station 0 is the start baseline node
                      className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-500 disabled:opacity-30 dark:hover:bg-slate-800"
                      title="Delete station"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Footer / Append row */}
      {user && (
        <div className="flex h-11 items-center justify-between border-t border-slate-100 bg-slate-50/30 px-4 dark:border-slate-800/80 dark:bg-slate-900/10">
          <button
            onClick={handleAddRow}
            className="flex items-center space-x-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-sky-500" />
            <span>Append Survey Station</span>
          </button>
          
          {isDirty && (
            <span className="text-[10px] text-amber-500 font-semibold italic animate-pulse">
              * Calculations updated. Changes unsaved.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
