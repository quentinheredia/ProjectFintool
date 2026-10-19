import type { ComparatorInput, ComparisonResult } from "@/lib/comparator-engine";
import { db } from ".";
import { anonymousQueries } from "./schema";

type NewAnonymousQuery = typeof anonymousQueries.$inferInsert;

export function toAnonymousQueryRow(input: ComparatorInput, meta: ComparisonResult["meta"]): NewAnonymousQuery {
  return {
    birthYear: input.birthYear,
    benchmarkAge: meta.benchmarkAge,
    userIncome: meta.income.toFixed(2),
  };
}

/** Best-effort analytics: a no-op without DATABASE_URL, and a failed insert never reaches the user. */
export async function logAnonymousQuery(row: NewAnonymousQuery): Promise<void> {
  if (!db) return;
  try {
    await db.insert(anonymousQueries).values(row);
  } catch (error) {
    console.warn("anonymous_queries insert failed", error);
  }
}
