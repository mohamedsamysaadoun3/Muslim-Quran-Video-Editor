// js/features/audio/main-audio-playback.js
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject, setCurrentProject, saveState } from '../../core/state-manager.js';
import eventBus from '../../core/event-bus.js';
import { formatTime } from '../../utils/formatters.js';
import { updatePreviewForTime, findAyahAtTime } from '../video/canvas-preview.js';


const mainAudioPlayer = getElement('main-audio-player');
const playPauseMainBtn = getElement('play-pause-main-btn');
const timelineSlider = getElement('timeline-slider');
const currentTimeDisplay = getElement('current-time-display');
const totalTimeDisplay = getElement('total-time-display');
const rewindBtn = getElement('rewind-btn');
const fastForwardBtn = getElement('fast-forward-btn');

let currentAyahPlaybackIndex = 0; // الفهرس في project.selectedAyahs
let isPlaying = false;
let seeking = false; // لمنع تحديث الواجهة أثناء بحث المستخدم في شريط الزمن
let audioLoadPromise = null; // لتتبع تحميل الصوت الحالي لتجنب التشغيل قبل الجاهزية

export function initializeMainAudioPlayback() {
    if (!mainAudioPlayer) {
        console.error("لم يتم العثور على عنصر مشغل الصوت الرئيسي.");
        return;
    }

    mainAudioPlayer.addEventListener('loadedmetadata', handleAudioMetadataLoaded);
    mainAudioPlayer.addEventListener('timeupdate', handleAudioTimeUpdate);
    mainAudioPlayer.addEventListener('ended', handleAudioEnded);
    mainAudioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
        eventBus.emit('playbackStateChanged', { isPlaying: true });
    });
    mainAudioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
        eventBus.emit('playbackStateChanged', { isPlaying: false });
    });
    mainAudioPlayer.addEventListener('error', handleAudioError);


    if (playPauseMainBtn) playPauseMainBtn.addEventListener('click', togglePlayPause);
    if (timelineSlider) {
        timelineSlider.addEventListener('input', handleTimelineScrub);
        timelineSlider.addEventListener('change', handleTimelineSeek);
    }
    if (rewindBtn) rewindBtn.addEventListener('click', playPreviousAyah);
    if (fastForwardBtn) fastForwardBtn.addEventListener('click', playNextAyah);

    // يتم استدعاء setupAudioForNewProject من خلال 'ayahsProcessedForProject'
    eventBus.on('ayahsProcessedForProject', setupAudioForNewProject);
}

/**
 * تهيئة أو إعادة تهيئة مشغل الصوت للمشروع الحالي (أو مشروع جديد).
 * يتم استدعاؤها عند معالجة الآيات (ayahsProcessedForProject).
 * @param {object} project - كائن المشروع.
 */
function setupAudioForNewProject(project) {
    // console.log("إعداد الصوت للمشروع:", project.name, "عدد الآيات:", project.selectedAyahs?.length);
    resetAudioPlayback(project);
    if (project.selectedAyahs && project.selectedAyahs.length > 0) {
        loadAyahForPlayback(0, false); // تحميل الآية الأولى، false لعدم التشغيل التلقائي
    } else {
        updateTimelineUI(0, 0); // إذا لا توجد آيات، المدة صفر
    }
}

/**
 * إعادة تعيين حالة مشغل الصوت.
 * @param {object} project - كائن المشروع.
 */
function resetAudioPlayback(project = getCurrentProject()) {
    mainAudioPlayer.pause();
    mainAudioPlayer.src = '';
    currentAyahPlaybackIndex = 0;
    // لا نغير project.currentAyahIndex أو project.timelinePosition هنا مباشرة
    // لأنها قد تكون جزءًا من الحالة المحفوظة التي لا نريد تغييرها عند مجرد إعادة تعيين المشغل
    // updateUIFromProject ستهتم بتحديث هذه القيم إذا لزم الأمر.
    
    updateTimelineUI(project.timelinePosition || 0, project.totalDuration || 0);
    updatePlayPauseButton();
    updatePreviewForTime(project.timelinePosition || 0, project);
}

/**
 * يحمل آية معينة في mainAudioPlayer للتشغيل.
 * @param {number} ayahIndex - الفهرس في `project.selectedAyahs`.
 * @param {boolean} [autoPlay=false] - هل يتم التشغيل تلقائيًا بعد التحميل.
 * @returns {Promise<boolean>} true إذا تم بدء التحميل بنجاح، false خلاف ذلك.
 */
