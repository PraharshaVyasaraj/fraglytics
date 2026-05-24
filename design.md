# FragLab - Design & Architecture Document

## 1. Overview
**FragLab** is a professional-grade eSports analytics platform designed for competitive Battle Royale tournaments. It handles raw telemetry ingestion (via CSV or AI vision), computes advanced analytics, and features a specialized broadcast graphics generator (PNG/Creative Studio) to produce live-ready aesthetic assets.

---

## 2. Image Export Architecture (PNG / Creative Studio)

The "PNG Studio" (internally encompassing `BroadcastStudio`, `BatchExportManager`, and `ExportRenderer`) is the core engine for generating deployable social and broadcast graphics.

### 2.1 The Rendering Pipeline (`html2canvas`)
The platform uses `html2canvas` to serialize live React DOM nodes into a binary Canvas representation, which is then converted to a downloadable PNG.

**Crucial Constraints & Efficiency Rules:**
1. **DOM Determinism**: Elements to be exported must be rendered in the exact dimensions they will appear. `html2canvas` calculates styles linearly; therefore, using `window.innerWidth` or fluid `%` heights in the export payload can cause visual drift.
2. **Animation Suspension (`isExporting` Flag)**: When an export is triggered, the `isExporting` flag MUST be propagated down the tree. This disables Framer Motion, Recharts animations (e.g., `<Radar isAnimationActive={!isExporting} />`), and CSS transitions. Failure to do so captures intermediate animation frames (e.g., half-drawn charts).
3. **CSS Property Caveats**:
   - `backdrop-filter: blur()` forces heavy CPU/GPU compositing and is historically slow/buggy in `html2canvas`. Where an export is stalling, transparent alpha hexes (e.g., `bg-black/90`) should replace heavy backdrop blurs.
   - SVGs with `filter: drop-shadow()` can cause coordinate offset bugs across devices. Prefer standard CSS `drop-shadow` on a wrapper `div` or SVG native glow definitions `<filter>`.
4. **Font Loading State**: Ensure `document.fonts.ready` is verified before triggering the canvas snap. Attempting to export before web fonts (e.g., Space Grotesk) render will trigger a layout shift mid-capture or result in standard Arial fallbacks.
5. **Image Queuing**: Base64 encoded SVGs and external cross-origin images must be allowed to load via `useCORS: true` internally in the html2canvas payload.

### 2.2 Studio Component Hierarchy
- **Control Panel (`BroadcastStudio.tsx` / `CreativeStudio`)**: The interactive studio bay. Manages the visual composition state (Theme, Layout, Aspect Ratio, Selected Entities) and acts as the orchestrator. Contains the canvas extraction logic.
- **The Orchestrator (`BatchExportManager.tsx`)**: Handles mass-rendering (e.g., exporting 16 team cards sequentially). It enforces a strict `await` cycle (minimum 500ms delay) between generating images to prevent memory heap exhaustion and allow the React reconciler to flush DOM updates.
- **The Payload (`ExportRenderer.tsx`)**: The execution context. This is a **pure, stateless, deterministic component**. It takes `data`, `theme`, and `visualConfig` props and builds a rigid, absolute-positioned container for `html2canvas` to target (via `id="export-container"`).

### 2.3 Visual Design System
The studio enforces strict separation of structure and style:

**Aspect Ratios & Dimensions:**
We enforce explicit discrete bounding boxes to guarantee pixel-perfect standard exports, avoiding layout shifts:
- `16:9` (1920x1080) - Main Broadcast
- `4:3` (1440x1080) - Standard iPad / Data Panels
- `1:1` (1080x1080) - Instagram / Square Feed
- `9:16` (1080x1920) - TikTok / Reels / Shorts Format

**Layout Modes (The "Skeleton"):**
- `statistics`: Dense data grids and radar charts; analytical.
- `classic`: Standard esports broadcast style (thick borders, heavy gradients).
- `cyber_glitch`: Neon underground wireframes, noise overlays, high-contrast typography.
- `minimal`: Editorial design, massive negative space, strict typography alignment.
- `paper`: Light-mode focus, monochromatic physical structures.
- `neon`: Wireframe glow, transparent interiors.

**Themes (The "Skin"):**
- `slate`, `violet`, `tactical`.
- A dynamic `visualConfig` layer interpolates mathematically based on the active Layout and Theme, scaling `padding`, `itemSpacing`, `fontScale`, and `headerScale` proportionally avoiding media-query breakpoint spaghetti in the static export frame.

---

## 3. Data Models (`types.ts`)
The application's data architecture uses a progressive aggregation model:
1. **`PlayerAtomic`**: Rawest match data (Kills, Damage, Survival Time).
2. **`PlayerDerived`**: Extrapolated metrics (Z-Scores, Impact Score, Clutch Rating).
3. **`TeamMatchStats`**: Match performance aggregated by the team roster.
4. **`TeamData`**: Cumulative tournament data (Rolling averages, DNA/Radar signatures).
5. **`Snapshot`**: Deep-frozen state containing raw matches, rules, and aesthetic parameters.

---

## 4. Core Engines

### 4.1 Analytics Engine (`services/analyticsEngine.ts`)
- **Metric Rolling**: Aggregates `MatchData` into `TeamData`.
- **Advanced Taxonomy**: Calculates semantic "Carry Classes" (e.g., `HARD_CARRY`, `SYSTEM_COLLAPSE`) based on positional standard deviations vs the operational mean.
- **Monte Carlo Predictor**: Runs 1,000+ stochastic simulations based on tournament history variance to chart real-time win probability densities.

### 4.2 Export Engine (`services/exportEngine.ts`)
Maintains data tabular portability. Responsible for serializing to Master Excel sheets, Raw Telemetry CSVs, and localized Clipboard buffers via `xlsx`.

### 4.3 AI Ingestion Service (`services/gemini.ts`)
Implements the `@google/genai` SDK to ingest raw scoreboard photography or OCR streams, enforcing extraction into rigid `PlayerAtomic` JSON arrays via deterministic schema prompting.
