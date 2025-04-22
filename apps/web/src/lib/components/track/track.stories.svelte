<script module lang="ts">
  import type { Agent } from '@melodie/common/models'
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Track, { type TrackProps } from './track.svelte'
  import { trackData as src } from './track.testdata'

  const agentById = new Map<number, Agent>()

  const { Story } = defineMeta({
    title: 'Components/Track',
    component: Track,
    args: { src, details: false },
    parameters: {
      sveltekit_experimental: {
        hrefs: {
          '.+': {
            asRegex: true,
            callback(to: string) {
              console.log(`navigating to ${to}`)
            },
          },
        },
      },
    },
  })
</script>

<Story name="Default">
  {#snippet template(args: Omit<TrackProps, 'agentById'>)}
    <div class="flex-row">
      <Track {...args} {agentById} />
    </div>
  {/snippet}
</Story>

<Story name="With details" args={{ details: true }}>
  {#snippet template(args: Omit<TrackProps, 'agentById'>)}
    <div class="flex-row">
      <Track {...args} {agentById} />
    </div>
  {/snippet}
</Story>
