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
import type { ViewState } from "../index"

describe("useZoomPinch", () => {
  // ── Initialization ─────────────────────────────────────────────

  describe("initialization", () => {
    it("returns default view {0, 0, 1}", () => {
      const { result, unmount } = renderZoomPinch()
      expect(result.current.view).toEqual({ x: 0, y: 0, zoom: 1, rotation: 0 })
      unmount()
    })

    it("uses custom initialViewState", () => {
      const { result, unmount } = renderZoomPinch({
        initialViewState: { x: 100, y: 200, zoom: 2 },
      })
      expect(result.current.view).toMatchObject({ x: 100, y: 200, zoom: 2 })
      unmount()
    })

    it("uses controlled viewState over internal state", () => {
      const viewState: ViewState = { x: 50, y: 60, zoom: 1.5 }
      const { result, unmount } = renderZoomPinch({
        viewState,
        onViewStateChange: () => {},
      })
      expect(result.current.view).toMatchObject(viewState)
      unmount()
    })
  })

  // ── Wheel pan ──────────────────────────────────────────────────

  describe("wheel pan", () => {
    it("pans on vertical wheel scroll (mouse-like)", () => {
      const { result, container, unmount } = renderZoomPinch()

      fireWheel(container, { deltaY: 120, deltaMode: 0 })

      // Mouse wheel: deltaY >= 100 → normalized to 1, multiplied by 25
      expect(result.current.view.y).toBeLessThan(0)
      expect(result.current.view.zoom).toBe(1)
      unmount()
    })

    it("pans on horizontal wheel scroll", () => {
      const { result, container, unmount } = renderZoomPinch()

      fireWheel(container, { deltaX: 120, deltaY: 0, deltaMode: 0 })

      expect(result.current.view.x).toBeLessThan(0)
      expect(result.current.view.y).toBe(0)
      unmount()
    })

    it("pans on trackpad scroll (small pixel deltas)", () => {
      const { result, container, unmount } = renderZoomPinch()

      fireWheel(container, { deltaY: 10.5, deltaMode: 0 })

      // Trackpad: multiplier = 1, so y offset = -10.5
      expect(result.current.view.y).toBeCloseTo(-10.5)
      unmount()
    })
  })

  // ── Wheel zoom ─────────────────────────────────────────────────

  describe("wheel zoom", () => {
    it("zooms on ctrl+wheel (trackpad pinch)", () => {
      const { result, container, unmount } = renderZoomPinch()

      fireWheel(container, { deltaY: -5.5, ctrlKey: true, deltaMode: 0 })

      expect(result.current.view.zoom).toBeGreaterThan(1)
      unmount()
    })

    it("zooms on ctrl+wheel (discrete mouse wheel)", () => {
      const { result, container, unmount } = renderZoomPinch()

      fireWheel(container, { deltaY: -120, ctrlKey: true, deltaMode: 0 })

      expect(result.current.view.zoom).toBeGreaterThan(1)
      unmount()
    })

    it("zooms out on positive deltaY with ctrlKey", () => {
      const { result, container, unmount } = renderZoomPinch()

      fireWheel(container, { deltaY: 5.5, ctrlKey: true, deltaMode: 0 })

      expect(result.current.view.zoom).toBeLessThan(1)
      unmount()
    })
  })

  // ── Pointer drag ───────────────────────────────────────────────

  describe("pointer drag", () => {
    it("pans on pointer drag", () => {
      const { result, container, unmount } = renderZoomPinch()

      firePointerDown(container, { clientX: 100, clientY: 100 })
      firePointerMove({ clientX: 150, clientY: 130 })
      firePointerUp()

      expect(result.current.view.x).toBe(50)
      expect(result.current.view.y).toBe(30)
      unmount()
    })

    it("does not pan on right click", () => {
      const { result, container, unmount } = renderZoomPinch()

      firePointerDown(container, { clientX: 100, clientY: 100, button: 2 })
      firePointerMove({ clientX: 150, clientY: 130 })
      firePointerUp()

      expect(result.current.view.x).toBe(0)
      expect(result.current.view.y).toBe(0)
      unmount()
    })

    it("accumulates multiple drag moves", () => {
      const { result, container, unmount } = renderZoomPinch()

      firePointerDown(container, { clientX: 0, clientY: 0 })
      firePointerMove({ clientX: 10, clientY: 5 })
      firePointerMove({ clientX: 30, clientY: 20 })
      firePointerUp()

      expect(result.current.view.x).toBe(30)
      expect(result.current.view.y).toBe(20)
      unmount()
    })
  })

  // ── Pinch zoom ─────────────────────────────────────────────────

  describe("pinch zoom", () => {
    it("zooms in on pinch spread", () => {
      const { result, container, unmount } = renderZoomPinch()

      // Two fingers close together
      fireTouchStart(container, [
        { x: 350, y: 300 },
        { x: 450, y: 300 },
      ])

      // Spread apart
      fireTouchMove(container, [
        { x: 300, y: 300 },
        { x: 500, y: 300 },
      ])

      fireTouchEnd(container)

      expect(result.current.view.zoom).toBeGreaterThan(1)
      unmount()
    })

    it("zooms out on pinch squeeze", () => {
      const { result, container, unmount } = renderZoomPinch({
        initialViewState: { x: 0, y: 0, zoom: 2 },
      })

      // Two fingers far apart
      fireTouchStart(container, [
        { x: 200, y: 300 },
        { x: 600, y: 300 },
      ])

      // Squeeze together
      fireTouchMove(container, [
        { x: 350, y: 300 },
        { x: 450, y: 300 },
      ])

      fireTouchEnd(container)

      expect(result.current.view.zoom).toBeLessThan(2)
      unmount()
    })
  })

  // ── Controlled mode ────────────────────────────────────────────

  describe("controlled mode", () => {
    it("calls onViewStateChange on gesture", () => {
      const onChange = vi.fn()
      const { container, unmount } = renderZoomPinch({
        viewState: { x: 0, y: 0, zoom: 1 },
        onViewStateChange: onChange,
      })

      fireWheel(container, { deltaY: 10.5, deltaMode: 0 })

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ zoom: 1 }))
      unmount()
    })

    it("reflects external viewState changes", () => {
      const { result, rerender, unmount } = renderZoomPinch({
        viewState: { x: 0, y: 0, zoom: 1 },
        onViewStateChange: () => {},
      })

      expect(result.current.view.zoom).toBe(1)

      rerender({
        viewState: { x: 10, y: 20, zoom: 3 },
        onViewStateChange: () => {},
      })

      expect(result.current.view).toMatchObject({ x: 10, y: 20, zoom: 3 })
      unmount()
    })
  })

  // ── Imperative methods ─────────────────────────────────────────

  describe("setView", () => {
    it("sets view imperatively", () => {
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.setView({ x: 100, y: 200, zoom: 3 })
      })

      expect(result.current.view).toMatchObject({ x: 100, y: 200, zoom: 3 })
      unmount()
    })
  })

  describe("centerZoom", () => {
    it("zooms to target level centered on container", () => {
      const { result, unmount } = renderZoomPinch()

      act(() => {
        result.current.centerZoom(2)
      })

      expect(result.current.view.zoom).toBe(2)
      // Container center is 400,300. Zoom 1→2, so:
      // x = 400 - (400 - 0) * 2 = -400
      // y = 300 - (300 - 0) * 2 = -300
      expect(result.current.view.x).toBe(-400)
      expect(result.current.view.y).toBe(-300)
      unmount()
    })
  })

  describe("resetView", () => {
    it("resets to default view", () => {
      const { result, unmount } = renderZoomPinch({
        initialViewState: { x: 100, y: 200, zoom: 3 },
      })

      act(() => {
        result.current.resetView()
      })

      expect(result.current.view).toEqual({ x: 0, y: 0, zoom: 1, rotation: 0 })
      unmount()
    })
  })

  // ── enabled toggle ─────────────────────────────────────────────

  describe("enabled", () => {
    it("ignores gestures when disabled", () => {
      const { result, container, unmount } = renderZoomPinch({ enabled: false })

      fireWheel(container, { deltaY: 120, deltaMode: 0 })

      firePointerDown(container, { clientX: 100, clientY: 100 })
      firePointerMove({ clientX: 200, clientY: 200 })
      firePointerUp()

      expect(result.current.view).toEqual({ x: 0, y: 0, zoom: 1, rotation: 0 })
      unmount()
    })
  })

  // ── Scale clamping ─────────────────────────────────────────────

  describe("scale clamping", () => {
    it("clamps zoom to minScale", () => {
      const { result, unmount } = renderZoomPinch({ minScale: 0.5 })

      act(() => {
        result.current.centerZoom(0.1)
      })

      expect(result.current.view.zoom).toBe(0.5)
      unmount()
    })

    it("clamps zoom to maxScale", () => {
      const { result, unmount } = renderZoomPinch({ maxScale: 5 })

      act(() => {
        result.current.centerZoom(10)
      })

      expect(result.current.view.zoom).toBe(5)
      unmount()
    })
  })
})
