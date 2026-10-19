import { CURRENT_YEAR } from "./comparator-engine";

/** Input bounds shared by the server schema and the sandbox controls, kept free of zod for the client. */
export const BIRTH_YEAR_RANGE = { min: 1945, max: 2008 } as const;
export const INCOME_RANGE = { min: 1_000, max: 10_000_000 } as const;
/** How many years before the user a parent may be born. */
export const PARENT_AGE_GAP_RANGE = { min: 15, max: 60 } as const;
export const WORK_START_YEAR_RANGE = { min: CURRENT_YEAR, max: CURRENT_YEAR + 15 } as const;

export const yearsBetween = ({ min, max }: { min: number; max: number }) =>
  Array.from({ length: max - min + 1 }, (_, index) => min + index);
