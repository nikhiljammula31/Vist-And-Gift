/**
 * Translates Firebase Authentication error codes into user-friendly messages.
 * Prevents leaking technical stack traces or ambiguous errors to customers.
 */
export const getFriendlyErrorMessage = (error) => {
  if (!error) return '';

  const errorCode = typeof error === 'string' ? error : error.code;

  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account was found with this email address. Please check your email or sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or use "Forgot Password".';
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials, or click Sign Up if you do not have an account yet.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email address using a different sign-in method. Please sign in with your original provider (such as Email & Password or Google).';
    case 'auth/credential-already-in-use':
      return 'This credential is already linked to another user account.';
    case 'permission-denied':
      return 'Unable to create or access your profile. Please check your internet connection and try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please ensure it has at least 8 characters with uppercase, lowercase, numbers, and symbols.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to multiple failed login attempts. Please wait a few moments and try again.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before completion. Please try again.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for Visit & Gift and try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This customer account has been suspended or disabled. Please contact customer support.';
    case 'auth/requires-recent-login':
      return 'For security, please log in again to continue this operation.';
    default:
      if (typeof error?.message === 'string' && error.message.toLowerCase().includes('permission')) {
        return 'Unable to create or access your profile. Please try again.';
      }
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

