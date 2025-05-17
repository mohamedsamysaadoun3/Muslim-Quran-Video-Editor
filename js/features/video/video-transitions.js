// js/features/video/video-transitions.js
// بديل لإدارة الانتقالات بين الآيات أثناء تصدير الفيديو.
// سيتضمن هذا منطق رسم كانفاس أكثر تعقيدًا.

/**
 * يطبق تأثير انتقال بين الإطارات أو الآيات.
 *
 * @param {CanvasRenderingContext2D} ctx - سياق الكانفاس الرئيسي.
 * @param {HTMLCanvasElement|HTMLImageElement|null} prevFrameCanvas - كانفاس/صورة الإطار/الآية السابقة.
 * @param {HTMLCanvasElement|HTMLImageElement|null} currentFrameCanvas - كانفاس/صورة الإطار/الآية الحالية.
 * @param {string} transitionType - نوع الانتقال (مثال: "fade", "slideLeft").
 * @param {number} progress - تقدم الانتقال (0 إلى 1).
 * @param {number} canvasWidth - عرض الكانفاس.
 * @param {number} canvasHeight - ارتفاع الكانفاس.
 */
export function applyTransition(ctx, prevFrameCanvas, currentFrameCanvas, transitionType, progress, canvasWidth, canvasHeight) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    switch (transitionType) {
        case 'fade':
            ctx.globalAlpha = 1;
            if(prevFrameCanvas) ctx.drawImage(prevFrameCanvas, 0, 0, canvasWidth, canvasHeight);

            ctx.globalAlpha = progress;
            if(currentFrameCanvas) ctx.drawImage(currentFrameCanvas, 0, 0, canvasWidth, canvasHeight);
            
            ctx.globalAlpha = 1;
            break;

        case 'slideLeft':
            const prevX = -progress * canvasWidth;
            const currX = canvasWidth - progress * canvasWidth;

            if (prevFrameCanvas) ctx.drawImage(prevFrameCanvas, prevX, 0, canvasWidth, canvasHeight);
            if (currentFrameCanvas) ctx.drawImage(currentFrameCanvas, currX, 0, canvasWidth, canvasHeight);
            break;
        
        case 'none':
        default:
            if(currentFrameCanvas) ctx.drawImage(currentFrameCanvas, 0, 0, canvasWidth, canvasHeight);
            else if (prevFrameCanvas) ctx.drawImage(prevFrameCanvas, 0, 0, canvasWidth, canvasHeight);
            break;
    }
}
