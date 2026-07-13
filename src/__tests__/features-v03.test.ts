import { describe, it, expect, vi } from "vitest"
import { act } from "@testing-library/react"
import {
  renderZoomPinch,
  firePointerDown,
  firePointerMove,
  firePointerUp,
  fireWheel,
  fireTouchStart,
  fireTouchMove,
  fireTouchEnd,
} from "./helpers"

// ── Bounce at bounds ──────────────────────────────────────────────────

describe("bounce bounds", () => {
  it("allows overscroll with rubber-band in bounce mode", () => {
    const { result, container } = renderZoomPinch({
      bounds: { minX: -100, maxX: 100, mode: "bounce" },
      inertia: false,
    })

    // Drag far past bounds
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 900, clientY: 300 }) // dx = 500
    firePointerUp()

    // Should be past 100 but much less than 500 (rubber-banded)
    expect(result.current.view.x).toBeGreaterThan(100)
    expect(result.current.view.x).toBeLessThan(500)
  })

  it("rubber-band effect reduces overshoot by bounceFactor", () => {
    const { result, container } = renderZoomPinch({
      bounds: { minX: 0, maxX: 0, mode: "bounce", bounceFactor: 0.5 },
      inertia: false,
    })

    // Drag right by 100
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 500, clientY: 300 })
    firePointerUp()

    // x should be 100 * 0.5 = 50
    expect(result.current.view.x).toBeCloseTo(50, 0)
  })

  it("bounce snaps back on gesture end", () => {
    vi.useFakeTimers()

    const { result, container } = renderZoomPinch({
      bounds: { minX: -100, maxX: 100, mode: "bounce" },
      inertia: false,
    })

    // Drag past bounds
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 900, clientY: 300 })
    firePointerUp()

    // snapOnEnd triggers animateTo which snaps back
    // Advance past animation (150ms duration)
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.view.x).toBeLessThanOrEqual(100)

    vi.useRealTimers()
  })
})

// ── Axis locking ──────────────────────────────────────────────────────

describe("axis locking", () => {
  it("locks to x axis — y stays unchanged", () => {
    const { result, container } = renderZoomPinch({ axis: "x" })

    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 450, clientY: 350 })
    firePointerUp()

    expect(result.current.view.x).toBe(50)
    expect(result.current.view.y).toBe(0) // locked
  })

  it("locks to y axis — x stays unchanged", () => {
    const { result, container } = renderZoomPinch({ axis: "y" })

    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 450, clientY: 350 })
    firePointerUp()

    expect(result.current.view.x).toBe(0) // locked
    expect(result.current.view.y).toBe(50)
  })

  it("panBy respects axis lock", () => {
    const { result } = renderZoomPinch({ axis: "x" })

    act(() => {
      result.current.panBy(100, 200)
    })

    expect(result.current.view.x).toBe(100)
    expect(result.current.view.y).toBe(0)
  })
})

// ── Cursor management ─────────────────────────────────────────────────

describe("cursor", () => {
  it("sets grab cursor on container by default", () => {
    const { container } = renderZoomPinch()

    expect(container.style.cursor).toBe("grab")
  })

  it("changes to grabbing on drag", () => {
    const { container } = renderZoomPinch()

    firePointerDown(container, { clientX: 400, clientY: 300 })

    expect(container.style.cursor).toBe("grabbing")
  })

  it("restores grab after drag ends", () => {
    const { container } = renderZoomPinch()

    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 410, clientY: 300 })
    firePointerUp()

    expect(container.style.cursor).toBe("grab")
  })

  it("uses custom cursor values", () => {
    const { container } = renderZoomPinch({
      cursor: { enabled: true, idle: "crosshair", dragging: "move", zooming: "zoom-in" },
    })

    expect(container.style.cursor).toBe("crosshair")

    firePointerDown(container, { clientX: 400, clientY: 300 })
    expect(container.style.cursor).toBe("move")

    firePointerMove({ clientX: 410, clientY: 300 })
    firePointerUp()
    expect(container.style.cursor).toBe("crosshair")
  })

  it("does not set cursor when disabled", () => {
    const { container } = renderZoomPinch({ cursor: false })

    expect(container.style.cursor).toBe("")
  })

  it("restores original cursor on unmount", () => {
    const { container, unmount } = renderZoomPinch()

    expect(container.style.cursor).toBe("grab")
    unmount()
    expect(container.style.cursor).toBe("")
  })
})

// ── Wheel mode ────────────────────────────────────────────────────────

