import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

test('a signed-out visitor lands on sign in', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/sign-in\?next=%2F$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome back!' })).toBeVisible()
})

for (const [path, title] of [
  ['/sign-in', 'Welcome back!'],
  ['/sign-up', 'Create an account'],
  ['/forgot-password', 'Reset your password'],
  ['/verify-email', 'Please check your email'],
] as const) {
  test(`${title} has no WCAG 2.2 AA violations, including after a failed submit`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
    expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])

    const submit = page.locator('form button[type="submit"]')
    if ((await submit.count()) > 0) {
      await submit.click()
      expect((await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()).violations).toEqual([])
    }
  })
}

test('the sign-in form works with the keyboard alone', async ({ page }) => {
  await page.goto('/sign-in')
  const password = page.getByLabel('Password', { exact: true })
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome back!' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Email', { exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(password).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Show password' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(password).toHaveAttribute('type', 'text')
})

test('unknown pages show a helpful not-found page', async ({ page }) => {
  await page.goto('/does-not-exist')
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to your dashboard' })).toBeVisible()
})
