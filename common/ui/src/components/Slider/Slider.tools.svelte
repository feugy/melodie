<script>
  import { Tool } from '@atelier-wb/svelte'
  import Slider from './Slider.svelte'
</script>

<Tool
  name="Components/Slider"
  component={Slider}
  props={{ current: 10, max: 100, class: 'w-1/2' }}
  events={['input']}
/>
