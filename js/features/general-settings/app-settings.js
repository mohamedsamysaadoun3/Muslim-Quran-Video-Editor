// js/features/general-settings/app-settings.js
// لإعدادات التطبيق العامة الأخرى التي ليست خاصة بالمشروع.
// مثال: فترة الحفظ التلقائي، إظهار التلميحات، إلخ.

import { getItem, setItem } from '../../services/local-storage-service.js';
import eventBus from '../../core/event-bus.js';

const APP_SETTINGS_KEY = 'muslimQuranEditorAppSettings_v1'; // إضافة إصدار للمفتاح

// القيم الافتراضية لإعدادات التطبيق
const defaultAppSettings = {
    autoSaveInterval: 0, // 0 للتعطيل، وإلا بالدقائق (مثلاً 5 دقائق)
    showTooltips: true,  // هل يتم عرض تلميحات الأدوات (titles)
    defaultTheme: 'light', // السمة الافتراضية عند أول استخدام إذا لم يكتشف تفضيل النظام
    // يمكن إضافة المزيد من الإعدادات العامة هنا، مثل:
    // lastOpenedPanel: 'quran-selection-panel', // لتذكر آخر لوحة مفتوحة
    // defaultReciter: 'ar.alafasy', // القارئ الافتراضي للمشاريع الجديدة
};

let currentAppSettings = { ...defaultAppSettings };

/**
 * يحمل إعدادات التطبيق من التخزين المحلي أو يستخدم الإعدادات الافتراضية.
 */
export function loadAppSettings() {
    const savedSettings = getItem(APP_SETTINGS_KEY);
    if (savedSettings && typeof savedSettings === 'object') { // تحقق إضافي من نوع البيانات
        currentAppSettings = { ...defaultAppSettings, ...savedSettings };
    } else {
        // إذا لم تكن هناك إعدادات محفوظة أو كانت غير صالحة، استخدم الافتراضيات واحفظها
        currentAppSettings = { ...defaultAppSettings };
        saveAppSettings(); // حفظ الافتراضيات لأول مرة
    }
    // console.log('تم تحميل إعدادات التطبيق:', currentAppSettings);
    eventBus.emit('appSettingsLoaded', currentAppSettings);
    return currentAppSettings;
}

/**
 * يحفظ إعدادات التطبيق الحالية في التخزين المحلي.
 */
export function saveAppSettings() {
    setItem(APP_SETTINGS_KEY, currentAppSettings);
    // console.log('تم حفظ إعدادات التطبيق.');
    eventBus.emit('appSettingsSaved', currentAppSettings);
}

/**
 * يحصل على قيمة إعداد تطبيق معين.
 * @param {string} key - مفتاح الإعداد.
 * @returns {any} قيمة الإعداد، أو undefined إذا لم يتم العثور عليه في الإعدادات الحالية.
 */
export function getAppSetting(key) {
    return currentAppSettings[key];
}

/**
 * يحدث إعداد تطبيق معين.
 * @param {string} key - مفتاح الإعداد المراد تحديثه.
 * @param {any} value - القيمة الجديدة للإعداد.
 * @param {boolean} [autoSave=true] - هل يتم حفظ جميع الإعدادات بعد هذا التحديث.
 */
export function updateAppSetting(key, value, autoSave = true) {
    // التحقق من أن المفتاح موجود في الإعدادات الافتراضية (لتجنب إضافة مفاتيح عشوائية)
    if (Object.prototype.hasOwnProperty.call(defaultAppSettings, key) || Object.prototype.hasOwnProperty.call(currentAppSettings, key)) {
        currentAppSettings[key] = value;
        eventBus.emit('appSettingChanged', { key, value, newSettings: { ...currentAppSettings } });
        if (autoSave) {
            saveAppSettings();
        }
    } else {
        console.warn(`محاولة تحديث مفتاح إعداد غير معروف: ${key}`);
    }
}

export function initializeAppSettings() {
    loadAppSettings();
    // هنا يمكنك تهيئة أي عناصر واجهة مستخدم متعلقة بإعدادات التطبيق العامة
    // (إذا كان لديك شاشة إعدادات مخصصة في التطبيق).
    // مثال:
    // const autoSaveInput = getElement('auto-save-interval-input');
    // if (autoSaveInput) autoSaveInput.value = getAppSetting('autoSaveInterval');
    // autoSaveInput.addEventListener('change', (e) => updateAppSetting('autoSaveInterval', parseInt(e.target.value)));

    // console.log("تم تهيئة وحدة إعدادات التطبيق.");
}
