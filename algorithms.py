import json

# ==========================================
# 1. KNAPSACK VISUALIZER (Python)
# ==========================================
class KnapsackVisualizer:
    def __init__(self, weights, values, capacity):
        self.weights = [int(w) for w in weights]
        self.values = [int(v) for v in values]
        self.capacity = int(capacity)
        self.n = len(weights)
        
        # DP table: (n + 1) rows x (capacity + 1) cols
        self.matrix = [[None] * (self.capacity + 1) for _ in range(self.n + 1)]
        # Base case: capacity 0 and item 0 have value 0
        for w in range(self.capacity + 1):
            self.matrix[0][w] = 0
        for i in range(self.n + 1):
            self.matrix[i][0] = 0
            
        self.steps = []
        self._generate_steps()
        
    def _generate_steps(self):
        # Stage 1: Base Case Initialization
        self.steps.append({
            "stage": "initialization",
            "matrix": [row[:] for row in self.matrix],
            "currentRow": 0,
            "currentCol": -1,
            "compareCells": [],
            "selectedItems": [],
            "description": "<b>Instructor Note:</b> We begin by initializing the base cases. Row 0 (choosing from 0 items) and Column 0 (knapsack capacity of 0) are filled with 0s since no value can be obtained under these conditions."
        })
        
        # Stage 2: Filling the DP table
        for i in range(1, self.n + 1):
            wt = self.weights[i-1]
            val = self.values[i-1]
            for w in range(1, self.capacity + 1):
                exclude_val = self.matrix[i-1][w]
                
                if wt <= w:
                    include_val = self.matrix[i-1][w - wt] + val
                    best_val = max(exclude_val, include_val)
                    compare_cells = [[i-1, w], [i-1, w - wt]]
                    
                    if include_val > exclude_val:
                        desc = (
                            f"<b>Instructor Note:</b> Evaluating cell <code>dp[{i}][{w}]</code> for <b>Item {i}</b> (weight={wt}, value={val}) at capacity <b>{w}</b>.<br><br>"
                            f"• <b>Option A (Exclude Item {i}):</b> Carry forward optimal value from previous cell <code>dp[{i-1}][{w}]</code> = <b>${exclude_val}</b>.<br>"
                            f"• <b>Option B (Include Item {i}):</b> Add item value (<b>${val}</b>) + optimal value with remaining capacity {w} - {wt} = {w-wt} from previous row <code>dp[{i-1}][{w-wt}]</code> (<b>${self.matrix[i-1][w-wt]}</b>), total = <b>${include_val}</b>.<br><br>"
                            f"<b>Decision:</b> Since Option B (<b>${include_val}</b>) &gt; Option A (<b>${exclude_val}</b>), we <b>INCLUDE</b> Item {i}. Store <b>{best_val}</b> in the table."
                        )
                    else:
                        desc = (
                            f"<b>Instructor Note:</b> Evaluating cell <code>dp[{i}][{w}]</code> for <b>Item {i}</b> (weight={wt}, value={val}) at capacity <b>{w}</b>.<br><br>"
                            f"• <b>Option A (Exclude Item {i}):</b> Carry forward optimal value from previous cell <code>dp[{i-1}][{w}]</code> = <b>${exclude_val}</b>.<br>"
                            f"• <b>Option B (Include Item {i}):</b> Add item value (<b>${val}</b>) + optimal value with remaining capacity {w} - {wt} = {w-wt} from previous row <code>dp[{i-1}][{w-wt}]</code> (<b>${self.matrix[i-1][w-wt]}</b>), total = <b>${include_val}</b>.<br><br>"
                            f"<b>Decision:</b> Since Option A (<b>${exclude_val}</b>) &ge; Option B (<b>${include_val}</b>), we <b>EXCLUDE</b> Item {i} to optimize value. Store <b>{best_val}</b> in the table."
                        )
                else:
                    best_val = exclude_val
                    compare_cells = [[i-1, w]]
                    desc = (
                        f"<b>Instructor Note:</b> Evaluating cell <code>dp[{i}][{w}]</code> for <b>Item {i}</b> (weight={wt}, value={val}) at capacity <b>{w}</b>.<br><br>"
                        f"The weight of Item {i} (<b>{wt}</b>) exceeds current capacity (<b>{w}</b>). It is physically impossible to include this item.<br><br>"
                        f"<b>Decision:</b> We must <b>EXCLUDE</b> Item {i} and copy the optimal value from the cell directly above: <code>dp[{i-1}][{w}]</code> = <b>${best_val}</b>."
                    )
                
                self.matrix[i][w] = best_val
                
                self.steps.append({
                    "stage": "calculation",
                    "matrix": [row[:] for row in self.matrix],
                    "currentRow": i,
                    "currentCol": w,
                    "compareCells": compare_cells,
                    "selectedItems": [],
                    "description": desc
                })
                
        # Stage 3: Backtracking
        selected = []
        curr_w = self.capacity
        curr_i = self.n
        
        self.steps.append({
            "stage": "backtracking_start",
            "matrix": [row[:] for row in self.matrix],
            "currentRow": curr_i,
            "currentCol": curr_w,
            "compareCells": [],
            "selectedItems": [],
            "description": f"<b>Instructor Note:</b> DP table is fully filled! The maximum possible value is <b>${self.matrix[self.n][self.capacity]}</b> (bottom-right cell). We now begin backtracking from cell <code>dp[{self.n}][{self.capacity}]</code> to trace back which items were selected."
        })
        
        while curr_i > 0 and curr_w > 0:
            wt = self.weights[curr_i - 1]
            val = self.values[curr_i - 1]
            
            # If values differ, item was included
            if self.matrix[curr_i][curr_w] != self.matrix[curr_i - 1][curr_w]:
                selected.append(curr_i - 1)
                desc = (
                    f"<b>Instructor Note:</b> Reaching cell <code>dp[{curr_i}][{curr_w}]</code> = <b>${self.matrix[curr_i][curr_w]}</b>.<br><br>"
                    f"Compare this value with the cell directly above: <code>dp[{curr_i-1}][{curr_w}]</code> = <b>${self.matrix[curr_i-1][curr_w]}</b>.<br>"
                    f"Since the values differ, <b>Item {curr_i} (weight={wt}, value=${val}) must have been SELECTED</b>.<br><br>"
                    f"We add Item {curr_i} to our solution set, deduct its weight ({wt}) from our capacity ({curr_w} &rarr; {curr_w - wt}), and move up to row <b>{curr_i-1}</b>."
                )
                prev_i = curr_i
                prev_w = curr_w
                curr_w -= wt
                curr_i -= 1
                
                self.steps.append({
                    "stage": "backtracking",
                    "matrix": [row[:] for row in self.matrix],
                    "currentRow": curr_i,
                    "currentCol": curr_w,
                    "compareCells": [[prev_i, prev_w], [curr_i, curr_w]],
                    "selectedItems": list(selected),
                    "description": desc
                })
            else:
                desc = (
                    f"<b>Instructor Note:</b> Reaching cell <code>dp[{curr_i}][{curr_w}]</code> = <b>${self.matrix[curr_i][curr_w]}</b>.<br><br>"
                    f"Compare this value with the cell directly above: <code>dp[{curr_i-1}][{curr_w}]</code> = <b>${self.matrix[curr_i-1][curr_w]}</b>.<br>"
                    f"Since the values are identical, <b>Item {curr_i} was NOT selected</b>. The value was simply carried forward from the row above.<br><br>"
                    f"We move directly up to row <b>{curr_i-1}</b> at the same capacity <b>{curr_w}</b>."
                )
                prev_i = curr_i
                prev_w = curr_w
                curr_i -= 1
                
                self.steps.append({
                    "stage": "backtracking",
                    "matrix": [row[:] for row in self.matrix],
                    "currentRow": curr_i,
                    "currentCol": curr_w,
                    "compareCells": [[prev_i, prev_w], [curr_i, curr_w]],
                    "selectedItems": list(selected),
                    "description": desc
                })
                
        selected_names = ", ".join([f"Item {idx+1} (weight={self.weights[idx]}, value=${self.values[idx]})" for idx in reversed(selected)])
        self.steps.append({
            "stage": "complete",
            "matrix": [row[:] for row in self.matrix],
            "currentRow": -1,
            "currentCol": -1,
            "compareCells": [],
            "selectedItems": list(selected),
            "description": (
                f"<b>Instructor Note:</b> Backtracking complete! We reached row 0 (or capacity 0).<br><br>"
                f"<b>Optimal Solution Set:</b><br>{selected_names if selected else 'None'}<br><br>"
                f"<b>Total Capacity Utilized:</b> {sum(self.weights[i] for i in selected)} / {self.capacity} weight units.<br>"
                f"<b>Maximized Total Value:</b> <b>${self.matrix[self.n][self.capacity]}</b>."
            )
        })

    def get_step(self, idx):
        if 0 <= idx < len(self.steps):
            return json.dumps(self.steps[idx])
        return None

    def get_total_steps(self):
        return len(self.steps)


