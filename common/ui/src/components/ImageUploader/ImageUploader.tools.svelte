<script>
  import { Tool } from '@atelier-wb/svelte'

  import ImageUploader from './ImageUploader.svelte'
</script>

<Tool
  name="Components/Image Uploader"
  component={ImageUploader}
  props={{ value: null, class: 'h-64 w-64 inline-block' }}
  events={['select']}
/>
