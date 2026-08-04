# AlgoScope

> **Interactive step-by-step visualizations of classic DP and sorting algorithms — powered by Python (in-browser via PyScript) with an optional WebAssembly backend compiled from C++.**

[![Tests](https://github.com/vkDemon1/algoscope/actions/workflows/test.yml/badge.svg)](https://github.com/vkDemon1/algoscope/actions/workflows/test.yml)
[![Pages](https://github.com/vkDemon1/algoscope/actions/workflows/deploy.yml/badge.svg)](https://vkDemon1.github.io/algoscope/)

**[Live Demo →](https://vkDemon1.github.io/algoscope/)**

---

## What it does

AlgoScope lets you pause, step through, and rewind four algorithms one decision at a time. An **AI Instructor** panel explains each step in plain language as it happens.

| Visualizer | What you see |
|---|---|
| **0/1 Knapsack DP** | DP table filling cell-by-cell, include/exclude decisions, backtrack path to optimal items |
| **LCS Alignment DP** | Character match/mismatch decisions, diagonal transitions, reconstructed common subsequence |
| **Quick Sort (Lomuto)** | Pivot selection, scanning pointers, swap highlights, active partition boundaries, call stack |
| **Merge Sort** | Main array alongside a live temporary merge buffer, split/merge phases, call stack |

---

## Architecture — polymorphic dual backend

The same step schema is emitted by two completely independent engines. Swapping between them is a one-click toggle in the sidebar; the rendering code never changes.

```
Browser UI (HTML/CSS/JS)
        │
        ▼
┌───────────────────────┐      ┌─────────────────────────────┐
│  Python Engine        │  OR  │  C++ / WebAssembly Engine   │
│  (PyScript / Pyodide) │      │  (Emscripten, O3 optimized) │
│  algorithms.py        │      │  algorithms.cpp → .wasm      │
└───────────────────────┘      └─────────────────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        ▼
            Identical JSON step schema
            { stage, matrix/array, currentRow,
              currentCol, description, ... }
```

This design demonstrates a real software engineering pattern: the same interface contract respected by two backends in different languages, with zero UI coupling.

---

## Running locally

```bash
git clone https://github.com/vkDemon1/algoscope.git
cd algoscope

# PyScript requires a real HTTP server (CORS blocks file:// URLs)
python -m http.server 8000
```

Open **[http://localhost:8000](http://localhost:8000)**. The sidebar badge transitions to **"Engine Ready"** once Pyodide finishes loading (~3–5 s on first visit).

---

## Enabling the WebAssembly backend

The live GitHub Pages demo already has the WASM module compiled in by CI. To build it locally:

### Prerequisites

Install the [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html):

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh   # adds emcc to PATH
```

### Compile

```bash
# macOS / Linux
./compile_wasm.sh

# Windows
compile_wasm.bat
```

This creates `algorithms_wasm.js` and `algorithms_wasm.wasm` next to `index.html`. Restart your HTTP server and the WASM toggle in the sidebar becomes clickable. Switching engines is instant — the same JSON schema flows into the same renderer.

---

## Running the test suite

Both language implementations are covered by automated tests that CI runs on every push and pull request — no Emscripten SDK required.

### Python tests

```bash
pip install pytest
pytest tests/test_algorithms.py -v
```

### C++ tests (native, no Emscripten needed)

```bash
g++ -std=c++17 -O2 -Wall -o tests/test_algorithms tests/test_algorithms.cpp
./tests/test_algorithms
```

`algorithms.cpp` compiles under two modes via an `#ifdef __EMSCRIPTEN__` guard:
- **With `emcc`** — emits the WASM module with full JS bindings.
- **With plain `g++/clang++`** — compiles pure logic with no Emscripten types, directly linkable by the native test binary.

---

## Project structure

```
algoscope/
├── index.html              # Dashboard layout (sidebar, canvas, instructor panel)
├── style.css               # Cyberpunk design tokens, animations, responsive layout
├── main.js                 # Orchestrator: validation, engine dispatch, DOM rendering
├── algorithms.py           # Python visualizer engine + Pyodide FFI bindings
├── algorithms.cpp          # C++ visualizer engine + Emscripten WASM bindings
├── compile_wasm.sh         # WASM build script (macOS / Linux)
├── compile_wasm.bat        # WASM build script (Windows)
├── tests/
│   ├── test_algorithms.py  # Python test suite (pytest, 18 tests)
│   └── test_algorithms.cpp # C++ test suite (native g++, 17 checks)
└── .github/workflows/
    ├── test.yml            # CI: Python + C++ tests on every push/PR
    └── deploy.yml          # CI: compile WASM → deploy to GitHub Pages
```

---

## Input constraints

| Parameter | Limit | Reason |
|---|---|---|
| Knapsack items | ≤ 12 | DP table stays readable on-screen |
| Knapsack capacity | ≤ 50 | (items+1) × (capacity+1) cells |
| LCS string length | ≤ 15 chars each | Grid fits without horizontal scroll |
| Sort array length | ≤ 25 elements | Bar chart stays legible |

---

## Key engineering notes

- **Stale-input bug fixed:** render functions read from a parameter cache (`state.ks`, `state.lcs`) frozen at init time, not from live DOM inputs. Editing a field mid-animation cannot desync highlights or totals.
- **Inline validation:** all four initializers validate types, ranges, and counts and show errors in dedicated slots — no `alert()`.
- **Polymorphic dispatch:** `createVisualizer(kind, ...args)` routes to the active engine in one function. Adding a third backend requires changing only that function.
- **Mobile layout:** sidebar collapses to a hamburger menu below 900 px; content stacks to single-column.
- **Performance meter:** sidebar shows which engine ran and how long it took to generate all steps, making the Python vs WASM speed difference concrete.

---

## License

MIT © 2025 vkDemon1
