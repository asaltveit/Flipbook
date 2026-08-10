import { describe, it, expect } from 'vitest'
import {
  getImageForPage,
  renumberImages,
  adjustCurrentPageAfterDelete,
  capImagesAt30,
} from '@/lib/flipbook-utils'

describe('flipbook-utils', () => {
  const images = [
    { id: 'a', pageNumber: 0, imageUrl: 'a.png' },
    { id: 'b', pageNumber: 1, imageUrl: 'b.png' },
    { id: 'c', pageNumber: 2, imageUrl: 'c.png' },
  ]

  it('getImageForPage finds by pageNumber then index', () => {
    expect(getImageForPage(images, 1)?.id).toBe('b')
    expect(getImageForPage(images, 99)).toBeUndefined()
  })

  it('renumberImages assigns sequential page numbers', () => {
    expect(renumberImages(images).map((i) => i.pageNumber)).toEqual([0, 1, 2])
  })

  it('adjustCurrentPageAfterDelete clamps page index', () => {
    expect(adjustCurrentPageAfterDelete(2, 0)).toBe(0)
    expect(adjustCurrentPageAfterDelete(4, 3)).toBe(2)
    expect(adjustCurrentPageAfterDelete(1, 5)).toBe(1)
  })

  it('capImagesAt30 limits combined image count', () => {
    const existing = Array.from({ length: 29 }, (_, i) => ({ id: String(i) }))
    const incoming = [{ id: 'new1' }, { id: 'new2' }, { id: 'new3' }]
    expect(capImagesAt30(existing, incoming)).toHaveLength(30)
  })
})
