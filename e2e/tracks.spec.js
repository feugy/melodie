'use strict'

const { join, basename, extname } = require('path')
const { Application } = require('spectron')
const electronPath = require('electron')
const dialogAddon = require('spectron-dialog-addon').default
const faker = require('faker')

describe.skip('Track tests', () => {
  var app = new Application({
    path: electronPath,
    args: [join(__dirname, '..')]
  })
  dialogAddon.apply(app)

  beforeAll(async () => app.start())
  afterAll(async () => (app && app.isRunning() ? app.stop() : undefined))

  it('has the right title', async () => {
    expect(await app.client.getTitle()).toEqual('Mélodie')
  })

  it('can load files', async () => {
    const files = [faker.system.fileName(), faker.system.fileName()]
    dialogAddon.mock([
      { method: 'showOpenDialog', value: { filePaths: files } }
    ])

    await app.client.element('button').click()

    expect(await app.client.$('ol').getText()).toEqual(
      files.map(n => basename(n, extname(n))).join('\n')
    )
  })
})
