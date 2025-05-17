// js/ui/theme-handler.js
import { DOMElements } from '../core/dom-loader.js';
import { saveThemePreference, loadThemePreference } from '../services/local-storage-service.js';

const LIGHT_THEME_CLASS = 'light-theme';
const DARK_THEME_CLASS = 'dark-theme';

/**
 * Initializes the theme by loading the preference from localStorage or defaulting to light.
 */
export function initTheme() {
    const savedTheme = loadThemePreference();
    if (savedTheme === DARK_THEME_CLASS) {
        document.body.classList.add(DARK_THEME_CLASS);
        document.body.classList.remove(LIGHT_THEME_CLASS);
    } else {
        // Default to light theme if no preference or if it's light
        document.body.classList.add(LIGHT_THEME_CLASS);
        document.body.classList.remove(DARK_THEME_CLASS);
    }
    updateThemeButtonText();
    console.log("[Theme Handler] Theme initialized to:", document.body.classList.contains(DARK_THEME_CLASS) ? "Dark" : "Light");
}

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle(DARK_THEME_CLASS);
    document.body.classList.toggle(LIGHT_THEME_CLASS, !isDark);

    const newTheme = isDark ? DARK_THEME_CLASS : LIGHT_THEME_CLASS;
    saveThemePreference(newTheme);
    updateThemeButtonText();
    console.log("[Theme Handler] Theme toggled to:", newTheme);
}

/**
 * Updates the text/icon of the theme toggle buttons.
 */
function updateThemeButtonText() {
    const isDark = document.body.classList.contains(DARK_THEME_CLASS);
    const icon = isDark ? '☀️' : '🌓'; // Sun for dark mode (to switch to light), Moon for light mode

    if (DOMElements.themeToggleInitial) {
        DOMElements.themeToggleInitial.textContent = icon;
        DOMElements.themeToggleInitial.title = isDark ? "التبديل إلى الثيم الفاتح" : "التبديل إلى الثيم الداكن";
    }
    if (DOMElements.themeToggleEditor) {
        DOMElements.themeToggleEditor.textContent = icon;
        DOMElements.themeToggleEditor.title = isDark ? "التبديل إلى الثيم الفاتح" : "التبديل إلى الثيم الداكن";
    }
}

/**
 * Sets up event listeners for the theme toggle buttons.
 */
export function setupThemeEventListeners() {
    if (DOMElements.themeToggleInitial) {
        DOMElements.themeToggleInitial.addEventListener('click', toggleTheme);
    }
    if (DOMElements.themeToggleEditor) {
        DOMElements.themeToggleEditor.addEventListener('click', toggleTheme);
    }
}
