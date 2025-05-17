// js/features/video/canvas-preview.js
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject } from '../../core/state-manager.js';
import { getBackgroundImageElement, getBackgroundVideoElement } from '../background/background-state.js';
import { applyTextEffectAndDraw } from '../text/text-render-effects.js';
import { getOverallCurrentTime, getCurrentAyahPlaybackInfo, getIsPlaying as getIsAudioPlaying } from '../audio/main-audio-playback.js';
import { wrapTextOnCanvas } from '../../utils/text-utils.js';
import eventBus from '../../core/event-bus.js'; // لاستخدامه إذا لزم الأمر

const videoPreviewCanvas = getElement('video-preview-canvas');
const previewOverlayContent = getElement('preview-overlay-content');
const previewSurahTitleOverlay = getElement('preview-surah-title-overlay');
const previewAyahTextOverlay = getElement('preview-ayah-text-overlay');
const previewTranslationTextOverlay = getElement('preview-translation-text-overlay');

let ctx = null;
let animationFrameId = null; // لتتبع معرّف إطار الرسم المتحرك

export function initializeCanvasPreview() {
    if (!videoPreviewCanvas) {
        console.error("لم يتم العثور على عنصر كانفاس معاينة الفيديو.");
        return;
    }
    try {
        ctx = videoPreviewCanvas.getContext('2d', { alpha: false }); // alpha: false قد يحسن الأداء إذا لم تكن هناك شفافية
        if (!ctx) {
            throw new Error("فشل الحصول على سياق 2D للكانفاس.");
        }
    } catch (e) {
        console.error("خطأ في تهيئة سياق الكانفاس:", e);
        // قد ترغب في عرض رسالة للمستخدم هنا بأن الكانفاس غير مدعوم
        return;
    }
    
    // الأبعاد الأولية ستُضبط بواسطة updateUIFromProject -> updateCanvasDimensions
    // console.log("تم تهيئة معاينة الكانفاس.");
}

/**
 * حلقة العرض الرئيسية لمعاينة الكانفاس.
 */
function renderLoop() {
    const project = getCurrentProject();
    if (!project || !ctx) { // تأكد من وجود المشروع والسياق
        stopPreviewRenderLoop(); // أوقف الحلقة إذا لم تكن هناك بيانات كافية
        return;
    }
    const overallTime = getOverallCurrentTime();

    drawFrame(project, overallTime, false).then(() => {
        if (getElement('editor-screen').classList.contains('active-screen')) {
            animationFrameId = requestAnimationFrame(renderLoop);
        } else {
            stopPreviewRenderLoop(); // أوقف الحلقة إذا لم تعد شاشة المحرر نشطة
        }
    }).catch(err => {
        console.error("خطأ في حلقة عرض المعاينة:", err);
        stopPreviewRenderLoop();
    });
}

export function startPreviewRenderLoop() {
    if (animationFrameId) return; // لا تبدأ إذا كانت تعمل بالفعل
    if (!ctx) { // إذا لم يتم تهيئة السياق بنجاح
        console.warn("لا يمكن بدء حلقة العرض: سياق الكانفاس غير مهيأ.");
        return;
    }
    // console.log("بدء حلقة عرض المعاينة.");
    animationFrameId = requestAnimationFrame(renderLoop); // ابدأ الحلقة
}

export function stopPreviewRenderLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        // console.log("إيقاف حلقة عرض المعاينة.");
    }
}

/**
 * يرسم إطارًا واحدًا على الكانفاس بناءً على حالة المشروع والوقت الحالي.
 * @param {object} project - بيانات المشروع الحالية.
 * @param {number} time - الوقت الحالي بالثواني لتسلسل الفيديو.
 * @param {boolean} [isExporting=false] - علامة إذا كان هذا الإطار للتصدير.
 * @returns {Promise<boolean>} - true إذا كان هناك تأثير نصي نشط، false خلاف ذلك.
 */
