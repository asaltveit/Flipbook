import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extractImageUrl,
  createImage,
  createImagesForFrames,
} from '@/hooks/image-creation'

const subscribeMock = vi.fn()

vi.mock('@fal-ai/client', () => ({
  fal: {
    config: vi.fn(),
    subscribe: (...args) => subscribeMock(...args),
  },
}))

describe('extractImageUrl', () => {
  it('reads images[0].url shape', () => {
    expect(extractImageUrl({ images: [{ url: 'https://a.test/1.png' }] })).toBe(
      'https://a.test/1.png'
    )
  })

  it('reads image.url shape', () => {
    expect(extractImageUrl({ image: { url: 'https://a.test/2.png' } })).toBe(
      'https://a.test/2.png'
    )
  })

  it('reads top-level url string', () => {
    expect(extractImageUrl({ url: 'https://a.test/3.png' })).toBe('https://a.test/3.png')
  })

  it('throws on unexpected format', () => {
    expect(() => extractImageUrl({ foo: 'bar' })).toThrow('Unexpected Fal response format')
  })
})

describe('createImage', () => {
  beforeEach(() => {
    subscribeMock.mockReset()
  })

  it('returns url from fal subscribe result', async () => {
    subscribeMock.mockResolvedValue({ data: { images: [{ url: 'https://gen.test/x.png' }] } })

    const url = await createImage({
      prompt: 'draw a bunny',
      referenceImageUrl: 'https://ref.test/r.png',
    })

    expect(url).toBe('https://gen.test/x.png')
    expect(subscribeMock).toHaveBeenCalledOnce()
  })
})

describe('createImagesForFrames', () => {
  beforeEach(() => {
    subscribeMock.mockReset()
    subscribeMock.mockResolvedValue({ data: { url: 'https://gen.test/frame.png' } })
  })

  it('generates images sequentially and skips empty prompts', async () => {
    const onFrameStart = vi.fn()
    const onFrameComplete = vi.fn()

    const result = await createImagesForFrames({
      frames: [{ prompt: 'one' }, '', { prompt: 'three' }],
      referenceImageUrl: 'https://ref.test/r.png',
      onFrameStart,
      onFrameComplete,
    })

    expect(result).toHaveLength(2)
    expect(onFrameStart).toHaveBeenCalledTimes(2)
    expect(onFrameComplete).toHaveBeenCalledTimes(2)
    expect(subscribeMock).toHaveBeenCalledTimes(2)
  })

  it('propagates fal errors', async () => {
    subscribeMock.mockRejectedValueOnce(new Error('Fal down'))

    await expect(
      createImagesForFrames({
        frames: [{ prompt: 'fail' }],
        referenceImageUrl: 'https://ref.test/r.png',
      })
    ).rejects.toThrow('Fal down')
  })
})
