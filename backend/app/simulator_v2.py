from .recipe_engine import RecipeEngine

class IndustrialSimulator:
    def __init__(self):
        self.temperature = 25.0
        self.recipe = RecipeEngine()
        self.heater_power = 0.0
        
    def update(self, dt=0.1):
        # 1. Update Recipe Logic
        target_info = self.recipe.update()
        
        target_temp = 25.0
        if target_info:
            target_temp = target_info['target_temp']
        
        # 2. Physics with P-Controller
        error = target_temp - self.temperature
        Kp = 0.8 # Proportional Gain
        
        # Heater Power (0-100%)
        if self.heater_power is None: self.heater_power = 0 # Safety check
        
        # FAILURE MODE: If heater fails, power is 0 regardless of logic
        if hasattr(self, 'heater_failed') and self.heater_failed:
            self.heater_power = 0.0
        else:
            self.heater_power = max(0, min(100, error * Kp))
        
        # Thermal Dynamics
        # Heat Rise due to Heater - Natural Cooling Loss
        temp_rise = (self.heater_power * 0.1) * dt
        cooling = (self.temperature - 20.0) * 0.05 * dt
        
        self.temperature += temp_rise - cooling
            
    def get_data(self):
        return {
            "temp": round(self.temperature, 1),
            "recipe_status": self.recipe.get_status(),
            "recipe_step": self.recipe.current_step_idx + 1 if self.recipe.state.name not in ['IDLE', 'COMPLETE'] else 0
        }

    def start_batch(self):
        self.recipe.start()