# ==========================================
# 2. LONGEST COMMON SUBSEQUENCE (LCS)
# ==========================================
class LCSVisualizer:
    def __init__(self, s1, s2):
        self.s1 = str(s1)
        self.s2 = str(s2)
        self.m = len(s2) # rows (char alignment from s2)
        self.n = len(s1) # cols (char alignment from s1)
        
        # DP table: (m + 1) rows x (n + 1) cols
        self.matrix = [[None] * (self.n + 1) for _ in range(self.m + 1)]
        # Base case initializations
        for i in range(self.m + 1):
            self.matrix[i][0] = 0
        for j in range(self.n + 1):
            self.matrix[0][j] = 0
            
        self.steps = []
        self._generate_steps()
        
    def _generate_steps(self):
        # Stage 1: Base Case Initialization
        self.steps.append({
            "stage": "initialization",
            "matrix": [row[:] for row in self.matrix],
            "currentRow": 0,
            "currentCol": -1,
            "compareCells": [],
            "backtrackPath": [],
            "lcsSequence": "",
            "description": "<b>Instructor Note:</b> We begin by initializing the base cases. Row 0 (empty prefix of String 2) and Column 0 (empty prefix of String 1) are set to 0. A comparison with an empty string yields a subsequence length of 0."
        })
        
        # Stage 2: Fill DP Matrix
        for i in range(1, self.m + 1):
            c2 = self.s2[i-1]
            for j in range(1, self.n + 1):
                c1 = self.s1[j-1]
                
                match = (c1 == c2)
                if match:
                    best_val = self.matrix[i-1][j-1] + 1
                    compare_cells = [[i-1, j-1]]
                    desc = (
                        f"<b>Instructor Note:</b> Evaluating cell <code>dp[{i}][{j}]</code> for characters "
                        f"String 1: <code>'{c1}'</code> (index {j-1}) and String 2: <code>'{c2}'</code> (index {i-1}).<br><br>"
                        f"• Characters MATCH! (<b>'{c1}' == '{c2}'</b>)<br>"
                        f"• Add 1 to diagonal cell <code>dp[{i-1}][{j-1}]</code> value (<b>{self.matrix[i-1][j-1]}</b>), total = <b>{best_val}</b>.<br><br>"
                        f"<b>Decision:</b> Since there is a match, we extend the subsequence. Store <b>{best_val}</b> in the table."
                    )
                else:
                    exclude_above = self.matrix[i-1][j]
                    exclude_left = self.matrix[i][j-1]
                    best_val = max(exclude_above, exclude_left)
                    compare_cells = [[i-1, j], [i, j-1]]
                    
                    decision_str = "exclude_above (cell above)" if exclude_above >= exclude_left else "exclude_left (cell left)"
                    desc = (
                        f"<b>Instructor Note:</b> Evaluating cell <code>dp[{i}][{j}]</code> for characters "
                        f"String 1: <code>'{c1}'</code> and String 2: <code>'{c2}'</code>.<br><br>"
                        f"• Characters MISMATCH! (<b>'{c1}' &ne; '{c2}'</b>)<br>"
                        f"• Value from above: <code>dp[{i-1}][{j}]</code> = <b>{exclude_above}</b>.<br>"
                        f"• Value from left: <code>dp[{i}][{j-1}]</code> = <b>{exclude_left}</b>.<br><br>"
                        f"<b>Decision:</b> We carry forward the maximum of above and left. Store <b>{best_val}</b> (from {decision_str}) in the table."
                    )
                    
                self.matrix[i][j] = best_val
                
                self.steps.append({
                    "stage": "calculation",
                    "matrix": [row[:] for row in self.matrix],
                    "currentRow": i,
                    "currentCol": j,
                    "compareCells": compare_cells,
                    "backtrackPath": [],
                    "lcsSequence": "",
                    "description": desc
                })
                
        # Stage 3: Backtracking
        backtrack_path = []
        lcs_chars = []
        curr_i = self.m
        curr_j = self.n
        
        self.steps.append({
            "stage": "backtracking_start",
            "matrix": [row[:] for row in self.matrix],
            "currentRow": curr_i,
            "currentCol": curr_j,
            "compareCells": [],
            "backtrackPath": [],
            "lcsSequence": "",
            "description": f"<b>Instructor Note:</b> Dynamic programming matrix is fully populated! The length of the Longest Common Subsequence is <b>{self.matrix[self.m][self.n]}</b>. We now backtrack from cell <code>dp[{self.m}][{self.n}]</code> to reconstruct the sequence."
        })
        
        while curr_i > 0 and curr_j > 0:
            backtrack_path.append([curr_i, curr_j])
            c2 = self.s2[curr_i-1]
            c1 = self.s1[curr_j-1]
            
            if c1 == c2:
                lcs_chars.append(c1)
                curr_sequence = "".join(reversed(lcs_chars))
                
                desc = (
                    f"<b>Instructor Note:</b> Reaching cell <code>dp[{curr_i}][{curr_j}]</code> = <b>{self.matrix[curr_i][curr_j]}</b>.<br>"
                    f"Characters match: String 1: <code>'{c1}'</code> and String 2: <code>'{c2}'</code>.<br><br>"
                    f"This means <b>'{c1}' is part of the LCS!</b><br>"
                    f"We record <code>'{c1}'</code>, and move diagonally up-left to row <b>{curr_i-1}</b>, col <b>{curr_j-1}</b>."
                )
                
                prev_i, prev_j = curr_i, curr_j
                curr_i -= 1
                curr_j -= 1
                
                self.steps.append({
                    "stage": "backtracking",
                    "matrix": [row[:] for row in self.matrix],
                    "currentRow": curr_i,
                    "currentCol": curr_j,
                    "compareCells": [[prev_i, prev_j], [curr_i, curr_j]],
                    "backtrackPath": list(backtrack_path),
                    "lcsSequence": curr_sequence,
                    "description": desc
                })
            else:
                val_above = self.matrix[curr_i-1][curr_j]
                val_left = self.matrix[curr_i][curr_j-1]
                curr_sequence = "".join(reversed(lcs_chars))
                
                if val_above >= val_left:
                    desc = (
                        f"<b>Instructor Note:</b> Reaching cell <code>dp[{curr_i}][{curr_j}]</code> = <b>{self.matrix[curr_i][curr_j]}</b>.<br>"
                        f"Mismatch between <code>'{c1}'</code> and <code>'{c2}'</code>.<br><br>"
                        f"Comparing cell above (<b>{val_above}</b>) vs cell left (<b>{val_left}</b>).<br>"
                        f"Since above is greater or equal, we move up to cell <code>dp[{curr_i-1}][{curr_j}]</code>."
                    )
                    prev_i, prev_j = curr_i, curr_j
                    curr_i -= 1
                else:
                    desc = (
                        f"<b>Instructor Note:</b> Reaching cell <code>dp[{curr_i}][{curr_j}]</code> = <b>{self.matrix[curr_i][curr_j]}</b>.<br>"
                        f"Mismatch between <code>'{c1}'</code> and <code>'{c2}'</code>.<br><br>"
                        f"Comparing cell above (<b>{val_above}</b>) vs cell left (<b>{val_left}</b>).<br>"
                        f"Since left is greater, we move left to cell <code>dp[{curr_i}][{curr_j-1}]</code>."
                    )
                    prev_i, prev_j = curr_i, curr_j
                    curr_j -= 1
                    
                self.steps.append({
                    "stage": "backtracking",
                    "matrix": [row[:] for row in self.matrix],
                    "currentRow": curr_i,
                    "currentCol": curr_j,
                    "compareCells": [[prev_i, prev_j], [curr_i, curr_j]],
                    "backtrackPath": list(backtrack_path),
                    "lcsSequence": curr_sequence,
                    "description": desc
                })
                
        # Final element for backtrack path at the boundary
        backtrack_path.append([curr_i, curr_j])
        final_sequence = "".join(reversed(lcs_chars))
        
        self.steps.append({
            "stage": "complete",
            "matrix": [row[:] for row in self.matrix],
            "currentRow": -1,
            "currentCol": -1,
            "compareCells": [],
            "backtrackPath": list(backtrack_path),
            "lcsSequence": final_sequence,
            "description": (
                f"<b>Instructor Note:</b> Reconstructed LCS successfully!<br><br>"
                f"• <b>String 1:</b> <code>{self.s1}</code><br>"
                f"• <b>String 2:</b> <code>{self.s2}</code><br><br>"
                f"<b>Longest Common Subsequence:</b> <b style='color: var(--accent-green); font-size: 1.25rem;'>\"{final_sequence if final_sequence else 'None'}\"</b> (length = {len(final_sequence)})."
            )
        })

    def get_step(self, idx):
        if 0 <= idx < len(self.steps):
            return json.dumps(self.steps[idx])
        return None

    def get_total_steps(self):
        return len(self.steps)


