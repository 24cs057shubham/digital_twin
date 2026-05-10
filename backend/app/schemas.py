from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class TelemetryBase(BaseModel):
    timestamp: datetime
    temp: float
    pressure: float
    cl2_flow: float
    ph: float
    purity: float
    vibration: float
    bearing_health: float

class TelemetryCreate(TelemetryBase):
    pass

class LogCreate(BaseModel):
    level: str
    message: str
    meta_data: Optional[Dict[str, Any]] = None

class SimulationRequest(BaseModel):
    hours: int = 4

class RecipeStep(BaseModel):
    name: str
    target_temp: float
    target_pressure: float
    duration_seconds: int
    cl2_flow: float
