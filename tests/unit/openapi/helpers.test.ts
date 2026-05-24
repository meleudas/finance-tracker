import {
  appendCsrfParameters,
  authMutationSecurity,
  csrfHeaderParameter,
  mutationErrorResponses,
  protectedMutationSecurity,
  protectedSecurity,
} from "../../../src/openapi/helpers";
import { CSRF_HEADER_NAME } from "../../../src/middleware/csrfProtection";

describe("openapi helpers", () => {
  it("експортує security schemes", () => {
    expect(protectedSecurity).toEqual([{ cookieAuth: [] }, { devUserId: [] }]);
    expect(protectedMutationSecurity).toHaveLength(3);
    expect(authMutationSecurity).toEqual([{ csrfHeader: [] }]);
    expect(csrfHeaderParameter.name).toBe(CSRF_HEADER_NAME);
  });

  it("appendCsrfParameters додає csrf header якщо його ще немає", () => {
    const result = appendCsrfParameters([]);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe(CSRF_HEADER_NAME);
  });

  it("appendCsrfParameters не дублює csrf header", () => {
    const result = appendCsrfParameters([csrfHeaderParameter]);
    expect(result).toHaveLength(1);
  });

  it("mutationErrorResponses містить 403", () => {
    expect(mutationErrorResponses[403]).toBeDefined();
    expect(mutationErrorResponses[400]).toBeDefined();
  });
});
