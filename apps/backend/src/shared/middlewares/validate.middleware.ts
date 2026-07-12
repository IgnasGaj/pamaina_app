import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

interface ValidationSchemas {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

/**
 * Validates and coerces req.body/query/params against Zod schemas, replacing
 * the original values with the parsed (and thus typed + coerced) output.
 * Throws ZodError on failure, caught by errorHandlerMiddleware.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query) as unknown as Request["query"];
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as unknown as Request["params"];
    }
    next();
  };
}
