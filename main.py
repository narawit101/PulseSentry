"""
PulseSentry - Standalone Launcher and OS Live Agent Server
"""
import sys
import asyncio
from agent.server import main as run_server

if __name__ == "__main__":
    print("=" * 60)
    print("  [+] PulseSentry OS Network & Process Sentinel")
    print("  Streaming live Windows metrics on ws://127.0.0.1:8765")
    print("=" * 60)
    try:
        asyncio.run(run_server())
    except KeyboardInterrupt:
        print("\n[!] PulseSentry Sentinel stopped.")
