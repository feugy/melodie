<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Track, { type TrackProps } from './track.svelte'
  import { trackData as src } from './track.testdata'

  const { Story } = defineMeta({
    title: 'Components/Track',
    component: Track,
    tags: ['autodocs'],
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

{#snippet children(args: TrackProps)}
  <div class="flex-row">
    <Track {...args} />
  </div>
{/snippet}

<Story name="Default" {children} />

<Story name="With details" args={{ details: true }} {children} />
