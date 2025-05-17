// js/app.js

// --- DOM Elements ---
const surahSelect = document.getElementById('surah-select');
const ayahStartSelect = document.getElementById('ayah-start-select');
const ayahEndSelect = document.getElementById('ayah-end-select');
const reciterSelect = document.getElementById('reciter-select');
const translationSelect = document.getElementById('translation-select');

const previewSurahTitle = document.getElementById('preview-surah-title-overlay');
const previewAyahText = document.getElementById('preview-ayah-text-overlay');
const previewTranslationText = document.getElementById('preview-translation-text-overlay');
const mainAudioPlayer = document.getElementById('main-audio-player');
const playPauseMainBtn = document.getElementById('play-pause-main-btn');
const timelineSlider = document.getElementById('timeline-slider');
const currentTimeDisplay = document.getElementById('current-time-display');
const totalTimeDisplay = document.getElementById('total-time-display');

const loadingSpinner = document.getElementById('loading-spinner');

// ... (بقية عناصر DOM)

// --- API Base URLs ---
const QURAN_API_BASE = 'https://api.alquran.cloud/v1';

// --- App Data (will be populated from API) ---
let quranMetaData = {
    surahs: [], // Will be fetched
    reciters: [ // A curated list of popular reciters with their API identifiers
        { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد (مرتل)" },
        { id: "ar.abdullahbasfar", name: "عبد الله بصفر" },
        { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس" },
        { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي" },
        { id: "ar.alafasy", name: "مشاري راشد العفاسي" },
        { id: "ar.mahermuaiqly", name: "ماهر المعيقلي" },
        { id: "ar.minshawi", name: "محمد صديق المنشاوي" },
        { id: "ar.muhammadayyoub", name: "محمد أيوب" },
        { id: "ar.saoodshuraym", name: "سعود الشريم" },
        // Find more identifiers at: https://alquran.cloud/api/edition/format/audio
    ],
    translations: [ // A curated list of popular translations with their API identifiers
        { id: "en.sahih", name: "الإنجليزية (Sahih International)" },
        { id: "en.pickthall", name: "الإنجليزية (Pickthall)" },
        { id: "es.cortes", name: "الإسبانية (Julio Cortes)" },
        { id: "fr.hamidullah", name: "الفرنسية (Muhammad Hamidullah)" },
        { id: "de.aburida", name: "الألمانية (Abu Rida)" },
        { id: "id.indonesian", name: "الإندونيسية (Bahasa Indonesia)" },
        { id: "tr.diyanet", name: "التركية (Diyanet Isleri)" },
        { id: "ru.kuliev", name: "الروسية (Elmir Kuliev)" },
        { id: "ur.jalandhry", name: "الأردية (Fateh Muhammad Jalandhry)" },
        // Find more identifiers at: https://alquran.cloud/api/edition/type/translation
    ],
};

let currentAyahAudio = null; // To store current Howl object for audio playback

// --- App State ---
let currentProject = {
    // Default structure, will be initialized properly
    id: null, name: '', surah: null, ayahStart: null, ayahEnd: null,
    reciter: quranMetaData.reciters[0].id, // Default to first reciter
    translation: '', // Default to no translation
    // ... (rest of the project structure from previous version)
    background: { type: 'color', value: '#2c3e50' },
    text: {
        fontFamily: "'Amiri Quran', serif", fontSize: 48, color: '#FFFFFF',
        ayahBgColor: 'rgba(0,0,0,0.3)', effect: 'none'
    },
    video: { aspectRatio: '16:9', filter: 'none' },
    audio: { delayBetweenAyahs: 1, backgroundMusic: null, recitationVolume: 1, musicVolume: 0.5 },
    exportSettings: { resolution: '1920x1080', format: 'webm', framerate: 25 },
    currentAyahIndexInSegment: 0, // To track which ayah is currently playing/displaying
    ayahsData: [], // To store fetched ayahs (text, audio, translation)
};


// --- Utility Functions ---
function showSpinner() {
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
}
function hideSpinner() {
    if (loadingSpinner) loadingSpinner.style.display = 'none';
}
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

// --- API Fetching Functions ---
async function fetchSurahMetadata() {
    showSpinner();
    try {
        const response = await axios.get(`${QURAN_API_BASE}/meta`);
        quranMetaData.surahs = response.data.data.surahs.references;
        populateSurahSelect();
        // Populate ayahs for the initially selected surah (if any from loaded project or default)
        if (surahSelect && (currentProject.surah || surahSelect.value)) {
           await populateAyahSelects(currentProject.surah || surahSelect.value);
        }
    } catch (error) {
        console.error("Error fetching Surah metadata:", error);
        alert("فشل تحميل بيانات السور. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
        // Fallback to a minimal local data if API fails? (Optional)
    } finally {
        hideSpinner();
    }
}

function populateReciterSelect() {
    if (!reciterSelect) return;
    reciterSelect.innerHTML = ''; // Clear existing
    quranMetaData.reciters.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.id;
        option.textContent = reciter.name;
        reciterSelect.appendChild(option);
    });
    if (currentProject.reciter) {
        reciterSelect.value = currentProject.reciter;
    } else if (quranMetaData.reciters.length > 0) {
        reciterSelect.value = quranMetaData.reciters[0].id; // Default to first if no project setting
        currentProject.reciter = reciterSelect.value;
    }
}

function populateTranslationSelect() {
    if (!translationSelect) return;
    translationSelect.innerHTML = '<option value="">بدون ترجمة</option>'; // Add default "no translation"
    quranMetaData.translations.forEach(trans => {
        const option = document.createElement('option');
        option.value = trans.id;
        option.textContent = trans.name;
        translationSelect.appendChild(option);
    });
    if (currentProject.translation) {
        translationSelect.value = currentProject.translation;
    }
}


// --- Quran Data and Playback Logic ---

async function fetchQuranSegmentData() {
    if (!currentProject.surah || !currentProject.ayahStart || !currentProject.ayahEnd || !currentProject.reciter) {
        // Clear previous data if selection is incomplete
        currentProject.ayahsData = [];
        updatePreview();
        if(mainAudioPlayer) mainAudioPlayer.src = '';
        return;
    }
    showSpinner();

    const surah = currentProject.surah;
    const ayahStart = currentProject.ayahStart;
    const ayahEnd = currentProject.ayahEnd;
    const reciter = currentProject.reciter;
    const translationId = currentProject.translation;

    let editions = [reciter, 'quran-uthmani']; // Audio reciter and Quran text (Uthmani script)
    if (translationId) {
        editions.push(translationId);
    }
    const editionsParam = editions.join(',');

    try {
        // api.alquran.cloud uses global ayah numbers for ranges in one call or surah/ayah for single ayah
        // For a segment (e.g., Surah 2, Ayah 1-5), we need to fetch each ayah individually or by surah.
        // Let's fetch the whole surah for text/translation and then filter, and ayahs individually for audio for simplicity.
        // Or, fetch multiple ayahs at once if API supports it well.
        // Example: /surah/2/editions/ar.alafasy,en.sahih
        // This gets whole surah. We will then pick ayahs.

        const response = await axios.get(`${QURAN_API_BASE}/surah/${surah}/editions/${editionsParam}`);
        const surahData = response.data.data;

        currentProject.ayahsData = [];
        const totalAyahsInSegment = ayahEnd - ayahStart + 1;

        for (let i = 0; i < totalAyahsInSegment; i++) {
            const currentAyahNumberInSurah = ayahStart + i;
            const ayahDatum = {};

            surahData.forEach(editionData => {
                const ayahInEdition = editionData.ayahs.find(a => a.numberInSurah === currentAyahNumberInSurah);
                if (ayahInEdition) {
                    if (editionData.identifier === reciter) {
                        ayahDatum.audio = ayahInEdition.audio;
                    } else if (editionData.identifier === 'quran-uthmani') {
                        ayahDatum.text = ayahInEdition.text;
                    } else if (editionData.identifier === translationId) {
                        ayahDatum.translationText = ayahInEdition.text;
                    }
                    ayahDatum.numberInSurah = ayahInEdition.numberInSurah;
                    ayahDatum.numberOverall = ayahInEdition.number; // Global Ayah Number
                }
            });
            if (ayahDatum.text && ayahDatum.audio) { // Ensure we have at least text and audio
                currentProject.ayahsData.push(ayahDatum);
            }
        }

        currentProject.currentAyahIndexInSegment = 0; // Reset to first ayah in segment
        if (currentProject.ayahsData.length > 0) {
            loadAndPlayAyah(currentProject.currentAyahIndexInSegment);
        } else {
            previewAyahText.textContent = "لم يتم العثور على الآيات المحددة.";
            if(mainAudioPlayer) mainAudioPlayer.src = '';
        }

    } catch (error) {
        console.error("Error fetching Quran segment data:", error);
        previewAyahText.textContent = "خطأ في تحميل بيانات الآيات.";
        if(mainAudioPlayer) mainAudioPlayer.src = '';
        alert("فشل تحميل بيانات الآيات. يرجى التحقق من اختيارك واتصالك بالإنترنت.");
    } finally {
        hideSpinner();
    }
}

function loadAndPlayAyah(indexInSegment, play = false) {
    if (!currentProject.ayahsData || indexInSegment < 0 || indexInSegment >= currentProject.ayahsData.length) {
        // End of segment or invalid index
        if (playPauseMainBtn) playPauseMainBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (mainAudioPlayer) mainAudioPlayer.pause();
        updatePreviewForAyah(null); // Clear preview or show completion message
        return;
    }

    const ayahData = currentProject.ayahsData[indexInSegment];
    updatePreviewForAyah(ayahData);

    if (mainAudioPlayer && ayahData.audio) {
        mainAudioPlayer.src = ayahData.audio;
        mainAudioPlayer.onloadedmetadata = () => {
            totalTimeDisplay.textContent = formatTime(mainAudioPlayer.duration);
            timelineSlider.max = mainAudioPlayer.duration;
        };
        mainAudioPlayer.ontimeupdate = () => {
            currentTimeDisplay.textContent = formatTime(mainAudioPlayer.currentTime);
            timelineSlider.value = mainAudioPlayer.currentTime;
        };
        mainAudioPlayer.onended = () => {
            // Auto-play next ayah with delay
            setTimeout(() => {
                currentProject.currentAyahIndexInSegment++;
                loadAndPlayAyah(currentProject.currentAyahIndexInSegment, true);
            }, (currentProject.audio.delayBetweenAyahs || 0) * 1000);
        };
        mainAudioPlayer.onplay = () => {
            if (playPauseMainBtn) playPauseMainBtn.innerHTML = '<i class="fas fa-pause"></i>';
        };
        mainAudioPlayer.onpause = () => {
            if (playPauseMainBtn) playPauseMainBtn.innerHTML = '<i class="fas fa-play"></i>';
        };

        if (play) {
            mainAudioPlayer.play().catch(e => console.error("Error playing audio:", e));
        } else {
             if (playPauseMainBtn) playPauseMainBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
}

function updatePreviewForAyah(ayahData) {
    const selectedSurahData = quranMetaData.surahs.find(s => s.number === currentProject.surah);
    if (selectedSurahData && previewSurahTitle) {
        previewSurahTitle.textContent = `سورة ${selectedSurahData.name}`;
    } else if (previewSurahTitle) {
        previewSurahTitle.textContent = '';
    }

    if (previewAyahText) {
        if (ayahData && ayahData.text) {
            previewAyahText.innerHTML = ayahData.text; // Use innerHTML if text contains entities like basmala
            previewAyahText.style.fontFamily = currentProject.text.fontFamily;
            previewAyahText.style.fontSize = `${currentProject.text.fontSize}px`;
            previewAyahText.style.color = currentProject.text.color;
            previewAyahText.style.backgroundColor = currentProject.text.ayahBgColor;
        } else {
            previewAyahText.textContent = currentProject.surah ? 'جاري تحميل الآية...' : 'اختر السورة والآيات.';
        }
    }

    if (previewTranslationText) {
        if (ayahData && ayahData.translationText) {
            previewTranslationText.textContent = ayahData.translationText;
            // Apply basic styling (same as before)
            previewTranslationText.style.fontFamily = getComputedStyle(document.body).getPropertyValue('--font-family-ui');
            previewTranslationText.style.fontSize = `${Math.max(12, currentProject.text.fontSize * 0.45)}px`;
            previewTranslationText.style.color = tinycolor(currentProject.text.color).isDark() ? '#E0E0E0' : '#333333';
            if (tinycolor(currentProject.text.ayahBgColor).getAlpha() > 0.1) {
                previewTranslationText.style.backgroundColor = tinycolor(currentProject.text.ayahBgColor).darken(10).setAlpha(tinycolor(currentProject.text.ayahBgColor).getAlpha() * 0.8).toRgbString();
            } else {
                previewTranslationText.style.backgroundColor = 'transparent';
            }
        } else {
            previewTranslationText.textContent = '';
        }
    }
    // Update other parts of the preview (background, aspect ratio, filter) if they aren't tied to specific ayah
    updateStaticPreviewElements();
}

function updateStaticPreviewElements() {
    const videoPreviewContainer = document.getElementById('video-preview-container');
    const canvas = document.getElementById('video-preview-canvas'); // Keep this for export
    // const ctx = canvas.getContext('2d'); // For drawing on canvas if needed

    if (currentProject.background.type === 'color' && videoPreviewContainer) {
        videoPreviewContainer.style.backgroundColor = currentProject.background.value;
    }
    // TODO: Handle image/video backgrounds

    if (videoPreviewContainer && currentProject.video.aspectRatio) {
        videoPreviewContainer.style.aspectRatio = currentProject.video.aspectRatio.replace(':', ' / ');
    }

    if (canvas && currentProject.video.filter) { // Apply to container for preview
        videoPreviewContainer.style.filter = currentProject.video.filter;
        // canvas.style.filter = currentProject.video.filter; // If drawing directly on canvas
    }
}


// --- UI Population and Event Handlers (Modified) ---

function populateSurahSelect() { // Modified to use fetched data
    if (!surahSelect) return;
    surahSelect.innerHTML = ''; // Clear previous options (e.g. from a failed load)
    quranMetaData.surahs.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.number;
        option.textContent = `${surah.number}. ${surah.name} (${surah.englishName}) - ${surah.numberOfAyahs} آيات`;
        surahSelect.appendChild(option);
    });
     // Set selected value if a project is loaded or has a default
    if (currentProject.surah && quranMetaData.surahs.some(s => s.number === currentProject.surah)) {
        surahSelect.value = currentProject.surah;
    } else if (quranMetaData.surahs.length > 0) {
        surahSelect.value = quranMetaData.surahs[0].number; // Default to first surah
    }
}

async function populateAyahSelects(surahNumber) { // Modified for async
    if (!ayahStartSelect || !ayahEndSelect) return;

    const selectedSurah = quranMetaData.surahs.find(s => s.number === parseInt(surahNumber));
    if (!selectedSurah) return;

    ayahStartSelect.innerHTML = '';
    ayahEndSelect.innerHTML = '';

    for (let i = 1; i <= selectedSurah.numberOfAyahs; i++) {
        const startOption = document.createElement('option');
        startOption.value = i;
        startOption.textContent = `آية ${i}`;
        ayahStartSelect.appendChild(startOption);

        const endOption = document.createElement('option');
        endOption.value = i;
        endOption.textContent = `آية ${i}`;
        ayahEndSelect.appendChild(endOption);
    }

    if (selectedSurah.numberOfAyahs > 0) {
        ayahStartSelect.value = currentProject.ayahStart || 1;
        updateAyahEndSelectRange(); // This will set endAyah correctly
        ayahEndSelect.value = currentProject.ayahEnd || ayahStartSelect.value;
    }
}

function updateAyahEndSelectRange() { // Mostly same as before
    if (!ayahStartSelect || !ayahEndSelect) return;
    const startAyah = parseInt(ayahStartSelect.value);
    const selectedSurahNumber = parseInt(surahSelect.value);
    const selectedSurah = quranMetaData.surahs.find(s => s.number === selectedSurahNumber);

    if(!selectedSurah) return;
    const currentEndAyah = parseInt(ayahEndSelect.value);

    ayahEndSelect.innerHTML = '';
    for (let i = startAyah; i <= selectedSurah.numberOfAyahs; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `آية ${i}`;
        ayahEndSelect.appendChild(option);
    }

    if (currentEndAyah >= startAyah && currentEndAyah <= selectedSurah.numberOfAyahs) {
        ayahEndSelect.value = currentEndAyah;
    } else if (startAyah <= selectedSurah.numberOfAyahs) {
        ayahEndSelect.value = startAyah;
    } else {
        ayahEndSelect.value = selectedSurah.numberOfAyahs;
    }
}

function setupEventListeners() { // Added playback controls
    // ... (Theme togglers, screen navigation, panel controls - mostly same as before)
    // KEEP PREVIOUS EVENT LISTENERS FOR THEME, NAVIGATION, PANEL TOGGLING, PROJECT TITLE, FONT SIZE
    
    // Theme Toggler
    const themeToggleButtons = document.querySelectorAll('.theme-button');
    themeToggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            themeToggleButtons.forEach(b => b.textContent = isDark ? '☀️' : '🌓');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    });

    // Screen Navigation
    const goToEditorBtn = document.getElementById('go-to-editor-btn');
    const initialScreen = document.getElementById('initial-screen');
    const editorScreen = document.getElementById('editor-screen');
    if (goToEditorBtn) {
        goToEditorBtn.addEventListener('click', () => {
            initialScreen.classList.remove('active-screen');
            initialScreen.style.display = 'none';
            editorScreen.style.display = 'flex';
            editorScreen.classList.add('active-screen');
            initializeNewProject(); // Or load last project
            openDefaultTabAndPanel();
        });
    }
    const backToInitialScreenBtn = document.getElementById('back-to-initial-screen-btn');
    if (backToInitialScreenBtn) {
        backToInitialScreenBtn.addEventListener('click', () => {
            editorScreen.classList.remove('active-screen');
            editorScreen.style.display = 'none';
            initialScreen.style.display = 'flex';
            initialScreen.classList.add('active-screen');
            closeAllControlPanels();
            if (mainAudioPlayer) mainAudioPlayer.pause(); // Stop audio when leaving editor
        });
    }

    // Tab Bar and Panel Controls
    const mainTabButtons = document.querySelectorAll('.main-tab-button');
    mainTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            mainTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const targetPanelId = button.dataset.targetPanel;
            openControlPanel(targetPanelId);
        });
    });
    const closePanelButtons = document.querySelectorAll('.close-panel-btn, .confirm-panel-btn');
    closePanelButtons.forEach(button => {
        button.addEventListener('click', () => {
            const panelIdToClose = button.dataset.panelid;
            closeControlPanel(panelIdToClose);
            if (button.classList.contains('confirm-panel-btn') && panelIdToClose === 'quran-selection-panel') {
                updateQuranSettingsFromPanelAndFetch();
            }
        });
    });

    // Project Title Editable
    const projectTitleEditor = document.getElementById('current-project-title-editor');
    if(projectTitleEditor){
        projectTitleEditor.addEventListener('focus', () => projectTitleEditor.setAttribute('contenteditable', 'true'));
        projectTitleEditor.addEventListener('blur', () => {
            projectTitleEditor.setAttribute('contenteditable', 'false');
            currentProject.name = projectTitleEditor.textContent.trim();
            // console.log("Project name updated:", currentProject.name);
            // TODO: Save project (e.g., to localStorage)
        });
        projectTitleEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                projectTitleEditor.blur();
            }
        });
    }
    
    // Font Size Slider
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValueDisplay = document.getElementById('font-size-value');
    if (fontSizeSlider && fontSizeValueDisplay) {
        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            fontSizeValueDisplay.textContent = `${size}px`;
            currentProject.text.fontSize = parseInt(size);
            updatePreviewForAyah(currentProject.ayahsData[currentProject.currentAyahIndexInSegment]);
        });
    }
    // Font Color Picker
    const fontColorPicker = document.getElementById('font-color-picker');
    if (fontColorPicker) {
        fontColorPicker.addEventListener('input', (e) => {
            currentProject.text.color = e.target.value;
            updatePreviewForAyah(currentProject.ayahsData[currentProject.currentAyahIndexInSegment]);
        });
    }
    // Ayah Background Color Picker
    const ayahBgColorPicker = document.getElementById('ayah-bg-color-picker');
    if (ayahBgColorPicker) {
        ayahBgColorPicker.addEventListener('input', (e) => {
            currentProject.text.ayahBgColor = e.target.value;
            updatePreviewForAyah(currentProject.ayahsData[currentProject.currentAyahIndexInSegment]);
        });
    }
    // Background Color Picker (for main video background)
    const backgroundColorPicker = document.getElementById('background-color-picker');
    if (backgroundColorPicker) {
        backgroundColorPicker.addEventListener('input', (e) => {
            currentProject.background = { type: 'color', value: e.target.value };
            updateStaticPreviewElements();
        });
    }
    // Font Select
    const fontSelect = document.getElementById('font-select');
    if(fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            currentProject.text.fontFamily = e.target.value;
            updatePreviewForAyah(currentProject.ayahsData[currentProject.currentAyahIndexInSegment]);
        });
    }
    // Aspect Ratio Select
    const aspectRatioSelect = document.getElementById('aspect-ratio-select');
    if (aspectRatioSelect) {
        aspectRatioSelect.addEventListener('change', (e) => {
            currentProject.video.aspectRatio = e.target.value;
            updateStaticPreviewElements();
        });
    }
    // Video Filter Select
    const videoFilterSelect = document.getElementById('video-filter-select');
    if (videoFilterSelect) {
        videoFilterSelect.addEventListener('change', (e) => {
            currentProject.video.filter = e.target.value;
            updateStaticPreviewElements();
        });
    }


    // Quran Panel Selects - Trigger update and fetch on change
    if (surahSelect) {
        surahSelect.addEventListener('change', async (e) => {
            currentProject.surah = parseInt(e.target.value);
            await populateAyahSelects(currentProject.surah);
            // Automatically set start/end to 1 if they become invalid or are not set
            currentProject.ayahStart = parseInt(ayahStartSelect.value) || 1;
            currentProject.ayahEnd = parseInt(ayahEndSelect.value) || 1;
            // updateQuranSettingsFromPanelAndFetch(); // No, wait for confirm or full selection
        });
    }
    if (ayahStartSelect) {
        ayahStartSelect.addEventListener('change', () => {
            currentProject.ayahStart = parseInt(ayahStartSelect.value);
            updateAyahEndSelectRange();
            currentProject.ayahEnd = parseInt(ayahEndSelect.value); // Ensure end ayah is also updated
             // updateQuranSettingsFromPanelAndFetch();
        });
    }
    if (ayahEndSelect) {
        ayahEndSelect.addEventListener('change', () => {
            currentProject.ayahEnd = parseInt(ayahEndSelect.value);
            // updateQuranSettingsFromPanelAndFetch();
        });
    }
    if (reciterSelect) {
        reciterSelect.addEventListener('change', (e) => {
            currentProject.reciter = e.target.value;
            // updateQuranSettingsFromPanelAndFetch();
        });
    }
    if (translationSelect) {
        translationSelect.addEventListener('change', (e) => {
            currentProject.translation = e.target.value;
            // updateQuranSettingsFromPanelAndFetch();
        });
    }

    // Playback Controls
    if (playPauseMainBtn) {
        playPauseMainBtn.addEventListener('click', () => {
            if (!mainAudioPlayer || !mainAudioPlayer.src || mainAudioPlayer.src === window.location.href) { // No src or points to current page
                // If no audio loaded, try to load/play current/first ayah
                if (currentProject.ayahsData.length > 0) {
                    loadAndPlayAyah(currentProject.currentAyahIndexInSegment, true);
                } else {
                    // If no data at all, try to fetch it based on panel selections
                    updateQuranSettingsFromPanelAndFetch(true); // Pass true to autoPlay
                }
                return;
            }

            if (mainAudioPlayer.paused) {
                mainAudioPlayer.play().catch(e => console.error("Error playing audio:", e));
            } else {
                mainAudioPlayer.pause();
            }
        });
    }

    if (timelineSlider && mainAudioPlayer) {
        timelineSlider.addEventListener('input', () => {
            if (mainAudioPlayer.duration) { // Make sure audio is loaded
                mainAudioPlayer.currentTime = timelineSlider.value;
            }
        });
    }

    const rewindBtn = document.getElementById('rewind-btn');
    if (rewindBtn) {
        rewindBtn.addEventListener('click', () => {
            if (currentProject.currentAyahIndexInSegment > 0) {
                currentProject.currentAyahIndexInSegment--;
                loadAndPlayAyah(currentProject.currentAyahIndexInSegment, mainAudioPlayer && !mainAudioPlayer.paused);
            }
        });
    }
    const fastForwardBtn = document.getElementById('fast-forward-btn');
    if (fastForwardBtn) {
        fastForwardBtn.addEventListener('click', () => {
            if (currentProject.currentAyahIndexInSegment < currentProject.ayahsData.length - 1) {
                currentProject.currentAyahIndexInSegment++;
                loadAndPlayAyah(currentProject.currentAyahIndexInSegment, mainAudioPlayer && !mainAudioPlayer.paused);
            }
        });
    }

    // Delay between Ayahs
    const delayInput = document.getElementById('delay-between-ayahs');
    if (delayInput) {
        delayInput.addEventListener('change', (e) => {
            currentProject.audio.delayBetweenAyahs = parseFloat(e.target.value) || 0;
        });
    }
}

