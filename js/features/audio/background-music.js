// js/features/audio/background-music.js
// بديل لوظيفة موسيقى الخلفية المستقبلية.
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject, setCurrentProject, saveState } from '../../core/state-manager.js';
import eventBus from '../../core/event-bus.js';
import { getIsPlaying as getIsMainAudioPlaying } from './main-audio-playback.js'; // لاستيراد حالة التشغيل

// عناصر DOM مثال (ليست في HTML الحالي، أضفها إذا تم التنفيذ)
// const addBackgroundMusicInput = getElement('add-background-music-input');
// const backgroundMusicVolumeSlider = getElement('background-music-volume-slider');
// const backgroundMusicNameDisplay = getElement('background-music-name-display');
// const enableBackgroundMusicToggle = getElement('enable-background-music-toggle');

let backgroundAudioElement = null;
let backgroundMusicObjectURL = null;

export function initializeBackgroundMusic() {
    // if (addBackgroundMusicInput) addBackgroundMusicInput.addEventListener('change', handleAddBackgroundMusic);
    // if (backgroundMusicVolumeSlider) backgroundMusicVolumeSlider.addEventListener('input', handleBackgroundMusicVolumeChange);
    // if (enableBackgroundMusicToggle) enableBackgroundMusicToggle.addEventListener('change', handleEnableBackgroundMusicToggle);

    eventBus.on('projectLoadedInEditor', setupBackgroundMusicForProject);
    eventBus.on('newProjectCreated', setupBackgroundMusicForProject);
    eventBus.on('playbackStateChanged', (playbackState) => {
        syncBackgroundMusicToMainPlayback(playbackState.isPlaying);
    });

    // console.log("تم تهيئة وحدة موسيقى الخلفية (بديل).");
}

function setupBackgroundMusicForProject(project) {
    if (project.backgroundMusic && project.backgroundMusicEnabled !== false) {
        loadAndPrepareBackgroundMusic(project.backgroundMusic, project.backgroundMusicVolume);
        // إذا كان المشغل الرئيسي يعمل عند تحميل المشروع، شغل موسيقى الخلفية
        if (getIsMainAudioPlaying()) {
            playBackgroundMusic();
        }
    } else {
        clearBackgroundMusic();
    }
    updateBackgroundMusicUI(project);
}

// ... (باقي دوال handleAddBackgroundMusic, handleBackgroundMusicVolumeChange, handleEnableBackgroundMusicToggle إذا أضفت عناصر واجهة المستخدم)

function loadAndPrepareBackgroundMusic(src, volume) {
    if (!backgroundAudioElement) {
        backgroundAudioElement = new Audio();
        backgroundAudioElement.loop = true;
    }
    // إذا كان المصدر هو نفسه ومستوى الصوت هو نفسه، لا تفعل شيئًا لتجنب إعادة التحميل
    if (backgroundAudioElement.src === src && backgroundAudioElement.volume === volume) {
        return;
    }

    backgroundAudioElement.src = src;
    backgroundAudioElement.volume = volume;
    backgroundAudioElement.load();
}

function clearBackgroundMusic() {
    if (backgroundAudioElement) {
        backgroundAudioElement.pause();
        backgroundAudioElement.src = '';
    }
    if (backgroundMusicObjectURL) {
        URL.revokeObjectURL(backgroundMusicObjectURL);
        backgroundMusicObjectURL = null;
    }
    // updateBackgroundMusicUI(getCurrentProject()); // تحديث الواجهة لتعكس عدم وجود موسيقى
}

export function playBackgroundMusic() {
    const project = getCurrentProject();
    if (backgroundAudioElement && backgroundAudioElement.src && backgroundAudioElement.paused &&
        project.backgroundMusicEnabled !== false && (project.backgroundMusicVolume || 0) > 0.01) { // تحقق من أن مستوى الصوت ليس صفرًا تقريبًا
        backgroundAudioElement.play().catch(e => console.warn("خطأ في تشغيل موسيقى الخلفية:", e.message));
    }
}

export function pauseBackgroundMusic() {
    if (backgroundAudioElement && !backgroundAudioElement.paused) {
        backgroundAudioElement.pause();
    }
}

export function syncBackgroundMusicToMainPlayback(mainAudioIsCurrentlyPlaying) {
    const project = getCurrentProject();
    if (!project.backgroundMusic || project.backgroundMusicEnabled === false || (project.backgroundMusicVolume || 0) < 0.01) {
        pauseBackgroundMusic();
        return;
    }

    if (mainAudioIsCurrentlyPlaying) {
        playBackgroundMusic();
    } else {
        pauseBackgroundMusic();
    }
}

export function updateBackgroundMusicUI(project) {
    // مثال:
    // const volSlider = getElement('bgm-volume-slider');
    // const enableToggle = getElement('bgm-enable-toggle');
    // if (volSlider) volSlider.value = project.backgroundMusicVolume || 0.5;
    // if (enableToggle) enableToggle.checked = project.backgroundMusicEnabled !== false;
    // ... إلخ
}
