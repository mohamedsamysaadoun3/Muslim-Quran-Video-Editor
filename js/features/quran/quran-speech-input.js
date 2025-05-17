// js/features/quran/quran-speech-input.js
import { getElement } from '../../core/dom-loader.js';
import eventBus from '../../core/event-bus.js';
import { handleError } from '../../core/error-handler.js';
import { getCurrentProject, setCurrentProject } from '../../core/state-manager.js';
import { loadQuranStaticData, getSurahByNumber, loadSelectedAyahsForProject } from './quran-data-loader.js';
import { updateQuranSelectUIFromProject } from './quran-select-ui.js';
import { showNotification } from '../../ui/notifications.js';


const voiceSearchQuranBtn = getElement('voice-search-quran-btn');
const voiceSearchStatus = getElement('voice-search-status');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;

async function initializeSpeechRecognition() {
    if (!SpeechRecognition) {
        if (voiceSearchQuranBtn) {
             voiceSearchQuranBtn.disabled = true;
             voiceSearchQuranBtn.title = 'البحث الصوتي غير مدعوم في هذا المتصفح';
        }
        if (voiceSearchStatus) voiceSearchStatus.textContent = 'البحث الصوتي غير مدعوم';
        console.warn('Speech Recognition API غير مدعوم في هذا المتصفح.');
        return false; // إرجاع false للإشارة إلى فشل التهيئة
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'ar-SA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.trim();
        if (voiceSearchStatus) voiceSearchStatus.textContent = `سمعت: ${speechResult}`;
        processSpeechCommand(speechResult);
    };

    recognition.onerror = (event) => {
        let message = 'حدث خطأ أثناء التعرف على الصوت.';
        if (event.error === 'no-speech') message = 'لم يتم اكتشاف أي كلام. هل الميكروفون يعمل؟';
        else if (event.error === 'audio-capture') message = 'فشل التقاط الصوت. تأكد من صلاحيات الميكروفون.';
        else if (event.error === 'not-allowed') message = 'تم رفض الوصول إلى الميكروفون. الرجاء تمكين صلاحية الميكروفون للموقع.';
        else if (event.error === 'network') message = 'مشكلة في الشبكة للتعرف على الصوت.';

        if (voiceSearchStatus) voiceSearchStatus.textContent = message;
        handleError(`خطأ في التعرف على الصوت: ${event.error} - ${event.message}`, "إدخال صوتي", false);
        showNotification({type: 'error', message: message, duration: 5000});
        stopListening(); // تأكد من الإيقاف عند الخطأ
    };

    recognition.onstart = () => {
        isListening = true;
        if (voiceSearchQuranBtn) voiceSearchQuranBtn.classList.add('listening');
        if (voiceSearchStatus) voiceSearchStatus.textContent = 'جار الاستماع...';
    };

    recognition.onend = () => {
        stopListening(); // سيتم استدعاء هذا دائمًا عند انتهاء التعرف (سواء بنجاح أو خطأ)
    };
    return true; // نجحت التهيئة
}

async function startListening() {
    if (!recognition) {
        const success = await initializeSpeechRecognition();
        if (!success) return; // إذا فشلت التهيئة، لا تستمر
    }
    if (!isListening && recognition) { // تأكد من وجود recognition
        try {
            recognition.start();
        } catch (e) {
            handleError(e, "بدء الاستماع", false);
            showNotification({type: 'error', message: 'فشل بدء التعرف على الصوت.'});
            stopListening();
        }
    }
}

function stopListening() {
    if (recognition && isListening) {
        // recognition.stop(); // onend سيتعامل مع هذا
    }
    isListening = false;
    if (voiceSearchQuranBtn) voiceSearchQuranBtn.classList.remove('listening');
    if (voiceSearchStatus && voiceSearchStatus.textContent.includes('جار الاستماع')) {
        voiceSearchStatus.textContent = 'البحث الصوتي';
    }
}