function updateQuranSettingsFromPanelAndFetch(autoPlay = false) {
    currentProject.surah = parseInt(surahSelect.value);
    currentProject.ayahStart = parseInt(ayahStartSelect.value);
    currentProject.ayahEnd = parseInt(ayahEndSelect.value);
    currentProject.reciter = reciterSelect.value;
    currentProject.translation = translationSelect.value;

    // Validate that start <= end
    if (currentProject.ayahStart > currentProject.ayahEnd) {
        // Optionally, alert the user or automatically adjust
        // For now, let's swap them or set end to start
        currentProject.ayahEnd = currentProject.ayahStart;
        ayahEndSelect.value = currentProject.ayahStart; // Reflect in UI
        // alert("آية البداية لا يمكن أن تكون بعد آية النهاية. تم التعديل.");
    }

    console.log("Quran selection confirmed:", currentProject);
    fetchQuranSegmentData().then(() => {
        if (autoPlay && currentProject.ayahsData.length > 0) {
             setTimeout(() => loadAndPlayAyah(0, true), 100); // Small delay to ensure DOM updates
        } else if (currentProject.ayahsData.length > 0) {
            loadAndPlayAyah(0, false); // Load first ayah but don't play immediately unless autoPlay
        }
    });
}


function initializeNewProject() {
    const defaultProjectName = "مشروع جديد";
    document.getElementById('current-project-title-editor').textContent = defaultProjectName;
    currentProject = {
        id: `project-${Date.now()}`,
        name: defaultProjectName,
        surah: quranMetaData.surahs.length > 0 ? quranMetaData.surahs[0].number : null,
        ayahStart: 1,
        ayahEnd: 1,
        reciter: quranMetaData.reciters.length > 0 ? quranMetaData.reciters[0].id : null,
        translation: '',
        background: { type: 'color', value: '#2c3e50' },
        text: {
            fontFamily: "'Amiri Quran', serif",
            fontSize: 48,
            color: '#FFFFFF',
            ayahBgColor: 'rgba(0,0,0,0.3)',
            effect: 'none'
        },
        video: {
            aspectRatio: '16:9',
            filter: 'none'
        },
        audio: {
            delayBetweenAyahs: 1,
            backgroundMusic: null,
            recitationVolume: 1,
            musicVolume: 0.5,
        },
        exportSettings: {
            resolution: '1920x1080',
            format: 'webm',
            framerate: 25,
        },
        currentAyahIndexInSegment: 0,
        ayahsData: [],
    };

    // Populate and set defaults for UI elements based on new project
    if (surahSelect && currentProject.surah) {
        surahSelect.value = currentProject.surah;
        populateAyahSelects(currentProject.surah).then(() => { // Ensure ayahs are populated before setting
             if(ayahStartSelect) ayahStartSelect.value = currentProject.ayahStart;
             updateAyahEndSelectRange(); // This is crucial
             if(ayahEndSelect) ayahEndSelect.value = currentProject.ayahEnd;
        });
    }
    if (reciterSelect && currentProject.reciter) reciterSelect.value = currentProject.reciter;
    if (translationSelect) translationSelect.value = currentProject.translation; // Should be ""

    document.getElementById('font-size-slider').value = currentProject.text.fontSize;
    document.getElementById('font-size-value').textContent = `${currentProject.text.fontSize}px`;
    document.getElementById('font-color-picker').value = currentProject.text.color;
    document.getElementById('ayah-bg-color-picker').value = currentProject.text.ayahBgColor;
    document.getElementById('background-color-picker').value = currentProject.background.value;
    document.getElementById('font-select').value = currentProject.text.fontFamily;
    document.getElementById('aspect-ratio-select').value = currentProject.video.aspectRatio;
    document.getElementById('video-filter-select').value = currentProject.video.filter;
    document.getElementById('delay-between-ayahs').value = currentProject.audio.delayBetweenAyahs;

    // Clear previous audio and timeline
    if(mainAudioPlayer) mainAudioPlayer.src = '';
    if(timelineSlider) timelineSlider.value = 0;
    if(currentTimeDisplay) currentTimeDisplay.textContent = "0:00";
    if(totalTimeDisplay) totalTimeDisplay.textContent = "0:00";

    updatePreviewForAyah(null); // Clear preview initially
    updateStaticPreviewElements(); // Update background, aspect ratio etc.
    console.log("Initialized new project:", currentProject);

    // Fetch data for default selection if any
    if (currentProject.surah && currentProject.ayahStart && currentProject.ayahEnd && currentProject.reciter) {
         fetchQuranSegmentData(); // Load data for the first ayah of the default selection but don't autoplay
    }
}

