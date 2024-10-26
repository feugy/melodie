<script>
  import { Tool } from '@atelier-wb/svelte'

  import HRefSink from '../../atelier/HRefSink.svelte'
  import { mockWebsocket } from '../../atelier/utils'
  import { playlistsData } from '../../components/AddToPlaylist/AddToPlaylist.testdata'
  import { artistData } from '../../components/Artist/Artist.testdata'
  import Component from './[id].svelte'

  const tracks = [
    {
      id: 3673014864,
      media: 'cover.jpg',
      artistRefs: [[1213718636, 'Foo Fighters']],
      albumRef: [2358057182, 'Foo Fighters'],
      tags: {}
    },
    {
      id: 3689083369,
      media: 'cover.jpg',
      artistRefs: [[1213718636, 'Foo Fighters']],
      albumRef: [2358057182, 'Foo Fighters'],
      tags: {}
    },
    {
      id: 3174141541,
      media: '(1997) The Colour and the Shape/cover.jpg',
      artistRefs: [[1213718636, 'Foo Fighters']],
      albumRef: [2084548277, 'The Colour And The Shape'],
      tags: {}
    },
    {
      id: 332205991,
      media: '(1997) The Colour and the Shape/cover.jpg',
      artistRefs: [[1213718636, 'Foo Fighters']],
      albumRef: [2084548277, 'The Colour And The Shape'],
      tags: {}
    },
    {
      id: 2522684216,
      media: '(1997) The Colour and the Shape/cover.jpg',
      artistRefs: [[1213718636, 'Foo Fighters']],
      albumRef: [2084548277, 'The Colour And The Shape'],
      tags: {}
    },
    {
      id: 3346572745,
      media: '(1999) There Is Nothing Left To Lose/cover.jpg',
      artistRefs: [[1213718636, 'Foo Fighters']],
      albumRef: [1783531088, 'There Is Nothing Left To Lose'],
      tags: {}
    },
    {
      id: 991481009,
      media: '(1999) There Is Nothing Left To Lose/cover.jpg',
      artistRefs: [[1213718636, 'Foo Fighters']],
      albumRef: [1783531088, 'There Is Nothing Left To Lose'],
      tags: {}
    }
  ]

  const artist = {
    ...artistData,
    bio: {
      en: "Foo Fighters is an American alternative rock band formed in Seattle in 1994. It was founded by Nirvana drummer Dave Grohl as a one-man project following the death of Kurt Cobain and the resulting dissolution of his previous band. The group got its name from the UFOs and various aerial phenomena that were reported by Allied aircraft pilots in World War II, which were known collectively as foo fighters. Prior to the release of the Foo Fighters' 1995 debut album Foo Fighters, which featured Grohl as the only official member, Grohl recruited bassist Nate Mendel and drummer William Goldsmith, both formerly of Sunny Day Real Estate, as well as fellow Nirvana touring bandmate Pat Smear as guitarist to complete the lineup. \nThe band began with performances in Portland, Oregon. Goldsmith quit during the recording of the group's second album, The Colour and the Shape (1997) when most of the drum parts were re-recorded by Grohl himself. Smear's departure followed soon afterward. They were replaced by Taylor Hawkins and Franz Stahl, respectively, although Stahl was fired before the recording of the group's third album, There Is Nothing Left to Lose (1999).\nThe band briefly continued as a trio until Chris Shiflett joined as the band's lead guitarist after the completion of There Is Nothing Left to Lose. The band released its fourth album, One by One, in 2002. The group followed that release with the two-disc In Your Honor (2005), which was split between acoustic songs and heavier material. Foo Fighters released its sixth album, Echoes, Silence, Patience & Grace, in 2007. In 2010, it was confirmed that Smear had officially rejoined the band after touring with the Foo Fighters as an unofficial member between 2006 and 2009. Over the course of the band's career, four of its albums have won 11 Grammy Awards winning Best Rock Album four times. The band's seventh studio album, Wasting Light, was released in 2011.",
      fr: "Foo Fighters est un groupe américain de rock alternatif formé à Seattle en 1994. Ce fut, à l'origine, un projet personnel initié par le batteur de Nirvana, Dave Grohl, après la mort de Kurt Cobain et la dissolution de son groupe qui a suivi. Le groupe tire son nom des OVNIs et autres phénomènes aériens signalés par les pilotes d'avions alliés lors de la Seconde Guerre mondiale regroupés sous le terme de Foo Fighters (chasseurs de fantômes). Avant la publication de premier album éponyme des Foo Fighters en 1995, qui présentait Grohl comme unique membre officiel, Grohl a recruté le bassiste Nate Mendel et le batteur William Goldsmith, tous deux issus de Sunny Day Real Estate, ainsi qu'un compagnon de tournée de Nirvana, Pat Smear, en tant que guitariste pour compléter la formation.\nLe groupe a commencé par des représentations à Portland (Oregon). Goldsmith a quitté le groupe pendant l'enregistrement du deuxième album, The Colour and the Shape (1997) où la plupart des parties de batterie ont été réenregistrées par Grohl lui-même. Le départ de Smear suivit peu après. Ils ont été remplacés respectivement par Taylor Hawkins et Franz Stahl, bien que ce dernier fut écarté avant l'enregistrement du troisième album du groupe, There Is Nothing Left to Lose (1999).\nLe groupe a continué brièvement en trio jusqu'à ce que Chris Shiflett les rejoigne en tant que guitariste leader après l'achèvement de There Is Nothing Left to Lose. Le groupe sort son quatrième album, One By One, en 2002, suivi d'un double CD, In Your Honor (2005), séparant les chansons acoustiques des chansons électriques. Foo Fighters a publié son sixième album, Echoes, Silence, Patience & Grace, en 2007. En 2010, il a été confirmé que Smear avait officiellement rejoint le groupe après une tournée avec les Foo Fighters en tant que membre non-officiel entre 2006 et 2009. Au cours de la carrière du groupe, quatre de ses albums ont remporté 11 Grammy Awards dont celui du Meilleur Album Rock à quatre reprises. Le septième album studio du groupe, Wasting Light, a été commercialisé en 2011."
    },
    tracks
  }
</script>

<Tool
  name="Views/Artist Details"
  props={{ params: { id: artist.id } }}
  setup={mockWebsocket(invoked =>
    invoked === 'tracks.list'
      ? {
          total: playlistsData.length,
          size: playlistsData.length,
          from: 0,
          results: playlistsData
        }
      : invoked === 'media.findForArtist'
        ? [
            {
              artwork:
                'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg'
            },
            {
              artwork:
                'https://www.theaudiodb.com/images/media/artist/fanart/spvryu1347980801.jpg'
            },
            {
              artwork:
                'https://img.discogs.com/RLkA5Qmo6_eNpWGjioaI4bJZUB4=/600x600/smart/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-29735-1591800654-2186.jpeg.jpg'
            }
          ]
        : artist
  )}
  let:props
>
  <HRefSink><Component {...props} /></HRefSink>
</Tool>
