// js/services/pexels-api-service.js
import { PEXELS_API_BASE, PEXELS_API_KEY_STORAGE_KEY, PEXELS_IMAGES_PER_PAGE, PEXELS_VIDEOS_PER_PAGE } from '../config/constants.js';
import { PEXELS_API_KEY_DEV } from '../config/api-keys.js'; // For local dev convenience
// import { handleError, withErrorHandlingAsync } from '../core/error-handler.js'; // Future integration

function getPexelsApiKey() {
    const storedKey = localStorage.getItem(PEXELS_API_KEY_STORAGE_KEY);
    if (storedKey) return storedKey;
    if (PEXELS_API_KEY_DEV) {
        console.warn("[Pexels API] Using development API key. Do not commit this if it contains a real key.");
        return PEXELS_API_KEY_DEV;
    }
    return null;
}

async function ensureApiKey() {
    let apiKey = getPexelsApiKey();
    if (!apiKey) {
        apiKey = prompt("لإقتراح خلفيات من Pexels، يرجى إدخال مفتاح Pexels API الخاص بك (يمكن الحصول عليه مجانًا من موقع Pexels):");
        if (apiKey && apiKey.trim() !== "") {
            localStorage.setItem(PEXELS_API_KEY_STORAGE_KEY, apiKey.trim());
        } else {
            alert("بدون مفتاح Pexels API، لن تعمل خاصية اقتراح الخلفيات.");
            return null;
        }
    }
    return apiKey;
}

/**
 * Searches for images on Pexels.
 * @param {string} query - The search query.
 * @param {string} orientation - 'landscape', 'portrait', or 'square'.
 * @param {number} [page=1] - The page number for pagination.
 * @returns {Promise<object|null>} A promise that resolves to Pexels API response data or null on failure/no key.
 */
export async function searchPexelsImages(query, orientation = 'landscape', page = 1) {
    const apiKey = await ensureApiKey();
    if (!apiKey) return null;

    console.log(`[Pexels API] Searching images for: "${query}", orientation: ${orientation}, page: ${page}`);
    try {
        const response = await axios.get(`${PEXELS_API_BASE}/search`, {
            headers: { Authorization: apiKey },
            params: {
                query: query,
                orientation: orientation,
                per_page: PEXELS_IMAGES_PER_PAGE,
                page: page
            }
        });
        if (response.data) {
            console.log("[Pexels API] Images fetched successfully:", response.data.photos.length);
            return response.data; // Contains photos array, total_results, etc.
        } else {
            throw new Error("Invalid Pexels API response for image search.");
        }
    } catch (error) {
        console.error("[Pexels API] Error searching Pexels images:", error.response?.data?.error || error.message);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            alert("خطأ في مفتاح Pexels API أو صلاحيات الوصول. يرجى التحقق منه.");
            localStorage.removeItem(PEXELS_API_KEY_STORAGE_KEY); // Clear potentially bad key
        } else {
            alert("فشل تحميل اقتراحات الصور من Pexels. تحقق من الاتصال أو مفتاح API.");
        }
        // handleError(error, "Pexels Image Search", false); // Don't show generic alert if specific one was shown
        return null;
    }
}

/**
 * Searches for videos on Pexels.
 * @param {string} query - The search query.
 * @param {string} orientation - 'landscape', 'portrait', or 'square'.
 * @param {number} [page=1] - The page number for pagination.
 * @returns {Promise<object|null>} A promise that resolves to Pexels API response data or null on failure/no key.
 */
export async function searchPexelsVideos(query, orientation = 'landscape', page = 1) {
    const apiKey = await ensureApiKey();
    if (!apiKey) return null;

    console.log(`[Pexels API] Searching videos for: "${query}", orientation: ${orientation}, page: ${page}`);
    try {
        const response = await axios.get(`${PEXELS_API_BASE}/videos/search`, { // Note: /videos/search endpoint
            headers: { Authorization: apiKey },
            params: {
                query: query,
                orientation: orientation,
                per_page: PEXELS_VIDEOS_PER_PAGE,
                page: page,
                size: 'medium' // Request medium size videos to keep them manageable
            }
        });
        if (response.data) {
            console.log("[Pexels API] Videos fetched successfully:", response.data.videos.length);
            return response.data; // Contains videos array, total_results, etc.
        } else {
            throw new Error("Invalid Pexels API response for video search.");
        }
    } catch (error) {
        console.error("[Pexels API] Error searching Pexels videos:", error.response?.data?.error || error.message);
         if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            alert("خطأ في مفتاح Pexels API أو صلاحيات الوصول. يرجى التحقق منه.");
            localStorage.removeItem(PEXELS_API_KEY_STORAGE_KEY);
        } else {
            alert("فشل تحميل اقتراحات الفيديو من Pexels. تحقق من الاتصال أو مفتاح API.");
        }
        // handleError(error, "Pexels Video Search", false);
        return null;
    }
}
