<script>
  import { texts } from '../../tests/lorem'
  import { autoScrollable } from '.'
</script>

<p class="p-4 font-bold">
  Caution: does not work on Firefox (DragEvent always have 0 clientY)
</p>

<ol
  use:autoScrollable={$$restProps}
  style="--padding:{$$restProps.borderDetection}px; --margin:{-$$restProps.borderDetection}px;"
>
  {#each texts as text}
    <li draggable="true">{text}</li>
  {/each}
</ol>

<style>
  ol {
    --at-apply: overflow-y-auto relative;
    max-height: 400px;

    &::before,
    &::after {
      --at-apply: sticky inline-block w-full left-0 top-0 h-0 opacity-50 p-0 m-0
        bg-red-600 float-right;
      content: '';
      padding-bottom: var(--padding);
      margin-bottom: var(--margin);
    }

    &::after {
      --at-apply: top-auto bottom-0;
    }
  }
</style>
