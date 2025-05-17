// js/app.js - نقطة الدخول الرئيسية للتطبيق

// الوحدات الأساسية (Core Modules)
import { getElement, $, $$ } from './core/dom-loader.js';
import { initializeTheme, getCurrentTheme } from './ui/theme-handler.js';
import { initializePanelManager, openPanel, closeAllPanels, getCurrentOpenPanelId } from './ui/panel-manager.js';
import { initializeNotifications, showNotification } from './ui/notifications.js';
import { initializeModals, showModal, showConfirm, showPrompt } from './ui/modal-handler.js';
// initializeSpinner لا تحتاج استدعاء خاص، Spinner بسيط
import { showSpinner, hideSpinner, withSpinner } from './ui/spinner-control.js';
import { getCurrentProject, setCurrentProject, saveState, resetHistory } from './core/state-manager.js';
import eventBus from './core/event-bus.js';
import { handleError } from './core/error-handler.js';

// وحدات الميزات - المشروع (Feature Modules - Project)
import { createNewProject, touchProject } from './features/project/project-model.js';
import { initializeProjectActions, refreshProjectsListView, switchToEditorScreen, switchToInitialScreen, saveCurrentProject, loadProjectIntoEditor, createAndEditNewProject } from './features/project/project-actions.js';
import { getLastOpenedProjectId, getProjectById } from './features/project/project-save-load.js';

// وحدات الميزات - القرآن (Feature Modules - Quran)
import { loadQuranStaticData, loadSelectedAyahsForProject, getSurahByNumber, calculateAyahStartTimesAndTotalDuration } from './features/quran/quran-data-loader.js';
import { populateSurahSelect, populateReciterSelect, populateTranslationSelect, updateQuranSelectUIFromProject, updateAyahSelectors, initializeQuranSelectUI } from './features/quran/quran-select-ui.js';
import { initializeQuranSpeechInput } from './features/quran/quran-speech-input.js';

// وحدات الميزات - الخلفية (Feature Modules - Background)
import { initializeBackgroundImport, updateBackgroundUIFromProject, applyBackground } from './features/background/background-import.js';
import { initializeAIBackgroundSuggest, updateAIBackgroundSelectionUI } from './features/background/background-ai-suggest.js';
import { clearBackgroundElementsCache } from './features/background/background-state.js';


// وحدات الميزات - النص وتأثيرات الفيديو (Feature Modules - Text & Video Effects)
import { initializeTextStyleControls, updateTextStyleControlsUI } from './features/text/text-style-controls.js';
import { initializeVideoDimensionsControls, updateVideoDimensionsUI } from './features/video/video-dimensions.js';
import { initializeVideoFiltersControls, updateVideoFiltersUI, applyVideoFilterToCanvasEl } from './features/video/video-filters.js';

// وحدات الميزات - الصوت (Feature Modules - Audio)
import { initializeMainAudioPlayback, updateTimelineUI as updateAudioPlayerTimelineUI, setupAudioForNewProject as refreshAudioPlayerForProject, getOverallCurrentTime, getIsPlaying as getIsAudioPlaying } from './features/audio/main-audio-playback.js';
import { initializeTimelineControls, updateTotalDurationDisplay, updateCurrentTimeDisplay } from './features/audio/timeline-control.js';
import { initializeAudioDataLoader } from './features/audio/audio-data-loader.js';
import { initializeBackgroundMusic, updateBackgroundMusicUI, syncBackgroundMusicToMainPlayback } from './features/audio/background-music.js';
import { initializeAudioExtraction } from './features/audio/audio-extraction.js';


// وحدات الميزات - عناصر تحكم المحرر والإعدادات (Feature Modules - Editor Controls & Settings)
import { initializeUndoRedo } from './features/editor-controls/undo-redo-handler.js';
import { initializeExportOptionsUI, updateExportOptionsUIFromProject } from './features/general-settings/export-options-ui.js';
import { initializeAppSettings } from './features/general-settings/app-settings.js';

