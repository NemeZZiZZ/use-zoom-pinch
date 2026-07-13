import { type RefObject } from "react"

export interface ViewState {
  x: number
  y: number
  zoom: number
  /** Rotation angle in degrees. @default 0 */
  rotation?: number
}

export type EasingFunction = (t: number) => number

export interface AnimationOptions {
  /** Enable animated transition. @default false */
  animate?: boolean
  /** Animation duration in milliseconds. @default 300 */
  duration?: number
  /** Easing function. @default easeOut */
  easing?: EasingFunction
  /**
   * Skip bounds clamping, axis locking, and snap-to-grid when set via `setView`.
   * Useful when you need to position the viewport precisely, even outside bounds.
   * Only affects `setView`; gestures are always constrained.
   * @default false
   */
  skipConstraints?: boolean
}

export interface DoubleTapOptions {
  /** Enable double-tap gesture. @default true */
  enabled?: boolean
  /** Behavior on double-tap. @default 'toggle' */
  mode?: "zoomIn" | "reset" | "toggle"
  /** Zoom step for 'zoomIn' / 'toggle' modes. @default 2 */
  step?: number
}

export interface InertiaOptions {
  /** Enable inertia after pan release. @default true */
  enabled?: boolean
  /** Friction factor per frame (0–1). Lower = more friction. @default 0.92 */
  friction?: number
}

export interface GesturesOptions {
  /** Enable panning gestures (drag, scroll). @default true */
  pan?: boolean
  /** Enable zoom gestures (wheel zoom, pinch zoom, double-tap zoom). @default true */
  zoom?: boolean
  /** Enable rotation gestures (two-finger rotation). @default false */
  rotate?: boolean
}

export interface BoundsOptions {
  /** Minimum x offset (pixels). Content can't go further left. */
  minX?: number
  /** Maximum x offset (pixels). Content can't go further right. */
  maxX?: number
  /** Minimum y offset (pixels). Content can't go further up. */
  minY?: number
  /** Maximum y offset (pixels). Content can't go further down. */
  maxY?: number
  /** Behavior when view hits bounds during gestures. @default "clamp" */
  mode?: "clamp" | "bounce"
  /** Rubber-band factor for bounce mode (0–1). Lower = stiffer. @default 0.3 */
  bounceFactor?: number
}

export interface RotationOptions {
  /** Minimum rotation angle in degrees. */
  minAngle?: number
  /** Maximum rotation angle in degrees. */
  maxAngle?: number
  /** Snap levels in degrees. Rotation snaps to nearest on gesture end. */
  snapLevels?: number[]
}

export interface CursorOptions {
  /** Enable automatic cursor management. @default true */
  enabled?: boolean
  /** Cursor when idle (hovering over container). @default "grab" */
  idle?: string
  /** Cursor while dragging. @default "grabbing" */
  dragging?: string
  /** Cursor while zooming. @default "zoom-in" */
  zooming?: string
}

export interface ActivationKeyOptions {
  /** Key that must be held to pan (e.g. "Shift"). When set, pan only works while key is pressed. */
  pan?: string
  /** Key that must be held to zoom (e.g. "Alt"). When set, wheel zoom only works while key is pressed. */
  zoom?: string
  /** Key that must be held to rotate (e.g. "Control"). */
  rotate?: string
}

export interface KeyboardOptions {
  /** Enable keyboard navigation. @default false */
  enabled?: boolean
  /** Pan step in pixels per key press. @default 50 */
  panStep?: number
  /** Zoom step multiplier per key press. @default 1.5 */
  zoomStep?: number
  /** Rotation step in degrees per key press. @default 15 */
  rotateStep?: number
}

export interface SnapToGridOptions {
  /** Grid cell size in content-space pixels. */
  size: number
  /** When to snap: on gesture end, or continuously. @default "end" */
  mode?: "end" | "always"
}

