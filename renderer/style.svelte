<style global type="postcss">
  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -moz-font-feature-settings: 'liga';
    -moz-osx-font-smoothing: grayscale;
  }

  :root {
    --bg-color: #2e3141;
    --font-color: #ffffff;
    --nav-bg-color: rgba(10, 10, 10, 0.9);
    --bg-primary-color: #272933;
    --outline-color: rgba(255, 255, 255, 0.25);
    --primary-color: #4c5c96;
    --hover-color: #ccffff;
    --hover-bg-color: rgba(255, 255, 255, 0.125);
    --hover-primary-color: #43527f;
    --backdrop-color: rgba(39, 41, 51, 0.9);
    --input-bg-color: rgba(255, 255, 255, 0.05);
    --scroll-width: 10px;
  }

  html,
  body {
    @apply relative w-full h-full overflow-hidden p-0 m-0;
    user-select: none;
  }

  body {
    box-sizing: border-box;
    color: var(--font-color);
    font-family: 'Source Sans Pro';
    font-size: 15pt;
    font-weight: 300;
    letter-spacing: 0.025em;
    line-height: 1.65;
  }

  h1 {
    @apply font-bold uppercase mb-4;
    font-family: Raleway;
    letter-spacing: 0.1em;
  }

  a:hover {
    @apply no-underline;
  }

  a.underlined {
    @apply relative;

    &:before {
      @apply opacity-0 absolute left-0;
      content: '';
      bottom: -2px;
      height: 0.5px;
      right: 100%;
      transition: all 0.5s ease-in-out;
      background-color: var(--hover-color);
    }

    &:active:before {
      left: 100%;
    }

    &:hover {
      @apply no-underline border-none outline-none;
      color: var(--hover-color);

      &:before {
        @apply opacity-100;
        right: 0%;
      }
    }

    & > .material-icons {
      font-size: 1em;
      vertical-align: -0.15rem;
    }
  }

  .actionable {
    @apply cursor-pointer;
    transition: box-shadow 0.1s linear;
  }

  .actionable:hover,
  a:hover .actionable {
    box-shadow: 0 0 0 2px var(--hover-color);
  }

  input,
  textarea,
  *[contenteditable='true'] {
    user-select: auto;
  }

  *::-webkit-scrollbar {
    width: var(--scroll-width);
  }
  *::-webkit-scrollbar-track {
    background: var(--bg-primary-color);
  }
  *::-webkit-scrollbar-thumb {
    background-color: var(--outline-color);
    border-radius: calc(var(--scroll-width) / 2);
    border: 2px solid var(--bg-primary-color);
  }
  *::-webkit-scrollbar-thumb:hover {
    background-color: var(--font-color);
  }
  ::-webkit-search-cancel-button {
    display: none;
  }
</style>
