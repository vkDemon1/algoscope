// This file compiles two ways:
//  1) With Emscripten (emcc, __EMSCRIPTEN__ defined) -> produces the WASM
//     module consumed by the browser, with JS-facing bindings.
//  2) With a plain native compiler (g++/clang++) -> Emscripten-only code is
//     skipped, leaving pure std::vector/std::string based classes that the
//     native test suite in tests/test_algorithms.cpp links against directly.
//     This lets CI verify the DP/sorting logic itself without needing the
//     full Emscripten SDK on every run.
#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#include <emscripten/val.h>
#endif
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <set>

#ifdef __EMSCRIPTEN__
// Helper to convert JS array to C++ std::vector<int>
std::vector<int> val_to_vector(emscripten::val val_arr) {
    unsigned int len = val_arr["length"].as<unsigned int>();
    std::vector<int> vec;
    vec.reserve(len);
    for (unsigned int i = 0; i < len; ++i) {
        vec.push_back(val_arr[i].as<int>());
    }
    return vec;
}
#endif

// Helper to escape double quotes in JSON strings
std::string escape_json_string(std::string str) {
    std::stringstream ss;
    for (char c : str) {
        if (c == '"') {
            ss << "\\\"";
        } else if (c == '\\') {
            ss << "\\\\";
        } else if (c == '\n') {
            ss << "\\n";
        } else if (c == '\r') {
            ss << "\\r";
        } else if (c == '\t') {
            ss << "\\t";
        } else {
            ss << c;
        }
    }
    return ss.str();
}

// ==========================================
// 1. KNAPSACK VISUALIZER (C++)
// ==========================================
struct KnapsackStep {
    std::string stage;
    std::vector<std::vector<int>> matrix; // -1 represents uncalculated (null in JSON)
    int currentRow;
    int currentCol;
    std::vector<std::vector<int>> compareCells;
    std::vector<int> selectedItems;
    std::string description;
};

class KnapsackVisualizer {
private:
    std::vector<int> weights;
    std::vector<int> values;
    int capacity;
    int n;
    std::vector<std::vector<int>> matrix;
    std::vector<std::string> steps_json;

    std::string serialize_step(const KnapsackStep& step) {
        std::stringstream ss;
        ss << "{";
        ss << "\"stage\":\"" << step.stage << "\",";

        // Matrix
        ss << "\"matrix\":[";
        for (size_t r = 0; r < step.matrix.size(); ++r) {
            ss << "[";
            for (size_t c = 0; c < step.matrix[r].size(); ++c) {
                if (step.matrix[r][c] == -1) {
                    ss << "null";
                } else {
                    ss << step.matrix[r][c];
                }
                if (c + 1 < step.matrix[r].size()) ss << ",";
            }
            ss << "]";
            if (r + 1 < step.matrix.size()) ss << ",";
        }
        ss << "],";

        ss << "\"currentRow\":" << step.currentRow << ",";
        ss << "\"currentCol\":" << step.currentCol << ",";

        // Compare cells
        ss << "\"compareCells\":[";
        for (size_t i = 0; i < step.compareCells.size(); ++i) {
            ss << "[" << step.compareCells[i][0] << "," << step.compareCells[i][1] << "]";
            if (i + 1 < step.compareCells.size()) ss << ",";
        }
        ss << "],";

        // Selected items
        ss << "\"selectedItems\":[";
        for (size_t i = 0; i < step.selectedItems.size(); ++i) {
            ss << step.selectedItems[i];
            if (i + 1 < step.selectedItems.size()) ss << ",";
        }
        ss << "],";

        ss << "\"description\":\"" << escape_json_string(step.description) << "\"";
        ss << "}";
        return ss.str();
    }

