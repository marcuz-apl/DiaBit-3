# DiaBit Agent Guidelines

Welcome, agent! This document outlines the project architecture, mathematical standards, and coding conventions for maintaining and expanding **DiaBit**.

---

## 1. Core Architecture & Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript.
- **Styling**: Tailwind CSS v4. Theme toggling is handled by adding/removing the `.dark` class on the `<html>` element. Use CSS variable tokens defined in `src/app/globals.css`.
- **Database**: SQLite3 (`data/diabit.db`) using `better-sqlite3`. Connection cache is configured in `src/lib/db.ts` to prevent hot-reload socket leaking.

---

## 2. Database Schema Reference
- `users`: Stores authorization sessions (username, password, role = Admin/Engineer).
- `assets`: Represents physical drill tree node configs (Country → State/Province → GeoBasin → Field → Well → Slot).
- `well_settings`: Houses reference wellhead coordinates (easting, northing, elevation, and metric/imperial unit configuration) mapped to each Slot.
- `trajectories`: Track plan and survey iterations (type = Plan/Survey, flag is_definite).
- `trajectory_points`: Holds Measured Depth (MD), Inclination (Inc), and Azimuth (Az), along with Calculated TVD, Northing, Easting, X/Y/Z offsets, Subsea TVD, and Dogleg Severity.

---

## 3. Mathematical Calculations
We use the mathematically rigorous **Minimum Curvature Method (MCM)** implemented in `src/lib/mcm.ts`.
- All dependent points MUST be recalculated sequentially when any raw parameters (MD, Inc, Az) change, or when wellhead configurations (Easting, Northing, Elevation, Units) are adjusted.
- Dogleg Severity (DLS) is computed relative to the active units profile (deg/30m for Metric, deg/100ft for Imperial).

---

## 4. Coding Conventions
- **Client Components**: Mark client-side modules with `'use client'`.
- **Chart Suites**: Plotly.js (`plotly.js-dist-min`) MUST be loaded dynamically on the client side using `next/dynamic` or `useEffect` hooks to prevent server-side compilation failures.
- **API Guarding**: Any mutating operations (POST, PUT, DELETE) on assets, settings, or user profiles must be secured by validating user cookies against session parameters.

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
