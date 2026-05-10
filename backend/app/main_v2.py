from fastapi import FastAPI, WebSocket
from .simulator_v2 import IndustrialSimulator
import asyncio
import json

app = FastAPI()
sim = IndustrialSimulator()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # 1. Receive Commands (if any)
        try:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
            cmd = json.loads(data)
            if cmd.get("action") == "START_BATCH":
                sim.start_batch()
        except:
            pass
            
        # 2. Update Sim
        sim.update(dt=0.1)
        
        # 3. Send Data
        await websocket.send_json(sim.get_data())
        await asyncio.sleep(0.1)