    void generate_steps() {
        KnapsackStep step;

        // Step 1: Base Case Initialization
        step.stage = "initialization";
        step.matrix = matrix;
        step.currentRow = 0;
        step.currentCol = -1;
        step.description = "<b>Instructor Note (WASM):</b> We begin by initializing the base cases. Row 0 (choosing from 0 items) and Column 0 (knapsack capacity of 0) are filled with 0s since no value can be obtained under these conditions.";
        steps_json.push_back(serialize_step(step));

        // Step 2: Fill DP Table
        for (int i = 1; i <= n; ++i) {
            int wt = weights[i-1];
            int val = values[i-1];
            for (int w = 1; w <= capacity; ++w) {
                int exclude_val = matrix[i-1][w];
                std::vector<std::vector<int>> compare;
                std::string desc;

                if (wt <= w) {
                    int include_val = matrix[i-1][w - wt] + val;
                    matrix[i][w] = std::max(exclude_val, include_val);
                    compare = {{i-1, w}, {i-1, w - wt}};

                    if (include_val > exclude_val) {
                        desc = "<b>Instructor Note (WASM):</b> Evaluating cell <code>dp[" + std::to_string(i) + "][" + std::to_string(w) + "]</code> for <b>Item " + std::to_string(i) + "</b> (weight=" + std::to_string(wt) + ", value=" + std::to_string(val) + ") at capacity <b>" + std::to_string(w) + "</b>.<br><br>"
                               "• <b>Option A (Exclude):</b> Carry forward value from <code>dp[" + std::to_string(i-1) + "][" + std::to_string(w) + "]</code> = <b>$" + std::to_string(exclude_val) + "</b>.<br>"
                               "• <b>Option B (Include):</b> Add item value (<b>$" + std::to_string(val) + "</b>) + optimal remaining value from previous row <code>dp[" + std::to_string(i-1) + "][" + std::to_string(w-wt) + "]</code> (<b>$" + std::to_string(matrix[i-1][w-wt]) + "</b>), total = <b>$" + std::to_string(include_val) + "</b>.<br><br>"
                               "<b>Decision:</b> Since Option B (<b>$" + std::to_string(include_val) + "</b>) &gt; Option A (<b>$" + std::to_string(exclude_val) + "</b>), we <b>INCLUDE</b> Item " + std::to_string(i) + ". Store <b>" + std::to_string(matrix[i][w]) + "</b> in the table.";
                    } else {
                        desc = "<b>Instructor Note (WASM):</b> Evaluating cell <code>dp[" + std::to_string(i) + "][" + std::to_string(w) + "]</code> for <b>Item " + std::to_string(i) + "</b> (weight=" + std::to_string(wt) + ", value=" + std::to_string(val) + ") at capacity <b>" + std::to_string(w) + "</b>.<br><br>"
                               "• <b>Option A (Exclude):</b> Carry forward value from <code>dp[" + std::to_string(i-1) + "][" + std::to_string(w) + "]</code> = <b>$" + std::to_string(exclude_val) + "</b>.<br>"
                               "• <b>Option B (Include):</b> Add item value (<b>$" + std::to_string(val) + "</b>) + optimal remaining value from previous row <code>dp[" + std::to_string(i-1) + "][" + std::to_string(w-wt) + "]</code> (<b>$" + std::to_string(matrix[i-1][w-wt]) + "</b>), total = <b>$" + std::to_string(include_val) + "</b>.<br><br>"
                               "<b>Decision:</b> Since Option A (<b>$" + std::to_string(exclude_val) + "</b>) &ge; Option B (<b>$" + std::to_string(include_val) + "</b>), we <b>EXCLUDE</b> Item " + std::to_string(i) + " to optimize. Store <b>" + std::to_string(matrix[i][w]) + "</b> in the table.";
                    }
                } else {
                    matrix[i][w] = exclude_val;
                    compare = {{i-1, w}};
                    desc = "<b>Instructor Note (WASM):</b> Evaluating cell <code>dp[" + std::to_string(i) + "][" + std::to_string(w) + "]</code> for <b>Item " + std::to_string(i) + "</b> (weight=" + std::to_string(wt) + ", value=" + std::to_string(val) + ") at capacity <b>" + std::to_string(w) + "</b>.<br><br>"
                           "Item weight (<b>" + std::to_string(wt) + "</b>) exceeds capacity (<b>" + std::to_string(w) + "</b>). Inclusion is impossible.<br><br>"
                           "<b>Decision:</b> We <b>EXCLUDE</b> Item " + std::to_string(i) + " and copy optimal value from cell above: <code>dp[" + std::to_string(i-1) + "][" + std::to_string(w) + "]</code> = <b>$" + std::to_string(matrix[i][w]) + "</b>.";
                }

                step.stage = "calculation";
                step.matrix = matrix;
                step.currentRow = i;
                step.currentCol = w;
                step.compareCells = compare;
                step.description = desc;
                steps_json.push_back(serialize_step(step));
            }
        }

        // Step 3: Backtracking
        std::vector<int> selected;
        int curr_w = capacity;
        int curr_i = n;

        step.stage = "backtracking_start";
        step.matrix = matrix;
        step.currentRow = curr_i;
        step.currentCol = curr_w;
        step.compareCells = {};
        step.selectedItems = selected;
        step.description = "<b>Instructor Note (WASM):</b> DP table is fully filled! The maximum possible value is <b>$" + std::to_string(matrix[n][capacity]) + "</b> (bottom-right cell). We now begin backtracking from cell <code>dp[" + std::to_string(n) + "][" + std::to_string(capacity) + "]</code> to trace back which items were selected.";
        steps_json.push_back(serialize_step(step));

        while (curr_i > 0 && curr_w > 0) {
            int wt = weights[curr_i - 1];
            int val = values[curr_i - 1];

            if (matrix[curr_i][curr_w] != matrix[curr_i-1][curr_w]) {
                selected.push_back(curr_i - 1);
                std::string desc = "<b>Instructor Note (WASM):</b> Reaching cell <code>dp[" + std::to_string(curr_i) + "][" + std::to_string(curr_w) + "]</code> = <b>$" + std::to_string(matrix[curr_i][curr_w]) + "</b>.<br><br>"
                                   "Compare this value with the cell directly above: <code>dp[" + std::to_string(curr_i-1) + "][" + std::to_string(curr_w) + "]</code> = <b>$" + std::to_string(matrix[curr_i-1][curr_w]) + "</b>.<br>"
                                   "Since values differ, <b>Item " + std::to_string(curr_i) + " (weight=" + std::to_string(wt) + ", value=$" + std::to_string(val) + ") was SELECTED</b>.<br><br>"
                                   "Deduct weight (" + std::to_string(wt) + ") from capacity (" + std::to_string(curr_w) + " &rarr; " + std::to_string(curr_w - wt) + ") and move up to row <b>" + std::to_string(curr_i-1) + "</b>.";

                int prev_i = curr_i;
                int prev_w = curr_w;
                curr_w -= wt;
                curr_i -= 1;

                step.stage = "backtracking";
                step.currentRow = curr_i;
                step.currentCol = curr_w;
                step.compareCells = {{prev_i, prev_w}, {curr_i, curr_w}};
                step.selectedItems = selected;
                step.description = desc;
                steps_json.push_back(serialize_step(step));
            } else {
                std::string desc = "<b>Instructor Note (WASM):</b> Reaching cell <code>dp[" + std::to_string(curr_i) + "][" + std::to_string(curr_w) + "]</code> = <b>$" + std::to_string(matrix[curr_i][curr_w]) + "</b>.<br><br>"
                                   "Compare this value with the cell directly above: <code>dp[" + std::to_string(curr_i-1) + "][" + std::to_string(curr_w) + "]</code> = <b>$" + std::to_string(matrix[curr_i-1][curr_w]) + "</b>.<br>"
                                   "Since values are identical, <b>Item " + std::to_string(curr_i) + " was NOT selected</b>. Value carried forward.<br><br>"
                                   "Move directly up to row <b>" + std::to_string(curr_i-1) + "</b> at the same capacity <b>" + std::to_string(curr_w) + "</b>.";

                int prev_i = curr_i;
                int prev_w = curr_w;
                curr_i -= 1;

                step.stage = "backtracking";
                step.currentRow = curr_i;
                step.currentCol = curr_w;
                step.compareCells = {{prev_i, prev_w}, {curr_i, curr_w}};
                step.selectedItems = selected;
                step.description = desc;
                steps_json.push_back(serialize_step(step));
            }
        }

        std::string selected_names = "";
        int total_wt = 0;
        for (int idx : selected) {
            selected_names += "Item " + std::to_string(idx + 1) + " (weight=" + std::to_string(weights[idx]) + ", value=$" + std::to_string(values[idx]) + ") ";
            total_wt += weights[idx];
        }

        step.stage = "complete";
        step.currentRow = -1;
        step.currentCol = -1;
        step.compareCells = {};
        step.selectedItems = selected;
        step.description = "<b>Instructor Note (WASM):</b> Backtracking complete!<br><br>"
                           "<b>Optimal Solution Set:</b> " + (selected_names.empty() ? "None" : selected_names) + "<br><br>"
                           "<b>Total Capacity Utilized:</b> " + std::to_string(total_wt) + " / " + std::to_string(capacity) + " weight units.<br>"
                           "<b>Maximized Total Value:</b> <b>$" + std::to_string(matrix[n][capacity]) + "</b>.";
        steps_json.push_back(serialize_step(step));
    }

public:
    // Native constructor: no Emscripten types involved, so this (and every
    // method it calls) is directly unit-testable with a plain g++ build.
    KnapsackVisualizer(std::vector<int> wt, std::vector<int> val, int cap) {
        weights = wt;
        values = val;
        capacity = cap;
        n = weights.size();

        matrix = std::vector<std::vector<int>>(n + 1, std::vector<int>(capacity + 1, -1));
        for (int w = 0; w <= capacity; ++w) matrix[0][w] = 0;
        for (int i = 0; i <= n; ++i) matrix[i][0] = 0;

        generate_steps();
    }

#ifdef __EMSCRIPTEN__
    // JS-facing constructor: converts JS arrays, then delegates to the
    // native constructor above so the actual logic only lives in one place.
    KnapsackVisualizer(emscripten::val wt_js, emscripten::val val_js, int cap)
        : KnapsackVisualizer(val_to_vector(wt_js), val_to_vector(val_js), cap) {}
#endif

