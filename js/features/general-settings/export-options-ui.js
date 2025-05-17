// js/features/general-settings/export-options-ui.js
import { getElement } from '../../core/dom-loader.js';
// لا حاجة لاستيراد state-manager هنا إذا كانت هذه إعدادات عامة للتصدير وليست جزءًا من المشروع
import { DEFAULT_EXPORT_RESOLUTION, DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_FRAMERATE } from '../../config/constants.js';
import eventBus from '../../core/event-bus.js'; // قد لا يكون ضروريًا هنا إذا لم يتم إطلاق أحداث

const resolutionSelect = getElement('resolution-select');
const videoFormatSelect = getElement('video-format-select');
const framerateSelect = getElement('framerate-select');
const exportNote = getElement('export-note'); // عنصر ملاحظة التصدير

export function initializeExportOptionsUI() {
    // هذه تعتبر إعدادات عامة لعملية التصدير نفسها،
    // وليست إعدادات خاصة بالمشروع يتم حفظها معه.
    // لذلك، لا يتم تعديل currentProject هنا.

    // تعيين القيم الافتراضية في واجهة المستخدم عند التهيئة
    if (resolutionSelect) {
        resolutionSelect.value = DEFAULT_EXPORT_RESOLUTION;
    } else {
        console.warn("لم يتم العثور على عنصر تحديد دقة التصدير (resolution-select).");
    }

    if (videoFormatSelect) {
        videoFormatSelect.value = DEFAULT_EXPORT_FORMAT;
        videoFormatSelect.addEventListener('change', updateExportNoteBasedOnFormat); // تحديث الملاحظة عند تغيير الصيغة
        updateExportNoteBasedOnFormat(); // الاستدعاء الأولي لتحديث الملاحظة
    } else {
        console.warn("لم يتم العثور على عنصر تحديد صيغة الفيديو (video-format-select).");
    }

    if (framerateSelect) {
        framerateSelect.value = DEFAULT_EXPORT_FRAMERATE;
    } else {
        console.warn("لم يتم العثور على عنصر تحديد معدل الإطارات (framerate-select).");
    }
    // console.log("تم تهيئة واجهة مستخدم خيارات التصدير.");
}

/**
 * يحدث عناصر واجهة مستخدم خيارات التصدير من بيانات المشروع (إذا كانت هذه الإعدادات مخزنة مع المشروع).
 * حاليًا، هذه الدالة لا تفعل شيئًا لأننا نفترض أن خيارات التصدير عامة.
 * @param {object} project - بيانات المشروع الحالية (غير مستخدمة حاليًا).
 */
export function updateExportOptionsUIFromProject(project) {
    // إذا كانت هذه الإعدادات ستصبح جزءًا من كائن المشروع في المستقبل،
    // فسيتم تحديث قيم المحددات هنا من project.exportResolution، إلخ.
    // مثال:
    // if (resolutionSelect && project.exportSettings?.resolution) {
    //     resolutionSelect.value = project.exportSettings.resolution;
    // } else if (resolutionSelect) {
    //     resolutionSelect.value = DEFAULT_EXPORT_RESOLUTION;
    // }
    // (وبالمثل لباقي الخيارات)
}

/**
 * تحديث الملاحظة المعروضة أسفل خيارات التصدير بناءً على الصيغة المختارة.
 */
function updateExportNoteBasedOnFormat() {
    if (!exportNote || !videoFormatSelect) return;

    const selectedFormat = videoFormatSelect.value;
    switch (selectedFormat) {
        case 'mp4':
            exportNote.innerHTML = 'ملاحظة: تصدير MP4 يتطلب FFmpeg (غير مدمج حالياً). قد لا يتم تضمين الصوت. نوصي بـ <b>WebM</b> لجودة عالية وحجم أصغر.';
            exportNote.style.color = 'var(--secondary-color-darker)'; // لون تحذير أو لون ثانوي مميز
            break;
        case 'gif':
            exportNote.textContent = 'ملاحظة: GIF هو صور متحركة بدون صوت، وقد يستغرق التصدير وقتًا أطول.';
            exportNote.style.color = 'var(--current-text-secondary-color)';
            break;
        case 'webm':
            exportNote.textContent = 'ملاحظة: WebM يوفر جودة عالية وحجم ملف أصغر. قد لا يتم تضمين الصوت حاليًا (يعتمد على CCapture).';
            exportNote.style.color = 'var(--current-text-secondary-color)';
            break;
        default:
            exportNote.textContent = 'الرجاء اختيار صيغة للتصدير.';
            exportNote.style.color = 'var(--current-text-secondary-color)';
            break;
    }
}
