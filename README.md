# useZoomPinch

Lightweight React hook for **pan**, **pinch-to-zoom**, **rotation**, and **scroll zoom** with trackpad and touch support. Zero dependencies beyond React.

[![npm](https://img.shields.io/npm/v/use-zoom-pinch)](https://www.npmjs.com/package/use-zoom-pinch)
[![CI](https://github.com/NemeZZiZZ/use-zoom-pinch/actions/workflows/ci.yml/badge.svg)](https://github.com/NemeZZiZZ/use-zoom-pinch/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlephobia/minzip/use-zoom-pinch)](https://bundlephobia.com/package/use-zoom-pinch)

[**Live Demo**](https://nemezzizz.github.io/use-zoom-pinch/)

## Features

- **Scroll to pan** — mouse wheel and trackpad two-finger scroll
- **Pinch to zoom** — trackpad pinch (via `ctrlKey` + wheel) and multi-touch pinch on mobile
- **Pointer drag** — mouse drag and single-touch drag for panning
- **Rotation** — two-finger rotation with `rotateTo`/`rotateBy` methods
- **Gesture toggles** — enable/disable pan, zoom, and rotate independently
- **Double-tap zoom** — configurable toggle/zoomIn/reset modes
- **Inertia** — momentum-based pan with configurable friction
- **Animated transitions** — smooth easing for programmatic view changes
- **Bounds** — constrain panning within rectangular limits
- **Keyboard navigation** — arrow keys, +/-, rotation with [ / ]
- **Coordinate conversion** — `screenToContent` / `contentToScreen`
- **Zoom snap levels** — snap to predefined zoom levels on gesture end
- **Snap to grid** — snap positions to a grid (continuous or on end)
- **Auto-fit content** — `fitToContent` with ResizeObserver auto-resize
- **Configurable pan button** — left, middle, or right mouse button
- **Bounce at bounds** — rubber-band overscroll with snap-back animation
- **Axis locking** — restrict pan to horizontal or vertical only
- **Cursor management** — automatic grab/grabbing cursor on drag
- **Wheel mode** — swap default: wheel zooms, ctrl+wheel pans
- **Rotation constraints** — min/max angle and rotation snap levels
- **Activation keys** — require Shift/Alt/Ctrl for specific gestures
- **`onTransformEnd`** — unified callback after any gesture ends
- **Navigation** — `panTo`, `panBy`, `zoomTo`, `fitToRect` for precise viewport control
- **Controlled & uncontrolled** modes
- **Granular events** — `onPanStart/End`, `onZoomStart/End`, `onPinchStart/End`, `onRotateStart/End`
- **Event filtering** — `shouldHandleEvent` to exclude interactive elements
- **Stable listeners** — config changes don't re-register event listeners
- **TypeScript-first** with full type exports
- **Tree-shakeable** ESM + CJS dual build
- **~5.2 KB** minified + gzipped

## Installation

```bash
npm install use-zoom-pinch
```

## Quick Start

```tsx
import { useRef } from "react"
import { useZoomPinch } from "use-zoom-pinch"

function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { view } = useZoomPinch({ containerRef })

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh", overflow: "hidden", touchAction: "none" }}
    >
      <div
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Your zoomable content here */}
      </div>
    </div>
  )
}
```

## Controlled Mode

```tsx
import { useRef, useState } from "react"
import { useZoomPinch, type ViewState } from "use-zoom-pinch"

function ControlledCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 1 })

  const { view, zoomIn, zoomOut, resetView } = useZoomPinch({
    containerRef,
    viewState,
    onViewStateChange: setViewState,
  })

  return (
    <div>
      <button onClick={() => zoomIn(1.5, { animate: true })}>Zoom In</button>
      <button onClick={() => zoomOut(1.5, { animate: true })}>Zoom Out</button>
      <button onClick={() => resetView({ animate: true })}>Reset</button>

      <div
        ref={containerRef}
        style={{ width: "100%", height: "100vh", overflow: "hidden", touchAction: "none" }}
      >
        <div
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Your content */}
        </div>
      </div>
    </div>
  )
}
```

## Animated Transitions

All programmatic methods accept an optional `AnimationOptions` parameter:

```tsx
const {
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
} = useZoomPinch({
  containerRef,
})

// Instant (default, backward-compatible)
setView({ x: 100, y: 200, zoom: 2 })

// Animated
setView({ x: 100, y: 200, zoom: 2 }, { animate: true, duration: 300 })

// With custom easing
import { easeInOut } from "use-zoom-pinch"
resetView({ animate: true, duration: 500, easing: easeInOut })

// Zoom to a specific element
const elRef = useRef<HTMLDivElement>(null)
zoomToElement(elRef.current!, 2, { animate: true })
```

### Built-in Easings

- `linear` — constant speed
- `easeOut` — fast start, slow end (default)
- `easeInOut` — slow start, fast middle, slow end

## Navigation

```tsx
const { panTo, panBy, zoomTo, fitToRect } = useZoomPinch({ containerRef })

// Center on a point in content space
panTo(500, 300, { animate: true })

// Shift viewport by 100px right, 50px down
panBy(100, 50)

// Zoom to 3x centered on a content-space point
zoomTo(3, { x: 500, y: 300 }, { animate: true })

// Fit a region into view with padding
fitToRect({ x: 100, y: 100, width: 400, height: 300 }, { animate: true, padding: 20 })
```

## Rotation

Two-finger rotation is detected during pinch gestures. Disabled by default — enable via `gestures`:

```tsx
const { view, rotateTo, rotateBy } = useZoomPinch({
  containerRef,
  gestures: { rotate: true },
})

// Apply with CSS:
// transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom}) rotate(${view.rotation ?? 0}deg)`

// Programmatic rotation
rotateTo(45, { animate: true })
rotateBy(90, { animate: true })
```

## Gesture Toggles

Enable or disable individual gesture types:

```tsx
// Only zoom, no pan or rotate
useZoomPinch({ containerRef, gestures: { pan: false, zoom: true, rotate: false } })

// Only rotate (e.g. image rotation tool)
useZoomPinch({ containerRef, gestures: { pan: false, zoom: false, rotate: true } })

// All gestures (pan + zoom + rotate)
useZoomPinch({ containerRef, gestures: { rotate: true } })
```

Imperative methods (`setView`, `panTo`, `rotateTo`, etc.) always work regardless of gesture toggles.

## Double-Tap Zoom

Double-tap (or double-click) zooms to the tap point. Enabled by default in `toggle` mode.

```tsx
// Default: toggle between 1x and 2x zoom
useZoomPinch({ containerRef })

// Customize behavior
useZoomPinch({
  containerRef,
  doubleTap: { mode: "zoomIn", step: 3 }, // always zoom in by 3x
})

// Disable double-tap
useZoomPinch({ containerRef, doubleTap: false })
```

### Modes

- `"toggle"` (default) — zoom in if at 1x, reset if zoomed in
- `"zoomIn"` — always zoom in by `step`
- `"reset"` — always reset to `{ x: 0, y: 0, zoom: 1 }`

## Inertia

Pan with momentum after releasing the pointer. Enabled by default.

```tsx
// Default: friction 0.92
useZoomPinch({ containerRef })

// Custom friction (lower = more friction, faster stop)
useZoomPinch({ containerRef, inertia: { friction: 0.85 } })

// Disable inertia
useZoomPinch({ containerRef, inertia: false })
```

## Event Filtering

Exclude interactive elements (buttons, inputs) from gesture handling:

```tsx
useZoomPinch({
  containerRef,
  shouldHandleEvent: (e) => !(e.target as HTMLElement).closest(".no-pan"),
})
```

## Granular Events

```tsx
useZoomPinch({
  containerRef,
  onPanStart: (view) => console.log("Pan started", view),
  onPanEnd: (view) => console.log("Pan ended", view),
  onZoomStart: (view) => console.log("Zoom started", view),
  onZoomEnd: (view) => console.log("Zoom ended", view),
  onPinchStart: (view) => console.log("Pinch started", view),
  onPinchEnd: (view) => console.log("Pinch ended", view),
  onRotateStart: (view) => console.log("Rotate started", view),
  onRotateEnd: (view) => console.log("Rotate ended", view),
})
```

## Bounds

Constrain panning within rectangular limits:

```tsx
useZoomPinch({
  containerRef,
  bounds: { minX: -500, maxX: 500, minY: -300, maxY: 300 },
})
```

## Keyboard Navigation

Enable keyboard controls with arrow keys, zoom (+/-), reset (0), and rotation ([ / ]):

```tsx
// Enable with defaults (panStep: 50, zoomStep: 1.5, rotateStep: 15)
useZoomPinch({ containerRef, keyboard: true })

// Custom steps
useZoomPinch({
  containerRef,
  keyboard: { enabled: true, panStep: 100, zoomStep: 2 },
})
```

## Coordinate Conversion

Convert between screen and content coordinates:

```tsx
const { screenToContent, contentToScreen } = useZoomPinch({ containerRef })

// Map a click to content space
const handleClick = (e: MouseEvent) => {
  const pos = screenToContent(e.clientX, e.clientY)
  console.log("Clicked at content position:", pos)
}

// Position a tooltip over content
const screenPos = contentToScreen(itemX, itemY)
```

## Zoom Snap Levels

Snap zoom to predefined levels on gesture end:

```tsx
useZoomPinch({
  containerRef,
  zoomSnapLevels: [0.5, 1, 2, 4],
})
```

## Snap to Grid

Snap pan position to a grid:

```tsx
// Snap on gesture end (with animation)
useZoomPinch({ containerRef, snapToGrid: { size: 50 } })

// Snap continuously during gestures
useZoomPinch({ containerRef, snapToGrid: { size: 50, mode: "always" } })
```

## Fit to Content

Auto-fit content to container on mount and resize:

```tsx
const { fitToContent } = useZoomPinch({
  containerRef,
  contentRect: { width: 1920, height: 1080 }, // auto-fits on mount + resize
})

// Manual fit with padding
fitToContent({ animate: true, padding: 20 })
```

## Pan Button

Configure which mouse button triggers panning:

```tsx
// Use middle mouse button for pan (frees left click for selection)
useZoomPinch({ containerRef, panButton: 1 })
```

## API

### `useZoomPinch(options)`

#### Options

| Option              | Type                             | Default                                    | Description                                      |
| ------------------- | -------------------------------- | ------------------------------------------ | ------------------------------------------------ |
| `containerRef`      | `RefObject<HTMLElement \| null>` | _required_                                 | Ref to the container element                     |
| `minScale`          | `number`                         | `0.1`                                      | Minimum zoom level                               |
| `maxScale`          | `number`                         | `50`                                       | Maximum zoom level                               |
| `panSpeed`          | `number`                         | `1`                                        | Pan speed multiplier (mouse wheel)               |
| `zoomSpeed`         | `number`                         | `1`                                        | Zoom speed multiplier (mouse wheel)              |
| `initialViewState`  | `ViewState`                      | `{ x: 0, y: 0, zoom: 1 }`                  | Initial view for uncontrolled mode               |
| `viewState`         | `ViewState`                      | —                                          | Controlled view state                            |
| `onViewStateChange` | `(view: ViewState) => void`      | —                                          | Callback on view change                          |
| `enabled`           | `boolean`                        | `true`                                     | Enable/disable gesture handling                  |
| `gestures`          | `GesturesOptions`                | `{ pan: true, zoom: true, rotate: false }` | Toggle individual gesture types                  |
| `panButton`         | `0 \| 1 \| 2`                    | `0`                                        | Mouse button for pan (0=left, 1=middle, 2=right) |
| `bounds`            | `BoundsOptions`                  | —                                          | Constrain panning within bounds                  |
| `keyboard`          | `KeyboardOptions \| boolean`     | `false`                                    | Keyboard navigation (pass `true` for defaults)   |
| `zoomSnapLevels`    | `number[]`                       | —                                          | Snap zoom to nearest level on gesture end        |
| `snapToGrid`        | `SnapToGridOptions \| false`     | `false`                                    | Snap position to grid                            |
| `contentRect`       | `{ width; height }`              | —                                          | Content size for `fitToContent` + auto-fit       |
| `rotation`          | `RotationOptions`                | —                                          | Min/max angle and rotation snap levels           |
| `wheelMode`         | `"pan" \| "zoom"`                | `"pan"`                                    | Default wheel behavior                           |
| `cursor`            | `CursorOptions \| false`         | enabled                                    | Auto cursor (grab/grabbing). `false` to disable  |
| `axis`              | `"x" \| "y"`                     | —                                          | Restrict gestures to a single axis               |
| `activationKeys`    | `ActivationKeyOptions`           | —                                          | Require key held for specific gestures           |
| `shouldHandleEvent` | `(event) => boolean`             | —                                          | Filter which events are handled                  |
| `doubleTap`         | `DoubleTapOptions \| false`      | `{ mode: "toggle", step: 2 }`              | Double-tap zoom config, or `false` to disable    |
| `inertia`           | `InertiaOptions \| false`        | `{ friction: 0.92 }`                       | Pan inertia config, or `false` to disable        |
| `onPanStart`        | `(view: ViewState) => void`      | —                                          | Fired when drag starts                           |
| `onPanEnd`          | `(view: ViewState) => void`      | —                                          | Fired when drag ends                             |
| `onZoomStart`       | `(view: ViewState) => void`      | —                                          | Fired when wheel zoom starts                     |
| `onZoomEnd`         | `(view: ViewState) => void`      | —                                          | Fired when wheel zoom ends (150ms debounce)      |
| `onPinchStart`      | `(view: ViewState) => void`      | —                                          | Fired when pinch starts                          |
| `onPinchEnd`        | `(view: ViewState) => void`      | —                                          | Fired when pinch ends                            |
| `onRotateStart`     | `(view: ViewState) => void`      | —                                          | Fired when rotation starts                       |
| `onRotateEnd`       | `(view: ViewState) => void`      | —                                          | Fired when rotation ends                         |
| `onTransformEnd`    | `(view: ViewState) => void`      | —                                          | Fired after any gesture ends                     |

#### Returns

| Property          | Type                               | Description                                    |
| ----------------- | ---------------------------------- | ---------------------------------------------- |
| `view`            | `ViewState`                        | Current view state                             |
| `isAnimating`     | `boolean`                          | Whether an animation is running                |
| `setView`         | `(view, options?) => void`         | Imperatively set the view                      |
| `centerZoom`      | `(zoom, options?) => void`         | Zoom to level, centered in container           |
| `resetView`       | `(options?) => void`               | Reset to `{ x: 0, y: 0, zoom: 1 }`             |
| `zoomIn`          | `(step?, options?) => void`        | Zoom in by step (default 1.5x)                 |
| `zoomOut`         | `(step?, options?) => void`        | Zoom out by step (default 1.5x)                |
| `zoomToElement`   | `(el, scale?, options?) => void`   | Zoom and center on an element                  |
| `panTo`           | `(x, y, options?) => void`         | Center viewport on content-space point         |
| `panBy`           | `(dx, dy, options?) => void`       | Shift viewport by relative offset              |
| `zoomTo`          | `(zoom, point?, options?) => void` | Zoom to level, optionally anchored             |
| `fitToRect`       | `(rect, options?) => void`         | Fit a content-space rectangle into view        |
| `rotateTo`        | `(angle, options?) => void`        | Set rotation to absolute angle (degrees)       |
| `rotateBy`        | `(delta, options?) => void`        | Rotate by relative delta (degrees)             |
| `screenToContent` | `(screenX, screenY) => { x, y }`   | Convert screen to content coordinates          |
| `contentToScreen` | `(contentX, contentY) => { x, y }` | Convert content to screen coordinates          |
| `fitToContent`    | `(options?) => void`               | Fit content to container (needs `contentRect`) |
| `snapZoom`        | `(options?) => void`               | Snap zoom to nearest `zoomSnapLevels`          |

### Types

```ts
interface ViewState {
  x: number // horizontal offset in pixels
  y: number // vertical offset in pixels
  zoom: number // scale factor (1 = 100%)
  rotation?: number // angle in degrees (default 0)
}

interface GesturesOptions {
  pan?: boolean // default true
  zoom?: boolean // default true
  rotate?: boolean // default false
}

interface AnimationOptions {
  animate?: boolean // default false
  duration?: number // default 300ms
  easing?: EasingFunction // default easeOut
}

type EasingFunction = (t: number) => number

interface DoubleTapOptions {
  enabled?: boolean // default true
  mode?: "zoomIn" | "reset" | "toggle" // default "toggle"
  step?: number // default 2
}

interface InertiaOptions {
  enabled?: boolean // default true
  friction?: number // 0–1, default 0.92
}

interface BoundsOptions {
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
  mode?: "clamp" | "bounce" // default "clamp"
}

interface KeyboardOptions {
  enabled?: boolean // default false
  panStep?: number // default 50
  zoomStep?: number // default 1.5
  rotateStep?: number // default 15
}

interface SnapToGridOptions {
  size: number
  mode?: "end" | "always" // default "end"
}

type ZoomSnapLevel = number

interface RotationOptions {
  minAngle?: number
  maxAngle?: number
  snapLevels?: number[] // e.g. [0, 90, 180, 270]
}

interface CursorOptions {
  enabled?: boolean // default true
  idle?: string // default "grab"
  dragging?: string // default "grabbing"
  zooming?: string // default "zoom-in"
}

interface ActivationKeyOptions {
  pan?: string // e.g. "Shift"
  zoom?: string // e.g. "Alt"
  rotate?: string // e.g. "Control"
}
```

## Container Setup

The container element **must** have `touchAction: "none"` to prevent the browser from intercepting touch gestures (scroll, pinch-zoom) before the hook can handle them:

```tsx
<div ref={containerRef} style={{ touchAction: "none", overflow: "hidden" }}>
```

Without `touchAction: "none"`, pinch-to-zoom and touch drag will trigger native browser behavior instead of your custom handling. The `overflow: "hidden"` prevents content from leaking outside the viewport.

## Browser Compatibility

The hook uses standard Web APIs available in all modern browsers:

| Feature               | Chrome | Firefox | Safari | Edge | iOS Safari | Android Chrome |
| --------------------- | ------ | ------- | ------ | ---- | ---------- | -------------- |
| Pointer Events        | 55+    | 59+     | 13+    | 12+  | 13+        | 55+            |
| Wheel Events          | 31+    | 17+     | 7+     | 12+  | 7+         | 31+            |
| Touch Events          | 22+    | 52+     | 10+    | 12+  | 10+        | 22+            |
| ResizeObserver        | 64+    | 69+     | 13.1+  | 79+  | 13.4+      | 64+            |
| requestAnimationFrame | 10+    | 23+     | 6+     | 12+  | 6+         | 10+            |

**Minimum:** Chrome/Edge 64+, Firefox 69+, Safari 13.1+, iOS 13.4+.

> Safari Gesture Events (`GestureEvent`) are used when available for native trackpad pinch-zoom on macOS.

## Comparison

| Feature               | useZoomPinch | react-zoom-pan-pinch | @use-gesture/react | motion/react        |
| --------------------- | ------------ | -------------------- | ------------------ | ------------------- |
| Size (min+gzip)       | **~5.2 KB**  | ~13.2 KB             | ~8.9 KB            | ~41.6 KB            |
| Approach              | Hook         | Components + hook    | Gesture primitives | Animation + gesture |
| Controlled mode       | ✅ Native    | ❌                   | ❌                 | ❌                  |
| DOM wrappers          | ✅ None      | +2 divs              | ✅ None            | +1 div              |
| Bounds / constraints  | ✅           | ✅                   | 🔧 Manual          | 🔧 dragConstraints  |
| Keyboard navigation   | ✅           | ❌                   | ❌                 | ❌                  |
| Coordinate conversion | ✅           | ❌                   | ❌                 | ❌                  |
| Snap to grid          | ✅           | ❌                   | ❌                 | ❌                  |
| Zoom snap levels      | ✅           | ❌                   | ❌                 | ❌                  |
| Rotation gestures     | ✅           | ❌                   | 🔧 Manual          | ❌                  |
| Ready-to-use zoom/pan | ✅           | ✅                   | 🔧 Manual          | 🔧 Manual           |

## License

MIT
