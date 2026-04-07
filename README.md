# useZoomPinch

Lightweight React hook for **pan**, **pinch-to-zoom**, and **scroll zoom** with trackpad and touch support. Zero dependencies beyond React.

[**Live Demo**](https://nemezzizz.github.io/use-zoom-pinch/)

## Features

- **Scroll to pan** — mouse wheel and trackpad two-finger scroll
- **Pinch to zoom** — trackpad pinch (via `ctrlKey` + wheel) and multi-touch pinch on mobile
- **Pointer drag** — mouse drag and single-touch drag for panning
- **Controlled & uncontrolled** modes
- **Stable listeners** — config changes don't re-register event listeners
- **TypeScript-first** with full type exports
- **Tree-shakeable** ESM + CJS dual build
- **~2 KB** minified + gzipped

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

  const { view, centerZoom, resetView } = useZoomPinch({
    containerRef,
    viewState,
    onViewStateChange: setViewState,
  })

  return (
    <div>
      <button onClick={() => centerZoom(view.zoom * 1.5)}>Zoom In</button>
      <button onClick={() => centerZoom(view.zoom / 1.5)}>Zoom Out</button>
      <button onClick={resetView}>Reset</button>

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

## API

### `useZoomPinch(options)`

#### Options

| Option              | Type                             | Default                   | Description                         |
| ------------------- | -------------------------------- | ------------------------- | ----------------------------------- |
| `containerRef`      | `RefObject<HTMLElement \| null>` | _required_                | Ref to the container element        |
| `minScale`          | `number`                         | `0.1`                     | Minimum zoom level                  |
| `maxScale`          | `number`                         | `50`                      | Maximum zoom level                  |
| `panSpeed`          | `number`                         | `1`                       | Pan speed multiplier (mouse wheel)  |
| `zoomSpeed`         | `number`                         | `1`                       | Zoom speed multiplier (mouse wheel) |
| `initialViewState`  | `ViewState`                      | `{ x: 0, y: 0, zoom: 1 }` | Initial view for uncontrolled mode  |
| `viewState`         | `ViewState`                      | —                         | Controlled view state               |
| `onViewStateChange` | `(view: ViewState) => void`      | —                         | Callback on view change             |
| `enabled`           | `boolean`                        | `true`                    | Enable/disable gesture handling     |

#### Returns

| Property     | Type                        | Description                          |
| ------------ | --------------------------- | ------------------------------------ |
| `view`       | `ViewState`                 | Current view state                   |
| `setView`    | `(view: ViewState) => void` | Imperatively set the view            |
| `centerZoom` | `(zoom: number) => void`    | Zoom to level, centered in container |
| `resetView`  | `() => void`                | Reset to `{ x: 0, y: 0, zoom: 1 }`   |

### `ViewState`

```ts
interface ViewState {
  x: number // horizontal offset in pixels
  y: number // vertical offset in pixels
  zoom: number // scale factor (1 = 100%)
}
```

## License

MIT
