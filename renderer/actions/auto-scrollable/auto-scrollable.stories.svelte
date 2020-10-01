<script context="module">
  import { autoScrollable } from '.'

  export const texts = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'In eu mi bibendum neque egestas congue quisque egestas',
    'Arcu non odio euismod lacinia at quis risus sed',
    'Massa tempor nec feugiat nisl',
    'Sagittis aliquam malesuada bibendum arcu vitae elementum',
    'Elementum facilisis leo vel fringilla est ullamcorper eget nulla',
    'Bibendum arcu vitae elementum curabitur vitae nunc sed velit dignissim',
    'Elit sed vulputate mi sit amet mauris commodo',
    'Ut enim blandit volutpat maecenas volutpat blandit aliquam etiam erat',
    'Lorem mollis aliquam ut porttitor leo a diam sollicitudin',
    'Vitae proin sagittis nisl rhoncus mattis',
    'Ut morbi tincidunt augue interdum velit euismod in pellentesque',
    'Aliquam purus sit amet luctus venenatis lectus magna',
    'Amet venenatis urna cursus eget',
    'Et pharetra pharetra massa massa',
    'Ac ut consequat semper viverra nam libero justo laoreet',
    'Eget arcu dictum varius duis at consectetur lorem',
    'Tellus id interdum velit laoreet id donec',
    'Aliquam sem fringilla ut morbi',
    'Consequat nisl vel pretium lectus quam id leo in vitae',
    'Velit scelerisque in dictum non',
    'Pretium aenean pharetra magna ac',
    'Tincidunt arcu non sodales neque sodales ut etiam',
    'Cursus eget nunc scelerisque viverra mauris in aliquam',
    'Tortor at auctor urna nunc id cursus',
    'Consequat interdum varius sit amet mattis vulputate enim nulla',
    'Sagittis vitae et leo duis ut',
    'Pretium lectus quam id leo in',
    'Fusce ut placerat orci nulla pellentesque dignissim enim sit',
    'Sed cras ornare arcu dui vivamus arcu.'
  ]
</script>

<style type="postcss">
  ol {
    @apply overflow-y-auto relative;
    max-height: 400px;

    &::before,
    &::after {
      @apply sticky inline-block w-full left-0 top-0 h-0 opacity-50 p-0 m-0 bg-red-600 float-right;
      content: '';
      padding-bottom: var(--padding);
      margin-bottom: var(--margin);
    }

    &::after {
      @apply top-auto bottom-0;
    }
  }
</style>

<p class="p-4 font-bold">
  Caution: does not work on Firefox (DragEvent always have 0 clientY)
</p>

<ol
  use:autoScrollable={$$restProps}
  style="--padding:{$$restProps.borderDetection}px; --margin:{-$$restProps.borderDetection}px;">
  {#each texts as text}
    <li draggable="true">{text}</li>
  {/each}
</ol>
