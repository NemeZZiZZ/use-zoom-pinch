import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act } from "@testing-library/react"
import { renderZoomPinch, fireWheel } from "./helpers"
import { linear } from "../easings"

describe("animated transitions", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("setView with animate interpolates over time", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.setView(
        { x: 100, y: 200, zoom: 2 },
        { animate: true, duration: 300, easing: linear },
      )
    })

    // After first RAF frame (~16ms), should be partially interpolated
    act(() => {
      vi.advanceTimersByTime(150)
    })

    // Mid-animation: values should be between start and target
    expect(result.current.view.x).toBeGreaterThan(0)
    expect(result.current.view.x).toBeLessThan(100)

    // Complete animation
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.view).toMatchObject({ x: 100, y: 200, zoom: 2 })
    unmount()
  })

  it("setView without animate is instant", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.setView({ x: 100, y: 200, zoom: 2 })
    })

    expect(result.current.view).toMatchObject({ x: 100, y: 200, zoom: 2 })
    unmount()
  })

  it("gesture cancels running animation", () => {
    const { result, container, unmount } = renderZoomPinch()

    act(() => {
      result.current.setView(
        { x: 1000, y: 1000, zoom: 5 },
        { animate: true, duration: 1000, easing: linear },
      )
    })

    // Partially advance
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Gesture should cancel animation
    fireWheel(container, { deltaY: 10.5, deltaMode: 0 })

    // Advance more — animation should NOT continue
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Should NOT have reached 1000 — animation was cancelled
    expect(result.current.view.x).toBeLessThan(500)
    unmount()
  })

  it("second animation cancels the first", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.setView(
        { x: 1000, y: 0, zoom: 1 },
        { animate: true, duration: 500, easing: linear },
      )
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Start second animation to different target
    act(() => {
      result.current.setView(
        { x: -500, y: 0, zoom: 1 },
        { animate: true, duration: 500, easing: linear },
      )
    })

    // Complete
    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.view.x).toBe(-500)
    unmount()
  })

  it("centerZoom with animate", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.centerZoom(2, { animate: true, duration: 300, easing: linear })
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(2)
    unmount()
  })

  it("resetView with animate", () => {
    const { result, unmount } = renderZoomPinch({
      initialViewState: { x: 100, y: 200, zoom: 3 },
    })

    act(() => {
      result.current.resetView({ animate: true, duration: 300, easing: linear })
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view).toEqual({ x: 0, y: 0, zoom: 1, rotation: 0 })
    unmount()
  })

  it("unmount during animation does not throw", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.setView({ x: 100, y: 200, zoom: 2 }, { animate: true, duration: 1000 })
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Should not throw
    expect(() => unmount()).not.toThrow()
  })
})

describe("easing functions", () => {
  it("linear returns t", () => {
    expect(linear(0)).toBe(0)
    expect(linear(0.5)).toBe(0.5)
    expect(linear(1)).toBe(1)
  })

  it("easeOut starts fast, ends slow", async () => {
    const { easeOut } = await import("../easings")
    expect(easeOut(0)).toBe(0)
    expect(easeOut(1)).toBe(1)
    // At t=0.5, easeOut should be > 0.5 (faster start)
    expect(easeOut(0.5)).toBeGreaterThan(0.5)
  })

  it("easeInOut is symmetric around 0.5", async () => {
    const { easeInOut } = await import("../easings")
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5)
  })
})

describe("zoomIn / zoomOut", () => {
  it("zoomIn increases zoom by default step 1.5x", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.zoomIn()
    })

    expect(result.current.view.zoom).toBe(1.5)
    unmount()
  })

  it("zoomOut decreases zoom by default step 1.5x", () => {
    const { result, unmount } = renderZoomPinch({
      initialViewState: { x: 0, y: 0, zoom: 3 },
    })

    act(() => {
      result.current.zoomOut()
    })

    expect(result.current.view.zoom).toBe(2)
    unmount()
  })

  it("zoomIn with custom step", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.zoomIn(2)
    })

    expect(result.current.view.zoom).toBe(2)
    unmount()
  })

  it("zoomIn with animation", () => {
    vi.useFakeTimers()
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.zoomIn(2, { animate: true, duration: 300, easing: linear })
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(2)
    unmount()
    vi.useRealTimers()
  })
})

describe("zoomToElement", () => {
  it("centers and zooms to a child element", () => {
    const { result, container, unmount } = renderZoomPinch()

    // Create a child element inside the container
    const child = document.createElement("div")
    container.appendChild(child)

    // Mock getBoundingClientRect for child — positioned at (100, 100) relative to container, 50x50
    child.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      left: 100,
      top: 100,
      right: 150,
      bottom: 150,
      width: 50,
      height: 50,
      toJSON() {
        return this
      },
    })

    act(() => {
      result.current.zoomToElement(child, 2)
    })

    // Element is at content-space (100, 100), size 50x50 (at zoom 1)
    // Center of element in content space: (125, 125)
    // Target: container center (400, 300) should align with content center * zoom
    // x = 400 - 125 * 2 = 150
    // y = 300 - 125 * 2 = 50
    expect(result.current.view.zoom).toBe(2)
    expect(result.current.view.x).toBe(150)
    expect(result.current.view.y).toBe(50)

    child.remove()
    unmount()
  })
})
