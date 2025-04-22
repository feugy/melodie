<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { fn } from '@storybook/test'
  import Bean from 'lucide-svelte/icons/bean'
  import Play from 'lucide-svelte/icons/play'
  import Component from './button.svelte'

  const onclick = fn()

  const { Story } = defineMeta({
    title: 'Components/Button',
    component: Component,
    args: { onclick },
  })
</script>

<Story name="Default">Click Me</Story>
<Story name="Icon only" args={{ Icon: Play, size: 'lg' }} />
<Story
  name="Secondary with icon and text"
  args={{ Icon: Bean, color: 'secondary' }}>Click Me</Story
>
