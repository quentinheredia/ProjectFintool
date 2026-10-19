CREATE TABLE "anonymous_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"birth_year" integer NOT NULL,
	"benchmark_age" integer DEFAULT 30 NOT NULL,
	"user_income" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yearly_metrics" (
	"year" integer PRIMARY KEY NOT NULL,
	"median_income" numeric(12, 2) NOT NULL,
	"median_home_price" numeric(12, 2) NOT NULL,
	"average_new_car" numeric(12, 2) NOT NULL,
	"avg_used_car_price" numeric(10, 2) NOT NULL,
	"average_tuition" numeric(12, 2) NOT NULL,
	"cpi_index" numeric(8, 3) NOT NULL,
	"federal_min_wage" numeric(5, 2) NOT NULL,
	"avg_hourly_wage" numeric(6, 2) NOT NULL,
	"milk_gallon_price" numeric(5, 2) NOT NULL,
	"eggs_dozen_price" numeric(5, 2) NOT NULL,
	"ground_beef_lb_price" numeric(5, 2) NOT NULL,
	"median_land_acre_price" numeric(10, 2) NOT NULL,
	"avg_retirement_age" numeric(4, 1) NOT NULL,
	"mortgage_rate_30yr" numeric(5, 2),
	"is_estimate" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