# ==========================================
# 3. QUICKSORT VISUALIZER (Python)
# ==========================================
class QuickSortVisualizer:
    def __init__(self, array):
        self.initial_array = list(array)
        self.steps = []
        self.sorted_indices = set()
        self.recursion_stack = []
        self._generate_steps()
        
    def _generate_steps(self):
        arr = list(self.initial_array)
        n = len(arr)
        
        self.steps.append({
            "array": list(arr),
            "pivotIdx": -1,
            "leftPtr": -1,
            "rightPtr": -1,
            "activeRange": [0, n - 1],
            "swapped": [],
            "sortedIndices": [],
            "recursionStack": [],
            "description": f"<b>Instructor Note:</b> Initializing Quick Sort. We have an unsorted array of size {n}: <code>{arr}</code>. We will use the Lomuto Partition Scheme recursive structure to sort subarrays partition-by-partition."
        })
        
        def run_quicksort(low, high):
            if low > high:
                return
            if low == high:
                self.sorted_indices.add(low)
                self.steps.append({
                    "array": list(arr),
                    "pivotIdx": -1,
                    "leftPtr": -1,
                    "rightPtr": -1,
                    "activeRange": [low, high],
                    "swapped": [],
                    "sortedIndices": list(self.sorted_indices),
                    "recursionStack": list(self.recursion_stack),
                    "description": f"<b>Instructor Note:</b> Subarray at range [<code>{low}</code>, <code>{high}</code>] has length 1. A single element is trivially sorted. Marking index {low} as sorted."
                })
                return
                
            self.recursion_stack.append([low, high])
            
            self.steps.append({
                "array": list(arr),
                "pivotIdx": -1,
                "leftPtr": -1,
                "rightPtr": -1,
                "activeRange": [low, high],
                "swapped": [],
                "sortedIndices": list(self.sorted_indices),
                "recursionStack": list(self.recursion_stack),
                "description": f"<b>Instructor Note:</b> Partitioning subarray in range [<code>{low}</code>, <code>{high}</code>]. Adding range to recursive stack."
            })
            
            # Select pivot as the rightmost element
            pivot_idx = high
            pivot_val = arr[pivot_idx]
            
            self.steps.append({
                "array": list(arr),
                "pivotIdx": pivot_idx,
                "leftPtr": -1,
                "rightPtr": -1,
                "activeRange": [low, high],
                "swapped": [],
                "sortedIndices": list(self.sorted_indices),
                "recursionStack": list(self.recursion_stack),
                "description": f"<b>Instructor Note:</b> Selected pivot element <b>{pivot_val}</b> at index {pivot_idx} (the high element of the current range). We will now organize all elements in [<code>{low}</code>, <code>{high-1}</code>] so that elements smaller than {pivot_val} go to the left and larger elements go to the right."
            })
            
            i = low - 1
            for j in range(low, high):
                self.steps.append({
                    "array": list(arr),
                    "pivotIdx": pivot_idx,
                    "leftPtr": i,
                    "rightPtr": j,
                    "activeRange": [low, high],
                    "swapped": [],
                    "sortedIndices": list(self.sorted_indices),
                    "recursionStack": list(self.recursion_stack),
                    "description": f"<b>Instructor Note:</b> Comparing scanning element <code>arr[{j}]</code> = <b>{arr[j]}</b> with pivot = <b>{pivot_val}</b>."
                })
                
                if arr[j] < pivot_val:
                    i += 1
                    arr[i], arr[j] = arr[j], arr[i]
                    self.steps.append({
                        "array": list(arr),
                        "pivotIdx": pivot_idx,
                        "leftPtr": i,
                        "rightPtr": j,
                        "activeRange": [low, high],
                        "swapped": [i, j],
                        "sortedIndices": list(self.sorted_indices),
                        "recursionStack": list(self.recursion_stack),
                        "description": f"<b>Instructor Note:</b> Since {arr[i]} &lt; {pivot_val}, we increment the smaller-elements pointer to <code>i</code> = {i} and <b>SWAP</b> <code>arr[{i}]</code> and <code>arr[{j}]</code>."
                    })
            
            # Place pivot in sorted place
            arr[i+1], arr[high] = arr[high], arr[i+1]
            pivot_final_idx = i + 1
            self.sorted_indices.add(pivot_final_idx)
            
            self.steps.append({
                "array": list(arr),
                "pivotIdx": pivot_final_idx,
                "leftPtr": -1,
                "rightPtr": -1,
                "activeRange": [low, high],
                "swapped": [pivot_final_idx, high],
                "sortedIndices": list(self.sorted_indices),
                "recursionStack": list(self.recursion_stack),
                "description": f"<b>Instructor Note:</b> Scanning finished! We swap the pivot <b>{pivot_val}</b> (index {high}) into its final sorted position at index <b>{pivot_final_idx}</b>. Pivot index <b>{pivot_final_idx}</b> is now permanently sorted."
            })
            
            self.recursion_stack.pop()
            
            run_quicksort(low, pivot_final_idx - 1)
            run_quicksort(pivot_final_idx + 1, high)
            
        run_quicksort(0, n - 1)
        
        self.steps.append({
            "array": list(arr),
            "pivotIdx": -1,
            "leftPtr": -1,
            "rightPtr": -1,
            "activeRange": [-1, -1],
            "swapped": [],
            "sortedIndices": list(range(n)),
            "recursionStack": [],
            "description": f"<b>Instructor Note:</b> Quick Sort complete! The entire array is sorted: <code>{arr}</code>."
        })

    def get_step(self, idx):
        if 0 <= idx < len(self.steps):
            return json.dumps(self.steps[idx])
        return None

    def get_total_steps(self):
        return len(self.steps)


