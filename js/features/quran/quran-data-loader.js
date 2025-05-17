// js/features/quran/quran-data-loader.js
import { fetchSurahs, fetchReciters, fetchTranslations, fetchSurahWithAyahs, fetchSurahWithTranslation } from '../../services/quran-api-service.js';
import { getItem, setItem } from '../../services/local-storage-service.js';
import { LOCAL_STORAGE_QURAN_DATA_KEY, QURAN_DATA_CACHE_DURATION } from '../../config/constants.js';
import { withSpinner } from '../../ui/spinner-control.js';
import { handleError } from '../../core/error-handler.js';
import eventBus from '../../core/event-bus.js';
import { getCurrentProject, setCurrentProject, saveState } from '../../core/state-manager.js';
import { updatePreview } from '../video/canvas-preview.js'; // لتحديث المعاينة عند تغيير الآيات
import { getElement } from '../../core/dom-loader.js'; // لجلب عنصر حالة الصوت

// هيكل البيانات المخزنة مؤقتًا:
// { surahs: [], reciters: [], translations: [], lastFetched: timestamp }
let quranStaticDataCache = null;

/**
 * يحمل بيانات القرآن الثابتة (السور، القراء، الترجمات) من الكاش أو API.
 * @param {boolean} forceRefresh - إذا كانت true، يجلب بيانات جديدة من API متجاهلاً الكاش.
 * @returns {Promise<{surahs: Array, reciters: Array, translations: Array}>}
 */
export async function loadQuranStaticData(forceRefresh = false) {
    if (!forceRefresh && quranStaticDataCache) {
        return quranStaticDataCache;
    }

    const cachedData = getItem(LOCAL_STORAGE_QURAN_DATA_KEY);
    if (!forceRefresh && cachedData && (Date.now() - cachedData.lastFetched < QURAN_DATA_CACHE_DURATION)) {
        quranStaticDataCache = {
            surahs: cachedData.surahs || [], // تأكد من وجود قيمة افتراضية
            reciters: cachedData.reciters || [],
            translations: cachedData.translations || []
        };
        return quranStaticDataCache;
    }

    try {
        // لا حاجة لـ withSpinner هنا إذا كان سيتم استدعاؤه من app.js داخل withSpinner بالفعل
        // ولكن إذا تم استدعاؤه بشكل مستقل، قد يكون مفيدًا.
        const [surahs, reciters, translations] = await Promise.all([
            fetchSurahs(),
            fetchReciters(),
            fetchTranslations()
        ]);

        const dataToCache = {
            surahs: surahs || [],
            reciters: reciters || [],
            translations: translations || [],
            lastFetched: Date.now()
        };
        setItem(LOCAL_STORAGE_QURAN_DATA_KEY, dataToCache);
        quranStaticDataCache = {
            surahs: dataToCache.surahs,
            reciters: dataToCache.reciters,
            translations: dataToCache.translations
        };
        eventBus.emit('quranStaticDataLoaded', quranStaticDataCache);
        return quranStaticDataCache;
    } catch (error) {
        handleError(error, "فشل تحميل بيانات القرآن الثابتة");
        return cachedData || { surahs: [], reciters: [], translations: [] }; // إرجاع الكاش القديم أو فارغ
    }
}

/**
 * يحمل الآيات المختارة (النص، الصوت، الترجمة) لإعدادات المشروع الحالية.
 * يحدث currentProject.selectedAyahs و currentProject.totalDuration.
 * @returns {Promise<boolean>} true إذا نجحت العملية، false خلاف ذلك.
 */
