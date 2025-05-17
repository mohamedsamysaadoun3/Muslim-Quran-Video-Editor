// js/core/state-manager.js
import { DEFAULT_PROJECT_ID_PREFIX, MAX_HISTORY_STATES } from '../config/constants.js';
import { createNewProjectObject } from '../features/project/project-model.js';
import { DOMElements } from './dom-loader.js';
// The following imports create circular dependencies if loadProjectIntoUI directly calls them.
// Instead, app.js or coordinators should trigger these updates after state changes.
// import { loadAyahsForPlayback, stopMainPlayback, updateTimelineUIBasedOnCurrentAyah } from '../features/audio/audio-coordinator.js';
// import { updatePreviewRendering } from '../features/video/video-coordinator.js';
// import { populateUIFromProject } from '../features/project/project-coordinator.js';


let currentProject = null; // Will be initialized by loadInitialState
let projectHistory = [];
let currentHistoryIndex = -1;
let isRestoringState = false; // Flag to prevent re-adding to history during undo/redo

/**
 * Loads the initial state of the application.
 * Creates a new project and initializes history.
 */
export function loadInitialState() {
    currentProject = createNewProjectObject(`${DEFAULT_PROJECT_ID_PREFIX}${Date.now()}`);
    projectHistory = [JSON.parse(JSON.stringify(currentProject))]; // Deep copy for history
    currentHistoryIndex = 0;
    updateUndoRedoButtonsUI();
    console.log("[State Manager] Initial state loaded:", getCurrentProject());
}

/**
 * Returns a deep copy of the current project state.
 * @returns {object} The current project state.
 */
export function getCurrentProject() {
    // Ensure currentProject is initialized
    if (!currentProject) {
        console.warn("[State Manager] getCurrentProject called before state initialization. Returning new project.");
        return createNewProjectObject(); // Fallback, though loadInitialState should prevent this
    }
    return JSON.parse(JSON.stringify(currentProject));
}

/**
 * Sets the entire current project state. Used when loading a project or undoing/redoing.
 * @param {object} newProjectData - The complete new project data.
 * @param {boolean} [addToHist=true] - Whether to add this change to history. Defaults to true.
 *                                     Set to false when loading from history itself.
 */
export function setCurrentProject(newProjectData, addToHist = true) {
    if (!newProjectData || typeof newProjectData !== 'object') {
        console.error("[State Manager] Invalid newProjectData for setCurrentProject:", newProjectData);
        return;
    }
    currentProject = JSON.parse(JSON.stringify(newProjectData)); // Deep copy
    console.log("[State Manager] Project state explicitly set:", getCurrentProject());
    if (addToHist && !isRestoringState) {
        addStateToHistory();
    }
}

/**
 * Updates specific settings within the current project object.
 * After updating, it's recommended to call addStateToHistory() explicitly
 * from the module that initiated the change, typically on a 'change' event.
 * @param {object} settingsToUpdate - An object containing key-value pairs to update.
 */
export function updateProjectSettings(settingsToUpdate) {
    if (!currentProject) {
        console.error("[State Manager] Cannot update settings, currentProject is not initialized.");
        return;
    }
    let changed = false;
    for (const key in settingsToUpdate) {
        // A more sophisticated deep compare might be needed for nested objects if they exist
        if (currentProject[key] !== settingsToUpdate[key]) {
            currentProject[key] = settingsToUpdate[key];
            changed = true;
        }
    }
    if (changed) {
        console.log("[State Manager] Project settings updated:", settingsToUpdate, "New current state:", getCurrentProject());
        // The module calling this function is responsible for calling addStateToHistory at the right moment (e.g., on input 'change')
    }
    return changed; // Return whether a change occurred
}

/**
 * Adds the current state of `currentProject` to the history stack for undo/redo.
 */
