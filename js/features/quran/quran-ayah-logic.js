// js/features/quran/quran-ayah-logic.js
// هذا الملف يمكن أن يحتوي على منطق أكثر تعقيدًا يتعلق بترقيم الآيات،
// حسابات الجزء، المنـزل، الركوع، الصفحة إذا لم يتم توفيرها مباشرة من API لجميع الاحتياجات.
// حاليًا، يوفر Alquran.cloud API معظم هذا مباشرة مع كائنات الآيات.

/**
 * يحصل على رقم الآية العام من رقم السورة ورقم الآية في السورة.
 * غالبًا ما يتم توفير هذا بواسطة واجهات برمجة التطبيقات، ولكنه مفيد إذا كان الحساب اليدوي مطلوبًا.
 * هذه نسخة مبسطة؛ سيكون التعيين الكامل كبيرًا.
 * يعيد Alquran.cloud API `ayah.number` وهو الرقم العام.
 * @param {number} surahNumber - رقم السورة (1-114).
 * @param {number} ayahInSurahNumber - رقم الآية ضمن السورة.
 * @param {Array<object>} surahsData - مصفوفة من كائنات السور، كل منها يحتوي على `number` و `numberOfAyahs`.
 * @returns {number|null} رقم الآية العام، أو null إذا كان الإدخال غير صالح.
 */
export function getGlobalAyahNumber(surahNumber, ayahInSurahNumber, surahsData) {
    if (!surahsData || surahsData.length === 0 || !surahNumber || !ayahInSurahNumber) {
        console.warn("بيانات غير كافية لحساب رقم الآية العام.");
        return null;
    }

    let globalNumber = 0;
    for (let i = 0; i < surahNumber - 1; i++) {
        const surah = surahsData.find(s => s.number === (i + 1));
        if (!surah || typeof surah.numberOfAyahs !== 'number') { // تحقق إضافي
            console.warn(`بيانات سورة غير صالحة أو مفقودة لـ ${i+1}`);
            return null; 
        }
        globalNumber += surah.numberOfAyahs;
    }
    globalNumber += parseInt(ayahInSurahNumber); // تأكد من أنه رقم

    const currentSurah = surahsData.find(s => s.number === parseInt(surahNumber));
    if (!currentSurah || ayahInSurahNumber < 1 || ayahInSurahNumber > currentSurah.numberOfAyahs) {
        console.warn(`رقم آية غير صالح (${ayahInSurahNumber}) للسورة ${surahNumber} (إجمالي الآيات: ${currentSurah?.numberOfAyahs}).`);
        return null;
    }

    return globalNumber;
}

/**
 * يحصل على السورة ورقم الآية في السورة من رقم آية عام.
 * هذا هو عكس getGlobalAyahNumber.
 * @param {number} globalAyahNumber - رقم الآية العام (1-6236).
 * @param {Array<object>} surahsData - مصفوفة من كائنات السور.
 * @returns {{surah: number, ayah: number, surahName?: string}|null} كائن يحتوي على أرقام السورة والآية، أو null.
 */
export function getSurahAndAyahInSurahFromGlobal(globalAyahNumber, surahsData) {
    if (!surahsData || surahsData.length === 0 || globalAyahNumber < 1 || globalAyahNumber > 6236) {
        console.warn("رقم آية عام غير صالح أو بيانات سور مفقودة.");
        return null;
    }

    let ayahsCounted = 0;
    for (const surah of surahsData) {
        if (globalAyahNumber <= ayahsCounted + surah.numberOfAyahs) {
            return {
                surah: surah.number,
                ayah: globalAyahNumber - ayahsCounted,
                surahName: surah.name // إضافة اسم السورة للفائدة
            };
        }
        ayahsCounted += surah.numberOfAyahs;
    }
    console.warn("لم يتم العثور على سورة لرقم الآية العام:", globalAyahNumber);
    return null; // لا ينبغي أن يحدث إذا كان globalAyahNumber صالحًا
}


/**
 * يتحقق مما إذا كان نطاق الآيات المحدد منطقيًا.
 * @param {number|string} startAyah - رقم آية البداية.
 * @param {number|string} endAyah - رقم آية النهاية.
 * @param {number|string} totalAyahsInSurah - إجمالي عدد الآيات في السورة الحالية.
 * @returns {boolean} true إذا كان النطاق صالحًا.
 */
export function isValidAyahRange(startAyah, endAyah, totalAyahsInSurah) {
    const start = parseInt(startAyah);
    const end = parseInt(endAyah);
    const total = parseInt(totalAyahsInSurah);

    if (isNaN(start) || isNaN(end) || isNaN(total)) return false;

    return start >= 1 &&
           end >= start &&
           end <= total;
}
