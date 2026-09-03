# AlgoScope

> **Interactive step-by-step visualizer for classic Dynamic Programming, Graph Pathfinding, and Sorting algorithms — powered by Python (in-browser via PyScript) with an optional high-performance WebAssembly backend compiled from C++.**

## 🌟 Overview

**AlgoScope** transforms complex algorithmic mechanics into intuitive, high-impact visual demonstrations. Designed for students, educators, and software engineers, AlgoScope breaks down textbook algorithms step-by-step with:
- **Synchronized real-time code highlighting** across Python and C++ source implementations.
- An **AI CS Instructor terminal** explaining every algorithmic decision, state change, and boundary condition in natural language.
- A **Dynamic Web Audio Synthesizer** with selectable soundscapes (Synthwave, 8-bit Arcade, and Soft Marimba).
- **Curated benchmark presets** for instant 1-click test cases and edge scenarios.
- **Deep-linking URL state sharing** and **instant high-resolution canvas snapshot PNG exports**.

---

## 🧩 Visualizers & Algorithms

| Algorithm | Category | Interactive Visual Highlights | Core Problem Output |
|---|---|---|---|
| **0/1 Knapsack DP** | Dynamic Programming | Dynamic SVG cubic-bezier dependency arrows linking source cells `dp[i-1][w]` and `dp[i-1][w-wt]` to the evaluating cell; candidate comparisons vs. inclusion glow | Maximized value subset, item weight selection trace, optimal backtracking path |
| **LCS Alignment DP** | Dynamic Programming | Character match/mismatch decision logic, directional comparison arrows, diagonal match flare vs. orthogonal fallback | Longest common subsequence reconstruction, complete 2D alignment matrix |
| **Quick Sort (Lomuto)** | Divide & Conquer | Dynamic spectral bar heatmaps, pointer badges (`P` for Pivot, `i` for boundary, `j` for scanning), swap burst flares, active partition ranges | In-place element permutation, active recursion stack frames |
| **Merge Sort (Buffer)** | Divide & Conquer | Recursive sub-array divide bounds, value gradient bars, animated secondary merge buffer, copyback phase highlights | Stable sorted array, live two-pointer merge order, recursion call tree |
| **Dijkstra Shortest Path** | Graph / Pathfinding | Interactive 10×15 grid canvas, draggable obstacle walls, concentric visit ripple waves (`@keyframes dijkstra-ripple`), pulsating beacon rings for Start (`S`) and Target (`T`), golden shortest path trail | Tentative distance matrix relaxation, priority queue state, visited counter |
| **Edit Distance (Levenshtein)** | Dynamic Programming | Full 2D Levenshtein cost matrix, dynamic SVG dependency arrows connecting insert/delete/substitute predecessors, minimum cost path | Optimal string alignment, chronological edit transformation log (e.g. `kitten` ➔ `sitting`) |

---

## ⚡ Comprehensive Feature Showcase

### 1. 🎨 Rich Visuals & Micro-Interactions
- **Dynamic Spectral Value Heatmaps**: Array bars in Quick Sort and Merge Sort dynamically calculate their color along a smooth cyan-to-electric-magenta spectral gradient based on their numerical magnitude.
- **Floating Pointer Badges**: Interactive badges (`P`, `i`, `j`) float directly above array elements in Lomuto Quick Sort to visualize pointer boundaries.
- **Swap Burst Flares**: Elements flare with an animated radiant glow upon being swapped in-place.
- **Dijkstra Shockwave Ripples & Beacon Pulses**: Newly settled nodes emit radiating concentric ripples, while Start and Target nodes feature continuous animated beacon pulse rings. Discovered shortest paths flow with golden illumination.
- **Dynamic SVG Dependency Flow Arrows**: Curved cubic-bezier arrows with animated dashed strokes connect parent dependency cells to evaluating cells in 0/1 Knapsack, LCS, and Edit Distance tables.
- **Glassmorphic Floating Inspection Tooltips**: Hovering over any table cell, sorting bar, or Dijkstra grid node reveals an inspection card detailing subproblem indices, values, pointer roles, or tentative distances.

