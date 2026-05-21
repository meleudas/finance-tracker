import { countRunsInPeriod } from "../../../src/utils/helpers/recurringSchedule";

describe("countRunsInPeriod", () => {
  it("рахує щомісячні запуски в періоді", () => {
    const runs = countRunsInPeriod({
      nextRunAt: new Date("2026-05-01T00:00:00.000Z"),
      every: 1,
      unit: "MONTH",
      periodStart: new Date("2026-05-01T00:00:00.000Z"),
      periodEnd: new Date("2026-07-31T00:00:00.000Z"),
      endsAt: null,
      maxOccurrences: null,
      occurrenceCount: 0,
    });

    expect(runs).toBe(3);
  });
});