export async function drawFrame(project, time, isExporting = false) {
    if (!ctx || !project || !videoPreviewCanvas) return false;

    const canvas = videoPreviewCanvas;
    // مسح الكانفاس باللون الأساسي للخلفية (مهم إذا كانت الخلفية صورة/فيديو بشفافية أو لا تغطي بالكامل)
    ctx.fillStyle = project.backgroundColor || (document.body.classList.contains('dark-theme') ? '#121212' : '#FFFFFF');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. رسم الخلفية
    switch (project.backgroundType) {
        case 'color':
            // تم الرسم بالفعل أعلاه
            break;
        case 'image':
            if (project.backgroundImage) {
                try {
                    const img = await getBackgroundImageElement(project);
                    if (img && img.complete && img.naturalHeight !== 0) {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                } catch (e) { /* getBackgroundImageElement يعالج الخطأ */ }
            }
            break;
        case 'video':
            if (project.backgroundVideo) {
                try {
                    const video = await getBackgroundVideoElement(project);
                    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                        if (!isExporting) { // التحكم في تشغيل/إيقاف الفيديو للمعاينة
                            if (getIsAudioPlaying() && video.paused) video.play().catch(()=>{});
                            else if (!getIsAudioPlaying() && !video.paused) video.pause();
                        } else if (video.currentTime !== time) { // للتصدير، مزامنة وقت الفيديو
                            video.currentTime = time;
                            // قد نحتاج لانتظار 'seeked' هنا
                        }
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    }
                } catch(e) { /* getBackgroundVideoElement يعالج الخطأ */ }
            }
            break;
    }

    // 2. البحث عن الآية الحالية بناءً على الوقت
    const { ayah, timeIntoAyah, timeIntoDisplay } = findAyahAtTime(project, time);

    // 3. رسم النص (عنوان السورة، نص الآية، الترجمة)
    let textEffectIsActive = false;
    if (!isExporting && previewOverlayContent) { // --- استخدام تراكب HTML للمعاينة ---
        previewOverlayContent.style.fontFamily = project.fontFamilyUi || 'Tajawal';
        previewOverlayContent.style.color = project.fontColor;
        
        if (ayah) {
            previewSurahTitleOverlay.textContent = project.surahName || (project.surah ? `سورة ${project.surah}`: '');
            previewSurahTitleOverlay.style.display = 'block';
            previewSurahTitleOverlay.style.fontFamily = project.fontFamilyUi || 'Tajawal';
            previewSurahTitleOverlay.style.fontSize = `${Math.max(14, project.fontSize * 0.6)}px`;

            previewAyahTextOverlay.textContent = ayah.text;
            previewAyahTextOverlay.style.fontSize = `${project.fontSize}px`;
            previewAyahTextOverlay.style.fontFamily = project.fontFamily;
            previewAyahTextOverlay.style.backgroundColor = project.ayahBgColor || 'transparent';
            previewAyahTextOverlay.style.display = 'block';

            if (project.translation && ayah.translationText) {
                previewTranslationTextOverlay.textContent = ayah.translationText;
                const translationFontSize = Math.max(12, project.fontSize * 0.5);
                previewTranslationTextOverlay.style.fontSize = `${translationFontSize}px`;
                previewTranslationTextOverlay.style.fontFamily = project.fontFamilyUi || 'Tajawal';
                previewTranslationTextOverlay.style.display = 'block';
            } else {
                previewTranslationTextOverlay.style.display = 'none';
            }
        } else {
            previewSurahTitleOverlay.style.display = 'none';
            previewAyahTextOverlay.style.display = 'none';
            previewTranslationTextOverlay.style.display = 'none';
        }
    } else if (isExporting && ayah && ctx) { // --- الرسم مباشرة على الكانفاس للتصدير ---
        ctx.fillStyle = project.fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // عنوان السورة
        const surahTitleFontSize = project.fontSize * 0.6; // يمكن جعله إعدادًا
        ctx.font = `bold ${surahTitleFontSize}px '${project.fontFamilyUi || 'Tajawal'}'`;
        const surahTitleY = canvas.height * 0.15;
        ctx.fillText(project.surahName || `سورة ${project.surah}`, canvas.width / 2, surahTitleY);

        // نص الآية
        ctx.font = `${project.fontSize}px '${project.fontFamily}'`;
        const ayahLines = wrapTextOnCanvas(ctx, ayah.text, canvas.width * 0.85);
        const lineHeight = project.fontSize * (project.fontFamily.includes('Amiri') ? 1.7 : 1.5);
        const totalAyahTextHeight = ayahLines.length * lineHeight;
        const ayahTextStartY = canvas.height / 2 - totalAyahTextHeight / 2 + (project.fontSize * 0.1);

        if (project.ayahBgColor && project.ayahBgColor !== 'rgba(0,0,0,0)' && project.ayahBgColor !== '#00000000') {
            ctx.fillStyle = project.ayahBgColor;
            let maxLineWidth = 0;
            ayahLines.forEach(line => maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width));
            maxLineWidth = Math.min(maxLineWidth, canvas.width * 0.9);
            const bgPadding = project.fontSize * 0.3;
            ctx.fillRect(
                canvas.width / 2 - maxLineWidth / 2 - bgPadding,
                ayahTextStartY - lineHeight/2 + (lineHeight - project.fontSize)/2 - bgPadding * 0.5,
                maxLineWidth + bgPadding * 2,
                totalAyahTextHeight + bgPadding
            );
            ctx.fillStyle = project.fontColor;
        }

        const ayahAudioDuration = ayah.duration || 0.1; // مدة صوت الآية
        ayahLines.forEach((line, i) => {
            const lineY = ayahTextStartY + (i * lineHeight);
            if (applyTextEffectAndDraw(ctx, line, canvas.width / 2, lineY, project, timeIntoAyah, ayahAudioDuration)) {
                textEffectIsActive = true;
            }
        });

        // نص الترجمة
        if (project.translation && ayah.translationText) {
            const translationFontSize = Math.max(12, project.fontSize * 0.5);
            ctx.font = `normal ${translationFontSize}px '${project.fontFamilyUi || 'Tajawal'}'`;
            const translationLines = wrapTextOnCanvas(ctx, ayah.translationText, canvas.width * 0.8);
            const translationTextStartY = ayahTextStartY + totalAyahTextHeight - lineHeight/2 + (project.fontSize * 0.4);
            translationLines.forEach((line, i) => {
                 ctx.fillText(line, canvas.width / 2, translationTextStartY + (i * (translationFontSize * 1.4)));
            });
        }
    }
    return textEffectIsActive;
}

