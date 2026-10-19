import { describe, expect, it } from "vitest";
import { CURRENT_YEAR, type ComparatorInput } from "../comparator-engine";
import {
  draftFromInput,
  inputFromDraft,
  parentBirthYearOptions,
  withBirthYear,
  withIncomeText,
} from "../sandbox-draft";

const working: ComparatorInput = { birthYear: 1996, income: 65_000, comparisonMode: "parent_peer" };

describe("sandbox draft", () => {
  it("round-trips an input through the draft", () => {
    const student: ComparatorInput = {
      birthYear: 2005,
      parentBirthYear: 1972,
      employment: "student",
      income: 58_000,
      workStartYear: CURRENT_YEAR + 2,
      comparisonMode: "custom",
      customBenchmarkYear: 1990,
    };
    expect(inputFromDraft(draftFromInput(student, 64_500))).toEqual(student);
    expect(inputFromDraft(draftFromInput(working, 64_500))).toEqual(working);
  });

  it("starts a not-working input with the fallback income in the field", () => {
    const draft = draftFromInput({ birthYear: 1996, employment: "not_working", comparisonMode: "parent_peer" }, 64_500);
    expect(draft.incomeText).toBe("64500");
    expect(inputFromDraft(draft)).not.toHaveProperty("income");
  });

  it("offers parent years 15 to 60 years before the birth year", () => {
    const options = parentBirthYearOptions(1996);
    expect([options[0], options.at(-1), options.length]).toEqual([1981, 1936, 46]);
  });

  it("drops a parent year the new birth year rules out", () => {
    const draft = { ...draftFromInput(working, 64_500), parentBirthYear: 1981 };
    expect(withBirthYear(draft, 1997).parentBirthYear).toBe(1981);
    expect(withBirthYear(draft, 1995).parentBirthYear).toBeNull();
  });

  it("keeps the last in-range income while the text is out of range", () => {
    const draft = draftFromInput(working, 64_500);
    const midEdit = withIncomeText(draft, "5");
    expect([midEdit.incomeText, midEdit.income]).toEqual(["5", 65_000]);
    expect(withIncomeText(midEdit, "$52,000").income).toBe(52_000);
  });
});
