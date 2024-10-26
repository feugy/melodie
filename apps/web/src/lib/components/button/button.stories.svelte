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
    tags: ['autodocs'],
    args: { onclick },
  })
</script>

{#snippet children()}Click Me{/snippet}

<Story name="Default" args={{ children }} />
<Story name="Icon only" args={{ Icon: Play, size: 'lg' }} />
<Story name="Icon and text" args={{ Icon: Bean, children, color: 'success' }} />
