# PulseSentry ⚡ - Real-Time Network Sentinel & Ookla Speedtest Suite

> **High-Performance Windows Desktop & Web Network Monitor** powered by **React 18, TypeScript, TailwindCSS, Chart.js, and Python OS Telemetry Agent**. Built with the Notion Design System aesthetic, featuring Threat Sentinel heuristic protection, dynamic unit scaling, official Ookla benchmark telemetry, and native Windows System Tray integration.

---

## 🌟 Key Features

- **⚡ Real-Time Live Telemetry (Zero Mock Data)**:
  - Live Download & Upload transfer rates with auto-scaling units (`KB/s` ➔ `MB/s` ➔ `Mbps`).
  - Session transferred volume auto-stepping (`KB` ➔ `MB` ➔ `GB` ➔ `TB`).
  - Dynamic peak rate memory tracker & rolling 30s to 1h bandwidth timeline graph with index-snapped hover tooltips.
- **🚀 3-Stage Ookla Speedtest Benchmark Engine**:
  - **Stage 1 (Before Test / Idle)**: Interactive centered `GO` circular button, client ISP & IP detector, multi-server selector (Thai/Global nodes), and `Connections: Multi / Single` switch.
  - **Stage 2 (During Test)**: Calibrated 8-segment speedometer gauge with dynamic stage-colored glow (Cyan for Download, Purple for Upload), real-time Ping/Down/Up latency trio, and live 4-activity QoE indicators.
  - **Stage 3 (Summary & QoE)**: Master scorecard with instant re-test `GO` button, large KPIs, mathematical QoE activity ratings (Web, Gaming, 4K Streaming, Video Calls), 1-5 customer satisfaction expectation survey, and verified official Speedtest.net result links.
- **📊 Unified CSV & JSON Exporter Engine**:
  - Direct **Export CSV** support across **all tabs** (Traffic Summary, Apps, Sockets, Ports, GeoIP, and Speedtest History).
  - Encoded with **UTF-8 BOM (`\uFEFF`)** for seamless 1-click opening in Microsoft Excel and Google Sheets without encoding glitches.
- **🛡️ Threat Sentinel & Process Isolation**:
  - Live heuristics engine scanning for abnormal traffic, suspicious outbound connections, and background data leakage.
  - Safe 1-click process termination and whitelist isolation protection.
- **🔍 Active Socket Inspector & Listening Ports Scanner**:
  - Full process tree with PID, process names, local/remote IPs, and socket states (`ESTABLISHED`, `LISTEN`, `TIME_WAIT`).
  - Local listening port mapper with exposure filters (Localhost vs `0.0.0.0` LAN exposure).
- **🌍 Global GeoIP & Latency Mapping**:
  - Real-time geolocation resolution for remote connection endpoints.
  - Live ICMP/TCP latency ping tracker for Default Gateway, Cloudflare (`1.1.1.1`), and Google (`8.8.8.8`).
- **✨ GPU Micro-Animation Engine**:
  - Hardware-accelerated `.ps-fade-in` and `.ps-fade-out` CSS keyframe transitions across all tabs and speedtest state changes.
- **🖥️ Standalone Windows Desktop App (.exe)**:
  - Microsoft Edge WebView2 + PyWebView lightweight runtime (< 30 MB RAM).
  - Native Windows System Tray integration with clean minimize-to-tray background monitoring.
  - High-res embedded multi-size icon (`.ico`) and zero registry bloat (portable).

---

## 🛠️ Tech Stack & Architecture

```
┌────────────────────────────────────────────────────────┐
│               PulseSentry Frontend (React)                │
│   React 18 • TypeScript • TailwindCSS • Lucide Icons   │
│   Chart.js • Real-time WebSocket Client                │
└──────────────────────────▲─────────────────────────────┘
                           │ ws://127.0.0.1:8765
┌──────────────────────────▼─────────────────────────────┐
│             PulseSentry OS Agent (Python Backend)         │
│   psutil (Traffic/Sockets) • Threat Sentinel Engine    │
│   Ookla Speedtest Engine • MaxMind GeoIP • Subprocess  │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│          Windows Desktop Wrapper & System Tray         │
│   PyWebView (Edge WebView2) • Pystray (Tray Menu)     │
│   PyInstaller Packaging (Portable .exe)                │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Ensure your development environment meets the following requirements:

1. **Operating System**: Windows 10 or Windows 11 (64-bit).
2. **Node.js**: `v18.0.0` or later ([Download Node.js](https://nodejs.org/)).
3. **Python**: `3.10` to `3.12` ([Download Python](https://www.python.org/downloads/)). *Make sure to check "Add Python to PATH" during installation.*
4. **WebView2 Runtime**: Included by default in Windows 10/11.

---

## 📦 Project Setup & Installation

### 1. Clone or Open the Workspace

Open PowerShell or Command Prompt in the project root:

```powershell
cd C:\D\site
```

### 2. Install Frontend Dependencies

```powershell
npm install
```

### 3. Install Python Backend Dependencies

```powershell
pip install -r requirements.txt
```

> **Core Python packages**: `pip install websockets psutil pywebview pystray Pillow requests`

---

## 🚀 Running in Development Mode

You can run the web dashboard in two separate terminals for rapid development:

### Terminal 1: Start Python OS Agent Backend

```powershell
python main.py
```
- Starts the WebSocket Telemetry Server on `ws://127.0.0.1:8765`.
- Captures live network adapters, per-process bandwidth, active TCP/UDP connections, listening ports, and Ookla benchmark engine.