### 2. ⚡ Curated Benchmark Presets Gallery
Each visualizer includes 4 curated 1-click test scenarios directly in the configuration card:
- **0/1 Knapsack**: *Textbook Standard*, *High-Value Heist (Greedy Trap)*, *Micro Budgeting*, *Equal Weights (Tiebreaker)*.
- **LCS Alignment**: *Textbook Case*, *DNA Alignment (Bioinformatics)*, *Prefix & Suffix Overlap*, *Zero Intersection (Disjoint)*.
- **Quick Sort**: *Nearly Sorted (Best Case)*, *Reverse Sorted (Worst Case $O(N^2)$)*, *Dutch Flag (Many Duplicates)*, *Random Scatter*.
- **Merge Sort**: *Sawtooth Wave*, *Nearly Sorted (Linear Split)*, *Inverted Pyramid*, *Alternating Bounds (Bimodal)*.
- **Dijkstra Shortest Path**: *Spiral Labyrinth (Winding Maze)*, *Chokepoint Bridge (Bottleneck)*, *Obstacle Islands (Clusters)*, *Open Field (Radial Expansion)*.
- **Edit Distance**: *Textbook Case (3 edits)*, *Typo Correction (2 edits)*, *DNA Mutation Alignment*, *Identity Match (0 edits)*.

### 3. 🧠 Live Educational Theory HUD & Invariant Inspector
- **Big-O Badges**: Instant summary of Time Complexity (Average & Worst Case), Auxiliary Space Complexity, and Algorithmic Paradigm.
- **Live Recurrence Relation Invariants**: Displays the mathematical recurrence formulas for DP algorithms and core partitioning invariants for divide-and-conquer algorithms.
- **Active Branch Illumination**: Dynamically highlights the exact mathematical branch actively executing for the current step (e.g. *Include* vs. *Exclude* vs. *Backtrack*).
- **Theoretical Upper Bound Gauge**: Progress track comparing total executed operations against the theoretical complexity bound.

### 4. 📍 Interactive Timeline Milestones & Scrubber Pins
- **Milestone Auto-Discovery**: AlgoScope scans generated step sequences to discover critical milestones (*Initialization*, *Calculation Start*, *Buffer Merges / Pivot Placements*, *Backtrack Reconstructions*, and *Final Completion*).
- **Interactive Scrubber Pins**: Clicking any pin instantly seeks playback directly to that step index. Pins light up with an active cyber glow as simulation playback advances.

### 5. 🔗 Shareable URL Deep-Linking & Permalinks
- **1-Click Share Button (`🔗`)**: Encodes the active algorithm and all parameters/strings/grid layouts into a URL hash fragment and copies the link to the clipboard.
- **Deep Linking**: Opening a shared permalink immediately restores the target algorithm, config inputs, and maze walls, automatically rendering the shared problem.

### 6. 📷 High-Resolution Canvas Snapshot Exporter (PNG)
- **1-Click Export (`📷`)**: Renders an offscreen 1200×760 high-resolution branded cyber report card.
- Captures AlgoScope branding, algorithm name, step counter, active compute engine badge, the full visualizer state (bars, DP table, or pathfinding grid), latest AI instructor status quote, and timestamp watermark into a downloadable PNG file.

### 7. 🎵 Web Audio Soundscape Synthesizer
- Audio cues triggered on comparisons, swaps, cell calculations, and graph relaxations.
- **Selectable Themes**:
  - **🎵 Synthwave**: Smooth sine waves with exponential envelope decay.
  - **🕹️ 8-Bit Arcade**: Square wave chiptune tones with fast 0.07s decay.
  - **🔔 Soft Marimba**: Warm triangle wave passed through a 1300 Hz resonant lowpass biquad filter.
- Quick mute/unmute toggle (`🔊` / `🔇`).

### 8. 💻 Synchronized Code Viewer
- Dual-language source viewer (Python & C++).
- Execution line highlighting with cyber glow synchronized to each step.

---

## 🏗️ Architecture — Polymorphic Dual Backend

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
     { stage, matrix/array/grid, currentRow, currentCol, description, codeLine, ... }
