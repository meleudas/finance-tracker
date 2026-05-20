export function validationError(message: string, code = "VALIDATION_FAILED"): Error {
  return Object.assign(new Error(message), { statusCode: 400, code });
}

export function notFoundError(code = "NOT_FOUND"): Error {
  return Object.assign(new Error(code), { statusCode: 404, code });
}

export function unauthorizedError(message = "Unauthorized", code = "UNAUTHORIZED"): Error {
  return Object.assign(new Error(message), { statusCode: 401, code });
}
