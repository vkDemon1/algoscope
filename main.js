// main.js - Algorithmic Execution Visualizer dashboard orchestration

let state = {
    activeTab: 'knapsack', // 'knapsack', 'lcs', 'quicksort', 'mergesort', 'dijkstra', 'editdistance'
    isPythonLoaded: false,
    isWasmLoaded: false,
    engine: 'python', // 'python' | 'wasm' — which backend generates steps
    visualizer: null,
    currentStepIdx: 0,
    totalSteps: 0,
    isPlaying: false,
    playTimeout: null,
    speed: 800, // timeout ms between steps

    // Audio & Code View options
    audioEnabled: true,
    codeLang: 'py', // 'py' | 'cpp'

    // Cached parameters from initialization
    ks: { weights: [], values: [], capacity: 0 },
    lcs: { s1: '', s2: '' },
    dijkstra: {
        rows: 10,
        cols: 15,
        grid: Array.from({ length: 10 }, () => Array(15).fill(0)),
        start: [0, 0],
        target: [9, 14],
        isPainting: false,
        paintMode: 'wall' // 'wall' | 'start' | 'target'
    },
    editdistance: { s1: '', s2: '' }
};

// --- DOM References ---
const badge = document.getElementById('loading-badge');
const terminal = document.getElementById('instructor-terminal');
const stepTracker = document.getElementById('label-step-tracker');

const navKnapsack = document.getElementById('nav-knapsack');
const navLCS = document.getElementById('nav-lcs');
const navQuickSort = document.getElementById('nav-quicksort');
const navMergeSort = document.getElementById('nav-mergesort');
const navDijkstra = document.getElementById('nav-dijkstra');
const navEditDistance = document.getElementById('nav-editdistance');

const viewKnapsack = document.getElementById('view-knapsack');
const viewLCS = document.getElementById('view-lcs');
const viewQuickSort = document.getElementById('view-quicksort');
const viewMergeSort = document.getElementById('view-mergesort');
const viewDijkstra = document.getElementById('view-dijkstra');
const viewEditDistance = document.getElementById('view-editdistance');

const configKnapsack = document.getElementById('config-knapsack');
const configLCS = document.getElementById('config-lcs');
const configQuickSort = document.getElementById('config-quicksort');
const configMergeSort = document.getElementById('config-mergesort');
const configDijkstra = document.getElementById('config-dijkstra');
const configEditDistance = document.getElementById('config-editdistance');

const playerPlay = document.getElementById('player-btn-play');
const playerPrev = document.getElementById('player-btn-prev');
const playerNext = document.getElementById('player-btn-next');
const playerReset = document.getElementById('player-btn-reset');
const btnAudioToggle = document.getElementById('btn-audio-toggle');
const sliderSpeed = document.getElementById('slider-speed');
const timelineScrubber = document.getElementById('timeline-scrubber');

const metricComparisons = document.getElementById('metric-comparisons');
const metricAccesses = document.getElementById('metric-accesses');
const metricStack = document.getElementById('metric-stack');

const engineBtnPython = document.getElementById('engine-btn-python');
const engineBtnWasm = document.getElementById('engine-btn-wasm');
const enginePerf = document.getElementById('engine-perf');

const codeViewerContent = document.getElementById('code-viewer-content');
const codeBtnPy = document.getElementById('code-btn-py');
const codeBtnCpp = document.getElementById('code-btn-cpp');

const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebarEl = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

const dpArrowsOverlay = document.getElementById('dp-arrows-overlay');
const canvasCard = document.querySelector('.canvas-card');
const canvasTooltip = document.getElementById('canvas-tooltip');


