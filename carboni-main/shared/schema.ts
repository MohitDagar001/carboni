import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  real,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities table for logging carbon emissions
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  
  // Transport data
  transportType: varchar("transport_type"), // car_gasoline, car_electric, bus, train, bike, walking
  transportDistance: real("transport_distance"), // miles
  transportEmissions: real("transport_emissions"), // kg CO2e
  
  // Energy data
  electricityUsage: real("electricity_usage"), // kWh
  naturalGasUsage: real("natural_gas_usage"), // therms
  energyEmissions: real("energy_emissions"), // kg CO2e
  
  // Food data
  beefServings: integer("beef_servings").default(0),
  chickenServings: integer("chicken_servings").default(0),
  vegetableServings: integer("vegetable_servings").default(0),
  foodEmissions: real("food_emissions"), // kg CO2e
  
  // Total emissions for the day
  totalEmissions: real("total_emissions").notNull(), // kg CO2e
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Goals table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // monthly_target, weekly_reduction
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").default(0),
  period: varchar("period").notNull(), // month, week
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  achieved: boolean("achieved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // streak, eco_warrior, reduction_master
  title: varchar("title").notNull(),
  description: varchar("description"),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  goals: many(goals),
  achievements: many(achievements),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  transportEmissions: true,
  energyEmissions: true,
  foodEmissions: true,
  totalEmissions: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
