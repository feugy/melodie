import { send } from './connection'

let timeout
let sending = false
const batchLimit = 10
const logsKey = 'logs'
const scheduleInterval = 5000

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
  const original = console[name]
  console[name] = (...args) => {
    original.apply(console, args)
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
      await send({ logs: [...logs] })
      localStorage.removeItem(logsKey)
      logs.splice(0)
    } catch {
      // ignore error
    } finally {
      sending = false
    }
  }
}
