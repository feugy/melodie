<script>
  import { Tool, ToolBox } from '@atelier-wb/svelte'

  import TrackDetailsDialogue from './TrackDetailsDialogue.svelte'
</script>

<ToolBox
  name="Components/Track details dialogue"
  component={TrackDetailsDialogue}
  props={{
    open: true,
    src: {
      id: 17569353,
      path: '/home/damien/Musique/# Films/Distant Worlds II - More Music From Final Fantasy/07 - Nobuo Uematsu - Victory Theme (Final Fantasy Series).mp3',
      tags: {
        album: 'Distant Worlds II - More music from Final Fantasy',
        albumartist: 'Nobuo Uematsu',
        artist: 'Nobuo Uematsu',
        artists: ['Nobuo Uematsu'],
        genre: ['Classical', 'Soundtrack'],
        title: 'Victory Theme (Final Fantasy Series)',
        year: 2010,
        duration: 8.54204081632653,
        track: { no: 7, of: 13 },
        disk: { no: 1, of: 1 },
        movementIndex: {},
        isrc: ['USBVN1010207']
      }
    }
  }}
  events={['close', 'open']}
>
  <Tool name="Default" />

  <Tool
    name="with partial"
    props={{
      src: {
        id: 4977489,
        path: "/home/damien/Musique/Tram des Balkans/(2007) Shtirip' Tour/10 - Tram des Balkans - Grande Mere.ogg",
        tags: {
          album: "Shtirip' Tour",
          albumartist: null,
          artist: 'Tram des Balkans',
          artists: ['Tram des Balkans'],
          genre: ['Ethnic'],
          title: 'Grande Mère',
          year: 2007,
          duration: 169.2,
          track: { no: 10, of: null },
          disk: { no: null, of: null },
          movementIndex: {},
          date: '2007'
        }
      }
    }}
  />

  <Tool
    name="with MusicBrainz"
    props={{
      src: {
        id: 53564179,
        path: '/home/damien/Musique/Blonde Readhead/(2004) Misery Is A Butterfly/04 - Blonde Redhead - Doll Is Mine.mp3',
        tags: {
          album: 'Misery Is a Butterfly',
          albumartist: 'Blonde Redhead',
          artist: 'Blonde Redhead',
          artists: ['Blonde Redhead'],
          genre: ['Rock'],
          title: 'Doll Is Mine',
          year: 2004,
          duration: 187.74204081632652,
          track: { no: 4, of: 11 },
          disk: { no: null, of: null },
          movementIndex: {},
          comment: ['RØLy!'],
          encodedby: 'Exact Audio Copy   (Secure mode)',
          musicbrainz_trmid: 'USICBRAINZ TRM ID',
          musicbrainz_artistid: ['USICBRAINZ ARTIST ID'],
          musicbrainz_albumid: 'USICBRAINZ ALBUM ID',
          releasetype: ['USICB'],
          releasestatus: 'USICBRAI',
          musicbrainz_albumartistid: [''],
          label: ['Phantom Records (England)'],
          rating: [{ source: 'Windows Media Player 9 Series', rating: 0 }],
          averageLevel: 8059,
          composer: ['Blonde Redhead']
        }
      }
    }}
  />

  <Tool
    name="with ReplayGain"
    props={{
      src: {
        id: 2871780,
        path: '/home/damien/Musique/Queen/(1991) Greatest Hits II/16 - Queen - The Show Must Go On.mp3',
        tags: {
          album: 'Greatest Hits II',
          albumartist: 'Queen',
          artist: 'Queen',
          artists: ['Queen'],
          genre: ['rock'],
          title: 'Show Must Go On',
          year: 1991,
          duration: 263.6538775510204,
          track: { no: 16, of: 17 },
          disk: { no: null, of: null },
          movementIndex: {},
          comment: [''],
          label: ['MSI Music Distribution'],
          rating: [{ source: 'Windows Media Player 9 Series', rating: 0 }],
          averageLevel: 5243,
          composer: ['Queen']
        }
      }
    }}
  />
</ToolBox>
