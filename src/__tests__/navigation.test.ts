import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act } from "@testing-library/react"
import { renderZoomPinch } from "./helpers"

// Container is 800x600 (see helpers.ts)

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe("panTo", () => {
  it("pans to center a content-space point in the viewport", () => {
    const { result } = renderZoomPinch()
    // panTo(100, 100) should center point (100,100) in the 800x600 container
    act(() => result.current.panTo(100, 100))
    // x = 800/2 - 100*1 = 300, y = 600/2 - 100*1 = 200
    expect(result.current.view.x).toBe(300)
    expect(result.current.view.y).toBe(200)
    expect(result.current.view.zoom).toBe(1)
  })

  it("accounts for current zoom level", () => {
    const { result } = renderZoomPinch({ initialViewState: { x: 0, y: 0, zoom: 2 } })
    act(() => result.current.panTo(100, 50))
    // x = 400 - 100*2 = 200, y = 300 - 50*2 = 200
    expect(result.current.view.x).toBe(200)
    expect(result.current.view.y).toBe(200)
    expect(result.current.view.zoom).toBe(2)
  })

  it("supports animated transition", () => {
    const { result } = renderZoomPinch()
    act(() => result.current.panTo(100, 100, { animate: true, duration: 200 }))
    // Mid-animation: not yet at target
    act(() => vi.advanceTimersByTime(50))
    expect(result.current.view.x).not.toBe(300)
    // After full duration
    act(() => vi.advanceTimersByTime(200))
    expect(result.current.view.x).toBeCloseTo(300, 0)
    expect(result.current.view.y).toBeCloseTo(200, 0)
  })
})

describe("panBy", () => {
  it("pans by a relative delta", () => {
    const { result } = renderZoomPinch()
    // Initial view is {0, 0, 1}
    act(() => result.current.panBy(50, -30))
    expect(result.current.view.x).toBe(50)
    expect(result.current.view.y).toBe(-30)
    expect(result.current.view.zoom).toBe(1)
  })

  it("accumulates multiple panBy calls", () => {
    const { result } = renderZoomPinch()
    act(() => result.current.panBy(100, 0))
    act(() => result.current.panBy(-50, 200))
    expect(result.current.view.x).toBe(50)
    expect(result.current.view.y).toBe(200)
  })

  it("supports animated transition", () => {
    const { result } = renderZoomPinch()
    act(() => result.current.panBy(100, 100, { animate: true, duration: 200 }))
    act(() => vi.advanceTimersByTime(250))
    expect(result.current.view.x).toBeCloseTo(100, 0)
    expect(result.current.view.y).toBeCloseTo(100, 0)
  })
})

describe("zoomTo", () => {
  it("zooms to a specific level centered on container", () => {
    const { result } = renderZoomPinch()
    act(() => result.current.zoomTo(2))
    expect(result.current.view.zoom).toBe(2)
    // Centered zoom from {0,0,1}: x = 400 - (400-0)*(2/1) = -400
    expect(result.current.view.x).toBe(-400)
    expect(result.current.view.y).toBe(-300)
  })

  it("zooms centered on a content-space point", () => {
    const { result } = renderZoomPinch()
    act(() => result.current.zoomTo(2, { x: 100, y: 100 }))
    // x = 400 - 100*2 = 200, y = 300 - 100*2 = 100
    expect(result.current.view.x).toBe(200)
    expect(result.current.view.y).toBe(100)
    expect(result.current.view.zoom).toBe(2)
  })

  it("clamps zoom to minScale/maxScale", () => {
    const { result } = renderZoomPinch({ minScale: 0.5, maxScale: 3 })
    act(() => result.current.zoomTo(10))
    expect(result.current.view.zoom).toBe(3)
    act(() => result.current.zoomTo(0.1))
    expect(result.current.view.zoom).toBe(0.5)
  })

  it("supports animated transition", () => {
    const { result } = renderZoomPinch()
    act(() => result.current.zoomTo(3, undefined, { animate: true, duration: 200 }))
    act(() => vi.advanceTimersByTime(250))
    expect(result.current.view.zoom).toBeCloseTo(3, 0)
  })
})

describe("fitToRect", () => {
  it("fits a content rectangle into the viewport", () => {
    const { result } = renderZoomPinch()
    // Fit a 400x300 rect at (0,0) into 800x600 container → zoom=2
    act(() => result.current.fitToRect({ x: 0, y: 0, width: 400, height: 300 }))
    expect(result.current.view.zoom).toBe(2)
    // Center of rect: (200, 150). x = 400 - 200*2 = 0, y = 300 - 150*2 = 0
    expect(result.current.view.x).toBe(0)
    expect(result.current.view.y).toBe(0)
  })

  it("fits a wide rectangle (constrained by width)", () => {
    const { result } = renderZoomPinch()
    // 1600x300 rect → min(800/1600, 600/300) = min(0.5, 2) = 0.5
    act(() => result.current.fitToRect({ x: 0, y: 0, width: 1600, height: 300 }))
    expect(result.current.view.zoom).toBe(0.5)
  })

  it("fits a tall rectangle (constrained by height)", () => {
    const { result } = renderZoomPinch()
    // 200x1200 rect → min(800/200, 600/1200) = min(4, 0.5) = 0.5
    act(() => result.current.fitToRect({ x: 0, y: 0, width: 200, height: 1200 }))
    expect(result.current.view.zoom).toBe(0.5)
  })

  it("respects padding option", () => {
    const { result } = renderZoomPinch()
    // 800x600 container, padding=100 → effective 600x400
    // 400x200 rect → min(600/400, 400/200) = min(1.5, 2) = 1.5
    act(() => result.current.fitToRect({ x: 0, y: 0, width: 400, height: 200 }, { padding: 100 }))
    expect(result.current.view.zoom).toBe(1.5)
  })

  it("clamps zoom to minScale/maxScale", () => {
    const { result } = renderZoomPinch({ maxScale: 3 })
    // Tiny rect would yield huge zoom, but clamped to 3
    act(() => result.current.fitToRect({ x: 0, y: 0, width: 10, height: 10 }))
    expect(result.current.view.zoom).toBe(3)
  })

  it("centers the rect in the viewport", () => {
    const { result } = renderZoomPinch()
    // Rect at (100, 200) size 400x300 → zoom=2, center=(300, 350)
    // x = 400 - 300*2 = -200, y = 300 - 350*2 = -400
    act(() => result.current.fitToRect({ x: 100, y: 200, width: 400, height: 300 }))
    expect(result.current.view.zoom).toBe(2)
    expect(result.current.view.x).toBe(-200)
    expect(result.current.view.y).toBe(-400)
  })

  it("supports animated transition", () => {
    const { result } = renderZoomPinch()
    act(() =>
      result.current.fitToRect(
        { x: 0, y: 0, width: 400, height: 300 },
        { animate: true, duration: 200 },
      ),
    )
    act(() => vi.advanceTimersByTime(250))
    expect(result.current.view.zoom).toBeCloseTo(2, 0)
  })
})
