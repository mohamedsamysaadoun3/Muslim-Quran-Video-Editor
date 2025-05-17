// js/ui/theme-handler.js
import { LOCAL_STORAGE_THEME_KEY } from '../config/constants.js';
import { getItem, setItem } from '../services/local-storage-service.js';
import { getElement } from '../core/dom-loader.js';
import eventBus from '../core/event-bus.js';

const body = document.body;
const themeToggleInitialBtn = getElement('theme-toggle-initial');
const themeToggleEditorBtn = getElement('theme-toggle-editor');

const THEME_DARK = 'dark-theme';
const THEME_LIGHT = 'light-theme'; // السمة الفاتحة هي الافتراضية، لا تحتاج إلى كلاس خاص أو كلاس 'light-theme'

/**
 * يطبق السمة المحددة على body.
 * @param {string} theme - السمة المراد تطبيقها ('dark-theme' أو 'light-theme').
 */
function applyTheme(theme) {
    body.classList.remove(THEME_DARK, THEME_LIGHT); // إزالة الكلاسات القديمة أولاً
    if (theme === THEME_DARK) {
        body.classList.add(THEME_DARK);
    } else {
        body.classList.add(THEME_LIGHT); // أو إزالة dark-theme إذا كان الفاتح هو غياب dark-theme
    }

    // تحديث نص/أيقونة الزر (مثال باستخدام الرموز التعبيرية)
    const icon = theme === THEME_DARK ? '☀️' : '🌓';
    if (themeToggleInitialBtn) themeToggleInitialBtn.textContent = icon;
    if (themeToggleEditorBtn) themeToggleEditorBtn.textContent = icon;

    // حفظ التفضيل
    setItem(LOCAL_STORAGE_THEME_KEY, theme);
    eventBus.emit('themeChanged', theme); // إطلاق حدث عند تغيير السمة
}

/**
 * يبدل بين السمات الفاتحة والداكنة.
 */
export function toggleTheme() {
    const currentThemeIsDark = body.classList.contains(THEME_DARK);
    applyTheme(currentThemeIsDark ? THEME_LIGHT : THEME_DARK);
}

/**
 * يهيئ السمة بناءً على التفضيل المحفوظ أو تفضيل النظام.
 */
export function initializeTheme() {
    let preferredTheme = getItem(LOCAL_STORAGE_THEME_KEY);

    if (!preferredTheme) {
        // التحقق من تفضيل النظام إذا لم يتم حفظ تفضيل المستخدم
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            preferredTheme = THEME_DARK;
        } else {
            preferredTheme = THEME_LIGHT; // الافتراضي إلى الفاتح
        }
    }
    applyTheme(preferredTheme);

    // الاستماع لتغييرات تفضيل النظام
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const newSystemTheme = e.matches ? THEME_DARK : THEME_LIGHT;
        // طبق سمة النظام فقط إذا لم يتم تعيين تفضيل المستخدم بشكل صريح،
        // أو يمكنك أن تقرر دائمًا اتباع النظام إذا لم يقم المستخدم بالتبديل يدويًا بعد.
        // للتبسيط، لنفترض أنه إذا قام المستخدم بالفعل بتعيين واحدة، فإننا نحتفظ بها.
        // إذا كنت تريده أن يتكيف دائمًا حتى أول تبديل يدوي:
        if (!getItem(LOCAL_STORAGE_THEME_KEY)) { // اتبع النظام فقط إذا لم يختر المستخدم سمة بنفسه
           applyTheme(newSystemTheme);
        }
    });

    // إضافة مستمعي الأحداث إلى الأزرار
    if (themeToggleInitialBtn) {
        themeToggleInitialBtn.addEventListener('click', toggleTheme);
    }
    if (themeToggleEditorBtn) {
        themeToggleEditorBtn.addEventListener('click', toggleTheme);
    }
}

/**
 * يحصل على السمة الحالية.
 * @returns {string} 'dark-theme' أو 'light-theme'.
 */
export function getCurrentTheme() {
    return body.classList.contains(THEME_DARK) ? THEME_DARK : THEME_LIGHT;
}
