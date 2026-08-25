// Native unit tests for algorithms.cpp — compiled with plain g++, no
// Emscripten SDK required. This is what CI runs on every push/PR; the
// separate WASM build (compile_wasm.sh/.bat) is only exercised at deploy
// time. Run locally with:
//   g++ -std=c++17 -O2 -o test_algorithms test_algorithms.cpp && ./test_algorithms
#include "../algorithms.cpp"
#include <iostream>
#include <cassert>

static int failures = 0;

#define CHECK(cond, msg) do { \
    if (!(cond)) { std::cerr << "FAIL: " << msg << " (" << __FILE__ << ":" << __LINE__ << ")\n"; failures++; } \
    else { std::cout << "  ok  : " << msg << "\n"; } \
} while (0)

void test_knapsack() {
    std::cout << "-- Knapsack --\n";
    {
        // Classic textbook case: optimal value is 9 (items of weight 3 and 4)
        KnapsackVisualizer viz({1, 3, 4, 5}, {1, 4, 5, 7}, 7);
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(last.find("\"stage\":\"complete\"") != std::string::npos, "final step is the 'complete' stage");
        CHECK(last.find("Maximized Total Value:</b> <b>$9</b>") != std::string::npos,
              "knapsack([1,3,4,5],[1,4,5,7],7) maximizes to $9");
    }
    {
        // App's own default demo values
        KnapsackVisualizer viz({2, 3, 4, 5}, {3, 4, 5, 8}, 8);
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(last.find("Maximized Total Value:</b> <b>$12</b>") != std::string::npos,
              "default demo values (2,3,4,5 / 3,4,5,8 / cap 8) maximize to $12");
    }
    {
        KnapsackVisualizer viz({2, 3}, {5, 6}, 0);
        CHECK(viz.get_total_steps() > 0, "zero-capacity knapsack still produces steps");
    }
}

void test_lcs() {
    std::cout << "-- LCS --\n";
    {
        LCSVisualizer viz("ABCBDAB", "BDCABA");
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(last.find("length = 4") != std::string::npos, "LCS(ABCBDAB, BDCABA) has length 4");
    }
    {
        LCSVisualizer viz("ABC", "XYZ");
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(last.find("length = 0") != std::string::npos, "LCS with no common characters has length 0");
    }
    {
        LCSVisualizer viz("HELLO", "HELLO");
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(last.find("length = 5") != std::string::npos, "LCS of identical strings equals their length");
    }
}

bool isSortedAscending(const std::vector<int>& v) {
    for (size_t i = 1; i < v.size(); ++i) if (v[i-1] > v[i]) return false;
    return true;
}

bool isPermutation(std::vector<int> a, std::vector<int> b) {
    if (a.size() != b.size()) return false;
    std::sort(a.begin(), a.end());
    std::sort(b.begin(), b.end());
    return a == b;
}

std::vector<int> extractFinalArray(const std::string& lastJson) {
    std::vector<int> finalArr;
    size_t pos = lastJson.find("\"array\":[");
    if (pos == std::string::npos) return finalArr;
    size_t start = pos + 9;
    size_t end = lastJson.find(']', start);
    std::stringstream ss(lastJson.substr(start, end - start));
    std::string tok;
    while (std::getline(ss, tok, ',')) if (!tok.empty()) finalArr.push_back(std::stoi(tok));
    return finalArr;
}

void test_quicksort() {
    std::cout << "-- QuickSort --\n";
    std::vector<int> input = {24, 9, 32, 15, 8, 41, 18, 5};
    QuickSortVisualizer viz(input);
    std::string lastJson = viz.get_step(viz.get_total_steps() - 1);

    std::vector<int> expected = input;
    std::sort(expected.begin(), expected.end());
    std::vector<int> finalArr = extractFinalArray(lastJson);

    CHECK(!finalArr.empty(), "final step contains an 'array' field");
    CHECK(finalArr == expected, "quicksort output matches std::sort reference");
    CHECK(isSortedAscending(finalArr), "quicksort output is ascending");
    CHECK(isPermutation(finalArr, input), "quicksort output is a permutation of the input");

    QuickSortVisualizer single(std::vector<int>{7});
    CHECK(single.get_total_steps() > 0, "single-element array produces steps without crashing");
    QuickSortVisualizer dup(std::vector<int>{5, 5, 5, 5});
    CHECK(dup.get_total_steps() > 0, "all-duplicate array produces steps without crashing");
}

void test_mergesort() {
    std::cout << "-- MergeSort --\n";
    std::vector<int> input = {32, 12, 45, 8, 19, 28, 5, 41};
    MergeSortVisualizer viz(input);
    std::string lastJson = viz.get_step(viz.get_total_steps() - 1);

    std::vector<int> expected = input;
    std::sort(expected.begin(), expected.end());
    std::vector<int> finalArr = extractFinalArray(lastJson);

    CHECK(!finalArr.empty(), "final step contains an 'array' field");
    CHECK(finalArr == expected, "mergesort output matches std::sort reference");
    CHECK(isSortedAscending(finalArr), "mergesort output is ascending");
    CHECK(isPermutation(finalArr, input), "mergesort output is a permutation of the input");

    MergeSortVisualizer single(std::vector<int>{7});
    CHECK(single.get_total_steps() > 0, "single-element array produces steps without crashing");
}

void test_dijkstra() {
    std::cout << "-- Dijkstra --\n";
    {
        std::vector<std::vector<int>> grid = {
            {0, 0, 0},
            {1, 1, 0},
            {0, 0, 0}
        };
        DijkstraVisualizer viz(grid, {0, 0}, {2, 0});
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(last.find("\"stage\":\"complete\"") != std::string::npos, "Dijkstra reaches target successfully");
    }
    {
        std::vector<std::vector<int>> grid = {
            {0, 1, 0},
            {1, 1, 0},
            {0, 0, 0}
        };
        DijkstraVisualizer viz(grid, {0, 0}, {0, 2});
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(last.find("\"stage\":\"no_path\"") != std::string::npos, "Dijkstra reports no_path when target blocked");
    }
}

void test_edit_distance() {
    std::cout << "-- Edit Distance --\n";
    {
        EditDistanceVisualizer viz("kitten", "sitting");
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(viz.get_total_steps() > 0, "EditDistance(kitten, sitting) step sequence generated");
    }
    {
        EditDistanceVisualizer viz("hello", "hello");
        std::string last = viz.get_step(viz.get_total_steps() - 1);
        CHECK(viz.get_total_steps() > 0, "EditDistance(hello, hello) step sequence generated");
    }
}

int main() {
    test_knapsack();
    test_lcs();
    test_quicksort();
    test_mergesort();
    test_dijkstra();
    test_edit_distance();

    std::cout << "\n" << (failures == 0 ? "ALL TESTS PASSED" : "SOME TESTS FAILED") << "\n";
    return failures == 0 ? 0 : 1;
}