    std::string get_step(int idx) {
        if (idx >= 0 && idx < (int)steps_json.size()) return steps_json[idx];
        return "";
    }
    int get_total_steps() { return steps_json.size(); }
};

// ==========================================
// 2. LONGEST COMMON SUBSEQUENCE (LCS) (C++)
// ==========================================
struct LCSStep {
    std::string stage;
    std::vector<std::vector<int>> matrix;
    int currentRow;
    int currentCol;
    std::vector<std::vector<int>> compareCells;
    std::vector<std::vector<int>> backtrackPath;
    std::string lcsSequence;
    std::string description;
};

class LCSVisualizer {
private:
    std::string s1;
    std::string s2;
    int m;
    int n;
    std::vector<std::vector<int>> matrix;
    std::vector<std::string> steps_json;

    std::string serialize_step(const LCSStep& step) {
        std::stringstream ss;
        ss << "{";
        ss << "\"stage\":\"" << step.stage << "\",";

        // Matrix
        ss << "\"matrix\":[";
        for (size_t r = 0; r < step.matrix.size(); ++r) {
            ss << "[";
            for (size_t c = 0; c < step.matrix[r].size(); ++c) {
                if (step.matrix[r][c] == -1) {
                    ss << "null";
                } else {
                    ss << step.matrix[r][c];
                }
                if (c + 1 < step.matrix[r].size()) ss << ",";
            }
            ss << "]";
            if (r + 1 < step.matrix.size()) ss << ",";
        }
        ss << "],";

        ss << "\"currentRow\":" << step.currentRow << ",";
        ss << "\"currentCol\":" << step.currentCol << ",";

        // Compare cells
        ss << "\"compareCells\":[";
        for (size_t i = 0; i < step.compareCells.size(); ++i) {
            ss << "[" << step.compareCells[i][0] << "," << step.compareCells[i][1] << "]";
            if (i + 1 < step.compareCells.size()) ss << ",";
        }
        ss << "],";

        // Backtrack path
        ss << "\"backtrackPath\":[";
        for (size_t i = 0; i < step.backtrackPath.size(); ++i) {
            ss << "[" << step.backtrackPath[i][0] << "," << step.backtrackPath[i][1] << "]";
            if (i + 1 < step.backtrackPath.size()) ss << ",";
        }
        ss << "],";

        ss << "\"lcsSequence\":\"" << escape_json_string(step.lcsSequence) << "\",";
        ss << "\"description\":\"" << escape_json_string(step.description) << "\"";
        ss << "}";
        return ss.str();
    }

