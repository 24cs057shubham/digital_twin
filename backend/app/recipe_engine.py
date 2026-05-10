"""
Advanced Recipe Engine for 2,6-Dichlorophenol Batch Reactor
With Sequential Steps, Dependencies, State Machine Logic, and Safety Interlocks
"""

import time
from enum import Enum, auto
from datetime import datetime


class RecipeState(Enum):
    IDLE = auto()
    LOAD_PHENOL = auto()
    ADD_SOLVENT = auto()
    HEATING = auto()
    HOLD_TEMP = auto()
    ADD_CATALYST = auto()
    CHLORINATING = auto()
    COOLING = auto()
    SEPARATING = auto()
    COMPLETE = auto()
    ABORTED = auto()
    SAFETY_HOLD = auto()


class InterlockStatus:
    """Safety interlock status container"""
    def __init__(self):
        self.active = False
        self.reason = ""
        self.failed_conditions = []


class RecipeStep:
    """Defines a single recipe step with dependencies and conditions"""
    def __init__(
        self,
        state: RecipeState,
        name: str,
        description: str,
        duration_seconds: int,
        target_temp: float = None,
        temp_tolerance: float = 2.0,
        cl2_flow_required: bool = False,
        min_agitator_rpm: int = 0,
        prerequisites: list = None,
        auto_actions: dict = None
    ):
        self.state = state
        self.name = name
        self.description = description
        self.duration_seconds = duration_seconds
        self.target_temp = target_temp
        self.temp_tolerance = temp_tolerance
        self.cl2_flow_required = cl2_flow_required
        self.min_agitator_rpm = min_agitator_rpm
        self.prerequisites = prerequisites or []
        self.auto_actions = auto_actions or {}


