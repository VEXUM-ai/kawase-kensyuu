const CACHE_NAME = 'attendance-app-v1.0.1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// インストール時のキャッシュ
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('キャッシュを開きました');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// アクティベート時の古いキャッシュ削除
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// フェッチ時の処理（Network First戦略）
self.addEventListener('fetch', event => {
    // GAS APIへのリクエストは常にネットワークから取得
    if (event.request.url.includes('script.google.com')) {
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    console.error('ネットワークエラー:', error);
                    return new Response(
                        JSON.stringify({
                            success: false,
                            message: 'ネットワークエラー。接続を確認してください。'
                        }),
                        {
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }

    // その他のリソースはキャッシュ優先
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
