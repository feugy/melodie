<script>
  import SystemNotifier from './SystemNotifier.svelte'
  import Player from '../Player/Player.svelte'
</script>

<style type="postcss">
  .disclaimer {
    @apply text-left m-8;
  }

  .disclaimer ul > li {
    @apply list-disc ml-4;
  }
</style>

<div class="disclaimer">
  <p>
    Hit play and open your notification center to see the currently played track
    with controls.
  </p>
  <p>Caveats:</p>
  <ul>
    <li>
      It works best on Chrome/Chromium. Firefox does not yet share its
      mediaSession with your OS.
    </li>
    <li>
      On Ubuntu, controls are not display for short audio files (&lt; 5s).
    </li>
    <li>On Ubuntu, Chrome/Chromium does not set artwork yet.</li>
    <li>
      Do not expect node-notifier popups: storybook does not support invoking
      node modules.
    </li>
  </ul>
</div>
<SystemNotifier />
<Player />
