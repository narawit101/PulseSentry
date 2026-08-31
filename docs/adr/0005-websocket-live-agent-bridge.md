# WebSocket Agent Bridge with Automatic Mock Fallback

We decided to use a local WebSocket server (`ws://127.0.0.1:8765`) for streaming live OS metrics from the Python monitoring agent to the React frontend every 1 second, coupled with automatic mock fallback in the frontend when the backend agent is offline.
