import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
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
import { clamp, distance, angleBetween } from "../index"

// ── Bug #5: animateTo with duration <= 0 ──────────────────────────────

describe("animateTo duration guard", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("setView animate with duration 0 jumps to target (no NaN)", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.setView({ x: 100, y: 200, zoom: 3 }, { animate: true, duration: 0 })
    })

    // Should land exactly on target without NaN poisoning
    expect(result.current.view.x).toBe(100)
    expect(result.current.view.y).toBe(200)
    expect(result.current.view.zoom).toBe(3)
    expect(Number.isNaN(result.current.view.zoom)).toBe(false)
    unmount()
  })

  it("setView animate with negative duration jumps to target", () => {
    const { result, unmount } = renderZoomPinch()

    act(() => {
      result.current.setView({ x: 50, y: 50, zoom: 2 }, { animate: true, duration: -10 })
    })

    expect(result.current.view.x).toBe(50)
    expect(result.current.view.zoom).toBe(2)
    expect(Number.isNaN(result.current.view.x)).toBe(false)
    unmount()
  })
})

// ── Bug #1: cursor.zooming applied on wheel zoom ──────────────────────

describe("cursor.zooming", () => {
  it("applies zooming cursor while wheel-zooming", () => {
    const { container } = renderZoomPinch({
      cursor: { enabled: true, idle: "grab", dragging: "grabbing", zooming: "zoom-in" },
    })

    expect(container.style.cursor).toBe("grab")

    fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })

    // While zoom is active (debounced end not yet fired), cursor is zoom-in
    expect(container.style.cursor).toBe("zoom-in")
  })

  it("restores idle cursor after zoom ends (debounced)", () => {
    vi.useFakeTimers()
    const { container } = renderZoomPinch()

    fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })
    expect(container.style.cursor).toBe("zoom-in")

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(container.style.cursor).toBe("grab")
    vi.useRealTimers()
  })
})

// ── Bug #2: activationKeys.rotate ─────────────────────────────────────

describe("activationKeys.rotate", () => {
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

  it("blocks touch rotation when activation key not held", () => {
    const { result, container } = renderZoomPinch({
      gestures: { rotate: true },
      activationKeys: { rotate: "Shift" },
    })

    fireTouchStart(container, [
      { x: 300, y: 300 },
      { x: 500, y: 300 },
    ])
    fireTouchMove(container, [
      { x: 300, y: 300 },
      { x: 400, y: 160 },
    ])
    fireTouchEnd(container)

    expect(result.current.view.rotation ?? 0).toBe(0)
  })

  it("allows touch rotation when activation key held", () => {
    const { result, container } = renderZoomPinch({
      gestures: { rotate: true },
      activationKeys: { rotate: "Shift" },
    })

    pressKey("Shift")
    fireTouchStart(container, [
      { x: 300, y: 300 },
      { x: 500, y: 300 },
    ])
    fireTouchMove(container, [
      { x: 300, y: 300 },
      { x: 400, y: 160 },
    ])
    fireTouchEnd(container)
    releaseKey("Shift")

    expect(result.current.view.rotation).not.toBe(0)
  })

  it("blocks keyboard rotation when activation key not held", () => {
    const { result, container } = renderZoomPinch({
      gestures: { rotate: true },
      keyboard: true,
      activationKeys: { rotate: "Shift" },
    })

    const event = new KeyboardEvent("keydown", { key: "]", bubbles: true, cancelable: true })
    act(() => container.dispatchEvent(event))

    expect(result.current.view.rotation ?? 0).toBe(0)
  })

  it("allows keyboard rotation when activation key held", () => {
    const { result, container } = renderZoomPinch({
      gestures: { rotate: true },
      keyboard: true,
      activationKeys: { rotate: "Shift" },
    })

    pressKey("Shift")
    const event = new KeyboardEvent("keydown", { key: "]", bubbles: true, cancelable: true })
    act(() => container.dispatchEvent(event))
    releaseKey("Shift")

    expect(result.current.view.rotation).toBe(15)
  })
})

// ── Bug #3: window blur clears pressedKeys ────────────────────────────

