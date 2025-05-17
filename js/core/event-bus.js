// js/core/event-bus.js
// (Optional Advanced Feature)
// A simple event bus for decoupled inter-module communication.

/*
const events = {};

export function subscribe(eventName, callback) {
    if (!events[eventName]) {
        events[eventName] = [];
    }
    events[eventName].push(callback);
    // console.log(`[Event Bus] Subscribed to "${eventName}"`);
}

export function publish(eventName, data) {
    if (events[eventName]) {
        // console.log(`[Event Bus] Publishing "${eventName}" with data:`, data);
        events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[Event Bus] Error in subscriber for "${eventName}":`, error);
            }
        });
    }
}

export function unsubscribe(eventName, callbackToRemove) {
    if (events[eventName]) {
        events[eventName] = events[eventName].filter(callback => callback !== callbackToRemove);
        // console.log(`[Event Bus] Unsubscribed from "${eventName}"`);
    }
}
*/

console.log("[Event Bus] Module loaded (currently not actively used).");
export default {};
