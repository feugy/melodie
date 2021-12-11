<style lang="postcss">
  .wrapper {
    @apply top-0 left-0 w-full h-1 overflow-hidden relative;
    background: var(--font-color);
  }

  .inc,
  .dec {
    @apply h-1 absolute;
    background: var(--primary-color);
  }
  .inc {
    animation: increase 2s ease-in-out infinite;
  }
  .dec {
    animation: decrease 2s 0.9s ease-in-out infinite;
  }

  @keyframes increase {
    0% {
      left: -5%;
      width: 5%;
    }
    100% {
      left: 130%;
      width: 150%;
    }
  }

  @keyframes decrease {
    0% {
      left: -90%;
      width: 90%;
    }
    100% {
      left: 110%;
      width: 10%;
    }
  }
</style>

<div class="wrapper" role="progressbar">
  <div class="inc" />
  <div class="dec" />
</div>
