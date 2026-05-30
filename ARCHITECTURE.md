# Architecture Description: Tactical Analytics Engine
**Project Name:** FragLab / Tactical Analytics
**Compliance Standard:** ISO/IEC/IEEE 42010:2011
**Status:** Baseline Documentation

---

## 1. Introduction & Scope
This document provides a formal architectural description for the Tactical Analytics Engine, a high-performance web application designed for competitive gaming telemetry analysis, group management, and real-time statistics generation.

## 2. Stakeholders & Concerns
| Stakeholder | Primary Concerns |
| :--- | :--- |
| **Tournament Organizers** | Data integrity, operational speed, group/stage management. |
| **Data Analysts** | Statistical accuracy, trend identification, exportability. |
| **Developers** | Modularity, type safety, state atomicity, performance. |
| **End Users** | Visual clarity, responsive interaction, real-time feedback. |

## 3. Architecture Viewpoints

### 3.1 Functional Viewpoint (Logical Architecture)
The system is built on a **Modular Micro-SPA** architecture, where internal "Modes" operate as isolated logical units within a shared global state container.

- **Ingestion Layer**: Sanitizes raw input (CSV/JSON) into standardized `PlayerAtomic` frames.
- **League Overview Engine**: A specialized segment for multi-stage hierarchical management (Stages -> Groups -> Matches).
- **Analytics Core**: Pure functional engine responsible for ELO/Point calculations and performance metrics.
- **Visualization Tier**: High-contrast, accessibility-compliant UI components rendering processed telemetry.

### 3.2 Information Viewpoint (Data Architecture)
Data flows through three distinct states of maturity:
1. **Raw Ingest**: Unstructured string/CSV data.
2. **Atomic Schema (`MatchData`)**: Standardized telemetry with stage/group metadata tags.
3. **Aggregated Schema (`TeamData`)**: Competitive leaderboards derived via the `analyticsEngine` transformation pipeline.

### 3.3 Development Viewpoint (Structural Implementation)
```bash
/src
  ├── /components    # Functional modules (LeagueOverview, TeamProfile, etc.)
  ├── /services      # Pure logic (AnalyticsEngine, DataParsers)
  ├── /types.ts      # Domain-driven design (DDD) core interfaces
  └── /App.tsx       # Orchestration layer and view-routing
```

## 4. Architectural Rationale

### 4.1 State Atomicity (League Overview)
The "League Overview" segment implements a strict **Atomic Commit Pattern**:
- **Isolated Ingestion**: Data ingestion for "Match 1" in "Group A" does not impact or leak into other group contexts.
- **Context Preservation**: Each `MatchData` object persists its own `leagueStage` and `leagueGroup` metadata at the moment of creation, preventing retrospective corruption if the tournament structure changes.
- **Service-Oriented Logic**: Calculation logic is decoupled from state management, allowing for diverse scoring rules across different league stages.

### 4.2 Structural Hierarchy
The system follows a strict 3-tier indexing model:
1. **Stage** (e.g., Playoffs)
2. **Group** (e.g., Group 1)
3. **Sequence** (e.g., Match 1)

## 5. Decision Records (ADR)
- **ADR-001**: Use of Lucide-React for consistent visual iconography.
- **ADR-002**: Use of `useMemo` for real-time leaderboard aggregation to maintain 60FPS UI performance during large data processing.
- **ADR-003**: Selection of Tailwind CSS to minimize runtime overhead and ensure design consistency.

## 5. System Constraints
- **Runtime**: Node.js / React 18+ / Vite.
- **Styling**: Tailwind CSS (Utility-first styling for performance).
- **Ingress**: Port 3000 (Standardized container gateway).

---
*Created per AI Studio Enterprise Standards.*
