// js/services/pexels-api-service.js
import { PEXELS_API_BASE_URL, PEXELS_API_KEY, AI_BACKGROUND_SUGGESTIONS_COUNT } from '../config/constants.js';
import { handleError, withErrorHandling } from '../core/error-handler.js';

if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
    console.warn('لم يتم تكوين مفتاح Pexels API. سيتم تعطيل اقتراحات الخلفية بواسطة الذكاء الاصطناعي.');
}

const pexelsClient = axios.create({
    baseURL: PEXELS_API_BASE_URL,
    timeout: 15000, // مهلة 15 ثانية
    headers: {
        'Authorization': PEXELS_API_KEY
    }
});

/**
 * يبحث عن صور في Pexels.
 * @param {string} query - استعلام البحث.
 * @param {number} [perPage=AI_BACKGROUND_SUGGESTIONS_COUNT] - عدد النتائج لكل صفحة.
 * @param {number} [page=1] - رقم الصفحة.
 * @param {string} [orientation='landscape'] - الاتجاه المفضل (landscape, portrait, square).
 * @returns {Promise<Array>} وعد يتم حله إلى مصفوفة من كائنات الصور.
 */
export const searchPhotosPexels = withErrorHandling(async (
    query,
    perPage = AI_BACKGROUND_SUGGESTIONS_COUNT,
    page = 1,
    orientation = 'landscape' // افتراضي إلى أفقي لخلفيات الفيديو
) => {
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
        handleError("لم يتم تعيين مفتاح Pexels API.", "Pexels API", false);
        return { photos: [], total_results: 0 }; // إرجاع فارغ إذا لم يكن هناك مفتاح
    }
    const response = await pexelsClient.get('/search', {
        params: {
            query: query,
            per_page: perPage,
            page: page,
            orientation: orientation
        }
    });
    return response.data; // { photos: [], page, per_page, total_results, next_page }
}, 'بحث عن صور Pexels');

/**
 * يبحث عن مقاطع فيديو في Pexels.
 * @param {string} query - استعلام البحث.
 * @param {number} [perPage=AI_BACKGROUND_SUGGESTIONS_COUNT] - عدد النتائج لكل صفحة.
 * @param {number} [page=1] - رقم الصفحة.
 * @param {string} [orientation='landscape'] - الاتجاه المفضل.
 * @returns {Promise<Array>} وعد يتم حله إلى مصفوفة من كائنات الفيديو.
 */
export const searchVideosPexels = withErrorHandling(async (
    query,
    perPage = AI_BACKGROUND_SUGGESTIONS_COUNT,
    page = 1,
    orientation = 'landscape'
) => {
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
        handleError("لم يتم تعيين مفتاح Pexels API.", "Pexels API", false);
        return { videos: [], total_results: 0 }; // إرجاع فارغ إذا لم يكن هناك مفتاح
    }
    const response = await pexelsClient.get('/videos/search', {
        params: {
            query: query,
            per_page: perPage,
            page: page,
            orientation: orientation
        }
    });
    return response.data; // { videos: [], page, per_page, total_results, url, next_page }
}, 'بحث عن فيديوهات Pexels');

/**
 * يجلب صورًا منسقة من Pexels.
 * @param {number} [perPage=AI_BACKGROUND_SUGGESTIONS_COUNT] - عدد النتائج.
 * @param {number} [page=1] - رقم الصفحة.
 * @returns {Promise<Array>} وعد يتم حله إلى مصفوفة من كائنات الصور.
 */
export const getCuratedPhotosPexels = withErrorHandling(async (
    perPage = AI_BACKGROUND_SUGGESTIONS_COUNT,
    page = 1
) => {
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
        handleError("لم يتم تعيين مفتاح Pexels API.", "Pexels API", false);
        return { photos: [], total_results: 0 };
    }
    const response = await pexelsClient.get('/curated', {
        params: {
            per_page: perPage,
            page: page
        }
    });
    return response.data;
}, 'جلب صور منسقة Pexels');

/**
 * يجلب مقاطع فيديو شائعة من Pexels.
 * @param {number} [perPage=AI_BACKGROUND_SUGGESTIONS_COUNT] - عدد النتائج.
 * @param {number} [page=1] - رقم الصفحة.
 * @returns {Promise<Array>} وعد يتم حله إلى مصفوفة من كائنات الفيديو.
 */
export const getPopularVideosPexels = withErrorHandling(async (
    perPage = AI_BACKGROUND_SUGGESTIONS_COUNT,
    page = 1
) => {
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
        handleError("لم يتم تعيين مفتاح Pexels API.", "Pexels API", false);
        return { videos: [], total_results: 0 };
    }
    const response = await pexelsClient.get('/videos/popular', {
        params: {
            per_page: perPage,
            page: page
        }
    });
    return response.data;
}, 'جلب فيديوهات شائعة Pexels');

// مثال على استخدام اقتراحات الذكاء الاصطناعي:
// محاولة العثور على شيء متعلق بـ "إسلامي"، "مسجد"، "طبيعة هادئة"، "روحاني تجريدي"
export async function getAIBackgroundSuggestions(keywords = ["فن إسلامي", "طبيعة هادئة", "صورة ظلية لمسجد", "خلفية روحانية تجريدية"]) {
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    try {
        // مزج الصور ومقاطع الفيديو، أو تحديد نوع واحد
        const photoResults = await searchPhotosPexels(randomKeyword, Math.ceil(AI_BACKGROUND_SUGGESTIONS_COUNT / 2));
        const videoResults = await searchVideosPexels(randomKeyword, Math.floor(AI_BACKGROUND_SUGGESTIONS_COUNT / 2));

        let suggestions = [];
        if (photoResults && photoResults.photos) {
            suggestions = suggestions.concat(photoResults.photos.map(p => ({
                type: 'image',
                url: p.src.large2x || p.src.large, // أو أحجام أخرى مثل 'landscape'
                thumbnail: p.src.medium,
                alt: p.alt || p.photographer,
                source: 'pexels',
                id: p.id
            })));
        }
        if (videoResults && videoResults.videos) {
            suggestions = suggestions.concat(videoResults.videos.map(v => ({
                type: 'video',
                url: v.video_files.find(f => f.quality === 'hd' && (f.width > 1000 || f.height > 1000))?.link || v.video_files[0]?.link,
                thumbnail: v.image, // يوفر Pexels صورة معاينة لمقاطع الفيديو
                alt: v.id, // قد لا تحتوي مقاطع الفيديو على نص بديل مثل الصور
                source: 'pexels',
                id: v.id
            })));
        }
        // خلط وتحديد العدد
        return suggestions.sort(() => 0.5 - Math.random()).slice(0, AI_BACKGROUND_SUGGESTIONS_COUNT);
    } catch (error) {
        handleError(error, 'جلب اقتراحات خلفية AI');
        return []; // إرجاع فارغ عند الخطأ
    }
}
