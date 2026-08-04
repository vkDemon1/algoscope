#!/usr/bin/env bash
# compile_wasm.sh - Compile the C++ algorithms to WebAssembly using Emscripten.
# Requires the Emscripten SDK (emcc) on PATH: https://emscripten.org/docs/getting_started/downloads.html
set -e

echo "Compiling C++ algorithms to WebAssembly using Emscripten..."

if ! command -v emcc &> /dev/null; then
    echo "Error: emcc not found. Install and activate the Emscripten SDK first:"
    echo "  git clone https://github.com/emscripten-core/emsdk.git"
    echo "  cd emsdk && ./emsdk install latest && ./emsdk activate latest && source ./emsdk_env.sh"
    exit 1
fi

emcc -O3 --bind -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 algorithms.cpp -o algorithms_wasm.js

echo "WebAssembly compilation succeeded!"
echo "Created files: algorithms_wasm.js, algorithms_wasm.wasm"
