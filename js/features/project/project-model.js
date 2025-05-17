// js/features/project/project-model.js
import {
    DEFAULT_PROJECT_NAME,
    DEFAULT_FONT_FAMILY,
    DEFAULT_FONT_SIZE,
    DEFAULT_FONT_COLOR,
    DEFAULT_AYAH_BG_COLOR,
    DEFAULT_BACKGROUND_COLOR,
    DEFAULT_ASPECT_RATIO,
    DEFAULT_VIDEO_FILTER,
    DEFAULT_TEXT_EFFECT,
    DEFAULT_DELAY_BETWEEN_AYAHS,
    DEFAULT_RECITER_ID,
    DEFAULT_TRANSLATION_ID,
    APP_VERSION // لاستخدامه في تحديد إصدار المشروع
} from '../../config/constants.js';

/**
 * ينشئ كائن مشروع جديد بالإعدادات الافتراضية.
 * @param {string} [id] - معرف مشروع اختياري. إذا لم يتم توفيره، سيتم إنشاء واحد جديد.
 * @returns {object} كائن مشروع جديد.
 */
export function createNewProject(id) {
    return {
        id: id || `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: DEFAULT_PROJECT_NAME,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        appVersion: APP_VERSION, // حفظ إصدار التطبيق الذي تم إنشاء المشروع به

        // إعدادات محتوى القرآن
        surah: null,
        surahName: '',
        ayahStart: null,
        ayahEnd: null,
        reciter: DEFAULT_RECITER_ID,
        translation: DEFAULT_TRANSLATION_ID,
        
        selectedAyahs: [], 
        totalDuration: 0,

        // إعدادات الخلفية
        backgroundType: 'color',
        backgroundColor: DEFAULT_BACKGROUND_COLOR,
        backgroundImage: null,
        backgroundVideo: null,
        backgroundAiQuery: null,

        // إعدادات النص والتصميم
        fontFamily: DEFAULT_FONT_FAMILY,
        fontSize: DEFAULT_FONT_SIZE,
        fontColor: DEFAULT_FONT_COLOR,
        ayahBgColor: DEFAULT_AYAH_BG_COLOR,
        textEffect: DEFAULT_TEXT_EFFECT,
        // fontFamilyUi: 'Tajawal', // خط الواجهة للنصوص غير القرآنية (مثل عنوان السورة، الترجمة) - يمكن إضافته هنا أو استنتاجه

        // إعدادات الفيديو
        aspectRatio: DEFAULT_ASPECT_RATIO,
        videoFilter: DEFAULT_VIDEO_FILTER,
        
        // إعدادات الصوت
        delayBetweenAyahs: DEFAULT_DELAY_BETWEEN_AYAHS,
        backgroundMusic: null,
        backgroundMusicName: '',
        backgroundMusicVolume: 0.5,
        backgroundMusicEnabled: false, // موسيقى الخلفية معطلة بشكل افتراضي
        recitationVolume: 1.0,

        // إعدادات التصدير (تبقى عامة، لا تحفظ مع المشروع عادةً إلا إذا أردنا ذلك)
        // exportResolution: null,
        // exportFormat: null,
        // exportFramerate: null,

        // حالة المحرر (مؤقتة)
        currentAyahIndex: 0,
        timelinePosition: 0,

        // ملاحظات المستخدم (اختياري)
        notes: "",

        version: "1.0" // إصدار هيكل المشروع نفسه
    };
}

/**
 * يتحقق من صحة كائن المشروع.
 * @param {object} project - كائن المشروع للتحقق منه.
 * @returns {boolean} true إذا كان هيكل المشروع يبدو صالحًا، false خلاف ذلك.
 */
export function isValidProject(project) {
    if (!project || typeof project !== 'object') return false;
    return typeof project.id === 'string' &&
           typeof project.name === 'string' &&
           Array.isArray(project.selectedAyahs) &&
           typeof project.aspectRatio === 'string'; // إضافة فحص لخاصية مهمة
    // أضف المزيد من عمليات التحقق حسب الحاجة لضمان تكامل البيانات
}

/**
 * يحدث الطابع الزمني 'updatedAt' للمشروع.
 * @param {object} project - كائن المشروع.
 */
export function touchProject(project) {
    if (project && typeof project === 'object') {
        project.updatedAt = new Date().toISOString();
    }
}
