// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session } from '$lib/server/session'

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session?: Session
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// File System Access API (not yet in TypeScript's lib.dom.d.ts)
	interface Window {
		showDirectoryPicker(options?: {
			id?: string
			mode?: 'read' | 'readwrite'
			startIn?:
				| 'desktop'
				| 'documents'
				| 'downloads'
				| 'music'
				| 'pictures'
				| 'videos'
				| FileSystemHandle
		}): Promise<FileSystemDirectoryHandle>
	}

	// Permission query/request on stored handles (File System Access API)
	interface FileSystemHandle {
		queryPermission(descriptor?: {
			mode?: 'read' | 'readwrite'
		}): Promise<'granted' | 'denied' | 'prompt'>
		requestPermission(descriptor?: {
			mode?: 'read' | 'readwrite'
		}): Promise<'granted' | 'denied' | 'prompt'>
	}

	// PWA install prompt (Chrome only, not in TypeScript's lib.dom.d.ts)
	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
	}
	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent
	}
}

export {}
