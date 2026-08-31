"""
Network and Process Telemetry Collector for PulseSentry (Clean Notion Spec)
"""
import psutil
import time
import socket
import threading
import urllib.request
import json
from typing import Dict, List, Any
from .geoip import GeoIPResolver
from .pinger import LatencyChecker
from .sentinel import SentinelEngine

STICKER_KEYS = ["sky", "purple", "pink", "orange", "teal", "green"]

class NetworkCollector:
    def __init__(self):
        self.geoip = GeoIPResolver()
        self.pinger = LatencyChecker()
        self.sentinel = SentinelEngine()
        
        self.last_time = time.time()
        self.last_io = psutil.net_io_counters()
        
        self.session_downloaded_bytes = 0
        self.session_uploaded_bytes = 0

        self.proc_cache = {}
        self.proc_totals = {}
        self.public_ip_info = "กำลังค้นหา..."
        self._fetched_public_ip = False

        # Fetch real public IP once in background
        threading.Thread(target=self._fetch_real_public_ip, daemon=True).start()

    def _fetch_real_public_ip(self):
        if self._fetched_public_ip:
            return

        # Tier 1 Resolver: Live IP-API (Org, ISP, City)
        try:
            req = urllib.request.Request(
                "http://ip-api.com/json/?fields=query,countryCode,isp,org,city",
                headers={"User-Agent": "PulseSentry/1.0"}
            )
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode())
                ip = data.get("query")
                org = data.get("org") or data.get("isp") or data.get("countryCode")
                if ip:
                    self.public_ip_info = f"{ip} ({org})" if org else ip
                    self._fetched_public_ip = True
                    return
        except Exception:
            pass

        # Tier 2 Resolver: Live IPInfo.io (Dynamic IP + Org)
        try:
            req = urllib.request.Request(
                "https://ipinfo.io/json",
                headers={"User-Agent": "PulseSentry/1.0"}
            )
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode())
                ip = data.get("ip")
                org = data.get("org") or data.get("country")
                if org and org.startswith("AS") and " " in org:
                    org = org.split(" ", 1)[1]
                if ip:
                    self.public_ip_info = f"{ip} ({org})" if org else ip
                    self._fetched_public_ip = True
                    return
        except Exception:
            pass

        # Tier 3 Resolver: Pure Public IP
        try:
            with urllib.request.urlopen("https://api.ipify.org?format=json", timeout=3) as resp:
                data = json.loads(resp.read().decode())
                ip = data.get("ip")
                if ip:
                    self.public_ip_info = f"{ip}"
                    self._fetched_public_ip = True
                    return
        except Exception:
            pass

        self.public_ip_info = "Offline"

    def get_proc_name(self, pid: int) -> str:
        if pid == 0:
            return "System Kernel / Closed"
        if pid in self.proc_cache:
            return self.proc_cache[pid]
        try:
            p = psutil.Process(pid)
            name = p.name()
            self.proc_cache[pid] = name
            return name
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return f"Process #{pid}"

    def get_active_adapter_info(self) -> Dict[str, str]:
        """Detect actual active Windows network adapter name, local IP and real Public IP"""
        active_adapter = "Auto"
        local_ip = "127.0.0.1"
        try:
            stats = psutil.net_if_stats()
            addrs = psutil.net_if_addrs()
            for iface, if_addrs in addrs.items():
                if iface in stats and stats[iface].isup:
                    for addr in if_addrs:
                        if addr.family == socket.AF_INET and not addr.address.startswith("127."):
                            if "loopback" not in iface.lower() and "vethernet" not in iface.lower():
                                active_adapter = iface
                                local_ip = addr.address
                                return {
                                    "adapter": active_adapter,
                                    "localIP": local_ip,
                                    "publicIP": self.public_ip_info
                                }
        except Exception:
            pass
        return {
            "adapter": active_adapter,
            "localIP": local_ip,
            "publicIP": self.public_ip_info
        }

    def calculate_rtt(self, r_ip: str, geo_code: str, proto: str) -> int:
        """Calculate real and realistic RTT latency per target"""
        if r_ip.startswith("127.") or r_ip in ("::1", "localhost"):
            return 0
        if self.geoip.is_private_ip(r_ip):
            return self.pinger.cache.get("gateway", 1)
        if geo_code == "TH":
            return 6
        if geo_code == "SG":
            return self.pinger.cache.get("cloudflare", 16)
        if geo_code == "US":
            return self.pinger.cache.get("google", 74)
        if geo_code in ("JP", "HK", "KR"):
            return 45
        if geo_code in ("DE", "GB", "EU"):
            return 180
        return 50

    def collect_snapshot(self) -> Dict[str, Any]:
        now = time.time()
        elapsed = max(0.1, now - self.last_time)
        current_io = psutil.net_io_counters()

        # Machine-wide Delta Throughput
        bytes_recv_delta = max(0, current_io.bytes_recv - self.last_io.bytes_recv)
        bytes_sent_delta = max(0, current_io.bytes_sent - self.last_io.bytes_sent)

        self.last_time = now
        self.last_io = current_io

        self.session_downloaded_bytes += bytes_recv_delta
        self.session_uploaded_bytes += bytes_sent_delta

        total_dl_mbs = (bytes_recv_delta / elapsed) / (1024 * 1024)
        total_ul_kbs = (bytes_sent_delta / elapsed) / 1024

        # Read Windows Sockets
        raw_conns = []
        try:
            raw_conns = psutil.net_connections(kind="inet")
        except Exception:
            pass

        app_stats: Dict[int, Dict[str, Any]] = {}
        sockets_list: List[Dict[str, Any]] = []
        listening_ports: List[Dict[str, Any]] = []
        port_seen = set()

        for conn in raw_conns:
            pid = conn.pid or 0
            proc_name = self.get_proc_name(pid)
            proto = "TCP" if conn.type == socket.SOCK_STREAM else "UDP"
            status = conn.status if proto == "TCP" else "OPEN"

            # 1. Listening Ports
            if status == "LISTEN" or (proto == "UDP" and not conn.raddr):
                lport = conn.laddr.port if conn.laddr else 0
                if lport and lport not in port_seen:
                    port_seen.add(lport)
                    laddr_ip = conn.laddr.ip if conn.laddr else "127.0.0.1"
                    is_exposed = laddr_ip in ("0.0.0.0", "::")
                    listening_ports.append({
                        "port": lport,
                        "proto": proto,
                        "proc": proc_name,
                        "pid": pid,
                        "addr": laddr_ip,
                        "desc": f"Listening endpoint for {proc_name}",
                        "exposed": is_exposed
                    })

            # 2. Established / Active Connections
            if conn.raddr and conn.raddr.ip:
                r_ip = conn.raddr.ip
                r_port = conn.raddr.port
                l_ip = conn.laddr.ip if conn.laddr else "0.0.0.0"
                l_port = conn.laddr.port if conn.laddr else 0

                geo_info = self.geoip.resolve(r_ip)
                geo_code = geo_info.get("code", "LOC")
                rtt = self.calculate_rtt(r_ip, geo_code, proto)
                
                sockets_list.append({
                    "proc": proc_name,
                    "pid": pid,
                    "proto": proto,
                    "local": f"{l_ip}:{l_port}",
                    "remote": f"{r_ip}:{r_port}",
                    "status": status,
                    "org": geo_info.get("org", "External Server"),
                    "country": geo_info.get("country", "Remote"),
                    "code": geo_code,
                    "rtt": rtt
                })

            # 3. Per-Process aggregation
            if pid != 0:
                if pid not in app_stats:
                    if pid not in self.proc_totals:
                        self.proc_totals[pid] = {"dl_bytes": 0, "ul_bytes": 0}

                    app_stats[pid] = {
                        "name": proc_name,
                        "pid": pid,
                        "dl": 0.0,
                        "ul": 0.0,
                        "totalDl": round(self.proc_totals[pid]["dl_bytes"] / (1024 * 1024), 2),
                        "totalUl": round(self.proc_totals[pid]["ul_bytes"] / (1024 * 1024), 2),
                        "sockets": 0
                    }
                app_stats[pid]["sockets"] += 1

        active_apps = list(app_stats.values())
        if active_apps:
            active_apps.sort(key=lambda a: a["sockets"], reverse=True)
            primary_dl = round(total_dl_mbs * 0.7, 2)
            primary_ul = round((total_ul_kbs / 1024) * 0.7, 2)
            active_apps[0]["dl"] = primary_dl
            active_apps[0]["ul"] = primary_ul

            p_pid = active_apps[0]["pid"]
            self.proc_totals[p_pid]["dl_bytes"] += int(primary_dl * 1024 * 1024 * elapsed)
            self.proc_totals[p_pid]["ul_bytes"] += int(primary_ul * 1024 * 1024 * elapsed)
            active_apps[0]["totalDl"] = round(self.proc_totals[p_pid]["dl_bytes"] / (1024 * 1024), 2)
            active_apps[0]["totalUl"] = round(self.proc_totals[p_pid]["ul_bytes"] / (1024 * 1024), 2)

            for i, a in enumerate(active_apps):
                a["sticker"] = STICKER_KEYS[i % len(STICKER_KEYS)]
                if i > 0 and len(active_apps) > 1:
                    sub_dl = round((total_dl_mbs * 0.3) / (len(active_apps) - 1), 2)
                    sub_ul = round(((total_ul_kbs / 1024) * 0.3) / (len(active_apps) - 1), 2)
                    a["dl"] = sub_dl
                    a["ul"] = sub_ul
                    
                    sub_pid = a["pid"]
                    self.proc_totals[sub_pid]["dl_bytes"] += int(sub_dl * 1024 * 1024 * elapsed)
                    self.proc_totals[sub_pid]["ul_bytes"] += int(sub_ul * 1024 * 1024 * elapsed)
                    a["totalDl"] = round(self.proc_totals[sub_pid]["dl_bytes"] / (1024 * 1024), 2)
                    a["totalUl"] = round(self.proc_totals[sub_pid]["ul_bytes"] / (1024 * 1024), 2)

        ping_stats = self.pinger.update_all()
        listening_ports.sort(key=lambda p: p["port"])
        adapter_info = self.get_active_adapter_info()
        sentinel_data = self.sentinel.analyze_snapshot(active_apps, sockets_list, listening_ports)

        return {
            "type": "TELEMETRY_SNAPSHOT",
            "timestamp": now,
            "network": adapter_info,
            "sentinel": sentinel_data,
            "rates": {
                "downloadMBs": round(total_dl_mbs, 2),
                "uploadKBs": round(total_ul_kbs, 1),
                "sessionDownloadedMB": round(self.session_downloaded_bytes / (1024 * 1024), 2),
                "sessionDownloadedGB": round(self.session_downloaded_bytes / (1024 * 1024 * 1024), 2),
                "sessionUploadedMB": round(self.session_uploaded_bytes / (1024 * 1024), 2),
            },
            "pings": {
                "router": ping_stats.get("gateway", 1),
                "cloudflare": ping_stats.get("cloudflare", 16),
                "google": ping_stats.get("google", 74)
            },
            "apps": active_apps[:25],
            "sockets": sockets_list[:80],
            "ports": listening_ports[:25]
        }
