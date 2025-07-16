// Nom du cache pour cette version de l'application
const CACHE_NAME = 'running-app-cache-v1';

// Liste des fichiers à mettre en cache lors de l'installation du Service Worker
const urlsToCache = [
  '/', // La page d'accueil
  '/index.html', // Ton fichier HTML principal
  // Ajoute ici toutes les ressources statiques dont ton application a besoin pour fonctionner hors ligne
  // Par exemple, si tu as d'autres fichiers CSS ou JS locaux :
  // '/styles.css',
  // '/script.js',
  // '/images/logo.png',
  // Les liens CDN de Leaflet sont chargés dynamiquement, donc pas besoin de les cacher ici
  // Ils seront mis en cache par la stratégie de cache au runtime
];

// Événement 'install' : se déclenche lorsque le Service Worker est installé
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache ouvert');
        return cache.addAll(urlsToCache); // Ajoute tous les fichiers à la liste dans le cache
      })
      .then(() => {
        console.log('Service Worker: Tous les fichiers mis en cache');
        self.skipWaiting(); // Force l'activation du nouveau Service Worker immédiatement
      })
      .catch((error) => {
        console.error('Service Worker: Échec de la mise en cache des fichiers', error);
      })
  );
});

// Événement 'activate' : se déclenche lorsque le Service Worker est activé
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprime les anciens caches qui ne correspondent pas au nom actuel
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Ancien cache nettoyé. Prêt à gérer les requêtes.');
      self.clients.claim(); // Prend le contrôle des clients non contrôlés
    })
  );
});

// Événement 'fetch' : se déclenche pour chaque requête réseau faite par la page
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes non-HTTP/HTTPS (comme les data: URLs pour les favicons)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request) // Tente de trouver la requête dans le cache
      .then((response) => {
        // Si la ressource est dans le cache, la renvoyer
        if (response) {
          console.log('Service Worker: Réponse depuis le cache pour:', event.request.url);
          return response;
        }

        // Sinon, récupérer la ressource depuis le réseau
        console.log('Service Worker: Récupération depuis le réseau pour:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Vérifie si la réponse est valide avant de la mettre en cache
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone la réponse car elle est un stream et ne peut être consommée qu'une fois
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache); // Met la nouvelle ressource en cache
                console.log('Service Worker: Mise en cache de la nouvelle ressource:', event.request.url);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Échec de la récupération réseau pour:', event.request.url, error);
            // Ici, tu peux renvoyer une page hors ligne si la ressource n'est pas dans le cache
            // et que le réseau est indisponible.
            // Exemple: return caches.match('/offline.html');
          });
      })
  );
});
