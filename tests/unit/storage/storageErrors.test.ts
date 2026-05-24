import { ValidationError } from "../../../src/utils/errors/ClientErrors";
import { ServiceUnavailableError } from "../../../src/utils/errors/serverErrors";
import { rethrowStorageError } from "../../../src/storage/storageErrors";

describe("rethrowStorageError", () => {
  it("rethrows AppError unchanged", () => {
    const err = new ValidationError("bad");
    expect(() => rethrowStorageError(err)).toThrow(err);
  });

  it("wraps generic errors as ServiceUnavailableError", () => {
    expect(() => rethrowStorageError(new Error("network"))).toThrow(ServiceUnavailableError);
    expect(() => rethrowStorageError(new Error("network"))).toThrow(
      "Object storage is unavailable",
    );
  });

  it("wraps non-Error values", () => {
    expect(() => rethrowStorageError("fail")).toThrow(ServiceUnavailableError);
  });
});
