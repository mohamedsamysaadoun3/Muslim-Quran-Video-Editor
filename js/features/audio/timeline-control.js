// js/features/audio/timeline-control.js
// المنطق الأساسي لتحديثات واجهة مستخدم شريط الزمن (شريط التمرير، عروض الوقت) ومعالجة
// تفاعل المستخدم مع شريط الزمن (البحث، التمرير) موجود الآن في الغالب ضمن
// `main-audio-playback.js`.

import { getElement } from '../../core/dom-loader.js';
import { formatTime } from '../../utils/formatters.js';
import { getCurrentProject } from '../../core/state-manager.js';
import eventBus from '../../core/event-bus.js';
// updateTimelineUI من main-audio-playback.js هي المسؤولة عن التحديث الفعلي
import { updateTimelineUI as updateAudioPlayerTimelineDisplay } from './main-audio-playback.js';

const timelineSlider = getElement('timeline-slider');
const currentTimeDisplay = getElement('current-time-display');
const totalTimeDisplay = getElement('total-time-display');

export function initializeTimelineControls() {
    if (timelineSlider) {
        timelineSlider.value = 0;
        timelineSlider.max = 100;
    }
    if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(0);
    if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(0);

    eventBus.on('ayahsProcessedForProject', (project) => {
        updateTotalDurationDisplay(project.totalDuration || 0);
        // تأكد من أن الوقت الحالي في شريط الزمن يعكس timelinePosition
        updateCurrentTimeDisplay(project.timelinePosition || 0);
    });
    eventBus.on('projectLoadedInEditor', (project) => { // عند تحميل مشروع
        updateTotalDurationDisplay(project.totalDuration || 0);
        updateCurrentTimeDisplay(project.timelinePosition || 0);
    });
    eventBus.on('newProjectCreated', (project) => { // عند إنشاء مشروع جديد
        updateTotalDurationDisplay(0);
        updateCurrentTimeDisplay(0);
    });

    // إذا كان main-audio-playback.js يطلق حدثًا بتحديث الوقت، يمكن الاستماع إليه هنا أيضًا
    // eventBus.on('audioTimeUpdated', (timeData) => {
    //     updateCurrentTimeDisplay(timeData.currentTime);
    // });
}

export function updateTotalDurationDisplay(totalSeconds) {
    const duration = (isNaN(totalSeconds) || totalSeconds < 0) ? 0 : totalSeconds;
    if (timelineSlider) {
        timelineSlider.max = duration;
    }
    if (totalTimeDisplay) {
        totalTimeDisplay.textContent = formatTime(duration);
    }
    // تحديث العرض الكلي في المشغل الرئيسي إذا تغيرت المدة الإجمالية
    // (يتم استدعاء updateAudioPlayerTimelineDisplay من main-audio-playback عند تحديث الوقت)
    // لذا، يمكننا فقط تحديث القيم هنا إذا لم يكن المشغل نشطًا
    if (!getIsPlaying()) { // افترض وجود getIsPlaying من main-audio-playback
        updateAudioPlayerTimelineDisplay(parseFloat(timelineSlider?.value || 0), duration);
    }
}

export function updateCurrentTimeDisplay(currentSeconds) {
     const time = (isNaN(currentSeconds) || currentSeconds < 0) ? 0 : currentSeconds;
    if (timelineSlider && !timelineSlider.matches(':active')) {
        timelineSlider.value = time;
    }
    if (currentTimeDisplay) {
        currentTimeDisplay.textContent = formatTime(time);
    }
    // تحديث الوقت الحالي في المشغل الرئيسي (يتم استدعاء updateAudioPlayerTimelineDisplay من main-audio-playback)
    if (!getIsPlaying()) {
        updateAudioPlayerTimelineDisplay(time, parseFloat(timelineSlider?.max || 0));
    }
}
