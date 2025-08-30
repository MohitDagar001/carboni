import {
  users,
  activities,
  goals,
  achievements,
  type User,
  type UpsertUser,
  type Activity,
  type InsertActivity,
  type Goal,
  type InsertGoal,
  type Achievement,
  type InsertAchievement,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Activity operations
  createActivity(activity: InsertActivity & { transportEmissions?: number; energyEmissions?: number; foodEmissions?: number; totalEmissions: number }): Promise<Activity>;
  getUserActivities(userId: string, limit?: number): Promise<Activity[]>;
  getUserActivitiesByDateRange(userId: string, startDate: string, endDate: string): Promise<Activity[]>;
  getTotalEmissions(userId: string): Promise<number>;
  getEmissionsThisMonth(userId: string): Promise<number>;
  getEmissionsLastMonth(userId: string): Promise<number>;
  getEmissionsByCategory(userId: string, days?: number): Promise<{
    transport: number;
    energy: number;
    food: number;
  }>;
  
  // Goal operations
  createGoal(goal: InsertGoal): Promise<Goal>;
  getUserGoals(userId: string): Promise<Goal[]>;
  updateGoal(goalId: number, updates: Partial<Goal>): Promise<Goal>;
  
  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  
  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<Array<{
    user: User;
    totalEmissions: number;
    rank: number;
  }>>;
  getUserRank(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Activity operations
  async createActivity(activity: InsertActivity & { transportEmissions?: number; energyEmissions?: number; foodEmissions?: number; totalEmissions: number }): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getUserActivities(userId: string, limit: number = 30): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.date))
      .limit(limit);
  }

  async getUserActivitiesByDateRange(userId: string, startDate: string, endDate: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.date, startDate),
          lte(activities.date, endDate)
        )
      )
      .orderBy(desc(activities.date));
  }

  async getTotalEmissions(userId: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`sum(${activities.totalEmissions})` })
      .from(activities)
      .where(eq(activities.userId, userId));
    
    return result[0]?.total || 0;
  }

  async getEmissionsThisMonth(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const result = await db
      .select({ total: sql<number>`sum(${activities.totalEmissions})` })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.date, startOfMonth.toISOString().split('T')[0]),
          lte(activities.date, endOfMonth.toISOString().split('T')[0])
        )
      );
    
    return result[0]?.total || 0;
  }

  async getEmissionsLastMonth(userId: string): Promise<number> {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const result = await db
      .select({ total: sql<number>`sum(${activities.totalEmissions})` })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.date, startOfLastMonth.toISOString().split('T')[0]),
          lte(activities.date, endOfLastMonth.toISOString().split('T')[0])
        )
      );
    
    return result[0]?.total || 0;
  }

  async getEmissionsByCategory(userId: string, days: number = 30): Promise<{
    transport: number;
    energy: number;
    food: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await db
      .select({
        transport: sql<number>`sum(${activities.transportEmissions})`,
        energy: sql<number>`sum(${activities.energyEmissions})`,
        food: sql<number>`sum(${activities.foodEmissions})`,
      })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.date, cutoffDate.toISOString().split('T')[0])
        )
      );
    
    return {
      transport: result[0]?.transport || 0,
      energy: result[0]?.energy || 0,
      food: result[0]?.food || 0,
    };
  }

  // Goal operations
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async getUserGoals(userId: string): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async updateGoal(goalId: number, updates: Partial<Goal>): Promise<Goal> {
    const [updatedGoal] = await db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, goalId))
      .returning();
    return updatedGoal;
  }

  // Achievement operations
  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));
  }

  // Leaderboard operations
  async getLeaderboard(limit: number = 10): Promise<Array<{
    user: User;
    totalEmissions: number;
    rank: number;
  }>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const result = await db
      .select({
        user: users,
        totalEmissions: sql<number>`sum(${activities.totalEmissions})`,
      })
      .from(users)
      .leftJoin(activities, eq(users.id, activities.userId))
      .where(
        and(
          gte(activities.date, startOfMonth.toISOString().split('T')[0]),
          lte(activities.date, endOfMonth.toISOString().split('T')[0])
        )
      )
      .groupBy(users.id)
      .orderBy(sql`sum(${activities.totalEmissions}) ASC`)
      .limit(limit);
    
    return result.map((row, index) => ({
      user: row.user,
      totalEmissions: row.totalEmissions || 0,
      rank: index + 1,
    }));
  }

  async getUserRank(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const userEmissions = await db
      .select({ total: sql<number>`sum(${activities.totalEmissions})` })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.date, startOfMonth.toISOString().split('T')[0]),
          lte(activities.date, endOfMonth.toISOString().split('T')[0])
        )
      );
    
    const userTotal = userEmissions[0]?.total || 0;
    
    const betterUsers = await db
      .select({ count: count() })
      .from(activities)
      .where(
        and(
          gte(activities.date, startOfMonth.toISOString().split('T')[0]),
          lte(activities.date, endOfMonth.toISOString().split('T')[0])
        )
      )
      .groupBy(activities.userId)
      .having(sql`sum(${activities.totalEmissions}) < ${userTotal}`);
    
    return betterUsers.length + 1;
  }
}

export const storage = new DatabaseStorage();
