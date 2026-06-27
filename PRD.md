# Product Requirements Document (PRD): DiaBit



## 1. Project Overview & Problem Statement

* **Context**: **DiaBit** is a premium, engineering-grade web application built to calculate, manage, and visualize directional drilling trajectories for the Oil & Gas industry.
* **Problem Statement**: Standard legacy industry packages are heavy desktop installations with complex licensing structures. DiaBit provides an accessible, performant, and centralized web-native alternative without sacrificing mathematical accuracy.
* **Target Audience**: Well Planners, Directional Drilling Engineers, and Operators requiring rapid, exact trajectory calculation, historical data tracking, and visual profiling.



## 2. Tech Stack & Architecture Context

* **Frontend**: **Next.js (App Router)** with **React** and **TypeScript** for robust typing, state management, and optimized rendering.
* **Styling**: **Tailwind CSS** for a clean, sleek, engineering-grade dark/light user interface.
* **Database**: **SQLite3** (`data/diabit.db`) for lightweight, high-performance structured storage of assets, user profiles, plans, and surveys.
* **Execution Environment**: Local or containerized execution bound to **Port 3032** (fallback sequentially to 3033, 3034, etc., if occupied).



## 3. UI/UX & Workspace Architecture

The user interface follows an ultra-sleek, three-part layout: **Header Bar**, **Body Workspace**, and **Footer Bar**, optimized for heavy asset navigation and real-time visualization.

### 3.1 The Header Bar
* **Left Corner**: Interactive `Help` and `About` buttons leading to separate documentation and product layout pages.
* **Center**: Centered minimalist application logo, name **"DiaBit"**, and the dynamic version indicator (e.g., `v1.0.0`).
* **Right Corner**: User sign-in interface, an **Admin Panel** link (visible *only* to authorized administrator accounts, positioned directly before the username), and a standard Light/Dark theme-toggler anchored to the extreme right.

### 3.2 The Body Workspace (Split View)
#### A. Left Side: Asset Sidebar (20% Screen Width)
* **Behavior**: Auto-hides smoothly if the user pointer remains idle for 30 seconds.
* **Structure**: Clean tree-style configuration organized in the following strict asset hierarchy:
  `Country` → `State/Province` → `GeoBasin` → `Field` → `Well` → `Slot` → `Plans / Surveys folders`.
  * **Plans Folder**: Holds all versioned iterations of trajectory designs.
  * **Surveys Folder**: Holds all versions of actual run deviation surveys.
* **Interactivity**: Clicking any specific Trajectory Plan or Deviation Survey instantly loads it into the core workspace data tables. The sidebar shall be draggable to be wider in case of too narrow to display the tree.
* **Right-Click Context Menu**: Engineers can right-click any item to mark it as **"Definite"**. The definite item auto-populates as the default baseline in the central tracking engine.

#### B. Central Workspace (60% Screen Width)
* **(1) Direct Dashboard Metric Ribbon**: High-visibility engineering banner tracking key final endpoints: Last Measured Depth (MD), Inclination (Inc), Azimuth (Az), True Vertical Depth (TVD), and Subsea True Vertical Depth (SSTVD).
* **(2) Excel-Layout Data Grids**: Two independent, stacked, spreadsheet-like calculation tables:
  * *Upper Table*: Active / Definite Trajectory Plan matrix.
  * *Lower Table*: Actual Deviation Survey matrix.
  * *Calculation Automation*: Inserting or appending a new line containing `MD`, `Inclination`, and `Azimuth` triggers immediate calculation of dependent properties: X Offset, Y Offset, Z, TVD, Easting, Northing, and Dogleg Severity (DLS).
* **(3) Chart Suite Canvas**: Stacked graphics environment displaying three synchronized views:
  * Top: 3D interactive model showing the spatial trajectory curve (Planned vs. Real-Time).
  * Bottom Left: 2D Plan View Chart (Easting vs. Northing footprint).
  * Bottom Right: 2D Vertical Section View Chart (TVD vs. Horizontal Displacement).

#### C. Right Side: Calculation Settings Sidebar (20% Screen Width)
* **Behavior**: Houses computation parameters (e.g., Unit profiles, reference coordinates, grid corrections). 
* **Interactivity**: Auto-hides smoothly if the mouse pointer remains idle for 30 seconds.

### 3.3 The Footer Bar
* **Left Corner**: `Disclaimer` button opening an overlay modal dialog, and a `Contact-Us` button directing users to a contact view containing an electronic mail submission form alongside an embedded Google Map centered on Calgary, Canada.
* **Central Part**: Clear copyright notice string: `"@2026 Alfazen Inc. All rights reserved"`.
* **Right Corner**: Functional social icon array linking to communication channels: Telephone, Web, Twitter/X, and LinkedIn.



