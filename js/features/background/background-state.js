// js/features/background/background-state.js
// هذا الملف يدير عناصر HTML الفعلية المستخدمة لعرض الخلفية (img, video)
// إذا كنا نعرضها مباشرة، ولكن بما أننا نرسم على الكانفاس، فإن دوره الأساسي
// هو توفير عناصر محملة وجاهزة للرسم.

import { handleError } from '../../core/error-handler.js';

// استخدام كائن واحد لتخزين العناصر لتجنب المتغيرات العامة المتعددة
const backgroundElements = {
    image: null,
    video: null,
    // لتتبع المستمعين وتجنب إضافتهم عدة مرات لنفس المصدر
    imageListeners: { load: null, error: null },
    videoListeners: { loadeddata: null, error: null, canplay: null }
};

/**
 * يحصل على أو ينشئ عنصر HTMLImageElement لصورة خلفية المشروع الحالية.
 * @param {object} project - بيانات المشروع الحالية.
 * @returns {Promise<HTMLImageElement|null>}
 */
export function getBackgroundImageElement(project) {
    return new Promise((resolve) => {
        if (!project.backgroundImage || project.backgroundType !== 'image') {
            if (backgroundElements.image) backgroundElements.image.src = '';
            resolve(null);
            return;
        }

        if (backgroundElements.image && backgroundElements.image.src === project.backgroundImage &&
            backgroundElements.image.complete && backgroundElements.image.naturalHeight !== 0) {
            resolve(backgroundElements.image);
            return;
        }
        
        const img = backgroundElements.image || new Image();
        backgroundElements.image = img;
        img.crossOrigin = "anonymous";

        // إزالة المستمعين القدامى
        if (backgroundElements.imageListeners.load) img.removeEventListener('load', backgroundElements.imageListeners.load);
        if (backgroundElements.imageListeners.error) img.removeEventListener('error', backgroundElements.imageListeners.error);

        const loadListener = () => {
            cleanup();
            resolve(img);
        };
        const errorListener = (e) => {
            handleError(e, `فشل تحميل صورة الخلفية: ${project.backgroundImage}`, false);
            if(img.src === project.backgroundImage) img.src = '';
            cleanup();
            resolve(null);
        };
        const cleanup = () => {
            img.removeEventListener('load', loadListener);
            img.removeEventListener('error', errorListener);
            backgroundElements.imageListeners.load = null;
            backgroundElements.imageListeners.error = null;
        };

        backgroundElements.imageListeners.load = loadListener;
        backgroundElements.imageListeners.error = errorListener;
        img.addEventListener('load', loadListener);
        img.addEventListener('error', errorListener);
        
        if (img.src !== project.backgroundImage) {
             img.src = project.backgroundImage;
        } else if (img.complete && img.naturalHeight !==0) { // إذا كان المصدر هو نفسه ومكتمل بالفعل
            cleanup(); // نظف المستمعين لأننا سنحل الوعد مباشرة
            resolve(img);
        }
        // إذا كان المصدر هو نفسه ولكنه ليس مكتملاً، فإن المستمعين المضافين سيعملون.
    });
}

/**
 * يحصل على أو ينشئ عنصر HTMLVideoElement لفيديو خلفية المشروع الحالي.
 * @param {object} project - بيانات المشروع الحالية.
 * @returns {Promise<HTMLVideoElement|null>}
 */
export function getBackgroundVideoElement(project) {
    return new Promise((resolve) => {
        if (!project.backgroundVideo || project.backgroundType !== 'video') {
            if (backgroundElements.video) {
                backgroundElements.video.pause();
                backgroundElements.video.srcObject = null; // لـ MediaStream
                backgroundElements.video.src = '';
            }
            resolve(null);
            return;
        }
        
        if (backgroundElements.video && backgroundElements.video.src === project.backgroundVideo &&
            backgroundElements.video.readyState >= HTMLMediaElement.HAVE_METADATA) { // HAVE_METADATA كافٍ للرسم
            resolve(backgroundElements.video);
            return;
        }

        const video = backgroundElements.video || document.createElement('video');
        backgroundElements.video = video;
        
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.loop = true;
        video.preload = "auto";
        video.playsInline = true;

        // إزالة المستمعين القدامى
        if (backgroundElements.videoListeners.canplay) video.removeEventListener('canplay', backgroundElements.videoListeners.canplay);
        if (backgroundElements.videoListeners.error) video.removeEventListener('error', backgroundElements.videoListeners.error);

        const canPlayListener = () => { // استخدام 'canplay' أفضل للرسم
            cleanup();
            resolve(video);
        };
        const errorListener = (e) => {
            handleError(e, `فشل تحميل فيديو الخلفية: ${project.backgroundVideo}`, false);
            if(video.src === project.backgroundVideo) video.src = '';
            cleanup();
            resolve(null);
        };
        const cleanup = () => {
            video.removeEventListener('canplay', canPlayListener);
            video.removeEventListener('error', errorListener);
            backgroundElements.videoListeners.canplay = null;
            backgroundElements.videoListeners.error = null;
        };

        backgroundElements.videoListeners.canplay = canPlayListener;
        backgroundElements.videoListeners.error = errorListener;
        video.addEventListener('canplay', canPlayListener);
        video.addEventListener('error', errorListener);

        if (video.src !== project.backgroundVideo) {
            video.src = project.backgroundVideo;
            video.load();
        } else if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            cleanup();
            resolve(video);
        }
    });
}

/**
 * استدعاء هذا عند إغلاق مشروع أو اختيار خلفية جديدة لتحرير الموارد.
 */
export function clearBackgroundElementsCache() {
    if (backgroundElements.image) {
        backgroundElements.image.removeEventListener('load', backgroundElements.imageListeners.load);
        backgroundElements.image.removeEventListener('error', backgroundElements.imageListeners.error);
        backgroundElements.image.src = '';
        backgroundElements.image = null;
        backgroundElements.imageListeners.load = null;
        backgroundElements.imageListeners.error = null;
    }
    if (backgroundElements.video) {
        backgroundElements.video.removeEventListener('canplay', backgroundElements.videoListeners.canplay);
        backgroundElements.video.removeEventListener('error', backgroundElements.videoListeners.error);
        backgroundElements.video.pause();
        backgroundElements.video.srcObject = null;
        backgroundElements.video.removeAttribute('src');
        backgroundElements.video.load();
        backgroundElements.video = null;
        backgroundElements.videoListeners.canplay = null;
        backgroundElements.videoListeners.error = null;
    }
    // console.log("تم مسح كاش عناصر الخلفية.");
}
