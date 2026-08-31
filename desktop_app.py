"""
PulseSentry Desktop Shell - Native Windows Desktop Launcher
Features:
- System Tray (Taskbar Notification Area) with high-res PulseSentry Logo
- Minimize to Tray / Close to Tray for continuous network & threat monitoring
- Native Microsoft Edge WebView2 ultra-fast desktop container
"""
import os
import sys
import time
import threading
import asyncio
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer
from PIL import Image
import pystray
from agent.server import main as run_sentinel_server

BACKEND_WS_PORT = 8765
FRONTEND_HTTP_PORT = 8766

main_window = None
tray_icon = None
is_quitting = False

def get_base_dir():
    """Get absolute path to resource, works for dev and for PyInstaller bundle"""
    if getattr(sys, 'frozen', False):
        return getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))

class CustomHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        dist_dir = os.path.join(get_base_dir(), "dist")
        if not os.path.exists(dist_dir):
            dist_dir = get_base_dir()
        super().__init__(*args, directory=dist_dir, **kwargs)

    def log_message(self, format, *args):
        # Silence static file access logs
        pass

def run_http_server(port):
    try:
        server = HTTPServer(("127.0.0.1", port), CustomHTTPHandler)
        server.serve_forever()
    except Exception as e:
        print(f"[!] HTTP Server warning: {e}")

def start_sentinel_backend():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(run_sentinel_server())
    except Exception as e:
        print(f"[!] Sentinel backend exception: {e}")

def load_tray_icon_image():
    """Load the PulseSentry logo image for system tray"""
    base_dir = get_base_dir()
    for path in [
        os.path.join(base_dir, "assets", "icon.png"),
        os.path.join(base_dir, "assets", "icon.ico"),
        os.path.join(base_dir, "public", "logo.png"),
    ]:
        if os.path.exists(path):
            try:
                return Image.open(path)
            except Exception:
                pass
    # Fallback colored square
    img = Image.new("RGBA", (64, 64), color=(0, 117, 222, 255))
    return img

def show_window_action(icon=None, item=None):
    """Restore and bring main window to front"""
    global main_window
    if main_window:
        try:
            main_window.show()
            main_window.restore()
        except Exception as e:
            print(f"[!] Error showing window: {e}")

def quit_app_action(icon=None, item=None):
    """Fully terminate PulseSentry and close tray icon"""
    global is_quitting, tray_icon, main_window
    is_quitting = True
    if tray_icon:
        try:
            tray_icon.stop()
        except Exception:
            pass
    if main_window:
        try:
            main_window.destroy()
        except Exception:
            pass
    sys.exit(0)

def setup_system_tray():
    """Initialize and run System Tray Icon with PulseSentry logo and clean context menu"""
    global tray_icon
    icon_image = load_tray_icon_image()

    menu = pystray.Menu(
        pystray.MenuItem("🖥️ เปิด PulseSentry (Open Window)", show_window_action, default=True),
        pystray.MenuItem("🛡️ Sentinel Guard: กำลังทำงาน (Active)", lambda icon, item: None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("❌ ปิดโปรแกรม (Exit PulseSentry)", quit_app_action)
    )

    tray_icon = pystray.Icon(
        name="PulseSentry",
        icon=icon_image,
        title="PulseSentry - Network & Threat Sentinel",
        menu=menu
    )

    try:
        tray_icon.run()
    except Exception as e:
        print(f"[!] System tray error: {e}")

def on_window_closing():
    """Handle window close event: silently minimize to system tray instead of quitting"""
    global is_quitting, main_window
    if is_quitting:
        return True
    if main_window:
        try:
            main_window.hide()
        except Exception:
            pass
    return False

def main():
    global main_window
    print("=" * 65)
    print("  [+] PulseSentry - Windows Network & Threat Sentinel Desktop")
    print("  [+] System Tray Notification Area Active")
    print("=" * 65)

    # 1. Start Sentinel WebSocket Agent in background thread
    backend_thread = threading.Thread(target=start_sentinel_backend, daemon=True)
    backend_thread.start()
    print(f"[+] Sentinel WebSocket Live Engine active on ws://127.0.0.1:{BACKEND_WS_PORT}")

    # 2. Start Local HTTP Server for Frontend Assets
    http_thread = threading.Thread(target=run_http_server, args=(FRONTEND_HTTP_PORT,), daemon=True)
    http_thread.start()
    print(f"[+] Local UI Server active on http://127.0.0.1:{FRONTEND_HTTP_PORT}")

    # 3. Start System Tray Icon in background thread
    tray_thread = threading.Thread(target=setup_system_tray, daemon=True)
    tray_thread.start()
    print("[+] Windows System Tray Icon initialized successfully")

    # Wait briefly for servers to bind
    time.sleep(0.6)

    ui_url = f"http://127.0.0.1:{FRONTEND_HTTP_PORT}"

    # 4. Launch Native WebView2 Window or fallback to System Browser
    try:
        import webview
        print("[+] Launching Native Microsoft Edge WebView2 Container...")
        main_window = webview.create_window(
            title="PulseSentry - Network & Threat Sentinel",
            url=ui_url,
            width=1320,
            height=860,
            min_size=(960, 640),
            text_select=True,
            confirm_close=False
        )
        main_window.events.closing += on_window_closing
        webview.start(gui="edgechromium", debug=False)
    except (ImportError, Exception) as e:
        print(f"[*] PyWebView container notice ({e}). Opening in browser...")
        webbrowser.open(ui_url)
        try:
            while not is_quitting:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n[!] PulseSentry stopped.")

if __name__ == "__main__":
    main()
