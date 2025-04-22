import type { Track } from '@melodie/common/models'
import localforage from 'localforage'
import { getTracksByIds } from './requests'

export const contentStorageKey = 'tracks-queue'
export const currentStorageKey = 'current-track'

class TrackQueue {
	content = $state<Track[]>([])
	index = $state<number | null>(null)
	current = $derived.by(() => {
		return this.index !== null ? this.content[this.index] : undefined
	})
	length = $derived(this.content.length)
	isLast = $derived.by(
		() => this.index === null || this.index === this.content.length - 1
	)

	autoNextListerners: Array<() => unknown> = []

	async init(checkServer = true) {
		localforage.config({ driver: localforage.INDEXEDDB, name: 'melodie' })
		this.content = (await localforage.getItem<Track[]>(contentStorageKey)) ?? []
		this.index = await localforage.getItem<number>(currentStorageKey)
		if (!Array.isArray(this.content)) {
			this.content = []
		}
		const ids = this.content
			.map(track => (typeof track === 'object' ? track?.id : false))
			.filter(n => Number.isSafeInteger(n)) as number[]
		if (checkServer && ids.length > 0) {
			this.content = await getTracksByIds(ids)
			await this.save({ withIndex: false })
		}
		if (!this.content.length) {
			this.index = null
			await this.save({ withContent: false })
		} else {
			if (
				!Number.isSafeInteger(this.index) ||
				// @ts-expect-error: TS doesn't know isSafeInteger will evict null
				this.index >= this.content.length ||
				// @ts-expect-error: TS doesn't know isSafeInteger will evict null
				this.index < 0
			) {
				this.index = 0
				await this.save({ withContent: false })
			}
		}
	}

	private async save({
		withIndex = true,
		withContent = true
	}: { withIndex?: boolean; withContent?: boolean } = {}) {
		if (withContent) {
			await localforage.setItem(
				contentStorageKey,
				$state.snapshot(this.content)
			)
		}
		if (withIndex) {
			await localforage.setItem(currentStorageKey, $state.snapshot(this.index))
		}
	}

	async clear() {
		await this.add([], { play: false, replace: true })
	}

	async add(tracks: Track[], { play = true, replace = false } = {}) {
		if (replace) {
			this.content = []
			this.index = null
		}
		if (play || (this.index === null && tracks.length)) {
			this.index = this.content.length
		}
		this.content.push(...tracks)
		await this.save()
	}

	async playNext(auto = false) {
		if (this.index === this.content.length - 1) {
			this.index = 0
		} else if (this.index !== null) {
			this.index++
		}
		if (auto) {
			for (const listener of this.autoNextListerners) {
				listener?.()
			}
		}
		await this.save({ withContent: false })
	}

	async playPrevious() {
		if (this.index === 0) {
			this.index = this.content.length - 1
		} else if (this.index !== null) {
			this.index--
		}
		await this.save({ withContent: false })
	}

	async jumpTo(index: number) {
		if (index < 0 || index >= this.content.length) return
		this.index = index
		await this.save({ withContent: false })
	}

	async move({ from, to }: { from: number; to: number }) {
		if (
			from < 0 ||
			from >= this.content.length ||
			to < 0 ||
			to >= this.content.length ||
			from === to
		) {
			return
		}
		this.content.splice(to, 0, this.content.splice(from, 1)[0])
		if (this.index !== null) {
			if (this.index === from) {
				this.index = to
			} else if (to < this.index && from > this.index) {
				this.index++
			} else if (to > this.index && from < this.index) {
				this.index--
			}
		}
		await this.save()
	}

	async removeAt(index: number) {
		if (index < 0 || index >= this.content.length) {
			return
		}
		this.content.splice(index, 1)
		if (this.index !== null && index < this.index) {
			this.index--
		}
		await this.save()
	}

	registerAutoNextListener(listener: () => unknown) {
		this.autoNextListerners.push(listener)
		return () => {
			this.autoNextListerners = this.autoNextListerners.filter(
				l => l !== listener
			)
		}
	}
}

export const trackQueue = new TrackQueue()
