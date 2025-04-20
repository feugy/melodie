import { base } from '$app/paths'
import type { Track } from '@melodie/common/models'
import localforage from 'localforage'
import type { POSTGetTracksResponse } from '../../routes/api/get-tracks/+server'

const contentStorageKey = 'tracks-queue'
const currentStorageKey = 'current-track'

class TrackQueue {
	content = $state<Track[]>([])
	current = $state<Track | undefined>()
	index = $derived(this.current ? this.content.indexOf(this.current) : null)

	async init() {
		await this.load(true)
	}

	private async load(checkServer = false) {
		localforage.config({ driver: localforage.INDEXEDDB, name: 'melodie' })
		this.content = (await localforage.getItem<Track[]>(contentStorageKey)) ?? []
		const index = await localforage.getItem<number>(currentStorageKey)
		this.current =
			this.content[
				index !== null && index >= 0 && index < this.content.length ? index : 0
			]
		if (checkServer) {
			const response = await fetch(`${base}/api/get-tracks`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ ids: this.content.map(({ id }) => id) })
			})
			const { data, total } = (await response.json()) as POSTGetTracksResponse
			this.content = data
			if (total === this.content.length && index !== null) {
				this.current = this.content[index]
			} else {
				// reset current track if server data is different (missing files)
				this.current = undefined
			}
		}
	}

	private async save({
		current = true,
		content = true
	}: { current?: boolean; content?: boolean } = {}) {
		if (content) {
			await localforage.setItem(
				contentStorageKey,
				$state.snapshot(this.content)
			)
		}
		if (current) {
			await localforage.setItem(currentStorageKey, $state.snapshot(this.index))
		}
	}

	async clear() {
		this.content = []
		this.current = undefined
		await this.save()
	}

	async add(track: Track, play = true) {
		this.content.push(track)
		if (play) {
			this.current = track
		}
		await this.save()
	}

	async playNext(autoplay = false) {
		if (this.index === this.content.length - 1) {
			if (autoplay) {
				this.current = undefined
			} else {
				this.current = this.content[0]
			}
		} else if (this.index !== null) {
			this.current = this.content[this.index + 1]
		}
		await this.save({ current: true })
	}

	async playPrevious() {
		if (this.index === 0) {
			this.current = this.content[this.content.length - 1]
		} else if (this.index !== null) {
			this.current = this.content[this.index - 1]
		}
		await this.save({ current: true })
	}

	async jumpTo(index: number) {
		if (index < 0 || index >= this.content.length) return
		this.current = this.content[index]
		await this.save({ current: true })
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
		await this.save()
	}

	async removeAt(index: number) {
		if (index < 0 || index >= this.content.length) {
			return
		}
		this.content.splice(index, 1)
		await this.save()
	}
}

export const trackQueue = new TrackQueue()
