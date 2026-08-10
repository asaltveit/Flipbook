import { test, expect } from '@playwright/test'
import { uploadSampleImage, expectPageCount } from './helpers.js'

test.describe('Watch playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await uploadSampleImage(page)
    await expectPageCount(page, 1)
  })

  test('navigates pages and adjusts flip speed', async ({ page }) => {
    await expect(page.getByText('Page 1 of 1')).toBeVisible()

    const speedSlider = page.getByLabel('Flip Speed')
    await speedSlider.fill('500')
    await expect(speedSlider).toHaveValue('500')

    await page.getByRole('button', { name: 'Reset to first page' }).click()
    await expect(page.getByText('Page 1 of 1')).toBeVisible()
  })

  test('play button toggles auto-play state', async ({ page }) => {
    const playButton = page.getByRole('button', { name: 'Start auto-play' })
    await playButton.click()
    await expect(page.getByRole('button', { name: 'Pause auto-play' })).toBeVisible()
  })
})
