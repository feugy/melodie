<script>
  import Trapezium from './Trapezium.svelte'
  import ReflectedImage from '../ReflectedImage/ReflectedImage.svelte'
</script>

<Trapezium {...$$restProps}>
  <div class="flex flex-row my-8 mx-auto max-w-screen-lg gap-8">
    <span class="flex-grow text-right">
      <h3>Here is some title</h3>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </p>
    </span>
    <div class="flex-shrink-0">
      <ReflectedImage src="images/screenshot-artists-en.png" height="275px" />
    </div>
  </div>
</Trapezium>
