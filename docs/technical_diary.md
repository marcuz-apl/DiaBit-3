# Technical Diary: DiaBit Development

This document tracks critical architectural adjustments, design decisions, mathematical formulations, and workarounds implemented during the development of DiaBit.

---

## 1. Port Availability Fallback
- **Problem**: Next.js defaults to running on port 3000, and standard frameworks don't automatically fall back if a port is occupied. The PRD required binding to network Port 3030, with automatic sequential fallbacks to 3031, 3032, etc., if occupied.
- **Solution**: We created a wrapper startup script at `scripts/start-server.js` that uses the Node.js `net` library to check port availability. It tries to listen on `3030`. If it encounters an `EADDRINUSE` error, it increments the port number and tries again until a free port is found. It then spawns the Next.js process (`dev` or `start`) on that port.
- **Result**: Fully automated, environment-independent port fallbacks work seamlessly both locally and within container environments.

---

## 2. Dynamic Loading of Plotly.js in Next.js App Router
- **Problem**: Plotly.js (`plotly.js-dist-min`) uses DOM manipulation and references `window` globally at import time. This causes compilation and SSR hydration errors in Next.js App Router, which tries to pre-render pages on the server.
- **Solution**: We imported Plotly dynamically inside a React `useEffect` hook:
  ```typescript
  useEffect(() => {
    import('plotly.js-dist-min').then((mod) => setPlotly(mod.default));
  }, []);
  ```
  We then rendered the charts inside a standard `div` using `Plotly.newPlot` once both the library and the points data became available.
- **Result**: SSR rendering succeeds without any warnings, and 3D WebGL charts remain fully interactive.

---

## 3. Database Recalculation Cascades
- **Problem**: Changing reference coordinates (Easting/Northing/Elevation) or units (Metric/Imperial) for a Slot invalidates the coordinates (TVD, Easting, Northing, Offsets, SSTVD, and Dogleg Severity) of all trajectories associated with that Slot.
- **Solution**: We designed the `PUT /api/settings` route to run inside an SQLite database transaction. When coordinates are updated:
  1. It saves the new settings in `well_settings`.
  2. It fetches all Trajectory Plans and surveys under the Slot.
  3. For each trajectory, it queries its raw logs, recalculates them using the MCM engine, and overrides the database points.
- **Result**: Data integrity is maintained, and user-facing calculations remain synchronized.

---

## 4. Draggable Sidebars and 30-Second Mouse Idle Timer
- **Problem**: The PRD requested sidebars (20% width each) that auto-hide smoothly if the user pointer remains idle for 30 seconds, and that are draggable to be wider.
- **Solution**:
  - We implemented a mouse resize handle on the right edge of the Asset Sidebar to update its width state dynamically.
  - We added global event listeners for mousemove, pointerdown, and keydown. When any activity is detected, we reset an idle counter to `0` and restore sidebar visibility. If `30` seconds pass without any events, we set a `isCollapsed` flag to hide the sidebars, maximizing drilling chart canvas space.
- **Result**: Sleek UX animations that adapt to the engineer's workflow.
