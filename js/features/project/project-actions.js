// js/features/project/project-actions.js
import { createNewProject, touchProject, isValidProject } from './project-model.js';
import { saveProjectToStorage, loadAllProjects, deleteProjectFromStorage, getProjectById } from './project-save-load.js';
import { setCurrentProject, getCurrentProject, resetHistory } from '../../core/state-manager.js';
import { renderProjectsList } from './project-list-ui.js';
import { getElement } from '../../core/dom-loader.js';
import eventBus from '../../core/event-bus.js';
import { withSpinner } from '../../ui/spinner-control.js';
import { showConfirm, showPrompt } from '../../ui/modal-handler.js';
import { updateUIFromProject } from '../../app.js';
import { openPanel, closeAllPanels } from '../../ui/panel-manager.js';

const initialScreen = getElement('initial-screen');
const editorScreen = getElement('editor-screen');
const currentProjectTitleEditor = getElement('current-project-title-editor');


export async function createAndEditNewProject() {
    console.log("createAndEditNewProject called");
    let newProject = createNewProject();

    const projectName = await showPrompt(
        'اسم المشروع الجديد',
        'الرجاء إدخال اسم لمشروعك الجديد:',
        newProject.name,
        'text',
        { placeholder: 'مثال: تلاوة سورة الفاتحة' }
    );

    if (projectName === null) {
        console.log("User cancelled new project creation.");
        return;
    }
    if (projectName.trim()) { // إذا لم يكن فارغًا بعد إزالة المسافات
        newProject.name = projectName.trim();
    } else {
        newProject.name = DEFAULT_PROJECT_NAME; // العودة للاسم الافتراضي إذا كان فارغًا
    }

    setCurrentProject(newProject); // هذا يضبط المشروع الحالي ويهيئ سجل التراجع

    saveProjectToStorage(newProject);
    refreshProjectsListView();

    switchToEditorScreen(newProject);
    updateUIFromProject(newProject); // تحديث الواجهة بالكامل
    
    openPanel('quran-selection-panel'); 
    
    eventBus.emit('newProjectCreated', newProject);
    console.log("New project created and editor switched:", newProject);
}

export async function loadProjectIntoEditor(projectId) {
    console.log(`loadProjectIntoEditor called for ID: ${projectId}`);
    await withSpinner(async () => {
        const project = getProjectById(projectId);
        if (project && isValidProject(project)) {
            setCurrentProject(project);
            switchToEditorScreen(project);
            updateUIFromProject(project);
            openPanel('quran-selection-panel'); 
            eventBus.emit('projectLoadedInEditor', project);
            console.log("Project loaded into editor:", project);
        } else {
            console.error(`لم يتم العثور على مشروع بالمعرف ${projectId} أو أنه غير صالح.`);
            eventBus.emit('showNotification', { type: 'error', message: 'فشل تحميل المشروع.' });
        }
    });
}

export function saveCurrentProject() {
    const project = getCurrentProject();
    if (!project) {
        eventBus.emit('showNotification', { type: 'error', message: 'لا يوجد مشروع حالي للحفظ.' });
        return;
    }
    touchProject(project);
    const success = saveProjectToStorage(project);
    if (success) {
        eventBus.emit('showNotification', { type: 'success', message: 'تم حفظ المشروع بنجاح!' });
        eventBus.emit('projectSaved', project); // إرسال حدث بأن المشروع قد تم حفظه
    }
    // لا حاجة لتحديث قائمة المشاريع هنا إلا إذا كان المستخدم على الشاشة الرئيسية
    // EventBus 'projectSaved' يمكن استخدامه لتحديث القائمة إذا لزم الأمر
}

