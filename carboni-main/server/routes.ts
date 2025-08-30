import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertActivitySchema, insertGoalSchema } from "@shared/schema";
import { z } from "zod";

// Carbon emission factors (EPA 2025 data)
const EMISSION_FACTORS = {
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

function calculateEmissions(data: any) {
  let transportEmissions = 0;
  let energyEmissions = 0;
  let foodEmissions = 0;

  // Transport emissions
  if (data.transportType && data.transportDistance) {
    const factor = EMISSION_FACTORS.transport[data.transportType as keyof typeof EMISSION_FACTORS.transport];
    transportEmissions = factor * data.transportDistance;
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

function generatePersonalizedTips(emissionsByCategory: { transport: number; energy: number; food: number }) {
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
  
  if (emissionsByCategory.energy > 1.0) { // Above average daily energy emissions
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
  
  if (emissionsByCategory.food > 0.5) { // High food emissions
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
  
  // Default tips if emissions are low
  if (tips.length === 0) {
    tips.push({
      title: "Great job! Keep it up",
      description: "Your emissions are below average",
      category: "general"
    });
    tips.push({
      title: "Consider offsetting remaining emissions",
      description: "Support verified carbon offset projects",
      category: "general"
    });
  }
  
  return tips.slice(0, 3); // Return top 3 tips
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get emissions data
      const emissionsThisMonth = await storage.getEmissionsThisMonth(userId);
      const emissionsLastMonth = await storage.getEmissionsLastMonth(userId);
      const emissionsByCategory = await storage.getEmissionsByCategory(userId, 7); // Last 7 days
      const recentActivities = await storage.getUserActivities(userId, 7);
      
      // Calculate reduction percentage
      const reductionPercentage = emissionsLastMonth > 0 
        ? Math.round(((emissionsLastMonth - emissionsThisMonth) / emissionsLastMonth) * 100)
        : 0;
      
      // Get user rank
      const userRank = await storage.getUserRank(userId);
      
      // Get goals
      const goals = await storage.getUserGoals(userId);
      
      // Get achievements
      const achievements = await storage.getUserAchievements(userId);
      
      // Generate personalized tips
      const personalizedTips = generatePersonalizedTips(emissionsByCategory);
      
      // Prepare chart data for the last 7 days
      const chartData = {
        labels: [] as string[],
        transport: [] as number[],
        energy: [] as number[],
        food: [] as number[],
      };
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayActivity = recentActivities.find(a => a.date === dateStr);
        
        chartData.labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        chartData.transport.push(dayActivity?.transportEmissions || 0);
        chartData.energy.push(dayActivity?.energyEmissions || 0);
        chartData.food.push(dayActivity?.foodEmissions || 0);
      }
      
      res.json({
        totalEmissionsThisMonth: Math.round(emissionsThisMonth * 100) / 100,
        reductionPercentage,
        rank: userRank,
        emissionsByCategory,
        goals,
        achievements: achievements.slice(0, 5), // Recent achievements
        personalizedTips,
        chartData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Log activity endpoint
  app.post("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityData = req.body;
      
      // Validate the activity data
      const validatedData = insertActivitySchema.parse({
        ...activityData,
        userId,
        date: activityData.date || new Date().toISOString().split('T')[0],
      });
      
      // Calculate emissions
      const emissions = calculateEmissions(validatedData);
      
      // Create activity with calculated emissions
      const activity = await storage.createActivity({
        ...validatedData,
        ...emissions,
      });
      
      res.json({
        activity,
        emissions,
        message: "Activity logged successfully",
      });
    } catch (error) {
      console.error("Error logging activity:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to log activity" });
      }
    }
  });

  // Get user activities
  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 30;
      
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Leaderboard endpoint
  app.get("/api/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Goals endpoints
  app.post("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goalData = req.body;
      
      const validatedData = insertGoalSchema.parse({
        ...goalData,
        userId,
      });
      
      const goal = await storage.createGoal(validatedData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create goal" });
      }
    }
  });

  app.get("/api/goals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getUserGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