// --- Code Snippet Repository for Live Synchronized Highlight Viewer ---
const CODE_SNIPPETS = {
    knapsack: {
        py: [
            /* 1 */ "def knapsack(weights, values, capacity):",
            /* 2 */ "    n = len(weights)",
            /* 3 */ "    dp = [[0]*(capacity+1) for _ in range(n+1)]",
            /* 4 */ "    for i in range(1, n+1):",
            /* 5 */ "        for w in range(1, capacity+1):",
            /* 6 */ "            if weights[i-1] <= w:",
            /* 7 */ "                dp[i][w] = max(dp[i-1][w], values[i-1] + dp[i-1][w-weights[i-1]])",
            /* 8 */ "            else: dp[i][w] = dp[i-1][w]",
            /* 9 */ "    return dp[n][capacity]"
        ],
        cpp: [
            /* 1 */ "int knapsack(vector<int>& weights, vector<int>& values, int capacity) {",
            /* 2 */ "    int n = weights.size();",
            /* 3 */ "    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));",
            /* 4 */ "    for (int i = 1; i <= n; ++i) {",
            /* 5 */ "        for (int w = 1; w <= capacity; ++w) {",
            /* 6 */ "            if (weights[i-1] <= w)",
            /* 7 */ "                dp[i][w] = max(dp[i-1][w], values[i-1] + dp[i-1][w-weights[i-1]]);",
            /* 8 */ "            else dp[i][w] = dp[i-1][w];",
            /* 9 */ "        }",
            /* 10*/ "    }",
            /* 11*/ "    return dp[n][capacity];",
            /* 12*/ "}"
        ]
    },
    lcs: {
        py: [
            /* 1 */ "def lcs(s1, s2):",
            /* 2 */ "    m, n = len(s2), len(s1)",
            /* 3 */ "    dp = [[0]*(n+1) for _ in range(m+1)]",
            /* 4 */ "    for i in range(1, m+1):",
            /* 5 */ "        for j in range(1, n+1):",
            /* 6 */ "            if s1[j-1] == s2[i-1]:",
            /* 7 */ "                dp[i][j] = 1 + dp[i-1][j-1]",
            /* 8 */ "            else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
            /* 9 */ "    return dp[m][n]"
        ],
        cpp: [
            /* 1 */ "int lcs(string s1, string s2) {",
            /* 2 */ "    int m = s2.length(), n = s1.length();",
            /* 3 */ "    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));",
            /* 4 */ "    for (int i = 1; i <= m; ++i) {",
            /* 5 */ "        for (int j = 1; j <= n; ++j) {",
            /* 6 */ "            if (s1[j-1] == s2[i-1]) dp[i][j] = 1 + dp[i-1][j-1];",
            /* 7 */ "            else dp[i][j] = max(dp[i-1][j], dp[i][j-1]);",
            /* 8 */ "        }",
            /* 9 */ "    }",
            /* 10*/ "    return dp[m][n];",
            /* 11*/ "}"
        ]
    },
    quicksort: {
        py: [
            /* 1 */ "def quicksort(arr, low, high):",
            /* 2 */ "    if low < high:",
            /* 3 */ "        pivot = arr[high]",
            /* 4 */ "        i = low - 1",
            /* 5 */ "        for j in range(low, high):",
            /* 6 */ "            if arr[j] <= pivot:",
            /* 7 */ "                i += 1",
            /* 8 */ "                arr[i], arr[j] = arr[j], arr[i]",
            /* 9 */ "        arr[i+1], arr[high] = arr[high], arr[i+1]",
            /* 10*/ "        p = i + 1",
            /* 11*/ "        quicksort(arr, low, p - 1)",
            /* 12*/ "        quicksort(arr, p + 1, high)"
        ],
        cpp: [
            /* 1 */ "void quicksort(vector<int>& arr, int low, int high) {",
            /* 2 */ "    if (low < high) {",
            /* 3 */ "        int pivot = arr[high], i = low - 1;",
            /* 4 */ "        for (int j = low; j < high; ++j) {",
            /* 5 */ "            if (arr[j] <= pivot) {",
            /* 6 */ "                swap(arr[++i], arr[j]);",
            /* 7 */ "            }",
            /* 8 */ "        }",
            /* 9 */ "        swap(arr[i + 1], arr[high]);",
            /* 10*/ "        int p = i + 1;",
            /* 11*/ "        quicksort(arr, low, p - 1);",
            /* 12*/ "        quicksort(arr, p + 1, high);",
            /* 13*/ "    }",
            /* 14*/ "}"
        ]
    },
    mergesort: {
        py: [
            /* 1 */ "def mergesort(arr, l, r):",
            /* 2 */ "    if l < r:",
            /* 3 */ "        m = (l + r) // 2",
            /* 4 */ "        mergesort(arr, l, m)",
            /* 5 */ "        mergesort(arr, m + 1, r)",
            /* 6 */ "        merge(arr, l, m, r)"
        ],
        cpp: [
            /* 1 */ "void mergesort(vector<int>& arr, int l, int r) {",
            /* 2 */ "    if (l < r) {",
            /* 3 */ "        int m = l + (r - l) / 2;",
            /* 4 */ "        mergesort(arr, l, m);",
            /* 5 */ "        mergesort(arr, m + 1, r);",
            /* 6 */ "        merge(arr, l, m, r);",
            /* 7 */ "    }",
            /* 8 */ "}"
        ]
    },
    dijkstra: {
        py: [
            /* 1 */ "def dijkstra(grid, start, target):",
            /* 2 */ "    dist = {start: 0}",
            /* 3 */ "    pq = [(0, start)]",
            /* 4 */ "    while pq:",
            /* 5 */ "        d, u = heapq.heappop(pq)",
            /* 6 */ "        if u == target: return d",
            /* 7 */ "        for v in neighbors(u):",
            /* 8 */ "            if dist[u] + 1 < dist.get(v, inf):",
            /* 9 */ "                dist[v] = dist[u] + 1",
            /* 10*/ "                heapq.heappush(pq, (dist[v], v))",
            /* 11*/ "    return -1"
        ],
        cpp: [
            /* 1 */ "int dijkstra(Grid& grid, Node start, Node target) {",
            /* 2 */ "    dist[start] = 0;",
            /* 3 */ "    priority_queue<State> pq;",
            /* 4 */ "    pq.push({0, start});",
            /* 5 */ "    while (!pq.empty()) {",
            /* 6 */ "        auto [d, u] = pq.top(); pq.pop();",
            /* 7 */ "        if (u == target) return d;",
            /* 8 */ "        for (Node v : neighbors(u)) {",
            /* 9 */ "            if (d + 1 < dist[v]) {",
            /* 10*/ "                dist[v] = d + 1;",
            /* 11*/ "                pq.push({dist[v], v});",
            /* 12*/ "            }",
            /* 13*/ "        }",
            /* 14*/ "    }",
            /* 15*/ "    return -1;",
            /* 16*/ "}"
        ]
    },
    editdistance: {
        py: [
            /* 1 */ "def edit_distance(s1, s2):",
            /* 2 */ "    m, n = len(s2), len(s1)",
            /* 3 */ "    dp = [[0]*(n+1) for _ in range(m+1)]",
            /* 4 */ "    for i in range(1, m+1):",
            /* 5 */ "        for j in range(1, n+1):",
            /* 6 */ "            if s1[j-1] == s2[i-1]:",
            /* 7 */ "                dp[i][j] = dp[i-1][j-1]",
            /* 8 */ "            else:",
            /* 9 */ "                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])",
            /* 10*/ "    return dp[m][n]"
        ],
        cpp: [
            /* 1 */ "int edit_distance(string s1, string s2) {",
            /* 2 */ "    int m = s2.length(), n = s1.length();",
            /* 3 */ "    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));",
            /* 4 */ "    for (int i = 1; i <= m; ++i) {",
            /* 5 */ "        for (int j = 1; j <= n; ++j) {",
            /* 6 */ "            if (s1[j-1] == s2[i-1]) dp[i][j] = dp[i-1][j-1];",
            /* 7 */ "            else dp[i][j] = 1 + min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]});",
            /* 8 */ "        }",
            /* 9 */ "    }",
            /* 10*/ "    return dp[m][n];",
            /* 11*/ "}"
        ]
    }
};

// --- Web Audio Synthesizer (Sound Effects) ---
let audioCtx = null;
function playAudioTone(freqHz) {
    if (!state.audioEnabled) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqHz, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        // AudioContext disabled by browser policy
    }
}

if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
        state.audioEnabled = !state.audioEnabled;
        btnAudioToggle.innerText = state.audioEnabled ? '🔊' : '🔇';
        btnAudioToggle.title = state.audioEnabled ? 'Sound Enabled' : 'Sound Muted';
    });
}

// --- Dynamic SVG Dependency Flow Arrows (DP Visualizers) ---
let lastArrowData = null;

function clearSvgArrows() {
    lastArrowData = null;
    if (!dpArrowsOverlay) return;
    const arrows = dpArrowsOverlay.querySelectorAll('.dp-dep-arrow');
    arrows.forEach(a => a.remove());
}

function renderSvgDependencyArrows(prefix, compareCells, targetRow, targetCol) {
    clearSvgArrows();
    if (!dpArrowsOverlay || !canvasCard || !compareCells || compareCells.length === 0 || targetRow <= 0 || targetCol < 0) {
        return;
    }

    lastArrowData = { prefix, compareCells, targetRow, targetCol };

    const targetEl = document.getElementById(`${prefix}-cell-${targetRow}-${targetCol}`);
    if (!targetEl) return;

    const cardRect = canvasCard.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    if (targetRect.width === 0 || targetRect.height === 0) return;

    const tx = targetRect.left + targetRect.width / 2 - cardRect.left;
    const ty = targetRect.top + targetRect.height / 2 - cardRect.top;

    compareCells.forEach(([sr, sc], idx) => {
        const sourceEl = document.getElementById(`${prefix}-cell-${sr}-${sc}`);
        if (!sourceEl) return;

        const sourceRect = sourceEl.getBoundingClientRect();
        if (sourceRect.width === 0 || sourceRect.height === 0) return;

        const sx = sourceRect.left + sourceRect.width / 2 - cardRect.left;
        const sy = sourceRect.top + sourceRect.height / 2 - cardRect.top;

        if (Math.abs(sx - tx) < 4 && Math.abs(sy - ty) < 4) return;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const isBranchIncluded = idx === 1;
        path.setAttribute('class', `dp-dep-arrow ${isBranchIncluded ? 'branch-included' : ''}`);
        path.setAttribute('marker-end', isBranchIncluded ? 'url(#arrowhead-cyan)' : 'url(#arrowhead)');

        const dx = tx - sx;
        const dy = ty - sy;
        const cx1 = sx + dx * 0.15;
        const cy1 = sy + dy * 0.7;
        const cx2 = sx + dx * 0.75;
        const cy2 = ty - (dy > 0 ? 5 : -5);

        path.setAttribute('d', `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`);
        dpArrowsOverlay.appendChild(path);
    });
}

function triggerArrowRedraw() {
    if (lastArrowData) {
        renderSvgDependencyArrows(lastArrowData.prefix, lastArrowData.compareCells, lastArrowData.targetRow, lastArrowData.targetCol);
    }
}