# ==========================================
# 4. MERGE SORT VISUALIZER (Python)
# ==========================================
class MergeSortVisualizer:
    def __init__(self, array):
        self.initial_array = list(array)
        self.steps = []
        self.sorted_indices = set()
        self.recursion_stack = []
        self._generate_steps()
        
    def _generate_steps(self):
        arr = list(self.initial_array)
        n = len(arr)
        temp_arr = [None] * n # Dynamic representation of the merging array
        
        self.steps.append({
            "array": list(arr),
            "tempArray": list(temp_arr),
            "activeRange": [0, n - 1],
            "mid": -1,
            "leftPtr": -1,
            "rightPtr": -1,
            "stage": "initialization",
            "sortedIndices": [],
            "recursionStack": [],
            "description": f"<b>Instructor Note:</b> Initializing Merge Sort. We have an unsorted array of size {n}: <code>{arr}</code>. We will recursively divide the array into halves, sort them, and merge them back using a helper array."
        })
        
        def merge(low, mid, high):
            # Make sure temp array values in merge range are cleared first
            for k in range(low, high + 1):
                temp_arr[k] = None
                
            self.steps.append({
                "array": list(arr),
                "tempArray": list(temp_arr),
                "activeRange": [low, high],
                "mid": mid,
                "leftPtr": -1,
                "rightPtr": -1,
                "stage": "merge_init",
                "sortedIndices": list(self.sorted_indices),
                "recursionStack": list(self.recursion_stack),
                "description": f"<b>Instructor Note:</b> Preparing to merge left subarray [<code>{low}</code> to <code>{mid}</code>] and right subarray [<code>{mid+1}</code> to <code>{high}</code>]."
            })
            
            i = low      # Index scanner for left part
            j = mid + 1  # Index scanner for right part
            k = low      # Index scanner for target temp
            
            while i <= mid and j <= high:
                self.steps.append({
                    "array": list(arr),
                    "tempArray": list(temp_arr),
                    "activeRange": [low, high],
                    "mid": mid,
                    "leftPtr": i,
                    "rightPtr": j,
                    "stage": "compare",
                    "sortedIndices": list(self.sorted_indices),
                    "recursionStack": list(self.recursion_stack),
                    "description": f"<b>Instructor Note:</b> Comparing element <b>{arr[i]}</b> (index {i}, left partition) and element <b>{arr[j]}</b> (index {j}, right partition)."
                })
                
                if arr[i] <= arr[j]:
                    temp_arr[k] = arr[i]
                    self.steps.append({
                        "array": list(arr),
                        "tempArray": list(temp_arr),
                        "activeRange": [low, high],
                        "mid": mid,
                        "leftPtr": i,
                        "rightPtr": j,
                        "stage": "copy_temp",
                        "sortedIndices": list(self.sorted_indices),
                        "recursionStack": list(self.recursion_stack),
                        "description": f"<b>Instructor Note:</b> Since {arr[i]} &le; {arr[j]}, we copy element <b>{arr[i]}</b> to helper index <b>{k}</b>."
                    })
                    i += 1
                else:
                    temp_arr[k] = arr[j]
                    self.steps.append({
                        "array": list(arr),
                        "tempArray": list(temp_arr),
                        "activeRange": [low, high],
                        "mid": mid,
                        "leftPtr": i,
                        "rightPtr": j,
                        "stage": "copy_temp",
                        "sortedIndices": list(self.sorted_indices),
                        "recursionStack": list(self.recursion_stack),
                        "description": f"<b>Instructor Note:</b> Since {arr[j]} &lt; {arr[i]}, we copy element <b>{arr[j]}</b> to helper index <b>{k}</b>."
                    })
                    j += 1
                k += 1
                
            # Copy remaining of left
            while i <= mid:
                temp_arr[k] = arr[i]
                self.steps.append({
                    "array": list(arr),
                    "tempArray": list(temp_arr),
                    "activeRange": [low, high],
                    "mid": mid,
                    "leftPtr": i,
                    "rightPtr": -1,
                    "stage": "copy_temp",
                    "sortedIndices": list(self.sorted_indices),
                    "recursionStack": list(self.recursion_stack),
                    "description": f"<b>Instructor Note:</b> Left partition index {i} has remaining elements. Copy <b>{arr[i]}</b> to helper index <b>{k}</b>."
                })
                i += 1
                k += 1
                
            # Copy remaining of right
            while j <= high:
                temp_arr[k] = arr[j]
                self.steps.append({
                    "array": list(arr),
                    "tempArray": list(temp_arr),
                    "activeRange": [low, high],
                    "mid": mid,
                    "leftPtr": -1,
                    "rightPtr": j,
                    "stage": "copy_temp",
                    "sortedIndices": list(self.sorted_indices),
                    "recursionStack": list(self.recursion_stack),
                    "description": f"<b>Instructor Note:</b> Right partition index {j} has remaining elements. Copy <b>{arr[j]}</b> to helper index <b>{k}</b>."
                })
                j += 1
                k += 1
                
            # Copy back to main array
            for idx in range(low, high + 1):
                arr[idx] = temp_arr[idx]
                
                # If this merge completes the entire array, mark elements as sorted
                if low == 0 and high == n - 1:
                    self.sorted_indices.add(idx)
                    
                # To animate copy-back, clear that index in temp
                temp_arr_copy = list(temp_arr)
                temp_arr_copy[idx] = None
                
                self.steps.append({
                    "array": list(arr),
                    "tempArray": list(temp_arr_copy),
                    "activeRange": [low, high],
                    "mid": mid,
                    "leftPtr": -1,
                    "rightPtr": -1,
                    "stage": "copy_back",
                    "sortedIndices": list(self.sorted_indices),
                    "recursionStack": list(self.recursion_stack),
                    "description": f"<b>Instructor Note:</b> Copying element <b>{arr[idx]}</b> back from helper index {idx} to the main array."
                })
                temp_arr[idx] = None # permanently reset index in temp
                
        def run_mergesort(low, high):
            if low >= high:
                return
                
            mid = (low + high) // 2
            
            self.recursion_stack.append([low, high])
            self.steps.append({
                "array": list(arr),
                "tempArray": list(temp_arr),
                "activeRange": [low, high],
                "mid": mid,
                "leftPtr": -1,
                "rightPtr": -1,
                "stage": "split",
                "sortedIndices": list(self.sorted_indices),
                "recursionStack": list(self.recursion_stack),
                "description": f"<b>Instructor Note:</b> Splitting subarray at range [<code>{low}</code> to <code>{high}</code>] into left [<code>{low}</code> to <code>{mid}</code>] and right [<code>{mid+1}</code> to <code>{high}</code>]. Subarray registered on stack."
            })
            
            run_mergesort(low, mid)
            run_mergesort(mid + 1, high)
            
            merge(low, mid, high)
            
            self.recursion_stack.pop()
            self.steps.append({
                "array": list(arr),
                "tempArray": list(temp_arr),
                "activeRange": [low, high],
                "mid": mid,
                "leftPtr": -1,
                "rightPtr": -1,
                "stage": "split_complete",
                "sortedIndices": list(self.sorted_indices),
                "recursionStack": list(self.recursion_stack),
                "description": f"<b>Instructor Note:</b> Merge complete for subarray range [<code>{low}</code> to <code>{high}</code>]. Popping range from stack."
            })
            
        run_mergesort(0, n - 1)
        
        self.steps.append({
            "array": list(arr),
            "tempArray": list(temp_arr),
            "activeRange": [-1, -1],
            "mid": -1,
            "leftPtr": -1,
            "rightPtr": -1,
            "stage": "complete",
            "sortedIndices": list(range(n)),
            "recursionStack": [],
            "description": f"<b>Instructor Note:</b> Merge Sort complete! The entire array is sorted: <code>{arr}</code>."
        })

    def get_step(self, idx):
        if 0 <= idx < len(self.steps):
            return json.dumps(self.steps[idx])
        return None

    def get_total_steps(self):
        return len(self.steps)