## 4. Engineering Engine & Core Calculations

Calculations use the mathematically rigorous **Minimum Curvature Method (MCM)** to calculate 3D survey coordinates from raw survey inputs at station logs (i).

### Mathematical Formulations
1. **Course Length (Δ MD):**
   $$
   \Delta MD = MD_2 - MD_1
   $$
   
2. **Subtended Angle (α):**
   $$
   \cos(\alpha) = \cos(\theta_2 - \theta_1) - \sin(\theta_1)\sin(\theta_2)[1 - \cos(\phi_2 - \phi_1)]
   $$
   *Where θ represents Inclination and φ represents Azimuth.*
   
   
   
3. **Ratio Factor (F):**
   $$
   F = \frac{2}{\alpha} \tan\left(\frac{\alpha}{2}\right) \quad (\text{For } \alpha \to 0, \, F = 1)
   $$
   
4. **Coordinate Accumulation:**
   $$
   \Delta TVD = \frac{\Delta MD}{2}[\cos(\theta_1) + \cos(\theta_2)] \cdot F
   $$
   
   $$
   \Delta Northing \, (\Delta Y) = \frac{\Delta MD}{2}[\sin(\theta_1)\cos(\phi_1) + \sin(\theta_2)\cos(\phi_2)] \cdot F
   $$
   
   $$
   \Delta Easting \, (\Delta X) = \frac{\Delta MD}{2}[\sin(\theta_1)\sin(\phi_1) + \sin(\theta_2)\sin(\phi_2)] \cdot F
   $$



## 5. Administrative Panel & Data Management

An authenticated Admin Panel provides operations to manage database records:
* **Dataset Management**: High-level structural CRUD capabilities over database entities (deleting bad logs, migrating legacy well structures, importing bulk datasets).
* **User Profiles**: Access control tools defining default interface parameters, role definitions (Admin vs. Engineer), and security boundaries.



## 6. Project Architecture & Standards

### 6.1 Repository Folder Structure

```text
├── .git/
├── .github/workflows/      # Automated deployment or validation tasks
├── data/                   # Structured storage engine housing sqlite3 database files
│   └── diabit.db           # Core application database
├── public/                 # Static graphical resources, simple minimalist logo, and favicon
├── scripts/                # Automated task scripts, version bump utilities, and setup tasks
├── src/                    # Primary source code directory
│   ├── app/                # Next.js App Router structural pages and API routes
│   ├── components/         # Reusable design architecture (Grid, Header, Sidebars, Charts)
│   ├── lib/                # Shared calculation formulas, SQLite connector hooks, and utils
│   └── styles/             # Global configurations for Tailwind CSS layout layers
├── Docs/                   # Markdown repository tracking technical workflows and architecture updates
├── AGENTS.md               # Context documentation detailing roles for AI assistants
├── Dockerfile              # Optimization deployment container build file
├── docker-compose.yml      # Orchestration instructions binding deployment to local environments
├── README.md               # Development onboarding documentation
└── package.json            # Script run-commands and frontend project definition properties
```

### 6.2 Version Control & Build Automation Rules

- **Version Standard**: Semantic Versioning using an strict `"m.n.p"` format starting at `1.0.0`. Numbers `n` and `p` are strict single digits (0-9).

- **Pre-commit Automation**: A pre-commit Git hook must trigger upon execution to automatically increment the patch version number (`p`) by `0.0.1` on every successive application build sequence.

- **Commit Message Convention**: All commit logs must be explicitly structured to match the following formatting string template:
  `v{m.n.p} Build yyyy-mm-dd-hh-mm - [Short Feature Descriptive Text]`

  
## 7. Non-Functional Requirements & Security

- **Privilege Authorization**: Full operational privileges are granted directly inside the execution workspace folder directory; no external runtime permission queries are required during script execution.
- **Technical Diary Sync**: Critical architectural adjustments, computational compromises, or edge-case handling must be continuously summarized into descriptive markdown log files stored inside the `./Docs/` sub-directory.
- **Port Availability Fallbacks**: The application defaults to network port **3032**. If occupied by alternate active local listening tasks, it automatically steps upward through subsequent open ports (`3033`, `3034`, etc.).
- **Critical Designs, implementation plans and workarounds** shall be summarized and saved into specific markdown files in ./docs subfolder and keep updated till project ends.
- **Prepare AGENTS.md, README.md** (Including at least a introduction of the DiaBit app and tech stack for this dev) and **Dockerfile**, **docker-compose.yml**
- Eventually report "**how many tokens have been costed**" and "**how many minutes have taken**" into the last part of the README.md.