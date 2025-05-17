// js/ui/notifications.js
import eventBus from '../core/event-bus.js';
import { $, getElement } from '../core/dom-loader.js';

// هذا بديل لنظام إشعارات أكثر قوة.
// في تطبيق حقيقي، قد تستخدم مكتبة مثل Toastify أو Noty أو حلًا مخصصًا.

let notificationElement = null; // سيتم إنشاؤه ديناميكيًا أو استخدام عنصر موجود
let currentNotificationTimeout = null; // لتتبع مؤقت الإخفاء الحالي

function ensureNotificationElement() {
    if (!notificationElement) {
        const existing = getElement('app-notification-bar'); // تحقق مما إذا كان موجودًا في HTML
        if (existing) {
            notificationElement = existing;
        } else {
            // إنشاء شريط إشعارات بسيط ديناميكيًا
            notificationElement = document.createElement('div');
            notificationElement.id = 'app-notification-bar';
            // تطبيق الأنماط الأساسية (يمكن تحسينها في CSS)
            Object.assign(notificationElement.style, {
                position: 'fixed',
                bottom: '70px', // فوق شريط التبويب + مسافة صغيرة
                left: '50%',
                transform: 'translateX(-50%) translateY(100%)', // يبدأ من الأسفل مخفيًا
                padding: '12px 25px',
                backgroundColor: 'var(--primary-color)', // لون افتراضي
                color: 'white',
                borderRadius: 'var(--border-radius-medium)',
                boxShadow: 'var(--shadow-strong)',
                zIndex: '10001', // فوق مؤشر التحميل
                display: 'none', // مخفي بشكل افتراضي
                textAlign: 'center',
                fontSize: '0.9rem',
                opacity: '0',
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                maxWidth: '90%',
                boxSizing: 'border-box'
            });
            getElement('app-container').appendChild(notificationElement);
        }
    }
}


/**
 * يعرض رسالة إشعار.
 * @param {object} options - خيارات الإشعار.
 * @param {string} options.message - الرسالة المراد عرضها.
 * @param {'info'|'success'|'warning'|'error'} [options.type='info'] - نوع الإشعار.
 * @param {number} [options.duration=3000] - المدة بالمللي ثانية قبل الإخفاء التلقائي. 0 للإشعار الدائم.
 */
export function showNotification({ message, type = 'info', duration = 3000 }) {
    // console.log(`إشعار [${type}]: ${message}`);
    ensureNotificationElement();

    if (!notificationElement) { // احتياطي إذا فشل إنشاء العنصر
        alert(`[${type.toUpperCase()}] ${message}`);
        return;
    }

    // مسح أي مؤقت إخفاء سابق
    if (currentNotificationTimeout) {
        clearTimeout(currentNotificationTimeout);
        currentNotificationTimeout = null;
    }

    notificationElement.textContent = message;
    notificationElement.style.display = 'block'; // اجعله مرئيًا قبل بدء التحريك

    // تعيين اللون بناءً على النوع
    switch (type) {
        case 'success':
            notificationElement.style.backgroundColor = 'var(--primary-color)';
            notificationElement.style.color = 'var(--current-button-primary-text-color)'; // ضمان التباين
            break;
        case 'warning':
            notificationElement.style.backgroundColor = 'var(--secondary-color)';
            notificationElement.style.color = 'var(--text-color-light)'; // نص داكن على كهرماني
            break;
        case 'error':
            notificationElement.style.backgroundColor = '#e53935'; // أحمر
            notificationElement.style.color = 'white';
            break;
        case 'info':
        default:
            notificationElement.style.backgroundColor = '#546e7a'; // رمادي مزرق
            notificationElement.style.color = 'white';
            break;
    }
    
    // تأخير بسيط للسماح للمتصفح بتطبيق display: block قبل التحريك
    setTimeout(() => {
        notificationElement.style.opacity = '1';
        notificationElement.style.transform = 'translateX(-50%) translateY(0)';
    }, 20);


    if (duration > 0) {
        currentNotificationTimeout = setTimeout(() => {
            hideNotification();
        }, duration);
    }
}

export function hideNotification() {
    if (notificationElement && notificationElement.style.display !== 'none') {
        notificationElement.style.opacity = '0';
        notificationElement.style.transform = 'translateX(-50%) translateY(100%)'; // تحريك للأسفل عند الإخفاء
        
        if (currentNotificationTimeout) { // مسح المؤقت إذا تم الإخفاء يدويًا أو عبر استدعاء آخر
            clearTimeout(currentNotificationTimeout);
            currentNotificationTimeout = null;
        }
        
        // انتظر انتهاء التحريك قبل تعيين display: none
        setTimeout(() => {
            // تحقق مرة أخرى من الشفافية قبل الإخفاء، ربما تم عرض إشعار جديد
            if (notificationElement.style.opacity === '0') { 
                 notificationElement.style.display = 'none';
            }
        }, 350); // مدة أطول قليلاً من مدة التحريك CSS
    }
}

/**
 * يهيئ نظام الإشعارات، بشكل أساسي عن طريق الاستماع إلى event bus.
 */
export function initializeNotifications() {
    eventBus.on('showNotification', (options) => {
        showNotification(options);
    });
    // console.log('تم تهيئة نظام الإشعارات.');
}