describe("activation keys reset on blur", () => {
  it("clears pressed activation keys on window blur", () => {
    const { result, container } = renderZoomPinch({
      activationKeys: { pan: "Shift" },
    })

    // Hold Shift, pan works
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", bubbles: true }))
    })
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 450, clientY: 300 })
    firePointerUp()
    expect(result.current.view.x).toBe(50)

    // Simulate user releasing Shift off-window: keyup missed, blur fires
    act(() => {
      window.dispatchEvent(new Event("blur"))
    })

    // Now pan should be blocked (key no longer considered pressed)
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 450, clientY: 300 })
    firePointerUp()
    expect(result.current.view.x).toBe(50) // unchanged
  })
})

// ── Bug #4: contextmenu suppressed when panButton = 2 ─────────────────

describe("contextmenu suppression", () => {
  it("prevents context menu when panButton is right (2)", () => {
    const { container } = renderZoomPinch({ panButton: 2 })

    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    act(() => container.dispatchEvent(event))

    expect(event.defaultPrevented).toBe(true)
  })

  it("does not prevent context menu when panButton is left (0)", () => {
    const { container } = renderZoomPinch({ panButton: 0 })

    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    act(() => container.dispatchEvent(event))

    expect(event.defaultPrevented).toBe(false)
  })
})

// ── Bug #6 (behavior): resetView returns to initialViewState ──────────

describe("resetView → initialViewState", () => {
  it("returns to custom initialViewState, not hardcoded {0,0,1}", () => {
    const initial = { x: 10, y: 20, zoom: 1.5, rotation: 5 }
    const { result, unmount } = renderZoomPinch({ initialViewState: initial })

    act(() => {
      result.current.setView({ x: 999, y: 999, zoom: 9 })
    })
    act(() => {
      result.current.resetView()
    })

    expect(result.current.view).toEqual(initial)
    unmount()
  })
})

// ── skipConstraints option ────────────────────────────────────────────

describe("setView skipConstraints", () => {
  it("bypasses bounds when skipConstraints is true", () => {
    const { result, unmount } = renderZoomPinch({
      bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
    })

    act(() => {
      result.current.setView({ x: 9999, y: 9999, zoom: 1 }, { skipConstraints: true })
    })

    expect(result.current.view.x).toBe(9999)
    expect(result.current.view.y).toBe(9999)
    unmount()
  })

  it("applies bounds when skipConstraints is false (default)", () => {
    const { result, unmount } = renderZoomPinch({
      bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
    })

    act(() => {
      result.current.setView({ x: 9999, y: 9999, zoom: 1 })
    })

    expect(result.current.view.x).toBe(100)
    expect(result.current.view.y).toBe(100)
    unmount()
  })

  it("bypasses snap-to-grid when skipConstraints is true", () => {
    const { result, unmount } = renderZoomPinch({
      snapToGrid: { size: 50, mode: "always" },
    })

    act(() => {
      result.current.setView({ x: 73, y: 28, zoom: 1 }, { skipConstraints: true })
    })

    expect(result.current.view.x).toBe(73)
    expect(result.current.view.y).toBe(28)
    unmount()
  })
})

// ── Exported helpers ──────────────────────────────────────────────────

