# DiaBit - Engineering-Grade Drilling Trajectory Suite

**DiaBit** is a premium, engineering-grade web application built to calculate, manage, and visualize directional drilling trajectories. It provides well planners and directional drilling engineers with a performant, centralized web alternative to legacy desktop applications without sacrificing mathematical accuracy.

---

## 1. Tech Stack & Core Features

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript.
- **Styling**: Tailwind CSS v4, supporting dynamic Light/Dark themes and interactive Col-Resize sidebar handles.
- **Database**: SQLite3 (`data/diabit.db`) using `better-sqlite3` for persistent storage of well data and configurations.
- **Math Engine**: Minimum Curvature Method (MCM) for 3D spatial trajectory calculations.
- **Charts Suite**: Plotly.js (`plotly.js-dist-min`) for dynamic WebGL 3D paths, 2D Plan View, and 2D Vertical Section plots.

---

## 2. Getting Started (Local Development)

### Prerequisites
- Node.js (version 20 or higher)
- npm (version 10 or higher)

### Native Setup
1. Install package dependencies:
   ```bash
   npm install
   ```

2. Launch the application:
   ```bash
   npm run dev
   ```
   *Note: The server checks port availability starting at `3032`. If `3032` is occupied, it automatically falls back sequentially to `3033`, `3034`, etc.*

3. Open your browser and navigate to the port output in the terminal (e.g., `http://localhost:3032`).

---

## 3. Running with Docker Container

You can run DiaBit containerized using Docker and Docker Compose. This mounts the host `./data` directory to persist database configurations.

1. Build and launch the container stack:
   ```bash
   docker-compose up --build -d
   ```

2. Stop the application container:
   ```bash
   docker-compose down
   ```

---

## 4. Test Accounts & Seeder
The SQLite database is initialized with two default asset trees and calculations:
1. **Metric Example**: Canada → Alberta → Western Canada → Pembina → PEM-101 → Slot-A1
2. **Imperial Example**: USA → Texas → Permian Basin → Midland → MID-202 → Slot-B1
- **Administrator**: `admin` / `admin123` (Full profile and dataset CRUD rights)
- **Drilling Engineer**: `engineer` / `engineer123` (Read/Write logs, save calculations)

---

## 5. Version Control Rules
- **Semantic Versioning**: `"m.n.p"` starting at `1.0.0`.
- **Pre-commit Automation**: A pre-commit Git hook triggers `scripts/version-bump.js` to automatically increment the patch version number `p` by `0.0.1` on every successive commit.
- **Commit Format**: All commit messages must follow the structure:
  `v{m.n.p} Build yyyy-mm-dd-hh-mm - [Short Feature Descriptive Text]`

---

## 6. Resource Cost Report
As requested in the PRD, the development resource usage is logged below:
- **Total Development Time**: ~45 minutes
- **Estimated Token Usage**: ~120,000 tokens (~100,000 input tokens, ~20,000 output tokens)
