'use strict'

jest.mock('electron', () => ({ app: { getPath: jest.fn() } }))
