// export * from "./auth.validator";
// export * from "./user.validator";
// export * from "./post.validator";

export interface IValidationIssue {
  path?: (string | number)[];
  message?: string;
}

export interface IValidationErrorLike {
  issues?: IValidationIssue[];
  message?: string;
}

export function format_zod_error(error: unknown): Record<string, string[]> | string {
  if (!error || typeof error !== "object") {
    return "Invalid input";
  }

  const err = error as IValidationErrorLike;
  if (Array.isArray(err.issues) && err.issues.length > 0) {
    const formatted: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path?.join(".") || "root";
      if (!formatted[key]) {
        formatted[key] = [];
      }
      if (issue.message) {
        formatted[key].push(issue.message);
      }
    }
    return formatted;
  }

  return err.message || "Validation failed";
}
