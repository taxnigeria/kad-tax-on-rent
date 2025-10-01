/**
 * Maps Firebase error codes to user-friendly error messages
 */
export function getFirebaseErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    // Extract error code from Firebase error string format: "Firebase: Error (auth/error-code)."
    const match = error.match(/auth\/([^)]+)/)
    if (match) {
      const errorCode = match[1]
      return mapErrorCode(errorCode)
    }
    return error
  }

  if (error && typeof error === "object" && "code" in error) {
    const errorCode = (error as { code: string }).code
    // Remove 'auth/' prefix if present
    const code = errorCode.replace("auth/", "")
    return mapErrorCode(code)
  }

  return "An unexpected error occurred. Please try again."
}

function mapErrorCode(code: string): string {
  const errorMessages: Record<string, string> = {
    // Authentication errors
    "email-already-in-use": "This email is already registered. Please login or use a different email.",
    "invalid-email": "Please enter a valid email address.",
    "operation-not-allowed": "This operation is not allowed. Please contact support.",
    "weak-password": "Your password is too weak. Please use at least 6 characters.",
    "user-disabled": "This account has been disabled. Please contact support.",
    "user-not-found": "No account found with this email. Please check your email or sign up.",
    "wrong-password": "Incorrect password. Please try again or reset your password.",
    "invalid-credential": "Invalid email or password. Please check your credentials and try again.",
    "too-many-requests": "Too many failed attempts. Please try again later or reset your password.",
    "network-request-failed": "Network error. Please check your internet connection and try again.",
    "popup-closed-by-user": "Sign-in was cancelled. Please try again.",
    "cancelled-popup-request": "Sign-in was cancelled. Please try again.",
    "popup-blocked": "Pop-up was blocked by your browser. Please allow pop-ups and try again.",
    "invalid-api-key": "Configuration error. Please contact support.",
    "app-deleted": "Configuration error. Please contact support.",
    "invalid-user-token": "Your session has expired. Please login again.",
    "requires-recent-login": "For security, please login again to continue.",
    "account-exists-with-different-credential":
      "An account already exists with this email using a different sign-in method.",
    "credential-already-in-use": "This credential is already associated with a different account.",
    "email-already-exists": "This email is already registered. Please login or use a different email.",
    "phone-number-already-exists": "This phone number is already registered.",
    "invalid-phone-number": "Please enter a valid phone number.",
    "missing-phone-number": "Please enter a phone number.",
    "quota-exceeded": "Service quota exceeded. Please try again later.",
    "unauthorized-domain": "This domain is not authorized. Please contact support.",
    "invalid-action-code": "This link is invalid or has expired. Please request a new one.",
    "expired-action-code": "This link has expired. Please request a new one.",
  }

  return errorMessages[code] || "An error occurred. Please try again or contact support if the problem persists."
}
