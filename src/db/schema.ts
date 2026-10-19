import { boolean, integer, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const yearlyMetrics = pgTable("yearly_metrics", {
  year: integer("year").primaryKey(),
  medianIncome: numeric("median_income", { precision: 12, scale: 2 }).notNull(),
  medianHomePrice: numeric("median_home_price", { precision: 12, scale: 2 }).notNull(),
  averageNewCar: numeric("average_new_car", { precision: 12, scale: 2 }).notNull(),
  avgUsedCarPrice: numeric("avg_used_car_price", { precision: 10, scale: 2 }).notNull(),
  averageTuition: numeric("average_tuition", { precision: 12, scale: 2 }).notNull(),
  cpiIndex: numeric("cpi_index", { precision: 8, scale: 3 }).notNull(),
  federalMinWage: numeric("federal_min_wage", { precision: 5, scale: 2 }).notNull(),
  avgHourlyWage: numeric("avg_hourly_wage", { precision: 6, scale: 2 }).notNull(),
  milkGallonPrice: numeric("milk_gallon_price", { precision: 5, scale: 2 }).notNull(),
  eggsDozenPrice: numeric("eggs_dozen_price", { precision: 5, scale: 2 }).notNull(),
  groundBeefLbPrice: numeric("ground_beef_lb_price", { precision: 5, scale: 2 }).notNull(),
  medianLandAcrePrice: numeric("median_land_acre_price", { precision: 10, scale: 2 }).notNull(),
  avgRetirementAge: numeric("avg_retirement_age", { precision: 4, scale: 1 }).notNull(),
  mortgageRate30Yr: numeric("mortgage_rate_30yr", { precision: 5, scale: 2 }),
  isEstimate: boolean("is_estimate").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const anonymousQueries = pgTable("anonymous_queries", {
  id: uuid("id").defaultRandom().primaryKey(),
  birthYear: integer("birth_year").notNull(),
  benchmarkAge: integer("benchmark_age").default(30).notNull(),
  userIncome: numeric("user_income", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type YearlyMetricsRow = typeof yearlyMetrics.$inferSelect;
export type NewYearlyMetricsRow = typeof yearlyMetrics.$inferInsert;