    void generate_steps() {
        LCSStep step;

        // Base Case Init Step
        step.stage = "initialization";
        step.matrix = matrix;
        step.currentRow = 0;
        step.currentCol = -1;
        step.description = "<b>Instructor Note (WASM):</b> We begin by initializing the base cases. Row 0 (empty String 2 prefix) and Column 0 (empty String 1 prefix) are filled with 0s.";
        steps_json.push_back(serialize_step(step));

        // Fill Table
        for (int i = 1; i <= m; ++i) {
            char c2 = s2[i-1];
            for (int j = 1; j <= n; ++j) {
                char c1 = s1[j-1];
                std::vector<std::vector<int>> compare;
                std::string desc;

                if (c1 == c2) {
                    matrix[i][j] = matrix[i-1][j-1] + 1;
                    compare = {{i-1, j-1}};
                    desc = "<b>Instructor Note (WASM):</b> Evaluating cell <code>dp[" + std::to_string(i) + "][" + std::to_string(j) + "]</code>.<br>"
                           "• Characters MATCH! (<b>'" + std::string(1, c1) + "' == '" + std::string(1, c2) + "'</b>)<br>"
                           "• Diagonal value <code>dp[" + std::to_string(i-1) + "][" + std::to_string(j-1) + "]</code> (" + std::to_string(matrix[i-1][j-1]) + ") + 1 = <b>" + std::to_string(matrix[i][j]) + "</b>.";
                } else {
                    int val_above = matrix[i-1][j];
                    int val_left = matrix[i][j-1];
                    matrix[i][j] = std::max(val_above, val_left);
                    compare = {{i-1, j}, {i, j-1}};

                    std::string source = (val_above >= val_left) ? "above cell" : "left cell";
                    desc = "<b>Instructor Note (WASM):</b> Evaluating cell <code>dp[" + std::to_string(i) + "][" + std::to_string(j) + "]</code>.<br>"
                           "• Characters MISMATCH! (<b>'" + std::string(1, c1) + "' &ne; '" + std::string(1, c2) + "'</b>)<br>"
                           "• Max of above (" + std::to_string(val_above) + ") and left (" + std::to_string(val_left) + ") = <b>" + std::to_string(matrix[i][j]) + "</b> (from " + source + ").";
                }

                step.stage = "calculation";
                step.matrix = matrix;
                step.currentRow = i;
                step.currentCol = j;
                step.compareCells = compare;
                step.description = desc;
                steps_json.push_back(serialize_step(step));
            }
        }

        // Backtracking
        std::vector<std::vector<int>> path;
        std::string lcs = "";
        int curr_i = m;
        int curr_j = n;

        step.stage = "backtracking_start";
        step.matrix = matrix;
        step.currentRow = curr_i;
        step.currentCol = curr_j;
        step.compareCells = {};
        step.backtrackPath = path;
        step.lcsSequence = "";
        step.description = "<b>Instructor Note (WASM):</b> Matrix complete! LCS length = <b>" + std::to_string(matrix[m][n]) + "</b>. Tracing backtrack path...";
        steps_json.push_back(serialize_step(step));

        while (curr_i > 0 && curr_j > 0) {
            path.push_back({curr_i, curr_j});
            char c2 = s2[curr_i - 1];
            char c1 = s1[curr_j - 1];

            if (c1 == c2) {
                lcs = c1 + lcs;
                std::string desc = "<b>Instructor Note (WASM):</b> Reaching cell <code>dp[" + std::to_string(curr_i) + "][" + std::to_string(curr_j) + "]</code> = <b>" + std::to_string(matrix[curr_i][curr_j]) + "</b>.<br>"
                                   "Characters match: <b>'" + std::string(1, c1) + "'</b>. Include in LCS sequence.<br>"
                                   "Move diagonally up-left to cell (" + std::to_string(curr_i-1) + ", " + std::to_string(curr_j-1) + ").";

                int prev_i = curr_i;
                int prev_j = curr_j;
                curr_i--;
                curr_j--;

                step.stage = "backtracking";
                step.currentRow = curr_i;
                step.currentCol = curr_j;
                step.compareCells = {{prev_i, prev_j}, {curr_i, curr_j}};
                step.backtrackPath = path;
                step.lcsSequence = lcs;
                step.description = desc;
                steps_json.push_back(serialize_step(step));
            } else {
                int val_above = matrix[curr_i-1][curr_j];
                int val_left = matrix[curr_i][curr_j-1];
                std::string desc;
                int prev_i = curr_i;
                int prev_j = curr_j;

                if (val_above >= val_left) {
                    desc = "<b>Instructor Note (WASM):</b> Cell <code>dp[" + std::to_string(curr_i) + "][" + std::to_string(curr_j) + "]</code> = " + std::to_string(matrix[curr_i][curr_j]) + ". Mismatch.<br>"
                           "Compare above (" + std::to_string(val_above) + ") vs left (" + std::to_string(val_left) + "). Move up to (" + std::to_string(curr_i-1) + ", " + std::to_string(curr_j) + ").";
                    curr_i--;
                } else {
                    desc = "<b>Instructor Note (WASM):</b> Cell <code>dp[" + std::to_string(curr_i) + "][" + std::to_string(curr_j) + "]</code> = " + std::to_string(matrix[curr_i][curr_j]) + ". Mismatch.<br>"
                           "Compare above (" + std::to_string(val_above) + ") vs left (" + std::to_string(val_left) + "). Move left to (" + std::to_string(curr_i) + ", " + std::to_string(curr_j-1) + ").";
                    curr_j--;
                }

                step.stage = "backtracking";
                step.currentRow = curr_i;
                step.currentCol = curr_j;
                step.compareCells = {{prev_i, prev_j}, {curr_i, curr_j}};
                step.backtrackPath = path;
                step.lcsSequence = lcs;
                step.description = desc;
                steps_json.push_back(serialize_step(step));
            }
        }

        path.push_back({curr_i, curr_j});
        step.stage = "complete";
        step.currentRow = -1;
        step.currentCol = -1;
        step.compareCells = {};
        step.backtrackPath = path;
        step.lcsSequence = lcs;
        step.description = "<b>Instructor Note (WASM):</b> Reconstructed LCS successfully!<br>"
                           "• String 1: <code>" + s1 + "</code><br>"
                           "• String 2: <code>" + s2 + "</code><br>"
                           "<b>Subsequence:</b> <b style='color: var(--accent-green);'>\"" + (lcs.empty() ? "None" : lcs) + "\"</b> (length = " + std::to_string(lcs.length()) + ").";
        steps_json.push_back(serialize_step(step));
    }

public:
    LCSVisualizer(std::string str1, std::string str2) {
        s1 = str1;
        s2 = str2;
        m = s2.length();
        n = s1.length();

        matrix = std::vector<std::vector<int>>(m + 1, std::vector<int>(n + 1, -1));
        for (int i = 0; i <= m; ++i) matrix[i][0] = 0;
        for (int j = 0; j <= n; ++j) matrix[0][j] = 0;

        generate_steps();
    }

