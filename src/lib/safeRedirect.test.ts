import { safeNextPath } from './safeRedirect'

test('keeps internal paths with their query', () => {
  expect(safeNextPath('/wallets/123?tab=moved')).toBe('/wallets/123?tab=moved')
})

test.each([
  ['https://evil.example'],
  ['//evil.example'],
  ['/\\evil.example'],
  ['javascript:alert(1)'],
  [''],
  [null],
])('falls back to the dashboard for unsafe next=%s', (next) => {
  expect(safeNextPath(next)).toBe('/')
})
