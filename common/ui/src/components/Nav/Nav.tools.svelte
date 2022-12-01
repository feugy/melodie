<script>
  import { Tool } from '@atelier-wb/svelte'
  import Nav from './Nav.svelte'
  import Heading from '../Heading/Heading.svelte'
  import { texts } from '../../tests/lorem'
  import { isDesktop, init } from '../../stores/settings'
  import { mockWebsocket, disconnectWebsocket } from '../../atelier/utils'

  const settings = {
    providers: { audiodb: {}, discogs: {} },
    enqueueBehaviour: {},
    isBroadcasting: false
  }

  const url = `http://192.168.0.10:${Math.floor(Math.random() * 10000)}`

  let wasConnected = true

  async function connectWebsocket() {
    window.fetch = async () => ({ ok: true, text: async () => 'token' })
    await mockWebsocket(
      invoked => {
        if (invoked === 'settings.toggleBroadcast') {
          settings.isBroadcasting = !settings.isBroadcasting
          return settings
        } else if (invoked === 'settings.getUIAddress') {
          return url
        } else {
          return settings
        }
      },
      settings,
      false
    )()
    init(url, 'totp-key')
  }

  function updateConnection(connected) {
    if (connected !== wasConnected) {
      wasConnected = connected
      if (connected) {
        connectWebsocket()
      } else {
        disconnectWebsocket()
      }
    }
    return ''
  }
</script>

<Tool
  name="Components/Nav"
  props={{ desktop: true, connected: true }}
  setup={connectWebsocket}
  let:props
>
  {isDesktop.next(props.desktop) || ''}
  {updateConnection(props.connected)}
  <Nav />
  <Heading
    title="70 albums"
    image="./images/valentino-funghi-MEcxLZ8ENV8-unsplash.jpg"
  />
  <main class="text-left m-4 z-0 relative">
    {#each texts as text}
      <p class="py-2">{text}</p>
    {/each}
  </main>
</Tool>
