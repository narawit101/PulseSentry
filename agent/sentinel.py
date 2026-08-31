"""
Sentinel Security & Heuristic Threat Engine for PulseSentry
Monitors network traffic, process behaviors, and handles safe process isolation.
"""
import os
import psutil
from typing import Dict, List, Any

# Critical Windows System Processes that must NEVER be terminated
CRITICAL_SYSTEM_PROCESSES = {
    "system", "system idle process", "registry", "smss.exe", "csrss.exe", 
    "wininit.exe", "services.exe", "lsass.exe", "svchost.exe", "fontdrvhost.exe",
    "winlogon.exe", "dwm.exe", "explorer.exe", "spoolsv.exe", "dasHost.exe",
    "sihost.exe", "taskhostw.exe", "RuntimeBroker.exe", "SearchHost.exe",
    "StartMenuExperienceHost.exe", "TextInputHost.exe", "ShellExperienceHost.exe",
    "ctfmon.exe", "conhost.exe"
}

HIGH_RISK_PORTS = {21, 22, 23, 135, 137, 138, 139, 445, 1433, 3389, 4444, 5555, 6667, 8080}

class SentinelEngine:
    def __init__(self):
        self.rules = {
            "blockHighUpload": True,
            "blockExposedPorts": True,
            "blockTempExecutables": True,
            "blockForeignGeoIP": False,
        }
        self.alerts: List[Dict[str, Any]] = []

    def update_rules(self, new_rules: Dict[str, bool]):
        self.rules.update(new_rules)

    def is_critical_process(self, pid: int, name: str) -> bool:
        if pid <= 4:
            return True
        if name.lower() in CRITICAL_SYSTEM_PROCESSES:
            return True
        return False

    def terminate_process(self, pid: int) -> Dict[str, Any]:
        """Safely terminate a suspicious process with whitelist protection"""
        if pid <= 4:
            return {"success": False, "pid": pid, "error": "System Process (PID <= 4) is protected."}

        try:
            p = psutil.Process(pid)
            name = p.name()

            if self.is_critical_process(pid, name):
                return {
                    "success": False,
                    "pid": pid,
                    "name": name,
                    "error": f"'{name}' (PID: {pid}) is a Windows System Critical Process and cannot be terminated."
                }

            p.terminate()
            p.wait(timeout=2)
            return {
                "success": True,
                "pid": pid,
                "name": name,
                "message": f"Process '{name}' (PID: {pid}) terminated successfully."
            }
        except psutil.TimeoutExpired:
            try:
                p.kill()
                return {"success": True, "pid": pid, "name": name, "message": f"Process '{name}' force killed."}
            except Exception as e:
                return {"success": False, "pid": pid, "error": str(e)}
        except psutil.NoSuchProcess:
            return {"success": False, "pid": pid, "error": "Process already exited."}
        except psutil.AccessDenied:
            return {"success": False, "pid": pid, "error": "Access denied. Run PulseSentry as Administrator to terminate this process."}
        except Exception as e:
            return {"success": False, "pid": pid, "error": str(e)}

    def analyze_snapshot(self, apps: List[Dict[str, Any]], sockets: List[Dict[str, Any]], ports: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run heuristic rules and calculate security score (0-100)"""
        alerts = []
        threat_score_deductions = 0

        # Heuristic 1: High Upload Surge
        if self.rules.get("blockHighUpload", True):
            for app in apps:
                ul_mbs = app.get("ul", 0)
                if ul_mbs > 5.0:  # > 5MB/s continuous upload
                    alerts.append({
                        "id": f"upload-{app['pid']}",
                        "level": "warning",
                        "title": "High Upload Surge Detected",
                        "desc": f"Process '{app['name']}' (#{app['pid']}) is uploading at {ul_mbs:.2f} MB/s",
                        "pid": app["pid"],
                        "proc": app["name"],
                        "timestamp": "Real-time",
                        "canTerminate": not self.is_critical_process(app["pid"], app["name"])
                    })
                    threat_score_deductions += 10

        # Heuristic 2: Dangerous Exposed Listening Ports
        if self.rules.get("blockExposedPorts", True):
            for p in ports:
                port_num = p.get("port", 0)
                if p.get("exposed", False) and port_num in HIGH_RISK_PORTS:
                    alerts.append({
                        "id": f"port-{port_num}",
                        "level": "danger",
                        "title": f"High-Risk Exposed Port {port_num}",
                        "desc": f"Process '{p.get('proc', 'Unknown')}' is listening publicly on sensitive port {port_num}",
                        "pid": p.get("pid", 0),
                        "proc": p.get("proc", "Unknown"),
                        "timestamp": "Real-time",
                        "canTerminate": not self.is_critical_process(p.get("pid", 0), p.get("proc", ""))
                    })
                    threat_score_deductions += 15

        # Heuristic 3: Temporary Directory Execution
        if self.rules.get("blockTempExecutables", True):
            for app in apps:
                name_lower = app.get("name", "").lower()
                if "temp" in name_lower or "update.tmp" in name_lower:
                    alerts.append({
                        "id": f"temp-{app['pid']}",
                        "level": "danger",
                        "title": "Temporary Executable Running",
                        "desc": f"Process '{app['name']}' (#{app['pid']}) appears to be running from a temp location",
                        "pid": app["pid"],
                        "proc": app["name"],
                        "timestamp": "Real-time",
                        "canTerminate": True
                    })
                    threat_score_deductions += 20

        # Heuristic 4: Foreign GeoIP Suspicious Connections
        if self.rules.get("blockForeignGeoIP", False):
            for s in sockets:
                cc = s.get("countryCode", "TH")
                if cc not in ["TH", "US", "SG", "JP", "LOCAL", "PRIVATE", "--"]:
                    alerts.append({
                        "id": f"foreign-{s.get('remote', '')}",
                        "level": "warning",
                        "title": f"Foreign Connection ({cc})",
                        "desc": f"Process '{s.get('proc')}' connected to remote host {s.get('remote')} [{cc}]",
                        "pid": 0,
                        "proc": s.get("proc", ""),
                        "timestamp": "Real-time",
                        "canTerminate": False
                    })
                    threat_score_deductions += 5

        self.alerts = alerts[:10]
        final_score = max(0, min(100, 100 - threat_score_deductions))

        return {
            "score": final_score,
            "status": "SECURE" if final_score >= 85 else ("WARNING" if final_score >= 60 else "CRITICAL"),
            "alerts": self.alerts,
            "rules": self.rules,
            "stats": {
                "activeThreats": len(self.alerts),
                "isolatedCount": 0,
                "scannedProcesses": len(apps),
                "safePercent": final_score
            }
        }