// وحدات الميزات - معاينة الفيديو والتصدير (Feature Modules - Video Preview & Export)
import { initializeCanvasPreview, updatePreview, updateCanvasDimensions, startPreviewRenderLoop, stopPreviewRenderLoop, findAyahAtTime, drawFrame } from './features/video/canvas-preview.js';
import { initializeVideoExport, cancelExport } from './features/video/video-export-ccapture.js';
// import { initializeFFmpegExport } from './features/video/video-export-ffmpeg.js'; // إذا تم استخدامه


// --- المنطق الرئيسي للتطبيق ---

/**
 * يتم استدعاؤها عند تحميل DOM بالكامل وجاهزية التطبيق.
 */
async function onAppReady() {
    console.log("التطبيق جاهز، بدء التهيئة...");

    // 0. تهيئة الأدوات الأساسية أولاً
    initializeAppSettings();
    initializeTheme();
    initializeNotifications();
    initializeModals();
    // initializeSpinner(); // لا حاجة لتهيئة خاصة

    // 1. تهيئة مديري واجهة المستخدم
    initializePanelManager();

    // 2. تهيئة التعامل مع المشاريع
    initializeProjectActions();

    // 3. تهيئة وحدات تحديد بيانات القرآن
    initializeQuranSelectUI();
    initializeQuranSpeechInput();

    // 4. تهيئة وحدات الخلفية
    initializeBackgroundImport();
    initializeAIBackgroundSuggest();

    // 5. تهيئة وحدات النص وتأثيرات الفيديو
    initializeTextStyleControls();
    initializeVideoDimensionsControls();
    initializeVideoFiltersControls();

    // 6. تهيئة وحدات الصوت
    initializeAudioDataLoader();
    initializeMainAudioPlayback();
    initializeTimelineControls();
    initializeBackgroundMusic();
    initializeAudioExtraction();

    // 7. تهيئة عناصر تحكم المحرر والإعدادات
    initializeUndoRedo();
    initializeExportOptionsUI();

    // 8. تهيئة معاينة الفيديو والتصدير
    initializeCanvasPreview();
    initializeVideoExport();
    // initializeFFmpegExport();

    // تحميل بيانات القرآن الثابتة (السور، القراء، الترجمات)
    try {
        await withSpinner(async () => { // تغليف تحميل البيانات بالسبينر
            const { surahs, reciters, translations } = await loadQuranStaticData();
            populateSurahSelect(surahs);
            populateReciterSelect(reciters);
            populateTranslationSelect(translations);
        });
        // console.log("بيانات القرآن الثابتة (سور، قراء، ترجمات) تم تحميلها.");
    } catch (error) {
        handleError(error, "فشل تحميل بيانات القرآن الأساسية");
        showNotification({ type: 'error', message: 'فشل تحميل بيانات القرآن. قد لا تعمل بعض الميزات بشكل صحيح.' });
    }

    // تحميل آخر مشروع تم العمل عليه أو إنشاء مشروع جديد إذا لم يوجد
    const lastProjectId = getLastOpenedProjectId();
    let projectToLoad = null;
    if (lastProjectId) {
        projectToLoad = getProjectById(lastProjectId);
    }

    if (projectToLoad && isValidProject(projectToLoad)) {
        // console.log("تحميل آخر مشروع مفتوح:", projectToLoad.name);
        setCurrentProject(projectToLoad); // هذا يضبط المشروع ويضيفه للتاريخ
        // switchToEditorScreen(projectToLoad); // سيتم استدعاؤها لاحقًا إذا كانت الشاشة المناسبة
        // updateUIFromProject(projectToLoad);
    } else {
        // إذا لم يكن هناك مشروع سابق صالح، ابدأ بمشروع جديد تمامًا
        // console.log("لم يتم العثور على مشروع سابق صالح أو لا يوجد، إنشاء مشروع جديد.");
        const newProj = createNewProject(); // أنشئ مشروعًا جديدًا ولكن لا تطلب اسمًا بعد
        setCurrentProject(newProj); // هذا يضبط المشروع ويضيفه للتاريخ
    }
    
    // الآن بعد تعيين المشروع (إما محمل أو جديد)، قم بتحديث الواجهة وانتقل للشاشة المناسبة
    const current = getCurrentProject();
    if (current) { // يجب أن يكون هناك مشروع دائمًا
        // تحديد أي شاشة يجب عرضها
        // إذا كان هناك مشروع محمل وكان المستخدم على شاشة المحرر آخر مرة (يمكن تخزين هذا كإعداد)
        // أو ببساطة، إذا كان هناك مشروع محدد (غير الافتراضي تمامًا) انتقل للمحرر
        // حاليًا، لنفترض أننا نبدأ دائمًا من الشاشة الرئيسية ما لم يتم توجيهنا بشكل آخر (مثل اختصار PWA)
        
        // إذا أردنا فتح المحرر مباشرة إذا كان هناك مشروع محمل:
        // if (lastProjectId && projectToLoad) {
        //     switchToEditorScreen(current);
        // } else {
        //     // البقاء على الشاشة الرئيسية (الافتراضي)
        // }
        updateUIFromProject(current); // تحديث الواجهة للمشروع الحالي
    }

    // إعداد event listeners العامة للتطبيق
    setupGlobalEventListeners();

    // إخفاء شاشة التحميل الأولية إذا كانت موجودة
    const initialLoadingScreen = getElement('app-initial-loading');
    if (initialLoadingScreen) {
        initialLoadingScreen.style.display = 'none';
    }

    eventBus.emit('appInitialized');
    console.log("تم تهيئة التطبيق بنجاح!");
}

