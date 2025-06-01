<script lang="ts">
  interface SliderProps {
    /** Between 0 and 1 */
    value: number
  }

  let { value = $bindable() }: SliderProps = $props()

  let progress: HTMLDivElement | null

  function seek(e: PointerEvent) {
    if (!progress) return

    const { left, width } = progress.getBoundingClientRect()

    value = (e.clientX - left) / width
    if (value < 0) value = 0
    if (value > 1) value = 1
  }

  function handleClick(e: PointerEvent) {
    progress = e.currentTarget as HTMLDivElement
    seek(e)

    window.addEventListener('pointermove', seek)
    window.addEventListener(
      'pointerup',
      () => {
        window.removeEventListener('pointermove', seek)
      },
      { once: true }
    )
  }
</script>

<div
  class="bg-secondary-500 h-2 flex-1 cursor-pointer overflow-hidden rounded-lg"
  bind:this={progress}
  onpointerdown={handleClick}
>
  <div
    class="bg-primary-500 h-full w-[calc(var(--progress))] rounded-lg"
    style="--progress: {value * 100}%"
  ></div>
</div>
