// js/app.js - نقطة الدخول الرئيسية للتطبيق

// ... (جميع الاستيرادات كما هي من قبل) ...
import { getElement, $, $$ } from './core/dom-loader.js';
import { initializeTheme } from './ui/theme-handler.js';
import { initializePanelManager, openPanel, closeAllPanels } from './ui/panel-manager.js';
import { initializeNotifications, showNotification } from './ui/notifications.js';
import { initializeModals } from './ui/modal-handler.js';
import { withSpinner } from './ui/spinner-control.js';
import { getCurrentProject, setCurrentProject } from './core/state-manager.js';
import eventBus from './core/event-bus.js';
import { handleError } from './core/error-handler.js';
import { createNewProject } from './features/project/project-model.js';
import { initializeProjectActions, refreshProjectsListView, switchToEditorScreen, switchToInitialScreen } from './features/project/project-actions.js';
import { getLastOpenedProjectId, getProjectById, isValidProject } from './features/project/project-save-load.js';
import { loadQuranStaticData, calculateAyahStartTimesAndTotalDuration } from './features/quran/quran-data-loader.js';
import { populateSurahSelect, populateReciterSelect, populateTranslationSelect, updateQuranSelectUIFromProject, initializeQuranSelectUI } from './features/quran/quran-select-ui.js';
import { initializeQuranSpeechInput } from './features/quran/quran-speech-input.js';
import { initializeBackgroundImport, updateBackgroundUIFromProject } from './features/background/background-import.js';
import { initializeAIBackgroundSuggest, updateAIBackgroundSelectionUI } from './features/background/background-ai-suggest.js';
import { clearBackgroundElementsCache } from './features/background/background-state.js';
import { initializeTextStyleControls, updateTextStyleControlsUI } from './features/text/text-style-controls.js';
import { initializeVideoDimensionsControls, updateVideoDimensionsUI } from './features/video/video-dimensions.js';
import { initializeVideoFiltersControls, updateVideoFiltersUI, applyVideoFilterToCanvasEl } from './features/video/video-filters.js';
import { initializeMainAudioPlayback, updateTimelineUI as updateAudioPlayerTimelineUI, refreshAudioPlayerForProject, getIsPlaying as getIsAudioPlaying } from './features/audio/main-audio-playback.js';
import { initializeTimelineControls, updateTotalDurationDisplay, updateCurrentTimeDisplay } from './features/audio/timeline-control.js';
import { initializeAudioDataLoader } from './features/audio/audio-data-loader.js';
import { initializeBackgroundMusic, updateBackgroundMusicUI, syncBackgroundMusicToMainPlayback } from './features/audio/background-music.js';
import { initializeAudioExtraction } from './features/audio/audio-extraction.js';
import { initializeUndoRedo } from './features/editor-controls/undo-redo-handler.js';
import { initializeExportOptionsUI, updateExportOptionsUIFromProject } from './features/general-settings/export-options-ui.js';
import { initializeAppSettings } from './features/general-settings/app-settings.js';
import { initializeCanvasPreview, updatePreview, updateCanvasDimensions, startPreviewRenderLoop, stopPreviewRenderLoop } from './features/video/canvas-preview.js';
import { initializeVideoExport } from './features/video/video-export-ccapture.js';
// --- نهاية الاستيرادات ---

/**
 * تحديث جميع أجزاء واجهة المستخدم لتعكس حالة المشروع الحالية.
 * @param {object} project - كائن المشروع الحالي.
 */
export function updateUIFromProject(project) {
    if (!project) {
        console.warn("محاولة تحديث واجهة المستخدم بدون مشروع صالح.");
        const errorScreen = getElement('error-display-screen'); // افترض وجود شاشة للأخطاء الفادحة
        if(errorScreen) errorScreen.textContent = "خطأ فادح: لا يوجد مشروع للعمل عليه.";
        return;
    }
    // console.log("تحديث واجهة المستخدم للمشروع:", project.name);

    const projectTitleEditor = getElement('current-project-title-editor');
    if (projectTitleEditor) projectTitleEditor.textContent = project.name;

    updateQuranSelectUIFromProject(project);
    updateBackgroundUIFromProject(project);
    updateAIBackgroundSelectionUI(project);
    updateTextStyleControlsUI(project);
    updateVideoDimensionsUI(project);
    updateVideoFiltersUI(project);
    applyVideoFilterToCanvasEl(project.videoFilter);

    refreshAudioPlayerForProject(project);
    updateBackgroundMusicUI(project);
    syncBackgroundMusicToMainPlayback(getIsAudioPlaying());

    updateExportOptionsUIFromProject(project);

    if (project.selectedAyahs && project.selectedAyahs.length > 0) {
        calculateAyahStartTimesAndTotalDuration(project);
    } else {
        project.totalDuration = 0;
    }
    updateTotalDurationDisplay(project.totalDuration);
    updateCurrentTimeDisplay(project.timelinePosition || 0);

    updateCanvasDimensions(project.aspectRatio); // يستدعي updatePreview ضمنيًا

    eventBus.emit('uiUpdatedForProject', project);
}


