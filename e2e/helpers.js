import { expect } from '@playwright/test'

const STORY_PAYLOAD = {
  story: 'A bunny finds a carrot.',
  frames: [
    {
      event_id: 'E1',
      frame_index: 0,
      caption: 'Discovery',
      prompt: 'A hand-drawn bunny in a garden',
    },
  ],
  prompts: ['A hand-drawn bunny in a garden'],
}

export async function mockExternalApis(page) {
  await page.route('https://api.anthropic.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ output: JSON.stringify(STORY_PAYLOAD) }),
    })
  })

  await page.route('**/*fal.run/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        images: [{ url: 'https://example.com/generated.png' }],
      }),
    })
  })
}

export async function uploadSampleImage(page) {
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles('src/test/fixtures/sample.png')
}

export async function expectPageCount(page, count) {
  await expect(page.locator('.a11y-helper', { hasText: `${count} page(s)` })).toBeVisible()
}
