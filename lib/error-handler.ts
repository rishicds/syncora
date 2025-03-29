import { ERROR_CODES, getErrorMessage } from "@/types/error.types"

interface ErrorWithCode extends Error {
  code?: string
  statusCode?: number
  status?: number
}

export function handleError(error: unknown): { code: string; message: string; details?: Record<string, any> } {
  console.error("Error caught:", error)

  // Default error response
  let errorResponse = {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: getErrorMessage(ERROR_CODES.UNKNOWN_ERROR),
    details: {},
  }

  if (error instanceof Error) {
    const typedError = error as ErrorWithCode

    // Handle Supabase errors
    if (typedError.code?.startsWith("PGRST")) {
      errorResponse = {
        code: ERROR_CODES.DB_QUERY_ERROR,
        message: getErrorMessage(ERROR_CODES.DB_QUERY_ERROR),
        details: { originalError: typedError.message, code: typedError.code },
      }
    }
    // Handle authentication errors
    else if (typedError.code?.startsWith("auth/")) {
      errorResponse = {
        code: typedError.code,
        message: getErrorMessage(typedError.code, typedError.message),
        details: { originalError: typedError.message },
      }
    }
    // Handle storage errors
    else if (typedError.code?.startsWith("storage/")) {
      errorResponse = {
        code: typedError.code,
        message: getErrorMessage(typedError.code, typedError.message),
        details: { originalError: typedError.message },
      }
    }
    // Handle HTTP status code errors
    else if (typedError.statusCode || typedError.status) {
      const status = typedError.statusCode || typedError.status

      if (status === 401 || status === 403) {
        errorResponse = {
          code: ERROR_CODES.PERMISSION_DENIED,
          message: getErrorMessage(ERROR_CODES.PERMISSION_DENIED),
          details: { originalError: typedError.message, status },
        }
      } else if (status === 404) {
        errorResponse = {
          code: ERROR_CODES.DB_RECORD_NOT_FOUND,
          message: getErrorMessage(ERROR_CODES.DB_RECORD_NOT_FOUND),
          details: { originalError: typedError.message, status },
        }
      } else if (status === 429) {
        errorResponse = {
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: getErrorMessage(ERROR_CODES.RATE_LIMIT_EXCEEDED),
          details: { originalError: typedError.message, status },
        }
      } else {
        errorResponse = {
          code: ERROR_CODES.UNKNOWN_ERROR,
          message: typedError.message || getErrorMessage(ERROR_CODES.UNKNOWN_ERROR),
          details: { originalError: typedError.message, status },
        }
      }
    }
    // Handle other known errors
    else {
      errorResponse = {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: typedError.message,
        details: { originalError: typedError.message },
      }
    }
  } else if (typeof error === "string") {
    errorResponse = {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error,
      details: { originalError: error },
    }
  }

  return errorResponse
}

