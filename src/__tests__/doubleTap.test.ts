import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act } from "@testing-library/react"
import { renderZoomPinch, firePointerDown, firePointerUp } from "./helpers"

describe("double-tap zoom", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const doubleTap = (
    container: HTMLElement,
    { clientX = 400, clientY = 300, delay = 100 } = {},
  ) => {
    // First tap
    firePointerDown(container, { clientX, clientY })
    firePointerUp({ clientX, clientY })

    // Wait, then second tap
    act(() => {
      vi.advanceTimersByTime(delay)
    })
    firePointerDown(container, { clientX, clientY })
    firePointerUp({ clientX, clientY })
  }

  it("zooms in on double-tap (toggle mode, default)", () => {
    const { result, container, unmount } = renderZoomPinch()

    doubleTap(container)

    // Animation starts — advance to complete
    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(2)
    unmount()
  })

  it("toggles back to zoom 1 on second double-tap", () => {
    const { result, container, unmount } = renderZoomPinch({
      initialViewState: { x: 0, y: 0, zoom: 2 },
    })

    doubleTap(container)

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(1)
    expect(result.current.view.x).toBe(0)
    expect(result.current.view.y).toBe(0)
    unmount()
  })

  it("zooms to tap point (not center)", () => {
    const { result, container, unmount } = renderZoomPinch()

    doubleTap(container, { clientX: 200, clientY: 150 })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    // Zoom 1→2 at point (200,150):
    // s = 2/1 = 2, x = 200 - (200 - 0)*2 = -200, y = 150 - (150 - 0)*2 = -150
    expect(result.current.view.zoom).toBe(2)
    expect(result.current.view.x).toBe(-200)
    expect(result.current.view.y).toBe(-150)
    unmount()
  })

  it("uses 'zoomIn' mode", () => {
    const { result, container, unmount } = renderZoomPinch({
      doubleTap: { mode: "zoomIn", step: 3 },
    })

    doubleTap(container)

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(3)
    unmount()
  })

  it("uses 'reset' mode", () => {
    const { result, container, unmount } = renderZoomPinch({
      initialViewState: { x: 100, y: 200, zoom: 3 },
      doubleTap: { mode: "reset" },
    })

    doubleTap(container)

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view).toEqual({ x: 0, y: 0, zoom: 1, rotation: 0 })
    unmount()
  })

  it("disabled when doubleTap is false", () => {
    const { result, container, unmount } = renderZoomPinch({
      doubleTap: false,
    })

    doubleTap(container)

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(1)
    unmount()
  })

  it("disabled when doubleTap.enabled is false", () => {
    const { result, container, unmount } = renderZoomPinch({
      doubleTap: { enabled: false },
    })

    doubleTap(container)

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(1)
    unmount()
  })

  it("does not trigger on slow taps (>300ms apart)", () => {
    const { result, container, unmount } = renderZoomPinch()

    doubleTap(container, { delay: 350 })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(1)
    unmount()
  })

  it("does not trigger if pointer moved (drag)", () => {
    const { result, container, unmount } = renderZoomPinch()

    // First tap — no move
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerUp({ clientX: 400, clientY: 300 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Second "tap" but with pointer move (simulating drag)
    // We need to dispatch a pointermove between down and up to set dragMoved
    firePointerDown(container, { clientX: 400, clientY: 300 })

    // Simulate move via window pointermove
    const moveEvent = new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 450,
      clientY: 350,
    })
    act(() => {
      window.dispatchEvent(moveEvent)
    })

    firePointerUp({ clientX: 450, clientY: 350 })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    // Should NOT have double-tap zoomed (moved pointer = drag)
    expect(result.current.view.zoom).toBe(1)
    unmount()
  })

  it("respects custom step", () => {
    const { result, container, unmount } = renderZoomPinch({
      doubleTap: { step: 4 },
    })

    doubleTap(container)

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.view.zoom).toBe(4)
    unmount()
  })
})
