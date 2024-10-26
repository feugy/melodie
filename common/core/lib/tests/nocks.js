import fs from 'fs-extra'
import nock from 'nock'
import { dirname, resolve } from 'path'
import * as stackTrace from 'stack-trace'
import { afterAll, beforeAll, describe, it } from 'vitest'

const isMocked = !('REAL_NETWORK' in process.env)
const updateMocks = 'UPDATE_NOCKS' in process.env

export const withNockIt = (name, test) => {
  const mockFile = resolve(
    dirname(stackTrace.get()[1].getFileName()),
    '__nocks__',
    `${name.replace(/[\s'\\/"]/g, '_')}.json`
  )

  describe(`given ${isMocked ? 'mocked' : 'real'} network`, () => {
    beforeAll(async () => {
      await fs.ensureFile(mockFile)
      if (!isMocked) {
        if (nock.isActive()) {
          nock.restore()
        }
        nock.recorder.clear()
        nock.recorder.rec({
          dont_print: true,
          output_objects: true
        })
      } else {
        if (!nock.isActive()) {
          nock.activate()
        }
        nock.cleanAll()
        nock.disableNetConnect()
        nock.load(mockFile)
      }
    })

    // eslint-disable-next-line vitest/valid-title, vitest/expect-expect
    it(name, async () => {
      await test()
      // only update on success
      if (!isMocked && updateMocks) {
        const mocks = nock.recorder.play()
        await fs.writeFile(mockFile, JSON.stringify(mocks, null, 2))
      }
    })

    afterAll(() => {
      nock.cleanAll()
      nock.restore()
    })
  })
}