/**
 * تحديث جميع أجزاء واجهة المستخدم لتعكس حالة المشروع الحالية.
 * @param {object} project - كائن المشروع الحالي.
 */
export function updateUIFromProject(project) {
    if (!project) {
        console.warn("محاولة تحديث واجهة المستخدم بدون مشروع.");
        return;
    }
    // console.log("تحديث واجهة المستخدم للمشروع:", project.name, project);

    const projectTitleEditor = getElement('current-project-title-editor');
    if (projectTitleEditor) {
        projectTitleEditor.textContent = project.name;
    }

    updateQuranSelectUIFromProject(project);
    updateBackgroundUIFromProject(project);
    updateAIBackgroundSelectionUI(project);
    updateTextStyleControlsUI(project);
    updateVideoDimensionsUI(project);
    updateVideoFiltersUI(project);
    applyVideoFilterToCanvasEl(project.videoFilter); // تأكد من تطبيق الفلتر

    // تحديثات الصوت
    // updateAudioPlayerTimelineUI(project.timelinePosition || 0, project.totalDuration || 0); // يتم تحديثه بواسطة mainAudioPlayback
    refreshAudioPlayerForProject(project); // هذا سيعيد تحميل الآية الحالية إذا لزم الأمر
    updateBackgroundMusicUI(project);
    // تأكد من مزامنة موسيقى الخلفية مع حالة التشغيل الحالية
    syncBackgroundMusicToMainPlayback(getIsAudioPlaying());


    updateExportOptionsUIFromProject(project); // إذا كانت الإعدادات تعتمد على المشروع

    // إعادة حساب المدد وتحديث شريط الزمن
    if (project.selectedAyahs && project.selectedAyahs.length > 0) {
        const oldTotalDuration = project.totalDuration;
        calculateAyahStartTimesAndTotalDuration(project);
        if (oldTotalDuration !== project.totalDuration || project.totalDuration === 0) { // تحديث إذا تغيرت المدة أو كانت صفرًا
            updateTotalDurationDisplay(project.totalDuration); // من timeline-control
        }
    } else { // لا توجد آيات، اضبط المدة على صفر
        project.totalDuration = 0;
        updateTotalDurationDisplay(0);
    }
    // تحديث الوقت الحالي على شريط الزمن أيضًا
    updateCurrentTimeDisplay(project.timelinePosition || 0);


    updateCanvasDimensions(project.aspectRatio); // هذا سيستدعي updatePreview بدوره

    eventBus.emit('uiUpdatedForProject', project);
}