window.addEventListener('resize', triggerArrowRedraw);
document.querySelectorAll('.dp-table-scroll').forEach(scroller => {
    scroller.addEventListener('scroll', triggerArrowRedraw, { passive: true });
});

// --- Glassmorphic Floating Inspection Tooltip ---
function initCanvasTooltips() {
    if (!canvasTooltip) return;

    document.addEventListener('mousemove', (e) => {
        if (!canvasTooltip.classList.contains('active')) return;
        canvasTooltip.style.left = `${e.clientX}px`;
        canvasTooltip.style.top = `${e.clientY}px`;
    });

    document.addEventListener('mouseover', (e) => {
        const target = e.target;
        
        // 1. Hovering a DP Grid Cell
        const gridCell = target.closest('.grid-cell');
        if (gridCell && gridCell.id) {
            const parts = gridCell.id.split('-');
            if (parts.length >= 4) {
                const prefix = parts[0];
                const r = parseInt(parts[2]);
                const c = parseInt(parts[3]);
                const val = gridCell.innerText.trim();

                let algoTitle = prefix === 'ks' ? '0/1 Knapsack DP' : (prefix === 'lcs' ? 'LCS Alignment DP' : 'Edit Distance DP');
                let cellRole = 'Computed Sub-problem';
                if (gridCell.classList.contains('calculating')) cellRole = 'Active Evaluation';
                else if (gridCell.classList.contains('comparing')) cellRole = 'Candidate Source Cell';
                else if (gridCell.classList.contains('backtrack')) cellRole = 'Optimal Backtrack Solution';

                canvasTooltip.innerHTML = `
                    <div class="tt-title"><span>⊞</span> ${algoTitle}</div>
                    <div class="tt-detail">Cell Coordinate: <b class="tt-val">dp[${r}][${c}]</b></div>
                    <div class="tt-detail">Stored Value: <b class="tt-val">${val}</b></div>
                    <div class="tt-tag" style="background: rgba(0,229,255,0.15); color: var(--accent-cyan);">${cellRole}</div>
                `;
                canvasTooltip.classList.add('active');
                canvasTooltip.style.left = `${e.clientX}px`;
                canvasTooltip.style.top = `${e.clientY}px`;
                return;
            }
        }

        // 2. Hovering a Sorting Bar
        const bar = target.closest('.bar');
        if (bar && bar.parentElement) {
            const val = bar.querySelector('.bar-label') ? bar.querySelector('.bar-label').innerText : '';
            const allBars = Array.from(bar.parentElement.querySelectorAll('.bar'));
            const idx = allBars.indexOf(bar);

            let status = 'Unsorted Element';
            if (bar.classList.contains('pivot')) status = 'Partition Pivot';
            else if (bar.classList.contains('iptr')) status = 'Left Pointer (i)';
            else if (bar.classList.contains('jptr')) status = 'Scanning Pointer (j)';
            else if (bar.classList.contains('swapped')) status = 'Swapping Elements';
            else if (bar.classList.contains('sorted')) status = 'Sorted In-Place';

            canvasTooltip.innerHTML = `
                <div class="tt-title"><span>📊</span> Array Bar [Index ${idx}]</div>
                <div class="tt-detail">Element Value: <b class="tt-val">${val}</b></div>
                <div class="tt-tag" style="background: rgba(255,193,7,0.15); color: var(--accent-yellow);">${status}</div>
            `;
            canvasTooltip.classList.add('active');
            canvasTooltip.style.left = `${e.clientX}px`;
            canvasTooltip.style.top = `${e.clientY}px`;
            return;
        }

        // 3. Hovering a Dijkstra Grid Cell
        const dCell = target.closest('.d-cell');
        if (dCell && dCell.dataset.r !== undefined) {
            const r = dCell.dataset.r;
            const c = dCell.dataset.c;
            const dist = dCell.innerText.trim();

            let role = 'Unexplored Empty Cell';
            if (dCell.classList.contains('cell-start')) role = 'Start Source Node (0, 0)';
            else if (dCell.classList.contains('cell-target')) role = 'Target Destination Node';
            else if (dCell.classList.contains('cell-wall')) role = 'Impassable Obstacle Wall';
            else if (dCell.classList.contains('cell-path')) role = 'Optimal Shortest Path Trail';
            else if (dCell.classList.contains('cell-curr')) role = 'Currently Expanding (PQ Min)';
            else if (dCell.classList.contains('cell-visited')) role = 'Settled Visited Node';

            canvasTooltip.innerHTML = `
                <div class="tt-title"><span>🧭</span> Dijkstra Grid Node (${r}, ${c})</div>
                <div class="tt-detail">Tentative Distance: <b class="tt-val">${dist}</b></div>
                <div class="tt-tag" style="background: rgba(0,230,118,0.15); color: var(--accent-green);">${role}</div>
            `;
            canvasTooltip.classList.add('active');
            canvasTooltip.style.left = `${e.clientX}px`;
            canvasTooltip.style.top = `${e.clientY}px`;
            return;
        }

        // Outside interactive areas
        canvasTooltip.classList.remove('active');
    });

    document.addEventListener('mouseleave', () => {
        canvasTooltip.classList.remove('active');
    });
}

initCanvasTooltips();


// --- PyScript Lifecycle Bindings ---
window.onPythonLoaded = function() {
    if (state.isPythonLoaded) return;
    state.isPythonLoaded = true;
    badge.innerHTML = '<span>Engine Ready</span>';
    badge.className = 'loading-badge ready';
    console.log("JavaScript: PyScript Engine loaded successfully!");
    initKnapsack();
    updateCodeViewer();
};

if (window.createKnapsackVisualizer) {
    window.onPythonLoaded();
} else {
    updateCodeViewer();
}

// --- WASM Lifecycle Bindings ---
window.onWasmLoaded = function() {
    if (state.isWasmLoaded) return;
    state.isWasmLoaded = true;
    engineBtnWasm.disabled = false;
    engineBtnWasm.title = 'Switch to the C++ / WebAssembly engine';
    console.log("JavaScript: WebAssembly module loaded successfully!");
};

window.onWasmUnavailable = function() {
    if (engineBtnWasm) {
        engineBtnWasm.disabled = true;
        engineBtnWasm.title = 'WASM module not built. Run compile_wasm.sh (or .bat), see README.';
    }
};

if (window.Module && window.Module.calledRun) {
    window.onWasmLoaded();
}

// --- Engine Toggle (Python vs WASM) ---
engineBtnPython.addEventListener('click', () => setEngine('python'));
engineBtnWasm.addEventListener('click', () => setEngine('wasm'));

function setEngine(engine) {
    if (engine === state.engine) return;
    if (engine === 'wasm' && !state.isWasmLoaded) return;
    if (engine === 'python' && !state.isPythonLoaded) return;

    state.engine = engine;
    engineBtnPython.classList.toggle('active', engine === 'python');
    engineBtnWasm.classList.toggle('active', engine === 'wasm');

    reinitActiveTab();
}

function reinitActiveTab() {
    if (state.activeTab === 'knapsack') initKnapsack();
    else if (state.activeTab === 'lcs') initLCS();
    else if (state.activeTab === 'quicksort') initQuickSort();
    else if (state.activeTab === 'mergesort') initMergeSort();
    else if (state.activeTab === 'dijkstra') initDijkstra();
    else if (state.activeTab === 'editdistance') initEditDistance();
}