### Terminal 2: Start Vite Dev Server (Frontend)

```powershell
npm run dev
```
- Starts the Vite development server.
- Open your browser and navigate to: **`http://localhost:3000`**.

---

## 🖥️ Running as a Desktop Window (Local PyWebView)

To test the desktop window locally without compiling to `.exe`:

1. Build the frontend production bundle:
   ```powershell
   npm run build
   ```
2. Launch the desktop wrapper:
   ```powershell
   python desktop_app.py
   ```

---

## 🔨 Building the Standalone Windows Executable (.exe)

PulseSentry includes an automated build pipeline (`build_exe.py`) that:
1. Compiles the React + TypeScript frontend into optimized static assets in `dist/`.
2. Packages the Python runtime, OS Agent, speedtest binary, and assets into a standalone Windows executable.
3. Embeds the high-resolution multi-size `.ico` app icon into the PE header.
4. Bundles `pystray` and `PyWebView` for native System Tray operation.

### Build Command:

```powershell
python build_exe.py
```

### Output Location:
Upon successful completion, the compiled portable desktop application will be generated in:
```
release/
└── PulseSentry/
    ├── PulseSentry.exe      <-- Launchable executable
    └── _internal/        <-- Bundled runtimes and DLLs
```

You can double-click **`release/PulseSentry/PulseSentry.exe`** to run the app on any Windows 10/11 machine without needing Node.js or Python installed!

---

## 📁 Core Modules

| Module | Description |
| :--- | :--- |
| **`agent/`** | Python OS Telemetry Daemon (`psutil`, WebSocket server `ws://127.0.0.1:8765`, Threat Sentinel heuristics, ICMP/TCP Pinger, MaxMind/IP-API GeoIP, and Hybrid Speedtest Engine) |
| **`src/components/`** | Modular React Tab Architecture (`OverviewTab`, `AppsTab`, `SocketsTab`, `PortsTab`, `GeoipTab`, `SpeedtestTab`, `MetricCard`, `ExportCsvButton`) |
| **`src/components/speedtest/`** | Sub-components for Speedtest Suite (`SpeedGauge`, `SpeedtestScorecard`, `SpeedtestHistoryTable`, `ServerSelectModal`) |
| **`src/hooks/`** | Custom React Telemetry & WebSocket ingestion hooks (`useTelemetry.ts`) |
| **`src/utils/`** | Core utilities (`csv.ts` UTF-8 BOM engine, `format.ts` adaptive unit math, `qoe.ts` ITU-T calibrated QoE engine) |
| **`bin/`** | Ookla Speedtest CLI binary (`speedtest.exe`) |
| **`assets/`** | App icons (`icon.ico`, `icon.png`) and branding assets |
| **`release/`** | Production portable standalone Windows desktop executable (`PulseSentry.exe`) |

---

## 🛑 Process Management (Kill & Restart)

### 1. Kill Running Agent / Python Backend
If port `8765` is busy or you want to terminate background Python processes:

**PowerShell:**
```powershell
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
```

**Command Prompt (CMD):**
```cmd
taskkill /F /IM python.exe
```

**Kill by Port (`8765`):**
```powershell
# 1. Find PID on port 8765
netstat -ano | findstr 8765

# 2. Kill PID
taskkill /F /PID <PID_NUMBER>
```

---

### 2. Start / Restart Cleanly

**Start Python Backend Agent:**
```powershell
python -m agent.server
# or
python main.py
```

**Start Frontend Dev Server:**
```powershell
npm run dev
```

**One-Liner Restart (PowerShell):**
```powershell
Stop-Process -Name python -Force -ErrorAction SilentlyContinue; python -m agent.server
```

---

## ⚙️ Troubleshooting

### 1. `OSError: [Errno 10048] Address already in use (ws://127.0.0.1:8765)`
This error occurs if a previous agent process is still occupying port `8765`.
- **Solution (PowerShell)**:
  ```powershell
  Stop-Process -Name python -Force -ErrorAction SilentlyContinue
  ```
  Or kill the specific port PID:
  ```powershell
  netstat -ano | findstr 8765
  taskkill /F /PID <PID_NUMBER>
  ```

### 2. Executable Build Permission Error (`PermissionError: [WinError 5] Access is denied`)
This happens if `PulseSentry.exe` is currently running while attempting to re-build.
- **Solution**: Close `PulseSentry.exe` from the Task Manager or System Tray, then re-run `python build_exe.py`.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to modify, distribute, and integrate into your own projects.
