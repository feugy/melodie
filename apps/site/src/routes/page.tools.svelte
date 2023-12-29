<script>
  import { Tool } from '@atelier-wb/svelte'
  import { locale } from 'svelte-intl'

  import Layout from './+layout.svelte'
  import Page from './+page.svelte'

  locale.set('en')
</script>

<Tool name="Site Page/Index">
  <Layout>
    <Page />
  </Layout>
</Tool>
