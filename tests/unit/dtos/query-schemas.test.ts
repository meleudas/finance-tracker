import {
  optionalCoercedDateSchema,
  optionalQueryBooleanSchema,
  queryBooleanSchema,
  requiredCoercedDateSchema,
  requiredDateInputSchema,
} from "../../../src/dtos/common/query-schemas";

describe("query-schemas", () => {
  it("queryBooleanSchema defaults and parses strings", () => {
    expect(queryBooleanSchema().parse(undefined)).toBe(false);
    expect(queryBooleanSchema(true).parse("true")).toBe(true);
    expect(queryBooleanSchema().parse("false")).toBe(false);
  });

  it("optionalQueryBooleanSchema returns undefined", () => {
    expect(optionalQueryBooleanSchema().parse(undefined)).toBeUndefined();
    expect(optionalQueryBooleanSchema().parse("true")).toBe(true);
  });

  it("requiredCoercedDateSchema validates dates", () => {
    expect(requiredCoercedDateSchema("from").parse("2026-05-01")).toBeInstanceOf(Date);
    expect(requiredCoercedDateSchema("from").safeParse("not-a-date").success).toBe(false);
  });

  it("requiredDateInputSchema accepts Date instance", () => {
    const d = new Date("2026-05-01T00:00:00.000Z");
    expect(requiredDateInputSchema("at").parse(d)).toEqual(d);
  });

  it("optionalCoercedDateSchema handles empty and invalid", () => {
    expect(optionalCoercedDateSchema.parse("")).toBeUndefined();
    expect(optionalCoercedDateSchema.safeParse("bad-date").success).toBe(false);
  });
});
