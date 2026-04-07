import { type RefObject, useCallback, useEffect, useRef, useState } from "react"

export interface ViewState {
  x: number
  y: number
  zoom: number
}

export interface UseZoomPinchOptions {
  /** Ref to the container element that receives gesture events. */
  containerRef: RefObject<HTMLElement | null>
  /** Minimum allowed zoom level. @default 0.1 */
  minScale?: number
  /** Maximum allowed zoom level. @default 50 */
  maxScale?: number
  /** Multiplier for pan speed (mouse wheel only). @default 1 */
  panSpeed?: number
  /** Multiplier for zoom speed (mouse wheel only). @default 1 */
  zoomSpeed?: number
  /** Initial view state used when uncontrolled. @default \{ x: 0, y: 0, zoom: 1 \} */
  initialViewState?: ViewState
  /** Controlled view state. When provided, the hook becomes controlled. */
  viewState?: ViewState
  /** Callback fired on every view change. Required for controlled mode. */
  onViewStateChange?: (view: ViewState) => void
  /** Enable or disable all gesture handling. @default true */
  enabled?: boolean
}

export interface UseZoomPinchReturn {
  /** Current view state (position + zoom). */
  view: ViewState
  /** Imperatively set the view state. */
  setView: (view: ViewState) => void
  /** Zoom to a target level, keeping the container center as anchor. */
  centerZoom: (targetZoom: number) => void
  /** Reset view to \{ x: 0, y: 0, zoom: 1 \}. */
  resetView: () => void
}

const DEFAULT_VIEW: ViewState = { x: 0, y: 0, zoom: 1 }

/**
 * React hook for pan, pinch-to-zoom, and scroll-zoom gestures.
 *
 * Supports mouse wheel (discrete + trackpad), pointer drag, and multi-touch pinch.
 * Works in both controlled (`viewState` + `onViewStateChange`) and uncontrolled modes.
 */