function setupGlobalEventListeners() {
    // ... (كود مستمعي الأحداث العامة كما هو من قبل، مع التحقق من وجود العناصر) ...
    const projectTitleEditor = getElement('current-project-title-editor');
    if (projectTitleEditor) {
        projectTitleEditor.addEventListener('click', () => { /* ... */ });
        projectTitleEditor.addEventListener('blur', () => { /* ... */ });
        projectTitleEditor.addEventListener('keydown', (e) => { /* ... */ });
    } else {
        console.warn("لم يتم العثور على عنصر عنوان المشروع القابل للتعديل.");
    }

    window.addEventListener('resize', debounce(() => { /* ... */ }, 250));

    const editorScreenEl = getElement('editor-screen');
    if (editorScreenEl) {
        const editorScreenObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.target.id === 'editor-screen') {
                    if (entry.isIntersecting && entry.target.classList.contains('active-screen')) {
                        startPreviewRenderLoop();
                    } else {
                        stopPreviewRenderLoop();
                    }
                }
            });
        }, { threshold: 0.1 });
        editorScreenObserver.observe(editorScreenEl);
    }

    // مستمعات Event Bus (تأكد من أن الدوال المستدعاة موجودة ومعرفة)
    eventBus.on('quranSelectionChanged', (project) => { if (project) updateUIFromProject(project); });
    eventBus.on('backgroundChanged', (project) => {
        if (project) {
            clearBackgroundElementsCache();
            updateAIBackgroundSelectionUI(project);
            updatePreview();
        }
    });
    eventBus.on('textStyleChanged', (project) => { if (project) updatePreview(); });
    eventBus.on('videoDimensionsChanged', (project) => { if (project) updateCanvasDimensions(project.aspectRatio); });
    eventBus.on('videoFilterChanged', (project) => {
        if (project) {
            applyVideoFilterToCanvasEl(project.videoFilter);
            updatePreview();
        }
    });
    eventBus.on('panelOpened', (panelId) => { /* ... */ });
    eventBus.on('projectStateRestoredByUndo', (project) => { if (project) updateUIFromProject(project); });
    eventBus.on('projectStateRestoredByRedo', (project) => { if (project) updateUIFromProject(project); });
    eventBus.on('projectSaved', (project) => { if (project) refreshProjectsListView(); });
    eventBus.on('projectSet', (project) => { if (project) updateUIFromProject(project); });
}

/**
 * الدالة الرئيسية لتهيئة التطبيق.
 */
async function main() {
    console.log("بدء تهيئة التطبيق (main)...");

    // 0. تهيئة الوحدات الأساسية التي لا تعتمد على DOM بشكل كبير
    initializeAppSettings();
    initializeTheme();
    initializeNotifications();
    initializeModals();
    initializeAudioDataLoader(); // قد يكون بسيطًا
    initializeBackgroundMusic();
    initializeAudioExtraction();

    // 1. تهيئة وحدات واجهة المستخدم التي تحتاج إلى DOM
    initializePanelManager();
    initializeQuranSelectUI();
    initializeQuranSpeechInput();
    initializeBackgroundImport();
    initializeAIBackgroundSuggest();
    initializeTextStyleControls();
    initializeVideoDimensionsControls();
    initializeVideoFiltersControls();
    initializeMainAudioPlayback();
    initializeTimelineControls();
    initializeUndoRedo();
    initializeExportOptionsUI();
    initializeCanvasPreview();
    initializeVideoExport();
    
    // 2. تهيئة إجراءات المشروع (تعتمد على تهيئة الوحدات الأخرى مثل Modals)
    initializeProjectActions(); // هذا يقوم بربط الأحداث بالأزرار مثل "إنشاء فيديو جديد"

    // 3. تحميل البيانات الأساسية
    try {
        await withSpinner(async () => {
            const staticData = await loadQuranStaticData();
            if (staticData) {
                populateSurahSelect(staticData.surahs || []);
                populateReciterSelect(staticData.reciters || []);
                populateTranslationSelect(staticData.translations || []);
            } else {
                throw new Error("فشل تحميل البيانات الثابتة للقرآن بشكل كامل.");
            }
        });
    } catch (error) {
        handleError(error, "فشل تحميل بيانات القرآن الأساسية عند بدء التشغيل");
        showNotification({ type: 'error', message: 'خطأ حرج: فشل تحميل بيانات القرآن. لا يمكن متابعة تحميل التطبيق بشكل صحيح.' });
        // يمكنك هنا عرض شاشة خطأ أو منع تحميل باقي التطبيق
        return; // إيقاف التهيئة إذا فشلت هذه الخطوة الحرجة
    }

    // 4. تحديد المشروع الذي سيتم عرضه
    const lastProjectId = getLastOpenedProjectId();
    let projectToStartWith = null;
    if (lastProjectId) {
        projectToStartWith = getProjectById(lastProjectId);
    }

    if (projectToStartWith && isValidProject(projectToStartWith)) {
        setCurrentProject(projectToStartWith);
    } else {
        setCurrentProject(createNewProject()); // ابدأ بمشروع جديد تمامًا إذا لم يكن هناك مشروع سابق صالح
    }
    
    // 5. تحديث الواجهة بالكامل بناءً على المشروع المحدد وعرض الشاشة المناسبة
    const current = getCurrentProject();
    updateUIFromProject(current); // هذا يجب أن يحدث بعد setCurrentProject

    // بشكل افتراضي، نبدأ بالشاشة الأولية
    switchToInitialScreen(); // تأكد من أن الشاشة الأولية هي النشطة
    closeAllPanels(); // أغلق أي لوحات قد تكون مفتوحة

    // 6. إعداد مستمعي الأحداث العامة
    setupGlobalEventListeners();

    eventBus.emit('appInitialized');
    console.log("تم الانتهاء من تهيئة التطبيق بنجاح (main)!");
}

// --- نقطة انطلاق التطبيق ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main(); // DOMContentLoaded has already fired
}
