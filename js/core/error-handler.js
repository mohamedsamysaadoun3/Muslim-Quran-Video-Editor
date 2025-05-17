// js/core/error-handler.js
import eventBus from './event-bus.js'; // قد نرغب في إعلام واجهة المستخدم

/**
 * معالجة مركزية للأخطاء في التطبيق.
 * هذه نسخة أساسية؛ يمكن توسيعها بخدمات إبلاغ عن الأخطاء (مثل Sentry).
 */

/**
 * يعالج خطأ، يسجله، ويخطر المستخدم اختياريًا.
 * @param {Error|string} error - كائن الخطأ أو سلسلة رسالة الخطأ.
 * @param {string} [context="عام"] - السياق الذي حدث فيه الخطأ (مثال: "جلب API"، "عرض الكانفاس").
 * @param {boolean} [notifyUser=true] - هل تتم محاولة إخطار المستخدم (مثال: عبر رسالة Toast).
 */
export function handleError(error, context = "عام", notifyUser = true) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'لا يوجد تتبع للمكدس.';

    console.error(`[خطأ في ${context}]: ${errorMessage}`, errorStack, error);

    if (notifyUser) {
        // مثال: إطلاق حدث يمكن لمكون واجهة المستخدم الاستماع إليه لعرض الإشعارات
        eventBus.emit('showNotification', {
            type: 'error',
            message: `خطأ في ${context}: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`, // إبقاء الرسالة موجزة
            duration: 5000 // 5 ثواني
        });
        // في نظام أكثر قوة، ستستدعي خدمة إشعارات مخصصة هنا.
        // حاليًا، يمكننا فقط استخدام alert، أو الاعتماد على event bus.
        // alert(`حدث خطأ: ${errorMessage}`);
    }

    // مستقبلاً: إرسال الخطأ إلى خدمة إبلاغ مثل Sentry
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: { context } });
    // }
}

/**
 * يغلف دالة غير متزامنة بمعالجة الأخطاء.
 * @param {function} asyncFn - الدالة غير المتزامنة للتغليف.
 * @param {string} [context="عملية غير متزامنة"] - سياق للإبلاغ عن الخطأ.
 * @param {boolean} [notifyUser=true] - هل يتم إخطار المستخدم عند الخطأ.
 * @returns {function} دالة جديدة تستدعي الدالة الأصلية غير المتزامنة مع معالجة الأخطاء.
 */
export function withErrorHandling(asyncFn, context = "عملية غير متزامنة", notifyUser = true) {
    return async (...args) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            handleError(error, context, notifyUser);
            // اختياريًا، أعد طرح الخطأ أو أرجع كائن/قيمة خطأ محددة
            throw error; // إعادة الطرح تسمح للمستدعي أيضًا بالمعالجة إذا لزم الأمر
        }
    };
}

// مستمعات الأخطاء العامة (اختيارية، ولكنها جيدة لالتقاط rejections الوعود غير المعالجة وما إلى ذلك)
// window.addEventListener('error', (event) => {
//     handleError(event.error, 'خطأ عام window.onerror');
// });

// window.addEventListener('unhandledrejection', (event) => {
//     handleError(event.reason, 'رفض وعد غير معالج');
// });

// console.log('تم تهيئة معالج الأخطاء.');
