import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act } from "@testing-library/react"
import { renderZoomPinch, firePointerDown, firePointerMove, firePointerUp } from "./helpers"

// ── Bounds / constraints ──────────────────────────────────────────────

describe("bounds", () => {
  it("clamps pan within bounds", () => {
    const { result, container } = renderZoomPinch({
      bounds: { minX: -100, maxX: 100, minY: -50, maxY: 50 },
    })

    // Drag far to the right (positive x)
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 900, clientY: 300 }) // dx = 500
    firePointerUp()

    expect(result.current.view.x).toBeLessThanOrEqual(100)
  })

  it("clamps pan within negative bounds", () => {
    const { result, container } = renderZoomPinch({
      bounds: { minX: -100, maxX: 100, minY: -50, maxY: 50 },
    })

    // Drag far to the left (negative x)
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: -200, clientY: 300 }) // dx = -600
    firePointerUp()

    expect(result.current.view.x).toBeGreaterThanOrEqual(-100)
  })

  it("clamps y within bounds", () => {
    const { result, container } = renderZoomPinch({
      bounds: { minY: -50, maxY: 50 },
    })

    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 400, clientY: 800 }) // dy = 500
    firePointerUp()

    expect(result.current.view.y).toBeLessThanOrEqual(50)
  })

  it("clamps panBy within bounds", () => {
    const { result } = renderZoomPinch({
      bounds: { minX: -100, maxX: 100 },
    })

    act(() => {
      result.current.panBy(500, 0)
    })

    expect(result.current.view.x).toBe(100)
  })

  it("allows movement within bounds", () => {
    const { result, container } = renderZoomPinch({
      bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
    })

    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 430, clientY: 320 }) // dx=30, dy=20
    firePointerUp()

    expect(result.current.view.x).toBe(30)
    expect(result.current.view.y).toBe(20)
  })

  it("works with partial bounds (only maxX)", () => {
    const { result, container } = renderZoomPinch({
      bounds: { maxX: 50 },
    })

    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 600, clientY: 300 }) // dx=200
    firePointerUp()

    expect(result.current.view.x).toBe(50)
  })
})

// ── panButton ─────────────────────────────────────────────────────────

describe("panButton", () => {
  it("defaults to left mouse button (0)", () => {
    const { result, container } = renderZoomPinch()

    firePointerDown(container, { clientX: 100, clientY: 100, button: 0 })
    firePointerMove({ clientX: 150, clientY: 100 })
    firePointerUp()

    expect(result.current.view.x).toBe(50)
  })

  it("ignores non-configured button", () => {
    const { result, container } = renderZoomPinch({ panButton: 0 })

    // Middle mouse button should be ignored
    firePointerDown(container, { clientX: 100, clientY: 100, button: 1 })
    firePointerMove({ clientX: 150, clientY: 100 })
    firePointerUp()

    expect(result.current.view.x).toBe(0)
  })

  it("uses middle mouse button when configured", () => {
    const { result, container } = renderZoomPinch({ panButton: 1 })

    firePointerDown(container, { clientX: 100, clientY: 100, button: 1 })
    firePointerMove({ clientX: 150, clientY: 100 })
    firePointerUp()

    expect(result.current.view.x).toBe(50)
  })

  it("rejects left click when panButton=1", () => {
    const { result, container } = renderZoomPinch({ panButton: 1 })

    firePointerDown(container, { clientX: 100, clientY: 100, button: 0 })
    firePointerMove({ clientX: 150, clientY: 100 })
    firePointerUp()

    expect(result.current.view.x).toBe(0)
  })
})

// ── Keyboard navigation ───────────────────────────────────────────────

