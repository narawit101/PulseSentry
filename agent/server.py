"""
WebSocket Server for PulseSentry streaming telemetry and real-time control (Encapsulated)
"""
import asyncio
import json
from typing import Set, Optional, Any
import websockets
from .collector import NetworkCollector
from .speedtest_engine import SpeedtestEngine


class AgentServer:
    def __init__(self):
        self.collector = NetworkCollector()
        self.connected_clients: Set[Any] = set()
        self.speedtest_engine: Optional[SpeedtestEngine] = None
        self.active_speedtest_task: Optional[asyncio.Task] = None

    async def broadcast_async(self, payload_dict: dict):
        """Asynchronously broadcast payload over active websockets."""
        if not self.connected_clients:
            return
        msg = json.dumps(payload_dict)
        websockets_to_remove = set()
        for ws in list(self.connected_clients):
            try:
                await ws.send(msg)
            except Exception:
                websockets_to_remove.add(ws)
        if websockets_to_remove:
            self.connected_clients.difference_update(websockets_to_remove)

    async def handle_client_message(self, websocket, message_str: str):
        """Process actions from React UI (e.g. speedtest, process termination, sentinel rules)"""
        try:
            data = json.loads(message_str)
            action = data.get("action")

            if action == "START_SPEEDTEST":
                provider = data.get("provider", "3bb_pathum")
                mode = data.get("mode", "multi")
                if self.speedtest_engine and self.speedtest_engine.is_running:
                    self.speedtest_engine.cancel()
                    if self.active_speedtest_task and not self.active_speedtest_task.done():
                        self.active_speedtest_task.cancel()

                async def on_progress(p_data):
                    await self.broadcast_async({
                        "type": "SPEEDTEST_PROGRESS",
                        **p_data
                    })

                self.speedtest_engine = SpeedtestEngine(progress_callback=on_progress)

                async def run_benchmark():
                    res = await self.speedtest_engine.run_test(provider=provider, mode=mode)
                    await self.broadcast_async({
                        "type": "SPEEDTEST_COMPLETE",
                        "result": res
                    })

                self.active_speedtest_task = asyncio.create_task(run_benchmark())

            elif action == "CANCEL_SPEEDTEST":
                if self.speedtest_engine:
                    self.speedtest_engine.cancel()
                if self.active_speedtest_task and not self.active_speedtest_task.done():
                    self.active_speedtest_task.cancel()
                await self.broadcast_async({
                    "type": "SPEEDTEST_PROGRESS",
                    "stage": "cancelled",
                    "percent": 0
                })

            elif action == "TERMINATE_PROCESS":
                pid = data.get("pid")
                if pid:
                    result = self.collector.sentinel.terminate_process(int(pid))
                    await websocket.send(json.dumps({
                        "type": "TERMINATE_RESULT",
                        "result": result
                    }))

            elif action == "GET_SPEEDTEST_SERVERS":
                servers = SpeedtestEngine.get_servers()
                await websocket.send(json.dumps({
                    "type": "SPEEDTEST_SERVERS",
                    "servers": servers
                }))

            elif action == "UPDATE_SENTINEL_RULES":
                rules = data.get("rules", {})
                self.collector.sentinel.update_rules(rules)
                await websocket.send(json.dumps({
                    "type": "SENTINEL_RULES_UPDATED",
                    "rules": self.collector.sentinel.rules
                }))

        except Exception as e:
            print(f"[!] Error processing client command: {e}")

    async def handler(self, websocket):
        self.connected_clients.add(websocket)
        print(f"[+] Client connected: {websocket.remote_address}")
        try:
            snapshot = self.collector.collect_snapshot()
            await websocket.send(json.dumps(snapshot))
            
            async for message in websocket:
                await self.handle_client_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.connected_clients.discard(websocket)
            print(f"[-] Client disconnected: {websocket.remote_address}")

    async def broadcast_loop(self):
        loop = asyncio.get_running_loop()
        while True:
            await asyncio.sleep(1.0)
            if not self.connected_clients:
                continue
            try:
                snapshot = await loop.run_in_executor(None, self.collector.collect_snapshot)
                await self.broadcast_async(snapshot)
            except Exception as e:
                print(f"[!] Error in broadcast loop: {e}")

    async def start(self, host: str = "127.0.0.1", port: int = 8765):
        print(f"[*] PulseSentry OS Agent starting on ws://{host}:{port} ...")
        async with websockets.serve(self.handler, host, port):
            print(f"[+] PulseSentry WebSocket Live Agent running on ws://{host}:{port}")
            await self.broadcast_loop()


def main():
    server = AgentServer()
    asyncio.run(server.start())


if __name__ == "__main__":
    main()
