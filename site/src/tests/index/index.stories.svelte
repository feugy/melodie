<script>
  import { locale } from 'svelte-intl'
  import Layout from '../../routes/_layout.svelte'
  import Page from '../../routes/index.svelte'

  locale.set('en')
</script>

<style global type="postcss">
  body {
    padding: 0 !important;
  }
</style>

<Layout segment="">
  <Page />
</Layout>