function setupGlobalEventListeners() {
    const projectTitleEditor = getElement('current-project-title-editor');
    if (projectTitleEditor) {
        projectTitleEditor.addEventListener('click', () => { // تعديل عند النقر بدلًا من focus
            if (projectTitleEditor.contentEditable !== "true") {
                projectTitleEditor.contentEditable = "true";
                // تحديد النص بالكامل لتسهيل التعديل
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
            if (newName && project.name !== newName) {
                project.name = newName;
                touchProject(project);
                setCurrentProject(project, false);
                saveState(`اسم المشروع تغير إلى: ${newName}`);
                saveCurrentProject();
                showNotification({type: 'success', message: `تم تغيير اسم المشروع إلى "${newName}"`, duration: 2000});
                 refreshProjectsListView(); // تحديث قائمة المشاريع أيضًا
            } else if (!newName && project.name) { // إذا أصبح الاسم فارغًا
                projectTitleEditor.textContent = project.name; // أعد الاسم القديم
                showNotification({type: 'warning', message: `اسم المشروع لا يمكن أن يكون فارغًا.`, duration: 2500});
            } else { // لم يتغير أو كان فارغًا وبقي فارغًا
                 projectTitleEditor.textContent = project.name; // تأكد من عرض الاسم الصحيح
            }
        });
        projectTitleEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                projectTitleEditor.blur();
            }
        });
    }

    window.addEventListener('resize', debounce(() => {
        if (getElement('editor-screen').classList.contains('active-screen')) {
            const project = getCurrentProject();
            if (project) {
                updateCanvasDimensions(project.aspectRatio);
            }
        }
    }, 250));

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
    
    // مستمعات Event Bus
    eventBus.on('quranSelectionChanged', (project) => updateUIFromProject(project));
    eventBus.on('backgroundChanged', (project) => {
        clearBackgroundElementsCache();
        updateAIBackgroundSelectionUI(project);
        updatePreview(); // تحديث المعاينة مباشرة
    });
    eventBus.on('textStyleChanged', (project) => updatePreview());
    eventBus.on('videoDimensionsChanged', (project) => updateCanvasDimensions(project.aspectRatio));
    eventBus.on('videoFilterChanged', (project) => {
        applyVideoFilterToCanvasEl(project.videoFilter);
        updatePreview();
    });
    
    eventBus.on('panelOpened', (panelId) => {
        if (panelId === 'background-settings-panel') {
            const suggestionsContainer = getElement('ai-bg-suggestions');
            // تحقق مما إذا كان فارغًا وما إذا كان زر AI مفعلاً (يعني أن المفتاح موجود)
            if (suggestionsContainer && suggestionsContainer.children.length === 0 && !getElement('apply-ai-bg').disabled) {
                 // لا تقم بالنقر التلقائي، دع المستخدم يقرر
                 // getElement('apply-ai-bg').click();
            }
        }
    });

    eventBus.on('projectStateRestoredByUndo', updateUIFromProject);
    eventBus.on('projectStateRestoredByRedo', updateUIFromProject);
    eventBus.on('projectSaved', (project) => refreshProjectsListView());
    eventBus.on('projectSet', (project) => { // عند استدعاء setCurrentProject
         updateUIFromProject(project); // تأكد من تحديث الواجهة بالكامل
    });
}


// --- نقطة انطلاق التطبيق ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onAppReady);
} else {
    onAppReady(); // DOMContentLoaded has already fired
}
