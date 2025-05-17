// js/features/video/video-export-ccapture.js
/* global CCapture */
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject } from '../../core/state-manager.js';
import { drawFrame, updateCanvasDimensions as updatePreviewCanvasDimensions } from './canvas-preview.js'; // تم تغيير اسم الدالة المستوردة
import { getExportDimensions } from './video-dimensions.js';
import { applyVideoFilterToCanvasEl } from './video-filters.js';
import { withSpinner } from '../../ui/spinner-control.js'; // showSpinner, hideSpinner يتم التعامل معهما بواسطة withSpinner
import { handleError } from '../../core/error-handler.js';
import eventBus from '../../core/event-bus.js';
import { getBackgroundVideoElement, clearBackgroundElementsCache } from '../background/background-state.js';
import { sleep } from '../../utils/general-helpers.js';
import { showNotification } from '../../ui/notifications.js'; // لاستخدام الإشعارات

const exportBtn = getElement('export-btn');
const exportProgressContainer = getElement('export-progress');
const exportProgressBar = getElement('export-progress-bar');
const exportProgressText = getElement('export-progress-text');

const resolutionSelect = getElement('resolution-select');
const videoFormatSelect = getElement('video-format-select');
const framerateSelect = getElement('framerate-select');

let capturer = null;
let isExportingGlobal = false;
let originalCanvasSettings = {}; // لتخزين إعدادات الكانفاس الأصلية

export function initializeVideoExport() {
    if (exportBtn) {
        exportBtn.addEventListener('click', startExport);
    } else {
        console.warn("لم يتم العثور على زر التصدير (export-btn).");
    }
}

async function startExport() {
    if (isExportingGlobal) {
        showNotification({ type: 'warning', message: 'التصدير قيد التقدم بالفعل.' });
        return;
    }

    const project = getCurrentProject();
    if (!project || !project.selectedAyahs || project.selectedAyahs.length === 0) {
        showNotification({ type: 'error', message: 'لا توجد آيات محددة للتصدير.' });
        return;
    }
    if (project.totalDuration <= 0) {
        showNotification({ type: 'error', message: 'مدة المشروع صفر. الرجاء إضافة آيات أو التحقق من المدد.' });
        return;
    }


    isExportingGlobal = true;
    if (exportProgressContainer) exportProgressContainer.style.display = 'grid';
    updateExportProgress(0, 'تهيئة التصدير...');

    const exportResolution = resolutionSelect.value;
    const exportFormat = videoFormatSelect.value;
    const exportFramerate = parseInt(framerateSelect.value);
    const finalDimensions = getExportDimensions(exportResolution, project.aspectRatio);

    const previewCanvas = getElement('video-preview-canvas');
    const previewContainer = getElement('video-preview-container');

    // تخزين الإعدادات الأصلية
    originalCanvasSettings = {
        width: previewCanvas.width,
        height: previewCanvas.height,
        containerAspectRatio: previewContainer.style.aspectRatio,
        projectAspectRatio: project.aspectRatio // حفظ نسبة المشروع الأصلية
    };

    // إيقاف حلقة عرض المعاينة إذا كانت تعمل
    eventBus.emit('stopPreviewRenderLoop'); // افترض أن canvas-preview يستمع لهذا

    // إعداد الكانفاس للتصدير
    previewCanvas.width = finalDimensions.width;
    previewCanvas.height = finalDimensions.height;
    previewContainer.style.aspectRatio = `${finalDimensions.width} / ${finalDimensions.height}`;
    applyVideoFilterToCanvasEl(project.videoFilter); // تطبيق الفلتر على الكانفاس بحجم التصدير
    await drawFrame(project, 0, true); // رسم إطار أولي قبل بدء الالتقاط

    capturer = new CCapture({
        format: exportFormat === 'mp4' ? 'webm' : exportFormat, // MP4 غير مدعوم مباشرة مع الصوت
        framerate: exportFramerate,
        quality: exportFormat === 'gif' ? 10 : 90,
        verbose: false,
        name: (project.name || 'quran_video').replace(/[^a-z0-9\u0600-\u06FF_-]/gi, '_').toLowerCase(),
        display: false,
    });

    capturer.start();

    const totalFrames = Math.ceil(project.totalDuration * exportFramerate);
    let bgVideoElement = null;

    if (project.backgroundType === 'video' && project.backgroundVideo) {
        clearBackgroundElementsCache();
        bgVideoElement = await getBackgroundVideoElement(project);
        if (bgVideoElement) {
            bgVideoElement.pause();
            bgVideoElement.currentTime = 0;
        }
    }
    
    const exportTask = async () => {
        for (let i = 0; i < totalFrames; i++) {
            if (!isExportingGlobal) break;

            const currentTime = i / exportFramerate;

            if (bgVideoElement && bgVideoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
                bgVideoElement.currentTime = currentTime;
                // انتظار حدث 'seeked' قد يكون بطيئًا.
                // محاولة الرسم بعد تأخير بسيط أو الاعتماد على التحديث السريع للفيديو.
                // إذا كان هناك تقطيع، يجب تحسين هذه الجزئية.
                await new Promise(r => setTimeout(r, 1000 / exportFramerate / 2)); // انتظار جزء من مدة الإطار
            }
            
            await drawFrame(project, currentTime, true);
            capturer.capture(previewCanvas);

            updateExportProgress(Math.min(100, ((i + 1) / totalFrames) * 100), `تصدير الإطار ${i + 1} من ${totalFrames}`);
            if (i % Math.floor(exportFramerate / 2) === 0) await sleep(0); // إعطاء فرصة للمتصفح
        }

        if (isExportingGlobal) {
            await finalizeExport();
        } else {
            await cleanupAfterExport(false); // تم الإلغاء
        }
    };

    try {
        await withSpinner(exportTask());
    } catch (error) {
        handleError(error, "حلقة تصدير الفيديو");
        await cleanupAfterExport(false);
        showNotification({ type: 'error', message: 'فشل تصدير الفيديو بسبب خطأ.' });
    }
}

