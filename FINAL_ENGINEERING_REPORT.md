# Final Engineering Report - Industrial Digital Twin

## architecture Overview
The system has been rebuilt using a V2 architecture focused on State-Machine reliability and PID Control physics.

### 1. Recipe State Machine (`recipe_engine.py`)
- **Purpose**: Acts as the central conductor for batch operations.
- **States**: `IDLE -> HEATING -> REACTING -> COOLING -> DONE`.
- **Transitions**: Strictly time-based for this iteration (Duration > Limit).

### 2. Intelligent P-Controller (`simulator_v2.py`)
- **Logic**: `Power = (Target - Actual) * Kp`
- **Tuning**: Kp = 0.8
- **Benefit**: Removes "Digital On/Off" jerking. The simulation now curves smoothly towards the setpoint, mimicking physical heater inertia.

### 3. Ghost Line Visualization (`SimpleDashboard.jsx`)
- **Concept**: Displays two lines on the graph:
  - **Grey Dashed**: The "Ghost" (Where the process *should* be).
  - **Cyan Solid**: The "Twin" (Where the process *is*).
- **Utility**: Allows instant visual verification of tracking error (lag).

## Failure Demo Protocol
To demonstrate the "Self-Healing/Alerting" capabilities during presentation:

1.  Start a Batch.
2.  Wait for the "Heating Phase".
3.  Send JSON Command: `{"action": "FAIL_HEATER"}` (via Websocket).
4.  **Observation**: 
    - The "Actual" line will diverge downwards from the "Ghost" line.
    - This visual divergence proves the Digital Twin is tracking reality accurately vs expectation.

## Running the System
1. Stop any running instances.
2. Run backend: `uvicorn app.main_v2:app --reload`
3. Run frontend: Import `SimpleDashboard` into `App.jsx` and run `npm run dev`.
