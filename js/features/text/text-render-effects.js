// js/features/text/text-render-effects.js
// هذا الملف مسؤول عن تطبيق تأثيرات ظهور النص عند رسمه على الكانفاس،
// خاصة أثناء عملية التصدير أو إذا أردنا معاينة دقيقة للتأثيرات على الكانفاس.

/**
 * يطبق تأثيرات عرض النص (مثل الآلة الكاتبة، التلاشي) على النص الذي يتم رسمه على الكانفاس.
 *
 * @param {CanvasRenderingContext2D} ctx - سياق عرض الكانفاس.
 * @param {string} textLine - السطر الحالي من النص للعرض.
 * @param {number} x - الإحداثي السيني للنص.
 * @param {number} y - الإحداثي الصادي للنص.
 * @param {object} project - إعدادات المشروع الحالية.
 * @param {number} timeIntoAyahAudio - الوقت الحالي منذ بدء *صوت* الآية (بالثواني).
 * @param {number} ayahAudioDuration - المدة الإجمالية *لصوت* هذه الآية (بالثواني).
 * @returns {boolean} - true إذا كان التأثير لا يزال نشطًا (مثل الآلة الكاتبة لم تنته).
 */
export function applyTextEffectAndDraw(ctx, textLine, x, y, project, timeIntoAyahAudio, ayahAudioDuration) {
    const effect = project.textEffect || 'none';
    let textToDraw = textLine;
    let effectIsStillActive = false;
    const originalGlobalAlpha = ctx.globalAlpha; // حفظ الشفافية الأصلية

    // تأكد من أن المدد صالحة
    const validAyahAudioDuration = Math.max(0.1, ayahAudioDuration); // تجنب القسمة على صفر أو مدة قصيرة جدًا

    switch (effect) {
        case 'fade':
            // مدة التلاشي للداخل والخارج (مثلاً 0.5 ثانية لكل منهما، أو نسبة من مدة الآية)
            const fadeInTime = Math.min(0.5, validAyahAudioDuration * 0.25);
            const fadeOutTime = Math.min(0.5, validAyahAudioDuration * 0.25);
            const solidDisplayTime = validAyahAudioDuration - fadeInTime - fadeOutTime;
            const fadeOutStartTimePoint = fadeInTime + (solidDisplayTime > 0 ? solidDisplayTime : 0);

            if (timeIntoAyahAudio < fadeInTime && fadeInTime > 0) {
                ctx.globalAlpha = timeIntoAyahAudio / fadeInTime;
                effectIsStillActive = ctx.globalAlpha < 1;
            } else if (timeIntoAyahAudio >= fadeOutStartTimePoint && fadeOutTime > 0) {
                const timeIntoFadeOutActual = timeIntoAyahAudio - fadeOutStartTimePoint;
                ctx.globalAlpha = Math.max(0, 1 - (timeIntoFadeOutActual / fadeOutTime));
                effectIsStillActive = ctx.globalAlpha > 0;
            } else if (timeIntoAyahAudio >= fadeInTime && timeIntoAyahAudio < fadeOutStartTimePoint) {
                ctx.globalAlpha = 1; // مرئي بالكامل في المنتصف
                effectIsStillActive = false;
            } else { // خارج نطاق المدة أو مدة قصيرة جدًا
                ctx.globalAlpha = (validAyahAudioDuration > 0 && timeIntoAyahAudio < validAyahAudioDuration) ? 1 : 0; // إذا كان ضمن المدة، اجعله مرئيًا، وإلا مخفيًا
                effectIsStillActive = false;
            }
            break;

        case 'typewriter':
            const charsPerSecond = parseInt(project.typewriterSpeed) || 25; // يمكن جعله إعدادًا، 25 حرف/ثانية
            const charsToShow = Math.floor(timeIntoAyahAudio * charsPerSecond);
            textToDraw = textLine.substring(0, Math.min(charsToShow, textLine.length));
            effectIsStillActive = textToDraw.length < textLine.length;
            
            // اختياري: إضافة مؤشر كتابة وامض (يجب رسمه بشكل منفصل إذا كان النص متعدد الأسطر)
            // if (effectIsStillActive && Math.floor(timeIntoAyahAudio * 2) % 2 === 0) {
            //     // const cursorWidth = ctx.measureText("|").width;
            //     // ctx.fillText("|", x + ctx.measureText(textToDraw).width, y);
            // }
            break;

        case 'none':
        default:
            // لا يوجد تأثير، النص سيُعرض بالشفافية الحالية لـ ctx
            break;
    }

    // الرسم الفعلي
    // يجب تعيين محاذاة النص وخصائص أخرى على ctx قبل استدعاء هذه الدالة.
    // (مثل ctx.textAlign = 'center'; ctx.textBaseline = 'middle';)
    ctx.fillText(textToDraw, x, y);

    // استعادة الشفافية الأصلية إذا تم تغييرها
    if (ctx.globalAlpha !== originalGlobalAlpha) {
        ctx.globalAlpha = originalGlobalAlpha;
    }
    
    return effectIsStillActive;
}
