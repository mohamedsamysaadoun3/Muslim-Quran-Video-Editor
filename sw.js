// sw.js - Service Worker

const CACHE_NAME = 'muslim-quran-editor-cache-v1.2'; // قم بتغيير هذا الرقم عند تحديث أي من الملفات المخزنة مؤقتًا

// قائمة بالملفات الأساسية التي سيتم تخزينها مؤقتًا عند تثبيت الـ Service Worker
const PRECACHE_ASSETS = [
  './', // الصفحة الرئيسية (index.html)
  './index.html',
  './css/style.css',
  './manifest.json',
  // أيقونات التطبيق الرئيسية
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  // ملفات JavaScript الرئيسية (قد تحتاج لتضمين المزيد من ملفات js/ إذا لم تكن مدمجة)
  './js/app.js',
  // يمكنك إضافة المزيد من ملفات js/modules هنا إذا كانت مهمة للتحميل الأولي
  // './js/core/dom-loader.js',
  // './js/core/state-manager.js',
  // ... وهكذا لبقية الوحدات الأساسية
  // لكن كن حذرًا، لا تضف كل شيء هنا، فقط الأساسيات المطلقة للتشغيل الأولي.
  // سيتم تخزين الموارد الأخرى ديناميكيًا عند الطلب.

  // مكتبات CDN (اختياري، إذا كنت تريد تخزينها مؤقتًا للعمل دون اتصال)
  // إذا كان المستخدم متصلاً بالإنترنت، فسيتم جلبها من CDN.
  // إذا لم يكن متصلاً، سيتم استخدام النسخة المخزنة مؤقتًا (إذا تم تخزينها بنجاح).
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2', // هذا مثال لملف خط، قد تحتاج لتضمين مسارات الخطوط الفعلية
  'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Noto+Naskh+Arabic:wght@400;500;700&family=Tajawal:wght@400;500;700&display=swap',
  // جلب خطوط جوجل وتخزينها مؤقتًا يمكن أن يكون معقدًا بسبب كيفية خدمتها.
  // قد يكون من الأفضل الاعتماد على استراتيجية networkFirst أو staleWhileRevalidate لخطوط جوجل.

  'https://cdnjs.cloudflare.com/ajax/libs/tinycolor/1.6.0/tinycolor.min.js',
  'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js',
  'https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/build/CCapture.all.min.js'
];

// حدث التثبيت: يتم استدعاؤه عند تثبيت الـ Service Worker لأول مرة
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching app shell');
        // استخدام addAll قد يفشل إذا فشل أي طلب واحد.
        // يمكن استخدام cache.add بشكل فردي مع معالجة الأخطاء لكل ملف.
        return Promise.all(
          PRECACHE_ASSETS.map(assetUrl => {
            return cache.add(assetUrl).catch(err => {
              console.warn(`[Service Worker] Failed to cache ${assetUrl}:`, err);
              // لا تجعل التثبيت يفشل بسبب ملف واحد غير مهم (مثل خط CDN)
              // لكن إذا كان ملفًا أساسيًا، قد ترغب في أن يفشل التثبيت.
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Precache complete, activating service worker.');
        return self.skipWaiting(); // تفعيل الـ Service Worker الجديد فورًا
      })
      .catch(error => {
        console.error('[Service Worker] Precache failed:', error);
      })
  );
});

// حدث التفعيل: يتم استدعاؤه عند تفعيل الـ Service Worker (بعد التثبيت أو عند تحديث نسخة قديمة)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated successfully and old caches cleaned.');
      return self.clients.claim(); // التحكم في الصفحات المفتوحة فورًا
    })
  );
});

// حدث الجلب: يتم استدعاؤه عند كل طلب شبكة من التطبيق (صور، نصوص، API، إلخ)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل الطلبات غير GET (مثل POST) لأنها لا يمكن تخزينها مؤقتًا بنفس الطريقة
  if (request.method !== 'GET') {
    return;
  }

  // استراتيجية التخزين المؤقت:
  // 1. للموارد الأساسية (PRECACHE_ASSETS): حاول من الكاش أولاً، ثم الشبكة (Cache First)
  // 2. لطلبات API (مثل api.alquran.cloud, api.pexels.com): حاول من الشبكة أولاً، ثم الكاش (Network First or Stale-While-Revalidate)
  // 3. للموارد الأخرى (صور، إلخ): حاول من الكاش، ثم الشبكة، وقم بتحديث الكاش (Cache, then Network, then Update Cache)

  // مثال: Cache First للموارد الأساسية التي تم تخزينها مسبقًا
  if (PRECACHE_ASSETS.includes(url.pathname) || PRECACHE_ASSETS.includes(url.href)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // console.log('[Service Worker] Serving from cache:', request.url);
          return cachedResponse;
        }
        // console.log('[Service Worker] Not in precache, fetching from network:', request.url);
        return fetch(request).then((networkResponse) => {
          // لا تقم بتخزين استجابات الأخطاء من الشبكة هنا إذا لم تكن جزءًا من التخزين المسبق
          return networkResponse;
        });
      })
    );
    return;
  }

  // مثال: Network First لطلبات API (مثل Alquran Cloud أو Pexels)
  if (url.hostname === 'api.alquran.cloud' || url.hostname === 'api.pexels.com') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // إذا نجح الطلب من الشبكة، قم بتخزين الاستجابة في الكاش للاستخدام المستقبلي (اختياري)
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // إذا فشل الطلب من الشبكة (مثل عدم وجود اتصال)، حاول الحصول عليه من الكاش
          // console.log('[Service Worker] API request failed, trying cache for:', request.url);
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || Response.error(); // أرجع خطأ إذا لم يكن في الكاش
          });
        })
    );
    return;
  }

  // استراتيجية Stale-While-Revalidate للموارد الأخرى (مثل صور الخلفيات من Pexels، خطوط جوجل)
  // هذا يعني: قدم من الكاش فورًا إذا كان متاحًا، ثم قم بتحديث الكاش في الخلفية من الشبكة.
  if (url.hostname.includes('pexels.com') || url.hostname.includes('gstatic.com') /* لخطوط جوجل */) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            // console.warn('[Service Worker] Network fetch failed for stale-while-revalidate:', request.url, err);
            // لا تفعل شيئًا إذا فشل الجلب من الشبكة، فالنسخة القديمة من الكاش (إذا وجدت) قد تم تقديمها بالفعل.
            // إذا لم يكن هناك cachedResponse، فسيعود undefined ويؤدي إلى خطأ في الشبكة.
          });

          // أرجع من الكاش إذا وجد، وإلا انتظر نتيجة الجلب من الشبكة
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }


  // استراتيجية Cache First للموارد الثابتة الأخرى التي قد لا تكون في PRECACHE_ASSETS
  // أو إذا كنت تريد أن تكون أكثر تحديدًا
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // إذا لم يكن في الكاش، اذهب إلى الشبكة وقم بتخزينه
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          // تأكد من أننا نخزن فقط استجابات GET الناجحة
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(error => {
        console.warn('[Service Worker] General fetch failed, no cache match:', request.url, error);
        // يمكنك هنا إرجاع صفحة خطأ مخصصة للعمل دون اتصال إذا أردت
        // return caches.match('/offline.html'); // مثال
        return Response.error(); // أرجع خطأ شبكة قياسي
      });
    })
  );
});

// يمكنك إضافة مستمعين لأحداث أخرى مثل 'push' (للإشعارات الفورية) أو 'sync' (للمزامنة في الخلفية)
