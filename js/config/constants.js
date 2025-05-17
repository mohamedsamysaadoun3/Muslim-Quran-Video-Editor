// js/config/constants.js

// API Endpoints
export const QURAN_API_BASE_URL = 'https://api.alquran.cloud/v1';
export const PEXELS_API_BASE_URL = 'https://api.pexels.com/v1';

// Local Storage Keys
export const LOCAL_STORAGE_PROJECTS_KEY = 'muslimQuranEditorProjects';
export const LOCAL_STORAGE_THEME_KEY = 'muslimQuranEditorTheme';
export const LOCAL_STORAGE_QURAN_DATA_KEY = 'muslimQuranEditorQuranDataCache'; // For caching surahs, reciters etc.
export const LOCAL_STORAGE_LAST_PROJECT_ID_KEY = 'muslimQuranEditorLastProjectId';


// Default Project Settings
export const DEFAULT_PROJECT_NAME = 'مشروع جديد';
export const DEFAULT_FONT_FAMILY = "'Amiri Quran', serif";
export const DEFAULT_FONT_SIZE = 48; // px
export const DEFAULT_FONT_COLOR = '#FFFFFF';
export const DEFAULT_AYAH_BG_COLOR = 'rgba(0,0,0,0.3)';
export const DEFAULT_BACKGROUND_COLOR = '#2c3e50';
export const DEFAULT_ASPECT_RATIO = '16:9';
export const DEFAULT_VIDEO_FILTER = 'none';
export const DEFAULT_TEXT_EFFECT = 'none';
export const DEFAULT_DELAY_BETWEEN_AYAHS = 1.0; // seconds
export const DEFAULT_RECITER_ID = 'ar.alafasy'; // Default reciter identifier
export const DEFAULT_TRANSLATION_ID = ''; // No translation by default

// UI Constants
export const MAX_UNDO_HISTORY = 20;
export const AI_BACKGROUND_SUGGESTIONS_COUNT = 6;

// Export Settings
export const DEFAULT_EXPORT_RESOLUTION = '1920x1080';
export const DEFAULT_EXPORT_FORMAT = 'webm';
export const DEFAULT_EXPORT_FRAMERATE = 25;

// Cache Durations (in milliseconds)
export const QURAN_DATA_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Other constants
export const APP_VERSION = '1.0.0';
