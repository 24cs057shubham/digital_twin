import time

class PIDController:
    def __init__(self, kp=1.0, ki=0.1, kd=0.05):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        
        self.prev_error = 0
        self.integral = 0
        self.last_time = time.time()

    def update(self, current_value, setpoint, dt):
        error = setpoint - current_value
        
        # Proportional
        P = self.kp * error
        
        # Integral
        self.integral += error * dt
        # Anti-windup clamping
        self.integral = max(-50, min(50, self.integral))
        I = self.ki * self.integral
        
        # Derivative
        D = self.kd * (error - self.prev_error) / dt if dt > 0 else 0
        self.prev_error = error
        
        output = P + I + D
        self.last_terms = {"p": P, "i": I, "d": D, "output": output}
        return output
    
    def get_terms(self):
        return getattr(self, "last_terms", {"p": 0, "i": 0, "d": 0, "output": 0})

class RecipeExecutor:
    def __init__(self):
        self.steps = []
        self.current_step_index = -1
        self.start_time = 0
        self.active = False
        self.completed = False

    def load_recipe(self, steps: list):
        self.steps = steps
        self.current_step_index = 0
        self.start_time = time.time()
        self.active = True
        self.completed = False
        return self.get_current_step()

    def update(self):
        if not self.active or self.completed:
            return None

        step = self.steps[self.current_step_index]
        elapsed = time.time() - self.start_time
        
        if elapsed >= step['duration_seconds']:
            # Next Step
            self.current_step_index += 1
            if self.current_step_index >= len(self.steps):
                self.active = False
                self.completed = True
                return None
            
            # Start next step
            self.start_time = time.time()
            return self.steps[self.current_step_index]
        
        return step
    
    def get_status(self):
        if not self.active: return "IDLE" if not self.completed else "RECIPE COMPLETE"
        step = self.steps[self.current_step_index]
        elapsed = time.time() - self.start_time
        remaining = step['duration_seconds'] - elapsed
        return {
            "step_name": step['name'],
            "step_index": self.current_step_index + 1,
            "total_steps": len(self.steps),
            "time_remaining": int(remaining)
        }