    std::string get_step(int idx) {
        if (idx >= 0 && idx < (int)steps_json.size()) return steps_json[idx];
        return "";
    }
    int get_total_steps() { return steps_json.size(); }
};

// ==========================================
// 3. QUICKSORT VISUALIZER (C++)
// ==========================================
struct QuickSortStep {
    std::vector<int> array;
    int pivotIdx;
    int leftPtr;
    int rightPtr;
    std::vector<int> activeRange;
    std::vector<int> swapped;
    std::vector<int> sortedIndices;
    std::vector<std::vector<int>> recursionStack;
    std::string description;
};

class QuickSortVisualizer {
private:
    std::vector<int> initial_array;
    std::vector<std::string> steps_json;
    std::set<int> sorted_indices;
    std::vector<std::vector<int>> recursion_stack;

    std::string serialize_step(const QuickSortStep& step) {
        std::stringstream ss;
        ss << "{";

        ss << "\"array\":[";
        for (size_t i = 0; i < step.array.size(); ++i) {
            ss << step.array[i];
            if (i + 1 < step.array.size()) ss << ",";
        }
        ss << "],";

        ss << "\"pivotIdx\":" << step.pivotIdx << ",";
        ss << "\"leftPtr\":" << step.leftPtr << ",";
        ss << "\"rightPtr\":" << step.rightPtr << ",";
        ss << "\"activeRange\":[" << step.activeRange[0] << "," << step.activeRange[1] << "],";

        ss << "\"swapped\":[";
        for (size_t i = 0; i < step.swapped.size(); ++i) {
            ss << step.swapped[i];
            if (i + 1 < step.swapped.size()) ss << ",";
        }
        ss << "],";

        ss << "\"sortedIndices\":[";
        for (auto it = step.sortedIndices.begin(); it != step.sortedIndices.end(); ) {
            ss << *it;
            if (++it != step.sortedIndices.end()) ss << ",";
        }
        ss << "],";

        ss << "\"recursionStack\":[";
        for (size_t i = 0; i < step.recursionStack.size(); ++i) {
            ss << "[" << step.recursionStack[i][0] << "," << step.recursionStack[i][1] << "]";
            if (i + 1 < step.recursionStack.size()) ss << ",";
        }
        ss << "],";

        ss << "\"description\":\"" << escape_json_string(step.description) << "\"";
        ss << "}";
        return ss.str();
    }

