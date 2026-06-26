'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/components/Providers';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import AssetSidebar from '@/components/Sidebar/AssetSidebar';
import CalculationSettings from '@/components/Sidebar/CalculationSettings';
import MetricRibbon from '@/components/Workspace/MetricRibbon';
import DataGrids from '@/components/Workspace/DataGrids';
import ChartSuite from '@/components/Workspace/ChartSuite';
import { Layers, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

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

export default function Home() {
  const {
    selectedSlotId,
    selectedTrajectoryId,
    selectedTrajectoryType,
    wellSettings,
    refreshTrigger,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [planTrajectory, setPlanTrajectory] = useState<TrajectoryData | null>(null);
  const [surveyTrajectory, setSurveyTrajectory] = useState<TrajectoryData | null>(null);

  // Fetch definite Plan and Survey for the selected Slot
  const fetchActiveTrajectories = useCallback(async (slotId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/slots/${slotId}/active`);
      if (res.ok) {
        const data = await res.json();
        setPlanTrajectory(data.plan);
        setSurveyTrajectory(data.survey);
      }
    } catch (err) {
      console.error('Error fetching active trajectories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch individual trajectory detail if user overrides by clicking specific item in tree
  const fetchSingleTrajectory = useCallback(async (id: number, type: 'Plan' | 'Survey') => {
    try {
      const res = await fetch(`/api/trajectories/${id}`);
      if (res.ok) {
        const data = await res.json();
        const formattedTraj: TrajectoryData = {
          id: data.id,
          name: data.name,
          type: data.type,
          points: data.points,
        };

        if (type === 'Plan') {
          setPlanTrajectory(formattedTraj);
        } else {
          setSurveyTrajectory(formattedTraj);
        }
      }
    } catch (err) {
      console.error('Error fetching single trajectory details:', err);
    }
  }, []);

  // Reload data
  const handleReload = () => {
    if (selectedSlotId) {
      fetchActiveTrajectories(selectedSlotId);
    }
  };

  // Sync data based on sidebar selections and refresh triggers
  useEffect(() => {
    if (selectedSlotId) {
      fetchActiveTrajectories(selectedSlotId).then(() => {
        // If a specific trajectory was selected, load that one specifically
        if (selectedTrajectoryId && selectedTrajectoryType) {
          fetchSingleTrajectory(selectedTrajectoryId, selectedTrajectoryType);
        }
      });
    } else {
      setPlanTrajectory(null);
      setSurveyTrajectory(null);
    }
  }, [selectedSlotId, refreshTrigger, fetchActiveTrajectories]);

  // Handle loading specific trajectory override
  useEffect(() => {
    if (selectedTrajectoryId && selectedTrajectoryType) {
      fetchSingleTrajectory(selectedTrajectoryId, selectedTrajectoryType);
    }
  }, [selectedTrajectoryId, selectedTrajectoryType, fetchSingleTrajectory]);

  // Extract last stations for the metric ribbon display
  const planLastStation = planTrajectory && planTrajectory.points.length > 0
    ? planTrajectory.points[planTrajectory.points.length - 1]
    : null;

  const surveyLastStation = surveyTrajectory && surveyTrajectory.points.length > 0
    ? surveyTrajectory.points[surveyTrajectory.points.length - 1]
    : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-800 dark:bg-[#0b0f19] dark:text-slate-100">
      {/* 1. Header Bar */}
      <Header />

      {/* 2. Body Workspace (Split View) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Draggable Asset Sidebar */}
        <AssetSidebar />

        {/* Central Workspace (Fluid Grid & Charts) */}
        <main className="flex-1 overflow-y-auto px-6 py-4 grid-lines">
          {selectedSlotId ? (
            <div className="mx-auto max-w-7xl space-y-6">
              
              {/* Header Info Tag */}
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-3 dark:border-slate-800/40">
                <div className="flex items-center space-x-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Central Engineering Workspace
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Slot ID: {selectedSlotId} | Reference: {wellSettings?.easting}, {wellSettings?.northing} ({wellSettings?.unit === 'metric' ? 'Metric' : 'Imperial'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>MCM Engine Online</span>
                </div>
              </div>

              {/* (1) Direct Dashboard Metric Ribbon */}
              <MetricRibbon
                planStation={planLastStation}
                surveyStation={surveyLastStation}
                unit={wellSettings?.unit || 'metric'}
              />

              {loading ? (
                <div className="flex h-64 flex-col items-center justify-center space-y-3.5">
                  <Activity className="h-8 w-8 text-sky-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-400">Recomputing directional model...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  
                  {/* (2) Excel-Layout Data Grids */}
                  <div className="space-y-6 order-2 xl:order-1">
                    <DataGrids
                      planData={planTrajectory}
                      surveyData={surveyTrajectory}
                      onRefresh={handleReload}
                    />
                  </div>

                  {/* (3) Chart Suite Canvas */}
                  <div className="sticky top-0 order-1 xl:order-2">
                    <ChartSuite
                      planPoints={planTrajectory?.points || []}
                      surveyPoints={surveyTrajectory?.points || []}
                    />
                  </div>

                </div>
              )}

            </div>
          ) : (
            /* Dashboard Welcome State */
            <div className="flex h-full flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-9 w-9"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                Welcome to DiaBit Trajectory Suite
              </h1>
              <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                A premium directional drilling calculations platform. Select a Well Slot from the Asset Sidebar to view coordinates, modify log points, and interact with the 3D projection model.
              </p>
              <div className="mt-8 flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80">
                <AlertTriangle className="h-4.5 w-4.5 text-sky-500 animate-bounce" />
                <span>Expand the left hierarchy tree to load geological assets.</span>
              </div>
            </div>
          )}
        </main>

        {/* Right Side: Calculation Settings Sidebar */}
        <CalculationSettings />

      </div>

      {/* 3. Footer Bar */}
      <Footer />
    </div>
  );
}
