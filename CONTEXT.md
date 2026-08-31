# PulseSentry

A lightweight desktop network and process monitor application that provides real-time traffic statistics, socket connections, latency monitoring, and GeoIP insights through a modern web UI embedded in a native WebView2 desktop window.

## Language

**App Process**:
An operating system executable running on the local machine (e.g. `chrome.exe`, `discord.exe`) that creates network sockets and generates network traffic.
_Avoid_: Task, Program, Application Instance

**Socket Connection**:
An active TCP or UDP endpoint binding local address/port to a remote endpoint, with an associated OS state (e.g. `LISTEN`, `ESTABLISHED`).
_Avoid_: Session, Link, Wire

**Traffic Rate**:
The real-time throughput measured in bytes per second (upload and download) for the whole machine and per process.
_Avoid_: Speed, Bandwidth consumption

**Latency Target**:
An remote host or default gateway periodically probed via ICMP/TCP ping to measure round-trip time (RTT).
_Avoid_: Ping destination, Server node

**Threat Rule**:
A heuristic condition evaluated against active sockets and process behavior (e.g. unexpected foreign geoip connection, background upload surge, listening on dangerous ports).
_Avoid_: Policy, Firewall rule

**Process Termination**:
The administrative action of sending a termination signal to an App Process or isolating its network access directly from PulseSentry.
_Avoid_: Kill switch, Force close, Blacklist

**Desktop Shell**:
The native Windows desktop container (WebView2 / PyWebView launcher) bundling the Python Sentinel service and the React user interface into an executable.
_Avoid_: Wrapper, Browser window, Electron app
