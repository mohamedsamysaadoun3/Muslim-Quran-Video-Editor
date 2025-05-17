// js/features/audio/audio-extraction.js
// بديل لميزة "استخراج الصوت من خلفية الفيديو" المستقبلية.
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject } from '../../core/state-manager.js';
import eventBus from '../../core/event-bus.js';
// import { withSpinner } from '../../ui/spinner-control.js';
// import { handleError } from '../../core/error-handler.js';

const extractAudioBtn = getElement('extract-audio-btn');

export function initializeAudioExtraction() {
    if (extractAudioBtn) {
        extractAudioBtn.addEventListener('click', handleExtractAudio);
        updateExtractAudioButtonState();
    }
    eventBus.on('backgroundChanged', updateExtractAudioButtonState);
}

async function handleExtractAudio() {
    const project = getCurrentProject();
    if (project.backgroundType !== 'video' || !project.backgroundVideo) {
        eventBus.emit('showNotification', { type: 'warning', message: 'لا يوجد فيديو خلفية لاستخراج الصوت منه.' });
        return;
    }
    eventBus.emit('showNotification', { type: 'info', message: 'ميزة استخراج الصوت قيد الإنشاء.' });
}

function updateExtractAudioButtonState() {
    if (!extractAudioBtn) return;
    const project = getCurrentProject();
    const canExtract = project && project.backgroundType === 'video' && project.backgroundVideo;
    
    extractAudioBtn.disabled = true; // تعطيل دائم حاليًا
    extractAudioBtn.title = "استخراج الصوت (قيد الإنشاء)";
    // if (canExtract) {
    //     extractAudioBtn.disabled = false; 
    //     extractAudioBtn.title = "استخراج الصوت من فيديو الخلفية";
    // } else {
    //     extractAudioBtn.disabled = true;
    //     extractAudioBtn.title = "استخراج الصوت (يتطلب فيديو خلفية)";
    // }
}
