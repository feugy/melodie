<script>
  import { Tool } from '@atelier-wb/svelte'
  import { locale } from 'svelte-intl'
  import Layout from '../../routes/_layout.svelte'
  import Page from '../../routes/index.svelte'

  locale.set('en')
</script>

<Tool name="Site Page/Index">
<Layout segment="">
  <Page />
</Layout>
</Tool>
