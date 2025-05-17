// js/features/text/text-style-controls.js
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject, setCurrentProject, saveState } from '../../core/state-manager.js';
import eventBus from '../../core/event-bus.js';
// updatePreview يتم استدعاؤه عبر eventBus 'textStyleChanged' -> app.js -> updateUIFromProject -> updatePreview

const fontSelect = getElement('font-select');
const fontSizeSlider = getElement('font-size-slider');
const fontSizeValueDisplay = getElement('font-size-value'); // اسم أوضح لعرض قيمة حجم الخط
const fontColorPicker = getElement('font-color-picker');
const ayahBgColorPicker = getElement('ayah-bg-color-picker');
const textEffectSelect = getElement('text-effect-select');

export function initializeTextStyleControls() {
    if (!fontSelect || !fontSizeSlider || !fontSizeValueDisplay || !fontColorPicker || !ayahBgColorPicker || !textEffectSelect) {
        console.warn("واحد أو أكثر من عناصر التحكم في نمط النص مفقود من DOM.");
        // يمكنك اختيار تعطيل هذه الوحدة أو أجزاء منها إذا كانت العناصر مفقودة
    }

    if (fontSelect) fontSelect.addEventListener('change', handleFontChange);
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', handleFontSizeChange); // 'input' للتحديث المباشر
        fontSizeSlider.addEventListener('change', handleFontSizeFinalChange); // حفظ الحالة عند التغيير النهائي
    }
    if (fontColorPicker) fontColorPicker.addEventListener('input', handleFontColorChange);
    if (ayahBgColorPicker) ayahBgColorPicker.addEventListener('input', handleAyahBgColorChange);
    if (textEffectSelect) textEffectSelect.addEventListener('change', handleTextEffectChange);

    // تحديث عرض قيمة شريط التمرير مبدئيًا (يتم أيضًا في updateTextStyleControlsUI)
    const project = getCurrentProject();
    if (fontSizeSlider && fontSizeValueDisplay && project) {
        fontSizeSlider.value = project.fontSize; // تأكد من أن شريط التمرير يعكس قيمة المشروع
        fontSizeValueDisplay.textContent = `${project.fontSize}px`;
    } else if (fontSizeSlider && fontSizeValueDisplay) { // إذا لم يكن هناك مشروع بعد (حالة نادرة)
        fontSizeValueDisplay.textContent = `${fontSizeSlider.value}px`;
    }
}

function handleFontChange(event) {
    const project = getCurrentProject();
    if (!project) return;
    project.fontFamily = event.target.value;
    setCurrentProject(project, false);
    saveState("تم تغيير خط النص: " + project.fontFamily);
    eventBus.emit('textStyleChanged', project);
}

function handleFontSizeChange(event) { // للتحديث المباشر أثناء السحب
    const project = getCurrentProject();
    if (!project) return;
    const newSize = parseInt(event.target.value);
    project.fontSize = newSize;
    if (fontSizeValueDisplay) {
        fontSizeValueDisplay.textContent = `${newSize}px`;
    }
    setCurrentProject(project, false); // تحديث داخلي للمعاينة المباشرة
    eventBus.emit('textStyleChanged', project); // إطلاق حدث لتحديث المعاينة
}

function handleFontSizeFinalChange(event) { // عند ترك شريط التمرير
    const project = getCurrentProject();
    if (!project) return;
    const finalSize = parseInt(event.target.value);
    // تأكد من أن project.fontSize محدث بالقيمة النهائية
    if (project.fontSize !== finalSize) {
        project.fontSize = finalSize;
        setCurrentProject(project, false); // إذا لم يتم تحديثه بالفعل بواسطة 'input'
    }
    saveState("تم تغيير حجم الخط: " + finalSize + "px");
    // لا حاجة لإطلاق 'textStyleChanged' هنا مرة أخرى إذا كان 'input' يفعله
}


function handleFontColorChange(event) {
    const project = getCurrentProject();
    if (!project) return;
    project.fontColor = event.target.value;
    setCurrentProject(project, false);
    saveState("تم تغيير لون الخط: " + project.fontColor);
    eventBus.emit('textStyleChanged', project);
}

function handleAyahBgColorChange(event) {
    const project = getCurrentProject();
    if (!project) return;
    project.ayahBgColor = event.target.value;
    setCurrentProject(project, false);
    saveState("تم تغيير لون خلفية الآية: " + project.ayahBgColor);
    eventBus.emit('textStyleChanged', project);
}

function handleTextEffectChange(event) {
    const project = getCurrentProject();
    if (!project) return;
    project.textEffect = event.target.value;
    setCurrentProject(project, false);
    saveState("تم تغيير تأثير النص: " + project.textEffect);
    eventBus.emit('textStyleChanged', project);
}

/**
 * يحدث عناصر تحكم واجهة المستخدم لنمط النص بناءً على حالة المشروع الحالية.
 * @param {object} project - بيانات المشروع الحالية.
 */
export function updateTextStyleControlsUI(project) {
    if (!project) return;

    if (fontSelect && project.fontFamily) {
        fontSelect.value = project.fontFamily;
    }
    if (fontSizeSlider && project.fontSize) {
        fontSizeSlider.value = project.fontSize;
        if (fontSizeValueDisplay) fontSizeValueDisplay.textContent = `${project.fontSize}px`;
    }
    if (fontColorPicker && project.fontColor) {
        fontColorPicker.value = project.fontColor;
    }
    if (ayahBgColorPicker && project.ayahBgColor) {
        ayahBgColorPicker.value = project.ayahBgColor;
    }
    if (textEffectSelect && project.textEffect) {
        textEffectSelect.value = project.textEffect;
    }
}
