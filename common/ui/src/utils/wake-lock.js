let wakeLock
let handleNum = 0

/**
 * Prevents navigator to fall asleep.
 * It can be called several times, and logs warning on errors
 * @async
 */
export async function stayAwake() {
  if (!wakeLock) {
    try {
      wakeLock = await navigator.wakeLock?.request('screen')
    } catch (err) {
      console.warn(`failed to acquire wake lock: ${err?.message}`)
    }
    handleNum = 0
  }
  handleNum++
}

/**
 * Release wake lock.
 * Only the last call to release function will operate
 * @async
 */
export async function releaseWakeLock() {
  handleNum--
  if (handleNum <= 0) {
    try {
      await wakeLock?.release()
    } catch (err) {
      console.warn(`failed to release wake lock: ${err?.message}`)
    }
    wakeLock = null
  }
}
