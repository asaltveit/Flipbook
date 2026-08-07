import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

describe('ConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete?"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls confirm and cancel handlers', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="Remove page?"
        message="This cannot be undone."
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep' }))
    expect(onCancel).toHaveBeenCalledOnce()

    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(2)

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('traps tab focus within dialog', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmDialog
        open
        title="Remove page?"
        message="Confirm removal."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    const buttons = screen.getAllByRole('button')
    await waitFor(() => expect(buttons[0]).toHaveFocus())
    await user.tab()
    expect(buttons[1]).toHaveFocus()
    await user.tab()
    expect(buttons[0]).toHaveFocus()
  })
})
