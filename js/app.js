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

const videoPreviewContainer = document.getElementById('video-preview-container');
const bgBlurElement = document.getElementById('video-preview-background-blur');
const canvas = document.getElementById('video-preview-canvas');
const ctx = canvas.getContext('2d');

const projectTitleEditor = document.getElementById('current-project-title-editor');
const aspectRatioSelect = document.getElementById('aspect-ratio-select');
const videoFilterSelect = document.getElementById('video-filter-select');
const fontSelect = document.getElementById('font-select');
const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeValueDisplay = document.getElementById('font-size-value');
const fontColorPicker = document.getElementById('font-color-picker');
const ayahBgColorPicker = document.getElementById('ayah-bg-color-picker');
const backgroundColorPicker = document.getElementById('background-color-picker');
const delayInput = document.getElementById('delay-between-ayahs');
const importBackgroundInput = document.getElementById('import-background');

// Export related
const exportBtn = document.getElementById('export-btn');
const resolutionSelect = document.getElementById('resolution-select');
const videoFormatSelect = document.getElementById('video-format-select');
const framerateSelect = document.getElementById('framerate-select');
const exportProgressContainer = document.getElementById('export-progress');
const exportProgressBar = document.getElementById('export-progress-bar');
const exportProgressText = document.getElementById('export-progress-text');

let capturer = null; // For CCapture.js


// --- API Base URLs ---
const QURAN_API_BASE = 'https://api.alquran.cloud/v1';

