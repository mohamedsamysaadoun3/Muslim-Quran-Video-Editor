// js/config/api-keys.js
// IMPORTANT: For local development ONLY. Never commit real API keys to a public repository.
// In a production environment, API keys should be handled via backend proxies or build-time environment variables.

// To use Pexels API for background suggestions:
// 1. Get your API key from https://www.pexels.com/api/
// 2. Paste it here if you are developing locally and will not commit this change.
//    Otherwise, the application will prompt the user or use a key from localStorage.
export const PEXELS_API_KEY_DEV = 'u4eXg16pNHbWDuD16SBiks0vKbV21xHDziyLCHkRyN9z08ruazKntJj7'; // <-- PASTE YOUR PEXELS API KEY HERE FOR LOCAL DEV

// The application (e.g., pexels-api-service.js) will prioritize a key from localStorage,
// then this development key (if provided), and finally may prompt the user if no key is found.
