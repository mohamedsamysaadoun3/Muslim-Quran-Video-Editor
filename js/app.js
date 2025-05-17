// js/app.js - نقطة الدخول الرئيسية للتطبيق

// --- الاستيرادات (تبقى كما هي) ---
import { getElement, $, $$ } from './core/dom-loader.js';
import { initializeTheme } from './ui/theme-handler.js';
import { initializePanelManager, openPanel, closeAllPanels, getCurrentOpenPanelId } from './ui/panel-manager.js';
import { initializeNotifications, showNotification } from './ui/notifications.js';
import { initializeModals } from './ui/modal-handler.js';
import { withSpinner } from './ui/spinner-control.js';
import { getCurrentProject, setCurrentProject, saveState } from './core/state-manager.js'; // إزالة resetHistory إذا لم تستخدم مباشرة هنا
import eventBus from './core/event-bus.js';
import { handleError } from './core/error-handler.js';
import { createNewProject, DEFAULT_PROJECT_NAME } from './features/project/project-model.js';
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
 * هذه هي الدالة المركزية لتحديث الواجهة.
 * @param {object} project - كائن المشروع الحالي.
 */
export function updateUIFromProject(project) {
    if (!project) {
        console.error("updateUIFromProject: تم الاستدعاء بمشروع فارغ!");
        // يمكنك هنا عرض رسالة خطأ للمستخدم أو إعادة توجيهه
        return;
    }
    // console.log("updateUIFromProject: تحديث الواجهة للمشروع:", project.name, project);

    // تحديث عنوان المشروع
    const projectTitleEditor = getElement('current-project-title-editor');
    if (projectTitleEditor) projectTitleEditor.textContent = project.name || DEFAULT_PROJECT_NAME;

    // تحديث وحدات الواجهة المختلفة
    updateQuranSelectUIFromProject(project);
    updateBackgroundUIFromProject(project);
    updateAIBackgroundSelectionUI(project); // لتحديد خلفية AI المختارة
    updateTextStyleControlsUI(project);
    updateVideoDimensionsUI(project);
    updateVideoFiltersUI(project);
    applyVideoFilterToCanvasEl(project.videoFilter); // تطبيق الفلتر على عنصر الكانفاس

    // تحديثات الصوت
    refreshAudioPlayerForProject(project); // لإعادة تهيئة مشغل الصوت بالآيات الحالية
    updateBackgroundMusicUI(project);
    syncBackgroundMusicToMainPlayback(getIsAudioPlaying()); // مزامنة موسيقى الخلفية

    updateExportOptionsUIFromProject(project); // إذا كانت خيارات التصدير تعتمد على المشروع

    // إعادة حساب المدد وتحديث شريط الزمن
    if (project.selectedAyahs && project.selectedAyahs.length > 0) {
        calculateAyahStartTimesAndTotalDuration(project);
    } else {
        project.totalDuration = 0; // إذا لا توجد آيات، المدة صفر
    }
    updateTotalDurationDisplay(project.totalDuration); // من timeline-control.js
    updateCurrentTimeDisplay(project.timelinePosition || 0); // من timeline-control.js

    // تحديث معاينة الكانفاس (يجب أن يكون هذا في النهاية بعد تحديث كل شيء آخر)
    updateCanvasDimensions(project.aspectRatio); // هذا يستدعي updatePreview ضمنيًا

    eventBus.emit('uiUpdatedForProject', project);
    // console.log("updateUIFromProject: اكتمل تحديث الواجهة.");
}


