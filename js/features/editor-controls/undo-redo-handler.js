// js/features/editor-controls/undo-redo-handler.js
import { getElement } from '../../core/dom-loader.js';
import { undo as performUndo, redo as performRedo } from '../../core/state-manager.js';
import { updateUIFromProject } from '../../app.js'; // لتحديث واجهة المستخدم بالكامل بعد التراجع/الإعادة
import eventBus from '../../core/event-bus.js'; // للاستماع إلى تغييرات الحالة إذا لزم الأمر

const undoBtn = getElement('undo-btn');
const redoBtn = getElement('redo-btn');

export function initializeUndoRedo() {
    if (undoBtn) {
        undoBtn.addEventListener('click', handleUndo);
    } else {
        console.warn("لم يتم العثور على زر التراجع (undo-btn).");
    }

    if (redoBtn) {
        redoBtn.addEventListener('click', handleRedo);
    } else {
        console.warn("لم يتم العثور على زر الإعادة (redo-btn).");
    }

    // مدير الحالة (state-manager.js) هو المسؤول عن تحديث حالة تعطيل/تمكين هذه الأزرار.
    // لا حاجة للاستماع إلى أحداث 'stateChanged' أو 'stateRestored' هنا لهذا الغرض تحديدًا.
    // console.log("تم تهيئة وظيفة التراجع/الإعادة.");
}

function handleUndo() {
    // console.log("محاولة التراجع...");
    const restoredProject = performUndo(); // استدعاء دالة التراجع من مدير الحالة
    if (restoredProject) {
        // console.log("تم التراجع بنجاح. تحديث واجهة المستخدم...", restoredProject);
        updateUIFromProject(restoredProject); // تحديث الواجهة بالكامل لتعكس الحالة المستعادة
        eventBus.emit('showNotification', {type: 'info', message: 'تم التراجع.', duration: 1500});
    } else {
        // console.log("لا يوجد شيء للتراجع عنه.");
        eventBus.emit('showNotification', {type: 'warning', message: 'لا يوجد إجراء للتراجع عنه.', duration: 2000});
    }
}

function handleRedo() {
    // console.log("محاولة الإعادة...");
    const restoredProject = performRedo(); // استدعاء دالة الإعادة من مدير الحالة
    if (restoredProject) {
        // console.log("تمت الإعادة بنجاح. تحديث واجهة المستخدم...", restoredProject);
        updateUIFromProject(restoredProject); // تحديث الواجهة بالكامل لتعكس الحالة المستعادة
        eventBus.emit('showNotification', {type: 'info', message: 'تمت الإعادة.', duration: 1500});
    } else {
        // console.log("لا يوجد شيء للإعادة.");
        eventBus.emit('showNotification', {type: 'warning', message: 'لا يوجد إجراء للإعادة.', duration: 2000});
    }
}
