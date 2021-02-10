<script>
  import { createEventDispatcher } from 'svelte'
  import Image from '../Image/Image.svelte'

  export let value
  const dispatch = createEventDispatcher()

  function handleClick(evt) {
    if (value) {
      evt.stopPropagation()
      evt.preventDefault()
      dispatch('select', value)
    }
  }

  function handleDragOver({ dataTransfer }) {
    dataTransfer.dropEffect = 'copy'
  }

  async function handleDrop({ dataTransfer }) {
    if (dataTransfer.items.length) {
      const item = dataTransfer.items[0]

      if (item.kind === 'string') {
        value = await new Promise(resolve => item.getAsString(resolve))
      } else {
        // the path attribute is an Electron's addition: https://github.com/electron/electron/blob/master/docs/api/file-object.md
        value = item.getAsFile().path
      }
    }
  }

  function handlePaste({ clipboardData }) {
    value = clipboardData.getData('text')
  }

  function handleSelectFile({ target: { files } }) {
    if (files.length) {
      // the path attribute is an Electron's addition: https://github.com/electron/electron/blob/master/docs/api/file-object.md
      value = files[0].path
    }
  }
</script>

<style type="postcss">
  span {
    @apply relative;
  }

  input[type='file'] {
    @apply absolute inset-0 w-full border-none opacity-0;
  }
</style>

<svelte:window on:paste={handlePaste} />

<span
  class="{$$restProps.class} actionable"
  on:dragover|preventDefault|stopPropagation={handleDragOver}
  on:drop|preventDefault|stopPropagation={handleDrop}
  on:click|capture={handleClick}
>
  <Image src={value} class="w-full h-full" fallback={'add_box'} withNonce />
  <input type="file" on:change={handleSelectFile} />
</span>
