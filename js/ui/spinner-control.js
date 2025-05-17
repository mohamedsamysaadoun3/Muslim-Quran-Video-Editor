```javascript
// js/ui/spinner-control.js
import { DOMElements } from '../core/dom-loader.js';

let spinnerTimeout = null;

/**
 * Initializes the spinner. Ensures it's hidden by default.
 */
export function initSpinner() {
    if (DOMElements.loadingSpinner) {
        DOMElements.loadingSpinner.style.display = 'none';
        console.log("[Spinner Control] Initialized.");
    } else {
        console.warn("[Spinner Control] Loading spinner element not found.");
    }
}

/**
 * Shows the loading spinner.
 * @param {number|null} [autoHideDelay=null] - Optional delay in ms to auto-hide the spinner.
 *                                            If null, spinner stays until hideSpinner() is called.
 */
export function showSpinner(autoHideDelay = null) {
    if (DOMElements.loadingSpinner) {
        DOMElements.loadingSpinner.style.display = 'flex';
        // console.log("[Spinner Control] Spinner shown.");

        if (spinnerTimeout) {
            clearTimeout(spinnerTimeout); // Clear any existing auto-hide timeout
        }

        if (typeof autoHideDelay === 'number' && autoHideDelay > 0) {
            spinnerTimeout = setTimeout(() => {
                hideSpinner();
                spinnerTimeout = null;
            }, autoHideDelay);
        }
    }
}

/**
 * Hides the loading spinner.
 */
export function hideSpinner() {
    if (DOMElements.loadingSpinner) {
        DOMElements.loadingSpinner.style.display = 'none';
        // console.log("[Spinner Control] Spinner hidden.");
        if (spinnerTimeout) {
            clearTimeout(spinnerTimeout);
            spinnerTimeout = null;
        }
    }
}
```
