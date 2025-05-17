// js/ui/panel-manager.js
import { DOMElements } from '../core/dom-loader.js';

let activePanelId = null;

/**
 * Initializes the panel manager.
 * Ensures all panels are hidden initially and sets the first tab as active (e.g., Quran).
 */
export function initPanelManager() {
    closeAllPanels(); // Ensure all are hidden
    // Optionally, open a default panel. e.g., Quran panel
    if (DOMElements.mainTabButtons && DOMElements.mainTabButtons.length > 0) {
        const defaultPanelId = DOMElements.mainTabButtons[0].dataset.targetPanel;
        if (defaultPanelId) {
            // openPanel(defaultPanelId); // Let user open it explicitly or app.js can decide.
            // For now, ensure first tab button looks active if we want a default open panel.
             // DOMElements.mainTabButtons[0].classList.add('active');
        }
    }
    console.log("[Panel Manager] Initialized.");
}

/**
 * Opens a specific control panel and sets the corresponding tab button as active.
 * @param {string} panelId - The ID of the panel to open.
 */
export function openPanel(panelId) {
    if (activePanelId === panelId) return; // Already open

    closeAllPanels(); // Close any currently open panel

    const panelToOpen = document.getElementById(panelId); // DOMElements might not have individual panels by ID directly if many
    const correspondingTabButton = Array.from(DOMElements.mainTabButtons || []).find(
        (btn) => btn.dataset.targetPanel === panelId
    );

    if (panelToOpen) {
        panelToOpen.classList.add('visible');
        activePanelId = panelId;
        console.log(`[Panel Manager] Opened panel: ${panelId}`);
    } else {
        console.warn(`[Panel Manager] Panel with ID "${panelId}" not found.`);
    }

    if (correspondingTabButton) {
        correspondingTabButton.classList.add('active');
    }
}

/**
 * Closes a specific control panel and deactivates its tab button.
 * @param {string} panelId - The ID of the panel to close.
 */
export function closePanel(panelId) {
    const panelToClose = document.getElementById(panelId);
    const correspondingTabButton = Array.from(DOMElements.mainTabButtons || []).find(
        (btn) => btn.dataset.targetPanel === panelId
    );

    if (panelToClose) {
        panelToClose.classList.remove('visible');
        if (activePanelId === panelId) {
            activePanelId = null;
        }
        console.log(`[Panel Manager] Closed panel: ${panelId}`);
    }

    if (correspondingTabButton) {
        correspondingTabButton.classList.remove('active');
    }
}

/**
 * Closes all currently open control panels and deactivates all tab buttons.
 */
export function closeAllPanels() {
    if (DOMElements.controlPanels) {
        DOMElements.controlPanels.forEach(panel => {
            panel.classList.remove('visible');
        });
    }
    if (DOMElements.mainTabButtons) {
        DOMElements.mainTabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
    }
    activePanelId = null;
    // console.log("[Panel Manager] All panels closed.");
}

/**
 * Sets up event listeners for main tab buttons and panel close/confirm buttons.
 */
export function setupPanelEventListeners() {
    // Main Tab Buttons
    if (DOMElements.mainTabButtons) {
        DOMElements.mainTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPanelId = button.dataset.targetPanel;
                if (targetPanelId) {
                    if (activePanelId === targetPanelId && button.classList.contains('active')) {
                        // If the active tab is clicked again, close its panel
                        closePanel(targetPanelId);
                    } else {
                        openPanel(targetPanelId);
                    }
                }
            });
        });
    }

    // Panel Close Buttons (X icon in panel header)
    if (DOMElements.panelCloseButtons) {
        DOMElements.panelCloseButtons.forEach(button => {
            button.addEventListener('click', () => {
                const panelId = button.dataset.panelid; // Ensure data-panelid is on the button
                if (panelId) {
                    closePanel(panelId);
                } else {
                    // Fallback if data-panelid is missing, try to find parent panel
                    const parentPanel = button.closest('.control-panel');
                    if (parentPanel) closePanel(parentPanel.id);
                }
            });
        });
    }

    // Panel Confirm Buttons (Checkmark icon in panel header, e.g., for Quran panel)
    if (DOMElements.panelConfirmButtons) {
        DOMElements.panelConfirmButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Action on confirm (e.g., validation) could be handled by publishing an event
                // or by specific module listeners if the button has a more specific ID/class.
                // For now, it just closes the panel.
                const panelId = button.dataset.panelid;
                if (panelId) {
                    // Potentially trigger an update or validation before closing
                    // For example, if it's the quran panel, ensure ayahs are reloaded.
                    // This might involve a callback or an event.
                    // import { publish } from '../core/event-bus.js';
                    // publish(`${panelId}-confirmed`);
                    closePanel(panelId);
                }
            });
        });
    }
}
