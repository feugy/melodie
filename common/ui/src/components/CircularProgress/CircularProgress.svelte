<script>
  // freely inspired from https://css-tricks.com/building-progress-ring-quickly/

  export let size = 60
  export let percentage = 100

  const strokeWidth = 2
  $: radius = size / 2 - strokeWidth * 2
  $: circumference = radius * 2 * Math.PI
  $: offset = circumference - (percentage / 100) * circumference
</script>

<style lang="postcss">
  circle {
    stroke: var(--primary-color);
    stroke-width: var(--stroke-width);
    fill: transparent;
    stroke-dasharray: var(--circumference) var(--circumference);
    stroke-dashoffset: var(--offset);
    transition: stroke-dashoffset 0.35s;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }
</style>

<svg
  height={size}
  width={size}
  role="progressbar"
  style="--stroke-width:{strokeWidth}; --circumference:{circumference}; --offset:{offset};"
>
  <circle r={radius} cx={size / 2} cy={size / 2} />
</svg>
