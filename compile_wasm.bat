@echo off
echo Compiling C++ algorithms to WebAssembly using Emscripten...
call emcc -O3 --bind -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 algorithms.cpp -o algorithms_wasm.js
if %ERRORLEVEL% equ 0 (
    echo WebAssembly compilation succeeded!
    echo Created files: algorithms_wasm.js, algorithms_wasm.wasm
) else (
    echo Compilation failed. Please make sure Emscripten is installed and added to your PATH.
)
