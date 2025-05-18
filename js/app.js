// js/app.js (نسخة مبسطة للتشخيص - مع alert)
alert("APP.JS LOADED AND EXECUTING!"); // <--- هذا هو السطر الجديد والمهم

import { getElement } from './core/dom-loader.js';
import { initializeTheme, toggleTheme } from './ui/theme-handler.js';
// ... باقي الكود المبسّط ...
// js/app.js - نقطة الانطلاق الرئيسية (نسخة معدلة للتشخيص والحل الجذري)

// --- الاستيرادات الأساسية جدًا للبدء ---
import { getElement } from './core/dom-loader.js';
import { initializeTheme, toggleTheme } from './ui/theme-handler.js';
// سنقوم باستيراد الوحدات الأخرى تدريجيًا عندما نتأكد أن الأساس يعمل

// --- تعريف العناصر الأساسية للواجهة ---
let initialScreen = null;
let editorScreen = null;
let goToEditorBtn = null;
let backToInitialScreenBtn = null;
let themeToggleInitialBtn = null;
let themeToggleEditorBtn = null;
// المزيد من العناصر سيتم تعريفها عند الحاجة

/**
 * دالة لتهيئة عناصر DOM الرئيسية.
 * يتم استدعاؤها بعد تحميل DOM.
 */
function cacheDOMElements() {
    console.log("APP: cacheDOMElements - بدء جلب عناصر DOM...");
    initialScreen = getElement('initial-screen');
    editorScreen = getElement('editor-screen');
    goToEditorBtn = getElement('go-to-editor-btn');
    backToInitialScreenBtn = getElement('back-to-initial-screen-btn');
    themeToggleInitialBtn = getElement('theme-toggle-initial');
    themeToggleEditorBtn = getElement('theme-toggle-editor');

    // التحقق من وجود العناصر الأساسية
    if (!initialScreen) console.error("APP: cacheDOMElements - خطأ فادح: initialScreen غير موجود!");
    if (!editorScreen) console.error("APP: cacheDOMElements - خطأ فادح: editorScreen غير موجود!");
    if (!goToEditorBtn) console.error("APP: cacheDOMElements - خطأ فادح: goToEditorBtn غير موجود!");
    // backToInitialScreenBtn و themeToggleEditorBtn قد لا يكونا بنفس الأهمية في البداية
    if (!backToInitialScreenBtn) console.warn("APP: cacheDOMElements - تنبيه: backToInitialScreenBtn غير موجود.");
    if (!themeToggleInitialBtn) console.error("APP: cacheDOMElements - خطأ: themeToggleInitialBtn غير موجود!");

    console.log("APP: cacheDOMElements - اكتمل جلب عناصر DOM.");
}


/**
 * دالة للانتقال إلى شاشة المحرر
 */
function switchToEditorScreen() {
    if (initialScreen && editorScreen) {
        initialScreen.classList.remove('active-screen');
        initialScreen.style.display = 'none';

        editorScreen.classList.add('active-screen');
        editorScreen.style.display = 'flex'; // أو 'block' حسب CSS
        console.log("APP: تم التبديل إلى شاشة المحرر.");
        // هنا لاحقًا سنضيف: updateUIFromProject(getCurrentProject());
        // وهنا لاحقًا سنضيف: openPanel('quran-selection-panel');
    } else {
        console.error("APP: switchToEditorScreen - خطأ: الشاشة الأولية أو شاشة المحرر غير معرفة!");
    }
}

/**
 * دالة للانتقال إلى الشاشة الأولية
 */
function switchToInitialScreen() {
    if (initialScreen && editorScreen) {
        editorScreen.classList.remove('active-screen');
        editorScreen.style.display = 'none';

        initialScreen.classList.add('active-screen');
        initialScreen.style.display = 'flex';
        console.log("APP: تم التبديل إلى الشاشة الأولية.");
        // هنا لاحقًا سنضيف: refreshProjectsListView();
        // وهنا لاحقًا سنضيف: closeAllPanels();
    } else {
        console.error("APP: switchToInitialScreen - خطأ: الشاشة الأولية أو شاشة المحرر غير معرفة!");
    }
}

/**
 * دالة تهيئة مستمعي الأحداث الأساسية.
 */