class RecipeEngine:
    """
    Advanced Recipe State Machine for DCP Production
    
    Key Features:
    - Sequential step execution with dependencies
    - Temperature-based interlocks
    - Time-based hold requirements
    - Safety condition checks before step transitions
    """
    
    def __init__(self):
        self.state = RecipeState.IDLE
        self.current_step_idx = 0
        self.step_start_time = 0
        self.total_batch_time = 0
        self.batch_start_time = 0
        
        # Interlocks
        self.interlock = InterlockStatus()
        
        # Hold timer for chlorination (12 hours = 43200 seconds, demo: 60 seconds)
        self.chlorination_hold_time = 60  # seconds (set low for demo, would be 43200 in production)
        self.chlorination_elapsed = 0
        
        # Recipe definition (loaded dynamically)
        self.recipe_steps = []
        self.load_dcp_recipe()
        
        # Condition tracking
        self.conditions = {
            "temp_stable": False,
            "chlorination_complete": False,
            "safety_ok": True
        }
        
        # Control outputs for automation
        self.auto_control = {
            "heating_power": 0,
            "cooling_power": 50,
            "cl2_valve": 0
        }

    def load_dcp_recipe(self):
        """
        Load the standard 2,6-Dichlorophenol production recipe
        7 Sequential Steps with dependencies
        """
        self.recipe_steps = [
            RecipeStep(
                state=RecipeState.LOAD_PHENOL,
                name="Load Phenol",
                description="Loading 1.0 kg phenol into reactor vessel",
                duration_seconds=30,
                target_temp=25.0,
                min_agitator_rpm=50,
                auto_actions={"heating_power": 0, "cl2_valve": 0}
            ),
            RecipeStep(
                state=RecipeState.ADD_SOLVENT,
                name="Add Chlorobenzene",
                description="Adding chlorobenzene solvent for reaction medium",
                duration_seconds=45,
                target_temp=25.0,
                min_agitator_rpm=100,
                prerequisites=["step_1_complete"],
                auto_actions={"heating_power": 0, "cl2_valve": 0}
            ),
            RecipeStep(
                state=RecipeState.HEATING,
                name="Heat to 75°C",
                description="Ramping temperature to reaction setpoint",
                duration_seconds=120,
                target_temp=75.0,
                temp_tolerance=2.0,
                min_agitator_rpm=150,
                prerequisites=["step_2_complete"],
                auto_actions={"heating_power": 100, "cl2_valve": 0}
            ),
            RecipeStep(
                state=RecipeState.HOLD_TEMP,
                name="Temperature Hold",
                description="Stabilizing at 75°C ± 2°C before chlorination",
                duration_seconds=60,
                target_temp=75.0,
                temp_tolerance=2.0,
                min_agitator_rpm=150,
                prerequisites=["step_3_complete", "temp_at_setpoint"],
                auto_actions={"heating_power": 50, "cl2_valve": 0}
            ),
            RecipeStep(
                state=RecipeState.ADD_CATALYST,
                name="Add Catalyst",
                description="Introducing N-methylaniline catalyst",
                duration_seconds=30,
                target_temp=75.0,
                temp_tolerance=2.0,
                min_agitator_rpm=200,
                prerequisites=["step_4_complete", "temp_stable"],
                auto_actions={"heating_power": 50, "cl2_valve": 0}
            ),
            RecipeStep(
                state=RecipeState.CHLORINATING,
                name="Chlorination",
                description="Controlled Cl₂ gas injection (12h reaction)",
                duration_seconds=120,  # Demo: 120s, Production: 43200s (12h)
                target_temp=75.0,
                temp_tolerance=2.0,
                cl2_flow_required=True,
                min_agitator_rpm=200,
                prerequisites=["step_5_complete", "temp_in_range"],
                auto_actions={"heating_power": 50, "cl2_valve": 100}
            ),
            RecipeStep(
                state=RecipeState.COOLING,
                name="Cool Down",
                description="Reducing temperature for product separation",
                duration_seconds=90,
                target_temp=30.0,
                min_agitator_rpm=100,
                prerequisites=["step_6_complete", "chlorination_time_met"],
                auto_actions={"heating_power": 0, "cooling_power": 100, "cl2_valve": 0}
            ),
            RecipeStep(
                state=RecipeState.SEPARATING,
                name="Separate Product",
                description="Product isolation and collection",
                duration_seconds=60,
                target_temp=30.0,
                min_agitator_rpm=50,
                prerequisites=["step_7_complete", "temp_below_40"],
                auto_actions={"heating_power": 0, "cooling_power": 50, "cl2_valve": 0}
            )
        ]
        self.reset()
    
    def check_safety_interlocks(self, current_temp: float, pressure: float, agitator_rpm: float) -> InterlockStatus:
        """
        Check all safety interlocks before allowing step transitions
        
        Rules:
        - Cannot start chlorination unless temperature = 75°C ± 2°C
        - Cannot cool down unless chlorination time is complete
        - Cannot proceed if agitator RPM below minimum
        - Cannot proceed if pressure exceeds limits
        """
        interlock = InterlockStatus()
        failed = []
        
        current_step = self.get_current_step()
        if not current_step:
            return interlock
        
        # Check temperature for chlorination step
        if current_step.state == RecipeState.CHLORINATING or self.get_next_step_state() == RecipeState.CHLORINATING:
            if abs(current_temp - 75.0) > 2.0:
                failed.append(f"INTERLOCK: Temperature {current_temp:.1f}°C not at 75°C ± 2°C for chlorination")
        
        # Check chlorination time for cooling step
        if self.get_next_step_state() == RecipeState.COOLING:
            if self.state == RecipeState.CHLORINATING:
                elapsed = time.time() - self.step_start_time
                if elapsed < self.chlorination_hold_time:
                    remaining = self.chlorination_hold_time - elapsed
                    failed.append(f"INTERLOCK: Chlorination time not complete ({remaining:.0f}s remaining)")
        
        # Check minimum agitator RPM
        if current_step.min_agitator_rpm > 0 and agitator_rpm < current_step.min_agitator_rpm:
            failed.append(f"INTERLOCK: Agitator RPM {agitator_rpm:.0f} below minimum {current_step.min_agitator_rpm}")
        
        # Check pressure limits
        if pressure > 2.5:
            failed.append(f"SAFETY INTERLOCK: Pressure {pressure:.2f} bar exceeds limit (2.5 bar)")
        
        if failed:
            interlock.active = True
            interlock.reason = failed[0]
            interlock.failed_conditions = failed
        
        return interlock
    
    def get_current_step(self) -> RecipeStep:
        """Get the current recipe step"""
        if 0 <= self.current_step_idx < len(self.recipe_steps):
            return self.recipe_steps[self.current_step_idx]
        return None
    
    def get_next_step_state(self) -> RecipeState:
        """Get the state of the next step (for interlock checking)"""
        next_idx = self.current_step_idx + 1
        if next_idx < len(self.recipe_steps):
            return self.recipe_steps[next_idx].state
        return RecipeState.COMPLETE
    
    def start(self):
        """Start recipe execution"""
        if self.state in [RecipeState.IDLE, RecipeState.COMPLETE, RecipeState.ABORTED]:
            self.state = RecipeState.LOAD_PHENOL
            self.current_step_idx = 0
            self.step_start_time = time.time()
            self.batch_start_time = time.time()
            self.chlorination_elapsed = 0
            self.interlock = InterlockStatus()
            print("[RECIPE] Batch Started - Loading Phenol")
            return True
        return False
    
    def abort(self):
        """Abort recipe execution"""
        self.state = RecipeState.ABORTED
        print("[RECIPE] Batch ABORTED!")
    
    def reset(self):
        """Reset recipe to idle state"""
        self.state = RecipeState.IDLE
        self.current_step_idx = 0
        self.step_start_time = 0
        self.batch_start_time = 0
        self.chlorination_elapsed = 0
        self.interlock = InterlockStatus()
        self.conditions = {
            "temp_stable": False,
            "chlorination_complete": False,
            "safety_ok": True
        }
        print("[RECIPE] Recipe Reset to IDLE")
    
    def update(self, current_temp: float = 25.0, pressure: float = 1.0, agitator_rpm: float = 100.0):
        """
        Update recipe state machine
        Returns control setpoints for the reactor
        """
        if self.state in [RecipeState.IDLE, RecipeState.COMPLETE, RecipeState.ABORTED]:
            return None
        
        current_step = self.get_current_step()
        if not current_step:
            self.state = RecipeState.COMPLETE
            return None
        
        elapsed = time.time() - self.step_start_time
        
        # Track chlorination elapsed time
        if self.state == RecipeState.CHLORINATING:
            self.chlorination_elapsed = elapsed
        
        # Check safety interlocks
        self.interlock = self.check_safety_interlocks(current_temp, pressure, agitator_rpm)
        
        # Update conditions
        self.conditions["temp_stable"] = abs(current_temp - 75.0) <= 2.0
        self.conditions["chlorination_complete"] = self.chlorination_elapsed >= self.chlorination_hold_time
        self.conditions["safety_ok"] = not self.interlock.active
        
        # Check if step duration is complete and interlocks are clear
        step_time_complete = elapsed >= current_step.duration_seconds
        
        # For chlorination step, also check minimum time requirement
        if current_step.state == RecipeState.CHLORINATING:
            step_time_complete = step_time_complete and self.conditions["chlorination_complete"]
        
        # Check temperature requirements for advancing
        temp_ok = True
        if current_step.target_temp and current_step.state in [RecipeState.HOLD_TEMP, RecipeState.ADD_CATALYST, RecipeState.CHLORINATING]:
            temp_ok = abs(current_temp - current_step.target_temp) <= current_step.temp_tolerance
        
        # Advance to next step if conditions are met
        if step_time_complete and temp_ok and not self.interlock.active:
            self.current_step_idx += 1
            
            if self.current_step_idx >= len(self.recipe_steps):
                self.state = RecipeState.COMPLETE
                self.total_batch_time = time.time() - self.batch_start_time
                print(f"[RECIPE] Batch COMPLETE! Total time: {self.total_batch_time:.1f}s")
                return None
            
            next_step = self.get_current_step()
            self.state = next_step.state
            self.step_start_time = time.time()
            print(f"[RECIPE] Advancing to Step {self.current_step_idx + 1}: {next_step.name}")
        
        # Return control setpoints
        return {
            "target_temp": current_step.target_temp or 25.0,
            "state_desc": current_step.description,
            "step_name": current_step.name,
            "progress": min(100, (elapsed / current_step.duration_seconds) * 100) if current_step.duration_seconds > 0 else 0,
            "step_index": self.current_step_idx + 1,
            "total_steps": len(self.recipe_steps),
            "elapsed_seconds": elapsed,
            "remaining_seconds": max(0, current_step.duration_seconds - elapsed),
            "auto_actions": current_step.auto_actions,
            "interlock_active": self.interlock.active,
            "interlock_reason": self.interlock.reason
        }
    
    def get_status(self) -> str:
        """Get human-readable status string"""
        if self.state == RecipeState.IDLE:
            return "READY"
        if self.state == RecipeState.COMPLETE:
            return "BATCH COMPLETE"
        if self.state == RecipeState.ABORTED:
            return "ABORTED"
        if self.state == RecipeState.SAFETY_HOLD:
            return f"SAFETY HOLD: {self.interlock.reason}"
        
        current_step = self.get_current_step()
        if current_step:
            elapsed = time.time() - self.step_start_time
            remaining = max(0, current_step.duration_seconds - elapsed)
            return f"{current_step.name} (Step {self.current_step_idx + 1}/{len(self.recipe_steps)}) - {remaining:.0f}s left"
        
        return "READY"
    
    def get_detailed_status(self) -> dict:
        """Get detailed status for frontend display"""
        current_step = self.get_current_step()
        elapsed = time.time() - self.step_start_time if self.step_start_time > 0 else 0
        batch_elapsed = time.time() - self.batch_start_time if self.batch_start_time > 0 else 0
        
        return {
            "state": self.state.name,
            "current_step_index": self.current_step_idx + 1,
            "total_steps": len(self.recipe_steps),
            "current_step_name": current_step.name if current_step else "N/A",
            "current_step_description": current_step.description if current_step else "N/A",
            "step_elapsed_seconds": elapsed,
            "step_remaining_seconds": max(0, current_step.duration_seconds - elapsed) if current_step else 0,
            "step_progress_pct": min(100, (elapsed / current_step.duration_seconds) * 100) if current_step and current_step.duration_seconds > 0 else 0,
            "batch_elapsed_seconds": batch_elapsed,
            "target_temp": current_step.target_temp if current_step else None,
            "min_agitator_rpm": current_step.min_agitator_rpm if current_step else 0,
            "cl2_required": current_step.cl2_flow_required if current_step else False,
            "interlock_active": self.interlock.active,
            "interlock_reason": self.interlock.reason,
            "interlock_conditions": self.interlock.failed_conditions,
            "all_steps": [
                {
                    "index": i + 1,
                    "name": step.name,
                    "description": step.description,
                    "duration": step.duration_seconds,
                    "target_temp": step.target_temp,
                    "status": "complete" if i < self.current_step_idx else ("active" if i == self.current_step_idx and self.state not in [RecipeState.IDLE, RecipeState.COMPLETE, RecipeState.ABORTED] else "pending")
                }
                for i, step in enumerate(self.recipe_steps)
            ]
        }


