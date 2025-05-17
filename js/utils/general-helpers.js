// js/utils/general-helpers.js

/**
 * يؤخر استدعاء دالة، مما يضمن استدعاءها فقط بعد فترة معينة من عدم النشاط.
 * @param {function} func - الدالة المراد تأخير استدعائها.
 * @param {number} delay - مدة التأخير بالمللي ثانية.
 * @returns {function} الدالة المؤجلة.
 */
export function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * يقيد استدعاء دالة، مما يضمن استدعاءها مرة واحدة على الأكثر خلال نافذة زمنية محددة.
 * @param {function} func - الدالة المراد تقييد استدعائها.
 * @param {number} limit - النافذة الزمنية للتقييد بالمللي ثانية.
 * @returns {function} الدالة المقيدة.
 */
export function throttle(func, limit) {
    let inThrottle = false;
    let lastCallArgs = null; // لتخزين آخر وسائط تم استدعاؤها بها
    let lastCallThis = null; // لتخزين السياق الأخير

    const runFunc = (context, args) => {
        func.apply(context, args);
    };

    return function(...args) {
        lastCallArgs = args;
        lastCallThis = this;

        if (!inThrottle) {
            inThrottle = true;
            runFunc(lastCallThis, lastCallArgs);
            setTimeout(() => {
                inThrottle = false;
                // إذا تم استدعاء الدالة مرة أخرى أثناء فترة التقييد، شغلها الآن
                // هذا يضمن أن آخر استدعاء يتم تنفيذه بعد انتهاء المهلة
                if (lastCallArgs) {
                    // runFunc(lastCallThis, lastCallArgs); // هذا قد يسبب استدعاء مزدوج إذا لم يتم إعادة تعيين lastCallArgs
                    // دع الاستدعاء التالي يحدث بشكل طبيعي إذا كان خارج فترة التقييد
                }
            }, limit);
        }
        // إذا كانت الدالة لا تزال مقيدة، سيتم تجاهل الاستدعاءات الحالية
        // ويمكن تعديل هذا السلوك لتخزين آخر استدعاء وتشغيله عند انتهاء التقييد
    };
}


/**
 * ينشئ معرفًا فريدًا بسيطًا.
 * @param {string} [prefix='id_'] - بادئة للمعرف.
 * @returns {string} سلسلة معرف فريدة.
 */
export function uniqueId(prefix = 'id_') {
    return prefix + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * يستنسخ كائنًا أو مصفوفة بشكل عميق باستخدام دوال JSON.
 * ملاحظة: هذه الطريقة لها قيود (مثال: لا يمكن استنساخ الدوال، تصبح التواريخ سلاسل، تتم إزالة undefined).
 * للاستنساخ الأكثر قوة، يلزم مكتبة مخصصة أو دالة تعاودية.
 * @param {object|Array} obj - الكائن أو المصفوفة المراد استنساخها.
 * @returns {object|Array|null} الكائن/المصفوفة المستنسخة، أو null إذا كان الإدخال غير قابل للاستنساخ بهذه الطريقة.
 */
export function simpleDeepClone(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // القيم الأولية أو null
    }
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        console.error("فشل استنساخ الكائن بشكل عميق:", e, obj);
        // كحل احتياطي بسيط، يمكنك محاولة نسخ سطحي للمستوى الأول فقط إذا فشل JSON
        // ولكن هذا قد لا يكون كافيًا للعديد من الحالات.
        // return { ...obj }; // أو Array.from(obj) إذا كانت مصفوفة
        return null;
    }
}

/**
 * يوقف التنفيذ لعدد محدد من المللي ثانية.
 * @param {number} ms - المللي ثانية للإيقاف.
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * يتحقق مما إذا كانت القيمة كائنًا عاديًا (ليس مصفوفة أو null).
 * @param {*} value - القيمة المراد التحقق منها.
 * @returns {boolean} true إذا كانت القيمة كائنًا عاديًا.
 */
export function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    // هذه الطريقة للتحقق من الكائنات العادية هي شائعة وموثوقة
    return Object.prototype.toString.call(value) === '[object Object]';
}