export async function deleteProject(projectInfo) {
    const confirmed = await showConfirm(
        'تأكيد الحذف',
        `هل أنت متأكد أنك تريد حذف المشروع "${projectInfo.projectName}"؟ لا يمكن التراجع عن هذا الإجراء.`
    );

    if (confirmed) {
        await withSpinner(async () => {
            const success = deleteProjectFromStorage(projectInfo.projectId);
            if (success) {
                eventBus.emit('showNotification', { type: 'info', message: `تم حذف المشروع "${projectInfo.projectName}".` });
                refreshProjectsListView();
                eventBus.emit('projectDeleted', projectInfo.projectId);

                const current = getCurrentProject();
                if (current && current.id === projectInfo.projectId) {
                    // إذا تم حذف المشروع الحالي، قم بالتبديل إلى مشروع جديد فارغ
                    const newProj = createNewProject(); 
                    setCurrentProject(newProj);
                    if(editorScreen.classList.contains('active-screen')) {
                         updateUIFromProject(newProj); // تحديث واجهة المحرر
                         openPanel('quran-selection-panel'); // فتح لوحة القرآن
                    } else {
                        // إذا كنا في الشاشة الرئيسية، لا يوجد إجراء إضافي ضروري هنا
                    }
                }
            } else {
                eventBus.emit('showNotification', { type: 'error', message: 'فشل حذف المشروع.' });
            }
        });
    }
}

export async function duplicateProject(projectId) {
    await withSpinner(async () => {
        const originalProject = getProjectById(projectId);
        if (!originalProject) {
            eventBus.emit('showNotification', { type: 'error', message: 'المشروع الأصلي غير موجود.' });
            return;
        }

        const duplicatedProject = JSON.parse(JSON.stringify(originalProject));
        duplicatedProject.id = `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        duplicatedProject.name = `${originalProject.name} (نسخة)`;
        duplicatedProject.createdAt = new Date().toISOString();
        touchProject(duplicatedProject);

        saveProjectToStorage(duplicatedProject);
        refreshProjectsListView();
        eventBus.emit('showNotification', { type: 'success', message: `تم نسخ المشروع "${originalProject.name}".` });
        eventBus.emit('projectDuplicated', duplicatedProject);
    });
}

export function refreshProjectsListView() {
    const allProjects = loadAllProjects();
    renderProjectsList(allProjects);
}

export function switchToEditorScreen(project) {
    console.log("Switching to editor screen for project:", project.name);
    if (currentProjectTitleEditor) {
        currentProjectTitleEditor.textContent = project.name || 'مشروع جديد';
    }
    initialScreen.classList.remove('active-screen');
    initialScreen.style.display = 'none';
    
    editorScreen.classList.add('active-screen');
    editorScreen.style.display = 'flex';
    
    eventBus.emit('screenChanged', 'editor');
}

export function switchToInitialScreen() {
    console.log("Switching to initial screen");
    editorScreen.classList.remove('active-screen');
    editorScreen.style.display = 'none';
    
    initialScreen.classList.add('active-screen');
    initialScreen.style.display = 'flex';
    
    refreshProjectsListView();
    closeAllPanels(); // أغلق أي لوحات تحكم عند العودة للشاشة الرئيسية
    eventBus.emit('screenChanged', 'initial');
}

export function initializeProjectActions() {
    console.log("Initializing project actions...");
    eventBus.on('loadProjectRequested', loadProjectIntoEditor);
    eventBus.on('deleteProjectRequested', deleteProject);
    eventBus.on('duplicateProjectRequested', duplicateProject);

    const goToEditorBtn = getElement('go-to-editor-btn');
    const backToInitialScreenBtn = getElement('back-to-initial-screen-btn');
    const saveProjectBtnEditor = getElement('save-project-btn-editor');

    if (goToEditorBtn) {
        console.log("Attaching listener to go-to-editor-btn");
        goToEditorBtn.addEventListener('click', createAndEditNewProject);
    } else {
        console.error("go-to-editor-btn not found!");
    }

    if (backToInitialScreenBtn) {
        backToInitialScreenBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm(
                "العودة إلى القائمة الرئيسية",
                "هل تريد حفظ التغييرات قبل العودة؟",
                "حفظ والعودة",
                "العودة بدون حفظ"
            );
            if (confirmed === true) {
                 saveCurrentProject();
                 switchToInitialScreen();
            } else if (confirmed === false) { // يشمل حالة الرفض (ESC) من showConfirm
                 switchToInitialScreen();
            }
        });
    }
    if (saveProjectBtnEditor) {
        saveProjectBtnEditor.addEventListener('click', saveCurrentProject);
    }

    refreshProjectsListView(); // تأكد من عرض المشاريع عند بدء التشغيل
    console.log("Project actions initialized.");
}
