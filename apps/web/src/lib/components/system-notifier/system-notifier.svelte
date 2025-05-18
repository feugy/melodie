<script module lang="ts">
  export interface SystemNotifierProps {
    agentById: Map<number, Agent>
    track?: TrackModel
    onnext: () => unknown
    onprevious: () => unknown
  }
</script>

<script lang="ts">
  import { getImage } from '$lib/client'
  import type { Track as TrackModel, Agent } from '@melodie/common/models'
  import { onMount } from 'svelte'
  import { t } from 'svelte-intl-precompile'

  let { agentById, track, onnext, onprevious }: SystemNotifierProps = $props()

  const mediaSession =
    'mediaSession' in navigator ? navigator.mediaSession : null
  let supportsNotification = $state(false)
  let cover = $derived(getImage(track, agentById))
  const unknown = $t('unknown')

  function extractData({ tags }: TrackModel) {
    return {
      title: tags.title || unknown,
      artist: tags.artists.length ? tags.artists[0] : unknown,
      album: tags.album || unknown,
    }
  }

  export function notify(track?: TrackModel) {
    if (supportsNotification && track) {
      const { title, artist, album } = extractData(track)
      // Ideally, do not sent notification when trackQueue.playNext() was called with autoplay
      const notification = new Notification(title, {
        body: `${artist} - ${album}`,
        icon: cover,
        silent: true,
      })
      setTimeout(() => {
        notification.close()
      }, 5000)
    }
  }

  onMount(() => {
    if (mediaSession) {
      mediaSession.setActionHandler('previoustrack', onprevious)
      // be sure to not setting autoplay on next
      mediaSession.setActionHandler('nexttrack', () => onnext())
    }

    Notification?.requestPermission().then((permission) => {
      supportsNotification = permission === 'granted'
    })

    return () => {
      if (mediaSession) {
        mediaSession.setActionHandler('previoustrack', null)
        mediaSession.setActionHandler('nexttrack', null)
      }
    }
  })

  $effect(() => {
    if (!track || !mediaSession) {
      return
    }
    mediaSession.metadata = new MediaMetadata({
      ...extractData(track),
      artwork: cover ? [{ src: cover }] : [],
    })
  })
</script>