    void run_quicksort(std::vector<int>& arr, int low, int high) {
        if (low > high) return;
        QuickSortStep step;
        if (low == high) {
            sorted_indices.insert(low);
            step.array = arr;
            step.pivotIdx = -1;
            step.leftPtr = -1;
            step.rightPtr = -1;
            step.activeRange = {low, high};
            step.swapped = {};
            step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
            step.recursionStack = recursion_stack;
            step.description = "<b>Instructor Note (WASM):</b> Subarray range [<code>" + std::to_string(low) + "</code>, <code>" + std::to_string(high) + "</code>] has length 1. Trivially sorted.";
            steps_json.push_back(serialize_step(step));
            return;
        }

        recursion_stack.push_back({low, high});
        step.array = arr;
        step.pivotIdx = -1;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.activeRange = {low, high};
        step.swapped = {};
        step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
        step.recursionStack = recursion_stack;
        step.description = "<b>Instructor Note (WASM):</b> Partitioning subarray [<code>" + std::to_string(low) + "</code>, <code>" + std::to_string(high) + "</code>]. Adding to stack.";
        steps_json.push_back(serialize_step(step));

        int pivot_idx = high;
        int pivot_val = arr[pivot_idx];

        step.pivotIdx = pivot_idx;
        step.description = "<b>Instructor Note (WASM):</b> Selected pivot element <b>" + std::to_string(pivot_val) + "</b> at index " + std::to_string(pivot_idx) + " (high element).";
        steps_json.push_back(serialize_step(step));

        int i = low - 1;
        for (int j = low; j < high; ++j) {
            step.leftPtr = i;
            step.rightPtr = j;
            step.swapped = {};
            step.description = "<b>Instructor Note (WASM):</b> Comparing element <code>arr[" + std::to_string(j) + "]</code> = <b>" + std::to_string(arr[j]) + "</b> with pivot = <b>" + std::to_string(pivot_val) + "</b>.";
            steps_json.push_back(serialize_step(step));

            if (arr[j] < pivot_val) {
                i++;
                std::swap(arr[i], arr[j]);
                step.array = arr;
                step.leftPtr = i;
                step.rightPtr = j;
                step.swapped = {i, j};
                step.description = "<b>Instructor Note (WASM):</b> Since " + std::to_string(arr[i]) + " &lt; " + std::to_string(pivot_val) + ", increment pointer and <b>SWAP</b> elements at indexes " + std::to_string(i) + " and " + std::to_string(j) + ".";
                steps_json.push_back(serialize_step(step));
            }
        }

        std::swap(arr[i + 1], arr[high]);
        int pivot_final_idx = i + 1;
        sorted_indices.insert(pivot_final_idx);

        step.array = arr;
        step.pivotIdx = pivot_final_idx;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.swapped = {pivot_final_idx, high};
        step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
        step.description = "<b>Instructor Note (WASM):</b> Swap pivot <b>" + std::to_string(pivot_val) + "</b> to its sorted position at index <b>" + std::to_string(pivot_final_idx) + "</b>.";
        steps_json.push_back(serialize_step(step));

        recursion_stack.pop_back();

        run_quicksort(arr, low, pivot_final_idx - 1);
        run_quicksort(arr, pivot_final_idx + 1, high);
    }

    void generate_steps() {
        std::vector<int> arr = initial_array;
        int n = arr.size();

        QuickSortStep step;
        step.array = arr;
        step.pivotIdx = -1;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.activeRange = {0, n - 1};
        step.swapped = {};
        step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
        step.recursionStack = recursion_stack;
        step.description = "<b>Instructor Note (WASM):</b> Initializing Quick Sort. Subarray of size " + std::to_string(n) + ".";
        steps_json.push_back(serialize_step(step));

        run_quicksort(arr, 0, n - 1);

        for (int i = 0; i < n; ++i) sorted_indices.insert(i);
        step.array = arr;
        step.pivotIdx = -1;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.activeRange = {-1, -1};
        step.swapped = {};
        step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
        step.recursionStack = {};
        step.description = "<b>Instructor Note (WASM):</b> Quick Sort complete! Fully sorted.";
        steps_json.push_back(serialize_step(step));
    }

public:
    QuickSortVisualizer(std::vector<int> arr) {
        initial_array = arr;
        generate_steps();
    }

#ifdef __EMSCRIPTEN__
    QuickSortVisualizer(emscripten::val arr_js)
        : QuickSortVisualizer(val_to_vector(arr_js)) {}
#endif

    std::string get_step(int idx) {
        if (idx >= 0 && idx < (int)steps_json.size()) return steps_json[idx];
        return "";
    }
    int get_total_steps() { return steps_json.size(); }
};

