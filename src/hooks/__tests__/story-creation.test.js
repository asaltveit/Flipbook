import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import useAnthropicFlipbookPrompts from '@/hooks/story-creation'

describe('useAnthropicFlipbookPrompts', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ANTHROPIC_KEY', 'test-key')
  })

  it('throws when API key is missing', async () => {
    vi.stubEnv('VITE_ANTHROPIC_KEY', '')
    const { result } = renderHook(() => useAnthropicFlipbookPrompts())

    await expect(
      act(async () => {
        await result.current.generatePrompts({ storyIdea: 'A bunny story' })
      })
    ).rejects.toThrow('Anthropic API key is required')
  })

  it('parses JSON from output field', async () => {
    const payload = {
      story: 'Once upon a time',
      frames: [{ prompt: 'frame one', caption: 'One' }],
      prompts: ['frame one'],
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ output: JSON.stringify(payload) }),
      })
    )

    const { result } = renderHook(() => useAnthropicFlipbookPrompts())

    let response
    await act(async () => {
      response = await result.current.generatePrompts({ storyIdea: 'bunny' })
    })

    expect(response.data).toEqual(payload)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(payload)
  })

  it('returns error on HTTP failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'server error',
      })
    )

    const { result } = renderHook(() => useAnthropicFlipbookPrompts())

    let response
    await act(async () => {
      response = await result.current.generatePrompts({ storyIdea: 'bunny' })
    })

    expect(response.error).toBeTruthy()
    expect(result.current.error).toBeTruthy()
  })

  it('extracts JSON embedded in assistant text', async () => {
    const payload = { story: 'x', frames: [], prompts: [] }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ text: `Here you go:\n${JSON.stringify(payload)}` }],
        }),
      })
    )

    const { result } = renderHook(() => useAnthropicFlipbookPrompts())

    let response
    await act(async () => {
      response = await result.current.generatePrompts({ storyIdea: 'bunny' })
    })

    expect(response.data).toEqual(payload)
  })

  it('aborts in-flight request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      )
    )

    const { result } = renderHook(() => useAnthropicFlipbookPrompts())

    act(() => {
      result.current.generatePrompts({ storyIdea: 'bunny' })
    })

    act(() => {
      result.current.abort()
    })

    expect(result.current.loading).toBe(true)
  })
})