export function useZoomPinch({
  containerRef,
  minScale = 0.1,
  maxScale = 50,
  panSpeed = 1,
  zoomSpeed = 1,
  initialViewState = DEFAULT_VIEW,
  viewState,
  onViewStateChange,
  enabled = true,
}: UseZoomPinchOptions): UseZoomPinchReturn {
  const [internalView, setInternalView] = useState<ViewState>(initialViewState)

  const view = viewState ?? internalView

  // All mutable values accessed from listeners live in refs
  // so the useEffect never re-runs on prop changes.
  const viewRef = useRef(view)
  viewRef.current = view

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const onViewStateChangeRef = useRef(onViewStateChange)
  onViewStateChangeRef.current = onViewStateChange

  const configRef = useRef({ minScale, maxScale, panSpeed, zoomSpeed })
  configRef.current = { minScale, maxScale, panSpeed, zoomSpeed }

  const updateView = useCallback((updater: (prev: ViewState) => ViewState) => {
    const prev = viewRef.current
    const next = updater(prev)
    if (next.x === prev.x && next.y === prev.y && next.zoom === prev.zoom) {
      return
    }
    if (onViewStateChangeRef.current) {
      onViewStateChangeRef.current(next)
    } else {
      setInternalView(next)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const getRelCoords = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      return { px: clientX - rect.left, py: clientY - rect.top }
    }

    // ── Wheel (scroll-to-pan / pinch-to-zoom on trackpad) ──────────

    const onWheel = (e: WheelEvent) => {
      if (!enabledRef.current) return
      e.preventDefault() // after enabled check — preserves native scroll when disabled

      let deltaX = e.deltaX
      let deltaY = e.deltaY
      const { ctrlKey, clientX, clientY } = e

      // Trackpad heuristic: pixel-mode deltas (deltaMode === 0) with
      // non-line-step values strongly suggest a trackpad.
      const isTrackpad = e.deltaMode === 0 && (Math.abs(deltaY) < 100 || !Number.isInteger(deltaY))

      if (!isTrackpad) {
        const LINE_STEP = 120
        if (Math.abs(deltaY) >= 100) deltaY = Math.sign(deltaY) * (Math.abs(deltaY) / LINE_STEP)
        if (Math.abs(deltaX) >= 100) deltaX = Math.sign(deltaX) * (Math.abs(deltaX) / LINE_STEP)
      }

      const { minScale, maxScale, panSpeed, zoomSpeed } = configRef.current

      updateView((prev) => {
        if (ctrlKey) {
          const speed = isTrackpad ? 0.01 : 0.1 * zoomSpeed
          const factor = 1 - deltaY * speed
          const newZoom = clamp(prev.zoom * factor, minScale, maxScale)
          if (newZoom === prev.zoom) return prev

          const { px, py } = getRelCoords(clientX, clientY)
          const s = newZoom / prev.zoom
          return { zoom: newZoom, x: px - (px - prev.x) * s, y: py - (py - prev.y) * s }
        }

        const multiplier = isTrackpad ? 1 : 25 * panSpeed
        return { ...prev, x: prev.x - deltaX * multiplier, y: prev.y - deltaY * multiplier }
      })
    }

    // ── Pointer drag (mouse + single-touch panning) ────────────────

    let isDragging = false
    let lastPointer = { x: 0, y: 0 }
    const activePointers = new Set<number>()

    const onPointerDown = (e: PointerEvent) => {
      if (!enabledRef.current) return
      activePointers.add(e.pointerId)
      if (e.pointerType === "mouse" && e.button !== 0) return

      if (activePointers.size >= 2) {
        isDragging = false
        return
      }

      isDragging = true
      lastPointer = { x: e.clientX, y: e.clientY }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const dx = e.clientX - lastPointer.x
      const dy = e.clientY - lastPointer.y
      lastPointer = { x: e.clientX, y: e.clientY }

      updateView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    }

    const onPointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId)
      if (activePointers.size === 0) isDragging = false
    }

    // ── Multi-touch pinch (mobile) ─────────────────────────────────

    let pinchState = { zoom: 1, x: 0, y: 0 }
    let initialDist = 0
    let initialCenter = { x: 0, y: 0 }
    let isPinching = false

    const onTouchStart = (e: TouchEvent) => {
      if (!enabledRef.current || e.touches.length < 2) return

      isDragging = false
      isPinching = true

      const t1 = e.touches[0]!
      const t2 = e.touches[1]!

      initialDist = distance(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
      initialCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
      pinchState = { ...viewRef.current }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length < 2 || !isPinching) return
      e.preventDefault()

      const t1 = e.touches[0]!
      const t2 = e.touches[1]!

      const { minScale, maxScale } = configRef.current
      const currentDist = distance(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
      const currentCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }

      const newZoom = clamp(pinchState.zoom * (currentDist / initialDist), minScale, maxScale)
      const s = newZoom / pinchState.zoom
      const { px, py } = getRelCoords(initialCenter.x, initialCenter.y)

      updateView(() => ({
        zoom: newZoom,
        x: px - (px - pinchState.x) * s + (currentCenter.x - initialCenter.x),
        y: py - (py - pinchState.y) * s + (currentCenter.y - initialCenter.y),
      }))
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) isPinching = false
    }

    // ── Register listeners ─────────────────────────────────────────

    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove, { passive: false })
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
    el.addEventListener("touchstart", onTouchStart, { passive: false })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd)
    el.addEventListener("touchcancel", onTouchEnd)

    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchEnd)
    }
  }, [containerRef, updateView])

  const setView = useCallback((v: ViewState) => {
    if (onViewStateChangeRef.current) {
      onViewStateChangeRef.current(v)
    } else {
      setInternalView(v)
    }
  }, [])

  const centerZoom = useCallback(
    (targetZoom: number) => {
      updateView((prev) => {
        const { minScale, maxScale } = configRef.current
        const newZoom = clamp(targetZoom, minScale, maxScale)
        const cx = (containerRef.current?.offsetWidth ?? 0) / 2
        const cy = (containerRef.current?.offsetHeight ?? 0) / 2
        const s = newZoom / prev.zoom
        return { zoom: newZoom, x: cx - (cx - prev.x) * s, y: cy - (cy - prev.y) * s }
      })
    },
    [containerRef, updateView],
  )

  const resetView = useCallback(() => setView(DEFAULT_VIEW), [setView])

  return { view, setView, centerZoom, resetView }
}

// ── Helpers ──────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dx * dx + dy * dy)
}
