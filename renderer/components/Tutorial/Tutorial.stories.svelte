<script>
  import Tutorial from './Tutorial.svelte'
  import Button from '../Button/Button.svelte'

  let anchorId = 'button1'

  function handleButtonClick() {
    anchorId = anchorId === 'button1' ? 'button2' : 'button1'
  }
</script>

<style type="postcss">
  span {
    @apply inline-block mr-4;
  }
</style>

<Tutorial {anchorId} {...$$restProps} on:next>
  <p>Welcome to Mélodie!</p>
  <p>Let's start by selecting the folder on your drive holding your music.</p>
</Tutorial>
<p>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
  nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
  eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
  in culpa qui officia deserunt mollit anim id est laborum.
</p>
<div>
  <span id="button1"><Button
      on:click={handleButtonClick}
      text="Click me first"
      icon="announcement" /></span><span id="button2"><Button
      on:click={handleButtonClick}
      text="Then click me"
      icon="emoji_events" /></span>
</div>
<p>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
  nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
  eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
  in culpa qui officia deserunt mollit anim id est laborum.
</p>
