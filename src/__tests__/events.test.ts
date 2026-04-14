import { describe, it, expect, vi } from "vitest"
import {
  renderZoomPinch,
  fireWheel,
  firePointerDown,
  firePointerMove,
  firePointerUp,
  fireTouchStart,
  fireTouchMove,
  fireTouchEnd,
} from "./helpers"

describe("shouldHandleEvent", () => {
  it("rejects events when shouldHandleEvent returns false", () => {
    const { result, container, unmount } = renderZoomPinch({
      shouldHandleEvent: () => false,
    })

    fireWheel(container, { deltaY: 120, deltaMode: 0 })
    firePointerDown(container, { clientX: 100, clientY: 100 })
    firePointerMove({ clientX: 200, clientY: 200 })
    firePointerUp()

    expect(result.current.view).toEqual({ x: 0, y: 0, zoom: 1, rotation: 0 })
    unmount()
  })

  it("accepts events when shouldHandleEvent returns true", () => {
    const { result, container, unmount } = renderZoomPinch({
      shouldHandleEvent: () => true,
    })

    fireWheel(container, { deltaY: 10.5, deltaMode: 0 })

    expect(result.current.view.y).not.toBe(0)
    unmount()
  })

  it("works without shouldHandleEvent (default)", () => {
    const { result, container, unmount } = renderZoomPinch()

    fireWheel(container, { deltaY: 10.5, deltaMode: 0 })

    expect(result.current.view.y).not.toBe(0)
    unmount()
  })
})

describe("granular events", () => {
  describe("pan events", () => {
    it("fires onPanStart and onPanEnd on drag", () => {
      const onPanStart = vi.fn()
      const onPanEnd = vi.fn()
      const { container, unmount } = renderZoomPinch({ onPanStart, onPanEnd })

      firePointerDown(container, { clientX: 100, clientY: 100 })
      expect(onPanStart).toHaveBeenCalledTimes(1)

      firePointerMove({ clientX: 150, clientY: 150 })
      firePointerUp()

      expect(onPanEnd).toHaveBeenCalledTimes(1)
      unmount()
    })

    it("does not fire pan events when disabled", () => {
      const onPanStart = vi.fn()
      const { container, unmount } = renderZoomPinch({ enabled: false, onPanStart })

      firePointerDown(container, { clientX: 100, clientY: 100 })

      expect(onPanStart).not.toHaveBeenCalled()
      unmount()
    })
  })

  describe("zoom events", () => {
    it("fires onZoomStart on first ctrl+wheel", () => {
      const onZoomStart = vi.fn()
      const { container, unmount } = renderZoomPinch({ onZoomStart })

      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })

      expect(onZoomStart).toHaveBeenCalledTimes(1)
      unmount()
    })

    it("fires onZoomEnd after debounce", () => {
      vi.useFakeTimers()
      const onZoomEnd = vi.fn()
      const { container, unmount } = renderZoomPinch({ onZoomEnd })

      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })

      expect(onZoomEnd).not.toHaveBeenCalled()

      vi.advanceTimersByTime(200)

      expect(onZoomEnd).toHaveBeenCalledTimes(1)

      unmount()
      vi.useRealTimers()
    })

    it("does not fire onZoomStart twice for consecutive wheel events", () => {
      vi.useFakeTimers()
      const onZoomStart = vi.fn()
      const { container, unmount } = renderZoomPinch({ onZoomStart })

      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })
      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })
      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })

      expect(onZoomStart).toHaveBeenCalledTimes(1)

      unmount()
      vi.useRealTimers()
    })
  })

  describe("pinch events", () => {
    it("fires onPinchStart and onPinchEnd on pinch", () => {
      const onPinchStart = vi.fn()
      const onPinchEnd = vi.fn()
      const { container, unmount } = renderZoomPinch({ onPinchStart, onPinchEnd })

      fireTouchStart(container, [
        { x: 350, y: 300 },
        { x: 450, y: 300 },
      ])
      expect(onPinchStart).toHaveBeenCalledTimes(1)

      fireTouchMove(container, [
        { x: 300, y: 300 },
        { x: 500, y: 300 },
      ])

      fireTouchEnd(container)
      expect(onPinchEnd).toHaveBeenCalledTimes(1)

      unmount()
    })
  })
})
