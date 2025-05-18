// js/app.js - نقطة الانطلاق الرئيسية (مُركّز ومُفحوص)
// الهدف: تشغيل زر "إنشاء فيديو جديد" والانتقال بين الشاشات، وتشغيل تبديل الثيم.

import { getElement } from './core/dom-loader.js';
import { initializeTheme, toggleTheme } from './ui/theme-handler.js';

// --- متغيرات عامة لعناصر DOM الرئيسية ---
let initialScreenEl = null;
let editorScreenEl = null;
let goToEditorBtnEl = null;
let backToInitialScreenBtnEl = null;
let themeToggleInitialBtnEl = null;
let themeToggleEditorBtnEl = null; // زر الثيم في شاشة المحرر

/**
 * جلب وتخزين مراجع عناصر DOM الرئيسية.
 * يُستدعى مرة واحدة بعد تحميل DOM.
 */
function cacheDOMElements() {
    console.log("APP.JS: Caching DOM elements...");
    initialScreenEl = getElement('initial-screen');
    editorScreenEl = getElement('editor-screen');
    goToEditorBtnEl = getElement('go-to-editor-btn');
    backToInitialScreenBtnEl = getElement('back-to-initial-screen-btn');
    themeToggleInitialBtnEl = getElement('theme-toggle-initial');
    themeToggleEditorBtnEl = getElement('theme-toggle-editor');

    // تحقق بسيط من وجود العناصر الأساسية جدًا
    if (!initialScreenEl || !editorScreenEl || !goToEditorBtnEl) {
        console.error("APP.JS: خطأ فادح! واحد أو أكثر من عناصر الشاشة الرئيسية أو زر الإنشاء مفقود.");
        alert("خطأ في تهيئة التطبيق. بعض العناصر الأساسية مفقودة. يرجى التحقق من الـ Console.");
    }
    console.log("APP.JS: DOM elements cached.");
}

/**
 * التبديل إلى شاشة المحرر.
 */
function switchToEditorScreen() {
    if (initialScreenEl && editorScreenEl) {
        initialScreenEl.classList.remove('active-screen');
        initialScreenEl.style.display = 'none';

        editorScreenEl.classList.add('active-screen');
        editorScreenEl.style.display = 'flex'; // أو 'block' حسب CSS لشاشة المحرر
        console.log("APP.JS: Switched to Editor Screen.");

        // لاحقًا، هنا سنستدعي updateUIFromProject(currentProject) و openPanel()
    } else {
        console.error("APP.JS: Cannot switch to editor screen, screen elements not found.");
    }
}

/**
 * التبديل إلى الشاشة الأولية.
 */
function switchToInitialScreen() {
    if (initialScreenEl && editorScreenEl) {
        editorScreenEl.classList.remove('active-screen');
        editorScreenEl.style.display = 'none';

        initialScreenEl.classList.add('active-screen');
        initialScreenEl.style.display = 'flex';
        console.log("APP.JS: Switched to Initial Screen.");
        // لاحقًا: refreshProjectsListView(); closeAllPanels();
    } else {
        console.error("APP.JS: Cannot switch to initial screen, screen elements not found.");
    }
}

/**
 * تهيئة مستمعي الأحداث للأزرار الرئيسية.
 */
function initializeEventListeners() {
    console.log("APP.JS: Initializing event listeners...");

    if (goToEditorBtnEl) {
        goToEditorBtnEl.addEventListener('click', () => {
            console.log("APP.JS: 'Create New Video' button clicked.");
            // الخطوة التالية: استدعاء دالة لإنشاء مشروع جديد فعليًا
            // مثل: import { createAndEditNewProject } from './features/project/project-actions.js';
            //       createAndEditNewProject();
            // حاليًا، فقط التبديل:
            switchToEditorScreen();
        });
        console.log("APP.JS: Event listener attached to 'go-to-editor-btn'.");
    } else {
        // تم التحقق منه في cacheDOMElements
    }

    if (backToInitialScreenBtnEl) {
        backToInitialScreenBtnEl.addEventListener('click', () => {
            console.log("APP.JS: 'Back' button clicked.");
            // لاحقًا: سؤال الحفظ
            switchToInitialScreen();
        });
        console.log("APP.JS: Event listener attached to 'back-to-initial-screen-btn'.");
    }

    if (themeToggleInitialBtnEl) {
        themeToggleInitialBtnEl.addEventListener('click', () => {
            console.log("APP.JS: Theme toggle (initial) clicked.");
            toggleTheme();
        });
        console.log("APP.JS: Event listener attached to 'theme-toggle-initial'.");
    }

    if (themeToggleEditorBtnEl) {
        themeToggleEditorBtnEl.addEventListener('click', () => {
            console.log("APP.JS: Theme toggle (editor) clicked.");
            toggleTheme();
        });
        console.log("APP.JS: Event listener attached to 'theme-toggle-editor'.");
    }
    console.log("APP.JS: Event listeners initialized.");
}

/**
 * الدالة الرئيسية لتهيئة التطبيق.
 */
function initializeApp() {
    console.log("APP.JS: Initializing App...");

    cacheDOMElements(); // جلب عناصر DOM أولاً

    try {
        initializeTheme(); // تهيئة وتطبيق الثيم
    } catch (e) {
        console.error("APP.JS: Error during theme initialization:", e);
    }
    
    initializeEventListeners(); // ربط الأحداث بالأزرار الموجودة

    // تأكد من أن الشاشة الأولية هي المعروضة بشكل صحيح
    if (initialScreenEl && editorScreenEl) {
        if (!initialScreenEl.classList.contains('active-screen')) {
            initialScreenEl.classList.add('active-screen');
        }
        initialScreenEl.style.display = 'flex'; // تأكد من أنها مرئية
        
        editorScreenEl.classList.remove('active-screen');
        editorScreenEl.style.display = 'none'; // تأكد من أنها مخفية
    }

    console.log("APP.JS: App initialization complete.");
    // يمكنك إضافة alert هنا إذا أردت تأكيدًا مرئيًا فوريًا
    // alert("تم تحميل التطبيق الأساسي. تحقق من الـ Console للمزيد من المعلومات.");
}

// --- نقطة انطلاق التطبيق ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
