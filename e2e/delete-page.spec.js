import { test, expect } from '@playwright/test'
import { uploadSampleImage, expectPageCount } from './helpers.js'

test.describe('Delete page flow', () => {
  test('confirms before removing a page', async ({ page }) => {
    await page.goto('/')
    await uploadSampleImage(page)
    await expectPageCount(page, 1)

    await page.getByRole('button', { name: 'Delete page 1' }).click()
    await expect(page.getByRole('dialog', { name: 'Remove this page?' })).toBeVisible()

    await page.getByRole('button', { name: 'Keep page' }).click()
    await expectPageCount(page, 1)

    await page.getByRole('button', { name: 'Delete page 1' }).click()
    await page.getByRole('button', { name: 'Remove page' }).click()
    await expect(page.getByText('No Images Yet')).toBeVisible()
  })
})
