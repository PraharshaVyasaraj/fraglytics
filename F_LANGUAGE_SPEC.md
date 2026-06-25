# F Script (Frag Script) - Language Specification

## Introduction
**F** (Frag Script) is a domain-specific embeddable query and control language designed natively for **FragLab**. Born from the necessity of live esports broadcasts, F represents a reality-check on manual UI analysis—giving directors and analysts a C/R-like syntactic layer to interrogate massive streams of telemetry data instantaneously.

## 1. Core Philosophy
- **Immediacy**: Designed for the live broadcast booth. No wrestling with complex UI drop-downs. Type to query.
- **Esports Primitives**: F treats `Team`, `Player`, and `Match` as first-class, atomic data structures.
- **Data Pipelining**: Inspired by R and Elixir, F uses pipeline execution for real-time statistical sorting and filtering.

## 2. Syntax & Grammar
F feels like a blend of JavaScript (for familiarity), R (for data-frame manipulation), and completely custom global accessors (for FragLab).

### 2.1 Primitives and Types
- **Numbers**: `10`, `3.14`, `-5`
- **Strings**: `"Godlike"`, `'Aggressive'`
- **Booleans**: `true`, `false`
- **Collections**: `[1, 2, 3]`

### 2.2 Global Context Vectors
These are always available in the runtime:
- `$TEAMS` - Vector of all active `TeamData` entities.
- `$PLAYERS` - Vector of all active `PlayerDerived` entities across matches.
- `$MATCHES` - Vector of all recorded match instances.

### 2.3 Variables & Assignments
```f
let targetNum = 10;
let queryTarget = "GodL";
```

### 2.4 The Pipeline Operator `|>`
The pipeline passes the evaluated left-hand collection into the right-hand function natively.

```f
// Find Top 5 Fraggers
let mvps = $PLAYERS 
  |> filter(kills > 15)
  |> sort(damage, DESC)
  |> take(5);

emit(mvps); // Pushes the result to the UI/Broadcast Screen
```

### 2.5 Native Operations
- `filter(condition)`
- `sort(field, direction)`
- `limit(n)` or `take(n)`
- `pluck(field)` or `select(fields)`
- `sum(field)`
- `avg(field)`

## 3. Architecture Context
Within the FragLab codebase, the F script engine is an execution layer located in `services/f-script/`. 
It comprises:
1.  **Lexer**: Tokenizes raw F string inputs.
2.  **Parser**: Constructs the internal Abstract Syntax Tree (AST).
3.  **Interpreter**: Evaluates the AST nodes dynamically using the active `Tournament` session as context context.

## 4. Why This Exists? (The Reality Check)
Out of thousands of lines of UI and complex statistics canvases, the "Custom Matrix Engine" and "Strategy Simulator" are UI heavy. F Script cuts through the UI. It provides the **highest immediate value** to a director. If they want to know "Who has the highest clutch rating with over 5 kills?", building a custom UI for that specific query is bloated. F allows them to run:

`emit($PLAYERS |> filter(kills > 5) |> sort(teamClutchScore, DESC) |> take(1))`
