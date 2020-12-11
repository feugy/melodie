<script>
  import { locale } from 'svelte-intl'
  import Layout from '../../routes/_layout.svelte'
  import Page from '../../routes/index.svelte'

  locale.set('en')
</script>

<Layout segment="">
  <Page />
</Layout>
