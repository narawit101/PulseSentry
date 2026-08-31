# PulseSentry

A lightweight desktop network and process monitor application that provides real-time traffic statistics, socket connections, latency monitoring, GeoIP insights, and built-in Ookla Speedtest benchmarking through a modern web UI embedded in a native WebView2 desktop window.

## Domain Model & Terminology

**App Process**:
An operating system executable running on the local machine (e.g. `chrome.exe`, `discord.exe`) that creates network sockets and generates network traffic.
_Avoid_: Task, Program, Application Instance

**Socket Connection**:
An active TCP or UDP endpoint binding local address/port to a remote endpoint, with an associated OS state (e.g. `LISTEN`, `ESTABLISHED`, `TIME_WAIT`).
_Avoid_: Session, Link, Wire

**Traffic Rate & Bandwidth**:
The real-time throughput measured in bytes/megabits per second (upload and download) for the whole machine and per process, with adaptive auto-scaling (`KB/s`, `MB/s`, `Mbps`).
_Avoid_: Speed, Bandwidth consumption

**Latency Target**:
A remote host or default gateway periodically probed via ICMP/TCP ping to measure round-trip time (RTT).
_Avoid_: Ping destination, Server node

**Speedtest Suite**:
An integrated multi-stage Ookla benchmark engine supporting single/multi connection modes, dynamic server selection across Thailand & global nodes, live loaded latency tracking, and QoE experience ratings.
_Avoid_: Internet speed check, Bandwidth tester

**Export Engine**:
A unified CSV and JSON data export pipeline with UTF-8 BOM encoding (`\uFEFF`) ensuring seamless compatibility across Microsoft Excel and Google Sheets without encoding errors.
_Avoid_: Save table, Data dump

**GPU Keyframe Engine**:
Hardware-accelerated CSS keyframe animation system (`.ps-fade-in`, `.ps-fade-out`) with `cubic-bezier(0.16, 1, 0.3, 1)` easing for smooth tab transitions and benchmark stage changes.
_Avoid_: Page reload, Screen jump

**Threat Rule & Sentinel**:
A heuristic condition evaluated against active sockets and process behavior (e.g. unexpected foreign GeoIP connection, background upload surge, listening on dangerous ports).
_Avoid_: Policy, Firewall rule

**Process Termination**:
The administrative action of sending a termination signal to an App Process or isolating its network access directly from PulseSentry.
_Avoid_: Kill switch, Force close, Blacklist

**Desktop Shell**:
The native Windows desktop container (WebView2 / PyWebView launcher) bundling the Python OS agent service and the React user interface into a portable executable.
_Avoid_: Wrapper, Browser window, Electron app