# Control Logic Functions (Simple IF-THEN Rules)
class ControlLogic:
    """
    Basic Control Logic Implementation
    Simple proportional control with temperature bounds
    """
    
    @staticmethod
    def calculate_heating_power(current_temp: float, target_temp: float) -> float:
        """
        Calculate heating power based on temperature error
        If temp < 72°C → Increase heating
        If temp > 78°C → Turn off heating
        """
        if current_temp < target_temp - 3:  # More than 3°C below target
            return 100.0  # Full heating
        elif current_temp < target_temp:
            # Proportional control
            error = target_temp - current_temp
            return min(100, max(0, error * 33.3))  # 33.3% per degree
        else:
            return 0.0  # No heating needed
    
    @staticmethod
    def calculate_cooling_power(current_temp: float, target_temp: float) -> float:
        """
        Calculate cooling power based on temperature error
        If temp > 78°C → Increase cooling
        If temp < 72°C → Reduce cooling
        """
        if current_temp > target_temp + 3:  # More than 3°C above target
            return 100.0  # Full cooling
        elif current_temp > target_temp:
            # Proportional control
            error = current_temp - target_temp
            return min(100, max(20, error * 33.3 + 20))  # Base 20% + proportional
        else:
            return 20.0  # Minimum cooling
    
    @staticmethod
    def calculate_cl2_valve(flow_rate_setpoint: float, max_flow: float = 25.0) -> float:
        """
        Calculate Cl2 valve position based on flow rate setpoint
        If flow rate too high → Close valve partially
        """
        if flow_rate_setpoint > max_flow:
            return 80.0  # Limit to 80% if over max
        return min(100, max(0, (flow_rate_setpoint / max_flow) * 100))
