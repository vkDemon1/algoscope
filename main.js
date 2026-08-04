// main.js - Algorithmic Execution Visualizer dashboard orchestration

let state = {
    activeTab: 'knapsack', // 'knapsack', 'lcs', 'quicksort', 'mergesort'
    isPythonLoaded: false,
    isWasmLoaded: false,
    engine: 'python', // 'python' | 'wasm' — which backend generates steps
    visualizer: null,
    currentStepIdx: 0,
    totalSteps: 0,
    isPlaying: false,
    playTimeout: null,
    speed: 800, // timeout ms between steps

    // Cached parameters from the last successful "Initialize" click, keyed
    // per visualizer. Render functions read from these caches instead of
    // re-reading the raw <input> values live, so editing a field after
    // initializing (without re-clicking Initialize) can never desync the
    // stats/highlighting from what's actually being animated.
    ks: { weights: [], values: [], capacity: 0 },
    lcs: { s1: '', s2: '' },
};

// --- DOM References ---
const badge = document.getElementById('loading-badge');
const terminal = document.getElementById('instructor-terminal');
const stepTracker = document.getElementById('label-step-tracker');

const navKnapsack = document.getElementById('nav-knapsack');
const navLCS = document.getElementById('nav-lcs');
const navQuickSort = document.getElementById('nav-quicksort');
const navMergeSort = document.getElementById('nav-mergesort');

const viewKnapsack = document.getElementById('view-knapsack');
const viewLCS = document.getElementById('view-lcs');
const viewQuickSort = document.getElementById('view-quicksort');
const viewMergeSort = document.getElementById('view-mergesort');

const configKnapsack = document.getElementById('config-knapsack');
const configLCS = document.getElementById('config-lcs');
const configQuickSort = document.getElementById('config-quicksort');
const configMergeSort = document.getElementById('config-mergesort');

const playerPlay = document.getElementById('player-btn-play');
const playerPrev = document.getElementById('player-btn-prev');
const playerNext = document.getElementById('player-btn-next');
const playerReset = document.getElementById('player-btn-reset');
const sliderSpeed = document.getElementById('slider-speed');

const engineBtnPython = document.getElementById('engine-btn-python');
const engineBtnWasm = document.getElementById('engine-btn-wasm');
const enginePerf = document.getElementById('engine-perf');

const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebarEl = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

// --- PyScript Lifecycle Bindings ---
window.onPythonLoaded = function() {
    if (state.isPythonLoaded) return;
    state.isPythonLoaded = true;
    badge.innerHTML = '<span>Engine Ready</span>';
    badge.className = 'loading-badge ready';
    console.log("JavaScript: PyScript Engine has loaded successfully!");
    initKnapsack(); // Default view init (Python is the default engine)
};

if (window.createKnapsackVisualizer) {
    window.onPythonLoaded();
}

// --- WASM Lifecycle Bindings ---
// algorithms_wasm.js/.wasm only exist if compile_wasm.sh/.bat has been run
// (or the CI build produced them for the live deploy). If they're absent,
// the WASM toggle just stays disabled and the app works Python-only.
window.onWasmLoaded = function() {
    if (state.isWasmLoaded) return;
    state.isWasmLoaded = true;
    engineBtnWasm.disabled = false;
    engineBtnWasm.title = 'Switch to the C++ / WebAssembly engine';
    console.log("JavaScript: WebAssembly module has loaded successfully!");
};

