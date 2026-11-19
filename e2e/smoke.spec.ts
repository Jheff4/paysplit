import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test('a signed-out visitor lands on sign in with no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/sign-in\?next=%2F$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  expect(results.violations).toEqual([])
})

test('unknown pages show a helpful not-found page', async ({ page }) => {
  await page.goto('/does-not-exist')
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to your dashboard' })).toBeVisible()
})