function setupGlobalEventListeners() {
    const projectTitleEditor = getElement('current-project-title-editor');
    if (projectTitleEditor) {
        projectTitleEditor.addEventListener('click', () => {
            if (projectTitleEditor.contentEditable !== "true") {
                projectTitleEditor.contentEditable = "true";
                const range = document.createRange();
                range.selectNodeContents(projectTitleEditor);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
        projectTitleEditor.addEventListener('blur', () => {
            projectTitleEditor.contentEditable = "false";
            const newName = projectTitleEditor.textContent.trim();
            const project = getCurrentProject();
            if (newName && project && project.name !== newName) {
                project.name = newName;
                // touchProject(project); // لا حاجة إذا كان saveCurrentProject سيفعل ذلك
                setCurrentProject(project, false);
                saveState(`اسم المشروع تغير إلى: ${newName}`);
                // حفظ التغيير مباشرة (اختياري، أو عند الحفظ العام)
                // saveCurrentProject(); 
                showNotification({type: 'success', message: `تم تغيير اسم المشروع إلى "${newName}"`, duration: 2000});
                 refreshProjectsListView();
            } else if (project && (!newName || newName === "")) {
                projectTitleEditor.textContent = project.name || DEFAULT_PROJECT_NAME;
                showNotification({type: 'warning', message: `اسم المشروع لا يمكن أن يكون فارغًا.`, duration: 2500});
            } else if (project) {
                projectTitleEditor.textContent = project.name || DEFAULT_PROJECT_NAME;
            }
        });
        projectTitleEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                projectTitleEditor.blur();
            }
        });
    } else {
        console.warn("setupGlobalEventListeners: لم يتم العثور على عنصر عنوان المشروع القابل للتعديل.");
    }

    window.addEventListener('resize', debounce(() => {
        const editorScreenActive = getElement('editor-screen')?.classList.contains('active-screen');
        if (editorScreenActive) {
            const project = getCurrentProject();
            if (project) updateCanvasDimensions(project.aspectRatio);
        }
    }, 250));

    const editorScreenEl = getElement('editor-screen');
    if (editorScreenEl) {
        const observer = new IntersectionObserver((entries) => {
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
        observer.observe(editorScreenEl);
    }

    // --- مستمعات Event Bus ---
    eventBus.on('quranSelectionChanged', (project) => { if(project) updateUIFromProject(project); });
    eventBus.on('backgroundChanged', (project) => {
        if(project) {
            clearBackgroundElementsCache();
            updateAIBackgroundSelectionUI(project); // تحديث تحديد AI
            updatePreview(); // تحديث المعاينة
        }
    });
    eventBus.on('textStyleChanged', () => updatePreview()); // لا حاجة لتمرير المشروع إذا كان updatePreview سيحصل عليه
    eventBus.on('videoDimensionsChanged', (project) => { if(project) updateCanvasDimensions(project.aspectRatio); });
    eventBus.on('videoFilterChanged', (project) => {
        if(project) {
            applyVideoFilterToCanvasEl(project.videoFilter);
            updatePreview();
        }
    });
    eventBus.on('projectStateRestoredByUndo', (project) => { if(project) updateUIFromProject(project); });
    eventBus.on('projectStateRestoredByRedo', (project) => { if(project) updateUIFromProject(project); });
    eventBus.on('projectSaved', (project) => { if(project) refreshProjectsListView(); });
    eventBus.on('projectSet', (project) => { if(project) updateUIFromProject(project); }); // عند استدعاء setCurrentProject
    eventBus.on('newProjectCreated', (project) => { // بعد إنشاء مشروع جديد بنجاح
        if(project) openPanel('quran-selection-panel'); // فتح لوحة القرآن
    });
    eventBus.on('projectLoadedInEditor', (project) => { // بعد تحميل مشروع في المحرر
        if(project) openPanel('quran-selection-panel');
    });
}

/**
 * الدالة الرئيسية لتهيئة التطبيق (يتم استدعاؤها بعد تحميل DOM).
 */
async function main() {
    console.log("main: بدء تهيئة التطبيق...");

    // 0. تهيئة الوحدات الأساسية جداً
    initializeAppSettings();
    initializeTheme();
    initializeNotifications();
    initializeModals();

    // 1. تهيئة وحدات البيانات والخدمات (التي لا تعتمد على واجهة مستخدم معقدة بعد)
    initializeAudioDataLoader();

    // 2. تهيئة وحدات واجهة المستخدم الرئيسية (التي قد تحتاجها وحدات أخرى)
    initializePanelManager(); // مهم قبل محاولة فتح أي لوحة
    initializeCanvasPreview(); // مهم قبل أي محاولة للرسم

    // 3. تهيئة باقي وحدات الميزات
    initializeQuranSelectUI();
    initializeQuranSpeechInput();
    initializeBackgroundImport();
    initializeAIBackgroundSuggest();
    initializeTextStyleControls();
    initializeVideoDimensionsControls();
    initializeVideoFiltersControls();
    initializeMainAudioPlayback();
    initializeTimelineControls();
    initializeBackgroundMusic();
    initializeAudioExtraction();
    initializeUndoRedo();
    initializeExportOptionsUI();
    initializeVideoExport();
    
    // 4. تهيئة إجراءات المشروع (تعتمد على تهيئة وحدات مثل Modals)
    // هذه هي التي تربط الأحداث بأزرار مثل "إنشاء فيديو جديد"
    initializeProjectActions(); 

    // 5. تحميل البيانات الأساسية للتطبيق (مثل بيانات القرآن)
    try {
        await withSpinner(async () => {
            const staticData = await loadQuranStaticData();
            if (staticData && staticData.surahs && staticData.reciters && staticData.translations) {
                populateSurahSelect(staticData.surahs);
                populateReciterSelect(staticData.reciters);
                populateTranslationSelect(staticData.translations);
            } else {
                throw new Error("بيانات القرآن الأساسية المسترجعة غير مكتملة أو فارغة.");
            }
        });
    } catch (error) {
        handleError(error, "main: فشل تحميل بيانات القرآن الأساسية");
        showNotification({ type: 'error', message: 'خطأ حرج: فشل تحميل بيانات القرآن. لا يمكن متابعة تحميل التطبيق بشكل صحيح.', duration: 0 });
        return; // إيقاف التهيئة إذا فشلت هذه الخطوة الحرجة
    }

    // 6. تحديد أو إنشاء المشروع الحالي
    const lastProjectId = getLastOpenedProjectId();
    let projectToStartWith = null;
    if (lastProjectId) {
        projectToStartWith = getProjectById(lastProjectId);
    }

    if (projectToStartWith && isValidProject(projectToStartWith)) {
        setCurrentProject(projectToStartWith);
        console.log("main: تم تحميل آخر مشروع مفتوح:", projectToStartWith.name);
    } else {
        if (lastProjectId) console.warn(`main: لم يتم العثور على آخر مشروع (ID: ${lastProjectId}) أو أنه غير صالح.`);
        setCurrentProject(createNewProject()); // ابدأ بمشروع جديد تمامًا
        console.log("main: تم إنشاء مشروع جديد افتراضي.");
    }
    
    // 7. تحديث الواجهة بالكامل بناءً على المشروع المحدد والانتقال للشاشة المناسبة
    const current = getCurrentProject();
    updateUIFromProject(current); // يجب أن يتم هذا *بعد* setCurrentProject

    // بشكل افتراضي، نبدأ بالشاشة الأولية
    switchToInitialScreen();
    // closeAllPanels(); // switchToInitialScreen يجب أن تتعامل مع هذا

    // 8. إعداد مستمعي الأحداث العامة
    setupGlobalEventListeners();

    eventBus.emit('appInitialized');
    console.log("main: تم الانتهاء من تهيئة التطبيق بنجاح!");
}

// --- نقطة انطلاق التطبيق ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}
