// js/core/dom-loader.js

/**
 * DOMElements object to store references to DOM elements.
 * This object will be populated by initializeDOM().
 * Modules can import this object to access DOM elements.
 */
export const DOMElements = {};

// List of element IDs to cache
const elementIdsToCache = [
    // Screens
    'initial-screen', 'editor-screen',

    // Initial Screen specific
    'go-to-editor-btn', 'projects-list', 'no-projects-message',
    'theme-toggle-initial', 'current-year',

    // Editor Screen - Top Bar
    'back-to-initial-screen-btn', 'current-project-title-editor',
    'save-project-btn-editor', 'theme-toggle-editor',

    // Editor Screen - Main Area (Preview & Timeline)
    'editor-main-area-new', 'video-preview-container', 'video-preview-canvas',
    'preview-overlay-content', 'preview-surah-title-overlay', 'preview-ayah-text-overlay',
    'preview-translation-text-overlay', 'main-audio-player',
    'playback-timeline-section', 'timeline-container', 'current-time-display',
    'timeline-slider', 'total-time-display',

    // Editor Screen - Playback Controls
    'playback-controls', 'undo-btn', 'rewind-btn', 'play-pause-main-btn',
    'fast-forward-btn', 'redo-btn',

    // Editor Screen - Control Panels Container
    'active-control-panels-container',

    // Quran Selection Panel
    'quran-selection-panel', 'surah-select', 'ayah-start-select', 'ayah-end-select',
    'reciter-select', 'voice-search-quran-btn', 'voice-search-status', 'translation-select',

    // Background Settings Panel
    'background-settings-panel', 'import-background', 'apply-ai-bg',
    'ai-bg-suggestions-loader', 'ai-bg-suggestions', 'background-color-picker',

    // Audio Settings Panel
    'audio-settings-panel', 'extract-audio-btn', 'add-sound-btn',
    'audio-preview-status-text', 'delay-between-ayahs',

    // Effects & Text Settings Panel
    'effects-text-settings-panel', 'aspect-ratio-select', 'video-filter-select',
    'font-select', 'font-size-slider', 'font-size-value', 'font-color-picker',
    'ayah-bg-color-picker', 'text-effect-select',

    // Export Panel
    'export-settings-panel', 'resolution-select', 'video-format-select', 'framerate-select',
    // 'transition-select', // Removed from HTML for now, can be re-added
    'export-btn', 'export-note',
    'export-progress', 'export-progress-bar', 'export-progress-text',

    // App Container & Global
    'app-container', 'loading-spinner'
];

// Mappings for elements best selected by querySelectorAll (e.g., collections)
const elementCollectionsToCache = {
    mainTabButtons: '.main-tab-button',     // NodeList
    controlPanels: '.control-panel',        // NodeList
    panelCloseButtons: '.panel-action-button.close-panel-btn', // NodeList
    panelConfirmButtons: '.panel-action-button.confirm-panel-btn' // NodeList
};

/**
 * Initializes the DOMElements object by fetching and caching DOM elements.
 * This function should be called once when the application starts in app.js.
 */
export function initializeDOM() {
    console.log("[DOM Loader] Initializing DOM elements...");
    elementIdsToCache.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            DOMElements[id] = element;
        } else {
            // Log a warning but don't break the app, module using it should check
            console.warn(`[DOM Loader] Element with ID "${id}" not found.`);
        }
    });

    for (const key in elementCollectionsToCache) {
        const elements = document.querySelectorAll(elementCollectionsToCache[key]);
        if (elements && elements.length > 0) {
            DOMElements[key] = elements;
        } else {
            // Log a warning
            console.warn(`[DOM Loader] No elements found for selector "${elementCollectionsToCache[key]}" (key: ${key}).`);
        }
    }
    console.log("[DOM Loader] DOM Elements Cached:", DOMElements);
}
