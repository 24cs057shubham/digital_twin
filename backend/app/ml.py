from .simulator import log_event

class IntelligentBrain:
    def analyze(self, telemetry):
        alerts = []
        rul_msg = None
        
        # 1. Physics-Informed Anomaly Detection
        # Rule: Pressure Rising + Temp Falling = BLOCKAGE
        # This is a heuristic relationship that simple stats might miss
        # We need state tracking, but for now we look at absolute values acting as proxies for trends
        # In a real app we'd track dP/dt and dT/dt
        if telemetry['pressure'] > 1.5 and telemetry['temp'] < 40:
             msg = "Flow Blockage Detected (High P / Low T)"
             alerts.append(msg)
             log_event("AI_ALERT", msg, telemetry)

        # 2. Contamination Risk
        if telemetry['temp'] > 75:
             msg = "High Risk: Trichlorophenol Contamination"
             alerts.append(msg)
             log_event("AI_WARNING", msg, telemetry)
             
        # 3. RUL (Remaining Useful Life) - Vibration Analysis
        if telemetry['vibration'] > 2.5:
             rul_msg = "Bearing Failure Predicted in < 48 Hours"
             log_event("AI_CRITICAL", rul_msg, telemetry)
        elif telemetry['vibration'] > 1.5:
             rul_msg = "Bearing Wear Detected - Maintenance Recommended"
             
        return {
            "alerts": alerts,
            "rul_prediction": rul_msg,
            "system_health": "CRITICAL" if rul_msg and ">" in rul_msg else "WARNING" if alerts else "OPTIMAL"
        }
