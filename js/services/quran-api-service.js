// js/services/quran-api-service.js
import { QURAN_API_BASE_URL } from '../config/constants.js';
import { handleError, withErrorHandling } from '../core/error-handler.js';

const apiClient = axios.create({
    baseURL: QURAN_API_BASE_URL,
    timeout: 10000, // مهلة 10 ثواني
});

/**
 * يجلب قائمة بجميع السور.
 * @returns {Promise<Array>} وعد يتم حله إلى مصفوفة من كائنات السور.
 * API: http://api.alquran.cloud/v1/surah
 */
export const fetchSurahs = withErrorHandling(async () => {
    const response = await apiClient.get('/surah');
    return response.data.data; // يحتوي على مصفوفة من السور
}, 'جلب السور');

/**
 * يجلب تفاصيل سورة معينة، بما في ذلك آياتها.
 * @param {number} surahNumber - رقم السورة (1-114).
 * @param {string} [recitationIdentifier='ar.alafasy'] - معرّف لتلاوة الصوت.
 * @returns {Promise<Object>} وعد يتم حله إلى كائن سورة مع الآيات.
 * API: http://api.alquran.cloud/v1/surah/1/ar.alafasy
 */
export const fetchSurahWithAyahs = withErrorHandling(async (surahNumber, recitationIdentifier = 'ar.alafasy') => {
    if (!surahNumber) throw new Error("رقم السورة مطلوب.");
    const endpoint = recitationIdentifier ? `/surah/${surahNumber}/${recitationIdentifier}` : `/surah/${surahNumber}`;
    const response = await apiClient.get(endpoint);
    return response.data.data; // يحتوي على تفاصيل السورة والآيات مع الصوت
}, 'جلب سورة مع الآيات');


/**
 * يجلب آية معينة.
 * @param {number|string} ayahIdentifier - معرّف الآية (مثال: "2:255" أو رقم الآية العام).
 * @param {string} [recitationIdentifier='ar.alafasy'] - معرّف التلاوة.
 * @returns {Promise<Object>} وعد يتم حله إلى كائن آية.
 * API: http://api.alquran.cloud/v1/ayah/2:255/ar.alafasy
 */
export const fetchAyah = withErrorHandling(async (ayahIdentifier, recitationIdentifier = 'ar.alafasy') => {
    if (!ayahIdentifier) throw new Error("معرّف الآية مطلوب.");
    const endpoint = recitationIdentifier ? `/ayah/${ayahIdentifier}/${recitationIdentifier}` : `/ayah/${ayahIdentifier}`;
    const response = await apiClient.get(endpoint);
    return response.data.data;
}, 'جلب آية');

/**
 * يجلب قائمة بالقراء المتاحين (Editions من نوع 'audio').
 * @returns {Promise<Array>} وعد يتم حله إلى مصفوفة من كائنات إصدارات القراء.
 * API: http://api.alquran.cloud/v1/edition?format=audio&language=ar&type=versebyverse (مثال)
 * سنسهل ونجلب جميع إصدارات الصوت.
 */
export const fetchReciters = withErrorHandling(async () => {
    const response = await apiClient.get('/edition', {
        params: {
            format: 'audio',
            type: 'versebyverse' // أو 'translation' لترجمات صوتية
            // language: 'ar' // يمكن حذفه للحصول على جميع اللغات، أو تحديده
        }
    });
    // تصفية للتلاوات العربية، أو توفير خيارات للغات أخرى إذا لزم الأمر
    return response.data.data.filter(edition => edition.language === 'ar' && edition.type === 'versebyverse');
}, 'جلب القراء');

/**
 * يجلب قائمة بالترجمات المتاحة (Editions من نوع 'translation').
 * @returns {Promise<Array>} وعد يتم حله إلى مصفوفة من كائنات إصدارات الترجمة.
 * API: http://api.alquran.cloud/v1/edition?format=text&type=translation
 */
export const fetchTranslations = withErrorHandling(async () => {
    const response = await apiClient.get('/edition', {
        params: {
            format: 'text',
            type: 'translation'
        }
    });
    return response.data.data;
}, 'جلب الترجمات');


/**
 * يجلب آيات سورة معينة مع ترجمة محددة.
 * @param {number} surahNumber - رقم السورة.
 * @param {string} translationIdentifier - معرّف إصدار الترجمة.
 * @returns {Promise<Object>} وعد يتم حله إلى كائن سورة مع آيات مترجمة.
 * API: http://api.alquran.cloud/v1/surah/1/en.sahih
 */
export const fetchSurahWithTranslation = withErrorHandling(async (surahNumber, translationIdentifier) => {
    if (!surahNumber || !translationIdentifier) throw new Error("رقم السورة ومعرّف الترجمة مطلوبان.");
    const response = await apiClient.get(`/surah/${surahNumber}/${translationIdentifier}`);
    return response.data.data; // يحتوي على تفاصيل السورة والآيات مع الترجمة
}, 'جلب سورة مع الترجمة');


/**
 * يبحث في القرآن.
 * هذا API قوي ولكن قد يكون محدود الاستخدام أو يتطلب خططًا محددة للاستخدام الكثيف.
 * @param {string} query - مصطلح البحث.
 * @param {string} [scope='surah:1-114'] - نطاق البحث، مثال: 'surah:1' أو 'ayah:2:255'.
 * @param {string} [translationIdentifier] - ترجمة اختيارية للبحث ضمنها.
 * @returns {Promise<Object>} نتائج البحث.
 * API: http://api.alquran.cloud/v1/search/muhammad/all/en.sahih
 */
export const searchQuran = withErrorHandling(async (query, scope = 'all', translationIdentifier) => {
    if (!query) throw new Error("مصطلح البحث مطلوب.");
    const endpoint = translationIdentifier
        ? `/search/${encodeURIComponent(query)}/${scope}/${translationIdentifier}`
        : `/search/${encodeURIComponent(query)}/${scope}`;
    const response = await apiClient.get(endpoint);
    return response.data.data;
}, 'البحث في القرآن');

// يمكنك إضافة المزيد من دوال API المحددة حسب الحاجة.
