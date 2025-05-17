// js/ui/spinner-control.js
import { getElement } from '../core/dom-loader.js';

const spinnerOverlay = getElement('loading-spinner');
let activeSpinners = 0; // عداد لعمليات غير متزامنة متعددة

/**
 * يعرض مؤشر التحميل العام.
 * إذا أدت عمليات متعددة إلى استدعاء showSpinner، فلن يتم إخفاؤه إلا عند انتهاء جميع العمليات.
 */
export function showSpinner() {
    activeSpinners++;
    if (spinnerOverlay && spinnerOverlay.style.display !== 'flex') {
        spinnerOverlay.style.opacity = '0'; // للتحريك
        spinnerOverlay.style.display = 'flex';
        setTimeout(() => spinnerOverlay.style.opacity = '1', 10); // تأخير بسيط لبدء التحريك
        // console.log('تم عرض مؤشر التحميل.');
    }
}

/**
 * يخفي مؤشر التحميل العام.
 * يتم إخفاؤه فقط إذا وصل عداد مؤشرات التحميل النشطة إلى الصفر.
 */
export function hideSpinner() {
    activeSpinners--;
    if (activeSpinners < 0) {
        activeSpinners = 0; // لا ينبغي أن يحدث، ولكن كإجراء وقائي
    }

    if (activeSpinners === 0 && spinnerOverlay && spinnerOverlay.style.display === 'flex') {
        spinnerOverlay.style.opacity = '0';
        setTimeout(() => {
            // تأكد مرة أخرى من أن activeSpinners لا يزال صفرًا قبل الإخفاء
            if (activeSpinners === 0) {
                spinnerOverlay.style.display = 'none';
            }
        }, 300); // تطابق مدة التحريك (إذا كان هناك تحريك للشفافية)
        // console.log('تم إخفاء مؤشر التحميل.');
    }
}

/**
 * يخفي مؤشر التحميل بالقوة، مع إعادة تعيين العداد.
 * مفيد في سيناريوهات الخطأ أو التجاوزات الصريحة.
 */
export function forceHideSpinner() {
    activeSpinners = 0;
    if (spinnerOverlay) {
        spinnerOverlay.style.opacity = '0';
        setTimeout(() => spinnerOverlay.style.display = 'none', 300);
        // console.log('تم إخفاء مؤشر التحميل بالقوة.');
    }
}

/**
 * يغلف وعدًا أو دالة غير متزامنة بإدارة مؤشر التحميل تلقائيًا.
 * @param {Promise|Function} promiseOrAsyncFn - الوعد أو الدالة غير المتزامنة للتغليف.
 * @returns {Promise<any>} نتيجة الوعد/الدالة.
 * @example
 * await withSpinner(fetchSomeData());
 * await withSpinner(async () => { await anotherAsyncOp(); });
 */
export async function withSpinner(promiseOrAsyncFn) {
    showSpinner();
    try {
        if (typeof promiseOrAsyncFn === 'function') {
            return await promiseOrAsyncFn();
        }
        return await promiseOrAsyncFn;
    } finally {
        // تأخير بسيط قبل الإخفاء لإعطاء انطباع بأن شيئًا ما قد اكتمل بالفعل
        // خاصة للعمليات السريعة جدًا.
        // await new Promise(resolve => setTimeout(resolve, 100)); // اختياري
        hideSpinner();
    }
}
