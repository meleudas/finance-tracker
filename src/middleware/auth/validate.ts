import { AnyZodObject, ZodError } from "zod/v3";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/errors/appError";

type ValidationSource = "body" | "query" | "params";

export const validate = (
  schema: AnyZodObject,
  source: ValidationSource = 'body')=> {
  return (req: Request, res: Response, next: NextFunction) => {
    try{
      req[source] = schema.parse(req[source]);

      next()
    } catch(error){
      if(error instanceof ZodError){
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        next(
          new AppError(
            "VALIDATION_FAILED",
            "Validation failed",
            400,
            errors,
          ),
        );
      } else{
        next(error)
      }
    }}
}

export const validateBody = (schema: AnyZodObject) =>
  validate(schema, 'body');

export const validateQuery = (schema: AnyZodObject) =>
  validate(schema, 'query');

export const validateParams = (schema: AnyZodObject) =>
  validate(schema, 'params');
