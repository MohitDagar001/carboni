// Carbon emission factors (EPA 2025 data)
export const EMISSION_FACTORS = {
  transport: {
    car_gasoline: 0.39, // kg CO2e per mile
    car_electric: 0.13, // kg CO2e per mile (considering US grid average)
    bus: 0.07, // kg CO2e per mile per passenger
    train: 0.045, // kg CO2e per mile per passenger
    bike: 0,
    walking: 0,
  },
  energy: {
    electricity: 0.37, // kg CO2e per kWh (US average)
    naturalGas: 5.3, // kg CO2e per therm
  },
  food: {
    beef: 30.4, // kg CO2e per kg (approximately 0.5kg per serving)
    chicken: 4.2, // kg CO2e per kg (approximately 0.2kg per serving)
    vegetables: 1.0, // kg CO2e per kg (approximately 0.15kg per serving)
  },
};

export interface ActivityData {
  transportType?: string;
  transportDistance?: number;
  electricityUsage?: number;
  naturalGasUsage?: number;
  beefServings?: number;
  chickenServings?: number;
  vegetableServings?: number;
}

export interface EmissionResults {
  transportEmissions: number;
  energyEmissions: number;
  foodEmissions: number;
  totalEmissions: number;
}

export function calculateEmissions(data: ActivityData): EmissionResults {
  let transportEmissions = 0;
  let energyEmissions = 0;
  let foodEmissions = 0;

  // Transport emissions
  if (data.transportType && data.transportDistance) {
    const factor = EMISSION_FACTORS.transport[data.transportType as keyof typeof EMISSION_FACTORS.transport];
    if (factor !== undefined) {
      transportEmissions = factor * data.transportDistance;
    }
  }

  // Energy emissions
  if (data.electricityUsage) {
    energyEmissions += EMISSION_FACTORS.energy.electricity * data.electricityUsage;
  }
  if (data.naturalGasUsage) {
    energyEmissions += EMISSION_FACTORS.energy.naturalGas * data.naturalGasUsage;
  }

  // Food emissions (serving sizes: beef ~0.5kg, chicken ~0.2kg, vegetables ~0.15kg)
  if (data.beefServings) {
    foodEmissions += EMISSION_FACTORS.food.beef * 0.5 * data.beefServings;
  }
  if (data.chickenServings) {
    foodEmissions += EMISSION_FACTORS.food.chicken * 0.2 * data.chickenServings;
  }
  if (data.vegetableServings) {
    foodEmissions += EMISSION_FACTORS.food.vegetables * 0.15 * data.vegetableServings;
  }

  const totalEmissions = transportEmissions + energyEmissions + foodEmissions;

  return {
    transportEmissions: Math.round(transportEmissions * 100) / 100,
    energyEmissions: Math.round(energyEmissions * 100) / 100,
    foodEmissions: Math.round(foodEmissions * 100) / 100,
    totalEmissions: Math.round(totalEmissions * 100) / 100,
  };
}

export function formatEmissions(emissions: number): string {
  if (emissions >= 1000) {
    return `${(emissions / 1000).toFixed(2)} tons`;
  }
  return `${emissions.toFixed(2)} kg`;
}

export function getEmissionCategory(totalEmissions: number): 'low' | 'medium' | 'high' {
  // Based on daily emissions
  if (totalEmissions < 5) return 'low';
  if (totalEmissions < 15) return 'medium';
  return 'high';
}

export function getReductionTips(emissionsByCategory: { transport: number; energy: number; food: number }) {
  const tips = [];
  
  if (emissionsByCategory.transport > emissionsByCategory.energy && emissionsByCategory.transport > emissionsByCategory.food) {
    tips.push({
      title: "Use public transportation",
      description: "Reduce transport emissions by 45%",
      category: "transport"
    });
    tips.push({
      title: "Consider carpooling",
      description: "Share rides to cut emissions in half",
      category: "transport"
    });
  }
  
  if (emissionsByCategory.energy > 1.0) {
    tips.push({
      title: "Switch to LED bulbs",
      description: "Save 75% energy usage on lighting",
      category: "energy"
    });
    tips.push({
      title: "Unplug devices when not in use",
      description: "Eliminate phantom energy consumption",
      category: "energy"
    });
  }
  
  if (emissionsByCategory.food > 0.5) {
    tips.push({
      title: "Eat more plant-based meals",
      description: "Lower food carbon footprint significantly",
      category: "food"
    });
    tips.push({
      title: "Choose local and seasonal produce",
      description: "Reduce food transportation emissions",
      category: "food"
    });
  }
  
  return tips;
}
