@echo off

REM Create build directory
if not exist build mkdir build
cd build

echo [1/3] Configuring CMake...
cmake .. -G "Visual Studio 17 2022" -A x64

if %errorlevel% neq 0 (
    echo ERROR: CMake configuration failed!
    pause
    exit /b 1
)

echo [2/3] Building in Release mode...
cmake --build . --config Release

if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo [3/3] Build complete!
echo Executable location:
echo   %CD%\Release\capture-agent.exe
echo SUCCESS! Ready to run.
pause