function activeEngineReady() {
    return state.engine === 'wasm' ? state.isWasmLoaded : state.isPythonLoaded;
}

// Polymorphic Factory Dispatcher
function createVisualizer(kind, ...args) {
    const t0 = performance.now();
    let result;

    if (state.engine === 'wasm' && state.isWasmLoaded) {
        if (kind === 'knapsack') result = new Module.KnapsackVisualizer(...args);
        else if (kind === 'lcs') result = new Module.LCSVisualizer(...args);
        else if (kind === 'quicksort') result = new Module.QuickSortVisualizer(...args);
        else if (kind === 'mergesort') result = new Module.MergeSortVisualizer(...args);
        else if (kind === 'dijkstra') result = new Module.DijkstraVisualizer(...args);
        else if (kind === 'editdistance') result = new Module.EditDistanceVisualizer(...args);
    } else {
        if (kind === 'knapsack') result = window.createKnapsackVisualizer(...args);
        else if (kind === 'lcs') result = window.createLCSVisualizer(...args);
        else if (kind === 'quicksort') result = window.createQuickSortVisualizer(...args);
        else if (kind === 'mergesort') result = window.createMergeSortVisualizer(...args);
        else if (kind === 'dijkstra') result = window.createDijkstraVisualizer(...args);
        else if (kind === 'editdistance') result = window.createEditDistanceVisualizer(...args);
    }

    const elapsed = (performance.now() - t0).toFixed(2);
    if (enginePerf && result) {
        const engineLabel = (state.engine === 'wasm' && state.isWasmLoaded) ? 'WASM' : 'Python';
        enginePerf.textContent = `${engineLabel} generated ${result.get_total_steps()} steps in ${elapsed}ms`;
    }
    return result;
}

// Validation helpers
function showConfigError(tab, message) {
    const el = document.getElementById(`config-error-${tab}`);
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
}

function clearConfigError(tab) {
    const el = document.getElementById(`config-error-${tab}`);
    if (!el) return;
    el.style.display = 'none';
    el.textContent = '';
}

function parseNumberList(rawValue) {
    const tokens = rawValue.split(',').map(x => x.trim()).filter(x => x !== '');
    const numbers = tokens.map(Number);
    return { tokens, numbers };
}

// Tab Switcher
navKnapsack.addEventListener('click', () => switchTab('knapsack'));
navLCS.addEventListener('click', () => switchTab('lcs'));
navQuickSort.addEventListener('click', () => switchTab('quicksort'));
navMergeSort.addEventListener('click', () => switchTab('mergesort'));
navDijkstra.addEventListener('click', () => switchTab('dijkstra'));
navEditDistance.addEventListener('click', () => switchTab('editdistance'));

function switchTab(tab) {
    closeMobileSidebar();
    clearSvgArrows();
    if (state.activeTab === tab) return;
    pause();
    state.activeTab = tab;

    [navKnapsack, navLCS, navQuickSort, navMergeSort, navDijkstra, navEditDistance].forEach(btn => btn && btn.classList.remove('active'));
    [viewKnapsack, viewLCS, viewQuickSort, viewMergeSort, viewDijkstra, viewEditDistance].forEach(view => view && view.classList.remove('active'));
    [configKnapsack, configLCS, configQuickSort, configMergeSort, configDijkstra, configEditDistance].forEach(cfg => cfg && (cfg.style.display = 'none'));

    if (tab === 'knapsack') {
        navKnapsack.classList.add('active');
        viewKnapsack.classList.add('active');
        configKnapsack.style.display = 'block';
        if (activeEngineReady()) initKnapsack();
    } else if (tab === 'lcs') {
        navLCS.classList.add('active');
        viewLCS.classList.add('active');
        configLCS.style.display = 'block';
        if (activeEngineReady()) initLCS();
    } else if (tab === 'quicksort') {
        navQuickSort.classList.add('active');
        viewQuickSort.classList.add('active');
        configQuickSort.style.display = 'block';
        if (activeEngineReady()) initQuickSort();
    } else if (tab === 'mergesort') {
        navMergeSort.classList.add('active');
        viewMergeSort.classList.add('active');
        configMergeSort.style.display = 'block';
        if (activeEngineReady()) initMergeSort();
    } else if (tab === 'dijkstra') {
        navDijkstra.classList.add('active');
        viewDijkstra.classList.add('active');
        configDijkstra.style.display = 'block';
        if (activeEngineReady()) initDijkstra();
    } else if (tab === 'editdistance') {
        navEditDistance.classList.add('active');
        viewEditDistance.classList.add('active');
        configEditDistance.style.display = 'block';
        if (activeEngineReady()) initEditDistance();
    }

    updateCodeViewer();
}

// Mobile sidebar controls
function openMobileSidebar() {
    sidebarEl.classList.add('mobile-open');
    sidebarBackdrop.classList.add('visible');
}
function closeMobileSidebar() {
    sidebarEl.classList.remove('mobile-open');
    sidebarBackdrop.classList.remove('visible');
}
if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

// Simulation Controls
playerPlay.addEventListener('click', togglePlay);
playerNext.addEventListener('click', nextStep);
playerPrev.addEventListener('click', prevStep);
playerReset.addEventListener('click', reset);
sliderSpeed.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    state.speed = 1550 - value;
});

if (timelineScrubber) {
    timelineScrubber.addEventListener('input', (e) => {
        pause();
        const stepIdx = parseInt(e.target.value, 10);
        state.currentStepIdx = stepIdx;
        renderStep(stepIdx);
    });
}

function togglePlay() {
    if (!state.visualizer || state.totalSteps === 0) return;
    if (state.isPlaying) pause(); else play();
}

function play() {
    if (state.currentStepIdx >= state.totalSteps - 1) state.currentStepIdx = 0;
    state.isPlaying = true;
    playerPlay.innerHTML = '⏸';
    playerPlay.title = 'Pause Simulation';
    runLoop();
}

function runLoop() {
    if (!state.isPlaying) return;
    renderStep(state.currentStepIdx);
    if (state.currentStepIdx < state.totalSteps - 1) {
        state.currentStepIdx++;
        state.playTimeout = setTimeout(runLoop, state.speed);
    } else {
        pause();
    }
}

function pause() {
    state.isPlaying = false;
    playerPlay.innerHTML = '▶';
    playerPlay.title = 'Play Simulation';
    if (state.playTimeout) {
        clearTimeout(state.playTimeout);
        state.playTimeout = null;
    }
}

function nextStep() {
    if (!state.visualizer || state.totalSteps === 0) return;
    pause();
    if (state.currentStepIdx < state.totalSteps - 1) {
        state.currentStepIdx++;
        renderStep(state.currentStepIdx);
    }
}

function prevStep() {
    if (!state.visualizer || state.totalSteps === 0) return;
    pause();
    if (state.currentStepIdx > 0) {
        state.currentStepIdx--;
        renderStep(state.currentStepIdx);
    }
}

function reset() {
    if (!state.visualizer || state.totalSteps === 0) return;
    pause();
    state.currentStepIdx = 0;
    renderStep(0);
}

// Code Viewer Controls
if (codeBtnPy) {
    codeBtnPy.addEventListener('click', () => {
        state.codeLang = 'py';
        codeBtnPy.classList.add('active');
        codeBtnCpp.classList.remove('active');
        updateCodeViewer();
    });
}
if (codeBtnCpp) {
    codeBtnCpp.addEventListener('click', () => {
        state.codeLang = 'cpp';
        codeBtnCpp.classList.add('active');
        codeBtnPy.classList.remove('active');
        updateCodeViewer();
    });
}