describe("wheelMode", () => {
  it('default "pan" mode: wheel without ctrl pans', () => {
    const { result, container } = renderZoomPinch()

    fireWheel(container, { deltaY: -50, deltaX: 0 })

    expect(result.current.view.y).toBeGreaterThan(0) // panned
    expect(result.current.view.zoom).toBe(1) // no zoom
  })

  it('"zoom" mode: wheel without ctrl zooms', () => {
    const { result, container } = renderZoomPinch({ wheelMode: "zoom" })

    fireWheel(container, { deltaY: -50 })

    expect(result.current.view.zoom).not.toBe(1) // zoomed
  })

  it('"zoom" mode: ctrl+wheel pans', () => {
    const { result, container } = renderZoomPinch({ wheelMode: "zoom" })

    fireWheel(container, { deltaY: -50, ctrlKey: true })

    // In zoom mode, ctrlKey inverts to pan
    expect(result.current.view.zoom).toBe(1)
  })
})

// ── Rotation snap levels ──────────────────────────────────────────────

describe("rotation snap levels", () => {
  it("snaps rotation to nearest level on pinch gesture end", () => {
    vi.useFakeTimers()

    const { result, container } = renderZoomPinch({
      gestures: { pan: true, zoom: true, rotate: true },
      rotation: { snapLevels: [0, 90, 180, 270] },
      initialViewState: { x: 0, y: 0, zoom: 1, rotation: 80 },
      inertia: false,
    })

    // A two-finger gesture triggers snapOnEnd on touchend.
    // Start near 80°, which is closest to the 90° snap level.
    fireTouchStart(container, [
      { x: 300, y: 300 },
      { x: 500, y: 300 },
    ])
    fireTouchMove(container, [
      { x: 300, y: 300 },
      { x: 500, y: 300 },
    ])
    fireTouchEnd(container)

    // snapOnEnd runs animateTo (150ms) to snap rotation 80 → 90
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.view.rotation).toBe(90)

    vi.useRealTimers()
  })

  it("clamps rotation within min/max", () => {
    const { result } = renderZoomPinch({
      gestures: { pan: true, zoom: true, rotate: true },
      rotation: { minAngle: -90, maxAngle: 90 },
    })

    act(() => {
      result.current.rotateTo(120)
    })

    expect(result.current.view.rotation).toBe(90)
  })

  it("clamps rotation at min", () => {
    const { result } = renderZoomPinch({
      gestures: { pan: true, zoom: true, rotate: true },
      rotation: { minAngle: -45, maxAngle: 45 },
    })

    act(() => {
      result.current.rotateTo(-60)
    })

    expect(result.current.view.rotation).toBe(-45)
  })

  it("allows rotation within range", () => {
    const { result } = renderZoomPinch({
      gestures: { pan: true, zoom: true, rotate: true },
      rotation: { minAngle: -90, maxAngle: 90 },
    })

    act(() => {
      result.current.rotateTo(45)
    })

    expect(result.current.view.rotation).toBe(45)
  })
})

// ── Activation keys ───────────────────────────────────────────────────

describe("activation keys", () => {
  function pressKey(key: string) {
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
    })
  }

  function releaseKey(key: string) {
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }))
    })
  }

  it("blocks pan when activation key not held", () => {
    const { result, container } = renderZoomPinch({
      activationKeys: { pan: "Shift" },
    })

    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 450, clientY: 300 })
    firePointerUp()

    expect(result.current.view.x).toBe(0) // blocked
  })

  it("allows pan when activation key held", () => {
    const { result, container } = renderZoomPinch({
      activationKeys: { pan: "Shift" },
    })

    pressKey("Shift")
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 450, clientY: 300 })
    firePointerUp()
    releaseKey("Shift")

    expect(result.current.view.x).toBe(50)
  })
})

// ── onTransformEnd ────────────────────────────────────────────────────

describe("onTransformEnd", () => {
  it("fires after pan ends", () => {
    const onTransformEnd = vi.fn()
    const { container } = renderZoomPinch({ onTransformEnd, inertia: false })

    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 410, clientY: 300 })
    firePointerUp()

    expect(onTransformEnd).toHaveBeenCalledTimes(1)
    expect(onTransformEnd).toHaveBeenCalledWith(expect.objectContaining({ x: 10 }))
  })

  it("fires after zoom ends (debounced)", () => {
    vi.useFakeTimers()

    const onTransformEnd = vi.fn()
    const { container } = renderZoomPinch({ onTransformEnd })

    fireWheel(container, { deltaY: -50, ctrlKey: true })

    // Not called yet (debounced 150ms)
    expect(onTransformEnd).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(onTransformEnd).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
})
