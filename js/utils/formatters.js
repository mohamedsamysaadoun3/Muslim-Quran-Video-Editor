// js/utils/formatters.js

/**
 * ينسق الوقت بالثواني إلى سلسلة MM:SS أو HH:MM:SS.
 * @param {number} totalSeconds - إجمالي الثواني للتنسيق.
 * @returns {string} سلسلة الوقت المنسقة.
 */
export function formatTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "0:00";
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedSeconds = String(seconds).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');

    if (hours > 0) {
        // لا حاجة لـ padStart للساعات إذا كانت قليلة، ولكن للتناسق يمكن إضافتها
        const paddedHours = String(hours).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${minutes}:${paddedSeconds}`;
}


/**
 * ينسق كائن تاريخ إلى سلسلة "منذ وقت" سهلة القراءة.
 * مثال: "الآن", "منذ 5 دقائق", "منذ ساعة", "أمس", "منذ 3 أيام", "في 5 يناير، 2023".
 * @param {Date|string} dateInput - التاريخ للتنسيق (كائن Date أو سلسلة ISO).
 * @returns {string} سلسلة "منذ وقت" المنسقة.
 */
export function formatTimeAgo(dateInput) {
    const date = (typeof dateInput === 'string') ? new Date(dateInput) : dateInput;
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "تاريخ غير معروف";
    }

    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    // const months = Math.round(days / 30.44); // متوسط عدد الأيام في الشهر
    // const years = Math.round(days / 365.25); // مراعاة السنوات الكبيسة

    if (seconds < 5) return "الآن";
    if (seconds < 60) return `منذ ${seconds} ثوانٍ`; // إضافة "ٍ" لـ "ثوان"
    if (minutes === 1) return `منذ دقيقة واحدة`;
    if (minutes < 60) return `منذ ${minutes} دقائق`;
    if (hours === 1) return `منذ ساعة واحدة`;
    if (hours < 24) return `منذ ${hours} ساعات`;
    if (days === 1) return "أمس";
    if (days < 7) return `منذ ${days} أيام`;
    
    // للتواريخ الأقدم، اعرض التاريخ الفعلي
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
        // استخدام ar-EG (مصر) لتنسيق التاريخ العربي الشائع، أو ar-SA (السعودية)
        return `في ${date.toLocaleDateString('ar-EG', options)}`; 
    } catch (e) {
         // تنسيق احتياطي بسيط إذا فشل toLocaleDateString
         return `في ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }
}

/**
 * يحول الحرف الأول من السلسلة إلى حرف كبير (مفيد للنصوص الإنجليزية).
 * @param {string} str
 * @returns {string}
 */
export function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * يقطع سلسلة إلى طول معين ويضيف علامة حذف (...).
 * @param {string} str - السلسلة المراد قطعها.
 * @param {number} [maxLength=100] - الطول الأقصى المسموح به قبل القطع.
 * @returns {string} السلسلة المقطوعة أو الأصلية إذا كانت أقصر.
 */
export function truncateString(str, maxLength = 100) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '…';
}