// ==========================================
// 4. MERGE SORT VISUALIZER (C++)
// ==========================================
struct MergeSortStep {
    std::vector<int> array;
    std::vector<int> tempArray; // -1 represents empty (null in JSON)
    std::vector<int> activeRange; // low, high
    int mid;
    int leftPtr;
    int rightPtr;
    std::string stage;
    std::vector<int> sortedIndices;
    std::vector<std::vector<int>> recursionStack;
    std::string description;
};

class MergeSortVisualizer {
private:
    std::vector<int> initial_array;
    std::vector<std::string> steps_json;
    std::set<int> sorted_indices;
    std::vector<std::vector<int>> recursion_stack;
    std::vector<int> temp_arr;
    int n;

    std::string serialize_step(const MergeSortStep& step) {
        std::stringstream ss;
        ss << "{";

        // array
        ss << "\"array\":[";
        for (size_t i = 0; i < step.array.size(); ++i) {
            ss << step.array[i];
            if (i + 1 < step.array.size()) ss << ",";
        }
        ss << "],";

        // tempArray (null for -1)
        ss << "\"tempArray\":[";
        for (size_t i = 0; i < step.tempArray.size(); ++i) {
            if (step.tempArray[i] == -1) {
                ss << "null";
            } else {
                ss << step.tempArray[i];
            }
            if (i + 1 < step.tempArray.size()) ss << ",";
        }
        ss << "],";

        ss << "\"activeRange\":[" << step.activeRange[0] << "," << step.activeRange[1] << "],";
        ss << "\"mid\":" << step.mid << ",";
        ss << "\"leftPtr\":" << step.leftPtr << ",";
        ss << "\"rightPtr\":" << step.rightPtr << ",";
        ss << "\"stage\":\"" << step.stage << "\",";

        // sortedIndices
        ss << "\"sortedIndices\":[";
        for (auto it = step.sortedIndices.begin(); it != step.sortedIndices.end(); ) {
            ss << *it;
            if (++it != step.sortedIndices.end()) ss << ",";
        }
        ss << "],";

        // recursionStack
        ss << "\"recursionStack\":[";
        for (size_t i = 0; i < step.recursionStack.size(); ++i) {
            ss << "[" << step.recursionStack[i][0] << "," << step.recursionStack[i][1] << "]";
            if (i + 1 < step.recursionStack.size()) ss << ",";
        }
        ss << "],";

        ss << "\"description\":\"" << escape_json_string(step.description) << "\"";
        ss << "}";
        return ss.str();
    }

    void merge(std::vector<int>& arr, int low, int mid, int high) {
        for (int k = low; k <= high; ++k) temp_arr[k] = -1;

        MergeSortStep step;
        step.array = arr;
        step.tempArray = temp_arr;
        step.activeRange = {low, high};
        step.mid = mid;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.stage = "merge_init";
        step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
        step.recursionStack = recursion_stack;
        step.description = "<b>Instructor Note (WASM):</b> Preparing to merge left subarray [<code>" + std::to_string(low) + "</code> to <code>" + std::to_string(mid) + "</code>] and right subarray [<code>" + std::to_string(mid+1) + "</code> to <code>" + std::to_string(high) + "</code>].";
        steps_json.push_back(serialize_step(step));

        int i = low;
        int j = mid + 1;
        int k = low;

        while (i <= mid && j <= high) {
            step.leftPtr = i;
            step.rightPtr = j;
            step.stage = "compare";
            step.description = "<b>Instructor Note (WASM):</b> Comparing element <b>" + std::to_string(arr[i]) + "</b> (left partition) and element <b>" + std::to_string(arr[j]) + "</b> (right partition).";
            steps_json.push_back(serialize_step(step));

            if (arr[i] <= arr[j]) {
                temp_arr[k] = arr[i];
                step.tempArray = temp_arr;
                step.stage = "copy_temp";
                step.description = "<b>Instructor Note (WASM):</b> Since " + std::to_string(arr[i]) + " &le; " + std::to_string(arr[j]) + ", copy element <b>" + std::to_string(arr[i]) + "</b> to helper index <b>" + std::to_string(k) + "</b>.";
                steps_json.push_back(serialize_step(step));
                i++;
            } else {
                temp_arr[k] = arr[j];
                step.tempArray = temp_arr;
                step.stage = "copy_temp";
                step.description = "<b>Instructor Note (WASM):</b> Since " + std::to_string(arr[j]) + " &lt; " + std::to_string(arr[i]) + ", copy element <b>" + std::to_string(arr[j]) + "</b> to helper index <b>" + std::to_string(k) + "</b>.";
                steps_json.push_back(serialize_step(step));
                j++;
            }
            k++;
        }

        while (i <= mid) {
            temp_arr[k] = arr[i];
            step.tempArray = temp_arr;
            step.leftPtr = i;
            step.rightPtr = -1;
            step.stage = "copy_temp";
            step.description = "<b>Instructor Note (WASM):</b> Copying remaining left element <b>" + std::to_string(arr[i]) + "</b> to helper index <b>" + std::to_string(k) + "</b>.";
            steps_json.push_back(serialize_step(step));
            i++;
            k++;
        }

        while (j <= high) {
            temp_arr[k] = arr[j];
            step.tempArray = temp_arr;
            step.leftPtr = -1;
            step.rightPtr = j;
            step.stage = "copy_temp";
            step.description = "<b>Instructor Note (WASM):</b> Copying remaining right element <b>" + std::to_string(arr[j]) + "</b> to helper index <b>" + std::to_string(k) + "</b>.";
            steps_json.push_back(serialize_step(step));
            j++;
            k++;
        }

        for (int idx = low; idx <= high; ++idx) {
            arr[idx] = temp_arr[idx];
            if (low == 0 && high == n - 1) {
                sorted_indices.insert(idx);
            }

            std::vector<int> temp_arr_copy = temp_arr;
            temp_arr_copy[idx] = -1; // mock write back animation

            step.array = arr;
            step.tempArray = temp_arr_copy;
            step.leftPtr = -1;
            step.rightPtr = -1;
            step.stage = "copy_back";
            step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
            step.description = "<b>Instructor Note (WASM):</b> Copying element <b>" + std::to_string(arr[idx]) + "</b> back to the main array at index " + std::to_string(idx) + ".";
            steps_json.push_back(serialize_step(step));
            temp_arr[idx] = -1;
        }
    }

