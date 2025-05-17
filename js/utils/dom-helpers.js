// js/utils/dom-helpers.js

// دوال getElement, $, $$ موجودة بالفعل في core/dom-loader.js.
// يمكن أن يحتوي هذا الملف على دوال مساعدة أخرى لمعالجة DOM إذا لزم الأمر.

/**
 * ينشئ عنصر DOM بسمات وأبناء معينين.
 * @param {string} tagName - اسم الوسم للعنصر.
 * @param {object} [attributes={}] - كائن من السمات لتعيينها على العنصر.
 * @param {Array<string|Node>} [children=[]] - مصفوفة من السلاسل أو عقد DOM الأبناء.
 * @returns {HTMLElement} عنصر DOM الذي تم إنشاؤه.
 *
 * @example
 * const myDiv = createElement('div', { class: 'container', id: 'main' }, [
 *   createElement('h1', { class: 'title' }, ['أهلاً بالعالم']),
 *   'بعض المحتوى النصي'
 * ]);
 * document.body.appendChild(myDiv);
 */
export function createElement(tagName, attributes = {}, children = []) {
    const element = document.createElement(tagName);

    // تعيين السمات
    for (const key in attributes) {
        if (attributes.hasOwnProperty(key)) {
            if (key.startsWith('data-')) {
                // تحويل data-foo-bar إلى fooBar لـ dataset
                const dataKey = key.substring(5).replace(/-([a-z])/g, g => g[1].toUpperCase());
                element.dataset[dataKey] = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        }
    }

    // إلحاق الأبناء
    children.forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') { // السماح بالأرقام أيضًا
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            element.appendChild(child);
        } else if (Array.isArray(child)) { // السماح بمصفوفات متداخلة من الأبناء
            child.forEach(subChild => {
                if (typeof subChild === 'string' || typeof subChild === 'number') {
                    element.appendChild(document.createTextNode(String(subChild)));
                } else if (subChild instanceof Node) {
                    element.appendChild(subChild);
                }
            });
        }
    });

    return element;
}

/**
 * يعرض عنصر DOM عن طريق تعيين نمط عرضه إلى قيمته الأصلية أو 'block'.
 * @param {HTMLElement} element - العنصر المراد عرضه.
 * @param {string} [defaultDisplay='block'] - قيمة العرض لاستخدامها إذا كانت الأصلية 'none'.
 */
export function showElement(element, defaultDisplay = 'block') {
    if (!element || !(element instanceof HTMLElement)) return;
    // لا حاجة لتخزين originalDisplay إذا كنا دائمًا نعرض إلى defaultDisplay
    // إذا أردنا الحفاظ على display الأصلي (مثل 'flex', 'grid'), سيتطلب الأمر منطقًا أكثر تعقيدًا.
    element.style.display = defaultDisplay;
}

/**
 * يخفي عنصر DOM عن طريق تعيين نمط عرضه إلى 'none'.
 * @param {HTMLElement} element - العنصر المراد إخفاؤه.
 */
export function hideElement(element) {
    if (!element || !(element instanceof HTMLElement)) return;
    element.style.display = 'none';
}

/**
 * يبدل رؤية عنصر DOM.
 * @param {HTMLElement} element - العنصر المراد تبديله.
 * @param {string} [defaultDisplay='block'] - قيمة العرض لاستخدامها عند العرض.
 */
export function toggleElementVisibility(element, defaultDisplay = 'block') {
    if (!element || !(element instanceof HTMLElement)) return;
    // استخدام getComputedStyle للحصول على حالة العرض الفعلية
    if (getComputedStyle(element).display === 'none') {
        showElement(element, defaultDisplay);
    } else {
        hideElement(element);
    }
}

/**
 * يضيف فئة إلى عنصر إذا تحقق شرط، وإلا يزيلها.
 * @param {HTMLElement} element - العنصر.
 * @param {string} className - اسم الفئة.
 * @param {boolean} condition - الشرط.
 */
export function toggleClass(element, className, condition) {
    if (!element || !(element instanceof HTMLElement) || !className) return;
    if (condition) {
        element.classList.add(className);
    } else {
        element.classList.remove(className);
    }
}

/**
 * يزيل جميع العقد الأبناء من عنصر.
 * @param {HTMLElement} parentElement - العنصر الأب.
 */
export function removeAllChildren(parentElement) {
    if (!parentElement || !(parentElement instanceof HTMLElement)) return;
    while (parentElement.firstChild) {
        parentElement.removeChild(parentElement.firstChild);
    }
}
