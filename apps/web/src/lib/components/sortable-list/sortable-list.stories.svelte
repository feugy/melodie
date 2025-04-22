<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { fn } from '@storybook/test'
  import { tracksData } from '../tracks-table/tracks-table.testdata'
  import SortableList from './sortable-list.test.svelte'

  const { Story } = defineMeta({
    title: 'Components/SortableList',
    component: SortableList,
    args: {
      items: [...tracksData, ...tracksData],
      onmove: fn(),
      onclick: fn(),
    },
  })
</script>

<Story name="Default" />
