/**
 * Handles an error, logs it, and potentially shows a user-friendly message.
 * @param {Error} error - The error object.
 * @param {string} context - A string describing the context where the error occurred.
 * @param {boolean} [showToUser=false] - Whether to attempt to show a notification to the user.
 */
export function handleError(error, context = "Unknown context", showToUser = false) {
    console.error(`[Error Handler] Error in ${context}:`, error.message, error.stack || error);

    if (showToUser) {
        // Future: Integrate with a notifications module
        // import { showErrorNotification } from '../ui/notifications.js';
        // showErrorNotification(`An error occurred in ${context}: ${error.message}. Please try again or contact support.`);
        alert(`حدث خطأ في "${context}": ${error.message}`); // Simple alert for now
    }

    // Future: Could also send error reports to a logging service for production apps
    // reportErrorToService(error, context, getCurrentUser(), getAppState());
}

/**
 * Wraps an async function to automatically handle its errors.
 * @param {Function} asyncFn - The async function to wrap.
 * @param {string} [context="Wrapped async function"] - Context for error reporting.
 * @param {boolean} [showToUser=false] - Whether to show errors from this function to the user.
 * @returns {Function} The wrapped async function.
 */
export function withErrorHandlingAsync(asyncFn, context = "Wrapped async function", showToUser = false) {
    return async function(...args) {
        try {
            return await asyncFn(...args);
        } catch (error) {
            handleError(error, context, showToUser);
            // Depending on desired behavior, re-throw or return a specific error indicator
            // throw error; // Re-throw if the caller needs to know about the error
            return { error: true, message: error.message, context }; // Or return an error object
        }
    };
}

/**
 * Wraps a synchronous function to automatically handle its errors.
 * @param {Function} fn - The synchronous function to wrap.
 * @param {string} [context="Wrapped function"] - Context for error reporting.
 * @param {boolean} [showToUser=false] - Whether to show errors from this function to the user.
 * @returns {Function} The wrapped function.
 */
export function withErrorHandlingSync(fn, context = "Wrapped function", showToUser = false) {
    return function(...args) {
        try {
            return fn(...args);
        } catch (error) {
            handleError(error, context, showToUser);
            return { error: true, message: error.message, context };
        }
    };
}


console.log("[Error Handler] Module loaded.");
```
