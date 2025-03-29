export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, any>
}

export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: "auth/invalid-credentials",
  AUTH_EMAIL_ALREADY_EXISTS: "auth/email-already-exists",
  AUTH_WEAK_PASSWORD: "auth/weak-password",
  AUTH_USER_NOT_FOUND: "auth/user-not-found",
  AUTH_TOO_MANY_REQUESTS: "auth/too-many-requests",

  // Database errors
  DB_CONNECTION_ERROR: "db/connection-error",
  DB_QUERY_ERROR: "db/query-error",
  DB_RECORD_NOT_FOUND: "db/record-not-found",
  DB_DUPLICATE_ENTRY: "db/duplicate-entry",
  DB_CONSTRAINT_VIOLATION: "db/constraint-violation",

  // File storage errors
  STORAGE_UPLOAD_FAILED: "storage/upload-failed",
  STORAGE_FILE_NOT_FOUND: "storage/file-not-found",
  STORAGE_INSUFFICIENT_PERMISSIONS: "storage/insufficient-permissions",
  STORAGE_QUOTA_EXCEEDED: "storage/quota-exceeded",

  // AI service errors
  AI_SERVICE_UNAVAILABLE: "ai/service-unavailable",
  AI_RATE_LIMIT_EXCEEDED: "ai/rate-limit-exceeded",
  AI_INVALID_REQUEST: "ai/invalid-request",
  AI_CONTENT_FILTERED: "ai/content-filtered",

  // Permission errors
  PERMISSION_DENIED: "permission/denied",
  PERMISSION_ROLE_REQUIRED: "permission/role-required",

  // General errors
  UNKNOWN_ERROR: "general/unknown-error",
  NETWORK_ERROR: "general/network-error",
  VALIDATION_ERROR: "general/validation-error",
  RATE_LIMIT_EXCEEDED: "general/rate-limit-exceeded",
}

export const getErrorMessage = (code: string, defaultMessage = "An unknown error occurred"): string => {
  const errorMessages: Record<string, string> = {
    // Authentication errors
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "Invalid email or password. Please try again.",
    [ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS]: "An account with this email already exists.",
    [ERROR_CODES.AUTH_WEAK_PASSWORD]: "Password is too weak. Please use a stronger password.",
    [ERROR_CODES.AUTH_USER_NOT_FOUND]: "User not found. Please check your credentials.",
    [ERROR_CODES.AUTH_TOO_MANY_REQUESTS]: "Too many sign-in attempts. Please try again later.",

    // Database errors
    [ERROR_CODES.DB_CONNECTION_ERROR]: "Unable to connect to the database. Please try again later.",
    [ERROR_CODES.DB_QUERY_ERROR]: "Database query failed. Please try again later.",
    [ERROR_CODES.DB_RECORD_NOT_FOUND]: "The requested record was not found.",
    [ERROR_CODES.DB_DUPLICATE_ENTRY]: "A record with this information already exists.",
    [ERROR_CODES.DB_CONSTRAINT_VIOLATION]: "This operation violates database constraints.",

    // File storage errors
    [ERROR_CODES.STORAGE_UPLOAD_FAILED]: "File upload failed. Please try again.",
    [ERROR_CODES.STORAGE_FILE_NOT_FOUND]: "The requested file was not found.",
    [ERROR_CODES.STORAGE_INSUFFICIENT_PERMISSIONS]: "You don't have permission to access this file.",
    [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: "Storage quota exceeded. Please free up space and try again.",

    // AI service errors
    [ERROR_CODES.AI_SERVICE_UNAVAILABLE]: "AI service is currently unavailable. Please try again later.",
    [ERROR_CODES.AI_RATE_LIMIT_EXCEEDED]: "AI service rate limit exceeded. Please try again later.",
    [ERROR_CODES.AI_INVALID_REQUEST]: "Invalid request to AI service. Please try again.",
    [ERROR_CODES.AI_CONTENT_FILTERED]: "Content was filtered by AI service due to policy violations.",

    // Permission errors
    [ERROR_CODES.PERMISSION_DENIED]: "You don't have permission to perform this action.",
    [ERROR_CODES.PERMISSION_ROLE_REQUIRED]: "This action requires a specific role.",

    // General errors
    [ERROR_CODES.UNKNOWN_ERROR]: "An unknown error occurred. Please try again later.",
    [ERROR_CODES.NETWORK_ERROR]: "Network error. Please check your connection and try again.",
    [ERROR_CODES.VALIDATION_ERROR]: "Validation error. Please check your input and try again.",
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded. Please try again later.",
  }

  return errorMessages[code] || defaultMessage
}

