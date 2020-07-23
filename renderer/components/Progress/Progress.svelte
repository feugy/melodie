<style type="postcss">
  @keyframes increase {
    from {
      left: -5%;
      width: 5%;
    }
    to {
      left: 130%;
      width: 150%;
    }
  }
  @keyframes decrease {
    from {
      left: -90%;
      width: 90%;
    }
    to {
      left: 110%;
      width: 10%;
    }
  }

  .wrapper {
    @apply top-0 left-0 w-full h-1 overflow-hidden relative;
    background: var(--white);
  }

  .inc,
  .dec {
    @apply h-1 absolute;
    background: var(--light-blue);
  }
  .inc {
    animation: increase 2s ease-in-out infinite;
  }
  .dec {
    animation: decrease 2s 0.9s ease-in-out infinite;
  }
</style>

<div class="wrapper">
  <div class="inc" />
  <div class="dec" />
</div>