async function finalizeExport() {
    if (!capturer) return;
    updateExportProgress(100, 'جاري إنهاء التصدير وحفظ الملف...');
    
    capturer.stop();
    capturer.save(); // CCapture سيقوم بالتنزيل تلقائيًا
    await cleanupAfterExport(true);
}

async function cleanupAfterExport(completedSuccessfully) {
    isExportingGlobal = false;
    capturer = null;

    const previewCanvas = getElement('video-preview-canvas');
    const previewContainer = getElement('video-preview-container');
    const project = getCurrentProject(); // احصل على المشروع الحالي مرة أخرى

    // استعادة إعدادات الكانفاس الأصلية
    previewCanvas.width = originalCanvasSettings.width;
    previewCanvas.height = originalCanvasSettings.height;
    previewContainer.style.aspectRatio = originalCanvasSettings.containerAspectRatio;
    
    // إعادة تطبيق نسبة أبعاد المشروع الأصلية على الكانفاس والمعاينة
    if (project) {
        applyVideoFilterToCanvasEl(project.videoFilter);
        updatePreviewCanvasDimensions(project.aspectRatio); // هذا سيعيد الرسم
    }

    if (completedSuccessfully) {
        showNotification({ type: 'success', message: 'اكتمل تصدير الفيديو بنجاح!' });
    }

    setTimeout(() => {
         if (exportProgressContainer) exportProgressContainer.style.display = 'none';
    }, completedSuccessfully ? 2500 : 500);

    // إعادة تشغيل حلقة عرض المعاينة إذا كانت شاشة المحرر نشطة
    eventBus.emit('startPreviewRenderLoopIfNeeded'); // افترض أن canvas-preview يستمع لهذا
}

function updateExportProgress(percentage, statusText) {
    if (exportProgressBar) exportProgressBar.value = percentage;
    if (exportProgressText) exportProgressText.textContent = `${statusText} (${Math.round(percentage)}%)`;
}

export function cancelExport() {
    if (isExportingGlobal) {
        isExportingGlobal = false;
        showNotification({ type: 'info', message: 'تم طلب إلغاء التصدير...' });
        // سيتم التنظيف عند انتهاء الحلقة الحالية أو في finalizeExport
    }
}
