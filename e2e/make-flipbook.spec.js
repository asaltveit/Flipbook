import { test, expect } from '@playwright/test'
import { mockExternalApis, uploadSampleImage, expectPageCount } from './helpers.js'

test.describe('Make flipbook flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalApis(page)
    await page.goto('/')
  })

  test('upload, enter prompt, and generate', async ({ page }) => {
    await uploadSampleImage(page)
    await expectPageCount(page, 1)

    await page.getByLabel('Prompt').fill('A bunny discovers a giant carrot')
    await page.getByRole('button', { name: /Run Generation/i }).click()

    await expect(page.getByText(/Generating/i)).toBeVisible()
  })
})
