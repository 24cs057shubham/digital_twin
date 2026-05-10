"""
Industrial Digital Twin API Server
FastAPI backend with WebSocket for real-time telemetry and REST endpoints for batch reports
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from .database import init_db
from .simulator import GodModeReactor
from .data_logger import data_logger

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="2026 Industrial Digital Twin",
    description="2,6-Dichlorophenol Batch Reactor Digital Twin API",
    version="2.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize reactor simulator
reactor = GodModeReactor()


class ConnectionManager:
    """WebSocket connection manager for broadcasting telemetry"""
    
    def __init__(self):
        self.connections: list[WebSocket] = []
    
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)
    
    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)
    
    async def broadcast(self, msg: str):
        disconnected = []
        for ws in self.connections:
            try:
                await ws.send_text(msg)
            except Exception:
                disconnected.append(ws)
        
        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws)


manager = ConnectionManager()


async def run_simulation_loop():
    """Main simulation loop - updates reactor and broadcasts telemetry"""
    while True:
        reactor.update(dt=0.1)
        data = reactor.get_telemetry()
        payload = {
            "telemetry": data,
            "audit": reactor.get_audit_log()
        }
        await manager.broadcast(json.dumps(payload))
        await asyncio.sleep(0.1)


@app.on_event("startup")
async def startup_event():
    """Start simulation loop on app startup"""
    asyncio.create_task(run_simulation_loop())


# =====================
# WebSocket Endpoint
# =====================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry streaming
    
    - Receives: Control commands as JSON
    - Sends: Telemetry data every 100ms
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            cmd = json.loads(data)
            reactor.set_command(cmd)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# =====================
# REST API Endpoints
# =====================

@app.get("/")
async def root():
    """API root - health check"""
    return {
        "status": "online",
        "name": "2,6-Dichlorophenol Digital Twin",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/status")
async def get_status():
    """Get current reactor status"""
    return reactor.get_telemetry()


@app.get("/api/recipe/status")
async def get_recipe_status():
    """Get detailed recipe/batch status"""
    return reactor.recipe.get_detailed_status()


@app.get("/api/recipe/steps")
async def get_recipe_steps():
    """Get all recipe steps with their status"""
    detail = reactor.recipe.get_detailed_status()
    return {
        "total_steps": detail["total_steps"],
        "current_step": detail["current_step_index"],
        "steps": detail["all_steps"]
    }


@app.post("/api/recipe/start")
async def start_recipe():
    """Start the batch recipe"""
    success = reactor.recipe.start()
    if success:
        reactor.log_event("INFO", "Recipe started via REST API")
        return {"status": "started", "message": "Batch recipe started"}
    return {"status": "error", "message": "Recipe could not be started (not in IDLE state)"}


@app.post("/api/recipe/stop")
async def stop_recipe():
    """Stop/abort the current batch"""
    reactor.recipe.abort()
    reactor.log_event("WARNING", "Recipe aborted via REST API")
    return {"status": "aborted", "message": "Batch recipe aborted"}


@app.post("/api/recipe/reset")
async def reset_recipe():
    """Reset recipe to IDLE state"""
    reactor.set_command({"RECIPE_CMD": "RESET"})
    return {"status": "reset", "message": "Recipe reset to IDLE"}


@app.get("/api/batch/summary")
async def get_batch_summary():
    """Get current/last batch summary statistics"""
    return data_logger.generate_batch_summary()


@app.get("/api/batch/report")
async def generate_batch_report():
    """Generate and return batch report CSV"""
    report_path = data_logger.generate_csv_report()
    
    if report_path and Path(report_path).exists():
        return FileResponse(
            path=report_path,
            filename=Path(report_path).name,
            media_type="text/csv"
        )
    
    raise HTTPException(status_code=404, detail="No batch data available for report")


@app.get("/api/batch/reports")
async def list_batch_reports():
    """List all available batch reports"""
    log_dir = Path(data_logger.log_dir)
    
    if not log_dir.exists():
        return {"reports": []}
    
    reports = []
    for f in log_dir.glob("*.csv"):
        reports.append({
            "filename": f.name,
            "size_bytes": f.stat().st_size,
            "created": datetime.fromtimestamp(f.stat().st_ctime).isoformat()
        })
    
    return {"reports": sorted(reports, key=lambda x: x["created"], reverse=True)}


@app.get("/api/batch/report/{filename}")
async def download_batch_report(filename: str):
    """Download a specific batch report"""
    report_path = Path(data_logger.log_dir) / filename
    
    if report_path.exists() and report_path.suffix == ".csv":
        return FileResponse(
            path=str(report_path),
            filename=filename,
            media_type="text/csv"
        )
    
    raise HTTPException(status_code=404, detail="Report not found")


@app.get("/api/telemetry/history")
async def get_telemetry_history():
    """Get recent telemetry history"""
    return {
        "count": len(data_logger.telemetry_buffer),
        "data": data_logger.get_recent_telemetry(100)
    }


@app.get("/api/events")
async def get_events():
    """Get recent events/audit log"""
    return {
        "events": data_logger.get_recent_events(50)
    }


@app.get("/api/control-actions")
async def get_control_actions():
    """Get recent control actions log"""
    return {
        "actions": data_logger.get_control_actions(50)
    }


@app.post("/api/control")
async def send_control(command: dict):
    """Send a control command to the reactor"""
    try:
        reactor.set_command(command)
        return {"status": "ok", "command": command}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/faults")
async def get_faults():
    """Get current fault injection status"""
    return reactor.faults


@app.post("/api/fault/{fault_name}/toggle")
async def toggle_fault(fault_name: str):
    """Toggle a fault injection"""
    if fault_name in reactor.faults:
        reactor.set_command({"toggle_fault": fault_name})
        return {
            "fault": fault_name,
            "active": reactor.faults[fault_name]
        }
    
    raise HTTPException(
        status_code=404,
        detail=f"Unknown fault: {fault_name}. Available: {list(reactor.faults.keys())}"
    )


@app.get("/api/interlocks")
async def get_interlocks():
    """Get current interlock status"""
    return {
        "active": reactor.recipe.interlock.active,
        "reason": reactor.recipe.interlock.reason,
        "conditions": reactor.recipe.interlock.failed_conditions
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
