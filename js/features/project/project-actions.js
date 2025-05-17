// js/features/project/project-actions.js
import { createNewProject, touchProject, isValidProject, DEFAULT_PROJECT_NAME } from './project-model.js';
import { saveProjectToStorage, loadAllProjects, deleteProjectFromStorage, getProjectById } from './project-save-load.js';
import { setCurrentProject, getCurrentProject, saveState } from '../../core/state-manager.js'; // تم إزالة resetHistory
import { renderProjectsList } from './project-list-ui.js';
import { getElement } from '../../core/dom-loader.js';
import eventBus from '../../core/event-bus.js';
import { withSpinner } from '../../ui/spinner-control.js';
import { showConfirm, showPrompt } from '../../ui/modal-handler.js';
import { updateUIFromProject } from '../../app.js'; // استيراد الدالة المركزية
import { openPanel, closeAllPanels } from '../../ui/panel-manager.js';

const initialScreen = getElement('initial-screen');
const editorScreen = getElement('editor-screen');
const currentProjectTitleEditor = getElement('current-project-title-editor');


export async function createAndEditNewProject() {
    console.log("createAndEditNewProject: بدء...");
    let newProject = createNewProject();

    const projectName = await showPrompt(
        'اسم المشروع الجديد',
        'الرجاء إدخال اسم لمشروعك:',
        newProject.name,
        'text',
        { placeholder: 'مثال: تلاوة سورة الفاتحة', required: true }
    );

    if (projectName === null) {
        console.log("createAndEditNewProject: ألغى المستخدم.");
        return;
    }
    
    newProject.name = projectName.trim() || DEFAULT_PROJECT_NAME;

    // setCurrentProject سيهيئ سجل التراجع/الإعادة مع هذا المشروع الجديد
    setCurrentProject(newProject); 

    saveProjectToStorage(newProject);
    refreshProjectsListView();

    switchToEditorScreen(newProject); // هذا يجب أن يستدعي updateUIFromProject
    // لا حاجة لاستدعاء updateUIFromProject(newProject) هنا مرة أخرى إذا كانت switchToEditorScreen تفعل ذلك
    
    // eventBus.emit('newProjectCreated', newProject); // سيتم إطلاق panelOpened من openPanel
    // فتح اللوحة الافتراضية بعد التأكد من أن الشاشة قد تغيرت وأن الواجهة محدثة
    // يمكن تأخير هذا قليلاً أو الاعتماد على eventBus إذا كان هناك تسلسل دقيق مطلوب
    setTimeout(() => openPanel('quran-selection-panel'), 0); 
    
    console.log("createAndEditNewProject: اكتمل.", newProject);
}

export async function loadProjectIntoEditor(projectId) {
    console.log(`loadProjectIntoEditor: تحميل مشروع ID: ${projectId}`);
    await withSpinner(async () => {
        const project = getProjectById(projectId);
        if (project && isValidProject(project)) {
            setCurrentProject(project); // يضبط المشروع ويهيئ السجل
            switchToEditorScreen(project);
            // updateUIFromProject(project); // يتم استدعاؤها بواسطة switchToEditorScreen
            setTimeout(() => openPanel('quran-selection-panel'), 0);
            eventBus.emit('projectLoadedInEditor', project);
        } else {
            handleError(`مشروع ID ${projectId} غير موجود أو غير صالح.`, "تحميل مشروع", true);
        }
    });
}

export function saveCurrentProject() {
    const project = getCurrentProject();
    if (!project) {
        eventBus.emit('showNotification', {type: 'error', message: 'لا يوجد مشروع حالي للحفظ.'});
        return;
    }
    touchProject(project);
    if (saveProjectToStorage(project)) {
        eventBus.emit('showNotification', { type: 'success', message: 'تم حفظ المشروع بنجاح!' });
        eventBus.emit('projectSaved', project); // لتحديث قائمة المشاريع إذا لزم الأمر
    }
    // لا حاجة لـ refreshProjectsListView هنا مباشرة
}

