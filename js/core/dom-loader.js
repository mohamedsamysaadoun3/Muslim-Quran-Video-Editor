// js/core/dom-loader.js
const DOMElements = new Map();

export function getElement(id) {
  if (DOMElements.has(id)) {
    return DOMElements.get(id);
  }
  const element = document.getElementById(id);
  if (element) {
    DOMElements.set(id, element);
  } else {
    console.warn(`DOM LOADER: Element with ID '${id}' not found.`); // تعديل رسالة التحذير
  }
  return element;
}
// ... (باقي دوال $ و $$ كما هي)
export function $(selector, context = document) {
  return context.querySelector(selector);
}

export function $$(selector, context = document) {
  return context.querySelectorAll(selector);
}
