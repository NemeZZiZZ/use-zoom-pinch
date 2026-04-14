import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act } from "@testing-library/react"
import { renderZoomPinch, firePointerDown, firePointerMove, firePointerUp } from "./helpers"

describe("inertia (pan momentum)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("continues moving after fast drag release", () => {
    const { result, container, unmount } = renderZoomPinch()

    firePointerDown(container, { clientX: 200, clientY: 200 })

    // Simulate fast drag with time gaps so velocity is calculated
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 220, clientY: 200 })
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 250, clientY: 200 })
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 290, clientY: 200 })
    firePointerUp({ clientX: 290, clientY: 200 })

    const xAfterDrag = result.current.view.x

    // Advance frames — inertia should continue movement
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.view.x).toBeGreaterThan(xAfterDrag)
    unmount()
  })

  it("decays and stops", () => {
    const { result, container, unmount } = renderZoomPinch()

    firePointerDown(container, { clientX: 200, clientY: 200 })
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 250, clientY: 200 })
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 300, clientY: 200 })
    firePointerUp({ clientX: 300, clientY: 200 })

    // Advance a lot of frames — should eventually stop
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    const xFinal = result.current.view.x

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should not change after settling
    expect(result.current.view.x).toBe(xFinal)
    unmount()
  })

  it("is cancelled by new gesture", () => {
    const { result, container, unmount } = renderZoomPinch()

    firePointerDown(container, { clientX: 200, clientY: 200 })
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 250, clientY: 200 })
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 300, clientY: 200 })
    firePointerUp({ clientX: 300, clientY: 200 })

    // Let inertia run briefly
    act(() => {
      vi.advanceTimersByTime(50)
    })

    const xMid = result.current.view.x

    // New gesture cancels inertia
    firePointerDown(container, { clientX: 500, clientY: 200 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Should not have continued inertia movement (only new drag if any)
    // Since we didn't move after second pointerdown, x should stay near xMid
    firePointerUp({ clientX: 500, clientY: 200 })

    // The x shouldn't have drifted far from the mid-inertia point
    expect(Math.abs(result.current.view.x - xMid)).toBeLessThan(5)
    unmount()
  })

  it("disabled when inertia is false", () => {
    const { result, container, unmount } = renderZoomPinch({
      inertia: false,
    })

    firePointerDown(container, { clientX: 200, clientY: 200 })
    firePointerMove({ clientX: 250, clientY: 200 })
    firePointerMove({ clientX: 300, clientY: 200 })
    firePointerUp({ clientX: 300, clientY: 200 })

    const xAfterDrag = result.current.view.x

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // No inertia movement
    expect(result.current.view.x).toBe(xAfterDrag)
    unmount()
  })

  it("disabled when inertia.enabled is false", () => {
    const { result, container, unmount } = renderZoomPinch({
      inertia: { enabled: false },
    })

    firePointerDown(container, { clientX: 200, clientY: 200 })
    firePointerMove({ clientX: 250, clientY: 200 })
    firePointerMove({ clientX: 300, clientY: 200 })
    firePointerUp({ clientX: 300, clientY: 200 })

    const xAfterDrag = result.current.view.x

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.view.x).toBe(xAfterDrag)
    unmount()
  })

  it("respects custom friction", () => {
    // Low friction = faster decay
    const {
      result: resultHigh,
      container: c1,
      unmount: u1,
    } = renderZoomPinch({
      inertia: { friction: 0.99 },
    })
    const {
      result: resultLow,
      container: c2,
      unmount: u2,
    } = renderZoomPinch({
      inertia: { friction: 0.5 },
    })

    // Same drag on both
    for (const container of [c1, c2]) {
      firePointerDown(container, { clientX: 200, clientY: 200 })
      act(() => vi.advanceTimersByTime(16))
      firePointerMove({ clientX: 250, clientY: 200 })
      act(() => vi.advanceTimersByTime(16))
      firePointerMove({ clientX: 300, clientY: 200 })
      firePointerUp({ clientX: 300, clientY: 200 })
    }

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // High friction = more distance traveled
    expect(resultHigh.current.view.x).toBeGreaterThan(resultLow.current.view.x)
    u1()
    u2()
  })

  it("does not trigger on slow/stationary drag", () => {
    const { result, container, unmount } = renderZoomPinch()

    firePointerDown(container, { clientX: 200, clientY: 200 })
    firePointerMove({ clientX: 201, clientY: 200 })

    // Wait a long time before releasing — velocity should be near zero
    act(() => {
      vi.advanceTimersByTime(500)
    })

    firePointerUp({ clientX: 201, clientY: 200 })

    const xAfterDrag = result.current.view.x

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.view.x).toBe(xAfterDrag)
    unmount()
  })
})
