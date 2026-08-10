import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { uploadSampleImage, expectPageCount } from './helpers.js'

test.describe('Accessibility', () => {
  test('Make view passes axe (serious/critical)', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const violations = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    )
    expect(violations).toEqual([])
  })

  test('Watch view with content passes axe (serious/critical)', async ({ page }) => {
    await page.goto('/')
    await uploadSampleImage(page)
    await expectPageCount(page, 1)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const violations = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    )
    expect(violations).toEqual([])
  })

  test('keyboard navigation reaches main controls', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })
})
