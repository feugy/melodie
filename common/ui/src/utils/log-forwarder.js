import { sendLogs } from './connection'

let timeout
let sending = false
const batchLimit = 10
const logsKey = 'logs'
const scheduleInterval = 5000
const originals = {
  trace: console.log.bind(console),
  debug: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
}

export function configureLogForward() {
  clearTimeout(timeout)
  const logs = readSavedLogs()
  wrapConsoleMethod('trace', logs)
  wrapConsoleMethod('log', logs)
  wrapConsoleMethod('error', logs)
  wrapConsoleMethod('warn', logs)
  scheduleSend(logs)
}

function readSavedLogs() {
  let logs = []
  try {
    logs = JSON.parse(localStorage.getItem(logsKey) ?? '[]')
  } catch {
    localStorage.removeItem(logsKey)
  }
  return logs
}

function wrapConsoleMethod(name, logs) {
  const level = name === 'log' ? 'debug' : name
  console[name] = (...args) => {
    originals[level](...args)
    logs.push({ level, args, time: Date.now() })
    localStorage.setItem(logsKey, JSON.stringify(logs))
    if (logs.length >= batchLimit) {
      sendBatch(logs)
    }
  }
}

function scheduleSend(logs) {
  timeout = setTimeout(() => {
    scheduleSend(logs)
    sendBatch(logs)
  }, scheduleInterval)
}

async function sendBatch(logs) {
  if (logs.length && !sending) {
    try {
      sending = true
      let size = logs.length
      await sendLogs([...logs])
      logs.splice(0, size)
      localStorage.setItem(logsKey, JSON.stringify(logs))
    } catch {
      // ignore error
    } finally {
      sending = false
    }
  }
}
