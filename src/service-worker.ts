/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const APP_CACHE = `cache-${version}`;
const COMIC_CACHE = `comics`;
const COMIC_IMAGE_CACHE = `comic-images`;
const ASSETS = [...build, ...files];

sw.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(APP_CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
	sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (![APP_CACHE, COMIC_CACHE, COMIC_IMAGE_CACHE].includes(key)) {
				await caches.delete(key);
			}
		}
	}

	event.waitUntil(deleteOldCaches());
	// Take control of all clients (open tabs) immediately after activation
	sw.clients.claim();
});

sw.addEventListener('fetch', async (event) => {
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);

		// Image Cache
		const comicImageCache = await caches.open(COMIC_IMAGE_CACHE);
		const imageCacheResponse = await comicImageCache.match(event.request);
		if (imageCacheResponse) {
			return imageCacheResponse;
		}

		// Other Caches
		const cache = await caches.open(APP_CACHE);
		const comicCache = await caches.open(COMIC_CACHE);

		const cachedResponse =
			(await cache.match(event.request)) || (await comicCache.match(event.request));

		const fetchPromise = fetch(event.request)
			.then(async (response) => {
				const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
				const isSuccess = response.status === 200 || response.status === 0;

				if (!(response instanceof Response)) {
					throw new Error('invalid response from fetch');
				}

				if (isHttp && isSuccess) {
					if (url.pathname.startsWith('/api/images')) {
						comicImageCache.put(event.request, response.clone());
					} else if (url.pathname.startsWith('/api')) {
						comicCache.put(event.request, response.clone());
					} else {
						cache.put(event.request, response.clone());
					}
				}

				return response;
			})
			.catch(() => cachedResponse);

		return (
			cachedResponse ||
			fetchPromise.then((response) => {
				if (!response) {
					throw new Error('No response received');
				}
				return response;
			})
		);
	}

	event.respondWith(respond());
});

sw.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		sw.skipWaiting();
	}
});