describe("exported helpers", () => {
  it("clamp constrains to range", () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it("distance computes euclidean distance", () => {
    expect(distance(0, 0, 3, 4)).toBe(5)
    expect(distance(1, 1, 1, 1)).toBe(0)
  })

  it("angleBetween returns degrees", () => {
    // Vector pointing right → 0 degrees
    expect(angleBetween(0, 0, 10, 0)).toBeCloseTo(0, 5)
    // Vector pointing down → 90 degrees
    expect(angleBetween(0, 0, 0, 10)).toBeCloseTo(90, 5)
  })
})

// ── onTransformEnd consistency after double-tap & inertia ─────────────

describe("onTransformEnd consistency", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("fires onTransformEnd after double-tap animation completes", () => {
    const onTransformEnd = vi.fn()
    const { container } = renderZoomPinch({ onTransformEnd })

    // Double tap
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerUp({ clientX: 400, clientY: 300 })
    act(() => vi.advanceTimersByTime(100))
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerUp({ clientX: 400, clientY: 300 })

    // Not fired yet — animation still running
    act(() => vi.advanceTimersByTime(50))
    expect(onTransformEnd).not.toHaveBeenCalled()

    // Fires once the double-tap animation finishes (300ms)
    act(() => vi.advanceTimersByTime(300))
    expect(onTransformEnd).toHaveBeenCalledTimes(1)
  })

  it("fires onTransformEnd after inertia settles", () => {
    const onTransformEnd = vi.fn()
    const { container } = renderZoomPinch({ onTransformEnd })

    // Fast drag to build velocity
    firePointerDown(container, { clientX: 200, clientY: 200 })
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 250, clientY: 200 })
    act(() => vi.advanceTimersByTime(16))
    firePointerMove({ clientX: 300, clientY: 200 })
    firePointerUp({ clientX: 300, clientY: 200 })

    // Pointer up does NOT fire onTransformEnd immediately when inertia runs.
    // It fires only after inertia settles.
    expect(onTransformEnd).not.toHaveBeenCalled()

    // Advance enough frames for inertia to decay to a halt.
    act(() => vi.advanceTimersByTime(2000))

    expect(onTransformEnd).toHaveBeenCalledTimes(1)
  })
})

// ── Wheel preventDefault ordering ─────────────────────────────────────
// preventDefault must only be called when the hook will actually handle the
// event. Otherwise the browser's native wheel behavior is suppressed even
// when the hook ignores the event (disabled gesture / activation key missing).

describe("wheel preventDefault ordering", () => {
  function dispatchWheel(el: HTMLElement, init: Partial<WheelEventInit>) {
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaMode: 0,
      clientX: 400,
      clientY: 300,
      ...init,
    })
    act(() => {
      el.dispatchEvent(event)
    })
    return event
  }

  it("does NOT preventDefault when pan gesture is disabled (wheel pan)", () => {
    const { container } = renderZoomPinch({ gestures: { pan: false } })

    const event = dispatchWheel(container, { deltaY: 50 })

    expect(event.defaultPrevented).toBe(false)
  })

  it("does NOT preventDefault when zoom gesture is disabled (ctrl+wheel zoom)", () => {
    const { container } = renderZoomPinch({ gestures: { zoom: false } })

    const event = dispatchWheel(container, { deltaY: -5.5, ctrlKey: true })

    expect(event.defaultPrevented).toBe(false)
  })

  it("does NOT preventDefault when zoom activation key is required but not held", () => {
    const { container } = renderZoomPinch({
      activationKeys: { zoom: "Alt" },
    })

    // ctrl+wheel = zoom event, but Alt not held → hook ignores it
    const event = dispatchWheel(container, { deltaY: -5.5, ctrlKey: true })

    expect(event.defaultPrevented).toBe(false)
  })

  it("does NOT preventDefault when pan activation key is required but not held", () => {
    const { container } = renderZoomPinch({
      activationKeys: { pan: "Shift" },
    })

    // wheel without ctrl = pan event, but Shift not held → hook ignores it
    const event = dispatchWheel(container, { deltaY: 50 })

    expect(event.defaultPrevented).toBe(false)
  })

  it("DOES preventDefault when the event is handled (pan)", () => {
    const { container } = renderZoomPinch()

    const event = dispatchWheel(container, { deltaY: 50 })

    expect(event.defaultPrevented).toBe(true)
  })

  it("DOES preventDefault when the event is handled (zoom)", () => {
    const { container } = renderZoomPinch()

    const event = dispatchWheel(container, { deltaY: -5.5, ctrlKey: true })

    expect(event.defaultPrevented).toBe(true)
  })

  it("DOES preventDefault when required activation key IS held", () => {
    const { container } = renderZoomPinch({ activationKeys: { zoom: "Alt" } })

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Alt", bubbles: true }))
    })
    const event = dispatchWheel(container, { deltaY: -5.5, ctrlKey: true })
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Alt", bubbles: true }))
    })

    expect(event.defaultPrevented).toBe(true)
  })
})
