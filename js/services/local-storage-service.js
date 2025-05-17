// js/services/local-storage-service.js
import { LOCAL_STORAGE_PROJECTS_KEY, LOCAL_STORAGE_THEME_KEY, PEXELS_API_KEY_STORAGE_KEY, LOCAL_STORAGE_LAST_PEXELS_QUERY_KEY } from '../config/constants.js';
// import { handleError } from '../core/error-handler.js'; // Future integration

/**
 * Saves all projects to localStorage.
 * @param {Array<object>} projects - The array of project objects to save.
 */
export function saveProjectsToStorage(projects) {
    try {
        localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
        console.log("[Storage Service] Projects saved to localStorage:", projects.length);
    } catch (error) {
        console.error("[Storage Service] Error saving projects to localStorage:", error);
        // handleError(error, "Saving Projects", true);
        alert("حدث خطأ أثناء حفظ المشاريع. قد لا يتم حفظ التغييرات الأخيرة.");
    }
}

/**
 * Loads all projects from localStorage.
 * @returns {Array<object>} An array of project objects, or an empty array if none found or error.
 */
export function loadProjectsFromStorage() {
    try {
        const projectsJson = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
        if (projectsJson) {
            const projects = JSON.parse(projectsJson);
            console.log("[Storage Service] Projects loaded from localStorage:", projects.length);
            return projects;
        }
        return []; // No projects found
    } catch (error) {
        console.error("[Storage Service] Error loading projects from localStorage:", error);
        // handleError(error, "Loading Projects", true);
        alert("حدث خطأ أثناء تحميل المشاريع المحفوظة.");
        return []; // Return empty array on error
    }
}

/**
 * Saves the current theme preference to localStorage.
 * @param {string} themeName - The name of the theme (e.g., 'light-theme', 'dark-theme').
 */
export function saveThemePreference(themeName) {
    try {
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, themeName);
        console.log("[Storage Service] Theme preference saved:", themeName);
    } catch (error) {
        console.error("[Storage Service] Error saving theme preference:", error);
        // handleError(error, "Saving Theme Preference", false); // Not critical to show user
    }
}

/**
 * Loads the theme preference from localStorage.
 * @returns {string|null} The theme name or null if not set.
 */
export function loadThemePreference() {
    try {
        return localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    } catch (error) {
        console.error("[Storage Service] Error loading theme preference:", error);
        // handleError(error, "Loading Theme Preference", false);
        return null;
    }
}

/**
 * Saves the Pexels API key to localStorage.
 * @param {string} apiKey - The Pexels API key.
 */
export function savePexelsApiKey(apiKey) {
    try {
        localStorage.setItem(PEXELS_API_KEY_STORAGE_KEY, apiKey);
        console.log("[Storage Service] Pexels API Key saved.");
    } catch (error) {
        console.error("[Storage Service] Error saving Pexels API Key:", error);
    }
}

/**
 * Loads the Pexels API key from localStorage.
 * @returns {string|null} The Pexels API key or null.
 */
export function loadPexelsApiKey() {
     try {
        return localStorage.getItem(PEXELS_API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("[Storage Service] Error loading Pexels API Key:", error);
        return null;
    }
}

/**
 * Saves the last used Pexels query.
 * @param {string} query - The Pexels query string.
 */
export function saveLastPexelsQuery(query) {
    try {
        localStorage.setItem(LOCAL_STORAGE_LAST_PEXELS_QUERY_KEY, query);
    } catch (error) {
        console.warn("[Storage Service] Error saving last Pexels query:", error);
    }
}

/**
 * Loads the last used Pexels query.
 * @returns {string|null} The last query or null.
 */
export function loadLastPexelsQuery() {
    try {
        return localStorage.getItem(LOCAL_STORAGE_LAST_PEXELS_QUERY_KEY);
    } catch (error) {
        console.warn("[Storage Service] Error loading last Pexels query:", error);
        return null;
    }
}
