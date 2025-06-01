<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import Component from './slider.svelte'

  const { Story } = defineMeta({
    title: 'Components/Slider',
    component: Component,
  })
</script>

<Story name="Default" />

<Story name="Initial value" args={{ value: 30 }} />
