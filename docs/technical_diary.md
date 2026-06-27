# Technical Diary: DiaBit Development

This document tracks critical architectural adjustments, design decisions, mathematical formulations, and workarounds implemented during the development of DiaBit.

---

## 1. Port Availability Fallback
- **Problem**: Next.js defaults to running on port 3000, and standard frameworks don't automatically fall back if a port is occupied. The PRD required binding to network Port 3032, with automatic sequential fallbacks to 3033, 3034, etc., if occupied.
- **Solution**: We created a wrapper startup script at `scripts/start-server.js` that uses the Node.js `net` library to check port availability. It tries to listen on `3032`. If it encounters an `EADDRINUSE` error, it increments the port number and tries again until a free port is found. It then spawns the Next.js process (`dev` or `start`) on that port.
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

---

## 5. Plotly 3D & 2D Depth Axis Direction
- **Problem**: In drilling, True Vertical Depth (TVD) increases downwards. Standard 3D and 2D charts render values increasing upwards, making trajectories appear upside-down.
- **Solution**: We explicitly set the `autorange` property of the Plotly Z-axis (for 3D) and Y-axis (for 2D Vertical Section) to `'reversed'`. (Note: The Plotly API specifically expects the string `'reversed'`, not `'reverse'`).
- **Result**: Visualizations correctly orient starting from 0 depth at the top and extending downwards.

---

## 6. Git Hook Version Bumping Redundancy
- **Problem**: The system was bumping the version number twice on every commit. This was caused by two redundant Git hooks simultaneously firing: a `.git/hooks/pre-commit` script (`scripts/version-bump.js`) and a custom `.git/hooks/commit-msg` script.
- **Solution**: We deleted the duplicate bump script. The `pre-commit` hook is now responsible solely for incrementing the version, and the `commit-msg` hook simply reads the freshly incremented version from `package.json` to safely prepend it to the commit message.
- **Result**: Versions increment exactly once per commit, preventing rapid inflation while maintaining auto-commit tags.

---

## 7. Dynamic Workspace Layout Adjustments
- **Problem**: The user required DataGrids to stack vertically and all ChartSuite plots (3D, Plan View, Vertical Section) to sit cleanly on a single row to maximize horizontal analytics.
- **Solution**: We refactored `page.tsx` to place DataGrids fully stacked above the ChartSuite instead of rendering them side-by-side. The `ChartSuite` was then changed from a flex column to a strict 3-column CSS Grid (`grid-cols-3`), locking all charts at `h-80` to maintain perfect row alignment.
- **Result**: A much cleaner analytical dashboard with expansive data matrices and synchronized charting.
