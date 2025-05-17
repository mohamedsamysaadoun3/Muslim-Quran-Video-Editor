// js/ui/modal-handler.js
import { $, getElement } from '../core/dom-loader.js';
import eventBus from '../core/event-bus.js';

// هذه الوحدة ستدير النوافذ المنبثقة المخصصة (مثل طلب اسم المشروع، التأكيدات)

let modalOverlay = null;
let modalContainer = null;
let modalTitleEl = null;
let modalContentEl = null;
let modalActionsEl = null;

let currentResolve = null;
let currentReject = null;
let isModalDismissible = true; // متغير لتتبع إمكانية رفض النافذة الحالية

function ensureModalElements() {
    if (modalOverlay) return;

    modalOverlay = document.createElement('div');
    modalOverlay.id = 'app-modal-overlay';
    Object.assign(modalOverlay.style, {
        position: 'fixed',
        inset: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: '20000', // فوق شريط الإشعارات
        display: 'none', // مخفي بشكل افتراضي
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
        opacity: '0', // للتحريك
        transition: 'opacity 0.2s ease-out'
    });

    modalContainer = document.createElement('div');
    modalContainer.id = 'app-modal-container';
    Object.assign(modalContainer.style, {
        backgroundColor: 'var(--current-surface-color)',
        color: 'var(--current-text-color)',
        padding: '25px',
        borderRadius: 'var(--border-radius-large)',
        boxShadow: 'var(--shadow-strong)',
        width: '90%',
        maxWidth: '480px',
        maxHeight: '85vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        transform: 'scale(0.95)', // للتحريك
        transition: 'transform 0.2s ease-out, background-color 0.3s ease, color 0.3s ease' // إضافة تحريك للألوان
    });

    modalTitleEl = document.createElement('h3');
    modalTitleEl.id = 'app-modal-title';
    Object.assign(modalTitleEl.style, {
        margin: '0 0 20px 0',
        fontSize: '1.5rem',
        // لون العنوان سيتم تحديثه ديناميكيًا
    });


    modalContentEl = document.createElement('div');
    modalContentEl.id = 'app-modal-content';
    Object.assign(modalContentEl.style, {
        marginBottom: '25px',
        lineHeight: '1.7'
    });

    modalActionsEl = document.createElement('div');
    modalActionsEl.id = 'app-modal-actions';
    Object.assign(modalActionsEl.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: 'auto'
    });

    modalContainer.append(modalTitleEl, modalContentEl, modalActionsEl);
    modalOverlay.appendChild(modalContainer);
    getElement('app-container').appendChild(modalOverlay);

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay && isModalDismissible) { // النقر على خلفية النافذة
            closeModal(undefined, true); // التعامل معه كرفض
        }
    });
}


function closeModal(value, dismissedByAction = false) { // dismissedByAction: هل تم الإغلاق عبر ESC أو الخلفية
    if (!modalOverlay || modalOverlay.style.opacity === '0') return;

    modalOverlay.style.opacity = '0';
    modalContainer.style.transform = 'scale(0.95)';

    setTimeout(() => {
        modalOverlay.style.display = 'none';
        modalContentEl.innerHTML = ''; // مسح المحتوى
        modalActionsEl.innerHTML = ''; // مسح الأزرار
    }, 200); // تطابق مدة التحريك

    if (dismissedByAction && currentReject) {
        currentReject('تم رفض النافذة المنبثقة');
    } else if (value === undefined && currentReject) { // إذا لم يتم تمرير قيمة (مثل الإغلاق بزر X أو إلغاء افتراضي)
         currentReject('تم إلغاء النافذة المنبثقة');
    } else if (currentResolve) { // إذا تم تمرير قيمة (حتى لو كانت null من زر إلغاء صريح)
        currentResolve(value);
    }

    currentResolve = null;
    currentReject = null;
}

/**
 * يعرض نافذة منبثقة عامة.
 * @param {object} options
 * @param {string} options.title - عنوان النافذة.
 * @param {string|HTMLElement} options.content - سلسلة HTML أو عنصر HTMLElement لمحتوى النافذة.
 * @param {Array<object>} [options.actions] - مصفوفة من تعريفات أزرار الإجراءات.
 *   كل إجراء: { text: string, type: 'primary'|'secondary'|'danger', value: any, closesOnClick: boolean (default true), className?: string }
 * @param {boolean} [options.isDismissible=true] - إذا كان النقر على الخلفية أو ESC يرفض النافذة.
 * @returns {Promise<any>} وعد يتم حله بقيمة الإجراء المتخذ، أو يرفض عند الرفض/الإلغاء.
 */
