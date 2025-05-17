// js/features/background/background-ai-suggest.js
import { getElement } from '../../core/dom-loader.js';
import { getAIBackgroundSuggestions, PEXELS_API_KEY } from '../../services/pexels-api-service.js';
import { withSpinner } from '../../ui/spinner-control.js';
import { handleError } from '../../core/error-handler.js';
import { applyBackground } from './background-import.js';
import { getCurrentProject } from '../../core/state-manager.js';
import eventBus from '../../core/event-bus.js'; // لاستخدامه إذا لزم الأمر

const applyAiBgButton = getElement('apply-ai-bg');
const aiBgSuggestionsContainer = getElement('ai-bg-suggestions');
const aiBgSuggestionsLoader = getElement('ai-bg-suggestions-loader');

let currentSuggestions = []; // لتتبع الاقتراحات المعروضة لتحديث UI

export function initializeAIBackgroundSuggest() {
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'YOUR_PEXELS_API_KEY') {
        if (applyAiBgButton) {
            applyAiBgButton.disabled = true;
            applyAiBgButton.title = "مفتاح Pexels API غير مهيأ. ميزة اقتراح الخلفيات معطلة.";
        }
        // إخفاء قسم الاقتراحات إذا لم يكن المفتاح موجودًا
        if(aiBgSuggestionsLoader) aiBgSuggestionsLoader.style.display = 'none';
        if(aiBgSuggestionsContainer) aiBgSuggestionsContainer.style.display = 'none';
        return;
    }

    if (applyAiBgButton) {
        applyAiBgButton.addEventListener('click', fetchAndDisplayAISuggestions);
    }
}

async function fetchAndDisplayAISuggestions() {
    if (aiBgSuggestionsLoader) aiBgSuggestionsLoader.style.display = 'block';
    if (aiBgSuggestionsContainer) aiBgSuggestionsContainer.innerHTML = '';

    const project = getCurrentProject();
    let queryKeywords = ["islamic background", "spiritual", "calm nature", "mosque silhouette", "arabic calligraphy pattern", "geometric islamic art", "quran light"];
    if (project.surahName) {
        // استخدام اسم السورة (بعد إزالة كلمة "سورة") ككلمة مفتاحية رئيسية
        const surahKeyword = project.surahName.replace("سُورَةُ ", "").trim();
        if (surahKeyword) queryKeywords.unshift(surahKeyword);
    }
    // يمكن إضافة منطق أكثر ذكاءً لاختيار الكلمات المفتاحية بناءً على معنى السورة أو الآيات

    try {
        currentSuggestions = await withSpinner(getAIBackgroundSuggestions(queryKeywords));
        renderSuggestions(currentSuggestions);
    } catch (error) {
        // getAIBackgroundSuggestions يجب أن يعالج الخطأ ويرجع مصفوفة فارغة.
        // handleError(error, "جلب خلفيات AI"); // لا حاجة إذا كان معالجًا بالفعل
        if (aiBgSuggestionsContainer) {
            aiBgSuggestionsContainer.textContent = 'فشل تحميل الاقتراحات. حاول مرة أخرى.';
        }
    } finally {
        if (aiBgSuggestionsLoader) aiBgSuggestionsLoader.style.display = 'none';
    }
}

function renderSuggestions(suggestions) {
    if (!aiBgSuggestionsContainer) return;
    aiBgSuggestionsContainer.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
        aiBgSuggestionsContainer.textContent = 'لا توجد اقتراحات حالياً لهذه الكلمات المفتاحية.';
        return;
    }

    suggestions.forEach(suggestion => {
        const img = document.createElement('img');
        img.src = suggestion.thumbnail;
        img.alt = suggestion.alt || `اقتراح ${suggestion.type} ${suggestion.id}`;
        img.title = `تطبيق ${suggestion.type === 'image' ? 'صورة' : 'فيديو'}: ${suggestion.alt || suggestion.id}`;
        img.dataset.suggestionId = String(suggestion.id); // تأكد من أنه سلسلة للمقارنة

        img.addEventListener('click', () => {
            const selectedSuggestionData = currentSuggestions.find(s => String(s.id) === img.dataset.suggestionId);
            if (!selectedSuggestionData) {
                console.error("لم يتم العثور على بيانات الاقتراح المحدد:", img.dataset.suggestionId);
                return;
            }

            // تحديث UI للاقتراح المحدد
            aiBgSuggestionsContainer.querySelectorAll('img').forEach(i => i.classList.remove('selected-ai-bg'));
            img.classList.add('selected-ai-bg');

            applyBackground({
                type: selectedSuggestionData.type,
                url: selectedSuggestionData.url,
                source: selectedSuggestionData.source || 'pexels',
                alt: selectedSuggestionData.alt,
                id: selectedSuggestionData.id
            });
        });
        aiBgSuggestionsContainer.appendChild(img);
    });
    updateAIBackgroundSelectionUI(getCurrentProject()); // تحديث التحديد بعد العرض
}

/**
 * يحدث تحديد صورة الخلفية AI في قائمة الاقتراحات بناءً على الخلفية الحالية للمشروع.
 * @param {object} project - بيانات المشروع الحالية.
 */
export function updateAIBackgroundSelectionUI(project) {
    if (!aiBgSuggestionsContainer || currentSuggestions.length === 0) return;

    aiBgSuggestionsContainer.querySelectorAll('img').forEach(img => img.classList.remove('selected-ai-bg'));

    let currentBgIdentifier = null;
    if (project.backgroundType === 'image' && project.backgroundImage && project.backgroundImage.includes('pexels.com')) {
        // محاولة استخراج معرف Pexels من الرابط
        const match = project.backgroundImage.match(/pexels.com\/(?:photo|video)\/.*\/(?:image|video)-(\d+)/i) || project.backgroundImage.match(/images.pexels.com\/photos\/(\d+)\//i);
        if (match && match[1]) currentBgIdentifier = match[1];
    } else if (project.backgroundType === 'video' && project.backgroundVideo && project.backgroundVideo.includes('pexels.com')) {
        const match = project.backgroundVideo.match(/videos.pexels.com\/video-files\/(\d+)\//i);
        if (match && match[1]) currentBgIdentifier = match[1];
    } else if (project.backgroundAiQuery) { // إذا كان المصدر AI ولكن ليس Pexels أو الرابط مباشر
        // قد نحتاج لطريقة أخرى لتحديد الاقتراح بناءً على backgroundAiQuery
        // حاليًا، سنعتمد على تطابق الرابط الكامل أو المعرف المستخرج
    }


    if (currentBgIdentifier) {
        const selectedImgElement = aiBgSuggestionsContainer.querySelector(`img[data-suggestion-id='${currentBgIdentifier}']`);
        if (selectedImgElement) {
            selectedImgElement.classList.add('selected-ai-bg');
        }
    } else { // إذا لم يكن هناك معرف، حاول مطابقة الرابط الكامل
        const currentBgUrl = project.backgroundImage || project.backgroundVideo;
        const matchedSuggestion = currentSuggestions.find(s => s.url === currentBgUrl);
        if (matchedSuggestion) {
            const selectedImgElement = aiBgSuggestionsContainer.querySelector(`img[data-suggestion-id='${matchedSuggestion.id}']`);
            if (selectedImgElement) {
                selectedImgElement.classList.add('selected-ai-bg');
            }
        }
    }
}
