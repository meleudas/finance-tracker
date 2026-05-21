import {
  advanceNextRunAt,
  isRuleExhausted,
  RECURRING_RULE_EXHAUSTED_NEXT_RUN,
} from "../../../src/utils/helpers/recurringSchedule";

describe("recurringSchedule", () => {
  describe("advanceNextRunAt", () => {
    it("додає N днів", () => {
      const from = new Date("2026-05-01T12:00:00.000Z");
      const next = advanceNextRunAt(from, 3, "DAY");
      expect(next.toISOString()).toBe("2026-05-04T12:00:00.000Z");
    });

    it("додає N тижнів", () => {
      const from = new Date("2026-05-01T12:00:00.000Z");
      const next = advanceNextRunAt(from, 2, "WEEK");
      expect(next.toISOString()).toBe("2026-05-15T12:00:00.000Z");
    });

    it("додає місяць з 31 січня на останній день лютого", () => {
      const from = new Date("2026-01-31T12:00:00.000Z");
      const next = advanceNextRunAt(from, 1, "MONTH");
      expect(next.getUTCMonth()).toBe(1);
      expect(next.getUTCDate()).toBe(28);
    });

    it("додає рік", () => {
      const from = new Date("2025-02-28T00:00:00.000Z");
      const next = advanceNextRunAt(from, 1, "YEAR");
      expect(next.getUTCFullYear()).toBe(2026);
    });
  });

  describe("isRuleExhausted", () => {
    it("true при досягненні maxOccurrences", () => {
      expect(
        isRuleExhausted(
          {
            occurrenceCount: 5,
            maxOccurrences: 5,
            endsAt: null,
            nextRunAt: new Date(),
          },
          new Date("2026-06-01T00:00:00.000Z"),
        ),
      ).toBe(true);
    });

    it("true коли наступний run після endsAt", () => {
      expect(
        isRuleExhausted(
          {
            occurrenceCount: 1,
            maxOccurrences: null,
            endsAt: new Date("2026-05-31T00:00:00.000Z"),
            nextRunAt: new Date("2026-05-01T00:00:00.000Z"),
          },
          new Date("2026-06-01T00:00:00.000Z"),
        ),
      ).toBe(true);
    });

    it("false коли ще є виконання", () => {
      expect(
        isRuleExhausted(
          {
            occurrenceCount: 1,
            maxOccurrences: 10,
            endsAt: new Date("2026-12-31T00:00:00.000Z"),
            nextRunAt: new Date("2026-05-01T00:00:00.000Z"),
          },
          new Date("2026-06-01T00:00:00.000Z"),
        ),
      ).toBe(false);
    });
  });

  it("EXHAUSTED_NEXT_RUN у далекому майбутньому", () => {
    expect(RECURRING_RULE_EXHAUSTED_NEXT_RUN.getUTCFullYear()).toBe(2099);
  });
});
