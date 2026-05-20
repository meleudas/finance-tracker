import { Request } from "express";

export const getHeader = (req: Request, name: string): string | undefined => {
  const value = req.headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};