function initializeCoreEventListeners() {
    console.log("APP: initializeCoreEventListeners - بدء تهيئة مستمعي الأحداث...");

    if (themeToggleInitialBtn) {
        themeToggleInitialBtn.addEventListener('click', () => {
            console.log("APP: زر تبديل الثيم (الأولي) تم النقر عليه.");
            try {
                toggleTheme();
            } catch (e) {
                console.error("APP: خطأ عند تبديل الثيم:", e);
            }
        });
        console.log("APP: تم ربط مستمع لزر 'theme-toggle-initial'.");
    }

    // زر تبديل الثيم في شاشة المحرر (إذا وجد)
    if (themeToggleEditorBtn) {
         themeToggleEditorBtn.addEventListener('click', () => {
            console.log("APP: زر تبديل الثيم (المحرر) تم النقر عليه.");
            try {
                toggleTheme();
            } catch (e) {
                console.error("APP: خطأ عند تبديل الثيم من المحرر:", e);
            }
        });
        console.log("APP: تم ربط مستمع لزر 'theme-toggle-editor'.");
    }


    if (goToEditorBtn) {
        goToEditorBtn.addEventListener('click', () => {
            console.log("APP: زر 'إنشاء فيديو جديد' تم النقر عليه.");
            // --- هذا هو المكان الذي سنضيف فيه منطق إنشاء المشروع لاحقًا ---
            // حاليًا، سنقوم بالتبديل مباشرة
            // 1. لاحقًا: استدعاء دالة من project-actions.js مثل handleCreateNewProjectClick()
            // 2. هذه الدالة ستقوم بـ:
            //    - عرض showPrompt لاسم المشروع
            //    - إنشاء كائن مشروع جديد
            //    - setCurrentProject(newProject)
            //    - saveProjectToStorage(newProject)
            //    - refreshProjectsListView()
            //    - switchToEditorScreen() // هذه الدالة ستقوم بتحديث الواجهة وفتح اللوحة
            
            // للتشخيص الآن، فقط التبديل:
            switchToEditorScreen(); 
            // لاحقًا، بعد أن يعمل هذا، سنضيف استدعاء لـ updateUIFromProject و openPanel
            // داخل switchToEditorScreen أو بعدها مباشرة.
        });
        console.log("APP: تم ربط مستمع لزر 'go-to-editor-btn'.");
    }

    if (backToInitialScreenBtn) {
        backToInitialScreenBtn.addEventListener('click', () => {
            console.log("APP: زر 'العودة' تم النقر عليه.");
            // لاحقًا: إضافة منطق سؤال الحفظ
            switchToInitialScreen();
        });
        console.log("APP: تم ربط مستمع لزر 'back-to-initial-screen-btn'.");
    }
    console.log("APP: initializeCoreEventListeners - اكتملت تهيئة مستمعي الأحداث.");
}


/**
 * الدالة الرئيسية لتهيئة التطبيق.
 */
async function mainAppInitializer() {
    console.log("APP: mainAppInitializer - بدء تهيئة التطبيق...");

    // 0. جلب عناصر DOM أولاً وقبل كل شيء
    cacheDOMElements();

    // 1. تهيئة الثيم (يعتمد على body و localStorage فقط)
    try {
        initializeTheme(); // هذه الدالة يجب أن تطبق الثيم المحفوظ أو الافتراضي
        console.log("APP: mainAppInitializer - تم تهيئة الثيم.");
    } catch (e) {
        console.error("APP: mainAppInitializer - خطأ فادح أثناء تهيئة الثيم:", e);
        alert("حدث خطأ أثناء تحميل إعدادات المظهر. قد لا يعمل التطبيق بشكل صحيح.");
        // قد يكون من المناسب إيقاف باقي التهيئة هنا إذا كان الثيم ضروريًا جدًا
    }

    // 2. تهيئة مستمعي الأحداث الأساسية (للأزرار الموجودة في HTML مباشرة)
    initializeCoreEventListeners();
    
    // 3. تأكد من أن الشاشة الأولية هي المعروضة في البداية
    // هذا تم نقله إلى initializeCoreEventListeners لضمان حدوثه بعد cacheDOMElements
    // ولكن يمكن التأكيد عليه هنا أيضًا
    if (initialScreen && editorScreen) {
        initialScreen.style.display = 'flex';
        initialScreen.classList.add('active-screen');
        editorScreen.style.display = 'none';
        editorScreen.classList.remove('active-screen');
    } else {
        console.error("APP: mainAppInitializer - لا يمكن ضبط الشاشات الأولية لأن العناصر غير موجودة!");
    }


    // --- هنا سنبدأ بإضافة تهيئة الوحدات الأخرى تدريجيًا ---
    // مثال:
    // console.log("APP: mainAppInitializer - تهيئة PanelManager...");
    // try {
    //     initializePanelManager(); // افترض أن هذا الملف موجود وسليم
    // } catch (e) { console.error("APP: خطأ في تهيئة PanelManager:", e); }

    // console.log("APP: mainAppInitializer - تهيئة ProjectActions (بدون استدعاء تحميل البيانات بعد)...");
    // try {
    //     initializeProjectActions(); // هذا سيربط الأحداث مثل delete, duplicate (لا تستدعي createAndEditNewProject من هنا مباشرة)
    // } catch (e) { console.error("APP: خطأ في تهيئة ProjectActions:", e); }
    
    // ... وهكذا

    console.log("APP: mainAppInitializer - اكتملت التهيئة الأساسية. الوظائف الكاملة ستُضاف تدريجيًا.");
    alert("تم تحميل التطبيق بوضع التشخيص الأساسي. زر 'إنشاء فيديو جديد' وزر تبديل الثيم يجب أن يعملا الآن بشكل مبدئي.");
}

// --- نقطة انطلاق التطبيق ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mainAppInitializer);
} else {
    mainAppInitializer();
}
