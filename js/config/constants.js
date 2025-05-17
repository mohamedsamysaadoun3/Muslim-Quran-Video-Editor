// js/config/constants.js

// Storage Keys
export const PEXELS_API_KEY_STORAGE_KEY = 'mqe_pexelsApiKey_v1'; // Namespaced
export const LOCAL_STORAGE_PROJECTS_KEY = 'mqe_videoProjects_v1';
export const LOCAL_STORAGE_THEME_KEY = 'mqe_theme_v1';
export const LOCAL_STORAGE_LAST_PEXELS_QUERY_KEY = 'mqe_lastPexelsQuery_v1';

// Project Defaults
export const DEFAULT_PROJECT_ID_PREFIX = 'mqe_proj_';
export const MAX_HISTORY_STATES = 30; // For Undo/Redo

// API Endpoints
export const ALQURAN_CLOUD_API_BASE = 'https://api.alquran.cloud/v1';
export const PEXELS_API_BASE = 'https://api.pexels.com/v1';

// Default UI and Project Settings
export const DEFAULT_ASPECT_RATIO = '16:9';
export const DEFAULT_VIDEO_FILTER = 'none';
export const DEFAULT_RESOLUTION = '1920x1080';
export const DEFAULT_FONT_FAMILY_QURAN = "'Amiri Quran', 'Noto Naskh Arabic', serif";
export const DEFAULT_FONT_FAMILY_UI = "'Tajawal', sans-serif";
export const DEFAULT_FONT_SIZE = 48; // px, for Quran text on canvas
export const DEFAULT_FONT_COLOR = '#FFFFFF';
export const DEFAULT_AYAH_BG_COLOR = 'rgba(0,0,0,0.35)';
export const DEFAULT_TEXT_EFFECT = 'none';
export const DEFAULT_BACKGROUND_COLOR = '#1a2a3a'; // Darker, desaturated blue
export const DEFAULT_DELAY_BETWEEN_AYAHS = 1.0; // seconds
export const DEFAULT_VIDEO_TRANSITION_EFFECT = 'fade'; // For export, not yet fully implemented for preview
export const DEFAULT_VIDEO_FORMAT = 'webm';
export const DEFAULT_FRAMERATE = 25;


// Curated Lists (can be expanded)
export const CURATED_RECITERS = [
    { identifier: "ar.alafasy", name: "مشاري راشد العفاسي" },
    { identifier: "ar.abdulsamad", name: "عبد الباسط عبد الصمد (مرتل)" },
    { identifier: "ar.minshawi", name: "محمد صديق المنشاوي (مرتل)" },
    { identifier: "ar.mahermuaiqly", name: "ماهر المعيقلي" },
    { identifier: "ar.sahl_yassin", name: "سهل ياسين" },
    { identifier: "ar.sudais", name: "عبدالرحمن السديس" },
    { identifier: "ar.shaatree", name: "أبو بكر الشاطري" },
    { identifier: "ar.hudhaify", name: "علي الحذيفي" },
    { identifier: "ar.husary", name: "محمود خليل الحصري (مرتل)" },
    { identifier: "ar.parhizgar", name: "شهریار پرهیزگار (ترتیل)" }, // Example non-Arabic reciter name
];

export const CURATED_TRANSLATIONS = [
    { identifier: "en.sahih", name: "Sahih International (English)" },
    { identifier: "fr.hamidullah", name: "Muhammad Hamidullah (Français)" },
    { identifier: "es.cortes", name: "Julio Cortes (Español)" },
    { identifier: "de.aburida", name: "Abu Rida (Deutsch)" },
    { identifier: "id.indonesian", name: "Bahasa Indonesia (Kemenag RI)"},
    { identifier: "tr.diyanet", name: "Diyanet İşleri (Türkçe)"},
    { identifier: "ru.kuliev", name: "Эльмир Кулиев (Русский)"},
    { identifier: "ur.jalandhry", name: " جالندہری (اردو)"},
    { identifier: "ms.basmeih", name: "Basmeih (Bahasa Melayu)"},
    { identifier: "bn.bengali", name: "মুহিউদ্দীন খান (বাংলা)"},
    // Add more or fetch dynamically in the future
];

// Speech Recognition
export const SPEECH_RECOGNITION_LANG = 'ar-SA';

// Canvas Rendering Factors & Defaults (Relative to font size or canvas dimensions)
export const CANVAS_TEXT_ALIGN = 'center';
export const CANVAS_TEXT_BASELINE = 'middle';
export const CANVAS_AYAH_MAX_WIDTH_FACTOR = 0.90; // 90% of canvas width
export const CANVAS_TRANSLATION_MAX_WIDTH_FACTOR = 0.85;
export const CANVAS_SURAH_TITLE_Y_FACTOR = 0.15; // 15% from top for Surah title
export const CANVAS_AYAH_Y_FACTOR = 0.48; // Ayah block centered around 48% from top
export const CANVAS_TRANSLATION_Y_FACTOR = 0.75; // Translation block centered around 75%
export const CANVAS_LINE_HEIGHT_FACTOR = 1.3; // General line height factor for multiline text
export const CANVAS_TRANSLATION_FONT_SIZE_FACTOR = 0.55; // Translation font size relative to Ayah font size
export const CANVAS_SURAH_TITLE_FONT_SIZE_FACTOR = 0.7; // Surah title font size relative to Ayah font size
export const CANVAS_AYAH_BG_PADDING_FACTOR = 0.25; // Padding around Ayah text for its background

// Timeline
export const TIMELINE_DEFAULT_MAX_DURATION = 100; // seconds, if no audio is loaded
export const TIMELINE_SCRUB_STEP = 0.1; // seconds

// Pexels API
export const PEXELS_IMAGES_PER_PAGE = 12;
export const PEXELS_VIDEOS_PER_PAGE = 6; // Videos are heavier
export const PEXELS_DEFAULT_QUERY_SUFFIX_LANDSCAPE = " nature landscape abstract";
export const PEXELS_DEFAULT_QUERY_SUFFIX_PORTRAIT = " nature portrait pattern abstract";
