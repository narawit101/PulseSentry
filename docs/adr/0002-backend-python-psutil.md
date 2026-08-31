# Backend OS Agent and Runtime Stack

We decided to use Python with `psutil`, `FastAPI` / `pywebview`, and `PyInstaller` for the OS network monitoring agent and desktop application wrapper, because `psutil` provides cross-platform, battle-tested native Windows socket and process inspection without complex C++ toolchains, while `pywebview` enables seamless integration with Windows WebView2 and single-binary packaging.
