# Industrial Digital Twin System

A full-stack Digital Twin implementation featuring real-time physics simulation, ML-based anomaly detection, and a 3D interactive dashboard.

## Architecture

### 1. Physics Engine (Backend)
- **Simulator**: Models a motor system with Inertia, Heat Dissipation, and Vibration physics.
- **ML Layer**: Uses Scikit-Learn (Isolation Forest) to detect anomalies in real-time.
- **API**: FastAPI with WebSockets for low-latency telemetry streaming (10Hz).

### 2. Visualization (Frontend)
- **Digital Twin**: A `React Three Fiber` 3D model that reflects the real physical state (Rotation, Color=Heat, Shake=Vibration).
- **Dashboard**: Real-time charts using `Recharts`.
- **Controls**: Bidirectional control loop to start/stop machine and inject faults.

## Quick Start

1. **Install Dependencies** (if not done):
   ```bash
   pip install -r backend/requirements.txt
   cd frontend && npm install
   ```

2. **Run System**:
   Double click `start_system.bat` on your desktop.

## Features to Try
- **Start the Machine**: Click the Play button.
- **Ramp up Speed**: Use the slider to increase RPM. Watch the 3D model spin faster.
- **Overload**: Increase "Load Factor". The temperature will rise, and the model will turn red.
- **Inject Faults**: Click "Imbalance" or "Overheat" to simulate failures. The ML system will flag these as "ANOMALY" and the dashboard will alert you.
