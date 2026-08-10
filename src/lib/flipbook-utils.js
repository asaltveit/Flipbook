export function getImageForPage(images, pageIndex) {
  return images.find((img) => img.pageNumber === pageIndex) || images[pageIndex]
}

export function renumberImages(images) {
  return images.map((img, idx) => ({
    ...img,
    pageNumber: idx,
  }))
}

export function adjustCurrentPageAfterDelete(currentPage, remainingCount) {
  if (remainingCount === 0) return 0
  if (currentPage >= remainingCount) return remainingCount - 1
  return currentPage
}

export function capImagesAt30(existingImages, newImages, max = 30) {
  return [...existingImages, ...newImages].slice(0, max)
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
