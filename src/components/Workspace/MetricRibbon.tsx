'use client';

import React from 'react';
import { Shield, Target, Navigation, ArrowDownUp, Waves } from 'lucide-react';

interface Station {
  measuredDepth: number;
  inclination: number;
  azimuth: number;
  tvd: number;
  easting: number;
  northing: number;
  subseaTvd: number;
  dls: number;
}

interface MetricRibbonProps {
  planStation: Station | null;
  surveyStation: Station | null;
  unit: 'metric' | 'imperial';
}

export default function MetricRibbon({ planStation, surveyStation, unit }: MetricRibbonProps) {
  const u = unit === 'metric' ? 'm' : 'ft';

  // Helper to format values
  const fmt = (val: number | undefined, suffix = '', precision = 1) => {
    if (val === undefined || val === null) return '—';
    return `${val.toFixed(precision)}${suffix}`;
  };

  const getDelta = (surveyVal: number | undefined, planVal: number | undefined) => {
    if (surveyVal === undefined || planVal === undefined) return null;
    return surveyVal - planVal;
  };

  const renderDelta = (delta: number | null, suffix = '', precision = 1) => {
    if (delta === null) return null;
    const isZero = Math.abs(delta) < 0.05;
    const sign = delta > 0 ? '+' : '';
    const color = isZero
      ? 'text-slate-400 dark:text-slate-500'
      : delta > 0
      ? 'text-emerald-500 dark:text-emerald-400'
      : 'text-rose-500 dark:text-rose-400';

    return (
      <span className={`text-[10px] font-bold ${color} ml-1.5`}>
        ({sign}{delta.toFixed(precision)}{suffix})
      </span>
    );
  };

  const cards = [
    {
      title: 'Last Measured Depth (MD)',
      icon: <ArrowDownUp className="h-4 w-4 text-sky-500" />,
      plan: planStation?.measuredDepth,
      actual: surveyStation?.measuredDepth,
      suffix: ` ${u}`,
      delta: getDelta(surveyStation?.measuredDepth, planStation?.measuredDepth),
      precision: 1,
    },
    {
      title: 'Inclination (Inc)',
      icon: <Navigation className="h-4 w-4 text-emerald-500" />,
      plan: planStation?.inclination,
      actual: surveyStation?.inclination,
      suffix: '°',
      delta: getDelta(surveyStation?.inclination, planStation?.inclination),
      precision: 2,
    },
    {
      title: 'Azimuth (Az)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-amber-500">
          <circle cx="12" cy="12" r="10" />
          <path d="M16.2 7.8l-2 5.6-5.6 2 2-5.6 5.6-2z" />
        </svg>
      ),
      plan: planStation?.azimuth,
      actual: surveyStation?.azimuth,
      suffix: '°',
      delta: getDelta(surveyStation?.azimuth, planStation?.azimuth),
      precision: 2,
    },
    {
      title: 'True Vertical Depth (TVD)',
      icon: <Target className="h-4 w-4 text-rose-500" />,
      plan: planStation?.tvd,
      actual: surveyStation?.tvd,
      suffix: ` ${u}`,
      delta: getDelta(surveyStation?.tvd, planStation?.tvd),
      precision: 1,
    },
    {
      title: 'Subsea TVD (SSTVD)',
      icon: <Waves className="h-4 w-4 text-indigo-500" />,
      plan: planStation?.subseaTvd,
      actual: surveyStation?.subseaTvd,
      suffix: ` ${u}`,
      delta: getDelta(surveyStation?.subseaTvd, planStation?.subseaTvd),
      precision: 1,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 shrink-0">
      {cards.map((c, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-xs dark:border-slate-800/80 dark:bg-[#111827]/80"
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            <span>{c.title}</span>
            {c.icon}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">PLAN</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {fmt(c.plan, c.suffix, c.precision)}
              </span>
            </div>
            
            <div className="flex items-baseline justify-between border-t border-slate-100 dark:border-slate-800/60 pt-1.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">ACTUAL</span>
              <div className="flex items-baseline">
                <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400">
                  {fmt(c.actual, c.suffix, c.precision)}
                </span>
                {renderDelta(c.delta, c.suffix, c.precision)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
