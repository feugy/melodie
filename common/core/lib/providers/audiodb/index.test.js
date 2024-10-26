import 'dotenv/config'

import nock from 'nock'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { withNockIt } from '../../tests'
import TooManyRequestsError from '../too-many-requests-error'
import provider from '.'

describe('AudioDB provider', () => {
  beforeEach(() => {
    provider.lastReqEpoch = 0
    provider.init({
      key: process.env.AUDIODB_KEY
    })
  })

  describe('findArtistArtwork()', () => {
    it('returns nothing when not initialized', async () => {
      provider.init()
      expect(await provider.findArtistArtwork('coldplay')).toEqual([])
    })

    withNockIt('returns artwork', async () => {
      expect(await provider.findArtistArtwork('coldplay')).toEqual([
        {
          artwork:
            'https://www.theaudiodb.com/images/media/artist/thumb/uxrqxy1347913147.jpg',
          bio: {
            en: "Coldplay are a British alternative rock band formed in 1996 by lead vocalist Chris Martin and lead guitarist Jonny Buckland at University College London. After they formed Pectoralz, Guy Berryman joined the group as a bassist and they changed their name to Starfish. Will Champion joined as a drummer, backing vocalist, and multi-instrumentalist, completing the line-up. Manager Phil Harvey is often considered an unofficial fifth member. The band renamed themselves \"Coldplay\" in 1998, before recording and releasing three EPs; Safety in 1998, Brothers & Sisters as a single in 1999 and The Blue Room in the same year. The latter was their first release on a major label, after signing to Parlophone.\n\nThey achieved worldwide fame with the release of the single \"Yellow\" in 2000, followed by their debut album released in the same year, Parachutes, which was nominated for the Mercury Prize. The band's second album, A Rush of Blood to the Head (2002), was released to critical acclaim and won multiple awards, including NME's Album of the Year, and has been widely considered the best of the Nelson-produced Coldplay albums. Their next release, X&Y, the best-selling album worldwide in 2005, was met with mostly positive reviews upon its release, though some critics felt that it was inferior to its predecessor. The band's fourth studio album, Viva la Vida or Death and All His Friends (2008), was produced by Brian Eno and released again to largely favourable reviews, earning several Grammy nominations and wins at the 51st Grammy Awards. On 24 October 2011, they released their fifth studio album, Mylo Xyloto, which was met with mixed to positive reviews, and was the UK's best-selling rock album of 2011.\n\nThe band has won a number of music awards throughout their career, including seven Brit Awards winning Best British Group three times, four MTV Video Music Awards, and seven Grammy Awards from twenty nominations. As one of the world's best-selling music artists, Coldplay have sold over 55 million records worldwide. In December 2009, Rolling Stone readers voted the group the fourth best artist of the 2000s.\n\nColdplay have been an active supporter of various social and political causes, such as Oxfam's Make Trade Fair campaign and Amnesty International. The group have also performed at various charity projects such as Band Aid 20, Live 8, Sound Relief, Hope for Haiti Now: A Global Benefit for Earthquake Relief, The Secret Policeman's Ball, and the Teenage Cancer Trust.",
            fr: "Coldplay est un groupe de rock britannique formé à Londres en 1996 par le chanteur, guitariste et pianiste Chris Martin et le guitariste Jon Buckland. Le bassiste Guy Berryman rejoint ensuite la formation, qui prend le nom de Starfish avant que le batteur Will Champion devienne membre à son tour et que le producteur Phil Harvey s'associe avec eux dans leur entreprise3. En 1998, le groupe voit le jour sous son appellation définitive et sort deux premiers EPs. Ils en profitent alors pour signer chez le label Parlophone2.\nAvec cinq albums studio publiés, le dernier étant Mylo Xyloto, sorti le 24 octobre 20114, Coldplay est aujourd'hui l'un des plus grands groupes à succès du nouveau millénaire avec près de 60 millions d'albums vendus5. Critiqué mais régulièrement récompensé, le groupe a remporté 8 Brit Awards, 7 Grammy Awards, 6 Q Awards et 5 NME Awards. Il est aussi élu en décembre 2009, quatrième meilleur artiste des années 2000 par les lecteurs du magazine Rolling Stone6.\nLe groupe prend cause dans différentes œuvres caritatives et officie depuis ses débuts pour le commerce équitable aux côtés d'Oxfam international7 et d'Amnesty International8. Cet engagement les conduit à participer à des groupes caritatifs tels que Band Aid 20 et à jouer dans des concerts tels que le Live 8, le Fairplay7, le Sound Relief, le Hope for Haiti Now7 ou le Teenage Cancer Trust9. Chris Martin et Jonny Buckland se rencontrent en septembre 1996 à l’University College de Londres. Les deux amis, passionnés de musique, passent le reste de l'année universitaire à la planification d'un groupe, finalement appelé Pectoralz. Ils sont bientôt rejoints par Guy Berryman, qui étudie à la même université. Le groupe est formé en 1997. Un ami de Chris Martin, Phil Harvey, est engagé comme manager. Le 8 janvier 1998, ils recrutent un quatrième membre, Will Champion qui devient le batteur alors qu’il n'a jamais touché une batterie de sa vie. A peine engagé, Will Champion organise le premier concert du groupe au Laurel Tree de Londres. Pour ce concert donné le 16 janvier 1998, ils se baptisent provisoirement Starfish10.\nLe nom Coldplay est proposé par Tim Crompton11, un ami commun d'université qui a d'abord imaginé ce nom pour son propre groupe, avant de l'abandonner, le trouvant trop déprimant. Chris Martin et ses acolytes trouvent ce nom parfait et décident de le garder."
          },
          provider: provider.name
        },
        {
          artwork:
            'https://www.theaudiodb.com/images/media/artist/fanart/spvryu1347980801.jpg',
          bio: {
            en: "Coldplay are a British alternative rock band formed in 1996 by lead vocalist Chris Martin and lead guitarist Jonny Buckland at University College London. After they formed Pectoralz, Guy Berryman joined the group as a bassist and they changed their name to Starfish. Will Champion joined as a drummer, backing vocalist, and multi-instrumentalist, completing the line-up. Manager Phil Harvey is often considered an unofficial fifth member. The band renamed themselves \"Coldplay\" in 1998, before recording and releasing three EPs; Safety in 1998, Brothers & Sisters as a single in 1999 and The Blue Room in the same year. The latter was their first release on a major label, after signing to Parlophone.\n\nThey achieved worldwide fame with the release of the single \"Yellow\" in 2000, followed by their debut album released in the same year, Parachutes, which was nominated for the Mercury Prize. The band's second album, A Rush of Blood to the Head (2002), was released to critical acclaim and won multiple awards, including NME's Album of the Year, and has been widely considered the best of the Nelson-produced Coldplay albums. Their next release, X&Y, the best-selling album worldwide in 2005, was met with mostly positive reviews upon its release, though some critics felt that it was inferior to its predecessor. The band's fourth studio album, Viva la Vida or Death and All His Friends (2008), was produced by Brian Eno and released again to largely favourable reviews, earning several Grammy nominations and wins at the 51st Grammy Awards. On 24 October 2011, they released their fifth studio album, Mylo Xyloto, which was met with mixed to positive reviews, and was the UK's best-selling rock album of 2011.\n\nThe band has won a number of music awards throughout their career, including seven Brit Awards winning Best British Group three times, four MTV Video Music Awards, and seven Grammy Awards from twenty nominations. As one of the world's best-selling music artists, Coldplay have sold over 55 million records worldwide. In December 2009, Rolling Stone readers voted the group the fourth best artist of the 2000s.\n\nColdplay have been an active supporter of various social and political causes, such as Oxfam's Make Trade Fair campaign and Amnesty International. The group have also performed at various charity projects such as Band Aid 20, Live 8, Sound Relief, Hope for Haiti Now: A Global Benefit for Earthquake Relief, The Secret Policeman's Ball, and the Teenage Cancer Trust.",
            fr: "Coldplay est un groupe de rock britannique formé à Londres en 1996 par le chanteur, guitariste et pianiste Chris Martin et le guitariste Jon Buckland. Le bassiste Guy Berryman rejoint ensuite la formation, qui prend le nom de Starfish avant que le batteur Will Champion devienne membre à son tour et que le producteur Phil Harvey s'associe avec eux dans leur entreprise3. En 1998, le groupe voit le jour sous son appellation définitive et sort deux premiers EPs. Ils en profitent alors pour signer chez le label Parlophone2.\nAvec cinq albums studio publiés, le dernier étant Mylo Xyloto, sorti le 24 octobre 20114, Coldplay est aujourd'hui l'un des plus grands groupes à succès du nouveau millénaire avec près de 60 millions d'albums vendus5. Critiqué mais régulièrement récompensé, le groupe a remporté 8 Brit Awards, 7 Grammy Awards, 6 Q Awards et 5 NME Awards. Il est aussi élu en décembre 2009, quatrième meilleur artiste des années 2000 par les lecteurs du magazine Rolling Stone6.\nLe groupe prend cause dans différentes œuvres caritatives et officie depuis ses débuts pour le commerce équitable aux côtés d'Oxfam international7 et d'Amnesty International8. Cet engagement les conduit à participer à des groupes caritatifs tels que Band Aid 20 et à jouer dans des concerts tels que le Live 8, le Fairplay7, le Sound Relief, le Hope for Haiti Now7 ou le Teenage Cancer Trust9. Chris Martin et Jonny Buckland se rencontrent en septembre 1996 à l’University College de Londres. Les deux amis, passionnés de musique, passent le reste de l'année universitaire à la planification d'un groupe, finalement appelé Pectoralz. Ils sont bientôt rejoints par Guy Berryman, qui étudie à la même université. Le groupe est formé en 1997. Un ami de Chris Martin, Phil Harvey, est engagé comme manager. Le 8 janvier 1998, ils recrutent un quatrième membre, Will Champion qui devient le batteur alors qu’il n'a jamais touché une batterie de sa vie. A peine engagé, Will Champion organise le premier concert du groupe au Laurel Tree de Londres. Pour ce concert donné le 16 janvier 1998, ils se baptisent provisoirement Starfish10.\nLe nom Coldplay est proposé par Tim Crompton11, un ami commun d'université qui a d'abord imaginé ce nom pour son propre groupe, avant de l'abandonner, le trouvant trop déprimant. Chris Martin et ses acolytes trouvent ce nom parfait et décident de le garder."
          },
          provider: provider.name
        }
      ])
    })

    withNockIt(
      'returns no artwork for artist without known image',
      async () => {
        expect(await provider.findArtistArtwork('A Common Ground')).toEqual([])
      }
    )

    withNockIt('returns no artwork for unknown artist', async () => {
      expect(await provider.findArtistArtwork('loremipsum')).toEqual([])
    })

    describe(`given no network`, () => {
      beforeAll(() => {
        if (!nock.isActive()) {
          nock.activate()
        }
        nock.disableNetConnect()
      })

      afterAll(() => nock.restore())

      it('returns no artwork', async () => {
        expect(await provider.findArtistArtwork('coldplay')).toEqual([])
      })

      it('throws error when calling too frequently', async () => {
        await expect(
          Promise.all(
            Array.from({ length: 50 }, () =>
              provider.findArtistArtwork('loremipsum')
            )
          )
        ).rejects.toThrow(TooManyRequestsError)
      })
    })
  })

  describe('findAlbumCover()', () => {
    it('returns nothing when not initialized', async () => {
      provider.init()
      expect(await provider.findAlbumCover('Parachutes')).toEqual([])
    })

    withNockIt('returns cover', async () => {
      expect(await provider.findAlbumCover('Parachutes')).toEqual([
        {
          cover:
            'https://www.theaudiodb.com/images/media/album/thumb/swxywp1367234202.jpg',
          provider: provider.name
        }
      ])
    })

    withNockIt('returns no cover for album without known image', async () => {
      expect(await provider.findAlbumCover('The Invisible Object')).toEqual([])
    })

    withNockIt('returns no cover for unknown artist', async () => {
      expect(await provider.findAlbumCover('loremipsum')).toEqual([])
    })

    describe(`given no network`, () => {
      beforeAll(() => {
        if (!nock.isActive()) {
          nock.activate()
        }
        nock.disableNetConnect()
      })

      afterAll(() => nock.restore())

      it('returns no cover', async () => {
        expect(await provider.findAlbumCover('Parachutes')).toEqual([])
      })

      it('throws error when calling too frequently', async () => {
        await expect(
          Promise.all(
            Array.from({ length: 50 }, () =>
              provider.findAlbumCover('loremipsum')
            )
          )
        ).rejects.toThrow(TooManyRequestsError)
      })
    })
  })
})
