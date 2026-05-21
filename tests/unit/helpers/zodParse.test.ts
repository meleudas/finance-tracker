import { z } from "zod";
import { parseOrThrow } from "../../../src/utils/helpers/zodParse";
import { ValidationError } from "../../../src/utils/errors/ClientErrors";
import { AppError } from "../../../src/utils/errors/appError";

describe("parseOrThrow", () => {
  const schema = z.object({ id: z.string().min(1) });

  it("повертає розпарсені дані при валідному input", () => {
    expect(parseOrThrow(schema, { id: "abc" })).toEqual({ id: "abc" });
  });

  it("кидає ValidationError (AppError) при невалідному input", () => {
    expect(() => parseOrThrow(schema, { id: "" })).toThrow(ValidationError);
    try {
      parseOrThrow(schema, { id: "" });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as ValidationError).statusCode).toBe(400);
      expect((err as ValidationError).code).toBe("VALIDATION_ERROR");
      expect((err as ValidationError).details).toBeDefined();
    }
  });
});
