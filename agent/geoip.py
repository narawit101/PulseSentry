"""
GeoIP & Organization resolver (Clean Notion - No Emojis)
"""
import ipaddress
import urllib.request
import json
import threading

class GeoIPResolver:
    def __init__(self):
        self._cache = {}
        self._pending = set()
        self._lock = threading.Lock()

    def is_private_ip(self, ip_str: str) -> bool:
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local
        except ValueError:
            return True

    def resolve(self, ip_str: str) -> dict:
        if not ip_str or ip_str in ("*", "0.0.0.0", "127.0.0.1", "::", "::1"):
            return {"country": "LOCAL", "org": "Local Loopback", "code": "LOC"}

        if self.is_private_ip(ip_str):
            return {"country": "LAN", "org": "Local Network Gateway", "code": "LAN"}

        with self._lock:
            if ip_str in self._cache:
                return self._cache[ip_str]

        # Known common CDNs
        if ip_str.startswith("1.1.1.") or ip_str.startswith("1.0.0.") or ip_str.startswith("104."):
            res = {"country": "Singapore", "org": "Cloudflare Edge", "code": "SG"}
            self._cache[ip_str] = res
            return res
        elif ip_str.startswith("8.8.") or ip_str.startswith("142.250.") or ip_str.startswith("172.217.") or ip_str.startswith("34."):
            res = {"country": "United States", "org": "Google Cloud", "code": "US"}
            self._cache[ip_str] = res
            return res
        elif ip_str.startswith("20.") or ip_str.startswith("40.") or ip_str.startswith("52."):
            res = {"country": "United States", "org": "Microsoft Azure", "code": "US"}
            self._cache[ip_str] = res
            return res
        elif ip_str.startswith("49.50.") or ip_str.startswith("171.96."):
            res = {"country": "Thailand", "org": "PROEN ISP / Thai Node", "code": "TH"}
            self._cache[ip_str] = res
            return res

        # Background lookup
        with self._lock:
            if ip_str not in self._pending and len(self._cache) < 200:
                self._pending.add(ip_str)
                threading.Thread(target=self._fetch_remote_geoip, args=(ip_str,), daemon=True).start()

        return {"country": "Remote", "org": "External Host", "code": "EXT"}

    def _fetch_remote_geoip(self, ip_str: str):
        try:
            req = urllib.request.Request(
                f"http://ip-api.com/json/{ip_str}?fields=status,country,countryCode,org,isp",
                headers={"User-Agent": "PulseSentry/1.0"}
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode())
                if data.get("status") == "success":
                    code = data.get("countryCode", "EXT")
                    country = data.get("country", "Remote")
                    org = data.get("org") or data.get("isp") or "External ISP"
                    
                    with self._lock:
                        self._cache[ip_str] = {
                            "country": country,
                            "org": org[:30],
                            "code": code
                        }
        except Exception:
            with self._lock:
                self._cache[ip_str] = {"country": "Remote", "org": "External Host", "code": "EXT"}
        finally:
            with self._lock:
                self._pending.discard(ip_str)
