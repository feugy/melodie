<script>
  import SystemNotifier from './SystemNotifier.svelte'
  import Player from '../Player/Player.svelte'

  Notification.requestPermission()
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
    with controls. Notifications should work consistently (when browser tab is
    not focused).
  </p>
  <p>Caveats:</p>
  <ul>
    <li>
      On Ubuntu, controls are not display for short audio files (&lt; 5s).
    </li>
    <li>On Ubuntu, Chrome/Chromium does not set artwork yet.</li>
    <li>
      To see notifications, you need to allow them when your browser will ask
      for permissions.
    </li>
  </ul>
</div>
<SystemNotifier />
<Player />
