// js/utils/text-utils.js

/**
 * يلتف النص ليناسب عرضًا أقصى على كانفاس.
 * يعيد مصفوفة من الأسطر.
 * يأخذ في الاعتبار الكلمات العربية التي لا يجب كسرها بشكل خاطئ.
 *
 * @param {CanvasRenderingContext2D} ctx - سياق عرض الكانفاس (لقياس النص).
 * @param {string} text - النص المراد لفه.
 * @param {number} maxWidth - أقصى عرض يمكن أن يشغله السطر.
 * @returns {string[]} مصفوفة من السلاسل، حيث كل سلسلة هي سطر من النص الملفوف.
 */
export function wrapTextOnCanvas(ctx, text, maxWidth) {
    if (!text || text.trim() === '') return [''];
    if (maxWidth <= 0) return [text];

    const lines = [];
    // تقسيم النص مع الحفاظ على المسافات والنقاط التي قد تشير إلى نهاية جملة طبيعية
    // هذا التقسيم مبسط وقد يحتاج لتحسين للتعامل مع علامات الترقيم بشكل أفضل
    const words = text.split(/(\s+|،|\.|؟|!)/g).filter(word => word.length > 0);
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        // إذا كانت الكلمة مجرد مسافة أو علامة ترقيم، حاول إضافتها إلى السطر الحالي
        if (word.match(/^(\s+|،|\.|؟|!)$/)) {
            if (ctx.measureText(currentLine + word).width <= maxWidth) {
                currentLine += word;
            } else {
                // إذا لم تتسع علامة الترقيم، ضعها في سطر جديد (أو السطر السابق إذا كان فارغًا)
                if (currentLine.trim() !== "") lines.push(currentLine.trim());
                currentLine = word.trim(); // ابدأ سطر جديد بعلامة الترقيم (قد يكون غريبًا بصريًا)
                                       // الأفضل هو محاولة عدم كسر السطر قبل علامة الترقيم مباشرة
            }
            continue;
        }

        const testLine = currentLine + (currentLine ? " " : "") + word; // أضف مسافة إذا لم يكن السطر فارغًا

        if (ctx.measureText(testLine).width > maxWidth && currentLine !== "") {
            lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine.trim() !== "") {
        lines.push(currentLine.trim());
    }
    
    return lines.length > 0 ? lines : ['']; // تأكد من إرجاع مصفوفة تحتوي على سلسلة فارغة على الأقل
}


/**
 * ينظف النص العربي بإزالة التشكيل والتطويل (الكشيدة).
 * مفيد للبحث أو المقارنات البسيطة.
 * @param {string} text - النص العربي.
 * @returns {string} النص المنظف.
 */
export function normalizeArabicText(text) {
    if (!text) return "";
    // إزالة التشكيل (الحركات)
    text = text.replace(/[\u0617-\u061A\u064B-\u0652\u0657-\u065F]/g, "");
    // إزالة التطويل (الكشيدة)
    text = text.replace(/\u0640/g, "");
    // تطبيع متغيرات الألف إلى ألف عادية
    text = text.replace(/[\u0622\u0623\u0625]/g, "\u0627");
    // تطبيع التاء المربوطة إلى هاء
    text = text.replace(/\u0629/g, "\u0647");
    // تطبيع الياء المقصورة إلى ياء عادية
    text = text.replace(/\u0649/g, "\u064A");
    
    return text;
}


/**
 * كشف بسيط لاتجاه النص من اليمين إلى اليسار (RTL).
 * يتحقق مما إذا كان أول حرف قوي RTL يظهر قبل أول حرف قوي LTR.
 * قد يتطلب الكشف الأكثر قوة مكتبة.
 * @param {string} text
 * @returns {boolean} true إذا كان من المحتمل أن يكون RTL، false خلاف ذلك.
 */
export function isRTL(text) {
    if (!text) return false; // الافتراضي إلى LTR للسلاسل الفارغة أو null
    // تعبير نمطي للأحرف القوية RTL (العربية، العبرية، إلخ.)
    const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    // تعبير نمطي للأحرف القوية LTR (اللاتينية الأساسية، السيريلية، اليونانية، إلخ.)
    // هذا تبسيط؛ يحتوي Unicode على العديد من النصوص LTR.
    const ltrChars = /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0370-\u03FF\u0400-\u052F]/;

    const firstRTL = text.search(rtlChars);
    const firstLTR = text.search(ltrChars);

    if (firstRTL === -1 && firstLTR === -1) {
        // إذا لم تكن هناك أحرف ذات اتجاه قوي، افترض LTR أو بناءً على لغة التطبيق
        return document.documentElement.dir === 'rtl'; // تحقق من اتجاه المستند ككل
    }
    if (firstRTL === -1) return false; // فقط أحرف LTR
    if (firstLTR === -1) return true;  // فقط أحرف RTL

    return firstRTL < firstLTR; // إذا ظهر حرف RTL أولاً
}