function updateCodeViewer(activeLineNum = 1) {
    if (!codeViewerContent) return;
    const snippetObj = CODE_SNIPPETS[state.activeTab] || CODE_SNIPPETS.knapsack;
    const lines = snippetObj[state.codeLang] || snippetObj.py;

    let html = '';
    lines.forEach((lineText, idx) => {
        const lineNo = idx + 1;
        const isHighlight = lineNo === activeLineNum;
        html += `<span class="code-line ${isHighlight ? 'line-highlight' : ''}">${lineNo.toString().padStart(2, ' ')} | ${escapeHtml(lineText)}</span>`;
    });
    codeViewerContent.innerHTML = html;
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- 1. Knapsack Dynamic Programming Visualizer ---
const ksWeightsInput = document.getElementById('input-ks-weights');
const ksValuesInput = document.getElementById('input-ks-values');
const ksCapacityInput = document.getElementById('input-ks-capacity');
const btnKsInit = document.getElementById('btn-ks-init');
const ksChipsContainer = document.getElementById('ks-chips-container');
const ksTable = document.getElementById('ks-table');
const ksStatCapacity = document.getElementById('ks-stat-capacity');
const ksStatWeight = document.getElementById('ks-stat-weight');
const ksStatValue = document.getElementById('ks-stat-value');

const KS_MAX_ITEMS = 12;
const KS_MAX_CAPACITY = 50;

if (btnKsInit) btnKsInit.addEventListener('click', initKnapsack);

function initKnapsack() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('knapsack');

    const { tokens: wTokens, numbers: weights } = parseNumberList(ksWeightsInput.value);
    const { tokens: vTokens, numbers: values } = parseNumberList(ksValuesInput.value);
    const capacity = parseInt(ksCapacityInput.value, 10);

    if (wTokens.length === 0 || vTokens.length === 0) {
        showConfigError('knapsack', 'Enter at least one item (a weight and a value).');
        return;
    }
    if (weights.length !== values.length) {
        showConfigError('knapsack', `Weights (${weights.length}) and values (${values.length}) must have the same count.`);
        return;
    }
    if (weights.length > KS_MAX_ITEMS) {
        showConfigError('knapsack', `Limit to ${KS_MAX_ITEMS} items or fewer so the DP table stays readable.`);
        return;
    }
    if (weights.some(w => !Number.isInteger(w) || w <= 0)) {
        showConfigError('knapsack', 'Weights must be positive whole numbers.');
        return;
    }
    if (values.some(v => !Number.isInteger(v) || v < 0)) {
        showConfigError('knapsack', 'Values must be zero or positive whole numbers.');
        return;
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
        showConfigError('knapsack', 'Capacity must be a positive whole number.');
        return;
    }
    if (capacity > KS_MAX_CAPACITY) {
        showConfigError('knapsack', `Capacity is capped at ${KS_MAX_CAPACITY} to keep the table happy.`);
        return;
    }

    try {
        state.visualizer = createVisualizer('knapsack', weights, values, capacity);
        state.totalSteps = state.visualizer.get_total_steps();
        state.currentStepIdx = 0;
        state.ks = { weights, values, capacity };

        buildKnapsackGrid(weights, values, capacity);
        renderStep(0);
    } catch (e) {
        showConfigError('knapsack', `Initialization error: ${e.message || e}`);
    }
}

function buildKnapsackGrid(weights, values, capacity) {
    ksChipsContainer.innerHTML = '';
    weights.forEach((wt, idx) => {
        const val = values[idx];
        const chip = document.createElement('div');
        chip.className = 'item-chip';
        chip.id = `ks-chip-${idx}`;
        chip.innerHTML = `
            <span class="chip-name">Item ${idx+1}</span>
            <span class="chip-sub">Wt: ${wt} | Val: $${val}</span>
        `;
        ksChipsContainer.appendChild(chip);
    });

    ksTable.innerHTML = '';
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th style="width: 130px;">Items \\ Capacity</th>`;
    for (let w = 0; w <= capacity; ++w) {
        headerRow.innerHTML += `<th class="col-header">w=${w}</th>`;
    }
    ksTable.appendChild(headerRow);

    const row0 = document.createElement('tr');
    row0.innerHTML = `<td class="row-header">ø (Base Case)</td>`;
    for (let w = 0; w <= capacity; ++w) {
        row0.innerHTML += `<td id="ks-cell-0-${w}" class="grid-cell">0</td>`;
    }
    ksTable.appendChild(row0);

    weights.forEach((wt, idx) => {
        const row = document.createElement('tr');
        row.id = `ks-row-item-${idx}`;
        row.innerHTML = `<td class="row-header">Item ${idx+1} (w=${wt})</td>`;
        for (let w = 0; w <= capacity; ++w) {
            row.innerHTML += `<td id="ks-cell-${idx+1}-${w}" class="grid-cell">-</td>`;
        }
        ksTable.appendChild(row);
    });

    ksStatCapacity.innerText = capacity;
    ksStatWeight.innerText = '0';
    ksStatValue.innerText = '$0';
}

function renderKnapsackStep(stepData) {
    const { matrix, currentRow, currentCol, compareCells, selectedItems, description } = stepData;
    const { weights, values, capacity } = state.ks;

    weights.forEach((_, idx) => {
        const chip = document.getElementById(`ks-chip-${idx}`);
        if (!chip) return;
        chip.classList.remove('active', 'selected');
        if (selectedItems.includes(idx)) chip.classList.add('selected');
        else if (idx + 1 === currentRow) chip.classList.add('active');
    });

    matrix.forEach((row, r) => {
        row.forEach((val, c) => {
            const cell = document.getElementById(`ks-cell-${r}-${c}`);
            if (!cell) return;

            cell.className = 'grid-cell';
            if (val !== null) {
                cell.innerText = val;
                cell.classList.add('filled');
            } else {
                cell.innerText = '-';
            }

            if (r === currentRow && c === currentCol) cell.classList.add('calculating');
            if (compareCells.some(([cr, cc]) => cr === r && cc === c)) cell.classList.add('comparing');
        });
    });

    if (selectedItems.length > 0) {
        const totalWt = selectedItems.reduce((sum, idx) => sum + weights[idx], 0);
        const totalVal = selectedItems.reduce((sum, idx) => sum + values[idx], 0);
        ksStatWeight.innerText = `${totalWt} / ${capacity}`;
        ksStatValue.innerText = `$${totalVal}`;
    } else {
        ksStatWeight.innerText = '0';
        ksStatValue.innerText = '$0';
    }

    terminal.innerHTML = description;
    playAudioTone(200 + (currentCol * 15));
}

// --- 2. Longest Common Subsequence Visualizer ---
const lcsS1Input = document.getElementById('input-lcs-s1');
const lcsS2Input = document.getElementById('input-lcs-s2');
const btnLcsInit = document.getElementById('btn-lcs-init');
const lcsTable = document.getElementById('lcs-table');
const lcsStatS1 = document.getElementById('lcs-stat-s1');
const lcsStatS2 = document.getElementById('lcs-stat-s2');
const lcsStatLen = document.getElementById('lcs-stat-len');
const lcsRibbonText = document.getElementById('lcs-ribbon-text');

const LCS_MAX_LEN = 15;

if (btnLcsInit) btnLcsInit.addEventListener('click', initLCS);

function initLCS() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('lcs');

    const s1 = lcsS1Input.value.trim();
    const s2 = lcsS2Input.value.trim();

    if (!s1 || !s2) {
        showConfigError('lcs', 'Both string inputs are required.');
        return;
    }
    if (s1.length > LCS_MAX_LEN || s2.length > LCS_MAX_LEN) {
        showConfigError('lcs', `String lengths are capped at ${LCS_MAX_LEN} characters.`);
        return;
    }

    try {
        state.visualizer = createVisualizer('lcs', s1, s2);
        state.totalSteps = state.visualizer.get_total_steps();
        state.currentStepIdx = 0;
        state.lcs = { s1, s2 };

        buildLCSGrid(s1, s2);
        renderStep(0);
    } catch (e) {
        showConfigError('lcs', `Initialization error: ${e.message || e}`);
    }
}

function buildLCSGrid(s1, s2) {
    lcsTable.innerHTML = '';
    const m = s2.length;
    const n = s1.length;

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th>s2 \\ s1</th><th class="col-header">ø</th>`;
    for (let j = 0; j < n; ++j) {
        headerRow.innerHTML += `<th id="lcs-col-head-${j}" class="col-header">${s1[j]}</th>`;
    }
    lcsTable.appendChild(headerRow);

    const row0 = document.createElement('tr');
    row0.innerHTML = `<td class="row-header">ø</td>`;
    for (let j = 0; j <= n; ++j) {
        row0.innerHTML += `<td id="lcs-cell-0-${j}" class="grid-cell">0</td>`;
    }
    lcsTable.appendChild(row0);

    for (let i = 0; i < m; ++i) {
        const row = document.createElement('tr');
        row.innerHTML = `<td id="lcs-row-head-${i}" class="row-header">${s2[i]}</td>`;
        for (let j = 0; j <= n; ++j) {
            row.innerHTML += `<td id="lcs-cell-${i+1}-${j}" class="grid-cell">-</td>`;
        }
        lcsTable.appendChild(row);
    }

    lcsStatS1.innerText = s1;
    lcsStatS2.innerText = s2;
    lcsStatLen.innerText = '0';
    lcsRibbonText.innerText = '-';
}