describe("keyboard", () => {
  function fireKey(target: HTMLElement, key: string, opts: KeyboardEventInit = {}) {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    })
    act(() => {
      target.dispatchEvent(event)
    })
  }

  it("does nothing when keyboard is disabled (default)", () => {
    const { result, container } = renderZoomPinch()

    fireKey(container, "ArrowRight")

    expect(result.current.view.x).toBe(0)
  })

  it("pans right with ArrowRight", () => {
    const { result, container } = renderZoomPinch({ keyboard: true })

    fireKey(container, "ArrowRight")

    // ArrowRight pans content left = x decreases
    expect(result.current.view.x).toBe(-50)
  })

  it("pans left with ArrowLeft", () => {
    const { result, container } = renderZoomPinch({ keyboard: true })

    fireKey(container, "ArrowLeft")

    expect(result.current.view.x).toBe(50)
  })

  it("pans up with ArrowUp", () => {
    const { result, container } = renderZoomPinch({ keyboard: true })

    fireKey(container, "ArrowUp")

    expect(result.current.view.y).toBe(50)
  })

  it("pans down with ArrowDown", () => {
    const { result, container } = renderZoomPinch({ keyboard: true })

    fireKey(container, "ArrowDown")

    expect(result.current.view.y).toBe(-50)
  })

  it("zooms in with +", () => {
    const { result, container } = renderZoomPinch({ keyboard: true })

    fireKey(container, "+")

    expect(result.current.view.zoom).toBeGreaterThan(1)
  })

  it("zooms out with -", () => {
    const { result, container } = renderZoomPinch({ keyboard: true })

    fireKey(container, "-")

    expect(result.current.view.zoom).toBeLessThan(1)
  })

  it("resets with 0", () => {
    const { result, container } = renderZoomPinch({
      keyboard: true,
      initialViewState: { x: 100, y: 100, zoom: 3 },
    })

    fireKey(container, "0")

    expect(result.current.view).toMatchObject({ x: 0, y: 0, zoom: 1 })
  })

  it("uses custom panStep", () => {
    const { result, container } = renderZoomPinch({
      keyboard: { enabled: true, panStep: 100, zoomStep: 1.5, rotateStep: 15 },
    })

    fireKey(container, "ArrowRight")

    expect(result.current.view.x).toBe(-100)
  })

  it("rotates with [ and ] when rotate enabled", () => {
    const { result, container } = renderZoomPinch({
      keyboard: true,
      gestures: { pan: true, zoom: true, rotate: true },
    })

    fireKey(container, "]")
    expect(result.current.view.rotation).toBe(15)

    fireKey(container, "[")
    expect(result.current.view.rotation).toBe(0)
  })

  it("does not rotate when rotate gesture disabled", () => {
    const { result, container } = renderZoomPinch({ keyboard: true })

    fireKey(container, "]")

    expect(result.current.view.rotation ?? 0).toBe(0)
  })

  it("does not pan when pan gesture disabled", () => {
    const { result, container } = renderZoomPinch({
      keyboard: true,
      gestures: { pan: false, zoom: true, rotate: false },
    })

    fireKey(container, "ArrowRight")

    expect(result.current.view.x).toBe(0)
  })

  it("does not zoom when zoom gesture disabled", () => {
    const { result, container } = renderZoomPinch({
      keyboard: true,
      gestures: { pan: true, zoom: false, rotate: false },
    })

    fireKey(container, "+")

    expect(result.current.view.zoom).toBe(1)
  })

  it("ignores keyboard when typing in input", () => {
    const { result, container } = renderZoomPinch({ keyboard: true })

    const input = document.createElement("input")
    container.appendChild(input)

    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    })
    // Override target — jsdom doesn't support setting target directly,
    // so we dispatch from the input element
    act(() => {
      input.dispatchEvent(event)
    })

    expect(result.current.view.x).toBe(0)

    input.remove()
  })
})

// ── Coordinate conversion ─────────────────────────────────────────────

