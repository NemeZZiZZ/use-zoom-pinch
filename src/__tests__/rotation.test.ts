import { describe, it, expect, vi } from "vitest"
import { act } from "@testing-library/react"
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
import { linear } from "../easings"

describe("rotation", () => {
  describe("rotateTo", () => {
    it("sets rotation to absolute angle", () => {
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.rotateTo(45)
      })

      expect(result.current.view.rotation).toBe(45)
      unmount()
    })

    it("sets rotation with animation", () => {
      vi.useFakeTimers()
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.rotateTo(90, { animate: true, duration: 300, easing: linear })
      })

      act(() => {
        vi.advanceTimersByTime(150)
      })

      expect(result.current.view.rotation).toBeGreaterThan(0)
      expect(result.current.view.rotation!).toBeLessThan(90)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.view.rotation).toBe(90)
      unmount()
      vi.useRealTimers()
    })

    it("does not affect x, y, or zoom", () => {
      const { result, unmount } = renderZoomPinch({
        initialViewState: { x: 100, y: 200, zoom: 2 },
      })

      act(() => {
        result.current.rotateTo(45)
      })

      expect(result.current.view.x).toBe(100)
      expect(result.current.view.y).toBe(200)
      expect(result.current.view.zoom).toBe(2)
      expect(result.current.view.rotation).toBe(45)
      unmount()
    })
  })

  describe("rotateBy", () => {
    it("rotates by relative delta", () => {
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.rotateBy(30)
      })

      expect(result.current.view.rotation).toBe(30)
      unmount()
    })

    it("accumulates multiple rotations", () => {
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.rotateBy(30)
      })
      act(() => {
        result.current.rotateBy(15)
      })

      expect(result.current.view.rotation).toBe(45)
      unmount()
    })

    it("supports negative rotation", () => {
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.rotateBy(-45)
      })

      expect(result.current.view.rotation).toBe(-45)
      unmount()
    })

    it("rotates by delta with animation", () => {
      vi.useFakeTimers()
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.rotateBy(90, { animate: true, duration: 300, easing: linear })
      })

      act(() => {
        vi.advanceTimersByTime(400)
      })

      expect(result.current.view.rotation).toBe(90)
      unmount()
      vi.useRealTimers()
    })
  })

  describe("resetView clears rotation", () => {
    it("resets rotation to 0", () => {
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.rotateTo(45)
      })
      expect(result.current.view.rotation).toBe(45)

      act(() => {
        result.current.resetView()
      })

      expect(result.current.view.rotation).toBe(0)
      unmount()
    })
  })

  describe("pinch rotation gesture", () => {
    it("rotates on two-finger twist when gestures.rotate is true", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { rotate: true },
      })

      // Two horizontal fingers
      fireTouchStart(container, [
        { x: 300, y: 300 },
        { x: 500, y: 300 },
      ])

      // Rotate fingers ~45 degrees (finger 2 moves up)
      fireTouchMove(container, [
        { x: 300, y: 300 },
        { x: 400, y: 160 },
      ])

      fireTouchEnd(container)

      expect(result.current.view.rotation).not.toBe(0)
      unmount()
    })

    it("does not rotate when gestures.rotate is false (default)", () => {
      const { result, container, unmount } = renderZoomPinch()

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
      unmount()
    })

    it("fires onRotateStart/onRotateEnd when rotate gesture is enabled", () => {
      const onRotateStart = vi.fn()
      const onRotateEnd = vi.fn()
      const { container, unmount } = renderZoomPinch({
        gestures: { rotate: true },
        onRotateStart,
        onRotateEnd,
      })

      fireTouchStart(container, [
        { x: 300, y: 300 },
        { x: 500, y: 300 },
      ])
      expect(onRotateStart).toHaveBeenCalledTimes(1)

      fireTouchMove(container, [
        { x: 300, y: 300 },
        { x: 400, y: 160 },
      ])

      fireTouchEnd(container)
      expect(onRotateEnd).toHaveBeenCalledTimes(1)

      unmount()
    })

    it("does not fire onRotateStart/End when rotate is disabled", () => {
      const onRotateStart = vi.fn()
      const onRotateEnd = vi.fn()
      const { container, unmount } = renderZoomPinch({
        gestures: { rotate: false },
        onRotateStart,
        onRotateEnd,
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

      expect(onRotateStart).not.toHaveBeenCalled()
      expect(onRotateEnd).not.toHaveBeenCalled()
      unmount()
    })
  })
})

describe("gesture toggles", () => {
  describe("gestures.pan = false", () => {
    it("disables wheel pan", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { pan: false },
      })

      fireWheel(container, { deltaY: 10.5, deltaMode: 0 })

      expect(result.current.view.x).toBe(0)
      expect(result.current.view.y).toBe(0)
      unmount()
    })

    it("disables pointer drag", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { pan: false },
      })

      firePointerDown(container, { clientX: 100, clientY: 100 })
      firePointerMove({ clientX: 200, clientY: 200 })
      firePointerUp()

      expect(result.current.view.x).toBe(0)
      expect(result.current.view.y).toBe(0)
      unmount()
    })

    it("still allows zoom", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { pan: false },
      })

      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })

      expect(result.current.view.zoom).toBeGreaterThan(1)
      unmount()
    })
  })

  describe("gestures.zoom = false", () => {
    it("disables ctrl+wheel zoom", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { zoom: false },
      })

      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })

      expect(result.current.view.zoom).toBe(1)
      unmount()
    })

    it("disables pinch zoom", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { zoom: false },
      })

      fireTouchStart(container, [
        { x: 350, y: 300 },
        { x: 450, y: 300 },
      ])

      fireTouchMove(container, [
        { x: 300, y: 300 },
        { x: 500, y: 300 },
      ])

      fireTouchEnd(container)

      expect(result.current.view.zoom).toBe(1)
      unmount()
    })

    it("still allows pan", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { zoom: false },
      })

      fireWheel(container, { deltaY: 10.5, deltaMode: 0 })

      expect(result.current.view.y).not.toBe(0)
      unmount()
    })
  })

  describe("gestures.rotate = true with zoom = false", () => {
    it("rotates without zooming during pinch", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { zoom: false, rotate: true },
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

      expect(result.current.view.zoom).toBe(1)
      expect(result.current.view.rotation).not.toBe(0)
      unmount()
    })
  })

  describe("all gestures disabled", () => {
    it("ignores all input gestures", () => {
      const { result, container, unmount } = renderZoomPinch({
        gestures: { pan: false, zoom: false, rotate: false },
      })

      // wheel pan
      fireWheel(container, { deltaY: 10.5, deltaMode: 0 })
      // wheel zoom
      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })
      // pointer drag
      firePointerDown(container, { clientX: 100, clientY: 100 })
      firePointerMove({ clientX: 200, clientY: 200 })
      firePointerUp()

      expect(result.current.view).toEqual({ x: 0, y: 0, zoom: 1, rotation: 0 })
      unmount()
    })

    it("imperative methods still work", () => {
      const { result, unmount } = renderZoomPinch({
        gestures: { pan: false, zoom: false, rotate: false },
      })

      act(() => {
        result.current.setView({ x: 100, y: 200, zoom: 2, rotation: 45 })
      })

      expect(result.current.view).toMatchObject({ x: 100, y: 200, zoom: 2, rotation: 45 })
      unmount()
    })
  })
})
