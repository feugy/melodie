<script>
  import { _, locale } from 'svelte-intl'
  import { base } from '$app/paths'
  import Sticky from '@melodie/ui/src/components/Sticky/Sticky.svelte'
  import {
    Card,
    DownloadButton,
    ReflectedImage,
    Trapezium
  } from '../components'
</script>

<Sticky>
  <nav>
    <button
      on:click={() => {
        window.location.hash = ''
        document.body.scrollTo(0, 0)
      }}
    >
      <img src="{base}/favicon.png" alt={$_('alt.home')} /></button
    >
    <a href="#intuitive"><i class="icons i-mdi-infinity" />{$_('intuitive')}</a>
    <a href="#organized"
      ><i class="icons i-mdi-land-plots" />{$_('organized')}</a
    >
    <a href="#reactive"><i class="icons i-mdi-sync" />{$_('reactive')}</a>
    <a href="#for-geeks"
      ><i class="icons i-mdi-unicorn-variant" />{$_('for geeks')}</a
    >
    <span class="flex-grow" />
    <a target="_blank" href="https://github.com/feugy/melodie"
      ><img src="{base}/logos/github.png" alt="" /></a
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
          src="{base}/images/screenshot-ui-{$locale}.png"
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
          src="{base}/images/screenshot-player-{$locale}.png"
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
          src="{base}/images/screenshot-artists-{$locale}.png"
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
          src="{base}/images/screenshot-artist-details-{$locale}.png"
          height="250px"
        />
      </div>
    </div>
  </Trapezium>
</section>

<section id="for-geeks">
  <Trapezium color="#2e3141" inverted>
    <div class="content flex-wrap">
      <Card image="{base}/logos/os.png" title={$_('works on your machine')}>
        {@html $_('description.portable')}
      </Card>
      <Card image="{base}/logos/open-source.png" title={$_('open source')}>
        {@html $_('description.open source')}
      </Card>
      <Card image="{base}/logos/js.png" title={$_('js powered')}>
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

<style>
  h2 {
    --at-apply: border-0;
    text-transform: none;
  }

  .content {
    --at-apply: flex flex-row items-stretch justify-center gap-12 text-right
      my-10 mx-auto p-10 w-3/4;

    & .image-wrapper {
      --at-apply: flex-shrink-0;
    }
  }

  section {
    margin-top: -7.1rem;

    &:nth-child(even) .content {
      --at-apply: flex-row-reverse text-left;
    }

    & h3 + * {
      --at-apply: mt-4;
    }
  }

  :global(section p > p) {
    --at-apply: my-2;
  }

  .inverted-colors {
    --at-apply: text-black;

    & * {
      border-color: var(--backdrop-color);
    }
  }

  nav {
    --at-apply: flex flex-row p-4 gap-8;

    & > button > img {
      --at-apply: w-12 cursor-pointer;
    }

    & a {
      --at-apply: flex flex-col place-items-center text-sm;

      & > img {
        --at-apply: w-12;
      }
    }
  }

  footer .content :first-child {
    --at-apply: flex-grow-0;
  }
</style>
