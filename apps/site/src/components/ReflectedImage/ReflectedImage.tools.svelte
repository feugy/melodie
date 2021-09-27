<script>
  import { Tool } from '@atelier-wb/svelte'
  import ReflectedImage from './ReflectedImage.svelte'
</script>

<Tool name="Site components/Reflected image" props={{
  src: 'images/screenshot-ui-fr.png',
  height: '250px'
}} let:props>
  <div class="flex">
    <ReflectedImage {...props} />
  </div>
</Tool>