async function loadAyahForPlayback(ayahIndex, autoPlay = false) {
    const project = getCurrentProject();
    // console.log(`محاولة تحميل الآية للفهرس: ${ayahIndex}, التشغيل التلقائي: ${autoPlay}`);

    if (!project.selectedAyahs || ayahIndex < 0 || ayahIndex >= project.selectedAyahs.length) {
        // console.log("نهاية الآيات المختارة أو فهرس غير صالح.");
        if (isPlaying) { // إذا كان يعمل، أوقفه
            mainAudioPlayer.pause(); // سيؤدي هذا إلى isPlaying = false عبر مستمع pause
        }
        currentAyahPlaybackIndex = 0; // أعد التعيين للبداية للتشغيل التالي
        project.currentAyahIndex = 0; // مزامنة مع المشروع
        mainAudioPlayer.src = '';
        updateTimelineUI(project.totalDuration, project.totalDuration);
        eventBus.emit('playbackEnded');
        return false;
    }

    const ayahToPlay = project.selectedAyahs[ayahIndex];
    if (!ayahToPlay.audio) {
        console.warn(`الآية ${ayahToPlay.numberInSurah} لا تحتوي على رابط صوتي.`);
        await handleAudioEnded(); // محاكاة النهاية للتقدم إلى الآية التالية
        return false;
    }

    currentAyahPlaybackIndex = ayahIndex;
    project.currentAyahIndex = ayahIndex; // تحديث مؤشر الآية في المشروع
    setCurrentProject(project, false); // تحديث الحالة الداخلية للمشروع

    mainAudioPlayer.src = ayahToPlay.audio;
    mainAudioPlayer.load(); // بدء تحميل الصوت الجديد
    
    audioLoadPromise = new Promise((resolveLoad, rejectLoad) => {
        const onCanPlayThrough = async () => {
            cleanupListeners();
            // console.log(`الصوت جاهز للتشغيل: ${ayahToPlay.audio}`);
            if (autoPlay) {
                try {
                    await mainAudioPlayer.play();
                } catch (e) { handleAudioError(e); rejectLoad(e); return; }
            }
            resolveLoad(true);
        };
        const onLoadError = (e) => {
            cleanupListeners();
            handleAudioError(e);
            rejectLoad(e);
        };
        const cleanupListeners = () => {
            mainAudioPlayer.removeEventListener('canplaythrough', onCanPlayThrough);
            mainAudioPlayer.removeEventListener('error', onLoadError);
        };
        mainAudioPlayer.addEventListener('canplaythrough', onCanPlayThrough);
        mainAudioPlayer.addEventListener('error', onLoadError);
    });

    try {
        await audioLoadPromise;
        return true;
    } catch (error) {
        return false; // فشل التحميل أو التشغيل التلقائي
    }
}

async function togglePlayPause() {
    const project = getCurrentProject();
    if (!project.selectedAyahs || project.selectedAyahs.length === 0) {
        eventBus.emit('showNotification', {type: 'info', message: 'الرجاء تحديد الآيات أولاً.'});
        return;
    }

    if (mainAudioPlayer.paused || mainAudioPlayer.ended) {
        if (!mainAudioPlayer.src || mainAudioPlayer.readyState < mainAudioPlayer.HAVE_METADATA) {
            await loadAyahForPlayback(currentAyahPlaybackIndex, true); // true للتشغيل التلقائي
        } else {
            try {
                await mainAudioPlayer.play();
            } catch (e) { handleAudioError(e); }
        }
    } else {
        mainAudioPlayer.pause();
    }
}

function handleAudioMetadataLoaded() {
    const project = getCurrentProject();
    // يمكن هنا تحديث مدة الآية في project.selectedAyahs إذا كانت مختلفة عن ما تم تحميله
    // ولكن هذا قد يكون معقدًا إذا تم حساب المدة الإجمالية بالفعل.
    // quran-data-loader.js هو المسؤول الأساسي عن تحديد المدد.

    // تحديث المدة الإجمالية في شريط الزمن إذا كانت هذه أول آية يتم تحميلها
    // أو إذا تغيرت المدة الإجمالية في المشروع
    updateTimelineUI(mainAudioPlayer.currentTime + project.selectedAyahs[currentAyahPlaybackIndex].startTime, project.totalDuration);
}