// --- App Data ---
let quranMetaData = {
    surahs: [],
    reciters: [
        { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد (مرتل)" },
        { id: "ar.abdullahbasfar", name: "عبد الله بصفر" },
        { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس" },
        { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي" },
        { id: "ar.alafasy", name: "مشاري راشد العفاسي" },
        { id: "ar.mahermuaiqly", name: "ماهر المعيقلي" },
        { id: "ar.minshawi", name: "محمد صديق المنشاوي" },
    ],
    translations: [
        { id: "en.sahih", name: "الإنجليزية (Sahih Intl)" },
        { id: "fr.hamidullah", name: "الفرنسية (Hamidullah)" },
        { id: "es.cortes", name: "الإسبانية (Cortes)" },
        { id: "de.aburida", name: "الألمانية (Abu Rida)" },
    ],
};

// --- App State ---
let currentProject = {}; // Will be initialized by initializeNewProject
const MAX_HISTORY_STATES = 20;
let projectHistory = [];
let currentHistoryIndex = -1;


// --- Utility Functions ---
function showSpinner() { if (loadingSpinner) loadingSpinner.style.display = 'flex'; }
function hideSpinner() { if (loadingSpinner) loadingSpinner.style.display = 'none'; }
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

// --- Undo/Redo State Management ---
function saveStateToHistory() {
    // Deep clone currentProject, but exclude non-serializable parts if any (like DOM elements or large binary data)
    // For now, a simple deep clone for basic properties.
    const stateToSave = JSON.parse(JSON.stringify({
        ...currentProject,
        ayahsData: [], // Don't save full ayahsData in history for memory, refetch if needed or handle smarter
        // Keep essential pointers:
        surah: currentProject.surah,
        ayahStart: currentProject.ayahStart,
        ayahEnd: currentProject.ayahEnd,
        reciter: currentProject.reciter,
        translation: currentProject.translation,
    }));


    projectHistory = projectHistory.slice(0, currentHistoryIndex + 1); // Truncate redo stack
    projectHistory.push(stateToSave);
    if (projectHistory.length > MAX_HISTORY_STATES) {
        projectHistory.shift(); // Remove oldest state
    }
    currentHistoryIndex = projectHistory.length - 1;
    updateUndoRedoButtons();
}

function undoState() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        loadStateFromHistory(projectHistory[currentHistoryIndex]);
    }
    updateUndoRedoButtons();
}

function redoState() {
    if (currentHistoryIndex < projectHistory.length - 1) {
        currentHistoryIndex++;
        loadStateFromHistory(projectHistory[currentHistoryIndex]);
    }
    updateUndoRedoButtons();
}

function loadStateFromHistory(state) {
    // Apply the state back to currentProject and UI
    // This needs to be comprehensive
    currentProject = JSON.parse(JSON.stringify(state)); // Deep clone back
    
    // Update UI elements based on the loaded state
    projectTitleEditor.textContent = currentProject.name;
    surahSelect.value = currentProject.surah;
    // Repopulate ayahs based on surah and set start/end
    populateAyahSelects(currentProject.surah).then(() => {
        ayahStartSelect.value = currentProject.ayahStart;
        updateAyahEndSelectRange(); // This will try to set endAyah correctly
        ayahEndSelect.value = currentProject.ayahEnd;
    });
    reciterSelect.value = currentProject.reciter;
    translationSelect.value = currentProject.translation;
    
    aspectRatioSelect.value = currentProject.video.aspectRatio;
    videoFilterSelect.value = currentProject.video.filter;
    fontSelect.value = currentProject.text.fontFamily;
    fontSizeSlider.value = currentProject.text.fontSize;
    fontSizeValueDisplay.textContent = `${currentProject.text.fontSize}px`;
    fontColorPicker.value = currentProject.text.color;
    ayahBgColorPicker.value = currentProject.text.ayahBgColor;
    backgroundColorPicker.value = currentProject.background.type === 'color' ? currentProject.background.value : '#000000'; // Fallback for non-color
    delayInput.value = currentProject.audio.delayBetweenAyahs;

    // Important: Refetch Quran data for the active ayahs if not storing them in history
    if (currentProject.surah && currentProject.ayahStart && currentProject.ayahEnd) {
        fetchQuranSegmentData(false); // Fetch but don't autoplay
    } else {
        updatePreviewForAyah(null); // Clear preview if no valid segment
    }
    updateStaticPreviewElements();
}

function updateUndoRedoButtons() {
    document.getElementById('undo-btn').disabled = currentHistoryIndex <= 0;
    document.getElementById('redo-btn').disabled = currentHistoryIndex >= projectHistory.length - 1;
}


// --- API Fetching Functions ---
async function fetchSurahMetadata() { /* ... (same as previous) ... */ }
function populateReciterSelect() { /* ... (same as previous) ... */ }
function populateTranslationSelect() { /* ... (same as previous) ... */ }

// --- Quran Data and Playback Logic ---
async function fetchQuranSegmentData(autoPlay = false) { /* ... (same as previous, ensure show/hideSpinner) ... */ }
function loadAndPlayAyah(indexInSegment, play = false) { /* ... (same as previous) ... */ }

function updatePreviewForAyah(ayahData) {
    // ... (same as before, ensure it uses currentProject for styles) ...
    updateStaticPreviewElements();
}

function updateStaticPreviewElements() {
    // ... (same logic for bgBlurElement, videoPreviewContainer, canvas aspect ratio, filters) ...
    // Make sure to use currentProject.background.value for image URLs
    if (bgBlurElement) {
        if (currentProject.background.type === 'color') {
            bgBlurElement.style.backgroundImage = 'none';
            bgBlurElement.style.backgroundColor = '#0A0A0A';
            if (videoPreviewContainer) videoPreviewContainer.style.backgroundColor = currentProject.background.value;
            ctx.fillStyle = currentProject.background.value;
            const [w,h] = getCanvasDimensionsForPreview();
            canvas.width = w; canvas.height = h;
            ctx.fillRect(0,0,w,h);
        } else if (currentProject.background.type === 'image' || currentProject.background.type === 'video_url') {
            bgBlurElement.style.backgroundImage = `url(${currentProject.background.value_data_url || currentProject.background.value})`; // Prefer data_url if available
            bgBlurElement.style.backgroundColor = 'transparent';
            if(canvas && currentProject.background.type === 'image') {
                const img = new Image();
                img.onload = () => { /* ... (draw image to canvas logic from previous snippet) ... */ }
                img.src = currentProject.background.value_data_url || currentProject.background.value;
            } else if (videoPreviewContainer) {
                // Handle video background preview (e.g., show first frame or placeholder)
                videoPreviewContainer.style.backgroundImage = `url(${currentProject.background.value_data_url || currentProject.background.value})`; // Simple for now
            }
        }
    }
    if (videoPreviewContainer && currentProject.video.aspectRatio) {
        videoPreviewContainer.style.aspectRatio = currentProject.video.aspectRatio.replace(':', ' / ');
    }
    if (videoPreviewContainer && currentProject.video.filter) {
        videoPreviewContainer.style.filter = currentProject.video.filter;
    }
    // After all visual updates, render canvas for export (if needed immediately)
    // renderCurrentFrameToCanvas(); // Call this to draw text etc. on canvas
}

function getCanvasDimensionsForPreview() { /* ... (same as previous) ... */ }
function getExportCanvasDimensions() {
    const [w, h] = (currentProject.exportSettings.resolution || "1920x1080").split('x').map(Number);
    return [w, h];
}

// --- UI Population and Event Handlers ---
function populateSurahSelect() { /* ... (same as previous) ... */ }
async function populateAyahSelects(surahNumber) { /* ... (same as previous) ... */ }
function updateAyahEndSelectRange() { /* ... (same as previous) ... */ }

function setupEventListeners() {
    // ... (Theme, Screen Nav, Panel Controls, Project Title - same as previous) ...
    // ... (Playback Controls, Timeline Slider - same as previous) ...

    // Quran Panel Selects - Trigger update on confirm
    const quranConfirmBtn = document.querySelector('#quran-selection-panel .confirm-panel-btn');
    if (quranConfirmBtn) {
        quranConfirmBtn.addEventListener('click', () => {
            updateQuranSettingsFromPanelAndFetch(false); // Fetch but don't auto-play on confirm
            saveStateToHistory();
        });
    }
    // Individual selects should update currentProject immediately for live feedback if panel is open
    // but actual fetch happens on confirm or play if no data.
    [surahSelect, ayahStartSelect, ayahEndSelect, reciterSelect, translationSelect].forEach(el => {
        if(el) el.addEventListener('change', updateCurrentProjectQuranSettings);
    });


    // Background Settings
    if(importBackgroundInput) importBackgroundInput.addEventListener('change', handleBackgroundImport);
    if(backgroundColorPicker) backgroundColorPicker.addEventListener('input', (e) => {
        currentProject.background = { type: 'color', value: e.target.value };
        updateStaticPreviewElements();
        saveStateToHistory();
    });

    // Effects & Text Panel
    if(aspectRatioSelect) aspectRatioSelect.addEventListener('change', (e) => { currentProject.video.aspectRatio = e.target.value; updateStaticPreviewElements(); saveStateToHistory(); });
    if(videoFilterSelect) videoFilterSelect.addEventListener('change', (e) => { currentProject.video.filter = e.target.value; updateStaticPreviewElements(); saveStateToHistory(); });
    if(fontSelect) fontSelect.addEventListener('change', (e) => { currentProject.text.fontFamily = e.target.value; updatePreviewForAyah(currentProject.ayahsData[currentProject.currentAyahIndexInSegment]); saveStateToHistory(); });
    if(fontSizeSlider) fontSizeSlider.addEventListener('input', (e) => { /* ... update, call updatePreviewForAyah, saveStateToHistory() ... */ }); // Debounce this for performance
    if(fontColorPicker) fontColorPicker.addEventListener('input', (e) => { currentProject.text.color = e.target.value; updatePreviewForAyah(currentProject.ayahsData[currentProject.currentAyahIndexInSegment]); saveStateToHistory(); });
    if(ayahBgColorPicker) ayahBgColorPicker.addEventListener('input', (e) => { currentProject.text.ayahBgColor = e.target.value; updatePreviewForAyah(currentProject.ayahsData[currentProject.currentAyahIndexInSegment]); saveStateToHistory(); });
    
    // Audio Settings
    if(delayInput) delayInput.addEventListener('change', (e) => { currentProject.audio.delayBetweenAyahs = parseFloat(e.target.value) || 0; saveStateToHistory(); });

    // Export Settings
    if(exportBtn) exportBtn.addEventListener('click', startExport);
    if(resolutionSelect) resolutionSelect.addEventListener('change', (e) => currentProject.exportSettings.resolution = e.target.value);
    if(videoFormatSelect) videoFormatSelect.addEventListener('change', (e) => currentProject.exportSettings.format = e.target.value);
    if(framerateSelect) framerateSelect.addEventListener('change', (e) => currentProject.exportSettings.framerate = parseInt(e.target.value));

    // Undo/Redo buttons
    document.getElementById('undo-btn').addEventListener('click', undoState);
    document.getElementById('redo-btn').addEventListener('click', redoState);

    // Save Project (simple localStorage for now)
    const saveProjectBtn = document.getElementById('save-project-btn-editor');
    if(saveProjectBtn) saveProjectBtn.addEventListener('click', saveCurrentProjectToLocalStorage);

    // Load projects on initial screen (placeholder)
    document.getElementById('go-to-editor-btn').addEventListener('click', () => {
        // ... (navigation logic) ...
        const loadedProject = loadProjectFromLocalStorage('lastOpened'); // Example
        if (loadedProject) {
            loadProjectIntoEditor(loadedProject);
        } else {
            initializeNewProject();
        }
        openDefaultTabAndPanel();
    });
}

function updateCurrentProjectQuranSettings() {
    // Updates currentProject from Quran panel selects without fetching immediately
    if (!currentProject || !surahSelect || !ayahStartSelect || !ayahEndSelect || !reciterSelect || !translationSelect) return;
    currentProject.surah = parseInt(surahSelect.value);
    currentProject.ayahStart = parseInt(ayahStartSelect.value);
    currentProject.ayahEnd = parseInt(ayahEndSelect.value);
    // Ensure start <= end
    if (currentProject.ayahStart > currentProject.ayahEnd) {
        ayahEndSelect.value = currentProject.ayahStart; // Auto-correct UI
        currentProject.ayahEnd = currentProject.ayahStart;
    }
    currentProject.reciter = reciterSelect.value;
    currentProject.translation = translationSelect.value;
}


function handleBackgroundImport(event) { /* ... (logic from previous snippet, ensure to set currentProject.background.value_data_url for file reader result) ... */ }

function updateQuranSettingsFromPanelAndFetch(autoPlay = false) { /* ... (same, then call saveStateToHistory()) ... */ }

function initializeNewProject() {
    currentProject = {
        id: `project-${Date.now()}`,
        name: "مشروع جديد",
        surah: quranMetaData.surahs.length > 0 ? quranMetaData.surahs[0].number : 1,
        ayahStart: 1, ayahEnd: 1,
        reciter: quranMetaData.reciters.length > 0 ? quranMetaData.reciters[0].id : "ar.alafasy",
        translation: '',
        background: { type: 'color', value: '#000000' }, // Default to black bg for card
        text: {
            fontFamily: "'Amiri Quran', serif", fontSize: 36, color: '#FFFFFF',
            ayahBgColor: 'rgba(0,0,0,0.2)', effect: 'none'
        },
        video: { aspectRatio: '9:16', filter: 'none' }, // Default to portrait
        audio: { delayBetweenAyahs: 1 },
        exportSettings: { resolution: '1080x1920', format: 'webm', framerate: 25 },
        currentAyahIndexInSegment: 0, ayahsData: [],
    };
    projectHistory = []; currentHistoryIndex = -1; // Reset history
    loadProjectIntoUI(currentProject); // Apply to UI
    fetchQuranSegmentData(false); // Fetch for initial selection
    saveStateToHistory(); // Save initial state
}

function loadProjectIntoEditor(projectData) {
    currentProject = JSON.parse(JSON.stringify(projectData)); // Deep clone
    projectHistory = []; currentHistoryIndex = -1; // Reset history for loaded project
    loadProjectIntoUI(currentProject);
    if (currentProject.surah && currentProject.ayahStart && currentProject.ayahEnd) {
        fetchQuranSegmentData(false);
    } else {
        updatePreviewForAyah(null);
    }
    saveStateToHistory(); // Save as first state for this loaded project
}

function loadProjectIntoUI(project) { // Helper to set all UI elements from project data
    projectTitleEditor.textContent = project.name;
    if (surahSelect && project.surah) {
        surahSelect.value = project.surah;
        populateAyahSelects(project.surah).then(() => {
            if(ayahStartSelect) ayahStartSelect.value = project.ayahStart;
            updateAyahEndSelectRange();
            if(ayahEndSelect) ayahEndSelect.value = project.ayahEnd;
        });
    }
    if (reciterSelect && project.reciter) reciterSelect.value = project.reciter;
    if (translationSelect) translationSelect.value = project.translation;
    
    aspectRatioSelect.value = project.video.aspectRatio;
    videoFilterSelect.value = project.video.filter;
    fontSelect.value = project.text.fontFamily;
    fontSizeSlider.value = project.text.fontSize;
    fontSizeValueDisplay.textContent = `${project.text.fontSize}px`;
    fontColorPicker.value = project.text.color;
    ayahBgColorPicker.value = project.text.ayahBgColor;
    backgroundColorPicker.value = project.background.type === 'color' ? project.background.value : '#000000';
    delayInput.value = project.audio.delayBetweenAyahs;

    // Export settings
    resolutionSelect.value = project.exportSettings.resolution;
    videoFormatSelect.value = project.exportSettings.format;
    framerateSelect.value = project.exportSettings.framerate;

    if(mainAudioPlayer) mainAudioPlayer.src = '';
    if(timelineSlider) timelineSlider.value = 0;
    // ... clear other preview elements
    updateStaticPreviewElements(); // Update background, aspect ratio etc.
}


// --- Local Storage for Projects ---
function saveCurrentProjectToLocalStorage() {
    if (!currentProject || !currentProject.id) return;
    try {
        localStorage.setItem(currentProject.id, JSON.stringify(currentProject));
        localStorage.setItem('lastOpened', currentProject.id); // Save ref to last opened
        alert("تم حفظ المشروع بنجاح!");
        // TODO: Update projects list on initial screen if visible or next time it's shown
    } catch (e) {
        console.error("Error saving project to localStorage:", e);
        alert("خطأ في حفظ المشروع. قد تكون الذاكرة ممتلئة.");
    }
}
function loadProjectFromLocalStorage(projectId) {
    const projectString = localStorage.getItem(projectId);
    if (projectString) {
        return JSON.parse(projectString);
    }
    return null;
}
// TODO: Function to display all saved projects on initial screen


// --- CCapture.js Export Logic ---
function renderCurrentFrameToCanvas(targetCanvas, targetCtx, exportTime) {
    // Get dimensions based on export or preview
    const forExport = (targetCanvas !== canvas); // True if rendering to an offscreen canvas for export
    const [targetWidth, targetHeight] = forExport ? getExportCanvasDimensions() : getCanvasDimensionsForPreview();

    targetCanvas.width = targetWidth;
    targetCanvas.height = targetHeight;

    // 1. Draw Background (Color, Image, or Video Frame)
    if (currentProject.background.type === 'color') {
        targetCtx.fillStyle = currentProject.background.value;
        targetCtx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (currentProject.background.type === 'image' && currentProject.background.value_data_url) {
        const img = new Image();
        img.src = currentProject.background.value_data_url;
        // Ensure image is loaded before drawing (tricky in sync render loop)
        // For CCapture, it's better if the image is already loaded and cached.
        // This is a simplified draw:
        try {
            // Implement proper aspect ratio handling (cover/contain) for drawing
            const imgAspectRatio = img.width / img.height;
            const canvasAspectRatio = targetWidth / targetHeight;
            let sx=0, sy=0, sWidth=img.width, sHeight=img.height;
            if (imgAspectRatio > canvasAspectRatio) { // Image wider
                sWidth = img.height * canvasAspectRatio;
                sx = (img.width - sWidth) / 2;
            } else { // Image taller
                sHeight = img.width / canvasAspectRatio;
                sy = (img.height - sHeight) / 2;
            }
            targetCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        } catch (e) {
            console.warn("Could not draw background image (may not be loaded yet for export frame):", e);
            targetCtx.fillStyle = '#101010'; // Fallback
            targetCtx.fillRect(0, 0, targetWidth, targetHeight);
        }
    } else { // Fallback or video (video frame drawing is more complex)
        targetCtx.fillStyle = '#101010'; // Default dark background
        targetCtx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // Apply video filter if any (directly on canvas context if possible)
    if (currentProject.video.filter !== 'none' && targetCtx.filter !== undefined) { // Check if context.filter is supported
        targetCtx.filter = currentProject.video.filter;
    } else {
        targetCtx.filter = 'none'; // Reset if not applying or not supported
    }


    // 2. Draw Ayah Text and Translation
    const currentAyahData = currentProject.ayahsData[currentProject.currentAyahIndexInSegment];
    if (currentAyahData) {
        // Calculate positions and sizes based on targetCanvas dimensions
        // This needs to be responsive to targetWidth/targetHeight

        // Ayah Text
        targetCtx.fillStyle = currentProject.text.ayahBgColor; // Ayah Background
        const ayahFontSize = currentProject.text.fontSize * (forExport ? (targetHeight / 720) : (targetHeight / videoPreviewContainer.clientHeight)) ; // Scale font size
        
        targetCtx.font = `${ayahFontSize}px ${currentProject.text.fontFamily}`;
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';

        // Simple text wrapping (basic)
        const ayahLines = wrapText(targetCtx, currentAyahData.text, targetWidth * 0.85, ayahFontSize);
        const totalAyahTextHeight = ayahLines.length * ayahFontSize * 1.3; // Approx line height
        
        // Ayah background rectangle (centered)
        const ayahBgWidth = targetWidth * 0.9;
        const ayahBgHeight = totalAyahTextHeight + ayahFontSize * 0.6; // Padding
        const ayahBgX = (targetWidth - ayahBgWidth) / 2;
        const ayahBgY = (targetHeight / 2) - (ayahBgHeight / 2) - (currentAyahData.translationText ? ayahFontSize * 1.5 : 0) ; // Shift up if translation
        
        if (tinycolor(currentProject.text.ayahBgColor).getAlpha() > 0) {
             roundRect(targetCtx, ayahBgX, ayahBgY, ayahBgWidth, ayahBgHeight, 8 * (targetWidth/1000) , true, false);
        }

        targetCtx.fillStyle = currentProject.text.color; // Ayah Text Color
        ayahLines.forEach((line, index) => {
            targetCtx.fillText(line, targetWidth / 2, ayahBgY + (ayahFontSize*0.8) + (index * ayahFontSize * 1.3));
        });


        // Translation Text (if exists)
        if (currentAyahData.translationText) {
            const transFontSize = Math.max(12, ayahFontSize * 0.45);
            targetCtx.font = `${transFontSize}px ${getComputedStyle(document.body).getPropertyValue('--font-family-ui')}`;
            const transLines = wrapText(targetCtx, currentAyahData.translationText, targetWidth * 0.8, transFontSize);
            const transYStart = ayahBgY + ayahBgHeight + transFontSize * 0.5; // Below ayah text

            // Optional: translation background
            // targetCtx.fillStyle = "rgba(0,0,0,0.1)";
            // roundRect(targetCtx, ayahBgX + 20, transYStart - transFontSize*0.4, ayahBgWidth - 40, transLines.length * transFontSize * 1.3 + transFontSize*0.4, 5, true, false);
            
            targetCtx.fillStyle = tinycolor(currentProject.text.color).isDark() ? '#E0E0E0' : '#DDDDDD'; // Slightly less prominent than ayah
            transLines.forEach((line, index) => {
                targetCtx.fillText(line, targetWidth / 2, transYStart + (transFontSize * 0.5) + (index * transFontSize * 1.3));
            });
        }
    }

    // 3. Draw Surah Title (Optional, if desired in export)
    const selectedSurahData = quranMetaData.surahs.find(s => s.number === currentProject.surah);
    if (selectedSurahData) {
        const titleFontSize = Math.max(18, ayahFontSize * 0.7);
        targetCtx.font = `bold ${titleFontSize}px ${getComputedStyle(document.body).getPropertyValue('--font-family-ui')}`;
        targetCtx.fillStyle = currentProject.text.color; // Or a specific title color
        targetCtx.textAlign = 'center';
        targetCtx.fillText(`سورة ${selectedSurahData.name}`, targetWidth / 2, targetHeight * 0.15); // Adjust Y position
    }

    // Reset filter for next frame if it was applied to context
    if (targetCtx.filter !== 'none') targetCtx.filter = 'none';
}

// Helper for text wrapping
function wrapText(context, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    context.font = `${fontSize}px ${currentProject.text.fontFamily}`; // Ensure font is set for measureText

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Helper for rounded rectangle
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') { stroke = true; }
  if (typeof radius === 'undefined') { radius = 5; }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) { ctx.fill(); }
  if (stroke) { ctx.stroke(); }
}


async function startExport() { /* ... (CCapture.js setup and loop - this needs careful implementation) ... */
    showSpinner();
    exportProgressContainer.style.display = 'block';
    exportProgressBar.value = 0;
    exportProgressText.textContent = "0%";

    const format = currentProject.exportSettings.format || 'webm';
    const framerate = currentProject.exportSettings.framerate || 25;
    const [exportWidth, exportHeight] = getExportCanvasDimensions();

    // Create an offscreen canvas for rendering export frames
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const exportCtx = exportCanvas.getContext('2d');

    capturer = new CCapture({
        format: format === 'gif' ? 'gif' : 'webm', // CCapture supports webm, gif, png, jpg
        workersPath: format === 'gif' ? 'https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/src/' : undefined, // Required for GIF
        framerate: framerate,
        verbose: false,
        name: currentProject.name.replace(/\s+/g, '_') || "quran_video",
        quality: 90, // For webm/jpg
        // motionBlurFrames: format === 'webm' ? Math.floor(framerate / 10) : 0, // Optional motion blur for webm
    });

    capturer.start();

    // Determine total duration - this is complex if ayahs have different audio lengths
    // For now, assume each ayah contributes its audio duration + delay
    let totalEstimatedDuration = 0;
    for (const ayah of currentProject.ayahsData) {
        // This needs the actual audio duration for each ayah.
        // For simplicity, let's use a placeholder or average.
        // A better way: pre-load all audio durations.
        const audio = new Audio(ayah.audio);
        await new Promise(resolve => { // Wait for duration to be available
            audio.onloadedmetadata = () => {
                totalEstimatedDuration += audio.duration;
                resolve();
            };
            audio.onerror = () => {
                totalEstimatedDuration += 3; // Fallback if audio fails to load
                resolve();
            }
        });
        totalEstimatedDuration += currentProject.audio.delayBetweenAyahs;
    }
    if (currentProject.ayahsData.length === 0) {
        alert("لا توجد آيات لتصديرها!");
        hideSpinner();
        exportProgressContainer.style.display = 'none';
        return;
    }


    let elapsedExportTime = 0;
    const timeStep = 1 / framerate;
    let currentAyahExportIndex = 0;
    let timeInCurrentAyah = 0;
    let currentAyahAudioDuration = 0; // Needs to be fetched

    // Function to get current ayah's audio duration
    async function getAyahDuration(index) {
        if (index >= currentProject.ayahsData.length) return 0;
        const audioSrc = currentProject.ayahsData[index].audio;
        try {
            const audio = new Audio(audioSrc);
            return await new Promise((resolve, reject) => {
                audio.onloadedmetadata = () => resolve(audio.duration);
                audio.onerror = () => reject(new Error("Failed to load audio for duration"));
            });
        } catch (e) { return 3; /* fallback */ }
    }
    currentAyahAudioDuration = await getAyahDuration(currentAyahExportIndex);


    function animationLoop() {
        if (elapsedExportTime >= totalEstimatedDuration) {
            capturer.stop();
            capturer.save();
            hideSpinner();
            exportProgressContainer.style.display = 'none';
            alert("تم الانتهاء من التصدير!");
            return;
        }

        // Update which Ayah is "active" for rendering based on elapsedExportTime
        if (timeInCurrentAyah >= (currentAyahAudioDuration + currentProject.audio.delayBetweenAyahs)) {
            currentAyahExportIndex++;
            if (currentAyahExportIndex >= currentProject.ayahsData.length) {
                // End of ayahs, stop capture.
                elapsedExportTime = totalEstimatedDuration; // Force end
                animationLoop(); // Call to stop and save
                return;
            }
            timeInCurrentAyah = 0;
            // Asynchronously get next duration without blocking loop too much
            getAyahDuration(currentAyahExportIndex).then(d => currentAyahAudioDuration = d);
        }
        // Set the global currentAyahIndexInSegment for renderCurrentFrameToCanvas
        currentProject.currentAyahIndexInSegment = currentAyahExportIndex;


        renderCurrentFrameToCanvas(exportCanvas, exportCtx, elapsedExportTime);
        capturer.capture(exportCanvas);

        const progress = (elapsedExportTime / totalEstimatedDuration) * 100;
        exportProgressBar.value = progress;
        exportProgressText.textContent = `${Math.round(progress)}%`;

        elapsedExportTime += timeStep;
        timeInCurrentAyah += timeStep;

        requestAnimationFrame(animationLoop);
    }

    requestAnimationFrame(animationLoop);
}


// --- Initialization and App Start ---
function openControlPanel(panelId) { /* ... (same as previous) ... */ }
function closeControlPanel(panelId) { /* ... (same as previous) ... */ }
function closeAllControlPanels(exceptPanelId = null) { /* ... (same as previous) ... */ }
function openDefaultTabAndPanel() { /* ... (same as previous) ... */ }
function loadTheme() { /* ... (same as previous, ensure dark is default if no localStorage item) ... */ }

async function init() {
    loadTheme();
    populateReciterSelect();
    populateTranslationSelect();
    await fetchSurahMetadata();
    setupEventListeners();

    const lastOpenedProjectId = localStorage.getItem('lastOpened');
    let projectToLoad = null;
    if (lastOpenedProjectId) {
        projectToLoad = loadProjectFromLocalStorage(lastOpenedProjectId);
    }

    if (document.getElementById('editor-screen').classList.contains('active-screen')) {
        if (projectToLoad) loadProjectIntoEditor(projectToLoad); else initializeNewProject();
        openDefaultTabAndPanel();
    } else if (document.getElementById('initial-screen').classList.contains('active-screen')) {
        // TODO: displayProjectsList();
    }
}

document.addEventListener('DOMContentLoaded', init);
