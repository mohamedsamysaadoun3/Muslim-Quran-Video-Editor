// js/features/video/video-dimensions.js
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject, setCurrentProject, saveState } from '../../core/state-manager.js';
import { updateCanvasDimensions } from './canvas-preview.js';
import eventBus from '../../core/event-bus.js';

const aspectRatioSelect = getElement('aspect-ratio-select');

export function initializeVideoDimensionsControls() {
    if (aspectRatioSelect) {
        aspectRatioSelect.addEventListener('change', handleAspectRatioChange);
    } else {
        console.warn("لم يتم العثور على عنصر تحديد نسبة الأبعاد (aspect-ratio-select).");
    }
}

function handleAspectRatioChange(event) {
    const newAspectRatio = event.target.value;
    const project = getCurrentProject();
    if (!project) return;

    project.aspectRatio = newAspectRatio;

    setCurrentProject(project, false);
    saveState("تم تغيير نسبة العرض إلى الارتفاع: " + newAspectRatio);
    eventBus.emit('videoDimensionsChanged', project); // سيستمع canvas-preview لهذا

    // updateCanvasDimensions(newAspectRatio); // يتم استدعاؤها الآن من خلال eventBus -> app.js -> updateUIFromProject
}

/**
 * يحدث عنصر تحكم واجهة المستخدم لنسبة العرض إلى الارتفاع بناءً على حالة المشروع الحالية.
 * @param {object} project - بيانات المشروع الحالية.
 */
export function updateVideoDimensionsUI(project) {
    if (!project) return;
    if (aspectRatioSelect && project.aspectRatio) {
        aspectRatioSelect.value = project.aspectRatio;
    }
}

/**
 * يحصل على أبعاد التصدير بناءً على selected resolution and project aspect ratio.
 * @param {string} resolutionStr - e.g., "1920x1080" (selected export resolution).
 * @param {string} aspectRatioStr - e.g., "16:9" (project's aspect ratio).
 * @returns {{width: number, height: number}}
 */
export function getExportDimensions(resolutionStr, aspectRatioStr) {
    const [exportBaseWidth, exportBaseHeight] = resolutionStr.split('x').map(Number);
    const [ratioW, ratioH] = aspectRatioStr.split(':').map(Number);

    let finalWidth, finalHeight;

    // إذا كانت نسبة المشروع هي نفسها دقة التصدير (أو معكوسة)
    const projectAR = ratioW / ratioH;
    const exportAR = exportBaseWidth / exportBaseHeight;

    if ( Math.abs(projectAR - exportAR) < 0.01 || Math.abs(projectAR - (1/exportAR)) < 0.01 ) {
        // إذا كان المشروع عموديًا ودقة التصدير أفقية
        if (projectAR < 1 && exportAR > 1) {
            finalWidth = exportBaseHeight; // استخدم ارتفاع التصدير كعرض نهائي
            finalHeight = exportBaseWidth;  // استخدم عرض التصدير كارتفاع نهائي
        } 
        // إذا كان المشروع أفقيًا ودقة التصدير عمودية
        else if (projectAR > 1 && exportAR < 1) {
            finalWidth = exportBaseHeight;
            finalHeight = exportBaseWidth;
        }
        // إذا كانت النسبتان متطابقتين في الاتجاه
        else {
            finalWidth = exportBaseWidth;
            finalHeight = exportBaseHeight;
        }
    } else {
        // إذا كانت نسب الأبعاد مختلفة تمامًا (مثل مشروع مربع 1:1 وتصدير 16:9)
        // اجعل أكبر بُعد للمشروع يطابق أكبر بُعد للتصدير، ثم احسب البُعد الآخر
        if (ratioW / ratioH > 1) { // المشروع أفقي أو مربع يميل للأفقي
            finalWidth = exportBaseWidth;
            finalHeight = Math.round((exportBaseWidth * ratioH) / ratioW);
        } else { // المشروع عمودي أو مربع يميل للعمودي
            finalHeight = exportBaseHeight;
            finalWidth = Math.round((exportBaseHeight * ratioW) / ratioH);
        }
    }
    
    // تأكد من أن الأبعاد زوجية
    if (finalWidth % 2 !== 0) finalWidth++;
    if (finalHeight % 2 !== 0) finalHeight++;
    
    // console.log(`أبعاد التصدير النهائية للدقة ${resolutionStr} ونسبة ${aspectRatioStr}: ${finalWidth}x${finalHeight}`);
    return { width: finalWidth, height: finalHeight };
}
