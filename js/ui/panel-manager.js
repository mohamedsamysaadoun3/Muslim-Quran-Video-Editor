// js/ui/panel-manager.js
import { getElement, $$ } from '../core/dom-loader.js';
import eventBus from '../core/event-bus.js';
import { getCurrentProject } from '../core/state-manager.js';


const mainBottomTabBar = getElement('main-bottom-tab-bar');
const controlPanelsContainer = getElement('active-control-panels-container');
let tabButtons = [];
let controlPanels = [];
let currentOpenPanelId = null;

/**
 * يهيئ مدير اللوحات عن طريق العثور على أزرار التبويب واللوحات.
 */
export function initializePanelManager() {
    if (!mainBottomTabBar || !controlPanelsContainer) {
        console.error("لم يتم العثور على العناصر الأساسية لمدير اللوحات (شريط التبويب أو حاوية اللوحات).");
        return;
    }

    tabButtons = Array.from($$('.main-tab-button', mainBottomTabBar));
    controlPanels = Array.from($$('.control-panel', controlPanelsContainer));

    tabButtons.forEach(button => {
        button.addEventListener('click', () => handleTabButtonClick(button));
    });

    controlPanels.forEach(panel => {
        const closeButton = $('.panel-action-button.close-panel-btn', panel);
        const confirmButton = $('.panel-action-button.confirm-panel-btn', panel);

        if (closeButton) {
            closeButton.addEventListener('click', () => closePanel(panel.id));
        }
        if (confirmButton) { // أزرار التأكيد عادةً ما تغلق اللوحة أيضًا
            confirmButton.addEventListener('click', () => {
                // اختياريًا، أطلق حدثًا يفيد بأن هذه اللوحة قد تم تأكيدها
                eventBus.emit(`${panel.id}Confirmed`, getCurrentProject());
                closePanel(panel.id); // أغلق اللوحة بعد التأكيد
            });
        }
    });

    // في البداية، قد تكون هناك لوحة نشطة بناءً على HTML أو الحالة الافتراضية
    const activeTab = tabButtons.find(btn => btn.classList.contains('active'));
    if (activeTab) {
        const targetPanelId = activeTab.dataset.targetPanel;
        if (targetPanelId) openPanel(targetPanelId); // تأكد من وجود targetPanelId
    } else if (tabButtons.length > 0 && tabButtons[0].dataset.targetPanel) {
        // فتح أول تبويب بشكل افتراضي إذا لم يكن هناك أي تبويب نشط وكان لديه targetPanel
        handleTabButtonClick(tabButtons[0]);
    }
}

function handleTabButtonClick(button) {
    const targetPanelId = button.dataset.targetPanel;

    if (!targetPanelId) {
        console.warn('تم النقر على زر تبويب بدون السمة data-target-panel:', button);
        return;
    }

    // إذا تم النقر على نفس التبويب وكانت لوحته مفتوحة بالفعل، أغلقها (سلوك اختياري)
    // أو، إذا كانت لوحة من نوع "تأكيد"، ربما لا تفعل شيئًا أو أعد التركيز.
    // حاليًا، إذا كانت اللوحة مفتوحة، فإن النقر مرة أخرى سيغلقها.
    if (currentOpenPanelId === targetPanelId && getPanelElement(targetPanelId)?.classList.contains('visible')) {
        closePanel(targetPanelId);
        button.classList.remove('active'); // إلغاء تنشيط زر التبويب
    } else {
        openPanel(targetPanelId);
        // تحديث الحالة النشطة لأزرار التبويب
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    }
}

/**
 * يفتح لوحة تحكم معينة.
 * @param {string} panelId - معرف اللوحة المراد فتحها.
 */
export function openPanel(panelId) {
    if (!panelId) return;

    let panelFound = false;
    controlPanels.forEach(panel => {
        if (panel.id === panelId) {
            // لا تقم بالتحريك إذا كانت اللوحة مفتوحة بالفعل ومرئية
            if (!panel.classList.contains('visible')) {
                panel.classList.add('visible'); // سيؤدي هذا إلى تشغيل التحريك CSS
                eventBus.emit('panelOpened', panelId);
            }
            panelFound = true;
            currentOpenPanelId = panelId;
        } else {
            panel.classList.remove('visible'); // إخفاء اللوحات الأخرى
        }
    });

    if (!panelFound) {
        console.warn(`لم يتم العثور على لوحة بالمعرف '${panelId}'.`);
        currentOpenPanelId = null;
    }

    // تحديث زر التبويب النشط
    tabButtons.forEach(btn => {
        if (btn.dataset.targetPanel === panelId && panelFound) { // تأكد من العثور على اللوحة قبل تنشيط التبويب
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * يغلق لوحة تحكم معينة أو اللوحة المفتوحة حاليًا.
 * @param {string} [panelId] - معرف اللوحة المراد إغلاقها. إذا كان null، يغلق اللوحة المفتوحة حاليًا.
 */
export function closePanel(panelId) {
    const idToClose = panelId || currentOpenPanelId;
    if (!idToClose) return;

    const panelToClose = controlPanels.find(p => p.id === idToClose);
    if (panelToClose && panelToClose.classList.contains('visible')) {
        panelToClose.classList.remove('visible'); // سيؤدي هذا إلى تشغيل التحريك CSS للإخفاء
        eventBus.emit('panelClosed', idToClose);

        if (currentOpenPanelId === idToClose) {
            currentOpenPanelId = null;
            // إلغاء تنشيط زر التبويب المقابل
            tabButtons.forEach(btn => {
                if (btn.dataset.targetPanel === idToClose) {
                    btn.classList.remove('active');
                }
            });
        }
    }
}

/**
 * يغلق جميع لوحات التحكم المفتوحة.
 */
export function closeAllPanels() {
    controlPanels.forEach(panel => {
        if (panel.classList.contains('visible')) {
            panel.classList.remove('visible');
        }
    });
    tabButtons.forEach(btn => btn.classList.remove('active'));
    currentOpenPanelId = null;
    eventBus.emit('allPanelsClosed');
}

/**
 * يحصل على معرف اللوحة المفتوحة حاليًا.
 * @returns {string|null}
 */
export function getCurrentOpenPanelId() {
    return currentOpenPanelId;
}

// توفير طريقة للحصول على عنصر اللوحة نفسه إذا لزم الأمر
export function getPanelElement(panelId) {
    return controlPanels.find(p => p.id === panelId);
}
