import { chromium } from '@playwright/test'

const url = process.argv[2] ?? 'http://localhost:4173/sign-in'
const runs = Number(process.argv[3] ?? 3)

const NETWORK = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 }
const CPU_SLOWDOWN = 4

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const browser = await chromium.launch()
const results = []

for (let i = 0; i < runs; i++) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', NETWORK)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN })

  let jsBytes = 0
  cdp.on('Network.loadingFinished', (e) => {
    jsBytes += e.encodedDataLength
  })

  await page.addInitScript(() => {
    window.__lcp = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__lcp = entry.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { level: 1 }).waitFor()
  await page.waitForTimeout(500)

  const metrics = await page.evaluate(() => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0
    const scripts = performance
      .getEntriesByType('resource')
      .filter((r) => r.initiatorType === 'script' || r.name.endsWith('.js'))
      .map((r) => r.encodedBodySize)
    return { fcp, lcp: window.__lcp, scriptCount: scripts.length, scriptBytes: scripts.reduce((a, b) => a + b, 0) }
  })
  results.push({ ...metrics, transferBytes: jsBytes })
  await context.close()
}
await browser.close()

const summary = {
  url,
  runs,
  conditions: `150 ms RTT, 1.6 Mbps down, CPU ${CPU_SLOWDOWN}x slower, cache off`,
  medianFcpMs: Math.round(median(results.map((r) => r.fcp))),
  medianLcpMs: Math.round(median(results.map((r) => r.lcp))),
  scriptFiles: median(results.map((r) => r.scriptCount)),
  scriptKB: Math.round(median(results.map((r) => r.scriptBytes)) / 1024),
  totalTransferKB: Math.round(median(results.map((r) => r.transferBytes)) / 1024),
  each: results.map((r) => ({ fcp: Math.round(r.fcp), lcp: Math.round(r.lcp) })),
}
console.log(JSON.stringify(summary, null, 2))
