<script>
  import { _ } from 'svelte-intl'
  import Dropdown from '@melodie/ui/src/components/Dropdown/Dropdown.svelte'
  import DownloadButtonItem from './DownloadButtonItem.svelte'

  const version = MELODIE_VERSION

  const baseUrl = `https://github.com/feugy/melodie/releases/download/v${version}`

  const options = [
    {
      Component: DownloadButtonItem,
      props: {
        label: $_('download.exe'),
        os: 'windows',
        baseUrl,
        file: `melodie-setup-${version}.exe`
      }
    },
    {
      Component: DownloadButtonItem,
      props: {
        label: $_('download.portable exe'),
        os: 'windows',
        baseUrl,
        file: `melodie-${version}.exe`
      }
    },
    {
      Component: DownloadButtonItem,
      props: {
        label: $_('download.portable zip'),
        os: 'windows',
        baseUrl,
        file: `melodie-${version}-win.zip`
      }
    },
    {
      Component: DownloadButtonItem,
      props: {
        label: $_('download.app image'),
        os: 'linux',
        baseUrl,
        file: `melodie-${version}-x86_64.AppImage`
      }
    },
    {
      Component: DownloadButtonItem,
      props: {
        label: $_('download.portable tar'),
        os: 'linux',
        baseUrl,
        file: `melodie-${version}.tar.gz`
      }
    },
    {
      Component: DownloadButtonItem,
      props: {
        label: $_('download.dmg'),
        os: 'macOS',
        baseUrl,
        file: `melodie-${version}.dmg`
      }
    }
  ]
</script>

<Dropdown
  class="text-white"
  icon="get_app"
  text={$_('install _', { version })}
  primary
  large
  {options}
  valueAsText={false}
/>
