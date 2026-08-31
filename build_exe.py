"""
PulseSentry Windows Executable Packaging Script
Builds the production React frontend and packages the entire app into a lightweight, standalone Windows .exe with Embedded High-Res Icon, System Tray, and Threat Sentinel.
"""
import os
import sys
import shutil
import subprocess
import time

def run_cmd(cmd, check=True):
    print(f"\n[>] Executing: {cmd}")
    res = subprocess.run(cmd, shell=True)
    if check and res.returncode != 0:
        print(f"[!] Error: Command failed with exit code {res.returncode}")
        sys.exit(res.returncode)

def kill_running_pulsesentry():
    """Ensure previous PulseSentry.exe process is closed before rebuilding"""
    try:
        subprocess.run("taskkill /F /IM PulseSentry.exe /T", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.5)
    except Exception:
        pass

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(base_dir, "dist")
    build_dir = os.path.join(base_dir, "build")
    icon_path = os.path.join(base_dir, "assets", "icon.ico")

    print("=" * 65)
    print("  [+] PulseSentry Standalone Windows Executable Builder (.exe)")
    print("  [+] Clean Embedding of High-Res App Icon & System Tray")
    print("=" * 65)

    # 0. Close previous instances and clear build cache
    kill_running_pulsesentry()
    if os.path.exists(build_dir):
        try:
            shutil.rmtree(build_dir, ignore_errors=True)
        except Exception:
            pass

    # 1. Build React/Vite Frontend
    print("\n[*] Step 1: Building production React frontend bundle with Vite...")
    run_cmd("npm run build")

    index_html = os.path.join(dist_dir, "index.html")
    if not os.path.exists(index_html):
        print(f"[!] Error: {index_html} was not found.")
        sys.exit(1)
    print("[*] Frontend bundle compiled successfully in dist/")

    # 2. Compile into Windows Executable with PyInstaller
    print("\n[*] Step 2: Compiling into standalone Windows .exe with PyInstaller & Embedded Icon...")
    pyinstaller_cmd = (
        f'pyinstaller --noconfirm --clean --onedir --windowed '
        f'--name "PulseSentry" '
        f'--icon "{icon_path}" '
        f'--distpath "release" '
        f'--workpath "build" '
        f'--add-data "dist;dist" '
        f'--add-data "agent;agent" '
        f'--add-data "assets;assets" '
        f'--hidden-import "websockets" '
        f'--hidden-import "psutil" '
        f'--hidden-import "webview" '
        f'--hidden-import "clr" '
        f'--hidden-import "pythonnet" '
        f'--hidden-import "pystray" '
        f'--hidden-import "pystray._win32" '
        f'--hidden-import "PIL" '
        f'--hidden-import "PIL.Image" '
        f'--hidden-import "agent" '
        f'--hidden-import "agent.server" '
        f'--hidden-import "agent.collector" '
        f'--hidden-import "agent.sentinel" '
        f'--hidden-import "agent.geoip" '
        f'--hidden-import "agent.pinger" '
        f'desktop_app.py'
    )
    
    run_cmd(pyinstaller_cmd)

    output_folder = os.path.join(base_dir, "release", "PulseSentry")
    output_exe = os.path.join(output_folder, "PulseSentry.exe")

    print("\n" + "=" * 65)
    print("  [+] PulseSentry Windows Desktop Application Built Successfully!")
    print(f"  [+] Output Folder: {output_folder}")
    print(f"  [+] Executable: {output_exe}")
    print(f"  [+] Embedded Icon: {icon_path}")
    print("=" * 65)

if __name__ == "__main__":
    main()
