<script>
  import { afterUpdate } from 'svelte'
  import { _ } from 'svelte-intl'
  import Dialogue from '../Dialogue/Dialogue.svelte'
  import Button from '../Button/Button.svelte'
  import Image from '../Image/Image.svelte'
  import ImageUploader from '../ImageUploader/ImageUploader.svelte'
  import { invoke } from '../../utils'

  export let open
  export let title
  export let src
  let uploaded = null
  let proposals = []

  async function handleOpen() {
    uploaded = null
    proposals = await invoke('mediaManager.findForArtist', src.name)
  }

  async function handleSelect(url) {
    await invoke('mediaManager.saveForArtist', src.id, url)
    open = false
  }
</script>

<style type="postcss">
  .image-container {
    @apply flex flex-wrap justify-around my-4;
  }
</style>

<Dialogue {title} bind:open on:open={handleOpen}>
  <div slot="content">
    <div class="image-container">
      {#each proposals as { full, preview }}
        <Image
          src={preview}
          class="w-32 h-32 m-2 cursor-pointer"
          on:click={() => handleSelect(full)} />
      {/each}
      <ImageUploader
        class="w-32 h-32 m-2"
        bind:value={uploaded}
        on:select={() => handleSelect(uploaded)} />
    </div>
  </div>
  <span slot="buttons">
    <Button
      on:click={() => (open = false)}
      text={$_('cancel')}
      icon={'close'} />
  </span>
</Dialogue>
