// service-worker.js

const CACHE_NAME = 'running-app-cache-v1.0.3'; // Incrémente ce numéro à chaque modification majeure
const urlsToCache = [
  '/running/', // La racine de ton application GitHub Pages
  '/running/index.html',
  // Ajoute ici d'autres ressources si tu en as (CSS, JS, images, etc.)
  // Par exemple: '/running/styles.css', '/running/script.js',
  // 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  // 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js',
  // 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des ressources :');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Erreur lors de la mise en cache :', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Retourne la ressource du cache si elle existe
        }
        return fetch(event.request); // Sinon, va chercher la ressource sur le réseau
      })
      .catch(error => {
        console.error('[Service Worker] Erreur de récupération :', error);
        // Tu peux ici retourner une page hors ligne si la ressource n'est pas dans le cache et le réseau est indisponible
        // Exemple: return caches.match('/running/offline.html');
      })
  );
});

