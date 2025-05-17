// js/core/event-bus.js

/**
 * تطبيق بسيط لـ Event Bus (نمط النشر/الاشتراك Pub/Sub).
 * يسمح لأجزاء مختلفة من التطبيق بالتواصل دون تبعيات مباشرة.
 */
class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * الاشتراك في حدث.
     * @param {string} eventName - اسم الحدث.
     * @param {function} callback - الدالة التي يتم استدعاؤها عند إطلاق الحدث.
     * @returns {function} دالة لإلغاء الاشتراك.
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);

        // إرجاع دالة لإلغاء الاشتراك
        return () => {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        };
    }

    /**
     * إطلاق حدث.
     * @param {string} eventName - اسم الحدث.
     * @param {*} data - البيانات التي يتم تمريرها إلى مستمعي الحدث.
     */
    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`خطأ في مستمع الحدث لـ ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * إلغاء الاشتراك في حدث.
     * @param {string} eventName - اسم الحدث.
     * @param {function} callback - رد النداء المحدد للإزالة.
     */
    off(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
    }

    /**
     * الاشتراك في حدث مرة واحدة فقط. يتم إزالة المستمع تلقائيًا بعد أول إطلاق.
     * @param {string} eventName - اسم الحدث.
     * @param {function} callback - الدالة التي يتم استدعاؤها.
     */
    once(eventName, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(eventName, onceCallback);
        };
        this.on(eventName, onceCallback);
    }
}

// إنشاء نسخة عامة من EventBus
const eventBus = new EventBus();

export default eventBus;