function renderLCSStep(stepData) {
    const { matrix, currentRow, currentCol, compareCells, backtrackPath, lcsSequence, description } = stepData;
    const { s1, s2 } = state.lcs;

    for (let j = 0; j < s1.length; ++j) {
        const head = document.getElementById(`lcs-col-head-${j}`);
        if (head) head.classList.remove('matched-char');
    }
    for (let i = 0; i < s2.length; ++i) {
        const head = document.getElementById(`lcs-row-head-${i}`);
        if (head) head.classList.remove('matched-char');
    }

    matrix.forEach((row, r) => {
        row.forEach((val, c) => {
            const cell = document.getElementById(`lcs-cell-${r}-${c}`);
            if (!cell) return;

            cell.className = 'grid-cell';
            if (val !== null) {
                cell.innerText = val;
                cell.classList.add('filled');
            } else {
                cell.innerText = '-';
            }

            if (r === currentRow && c === currentCol) cell.classList.add('calculating');
            if (compareCells.some(([cr, cc]) => cr === r && cc === c)) cell.classList.add('comparing');
            if (backtrackPath.some(([br, bc]) => br === r && bc === c)) cell.classList.add('backtrack');
        });
    });

    lcsStatLen.innerText = lcsSequence ? lcsSequence.length : '0';
    lcsRibbonText.innerText = lcsSequence ? `"${lcsSequence}"` : '-';
    terminal.innerHTML = description;
    playAudioTone(300 + (currentRow * 20));
}

// --- 3. Quick Sort Visualizer ---
const qsArrInput = document.getElementById('input-qs-arr');
const qsSizeInput = document.getElementById('input-qs-size');
const btnQsRandom = document.getElementById('btn-qs-random');
const btnQsInit = document.getElementById('btn-qs-init');
const qsChart = document.getElementById('qs-chart');
const qsStack = document.getElementById('qs-stack');

const SORT_MAX_LEN = 25;

if (btnQsRandom) btnQsRandom.addEventListener('click', () => randomizeArray(qsSizeInput, qsArrInput, initQuickSort));
if (btnQsInit) btnQsInit.addEventListener('click', initQuickSort);

function initQuickSort() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('quicksort');

    const { tokens, numbers: array } = parseNumberList(qsArrInput.value);

    if (tokens.length === 0) {
        showConfigError('quicksort', 'Enter at least one number.');
        return;
    }
    if (array.length > SORT_MAX_LEN) {
        showConfigError('quicksort', `Limit array to ${SORT_MAX_LEN} elements or fewer.`);
        return;
    }
    if (array.some(x => isNaN(x))) {
        showConfigError('quicksort', 'All items must be numbers.');
        return;
    }

    try {
        state.visualizer = createVisualizer('quicksort', array);
        state.totalSteps = state.visualizer.get_total_steps();
        state.currentStepIdx = 0;

        renderStep(0);
    } catch (e) {
        showConfigError('quicksort', `Initialization error: ${e.message || e}`);
    }
}

function renderQuickSortStep(stepData) {
    const { array, pivotIdx, iPtr, jPtr, activeRange, swapped, sortedIndices, recursionStack, description } = stepData;

    qsChart.innerHTML = '';
    const maxVal = Math.max(...array, 1);

    array.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.className = 'bar';

        const height = (val / maxVal) * 90 + 5;
        bar.style.height = `${height}%`;
        bar.innerHTML = `<span class="bar-label">${val}</span>`;

        if (idx === pivotIdx) bar.classList.add('pivot');
        if (idx === iPtr) bar.classList.add('iptr');
        if (idx === jPtr) bar.classList.add('jptr');
        if (swapped.includes(idx)) bar.classList.add('swapped');
        if (sortedIndices.includes(idx)) bar.classList.add('sorted');
        if (activeRange[0] !== -1 && (idx < activeRange[0] || idx > activeRange[1])) bar.classList.add('inactive');

        qsChart.appendChild(bar);
    });

    qsStack.innerHTML = '';
    if (recursionStack.length === 0) {
        qsStack.innerHTML = '<span class="stack-none">Stack Empty</span>';
    } else {
        recursionStack.forEach(([low, high]) => {
            const frame = document.createElement('span');
            frame.className = 'stack-item';
            frame.innerText = `qs(${low}, ${high})`;
            qsStack.appendChild(frame);
        });
    }

    terminal.innerHTML = description;
    playAudioTone(150 + (array[0] || 0) * 10);
}

// --- 4. Merge Sort Visualizer ---
const msArrInput = document.getElementById('input-ms-arr');
const msSizeInput = document.getElementById('input-ms-size');
const btnMsRandom = document.getElementById('btn-ms-random');
const btnMsInit = document.getElementById('btn-ms-init');
const msChartMain = document.getElementById('ms-chart-main');
const msChartHelper = document.getElementById('ms-chart-helper');
const msStack = document.getElementById('ms-stack');

if (btnMsRandom) btnMsRandom.addEventListener('click', () => randomizeArray(msSizeInput, msArrInput, initMergeSort));
if (btnMsInit) btnMsInit.addEventListener('click', initMergeSort);

