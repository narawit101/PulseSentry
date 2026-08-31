# PulseSentry ⚡ - Real-Time Network Sentinel & Process Traffic Monitor

> **High-Performance Windows Desktop & Web Network Monitor** powered by **React 18, TypeScript, TailwindCSS, Chart.js, and Python OS Telemetry Agent**. Built with the Notion Design System aesthetic, featuring Threat Sentinel heuristic protection, dynamic unit scaling, and native Windows System Tray integration.

---

## 🌟 Key Features

- **⚡ Real-Time Live Telemetry (Zero Mock Data)**:
  - Live Download & Upload transfer rates with auto-scaling units (`KB/s` ➔ `MB/s` ➔ `GB/s`).
  - Session transferred volume auto-stepping (`KB` ➔ `MB` ➔ `GB` ➔ `TB`).
  - Dynamic peak rate memory tracker.
  - Rolling 30-second bandwidth timeline graph.
- **🛡️ Threat Sentinel & Process Isolation**:
  - Live heuristics engine scanning for abnormal traffic, suspicious outbound connections, and background data leakage.
  - Safe 1-click process termination and whitelist isolation protection.
- **🔍 Active Socket Inspector & Listening Ports Scanner**:
  - Full process tree with PID, process names, local/remote IPs, and socket states (`ESTABLISHED`, `LISTEN`, `TIME_WAIT`).
  - Local listening port mapper with exposure filters (Localhost vs `0.0.0.0` LAN exposure).
- **🌍 Global GeoIP & Latency Mapping**:
  - Real-time geolocation resolution for remote connection endpoints.
  - Live ICMP/TCP latency ping tracker for Default Gateway, Cloudflare (`1.1.1.1`), and Google (`8.8.8.8`).
- **🖥️ Standalone Windows Desktop App (.exe)**:
  - Microsoft Edge WebView2 + PyWebView lightweight runtime (< 30 MB RAM).
  - Native Windows System Tray integration with clean minimize-to-tray background monitoring.
  - High-res embedded icon and zero registry bloat (portable).

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
│   Asyncio WebSockets • MaxMind GeoIP • Subprocess Ping │
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

> **Note:** If you haven't installed dependencies individually, the core Python packages are:
> `pip install websockets psutil pywebview pystray Pillow requests`

---

## 🚀 Running in Development Mode

You can run the web dashboard in two separate terminals for rapid frontend/backend development without building the executable:

### Terminal 1: Start Python OS Agent Backend

```powershell
python -m agent.server
```
- Starts the WebSocket Telemetry Server on `ws://127.0.0.1:8765`.
- Captures live network adapters, per-process bandwidth, active TCP/UDP connections, and listening ports.

### Terminal 2: Start Vite Dev Server (Frontend)

```powershell
npm run dev
```
- Starts the Vite development server.
- Open your browser and navigate to: **`http://localhost:3000`** (or the port displayed in your terminal).

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
2. Packages the Python runtime, OS Agent, and assets into a standalone Windows executable.
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

## 📁 Project Directory Structure

```
site/
├── agent/                  # Python Telemetry & Security Engine
│   ├── collector.py        # Real-time network & process sampler
│   ├── server.py           # Asyncio WebSocket server (ws://127.0.0.1:8765)
│   ├── sentinel.py         # Threat Sentinel heuristic engine
│   ├── geoip.py            # IP Geolocation resolver
│   └── pinger.py           # Gateway, Cloudflare, Google latency pinger
├── assets/                 # High-resolution icons & assets
│   ├── icon.ico            # Windows multi-size application icon
│   └── icon.png            # Transparent PNG logo asset
├── docs/                   # Architectural Decision Records (ADRs)
│   └── adr/                # System architecture documentation
├── public/                 # Static web assets
│   ├── favicon.ico         # Browser favicon
│   └── logo.png            # Web navbar logo
├── release/                # Compiled standalone desktop executable
│   └── PulseSentry/        # PyInstaller output (PulseSentry.exe)
├── scripts/                # Utility scripts
│   └── process_icon.py     # Alpha background remover & multi-resolution ICO builder
├── src/                    # React Frontend Source
│   ├── components/         # Reusable UI components
│   │   └── MetricCard.tsx  # Notion-styled KPI metric card
│   ├── constants/          # Application constants
│   │   └── theme.ts        # Notion sticker palette & color mappings
│   ├── i18n/               # Internationalization
│   │   └── translations.ts # Dual language dictionaries (EN & TH)
│   ├── utils/              # Utility helpers
│   │   └── format.ts       # Dynamic unit scaling (KB/MB/GB/TB & rates)
│   ├── App.tsx             # Main Dashboard Controller
│   ├── index.css           # Global TailwindCSS styles & Notion theme
│   ├── main.tsx            # React application root
│   └── types.ts            # TypeScript interfaces & definitions
├── build_exe.py            # Automated PyInstaller packaging pipeline
├── desktop_app.py          # Native WebView2 + System Tray Desktop Shell
├── main.py                 # CLI entry point launcher
├── package.json            # Node.js dependencies & scripts
├── requirements.txt        # Python dependencies
├── tailwind.config.js      # TailwindCSS design system tokens
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundling configuration
├── .gitignore              # Git ignore rules for Node, Python & builds
└── README.md               # Complete project documentation
```

---

## ⚙️ Troubleshooting

### 1. `OSError: [Errno 10048] Address already in use (ws://127.0.0.1:8765)`
This error occurs if a previous agent process is still occupying port `8765`.
- **Solution (PowerShell)**:
  ```powershell
  Get-Process -Name python,PulseSentry -ErrorAction SilentlyContinue | Stop-Process -Force
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