export function showModal({ title, content, actions = [], isDismissible: modalSpecificDismissible = true }) {
    ensureModalElements();
    isModalDismissible = modalSpecificDismissible; // تحديث الحالة العامة لإمكانية الرفض

    return new Promise((resolve, reject) => {
        currentResolve = resolve;
        currentReject = reject;

        modalTitleEl.textContent = title;
        // تحديث لون العنوان ليتناسب مع السمة الحالية
        const isDarkTheme = document.body.classList.contains('dark-theme');
        modalTitleEl.style.color = isDarkTheme ? 'var(--primary-color-lighter)' : 'var(--primary-color)';
        // تحديث لون خلفية ومحتوى النافذة نفسها ليتناسب مع السمة
        modalContainer.style.backgroundColor = isDarkTheme ? 'var(--surface-color-dark)' : 'var(--surface-color-light)';
        modalContainer.style.color = isDarkTheme ? 'var(--text-color-dark)' : 'var(--text-color-light)';


        if (typeof content === 'string') {
            modalContentEl.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            modalContentEl.innerHTML = ''; // مسح السابق
            modalContentEl.appendChild(content);
        }

        modalActionsEl.innerHTML = ''; // مسح الإجراءات السابقة
        if (actions.length === 0) { // زر إغلاق افتراضي إذا لم تكن هناك إجراءات
            actions.push({ text: 'إغلاق', type: 'secondary', value: undefined });
        }

        actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action.text;
            button.className = action.className || 'control-button'; // استخدام control-button كافتراضي

            // تطبيق أنماط خاصة بالنوع
            if (action.type === 'primary') {
                button.classList.add('button-primary-action');
                // تعديل لون النص لزر الإجراء الرئيسي لضمان التباين
                // هذا المنطق تم نقله إلى CSS مع :root و .dark-theme selectors
            } else if (action.type === 'danger') {
                button.style.backgroundColor = '#e53935';
                button.style.color = 'white';
                button.style.borderColor = '#d32f2f';
            }
            // أزرار 'secondary' ستستخدم أنماط .control-button الافتراضية

            button.addEventListener('click', () => {
                const closeOnClick = action.closesOnClick !== false; // الافتراضي true
                if (closeOnClick) {
                    closeModal(action.value);
                } else {
                    // إذا كان الإجراء لا يغلق النافذة، فقط قم بحل الوعد
                    if (currentResolve) currentResolve(action.value);
                    // أو ربما eventBus.emit إذا كانت النافذة معقدة وتحتاج لتحديث أجزاء أخرى
                }
            });
            modalActionsEl.appendChild(button);
        });

        modalOverlay.style.display = 'flex';
        setTimeout(() => { // للسماح بالتحريك
            modalOverlay.style.opacity = '1';
            modalContainer.style.transform = 'scale(1)';
        }, 20);

        const firstInteractive = $('input, select, textarea, button', modalContainer);
        if (firstInteractive) firstInteractive.focus();
    });
}

/**
 * يعرض نافذة تأكيد.
 * @param {string} title - عنوان التأكيد.
 * @param {string} message - رسالة التأكيد.
 * @param {string} [confirmText='نعم']
 * @param {string} [cancelText='إلغاء']
 * @returns {Promise<boolean>} true إذا تم التأكيد، false إذا تم الإلغاء أو الرفض.
 */
export async function showConfirm(title, message, confirmText = 'نعم', cancelText = 'إلغاء') {
    try {
        const result = await showModal({
            title,
            content: `<p>${message}</p>`,
            actions: [
                { text: cancelText, type: 'secondary', value: false },
                { text: confirmText, type: 'primary', value: true }
            ],
            isDismissible: false // نوافذ التأكيد عادة لا تكون قابلة للرفض
        });
        return result === true; // تأكد من أنها قيمة منطقية true
    } catch (error) { // الرفض (مثل الإغلاق عبر ESC إذا كان isDismissible=true، وهو ليس كذلك هنا)
        return false;
    }
}

