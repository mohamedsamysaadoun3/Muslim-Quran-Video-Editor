// js/core/dom-loader.js

/**
 * أداة بسيطة لتحميل/تخزين عناصر DOM مؤقتًا.
 * يساعد هذا في تجنب استدعاء document.getElementById بشكل متكرر.
 * يتم تخزين العناصر مؤقتًا عند الوصول إليها لأول مرة.
 */
const DOMElements = new Map();

/**
 * يحصل على عنصر DOM بواسطة معرفه (ID). إذا تم جلبه مسبقًا، يعيد العنصر المخزن.
 * @param {string} id - معرف عنصر DOM.
 * @returns {HTMLElement|null} عنصر DOM أو null إذا لم يتم العثور عليه.
 */
export function getElement(id) {
  if (DOMElements.has(id)) {
    return DOMElements.get(id);
  }
  const element = document.getElementById(id);
  if (element) {
    DOMElements.set(id, element);
  }
  // else {
  //   console.warn(`لم يتم العثور على عنصر DOM بالمعرف '${id}'.`);
  // }
  return element;
}

/**
 * يحصل على عدة عناصر DOM بواسطة معرفاتهم.
 * @param {string[]} ids - مصفوفة من المعرفات.
 * @returns {Object<string, HTMLElement|null>} كائن يربط المعرفات بالعناصر.
 */
export function getElements(ids) {
  const elements = {};
  ids.forEach(id => {
    elements[id] = getElement(id);
  });
  return elements;
}

/**
 * اختصار لـ document.querySelector.
 * @param {string} selector - محدد CSS.
 * @param {Document|Element} [context=document] - السياق الذي يتم البحث ضمنه.
 * @returns {Element|null} أول عنصر مطابق أو null.
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * اختصار لـ document.querySelectorAll.
 * @param {string} selector - محدد CSS.
 * @param {Document|Element} [context=document] - السياق الذي يتم البحث ضمنه.
 * @returns {NodeListOf<Element>} قائمة NodeList من العناصر المطابقة.
 */
export function $$(selector, context = document) {
  return context.querySelectorAll(selector);
}
