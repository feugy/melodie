<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import { mockWebsocket } from '../../atelier/utils'
  import Image from './ImageToolWrapper.svelte'
</script>

<ToolBox
  name="Components/Image"
  component={Image}
  events={['click']}
  setup={mockWebsocket(() => ({}))}
>
  <Tool name="Default" props={{ src: './cover.jpg' }} />

  <Tool name="With escaped path" props={{ src: './# Films/cover.jpg' }} />

  <Tool name="Rouded" props={{ src: './avatar.jpg', rounded: true }} />

  <Tool name="Broken" props={{ src: './unknown.jpg' }} />

  <Tool name="Broken rounded" props={{ src: '', rounded: true }} />
</ToolBox>