function initMergeSort() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('mergesort');

    const { tokens, numbers: array } = parseNumberList(msArrInput.value);

    if (tokens.length === 0) {
        showConfigError('mergesort', 'Enter at least one number.');
        return;
    }
    if (array.length > SORT_MAX_LEN) {
        showConfigError('mergesort', `Limit array to ${SORT_MAX_LEN} elements or fewer.`);
        return;
    }
    if (array.some(x => isNaN(x))) {
        showConfigError('mergesort', 'All items must be numbers.');
        return;
    }

    try {
        state.visualizer = createVisualizer('mergesort', array);
        state.totalSteps = state.visualizer.get_total_steps();
        state.currentStepIdx = 0;

        renderStep(0);
    } catch (e) {
        showConfigError('mergesort', `Initialization error: ${e.message || e}`);
    }
}

function renderMergeSortStep(stepData) {
    const { array, tempArray, activeRange, sortedIndices, recursionStack, description } = stepData;

    msChartMain.innerHTML = '';
    msChartHelper.innerHTML = '';

    const maxVal = Math.max(...array.concat(tempArray.filter(x => x !== null)), 1);

    array.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.className = 'bar';

        const height = (val / maxVal) * 90 + 5;
        bar.style.height = `${height}%`;
        bar.innerHTML = `<span class="bar-label">${val}</span>`;

        const [low, high] = activeRange;
        const inRange = low !== -1 && idx >= low && idx <= high;

        if (sortedIndices.includes(idx)) bar.classList.add('sorted');
        else if (low !== -1 && !inRange) bar.classList.add('inactive');

        if (inRange) bar.classList.add('active-range');
        msChartMain.appendChild(bar);
    });

    tempArray.forEach((val, idx) => {
        const placeholder = document.createElement('div');
        placeholder.style.flex = '1';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'flex-end';
        placeholder.style.justifyContent = 'center';

        if (val === null) {
            const empty = document.createElement('div');
            empty.className = 'bar-empty';
            placeholder.appendChild(empty);
        } else {
            const bar = document.createElement('div');
            bar.className = 'bar merging';
            const height = (val / maxVal) * 90 + 5;
            bar.style.height = `${height}%`;
            bar.innerHTML = `<span class="bar-label">${val}</span>`;
            placeholder.appendChild(bar);
        }
        msChartHelper.appendChild(placeholder);
    });

    msStack.innerHTML = '';
    if (recursionStack.length === 0) {
        msStack.innerHTML = '<span class="stack-none">Stack Empty</span>';
    } else {
        recursionStack.forEach(([l, h]) => {
            const frame = document.createElement('span');
            frame.className = 'stack-item';
            frame.innerText = `ms(${l}, ${h})`;
            msStack.appendChild(frame);
        });
    }

    terminal.innerHTML = description;
    playAudioTone(220 + (array[0] || 0) * 8);
}

// --- 5. Dijkstra Shortest Path Visualizer ---
const btnDijkstraInit = document.getElementById('btn-dijkstra-init');
const btnDijkstraClearWalls = document.getElementById('btn-dijkstra-clear-walls');
const btnDijkstraRandomWalls = document.getElementById('btn-dijkstra-random-walls');
const dijkstraGridEl = document.getElementById('dijkstra-grid');
const dijkstraStatStart = document.getElementById('dijkstra-stat-start');
const dijkstraStatTarget = document.getElementById('dijkstra-stat-target');
const dijkstraStatVisited = document.getElementById('dijkstra-stat-visited');
const dijkstraStatDist = document.getElementById('dijkstra-stat-dist');

if (btnDijkstraInit) btnDijkstraInit.addEventListener('click', initDijkstra);
if (btnDijkstraClearWalls) btnDijkstraClearWalls.addEventListener('click', () => {
    state.dijkstra.grid = Array.from({ length: 10 }, () => Array(15).fill(0));
    buildDijkstraGridDOM();
    initDijkstra();
});
if (btnDijkstraRandomWalls) btnDijkstraRandomWalls.addEventListener('click', () => {
    state.dijkstra.grid = Array.from({ length: 10 }, () => Array(15).fill(0).map(() => Math.random() < 0.28 ? 1 : 0));
    // Keep start and target clear
    const [sr, sc] = state.dijkstra.start;
    const [tr, tc] = state.dijkstra.target;
    state.dijkstra.grid[sr][sc] = 0;
    state.dijkstra.grid[tr][tc] = 0;
    buildDijkstraGridDOM();
    initDijkstra();
});

function initDijkstra() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('dijkstra');

    const { grid, start, target } = state.dijkstra;
    buildDijkstraGridDOM();

    try {
        state.visualizer = createVisualizer('dijkstra', grid, start, target);
        state.totalSteps = state.visualizer.get_total_steps();
        state.currentStepIdx = 0;

        renderStep(0);
    } catch (e) {
        showConfigError('dijkstra', `Initialization error: ${e.message || e}`);
    }
}

function buildDijkstraGridDOM() {
    if (!dijkstraGridEl) return;
    dijkstraGridEl.innerHTML = '';
    const { rows, cols, grid, start, target } = state.dijkstra;

    for (let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {
            const cell = document.createElement('div');
            cell.className = 'd-cell';
            cell.id = `d-cell-${r}-${c}`;
            cell.dataset.r = r;
            cell.dataset.c = c;

            if (r === start[0] && c === start[1]) {
                cell.classList.add('cell-start');
                cell.innerText = 'S';
            } else if (r === target[0] && c === target[1]) {
                cell.classList.add('cell-target');
                cell.innerText = 'T';
            } else if (grid[r][c] === 1) {
                cell.classList.add('cell-wall');
            } else {
                cell.innerText = '∞';
            }

            // Mouse painting events
            cell.addEventListener('mousedown', (e) => {
                e.preventDefault();
                state.dijkstra.isPainting = true;
                toggleGridWall(r, c);
            });
            cell.addEventListener('mouseenter', () => {
                if (state.dijkstra.isPainting) toggleGridWall(r, c);
            });

            dijkstraGridEl.appendChild(cell);
        }
    }

    document.addEventListener('mouseup', () => {
        state.dijkstra.isPainting = false;
    });

    dijkstraStatStart.innerText = `(${start[0]}, ${start[1]})`;
    dijkstraStatTarget.innerText = `(${target[0]}, ${target[1]})`;
    dijkstraStatVisited.innerText = '0';
    dijkstraStatDist.innerText = '-';
}

function toggleGridWall(r, c) {
    const { start, target, grid } = state.dijkstra;
    if ((r === start[0] && c === start[1]) || (r === target[0] && c === target[1])) return;
    grid[r][c] = grid[r][c] === 1 ? 0 : 1;
    const cell = document.getElementById(`d-cell-${r}-${c}`);
    if (cell) {
        cell.classList.toggle('cell-wall', grid[r][c] === 1);
        cell.innerText = grid[r][c] === 1 ? '' : '∞';
    }
}