describe("screenToContent / contentToScreen", () => {
  it("converts screen to content at default view", () => {
    const { result } = renderZoomPinch()

    // Container at (0,0), view at (0,0), zoom=1
    // screenToContent(100, 50) = ((100 - 0 - 0) / 1, (50 - 0 - 0) / 1) = (100, 50)
    const content = result.current.screenToContent(100, 50)
    expect(content).toEqual({ x: 100, y: 50 })
  })

  it("accounts for zoom", () => {
    const { result } = renderZoomPinch({
      initialViewState: { x: 0, y: 0, zoom: 2 },
    })

    const content = result.current.screenToContent(200, 100)
    expect(content).toEqual({ x: 100, y: 50 })
  })

  it("accounts for pan offset", () => {
    const { result } = renderZoomPinch({
      initialViewState: { x: 50, y: 30, zoom: 1 },
    })

    const content = result.current.screenToContent(150, 80)
    // (150 - 0 - 50) / 1 = 100, (80 - 0 - 30) / 1 = 50
    expect(content).toEqual({ x: 100, y: 50 })
  })

  it("converts content to screen at default view", () => {
    const { result } = renderZoomPinch()

    const screen = result.current.contentToScreen(100, 50)
    expect(screen).toEqual({ x: 100, y: 50 })
  })

  it("contentToScreen accounts for zoom and pan", () => {
    const { result } = renderZoomPinch({
      initialViewState: { x: 50, y: 30, zoom: 2 },
    })

    // contentX * zoom + x + rect.left = 100 * 2 + 50 + 0 = 250
    // contentY * zoom + y + rect.top = 50 * 2 + 30 + 0 = 130
    const screen = result.current.contentToScreen(100, 50)
    expect(screen).toEqual({ x: 250, y: 130 })
  })

  it("round-trips: screenToContent -> contentToScreen", () => {
    const { result } = renderZoomPinch({
      initialViewState: { x: 37, y: -15, zoom: 1.7 },
    })

    const content = result.current.screenToContent(300, 200)
    const screen = result.current.contentToScreen(content.x, content.y)

    expect(screen.x).toBeCloseTo(300, 5)
    expect(screen.y).toBeCloseTo(200, 5)
  })
})

// ── isAnimating ───────────────────────────────────────────────────────

describe("isAnimating", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts as false", () => {
    const { result } = renderZoomPinch()
    expect(result.current.isAnimating).toBe(false)
  })

  it("becomes true during animation", () => {
    const { result } = renderZoomPinch()

    act(() => {
      result.current.setView({ x: 100, y: 0, zoom: 1 }, { animate: true, duration: 300 })
    })

    // After first rAF
    act(() => {
      vi.advanceTimersByTime(16)
    })

    expect(result.current.isAnimating).toBe(true)
  })

  it("becomes false after animation completes", () => {
    const { result } = renderZoomPinch()

    act(() => {
      result.current.setView({ x: 100, y: 0, zoom: 1 }, { animate: true, duration: 100 })
    })

    // Advance past the animation duration
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isAnimating).toBe(false)
  })

  it("is false for instant setView", () => {
    const { result } = renderZoomPinch()

    act(() => {
      result.current.setView({ x: 100, y: 0, zoom: 1 })
    })

    expect(result.current.isAnimating).toBe(false)
  })
})

// ── Zoom snap levels ──────────────────────────────────────────────────

describe("zoomSnapLevels", () => {
  it("snapZoom snaps to nearest level", () => {
    const { result } = renderZoomPinch({
      initialViewState: { x: 0, y: 0, zoom: 1.3 },
      zoomSnapLevels: [0.5, 1, 2, 4],
      inertia: false,
    })

    act(() => {
      result.current.snapZoom()
    })

    // 1.3 is closest to 1
    expect(result.current.view.zoom).toBe(1)
  })

  it("snapZoom snaps to higher level when closer", () => {
    const { result } = renderZoomPinch({
      initialViewState: { x: 0, y: 0, zoom: 1.7 },
      zoomSnapLevels: [0.5, 1, 2, 4],
      inertia: false,
    })

    act(() => {
      result.current.snapZoom()
    })

    // 1.7 is closest to 2
    expect(result.current.view.zoom).toBe(2)
  })

  it("does nothing with no snap levels", () => {
    const { result } = renderZoomPinch({
      initialViewState: { x: 0, y: 0, zoom: 1.3 },
    })

    act(() => {
      result.current.snapZoom()
    })

    expect(result.current.view.zoom).toBe(1.3)
  })
})

