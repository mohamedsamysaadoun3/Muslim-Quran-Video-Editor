// js/services/quran-api-service.js
import { ALQURAN_CLOUD_API_BASE, CURATED_RECITERS, CURATED_TRANSLATIONS } from '../config/constants.js';
// import { handleError, withErrorHandlingAsync } from '../core/error-handler.js'; // Future integration

/**
 * Fetches the list of all Surahs.
 * @returns {Promise<Array>} A promise that resolves to an array of Surah objects.
 * @throws {Error} If the API request fails.
 */
export async function fetchAllSurahs() {
    console.log("[Quran API] Fetching all Surahs...");
    try {
        const response = await axios.get(`${ALQURAN_CLOUD_API_BASE}/surah`);
        if (response.data && response.data.data) {
            console.log("[Quran API] Surahs fetched successfully:", response.data.data.length);
            return response.data.data;
        } else {
            throw new Error("Invalid API response structure for Surahs.");
        }
    } catch (error) {
        console.error("[Quran API] Error fetching Surahs:", error);
        // handleError(error, "Fetching Surahs", true); // Future
        alert("فشل تحميل قائمة السور. يرجى التحقق من اتصالك بالإنترنت.");
        throw error; // Re-throw for the caller to handle if needed
    }
}

/**
 * Fetches the list of available reciters.
 * For now, it returns a curated list. Can be changed to fetch from API if a suitable endpoint exists.
 * @returns {Promise<Array>} A promise that resolves to an array of Reciter objects.
 */
export async function fetchAvailableReciters() {
    console.log("[Quran API] Providing curated reciters list...");
    // Simulating an async operation, though it's sync for curated list
    return Promise.resolve(CURATED_RECITERS);
    // Example for API fetch if available:
    /*
    try {
        const response = await axios.get(`${ALQURAN_CLOUD_API_BASE}/edition/type/audio`);
        if (response.data && response.data.data) {
            return response.data.data.map(r => ({ identifier: r.identifier, name: r.englishName })); // Adjust mapping
        } else {
            throw new Error("Invalid API response for reciters.");
        }
    } catch (error) {
        console.error("[Quran API] Error fetching reciters:", error);
        alert("فشل تحميل قائمة القراء.");
        throw error;
    }
    */
}

/**
 * Fetches the list of available translations.
 * For now, it returns a curated list.
 * @returns {Promise<Array>} A promise that resolves to an array of Translation objects.
 */
export async function fetchAvailableTranslations() {
    console.log("[Quran API] Providing curated translations list...");
    return Promise.resolve(CURATED_TRANSLATIONS);
    // Example for API fetch if available:
    /*
    try {
        const response = await axios.get(`${ALQURAN_CLOUD_API_BASE}/edition/type/translation`);
         if (response.data && response.data.data) {
            return response.data.data.map(t => ({ identifier: t.identifier, name: t.englishName })); // Adjust mapping
        } else {
            throw new Error("Invalid API response for translations.");
        }
    } catch (error) {
        console.error("[Quran API] Error fetching translations:", error);
        alert("فشل تحميل قائمة الترجمات.");
        throw error;
    }
    */
}

/**
 * Fetches data for a specific Ayah, including text and audio URL for a given reciter.
 * @param {number} globalAyahNumber - The global number of the Ayah in the Quran.
 * @param {string} reciterIdentifier - The identifier of the reciter.
 * @returns {Promise<object>} A promise that resolves to Ayah data (text, audioSrc, duration estimate).
 * @throws {Error} If the API request fails.
 */
export async function fetchAyahDataWithAudio(globalAyahNumber, reciterIdentifier) {
    // console.log(`[Quran API] Fetching Ayah ${globalAyahNumber} with audio by ${reciterIdentifier}`);
    try {
        // We need to fetch the specific edition for the reciter to get the audio
        // And a text edition (e.g., simple Quran text) for the Ayah text itself.
        // The /ayah/{ayah}/{edition} endpoint gives both text and audio if edition is audio.
        const response = await axios.get(`${ALQURAN_CLOUD_API_BASE}/ayah/${globalAyahNumber}/${reciterIdentifier}`);
        if (response.data && response.data.code === 200 && response.data.data) {
            const ayahData = response.data.data;
            return {
                text: ayahData.text, // Text from the reciter's edition (usually just Quranic text)
                audioSrc: ayahData.audio,
                // Duration is not directly available in this specific endpoint usually.
                // It might be in audioSecondary or require another call/estimation.
                // For simplicity, duration estimation will be handled in audio-data-loader.js
            };
        } else {
            throw new Error(`Invalid API response for Ayah ${globalAyahNumber} with audio.`);
        }
    } catch (error) {
        console.error(`[Quran API] Error fetching Ayah ${globalAyahNumber} with audio for ${reciterIdentifier}:`, error);
        // handleError(error, `Fetching Ayah ${globalAyahNumber} audio`, true); // Future
        // Don't alert for every single ayah fetch failure, could be overwhelming.
        // The calling function (audio-data-loader) should handle this more gracefully.
        throw error;
    }
}

/**
 * Fetches text for a specific Ayah, optionally with a translation.
 * @param {number} globalAyahNumber - The global number of the Ayah in the Quran.
 * @param {string|null} translationIdentifier - The identifier of the translation, or null/empty for no translation.
 * @returns {Promise<object>} A promise that resolves to Ayah text data {text, translationText}.
 * @throws {Error} If the API request fails.
 */
export async function fetchAyahTextWithTranslation(globalAyahNumber, translationIdentifier) {
    // console.log(`[Quran API] Fetching Ayah ${globalAyahNumber} text ${translationIdentifier ? 'with translation ' + translationIdentifier : ''}`);
    const endpoint = translationIdentifier
        ? `${ALQURAN_CLOUD_API_BASE}/ayah/${globalAyahNumber}/editions/quran-simple-clean,${translationIdentifier}` // Fetch Quran text and translation
        : `${ALQURAN_CLOUD_API_BASE}/ayah/${globalAyahNumber}/quran-simple-clean`; // Fetch only Quran text

    try {
        const response = await axios.get(endpoint);
        if (response.data && response.data.code === 200 && response.data.data) {
            let quranText = "";
            let translationText = null;

            if (Array.isArray(response.data.data)) { // Multiple editions returned
                const quranEdition = response.data.data.find(ed => ed.edition.identifier === 'quran-simple-clean');
                const translationEdition = translationIdentifier
                    ? response.data.data.find(ed => ed.edition.identifier === translationIdentifier)
                    : null;

                if (quranEdition) quranText = quranEdition.text;
                if (translationEdition) translationText = translationEdition.text;

            } else { // Single edition returned (quran-simple-clean)
                quranText = response.data.data.text;
            }

            if (!quranText) {
                 // Fallback if quran-simple-clean is not found, try to get text from the first available edition
                if (Array.isArray(response.data.data) && response.data.data.length > 0 && response.data.data[0].text) {
                    quranText = response.data.data[0].text;
                    console.warn(`[Quran API] Used text from edition ${response.data.data[0].edition.identifier} as quran-simple-clean was not primary.`);
                } else {
                    throw new Error(`Quran text not found for Ayah ${globalAyahNumber}.`);
                }
            }

            return {
                text: quranText,
                translationText: translationText,
            };
        } else {
            throw new Error(`Invalid API response for Ayah ${globalAyahNumber} text/translation.`);
        }
    } catch (error) {
        console.error(`[Quran API] Error fetching Ayah ${globalAyahNumber} text/translation:`, error);
        // handleError(error, `Fetching Ayah ${globalAyahNumber} text/translation`, true);
        throw error;
    }
}
