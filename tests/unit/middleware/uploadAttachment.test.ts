import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { handleMulterError } from "../../../src/middleware/uploadAttachment";
import { ValidationError } from "../../../src/utils/errors/ClientErrors";

describe("uploadAttachment middleware", () => {
  const next = jest.fn() as jest.MockedFunction<NextFunction>;
  const req = {} as Request;
  const res = {} as Response;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handleMulterError: LIMIT_FILE_SIZE → ValidationError", () => {
    const multerErr = new multer.MulterError("LIMIT_FILE_SIZE");
    handleMulterError(multerErr, req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    const validationErr = next.mock.calls[0]?.[0] as unknown as ValidationError;
    expect(validationErr.message).toContain("bytes");
  });

  it("handleMulterError: інший MulterError → ValidationError з message", () => {
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
    handleMulterError(err, req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it("handleMulterError: прокидає інші помилки", () => {
    const err = new Error("unknown");
    handleMulterError(err, req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("експортує uploadAttachmentMiddleware", async () => {
    const { uploadAttachmentMiddleware } = await import("../../../src/middleware/uploadAttachment");
    expect(typeof uploadAttachmentMiddleware).toBe("function");
  });
});
