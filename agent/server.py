"""
WebSocket Server for PulseSentry streaming telemetry and real-time control
"""
import asyncio
import json
import websockets
from .collector import NetworkCollector
from .speedtest_engine import SpeedtestEngine

collector = NetworkCollector()
connected_clients = set()
speedtest_engine: SpeedtestEngine = None
active_speedtest_task: asyncio.Task = None

async def broadcast_async(payload_dict: dict):
    """Asynchronously broadcast payload over active websockets."""
    if not connected_clients:
        return
    msg = json.dumps(payload_dict)
    for ws in list(connected_clients):
        try:
            await ws.send(msg)
        except Exception:
            pass

async def handle_client_message(websocket, message_str: str):
    """Process actions from React UI (e.g. speedtest, process termination, sentinel rules)"""
    global speedtest_engine, active_speedtest_task
    try:
        data = json.loads(message_str)
        action = data.get("action")

        if action == "START_SPEEDTEST":
            provider = data.get("provider", "3bb_pathum")
            mode = data.get("mode", "multi")
            if speedtest_engine and speedtest_engine.is_running:
                speedtest_engine.cancel()
                if active_speedtest_task and not active_speedtest_task.done():
                    active_speedtest_task.cancel()

            async def on_progress(p_data):
                await broadcast_async({
                    "type": "SPEEDTEST_PROGRESS",
                    **p_data
                })

            speedtest_engine = SpeedtestEngine(progress_callback=on_progress)

            async def run_benchmark():
                res = await speedtest_engine.run_test(provider=provider, mode=mode)
                await broadcast_async({
                    "type": "SPEEDTEST_COMPLETE",
                    "result": res
                })

            active_speedtest_task = asyncio.create_task(run_benchmark())

        elif action == "CANCEL_SPEEDTEST":
            if speedtest_engine:
                speedtest_engine.cancel()
            if active_speedtest_task and not active_speedtest_task.done():
                active_speedtest_task.cancel()
            await broadcast_async({
                "type": "SPEEDTEST_PROGRESS",
                "stage": "cancelled",
                "percent": 0
            })

        elif action == "TERMINATE_PROCESS":
            pid = data.get("pid")
            if pid:
                result = collector.sentinel.terminate_process(int(pid))
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
            collector.sentinel.update_rules(rules)
            await websocket.send(json.dumps({
                "type": "SENTINEL_RULES_UPDATED",
                "rules": collector.sentinel.rules
            }))

    except Exception as e:
        print(f"[!] Error processing client command: {e}")

async def handler(websocket):
    connected_clients.add(websocket)
    print(f"[+] Client connected: {websocket.remote_address}")
    try:
        # Send initial snapshot immediately
        snapshot = collector.collect_snapshot()
        await websocket.send(json.dumps(snapshot))
        
        async for message in websocket:
            await handle_client_message(websocket, message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        print(f"[-] Client disconnected: {websocket.remote_address}")

async def broadcast_loop():
    loop = asyncio.get_running_loop()
    while True:
        await asyncio.sleep(1.0)
        if not connected_clients:
            continue
        try:
            snapshot = await loop.run_in_executor(None, collector.collect_snapshot)
            payload = json.dumps(snapshot)
            # Broadcast to all connected UI clients
            websockets_to_remove = set()
            for ws in connected_clients:
                try:
                    await ws.send(payload)
                except Exception:
                    websockets_to_remove.add(ws)
            connected_clients.difference_update(websockets_to_remove)
        except Exception as e:
            print(f"[!] Error in broadcast loop: {e}")

async def main():
    host = "127.0.0.1"
    port = 8765
    print(f"[*] PulseSentry OS Agent starting on ws://{host}:{port} ...")
    async with websockets.serve(handler, host, port):
        print(f"[+] PulseSentry WebSocket Live Agent running on ws://{host}:{port}")
        await broadcast_loop()

if __name__ == "__main__":
    asyncio.run(main())
