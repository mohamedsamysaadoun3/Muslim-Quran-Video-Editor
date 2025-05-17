// js/features/background/background-import.js
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject, setCurrentProject, saveState } from '../../core/state-manager.js';
import { handleError } from '../../core/error-handler.js';
import eventBus from '../../core/event-bus.js';
// updatePreview يتم استدعاؤه عبر eventBus 'backgroundChanged' -> app.js -> updateUIFromProject -> updatePreview
import { clearBackgroundElementsCache } from './background-state.js'; // لمسح الكاش عند تغيير الخلفية


const importBackgroundInput = getElement('import-background');
const backgroundColorPicker = getElement('background-color-picker');

let currentBackgroundObjectURL = null; // لإلغاء صلاحية روابط الكائنات القديمة لملفات المستخدم

export function initializeBackgroundImport() {
    if (importBackgroundInput) {
        importBackgroundInput.addEventListener('change', handleBackgroundFileImport);
    }
    if (backgroundColorPicker) {
        backgroundColorPicker.addEventListener('input', handleBackgroundColorChange);
    }
}

function handleBackgroundFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const project = getCurrentProject();
    const fileType = file.type.split('/')[0]; // 'image' أو 'video'

    // إلغاء صلاحية رابط الكائن السابق إذا كان موجودًا لتحرير الذاكرة
    if (currentBackgroundObjectURL) {
        URL.revokeObjectURL(currentBackgroundObjectURL);
        currentBackgroundObjectURL = null;
    }
    clearBackgroundElementsCache(); // مسح أي عناصر DOM مخزنة مؤقتًا للخلفية (مثل img أو video)

    const objectURL = URL.createObjectURL(file);
    currentBackgroundObjectURL = objectURL; // تخزين لإلغاء الصلاحية مستقبلاً

    if (fileType === 'image') {
        project.backgroundType = 'image';
        project.backgroundImage = objectURL;
        project.backgroundVideo = null;
        project.backgroundAiQuery = null; // مسح استعلام AI إذا تم اختيار ملف
    } else if (fileType === 'video') {
        project.backgroundType = 'video';
        project.backgroundVideo = objectURL;
        project.backgroundImage = null;
        project.backgroundAiQuery = null;
    } else {
        handleError('نوع ملف غير مدعوم للخلفية. الرجاء اختيار صورة أو فيديو.', 'استيراد خلفية');
        eventBus.emit('showNotification', { type: 'error', message: 'نوع ملف غير مدعوم. الرجاء اختيار صورة أو فيديو.' });
        importBackgroundInput.value = ''; // إعادة تعيين إدخال الملف
        return;
    }
    // مسح قيمة منتقي الألوان إذا تم اختيار صورة/فيديو
    // project.backgroundColor = null; // اختياري، قد يرغب المستخدم في الاحتفاظ به كاحتياطي
    if (backgroundColorPicker) backgroundColorPicker.value = project.backgroundColor || '#000000'; // أعد تعيينه إلى اللون الحالي أو الافتراضي


    setCurrentProject(project, false);
    saveState("تم استيراد ملف الخلفية: " + file.name);
    eventBus.emit('backgroundChanged', project);
}

function handleBackgroundColorChange(event) {
    const project = getCurrentProject();
    project.backgroundType = 'color';
    project.backgroundColor = event.target.value;
    project.backgroundImage = null;
    project.backgroundVideo = null;
    project.backgroundAiQuery = null;

    if (currentBackgroundObjectURL) {
        URL.revokeObjectURL(currentBackgroundObjectURL);
        currentBackgroundObjectURL = null;
    }
    clearBackgroundElementsCache();
    if (importBackgroundInput) importBackgroundInput.value = ''; // مسح اختيار الملف

    setCurrentProject(project, false);
    saveState("تم تغيير لون الخلفية: " + project.backgroundColor);
    eventBus.emit('backgroundChanged', project);
}

/**
 * يطبق خلفية من اقتراح AI أو أي مصدر خارجي.
 * @param {{type: 'image'|'video'|'color', url?: string, color?: string, source?: string, originalUrl?: string, id?: string|number, alt?: string}} bgData
 */
export function applyBackground(bgData) {
    const project = getCurrentProject();

    if (currentBackgroundObjectURL) {
        URL.revokeObjectURL(currentBackgroundObjectURL);
        currentBackgroundObjectURL = null;
    }
    clearBackgroundElementsCache();
    if (importBackgroundInput) importBackgroundInput.value = '';


    switch (bgData.type) {
        case 'image':
            project.backgroundType = 'image';
            project.backgroundImage = bgData.url;
            project.backgroundVideo = null;
            project.backgroundAiQuery = bgData.source === 'pexels' ? (bgData.alt || `pexels-img-${bgData.id}`) : null;
            // project.backgroundColor = null; // أو الاحتفاظ به
            if (backgroundColorPicker) backgroundColorPicker.value = project.backgroundColor || '#000000';
            break;
        case 'video':
            project.backgroundType = 'video';
            project.backgroundVideo = bgData.url;
            project.backgroundImage = null;
            project.backgroundAiQuery = bgData.source === 'pexels' ? (bgData.alt || `pexels-vid-${bgData.id}`) : null;
            // project.backgroundColor = null;
            if (backgroundColorPicker) backgroundColorPicker.value = project.backgroundColor || '#000000';
            break;
        case 'color':
            project.backgroundType = 'color';
            project.backgroundColor = bgData.color;
            project.backgroundImage = null;
            project.backgroundVideo = null;
            project.backgroundAiQuery = null;
            if(backgroundColorPicker) backgroundColorPicker.value = bgData.color;
            break;
        default:
            handleError('نوع خلفية غير صالح في applyBackground.', 'تطبيق خلفية');
            return;
    }

    setCurrentProject(project, false);
    saveState(`تم تطبيق الخلفية: ${bgData.type} ${bgData.url || bgData.color}`);
    eventBus.emit('backgroundChanged', project);
}

/**
 * يحدث عناصر واجهة المستخدم الخاصة بالخلفية (مثل منتقي الألوان) بناءً على حالة المشروع.
 * @param {object} project - بيانات المشروع الحالية.
 */
export function updateBackgroundUIFromProject(project) {
    if (backgroundColorPicker) {
        if (project.backgroundType === 'color' && project.backgroundColor) {
            backgroundColorPicker.value = project.backgroundColor;
        } else {
            // إذا كانت الخلفية صورة أو فيديو، قد نرغب في عرض اللون الاحتياطي (إذا كان موجودًا) أو لون افتراضي
            // backgroundColorPicker.value = project.backgroundColor || DEFAULT_BACKGROUND_COLOR; // استخدم اللون المحفوظ أو الافتراضي
        }
    }
    // لا يمكن ملء إدخال الملف مسبقًا لأسباب أمنية.
    // إذا كان currentBackgroundObjectURL لا يزال مضبوطًا ولكن نوع الخلفية ليس ملفًا، قم بإلغاء صلاحيته
    if (currentBackgroundObjectURL && (project.backgroundType === 'color' || (project.backgroundImage && project.backgroundImage !== currentBackgroundObjectURL) || (project.backgroundVideo && project.backgroundVideo !== currentBackgroundObjectURL))) {
        URL.revokeObjectURL(currentBackgroundObjectURL);
        currentBackgroundObjectURL = null;
    }
}