// ── Snap to grid ──────────────────────────────────────────────────────

describe("snapToGrid", () => {
  it('snaps position in "always" mode', () => {
    const { result, container } = renderZoomPinch({
      snapToGrid: { size: 50, mode: "always" },
    })

    // Drag by 37px — should snap to 50
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 437, clientY: 300 })
    firePointerUp()

    expect(result.current.view.x % 50).toBe(0)
  })

  it('snaps to nearest grid in "always" mode', () => {
    const { result, container } = renderZoomPinch({
      snapToGrid: { size: 50, mode: "always" },
    })

    // Drag by 23px — should round to 0 (nearest multiple of 50)
    firePointerDown(container, { clientX: 400, clientY: 300 })
    firePointerMove({ clientX: 423, clientY: 300 })
    firePointerUp()

    expect(result.current.view.x).toBe(0)
  })

  it("panBy respects always-mode grid snap", () => {
    const { result } = renderZoomPinch({
      snapToGrid: { size: 50, mode: "always" },
    })

    act(() => {
      result.current.panBy(73, 28)
    })

    // 73 rounds to 50, 28 rounds to 50
    expect(result.current.view.x).toBe(50)
    expect(result.current.view.y).toBe(50)
  })
})

// ── fitToContent ──────────────────────────────────────────────────────

describe("fitToContent", () => {
  it("fits content rect into container", () => {
    const { result } = renderZoomPinch({
      contentRect: { width: 1600, height: 1200 },
    })

    // Container is 800x600, content is 1600x1200
    // Scale = min(800/1600, 600/1200) = 0.5
    expect(result.current.view.zoom).toBe(0.5)
  })

  it("does nothing without contentRect", () => {
    const { result } = renderZoomPinch()

    act(() => {
      result.current.fitToContent()
    })

    expect(result.current.view.zoom).toBe(1)
  })

  it("centers content", () => {
    const { result } = renderZoomPinch({
      contentRect: { width: 400, height: 300 },
    })

    // Container: 800x600, content: 400x300
    // Scale = min(800/400, 600/300) = 2
    // x = 800/2 - (0 + 200) * 2 = 400 - 400 = 0
    // y = 600/2 - (0 + 150) * 2 = 300 - 300 = 0
    expect(result.current.view.zoom).toBe(2)
    expect(result.current.view.x).toBe(0)
    expect(result.current.view.y).toBe(0)
  })

  it("respects minScale/maxScale", () => {
    const { result } = renderZoomPinch({
      contentRect: { width: 80, height: 60 },
      maxScale: 5,
    })

    // Container: 800x600, content: 80x60
    // Natural scale = min(800/80, 600/60) = 10, but maxScale=5
    expect(result.current.view.zoom).toBe(5)
  })

  it("fitToContent with padding", () => {
    const { result } = renderZoomPinch({
      contentRect: { width: 800, height: 600 },
    })

    act(() => {
      result.current.fitToContent({ padding: 100 })
    })

    // Container effective: (800-200)x(600-200) = 600x400
    // Scale = min(600/800, 400/600) = min(0.75, 0.667) = 0.667
    expect(result.current.view.zoom).toBeCloseTo(2 / 3, 2)
  })
})

// ── Bounds + keyboard combined ────────────────────────────────────────

describe("bounds + keyboard", () => {
  function fireKey(target: HTMLElement, key: string) {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    })
    act(() => {
      target.dispatchEvent(event)
    })
  }

  it("keyboard pan is clamped by bounds", () => {
    const { result, container } = renderZoomPinch({
      keyboard: true,
      bounds: { minX: -30, maxX: 30 },
    })

    // panStep = 50, but bounds limit to 30
    fireKey(container, "ArrowLeft") // x += 50

    expect(result.current.view.x).toBe(30)
  })
})
