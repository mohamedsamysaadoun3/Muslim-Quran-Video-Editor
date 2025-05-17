// js/features/project/project-actions.js
import { createNewProject, touchProject, isValidProject, DEFAULT_PROJECT_NAME } from './project-model.js'; // استيراد DEFAULT_PROJECT_NAME
import { saveProjectToStorage, loadAllProjects, deleteProjectFromStorage, getProjectById } from './project-save-load.js';
import { setCurrentProject, getCurrentProject, resetHistory } from '../../core/state-manager.js';
import { renderProjectsList } from './project-list-ui.js';
import { getElement } from '../../core/dom-loader.js';
import eventBus from '../../core/event-bus.js';
import { withSpinner } from '../../ui/spinner-control.js';
import { showConfirm, showPrompt, showModal } from '../../ui/modal-handler.js'; // استيراد showModal
import { updateUIFromProject } from '../../app.js';
import { openPanel, closeAllPanels } from '../../ui/panel-manager.js';
import { DEFAULT_QURAN_PANEL } from '../../config/constants.js'; // افترض وجود ثابت للوحة الافتراضية

const initialScreen = getElement('initial-screen');
const editorScreen = getElement('editor-screen');
const currentProjectTitleEditor = getElement('current-project-title-editor');


/**
 * ينشئ مشروعًا جديدًا وينتقل إلى شاشة المحرر.
 */
export async function createAndEditNewProject() {
    console.log("createAndEditNewProject: بدء إنشاء مشروع جديد...");
    let newProject = createNewProject(); // احصل على مشروع جديد بالإعدادات الافتراضية

    const projectName = await showPrompt(
        'اسم المشروع الجديد',
        'الرجاء إدخال اسم لمشروعك الجديد:',
        newProject.name, // الاسم الافتراضي
        'text',
        { placeholder: 'مثال: تلاوة سورة الفاتحة', required: true } // اجعله مطلوبًا
    );

    if (projectName === null) { // ألغى المستخدم
        console.log("createAndEditNewProject: ألغى المستخدم إنشاء المشروع.");
        return;
    }
    
    // إذا لم يدخل المستخدم اسمًا ولكنه ضغط موافق، استخدم الاسم الافتراضي
    newProject.name = projectName.trim() || DEFAULT_PROJECT_NAME;

    setCurrentProject(newProject); // هذا يضبط المشروع الحالي ويهيئ سجل التراجع

    saveProjectToStorage(newProject);
    refreshProjectsListView(); // تحديث القائمة في الشاشة الرئيسية

    switchToEditorScreen(newProject); // الانتقال إلى شاشة المحرر
    // updateUIFromProject(newProject); // سيتم استدعاؤها ضمنيًا عند تغيير الشاشة أو من خلال أحداث أخرى
    
    openPanel('quran-selection-panel'); // فتح لوحة القرآن كلوحة افتراضية
    
    eventBus.emit('newProjectCreated', newProject);
    console.log("createAndEditNewProject: تم إنشاء مشروع جديد والانتقال للمحرر:", newProject);
}

// ... (باقي دوال loadProjectIntoEditor, saveCurrentProject, deleteProject, duplicateProject, refreshProjectsListView كما هي أو مع تعديلات طفيفة للتأكد من استدعاء updateUIFromProject عند الحاجة)
export async function loadProjectIntoEditor(projectId) {
    // ... (نفس الكود السابق مع التأكد من updateUIFromProject و openPanel)
    console.log(`loadProjectIntoEditor: تحميل مشروع ID: ${projectId}`);
    await withSpinner(async () => {
        const project = getProjectById(projectId);
        if (project && isValidProject(project)) {
            setCurrentProject(project);
            switchToEditorScreen(project);
            // updateUIFromProject(project); // سيتم استدعاؤها عند تغيير الشاشة
            openPanel('quran-selection-panel'); 
            eventBus.emit('projectLoadedInEditor', project);
        } else {
            handleError(`مشروع ID ${projectId} غير موجود أو غير صالح.`, "تحميل مشروع");
        }
    });
}

export function saveCurrentProject() {
    // ... (الكود السابق)
    const project = getCurrentProject();
    if (!project) return;
    touchProject(project);
    if(saveProjectToStorage(project)){
        eventBus.emit('showNotification', { type: 'success', message: 'تم حفظ المشروع بنجاح!' });
        eventBus.emit('projectSaved', project);
    }
}