/**
 * يعرض نافذة إدخال (prompt).
 * @param {string} title - عنوان النافذة.
 * @param {string} message - رسالة/تسمية الإدخال.
 * @param {string} [defaultValue=''] - القيمة الافتراضية للإدخال.
 * @param {string} [inputType='text'] - نوع الإدخال (text, number, etc.).
 * @param {object} [inputAttributes={}] - سمات إضافية لعنصر الإدخال.
 * @param {string} [confirmText='موافق']
 * @param {string} [cancelText='إلغاء']
 * @returns {Promise<string|number|null>} قيمة الإدخال إذا تم التأكيد، أو null إذا تم الإلغاء أو الرفض.
 */
export async function showPrompt(title, message, defaultValue = '', inputType = 'text', inputAttributes = {}, confirmText = 'موافق', cancelText = 'إلغاء') {
    const inputId = `modal-prompt-input-${Date.now()}`;
    const contentContainer = document.createElement('div');

    const labelElement = document.createElement('label');
    labelElement.htmlFor = inputId;
    labelElement.textContent = message;
    // تطبيق أنماط التسمية من CSS العام إذا أمكن، أو هنا مباشرة
    labelElement.style.display = 'block';
    labelElement.style.marginBottom = '8px';
    labelElement.style.fontWeight = '500';
    labelElement.style.color = 'var(--current-text-secondary-color)'; // استخدام لون نص ثانوي للتسمية

    const inputElement = document.createElement('input');
    inputElement.type = inputType;
    inputElement.id = inputId;
    inputElement.value = defaultValue;
    // تطبيق أنماط المدخلات من CSS العام
    inputElement.style.width = '100%';
    inputElement.style.padding = '0.6em 0.8em';
    inputElement.style.border = '1px solid var(--current-input-border-color)';
    inputElement.style.borderRadius = 'var(--border-radius-small)';
    inputElement.style.backgroundColor = 'var(--current-input-bg-color)';
    inputElement.style.color = 'var(--current-text-color)';
    inputElement.style.fontFamily = 'var(--font-family-ui)';
    inputElement.style.fontSize = '0.95rem';
    inputElement.style.boxSizing = 'border-box';


    for (const attr in inputAttributes) {
        inputElement.setAttribute(attr, inputAttributes[attr]);
    }

    contentContainer.appendChild(labelElement);
    contentContainer.appendChild(inputElement);

    try {
        const result = await showModal({
            title,
            content: contentContainer,
            actions: [
                { text: cancelText, type: 'secondary', value: null }, // null للإشارة إلى الإلغاء
                { text: confirmText, type: 'primary', value: 'confirm' } // قيمة خاصة لجلب الإدخال
            ],
            isDismissible: true // يمكن للمستخدم رفض نوافذ الإدخال
        });

        if (result === 'confirm') {
            // لا حاجة لـ getElement(inputId) هنا لأن inputElement لا يزال في النطاق
            const finalValue = inputElement.value;
            return inputType === 'number' ? parseFloat(finalValue) : finalValue;
        }
        return null; // تم الإلغاء أو الرفض
    } catch (error) { // إذا تم رفض الوعد من showModal
        return null;
    }
}


export function initializeModals() {
    // console.log('تم تهيئة نظام النوافذ المنبثقة.');
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalOverlay && modalOverlay.style.opacity === '1') {
            if (isModalDismissible) { // تحقق من الحالة العامة الحالية
                 closeModal(undefined, true); // true للإشارة إلى أنه تم الرفض عبر ESC
            }
        }
    });

    // تحديث ألوان النافذة المنبثقة عند تغيير السمة
    eventBus.on('themeChanged', () => {
        if (modalContainer && modalOverlay.style.display === 'flex') {
            const isDarkTheme = document.body.classList.contains('dark-theme');
            modalContainer.style.backgroundColor = isDarkTheme ? 'var(--surface-color-dark)' : 'var(--surface-color-light)';
            modalContainer.style.color = isDarkTheme ? 'var(--text-color-dark)' : 'var(--text-color-light)';
            modalTitleEl.style.color = isDarkTheme ? 'var(--primary-color-lighter)' : 'var(--primary-color)';
            // قد تحتاج أيضًا إلى تحديث ألوان الأزرار إذا لم تكن تستجيب للسمة عبر CSS بشكل كامل
        }
    });
}
