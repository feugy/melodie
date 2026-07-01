/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker'

const self = globalThis.self as unknown as ServiceWorkerGlobalScope

const CACHE = `cache-${version}`
const ASSETS = [...build, ...files]

self.addEventListener('install', event => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE)
		await cache.addAll(ASSETS)
	}

	event.waitUntil(addFilesToCache())
})

self.addEventListener('activate', event => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key)
		}
	}

	event.waitUntil(deleteOldCaches())
})

self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET') return

	async function respond() {
		const url = new URL(event.request.url)
		const cache = await caches.open(CACHE)

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname)
			if (response) return response
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request)

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch')
			}

			if (
				response.status === 200 &&
				!response.headers.get('cache-control')?.includes('no-store')
			) {
				cache.put(event.request, response.clone())
			}

			return response
		} catch (err) {
			const response = await cache.match(event.request)

			if (response) {
				return response
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err
		}
	}

	event.respondWith(respond())
})
