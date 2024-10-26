<script module lang="ts">
  import type { EnrichedAlbum } from '$lib/types'
  import { addId, makeRef } from '@melodie/common/tests/refs'
  import type { PartialWithReq } from '@melodie/common/types'
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import cover from 'fixtures/cover.jpg'
  import Component from './album.svelte'

  const albums: PartialWithReq<EnrichedAlbum, 'id' | 'name' | 'refs'>[] = [
    {
      name: 'Diamonds On The Inside',
      cover,
      refs: ['Ben Harper'].map(makeRef),
    },
    {
      name: 'A View From the Top of the World',
      cover:
        'http://coverartarchive.org/release/50ba7d12-8b6f-48df-a483-aec366f75fef/30885069167-250.jpg',
      refs: ['Dream Theater'].map(makeRef),
    },
    {
      name: 'Raiponse',
      cover:
        'http://coverartarchive.org/release/631f7aa1-ec77-46ee-99f2-8ca2c8aa1cba/5383936782-250.jpg',
      refs: [
        'Alan Menken',
        'Maeva Méline',
        'Sophie Delmas',
        'Michael Kosarin',
        'Michael Starobin',
      ].map(makeRef),
    },
    {
      name: 'A Change of Seasons',
      refs: ['Dream Theater'].map(makeRef),
    },
    {
      name: 'A Night At The Opera',
      cover: 'https://acme.org/does-not-exist.jpg',
      refs: ['Queen'].map(makeRef),
    },
  ].map(addId)

  const { Story } = defineMeta({
    title: 'Components/Album',
    component: Component,
    tags: ['autodocs'],
  })
</script>

<Story name="Default" args={{ album: albums[0] }} />
<Story name="Truncated title" args={{ album: albums[1] }} />
<Story name="Multiple artists" args={{ album: albums[2] }} />
<Story name="No cover" args={{ album: albums[3] }} />
<Story name="Broken cover" args={{ album: albums[4] }} />
