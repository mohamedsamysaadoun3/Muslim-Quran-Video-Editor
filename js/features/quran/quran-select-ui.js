// js/features/quran/quran-select-ui.js
import { getElement } from '../../core/dom-loader.js';
import { getCurrentProject, setCurrentProject, saveState } from '../../core/state-manager.js';
import { loadSelectedAyahsForProject, getSurahByNumber } from './quran-data-loader.js';
import eventBus from '../../core/event-bus.js';

const surahSelect = getElement('surah-select');
const ayahStartSelect = getElement('ayah-start-select');
const ayahEndSelect = getElement('ayah-end-select');
const reciterSelect = getElement('reciter-select');
const translationSelect = getElement('translation-select');

let allSurahsData = []; // لتخزين بيانات السور محليًا بعد جلبها

/**
 * يملأ القائمة المنسدلة لاختيار السورة.
 * @param {Array<object>} surahs - مصفوفة من كائنات السور من API.
 */
export function populateSurahSelect(surahs) {
    if (!surahSelect) return;
    allSurahsData = surahs;
    surahSelect.innerHTML = '<option value="">اختر السورة...</option>';
    surahs.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.number;
        option.textContent = `${surah.number}. ${surah.name} (${surah.englishName})`;
        option.dataset.ayahsCount = surah.numberOfAyahs;
        surahSelect.appendChild(option);
    });
}

/**
 * يملأ القوائم المنسدلة لبداية ونهاية الآيات بناءً على السورة المختارة.
 * @param {number|null} surahNumber - رقم السورة المختارة، أو null لمسح/تعطيل المحددات.
 */
export function updateAyahSelectors(surahNumber) {
    if (!ayahStartSelect || !ayahEndSelect ) return;

    ayahStartSelect.innerHTML = '';
    ayahEndSelect.innerHTML = '';

    const selectedSurahData = surahNumber ? allSurahsData.find(s => s.number === parseInt(surahNumber)) : null;
    
    if (!selectedSurahData) {
        ayahStartSelect.disabled = true;
        ayahEndSelect.disabled = true;
        const placeholderOption = document.createElement('option');
        placeholderOption.textContent = "-";
        ayahStartSelect.appendChild(placeholderOption.cloneNode(true));
        ayahEndSelect.appendChild(placeholderOption);
        return;
    }

    for (let i = 1; i <= selectedSurahData.numberOfAyahs; i++) {
        const startOption = document.createElement('option');
        startOption.value = i;
        startOption.textContent = `آية ${i}`;
        ayahStartSelect.appendChild(startOption.cloneNode(true)); // استنساخ لتجنب المشاكل
        ayahEndSelect.appendChild(startOption); // استخدام نفس الكائن هنا قد يكون جيدًا، أو استنساخ أيضًا
    }
    ayahStartSelect.disabled = false;
    ayahEndSelect.disabled = false;

    const project = getCurrentProject();
    if (project.surah === parseInt(surahNumber)) {
        ayahStartSelect.value = project.ayahStart || 1;
        ayahEndSelect.value = project.ayahEnd || selectedSurahData.numberOfAyahs;
    } else {
        ayahStartSelect.value = 1;
        ayahEndSelect.value = selectedSurahData.numberOfAyahs;
    }
    // تأكد من أن آية النهاية ليست قبل آية البداية (لا تستدعي إعادة تحميل هنا)
    const startVal = parseInt(ayahStartSelect.value);
    const endVal = parseInt(ayahEndSelect.value);
    if (startVal > endVal) {
        ayahEndSelect.value = startVal;
    }
}

/**
 * يملأ القائمة المنسدلة لاختيار القارئ.
 * @param {Array<object>} reciters - مصفوفة من كائنات إصدارات القراء.
 */
export function populateReciterSelect(reciters) {
    if (!reciterSelect) return;
    reciterSelect.innerHTML = '<option value="">اختر القارئ...</option>';
    reciters.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.identifier;
        option.textContent = `${reciter.englishName} (${reciter.name})`;
        reciterSelect.appendChild(option);
    });
}

/**
 * يملأ القائمة المنسدلة لاختيار الترجمة.
 * @param {Array<object>} translations - مصفوفة من كائنات إصدارات الترجمة.
 */
export function populateTranslationSelect(translations) {
    if (!translationSelect) return;
    const noTranslationOptionHTML = '<option value="">بدون ترجمة</option>';
    translationSelect.innerHTML = noTranslationOptionHTML;

    translations.forEach(trans => {
        const option = document.createElement('option');
        option.value = trans.identifier;
        let name = trans.name || trans.englishName; // اسم الإصدار
        let lang = trans.language ? trans.language.toUpperCase() : '';
        option.textContent = `${name} (${lang})`;
        if (trans.author && trans.author !== name) { // إضافة اسم المؤلف إذا كان مختلفًا وموجودًا
             option.textContent += ` - ${trans.author}`;
        }
        translationSelect.appendChild(option);
    });
}