export function findAyahAtTime(project, time) {
    // ... (نفس الكود الذي أرسلته سابقًا لدالة findAyahAtTime)
    if (!project.selectedAyahs || project.selectedAyahs.length === 0) {
        return { ayah: null, index: -1, timeIntoAyah: 0, timeIntoDisplay: 0 };
    }

    for (let i = 0; i < project.selectedAyahs.length; i++) {
        const currentAyah = project.selectedAyahs[i];
        const ayahStartTime = currentAyah.startTime;
        const ayahAudioDuration = currentAyah.duration || 0; // مدة صوت الآية
        // مدة العرض الكلية للآية تشمل صوتها والتأخير الذي يليها (إذا لم تكن الأخيرة)
        const delayAfterAyah = (i < project.selectedAyahs.length - 1) ? (parseFloat(project.delayBetweenAyahs) || 0) : 0;
        const ayahDisplayEndTime = ayahStartTime + ayahAudioDuration + delayAfterAyah;

        if (time >= ayahStartTime && time < ayahDisplayEndTime) {
            return {
                ayah: currentAyah,
                index: i,
                timeIntoAyah: Math.max(0, time - ayahStartTime), // الوقت منذ بدء *صوت* الآية
                timeIntoDisplay: Math.max(0, time - ayahStartTime) // الوقت منذ بدء *عرض* الآية (يشمل صوتها والتأخير بعدها)
            };
        }
    }
    if (time >= project.totalDuration && project.selectedAyahs.length > 0) {
        const lastAyah = project.selectedAyahs[project.selectedAyahs.length - 1];
        return {
            ayah: lastAyah,
            index: project.selectedAyahs.length - 1,
            timeIntoAyah: lastAyah.duration,
            timeIntoDisplay: lastAyah.duration
        };
    }
    return { ayah: null, index: -1, timeIntoAyah: 0, timeIntoDisplay: 0 };
}

export function updatePreview() {
    const project = getCurrentProject();
    if (!project || !ctx) return;
    const overallTime = getOverallCurrentTime();
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null; 
    }

    drawFrame(project, overallTime, false).then(() => {
        if (getElement('editor-screen').classList.contains('active-screen') && !animationFrameId) {
            startPreviewRenderLoop();
        }
    });
}

export function updatePreviewForTime(time, project = getCurrentProject()) {
    if (!project || !ctx) return;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    drawFrame(project, time, false).then(() => {
        if (getElement('editor-screen').classList.contains('active-screen') && !animationFrameId) {
            startPreviewRenderLoop();
        }
    });
}

export function updateCanvasDimensions(aspectRatioString) {
    if (!videoPreviewCanvas || !ctx) return;

    const [ratioW, ratioH] = aspectRatioString.split(':').map(Number);
    const previewContainer = getElement('video-preview-container');
    
    const containerWidth = previewContainer.clientWidth;
    const containerHeight = previewContainer.clientHeight;
    let canvasWidth, canvasHeight;

    if (containerWidth / containerHeight > ratioW / ratioH) {
        canvasHeight = containerHeight;
        canvasWidth = (containerHeight * ratioW) / ratioH;
    } else {
        canvasWidth = containerWidth;
        canvasHeight = (containerWidth * ratioH) / ratioW;
    }

    videoPreviewCanvas.width = Math.max(10, Math.round(canvasWidth)); // حد أدنى للعرض
    videoPreviewCanvas.height = Math.max(10, Math.round(canvasHeight)); // حد أدنى للارتفاع

    previewContainer.style.aspectRatio = `${ratioW} / ${ratioH}`; // استخدام النسبة مباشرة

    // console.log(`تم تحديث أبعاد الكانفاس إلى: ${videoPreviewCanvas.width}x${videoPreviewCanvas.height} لنسبة ${aspectRatioString}`);
    updatePreview(); // إعادة الرسم بالأبعاد الجديدة
}
