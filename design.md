# FragLab - Design & Architecture Document

## 1. Overview
**FragLab** is a professional-grade eSports analytics platform designed for competitive Battle Royale tournaments. It handles raw telemetry ingestion (via CSV or AI vision), computes advanced analytics, and features a specialized broadcast graphics generator (PNG/Creative Studio) to produce live-ready aesthetic assets.

---

## 2. Image Export Architecture (PNG / Creative Studio)

The "PNG Studio" (internally encompassing `BroadcastStudio` and `ExportRenderer`) is the core engine for generating deployable social and broadcast graphics.

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

---

## 5. Professional Creative Studio Suite (Advanced Design Architecture)

The high-performance **Creative Studio Panel** introduces real-time, non-destructive image production controls mimicking native Photoshop and Illustrator desktop features directly within the web rendering container:

### 5.1 Vector Path Controls (Pen Tool & Mathematical Anchors)
- **Mathematical SVG Injection**: Renders a lossless vector layer on top of the DOM export canvas mapping bezier curves (`Q`, `C` commands) and anchor point positions.
- **Perfect Scalability**: SVG shapes possess infinite resolution. When extracted via `html2canvas`, paths remain perfectly anti-aliased with no pixel blurring or artifacting under high zoom multipliers.
- **Overlay Node Modes**: Includes preset anchor configurations like `tech_nodes` (geometric coordinates and loop parameters), `crosshair_grids` (tactical target alignment grids), and `brutalist_bracket` (industrial cropping outlines).

### 5.2 Non-Destructive Effector Stack (Layers & Adjustment Filters)
- **Active Filter Chaining**: Avoids destructive pixel alteration by applying real-time procedural color-grading directly on the container element via custom CSS standard filters:
  - `Contrast` & `Saturation` multipliers applied to deep nested child objects.
  - **Procedural Grain Noise Layer**: Generates native fractal SVG noise algorithms on a separate, high-depth overlay to add organic texture.
  - **Vignette Layer overlay**: Applies physical radial gradient filters to frame high-contrast text and stats gracefully.

### 5.3 Advanced Style Presets & Component Management
- **Linked Asset Presets**: Selecting a master style preset (e.g. `Esports Pro`, `Editorial Clean`, `Cyberpunk Glitch`) executes a batch operational transaction, updating all spacing, typography tracking, leading, and effects overlays across every active layout instantly.
- **Global Typography Control**: Implements micro-typography adjustments including tracking (uniform letter-spacing), leading (exact vertical line heights per aspect ratio), and hardware kerning/ligature rendering to meet precise corporate brand guidelines.

### 5.4 Virtual Color Profile Simulations (RGB, CMYK, Pantone PMS)
- **Ink Gamut Proofing**: Digital displays operate inside standard RGB (emitted light), while print-press uses subtractive CMYK (ink on paper). The Creative Studio provides interactive gamut-proofing overlays:
  - **sRGB Web**: Native high-intensity RGB space for online screens and live streams.
  - **Press CMYK**: Simulates Standard Coated FOGRA39 print inks by clip-limiting high-saturation neons and applying targeted desaturations, ensuring the exported asset matches physically printed outputs.
  - **Pantone Formula Solid Spot (PMS)**: Proofs and aligns colors to standardized ink matching systems for professional industrial distribution.