async function processSpeechCommand(command) {
    showNotification({type: 'info', message: `محاولة فهم: "${command}"`, duration: 2000});

    const project = getCurrentProject();
    const staticData = await loadQuranStaticData();
    if (!staticData || !staticData.surahs || staticData.surahs.length === 0) {
        showNotification({type: 'error', message: 'لا يمكن معالجة الأمر الصوتي، بيانات السور غير متاحة.'});
        return;
    }
    const { surahs } = staticData;

    let foundSurah = null;
    let ayahStart = null;
    let ayahEnd = null;

    const normalizedCommand = command
        .replace(/سورة\s?/g, '')
        .replace(/آية\s?/g, '')
        .replace(/اية\s?/g, '')
        .replace(/السورة\s?/g, '')
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    for (const surah of surahs) {
        const surahNameOnly = surah.name.replace("سُورَةُ ", "").trim();
        const surahNameVariants = [
            surahNameOnly.toLowerCase(),
            surah.englishName.toLowerCase(),
            surah.name.toLowerCase()
        ];
        for (const variant of surahNameVariants) {
            if (normalizedCommand.toLowerCase().includes(variant)) {
                foundSurah = surah;
                break;
            }
        }
        if (foundSurah) break;
    }

    if (foundSurah) {
        project.surah = foundSurah.number;
        project.surahName = foundSurah.name;

        const rangeMatch = normalizedCommand.match(/(?:من|مِن)\s*(\d+)\s*(?:إلى|لِ)\s*(\d+)/);
        if (rangeMatch) {
            ayahStart = parseInt(rangeMatch[1]);
            ayahEnd = parseInt(rangeMatch[2]);
        } else {
            const numbers = normalizedCommand.match(/\d+/g);
            if (numbers) {
                if (numbers.length === 1) {
                    ayahStart = parseInt(numbers[0]);
                    ayahEnd = ayahStart;
                } else if (numbers.length >= 2) {
                    ayahStart = parseInt(numbers[0]);
                    ayahEnd = parseInt(numbers[1]);
                }
            }
        }

        if (ayahStart !== null && ayahEnd !== null) {
            if (ayahStart > 0 && ayahEnd >= ayahStart && ayahEnd <= foundSurah.numberOfAyahs) {
                project.ayahStart = ayahStart;
                project.ayahEnd = ayahEnd;
            } else {
                showNotification({type: 'warning', message: `أرقام الآيات (${ayahStart}-${ayahEnd}) غير صالحة لسورة ${foundSurah.name}. سيتم تحديد كامل السورة.`});
                project.ayahStart = 1;
                project.ayahEnd = foundSurah.numberOfAyahs;
            }
        } else {
            project.ayahStart = 1;
            project.ayahEnd = foundSurah.numberOfAyahs;
        }

        setCurrentProject(project, false); // تحديث داخلي
        updateQuranSelectUIFromProject(project);
        await loadSelectedAyahsForProject(); // هذا سيقوم بحفظ الحالة وإطلاق الأحداث
        // eventBus.emit('quranSelectionChanged', project); // يتم إطلاقه من loadSelectedAyahsForProject
        showNotification({type: 'success', message: `تم تحديد: ${foundSurah.name}, الآيات ${project.ayahStart}-${project.ayahEnd}`});

    } else {
        showNotification({type: 'error', message: 'لم يتم التعرف على اسم السورة. حاول مرة أخرى أو استخدم الاختيار اليدوي.'});
    }
}


export function initializeQuranSpeechInput() {
    if (!SpeechRecognition) {
        if (voiceSearchQuranBtn) {
             voiceSearchQuranBtn.style.display = 'none';
        }
        return;
    }

    if (voiceSearchQuranBtn) {
        voiceSearchQuranBtn.addEventListener('click', () => {
            if (isListening) {
                stopListening(); // إذا كان يستمع بالفعل، أوقفه
            } else {
                startListening(); // وإلا، ابدأ الاستماع
            }
        });
    }
}