window.onWasmUnavailable = function() {
    if (engineBtnWasm) {
        engineBtnWasm.disabled = true;
        engineBtnWasm.title = 'WASM module not built. Run compile_wasm.sh (or .bat) locally, see README.';
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

    // Re-run whatever tab is open with its existing inputs so the swap is
    // immediately visible — the whole point of the "polymorphic" design.
    reinitActiveTab();
}

function reinitActiveTab() {
    if (state.activeTab === 'knapsack') initKnapsack();
    else if (state.activeTab === 'lcs') initLCS();
    else if (state.activeTab === 'quicksort') initQuickSort();
    else if (state.activeTab === 'mergesort') initMergeSort();
}

function activeEngineReady() {
    return state.engine === 'wasm' ? state.isWasmLoaded : state.isPythonLoaded;
}

// Dispatches to whichever backend is currently selected. Both backends
// expose the same get_step()/get_total_steps() interface and emit the same
// JSON schema, so rendering code never needs to know which one ran.
function createVisualizer(kind, ...args) {
    const t0 = performance.now();
    let result;

    if (state.engine === 'wasm' && state.isWasmLoaded) {
        if (kind === 'knapsack') result = new Module.KnapsackVisualizer(...args);
        else if (kind === 'lcs') result = new Module.LCSVisualizer(...args);
        else if (kind === 'quicksort') result = new Module.QuickSortVisualizer(...args);
        else if (kind === 'mergesort') result = new Module.MergeSortVisualizer(...args);
    } else {
        if (kind === 'knapsack') result = window.createKnapsackVisualizer(...args);
        else if (kind === 'lcs') result = window.createLCSVisualizer(...args);
        else if (kind === 'quicksort') result = window.createQuickSortVisualizer(...args);
        else if (kind === 'mergesort') result = window.createMergeSortVisualizer(...args);
    }

    const elapsed = (performance.now() - t0).toFixed(2);
    if (enginePerf && result) {
        const engineLabel = (state.engine === 'wasm' && state.isWasmLoaded) ? 'WASM' : 'Python';
        enginePerf.textContent = `${engineLabel} generated ${result.get_total_steps()} steps in ${elapsed}ms`;
    }
    return result;
}

// --- Validation helpers (inline errors instead of alert()) ---
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

// --- Tab Navigation Switcher ---
navKnapsack.addEventListener('click', () => switchTab('knapsack'));
navLCS.addEventListener('click', () => switchTab('lcs'));
navQuickSort.addEventListener('click', () => switchTab('quicksort'));
navMergeSort.addEventListener('click', () => switchTab('mergesort'));

function switchTab(tab) {
    closeMobileSidebar();
    if (state.activeTab === tab) return;
    pause();
    state.activeTab = tab;

    [navKnapsack, navLCS, navQuickSort, navMergeSort].forEach(btn => btn.classList.remove('active'));
    [viewKnapsack, viewLCS, viewQuickSort, viewMergeSort].forEach(view => view.classList.remove('active'));
    [configKnapsack, configLCS, configQuickSort, configMergeSort].forEach(cfg => cfg.style.display = 'none');

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
    }
}

// --- Mobile Sidebar Nav ---
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

// --- General Simulation Control Loops ---
playerPlay.addEventListener('click', togglePlay);
playerNext.addEventListener('click', nextStep);
playerPrev.addEventListener('click', prevStep);
playerReset.addEventListener('click', reset);
sliderSpeed.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    state.speed = 1550 - value;
});

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

btnKsInit.addEventListener('click', initKnapsack);

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
        showConfigError('knapsack', `Capacity is capped at ${KS_MAX_CAPACITY} to keep the table (and your browser) happy.`);
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

function renderKnapsackStep(data) {
    const { stage, matrix, currentRow, currentCol, compareCells, selectedItems, description } = data;
    const rows = matrix.length;
    const cols = matrix[0].length;

    for (let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {
            const cell = document.getElementById(`ks-cell-${r}-${c}`);
            if (!cell) continue;
            cell.innerText = (matrix[r][c] === null) ? '-' : matrix[r][c];
            cell.className = 'grid-cell';
            if (matrix[r][c] !== null) cell.classList.add('filled');
        }
    }

    const chips = ksChipsContainer.children;
    for (let i = 0; i < chips.length; ++i) {
        chips[i].className = 'item-chip';
    }

    if (currentRow >= 0 && currentCol >= 0) {
        const cell = document.getElementById(`ks-cell-${currentRow}-${currentCol}`);
        if (cell) {
            if (stage === 'calculation') cell.classList.add('calculating');
            if (stage.startsWith('backtracking')) cell.classList.add('backtrack');
        }
    }

    compareCells.forEach(([r, c]) => {
        const cell = document.getElementById(`ks-cell-${r}-${c}`);
        if (cell) {
            if (stage === 'calculation') cell.classList.add('comparing');
            if (stage.startsWith('backtracking')) cell.classList.add('backtrack');
        }
    });

    if (stage === 'calculation' && currentRow > 0) {
        const chip = document.getElementById(`ks-chip-${currentRow - 1}`);
        if (chip) chip.classList.add('active');
    }

    // Uses state.ks (cached at init time), not the raw inputs — see the
    // header comment for why.
    let weightSum = 0;
    let valSum = 0;
    selectedItems.forEach(idx => {
        const chip = document.getElementById(`ks-chip-${idx}`);
        if (chip) chip.classList.add('selected');
        weightSum += state.ks.weights[idx];
        valSum += state.ks.values[idx];
    });

    ksStatWeight.innerText = weightSum;
    if (stage === 'complete' && matrix[rows-1][cols-1] !== null) {
        ksStatValue.innerText = `$${matrix[rows-1][cols-1]}`;
    } else {
        ksStatValue.innerText = `$${valSum}`;
    }

    terminal.innerHTML = description;
}