```

### Engineering Highlights
- **Parameter Caching Pattern**: Rendering functions read from frozen snapshots taken at initialization time (`state.ks`, `state.lcs`, `state.dijkstra`, `state.editdistance`), guaranteeing that mid-animation edits to input fields never desynchronize UI highlights or math.
- **Inline Validation**: Initializers validate parameter counts, string lengths, array formats, and numeric boundaries, displaying user-friendly inline messages instead of intrusive browser alerts.
- **Zero-Dependency Native Testability**: `algorithms.cpp` compiles under both `#ifdef __EMSCRIPTEN__` (for browser WASM export) and standard native C++ (for instant native unit testing without Emscripten).

---

## 🚀 Running Locally

Since PyScript and WebAssembly fetch modules dynamically, AlgoScope requires a local HTTP server (`file://` protocol is blocked by browser CORS policy).

```bash
# 1. Clone the repository
git clone https://github.com/vkDemon1/algoscope.git
cd algoscope

# 2. Start a local HTTP server
python -m http.server 8000
```

Open **[http://localhost:8000](http://localhost:8000)** in your browser. The sidebar badge will transition to **"Engine Ready"** once Pyodide finishes initializing (~3–5 seconds on first visit).

---

## ⚙️ Enabling the WebAssembly Backend

AlgoScope can run with the native WebAssembly engine by compiling the C++ sources using Emscripten:

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

## 🧪 Running the Automated Test Suite

AlgoScope includes comprehensive unit tests covering all six algorithms across both Python and C++ implementations.

### Python Tests

```bash
# Direct runner (no third-party dependencies required):
python tests/test_algorithms.py

# Or via pytest:
pytest tests/test_algorithms.py -v
```
*(Runs 22 unit tests verifying textbook cases, edge cases, single elements, duplicates, unreachable pathfinding, and step schema contracts).*

### C++ Tests (Native - No Emscripten SDK Required)

```bash
# Compile and run native test runner
g++ -std=c++17 -O2 -Wall -o tests/test_algorithms tests/test_algorithms.cpp
./tests/test_algorithms
```
*(Executes native assertion checks covering algorithm outputs, sorted state invariants, graph distance calculations, and step generation across all visualizers).*

---

## 📐 Input Constraints

| Parameter | Recommended Limit | Technical Reason |
|---|---|---|
| **Knapsack Items** | ≤ 12 items | Prevents matrix vertical overcrowding on standard displays |
| **Knapsack Capacity** | ≤ 50 units | Table dimension `(N+1) × (W+1)` fits cleanly without excessive scrolling |
| **LCS String Length** | ≤ 15 characters | Ensures cell contents remain crisp on smaller viewports |
| **Sorting Array Length** | ≤ 25 elements | Keeps bar charts readable with clear index and pointer labels |
| **Dijkstra Grid Canvas** | 10 × 15 grid | Balances pathfinding search space with crisp cell visibility |
| **Edit Distance Strings** | ≤ 15 characters | DP matrix `(M+1) × (N+1)` renders with full operation details |

---

## 📁 Project Structure

```
algoscope/
├── index.html              # Main application shell (sidebar, canvases, controls, code viewer, HUD)
├── style.css               # Cyberpunk design system, responsive layouts, animations, tooltips
├── main.js                 # Frontend orchestrator: state machine, audio synth, DOM renderers, presets
├── algorithms.py           # Python visualizer engine (6 algorithms) & Pyodide FFI bindings
├── algorithms.cpp          # C++ visualizer engine (6 algorithms) & Emscripten WASM bindings
├── compile_wasm.sh         # WASM compilation script (macOS / Linux)
├── compile_wasm.bat        # WASM compilation script (Windows)
├── tests/
│   ├── test_algorithms.py  # Python test suite (22 unit tests)
│   └── test_algorithms.cpp # Native C++ test runner (assertions across all 6 algorithms)
└── .github/workflows/
    ├── test.yml            # CI pipeline: Runs Python & C++ tests on push/PR
    └── deploy.yml          # CD pipeline: Compiles WASM & deploys to GitHub Pages
```

---

## 📄 License

MIT © 2025 [vkDemon1](https://github.com/vkDemon1)
