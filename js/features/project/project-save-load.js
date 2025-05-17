// js/features/project/project-save-load.js
import { LOCAL_STORAGE_PROJECTS_KEY, LOCAL_STORAGE_LAST_PROJECT_ID_KEY } from '../../config/constants.js';
import { getItem, setItem, removeItem } from '../../services/local-storage-service.js';
import { isValidProject } from './project-model.js';
import { handleError } from '../../core/error-handler.js';

/**
 * يحمل جميع المشاريع من التخزين المحلي.
 * @returns {Array<object>} مصفوفة من كائنات المشاريع، أو مصفوفة فارغة إذا لم يتم العثور على أي منها أو حدث خطأ.
 */
export function loadAllProjects() {
    const projects = getItem(LOCAL_STORAGE_PROJECTS_KEY);
    if (Array.isArray(projects)) {
        return projects.filter(p => isValidProject(p)); // تصفية المشاريع غير الصالحة
    }
    return [];
}

/**
 * يحفظ جميع المشاريع في التخزين المحلي.
 * @param {Array<object>} projects - مصفوفة المشاريع المراد حفظها.
 * @returns {boolean} true إذا نجحت العملية، false خلاف ذلك.
 */
function saveAllProjects(projects) {
    if (!Array.isArray(projects)) {
        handleError("نوع بيانات غير صالح: يجب أن تكون المشاريع مصفوفة.", "SaveAllProjects");
        return false;
    }
    return setItem(LOCAL_STORAGE_PROJECTS_KEY, projects);
}

/**
 * يحفظ مشروعًا واحدًا في التخزين المحلي.
 * سيضيف المشروع إذا كان جديدًا، أو يحدثه إذا كان موجودًا.
 * @param {object} projectData - كائن المشروع المراد حفظه.
 * @returns {boolean} true إذا نجحت العملية، false خلاف ذلك.
 */
export function saveProjectToStorage(projectData) {
    if (!isValidProject(projectData)) {
        handleError("محاولة حفظ كائن مشروع غير صالح.", "SaveProjectToStorage");
        return false;
    }

    const projects = loadAllProjects();
    const projectIndex = projects.findIndex(p => p.id === projectData.id);

    if (projectIndex > -1) {
        projects[projectIndex] = projectData; // تحديث موجود
    } else {
        projects.unshift(projectData); // إضافة جديد في بداية المصفوفة ليظهر أولاً
    }

    setItem(LOCAL_STORAGE_LAST_PROJECT_ID_KEY, projectData.id);
    return saveAllProjects(projects);
}

/**
 * يحذف مشروعًا من التخزين المحلي بواسطة معرفه.
 * @param {string} projectId - معرف المشروع المراد حذفه.
 * @returns {boolean} true إذا نجحت العملية وتم العثور على المشروع، false خلاف ذلك.
 */
export function deleteProjectFromStorage(projectId) {
    let projects = loadAllProjects();
    const initialLength = projects.length;
    projects = projects.filter(p => p.id !== projectId);

    if (projects.length < initialLength) {
        const lastProjectId = getItem(LOCAL_STORAGE_LAST_PROJECT_ID_KEY);
        if (lastProjectId === projectId) {
            removeItem(LOCAL_STORAGE_LAST_PROJECT_ID_KEY);
        }
        return saveAllProjects(projects);
    }
    return false; // لم يتم العثور على المشروع
}

/**
 * يسترجع مشروعًا واحدًا بواسطة معرفه.
 * @param {string} projectId - معرف المشروع المراد استرجاعه.
 * @returns {object|null} كائن المشروع، أو null إذا لم يتم العثور عليه.
 */
export function getProjectById(projectId) {
    if (!projectId) return null; // تحقق من وجود projectId
    const projects = loadAllProjects();
    return projects.find(p => p.id === projectId) || null;
}

/**
 * يحصل على معرف آخر مشروع تم فتحه/تحريره.
 * @returns {string|null} معرف المشروع أو null.
 */
export function getLastOpenedProjectId() {
    return getItem(LOCAL_STORAGE_LAST_PROJECT_ID_KEY);
}

/**
 * يمسح جميع المشاريع من التخزين. استخدم بحذر.
 */
export function clearAllProjectsFromStorage() {
    removeItem(LOCAL_STORAGE_PROJECTS_KEY);
    removeItem(LOCAL_STORAGE_LAST_PROJECT_ID_KEY);
    // console.log('تم مسح جميع المشاريع من التخزين.');
}
