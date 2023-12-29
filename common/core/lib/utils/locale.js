import { osLocale } from 'os-locale'

/**
 * Reads system locale
 * @async
 * @returns {string} the first two characters of the ISO 639-1 language code
 * @see https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 */
export const getSystemLocale = async function () {
  return (await osLocale()).slice(0, 2)
}
