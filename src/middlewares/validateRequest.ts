/**
 * Request validation middleware
 */
import type {NextFunction, Request, Response} from "express";

import {validateTextLength} from "../utils/sanitizeText.js";

interface ValidationRule {
  field: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

/**
 * Validates request body fields
 */
export function validateRequest(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check required
      if (
        rule.required &&
        (!value || typeof value !== "string" || value.trim().length === 0)
      ) {
        errors.push(`Field '${rule.field}' is required`);
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!rule.required && (!value || typeof value !== "string")) {
        continue;
      }

      // Check length
      if (value && typeof value === "string") {
        const minLength = rule.minLength || 10;
        const maxLength = rule.maxLength || 50000;

        if (!validateTextLength(value, minLength, maxLength)) {
          errors.push(
            `Field '${rule.field}' must be between ${minLength} and ${maxLength} characters`
          );
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        message: "Validation failed",
        statusCode: 400,
        errors,
      });
      return;
    }

    next();
  };
}
