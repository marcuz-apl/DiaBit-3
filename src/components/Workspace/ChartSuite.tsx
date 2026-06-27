'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/components/Providers';
import { LineChart, Orbit } from 'lucide-react';

interface Station {
  measuredDepth: number;
  inclination: number;
  azimuth: number;
  tvd: number;
  easting: number;
  northing: number;
  subseaTvd: number;
  xOffset: number;
  yOffset: number;
  zOffset: number;
}

interface ChartSuiteProps {
  planPoints: Station[];
  surveyPoints: Station[];
}

export default function ChartSuite({ planPoints, surveyPoints }: ChartSuiteProps) {
  const { theme, wellSettings } = useApp();
  const [plotly, setPlotly] = useState<any>(null);

  const chart3DRef = useRef<HTMLDivElement>(null);
  const chartPlanRef = useRef<HTMLDivElement>(null);
  const chartVertRef = useRef<HTMLDivElement>(null);

  // Dynamic import of Plotly on client mount
  useEffect(() => {
    import('plotly.js-dist-min')
      .then((mod) => setPlotly(mod.default))
      .catch((err) => console.error('Plotly dynamic import failed:', err));
  }, []);

  useEffect(() => {
    if (!plotly || !wellSettings) return;

    const unit = wellSettings.unit === 'metric' ? 'm' : 'ft';
    const isDark = theme === 'dark';

    // Theme variables
    const bgColor = isDark ? '#111827' : '#ffffff';
    const textColor = isDark ? '#cbd5e1' : '#334155';
    const gridColor = isDark ? 'rgba(56, 189, 248, 0.08)' : '#f1f5f9';
    const planColor = '#38bdf8'; // sky blue
    const surveyColor = '#f97316'; // orange/red

    // Calculate Horizontal Displacement (HD) for points
    const getHDPoints = (pts: Station[]) => {
      return pts.map((p) => Math.sqrt(p.xOffset ** 2 + p.yOffset ** 2));
    };

    // 1. --- 3D Trajectory Chart ---
    const data3D = [];
    if (planPoints.length > 0) {
      data3D.push({
        type: 'scatter3d',
        mode: 'lines+markers',
        name: 'Planned Trajectory',
        x: planPoints.map((p) => p.easting),
        y: planPoints.map((p) => p.northing),
        z: planPoints.map((p) => p.tvd),
        line: { color: planColor, width: 4 },
        marker: { size: 2.5, color: planColor },
      });
    }
    if (surveyPoints.length > 0) {
      data3D.push({
        type: 'scatter3d',
        mode: 'lines+markers',
        name: 'Actual Survey',
        x: surveyPoints.map((p) => p.easting),
        y: surveyPoints.map((p) => p.northing),
        z: surveyPoints.map((p) => p.tvd),
        line: { color: surveyColor, width: 4.5 },
        marker: { size: 3.5, color: surveyColor },
      });
    }

    const layout3D = {
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor, size: 10, family: 'Inter, sans-serif' },
      margin: { l: 0, r: 0, t: 30, b: 0 },
      title: { text: `3D Spatial Trajectory Curve (${unit})`, font: { size: 12, weight: 'bold' } },
      scene: {
        xaxis: { title: 'Easting', backgroundcolor: bgColor, gridcolor: gridColor, showbackground: true },
        yaxis: { title: 'Northing', backgroundcolor: bgColor, gridcolor: gridColor, showbackground: true },
        zaxis: { 
          title: 'TVD (Depth)', 
          backgroundcolor: bgColor, 
          gridcolor: gridColor, 
          showbackground: true,
          autorange: 'reversed' // Depth increases downwards
        },
        camera: {
          eye: { x: 1.25, y: 1.25, z: 0.6 }
        }
      },
      legend: { x: 0.05, y: 0.95 },
      showlegend: true,
    };

    plotly.newPlot(chart3DRef.current, data3D, layout3D, { responsive: true, displayModeBar: false });

    // 2. --- 2D Plan View (Easting vs Northing) ---
    const dataPlan = [];
    if (planPoints.length > 0) {
      dataPlan.push({
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Planned',
        x: planPoints.map((p) => p.easting),
        y: planPoints.map((p) => p.northing),
        line: { color: planColor, width: 2.5 },
        marker: { size: 4, color: planColor },
      });
    }
    if (surveyPoints.length > 0) {
      dataPlan.push({
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Actual',
        x: surveyPoints.map((p) => p.easting),
        y: surveyPoints.map((p) => p.northing),
        line: { color: surveyColor, width: 3 },
        marker: { size: 5, color: surveyColor },
      });
    }

    const layoutPlan = {
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor, size: 9, family: 'Inter, sans-serif' },
      margin: { l: 45, r: 15, t: 30, b: 35 },
      title: { text: `2D Plan View (Easting vs. Northing) (${unit})`, font: { size: 11, weight: 'bold' } },
      xaxis: { title: 'Easting', gridcolor: gridColor, linecolor: gridColor, zeroline: false },
      yaxis: { title: 'Northing', gridcolor: gridColor, linecolor: gridColor, scaleanchor: 'x', scaleratio: 1, zeroline: false },
      legend: { x: 0.02, y: 0.98 },
      showlegend: false,
    };

    plotly.newPlot(chartPlanRef.current, dataPlan, layoutPlan, { responsive: true, displayModeBar: false });

    // 3. --- 2D Vertical Section View (TVD vs Horizontal Displacement) ---
    const dataVert = [];
    if (planPoints.length > 0) {
      dataVert.push({
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Planned',
        x: getHDPoints(planPoints),
        y: planPoints.map((p) => p.tvd),
        line: { color: planColor, width: 2.5 },
        marker: { size: 4, color: planColor },
      });
    }
    if (surveyPoints.length > 0) {
      dataVert.push({
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Actual',
        x: getHDPoints(surveyPoints),
        y: surveyPoints.map((p) => p.tvd),
        line: { color: surveyColor, width: 3 },
        marker: { size: 5, color: surveyColor },
      });
    }

    const layoutVert = {
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor, size: 9, family: 'Inter, sans-serif' },
      margin: { l: 45, r: 15, t: 30, b: 35 },
      title: { text: `2D Vertical Section View (TVD vs. Displacement) (${unit})`, font: { size: 11, weight: 'bold' } },
      xaxis: { title: 'Horizontal Displacement', gridcolor: gridColor, linecolor: gridColor, zeroline: false },
      yaxis: { 
        title: 'True Vertical Depth (TVD)', 
        gridcolor: gridColor, 
        linecolor: gridColor, 
        autorange: 'reversed', // TVD depth goes downwards
        zeroline: false
      },
      legend: { x: 0.02, y: 0.98 },
      showlegend: false,
    };

    plotly.newPlot(chartVertRef.current, dataVert, layoutVert, { responsive: true, displayModeBar: false });

  }, [plotly, planPoints, surveyPoints, theme, wellSettings]);

  if (!wellSettings) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 p-6 text-center text-slate-400 dark:border-slate-800/80 dark:text-slate-600">
        <LineChart className="h-6 w-6 mb-2" />
        <span className="text-xs font-semibold">Select a Slot to render 3D/2D spatial charts.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* 3D Chart Container */}
      <div className="relative rounded-xl border border-slate-200/70 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-[#111827]">
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-1.5 rounded-full bg-slate-100/80 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800/85 dark:text-slate-400">
          <Orbit className="h-3 w-3 animate-spin-slow" />
          <span>Click & Drag to Rotate</span>
        </div>
        <div ref={chart3DRef} className="h-80 w-full rounded-lg overflow-hidden" />
      </div>

      {/* 2D Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan View (Easting vs Northing) */}
        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-[#111827]">
          <div ref={chartPlanRef} className="h-64 w-full rounded-lg overflow-hidden" />
        </div>

        {/* Vertical Section View (TVD vs Disp) */}
        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-[#111827]">
          <div ref={chartVertRef} className="h-64 w-full rounded-lg overflow-hidden" />
        </div>
      </div>
    </div>
  );
}