export type ZoomSnapLevel = number

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
  /** Toggle individual gesture types. @default \{ pan: true, zoom: true, rotate: false \} */
  gestures?: GesturesOptions
  /** Constrain panning within bounds. */
  bounds?: BoundsOptions
  /** Mouse button for pan drag. 0 = left, 1 = middle, 2 = right. @default 0 */
  panButton?: 0 | 1 | 2
  /** Keyboard navigation config. Pass true for defaults. @default false */
  keyboard?: KeyboardOptions | boolean
  /** Zoom snap levels. Zoom snaps to nearest level on gesture end. */
  zoomSnapLevels?: ZoomSnapLevel[]
  /** Snap view position to a grid on gesture end. */
  snapToGrid?: SnapToGridOptions | false
  /** Content rect for fitToContent. \{ width, height \} in content-space pixels. */
  contentRect?: { width: number; height: number }
  /** Rotation constraints and snap levels. */
  rotation?: RotationOptions
  /** Default wheel behavior. @default "pan" */
  wheelMode?: "pan" | "zoom"
  /** Automatic cursor management. Pass false to disable. @default \{ enabled: true \} */
  cursor?: CursorOptions | false
  /** Restrict pan axis. When set, only the specified axis is affected by gestures. */
  axis?: "x" | "y"
  /** Activation keys — require a key to be held for specific gesture types. */
  activationKeys?: ActivationKeyOptions
  /** Filter which events are handled. Return false to ignore an event. */
  shouldHandleEvent?: (event: PointerEvent | WheelEvent | TouchEvent) => boolean
  /** Double-tap / double-click zoom configuration. Pass false to disable. */
  doubleTap?: DoubleTapOptions | false
  /** Inertia (momentum) after pan release. Pass false to disable. */
  inertia?: InertiaOptions | false
  /** Fired when pointer drag starts. */
  onPanStart?: (view: ViewState) => void
  /** Fired when pointer drag ends. */
  onPanEnd?: (view: ViewState) => void
  /** Fired when wheel zoom starts. */
  onZoomStart?: (view: ViewState) => void
  /** Fired when wheel zoom ends (debounced 150ms). */
  onZoomEnd?: (view: ViewState) => void
  /** Fired when multi-touch pinch starts. */
  onPinchStart?: (view: ViewState) => void
  /** Fired when multi-touch pinch ends. */
  onPinchEnd?: (view: ViewState) => void
  /** Fired when rotation gesture starts. */
  onRotateStart?: (view: ViewState) => void
  /** Fired when rotation gesture ends. */
  onRotateEnd?: (view: ViewState) => void
  /** Fired after any gesture ends (pan, zoom, pinch, rotate). Unified end callback. */
  onTransformEnd?: (view: ViewState) => void
}

export interface UseZoomPinchReturn {
  /** Current view state (position + zoom + rotation). */
  view: ViewState
  /** Whether an animation is currently running. */
  isAnimating: boolean
  /** Imperatively set the view state. */
  setView: (view: ViewState, options?: AnimationOptions) => void
  /** Zoom to a target level, keeping the container center as anchor. */
  centerZoom: (targetZoom: number, options?: AnimationOptions) => void
  /** Reset view to \{ x: 0, y: 0, zoom: 1 \}. */
  resetView: (options?: AnimationOptions) => void
  /** Zoom in by a multiplicative step (default 1.5). */
  zoomIn: (step?: number, options?: AnimationOptions) => void
  /** Zoom out by a multiplicative step (default 1.5). */
  zoomOut: (step?: number, options?: AnimationOptions) => void
  /** Zoom and pan to center a specific element in the viewport. */
  zoomToElement: (el: HTMLElement, scale?: number, options?: AnimationOptions) => void
  /** Pan to a content-space coordinate, keeping current zoom. */
  panTo: (x: number, y: number, options?: AnimationOptions) => void
  /** Pan by a relative delta in screen-space pixels (applied directly to x/y). */
  panBy: (dx: number, dy: number, options?: AnimationOptions) => void
  /** Zoom to a specific level, optionally centered on a content-space point. */
  zoomTo: (zoom: number, point?: { x: number; y: number }, options?: AnimationOptions) => void
  /** Fit a content-space rectangle into the viewport. */
  fitToRect: (
    rect: { x: number; y: number; width: number; height: number },
    options?: AnimationOptions & { padding?: number },
  ) => void
  /** Set rotation to an absolute angle in degrees. */
  rotateTo: (angle: number, options?: AnimationOptions) => void
  /** Rotate by a relative delta in degrees. */
  rotateBy: (delta: number, options?: AnimationOptions) => void
  /** Convert screen-space coordinates to content-space. */
  screenToContent: (screenX: number, screenY: number) => { x: number; y: number }
  /** Convert content-space coordinates to screen-space. */
  contentToScreen: (contentX: number, contentY: number) => { x: number; y: number }
  /** Fit content to container. Requires `contentRect` option. */
  fitToContent: (options?: AnimationOptions & { padding?: number }) => void
  /** Snap zoom to nearest level from `zoomSnapLevels`. */
  snapZoom: (options?: AnimationOptions) => void
}
