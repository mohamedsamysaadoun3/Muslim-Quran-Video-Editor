// js/ui/theme-handler.js
import { getElement } from '../core/dom-loader.js';

const body = document.body;
const THEME_LIGHT_CLASS = 'light-theme'; // الكلاس الذي يطبق السمة الفاتحة
const LOCAL_STORAGE_THEME_KEY = 'muslimQuranEditorThemePreference';

function applyTheme(theme) {
    console.log(`THEME HANDLER: Applying theme - ${theme}`);
    body.classList.remove(THEME_LIGHT_CLASS); // إزالة الكلاس الفاتح دائمًا
    // لا حاجة لكلاس dark-theme إذا كان المظلم هو الافتراضي في CSS الأساسي

    if (theme === 'light') {
        body.classList.add(THEME_LIGHT_CLASS);
    }
    // إذا كان 'dark'، لا نفعل شيئًا بخصوص الكلاسات، سيعتمد على CSS الافتراضي

    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);

    const themeToggleInitialBtn = getElement('theme-toggle-initial');
    const themeToggleEditorBtn = getElement('theme-toggle-editor');
    const icon = theme === 'light' ? '🌓' : '☀️'; // أيقونة الشمس تعني "الوضع الحالي مظلم، اضغط للفاتح" والعكس

    if (themeToggleInitialBtn) themeToggleInitialBtn.textContent = icon;
    if (themeToggleEditorBtn) themeToggleEditorBtn.textContent = icon;
}

export function toggleTheme() {
    // إذا كان الكلاس light-theme موجودًا، فالثيم الحالي فاتح، والعكس صحيح
    const isCurrentlyLight = body.classList.contains(THEME_LIGHT_CLASS);
    const newTheme = isCurrentlyLight ? 'dark' : 'light';
    console.log(`THEME HANDLER: Toggling theme from ${isCurrentlyLight ? 'light' : 'dark'} to ${newTheme}`);
    applyTheme(newTheme);
}

export function initializeTheme() {
    console.log("THEME HANDLER: Initializing theme...");
    let preferredTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    if (!preferredTheme) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            preferredTheme = 'dark';
            console.log("THEME HANDLER: System preference is dark.");
        } else {
            preferredTheme = 'light';
            console.log("THEME HANDLER: System preference is light or not detected, defaulting to light.");
        }
    } else {
        console.log("THEME HANDLER: Found saved theme preference:", preferredTheme);
    }
    applyTheme(preferredTheme);

    // الاستماع لتغييرات تفضيل النظام (اختياري)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(LOCAL_STORAGE_THEME_KEY)) { // طبق فقط إذا لم يختر المستخدم يدويًا
            const systemTheme = e.matches ? 'dark' : 'light';
            console.log("THEME HANDLER: System theme changed to:", systemTheme);
            applyTheme(systemTheme);
        }
    });
    console.log("THEME HANDLER: Theme initialized.");
}