export async function loadSelectedAyahsForProject() {
    const project = getCurrentProject();
    const audioStatusText = getElement('audio-preview-status-text'); // عنصر عرض حالة تحميل الصوت

    if (!project || !project.surah || !project.ayahStart || !project.ayahEnd || !project.reciter) {
        project.selectedAyahs = [];
        project.totalDuration = 0;
        setCurrentProject(project, false); // تحديث داخلي
        eventBus.emit('ayahsProcessedForProject', project);
        updatePreview(); // تحديث المعاينة
        if (audioStatusText) audioStatusText.textContent = 'الرجاء تحديد السورة والآيات والقارئ.';
        return false;
    }
    if (audioStatusText) audioStatusText.textContent = 'جاري جلب بيانات الآيات...';

    return await withSpinner(async () => {
        try {
            const surahDataWithRecitation = await fetchSurahWithAyahs(project.surah, project.reciter);
            if (!surahDataWithRecitation || !surahDataWithRecitation.ayahs) {
                throw new Error("فشل جلب بيانات السورة مع التلاوة.");
            }

            let surahDataWithTranslation = null;
            if (project.translation) {
                if (audioStatusText) audioStatusText.textContent = 'جاري جلب بيانات الترجمة...';
                surahDataWithTranslation = await fetchSurahWithTranslation(project.surah, project.translation);
                if (!surahDataWithTranslation || !surahDataWithTranslation.ayahs) {
                    console.warn("فشل جلب بيانات السورة مع الترجمة، سيتم المتابعة بدونها.");
                    if (audioStatusText) audioStatusText.textContent = 'تحذير: فشل جلب الترجمة.';
                }
            }

            const ayahsInRange = surahDataWithRecitation.ayahs.filter(
                ayah => ayah.numberInSurah >= project.ayahStart && ayah.numberInSurah <= project.ayahEnd
            );

            project.selectedAyahs = ayahsInRange.map(recitedAyah => {
                const translatedAyah = surahDataWithTranslation?.ayahs.find(
                    tAyah => tAyah.numberInSurah === recitedAyah.numberInSurah
                );
                return {
                    number: recitedAyah.number,
                    numberInSurah: recitedAyah.numberInSurah,
                    text: recitedAyah.text,
                    translationText: translatedAyah ? translatedAyah.text : '',
                    audio: recitedAyah.audio,
                    audioSecondary: recitedAyah.audioSecondary,
                    duration: 0,
                    startTime: 0,
                    juz: recitedAyah.juz,
                    manzil: recitedAyah.manzil,
                    page: recitedAyah.page,
                    ruku: recitedAyah.ruku,
                    hizbQuarter: recitedAyah.hizbQuarter,
                    sajda: recitedAyah.sajda || false,
                };
            });
            
            await fetchAudioDurationsForAyahs(project.selectedAyahs, audioStatusText);
            calculateAyahStartTimesAndTotalDuration(project);

            setCurrentProject(project, false);
            saveState("تم تحميل ومعالجة الآيات");
            
            eventBus.emit('ayahsProcessedForProject', project); // هذا سيقوم بتحديث واجهة مستخدم مشغل الصوت
            // updatePreview(); // سيتم استدعاؤها من خلال eventBus 'ayahsProcessedForProject' -> updateUIFromProject
            if (audioStatusText) audioStatusText.textContent = `تم تحميل ${project.selectedAyahs.length} آيات.`;
            setTimeout(() => { if (audioStatusText && audioStatusText.textContent.startsWith('تم تحميل')) audioStatusText.textContent = ''; }, 3000);

            return true;

        } catch (error) {
            handleError(error, "فشل تحميل الآيات المختارة");
            project.selectedAyahs = [];
            project.totalDuration = 0;
            setCurrentProject(project, false);
            saveState("فشل تحميل الآيات، تم مسح التحديد");
            eventBus.emit('ayahsProcessedForProject', project);
            // updatePreview();
            if (audioStatusText) audioStatusText.textContent = 'خطأ في تحميل بيانات الآيات.';
            return false;
        }
    });
}

/**
 * يجلب مدة كل ملف صوتي للآيات.
 * @param {Array<object>} ayahs - مصفوفة من كائنات الآيات من project.selectedAyahs
 * @param {HTMLElement} [statusElement] - عنصر اختياري لعرض حالة التحميل.
 */
async function fetchAudioDurationsForAyahs(ayahs, statusElement) {
    if (!ayahs || ayahs.length === 0) return;

    if (statusElement) statusElement.textContent = `جاري تحميل مدد الصوت لـ ${ayahs.length} آيات... (0/${ayahs.length})`;

    let loadedCount = 0;
    const promises = ayahs.map((ayah, index) => {
        return new Promise((resolve) => {
            if (!ayah.audio) {
                ayah.duration = 0;
                loadedCount++;
                if (statusElement) statusElement.textContent = `تحميل مدد الصوت: (${loadedCount}/${ayahs.length})`;
                resolve();
                return;
            }
            const audioElement = new Audio();
            audioElement.preload = 'metadata';

            const onLoadedMetadata = () => {
                ayah.duration = audioElement.duration;
                cleanup();
                resolve();
            };
            const onError = (e) => {
                console.warn(`فشل تحميل الصوت للآية ${ayah.numberInSurah} للحصول على المدة: ${ayah.audio}`, e);
                ayah.duration = 0;
                cleanup();
                resolve();
            };
            const cleanup = () => {
                audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                audioElement.removeEventListener('error', onError);
                // تحرير الموارد إذا لزم الأمر (عادة المتصفح يقوم بذلك)
                audioElement.src = ''; // قد يساعد في تحرير الموارد
                loadedCount++;
                if (statusElement) statusElement.textContent = `تحميل مدد الصوت: (${loadedCount}/${ayahs.length})`;
            };

            audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
            audioElement.addEventListener('error', onError);
            
            audioElement.src = ayah.audio;
            audioElement.load();
        });
    });
    await Promise.all(promises);
    // الرسالة النهائية ستكون في الدالة المستدعية
}


/**
 * يحسب أوقات بدء كل آية والمدة الإجمالية للمشروع.
 * @param {object} project - كائن المشروع.
 */
export function calculateAyahStartTimesAndTotalDuration(project) {
    let accumulatedTime = 0;
    if (project.selectedAyahs) { // تأكد من وجود selectedAyahs
        project.selectedAyahs.forEach((ayah, index) => {
            ayah.startTime = accumulatedTime;
            accumulatedTime += (ayah.duration || 0);
            if (index < project.selectedAyahs.length - 1) {
                accumulatedTime += (parseFloat(project.delayBetweenAyahs) || 0);
            }
        });
    }
    project.totalDuration = accumulatedTime;
}


/**
 * يحصل على كائن سورة بواسطة رقمها.
 * @param {number} surahNumber
 * @returns {object|null} كائن السورة أو null.
 */
export function getSurahByNumber(surahNumber) {
    if (!quranStaticDataCache || !quranStaticDataCache.surahs || !surahNumber) return null;
    return quranStaticDataCache.surahs.find(s => s.number === parseInt(surahNumber)) || null;
}
