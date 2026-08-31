"""
WebSocket Server for PulseSentry streaming telemetry and real-time control
"""
import asyncio
import json
import websockets
from .collector import NetworkCollector

collector = NetworkCollector()
connected_clients = set()

async def handle_client_message(websocket, message_str: str):
    """Process actions from React UI (e.g. process termination, sentinel rules)"""
    try:
        data = json.loads(message_str)
        action = data.get("action")

        if action == "TERMINATE_PROCESS":
            pid = data.get("pid")
            if pid:
                result = collector.sentinel.terminate_process(int(pid))
                await websocket.send(json.dumps({
                    "type": "TERMINATE_RESULT",
                    "result": result
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
    while True:
        await asyncio.sleep(1.0)
        if not connected_clients:
            continue
        try:
            snapshot = collector.collect_snapshot()
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