function handleSurahChange() {
    const project = getCurrentProject();
    const selectedSurahNum = parseInt(surahSelect.value);
    
    if (isNaN(selectedSurahNum) || !selectedSurahNum) {
        updateAyahSelectors(null);
        project.surah = null;
        project.surahName = '';
        project.ayahStart = null;
        project.ayahEnd = null;
        project.selectedAyahs = [];
        project.totalDuration = 0;
        setCurrentProject(project, false);
        saveState("تم مسح اختيار السورة");
        eventBus.emit('quranSelectionChanged', project); // ليتم تحديث الواجهة بالكامل
        return;
    }

    // لا تقم بإعادة تحميل الآيات إذا كانت السورة لم تتغير بالفعل
    // إلا إذا كانت selectedAyahs فارغة (مما يعني أنه لم يتم تحميلها من قبل لهذه السورة)
    if (project.surah === selectedSurahNum && project.selectedAyahs && project.selectedAyahs.length > 0) {
        updateAyahSelectors(selectedSurahNum); // فقط تحديث المحددات
        return;
    }

    project.surah = selectedSurahNum;
    const surahDetails = getSurahByNumber(selectedSurahNum);
    project.surahName = surahDetails ? surahDetails.name : `سورة ${selectedSurahNum}`;

    updateAyahSelectors(selectedSurahNum);

    project.ayahStart = parseInt(ayahStartSelect.value);
    project.ayahEnd = parseInt(ayahEndSelect.value);

    setCurrentProject(project, false);
    loadSelectedAyahsForProject(); // سيقوم هذا بحفظ الحالة بعد اكتمال التحميل
    // eventBus.emit('quranSelectionChanged', project); // سيتم إطلاقه بواسطة loadSelectedAyahsForProject
}

function handleAyahStartChange() { // تم إزالة retriggerLoad، دائمًا أعد التحميل
    const startAyah = parseInt(ayahStartSelect.value);
    const endAyah = parseInt(ayahEndSelect.value);

    if (startAyah > endAyah && ayahEndSelect) {
        ayahEndSelect.value = startAyah;
    }

    const project = getCurrentProject();
    project.ayahStart = startAyah;
    project.ayahEnd = parseInt(ayahEndSelect.value);
    setCurrentProject(project, false);
    loadSelectedAyahsForProject();
}

function handleAyahEndChange() {
    const startAyah = parseInt(ayahStartSelect.value);
    const endAyah = parseInt(ayahEndSelect.value);

    if (endAyah < startAyah && ayahStartSelect) {
        ayahStartSelect.value = endAyah;
    }

    const project = getCurrentProject();
    project.ayahStart = parseInt(ayahStartSelect.value);
    project.ayahEnd = endAyah;
    setCurrentProject(project, false);
    loadSelectedAyahsForProject();
}

function handleReciterChange() {
    const project = getCurrentProject();
    project.reciter = reciterSelect.value;
    if (!project.reciter) { // إذا اختار "اختر القارئ..."
        project.selectedAyahs = []; // مسح الآيات لأن الصوت سيتغير
        project.totalDuration = 0;
        setCurrentProject(project, false);
        saveState("تم مسح اختيار القارئ");
        eventBus.emit('quranSelectionChanged', project);
        return;
    }
    setCurrentProject(project, false);
    loadSelectedAyahsForProject();
}

function handleTranslationChange() {
    const project = getCurrentProject();
    project.translation = translationSelect.value;
    setCurrentProject(project, false);
    // لا حاجة لـ saveState هنا بشكل مباشر، loadSelectedAyahsForProject سيفعل ذلك
    loadSelectedAyahsForProject(); // إعادة تحميل الآيات لتحديث الترجمة (أو النص إذا كان API يدمجها)
}


export function initializeQuranSelectUI() {
    if (surahSelect) surahSelect.addEventListener('change', handleSurahChange);
    if (ayahStartSelect) ayahStartSelect.addEventListener('change', handleAyahStartChange);
    if (ayahEndSelect) ayahEndSelect.addEventListener('change', handleAyahEndChange);
    if (reciterSelect) reciterSelect.addEventListener('change', handleReciterChange);
    if (translationSelect) translationSelect.addEventListener('change', handleTranslationChange);

    updateAyahSelectors(null); // تعطيل محددي الآيات مبدئيًا
}

export function updateQuranSelectUIFromProject(project) {
    if (surahSelect) {
        surahSelect.value = project.surah || "";
        updateAyahSelectors(project.surah); // هذا سيملأ ويضبط محددي الآيات
    }

    if (reciterSelect) {
        reciterSelect.value = project.reciter || "";
    }

    if (translationSelect) {
        // استخدام project.translation مباشرة، مع "" كقيمة افتراضية للخيار "بدون ترجمة"
        translationSelect.value = project.translation || "";
    }
}
