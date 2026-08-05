# AlgoScope

> **Interactive step-by-step visualizations of classic DP and sorting algorithms — powered by Python (in-browser via PyScript) with an optional WebAssembly backend compiled from C++.**

[![Tests](https://github.com/vkDemon1/algoscope/actions/workflows/test.yml/badge.svg)](https://github.com/vkDemon1/algoscope/actions/workflows/test.yml)
[![Pages](https://github.com/vkDemon1/algoscope/actions/workflows/deploy.yml/badge.svg)](https://vkDemon1.github.io/algoscope/)

**[Live Demo →](https://vkDemon1.github.io/algoscope/)**

---

## Overview

**AlgoScope** is a high-performance algorithm visualizer designed to turn complex algorithm executions into intuitive, step-by-step interactive animations. It allows developers and students to pause, step through, and rewind algorithm logic one decision at a time while an **AI Instructor** panel explains every state change in natural language.

---

## Features & Visualizers

| Visualizer | Interactive Highlights | Key Outputs & State Tracking |
|---|---|---|
| **0/1 Knapsack DP** | DP table filling cell-by-cell, option evaluation (include vs. exclude), active cell comparisons | Backtrack path tracing optimal item subset, capacity utilization, maximized total value |
| **LCS Alignment DP** | Character match/mismatch decision logic, cell comparison pointers, diagonal/up/left transitions | Reconstructed Longest Common Subsequence, DP grid alignment matrix |
| **Quick Sort (Lomuto)** | Pivot selection, dual scanning pointers (`i` and `j`), active partition range bounds, swap highlights | In-place element movement, recursion call stack visualizer |
| **Merge Sort** | Split & merge phases, main array highlights, live temporary merge buffer | Divided sub-array bounds, merge buffer step-by-step insertion, call stack |

### Interactive Control Suite
- **Playback Controls**: Step Next, Step Previous, Auto-Play/Pause, and Instant Reset.
- **Speed Slider**: Adjustable playback speed (100 ms to 2000 ms per step).
- **Dual Compute Engine Toggle**: Instant switching between Python (PyScript) and C++ (WebAssembly).
- **Performance Meter**: Real-time timing metrics displaying step generation count and engine execution time in milliseconds.
- **Cyberpunk Dark UI**: Glassmorphic styling with high-contrast accent colors and fully responsive mobile drawer navigation.

---

## Architecture — Polymorphic Dual Backend

AlgoScope uses a decoupled frontend/backend architecture where two completely independent computation engines respect the **same step JSON schema contract**. Switching engines requires zero changes to the rendering pipeline or UI logic.

```
                  Browser UI (HTML5 / Vanilla CSS / JS main.js)
                                      │
                                      ▼
             ┌─────────────────────────────────────────────────┐
             │       Polymorphic Dispatcher (main.js)           │
             └────────────────────────┬────────────────────────┘
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼                                                 ▼
┌─────────────────────────┐                       ┌─────────────────────────┐
│     Python Engine       │                       │   C++ / WASM Engine     │
│   (PyScript / Pyodide)  │                       │ (Emscripten, O3 Opt)    │
│     algorithms.py       │                       │   algorithms.cpp        │
└────────────┬────────────┘                       └────────────┬────────────┘
             │                                                 │
             └────────────────────────┬────────────────────────┘
                                      ▼
                        Identical JSON Step Schema
     { stage, matrix/array, currentRow, currentCol, description, ... }
```

### Key Engineering Highlights
- **Parameter Caching Pattern**: Rendering functions read from a frozen snapshot taken at initialization time (`state.ks`, `state.lcs`), guaranteeing that mid-animation edits to input fields never desynchronize the UI highlights or math.
- **Inline Validation**: Initializers validate parameter counts, array formats, and numeric boundaries, displaying user-friendly inline messages instead of intrusive browser alerts.
- **Zero-Dependency Native Testability**: `algorithms.cpp` compiles under both `#ifdef __EMSCRIPTEN__` (for browser WASM export) and standard native C++ (for instant native unit testing).

---

## Running Locally

Since PyScript and WebAssembly fetch modules dynamically, AlgoScope requires a local HTTP server (file:// protocol is blocked by browser CORS policy).

```bash
# 1. Clone the repository
git clone https://github.com/vkDemon1/algoscope.git
cd algoscope

# 2. Start a local HTTP server
python -m http.server 8000
```

Open **[http://localhost:8000](http://localhost:8000)** in your browser. The sidebar badge will transition to **"Engine Ready"** once Pyodide finishes initializing (~3–5 seconds on first visit).

---

## Enabling the WebAssembly Backend

The live GitHub Pages demo includes pre-compiled WASM binaries built via CI. To build the WebAssembly module locally:

### 1. Install Emscripten SDK

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh   # Adds emcc to PATH
```

### 2. Compile C++ to WASM

```bash
# macOS / Linux
./compile_wasm.sh

# Windows (PowerShell / Command Prompt)
compile_wasm.bat
```

This generates `algorithms_wasm.js` and `algorithms_wasm.wasm` in the root directory. Refresh your local server page, and the **WASM** toggle button in the sidebar will activate automatically.

---

## Running the Automated Test Suite

AlgoScope includes unit tests covering all four algorithms across both Python and C++ implementations.

### Python Tests (Pytest)

```bash
pip install pytest
pytest tests/test_algorithms.py -v
```
*(Runs 18 unit tests checking textbook cases, edge cases, single elements, duplicates, and step schema structure).*

### C++ Tests (Native - No Emscripten SDK Required)

```bash
# Compile and run native test runner
g++ -std=c++17 -O2 -Wall -o tests/test_algorithms tests/test_algorithms.cpp
./tests/test_algorithms
```
*(Executes 17 native assertion checks covering algorithm outputs, sorted state invariants, and step generation).*

---

## Input Constraints

| Parameter | Recommended Limit | Technical Reason |
|---|---|---|
| **Knapsack Items** | ≤ 12 items | Prevents matrix vertical overcrowding on standard displays |
| **Knapsack Capacity** | ≤ 50 units | Table dimension `(N+1) × (W+1)` fits cleanly without excessive scrolling |
| **LCS String Length** | ≤ 15 characters | Ensures cell contents remain crisp on smaller viewports |
| **Sorting Array Length** | ≤ 25 elements | Keeps bar charts readable with clear index labels |

---

## Project Structure

```
algoscope/
├── index.html              # Main application shell (sidebar, canvas, instructor terminal)
├── style.css               # Cyberpunk design system, responsive layouts, glassmorphism
├── main.js                 # Frontend orchestrator: validation, state machine, DOM renderers
├── algorithms.py           # Python visualizer engine & Pyodide FFI bindings
├── algorithms.cpp          # C++ visualizer engine & Emscripten WASM bindings
├── compile_wasm.sh         # WASM compilation script (macOS / Linux)
├── compile_wasm.bat        # WASM compilation script (Windows)
├── tests/
│   ├── test_algorithms.py  # Python test suite (pytest - 18 tests)
│   └── test_algorithms.cpp # Native C++ test runner (17 assertions)
└── .github/workflows/
    ├── test.yml            # CI pipeline: Runs Python & C++ tests on push/PR
    └── deploy.yml          # CD pipeline: Compiles WASM & deploys to GitHub Pages
```

---

## License

MIT © 2025 [vkDemon1](https://github.com/vkDemon1)
