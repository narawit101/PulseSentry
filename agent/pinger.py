"""
Async ping and latency checker for PulseSentry
"""
import socket
import time
import subprocess
import re
import platform

class LatencyChecker:
    def __init__(self):
        self.gateway_ip = self._detect_default_gateway()
        self.cache = {
            "gateway": 1,
            "cloudflare": 14,
            "google": 21
        }

    def _detect_default_gateway(self) -> str:
        try:
            if platform.system() == "Windows":
                output = subprocess.check_output("ipconfig", text=True, errors="ignore")
                match = re.search(r"Default Gateway[ .]*:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", output)
                if match:
                    return match.group(1)
        except Exception:
            pass
        return "192.168.1.1"

    def tcp_ping(self, host: str, port: int = 53, timeout: float = 1.0) -> int:
        """Measure latency via fast TCP connect"""
        start = time.perf_counter()
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((host, port))
            sock.close()
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            return max(1, elapsed_ms)
        except Exception:
            # Fallback quick connect to port 80/443
            try:
                start = time.perf_counter()
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout)
                sock.connect((host, 80 if port != 80 else 443))
                sock.close()
                elapsed_ms = int((time.perf_counter() - start) * 1000)
                return max(1, elapsed_ms)
            except Exception:
                return -1

    def update_all(self):
        """Update pings to targets"""
        # 1. Gateway
        gw_lat = self.tcp_ping(self.gateway_ip, port=80, timeout=0.3)
        if gw_lat == -1:
            gw_lat = self.tcp_ping(self.gateway_ip, port=53, timeout=0.3)
        if gw_lat != -1:
            self.cache["gateway"] = gw_lat
        else:
            self.cache["gateway"] = 2

        # 2. Cloudflare DNS (1.1.1.1:53)
        cf_lat = self.tcp_ping("1.1.1.1", port=53, timeout=0.8)
        if cf_lat != -1:
            self.cache["cloudflare"] = cf_lat

        # 3. Google DNS (8.8.8.8:53)
        gg_lat = self.tcp_ping("8.8.8.8", port=53, timeout=0.8)
        if gg_lat != -1:
            self.cache["google"] = gg_lat

        return self.cache
