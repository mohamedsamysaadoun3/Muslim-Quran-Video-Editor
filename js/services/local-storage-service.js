// js/services/local-storage-service.js
import { handleError } from '../core/error-handler.js';

/**
 * غلاف لـ window.localStorage مع معالجة الأخطاء وتحليل/تسلسل JSON.
 */

/**
 * يسترجع عنصرًا من localStorage ويحلله كـ JSON.
 * @param {string} key - مفتاح العنصر المراد استرجاعه.
 * @returns {any|null} العنصر المسترجع، أو null إذا لم يتم العثور عليه أو حدث خطأ.
 */
export function getItem(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        handleError(error, `LocalStorage GetItem (${key})`, false); // false: لا تخطر المستخدم بهذا
        return null;
    }
}

/**
 * يخزن عنصرًا في localStorage بعد تحويله إلى سلسلة.
 * @param {string} key - المفتاح الذي سيتم تخزين العنصر تحته.
 * @param {any} value - القيمة المراد تخزينها.
 * @returns {boolean} true إذا نجحت العملية، false خلاف ذلك.
 */
export function setItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        // معالجة الأخطاء المحتملة مثل امتلاء مساحة التخزين (QuotaExceededError)
        handleError(error, `LocalStorage SetItem (${key})`, true);
        if (error.name === 'QuotaExceededError') {
            alert('مساحة التخزين ممتلئة. قد تحتاج إلى حذف بعض المشاريع القديمة أو تفريغ مساحة.');
        }
        return false;
    }
}

/**
 * يزيل عنصرًا من localStorage.
 * @param {string} key - مفتاح العنصر المراد إزالته.
 */
export function removeItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        handleError(error, `LocalStorage RemoveItem (${key})`, false);
    }
}

/**
 * يمسح جميع العناصر من localStorage.
 * تحذير: هذا سيمسح كل شيء تم تخزينه بواسطة التطبيق. استخدم بحذر.
 */
export function clearAll() {
    try {
        localStorage.clear();
        // console.log('تم مسح LocalStorage.');
    } catch (error) {
        handleError(error, 'LocalStorage ClearAll', true);
    }
}

/**
 * يتحقق مما إذا كان localStorage متاحًا وقابلاً للاستخدام.
 * @returns {boolean} true إذا كان localStorage متاحًا، false خلاف ذلك.
 */
export function isLocalStorageAvailable() {
    try {
        const testKey = '__localStorageTest__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

if (!isLocalStorageAvailable()) {
    console.warn('LocalStorage غير متاح. لن يتم حفظ حالة التطبيق.');
    // اختياريًا، قم بإخطار المستخدم أو توفير آلية احتياطية إذا كانت حرجة.
    handleError('LocalStorage غير متاح أو معطل.', 'تهيئة LocalStorage', true);
}