function handleAudioTimeUpdate() {
    if (seeking) return;

    const project = getCurrentProject();
    if (!project.selectedAyahs || project.selectedAyahs.length === 0 || !project.selectedAyahs[currentAyahPlaybackIndex]) return;

    const currentAyahData = project.selectedAyahs[currentAyahPlaybackIndex];
    const overallTime = currentAyahData.startTime + mainAudioPlayer.currentTime;
    
    // تحديث timelinePosition في المشروع فقط إذا كان التشغيل نشطًا وليس أثناء البحث
    // هذا يمنع الكتابة فوق القيمة عند البحث اليدوي في شريط الزمن
    if (isPlaying) {
        project.timelinePosition = overallTime;
    }

    updateTimelineUI(overallTime, project.totalDuration);
    updatePreviewForTime(overallTime, project);
}

async function handleAudioEnded() {
    const project = getCurrentProject();
    const delay = (parseFloat(project.delayBetweenAyahs) || 0) * 1000;

    if (currentAyahPlaybackIndex < project.selectedAyahs.length - 1) {
        if (delay > 0) {
            // تحديث المعاينة لعرض الإطار الأخير للآية الحالية خلال فترة التأخير
            updatePreviewForTime(project.selectedAyahs[currentAyahPlaybackIndex].startTime + project.selectedAyahs[currentAyahPlaybackIndex].duration, project);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        if (isPlaying) { // استمر في التشغيل فقط إذا كان isPlaying لا يزال true
            await loadAyahForPlayback(currentAyahPlaybackIndex + 1, true); // true للتشغيل التلقائي
        } else {
            // إذا تم إيقاف التشغيل أثناء التأخير، قم بتحميل الآية التالية ولكن لا تشغلها
            await loadAyahForPlayback(currentAyahPlaybackIndex + 1, false);
        }
    } else {
        mainAudioPlayer.pause(); // سيؤدي هذا إلى isPlaying = false
        updateTimelineUI(project.totalDuration, project.totalDuration);
        updatePreviewForTime(project.totalDuration, project); // عرض الإطار الأخير
        eventBus.emit('playbackEnded');
    }
}

async function handleTimelineScrub(event) {
    seeking = true;
    const project = getCurrentProject();
    const scrubTime = parseFloat(event.target.value);
    if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(scrubTime);
    updatePreviewForTime(scrubTime, project);
}

async function handleTimelineSeek(event) {
    const seekTime = parseFloat(event.target.value);
    const project = getCurrentProject();
    project.timelinePosition = seekTime; // تحديث موضع المشروع فورًا
    setCurrentProject(project, false); // حفظ هذا الموضع بدون إضافة للتاريخ
                                      // قد نرغب في إضافة للتاريخ إذا كان هذا إجراء مستخدم هام
                                      // saveState(`تم البحث في شريط الزمن إلى ${formatTime(seekTime)}`);


    const { ayah: targetAyah, index: targetAyahIndex, timeIntoAyah } = findAyahAtTime(project, seekTime);

    const wasPlaying = isPlaying; // احفظ حالة التشغيل قبل أي إيقاف مؤقت
    if (isPlaying) mainAudioPlayer.pause(); // أوقف التشغيل مؤقتًا قبل البحث

    if (targetAyah) {
        await loadAyahForPlayback(targetAyahIndex, false); // تحميل بدون تشغيل تلقائي
        if(audioLoadPromise) await audioLoadPromise; // انتظر التحميل
        
        // تأكد من أن وقت البحث ضمن مدة الآية الفعلية
        mainAudioPlayer.currentTime = Math.min(timeIntoAyah, mainAudioPlayer.duration > 0 ? mainAudioPlayer.duration - 0.01 : 0);
        
        if (wasPlaying) { // إذا كان يعمل، استأنف التشغيل
            try { await mainAudioPlayer.play(); } catch (e) { handleAudioError(e); }
        }
    } else {
        // إذا تم البحث خارج نطاق الآيات، أوقف التشغيل
        mainAudioPlayer.src = ''; // مسح المصدر
    }
    // تحديث الواجهة فورًا
    updateTimelineUI(seekTime, project.totalDuration);
    updatePreviewForTime(seekTime, project); // لضمان مزامنة المعاينة

    setTimeout(() => { seeking = false; }, 100);
}


async function playNextAyah() {
    const project = getCurrentProject();
    if (!project.selectedAyahs || project.selectedAyahs.length === 0) return;

    let nextIndex = currentAyahPlaybackIndex + 1;
    if (nextIndex >= project.selectedAyahs.length) {
        // وصلنا للنهاية
        mainAudioPlayer.pause(); // سيؤدي إلى isPlaying = false
        const lastAyah = project.selectedAyahs[project.selectedAyahs.length - 1];
        if (lastAyah) mainAudioPlayer.currentTime = lastAyah.duration;
        updateTimelineUI(project.totalDuration, project.totalDuration);
        updatePreviewForTime(project.totalDuration, project);
        eventBus.emit('playbackEnded');
        return;
    }
    
    await loadAyahForPlayback(nextIndex, isPlaying); // شغل تلقائيًا إذا كان isPlaying
    
    const nextAyahData = project.selectedAyahs[nextIndex];
    if(nextAyahData) { // تحديث الواجهة فورًا لموضع بداية الآية التالية
        updateTimelineUI(nextAyahData.startTime, project.totalDuration);
        updatePreviewForTime(nextAyahData.startTime, project);
    }
}

async function playPreviousAyah() {
    const project = getCurrentProject();
    if (!project.selectedAyahs || project.selectedAyahs.length === 0) return;

    if (mainAudioPlayer.currentTime > 2 && currentAyahPlaybackIndex >= 0) { 
         mainAudioPlayer.currentTime = 0;
         if (isPlaying) { try { await mainAudioPlayer.play(); } catch(e) {handleAudioError(e);} }
         const currentAyahData = project.selectedAyahs[currentAyahPlaybackIndex];
         if(currentAyahData){
            updateTimelineUI(currentAyahData.startTime, project.totalDuration);
            updatePreviewForTime(currentAyahData.startTime, project);
         }
    } else {
        let prevIndex = currentAyahPlaybackIndex - 1;
        if (prevIndex < 0) prevIndex = 0;
        
        await loadAyahForPlayback(prevIndex, isPlaying);

        const prevAyahData = project.selectedAyahs[prevIndex];
        if(prevAyahData) {
            updateTimelineUI(prevAyahData.startTime, project.totalDuration);
            updatePreviewForTime(prevAyahData.startTime, project);
        }
    }
}


function updatePlayPauseButton() {
    if (!playPauseMainBtn) return;
    const icon = playPauseMainBtn.querySelector('i');
    if (isPlaying) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        playPauseMainBtn.title = 'إيقاف مؤقت';
    } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        playPauseMainBtn.title = 'تشغيل';
    }
}