# ==========================================
# 5. PYODIDE BINDINGS LAYER
# ==========================================
try:
    from pyodide.ffi import create_proxy
    from js import window
    
    def create_knapsack_visualizer(weights_js, values_js, capacity):
        return KnapsackVisualizer(list(weights_js), list(values_js), capacity)
        
    def create_lcs_visualizer(s1, s2):
        return LCSVisualizer(s1, s2)
        
    def create_quicksort_visualizer(array_js):
        return QuickSortVisualizer(list(array_js))
        
    def create_mergesort_visualizer(array_js):
        return MergeSortVisualizer(list(array_js))
        
    # Expose constructors to JavaScript window object
    window.createKnapsackVisualizer = create_proxy(create_knapsack_visualizer)
    window.createLCSVisualizer = create_proxy(create_lcs_visualizer)
    window.createQuickSortVisualizer = create_proxy(create_quicksort_visualizer)
    window.createMergeSortVisualizer = create_proxy(create_mergesort_visualizer)
    print("Python algorithms registered successfully with window!")
    
    # Notify JS that everything is loaded and bound
    if hasattr(window, "onPythonLoaded"):
        window.onPythonLoaded()
except Exception as e:
    import sys
    print(f"ERROR IN PYTHON BINDINGS: {type(e).__name__}: {e}", file=sys.stderr)
    try:
        import traceback
        traceback.print_exc(file=sys.stderr)
    except:
        pass
