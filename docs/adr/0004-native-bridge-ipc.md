# Direct Native IPC Bridge for UI Communication

We decided to use PyWebView's direct native JS API bridge and evaluation mechanism for communication between the Python monitoring agent and the web UI, avoiding local port binding, socket collision, and firewall permission prompts on the host machine.