function renderDijkstraStep(stepData) {
    const { grid, distances, visited, currentNode, path, description } = stepData;
    const { start, target, rows, cols } = state.dijkstra;

    let visitedCount = 0;
    for (let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {
            const cell = document.getElementById(`d-cell-${r}-${c}`);
            if (!cell) continue;

            cell.className = 'd-cell';
            const isStart = r === start[0] && c === start[1];
            const isTarget = r === target[0] && c === target[1];
            const isWall = grid[r][c] === 1;
            const isCurr = currentNode && currentNode[0] === r && currentNode[1] === c;
            const isVisited = visited && visited[r] && visited[r][c];
            const isPath = path && path.some(([pr, pc]) => pr === r && pc === c);

            if (isVisited) visitedCount++;

            if (isStart) { cell.classList.add('cell-start'); cell.innerText = 'S'; }
            else if (isTarget) { cell.classList.add('cell-target'); cell.innerText = 'T'; }
            else if (isWall) { cell.classList.add('cell-wall'); cell.innerText = ''; }
            else if (isPath) { cell.classList.add('cell-path'); cell.innerText = distances[r][c]; }
            else if (isCurr) { cell.classList.add('cell-curr'); cell.innerText = distances[r][c]; }
            else if (isVisited) { cell.classList.add('cell-visited'); cell.innerText = distances[r][c]; }
            else {
                const distVal = distances[r][c];
                cell.innerText = distVal === -1 ? '∞' : distVal;
            }
        }
    }

    dijkstraStatVisited.innerText = visitedCount;
    const targetDist = distances[target[0]][target[1]];
    dijkstraStatDist.innerText = targetDist === -1 ? '-' : targetDist;
    terminal.innerHTML = description;
    playAudioTone(250 + (currentNode ? currentNode[0] * 30 + currentNode[1] * 10 : 0));
}

// --- 6. Edit Distance (Levenshtein DP) Visualizer ---
const edS1Input = document.getElementById('input-ed-s1');
const edS2Input = document.getElementById('input-ed-s2');
const btnEdInit = document.getElementById('btn-ed-init');
const edTable = document.getElementById('ed-table');
const edStatS1 = document.getElementById('ed-stat-s1');
const edStatS2 = document.getElementById('ed-stat-s2');
const edStatDist = document.getElementById('ed-stat-dist');
const edRibbonText = document.getElementById('ed-ribbon-text');

const ED_MAX_LEN = 15;

if (btnEdInit) btnEdInit.addEventListener('click', initEditDistance);

function initEditDistance() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('editdistance');

    const s1 = edS1Input.value.trim();
    const s2 = edS2Input.value.trim();

    if (!s1 || !s2) {
        showConfigError('editdistance', 'Enter both source and target strings.');
        return;
    }
    if (s1.length > ED_MAX_LEN || s2.length > ED_MAX_LEN) {
        showConfigError('editdistance', `String lengths are capped at ${ED_MAX_LEN} characters.`);
        return;
    }

    try {
        state.visualizer = createVisualizer('editdistance', s1, s2);
        state.totalSteps = state.visualizer.get_total_steps();
        state.currentStepIdx = 0;
        state.editdistance = { s1, s2 };

        buildEditDistanceGrid(s1, s2);
        renderStep(0);
    } catch (e) {
        showConfigError('editdistance', `Initialization error: ${e.message || e}`);
    }
}

function buildEditDistanceGrid(s1, s2) {
    if (!edTable) return;
    edTable.innerHTML = '';
    const m = s2.length;
    const n = s1.length;

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th>s2 \\ s1</th><th class="col-header">ø</th>`;
    for (let j = 0; j < n; ++j) {
        headerRow.innerHTML += `<th class="col-header">${s1[j]}</th>`;
    }
    edTable.appendChild(headerRow);

    const row0 = document.createElement('tr');
    row0.innerHTML = `<td class="row-header">ø</td>`;
    for (let j = 0; j <= n; ++j) {
        row0.innerHTML += `<td id="ed-cell-0-${j}" class="grid-cell">${j}</td>`;
    }
    edTable.appendChild(row0);

    for (let i = 0; i < m; ++i) {
        const row = document.createElement('tr');
        row.innerHTML = `<td class="row-header">${s2[i]}</td>`;
        for (let j = 0; j <= n; ++j) {
            row.innerHTML += `<td id="ed-cell-${i+1}-${j}" class="grid-cell">${j === 0 ? i+1 : '-'}</td>`;
        }
        edTable.appendChild(row);
    }

    edStatS1.innerText = s1;
    edStatS2.innerText = s2;
    edStatDist.innerText = '0';
    edRibbonText.innerText = '-';
}

function renderEditDistanceStep(stepData) {
    const { matrix, currentRow, currentCol, compareCells, backtrackPath, operations, description } = stepData;

    matrix.forEach((row, r) => {
        row.forEach((val, c) => {
            const cell = document.getElementById(`ed-cell-${r}-${c}`);
            if (!cell) return;

            cell.className = 'grid-cell';
            if (val !== null) {
                cell.innerText = val;
                cell.classList.add('filled');
            } else {
                cell.innerText = '-';
            }

            if (r === currentRow && c === currentCol) cell.classList.add('calculating');
            if (compareCells && compareCells.some(([cr, cc]) => cr === r && cc === c)) cell.classList.add('comparing');
            if (backtrackPath && backtrackPath.some(([br, bc]) => br === r && bc === c)) cell.classList.add('backtrack');
        });
    });

    const finalVal = matrix[state.editdistance.s2.length][state.editdistance.s1.length];
    edStatDist.innerText = finalVal !== null ? finalVal : '0';
    edRibbonText.innerText = operations && operations.length > 0 ? operations.join(' ➔ ') : '-';
    terminal.innerHTML = description;
    playAudioTone(280 + (currentRow * 25));
}

// --- Helper Functions & Universal Render Step ---
function randomizeArray(sizeInput, arrayInput, onComplete) {
    let size = parseInt(sizeInput.value) || 10;
    size = Math.min(Math.max(size, 1), SORT_MAX_LEN);
    const arr = [];
    for (let i = 0; i < size; ++i) {
        arr.push(Math.floor(Math.random() * 45) + 5);
    }
    arrayInput.value = arr.join(', ');
    if (onComplete) onComplete();
}

function renderStep(idx) {
    if (!state.visualizer) return;

    const jsonStr = state.visualizer.get_step(idx);
    if (!jsonStr) return;

    const stepData = JSON.parse(jsonStr);

    state.currentStepIdx = idx;
    stepTracker.innerText = `Step ${idx + 1} / ${state.totalSteps}`;

    if (timelineScrubber) {
        timelineScrubber.max = state.totalSteps - 1;
        timelineScrubber.value = idx;
    }

    if (state.activeTab === 'knapsack') renderKnapsackStep(stepData);
    else if (state.activeTab === 'lcs') renderLCSStep(stepData);
    else if (state.activeTab === 'quicksort') renderQuickSortStep(stepData);
    else if (state.activeTab === 'mergesort') renderMergeSortStep(stepData);
    else if (state.activeTab === 'dijkstra') renderDijkstraStep(stepData);
    else if (state.activeTab === 'editdistance') renderEditDistanceStep(stepData);

    // Update Synchronized Code Line Highlight
    updateCodeViewer(stepData.codeLine || 1);

    // Update Metrics
    updateMetrics(stepData);
}

function updateMetrics(stepData) {
    if (!metricComparisons) return;
    const comps = (stepData.compareCells ? stepData.compareCells.length : 0) + (stepData.neighbors ? stepData.neighbors.length : 0);
    const accesses = (stepData.swapped ? stepData.swapped.length : 0) + (stepData.visited ? 1 : 0);
    const stackDepth = stepData.recursionStack ? stepData.recursionStack.length : (stepData.pq ? stepData.pq.length : 0);

    metricComparisons.innerText = (state.currentStepIdx * 2 + comps).toString();
    metricAccesses.innerText = (state.currentStepIdx + accesses).toString();
    metricStack.innerText = stackDepth.toString();
}
