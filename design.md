# ScarFall Analytics Suite - Design Document

## 1. Overview
**ScarFall Analytics Suite** is a professional-grade eSports analytics platform designed specifically for Battle Royale tournaments. It allows tournament organizers, commissioners, and analysts to ingest raw match telemetry (via manual CSV or AI-powered image/text parsing), aggregate statistics, and generate deep tactical insights.

The application is built to handle complex scoring rules, provide advanced player/team metrics (like Clutch Rating, Support Rating, and Z-Scores), and generate broadcast-ready assets and comprehensive data exports.

## 2. Architecture
The application follows a full-stack architecture optimized for deployment in a containerized environment (like Google Cloud Run).

### Frontend
- **Framework**: React 19 with Vite.
- **Styling**: Tailwind CSS for a tactical, dark-mode aesthetic.
- **Icons**: Lucide React.
- **Charts**: Recharts for data visualization.
- **Routing**: Custom state-based routing utilizing the browser's History API (`popstate`) to manage views without a heavy router library.

### Backend
- **Server**: Express.js (`server.ts`) running on Node.js.
- **Authentication**: Google OAuth 2.0 flow. The backend handles the OAuth callback, fetches user info, and issues a JWT stored in an HTTP-only, secure cookie. Access is restricted to a specific allowed email address.
- **Static Serving**: In production, the Express server serves the built Vite SPA from the `dist/` directory.

### AI Integration
- **Provider**: Google Gemini (`@google/genai`).
- **Usage**: The Gemini API is used to parse raw scoreboard images, PDFs, or unstructured text into structured atomic player statistics.

## 3. Data Models (`types.ts`)
The application's data architecture is built around a progressive aggregation model:

1. **`PlayerAtomic`**: The rawest form of data. Represents a single player's performance in a single match (Kills, Assists, Damage, Survival Time, Team Rank).
2. **`PlayerDerived`**: Extends `PlayerAtomic` with calculated metrics for that match (Damage Per Minute, Damage Share, Impact Score, Clutch Rating, Support Rating, Z-Scores, Carry Class).
3. **`TeamMatchStats`**: Aggregates `PlayerDerived` data for a specific team in a specific match. Calculates total points based on the active `ScoringRules`.
4. **`MatchData`**: Represents a single match, containing metadata (Day, Match Number) and an array of `TeamMatchStats`.
5. **`TeamData`**: The highest level of aggregation. Represents a team's cumulative performance across the entire tournament or a filtered scope. Includes rolling averages, trends, and aggregated player histories.
6. **`Session` / `Snapshot`**: Represents the entire state of the tournament, including raw matches, scoring rules, and branding configuration. Can be exported and imported as a JSON file.

## 4. Core Engines

### Analytics Engine (`services/analyticsEngine.ts`)
The heart of the application. It handles:
- **Match Processing**: Converts `PlayerAtomic` to `TeamMatchStats` by applying the current `ScoringRules` (Placement Points + Kill Multiplier).
- **Tournament Aggregation**: Rolls up `MatchData` into `TeamData`. Handles team name normalization and alias resolution.
- **Advanced Metrics**: Calculates standard deviations, Z-Scores for damage and kills, Efficiency Ratings, Aggression Indices, and categorizes players into "Carry Classes" (e.g., `HARD_CARRY`, `SYSTEM_COLLAPSE`).
- **Predictive Modeling**: Includes a Monte Carlo simulation engine (`runMonteCarloSimulation`) to predict tournament outcomes and win probabilities based on historical variance.

### Export Engine (`services/exportEngine.ts`)
Handles data portability:
- **Excel/CSV**: Generates Master Excel workbooks, Raw Telemetry CSVs, Audit CSVs, and Standings CSVs using the `xlsx` library.
- **JSON**: Generates comprehensive JSON payloads for API integration or state backups (Snapshots).
- **Clipboard Bridge**: Formats data for easy copy-pasting into Google Sheets or Excel.

### Gemini Service (`services/gemini.ts`)
Handles AI-driven data ingestion:
- **`extractScoreboardImages`**: Sends images to Gemini with a strict JSON schema to extract player stats. Includes retry logic and exponential backoff for resilience against API limits.
- **`parseRawData`**: Parses unstructured text into the same atomic JSON structure.

## 5. UI Components & Features

The UI is divided into two main workflow steps: **Ingestion** and **Analysis**.

### Ingestion Step
- **`DataInput`**: The entry point. Users can upload JSON Snapshots, paste raw text, upload images for AI parsing, or manually enter data via a grid interface.

### Analysis Step (Dashboard)
- **Scope Navigation**: Users can view data for the entire tournament, a specific day, or a single match.
- **`WinnerShowcase` & `MVPHighlight`**: Prominent displays for the current leader and the most valuable player.
- **`PointsTable`**: The main leaderboard, sortable by various metrics.
- **`OperatorLeaderboard`**: A detailed table of individual player statistics.
- **`Analytics`**: Visual charts showing team performance trends, damage distribution, and efficiency.
- **`Faceoff`**: A tool to compare two teams head-to-head.
- **`PredictionWidget`**: Displays the results of the Monte Carlo simulations.
- **`MatchList`**: A timeline of all matches played.

### Detail Views
- **`TeamProfile`**: Deep dive into a specific team's roster, history, and advanced metrics.
- **`PlayerProfile`**: Deep dive into a specific player's performance over time.

### Tools & Modals
- **`BroadcastStudio`**: A specialized view designed to generate clean, branded graphics (Standings, MVP Cards, Top Fraggers) for use in live broadcasts or social media. Uses `html-to-image`.
- **`DataNexus`**: The central hub for triggering exports (Excel, CSV, JSON).
- **`CommissionerModal`**: Allows admins to adjust scoring rules (points per kill, placement points) on the fly. The app instantly recalculates all standings.
- **`AgencySettings`**: Configuration for tournament branding (Org Name, Colors, Logos).
- **`PressKitModal`**: Generates a PDF summary of the tournament using `jspdf`.

## 6. State Management & Data Flow
The application utilizes React state heavily in `App.tsx`.
1. **Raw Data**: `rawMatches` holds the immutable truth of what happened in the games.
2. **Rules & Scope**: `scoringRules` and `viewScope` dictate how the data should be interpreted.
3. **Memoized Computation**: A `useMemo` hook takes `rawMatches`, applies `scoringRules` via `recalculateMatchScores`, filters by `viewScope`, and then runs `aggregateTournamentStats`. This ensures the UI is always perfectly in sync with the rules and filters without mutating the raw data.
4. **Snapshots**: The entire state (`rawMatches`, `scoringRules`, `brandingConfig`) can be serialized into a Snapshot JSON file and reloaded later, allowing for easy archiving and sharing.

## 7. Security & Authentication
- The app is protected by a custom Google OAuth implementation in `server.ts`.
- It verifies the user's email against a hardcoded `ALLOWED_EMAIL`.
- The session is managed via a secure, HTTP-only JWT cookie.
- The Vite development server is mounted as middleware in the Express app, ensuring that both API routes and frontend assets are served from the same origin (port 3000), which is crucial for the iframe environment.