function openControlPanel(panelId) {
    closeAllControlPanels(panelId);
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('visible');
}

function closeControlPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.remove('visible');
    // De-activate corresponding tab if no other panel is opened by a tab click
    const stillVisiblePanel = document.querySelector('.control-panel.visible');
    if(!stillVisiblePanel){
        const tabButton = document.querySelector(`.main-tab-button[data-target-panel="${panelId}"]`);
        if(tabButton && tabButton.classList.contains('active')){
            // Only deactivate if no other panel was made active by another tab click
            // This logic is a bit tricky. A simpler way is: if a panel is closed via its X, its tab deactivates.
            // If closed because another tab was opened, the new tab handles active state.
            const activeTab = document.querySelector('.main-tab-button.active');
            if(activeTab && activeTab.dataset.targetPanel === panelId){
                 // activeTab.classList.remove('active'); // Optional: can be annoying UX
            }
        }
    }
}

function closeAllControlPanels(exceptPanelId = null) {
    document.querySelectorAll('.control-panel').forEach(p => {
        if (p.id !== exceptPanelId) p.classList.remove('visible');
    });
}

function openDefaultTabAndPanel() {
    const defaultTab = document.querySelector('.main-tab-button[data-target-panel="quran-selection-panel"]');
    if (defaultTab) defaultTab.click();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggleButtons = document.querySelectorAll('.theme-button');
    const isDark = savedTheme === 'dark';
    if (isDark) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
    themeToggleButtons.forEach(btn => btn.textContent = isDark ? '☀️' : '🌓');
}

// --- Initialization ---
async function init() {
    loadTheme();
    populateReciterSelect(); // Populate static lists first
    populateTranslationSelect();
    await fetchSurahMetadata(); // Fetch dynamic data
    setupEventListeners();

    // If editor screen is active on load (e.g. deep link or refresh), initialize
    if (document.getElementById('editor-screen').classList.contains('active-screen')) {
        initializeNewProject(); // Or load last saved project
        openDefaultTabAndPanel();
    }
}

document.addEventListener('DOMContentLoaded', init);
