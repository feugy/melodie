<script>
  import { _, locale } from 'svelte-intl'
  import Sticky from '@melodie/ui/src/components/Sticky/Sticky.svelte'
  import {
    Card,
    DownloadButton,
    Trapezium,
    ReflectedImage
  } from '../components'

  const baseUrl = BASE_URL
</script>

<style lang="postcss">
  h2 {
    @apply border-0;
    text-transform: none;
  }

  .content {
    @apply flex flex-row items-stretch justify-center gap-12 text-right my-10 mx-auto p-10;
    width: 75%;

    & > *:first-child {
      @apply flex-grow;
    }

    & .image-wrapper {
      @apply flex-shrink-0;
    }
  }

  section {
    margin-top: -7.1rem;

    &:nth-child(even) .content {
      @apply flex-row-reverse text-left;
    }

    & h3 + * {
      @apply mt-4;
    }
  }

  :global(section p > p) {
    @apply my-2;
  }

  .inverted-colors {
    @apply text-black;

    & * {
      border-color: var(--backdrop-color);
    }
  }

  nav {
    @apply flex flex-row p-4 gap-8;

    & > img {
      @apply w-12 cursor-pointer;
    }

    & a {
      @apply flex flex-col place-items-center text-sm;

      & > img {
        @apply w-12;
      }
    }
  }

  footer .content :first-child {
    @apply flex-grow-0;
  }
</style>

<Sticky>
  <nav>
    <img
      src="favicon.png"
      alt={$_('alt.home')}
      on:click={() => {
        window.location.hash = ''
        document.body.scrollTo(0, 0)
      }}
    />
    <a href="#intuitive"
      ><i class="material-icons">all_inclusive</i>{$_('intuitive')}</a
    >
    <a href="#organized"><i class="material-icons">apps</i>{$_('organized')}</a>
    <a href="#reactive"><i class="material-icons">cached</i>{$_('reactive')}</a>
    <a href="#for-geeks"
      ><i class="material-icons">more_vert</i>{$_('for geeks')}</a
    >
    <span class="flex-grow" />
    <a target="_blank" href="https://github.com/feugy/melodie"
      ><img src="/logos/github.png" alt="" /></a
    >
  </nav>
</Sticky>

<header class="inverted-colors">
  <Trapezium color="transparent" inverted>
    <div class="content">
      <span>
        <h1>{$_('Mélodie is a music player')}</h1>
        <h2>{$_('intuitive portable and open source')}</h2>
        <DownloadButton />
      </span>
      <div class="image-wrapper">
        <ReflectedImage
          src="{baseUrl}/images/screenshot-ui-{$locale}.png"
          height="350px"
        />
      </div>
    </div>
  </Trapezium>
</header>

<section id="intuitive">
  <Trapezium color="#4c5c96">
    <div class="content">
      <span>
        <h3>{$_('no frills just the basics')}</h3>
        <p>
          {@html $_('description.basics')}
        </p>
      </span>
      <div class="image-wrapper">
        <ReflectedImage
          src="{baseUrl}/images/screenshot-player-{$locale}.png"
          height="100px"
        />
      </div>
    </div>
  </Trapezium>
</section>

<section id="organized">
  <Trapezium color="#43527f" inverted>
    <div class="content">
      <span>
        <h3>{$_('organized so you do not have to')}</h3>
        <p>
          {@html $_('description.organized')}
        </p>
      </span>
      <div class="image-wrapper">
        <ReflectedImage
          src="{baseUrl}/images/screenshot-artists-{$locale}.png"
          height="275px"
        />
      </div>
    </div>
  </Trapezium>
</section>

<section id="reactive">
  <Trapezium color="#353849">
    <div class="content">
      <span>
        <h3>{$_('it stays tuned')}</h3>
        <p>
          {@html $_('description.tuned')}
        </p>
      </span>
      <div class="image-wrapper">
        <ReflectedImage
          src="{baseUrl}/images/screenshot-artist-details-{$locale}.png"
          height="250px"
        />
      </div>
    </div>
  </Trapezium>
</section>

<section id="for-geeks">
  <Trapezium color="#2e3141" inverted>
    <div class="content flex-wrap">
      <Card image="{baseUrl}/logos/os.png" title={$_('works on your machine')}>
        {@html $_('description.portable')}
      </Card>
      <Card image="{baseUrl}/logos/open-source.png" title={$_('open source')}>
        {@html $_('description.open source')}
      </Card>
      <Card image="{baseUrl}/logos/js.png" title={$_('js powered')}>
        {@html $_('description.technologies')}
      </Card>
    </div>
  </Trapezium>
</section>

<footer class="inverted-colors">
  <div class="content">
    <span>{$_('footer')}</span>
    <span
      ><a
        class="underlined"
        target="_blank"
        href="https://unsplash.com/photos/slbOcNlWNHA"
        >{$_('photo by _', {
          name: 'Larisa Birta'
        })}</a
      ></span
    >
  </div>
</footer>
