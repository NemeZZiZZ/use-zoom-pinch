import { useRef, useState } from "react"
import { useZoomPinch, type ViewState } from "use-zoom-pinch"

const GRID_SIZE = 40
const GRID_EXTENT = 2000

const SHAPES = [
  { x: 100, y: 100, w: 200, h: 150, color: "#6366f1", label: "Shape A" },
  { x: 350, y: 80, w: 180, h: 120, color: "#ec4899", label: "Shape B" },
  { x: 160, y: 300, w: 220, h: 100, color: "#14b8a6", label: "Shape C" },
]

export default function InfiniteCanvasDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 1 })

  const { view, zoomIn, zoomOut, resetView } = useZoomPinch({
    containerRef,
    viewState,
    onViewStateChange: setViewState,
    minScale: 0.1,
    maxScale: 10,
  })

  return (
    <div>
      <div className="demo-toolbar">
        <button onClick={() => zoomIn(1.5, { animate: true })} className="demo-btn">
          +
        </button>
        <button onClick={() => zoomOut(1.5, { animate: true })} className="demo-btn">
          -
        </button>
        <button onClick={() => resetView({ animate: true })} className="demo-btn">
          Reset
        </button>
        <span className="demo-info">{Math.round(view.zoom * 100)}%</span>
      </div>
      <div ref={containerRef} className="demo-canvas" style={{ height: 360 }}>
        <div
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {/* CSS dot grid */}
          <div
            style={{
              position: "absolute",
              inset: -GRID_EXTENT,
              backgroundImage:
                "radial-gradient(circle, var(--demo-grid-axis) 1px, transparent 1px)",
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              pointerEvents: "none",
            }}
          />

          {/* Shapes */}
          {SHAPES.map((s, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: s.x,
                top: s.y,
                width: s.w,
                height: s.h,
                background: s.color,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 14,
                userSelect: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
