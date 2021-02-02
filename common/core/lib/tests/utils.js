exports.sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

exports.waitFor = async (fn, timeout = 5000, interval = 200) => {
  const now = Date.now()
  let lastErr = null
  do {
    try {
      return fn()
    } catch (err) {
      lastErr = err
      await exports.sleep(interval)
    }
  } while (Date.now() - now < timeout)
  throw lastErr
}