export function updateTimelineUI(currentTime, totalDuration) {
    currentTime = (isNaN(currentTime) || currentTime === null || currentTime < 0) ? 0 : currentTime;
    totalDuration = (isNaN(totalDuration) || totalDuration === null || totalDuration < 0) ? 0 : totalDuration;
    currentTime = Math.min(currentTime, totalDuration);

    if (timelineSlider) {
        timelineSlider.max = totalDuration;
        timelineSlider.value = currentTime;
    }
    if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
    if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(totalDuration);
}


function handleAudioError(e) {
    console.error("خطأ في مشغل الصوت:", e);
    const project = getCurrentProject();
    const currentAyahData = project.selectedAyahs ? project.selectedAyahs[currentAyahPlaybackIndex] : null;
    let message = 'حدث خطأ في تشغيل الصوت.';
    if (currentAyahData) {
        message += ` (سورة ${project.surahName || project.surah}, آية ${currentAyahData.numberInSurah})`;
    }
    eventBus.emit('showNotification', { type: 'error', message: message, duration: 5000 });
    // isPlaying سيتم تحديثها تلقائيًا إذا كان الخطأ يسبب إيقافًا مؤقتًا
    // ولكن للتأكيد:
    if (!mainAudioPlayer.paused) mainAudioPlayer.pause();
}


export function getOverallCurrentTime() {
    const project = getCurrentProject();
    if (!project || !project.selectedAyahs || project.selectedAyahs.length === 0 ) {
        return project.timelinePosition || 0;
    }
    if (mainAudioPlayer.paused || seeking || mainAudioPlayer.readyState < mainAudioPlayer.HAVE_METADATA) {
        return project.timelinePosition || 0;
    }
    const currentAyahData = project.selectedAyahs[currentAyahPlaybackIndex];
    if (!currentAyahData) return project.timelinePosition || 0;

    return currentAyahData.startTime + mainAudioPlayer.currentTime;
}

export function getIsPlaying() {
    return isPlaying && !mainAudioPlayer.paused; // تأكد من أن المشغل نفسه ليس متوقفًا
}

export function getCurrentAyahPlaybackInfo() {
    const project = getCurrentProject();
    if (!project.selectedAyahs || !project.selectedAyahs[currentAyahPlaybackIndex]) {
        return null;
    }
    return {
        ayah: project.selectedAyahs[currentAyahPlaybackIndex],
        index: currentAyahPlaybackIndex,
        currentTimeInAyah: mainAudioPlayer.currentTime,
        durationOfAyah: mainAudioPlayer.duration
    };
}
