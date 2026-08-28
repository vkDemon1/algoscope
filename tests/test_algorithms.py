"""
Unit tests for algorithms.py — the Pyodide-side engine.

Run with:
    pip install pytest --break-system-packages   # if not already installed
    pytest tests/test_algorithms.py -v

algorithms.py is safe to import outside a browser: the Pyodide FFI bindings
at the bottom of the file are wrapped in a try/except, so on a normal
CPython interpreter only the visualizer classes get defined.
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from algorithms import (
    KnapsackVisualizer,
    LCSVisualizer,
    QuickSortVisualizer,
    MergeSortVisualizer,
    DijkstraVisualizer,
    EditDistanceVisualizer,
)


def test_knapsack_classic_textbook_case():
    viz = KnapsackVisualizer([1, 3, 4, 5], [1, 4, 5, 7], 7)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["stage"] == "complete"
    assert final["matrix"][-1][-1] == 9


def test_knapsack_matches_app_default_demo_values():
    viz = KnapsackVisualizer([2, 3, 4, 5], [3, 4, 5, 8], 8)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["matrix"][-1][-1] == 12


def test_knapsack_selected_items_actually_fit_and_match_value():
    weights = [2, 3, 4, 5]
    values = [3, 4, 5, 8]
    capacity = 8
    viz = KnapsackVisualizer(weights, values, capacity)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    selected = final["selectedItems"]
    total_weight = sum(weights[i] for i in selected)
    total_value = sum(values[i] for i in selected)
    assert total_weight <= capacity
    assert total_value == final["matrix"][-1][-1]


def test_knapsack_zero_capacity_yields_zero_value():
    viz = KnapsackVisualizer([2, 3], [5, 6], 0)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["matrix"][-1][-1] == 0
    assert final["selectedItems"] == []


def test_knapsack_step_sequence_is_well_formed():
    viz = KnapsackVisualizer([1, 2], [10, 15], 3)
    total = viz.get_total_steps()
    assert total > 0
    for i in range(total):
        step = json.loads(viz.get_step(i))
        assert "matrix" in step and "description" in step
    assert viz.get_step(total) is None
    assert viz.get_step(-1) is None


def test_lcs_known_length():
    viz = LCSVisualizer("ABCBDAB", "BDCABA")
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["matrix"][-1][-1] == 4
    assert len(final["lcsSequence"]) == 4


def test_lcs_no_common_characters():
    viz = LCSVisualizer("ABC", "XYZ")
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["matrix"][-1][-1] == 0
    assert final["lcsSequence"] == ""


def test_lcs_identical_strings():
    viz = LCSVisualizer("HELLO", "HELLO")
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["lcsSequence"] == "HELLO"


def test_lcs_reconstructed_sequence_is_actually_a_subsequence_of_both():
    def is_subsequence(sub, s):
        it = iter(s)
        return all(c in it for c in sub)

    s1, s2 = "BDCABA", "ABCBDAB"
    viz = LCSVisualizer(s1, s2)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    seq = final["lcsSequence"]
    assert is_subsequence(seq, s1)
    assert is_subsequence(seq, s2)


def test_quicksort_matches_python_sorted():
    arr = [24, 9, 32, 15, 8, 41, 18, 5]
    viz = QuickSortVisualizer(arr)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["array"] == sorted(arr)


def test_quicksort_single_element():
    viz = QuickSortVisualizer([7])
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["array"] == [7]


def test_quicksort_all_duplicates():
    viz = QuickSortVisualizer([5, 5, 5, 5])
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["array"] == [5, 5, 5, 5]


def test_quicksort_already_sorted_input():
    arr = [1, 2, 3, 4, 5]
    viz = QuickSortVisualizer(arr)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["array"] == arr


def test_quicksort_reverse_sorted_input():
    arr = [9, 7, 5, 3, 1]
    viz = QuickSortVisualizer(arr)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["array"] == sorted(arr)


def test_mergesort_matches_python_sorted():
    arr = [32, 12, 45, 8, 19, 28, 5, 41]
    viz = MergeSortVisualizer(arr)
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["array"] == sorted(arr)


def test_mergesort_single_element():
    viz = MergeSortVisualizer([7])
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["array"] == [7]


def test_mergesort_all_duplicates():
    viz = MergeSortVisualizer([5, 5, 5, 5])
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["array"] == [5, 5, 5, 5]


def test_mergesort_agrees_with_quicksort_on_same_input():
    arr = [17, 3, 29, 4, 11, 2, 8, 14, 1]
    qs_viz = QuickSortVisualizer(arr)
    ms_viz = MergeSortVisualizer(arr)
    qs_final = json.loads(qs_viz.get_step(qs_viz.get_total_steps() - 1))
    ms_final = json.loads(ms_viz.get_step(ms_viz.get_total_steps() - 1))
    assert qs_final["array"] == ms_final["array"] == sorted(arr)


def test_dijkstra_finds_shortest_path():
    grid = [
        [0, 0, 0],
        [1, 1, 0],
        [0, 0, 0]
    ]
    viz = DijkstraVisualizer(grid, [0, 0], [2, 0])
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["stage"] == "complete"
    assert len(final["path"]) > 0
    assert final["path"][0] == [0, 0]
    assert final["path"][-1] == [2, 0]


def test_dijkstra_unreachable_target():
    grid = [
        [0, 1, 0],
        [1, 1, 0],
        [0, 0, 0]
    ]
    viz = DijkstraVisualizer(grid, [0, 0], [0, 2])
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["stage"] == "no_path"
    assert final["path"] == []


def test_edit_distance_textbook_kitten_sitting():
    viz = EditDistanceVisualizer("kitten", "sitting")
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["matrix"][-1][-1] == 3


def test_edit_distance_identical_strings():
    viz = EditDistanceVisualizer("hello", "hello")
    final = json.loads(viz.get_step(viz.get_total_steps() - 1))
    assert final["matrix"][-1][-1] == 0


if __name__ == "__main__":
    import inspect
    current_module = sys.modules[__name__]
    test_functions = [
        obj for name, obj in inspect.getmembers(current_module, inspect.isfunction)
        if name.startswith("test_")
    ]
    
    passed = 0
    failed = 0
    print(f"Running {len(test_functions)} tests in test_algorithms.py...")
    for test_fn in test_functions:
        try:
            test_fn()
            print(f"  [PASS] {test_fn.__name__}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {test_fn.__name__}: {e}")
            failed += 1
            
    print(f"\nResult: {passed} passed, {failed} failed.")
    sys.exit(0 if failed == 0 else 1)