// --- 2. LCS Dynamic Programming Alignment Visualizer ---
const lcsS1Input = document.getElementById('input-lcs-s1');
const lcsS2Input = document.getElementById('input-lcs-s2');
const btnLcsInit = document.getElementById('btn-lcs-init');
const lcsTable = document.getElementById('lcs-table');
const lcsRibbonText = document.getElementById('lcs-ribbon-text');
const lcsStatS1 = document.getElementById('lcs-stat-s1');
const lcsStatS2 = document.getElementById('lcs-stat-s2');
const lcsStatLen = document.getElementById('lcs-stat-len');

const LCS_MAX_LEN = 15;

btnLcsInit.addEventListener('click', initLCS);

function initLCS() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('lcs');

    const s1 = lcsS1Input.value.trim().toUpperCase();
    const s2 = lcsS2Input.value.trim().toUpperCase();

    if (s1.length === 0 || s2.length === 0) {
        showConfigError('lcs', 'Please enter values for both string inputs.');
        return;
    }
    if (s1.length > LCS_MAX_LEN || s2.length > LCS_MAX_LEN) {
        showConfigError('lcs', `String length must be ${LCS_MAX_LEN} characters or fewer for a readable grid.`);
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

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th style="width: 120px;">S2 \\ S1</th>`;
    headerRow.innerHTML += `<th class="col-header" id="lcs-col-0">ø</th>`;
    for (let j = 0; j < s1.length; ++j) {
        headerRow.innerHTML += `<th class="col-header" id="lcs-col-${j+1}">${s1[j]}</th>`;
    }
    lcsTable.appendChild(headerRow);

    const row0 = document.createElement('tr');
    row0.innerHTML = `<td class="row-header" id="lcs-row-0">ø</td>`;
    for (let j = 0; j <= s1.length; ++j) {
        row0.innerHTML += `<td id="lcs-cell-0-${j}" class="grid-cell">0</td>`;
    }
    lcsTable.appendChild(row0);

    for (let i = 0; i < s2.length; ++i) {
        const row = document.createElement('tr');
        row.innerHTML = `<td class="row-header" id="lcs-row-${i+1}">${s2[i]}</td>`;
        for (let j = 0; j <= s1.length; ++j) {
            row.innerHTML += `<td id="lcs-cell-${i+1}-${j}" class="grid-cell">-</td>`;
        }
        lcsTable.appendChild(row);
    }

    lcsStatS1.innerText = s1;
    lcsStatS2.innerText = s2;
    lcsStatLen.innerText = '0';
    lcsRibbonText.innerText = '-';
}

function renderLCSStep(data) {
    const { stage, matrix, currentRow, currentCol, compareCells, backtrackPath, lcsSequence, description } = data;
    const rows = matrix.length;
    const cols = matrix[0].length;

    for (let j = 0; j < cols; ++j) {
        const colHeader = document.getElementById(`lcs-col-${j}`);
        if (colHeader) colHeader.className = 'col-header';
    }
    for (let i = 0; i < rows; ++i) {
        const rowHeader = document.getElementById(`lcs-row-${i}`);
        if (rowHeader) rowHeader.className = 'row-header';
    }

    for (let r = 0; r < rows; ++r) {
        for (let c = 0; c < cols; ++c) {
            const cell = document.getElementById(`lcs-cell-${r}-${c}`);
            if (!cell) continue;
            cell.innerText = (matrix[r][c] === null) ? '-' : matrix[r][c];
            cell.className = 'grid-cell';
            if (matrix[r][c] !== null) cell.classList.add('filled');
        }
    }

    if (currentRow >= 0 && currentCol >= 0) {
        const cell = document.getElementById(`lcs-cell-${currentRow}-${currentCol}`);
        if (cell) {
            if (stage === 'calculation') cell.classList.add('calculating');
            if (stage.startsWith('backtracking')) cell.classList.add('backtrack');
        }
        const rowH = document.getElementById(`lcs-row-${currentRow}`);
        const colH = document.getElementById(`lcs-col-${currentCol}`);
        if (rowH) rowH.classList.add('matched-char');
        if (colH) colH.classList.add('matched-char');
    }

    compareCells.forEach(([r, c]) => {
        const cell = document.getElementById(`lcs-cell-${r}-${c}`);
        if (cell) {
            if (stage === 'calculation') cell.classList.add('comparing');
            if (stage.startsWith('backtracking')) cell.classList.add('backtrack');
        }
    });

    // Uses state.lcs (cached at init time), not the raw inputs — see the
    // header comment for why.
    backtrackPath.forEach(([r, c]) => {
        const cell = document.getElementById(`lcs-cell-${r}-${c}`);
        if (cell) cell.classList.add('backtrack');

        if (r > 0 && c > 0) {
            if (state.lcs.s1[c-1] === state.lcs.s2[r-1]) {
                const rHeader = document.getElementById(`lcs-row-${r}`);
                const cHeader = document.getElementById(`lcs-col-${c}`);
                if (rHeader) rHeader.classList.add('matched-char');
                if (cHeader) cHeader.classList.add('matched-char');
            }
        }
    });

    lcsRibbonText.innerText = lcsSequence ? lcsSequence : '-';
    lcsStatLen.innerText = lcsSequence ? lcsSequence.length : '0';
    terminal.innerHTML = description;
}

// --- 3. Quick Sort Visualizer Engine ---
const qsArrInput = document.getElementById('input-qs-arr');
const qsSizeInput = document.getElementById('input-qs-size');
const btnQsRandom = document.getElementById('btn-qs-random');
const btnQsInit = document.getElementById('btn-qs-init');
const qsChart = document.getElementById('qs-chart');
const qsStack = document.getElementById('qs-stack');

const SORT_MAX_LEN = 25;

btnQsRandom.addEventListener('click', () => randomizeArray(qsSizeInput, qsArrInput, () => initQuickSort()));
btnQsInit.addEventListener('click', initQuickSort);

function initQuickSort() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('quicksort');

    const { tokens, numbers: arr } = parseNumberList(qsArrInput.value);

    if (tokens.length === 0) {
        showConfigError('quicksort', 'Enter at least one number.');
        return;
    }
    if (arr.length > SORT_MAX_LEN) {
        showConfigError('quicksort', `Limit the array to ${SORT_MAX_LEN} elements or fewer.`);
        return;
    }
    if (arr.some(x => !Number.isInteger(x))) {
        showConfigError('quicksort', 'All values must be whole numbers.');
        return;
    }

    try {
        state.visualizer = createVisualizer('quicksort', arr);
        state.totalSteps = state.visualizer.get_total_steps();
        state.currentStepIdx = 0;

        buildBars(arr, qsChart);
        renderStep(0);
    } catch (e) {
        showConfigError('quicksort', `Initialization error: ${e.message || e}`);
    }
}

function buildBars(arr, container) {
    container.innerHTML = '';
    const max = Math.max(...arr, 1);

    arr.forEach((val, idx) => {
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.id = `${container.id}-bar-${idx}`;

        const height = (val / max) * 90 + 5;
        bar.style.height = `${height}%`;
        bar.innerHTML = `<span class="bar-label">${val}</span>`;

        barContainer.appendChild(bar);
        container.appendChild(barContainer);
    });
}

function renderQuickSortStep(data) {
    const { array, pivotIdx, leftPtr, rightPtr, activeRange, swapped, sortedIndices, recursionStack, description } = data;
    const [low, high] = activeRange;
    const max = Math.max(...array, 1);

    array.forEach((val, idx) => {
        const bar = document.getElementById(`qs-chart-bar-${idx}`);
        if (!bar) return;

        const height = (val / max) * 90 + 5;
        bar.style.height = `${height}%`;
        bar.querySelector('.bar-label').innerText = val;

        bar.className = 'bar';

        const inRange = (idx >= low && idx <= high);
        if (idx === pivotIdx) {
            bar.classList.add('pivot');
        } else if (swapped.includes(idx)) {
            bar.classList.add('swapped');
        } else if (idx === leftPtr || idx === rightPtr) {
            bar.classList.add('comparing');
        } else if (sortedIndices.includes(idx)) {
            bar.classList.add('sorted');
        } else if (low !== -1 && !inRange) {
            bar.classList.add('inactive');
        }

        if (inRange) bar.classList.add('active-range');
    });

    qsStack.innerHTML = '';
    if (recursionStack.length === 0) {
        qsStack.innerHTML = '<span class="stack-none">Stack Empty (Depth = 0)</span>';
    } else {
        recursionStack.forEach(([l, h]) => {
            const frame = document.createElement('span');
            frame.className = 'stack-item';
            frame.innerText = `qs(${l}, ${h})`;
            qsStack.appendChild(frame);
        });
    }

    terminal.innerHTML = description;
}

// --- 4. Merge Sort Visualizer Engine ---
const msArrInput = document.getElementById('input-ms-arr');
const msSizeInput = document.getElementById('input-ms-size');
const btnMsRandom = document.getElementById('btn-ms-random');
const btnMsInit = document.getElementById('btn-ms-init');
const msChartMain = document.getElementById('ms-chart-main');
const msChartHelper = document.getElementById('ms-chart-helper');
const msStack = document.getElementById('ms-stack');

btnMsRandom.addEventListener('click', () => randomizeArray(msSizeInput, msArrInput, () => initMergeSort()));
btnMsInit.addEventListener('click', initMergeSort);

function initMergeSort() {
    if (!activeEngineReady()) return;
    pause();
    clearConfigError('mergesort');

    const { tokens, numbers: arr } = parseNumberList(msArrInput.value);

    if (tokens.length === 0) {
        showConfigError('mergesort', 'Enter at least one number.');
        return;
    }
    if (arr.length > SORT_MAX_LEN) {
        showConfigError('mergesort', `Limit the array to ${SORT_MAX_LEN} elements or fewer.`);
        return;
    }
    if (arr.some(x => !Number.isInteger(x))) {
        showConfigError('mergesort', 'All values must be whole numbers.');
        return;
    }

    try {
        state.visualizer = createVisualizer('mergesort', arr);
        state.totalSteps = state.visualizer.get_total_steps();
        state.currentStepIdx = 0;

        buildBars(arr, msChartMain);
        buildHelperPlaceholder(arr.length);
        renderStep(0);
    } catch (e) {
        showConfigError('mergesort', `Initialization error: ${e.message || e}`);
    }
}

function buildHelperPlaceholder(len) {
    msChartHelper.innerHTML = '';
    for (let i = 0; i < len; ++i) {
        const container = document.createElement('div');
        container.className = 'bar-container';

        const placeholder = document.createElement('div');
        placeholder.className = 'bar-empty';
        placeholder.id = `ms-helper-placeholder-${i}`;

        container.appendChild(placeholder);
        msChartHelper.appendChild(container);
    }
}

function renderMergeSortStep(data) {
    const { array, tempArray, activeRange, mid, leftPtr, rightPtr, stage, sortedIndices, recursionStack, description } = data;
    const [low, high] = activeRange;
    const maxVal = Math.max(...array, 1);

    array.forEach((val, idx) => {
        const bar = document.getElementById(`ms-chart-main-bar-${idx}`);
        if (!bar) return;

        const height = (val / maxVal) * 90 + 5;
        bar.style.height = `${height}%`;
        bar.querySelector('.bar-label').innerText = val;

        bar.className = 'bar';

        const inRange = (idx >= low && idx <= high);

        if (idx === leftPtr || idx === rightPtr) {
            bar.classList.add('comparing');
        } else if (stage === 'copy_back' && idx >= low && idx <= high) {
            bar.classList.add('swapped');
        } else if (sortedIndices.includes(idx)) {
            bar.classList.add('sorted');
        } else if (low !== -1 && !inRange) {
            bar.classList.add('inactive');
        }

        if (inRange) bar.classList.add('active-range');
    });

    tempArray.forEach((val, idx) => {
        const container = msChartHelper.children[idx];
        if (!container) return;

        container.innerHTML = '';

        if (val === null) {
            const emptyPlaceholder = document.createElement('div');
            emptyPlaceholder.className = 'bar-empty';
            emptyPlaceholder.id = `ms-helper-placeholder-${idx}`;
            container.appendChild(emptyPlaceholder);
        } else {
            const bar = document.createElement('div');
            bar.className = 'bar merging';

            const height = (val / maxVal) * 90 + 5;
            bar.style.height = `${height}%`;
            bar.innerHTML = `<span class="bar-label">${val}</span>`;

            container.appendChild(bar);
        }
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
}

// --- Helper Functions ---
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
    stepTracker.innerText = `Step ${idx + 1} / ${state.totalSteps}`;

    if (state.activeTab === 'knapsack') renderKnapsackStep(stepData);
    else if (state.activeTab === 'lcs') renderLCSStep(stepData);
    else if (state.activeTab === 'quicksort') renderQuickSortStep(stepData);
    else if (state.activeTab === 'mergesort') renderMergeSortStep(stepData);
}
