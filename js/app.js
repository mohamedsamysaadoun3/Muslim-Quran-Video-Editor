// js/app.js
import { initializeDOM, DOMElements } from './core/dom-loader.js';
import { loadInitialState, setupUndoRedoEventListeners, getCurrentProject, addStateToHistory } from './core/state-manager.js';
import { initTheme, setupThemeEventListeners } from './ui/theme-handler.js';
import { initSpinner, showSpinner, hideSpinner } from './ui/spinner-control.js';
import { initPanelManager, setupPanelEventListeners } from './ui/panel-manager.js';
import { loadProjectsFromStorage, setupProjectListEventListeners, handleGoToEditor, handleBackToInitialScreen, setupProjectSaveAndTitleEditing } from './features/project/project-coordinator.js';
import { initQuranModule, setupQuranModuleEventListeners } from './features/quran/quran-coordinator.js';
import { initBackgroundModule, setupBackgroundModuleEventListeners } from './features/background/background-coordinator.js';
import { initTextModule, setupTextModuleEventListeners } from './features/text/text-coordinator.js';
import { initAudioModule, setupAudioModuleEventListeners, stopMainPlayback } from './features/audio/audio-coordinator.js';
import { initVideoModule, setupVideoModuleEventListeners, updatePreviewRendering } from './features/video/video-coordinator.js';
import { initEditorControls, setupEditorControlsEventListeners } from './features/editor-controls/editor-controls-coordinator.js';
import { initGeneralSettings, setupGeneralSettingsEventListeners } from './features/general-settings/general-settings-coordinator.js';
import { PEXELS_API_KEY_STORAGE_KEY } from './config/constants.js';

async function initializeApp() {
    initializeDOM(); // Must be first
    initSpinner();
    showSpinner();

    loadInitialState(); // Sets up currentProject and history
    initTheme();
    initPanelManager();

    // Load PEXELS_API_KEY - modules needing it will get it from localStorage via a constant
    // or a shared config object if we decide to create one.
    // For now, PEXELS_API_KEY_STORAGE_KEY is used by pexels-api-service.js

    try {
        await initQuranModule();      // Fetches surahs, reciters, populates UI
        initBackgroundModule();   // Sets up background pickers and AI suggestions logic
        initTextModule();         // Sets up font, size, color controls
        await initAudioModule();        // Sets up audio player, timeline, loads ayahs for default project
        initVideoModule();        // Sets up canvas, aspect ratio, filters
        initEditorControls();     // Undo, redo, play/pause main controls
        initGeneralSettings();    // Export options, etc.

        loadProjectsFromStorage(); // Load and display saved projects

    } catch (error) {
        console.error("Error during feature module initialization:", error);
        // Consider showing a user-friendly error message
        // import { showError } from './ui/notifications.js'; showError("فشل تهيئة التطبيق.");
        alert("فشل تهيئة بعض مكونات التطبيق. قد لا تعمل بعض الميزات بشكل صحيح.");
    }

    setupAllEventListeners();

    // Initial preview rendering based on the loaded (or new) project state
    // The project state should be set by loadInitialState, and UI elements populated by module inits
    updatePreviewRendering(); // This will use the current state

    hideSpinner();
    console.log("Muslim Quran Editor (Modular) Initialized!");
}

function setupAllEventListeners() {
    setupThemeEventListeners();
    setupPanelEventListeners();

    // Project related event listeners
    setupProjectListEventListeners(); // For project cards
    setupProjectSaveAndTitleEditing(); // Save button and editable project title
    if (DOMElements.goToEditorBtn) DOMElements.goToEditorBtn.addEventListener('click', handleGoToEditor);
    if (DOMElements.backToInitialScreenBtn) DOMElements.backToInitialScreenBtn.addEventListener('click', () => {
         if (DOMElements.mainAudioPlayer && !DOMElements.mainAudioPlayer.paused) {
             stopMainPlayback(false); // false = don't reset currentPlaybackAyahIndex in state-manager
         }
         handleBackToInitialScreen();
    });

    // Feature specific event listeners
    setupQuranModuleEventListeners();
    setupBackgroundModuleEventListeners();
    setupTextModuleEventListeners();
    setupAudioModuleEventListeners();
    setupVideoModuleEventListeners();
    setupEditorControlsEventListeners(); // Includes undo/redo and main playback buttons
    setupGeneralSettingsEventListeners();

    // Global listeners (example)
    // window.addEventListener('resize', debouncedHandleWindowResize);
}

// Example of a debounced resize handler if needed
// function handleWindowResize() {
//     console.log("Window resized");
//     updatePreviewRendering(); // This should ideally be debounced
// }
// const debouncedHandleWindowResize = debounce(handleWindowResize, 250); // From utils/general-helpers.js

document.addEventListener('DOMContentLoaded', initializeApp);