export async function deleteProject(projectInfo) {
    const confirmed = await showConfirm(
        'تأكيد الحذف',
        `هل أنت متأكد أنك تريد حذف المشروع "${projectInfo.projectName}"؟ لا يمكن التراجع عن هذا الإجراء.`
    );

    if (confirmed) {
        await withSpinner(async () => {
            if (deleteProjectFromStorage(projectInfo.projectId)) {
                eventBus.emit('showNotification', { type: 'info', message: `تم حذف المشروع "${projectInfo.projectName}".` });
                
                const current = getCurrentProject();
                if (current && current.id === projectInfo.projectId) {
                    // إذا تم حذف المشروع الحالي، قم بالتبديل إلى مشروع جديد فارغ
                    const newProj = createNewProject();
                    setCurrentProject(newProj); // هذا سيطلق حدث 'projectSet' الذي بدوره يستدعي updateUIFromProject
                    if (editorScreen.classList.contains('active-screen')) {
                        // لا حاجة لـ updateUI هنا، سيتم من projectSet
                        openPanel('quran-selection-panel');
                    }
                }
                refreshProjectsListView(); // تحديث القائمة بعد حذف المشروع
                eventBus.emit('projectDeleted', projectInfo.projectId);
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
    console.log("switchToEditorScreen - المشروع:", project?.name);
    if (!initialScreen || !editorScreen) {
        console.error("switchToEditorScreen: الشاشات غير موجودة!");
        return;
    }
    if (!project) {
        console.error("switchToEditorScreen: لا يوجد مشروع للتبديل إليه!");
        // كإجراء احتياطي، عد إلى الشاشة الرئيسية إذا لم يتم توفير مشروع
        switchToInitialScreen(); 
        return;
    }

    initialScreen.classList.remove('active-screen');
    initialScreen.style.display = 'none';
    
    editorScreen.classList.add('active-screen');
    editorScreen.style.display = 'flex'; // تأكد من أن العرض صحيح
    
    updateUIFromProject(project); // <<-- تحديث الواجهة بالكامل هنا
    
    eventBus.emit('screenChanged', 'editor');
}

export function switchToInitialScreen() {
    console.log("switchToInitialScreen");
    if (!initialScreen || !editorScreen) {
        console.error("switchToInitialScreen: الشاشات غير موجودة!");
        return;
    }

    editorScreen.classList.remove('active-screen');
    editorScreen.style.display = 'none';
    
    initialScreen.classList.add('active-screen');
    initialScreen.style.display = 'flex';
    
    refreshProjectsListView();
    closeAllPanels();
    eventBus.emit('screenChanged', 'initial');
}

export function initializeProjectActions() {
    console.log("initializeProjectActions: بدء تهيئة...");

    // ربط الأحداث العامة أولاً
    eventBus.on('loadProjectRequested', loadProjectIntoEditor);
    eventBus.on('deleteProjectRequested', deleteProject);
    eventBus.on('duplicateProjectRequested', duplicateProject);

    const goToEditorBtn = getElement('go-to-editor-btn');
    if (goToEditorBtn) {
        goToEditorBtn.addEventListener('click', createAndEditNewProject);
    } else {
        console.error("initializeProjectActions: زر 'go-to-editor-btn' غير موجود!");
    }

    const backToInitialScreenBtn = getElement('back-to-initial-screen-btn');
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
            } else if (confirmed === false) { 
                switchToInitialScreen(); 
            }
        });
    }

    const saveProjectBtnEditor = getElement('save-project-btn-editor');
    if (saveProjectBtnEditor) {
        saveProjectBtnEditor.addEventListener('click', saveCurrentProject);
    }
    
    // عرض المشاريع الموجودة عند التحميل الأولي (إذا كانت الشاشة الأولية هي النشطة)
    // refreshProjectsListView(); // يتم استدعاؤها الآن من main() بعد تهيئة كل شيء

    console.log("initializeProjectActions: اكتملت التهيئة.");
}
