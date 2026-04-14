import { useRef } from "react"
import { useZoomPinch } from "use-zoom-pinch"

export default function ImageViewerDemo() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { view, zoomIn, zoomOut, resetView } = useZoomPinch({
    containerRef,
    minScale: 0.5,
    maxScale: 10,
    doubleTap: { mode: "toggle", step: 3 },
    inertia: { friction: 0.95 },
  })

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} className="demo-canvas" style={{ height: 360 }}>
        <div
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <img
            src="/use-zoom-pinch/landscape.svg"
            alt="Landscape"
            draggable={false}
            style={{ display: "block", width: 600, userSelect: "none" }}
          />
        </div>
      </div>

      {/* Overlay controls */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          display: "flex",
          gap: 4,
        }}
      >
        <button onClick={() => zoomIn(1.5, { animate: true })} className="demo-btn">
          +
        </button>
        <button onClick={() => zoomOut(1.5, { animate: true })} className="demo-btn">
          -
        </button>
        <button onClick={() => resetView({ animate: true })} className="demo-btn">
          Fit
        </button>
        <span
          className="demo-info"
          style={{ padding: "4px 8px", display: "flex", alignItems: "center" }}
        >
          {Math.round(view.zoom * 100)}%
        </span>
      </div>
    </div>
  )
}