export async function deleteProject(projectInfo) {
    // ... (الكود السابق مع التأكد من updateUIFromProject إذا تم حذف المشروع الحالي)
    const confirmed = await showConfirm(/* ... */);
    if(confirmed){
        await withSpinner(async () => {
            if(deleteProjectFromStorage(projectInfo.projectId)){
                // ...
                const current = getCurrentProject();
                if(current && current.id === projectInfo.projectId){
                    setCurrentProject(createNewProject());
                    if(editorScreen.classList.contains('active-screen')){
                        // updateUIFromProject(getCurrentProject()); // سيتم من خلال projectSet
                        openPanel('quran-selection-panel');
                    }
                }
                refreshProjectsListView();
                eventBus.emit('projectDeleted', projectInfo.projectId);
            }
        });
    }
}
export async function duplicateProject(projectId) {
    // ... (الكود السابق)
    await withSpinner(async () => {
        const originalProject = getProjectById(projectId);
        if(!originalProject) return;
        const duplicatedProject = JSON.parse(JSON.stringify(originalProject));
        // ... (تحديث id, name, timestamps)
        saveProjectToStorage(duplicatedProject);
        refreshProjectsListView();
        eventBus.emit('showNotification', { type: 'success', message: `تم نسخ المشروع "${originalProject.name}".` });
    });
}

export function refreshProjectsListView() {
    const allProjects = loadAllProjects();
    renderProjectsList(allProjects);
}


/**
 * يبدل العرض إلى شاشة المحرر.
 * @param {object} project - المشروع الذي يتم تحريره.
 */
export function switchToEditorScreen(project) {
    console.log("switchToEditorScreen: التبديل إلى شاشة المحرر للمشروع:", project?.name);
    if (!initialScreen || !editorScreen) {
        console.error("خطأ فادح: الشاشة الأولية أو شاشة المحرر غير موجودة في DOM.");
        return;
    }
    if (!project) {
        console.error("switchToEditorScreen: لا يوجد مشروع لتغيير الشاشة إليه.");
        // قد ترغب في العودة للشاشة الرئيسية أو إنشاء مشروع جديد هنا
        switchToInitialScreen();
        return;
    }

    initialScreen.classList.remove('active-screen');
    initialScreen.style.display = 'none';
    
    editorScreen.classList.add('active-screen');
    editorScreen.style.display = 'flex';
    
    if (currentProjectTitleEditor) {
        currentProjectTitleEditor.textContent = project.name || DEFAULT_PROJECT_NAME;
    }
    
    updateUIFromProject(project); // تحديث الواجهة بالكامل لتعكس هذا المشروع
    eventBus.emit('screenChanged', 'editor');
}

/**
 * يبدل العرض مرة أخرى إلى الشاشة الأولية (قائمة المشاريع).
 */
export function switchToInitialScreen() {
    console.log("switchToInitialScreen: التبديل إلى الشاشة الأولية");
    if (!initialScreen || !editorScreen) {
        console.error("خطأ فادح: الشاشة الأولية أو شاشة المحرر غير موجودة في DOM.");
        return;
    }

    editorScreen.classList.remove('active-screen');
    editorScreen.style.display = 'none';
    
    initialScreen.classList.add('active-screen');
    initialScreen.style.display = 'flex';
    
    refreshProjectsListView(); // تحديث قائمة المشاريع عند العودة
    closeAllPanels(); // أغلق أي لوحات تحكم قد تكون مفتوحة
    eventBus.emit('screenChanged', 'initial');
}


/**
 * يهيئ الإجراءات المتعلقة بالمشروع ومستمعي الأحداث.
 * يتم استدعاؤه مرة واحدة عند بدء تشغيل التطبيق.
 */
export function initializeProjectActions() {
    console.log("initializeProjectActions: بدء تهيئة إجراءات المشروع...");

    eventBus.on('loadProjectRequested', loadProjectIntoEditor);
    eventBus.on('deleteProjectRequested', deleteProject);
    eventBus.on('duplicateProjectRequested', duplicateProject);

    const goToEditorBtn = getElement('go-to-editor-btn');
    if (goToEditorBtn) {
        goToEditorBtn.addEventListener('click', createAndEditNewProject);
        console.log("initializeProjectActions: تم إرفاق مستمع لـ 'go-to-editor-btn'.");
    } else {
        console.error("initializeProjectActions: خطأ فادح - لم يتم العثور على زر 'go-to-editor-btn'!");
    }

    const backToInitialScreenBtn = getElement('back-to-initial-screen-btn');
    if (backToInitialScreenBtn) {
        backToInitialScreenBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm( /* ... */ );
            if (confirmed === true) { saveCurrentProject(); switchToInitialScreen(); }
            else if (confirmed === false) { switchToInitialScreen(); }
        });
    } else {
        console.warn("initializeProjectActions: لم يتم العثور على زر 'back-to-initial-screen-btn'.");
    }

    const saveProjectBtnEditor = getElement('save-project-btn-editor');
    if (saveProjectBtnEditor) {
        saveProjectBtnEditor.addEventListener('click', saveCurrentProject);
    } else {
        console.warn("initializeProjectActions: لم يتم العثور على زر 'save-project-btn-editor'.");
    }

    refreshProjectsListView(); // عرض المشاريع الموجودة عند التحميل
    console.log("initializeProjectActions: تم الانتهاء من تهيئة إجراءات المشروع.");
}
