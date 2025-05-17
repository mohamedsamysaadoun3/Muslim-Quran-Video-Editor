// js/features/audio/audio-data-loader.js
// هذا الملف كان مخصصًا لجلب روابط الصوت ومددها.
// تم دمج الكثير من هذا المنطق في `quran-data-loader.js`
// وتحديدًا ضمن `loadSelectedAyahsForProject` و `fetchAudioDurationsForAyahs`.

// إذا احتجنا إلى تحميل بيانات صوتية أكثر تخصصًا، على سبيل المثال، لموسيقى الخلفية،
// أو إذا كنا سنستخدم API صوتي مختلف يتطلب جلب معلومات المقاطع بشكل منفصل،
// فسيكون هذا الملف هو المكان المناسب.

// حاليًا، يمكننا الاحتفاظ به كعنصر نائب أو للتوسع المستقبلي.

/**
 * مثال: يجلب ويهيئ بيانات الصوت لقائمة من كائنات الآيات.
 * هذا بديل مفاهيمي حيث أن المنطق الأساسي موجود في quran-data-loader.
 *
 * @param {Array<object>} ayahs - مصفوفة من كائنات الآيات، من المتوقع أن تحتوي على الأقل على خاصية `audio`.
 * @returns {Promise<Array<object>>} مصفوفة الآيات، معززة بمدة الصوت وبيانات أخرى ذات صلة.
 */
export async function processAudioDataForAyahs(ayahs) {
    if (!ayahs || ayahs.length === 0) {
        return [];
    }

    const processedAyahs = [];

    for (const ayah of ayahs) {
        if (!ayah.audio) { // تأكد من أن اسم الخاصية يطابق ما يضبطه quran-data-loader
            console.warn(`الآية ${ayah.numberInSurah || ayah.number} تفتقد لمصدر الصوت.`);
            processedAyahs.push({ ...ayah, duration: 0 });
            continue;
        }

        try {
            const duration = await getAudioDuration(ayah.audio);
            processedAyahs.push({ ...ayah, duration });
        } catch (error) {
            console.error(`فشل الحصول على مدة الصوت: ${ayah.audio}`, error);
            processedAyahs.push({ ...ayah, duration: 0 }); // مدة افتراضية عند الخطأ
        }
    }
    return processedAyahs;
}

/**
 * دالة مساعدة للحصول على مدة ملف صوتي.
 * @param {string} audioSrc - رابط URL لملف الصوت.
 * @returns {Promise<number>} مدة الصوت بالثواني.
 */
function getAudioDuration(audioSrc) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
        });
        audio.addEventListener('error', (e) => {
            reject(new Error(`خطأ في تحميل الصوت لـ ${audioSrc}: ${e.message || e.type}`));
        });
        audio.preload = 'metadata'; // نحتاج فقط إلى البيانات الوصفية للمدة
        audio.src = audioSrc;
        audio.load();
    });
}

export function initializeAudioDataLoader() {
    // console.log("تم تهيئة محمل بيانات الصوت (بحد أدنى حاليًا).");
}
