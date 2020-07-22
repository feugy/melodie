'use strict'

jest.mock('electron', () => ({ app: { getAppPath: jest.fn() } }))
