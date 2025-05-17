// js/features/video/video-filters.js
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject, setCurrentProject, saveState } from '../../core/state-manager.js';
import eventBus from '../../core/event-bus.js';
// updatePreview يتم استدعاؤه عبر eventBus 'videoFilterChanged' -> app.js -> updateUIFromProject -> updatePreview

const videoFilterSelect = getElement('video-filter-select');
const videoPreviewCanvas = getElement('video-preview-canvas');

export function initializeVideoFiltersControls() {
    if (videoFilterSelect) {
        videoFilterSelect.addEventListener('change', handleVideoFilterChange);
    } else {
        console.warn("لم يتم العثور على عنصر تحديد فلتر الفيديو (video-filter-select).");
    }
}

function handleVideoFilterChange(event) {
    const newFilter = event.target.value;
    const project = getCurrentProject();
    if (!project) return;

    project.videoFilter = newFilter;

    setCurrentProject(project, false);
    saveState("تم تغيير فلتر الفيديو: " + newFilter);
    eventBus.emit('videoFilterChanged', project); // سيؤدي هذا إلى تحديث المعاينة وتطبيق الفلتر

    // applyVideoFilterToCanvasEl(newFilter); // يتم تطبيقه الآن من خلال updateUIFromProject
}

/**
 * يطبق فلتر CSS المحدد على عنصر الكانفاس للمعاينة.
 * @param {string} filterValue - سلسلة فلتر CSS (مثال: "grayscale(100%)").
 */
export function applyVideoFilterToCanvasEl(filterValue) {
    if (videoPreviewCanvas) {
        videoPreviewCanvas.style.filter = filterValue || 'none';
    }
}

/**
 * يحدث عنصر تحكم واجهة المستخدم لفلتر الفيديو بناءً على حالة المشروع الحالية.
 * @param {object} project - بيانات المشروع الحالية.
 */
export function updateVideoFiltersUI(project) {
    if (!project) return;
    if (videoFilterSelect) { // تحقق من وجود العنصر أولاً
        videoFilterSelect.value = project.videoFilter || "none"; // استخدم "none" كقيمة افتراضية إذا لم يكن هناك فلتر محدد
        // applyVideoFilterToCanvasEl(project.videoFilter || "none"); // يتم تطبيقه من خلال updateUIFromProject
    }
}
