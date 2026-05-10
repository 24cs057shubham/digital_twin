# Software Requirements Specification (SRS)
## Industrial Digital Twin System

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to detail the software requirements for the **Industrial Digital Twin System**, a full-stack solution featuring real-time physics simulation, machine learning-based anomaly detection, and a 3D interactive dashboard. This document addresses both the system architecture (V2) as well as the end-user features.

### 1.2 Scope
The Industrial Digital Twin System serves as a real-time monitor and simulator for a batch-processing machinery environment (e.g., thermal motor systems and reactors). Its major goals are to:
- Simulate physical behaviors such as inertia, heat dissipation, and vibration with a responsive control loop.
- Provide a robust state machine for automated batch processes.
- Stream telemetry data continuously to a 3D browser-based interface.
- Automatically detect faults and notify users using an Isolation Forest ML model.
- Offer bidirectional manual control and fault injection for presentation and testing.

---

## 2. Overall Description

### 2.1 Product Perspective
The product acts as an integrated client-server application:
- **Backend**: Built with Python and FastAPI, handling the physics simulation and ML inference. State persistence is managed through local SQLite databases (`digital_thread.db`, `digital_twin_production.db`). Communication handles real-time data streaming over WebSockets.
- **Frontend**: A React-based web dashboard. It combines standard UI components for data visualization (Recharts) with a 3D canvas (React Three Fiber) to visually represent the asset.

### 2.2 System Architecture
The system employs a specific V2 architecture driven by predictable process modeling:
1. **Recipe State Machine (`recipe_engine.py`)**: Acts as the central conductor for batch operations. It iterates through predefined temporal states: `IDLE -> HEATING -> REACTING -> COOLING -> DONE`.
2. **Intelligent P-Controller (`simulator_v2.py`)**: Determines power output required based on the formula `Power = (Target - Actual) * Kp` (with Kp = 0.8). This ensures smooth, realistic transitioning of heat curves resembling natural physical inertia.

### 2.3 User Characteristics
The intended users include:
- **System Operators**: Monitoring ongoing batches to ensure process adherence.
- **Maintenance Engineers**: Reviewing system performance and checking for anomalies.
- **Instructors/Presenters**: Demonstrating the concept of a digital twin by visualizing self-healing/alerting processes and injecting failures.

---

## 3. System Features

### 3.1 Advanced 3D Interactive Visualization
- **Description**: The system must provide a 3D model representation of the industrial component that reacts directly to the actual telemetry of the engine.
- **Behaviors**:
  - **Rotation**: Engine spin speed must match the actual RPM dynamically.
  - **Color Translation**: The color of the 3D model must dynamically represent heat (e.g., turning red on overload).
  - **Transform Translation**: The 3D model must visually shake under detected high vibration.

### 3.2 Real-Time Dashboard & "Ghost Line" Tracking
- **Description**: The dashboard must present telemetry and comparisons. 
- **Behaviors**: Display real-time dual-line graphs (`SimpleDashboard.jsx`):
  - **Ghost Line (Grey Dashed)**: Represents the ideal or target process state.
  - **Twin Line (Cyan Solid)**: Represents the actual, current sensor-level process state.
  This visual comparison enables instant, visual verification of standard tracking deviations or lags.

### 3.3 Physics Simulation & Control Loop
- **Description**: The backend must act as an ongoing control loop simulation mimicking a multi-metric process.
- **Features**: Simulation covers RPM manipulation via a speed slider, and load scaling ("Load Factor") that causes organic consequent increases in variables like temperature.

### 3.4 ML-Based Anomaly Detection
- **Description**: A machine learning layer utilizing Scikit-learn (Isolation Forest algorithm) must analyze outgoing telemetry in real-time.
- **Behaviors**: During anomalous operation characteristics (e.g., simulated failure), the system must flag the anomaly automatically and alert the active frontend via WebSocket.

### 3.5 Bidirectional Control and Fault Injection Protocol
- **Description**: Users must be able to inject failure states dynamically during a running machine sequence to test anomaly detection or demonstrate system monitoring.
- **Behaviors**: 
  - Ability to click "Imbalance" or "Overheat".
  - Ability to inject a backend failure during the `HEATING` phase via JSON WebSocket payload (`{"action": "FAIL_HEATER"}`).
  - Verification: The system must reflect the failure as a divergence between the Actual Line and the Ghost Line.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- A responsive web application accessible via modern web browsers.
- Contains play/stop components, speed constraint sliders, load factor adjustments, and fault injection buttons.

### 4.2 Software Interfaces
- **FastAPI / Uvicorn Server**: Hosts the principal API and WebSockets server on the local machine.
- **Node.js Environment**: Hosts the frontend React interface environment.
- **Database**: SQLite interface managing batch threads and digital twin history mappings.

### 4.3 Communication Interfaces
- **WebSocket Protocol**: Required for maintaining low-latency, bidirectional telemetry streaming. Telemetry output must hold a refresh rate of ~10Hz to ensure smooth visual tracking in the dashboard.

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- **Latency**: Telemetry updates from the simulated motor states MUST emit at a minimum of 10Hz to ensure dashboard UI graphs and the 3D model rotation do not stutter.

### 5.2 Reliability
- The backend simulation must continue to run uninterrupted during active client disconnects and correctly re-broadcast the active machine state once a client re-attaches (`digital_twin_production.db` logging helps with restoring recent scope).