    void run_mergesort(std::vector<int>& arr, int low, int high) {
        if (low >= high) return;
        int mid = (low + high) / 2;

        recursion_stack.push_back({low, high});

        MergeSortStep step;
        step.array = arr;
        step.tempArray = temp_arr;
        step.activeRange = {low, high};
        step.mid = mid;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.stage = "split";
        step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
        step.recursionStack = recursion_stack;
        step.description = "<b>Instructor Note (WASM):</b> Splitting subarray [<code>" + std::to_string(low) + "</code> to <code>" + std::to_string(high) + "</code>] at mid = " + std::to_string(mid) + ". Registered range on stack.";
        steps_json.push_back(serialize_step(step));

        run_mergesort(arr, low, mid);
        run_mergesort(arr, mid + 1, high);

        merge(arr, low, mid, high);

        recursion_stack.pop_back();
        step.array = arr;
        step.tempArray = temp_arr;
        step.activeRange = {low, high};
        step.mid = mid;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.stage = "split_complete";
        step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
        step.recursionStack = recursion_stack;
        step.description = "<b>Instructor Note (WASM):</b> Subarray merge finished for range [<code>" + std::to_string(low) + "</code> to <code>" + std::to_string(high) + "</code>]. Popping range from stack.";
        steps_json.push_back(serialize_step(step));
    }

    void generate_steps() {
        std::vector<int> arr = initial_array;

        MergeSortStep step;
        step.array = arr;
        step.tempArray = temp_arr;
        step.activeRange = {0, n - 1};
        step.mid = -1;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.stage = "initialization";
        step.sortedIndices = {};
        step.recursionStack = {};
        step.description = "<b>Instructor Note (WASM):</b> Initializing Merge Sort on array size " + std::to_string(n) + ".";
        steps_json.push_back(serialize_step(step));

        run_mergesort(arr, 0, n - 1);

        for (int i = 0; i < n; ++i) sorted_indices.insert(i);
        step.array = arr;
        step.tempArray = temp_arr;
        step.activeRange = {-1, -1};
        step.mid = -1;
        step.leftPtr = -1;
        step.rightPtr = -1;
        step.stage = "complete";
        step.sortedIndices = std::vector<int>(sorted_indices.begin(), sorted_indices.end());
        step.recursionStack = {};
        step.description = "<b>Instructor Note (WASM):</b> Merge Sort complete! Fully sorted.";
        steps_json.push_back(serialize_step(step));
    }

public:
    MergeSortVisualizer(std::vector<int> arr) {
        initial_array = arr;
        n = initial_array.size();
        temp_arr = std::vector<int>(n, -1);
        generate_steps();
    }

#ifdef __EMSCRIPTEN__
    MergeSortVisualizer(emscripten::val arr_js)
        : MergeSortVisualizer(val_to_vector(arr_js)) {}
#endif

    std::string get_step(int idx) {
        if (idx >= 0 && idx < (int)steps_json.size()) return steps_json[idx];
        return "";
    }
    int get_total_steps() { return steps_json.size(); }
};

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::class_<KnapsackVisualizer>("KnapsackVisualizer")
        .constructor<emscripten::val, emscripten::val, int>()
        .function("get_step", &KnapsackVisualizer::get_step)
        .function("get_total_steps", &KnapsackVisualizer::get_total_steps);

    emscripten::class_<LCSVisualizer>("LCSVisualizer")
        .constructor<std::string, std::string>()
        .function("get_step", &LCSVisualizer::get_step)
        .function("get_total_steps", &LCSVisualizer::get_total_steps);

    emscripten::class_<QuickSortVisualizer>("QuickSortVisualizer")
        .constructor<emscripten::val>()
        .function("get_step", &QuickSortVisualizer::get_step)
        .function("get_total_steps", &QuickSortVisualizer::get_total_steps);

    emscripten::class_<MergeSortVisualizer>("MergeSortVisualizer")
        .constructor<emscripten::val>()
        .function("get_step", &MergeSortVisualizer::get_step)
        .function("get_total_steps", &MergeSortVisualizer::get_total_steps);
}
#endif // __EMSCRIPTEN__
