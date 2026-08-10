import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FlipBookViewer from '@/components/FlipbookViewer'

vi.mock('@/hooks/story-creation', () => ({
  default: () => ({
    generatePrompts: vi.fn(),
    loading: false,
    error: null,
    data: null,
    abort: vi.fn(),
  }),
}))

vi.mock('@/hooks/image-creation', () => ({
  createImagesForFrames: vi.fn(),
}))

describe('FlipBookViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_FAL_KEY', 'test-fal-key')
    vi.stubEnv('VITE_ANTHROPIC_KEY', 'test-anthropic-key')
    window.alert = vi.fn()
  })

  it('renders skip link and main landmark', () => {
    render(<FlipBookViewer />)
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument()
    expect(document.getElementById('main-content')).toBeInTheDocument()
  })

  it('uploads an image and updates page count', async () => {
    render(<FlipBookViewer />)
    const input = document.querySelector('input[type="file"]')
    const file = new File(['image'], 'drawing.png', { type: 'image/png' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getAllByText(/1 page\(s\)/).length).toBeGreaterThanOrEqual(1)
    })
  })

  it('disables generate without prompt and images', () => {
    render(<FlipBookViewer />)
    expect(screen.getByRole('button', { name: /Run Generation/i })).toBeDisabled()
  })

  it('shows confirm dialog before deleting a page', async () => {
    const user = userEvent.setup()
    render(<FlipBookViewer />)

    const input = document.querySelector('input[type="file"]')
    const file = new File(['image'], 'drawing.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByLabelText('Delete page 1')).toBeInTheDocument())

    await user.click(screen.getByLabelText('Delete page 1'))
    expect(screen.getByRole('dialog', { name: 'Remove this page?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Keep page' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText(/1 page\(s\)/).length).toBeGreaterThanOrEqual(1)
  })

  it('validates generate prerequisites', async () => {
    const user = userEvent.setup()
    render(<FlipBookViewer />)

    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    })

    await waitFor(() => expect(screen.getByLabelText(/Prompt/i)).toBeEnabled())

    const generateBtn = screen.getByRole('button', { name: /Run Generation/i })
    expect(generateBtn).toBeDisabled()

    await user.type(screen.getByLabelText(/Prompt/i), 'A bunny adventure')
    expect(generateBtn).toBeEnabled()
  })
})
