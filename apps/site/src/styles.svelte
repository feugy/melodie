<style global type="postcss">
  @import '@melodie/ui/src/style.css';

  html,
  body {
    @apply overflow-auto;
    background: var(--bg-color);
    scroll-behavior: smooth;
  }

  body {
    background-image: linear-gradient(
        to top,
        rgb(255, 255, 255, 0.7),
        rgb(255, 255, 255, 0.7)
      ),
      url('../images/larisa-birta-slbOcNlWNHA-unsplash.jpg');
    background-size: auto, 100%;
    background-position: center, center 50%;
  }

  h1,
  h2,
  h3,
  h4 {
    @apply uppercase border-b-2 pb-2;
    border-bottom-color: var(--outline-color);
    font-family: Raleway;
  }
  h1 {
    @apply text-4xl;
  }
  h2,
  h3 {
    @apply text-2xl;
  }
</style>
