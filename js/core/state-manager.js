// js/core/state-manager.js
import { MAX_UNDO_HISTORY } from '../config/constants.js';
import { createNewProject } from '../features/project/project-model.js';
import { getElement } from './dom-loader.js';
import eventBus from './event-bus.js';


let currentProject = createNewProject();
let history = [];
let historyIndex = -1;

/**
 * يحفظ الحالة الحالية للمشروع من أجل التراجع/الإعادة.
 * @param {string} actionDescription - وصف موجز للإجراء لأغراض التصحيح.
 */
export function saveState(actionDescription = "تغيرت الحالة") {
    // console.log(`حفظ الحالة: ${actionDescription}`);
    // استنساخ عميق لحالة المشروع الحالية
    const stateToSave = JSON.parse(JSON.stringify(currentProject));

    // إذا قمنا بالتراجع، ثم أجرينا تغييرًا جديدًا، قم بمسح سجل "الإعادة"
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }

    history.push(stateToSave);

    // تحديد حجم السجل
    if (history.length > MAX_UNDO_HISTORY) {
        history.shift(); // إزالة أقدم حالة
    } else {
        historyIndex++;
    }
    // تأكد من أن historyIndex لا يتجاوز الحد الأقصى بعد الإضافة والتحكم في الحجم
    if (historyIndex >= MAX_UNDO_HISTORY ) historyIndex = MAX_UNDO_HISTORY -1;


    updateUndoRedoButtons();
    eventBus.emit('stateChanged', {project: currentProject, action: actionDescription});
}

/**
 * يتراجع عن الإجراء الأخير.
 * @returns {object|null} حالة المشروع بعد التراجع، أو null إذا لم يكن التراجع ممكنًا.
 */
export function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        currentProject = JSON.parse(JSON.stringify(history[historyIndex]));
        updateUndoRedoButtons();
        // console.log('نجح التراجع. الحالة الجديدة:', currentProject);
        eventBus.emit('stateRestored', { project: currentProject, type: 'undo'});
        return currentProject;
    }
    // console.warn('لا يمكن التراجع: في بداية السجل.');
    return null;
}

/**
 * يعيد الإجراء الأخير الذي تم التراجع عنه.
 * @returns {object|null} حالة المشروع بعد الإعادة، أو null إذا لم تكن الإعادة ممكنة.
 */
export function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        currentProject = JSON.parse(JSON.stringify(history[historyIndex]));
        updateUndoRedoButtons();
        // console.log('نجحت الإعادة. الحالة الجديدة:', currentProject);
        eventBus.emit('stateRestored', { project: currentProject, type: 'redo'});
        return currentProject;
    }
    // console.warn('لا يمكن الإعادة: في نهاية السجل.');
    return null;
}

/**
 * يحصل على حالة المشروع الحالية.
 * @returns {object} كائن المشروع الحالي.
 */
export function getCurrentProject() {
    return currentProject;
}

/**
 * يضبط حالة المشروع الحالية، على سبيل المثال، عند تحميل مشروع.
 * هذا يمسح أيضًا سجل التراجع/الإعادة ويحفظ الحالة الجديدة كحالة أولية.
 * @param {object} projectData - بيانات المشروع للتحميل.
 * @param {boolean} [addToHistory=true] - هل تتم إضافة هذه الحالة المحملة إلى السجل.
 */
export function setCurrentProject(projectData, addToHistory = true) {
    currentProject = JSON.parse(JSON.stringify(projectData)); // استنساخ عميق
    if (addToHistory) {
        history = []; // مسح السجل القديم
        historyIndex = -1; // إعادة تعيين المؤشر
        saveState("تم تحميل المشروع"); // حفظ الحالة الجديدة كأول عنصر في السجل
    } else {
        // إذا لم تتم الإضافة إلى السجل (مثل التحديث الداخلي)، فقط تأكد من صحة الأزرار
        updateUndoRedoButtons();
    }
    eventBus.emit('projectSet', currentProject); // إعلام بأن المشروع قد تم تعيينه
}

/**
 * يعيد تعيين سجل التراجع/الإعادة.
 * يتم استدعاؤه عادةً عند إنشاء مشروع جديد أو تحميله.
 * @param {object} initialProjectState - حالة المشروع الأولية التي يبدأ بها السجل.
 */
export function resetHistory(initialProjectState) {
    history = [JSON.parse(JSON.stringify(initialProjectState))];
    historyIndex = 0;
    updateUndoRedoButtons();
}

/**
 * تحديث حالة أزرار التراجع والإعادة (مفعل/معطل).
 */
function updateUndoRedoButtons() {
    const undoBtn = getElement('undo-btn');
    const redoBtn = getElement('redo-btn');
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= history.length - 1;
}

// التهيئة الأولية للسجل عند بدء تشغيل التطبيق (بعد تحميل DOM)
// setTimeout(() => resetHistory(currentProject), 0); // تأجيل بسيط لضمان تهيئة كل شيء
