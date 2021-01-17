<style global type="postcss">
  @font-face {
    font-family: 'Material Icons';
    font-style: normal;
    font-weight: 400;
    src: url(../fonts/MaterialIcons.woff2) format('woff2');
  }

  @font-face {
    font-family: 'Raleway';
    font-style: normal;
    font-weight: 200;
    src: url(../fonts/Raleway.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
    font-display: swap;
  }

  @font-face {
    font-family: 'Raleway';
    font-style: normal;
    font-weight: 700;
    src: url(../fonts/Raleway-SemiBold.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
    font-display: swap;
  }

  @font-face {
    font-family: 'Source Sans Pro';
    font-style: italic;
    font-weight: 300;
    src: url(../fonts/SourceSansPro-LightItalic.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
    font-display: swap;
  }

  @font-face {
    font-family: 'Source Sans Pro';
    font-style: italic;
    font-weight: 600;
    src: url(../fonts/SourceSansPro-SemiBoldItalic.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
    font-display: swap;
  }

  @font-face {
    font-family: 'Source Sans Pro';
    font-style: normal;
    font-weight: 300;
    src: url(../fonts/SourceSansPro-Light.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
    font-display: swap;
  }

  @font-face {
    font-family: 'Source Sans Pro';
    font-style: normal;
    font-weight: 600;
    src: url(../fonts/SourceSansPro-SemiBold.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
    font-display: swap;
  }

  @font-face {
    font-family: 'Permanent Marker';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(../fonts/PermanentMarker.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
      U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
      U+2215, U+FEFF, U+FFFD;
    font-display: swap;
  }

  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 1.5rem;
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
    --disabled-color: #bbbbbb;
    --nav-bg-color: rgba(10, 10, 10, 0.95);
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
    font-size: 14px;
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
    color: var(--hover-color);

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

    & > .material-icons {
      font-size: 1em;
      vertical-align: -0.15rem;
    }
  }

  @media (hover: hover) {
    a.underlined {
      color: inherit;

      &:hover {
        @apply no-underline border-none outline-none;
        color: var(--hover-color);

        &:before {
          @apply opacity-100;
          right: 0%;
        }
      }
    }

    .actionable:hover,
    a:hover .actionable {
      box-shadow: 0 0 0 2px var(--hover-color);
    }
  }

  .actionable {
    @apply cursor-pointer;
    transition: box-shadow 0.1s linear;
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
