<script>
  import { afterUpdate } from 'svelte'
  import { _ } from 'svelte-intl'
  import Dialogue from '../Dialogue/Dialogue.svelte'
  import Button from '../Button/Button.svelte'
  import Image, { broken } from '../Image/Image.svelte'
  import ImageUploader from '../ImageUploader/ImageUploader.svelte'
  import Progress from '../Progress/Progress.svelte'
  import { invoke } from '../../utils'
  import { isDesktop } from '../../stores/settings'

  export let open
  export let src
  export let forArtist = true
  let modelName = 'Album'
  let title = $_('choose cover')
  let attribute = 'cover'
  $: if (forArtist) {
    modelName = 'Artist'
    title = $_('choose avatar')
    attribute = 'artwork'
  }
  let uploaded = null
  let proposals = []
  let findPromise
  let wasOpen

  async function handleSelect(imageSrc) {
    // clear broken images so Image could try reloading the same url
    broken.clear()
    await invoke(`media.saveFor${modelName}`, src.id, extractUrl(imageSrc))
    open = false
  }

  afterUpdate(async () => {
    if (!wasOpen && open) {
      uploaded = null
      findPromise = invoke(`media.findFor${modelName}`, src.name)
      proposals = (await findPromise) || []
    } else if (wasOpen && !open) {
      proposals = []
    }
    wasOpen = open
  })

  function extractUrl(imageSrc) {
    return imageSrc.startsWith('/media')
      ? new URLSearchParams(imageSrc.replace('/media', '')).get('path')
      : imageSrc
  }
</script>

<style lang="postcss">
  .image-container {
    @apply flex flex-wrap justify-start my-4;

    & span {
      @apply text-xs;
    }
  }
</style>

<Dialogue {title} bind:open on:open on:close>
  <div slot="content">
    {#await findPromise}
      <Progress />
    {/await}
    <div class="image-container">
      {#each proposals as image}
        {#if attribute in image}
          <div class="m-2">
            <Image
              src={image[attribute]}
              withNonce
              class="w-48 h-48 actionable"
              on:click={() => handleSelect(image[attribute])}
              bind:dimension={image.dimension}
            />
            <span>
              {image.dimension
                ? $_('provider (_ x _)', {
                    value: image.provider,
                    ...image.dimension
                  })
                : image.provider}
            </span>
          </div>
        {/if}
      {/each}
      {#if $isDesktop}
        <ImageUploader
          class="w-48 h-48 m-2"
          bind:value={uploaded}
          on:select={() => handleSelect(uploaded)}
        />
      {/if}
    </div>
  </div>
  <span slot="buttons">
    <Button
      on:click={() => (open = false)}
      text={$_('cancel')}
      icon={'close'}
    />
  </span>
</Dialogue>
