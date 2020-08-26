'use strict'

const osLocale = require('os-locale')

exports.getSystemLocale = async function () {
  return (await osLocale()).slice(0, 2)
}
