import { useCallback, useEffect, useRef, useState } from "react"
import { easeOut } from "./easings"
import type {
  AnimationOptions,
  CursorOptions,
  DoubleTapOptions,
  GesturesOptions,
  InertiaOptions,
  KeyboardOptions,
  SnapToGridOptions,
  UseZoomPinchOptions,
  UseZoomPinchReturn,
  ViewState,
} from "./types"

const DEFAULT_VIEW: ViewState = { x: 0, y: 0, zoom: 1, rotation: 0 }
const DEFAULT_GESTURES: Required<GesturesOptions> = { pan: true, zoom: true, rotate: false }
const DEFAULT_KEYBOARD: Required<KeyboardOptions> = {
  enabled: false,
  panStep: 50,
  zoomStep: 1.5,
  rotateStep: 15,
}

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
  shouldHandleEvent,
  gestures: gesturesProp,
  bounds,
  panButton = 0,
  keyboard: keyboardProp,
  zoomSnapLevels,
  snapToGrid: snapToGridProp,
  contentRect,
  rotation: rotationOptions,
  wheelMode = "pan",
  cursor: cursorProp,
  axis,
  activationKeys,
  onPanStart,
  onPanEnd,
  onZoomStart,
  onZoomEnd,
  onPinchStart,
  onPinchEnd,
  onRotateStart,
  onRotateEnd,
  onTransformEnd,
  doubleTap: doubleTapProp,
  inertia: inertiaProp,
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

  // Track the user-provided initial view so resetView / keyboard "0"
  // can return to it instead of the hardcoded DEFAULT_VIEW.
  const initialViewStateRef = useRef(initialViewState)
  initialViewStateRef.current = initialViewState

  const shouldHandleEventRef = useRef(shouldHandleEvent)
  shouldHandleEventRef.current = shouldHandleEvent

  const doubleTapConfig: DoubleTapOptions | false =
    doubleTapProp === false ? false : { enabled: true, mode: "toggle", step: 2, ...doubleTapProp }
  const doubleTapRef = useRef(doubleTapConfig)
  doubleTapRef.current = doubleTapConfig

  const inertiaConfig: InertiaOptions | false =
    inertiaProp === false ? false : { enabled: true, friction: 0.92, ...inertiaProp }
  const inertiaRef = useRef(inertiaConfig)
  inertiaRef.current = inertiaConfig

  // Granular event refs
  const onPanStartRef = useRef(onPanStart)
  onPanStartRef.current = onPanStart
  const onPanEndRef = useRef(onPanEnd)
  onPanEndRef.current = onPanEnd
  const onZoomStartRef = useRef(onZoomStart)
  onZoomStartRef.current = onZoomStart
  const onZoomEndRef = useRef(onZoomEnd)
  onZoomEndRef.current = onZoomEnd
  const onPinchStartRef = useRef(onPinchStart)
  onPinchStartRef.current = onPinchStart
  const onPinchEndRef = useRef(onPinchEnd)
  onPinchEndRef.current = onPinchEnd
  const onRotateStartRef = useRef(onRotateStart)
  onRotateStartRef.current = onRotateStart
  const onRotateEndRef = useRef(onRotateEnd)
  onRotateEndRef.current = onRotateEnd
  const onTransformEndRef = useRef(onTransformEnd)
  onTransformEndRef.current = onTransformEnd

  const gesturesConfig: Required<GesturesOptions> = { ...DEFAULT_GESTURES, ...gesturesProp }
  const gesturesRef = useRef(gesturesConfig)
  gesturesRef.current = gesturesConfig

  const boundsRef = useRef(bounds)
  boundsRef.current = bounds

  const panButtonRef = useRef(panButton)
  panButtonRef.current = panButton

  const keyboardConfig: Required<KeyboardOptions> =
    keyboardProp === true
      ? { ...DEFAULT_KEYBOARD, enabled: true }
      : keyboardProp
        ? { ...DEFAULT_KEYBOARD, ...keyboardProp }
        : DEFAULT_KEYBOARD
  const keyboardRef = useRef(keyboardConfig)
  keyboardRef.current = keyboardConfig

  const zoomSnapLevelsRef = useRef(zoomSnapLevels)
  zoomSnapLevelsRef.current = zoomSnapLevels

  const snapToGridConfig: SnapToGridOptions | false =
    snapToGridProp === false || snapToGridProp === undefined
      ? false
      : { mode: "end", ...snapToGridProp }
  const snapToGridRef = useRef(snapToGridConfig)
  snapToGridRef.current = snapToGridConfig

  const contentRectRef = useRef(contentRect)
  contentRectRef.current = contentRect

  const rotationOptionsRef = useRef(rotationOptions)
  rotationOptionsRef.current = rotationOptions

  const wheelModeRef = useRef(wheelMode)
  wheelModeRef.current = wheelMode

  const cursorConfig: CursorOptions | false =
    cursorProp === false
      ? false
      : { enabled: true, idle: "grab", dragging: "grabbing", zooming: "zoom-in", ...cursorProp }
  const cursorRef = useRef(cursorConfig)
  cursorRef.current = cursorConfig

  const axisRef = useRef(axis)
  axisRef.current = axis

  const activationKeysRef = useRef(activationKeys)
  activationKeysRef.current = activationKeys

  // ── Animation ──────────────────────────────────────────────────

  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)
  const inertiaFrameRef = useRef<number | null>(null)

  const cancelInertia = useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current)
      inertiaFrameRef.current = null
    }
  }, [])

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
      setIsAnimating(false)
    }
    cancelInertia()
  }, [cancelInertia])

  // ── Core update ────────────────────────────────────────────────

  // Write the next view state to the store (controlled or internal),
  // skipping the no-op equality short-circuit. Used by both the
  // constrained updateView and the unconstrained setView path.
  const commitView = useCallback((next: ViewState) => {
    if (onViewStateChangeRef.current) {
      onViewStateChangeRef.current(next)
    } else {
      setInternalView(next)
    }
  }, [])

  const updateView = useCallback(
    (updater: (prev: ViewState) => ViewState, { isBounceSnap = false } = {}) => {
      const prev = viewRef.current
      let next = updater(prev)

      // Apply axis locking
      const ax = axisRef.current
      if (ax === "x") next = { ...next, y: prev.y }
      else if (ax === "y") next = { ...next, x: prev.x }

      // Apply bounds
      const b = boundsRef.current
      if (b) {
        const minX = b.minX ?? -Infinity
        const maxX = b.maxX ?? Infinity
        const minY = b.minY ?? -Infinity
        const maxY = b.maxY ?? Infinity
        if (b.mode === "bounce" && !isBounceSnap) {
          // Rubber-band: allow overshooting but with resistance
          const factor = b.bounceFactor ?? 0.3
          if (next.x < minX) next = { ...next, x: minX + (next.x - minX) * factor }
          else if (next.x > maxX) next = { ...next, x: maxX + (next.x - maxX) * factor }
          if (next.y < minY) next = { ...next, y: minY + (next.y - minY) * factor }
          else if (next.y > maxY) next = { ...next, y: maxY + (next.y - maxY) * factor }
        } else {
          next = {
            ...next,
            x: clamp(next.x, minX, maxX),
            y: clamp(next.y, minY, maxY),
          }
        }
      }

      // Apply rotation constraints
      const ro = rotationOptionsRef.current
      if (ro && next.rotation !== undefined) {
        next = {
          ...next,
          rotation: clamp(next.rotation, ro.minAngle ?? -Infinity, ro.maxAngle ?? Infinity),
        }
      }

      // Apply snap-to-grid (always mode)
      const sg = snapToGridRef.current
      if (sg && sg.mode === "always") {
        next = {
          ...next,
          x: Math.round(next.x / sg.size) * sg.size,
          y: Math.round(next.y / sg.size) * sg.size,
        }
      }

      if (
        next.x === prev.x &&
        next.y === prev.y &&
        next.zoom === prev.zoom &&
        (next.rotation ?? 0) === (prev.rotation ?? 0)
      ) {
        return
      }
      commitView(next)
    },
    [commitView],
  )

  const animateTo = useCallback(
    (target: ViewState, options: AnimationOptions = {}, onComplete?: () => void) => {
      cancelAnimation()
      const { duration = 300, easing: easingFn = easeOut } = options

      // Guard: non-positive duration jumps to the target immediately,
      // avoiding divide-by-zero (progress = Infinity) which would NaN the view.
      if (duration <= 0) {
        updateView(() => target)
        onComplete?.()
        return
      }

      setIsAnimating(true)
      const start = { ...viewRef.current }
      const startTime = performance.now()

      const startR = start.rotation ?? 0
      const targetR = target.rotation ?? 0

      const tick = () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const t = easingFn(progress)
        updateView(
          () => ({
            x: start.x + (target.x - start.x) * t,
            y: start.y + (target.y - start.y) * t,
            zoom: start.zoom + (target.zoom - start.zoom) * t,
            rotation: startR + (targetR - startR) * t,
          }),
          { isBounceSnap: true },
        )
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(tick)
        } else {
          animationRef.current = null
          setIsAnimating(false)
          onComplete?.()
        }
      }
      animationRef.current = requestAnimationFrame(tick)
    },
    [cancelAnimation, updateView],
  )

  // ── Snap on gesture end ─────────────────────────────────────────

  const snapOnEnd = useCallback(() => {
    const cur = viewRef.current
    let target = { ...cur }
    let changed = false

    // Snap zoom to nearest level
    const levels = zoomSnapLevelsRef.current
    if (levels && levels.length > 0) {
      let nearest = levels[0]!
      let minDiff = Math.abs(cur.zoom - nearest)
      for (let i = 1; i < levels.length; i++) {
        const diff = Math.abs(cur.zoom - levels[i]!)
        if (diff < minDiff) {
          minDiff = diff
          nearest = levels[i]!
        }
      }
      if (nearest !== cur.zoom) {
        const { minScale, maxScale } = configRef.current
        const newZoom = clamp(nearest, minScale, maxScale)
        const container = containerRef.current
        if (container) {
          const cx = container.offsetWidth / 2
          const cy = container.offsetHeight / 2
          const s = newZoom / cur.zoom
          target = {
            ...target,
            zoom: newZoom,
            x: cx - (cx - target.x) * s,
            y: cy - (cy - target.y) * s,
          }
          changed = true
        }
      }
    }

    // Bounce back: snap overscrolled position to bounds
    const b = boundsRef.current
    if (b && b.mode === "bounce") {
      const minX = b.minX ?? -Infinity
      const maxX = b.maxX ?? Infinity
      const minY = b.minY ?? -Infinity
      const maxY = b.maxY ?? Infinity
      const clampedX = clamp(target.x, minX, maxX)
      const clampedY = clamp(target.y, minY, maxY)
      if (clampedX !== target.x || clampedY !== target.y) {
        target = { ...target, x: clampedX, y: clampedY }
        changed = true
      }
    }

    // Snap rotation to nearest level
    const ro = rotationOptionsRef.current
    if (ro?.snapLevels && ro.snapLevels.length > 0) {
      const curR = target.rotation ?? 0
      let nearestR = ro.snapLevels[0]!
      let minRDiff = Math.abs(curR - nearestR)
      for (let i = 1; i < ro.snapLevels.length; i++) {
        const diff = Math.abs(curR - ro.snapLevels[i]!)
        if (diff < minRDiff) {
          minRDiff = diff
          nearestR = ro.snapLevels[i]!
        }
      }
      if (nearestR !== curR) {
        target = { ...target, rotation: nearestR }
        changed = true
      }
    }

    // Snap position to grid (end mode)
    const sg = snapToGridRef.current
    if (sg && sg.mode === "end") {
      const snappedX = Math.round(target.x / sg.size) * sg.size
      const snappedY = Math.round(target.y / sg.size) * sg.size
      if (snappedX !== target.x || snappedY !== target.y) {
        target = { ...target, x: snappedX, y: snappedY }
        changed = true
      }
    }

    if (changed) {
      animateTo(target, { duration: 150 })
    }
  }, [animateTo, containerRef])

  // ── Gesture listeners ──────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const getRelCoords = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      return { px: clientX - rect.left, py: clientY - rect.top }
    }

    // ── Activation key tracking ────────────────────────────────
    const pressedKeys = new Set<string>()
    const onKeyDownTrack = (e: KeyboardEvent) => pressedKeys.add(e.key)
    const onKeyUpTrack = (e: KeyboardEvent) => pressedKeys.delete(e.key)
    window.addEventListener("keydown", onKeyDownTrack)
    window.addEventListener("keyup", onKeyUpTrack)

    // ── Wheel (scroll-to-pan / pinch-to-zoom on trackpad) ──────

    let isZooming = false
    let zoomEndTimer: ReturnType<typeof setTimeout> | null = null

    let isGesturing = false

    const onWheel = (e: WheelEvent) => {
      if (!enabledRef.current) return
      if (shouldHandleEventRef.current && !shouldHandleEventRef.current(e)) return

      let deltaX = e.deltaX
      let deltaY = e.deltaY
      const { ctrlKey, clientX, clientY } = e

      const isTrackpad = e.deltaMode === 0 && (Math.abs(deltaY) < 100 || !Number.isInteger(deltaY))

      if (!isTrackpad) {
        const LINE_STEP = 120
        if (Math.abs(deltaY) >= 100) deltaY = Math.sign(deltaY) * (Math.abs(deltaY) / LINE_STEP)
        if (Math.abs(deltaX) >= 100) deltaX = Math.sign(deltaX) * (Math.abs(deltaX) / LINE_STEP)
      }

      const { minScale, maxScale, panSpeed, zoomSpeed } = configRef.current

      const g = gesturesRef.current
      const ak = activationKeysRef.current
      const wm = wheelModeRef.current

      // Determine if this wheel event should zoom or pan.
      // Default behavior: ctrlKey = zoom, otherwise = pan.
      // wheelMode: "zoom" inverts this — default is zoom, ctrlKey switches to pan.
      const isZoomEvent = wm === "zoom" ? !ctrlKey : ctrlKey

      // Decide whether this event will actually be handled BEFORE calling
      // preventDefault — otherwise we'd suppress the browser's default wheel
      // behavior (page scroll, ctrl+wheel page zoom) even when the hook ignores
      // the event (disabled gesture, or required activation key not held).
      if (isZoomEvent && (!g.zoom || isGesturing)) return
      if (isZoomEvent && ak?.zoom && !pressedKeys.has(ak.zoom)) return
      if (!isZoomEvent && !g.pan) return
      if (!isZoomEvent && ak?.pan && !pressedKeys.has(ak.pan)) return

      // The event will be consumed: suppress native behavior and take over.
      e.preventDefault()
      cancelAnimation()

      updateView((prev) => {
        if (isZoomEvent) {
          // Zoom start/end events (debounced end)
          if (!isZooming) {
            isZooming = true
            onZoomStartRef.current?.(prev)
            // Apply zooming cursor while wheel-zoom is active
            const cz = cursorRef.current
            if (cz && cz.enabled) el.style.cursor = cz.zooming ?? "zoom-in"
          }
          if (zoomEndTimer) clearTimeout(zoomEndTimer)
          zoomEndTimer = setTimeout(() => {
            isZooming = false
            onZoomEndRef.current?.(viewRef.current)
            onTransformEndRef.current?.(viewRef.current)
            // Restore idle cursor after zoom ends
            const cz = cursorRef.current
            if (cz && cz.enabled) el.style.cursor = cz.idle ?? "grab"
            snapOnEnd()
          }, 150)

          const speed = isTrackpad ? 0.01 : 0.1 * zoomSpeed
          const factor = 1 - deltaY * speed
          const newZoom = clamp(prev.zoom * factor, minScale, maxScale)
          if (newZoom === prev.zoom) return prev

          const { px, py } = getRelCoords(clientX, clientY)
          const s = newZoom / prev.zoom
          return { zoom: newZoom, x: px - (px - prev.x) * s, y: py - (py - prev.y) * s }
        }

        if (!g.pan) return prev
        const multiplier = isTrackpad ? 1 : 25 * panSpeed
        return { ...prev, x: prev.x - deltaX * multiplier, y: prev.y - deltaY * multiplier }
      })
    }

    // ── Double-tap detection ──────────────────────────────────

    let lastTapTime = 0
    let lastTapX = 0
    let lastTapY = 0
    const DOUBLE_TAP_DELAY = 300
    const DOUBLE_TAP_DISTANCE = 25

    const handleDoubleTap = (clientX: number, clientY: number) => {
      const dt = doubleTapRef.current
      if (dt === false || !dt.enabled) return

      const { mode = "toggle", step = 2 } = dt
      const { minScale, maxScale } = configRef.current
      const prev = viewRef.current
      const { px, py } = getRelCoords(clientX, clientY)

      let targetZoom: number
      if (mode === "zoomIn") {
        targetZoom = clamp(prev.zoom * step, minScale, maxScale)
      } else if (mode === "reset") {
        targetZoom = initialViewStateRef.current.zoom
      } else {
        // toggle: if zoomed in, reset; otherwise zoom in
        const isZoomedIn = prev.zoom > 1.05
        targetZoom = isZoomedIn
          ? initialViewStateRef.current.zoom
          : clamp(prev.zoom * step, minScale, maxScale)
      }

      if (mode === "reset" || (mode === "toggle" && prev.zoom > 1.05)) {
        // Reset/toggle-back returns to the user-provided initialViewState
        // (preserves any custom x/y/zoom/rotation), consistent with resetView().
        animateTo(initialViewStateRef.current, { duration: 300 }, () =>
          onTransformEndRef.current?.(viewRef.current),
        )
      } else {
        const s = targetZoom / prev.zoom
        animateTo(
          { zoom: targetZoom, x: px - (px - prev.x) * s, y: py - (py - prev.y) * s },
          { duration: 300 },
          () => onTransformEndRef.current?.(viewRef.current),
        )
      }
    }

    // ── Pointer drag (mouse + single-touch panning) ────────────

    let isDragging = false
    let lastPointer = { x: 0, y: 0 }
    let dragMoved = false
    const activePointers = new Set<number>()

    // Velocity tracking for inertia
    let velocityX = 0
    let velocityY = 0
    let lastMoveTime = 0

    const onPointerDown = (e: PointerEvent) => {
      if (!enabledRef.current) return
      if (shouldHandleEventRef.current && !shouldHandleEventRef.current(e)) return
      cancelAnimation()
      activePointers.add(e.pointerId)
      if (e.pointerType === "mouse" && e.button !== panButtonRef.current) return

      if (activePointers.size >= 2) {
        isDragging = false
        return
      }

      if (!gesturesRef.current.pan) return
      const akPan = activationKeysRef.current?.pan
      if (akPan && !pressedKeys.has(akPan)) return
      isDragging = true
      dragMoved = false
      const cc2 = cursorRef.current
      if (cc2 && cc2.enabled) setCursor(cc2.dragging ?? "grabbing")
      lastPointer = { x: e.clientX, y: e.clientY }
      velocityX = 0
      velocityY = 0
      lastMoveTime = performance.now()
      onPanStartRef.current?.(viewRef.current)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      e.preventDefault()

      const now = performance.now()
      const dx = e.clientX - lastPointer.x
      const dy = e.clientY - lastPointer.y
      const dt = now - lastMoveTime

      if (dt > 0) {
        // Exponential smoothing for velocity
        const alpha = 0.8
        velocityX = alpha * ((dx / dt) * 16) + (1 - alpha) * velocityX
        velocityY = alpha * ((dy / dt) * 16) + (1 - alpha) * velocityY
      }

      lastPointer = { x: e.clientX, y: e.clientY }
      lastMoveTime = now
      dragMoved = true

      updateView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    }

    const startInertia = (): boolean => {
      const ic = inertiaRef.current
      if (ic === false || !ic.enabled) return false
      if (Math.abs(velocityX) < 0.5 && Math.abs(velocityY) < 0.5) return false

      const { friction = 0.92 } = ic
      let vx = velocityX
      let vy = velocityY

      const tick = () => {
        vx *= friction
        vy *= friction
        if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) {
          inertiaFrameRef.current = null
          snapOnEnd()
          // Transform fully settled: fire the unified end callback.
          onTransformEndRef.current?.(viewRef.current)
          return
        }
        updateView((prev) => ({ ...prev, x: prev.x + vx, y: prev.y + vy }))
        inertiaFrameRef.current = requestAnimationFrame(tick)
      }
      inertiaFrameRef.current = requestAnimationFrame(tick)
      return true
    }

    const onPointerUp = (e: PointerEvent) => {
      const wasDragging = isDragging
      activePointers.delete(e.pointerId)
      if (activePointers.size === 0) isDragging = false
      if (wasDragging && activePointers.size === 0) {
        onPanEndRef.current?.(viewRef.current)
        const cc3 = cursorRef.current
        if (cc3 && cc3.enabled) setCursor(cc3.idle ?? "grab")

        // Double-tap detection (only if pointer didn't drag)
        if (!dragMoved) {
          const now = performance.now()
          const dx = e.clientX - lastTapX
          const dy = e.clientY - lastTapY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (now - lastTapTime < DOUBLE_TAP_DELAY && dist < DOUBLE_TAP_DISTANCE) {
            handleDoubleTap(e.clientX, e.clientY)
            lastTapTime = 0 // reset to avoid triple-tap
          } else {
            lastTapTime = now
            lastTapX = e.clientX
            lastTapY = e.clientY
          }
        } else {
          // Inertia: start momentum after drag, then snap.
          // onTransformEnd fires once inertia fully settles (or immediately below
          // when there is no inertia) — not at pointer-up, so consumers observe
          // the final resting position rather than a mid-motion snapshot.
          if (!startInertia()) {
            snapOnEnd()
            onTransformEndRef.current?.(viewRef.current)
          }
          lastTapTime = 0 // reset double-tap after drag
        }
      }
    }

    // ── Multi-touch pinch + rotate (mobile) ──────────────────────

    let pinchState: ViewState = { zoom: 1, x: 0, y: 0, rotation: 0 }
    let initialDist = 0
    let initialAngle = 0
    let initialCenter = { x: 0, y: 0 }
    let isPinching = false

    const onTouchStart = (e: TouchEvent) => {
      if (!enabledRef.current || e.touches.length < 2) return
      if (shouldHandleEventRef.current && !shouldHandleEventRef.current(e)) return
      const g = gesturesRef.current
      if (!g.zoom && !g.rotate) return
      cancelAnimation()

      isDragging = false
      isPinching = true

      const t1 = e.touches[0]!
      const t2 = e.touches[1]!

      initialDist = distance(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
      initialAngle = angleBetween(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
      initialCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
      pinchState = { ...viewRef.current, rotation: viewRef.current.rotation ?? 0 }
      onPinchStartRef.current?.(viewRef.current)
      if (g.rotate) onRotateStartRef.current?.(viewRef.current)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length < 2 || !isPinching) return
      if (shouldHandleEventRef.current && !shouldHandleEventRef.current(e)) return
      e.preventDefault()

      const t1 = e.touches[0]!
      const t2 = e.touches[1]!
      const g = gesturesRef.current

      const { minScale, maxScale } = configRef.current
      const currentDist = distance(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
      const currentCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      }

      const newZoom = g.zoom
        ? clamp(pinchState.zoom * (currentDist / initialDist), minScale, maxScale)
        : pinchState.zoom
      const s = newZoom / pinchState.zoom
      const { px, py } = getRelCoords(initialCenter.x, initialCenter.y)

      const currentAngle = angleBetween(t1.clientX, t1.clientY, t2.clientX, t2.clientY)
      const akRotate = activationKeysRef.current?.rotate
      const rotateAllowed = g.rotate && !isGesturing && (!akRotate || pressedKeys.has(akRotate))
      const newRotation = rotateAllowed
        ? pinchState.rotation! + (currentAngle - initialAngle)
        : (pinchState.rotation ?? 0)

      // Rotation delta in radians for coordinate compensation
      const dr = ((newRotation - (pinchState.rotation ?? 0)) * Math.PI) / 180
      const cosDr = Math.cos(dr)
      const sinDr = Math.sin(dr)
      const ox = px - pinchState.x
      const oy = py - pinchState.y
      const dx = currentCenter.x - initialCenter.x
      const dy = currentCenter.y - initialCenter.y

      updateView(() => ({
        zoom: newZoom,
        x: px + dx - s * (ox * cosDr - oy * sinDr),
        y: py + dy - s * (ox * sinDr + oy * cosDr),
        rotation: newRotation,
      }))
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && isPinching) {
        isPinching = false
        onPinchEndRef.current?.(viewRef.current)
        if (gesturesRef.current.rotate) onRotateEndRef.current?.(viewRef.current)
        onTransformEndRef.current?.(viewRef.current)
        snapOnEnd()
      }
    }

    // ── Safari GestureEvent (trackpad rotation on macOS) ────────

    let gestureBaseRotation = 0
    let gestureBaseZoom = 1
    let gestureBaseX = 0
    let gestureBaseY = 0

    const onGestureStart = (e: Event) => {
      if (!enabledRef.current) return
      e.preventDefault()
      cancelAnimation()
      isGesturing = true
      const cur = viewRef.current
      gestureBaseRotation = cur.rotation ?? 0
      gestureBaseZoom = cur.zoom
      gestureBaseX = cur.x
      gestureBaseY = cur.y
    }

    const onGestureChange = (e: Event) => {
      if (!enabledRef.current || !isGesturing) return
      e.preventDefault()
      const ge = e as Event & { scale: number; rotation: number }
      const g = gesturesRef.current
      const { minScale, maxScale } = configRef.current

      const newZoom = g.zoom
        ? clamp(gestureBaseZoom * ge.scale, minScale, maxScale)
        : gestureBaseZoom
      const akRotate = activationKeysRef.current?.rotate
      const rotateAllowed = g.rotate && (!akRotate || pressedKeys.has(akRotate))
      const newRotation = rotateAllowed ? gestureBaseRotation + ge.rotation : gestureBaseRotation

      // Anchor both zoom and rotation to container center
      const cx = (el.offsetWidth ?? 0) / 2
      const cy = (el.offsetHeight ?? 0) / 2
      const s = newZoom / gestureBaseZoom
      const dr = ((newRotation - gestureBaseRotation) * Math.PI) / 180
      const cosDr = Math.cos(dr)
      const sinDr = Math.sin(dr)
      const ox = cx - gestureBaseX
      const oy = cy - gestureBaseY

      updateView(() => ({
        zoom: newZoom,
        x: cx - s * (ox * cosDr - oy * sinDr),
        y: cy - s * (ox * sinDr + oy * cosDr),
        rotation: newRotation,
      }))
    }

    const onGestureEnd = (e: Event) => {
      e.preventDefault()
      isGesturing = false
    }

    // ── Keyboard navigation ─────────────────────────────────────

    // Set tabIndex on container so it can receive keyboard focus
    if (keyboardRef.current.enabled && !el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "0")
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return
      const kb = keyboardRef.current
      if (!kb.enabled) return
      // Don't capture when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      const g = gesturesRef.current
      let handled = false

      switch (e.key) {
        case "ArrowLeft":
          if (g.pan) {
            updateView((p) => ({ ...p, x: p.x + kb.panStep }))
            handled = true
          }
          break
        case "ArrowRight":
          if (g.pan) {
            updateView((p) => ({ ...p, x: p.x - kb.panStep }))
            handled = true
          }
          break
        case "ArrowUp":
          if (g.pan) {
            updateView((p) => ({ ...p, x: p.x, y: p.y + kb.panStep }))
            handled = true
          }
          break
        case "ArrowDown":
          if (g.pan) {
            updateView((p) => ({ ...p, x: p.x, y: p.y - kb.panStep }))
            handled = true
          }
          break
        case "+":
        case "=":
          if (g.zoom) {
            const { minScale, maxScale } = configRef.current
            const ctr = el
            const cx = ctr.offsetWidth / 2
            const cy = ctr.offsetHeight / 2
            updateView((p) => {
              const nz = clamp(p.zoom * kb.zoomStep, minScale, maxScale)
              const s = nz / p.zoom
              return { ...p, zoom: nz, x: cx - (cx - p.x) * s, y: cy - (cy - p.y) * s }
            })
            handled = true
          }
          break
        case "-":
          if (g.zoom) {
            const { minScale, maxScale } = configRef.current
            const ctr = el
            const cx2 = ctr.offsetWidth / 2
            const cy2 = ctr.offsetHeight / 2
            updateView((p) => {
              const nz = clamp(p.zoom / kb.zoomStep, minScale, maxScale)
              const s = nz / p.zoom
              return { ...p, zoom: nz, x: cx2 - (cx2 - p.x) * s, y: cy2 - (cy2 - p.y) * s }
            })
            handled = true
          }
          break
        case "0":
          cancelAnimation()
          updateView(() => initialViewStateRef.current)
          handled = true
          break
        case "[":
          if (g.rotate) {
            const akR0 = activationKeysRef.current?.rotate
            if (akR0 && !pressedKeys.has(akR0)) break
            updateView((p) => ({ ...p, rotation: (p.rotation ?? 0) - kb.rotateStep }))
            handled = true
          }
          break
        case "]":
          if (g.rotate) {
            const akR1 = activationKeysRef.current?.rotate
            if (akR1 && !pressedKeys.has(akR1)) break
            updateView((p) => ({ ...p, rotation: (p.rotation ?? 0) + kb.rotateStep }))
            handled = true
          }
          break
      }

      if (handled) e.preventDefault()
    }

    // ── Cursor management ──────────────────────────────────────

    let savedCursor: string | null = null
    const setCursor = (cursor: string) => {
      el.style.cursor = cursor
    }
    const cc = cursorRef.current
    if (cc && cc.enabled) {
      savedCursor = el.style.cursor
      setCursor(cc.idle ?? "grab")
    }

    // ── Clear activation keys on focus loss ─────────────────────
    // If the user alt-tabs while holding Shift/Alt/Control, the keyup
    // never fires and the key would "stick". Reset on blur/visibilitychange.

    const clearPressedKeys = () => pressedKeys.clear()
    window.addEventListener("blur", clearPressedKeys)
    document.addEventListener("visibilitychange", clearPressedKeys)

    // ── Suppress native context menu when panning with right mouse button
    const onContextMenu = (e: MouseEvent) => {
      if (panButtonRef.current === 2) e.preventDefault()
    }
    el.addEventListener("contextmenu", onContextMenu)

    // ── Register listeners ─────────────────────────────────────

    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove, { passive: false })
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
    el.addEventListener("touchstart", onTouchStart, { passive: false })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd)
    el.addEventListener("touchcancel", onTouchEnd)

    // Safari GestureEvent (non-standard, trackpad rotation on macOS + touch on iOS)
    el.addEventListener("gesturestart", onGestureStart, { passive: false } as EventListenerOptions)
    el.addEventListener("gesturechange", onGestureChange, {
      passive: false,
    } as EventListenerOptions)
    el.addEventListener("gestureend", onGestureEnd, { passive: false } as EventListenerOptions)
    el.addEventListener("keydown", onKeyDown)

    return () => {
      cancelAnimation() // also cancels inertia
      if (zoomEndTimer) clearTimeout(zoomEndTimer)
      if (savedCursor !== null) el.style.cursor = savedCursor
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchEnd)
      el.removeEventListener("gesturestart", onGestureStart)
      el.removeEventListener("gesturechange", onGestureChange)
      el.removeEventListener("gestureend", onGestureEnd)
      el.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("blur", clearPressedKeys)
      document.removeEventListener("visibilitychange", clearPressedKeys)
      el.removeEventListener("contextmenu", onContextMenu)
      window.removeEventListener("keydown", onKeyDownTrack)
      window.removeEventListener("keyup", onKeyUpTrack)
    }
  }, [containerRef, updateView, cancelAnimation, animateTo, cancelInertia, snapOnEnd])

  // ── Imperative methods ─────────────────────────────────────────

  const setView = useCallback(
    (v: ViewState, options?: AnimationOptions) => {
      if (options?.animate) {
        animateTo(v, options)
        return
      }
      cancelAnimation()
      if (options?.skipConstraints) {
        // Bypass bounds/axis/snap: write the view verbatim.
        commitView(v)
        return
      }
      updateView(() => v)
    },
    [animateTo, cancelAnimation, updateView, commitView],
  )

  const centerZoom = useCallback(
    (targetZoom: number, options?: AnimationOptions) => {
      const { minScale, maxScale } = configRef.current
      const newZoom = clamp(targetZoom, minScale, maxScale)
      const cx = (containerRef.current?.offsetWidth ?? 0) / 2
      const cy = (containerRef.current?.offsetHeight ?? 0) / 2
      const prev = viewRef.current
      const s = newZoom / prev.zoom
      const target: ViewState = {
        zoom: newZoom,
        x: cx - (cx - prev.x) * s,
        y: cy - (cy - prev.y) * s,
      }
      if (options?.animate) {
        animateTo(target, options)
      } else {
        cancelAnimation()
        updateView(() => target)
      }
    },
    [containerRef, updateView, animateTo, cancelAnimation],
  )

  const resetView = useCallback(
    (options?: AnimationOptions) => setView(initialViewStateRef.current, options),
    [setView],
  )

  const zoomIn = useCallback(
    (step = 1.5, options?: AnimationOptions) => {
      centerZoom(viewRef.current.zoom * step, options)
    },
    [centerZoom],
  )

  const zoomOut = useCallback(
    (step = 1.5, options?: AnimationOptions) => {
      centerZoom(viewRef.current.zoom / step, options)
    },
    [centerZoom],
  )

  const panTo = useCallback(
    (x: number, y: number, options?: AnimationOptions) => {
      const container = containerRef.current
      if (!container) return
      const cur = viewRef.current
      const target: ViewState = {
        x: container.offsetWidth / 2 - x * cur.zoom,
        y: container.offsetHeight / 2 - y * cur.zoom,
        zoom: cur.zoom,
      }
      if (options?.animate) {
        animateTo(target, options)
      } else {
        cancelAnimation()
        updateView(() => target)
      }
    },
    [containerRef, updateView, animateTo, cancelAnimation],
  )

  const panBy = useCallback(
    (dx: number, dy: number, options?: AnimationOptions) => {
      const cur = viewRef.current
      const target: ViewState = {
        x: cur.x + dx,
        y: cur.y + dy,
        zoom: cur.zoom,
      }
      if (options?.animate) {
        animateTo(target, options)
      } else {
        cancelAnimation()
        updateView(() => target)
      }
    },
    [updateView, animateTo, cancelAnimation],
  )

  const zoomTo = useCallback(
    (targetZoom: number, point?: { x: number; y: number }, options?: AnimationOptions) => {
      const container = containerRef.current
      if (!container) return
      const { minScale, maxScale } = configRef.current
      const newZoom = clamp(targetZoom, minScale, maxScale)
      const prev = viewRef.current
      const s = newZoom / prev.zoom
      let target: ViewState
      if (point) {
        // Zoom centered on a content-space point
        target = {
          zoom: newZoom,
          x: container.offsetWidth / 2 - point.x * newZoom,
          y: container.offsetHeight / 2 - point.y * newZoom,
        }
      } else {
        // Zoom centered on container center (same as centerZoom)
        const cx = container.offsetWidth / 2
        const cy = container.offsetHeight / 2
        target = {
          zoom: newZoom,
          x: cx - (cx - prev.x) * s,
          y: cy - (cy - prev.y) * s,
        }
      }
      if (options?.animate) {
        animateTo(target, options)
      } else {
        cancelAnimation()
        updateView(() => target)
      }
    },
    [containerRef, updateView, animateTo, cancelAnimation],
  )

  const fitToRect = useCallback(
    (
      rect: { x: number; y: number; width: number; height: number },
      options?: AnimationOptions & { padding?: number },
    ) => {
      const container = containerRef.current
      if (!container) return
      const { minScale, maxScale } = configRef.current
      const padding = options?.padding ?? 0
      const cw = container.offsetWidth - padding * 2
      const ch = container.offsetHeight - padding * 2
      if (cw <= 0 || ch <= 0) return
      const newZoom = clamp(Math.min(cw / rect.width, ch / rect.height), minScale, maxScale)
      const target: ViewState = {
        zoom: newZoom,
        x: container.offsetWidth / 2 - (rect.x + rect.width / 2) * newZoom,
        y: container.offsetHeight / 2 - (rect.y + rect.height / 2) * newZoom,
      }
      if (options?.animate) {
        animateTo(target, options)
      } else {
        cancelAnimation()
        updateView(() => target)
      }
    },
    [containerRef, updateView, animateTo, cancelAnimation],
  )

  const zoomToElement = useCallback(
    (el: HTMLElement, scale?: number, options?: AnimationOptions) => {
      const container = containerRef.current
      if (!container) return
      const cRect = container.getBoundingClientRect()
      const eRect = el.getBoundingClientRect()
      const cur = viewRef.current
      // Convert element screen position to content-space coordinates
      const contentX = (eRect.left - cRect.left - cur.x) / cur.zoom
      const contentY = (eRect.top - cRect.top - cur.y) / cur.zoom
      const contentW = eRect.width / cur.zoom
      const contentH = eRect.height / cur.zoom
      const { minScale, maxScale } = configRef.current
      const targetZoom = clamp(scale ?? cur.zoom, minScale, maxScale)
      const target: ViewState = {
        x: cRect.width / 2 - (contentX + contentW / 2) * targetZoom,
        y: cRect.height / 2 - (contentY + contentH / 2) * targetZoom,
        zoom: targetZoom,
      }
      if (options?.animate) {
        animateTo(target, options)
      } else {
        cancelAnimation()
        updateView(() => target)
      }
    },
    [containerRef, updateView, animateTo, cancelAnimation],
  )

  const rotateTo = useCallback(
    (angle: number, options?: AnimationOptions) => {
      const cur = viewRef.current
      const target: ViewState = { ...cur, rotation: angle }
      if (options?.animate) {
        animateTo(target, options)
      } else {
        cancelAnimation()
        updateView(() => target)
      }
    },
    [updateView, animateTo, cancelAnimation],
  )

  const rotateBy = useCallback(
    (delta: number, options?: AnimationOptions) => {
      const cur = viewRef.current
      const target: ViewState = { ...cur, rotation: (cur.rotation ?? 0) + delta }
      if (options?.animate) {
        animateTo(target, options)
      } else {
        cancelAnimation()
        updateView(() => target)
      }
    },
    [updateView, animateTo, cancelAnimation],
  )

  const screenToContent = useCallback(
    (screenX: number, screenY: number) => {
      const container = containerRef.current
      if (!container) return { x: 0, y: 0 }
      const rect = container.getBoundingClientRect()
      const cur = viewRef.current
      // Translate to content origin
      const tx = screenX - rect.left - cur.x
      const ty = screenY - rect.top - cur.y
      const rotation = cur.rotation ?? 0
      if (rotation === 0) {
        return { x: tx / cur.zoom, y: ty / cur.zoom }
      }
      // Inverse rotation: rotate by -angle, then scale
      const rad = (-rotation * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const rx = tx * cos - ty * sin
      const ry = tx * sin + ty * cos
      return { x: rx / cur.zoom, y: ry / cur.zoom }
    },
    [containerRef],
  )

  const contentToScreen = useCallback(
    (contentX: number, contentY: number) => {
      const container = containerRef.current
      if (!container) return { x: 0, y: 0 }
      const rect = container.getBoundingClientRect()
      const cur = viewRef.current
      const rotation = cur.rotation ?? 0
      // Scale first, then rotate, then translate
      const sx = contentX * cur.zoom
      const sy = contentY * cur.zoom
      if (rotation === 0) {
        return { x: sx + cur.x + rect.left, y: sy + cur.y + rect.top }
      }
      const rad = (rotation * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const rx = sx * cos - sy * sin
      const ry = sx * sin + sy * cos
      return { x: rx + cur.x + rect.left, y: ry + cur.y + rect.top }
    },
    [containerRef],
  )

  const fitToContent = useCallback(
    (options?: AnimationOptions & { padding?: number }) => {
      const container = containerRef.current
      const cr = contentRectRef.current
      if (!container || !cr) return
      fitToRect({ x: 0, y: 0, width: cr.width, height: cr.height }, options)
    },
    [containerRef, fitToRect],
  )

  const snapZoom = useCallback(
    (options?: AnimationOptions) => {
      const levels = zoomSnapLevelsRef.current
      if (!levels || levels.length === 0) return
      const cur = viewRef.current
      let nearest = levels[0]!
      let minDiff = Math.abs(cur.zoom - nearest)
      for (let i = 1; i < levels.length; i++) {
        const diff = Math.abs(cur.zoom - levels[i]!)
        if (diff < minDiff) {
          minDiff = diff
          nearest = levels[i]!
        }
      }
      centerZoom(nearest, options)
    },
    [centerZoom],
  )

  // ── fitToContent on mount + ResizeObserver ──────────────────────

  useEffect(() => {
    const container = containerRef.current
    const cr = contentRectRef.current
    if (!container || !cr) return

    // Fit on mount
    fitToContent()

    // Debounce resize events: a continuous drag of the window emits many
    // ResizeObserver entries; refitting on each one would yank the viewport.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resizeTimer = null
        fitToContent()
      }, 150)
    })
    ro.observe(container)
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      ro.disconnect()
    }
  }, [containerRef, fitToContent])

  return {
    view,
    isAnimating,
    setView,
    centerZoom,
    resetView,
    zoomIn,
    zoomOut,
    zoomToElement,
    panTo,
    panBy,
    zoomTo,
    fitToRect,
    rotateTo,
    rotateBy,
    screenToContent,
    contentToScreen,
    fitToContent,
    snapZoom,
  }
}

// ── Helpers (exported for consumers doing manual coordinate math) ────

/** Clamp `value` to the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

/** Euclidean distance between two points (x1,y1) and (x2,y2). */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2
  const dy = y1 - y2
  return Math.sqrt(dx * dx + dy * dy)
}

/** Angle in degrees of the vector from (x1,y1) to (x2,y2). */
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
}