export function addStateToHistory() {
    if (isRestoringState) return; // Don't add to history when undoing/redoing

    if (!currentProject) {
        console.error("[State Manager] Cannot add to history, currentProject is not initialized.");
        return;
    }
    const currentStateSnapshot = JSON.parse(JSON.stringify(currentProject));

    // Avoid adding identical consecutive states
    if (projectHistory.length > 0 && currentHistoryIndex >=0 && currentHistoryIndex < projectHistory.length &&
        JSON.stringify(currentStateSnapshot) === JSON.stringify(projectHistory[currentHistoryIndex])) {
        return;
    }

    // If we are in the middle of history (after undo), truncate future states
    if (currentHistoryIndex < projectHistory.length - 1) {
        projectHistory = projectHistory.slice(0, currentHistoryIndex + 1);
    }

    projectHistory.push(currentStateSnapshot);

    if (projectHistory.length > MAX_HISTORY_STATES) {
        projectHistory.shift(); // Remove the oldest state
    }
    currentHistoryIndex = projectHistory.length - 1; // Point to the new latest state
    updateUndoRedoButtonsUI();
    console.log("[State Manager] State added to history. Index:", currentHistoryIndex, "History size:", projectHistory.length);
}

/**
 * Reverts to the previous state in the history.
 */
export async function undoState() {
    if (currentHistoryIndex > 0) {
        isRestoringState = true;
        currentHistoryIndex--;
        await loadStateFromHistoryAndNotify();
        isRestoringState = false;
    }
}

/**
 * Advances to the next state in the history (redo).
 */
export async function redoState() {
    if (currentHistoryIndex < projectHistory.length - 1) {
        isRestoringState = true;
        currentHistoryIndex++;
        await loadStateFromHistoryAndNotify();
        isRestoringState = false;
    }
}

/**
 * Loads a state from the history into `currentProject` and triggers UI updates.
 * This function is now async to handle potential async operations during UI update.
 */
async function loadStateFromHistoryAndNotify() {
    if (projectHistory[currentHistoryIndex]) {
        const stateToLoad = JSON.parse(JSON.stringify(projectHistory[currentHistoryIndex]));
        setCurrentProject(stateToLoad, false); // Set currentProject without adding to history again
        console.log("[State Manager] Loading state from history. Index:", currentHistoryIndex, "State:", stateToLoad);

        // Notify other modules that the state has changed.
        // app.js or coordinators will listen to this (or be called directly) to update UI.
        // This avoids direct calls to UI update functions from state-manager.
        // For now, we'll assume app.js or a coordinator handles this.
        // The most direct way is for this function to be awaited and then the caller updates UI.

        // To ensure UI reflects the new state, the module that called undo/redo (e.g., editor-controls-coordinator)
        // should now call functions to update the UI and dependent data.
        // For example, after `await undoState()` in editor-controls:
        //   `populateUIFromProject(getCurrentProject());`
        //   `await loadAyahsForPlayback();` // if Quran settings changed
        //   `updatePreviewRendering();`

        // This requires `populateUIFromProject`, `loadAyahsForPlayback`, `updatePreviewRendering`
        // to be imported and called by the coordinator that initiated the undo/redo.
        // This keeps state-manager focused on state.

        updateUndoRedoButtonsUI();
    }
}

/**
 * Clears the project history and resets to a new initial project state.
 * @param {object} [initialProjectState] - Optional state to initialize with.
 */
export function clearProjectHistory(initialProjectState) {
    isRestoringState = true; // Prevent history add during this reset
    const stateToInitWith = initialProjectState || createNewProjectObject();
    currentProject = JSON.parse(JSON.stringify(stateToInitWith));
    projectHistory = [JSON.parse(JSON.stringify(currentProject))];
    currentHistoryIndex = 0;
    updateUndoRedoButtonsUI();
    isRestoringState = false;
    console.log("[State Manager] Project history cleared and reset.");
}

/**
 * Updates the disabled state of undo/redo buttons based on history.
 */
function updateUndoRedoButtonsUI() {
    if (DOMElements.undoBtn && DOMElements.redoBtn) {
        DOMElements.undoBtn.disabled = currentHistoryIndex <= 0;
        DOMElements.redoBtn.disabled = currentHistoryIndex >= projectHistory.length - 1;
    }
}

/**
 * Sets up event listeners for undo/redo buttons.
 * This function will be called by editor-controls-coordinator.js.
 */
export function setupUndoRedoEventListeners() {
    // Event listeners are now set up in editor-controls-coordinator.js
    // to keep this module focused on state logic.
    // That coordinator will import and call undoState/redoState.
}
